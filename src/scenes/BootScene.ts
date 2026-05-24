import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "Boot" });
  }

  create(): void {
    // Player: top-down office worker, facing east (+X). Light-blue dress
    // shirt, red tie, peach head with dark hair, arms holding a red stapler.
    this.makeTexture("player", 56, 56, (g) => this.drawPlayer(g, 26, 28));

    // Intern: smaller, red polo, raised arms wielding a coffee mug.
    this.makeTexture("intern", 44, 44, (g) => this.drawIntern(g, 20, 22));

    // Bullet: tiny silver staple, opens to the LEFT so it "flies" with
    // its spine forward.
    this.makeTexture("bullet", 12, 8, (g) => this.drawStaple(g));

    // Office decor (no physics — pure flavor)
    this.makeTexture("desk", 64, 40, (g) => this.drawDesk(g));
    this.makeTexture("monitor", 22, 18, (g) => this.drawMonitor(g));
    this.makeTexture("water_cooler", 26, 36, (g) => this.drawWaterCooler(g));
    this.makeTexture("plant", 30, 30, (g) => this.drawPlant(g));
    this.makeTexture("coffee_machine", 28, 32, (g) => this.drawCoffeeMachine(g));

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

  // --- Characters ---

  private drawPlayer(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    // Soft shadow underneath
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(cx, cy + 8, 26, 9);

    // Legs sticking out behind body
    g.fillStyle(0x2a2c38, 1);
    g.fillRect(cx - 8, cy + 4, 4, 7);
    g.fillRect(cx - 3, cy + 4, 4, 7);

    // Dress shirt body
    g.fillStyle(0x4cc4ff, 1);
    g.fillCircle(cx - 2, cy, 11);
    // Shirt shading
    g.fillStyle(0x3aa5e0, 1);
    g.fillCircle(cx - 6, cy + 3, 5);

    // Red tie hanging down center
    g.fillStyle(0xa31818, 1);
    g.fillTriangle(cx - 2, cy - 5, cx - 6, cy + 6, cx + 2, cy + 6);
    g.fillStyle(0x7a1010, 1);
    g.fillTriangle(cx - 2, cy + 5, cx - 4, cy + 9, cx + 0, cy + 9);

    // Head (offset slightly forward)
    g.fillStyle(0xffd6b0, 1);
    g.fillCircle(cx + 5, cy - 1, 7);
    // Hair tuft on top
    g.fillStyle(0x2c1a0e, 1);
    g.fillEllipse(cx + 4, cy - 7, 11, 5);
    // Ear nub
    g.fillStyle(0xe8b890, 1);
    g.fillCircle(cx + 2, cy - 3, 1.5);

    // Arms (sleeved, holding stapler forward)
    g.fillStyle(0x4cc4ff, 1);
    g.fillRect(cx + 7, cy - 6, 7, 4);
    g.fillRect(cx + 7, cy + 2, 7, 4);
    // Hands
    g.fillStyle(0xffd6b0, 1);
    g.fillRect(cx + 14, cy - 6, 3, 4);
    g.fillRect(cx + 14, cy + 2, 3, 4);

    // Stapler — red body + grey jaw
    g.fillStyle(0x8b1a1a, 1);
    g.fillRoundedRect(cx + 17, cy - 6, 11, 12, 2);
    g.fillStyle(0x6b6b6b, 1);
    g.fillRoundedRect(cx + 19, cy - 4, 9, 3, 1);
    // Stapler glint
    g.fillStyle(0xc4c4c4, 1);
    g.fillRect(cx + 25, cy - 3, 2, 1);

    // Subtle outline around body (gives it that "cel" look)
    g.lineStyle(1, 0x1a1d24, 1);
    g.strokeCircle(cx - 2, cy, 11);
    g.strokeCircle(cx + 5, cy - 1, 7);
  }

  private drawIntern(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(cx, cy + 6, 22, 7);

    // Legs
    g.fillStyle(0x4a3220, 1);
    g.fillRect(cx - 6, cy + 3, 3, 6);
    g.fillRect(cx - 2, cy + 3, 3, 6);

    // Red polo body (slightly different red from player's tie for contrast)
    g.fillStyle(0xff5252, 1);
    g.fillCircle(cx - 1, cy, 9);
    // Polo shading
    g.fillStyle(0xd03a3a, 1);
    g.fillCircle(cx - 4, cy + 2, 4);
    // Lanyard hint (white V at neck)
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(cx - 1, cy - 5, cx - 4, cy - 1, cx + 2, cy - 1);

    // Head
    g.fillStyle(0xffd6b0, 1);
    g.fillCircle(cx + 5, cy - 1, 5.5);
    // Hair (parted)
    g.fillStyle(0x1a1a1a, 1);
    g.fillEllipse(cx + 4, cy - 5, 9, 4);

    // Arms reaching forward
    g.fillStyle(0xff5252, 1);
    g.fillRect(cx + 6, cy - 4, 5, 3);
    g.fillRect(cx + 6, cy + 1, 5, 3);
    // Hands
    g.fillStyle(0xffd6b0, 1);
    g.fillRect(cx + 11, cy - 4, 2, 3);
    g.fillRect(cx + 11, cy + 1, 2, 3);

    // Coffee mug — brown with white band
    g.fillStyle(0x6b3e1a, 1);
    g.fillRoundedRect(cx + 13, cy - 4, 7, 8, 1);
    g.fillStyle(0xffffff, 1);
    g.fillRect(cx + 13, cy - 1, 7, 2);
    // Mug handle
    g.lineStyle(2, 0x6b3e1a, 1);
    g.strokeCircle(cx + 21, cy, 2);
    // Steam wisps
    g.fillStyle(0xeeeeee, 0.6);
    g.fillCircle(cx + 16, cy - 7, 1.5);
    g.fillCircle(cx + 18, cy - 9, 1.2);

    g.lineStyle(1, 0x1a1d24, 1);
    g.strokeCircle(cx - 1, cy, 9);
    g.strokeCircle(cx + 5, cy - 1, 5.5);
  }

  // --- Projectile ---

  private drawStaple(g: Phaser.GameObjects.Graphics): void {
    // ] shape: spine on right, two prongs reaching left
    g.fillStyle(0xd0d0d0, 1);
    g.fillRect(10, 0, 2, 8); // spine
    g.fillRect(0, 0, 12, 2); // top prong
    g.fillRect(0, 6, 12, 2); // bottom prong
    g.lineStyle(1, 0x6b6b6b, 1);
    g.strokeRect(10, 0, 2, 8);
  }

  // --- Decor ---

  private drawDesk(g: Phaser.GameObjects.Graphics): void {
    // Frame
    g.fillStyle(0x3a2c1c, 1);
    g.fillRoundedRect(0, 0, 64, 40, 4);
    // Top surface
    g.fillStyle(0x8b6a4a, 1);
    g.fillRoundedRect(2, 2, 60, 36, 3);
    // Wood grain
    g.lineStyle(1, 0x6b4a2a, 0.6);
    for (let i = 6; i < 60; i += 8) g.lineBetween(2, i, 62, i);
    // Paper stack (random feature)
    g.fillStyle(0xfafafa, 1);
    g.fillRect(8, 8, 14, 10);
    g.lineStyle(1, 0x999999, 1);
    g.lineBetween(10, 11, 20, 11);
    g.lineBetween(10, 14, 18, 14);
    // Coffee cup ring
    g.lineStyle(1, 0x4a3220, 0.8);
    g.strokeCircle(48, 22, 4);
  }

  private drawMonitor(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(0, 0, 22, 16, 2);
    g.fillStyle(0x4cc4ff, 0.85);
    g.fillRoundedRect(2, 2, 18, 12, 1);
    // Scanline hint
    g.lineStyle(1, 0xffffff, 0.25);
    g.lineBetween(3, 6, 19, 6);
    g.lineBetween(3, 9, 19, 9);
    // Stand
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(9, 15, 4, 3);
  }

  private drawWaterCooler(g: Phaser.GameObjects.Graphics): void {
    // Jug
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(3, 0, 20, 18, 4);
    g.fillStyle(0x88c8ff, 0.75);
    g.fillRoundedRect(5, 3, 16, 13, 3);
    // Bubble
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(11, 8, 2);
    // Base
    g.fillStyle(0x7a8090, 1);
    g.fillRoundedRect(0, 18, 26, 18, 2);
    g.fillStyle(0x5a6070, 1);
    g.fillRect(11, 24, 4, 5); // spigot
  }

  private drawPlant(g: Phaser.GameObjects.Graphics): void {
    // Pot
    g.fillStyle(0x6b3e1a, 1);
    g.fillTriangle(9, 20, 21, 20, 22, 30);
    g.fillTriangle(9, 20, 22, 30, 8, 30);
    // Leaves
    g.fillStyle(0x2e7a3a, 1);
    g.fillCircle(15, 13, 11);
    g.fillStyle(0x3e9a4a, 1);
    g.fillCircle(10, 11, 6);
    g.fillCircle(20, 11, 6);
    g.fillCircle(15, 6, 6);
    // Highlights
    g.fillStyle(0x6abd5a, 1);
    g.fillCircle(11, 9, 2);
    g.fillCircle(19, 9, 2);
  }

  private drawCoffeeMachine(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x2a2a2a, 1);
    g.fillRoundedRect(0, 0, 28, 32, 3);
    g.fillStyle(0x4a4a4a, 1);
    g.fillRoundedRect(2, 2, 24, 14, 2);
    // Display
    g.fillStyle(0xff5252, 1);
    g.fillRect(6, 6, 16, 4);
    // Spout
    g.fillStyle(0x6b6b6b, 1);
    g.fillRect(11, 16, 6, 4);
    // Tray
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(4, 20, 20, 10, 2);
    // Cup
    g.fillStyle(0xffffff, 1);
    g.fillRect(11, 22, 6, 7);
    g.fillStyle(0x6b3e1a, 1);
    g.fillRect(12, 24, 4, 5);
  }
}
