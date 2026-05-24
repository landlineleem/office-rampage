import Phaser from "phaser";
import { SideScrollerConfig } from "./config";
import { GuardGun } from "./weapons";

// Enemy archetype configuration. All hostile NPCs share the same
// patrol → aim → fire loop, but the numbers and visual tweaks per
// archetype give them very different combat feel.

export interface EnemyConfig {
  name: string;
  hp: number;
  walkSpeed: number; // 0 = stationary
  sightDistance: number;
  sightVerticalTolerance: number;
  aimDelayMs: number;
  fireRateMs: number;
  bulletSpeed: number;
  bulletLifeMs: number;
  bulletDamage: number;
  contactDamage: number;
  contactCooldownMs: number;
  patrolRange: number; // ignored when walkSpeed = 0
  scale: number; // 1.0 = baseline 76x156 display
  tint: number; // 0xffffff = no tint
  textureKeyPrefix: string; // "guard" -> guard_idle / guard_walk_0 etc
  meleeOnly: boolean; // intern-style — never fires, only damages on contact
  laserSight: boolean; // sniper-style — render a red line while aiming
  scoreValue: number;
}

// ---------- Concrete archetypes ----------

export const SECURITY_GUARD: EnemyConfig = {
  name: "Security",
  hp: 2,
  walkSpeed: SideScrollerConfig.guard.walkSpeed,
  sightDistance: SideScrollerConfig.guard.sightDistance,
  sightVerticalTolerance: SideScrollerConfig.guard.sightVerticalTolerance,
  aimDelayMs: SideScrollerConfig.guard.aimDelayMs,
  fireRateMs: SideScrollerConfig.guard.fireRateMs,
  bulletSpeed: SideScrollerConfig.guard.bulletSpeed,
  bulletLifeMs: SideScrollerConfig.guard.bulletLifeMs,
  bulletDamage: SideScrollerConfig.player.guardBulletDamage,
  contactDamage: SideScrollerConfig.player.guardContactDamage,
  contactCooldownMs: SideScrollerConfig.guard.contactCooldownMs,
  patrolRange: SideScrollerConfig.guard.patrolRange,
  scale: 1.0,
  tint: 0xffffff,
  textureKeyPrefix: "guard",
  meleeOnly: false,
  laserSight: false,
  scoreValue: 100,
};

export const HEAVY_GUARD: EnemyConfig = {
  name: "Heavy",
  hp: 5,
  walkSpeed: 38,
  sightDistance: 520,
  sightVerticalTolerance: 90,
  aimDelayMs: 600,
  fireRateMs: 1400,
  bulletSpeed: 580,
  bulletLifeMs: 2000,
  bulletDamage: 30,
  contactDamage: 25,
  contactCooldownMs: 800,
  patrolRange: 80,
  scale: 1.22,
  tint: 0x6a7882, // cold steel armor tint
  textureKeyPrefix: "guard",
  meleeOnly: false,
  laserSight: false,
  scoreValue: 350,
};

export const SNIPER: EnemyConfig = {
  name: "Sniper",
  hp: 1,
  walkSpeed: 0,
  sightDistance: 1100,
  sightVerticalTolerance: 240,
  aimDelayMs: 1300, // long telegraph
  fireRateMs: 2400,
  bulletSpeed: 1500,
  bulletLifeMs: 1800,
  bulletDamage: 45, // brutal
  contactDamage: 12,
  contactCooldownMs: 700,
  patrolRange: 0,
  scale: 1.0,
  tint: 0xc73a3a, // red — easy to spot at range
  textureKeyPrefix: "guard",
  meleeOnly: false,
  laserSight: true,
  scoreValue: 250,
};

export const INTERN: EnemyConfig = {
  name: "Intern",
  hp: 1,
  walkSpeed: 220, // fast
  sightDistance: 700,
  sightVerticalTolerance: 90,
  aimDelayMs: 0,
  fireRateMs: 999999,
  bulletSpeed: 0,
  bulletLifeMs: 0,
  bulletDamage: 0,
  contactDamage: 22,
  contactCooldownMs: 600,
  patrolRange: 50,
  scale: 0.85,
  tint: 0xe8d6b8, // pale / khaki "office worker" tint
  textureKeyPrefix: "guard",
  meleeOnly: true,
  laserSight: false,
  scoreValue: 60,
};

