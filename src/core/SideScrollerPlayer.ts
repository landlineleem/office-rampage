import Phaser from "phaser";
import { SideScrollerConfig } from "../modes/office-sidescroller/config";

export type PlayerKeys = {
  A: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  SPACE: Phaser.Input.Keyboard.Key;
  SHIFT: Phaser.Input.Keyboard.Key;
  E: Phaser.Input.Keyboard.Key;
};

// On-screen height is fixed; width adapts to each frame's source aspect
// so a walking pose (legs spread, wide silhouette) doesn't get
// horizontally squished to match an idle pose (narrow silhouette).
const STAND_H = 156;
const SLIDE_H = 76;
// Body collider in DISPLAY pixels — converted to source-pixel offsets
// per-texture so it stays the same physical size regardless of which
// sprite is currently loaded.
const STAND_BODY_W = 36;
const STAND_BODY_H = 150;
const SLIDE_BODY_W = 120;
const SLIDE_BODY_H = 54;

// Shoulder anchor in display pixels above the feet (= sprite.y, origin
// is (0.5, 1.0)). Tuned for the AI character's shoulder line.
const SHOULDER_OFFSET_Y = -118;
const ARM_DISPLAY_W = 72;
const ARM_DISPLAY_H = 18;

// How long after firing the gun-arm overlay stays visible. Hidden
// otherwise so the AI character's own arms read as the character's arms
// and we don't get the "three arms" effect during normal movement.
const ARM_LINGER_MS = 350;

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
  private armActiveUntil = 0;
  private walkPhase = 0;
  private hasRealWalkFrames = false;
  private hasRealJumpFrame = false;
  private currentPoseKey = "";

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player_idle");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1.0);
    this.setDepth(10);

    this.hasRealWalkFrames =
      this.isRealArt("player_walk_0") && this.isRealArt("player_walk_1");
    this.hasRealJumpFrame = this.isRealArt("player_jump");

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(SideScrollerConfig.player.gravity);
    body.setMaxVelocity(800, 1400);
    body.setCollideWorldBounds(true);

    this.applyPose("player_idle", "stand");

    this.hp = SideScrollerConfig.player.maxHP;

    this.arm = scene.add.sprite(x, y, "player_arm");
    this.arm.setOrigin(0, 0.5);
    this.arm.setDisplaySize(ARM_DISPLAY_W, ARM_DISPLAY_H);
    this.arm.setDepth(11);
    this.arm.setVisible(false);

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

  private applyPose(key: string, category: "stand" | "slide"): void {
    if (this.currentPoseKey === key) return;
    this.currentPoseKey = key;
    this.setTexture(key);

    const src = this.texture.source[0];
    const aspect = src.width / src.height;
    const displayH = category === "stand" ? STAND_H : SLIDE_H;
    const displayW = displayH * aspect;
    this.setDisplaySize(displayW, displayH);

    const sx = displayW / src.width;
    const sy = displayH / src.height;
    const bodyW = category === "stand" ? STAND_BODY_W : SLIDE_BODY_W;
    const bodyH = category === "stand" ? STAND_BODY_H : SLIDE_BODY_H;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(bodyW / sx, bodyH / sy);
    body.setOffset(((displayW - bodyW) / 2) / sx, (displayH - bodyH) / sy);
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

    // Aim *from* the shoulder, not from the feet — so the cursor lines
    // up with what the bullet actually hits.
    const shoulderWorldY = this.y + SHOULDER_OFFSET_Y;
    this.aimAngle = Math.atan2(pointer.worldY - shoulderWorldY, pointer.worldX - this.x);
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

      // Slide on SHIFT temporarily disabled so Win+Shift+S (screen clip)
      // works in the browser without triggering an in-game slide.
      // if (
      //   Phaser.Input.Keyboard.JustDown(keys.SHIFT) &&
      //   grounded &&
      //   !this.isSliding
      // ) {
      //   this.startSlide();
      // }
    }

    this.updateAnimation(grounded);
    this.updateArmAndMuzzle(time, pointer.leftButtonDown());
  }

  private startSlide(): void {
    this.isSliding = true;
    this.slideEndsAt = this.scene.time.now + SideScrollerConfig.player.slideMs;
    this.slideDirection = this.facingRight ? 1 : -1;
    this.applyPose("player_slide", "slide");
  }

  private endSlide(): void {
    this.isSliding = false;
    this.applyPose("player_idle", "stand");
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
    this.applyPose(key, "stand");
    this.setFlipX(!this.facingRight);
  }

  private updateArmAndMuzzle(time: number, shooting: boolean): void {
    // Keep the gun-arm hidden by default so the AI character's normal
    // arms read as the character's arms. Only flash it in while
    // shooting (or for a brief linger after each shot).
    if (shooting) {
      this.armActiveUntil = Math.max(this.armActiveUntil, time + ARM_LINGER_MS);
    }
    const armVisible = !this.isSliding && time < this.armActiveUntil;

    this.arm.setVisible(armVisible);
    this.muzzle.setVisible(time < this.muzzleHideAt && !this.isSliding);
    if (!armVisible) return;

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
    }
  }

  flashMuzzle(now: number): void {
    this.muzzleHideAt = now + 60;
    this.armActiveUntil = Math.max(this.armActiveUntil, now + ARM_LINGER_MS);
  }

  override destroy(fromScene?: boolean): void {
    this.arm.destroy();
    this.muzzle.destroy();
    super.destroy(fromScene);
  }
}
