import Phaser from "phaser";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "Menu" });
  }

  create(): void {
    const { width, height } = this.scale;
    const font = "ui-monospace, monospace";

    this.add
      .text(width / 2, height / 2 - 80, "OFFICE RAMPAGE", {
        fontFamily: font,
        fontSize: "48px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 20, "v0.1 · placeholder art", {
        fontFamily: font,
        fontSize: "14px",
        color: "#777",
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height / 2 + 30,
        "WASD move · Mouse aim · LMB shoot · SPACE slow-mo",
        { fontFamily: font, fontSize: "16px", color: "#dddddd" }
      )
      .setOrigin(0.5);

    const start = this.add
      .text(width / 2, height / 2 + 90, "▶ CLICK TO START", {
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

    this.input.once("pointerdown", () => this.scene.start("Game"));
    this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("Game"));
  }
}
