import Phaser from "phaser";
import { SideScrollerConfig } from "./config";
import { sound } from "../../core/Sound";

export class Pistol {
  scene: Phaser.Scene;
  bullets: Phaser.Physics.Arcade.Group;
  lastFire = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bullets = scene.physics.add.group({
      defaultKey: "staple",
      maxSize: 100,
      allowGravity: false,
    });
  }

  tryFire(now: number, shoulderX: number, shoulderY: number, angle: number): boolean {
    if (now - this.lastFire < SideScrollerConfig.pistol.fireRateMs) return false;
    this.lastFire = now;

    const off = SideScrollerConfig.pistol.spawnOffset;
    const sx = shoulderX + Math.cos(angle) * off;
    const sy = shoulderY + Math.sin(angle) * off;

    const b = this.bullets.get(sx, sy) as Phaser.Physics.Arcade.Sprite | null;
    if (!b) return false;

    b.setActive(true).setVisible(true);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.reset(sx, sy);
    body.setSize(8, 4).setOffset(2, 1);
    b.rotation = angle;

    const sp = SideScrollerConfig.pistol.bulletSpeed;
    body.setVelocity(Math.cos(angle) * sp, Math.sin(angle) * sp);

    this.scene.time.delayedCall(SideScrollerConfig.pistol.bulletLifeMs, () => {
      if (!b.active) return;
      this.recycle(b);
    });

    sound.gunshot(1.0);
    return true;
  }

  recycle(b: Phaser.Physics.Arcade.Sprite): void {
    b.setActive(false).setVisible(false);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.reset(-9999, -9999);
    body.setVelocity(0, 0);
  }
}

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
    this.scene.time.delayedCall(SideScrollerConfig.guard.bulletLifeMs, () => {
      if (!b.active) return;
      this.recycle(b);
    });
    sound.gunshot(0.7);
  }

  recycle(b: Phaser.Physics.Arcade.Sprite): void {
    b.setActive(false).setVisible(false);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.reset(-9999, -9999);
    body.setVelocity(0, 0);
  }
}
