import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "Boot" });
  }

  create(): void {
    this.makeTexture("player", 32, 32, (g) => {
      g.fillStyle(0x4cc4ff, 1);
      g.fillCircle(16, 16, 14);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(26, 16, 4);
    });

    this.makeTexture("intern", 24, 24, (g) => {
      g.fillStyle(0xff5252, 1);
      g.fillCircle(12, 12, 10);
      g.fillStyle(0xffffff, 1);
      g.fillRect(8, 9, 8, 2);
    });

    this.makeTexture("bullet", 8, 4, (g) => {
      g.fillStyle(0xffe066, 1);
      g.fillRect(0, 0, 8, 4);
    });

    this.scene.start("Menu");
  }

  private makeTexture(
    key: string,
    w: number,
    h: number,
    draw: (g: Phaser.GameObjects.Graphics) => void
  ): void {
    const g = this.add.graphics({ x: 0, y: 0 });
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
