import Phaser from "phaser";
import { SideScrollerConfig } from "../modes/office-sidescroller/config";

const FONT = "ui-monospace, monospace";

export class HUD {
  hpText: Phaser.GameObjects.Text;
  caffeineBarBg: Phaser.GameObjects.Rectangle;
  caffeineBar: Phaser.GameObjects.Rectangle;
  caffeineLabel: Phaser.GameObjects.Text;
  comboText: Phaser.GameObjects.Text;
  floorText: Phaser.GameObjects.Text;
  scoreText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const w = scene.scale.width;
    const z = 1000;

    this.hpText = scene.add
      .text(16, 12, "", { fontFamily: FONT, fontSize: "20px", color: "#ff8a8a" })
      .setScrollFactor(0)
      .setDepth(z);

    this.caffeineLabel = scene.add
      .text(16, 44, "CAFFEINE  ·  hold E", {
        fontFamily: FONT,
        fontSize: "11px",
        color: "#aaa",
      })
      .setScrollFactor(0)
      .setDepth(z);

    this.caffeineBarBg = scene.add
      .rectangle(16, 60, 220, 14, 0x000000, 0.55)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z);

    this.caffeineBar = scene.add
      .rectangle(16, 60, 220, 14, 0xa66635)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z);

    this.comboText = scene.add
      .text(16, 82, "", { fontFamily: FONT, fontSize: "22px", color: "#ffe066" })
      .setScrollFactor(0)
      .setDepth(z);

    this.floorText = scene.add
      .text(w - 16, 12, "", { fontFamily: FONT, fontSize: "22px", color: "#ffffff" })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(z);

    this.scoreText = scene.add
      .text(w - 16, 44, "", { fontFamily: FONT, fontSize: "16px", color: "#cccccc" })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(z);
  }

  update(
    hp: number,
    caffeineMs: number,
    combo: number,
    floor: number,
    score: number,
    inWithdrawal: boolean
  ): void {
    const max = SideScrollerConfig.player.maxHP;
    this.hpText.setText(
      "♥".repeat(Math.max(0, hp)) + "♡".repeat(Math.max(0, max - hp))
    );
    const pct = Phaser.Math.Clamp(caffeineMs / SideScrollerConfig.caffeine.maxMs, 0, 1);
    this.caffeineBar.width = 220 * pct;
    this.caffeineBar.fillColor = inWithdrawal ? 0x555555 : 0xa66635;
    this.comboText.setText(combo > 1 ? `x${combo} COMBO` : "");
    this.floorText.setText(`FLOOR ${floor}`);
    this.scoreText.setText(`SCORE ${score}`);
  }
}
