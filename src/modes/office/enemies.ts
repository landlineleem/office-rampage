import Phaser from "phaser";
import { OfficeConfig } from "./config";

export class Intern extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  lastContact = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "intern");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(10, 2, 2);
    this.hp = OfficeConfig.intern.hp;
  }

  pursue(targetX: number, targetY: number, speedFactor: number): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const m = Math.hypot(dx, dy) || 1;
    const sp = OfficeConfig.intern.speed * speedFactor;
    this.setVelocity((dx / m) * sp, (dy / m) * sp);
    this.rotation = Math.atan2(dy, dx);
  }

  damage(): boolean {
    this.hp -= 1;
    return this.hp <= 0;
  }
}
