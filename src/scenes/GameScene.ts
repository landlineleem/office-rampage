import Phaser from "phaser";
import { SideScrollerPlayer, type PlayerKeys } from "../core/SideScrollerPlayer";
import { Pistol, GuardGun } from "../modes/office-sidescroller/weapons";
import { SecurityGuard } from "../modes/office-sidescroller/enemies";
import { lobbyLevel, type LevelData } from "../modes/office-sidescroller/lobby-level";
import { SideScrollerConfig } from "../modes/office-sidescroller/config";
import { ComboSystem } from "../core/ComboSystem";
import { HUD } from "../ui/HUD";

export class GameScene extends Phaser.Scene {
  private player!: SideScrollerPlayer;
  private pistol!: Pistol;
  private guardGun!: GuardGun;
  private guards!: Phaser.Physics.Arcade.Group;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private lowObstacles!: Phaser.Physics.Arcade.StaticGroup;
  private elevator!: Phaser.Physics.Arcade.Sprite;
  private combo!: ComboSystem;
  private hud!: HUD;
  private keys!: PlayerKeys;
  private level!: LevelData;
  private caffeineMs = SideScrollerConfig.caffeine.maxMs;
  private slowMoActive = false;
  private withdrawalUntil = 0;
  private cleared = false;

  constructor() {
    super({ key: "Game" });
  }

  create(): void {
    this.level = lobbyLevel;
    const lvl = this.level;

    this.caffeineMs = SideScrollerConfig.caffeine.maxMs;
    this.slowMoActive = false;
    this.withdrawalUntil = 0;
    this.cleared = false;

    this.physics.world.setBounds(0, 0, lvl.width, lvl.height);
    this.cameras.main.setBounds(0, 0, lvl.width, lvl.height);
    this.cameras.main.setBackgroundColor("#0c0d11");

    this.buildBackground(lvl);
    this.buildGroundAndFloor(lvl);
    this.buildExteriorDecor(lvl);
    this.buildInteriorDecor(lvl);
    this.buildPlatforms(lvl);
    this.buildLowObstacles(lvl);
    this.buildElevator(lvl);

    this.combo = new ComboSystem();
    this.player = new SideScrollerPlayer(this, lvl.playerStart.x, lvl.playerStart.y);
    this.pistol = new Pistol(this);
    this.guardGun = new GuardGun(this);

    this.guards = this.physics.add.group({ classType: SecurityGuard, runChildUpdate: false });
    for (const e of lvl.enemies) {
      if (e.type === "guard") {
        const guard = new SecurityGuard(this, e.x, e.y, this.guardGun);
        this.guards.add(guard);
      }
    }

    // --- Colliders ---
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.guards, this.platforms);
    // Low obstacles ONLY collide with the player when they're NOT sliding
    this.physics.add.collider(
      this.player,
      this.lowObstacles,
      undefined,
      (p) => {
        const pl = p as SideScrollerPlayer;
        return !pl.isSliding;
      },
      this
    );
    this.physics.add.collider(this.guards, this.lowObstacles);
    this.physics.add.collider(this.pistol.bullets, this.platforms, (bullet) => {
      this.pistol.recycle(bullet as Phaser.Physics.Arcade.Sprite);
    });
    this.physics.add.collider(this.guardGun.bullets, this.platforms, (bullet) => {
      this.guardGun.recycle(bullet as Phaser.Physics.Arcade.Sprite);
    });

