import Phaser from "phaser";

interface ClearData {
  wave: number;
  kills: number;
  best: number;
  score: number;
}

const FONT = "ui-monospace, monospace";

export class LevelClearedScene extends Phaser.Scene {
  constructor() {
    super({ key: "LevelCleared" });
  }

  create(data: ClearData): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add
      .text(cx, cy - 130, "FLOOR CLEARED", {
        fontFamily: FONT,
        fontSize: "44px",
        color: "#6abd5a",
        stroke: "#1a1a1a",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, cy - 75, "Lobby → secured", {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#aaa",
      })
      .setOrigin(0.5);

    const lines = [
      `Kills:      ${data.kills}`,
      `Best combo: x${data.best}`,
      `Score:      ${data.score}`,
    ];
    lines.forEach((s, i) => {
      this.add
        .text(cx, cy - 20 + i * 28, s, {
          fontFamily: FONT,
          fontSize: "18px",
          color: "#dddddd",
        })
        .setOrigin(0.5);
    });

    this.add
      .text(cx, cy + 100, "the next floor is still under construction.", {
        fontFamily: FONT,
        fontSize: "13px",
        color: "#666",
      })
      .setOrigin(0.5);

    const restart = this.add
      .text(cx, cy + 140, "▶ REPLAY LOBBY", {
        fontFamily: FONT,
        fontSize: "22px",
        color: "#4cc4ff",
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: restart,
      alpha: 0.35,
      yoyo: true,
      repeat: -1,
      duration: 700,
    });

    this.input.once("pointerdown", () => this.scene.start("Game"));
    this.input.keyboard?.once("keydown-SPACE", () => this.scene.start("Game"));
  }
}
