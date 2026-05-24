import Phaser from "phaser";
import { SideScrollerPlayer, type PlayerKeys } from "../core/SideScrollerPlayer";
import { Pistol, GuardGun } from "../modes/office-sidescroller/weapons";
import { SecurityGuard } from "../modes/office-sidescroller/enemies";
import { Corpse } from "../modes/office-sidescroller/Corpse";
import type { LevelData } from "../modes/office-sidescroller/lobby-level";
import { getLevel, hasNextLevel } from "../modes/office-sidescroller/levels";
import { SideScrollerConfig } from "../modes/office-sidescroller/config";
import { ComboSystem } from "../core/ComboSystem";
import { HUD } from "../ui/HUD";
import { sound } from "../core/Sound";
import { Particles } from "../core/Particles";
import { HitFx } from "../core/HitFx";

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
  private particles!: Particles;
  private fx!: HitFx;
  private corpses!: Phaser.Physics.Arcade.Group;
  private vignette!: Phaser.GameObjects.Image;
  private slowMoTint!: Phaser.GameObjects.Rectangle;
  private keys!: PlayerKeys;
  private level!: LevelData;
  private caffeineMs = SideScrollerConfig.caffeine.maxMs;
  private slowMoActive = false;
  private withdrawalUntil = 0;
  private cleared = false;
  private levelIndex = 0;
  private inheritedScore = 0;
  private inheritedKills = 0;
  private inheritedBestCombo = 0;

  constructor() {
    super({ key: "Game" });
  }

  init(data: {
    levelIndex?: number;
    score?: number;
    kills?: number;
    bestCombo?: number;
  }): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.inheritedScore = data.score ?? 0;
    this.inheritedKills = data.kills ?? 0;
    this.inheritedBestCombo = data.bestCombo ?? 0;
  }

  create(): void {
    this.level = getLevel(this.levelIndex);
    const lvl = this.level;

    this.caffeineMs = SideScrollerConfig.caffeine.maxMs;
    this.slowMoActive = false;
    this.withdrawalUntil = 0;
    this.cleared = false;
    // Reset any global state that survives between scene restarts
    sound.setSlowMo(false);
    this.physics.world.timeScale = 1;

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
    this.combo.score = this.inheritedScore;
    this.combo.totalKills = this.inheritedKills;
    this.combo.best = this.inheritedBestCombo;
    this.particles = new Particles(this);
    this.fx = new HitFx(this);
    this.player = new SideScrollerPlayer(this, lvl.playerStart.x, lvl.playerStart.y);
    this.pistol = new Pistol(this);
    this.guardGun = new GuardGun(this);

    this.guards = this.physics.add.group({ classType: SecurityGuard, runChildUpdate: false });
    this.corpses = this.physics.add.group({ classType: Corpse, runChildUpdate: false });
    for (const e of lvl.enemies) {
      if (e.type === "guard") {
        // Spawn slightly above ground so gravity drops them onto it.
        const guard = new SecurityGuard(this, e.x, lvl.groundY - 4, this.guardGun);
        this.guards.add(guard);
      }
    }

    // --- Colliders ---
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.guards, this.platforms);
    this.physics.add.collider(this.corpses, this.platforms);
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
      const hx = b.x;
      const hy = b.y;
      // Capture bullet travel direction before recycling resets velocity.
      const bulletBody = b.body as Phaser.Physics.Arcade.Body;
      const hitDir = bulletBody.velocity.x >= 0 ? 1 : -1;
      this.pistol.recycle(b);
      sound.hit();
      this.particles.impactSparks(hx, hy, 6);
      this.particles.playerHit(hx, hy);
      if (e.damage()) {
        const dx = e.x;
        const dy = e.y;
        const eFacingRight = e.facingRight;
        e.destroy();
        sound.death();
        this.particles.guardDeath(dx, dy - 60);
        this.fx.guardKill();
        // Spawn ragdoll corpse
        const corpse = new Corpse(this, dx, dy, "guard_idle", hitDir, eFacingRight);
        this.corpses.add(corpse);
        this.combo.registerKill(this.time.now);
        this.caffeineMs = Math.min(
          SideScrollerConfig.caffeine.maxMs,
          this.caffeineMs + SideScrollerConfig.caffeine.killRefillMs
        );
      } else {
        this.fx.guardHit();
      }
    });

    // Guard bullets → player
    this.physics.add.overlap(this.player, this.guardGun.bullets, (_pl, bullet) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      const hx = b.x;
      const hy = b.y;
      this.guardGun.recycle(b);
      if (this.player.takeDamage(this.time.now)) {
        sound.playerHurt();
        this.particles.playerHit(hx, hy);
        this.fx.playerHurt();
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
        sound.playerHurt();
        this.fx.playerHurt();
        this.combo.break();
        if (this.player.hp <= 0) this.onPlayerDeath();
      }
    });

    // Elevator trigger — runs the transition animation, then advances
    this.physics.add.overlap(this.player, this.elevator, () => {
      if (this.cleared) return;
      this.cleared = true;
      this.runElevatorTransition();
    });

    this.hud = new HUD(this);

    // --- Post-fx overlays ---
    // Vignette darkens screen edges during slow-mo.
    this.vignette = this.add.image(0, 0, "vignette");
    this.vignette.setOrigin(0, 0);
    this.vignette.setScrollFactor(0);
    this.vignette.setDepth(1400);
    this.vignette.setAlpha(0);

    // Slight cool color tint to suggest time bending.
    this.slowMoTint = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x88ddff, 0);
    this.slowMoTint.setOrigin(0, 0);
    this.slowMoTint.setScrollFactor(0);
    this.slowMoTint.setDepth(1399);
    this.slowMoTint.setBlendMode(Phaser.BlendModes.OVERLAY);

    // Camera focuses slightly above the player's feet so the player sits
    // roughly at the lower-third of the screen with headroom for jumps.
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -150, 80);

    this.keys = this.input.keyboard!.addKeys("W,A,S,D,SPACE") as PlayerKeys;
    this.input.mouse?.disableContextMenu();

    // Floor intro banner
    this.hud.showBanner(`FLOOR ${this.levelIndex + 1} · ${this.level.name.toUpperCase()}`, 1600);
  }

  override update(time: number, delta: number): void {
    if (this.player.hp <= 0 || this.cleared) return;

    // --- Slow-mo on SPACE ---
    const inWithdrawal = time < this.withdrawalUntil;
    const wantSlow = this.keys.SPACE.isDown;
    const previouslySlow = this.slowMoActive;
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
    if (previouslySlow !== this.slowMoActive) {
      sound.setSlowMo(this.slowMoActive);
      if (this.slowMoActive) this.fx.slowMoEnter();
      // Tween the vignette + tint overlays in/out
      this.tweens.add({
        targets: this.vignette,
        alpha: this.slowMoActive ? 1 : 0,
        duration: 220,
      });
      this.tweens.add({
        targets: this.slowMoTint,
        fillAlpha: this.slowMoActive ? 0.25 : 0,
        duration: 220,
      });
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
      if (fired) {
        this.player.flashMuzzle(time);
        // Muzzle flash particles at the spawn point (a bit in front of the
        // shoulder), not at the gun-arm tip.
        const off = SideScrollerConfig.pistol.spawnOffset;
        const mx = this.player.shoulderX + Math.cos(this.player.aimAngle) * off;
        const my = this.player.shoulderY + Math.sin(this.player.aimAngle) * off;
        this.particles.muzzleFlash(mx, my, this.player.aimAngle);
        this.particles.smokePuff(mx, my, 1);
      }
    }

    // Slide dust trail behind sliding player
    if (this.player.isSliding && time % 80 < 16) {
      this.particles.slideDust(
        this.player.x,
        this.player.y - 4,
        this.player.facingRight ? 1 : -1
      );
    }

    // Enemy AI
    this.guards.getChildren().forEach((c) => {
      const g = c as SecurityGuard;
      if (!g.active) return;
      g.think(time, delta, this.player.x, this.player.y, worldFactor);
    });

    // Bullet trail visuals follow each active projectile
    this.pistol.update();
    this.guardGun.update();

    this.combo.update(time);
    this.hud.update(
      this.player.hp,
      this.caffeineMs,
      this.combo.count,
      this.levelIndex + 1,
      this.combo.score,
      inWithdrawal
    );
  }

  // ---------- Setup helpers ----------
  private buildBackground(lvl: LevelData): void {
    // Sky gradient stretched across the full level (always shown — gives
    // any windows / glass doors something to "see out to")
    const sky = this.add.tileSprite(0, 0, lvl.width, 360, "sky_gradient");
    sky.setOrigin(0, 0);
    sky.setScrollFactor(0.1);

    // Parallax skyline (far + near)
    const back = this.add.tileSprite(0, 180, lvl.width, 240, "skyline_back");
    back.setOrigin(0, 0);
    back.setScrollFactor(0.3);
    const front = this.add.tileSprite(0, 200, lvl.width, 300, "skyline_front");
    front.setOrigin(0, 0);
    front.setScrollFactor(0.55);

    // Interior wall — texture varies by theme
    const wallStart = lvl.exteriorEndX;
    const wallW = lvl.width - wallStart;
    const wallTexture = lvl.theme === "cubicles" ? "cubicle_wall" : "lobby_wall";
    const interiorWall = this.add.tileSprite(wallStart, 0, wallW, lvl.groundY, wallTexture);
    interiorWall.setOrigin(0, 0);
    interiorWall.setScrollFactor(0.85);

    // Cubicle dividers as background decor (parallax slower than walls)
    if (lvl.theme === "cubicles") {
      for (let x = 400; x < lvl.width; x += 520) {
        this.add
          .image(x, lvl.groundY, "cubicle_divider")
          .setOrigin(0.5, 1)
          .setScrollFactor(0.92);
      }
    }
  }

  private buildGroundAndFloor(lvl: LevelData): void {
    this.platforms = this.physics.add.staticGroup();

    // Exterior pavement (only if level has an outdoor section)
    if (lvl.exteriorEndX > 0) {
      const pavement = this.add.tileSprite(
        0,
        lvl.groundY,
        lvl.exteriorEndX,
        lvl.height - lvl.groundY,
        "pavement_tile"
      );
      pavement.setOrigin(0, 0);
    }

    // Interior floor — marble for lobby, carpet for cubicles
    const interiorTexture = lvl.theme === "cubicles" ? "carpet_tile" : "marble_tile";
    const interior = this.add.tileSprite(
      lvl.exteriorEndX,
      lvl.groundY,
      lvl.width - lvl.exteriorEndX,
      lvl.height - lvl.groundY,
      interiorTexture
    );
    interior.setOrigin(0, 0);

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
    if (lvl.exteriorEndX <= 0) return;
    [200, 480, 720].forEach((x) =>
      this.add.image(x, lvl.groundY, "lamppost").setOrigin(0.5, 1)
    );
    this.add.image(lvl.exteriorEndX - 70, lvl.groundY, "revolving_door").setOrigin(0.5, 1);
  }

  private buildInteriorDecor(lvl: LevelData): void {
    if (lvl.theme === "lobby") this.buildLobbyDecor(lvl);
    else this.buildCubiclesDecor(lvl);

    // Ceiling lights — both themes get these
    for (let x = lvl.exteriorEndX + 80; x < lvl.width - 80; x += 220) {
      this.add.image(x, 24, "ceiling_light").setOrigin(0.5, 0);
    }
  }

  private buildLobbyDecor(lvl: LevelData): void {
    const colXs = [1100, 1750, 2400, 3050];
    for (const x of colXs) {
      this.add.image(x, lvl.groundY, "column").setOrigin(0.5, 1);
    }
    this.add.image(1380, lvl.groundY - 360, "monitor_wall").setOrigin(0.5, 0.5);
    this.add.image(1600, lvl.groundY - 360, "monitor_wall").setOrigin(0.5, 0.5);
    this.add.image(2700, lvl.groundY - 360, "monitor_wall").setOrigin(0.5, 0.5);
    [1000, 1980, 2650, 3300].forEach((x) =>
      this.add.image(x, lvl.groundY, "plant").setOrigin(0.5, 1)
    );
  }

  private buildCubiclesDecor(lvl: LevelData): void {
    // Server racks against the back wall
    [500, 1200, 2800, 3600].forEach((x) =>
      this.add.image(x, lvl.groundY, "server_rack").setOrigin(0.5, 1).setScrollFactor(0.95)
    );
    // Office chairs in front of (some) desks
    [1000, 1800, 2600, 3400].forEach((x) =>
      this.add.image(x, lvl.groundY, "office_chair").setOrigin(0.5, 1).setDepth(6)
    );
    // Water coolers
    [350, 3000].forEach((x) =>
      this.add.image(x, lvl.groundY, "water_cooler_2").setOrigin(0.5, 1)
    );
    // A couple of plants for breaks
    [600, 2400].forEach((x) =>
      this.add.image(x, lvl.groundY, "plant").setOrigin(0.5, 1)
    );
  }

  private buildPlatforms(lvl: LevelData): void {
    for (const p of lvl.platforms) {
      // Pick a texture by silhouette: tall-and-narrow = file cabinet, otherwise
      // a reception desk. Position is the platform's *center*, which is below
      // the walkable surface (p.y) by half-height.
      const textureKey = p.height > p.width ? "file_cabinet" : "desk";
      const cy = p.y + p.height / 2;
      this.add.image(p.x, cy, textureKey).setOrigin(0.5, 0.5);
      const collider = this.add
        .rectangle(p.x, cy, p.width, p.height, 0x000000, 0)
        .setOrigin(0.5, 0.5);
      this.physics.add.existing(collider, true);
      this.platforms.add(collider);
    }
  }

  private buildLowObstacles(lvl: LevelData): void {
    this.lowObstacles = this.physics.add.staticGroup();
    for (const o of lvl.lowObstacles) {
      const cy = o.y + o.height / 2;
      this.add.image(o.x, cy, o.textureKey).setOrigin(0.5, 0.5);
      const collider = this.add
        .rectangle(o.x, cy, o.width, o.height, 0x000000, 0)
        .setOrigin(0.5, 0.5);
      this.physics.add.existing(collider, true);
      this.lowObstacles.add(collider);
    }
  }

  private elevatorLeftDoor!: Phaser.GameObjects.Image;
  private elevatorRightDoor!: Phaser.GameObjects.Image;

  private buildElevator(lvl: LevelData): void {
    // Frame (no doors baked in; doors are separate sprites below)
    this.elevator = this.physics.add.sprite(
      lvl.elevator.x,
      lvl.elevator.y,
      "elevator"
    );
    this.elevator.setOrigin(0.5, 1.0);
    const body = this.elevator.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.elevator.setDepth(5);

    // Door panels — start in OPEN position (slid into the side walls
    // so the cab interior is visible). Animation slides them together.
    const ex = lvl.elevator.x;
    const ey = lvl.elevator.y;
    const doorTop = ey - 236;
    // Open positions: each door tucked off-screen behind its frame side
    this.elevatorLeftDoor = this.add
      .image(ex - 66, doorTop, "elevator_door")
      .setOrigin(1, 0)
      .setDepth(6);
    this.elevatorRightDoor = this.add
      .image(ex + 66, doorTop, "elevator_door")
      .setOrigin(0, 0)
      .setFlipX(true)
      .setDepth(6);

    // Floating "GOAL ▼" hint above the elevator
    this.add
      .text(ex, ey - 280, "GOAL ▼", {
        fontFamily: "ui-monospace, monospace",
        fontSize: "18px",
        color: "#ffe066",
        stroke: "#1a1d24",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  private onPlayerDeath(): void {
    this.fx.playerDeath();
    this.time.delayedCall(600, () => {
      this.scene.start("GameOver", {
        wave: this.levelIndex + 1,
        kills: this.combo.totalKills,
        best: this.combo.best,
        score: this.combo.score,
      });
    });
  }

  private runElevatorTransition(): void {
    const ex = this.level.elevator.x;
    const ey = this.level.elevator.y;

    // Player walks into the elevator cab (visual only — input is blocked
    // by `this.cleared = true` in update())
    this.tweens.add({
      targets: this.player,
      x: ex,
      y: ey,
      duration: 500,
      ease: "Cubic.easeOut",
    });
    // Brief player fade as they "step inside"
    this.tweens.add({
      targets: this.player,
      alpha: 0.6,
      duration: 500,
      delay: 200,
    });

    this.hud.showBanner("FLOOR CLEARED", 1400);

    // Doors close after the walk-in
    this.time.delayedCall(550, () => {
      sound.elevatorDing();
      const doorTop = ey - 236;
      // Left door slides right to meet the center
      this.tweens.add({
        targets: this.elevatorLeftDoor,
        x: ex,
        duration: 700,
        ease: "Cubic.easeInOut",
      });
      // Right door slides left to meet the center
      this.tweens.add({
        targets: this.elevatorRightDoor,
        x: ex,
        duration: 700,
        ease: "Cubic.easeInOut",
      });
      // Slight cab shake during close
      this.time.delayedCall(550, () => this.fx.shake(0.004, 200));
      // Mark doorTop as referenced for readability
      void doorTop;
    });

    // Fade screen to black, then transition
    this.time.delayedCall(1500, () => {
      const fade = this.add
        .rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(2000);
      this.tweens.add({
        targets: fade,
        alpha: 1,
        duration: 500,
        onComplete: () => {
          this.scene.start("LevelCleared", {
            levelIndex: this.levelIndex,
            levelName: this.level.name,
            hasNext: hasNextLevel(this.levelIndex),
            kills: this.combo.totalKills,
            best: this.combo.best,
            score: this.combo.score,
          });
        },
      });
    });
  }
}
