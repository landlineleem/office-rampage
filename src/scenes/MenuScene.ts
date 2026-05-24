import Phaser from "phaser";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "Menu" });
  }

  create(): void {
    const { width, height } = this.scale;
    const font = "ui-monospace, monospace";

    // Background — NYC skyline at night, parallaxed in the menu too
    this.add.image(0, 0, "sky_gradient").setOrigin(0, 0).setDisplaySize(width, height);
    this.add
      .tileSprite(0, height - 280, width, 200, "skyline_back")
      .setOrigin(0, 0);
    const front = this.add
      .tileSprite(0, height - 240, width, 240, "skyline_front")
      .setOrigin(0, 0);
    this.tweens.add({
      targets: front,
      tilePositionX: 200,
      duration: 30000,
      repeat: -1,
    });

    // Title
    this.add
      .text(width / 2, height / 2 - 130, "OFFICE RAMPAGE", {
        fontFamily: font,
        fontSize: "56px",
        color: "#ffe066",
        stroke: "#1a1a1a",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 80, "v0.3 · the lobby", {
        fontFamily: font,
        fontSize: "14px",
        color: "#aaa",
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height / 2 - 20,
        "A / D move · SPACE jump · SHIFT slide · MOUSE aim · LMB shoot · E slow-mo",
        { fontFamily: font, fontSize: "13px", color: "#dddddd" }
      )
      .setOrigin(0.5);

    const start = this.add
      .text(width / 2, height / 2 + 40, "▶ CLICK TO START", {
        fontFamily: font,
        fontSize: "24px",
        color: "#4cc4ff",
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: start,
      alpha: 0.35,
      yoyo: true,
      repeat: -1,
      duration: 700,
    });

    this.add
      .text(
        width / 2,
        height - 30,
        "fight your way up from the lobby to the CEO",
        { fontFamily: font, fontSize: "12px", color: "#888" }
      )
      .setOrigin(0.5);

    this.input.once("pointerdown", () => this.scene.start("Game"));
    this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("Game"));
  }
}
