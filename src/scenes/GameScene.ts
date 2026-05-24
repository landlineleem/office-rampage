import Phaser from "phaser";
import { Player, type MoveKeys } from "../core/Player";
import { Stapler } from "../modes/office/weapons";
import { WaveManager } from "../core/WaveManager";
import { ComboSystem } from "../core/ComboSystem";
import { Intern } from "../modes/office/enemies";
import { OfficeConfig } from "../modes/office/config";
import { HUD } from "../ui/HUD";

type Keys = MoveKeys & {
  SPACE: Phaser.Input.Keyboard.Key;
};

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private stapler!: Stapler;
  private waves!: WaveManager;
  private combo!: ComboSystem;
  private hud!: HUD;
  private enemies!: Phaser.Physics.Arcade.Group;
  private keys!: Keys;
  private caffeineMs = OfficeConfig.caffeine.maxMs;
  private slowMoActive = false;
  private withdrawalUntil = 0;

  constructor() {
    super({ key: "Game" });
  }

  create(): void {
    const w = OfficeConfig.arena.width;
    const h = OfficeConfig.arena.height;

    // Reset state on restart (Phaser keeps Scene instances around between starts)
    this.caffeineMs = OfficeConfig.caffeine.maxMs;
    this.slowMoActive = false;
    this.withdrawalUntil = 0;

    // Floor + grid
    this.add.rectangle(0, 0, w, h, 0x232631).setOrigin(0, 0);
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x2c2f3a, 1);
    for (let x = 0; x <= w; x += 64) grid.lineBetween(x, 0, x, h);
    for (let y = 0; y <= h; y += 64) grid.lineBetween(0, y, w, y);

    // Outer walls (visual)
    const wallColor = 0x3a3d48;
    this.add.rectangle(w / 2, 4, w, 8, wallColor);
    this.add.rectangle(w / 2, h - 4, w, 8, wallColor);
    this.add.rectangle(4, h / 2, 8, h, wallColor);
    this.add.rectangle(w - 4, h / 2, 8, h, wallColor);

    this.physics.world.setBounds(0, 0, w, h);

    this.player = new Player(this, w / 2, h / 2);
    this.stapler = new Stapler(this);
    this.enemies = this.physics.add.group({ classType: Intern, runChildUpdate: false });
    this.waves = new WaveManager(this, this.enemies, w, h);
    this.combo = new ComboSystem();
    this.hud = new HUD(this);

    this.cameras.main.setBounds(0, 0, w, h);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);

    this.keys = this.input.keyboard!.addKeys("W,A,S,D,SPACE") as Keys;

    // Bullet → enemy
    this.physics.add.overlap(this.stapler.bullets, this.enemies, (bullet, enemy) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      const e = enemy as Intern;
      this.stapler.recycle(b);
      if (e.damage()) {
        e.destroy();
        this.combo.registerKill(this.time.now);
        this.caffeineMs = Math.min(
          OfficeConfig.caffeine.maxMs,
          this.caffeineMs + OfficeConfig.caffeine.killRefillMs
        );
      }
    });

    // Enemy → player contact damage
    this.physics.add.overlap(this.player, this.enemies, (_pl, enemy) => {
      const e = enemy as Intern;
      const now = this.time.now;
      if (now - e.lastContact < OfficeConfig.intern.contactCooldownMs) return;
      e.lastContact = now;
      if (this.player.takeDamage(now)) {
        this.combo.break();
        if (this.player.hp <= 0) this.onPlayerDeath();
      }
    });

    this.waves.startNextWave(this.time.now);
  }

  private fireAt(wx: number, wy: number): void {
    if (this.player.hp <= 0) return;
    const a = Math.atan2(wy - this.player.y, wx - this.player.x);
    this.stapler.tryFire(this.time.now, this.player.x, this.player.y, a);
  }

  override update(time: number, delta: number): void {
    if (this.player.hp <= 0) return;

    // Slow-mo logic
    const inWithdrawal = time < this.withdrawalUntil;
    const wantSlow = this.keys.SPACE.isDown;
    if (wantSlow && this.caffeineMs > 0 && !inWithdrawal) {
      this.slowMoActive = true;
      this.caffeineMs -= delta;
      if (this.caffeineMs <= 0) {
        this.caffeineMs = 0;
        this.slowMoActive = false;
        this.withdrawalUntil = time + OfficeConfig.caffeine.withdrawalMs;
      }
    } else {
      this.slowMoActive = false;
    }

    const worldFactor = this.slowMoActive ? OfficeConfig.caffeine.slowFactor : 1;
    const playerSpeedFactor = inWithdrawal
      ? OfficeConfig.caffeine.withdrawalSpeedFactor
      : 1;

    this.player.updateMovement(this.keys, playerSpeedFactor);

    const pointer = this.input.activePointer;
    this.player.aimAt(pointer.worldX, pointer.worldY);
    if (pointer.leftButtonDown()) this.fireAt(pointer.worldX, pointer.worldY);

    // Scale enemies + bullets by world factor (cheap manual slow-mo)
    this.enemies.getChildren().forEach((c) => {
      const i = c as Intern;
      if (!i.active) return;
      i.pursue(this.player.x, this.player.y, worldFactor);
    });
    this.stapler.bullets.getChildren().forEach((c) => {
      const b = c as Phaser.Physics.Arcade.Sprite;
      if (!b.active) return;
      const body = b.body as Phaser.Physics.Arcade.Body;
      const sp = OfficeConfig.stapler.bulletSpeed * worldFactor;
      body.setVelocity(Math.cos(b.rotation) * sp, Math.sin(b.rotation) * sp);
    });

    this.combo.update(time);
    this.waves.update(time);
    this.hud.update(
      this.player.hp,
      this.caffeineMs,
      this.combo.count,
      this.waves.wave,
      this.combo.score,
      inWithdrawal
    );
  }

  private onPlayerDeath(): void {
    this.scene.start("GameOver", {
      wave: this.waves.wave,
      kills: this.combo.totalKills,
      best: this.combo.best,
      score: this.combo.score,
    });
  }
}
