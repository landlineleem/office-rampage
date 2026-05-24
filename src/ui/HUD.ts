import Phaser from "phaser";
import { SideScrollerConfig } from "../modes/office-sidescroller/config";

const FONT = "ui-monospace, monospace";

export class HUD {
  private scene: Phaser.Scene;
  private hpIcons: Phaser.GameObjects.Text[] = [];
  private hpBg: Phaser.GameObjects.Rectangle;
  private caffeineLabel: Phaser.GameObjects.Text;
  private caffeineBarBg: Phaser.GameObjects.Rectangle;
  private caffeineBar: Phaser.GameObjects.Rectangle;
  private caffeinePulse: Phaser.GameObjects.Rectangle;
  private comboText: Phaser.GameObjects.Text;
  private comboSubtext: Phaser.GameObjects.Text;
  private floorText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private rightPanel: Phaser.GameObjects.Rectangle;
  private leftPanel: Phaser.GameObjects.Rectangle;
  private prevCombo = 0;
  private prevScore = 0;
  private prevHp: number;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const w = scene.scale.width;
    const z = 1000;
    const max = SideScrollerConfig.player.maxHP;
    this.prevHp = max;

    // --- Left panel (HP + caffeine + combo) ---
    this.leftPanel = scene.add
      .rectangle(0, 0, 280, 130, 0x000000, 0.45)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z - 1);

    this.hpBg = scene.add
      .rectangle(16, 14, 248, 30, 0x1a1d24, 0.6)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z);

    for (let i = 0; i < max; i++) {
      const icon = scene.add
        .text(28 + i * 36, 12, "♥", {
          fontFamily: FONT,
          fontSize: "28px",
          color: "#ff5252",
        })
        .setScrollFactor(0)
        .setDepth(z + 1);
      this.hpIcons.push(icon);
    }

    this.caffeineLabel = scene.add
      .text(16, 52, "CAFFEINE", {
        fontFamily: FONT,
        fontSize: "10px",
        color: "#aaa",
        letterSpacing: 2,
      })
      .setScrollFactor(0)
      .setDepth(z + 1);

    this.caffeineBarBg = scene.add
      .rectangle(16, 68, 248, 16, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z);

    this.caffeineBar = scene.add
      .rectangle(18, 70, 244, 12, 0xc78c3a)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z + 1);

    // Subtle pulsing highlight on the caffeine bar
    this.caffeinePulse = scene.add
      .rectangle(18, 70, 244, 12, 0xffd680, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z + 2);
    scene.tweens.add({
      targets: this.caffeinePulse,
      fillAlpha: 0.25,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: "Sine.easeInOut",
    });

    this.comboText = scene.add
      .text(16, 96, "", {
        fontFamily: FONT,
        fontSize: "24px",
        color: "#ffe066",
        stroke: "#1a1d24",
        strokeThickness: 3,
      })
      .setScrollFactor(0)
      .setDepth(z + 2);

    this.comboSubtext = scene.add
      .text(170, 110, "", {
        fontFamily: FONT,
        fontSize: "10px",
        color: "#888",
        letterSpacing: 1,
      })
      .setScrollFactor(0)
      .setDepth(z + 2);

    // --- Right panel (Floor + score) ---
    this.rightPanel = scene.add
      .rectangle(w - 240, 0, 240, 80, 0x000000, 0.45)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z - 1);

    this.floorText = scene.add
      .text(w - 16, 12, "", {
        fontFamily: FONT,
        fontSize: "22px",
        color: "#ffffff",
        stroke: "#1a1d24",
        strokeThickness: 2,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(z + 1);

    this.scoreText = scene.add
      .text(w - 16, 44, "", {
        fontFamily: FONT,
        fontSize: "20px",
        color: "#ffe066",
        stroke: "#1a1d24",
        strokeThickness: 2,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(z + 1);
  }

  update(
    hp: number,
    caffeineMs: number,
    combo: number,
    floor: number,
    score: number,
    inWithdrawal: boolean
  ): void {
    // HP — hearts flash red + shake on damage
    if (hp < this.prevHp) {
      for (const icon of this.hpIcons) {
        this.scene.tweens.add({
          targets: icon,
          x: icon.x + 4,
          yoyo: true,
          repeat: 3,
          duration: 30,
        });
      }
    }
    this.prevHp = hp;
    for (let i = 0; i < this.hpIcons.length; i++) {
      const alive = i < hp;
      this.hpIcons[i].setText(alive ? "♥" : "♡");
      this.hpIcons[i].setColor(alive ? "#ff5252" : "#5a3030");
      this.hpIcons[i].setAlpha(alive ? 1 : 0.45);
    }

    // Caffeine bar — width pct, color shifts on withdrawal
    const pct = Phaser.Math.Clamp(caffeineMs / SideScrollerConfig.caffeine.maxMs, 0, 1);
    this.caffeineBar.width = 244 * pct;
    this.caffeinePulse.width = 244 * pct;
    if (inWithdrawal) {
      this.caffeineBar.fillColor = 0x5a3030;
      this.caffeineLabel.setColor("#aa4444");
    } else {
      // Color gradient: low caffeine = red, mid = warm orange, high = gold
      const lowColor = 0xc73a3a;
      const midColor = 0xc78c3a;
      const hiColor = 0xe8b33a;
      let color = lowColor;
      if (pct > 0.7) color = hiColor;
      else if (pct > 0.3) color = midColor;
      this.caffeineBar.fillColor = color;
      this.caffeineLabel.setColor("#aaa");
    }

    // Combo — scale punch on increment, glow on high streaks
    if (combo > this.prevCombo && combo > 1) {
      const target = this.comboText;
      this.scene.tweens.add({
        targets: target,
        scaleX: 1.35,
        scaleY: 1.35,
        yoyo: true,
        duration: 80,
        ease: "Cubic.easeOut",
      });
    }
    this.prevCombo = combo;
    if (combo > 1) {
      this.comboText.setText(`x${combo}`);
      this.comboSubtext.setText("COMBO");
      // Color tier
      if (combo >= 10) this.comboText.setColor("#ff8030");
      else if (combo >= 5) this.comboText.setColor("#ffe066");
      else this.comboText.setColor("#dddddd");
    } else {
      this.comboText.setText("");
      this.comboSubtext.setText("");
    }

    // Floor + Score
    this.floorText.setText(`FLOOR ${floor}`);

    if (score > this.prevScore) {
      this.scene.tweens.add({
        targets: this.scoreText,
        scaleX: 1.15,
        scaleY: 1.15,
        yoyo: true,
        duration: 90,
        ease: "Cubic.easeOut",
      });
    }
    this.prevScore = score;
    this.scoreText.setText(`SCORE  ${score.toString().padStart(5, "0")}`);
  }

  // Show a brief notification at the top of the screen (e.g. "FLOOR CLEARED")
  showBanner(text: string, durationMs = 1600): void {
    const w = this.scene.scale.width;
    const banner = this.scene.add
      .text(w / 2, 100, text, {
        fontFamily: FONT,
        fontSize: "36px",
        color: "#ffe066",
        stroke: "#1a1d24",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1600)
      .setAlpha(0);
    this.scene.tweens.add({
      targets: banner,
      alpha: 1,
      y: 110,
      duration: 220,
      ease: "Cubic.easeOut",
      onComplete: () => {
        this.scene.time.delayedCall(durationMs, () => {
          this.scene.tweens.add({
            targets: banner,
            alpha: 0,
            y: 70,
            duration: 350,
            onComplete: () => banner.destroy(),
          });
        });
      },
    });
  }

  // Hide all HUD elements
  setVisible(visible: boolean): void {
    [
      this.leftPanel,
      this.rightPanel,
      this.hpBg,
      ...this.hpIcons,
      this.caffeineLabel,
      this.caffeineBarBg,
      this.caffeineBar,
      this.caffeinePulse,
      this.comboText,
      this.comboSubtext,
      this.floorText,
      this.scoreText,
    ].forEach((o) => o.setVisible(visible));
  }
}
