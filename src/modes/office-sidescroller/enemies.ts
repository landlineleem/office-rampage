import Phaser from "phaser";
import { SideScrollerConfig } from "./config";
import { GuardGun } from "./weapons";

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

  constructor(scene: Phaser.Scene, x: number, y: number, gun: GuardGun) {
    super(scene, x, y, "guard_idle");
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 44);
    body.setOffset((32 - 18) / 2, 56 - 44 - 2);
    body.setGravityY(SideScrollerConfig.player.gravity);
    body.setCollideWorldBounds(true);

    this.hp = SideScrollerConfig.guard.hp;
    this.patrolCenter = x;
    this.patrolMin = x - SideScrollerConfig.guard.patrolRange / 2;
    this.patrolMax = x + SideScrollerConfig.guard.patrolRange / 2;
    this.gun = gun;
    this.setDepth(9);

    this.arm = scene.add.sprite(x, y, "guard_arm");
    this.arm.setOrigin(0, 0.5);
    this.arm.setDepth(10);
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
    const dy = playerY - this.y;
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
          const sx = this.x + Math.cos(angle) * 22;
          const sy = this.y - 6 + Math.sin(angle) * 22;
          this.gun.fire(sx, sy, angle);
        }
      }
    } else {
      // Patrol back to center
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

    // Animation
    if (this.aiState === "patrol" && Math.abs(body.velocity.x) > 5) {
      const f = Math.floor(this.walkPhase) % 2;
      this.setTexture(f === 0 ? "guard_walk_0" : "guard_walk_1");
    } else {
      this.setTexture("guard_idle");
    }
    this.setFlipX(!this.facingRight);

    // Arm
    const showArm = this.aiState !== "patrol";
    this.arm.setVisible(showArm);
    if (showArm) {
      const sx = this.x;
      const sy = this.y - 6;
      const angle = Math.atan2(dy, dx);
      this.arm.setPosition(sx, sy);
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
