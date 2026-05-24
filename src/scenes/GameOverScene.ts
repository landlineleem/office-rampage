import Phaser from "phaser";

interface GameOverData {
  wave: number;
  kills: number;
  best: number;
  score: number;
}

const FONT = "ui-monospace, monospace";

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOver" });
  }

  create(data: GameOverData): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add
      .text(cx, cy - 110, "GAME OVER", {
        fontFamily: FONT,
        fontSize: "48px",
        color: "#ff5252",
      })
      .setOrigin(0.5);

    const lines = [
      `Wave reached: ${data.wave}`,
      `Kills: ${data.kills}`,
      `Best combo: x${data.best}`,
    ];
    lines.forEach((s, i) => {
      this.add
        .text(cx, cy - 30 + i * 28, s, {
          fontFamily: FONT,
          fontSize: "18px",
          color: "#dddddd",
        })
        .setOrigin(0.5);
    });

    this.add
      .text(cx, cy + 70, `SCORE  ${data.score}`, {
        fontFamily: FONT,
        fontSize: "26px",
        color: "#ffe066",
      })
      .setOrigin(0.5);

    const restart = this.add
      .text(cx, cy + 130, "▶ BACK TO WORK", {
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
