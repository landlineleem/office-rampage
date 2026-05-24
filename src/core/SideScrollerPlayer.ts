import Phaser from "phaser";
import { SideScrollerConfig } from "../modes/office-sidescroller/config";

export type PlayerKeys = {
  A: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
  SPACE: Phaser.Input.Keyboard.Key;
  SHIFT: Phaser.Input.Keyboard.Key;
  E: Phaser.Input.Keyboard.Key;
};

export class SideScrollerPlayer extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  invulnUntil = 0;
  isSliding = false;
  slideEndsAt = 0;
  slideDirection = 1;
  lastGroundedAt = 0;
  facingRight = true;
  aimAngle = 0;
  // Public shoulder world position, recomputed each frame so weapons can spawn
  // staples from the correct hand location.
  shoulderX = 0;
  shoulderY = 0;

  private arm: Phaser.GameObjects.Sprite;
  private muzzle: Phaser.GameObjects.Sprite;
  private muzzleHideAt = 0;
  private walkPhase = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player_idle");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 0.5);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(SideScrollerConfig.player.bodyWidth, SideScrollerConfig.player.bodyHeight);
    // Center the hitbox horizontally; anchor it near the feet vertically.
    body.setOffset(
      (32 - SideScrollerConfig.player.bodyWidth) / 2,
      56 - SideScrollerConfig.player.bodyHeight - 2
    );
    body.setGravityY(SideScrollerConfig.player.gravity);
    body.setMaxVelocity(800, 1400);
    body.setCollideWorldBounds(true);

    this.hp = SideScrollerConfig.player.maxHP;
    this.setDepth(10);

    this.arm = scene.add.sprite(x, y, "player_arm");
    this.arm.setOrigin(0, 0.5);
    this.arm.setDepth(11);

    this.muzzle = scene.add.sprite(0, 0, "muzzle");
    this.muzzle.setOrigin(0, 0.5);
    this.muzzle.setDepth(12);
    this.muzzle.setVisible(false);
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

    // Aim (always tracks mouse — even while sliding)
    this.aimAngle = Math.atan2(pointer.worldY - this.y, pointer.worldX - this.x);
    this.facingRight = Math.abs(this.aimAngle) <= Math.PI / 2;

    if (!inputBlocked) {
      // Horizontal movement (locked during slide)
      if (this.isSliding) {
        body.setVelocityX(this.slideDirection * SideScrollerConfig.player.slideVelocity);
      } else {
        let vx = 0;
        if (keys.A.isDown) vx -= 1;
        if (keys.D.isDown) vx += 1;
        body.setVelocityX(vx * SideScrollerConfig.player.runSpeed);
        if (vx !== 0) this.walkPhase += delta * 0.012;
      }

      // Jump (with brief coyote time)
      const canJump =
        !this.isSliding &&
        time - this.lastGroundedAt <= SideScrollerConfig.player.coyoteMs;
      if (Phaser.Input.Keyboard.JustDown(keys.SPACE) && canJump) {
        body.setVelocityY(-SideScrollerConfig.player.jumpVelocity);
        this.lastGroundedAt = -Infinity;
      }

      // Slide (initiate)
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
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.isSliding = true;
    this.slideEndsAt = this.scene.time.now + SideScrollerConfig.player.slideMs;
    this.slideDirection = this.facingRight ? 1 : -1;
    // Use slide texture for hitbox dimensions
    this.setTexture("player_slide");
    body.setSize(36, SideScrollerConfig.player.slideBodyHeight);
    body.setOffset(
      (56 - 36) / 2,
      32 - SideScrollerConfig.player.slideBodyHeight - 2
    );
  }

  private endSlide(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    this.isSliding = false;
    this.setTexture("player_idle");
    body.setSize(SideScrollerConfig.player.bodyWidth, SideScrollerConfig.player.bodyHeight);
    body.setOffset(
      (32 - SideScrollerConfig.player.bodyWidth) / 2,
      56 - SideScrollerConfig.player.bodyHeight - 2
    );
  }

  private updateAnimation(grounded: boolean): void {
    if (this.isSliding) {
      this.setTexture("player_slide");
      this.setFlipX(!this.facingRight);
      return;
    }
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!grounded) {
      this.setTexture(body.velocity.y < 0 ? "player_jump" : "player_fall");
    } else if (Math.abs(body.velocity.x) > 10) {
      const f = Math.floor(this.walkPhase) % 2;
      this.setTexture(f === 0 ? "player_walk_0" : "player_walk_1");
    } else {
      this.setTexture("player_idle");
    }
    this.setFlipX(!this.facingRight);
  }

  private updateArmAndMuzzle(time: number): void {
    if (this.isSliding) {
      this.arm.setVisible(false);
      this.muzzle.setVisible(false);
      return;
    }
    this.arm.setVisible(true);
    // Shoulder world position
    this.shoulderX = this.x;
    this.shoulderY = this.y + SideScrollerConfig.player.shoulderOffsetY;
    this.arm.setPosition(this.shoulderX, this.shoulderY);
    this.arm.setRotation(this.aimAngle);
    // When aiming to the left half, flip the arm vertically so the gun
    // stays "right side up" instead of being upside-down.
    this.arm.setFlipY(!this.facingRight);

    if (time < this.muzzleHideAt) {
      const len = this.arm.width; // origin at left, gun is at right end
      const mx = this.shoulderX + Math.cos(this.aimAngle) * len;
      const my = this.shoulderY + Math.sin(this.aimAngle) * len;
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
