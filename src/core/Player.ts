import Phaser from "phaser";
import { OfficeConfig } from "../modes/office/config";

export type MoveKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  invulnUntil = 0;
  private moving = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "player");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Sprite is 56x56; physics circle radius 12 centered on the body
    body.setCircle(12, 14, 16);
    body.setCollideWorldBounds(true);
    this.hp = OfficeConfig.player.maxHP;
  }

  takeDamage(now: number): boolean {
    if (now < this.invulnUntil) return false;
    this.invulnUntil = now + OfficeConfig.player.invulnMs;
    this.hp -= 1;
    this.scene.cameras.main.shake(150, 0.012);
    this.setTint(0xff5252);
    this.scene.time.delayedCall(120, () => this.clearTint());
    return true;
  }

  updateMovement(keys: MoveKeys, speedFactor: number): void {
    const speed = OfficeConfig.player.speed * speedFactor;
    let vx = 0;
    let vy = 0;
    if (keys.W.isDown) vy -= 1;
    if (keys.S.isDown) vy += 1;
    if (keys.A.isDown) vx -= 1;
    if (keys.D.isDown) vx += 1;
    const mag = Math.hypot(vx, vy);
    if (mag > 0) {
      vx /= mag;
      vy /= mag;
    }
    this.setVelocity(vx * speed, vy * speed);
    this.moving = mag > 0;
  }

  aimAt(x: number, y: number): void {
    this.rotation = Math.atan2(y - this.y, x - this.x);
  }

  animateBobble(time: number): void {
    if (this.moving) {
      const s = 1 + Math.sin(time * 0.024) * 0.06;
      this.setScale(s);
    } else if (this.scale !== 1) {
      this.setScale(1);
    }
  }
}
