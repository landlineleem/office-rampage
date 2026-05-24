import Phaser from "phaser";
import { SideScrollerConfig } from "../modes/office-sidescroller/config";

const FONT = "ui-monospace, monospace";

export class HUD {
  private scene: Phaser.Scene;
  private hpLabel: Phaser.GameObjects.Text;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBar: Phaser.GameObjects.Rectangle;
  private hpBarPulse: Phaser.GameObjects.Rectangle;
  private hpValueText: Phaser.GameObjects.Text;
  private caffeineLabel: Phaser.GameObjects.Text;
  private caffeineBarBg: Phaser.GameObjects.Rectangle;
  private caffeineBar: Phaser.GameObjects.Rectangle;
  private caffeinePulse: Phaser.GameObjects.Rectangle;
  private comboText: Phaser.GameObjects.Text;
  private comboSubtext: Phaser.GameObjects.Text;
  private weaponText: Phaser.GameObjects.Text;
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

    // --- Left panel (HP + caffeine + combo + weapon) ---
    this.leftPanel = scene.add
      .rectangle(0, 0, 280, 158, 0x000000, 0.45)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z - 1);

    this.hpLabel = scene.add
      .text(16, 12, "HP", {
        fontFamily: FONT,
        fontSize: "10px",
        color: "#aaa",
        letterSpacing: 2,
      })
      .setScrollFactor(0)
      .setDepth(z + 1);

    this.hpBarBg = scene.add
      .rectangle(16, 28, 248, 18, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z);

    this.hpBar = scene.add
      .rectangle(18, 30, 244, 14, 0x6abd5a)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z + 1);

    // Pulsing overlay used when HP is low
    this.hpBarPulse = scene.add
      .rectangle(18, 30, 244, 14, 0xff8080, 0)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z + 2);

    this.hpValueText = scene.add
      .text(260, 28, `${max}`, {
        fontFamily: FONT,
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(z + 2);

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

    this.weaponText = scene.add
      .text(16, 134, "▸ STAPLER", {
        fontFamily: FONT,
        fontSize: "13px",
        color: "#e8b33a",
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
    // HP bar — width = hp%, color from green → yellow → red, pulse low
    const max = SideScrollerConfig.player.maxHP;
    const pct = Phaser.Math.Clamp(hp / max, 0, 1);
    this.hpBar.width = 244 * pct;
    this.hpBarPulse.width = 244 * pct;
    // Color tier
    let color = 0x6abd5a; // green
    if (pct <= 0.25) color = 0xc73a3a;
    else if (pct <= 0.55) color = 0xe8b33a;
    this.hpBar.fillColor = color;
    this.hpValueText.setText(`${hp}/${max}`);

    // Damage feedback: punch the bar + label when HP drops
    if (hp < this.prevHp) {
      this.scene.tweens.add({
        targets: [this.hpBar, this.hpBarBg, this.hpValueText, this.hpLabel],
        x: "+=4",
        yoyo: true,
        repeat: 2,
        duration: 30,
      });
    }
    this.prevHp = hp;

    // Low-HP danger pulse
    if (pct <= 0.3 && pct > 0) {
      const pulse = 0.4 + Math.sin(this.scene.time.now * 0.012) * 0.4;
      this.hpBarPulse.fillAlpha = Math.max(0, pulse);
    } else {
      this.hpBarPulse.fillAlpha = 0;
    }

    // Caffeine bar — width pct, color shifts on withdrawal
    const caffPct = Phaser.Math.Clamp(caffeineMs / SideScrollerConfig.caffeine.maxMs, 0, 1);
    this.caffeineBar.width = 244 * caffPct;
    this.caffeinePulse.width = 244 * caffPct;
    if (inWithdrawal) {
      this.caffeineBar.fillColor = 0x5a3030;
      this.caffeineLabel.setColor("#aa4444");
    } else {
      // Color gradient: low caffeine = red, mid = warm orange, high = gold
      const lowColor = 0xc73a3a;
      const midColor = 0xc78c3a;
      const hiColor = 0xe8b33a;
      let caffColor = lowColor;
      if (caffPct > 0.7) caffColor = hiColor;
      else if (caffPct > 0.3) caffColor = midColor;
      this.caffeineBar.fillColor = caffColor;
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

  // ---------- Boss HP bar ----------
  private bossLabel?: Phaser.GameObjects.Text;
  private bossBarBg?: Phaser.GameObjects.Rectangle;
  private bossBar?: Phaser.GameObjects.Rectangle;

  showBossBar(name: string): void {
    if (this.bossLabel) return;
    const w = this.scene.scale.width;
    const z = 1100;
    this.bossLabel = this.scene.add
      .text(w / 2, 16, name.toUpperCase(), {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#ffe066",
        stroke: "#1a1d24",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(z);
    this.bossBarBg = this.scene.add
      .rectangle(w / 2 - 200, 40, 400, 16, 0x000000, 0.7)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z - 1);
    this.bossBar = this.scene.add
      .rectangle(w / 2 - 198, 42, 396, 12, 0xc73a3a)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(z);
  }

  updateBossBar(pct: number): void {
    if (!this.bossBar) return;
    this.bossBar.width = 396 * Phaser.Math.Clamp(pct, 0, 1);
    // Color shifts as boss takes damage
    this.bossBar.fillColor = pct > 0.5 ? 0xc73a3a : pct > 0.2 ? 0xff8030 : 0xffe066;
  }

  hideBossBar(): void {
    this.bossLabel?.destroy();
    this.bossBarBg?.destroy();
    this.bossBar?.destroy();
    this.bossLabel = undefined;
    this.bossBarBg = undefined;
    this.bossBar = undefined;
  }

  setWeapon(name: string): void {
    this.weaponText.setText(`▸ ${name}`);
    this.scene.tweens.add({
      targets: this.weaponText,
      scaleX: 1.3,
      scaleY: 1.3,
      yoyo: true,
      duration: 120,
      ease: "Cubic.easeOut",
    });
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
      this.hpLabel,
      this.hpBarBg,
      this.hpBar,
      this.hpBarPulse,
      this.hpValueText,
      this.caffeineLabel,
      this.caffeineBarBg,
      this.caffeineBar,
      this.caffeinePulse,
      this.comboText,
      this.comboSubtext,
      this.weaponText,
      this.floorText,
      this.scoreText,
    ].forEach((o) => o.setVisible(visible));
  }
}
