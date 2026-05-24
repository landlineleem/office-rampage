import Phaser from "phaser";
import { OfficeConfig } from "./config";

export class Intern extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  lastContact = 0;
  private bobblePhase: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "intern");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Sprite is 44x44; physics circle radius 9 centered on the body
    body.setCircle(9, 11, 13);
    this.hp = OfficeConfig.intern.hp;
    this.bobblePhase = Math.random() * Math.PI * 2; // desync from siblings
  }

  pursue(targetX: number, targetY: number, speedFactor: number, time: number): void {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const m = Math.hypot(dx, dy) || 1;
    const sp = OfficeConfig.intern.speed * speedFactor;
    this.setVelocity((dx / m) * sp, (dy / m) * sp);
    this.rotation = Math.atan2(dy, dx);
    // Bobble
    const s = 1 + Math.sin(time * 0.022 + this.bobblePhase) * 0.07;
    this.setScale(s);
  }

  damage(): boolean {
    this.hp -= 1;
    return this.hp <= 0;
  }
}