// CEO boss — handled specially below. Larger, much more HP, multi-phase.
export const CEO_BOSS: EnemyConfig = {
  name: "The CEO",
  hp: 60,
  walkSpeed: 90,
  sightDistance: 1400,
  sightVerticalTolerance: 300,
  aimDelayMs: 200,
  fireRateMs: 380, // rapid burst
  bulletSpeed: 700,
  bulletLifeMs: 2200,
  bulletDamage: 22,
  contactDamage: 30,
  contactCooldownMs: 700,
  patrolRange: 400,
  scale: 1.7,
  tint: 0xb89a2c, // gold/luxury tint
  textureKeyPrefix: "guard",
  meleeOnly: false,
  laserSight: false,
  scoreValue: 5000,
};

// ---------- Display constants ----------
const BASE_STAND_W = 76;
const BASE_STAND_H = 156;
const BASE_BODY_W = 36;
const BASE_BODY_H = 144;
const BASE_SHOULDER_OFFSET = -118;
const BASE_ARM_W = 66;
const BASE_ARM_H = 18;

// ---------- Enemy class ----------

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  config: EnemyConfig;
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
  private laser?: Phaser.GameObjects.Graphics;
  private walkPhase = 0;
  private gun: GuardGun;
  private currentPoseKey = "";
  private hasRealWalkFrames = false;

  constructor(scene: Phaser.Scene, x: number, y: number, gun: GuardGun, config: EnemyConfig) {
    super(scene, x, y, `${config.textureKeyPrefix}_idle`);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.config = config;
    this.setOrigin(0.5, 1.0);
    this.setDepth(9);
    this.setTint(config.tint);

    this.hasRealWalkFrames =
      this.isRealArt(`${config.textureKeyPrefix}_walk_0`) &&
      this.isRealArt(`${config.textureKeyPrefix}_walk_1`);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(SideScrollerConfig.player.gravity);
    body.setCollideWorldBounds(true);

    this.applyPose(`${config.textureKeyPrefix}_idle`);

    this.hp = config.hp;
    this.patrolCenter = x;
    const half = config.patrolRange / 2;
    this.patrolMin = x - half;
    this.patrolMax = x + half;
    this.gun = gun;

    this.arm = scene.add.sprite(x, y, `${config.textureKeyPrefix}_arm`);
    this.arm.setOrigin(0, 0.5);
    this.arm.setDisplaySize(BASE_ARM_W * config.scale, BASE_ARM_H * config.scale);
    this.arm.setDepth(10);
    this.arm.setTint(config.tint);

    if (config.laserSight) {
      this.laser = scene.add.graphics();
      this.laser.setDepth(9);
    }
  }

  private isRealArt(key: string): boolean {
    if (!this.scene.textures.exists(key)) return false;
    return this.scene.textures.get(key).source[0].width > 96;
  }

  private applyPose(key: string, feetInset = 4): void {
    if (this.currentPoseKey === key) return;
    this.currentPoseKey = key;
    this.setTexture(key);
    const dispW = BASE_STAND_W * this.config.scale;
    const dispH = BASE_STAND_H * this.config.scale;
    this.setDisplaySize(dispW, dispH);
    const src = this.texture.source[0];
    const sx = dispW / src.width;
    const sy = dispH / src.height;
    const bodyW = BASE_BODY_W * this.config.scale;
    const bodyH = BASE_BODY_H * this.config.scale;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(bodyW / sx, bodyH / sy);
    body.setOffset(((dispW - bodyW) / 2) / sx, (dispH - bodyH - feetInset) / sy);
  }

  think(time: number, delta: number, playerX: number, playerY: number, worldFactor: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dx = playerX - this.x;
    const sightTargetY = playerY + BASE_SHOULDER_OFFSET * this.config.scale;
    const dy = sightTargetY - (this.y + BASE_SHOULDER_OFFSET * this.config.scale);
    const dist = Math.hypot(dx, dy);
    const canSee =
      dist < this.config.sightDistance &&
      Math.abs(dy) < this.config.sightVerticalTolerance;

    if (canSee) {
      this.facingRight = dx >= 0;
      if (this.aiState === "patrol") {
        this.aiState = "aiming";
        this.aimReadyAt = time + this.config.aimDelayMs;
      }
      if (this.config.walkSpeed === 0) {
        body.setVelocityX(0);
      } else {
        // Slow advance toward player when aiming/firing? For now, just stop.
        body.setVelocityX(0);
      }
      if (this.aiState === "aiming" && time >= this.aimReadyAt) {
        this.aiState = "firing";
        this.lastShotAt = -Infinity;
      }
      if (this.aiState === "firing" && !this.config.meleeOnly) {
        if (time - this.lastShotAt >= this.config.fireRateMs) {
          this.lastShotAt = time;
          const angle = Math.atan2(dy, dx);
          const shoulderY = this.y + BASE_SHOULDER_OFFSET * this.config.scale;
          const armLen = BASE_ARM_W * this.config.scale;
          const sx = this.x + Math.cos(angle) * armLen;
          const sy = shoulderY + Math.sin(angle) * armLen;
          this.gun.fire(
            sx,
            sy,
            angle,
            this.config.bulletSpeed,
            this.config.bulletLifeMs,
            this.config.bulletDamage
          );
        }
      }
    } else {
      if (this.aiState !== "patrol") this.aiState = "patrol";
      const sp = this.config.walkSpeed * worldFactor;
      if (this.config.walkSpeed === 0) {
        body.setVelocityX(0);
      } else {
        if (this.facingRight) {
          body.setVelocityX(sp);
          if (this.x >= this.patrolMax) this.facingRight = false;
        } else {
          body.setVelocityX(-sp);
          if (this.x <= this.patrolMin) this.facingRight = true;
        }
        if (Math.abs(body.velocity.x) > 5) this.walkPhase += delta * 0.01;
      }
    }

    // For melee/intern: ALWAYS charge the player if seen
    if (this.config.meleeOnly && canSee) {
      const charge = this.config.walkSpeed * worldFactor;
      body.setVelocityX(this.facingRight ? charge : -charge);
      this.walkPhase += delta * 0.012;
    }

    // Pose
    let poseKey = `${this.config.textureKeyPrefix}_idle`;
    if (Math.abs(body.velocity.x) > 5 && this.hasRealWalkFrames) {
      poseKey =
        Math.floor(this.walkPhase) % 2 === 0
          ? `${this.config.textureKeyPrefix}_walk_0`
          : `${this.config.textureKeyPrefix}_walk_1`;
    }
    this.applyPose(poseKey);
    this.setFlipX(!this.facingRight);

    // Arm visibility
    const showArm = this.aiState !== "patrol" && !this.config.meleeOnly;
    this.arm.setVisible(showArm);
    if (showArm) {
      const shoulderX = this.x;
      const shoulderY = this.y + BASE_SHOULDER_OFFSET * this.config.scale;
      const angle = Math.atan2(dy, dx);
      this.arm.setPosition(shoulderX, shoulderY);
      this.arm.setRotation(angle);
      this.arm.setFlipY(!this.facingRight);
    }

    // Laser sight (sniper only)
    if (this.laser) {
      this.laser.clear();
      if (this.aiState === "aiming") {
        const sx = this.x;
        const sy = this.y + BASE_SHOULDER_OFFSET * this.config.scale;
        const tx = playerX;
        const ty = playerY - 60;
        // Pulsing alpha as the sniper locks on
        const t = (time - (this.aimReadyAt - this.config.aimDelayMs)) / this.config.aimDelayMs;
        const alpha = Phaser.Math.Clamp(0.2 + t * 0.7, 0.2, 0.9);
        this.laser.lineStyle(2, 0xff3030, alpha);
        this.laser.lineBetween(sx, sy, tx, ty);
      }
    }
  }

  damage(amount = 1): boolean {
    this.hp -= amount;
    // Flash bright red regardless of base tint — the white flash from
    // before was invisible on Security guards (whose base tint is white).
    this.setTint(0xff5050);
    this.scene.time.delayedCall(70, () => this.setTint(this.config.tint));
    return this.hp <= 0;
  }

  override destroy(fromScene?: boolean): void {
    this.arm.destroy();
    if (this.laser) this.laser.destroy();
    super.destroy(fromScene);
  }
}

// Keep the old SecurityGuard export name working so existing imports don't break
export class SecurityGuard extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number, gun: GuardGun) {
    super(scene, x, y, gun, SECURITY_GUARD);
  }
}
