import Phaser from "phaser";
import { SideScrollerConfig } from "./config";
import { sound } from "../../core/Sound";

// ---------- Weapon definitions ----------

export type FireMode = "semi" | "auto";

export interface WeaponConfig {
  name: string;
  shortName: string;
  fireMode: FireMode;
  fireRateMs: number;
  bulletSpeed: number;
  bulletLifeMs: number;
  spawnOffset: number;
  spread: number; // radians of inaccuracy each shot
  shotStrength: number; // sound volume multiplier
  bulletTextureKey: string;
}

export const SINGLE_STAPLER: WeaponConfig = {
  name: "STAPLER",
  shortName: "STAPLER",
  fireMode: "semi",
  fireRateMs: 140, // min spacing between trigger pulls
  bulletSpeed: 1000,
  bulletLifeMs: 1100,
  spawnOffset: 26,
  spread: 0,
  shotStrength: 1.0,
  bulletTextureKey: "staple",
};

export const AUTO_STAPLER: WeaponConfig = {
  name: "AUTO STAPLER",
  shortName: "AUTO",
  fireMode: "auto",
  fireRateMs: 70,
  bulletSpeed: 1100,
  bulletLifeMs: 850,
  spawnOffset: 26,
  spread: 0.08, // slight inaccuracy
  shotStrength: 0.7,
  bulletTextureKey: "staple",
};

// ---------- Bullet trail helpers (unchanged) ----------

function ensureTrail(
  scene: Phaser.Scene,
  bullet: Phaser.Physics.Arcade.Sprite,
  trailKey: string
): void {
  let trail = bullet.getData("trail") as Phaser.GameObjects.Sprite | undefined;
  let glow = bullet.getData("glow") as Phaser.GameObjects.Sprite | undefined;
  if (!trail) {
    trail = scene.add.sprite(0, 0, trailKey);
    trail.setOrigin(1, 0.5);
    trail.setBlendMode(Phaser.BlendModes.ADD);
    trail.setDepth(8);
    bullet.setData("trail", trail);
  }
  if (!glow) {
    glow = scene.add.sprite(0, 0, "bullet_glow");
    glow.setOrigin(0.5, 0.5);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    glow.setDepth(8);
    glow.setScale(1.6);
    bullet.setData("glow", glow);
  }
}

function showTrail(
  bullet: Phaser.Physics.Arcade.Sprite,
  angle: number,
  tint: number
): void {
  const trail = bullet.getData("trail") as Phaser.GameObjects.Sprite;
  const glow = bullet.getData("glow") as Phaser.GameObjects.Sprite;
  if (trail) {
    trail.setPosition(bullet.x, bullet.y);
    trail.setRotation(angle);
    trail.setVisible(true);
  }
  if (glow) {
    glow.setPosition(bullet.x, bullet.y);
    glow.setTint(tint);
    glow.setVisible(true);
  }
}

function hideTrail(bullet: Phaser.Physics.Arcade.Sprite): void {
  const trail = bullet.getData("trail") as Phaser.GameObjects.Sprite | undefined;
  const glow = bullet.getData("glow") as Phaser.GameObjects.Sprite | undefined;
  if (trail) trail.setVisible(false);
  if (glow) glow.setVisible(false);
}

export function updateBulletTrails(
  group: Phaser.Physics.Arcade.Group,
  tint: number
): void {
  group.getChildren().forEach((c) => {
    const b = c as Phaser.Physics.Arcade.Sprite;
    if (!b.active) {
      hideTrail(b);
      return;
    }
    showTrail(b, b.rotation, tint);
  });
}

// ---------- Player weapon ----------

export class PlayerWeapon {
  scene: Phaser.Scene;
  config: WeaponConfig;
  bullets: Phaser.Physics.Arcade.Group;
  lastFire = 0;

  constructor(scene: Phaser.Scene, config: WeaponConfig) {
    this.scene = scene;
    this.config = config;
    this.bullets = scene.physics.add.group({
      defaultKey: config.bulletTextureKey,
      maxSize: 120,
      allowGravity: false,
    });
  }

  tryFire(now: number, shoulderX: number, shoulderY: number, baseAngle: number): boolean {
    if (now - this.lastFire < this.config.fireRateMs) return false;
    this.lastFire = now;

    const spread = this.config.spread;
    const angle = spread > 0 ? baseAngle + (Math.random() - 0.5) * spread * 2 : baseAngle;

    const off = this.config.spawnOffset;
    const sx = shoulderX + Math.cos(angle) * off;
    const sy = shoulderY + Math.sin(angle) * off;

    const b = this.bullets.get(sx, sy) as Phaser.Physics.Arcade.Sprite | null;
    if (!b) return false;

    b.setActive(true).setVisible(true);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.reset(sx, sy);
    body.setSize(10, 6).setOffset(3, 2);
    b.rotation = angle;

    const sp = this.config.bulletSpeed;
    body.setVelocity(Math.cos(angle) * sp, Math.sin(angle) * sp);

    ensureTrail(this.scene, b, "bullet_trail_player");
    showTrail(b, angle, 0xffe066);

    this.scene.time.delayedCall(this.config.bulletLifeMs, () => {
      if (!b.active) return;
      this.recycle(b);
    });

    sound.gunshot(this.config.shotStrength);
    return true;
  }

  recycle(b: Phaser.Physics.Arcade.Sprite): void {
    b.setActive(false).setVisible(false);
    hideTrail(b);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.reset(-9999, -9999);
    body.setVelocity(0, 0);
  }

  update(): void {
    updateBulletTrails(this.bullets, 0xffe066);
  }
}

// ---------- Guard weapon (unchanged) ----------

export class GuardGun {
  scene: Phaser.Scene;
  bullets: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bullets = scene.physics.add.group({
      defaultKey: "guard_bullet",
      maxSize: 100,
      allowGravity: false,
    });
  }

  fire(sx: number, sy: number, angle: number): void {
    const b = this.bullets.get(sx, sy) as Phaser.Physics.Arcade.Sprite | null;
    if (!b) return;
    b.setActive(true).setVisible(true);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.reset(sx, sy);
    body.setSize(6, 3).setOffset(1, 0.5);
    b.rotation = angle;
    const sp = SideScrollerConfig.guard.bulletSpeed;
    body.setVelocity(Math.cos(angle) * sp, Math.sin(angle) * sp);
    ensureTrail(this.scene, b, "bullet_trail_guard");
    showTrail(b, angle, 0xff8030);
    this.scene.time.delayedCall(SideScrollerConfig.guard.bulletLifeMs, () => {
      if (!b.active) return;
      this.recycle(b);
    });
    sound.gunshot(0.7);
  }

  recycle(b: Phaser.Physics.Arcade.Sprite): void {
    b.setActive(false).setVisible(false);
    hideTrail(b);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.reset(-9999, -9999);
    body.setVelocity(0, 0);
  }

  update(): void {
    updateBulletTrails(this.bullets, 0xff8030);
  }
}
