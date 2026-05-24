import Phaser from "phaser";
import { SideScrollerConfig } from "../modes/office-sidescroller/config";

export type PlayerKeys = {
  A: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  SPACE: Phaser.Input.Keyboard.Key;
  SHIFT: Phaser.Input.Keyboard.Key;
  E: Phaser.Input.Keyboard.Key;
};

// Display dimensions are fixed regardless of source texture size. Real
// AI sprites (~400x650) and procedural fallbacks (32x56) both get
// scaled to the same on-screen size so things stay consistent as art
// lands one sprite at a time.
const STAND_W = 76;
const STAND_H = 156;
const SLIDE_W = 156;
const SLIDE_H = 76;

// Body collider in *display* pixels — converted to source pixels per-texture
// when applied to the physics body (since body.setSize/Offset live in
// source-pixel space and scale with sprite.scale).
const STAND_BODY_W = 36;
const STAND_BODY_H = 144;
const SLIDE_BODY_W = 130;
const SLIDE_BODY_H = 54;

// Shoulder anchor in display pixels above the feet (= sprite.y, since
// origin is (0.5, 1.0)). Tuned for the AI sprite where the shoulder line
// sits roughly at 22% from the top of the image.
const SHOULDER_OFFSET_Y = -120;
const ARM_DISPLAY_W = 72;
const ARM_DISPLAY_H = 18;

