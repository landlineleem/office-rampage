import Phaser from "phaser";
import { sound } from "../core/Sound";
import { saveHighScore } from "../core/HighScore";

interface ClearData {
  levelIndex: number;
  levelName: string;
  hasNext: boolean;
  kills: number;
  best: number;
  score: number;
  unlockedWeapons?: string[];
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
    this.input.setDefaultCursor("default");

    // Persist high score on successful clears too
    saveHighScore({
      score: data.score,
      floor: data.levelIndex + 1,
      bestCombo: data.best,
      kills: data.kills,
      date: new Date().toISOString().slice(0, 10),
    });

    // Fade in (dark backdrop)
    this.add
      .rectangle(0, 0, width, height, 0x0c0d11, 0.85)
      .setOrigin(0, 0)
      .setDepth(0);

    sound.elevatorDing();

    const isVictory = !data.hasNext;
    this.add
      .text(cx, cy - 150, isVictory ? "VICTORY" : "FLOOR CLEARED", {
        fontFamily: FONT,
        fontSize: isVictory ? "64px" : "52px",
        color: isVictory ? "#ffe066" : "#6abd5a",
        stroke: "#1a1a1a",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    this.add
      .text(
        cx,
        cy - 95,
        isVictory
          ? "The CEO has been processed. Casual Friday begins."
          : `${data.levelName} → secured`,
        {
          fontFamily: FONT,
          fontSize: "16px",
          color: "#aaaaaa",
        }
      )
      .setOrigin(0.5);

    const lines = [
      `KILLS         ${data.kills}`,
      `BEST COMBO    x${data.best}`,
      `SCORE         ${data.score.toString().padStart(5, "0")}`,
    ];
    lines.forEach((s, i) => {
      this.add
        .text(cx, cy - 40 + i * 32, s, {
          fontFamily: FONT,
          fontSize: "20px",
          color: "#dddddd",
        })
        .setOrigin(0.5);
    });

    const buttonText = data.hasNext ? "▶ NEXT FLOOR" : "▶ START AGAIN";
    const subtitle = data.hasNext
      ? "elevator going up..."
      : "score saved. press to start a fresh run.";

    this.add
      .text(cx, cy + 80, subtitle, {
        fontFamily: FONT,
        fontSize: "14px",
        color: "#888",
      })
      .setOrigin(0.5);

    const button = this.add
      .text(cx, cy + 130, buttonText, {
        fontFamily: FONT,
        fontSize: "26px",
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

    const advance = (): void => {
      sound.uiClick();
      if (data.hasNext) {
        this.scene.start("Game", {
          levelIndex: data.levelIndex + 1,
          score: data.score,
          kills: data.kills,
          bestCombo: data.best,
          unlockedWeapons: data.unlockedWeapons ?? ["single"],
        });
      } else {
        this.scene.start("Game", { levelIndex: 0 });
      }
    };
    this.input.once("pointerdown", advance);
    this.input.keyboard?.once("keydown-SPACE", advance);
  }
}
