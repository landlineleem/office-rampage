import Phaser from "phaser";
import { sound } from "../core/Sound";

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

    // Dim backdrop
    this.add
      .rectangle(0, 0, width, height, 0x0c0d11, 0.92)
      .setOrigin(0, 0)
      .setDepth(0);

    const title = this.add
      .text(cx, cy - 130, "GAME OVER", {
        fontFamily: FONT,
        fontSize: "60px",
        color: "#ff5252",
        stroke: "#1a1a1a",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setScale(0.6);
    this.tweens.add({
      targets: title,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 350,
      ease: "Cubic.easeOut",
    });

    this.add
      .text(cx, cy - 75, `cut down on Floor ${data.wave}`, {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5);

    const lines = [
      `KILLS         ${data.kills}`,
      `BEST COMBO    x${data.best}`,
      `SCORE         ${data.score.toString().padStart(5, "0")}`,
    ];
    lines.forEach((s, i) => {
      this.add
        .text(cx, cy - 20 + i * 32, s, {
          fontFamily: FONT,
          fontSize: "20px",
          color: "#dddddd",
        })
        .setOrigin(0.5);
    });

    const button = this.add
      .text(cx, cy + 130, "▶ BACK TO WORK", {
        fontFamily: FONT,
        fontSize: "24px",
        color: "#4cc4ff",
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: button,
      alpha: 0.4,
      yoyo: true,
      repeat: -1,
      duration: 700,
    });

    const restart = (): void => {
      sound.uiClick();
      this.scene.start("Game", { levelIndex: 0 });
    };
    this.input.once("pointerdown", restart);
    this.input.keyboard?.once("keydown-SPACE", restart);
  }
}