export class SideScrollerPlayer extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  invulnUntil = 0;
  isSliding = false;
  slideEndsAt = 0;
  slideDirection = 1;
  lastGroundedAt = 0;
  facingRight = true;
  aimAngle = 0;
  shoulderX = 0;
  shoulderY = 0;

  private arm: Phaser.GameObjects.Sprite;
  private muzzle: Phaser.GameObjects.Sprite;
  private muzzleHideAt = 0;
  private walkPhase = 0;
  // Cache whether the real (non-procedural) animation frames are loaded.
  // If absent, we just hold on player_idle for any grounded state.
  private hasRealWalkFrames = false;
  private hasRealJumpFrame = false;
  // Avoid re-applying body size + offset every frame — that causes a tiny
  // vertical drift when called on each tick, which read as "floating while
  // walking" in v0.6.
  private currentPoseKey = "";

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player_idle");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1.0);
    this.setDepth(10);

    this.hasRealWalkFrames = this.isRealArt("player_walk_0");
    this.hasRealJumpFrame = this.isRealArt("player_jump");

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(SideScrollerConfig.player.gravity);
    body.setMaxVelocity(800, 1400);
    body.setCollideWorldBounds(true);

    this.applyPose("player_idle", STAND_W, STAND_H, STAND_BODY_W, STAND_BODY_H);

    this.hp = SideScrollerConfig.player.maxHP;

    this.arm = scene.add.sprite(x, y, "player_arm");
    this.arm.setOrigin(0, 0.5);
    this.arm.setDisplaySize(ARM_DISPLAY_W, ARM_DISPLAY_H);
    this.arm.setDepth(11);

    this.muzzle = scene.add.sprite(0, 0, "muzzle");
    this.muzzle.setOrigin(0, 0.5);
    this.muzzle.setDisplaySize(28, 20);
    this.muzzle.setDepth(12);
    this.muzzle.setVisible(false);
  }

  private isRealArt(key: string): boolean {
    if (!this.scene.textures.exists(key)) return false;
    return this.scene.textures.get(key).source[0].width > 96;
  }

  private applyPose(
    key: string,
    displayW: number,
    displayH: number,
    bodyDisplayW: number,
    bodyDisplayH: number,
    feetInset = 4
  ): void {
    if (this.currentPoseKey === key) return; // no-op for unchanged pose
    this.currentPoseKey = key;
    this.setTexture(key);
    this.setDisplaySize(displayW, displayH);
    const src = this.texture.source[0];
    const sx = displayW / src.width;
    const sy = displayH / src.height;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(bodyDisplayW / sx, bodyDisplayH / sy);
    // Body bottom = sprite_bottom - feetInset (display px) so that the
    // collider lines up with the character's *actual* feet, not the
    // sprite's transparent bottom edge. Origin (0.5, 1.0) puts sprite
    // bottom at player.y, so body bottom = player.y - feetInset.
    const offsetX = ((displayW - bodyDisplayW) / 2) / sx;
    const offsetY = (displayH - bodyDisplayH - feetInset) / sy;
    body.setOffset(offsetX, offsetY);
  }

  isGrounded(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;
    return body.blocked.down || body.touching.down;
  }

  takeDamage(now: number): boolean {
    if (now < this.invulnUntil) return false;
    this.invulnUntil = now + SideScrollerConfig.player.invulnMs;
    this.hp -= 1;
    this.scene.cameras.main.shake(150, 0.012);
    this.setTint(0xff5252);
    this.scene.time.delayedCall(120, () => this.clearTint());
    return true;
  }

  updateInput(
    time: number,
    delta: number,
    keys: PlayerKeys,
    pointer: Phaser.Input.Pointer,
    inputBlocked: boolean
  ): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const grounded = this.isGrounded();
    if (grounded) this.lastGroundedAt = time;

    if (this.isSliding && time >= this.slideEndsAt) {
      this.endSlide();
    }

    this.aimAngle = Math.atan2(pointer.worldY - this.y + 60, pointer.worldX - this.x);
    this.facingRight = Math.abs(this.aimAngle) <= Math.PI / 2;

    if (!inputBlocked) {
      if (this.isSliding) {
        body.setVelocityX(this.slideDirection * SideScrollerConfig.player.slideVelocity);
      } else {
        let vx = 0;
        if (keys.A.isDown) vx -= 1;
        if (keys.D.isDown) vx += 1;
        body.setVelocityX(vx * SideScrollerConfig.player.runSpeed);
        if (vx !== 0) this.walkPhase += delta * 0.012;
      }

      const canJump =
        !this.isSliding &&
        time - this.lastGroundedAt <= SideScrollerConfig.player.coyoteMs;
      if (Phaser.Input.Keyboard.JustDown(keys.SPACE) && canJump) {
        body.setVelocityY(-SideScrollerConfig.player.jumpVelocity);
        this.lastGroundedAt = -Infinity;
      }

      if (
        Phaser.Input.Keyboard.JustDown(keys.SHIFT) &&
        grounded &&
        !this.isSliding
      ) {
        this.startSlide();
      }
    }

    this.updateAnimation(grounded);
    this.updateArmAndMuzzle(time);
  }

  private startSlide(): void {
    this.isSliding = true;
    this.slideEndsAt = this.scene.time.now + SideScrollerConfig.player.slideMs;
    this.slideDirection = this.facingRight ? 1 : -1;
    this.applyPose("player_slide", SLIDE_W, SLIDE_H, SLIDE_BODY_W, SLIDE_BODY_H);
  }

  private endSlide(): void {
    this.isSliding = false;
    this.applyPose("player_idle", STAND_W, STAND_H, STAND_BODY_W, STAND_BODY_H);
  }

  private updateAnimation(grounded: boolean): void {
    if (this.isSliding) {
      this.setFlipX(!this.facingRight);
      return;
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    let key = "player_idle";
    if (!grounded && this.hasRealJumpFrame) {
      key = body.velocity.y < 0 ? "player_jump" : "player_fall";
      if (!this.scene.textures.exists(key)) key = "player_idle";
    } else if (grounded && Math.abs(body.velocity.x) > 10 && this.hasRealWalkFrames) {
      const f = Math.floor(this.walkPhase) % 2;
      key = f === 0 ? "player_walk_0" : "player_walk_1";
    }
    this.applyPose(key, STAND_W, STAND_H, STAND_BODY_W, STAND_BODY_H);
    this.setFlipX(!this.facingRight);
  }

  private updateArmAndMuzzle(time: number): void {
    if (this.isSliding) {
      this.arm.setVisible(false);
      this.muzzle.setVisible(false);
      return;
    }
    this.arm.setVisible(true);
    // Shoulder x shifts with facing so the gun-arm anchors on the side the
    // character is looking, not the center of the body
    const shoulderHorizontalOffset = this.facingRight ? 4 : -4;
    this.shoulderX = this.x + shoulderHorizontalOffset;
    this.shoulderY = this.y + SHOULDER_OFFSET_Y;
    this.arm.setPosition(this.shoulderX, this.shoulderY);
    this.arm.setRotation(this.aimAngle);
    this.arm.setFlipY(!this.facingRight);

    if (time < this.muzzleHideAt) {
      const armLen = ARM_DISPLAY_W;
      const mx = this.shoulderX + Math.cos(this.aimAngle) * armLen;
      const my = this.shoulderY + Math.sin(this.aimAngle) * armLen;
      this.muzzle.setPosition(mx, my);
      this.muzzle.setRotation(this.aimAngle);
      this.muzzle.setVisible(true);
    } else {
      this.muzzle.setVisible(false);
    }
  }

  flashMuzzle(now: number): void {
    this.muzzleHideAt = now + 60;
  }

  override destroy(fromScene?: boolean): void {
    this.arm.destroy();
    this.muzzle.destroy();
    super.destroy(fromScene);
  }
}
