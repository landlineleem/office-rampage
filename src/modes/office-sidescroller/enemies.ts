import Phaser from "phaser";
import { SideScrollerConfig } from "./config";
import { GuardGun } from "./weapons";

// Display dimensions — same convention as the player so AI guard sprites
// and procedural placeholders both end up the same on-screen size.
const STAND_W = 76;
const STAND_H = 156;
const BODY_W = 36;
const BODY_H = 144;
const SHOULDER_OFFSET_Y = -118;
const ARM_DISPLAY_W = 66;
const ARM_DISPLAY_H = 18;

export class SecurityGuard extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  lastContact = 0;
  facingRight = true;
  patrolCenter: number;
  patrolMin: number;
  patrolMax: number;
  aiState: "patrol" | "aiming" | "firing" = "patrol";
  aimReadyAt = 0;
  lastShotAt = 0;
  private arm: Phaser.GameObjects.Sprite;
  private walkPhase = 0;
  private gun: GuardGun;
  private currentPoseKey = "";
  private hasRealWalkFrames = false;

  constructor(scene: Phaser.Scene, x: number, y: number, gun: GuardGun) {
    super(scene, x, y, "guard_idle");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1.0);
    this.setDepth(9);

    this.hasRealWalkFrames =
      this.isRealArt("guard_walk_0") && this.isRealArt("guard_walk_1");

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(SideScrollerConfig.player.gravity);
    body.setCollideWorldBounds(true);

    this.applyPose("guard_idle");

    this.hp = SideScrollerConfig.guard.hp;
    this.patrolCenter = x;
    this.patrolMin = x - SideScrollerConfig.guard.patrolRange / 2;
    this.patrolMax = x + SideScrollerConfig.guard.patrolRange / 2;
    this.gun = gun;

    this.arm = scene.add.sprite(x, y, "guard_arm");
    this.arm.setOrigin(0, 0.5);
    this.arm.setDisplaySize(ARM_DISPLAY_W, ARM_DISPLAY_H);
    this.arm.setDepth(10);
  }

  private isRealArt(key: string): boolean {
    if (!this.scene.textures.exists(key)) return false;
    return this.scene.textures.get(key).source[0].width > 96;
  }

  private applyPose(key: string, feetInset = 4): void {
    if (this.currentPoseKey === key) return;
    this.currentPoseKey = key;
    this.setTexture(key);
    this.setDisplaySize(STAND_W, STAND_H);
    const src = this.texture.source[0];
    const sx = STAND_W / src.width;
    const sy = STAND_H / src.height;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(BODY_W / sx, BODY_H / sy);
    body.setOffset(
      ((STAND_W - BODY_W) / 2) / sx,
      (STAND_H - BODY_H - feetInset) / sy
    );
  }

  think(
    time: number,
    delta: number,
    playerX: number,
    playerY: number,
    worldFactor: number
  ): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = playerX - this.x;
    // Sight check uses the guard's torso, not feet, so the player's chest
    // height counts as "at my level" too.
    const sightTargetY = playerY + SHOULDER_OFFSET_Y;
    const dy = sightTargetY - (this.y + SHOULDER_OFFSET_Y);
    const dist = Math.hypot(dx, dy);
    const canSee =
      dist < SideScrollerConfig.guard.sightDistance &&
      Math.abs(dy) < SideScrollerConfig.guard.sightVerticalTolerance;

    if (canSee) {
      this.facingRight = dx >= 0;
      if (this.aiState === "patrol") {
        this.aiState = "aiming";
        this.aimReadyAt = time + SideScrollerConfig.guard.aimDelayMs;
      }
      body.setVelocityX(0);
      if (this.aiState === "aiming" && time >= this.aimReadyAt) {
        this.aiState = "firing";
        this.lastShotAt = -Infinity;
      }
      if (this.aiState === "firing") {
        if (time - this.lastShotAt >= SideScrollerConfig.guard.fireRateMs) {
          this.lastShotAt = time;
          const angle = Math.atan2(dy, dx);
          const shoulderX = this.x;
          const shoulderY = this.y + SHOULDER_OFFSET_Y;
          const sx = shoulderX + Math.cos(angle) * ARM_DISPLAY_W;
          const sy = shoulderY + Math.sin(angle) * ARM_DISPLAY_W;
          this.gun.fire(sx, sy, angle);
        }
      }
    } else {
      this.aiState = "patrol";
      const sp = SideScrollerConfig.guard.walkSpeed * worldFactor;
      if (this.facingRight) {
        body.setVelocityX(sp);
        if (this.x >= this.patrolMax) this.facingRight = false;
      } else {
        body.setVelocityX(-sp);
        if (this.x <= this.patrolMin) this.facingRight = true;
      }
      if (Math.abs(body.velocity.x) > 5) this.walkPhase += delta * 0.01;
    }

    // Pose selection — fall back to idle if real walk frames aren't loaded.
    let poseKey = "guard_idle";
    if (
      this.aiState === "patrol" &&
      Math.abs(body.velocity.x) > 5 &&
      this.hasRealWalkFrames
    ) {
      poseKey = Math.floor(this.walkPhase) % 2 === 0 ? "guard_walk_0" : "guard_walk_1";
    }
    this.applyPose(poseKey);
    this.setFlipX(!this.facingRight);

    // Aiming arm
    const showArm = this.aiState !== "patrol";
    this.arm.setVisible(showArm);
    if (showArm) {
      const shoulderX = this.x;
      const shoulderY = this.y + SHOULDER_OFFSET_Y;
      const angle = Math.atan2(dy, dx);
      this.arm.setPosition(shoulderX, shoulderY);
      this.arm.setRotation(angle);
      this.arm.setFlipY(!this.facingRight);
    }
  }

  damage(): boolean {
    this.hp -= 1;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(60, () => this.clearTint());
    return this.hp <= 0;
  }

  override destroy(fromScene?: boolean): void {
    this.arm.destroy();
    super.destroy(fromScene);
  }
}