    // Bullet → enemy
    this.physics.add.overlap(this.pistol.bullets, this.guards, (bullet, enemy) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      const e = enemy as SecurityGuard;
      this.pistol.recycle(b);
      if (e.damage()) {
        e.destroy();
        this.combo.registerKill(this.time.now);
        this.caffeineMs = Math.min(
          SideScrollerConfig.caffeine.maxMs,
          this.caffeineMs + SideScrollerConfig.caffeine.killRefillMs
        );
      }
    });

    // Guard bullets → player
    this.physics.add.overlap(this.player, this.guardGun.bullets, (_pl, bullet) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      this.guardGun.recycle(b);
      if (this.player.takeDamage(this.time.now)) {
        this.combo.break();
        if (this.player.hp <= 0) this.onPlayerDeath();
      }
    });

    // Enemy contact damage
    this.physics.add.overlap(this.player, this.guards, (_pl, enemy) => {
      const e = enemy as SecurityGuard;
      const now = this.time.now;
      if (now - e.lastContact < SideScrollerConfig.guard.contactCooldownMs) return;
      e.lastContact = now;
      if (this.player.takeDamage(now)) {
        this.combo.break();
        if (this.player.hp <= 0) this.onPlayerDeath();
      }
    });

    // Elevator trigger
    this.physics.add.overlap(this.player, this.elevator, () => {
      if (this.cleared) return;
      this.cleared = true;
      this.scene.start("LevelCleared", {
        wave: 1,
        kills: this.combo.totalKills,
        best: this.combo.best,
        score: this.combo.score,
      });
    });

    this.hud = new HUD(this);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -200, 0);

    this.keys = this.input.keyboard!.addKeys("A,D,SPACE,SHIFT,E") as PlayerKeys;
    this.input.mouse?.disableContextMenu();
  }

  override update(time: number, delta: number): void {
    if (this.player.hp <= 0 || this.cleared) return;

    // --- Slow-mo on E ---
    const inWithdrawal = time < this.withdrawalUntil;
    const wantSlow = this.keys.E.isDown;
    if (wantSlow && this.caffeineMs > 0 && !inWithdrawal) {
      this.slowMoActive = true;
      this.caffeineMs -= delta;
      if (this.caffeineMs <= 0) {
        this.caffeineMs = 0;
        this.slowMoActive = false;
        this.withdrawalUntil = time + SideScrollerConfig.caffeine.withdrawalMs;
      }
    } else {
      this.slowMoActive = false;
    }

    const worldFactor = this.slowMoActive ? SideScrollerConfig.caffeine.slowFactor : 1;
    this.physics.world.timeScale = 1 / worldFactor; // higher timeScale = slower
    // Player isn't slowed (caffeine = subjective time speedup for the player)
    // But scaling the world via timeScale slows the player too. So we apply a
    // counter-boost to the player's body so the player keeps moving at normal
    // pace from their POV.

    const pointer = this.input.activePointer;
    this.player.updateInput(
      time,
      delta,
      this.keys,
      pointer,
      inWithdrawal // suppress input during withdrawal stumble
    );

    // Counter-boost the player so they move at normal speed in slow-mo
    if (this.slowMoActive) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(body.velocity.x / worldFactor, body.velocity.y / worldFactor);
    }

    // Shoot (hold-to-fire)
    if (pointer.leftButtonDown() && !this.player.isSliding) {
      const fired = this.pistol.tryFire(
        time,
        this.player.shoulderX,
        this.player.shoulderY,
        this.player.aimAngle
      );
      if (fired) this.player.flashMuzzle(time);
    }

    // Enemy AI
    this.guards.getChildren().forEach((c) => {
      const g = c as SecurityGuard;
      if (!g.active) return;
      g.think(time, delta, this.player.x, this.player.y, worldFactor);
    });

    this.combo.update(time);
    this.hud.update(
      this.player.hp,
      this.caffeineMs,
      this.combo.count,
      1,
      this.combo.score,
      inWithdrawal
    );
  }

  // ---------- Setup helpers ----------
  private buildBackground(lvl: LevelData): void {
    // Sky gradient stretched across the full level
    const sky = this.add.tileSprite(0, 0, lvl.width, 360, "sky_gradient");
    sky.setOrigin(0, 0);
    sky.setScrollFactor(0.1);

    // Parallax skyline (far)
    const back = this.add.tileSprite(0, 180, lvl.width, 200, "skyline_back");
    back.setOrigin(0, 0);
    back.setScrollFactor(0.3);

    // Parallax skyline (near)
    const front = this.add.tileSprite(0, 200, lvl.width, 240, "skyline_front");
    front.setOrigin(0, 0);
    front.setScrollFactor(0.55);

    // Interior wall behind lobby zone
    const wallStart = lvl.exteriorEndX;
    const wallW = lvl.width - wallStart;
    const lobbyWall = this.add.tileSprite(
      wallStart,
      0,
      wallW,
      lvl.groundY,
      "lobby_wall"
    );
    lobbyWall.setOrigin(0, 0);
    lobbyWall.setScrollFactor(0.7);
  }

  private buildGroundAndFloor(lvl: LevelData): void {
    this.platforms = this.physics.add.staticGroup();

    // Visual floor — tiled pavement outside, marble inside
    const pavement = this.add.tileSprite(
      0,
      lvl.groundY,
      lvl.exteriorEndX,
      lvl.height - lvl.groundY,
      "pavement_tile"
    );
    pavement.setOrigin(0, 0);

    const marble = this.add.tileSprite(
      lvl.exteriorEndX,
      lvl.groundY,
      lvl.width - lvl.exteriorEndX,
      lvl.height - lvl.groundY,
      "marble_tile"
    );
    marble.setOrigin(0, 0);

    // Invisible ground collider — one big static body
    const ground = this.add.rectangle(
      lvl.width / 2,
      lvl.groundY + 16,
      lvl.width,
      32,
      0x000000,
      0
    );
    this.physics.add.existing(ground, true);
    this.platforms.add(ground);
  }

  private buildExteriorDecor(lvl: LevelData): void {
    // Lamppost on the sidewalk
    this.add.image(180, lvl.groundY - 90, "lamppost").setOrigin(0.5, 0.5);
    this.add.image(550, lvl.groundY - 90, "lamppost").setOrigin(0.5, 0.5);
    // Revolving door at the building entrance (visual only — player walks past)
    this.add.image(lvl.exteriorEndX - 50, lvl.groundY - 80, "revolving_door").setOrigin(0.5, 0.5);
  }

  private buildInteriorDecor(lvl: LevelData): void {
    // Columns at decorative intervals inside the lobby
    const colXs = [950, 1450, 2050, 2550];
    for (const x of colXs) {
      this.add.image(x, lvl.groundY - 100, "column").setOrigin(0.5, 0.5);
    }
    // Wall monitors behind reception
    this.add.image(1380, lvl.groundY - 220, "monitor_wall").setOrigin(0.5, 0.5);
    this.add.image(1480, lvl.groundY - 220, "monitor_wall").setOrigin(0.5, 0.5);
    // Plants scattered
    [880, 1620, 2200, 2860].forEach((x) =>
      this.add.image(x, lvl.groundY - 30, "plant").setOrigin(0.5, 1)
    );
  }

  private buildPlatforms(lvl: LevelData): void {
    for (const p of lvl.platforms) {
      // Visual: pick a texture by size — reception desk for the big one,
      // file cabinet for the tall narrow one. Fallback = grey block.
      let textureKey = "desk";
      if (p.height > p.width) textureKey = "file_cabinet";
      const sprite = this.add.image(p.x, p.y - p.height / 2, textureKey).setOrigin(0.5, 0.5);
      // Resize via display dimensions (textures are pre-sized, but tolerate a
      // bit of stretch)
      sprite.setDisplaySize(p.width, p.height);
      const collider = this.add
        .rectangle(p.x, p.y - p.height / 2, p.width, p.height, 0x000000, 0)
        .setOrigin(0.5, 0.5);
      this.physics.add.existing(collider, true);
      this.platforms.add(collider);
    }
  }

  private buildLowObstacles(lvl: LevelData): void {
    this.lowObstacles = this.physics.add.staticGroup();
    for (const o of lvl.lowObstacles) {
      const sprite = this.add.image(o.x, o.y - o.height / 2, o.textureKey).setOrigin(0.5, 0.5);
      sprite.setDisplaySize(o.width, o.height);
      const collider = this.add
        .rectangle(o.x, o.y - o.height / 2, o.width, o.height, 0x000000, 0)
        .setOrigin(0.5, 0.5);
      this.physics.add.existing(collider, true);
      this.lowObstacles.add(collider);
    }
  }

  private buildElevator(lvl: LevelData): void {
    this.elevator = this.physics.add.sprite(
      lvl.elevator.x,
      lvl.elevator.y - 65,
      "elevator"
    );
    const body = this.elevator.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.elevator.setDepth(5);

    // Floating "GOAL ↑" hint above the elevator
    this.add
      .text(lvl.elevator.x, lvl.elevator.y - 150, "GOAL ▼", {
        fontFamily: "ui-monospace, monospace",
        fontSize: "18px",
        color: "#ffe066",
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  private onPlayerDeath(): void {
    this.scene.start("GameOver", {
      wave: 1,
      kills: this.combo.totalKills,
      best: this.combo.best,
      score: this.combo.score,
    });
  }
}
