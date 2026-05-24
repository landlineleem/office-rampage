import Phaser from "phaser";
import { OfficeConfig } from "./config";

export class Stapler {
  scene: Phaser.Scene;
  bullets: Phaser.Physics.Arcade.Group;
  lastFire = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bullets = scene.physics.add.group({
      defaultKey: "bullet",
      maxSize: 200,
    });
  }

  tryFire(now: number, x: number, y: number, angle: number): boolean {
    if (now - this.lastFire < OfficeConfig.stapler.fireRateMs) return false;
    this.lastFire = now;

    const b = this.bullets.get(x, y) as Phaser.Physics.Arcade.Sprite | null;
    if (!b) return false;

    b.setActive(true).setVisible(true);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y);
    body.setCircle(2, 2, 1);
    b.rotation = angle;

    const sp = OfficeConfig.stapler.bulletSpeed;
    body.setVelocity(Math.cos(angle) * sp, Math.sin(angle) * sp);

    this.scene.time.delayedCall(OfficeConfig.stapler.bulletLifeMs, () => {
      if (!b.active) return;
      this.recycle(b);
    });

    return true;
  }

  recycle(b: Phaser.Physics.Arcade.Sprite): void {
    b.setActive(false).setVisible(false);
    const body = b.body as Phaser.Physics.Arcade.Body;
    body.reset(-9999, -9999);
    body.setVelocity(0, 0);
  }
}
