import Phaser from "phaser";
import { SideScrollerPlayer, type PlayerKeys } from "../core/SideScrollerPlayer";
import {
  PlayerWeapon,
  GuardGun,
  SINGLE_STAPLER,
  AUTO_STAPLER,
  HOLE_PUNCH,
  RED_SWINGLINE,
  type WeaponConfig,
} from "../modes/office-sidescroller/weapons";
import {
  Enemy,
  SecurityGuard,
  SECURITY_GUARD,
  HEAVY_GUARD,
  SNIPER,
  INTERN,
  CEO_BOSS,
  type EnemyConfig,
} from "../modes/office-sidescroller/enemies";
import type { EnemyKind } from "../modes/office-sidescroller/lobby-level";
import { Corpse } from "../modes/office-sidescroller/Corpse";
import { WeaponPickup } from "../modes/office-sidescroller/Pickup";
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
  private weapons: PlayerWeapon[] = [];
  private currentWeapon = 0;
  // Set of unlocked weapon kinds the player has collected. Used to
  // rebuild the weapons[] array on each level + to gate pickup drops.
  private unlockedWeapons: Set<string> = new Set(["single"]);
  private guardGun!: GuardGun;
  private guards!: Phaser.Physics.Arcade.Group;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  // Separate group for one-way (jump-up-through) platforms so bullets
  // can be configured to pass through them without affecting the rest.
  private oneWayPlatforms!: Phaser.Physics.Arcade.StaticGroup;
  private lowObstacles!: Phaser.Physics.Arcade.StaticGroup;
  private elevator!: Phaser.Physics.Arcade.Sprite;
  private combo!: ComboSystem;
  private hud!: HUD;
  private particles!: Particles;
  private fx!: HitFx;
  private corpses!: Phaser.Physics.Arcade.Group;
  private pickups!: Phaser.Physics.Arcade.Group;
  private doorSpawners: Array<{
    x: number;
    triggerX: number;
    sprite: Phaser.GameObjects.Image;
    triggered: boolean;
    kind: EnemyKind;
  }> = [];
  private vignette!: Phaser.GameObjects.Image;
  private slowMoTint!: Phaser.GameObjects.Rectangle;
  private dangerVignette!: Phaser.GameObjects.Image;
  private crosshair!: Phaser.GameObjects.Image;
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
  private paused = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private lastBossNagAt = -Infinity;
  private bossEngaged = false;
  // Bullet hole decals — rolling buffer, oldest fades out as new ones spawn
  private decals: Phaser.GameObjects.Image[] = [];
  private readonly MAX_DECALS = 60;

  constructor() {
    super({ key: "Game" });
  }

  init(data: {
    levelIndex?: number;
    score?: number;
    kills?: number;
    bestCombo?: number;
    unlockedWeapons?: string[];
  }): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.inheritedScore = data.score ?? 0;
    this.inheritedKills = data.kills ?? 0;
    this.inheritedBestCombo = data.bestCombo ?? 0;
    this.unlockedWeapons = new Set(data.unlockedWeapons ?? ["single"]);
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
    this.combo.onMilestone = (_count, label) => {
      this.hud.showBanner(label, 1100);
      this.fx.flash(0xffe066, 200, 0.18);
    };
    this.particles = new Particles(this);
    this.fx = new HitFx(this);
    this.player = new SideScrollerPlayer(this, lvl.playerStart.x, lvl.playerStart.y);
    // Air-jump particle puff so the double-jump feels visual + tactile
    this.player.onDoubleJump = (x, y) => {
      this.particles.slideDust(x, y - 4, 1);
      this.particles.slideDust(x, y - 4, -1);
    };

    // Build weapons[] from the unlocked set so each new floor honors the
    // player's accumulated arsenal.
    this.weapons = [];
    const slot: Array<[string, WeaponConfig]> = [
      ["single", SINGLE_STAPLER],
      ["auto", AUTO_STAPLER],
      ["hole_punch", HOLE_PUNCH],
      ["swingline", RED_SWINGLINE],
    ];
    for (const [kind, config] of slot) {
      if (this.unlockedWeapons.has(kind)) this.weapons.push(new PlayerWeapon(this, config));
    }
    if (this.weapons.length === 0) this.weapons.push(new PlayerWeapon(this, SINGLE_STAPLER));
    this.currentWeapon = 0;
    this.guardGun = new GuardGun(this);

    this.guards = this.physics.add.group({ classType: SecurityGuard, runChildUpdate: false });
    this.corpses = this.physics.add.group({ classType: Corpse, runChildUpdate: false });
    this.pickups = this.physics.add.group({ classType: WeaponPickup, runChildUpdate: true });
    for (const e of lvl.enemies) {
      const spawnY = e.y ?? lvl.groundY - 4;
      const guard = this.spawnEnemyByKind(e.kind, e.x, spawnY);
      if (guard) this.guards.add(guard);
    }

    // Door spawners — render closed doors at each position
    this.doorSpawners = [];
    for (const spawner of lvl.doorSpawners) {
      const doorSprite = this.add
        .image(spawner.x, lvl.groundY, "office_door")
        .setOrigin(0.5, 1)
        .setDepth(4);
      this.doorSpawners.push({
        x: spawner.x,
        triggerX: spawner.triggerX,
        sprite: doorSprite,
        triggered: false,
        kind: spawner.kind ?? "guard",
      });
    }

    // --- Colliders ---
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.guards, this.platforms);
    this.physics.add.collider(this.corpses, this.platforms);
    this.physics.add.collider(this.pickups, this.platforms);
    // One-way platforms — same collider set but only block from above
    // (configured via checkCollision in buildPlatforms). Bullets are
    // intentionally NOT registered to pass through cleanly.
    this.physics.add.collider(this.player, this.oneWayPlatforms);
    this.physics.add.collider(this.guards, this.oneWayPlatforms);
    this.physics.add.collider(this.corpses, this.oneWayPlatforms);
    this.physics.add.collider(this.pickups, this.oneWayPlatforms);
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
    // Register colliders for every player weapon (the array may grow at
    // runtime via pickups, so we'll re-register when a new weapon is
    // added — see registerWeaponColliders).
    for (const weapon of this.weapons) this.registerWeaponColliders(weapon);
    this.physics.add.collider(this.guardGun.bullets, this.platforms, (bullet) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      this.particles.impactSparks(b.x, b.y, 3);
      this.spawnBulletDecal(b.x, b.y, b.rotation);
      this.guardGun.recycle(b);
    });

    // Pickup → player
    this.physics.add.overlap(this.player, this.pickups, (_pl, pickup) => {
      const p = pickup as WeaponPickup;
      this.onPickup(p);
    });

    // Guard bullets → player. Per-bullet damage payload set at fire time.
    this.physics.add.overlap(this.player, this.guardGun.bullets, (_pl, bullet) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      const hx = b.x;
      const hy = b.y;
      const dmg = (b.getData("damage") as number | undefined)
        ?? SideScrollerConfig.player.guardBulletDamage;
      this.guardGun.recycle(b);
      if (this.player.takeDamage(this.time.now, dmg)) {
        sound.playerHurt();
        this.particles.playerHit(hx, hy);
        this.fx.playerHurt();
        this.breakCombo();
        if (this.player.hp <= 0) this.onPlayerDeath();
      }
    });

    // Enemy contact damage (scaled contact damage per enemy type)
    this.physics.add.overlap(this.player, this.guards, (_pl, enemy) => {
      const e = enemy as Enemy;
      const now = this.time.now;
      if (now - e.lastContact < e.config.contactCooldownMs) return;
      e.lastContact = now;
      if (this.player.takeDamage(now, e.config.contactDamage)) {
        sound.playerHurt();
        this.fx.playerHurt();
        this.breakCombo();
        if (this.player.hp <= 0) this.onPlayerDeath();
      }
    });

    // Elevator trigger — only opens once the floor is actually cleared.
    // On boss floors (anything with a CEO enemy in level data), the
    // elevator is gated until the boss is dead.
    this.physics.add.overlap(this.player, this.elevator, () => {
      if (this.cleared) return;
      if (this.bossAlive()) {
        // Brief reminder on screen
        if (this.time.now - this.lastBossNagAt > 2000) {
          this.hud.showBanner("DEFEAT THE CEO FIRST", 1200);
          this.lastBossNagAt = this.time.now;
        }
        return;
      }
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

    // Danger vignette — same texture as the slow-mo vignette but tinted
    // red. Alpha pulses with a heartbeat-ish rhythm when HP gets low.
    this.dangerVignette = this.add.image(0, 0, "vignette");
    this.dangerVignette.setOrigin(0, 0);
    this.dangerVignette.setScrollFactor(0);
    this.dangerVignette.setDepth(1398);
    this.dangerVignette.setTint(0xff2030);
    this.dangerVignette.setAlpha(0);

    // Custom crosshair (hides system cursor inside the game canvas)
    this.input.setDefaultCursor("none");
    this.crosshair = this.add.image(0, 0, "crosshair");
    this.crosshair.setDepth(1700);
    this.crosshair.setBlendMode(Phaser.BlendModes.ADD);

    // Camera focuses slightly above the player's feet so the player sits
    // roughly at the lower-third of the screen with headroom for jumps.
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1, -150, 80);

    this.keys = this.input.keyboard!.addKeys("W,A,S,D,SPACE") as PlayerKeys;
    this.input.mouse?.disableContextMenu();
    // Weapon hotswap keys 1-4
    this.input.keyboard?.on("keydown-ONE", () => this.selectWeapon(0));
    this.input.keyboard?.on("keydown-TWO", () => this.selectWeapon(1));
    this.input.keyboard?.on("keydown-THREE", () => this.selectWeapon(2));
    this.input.keyboard?.on("keydown-FOUR", () => this.selectWeapon(3));
    // QoL keys
    this.input.keyboard?.on("keydown-P", () => this.togglePause());
    this.input.keyboard?.on("keydown-ESC", () => this.togglePause());
    this.input.keyboard?.on("keydown-M", () => {
      sound.toggleMute();
      this.hud.showBanner("MUTE TOGGLED", 800);
    });

    // Semi-auto trigger fires once per click (pointerdown). Full-auto
    // is handled by the held-button check in update().
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!pointer.leftButtonDown()) return;
      if (this.cleared || this.player.hp <= 0) return;
      const w = this.weapons[this.currentWeapon];
      if (w.config.fireMode === "semi") this.tryFireCurrentWeapon(this.time.now);
    });

    // Floor intro banner — boss floor gets a special call-out
    const isBossFloor = this.level.enemies.some((e) => e.kind === "ceo");
    if (isBossFloor) {
      this.hud.showBanner("FINAL FLOOR · THE CEO AWAITS", 2200);
    } else {
      this.hud.showBanner(
        `FLOOR ${this.levelIndex + 1} · ${this.level.name.toUpperCase()}`,
        1600
      );
    }
  }

  private tryFireCurrentWeapon(time: number): void {
    const weapon = this.weapons[this.currentWeapon];
    const fired = weapon.tryFire(
      time,
      this.player.shoulderX,
      this.player.shoulderY,
      this.player.aimAngle
    );
    if (!fired) return;
    this.player.flashMuzzle(time);
    const off = weapon.config.spawnOffset;
    const mx = this.player.shoulderX + Math.cos(this.player.aimAngle) * off;
    const my = this.player.shoulderY + Math.sin(this.player.aimAngle) * off;
    this.particles.muzzleFlash(mx, my, this.player.aimAngle);
    // Smoke puff per shot is overwhelming for full-auto — only puff
    // every 4th shot for auto weapons, every shot for semi.
    const wantSmoke =
      weapon.config.fireMode === "semi" ||
      Math.floor(time / weapon.config.fireRateMs) % 4 === 0;
    if (wantSmoke) this.particles.smokePuff(mx, my, 1);
  }

  private registerWeaponColliders(weapon: PlayerWeapon): void {
    // Bullets that hit a platform spark + decal + recycle
    this.physics.add.collider(weapon.bullets, this.platforms, (bullet) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      this.particles.impactSparks(b.x, b.y, 3);
      this.spawnBulletDecal(b.x, b.y, b.rotation);
      weapon.recycle(b);
    });
    // Bullets that hit a guard apply damage / spawn the kill effects
    this.physics.add.overlap(weapon.bullets, this.guards, (bullet, enemy) => {
      const b = bullet as Phaser.Physics.Arcade.Sprite;
      const e = enemy as Enemy;
      const hx = b.x;
      const hy = b.y;
      const bulletBody = b.body as Phaser.Physics.Arcade.Body;
      const hitDir = bulletBody.velocity.x >= 0 ? 1 : -1;
      const dmg = (b.getData("damage") as number | undefined) ?? 1;
      // Capture bullet horizontal velocity for knockback before recycle
      // resets it.
      const knockbackX = bulletBody.velocity.x * 0.18;
      weapon.recycle(b);
      sound.hit();
      this.particles.impactSparks(hx, hy, 8);
      this.particles.playerHit(hx, hy);
      if (e.damage(dmg, knockbackX)) {
        const dx = e.x;
        const dy = e.y;
        const eFacingRight = e.facingRight;
        e.destroy();
        sound.death();
        this.particles.guardDeath(dx, dy - 60);
        this.fx.guardKill();
        const corpse = new Corpse(
          this,
          dx,
          dy,
          "guard_idle",
          hitDir,
          eFacingRight,
          e.config.scale
        );
        // Inherit the enemy's tint so the corpse keeps its archetype
        // color (heavy = dark steel, sniper = red, etc.)
        corpse.setTint(e.config.tint);
        this.corpses.add(corpse);
        this.combo.registerKill(this.time.now, e.config.scoreValue);
        this.spawnScorePopup(dx, dy - 80, e.config.scoreValue * this.combo.count);
        // Health pack drop chance — guaranteed from heavies + boss, small
        // chance from everyone else.
        const isHeavy = e.config.name === "Heavy" || e.config.name === "The CEO";
        const dropRoll = Math.random();
        if (isHeavy || dropRoll < 0.08) {
          const pickup = new WeaponPickup(this, dx, dy - 40, "health_pack");
          this.pickups.add(pickup);
        }
        // Boss defeat — cinematic moment
        if (e.config.name === "The CEO") {
          this.fx.flash(0xffe066, 600, 0.45);
          this.fx.shake(0.025, 600);
          this.hud.showBanner("CEO DEFEATED", 2200);
          for (let i = 0; i < 8; i++) {
            this.time.delayedCall(i * 70, () => {
              this.particles.guardDeath(
                dx + Phaser.Math.Between(-80, 80),
                dy - 30 + Phaser.Math.Between(-30, 30)
              );
            });
          }
        }
        this.caffeineMs = Math.min(
          SideScrollerConfig.caffeine.maxMs,
          this.caffeineMs + SideScrollerConfig.caffeine.killRefillMs
        );
        this.maybeDropAutoStaplerPickup(dx, dy);
      } else {
        this.fx.guardHit();
      }
    });
  }

  private maybeDropAutoStaplerPickup(x: number, y: number): void {
    if (!this.level.rewardPickup) return;
    const kind = this.level.rewardPickup.kind;
    // Already unlocked? Skip.
    const unlockKey =
      kind === "auto_stapler" ? "auto" : kind === "hole_punch" ? "hole_punch" : "swingline";
    if (this.unlockedWeapons.has(unlockKey)) return;
    if (this.guards.countActive(true) > 0) return;
    const allDoorsSpent = this.doorSpawners.every((ds) => ds.triggered);
    if (!allDoorsSpent) return;
    const pickup = new WeaponPickup(this, x, y - 60, kind);
    this.pickups.add(pickup);
    this.hud.showBanner("WEAPON DROPPED", 1500);
  }

  private triggerDoorSpawn(ds: {
    x: number;
    sprite: Phaser.GameObjects.Image;
    triggered: boolean;
    kind: EnemyKind;
  }): void {
    const groundY = this.level.groundY;
    // Open the door (slide aside + fade)
    this.tweens.add({
      targets: ds.sprite,
      scaleX: 0,
      x: ds.x + 30,
      duration: 350,
      ease: "Cubic.easeOut",
      onComplete: () => ds.sprite.setVisible(false),
    });
    sound.elevatorDing();
    const enemy = this.spawnEnemyByKind(ds.kind, ds.x, groundY - 4);
    if (enemy) {
      enemy.setAlpha(0);
      this.guards.add(enemy);
      this.tweens.add({
        targets: enemy,
        alpha: 1,
        duration: 250,
      });
    }
    this.particles.smokePuff(ds.x, groundY - 30, 2);
  }

  private bossAlive(): boolean {
    const children = this.guards.getChildren() as Enemy[];
    return children.some((e) => e.active && e.config.name === "The CEO");
  }

  private spawnScorePopup(x: number, y: number, value: number): void {
    const text = this.add
      .text(x, y, `+${value}`, {
        fontFamily: "ui-monospace, monospace",
        fontSize: "16px",
        color: value >= 1000 ? "#ff8030" : "#ffe066",
        stroke: "#1a1d24",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1)
      .setDepth(800);
    this.tweens.add({
      targets: text,
      y: y - 60,
      alpha: 0,
      duration: 900,
      ease: "Cubic.easeOut",
      onComplete: () => text.destroy(),
    });
  }

  private togglePause(): void {
    if (this.cleared || this.player.hp <= 0) return;
    if (this.paused) {
      this.scene.resume();
      this.physics.world.resume();
      this.pauseOverlay?.destroy();
      this.pauseOverlay = undefined;
      this.paused = false;
      return;
    }
    this.paused = true;
    this.physics.world.pause();
    sound.uiClick();
    const { width, height } = this.scale;
    const bg = this.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(2500);
    const title = this.add.text(width / 2, height / 2 - 100, "PAUSED", {
      fontFamily: "ui-monospace, monospace",
      fontSize: "48px",
      color: "#ffe066",
      stroke: "#1a1d24",
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2501);
    const hint = this.add.text(width / 2, height / 2, [
      "A / D · run",
      "W · jump  (press again mid-air for double jump)",
      "S · slide   (can also fire during slide)",
      "Mouse · aim   ·   Left Click · fire",
      "SPACE · slow-mo",
      "1 / 2 / 3 / 4 · swap weapon",
      "P or ESC · pause   ·   M · mute",
      "",
      "press P or ESC to resume",
    ], {
      fontFamily: "ui-monospace, monospace",
      fontSize: "16px",
      color: "#dddddd",
      align: "center",
      lineSpacing: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2501);
    const container = this.add.container(0, 0, [bg, title, hint]).setScrollFactor(0).setDepth(2500);
    this.pauseOverlay = container;
    // Pause the scene update — but keep tweens so the pause UI renders cleanly
  }

  private breakCombo(): void {
    const before = this.combo.count;
    this.combo.break();
    if (before >= 3) {
      // Floating red "COMBO LOST x5" text near the player
      const text = this.add
        .text(this.player.x, this.player.y - 140, `COMBO LOST x${before}`, {
          fontFamily: "ui-monospace, monospace",
          fontSize: "16px",
          color: "#ff5050",
          stroke: "#1a1d24",
          strokeThickness: 3,
        })
        .setOrigin(0.5, 1)
        .setDepth(800);
      this.tweens.add({
        targets: text,
        y: this.player.y - 200,
        alpha: 0,
        duration: 900,
        ease: "Cubic.easeOut",
        onComplete: () => text.destroy(),
      });
    }
  }

  private spawnBulletDecal(x: number, y: number, angle: number): void {
    const decal = this.add
      .image(x, y, "bullet_hole")
      .setRotation(angle)
      .setDepth(2)
      .setAlpha(0.6); // toned down from 0.85 — was too prominent on light walls
    // Slight random scale variance so they don't all look identical
    const s = 0.85 + Math.random() * 0.3;
    decal.setScale(s);
    this.decals.push(decal);
    if (this.decals.length > this.MAX_DECALS) {
      const oldest = this.decals.shift();
      if (oldest) {
        this.tweens.add({
          targets: oldest,
          alpha: 0,
          duration: 200,
          onComplete: () => oldest.destroy(),
        });
      }
    }
  }

  private spawnEnemyByKind(kind: EnemyKind, x: number, y: number): Enemy | null {
    let config: EnemyConfig;
    switch (kind) {
      case "guard": config = SECURITY_GUARD; break;
      case "heavy": config = HEAVY_GUARD; break;
      case "sniper": config = SNIPER; break;
      case "intern": config = INTERN; break;
      case "ceo": config = CEO_BOSS; break;
      default: return null;
    }
    const enemy = new Enemy(this, x, y, this.guardGun, config);
    if (kind === "ceo") {
      // Boss rage hook: drop a banner + red flash when the CEO crosses
      // the 50% HP threshold.
      enemy.onEnrage = () => {
        this.hud.showBanner("CEO ENRAGED", 2200);
        this.fx.flash(0xc73a3a, 500, 0.4);
        this.fx.shake(0.018, 400);
      };
    }
    return enemy;
  }

  private onPickup(p: WeaponPickup): void {
    if (p.kind === "health_pack") {
      const max = SideScrollerConfig.player.maxHP;
      const before = this.player.hp;
      this.player.hp = Math.min(max, before + 30);
      const healed = this.player.hp - before;
      sound.uiClick();
      this.fx.flash(0x6abd5a, 200, 0.16);
      if (healed > 0) {
        // Reuse the score-popup helper, custom green text
        const text = this.add
          .text(p.x, p.y - 20, `+${healed} HP`, {
            fontFamily: "ui-monospace, monospace",
            fontSize: "16px",
            color: "#6abd5a",
            stroke: "#1a1d24",
            strokeThickness: 3,
          })
          .setOrigin(0.5, 1)
          .setDepth(800);
        this.tweens.add({
          targets: text,
          y: p.y - 80,
          alpha: 0,
          duration: 900,
          ease: "Cubic.easeOut",
          onComplete: () => text.destroy(),
        });
      }
      p.destroy();
      return;
    }
    let unlockKey = "";
    let config: WeaponConfig | null = null;
    let label = "";
    switch (p.kind) {
      case "auto_stapler":
        unlockKey = "auto";
        config = AUTO_STAPLER;
        label = "AUTO STAPLER";
        break;
      case "hole_punch":
        unlockKey = "hole_punch";
        config = HOLE_PUNCH;
        label = "HOLE PUNCH";
        break;
      case "swingline":
        unlockKey = "swingline";
        config = RED_SWINGLINE;
        label = "RED SWINGLINE";
        break;
    }
    if (config && !this.unlockedWeapons.has(unlockKey)) {
      this.unlockedWeapons.add(unlockKey);
      const w = new PlayerWeapon(this, config);
      this.weapons.push(w);
      this.registerWeaponColliders(w);
      this.selectWeapon(this.weapons.length - 1);
      this.hud.showBanner(`${label} · press 1-${this.weapons.length} to swap`, 2400);
      sound.elevatorDing();
    }
    p.destroy();
  }

  private selectWeapon(index: number): void {
    if (index < 0 || index >= this.weapons.length) return;
    if (index === this.currentWeapon) return;
    this.currentWeapon = index;
    sound.uiClick();
    this.hud.setWeapon(this.weapons[index].config.name);
  }

  override update(time: number, delta: number): void {
    if (this.player.hp <= 0 || this.cleared || this.paused) return;

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
    // Track crosshair to the world cursor position; scale up during slow-mo
    this.crosshair.setPosition(pointer.worldX, pointer.worldY);
    this.crosshair.setScale(this.slowMoActive ? 1.4 : 1);
    this.crosshair.setRotation(this.crosshair.rotation + 0.01);
    this.player.updateInput(
      time,
      delta,
      this.keys,
      pointer,
      inWithdrawal // suppress input during withdrawal stumble
    );

    // Counter-boost only the player's HORIZONTAL velocity in slow-mo. The
    // earlier full setVelocity(x/wf, y/wf) version compounded the Y boost
    // every frame, so jumping mid-slow-mo would rocket the player straight
    // up. Boosting only X keeps run speed normal under slow-mo while
    // letting gravity-driven jumps stay physically sane.
    if (this.slowMoActive) {
      const body = this.player.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(body.velocity.x / worldFactor);
    }

    // Shoot — full-auto weapons fire while held; semi-auto weapons only
    // fire from the pointerdown event (registered in create()).
    // You CAN now shoot while sliding — chainable slide-and-shoot.
    const weapon = this.weapons[this.currentWeapon];
    if (weapon.config.fireMode === "auto" && pointer.leftButtonDown()) {
      this.tryFireCurrentWeapon(time);
    }

    // Slide dust trail behind sliding player
    if (this.player.isSliding && time % 80 < 16) {
      this.particles.slideDust(
        this.player.x,
        this.player.y - 4,
        this.player.facingRight ? 1 : -1
      );
    }

    // Door spawners — trigger when player crosses their x threshold
    for (const ds of this.doorSpawners) {
      if (!ds.triggered && this.player.x >= ds.triggerX) {
        ds.triggered = true;
        this.triggerDoorSpawn(ds);
      }
    }

    // Enemy AI
    this.guards.getChildren().forEach((c) => {
      const g = c as Enemy;
      if (!g.active) return;
      g.think(time, delta, this.player.x, this.player.y, worldFactor);
    });

    // Bullet trail visuals follow each active projectile
    for (const w of this.weapons) w.update();
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
    // Boss HP bar — show/update if a boss is alive
    this.updateBossUi();

    // Danger vignette — fade in below 30% HP, pulse with heartbeat
    const hpPct = this.player.hp / SideScrollerConfig.player.maxHP;
    if (hpPct < 0.3 && this.player.hp > 0) {
      const baseAlpha = (0.3 - hpPct) / 0.3 * 0.55; // 0 at 30%, 0.55 at 0%
      const pulse = 0.85 + Math.sin(time * 0.008) * 0.15;
      this.dangerVignette.setAlpha(baseAlpha * pulse);
    } else {
      this.dangerVignette.setAlpha(0);
    }

    // Camera lookahead — subtle shift toward the aim cursor so you can
    // see more of the world in the direction you're aiming. Smoothed.
    const aimDx = pointer.worldX - this.player.x;
    const targetLookahead = Phaser.Math.Clamp(aimDx * 0.18, -180, 180);
    const cam = this.cameras.main;
    const current = cam.followOffset.x;
    cam.followOffset.x = current + (-150 + targetLookahead - current) * 0.06;
  }

  private updateBossUi(): void {
    const boss = (this.guards.getChildren() as Enemy[]).find(
      (e) => e.active && e.config.name === "The CEO"
    );
    if (boss) {
      const pct = boss.hp / boss.config.hp;
      this.hud.showBossBar(boss.config.name);
      this.hud.updateBossBar(pct);
      if (!this.bossEngaged && boss.aiState !== "patrol") {
        this.bossEngaged = true;
        this.hud.showBanner("THE CEO HAS YOU IN HIS SIGHTS", 2200);
        this.fx.flash(0xc73a3a, 350, 0.28);
        sound.startBossIntensity();
      }
    } else {
      this.hud.hideBossBar();
      if (this.bossEngaged) {
        sound.stopBossIntensity();
        this.bossEngaged = false;
      }
    }
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
    const wallTexture = this.wallTextureForTheme(lvl.theme);
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

  private wallTextureForTheme(theme: LevelData["theme"]): string {
    switch (theme) {
      case "lobby": return "lobby_wall";
      case "cubicles": return "cubicle_wall";
      case "boardroom": return "boardroom_wall";
      case "break_room": return "breakroom_wall";
      case "server_room": return "server_wall";
      case "hallway": return "hallway_wall";
      case "penthouse": return "penthouse_wall";
    }
  }

  private floorTextureForTheme(theme: LevelData["theme"]): string {
    switch (theme) {
      case "lobby": return "marble_tile";
      case "cubicles": return "carpet_tile";
      case "boardroom": return "hardwood_tile";
      case "break_room": return "white_tile";
      case "server_room": return "grate_tile";
      case "hallway": return "hallway_carpet";
      case "penthouse": return "polished_marble";
    }
  }

  private buildGroundAndFloor(lvl: LevelData): void {
    this.platforms = this.physics.add.staticGroup();
    this.oneWayPlatforms = this.physics.add.staticGroup();

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

    // Interior floor — varies by theme
    const interiorTexture = this.floorTextureForTheme(lvl.theme);
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
    switch (lvl.theme) {
      case "lobby": this.buildLobbyDecor(lvl); break;
      case "cubicles": this.buildCubiclesDecor(lvl); break;
      case "boardroom": this.buildBoardroomDecor(lvl); break;
      case "break_room": this.buildBreakroomDecor(lvl); break;
      case "server_room": this.buildServerDecor(lvl); break;
      case "hallway": this.buildHallwayDecor(lvl); break;
      case "penthouse": this.buildPenthouseDecor(lvl); break;
    }

    // Ceiling lights — all themes get these except hallway (which has its
    // own narrower fluorescent strips baked into the lowObstacles)
    if (lvl.theme !== "hallway") {
      for (let x = lvl.exteriorEndX + 80; x < lvl.width - 80; x += 220) {
        this.add.image(x, 24, "ceiling_light").setOrigin(0.5, 0);
      }
    }
  }

  private buildBoardroomDecor(lvl: LevelData): void {
    // Leather chairs positioned along the boardroom table on the player's
    // side. Table is at x=800-1400 so chairs span that range evenly.
    [900, 1050, 1200, 1350].forEach((x) =>
      this.add.image(x, lvl.groundY, "leather_chair").setOrigin(0.5, 1).setDepth(6)
    );
    // Big chandelier centered over the boardroom table
    this.add.image(1100, 60, "chandelier").setOrigin(0.5, 0);
    // Smaller secondary chandelier farther down
    this.add.image(2500, 60, "chandelier").setOrigin(0.5, 0).setScale(0.8);
    // Floor plants in corners
    [300, lvl.width - 300].forEach((x) =>
      this.add.image(x, lvl.groundY, "plant").setOrigin(0.5, 1)
    );
  }

  private buildBreakroomDecor(lvl: LevelData): void {
    // Vending machine + fridge cluster at one wall section
    this.add.image(450, lvl.groundY, "vending_machine").setOrigin(0.5, 1).setScrollFactor(0.95);
    this.add.image(530, lvl.groundY, "fridge").setOrigin(0.5, 1).setScrollFactor(0.95);
    this.add.image(3500, lvl.groundY, "vending_machine").setOrigin(0.5, 1).setScrollFactor(0.95);
    this.add.image(3580, lvl.groundY, "fridge").setOrigin(0.5, 1).setScrollFactor(0.95);
    // Water coolers + plants for break-area feel
    [1300, 3000].forEach((x) =>
      this.add.image(x, lvl.groundY, "water_cooler_2").setOrigin(0.5, 1)
    );
    [200, 1700, 2400, lvl.width - 200].forEach((x) =>
      this.add.image(x, lvl.groundY, "plant").setOrigin(0.5, 1)
    );
  }

  private buildServerDecor(lvl: LevelData): void {
    // Floor server racks along the wall (closer than the level platforms)
    [350, 850, 1350, 1850, 2350, 2850, 3350, 3850].forEach((x) =>
      this.add.image(x, lvl.groundY, "server_rack").setOrigin(0.5, 1).setScrollFactor(0.92)
    );
  }

  private buildHallwayDecor(lvl: LevelData): void {
    // Lots of identical numbered doors lining the hallway — visual only.
    // The actual door spawners overlay on top of these positions.
    for (let x = 300; x < lvl.width - 200; x += 200) {
      this.add.image(x, lvl.groundY, "office_door").setOrigin(0.5, 1).setDepth(3);
    }
  }

  private buildPenthouseDecor(lvl: LevelData): void {
    // The CEO's executive chair behind the desk
    this.add.image(2100, lvl.groundY, "executive_chair").setOrigin(0.5, 1).setDepth(6);
    // A couple of floor plants framing the space
    [200, lvl.width - 200].forEach((x) =>
      this.add.image(x, lvl.groundY, "plant").setOrigin(0.5, 1)
    );
    // Big chandelier
    this.add.image(lvl.width / 2, 60, "chandelier").setOrigin(0.5, 0);
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
      // Pick a texture: explicit override → use it, else silhouette
      // heuristic (tall-and-narrow = file_cabinet, otherwise desk).
      const textureKey =
        p.textureKey ?? (p.height > p.width ? "file_cabinet" : "desk");
      const cy = p.y + p.height / 2;
      // For tileable wide platforms (mezzanine), use a TileSprite so the
      // texture repeats. For everything else, a single sprite.
      if (p.textureKey === "mezzanine") {
        const ts = this.add.tileSprite(p.x, cy, p.width, p.height, textureKey);
        ts.setOrigin(0.5, 0.5);
      } else {
        this.add.image(p.x, cy, textureKey).setOrigin(0.5, 0.5);
      }
      const collider = this.add
        .rectangle(p.x, cy, p.width, p.height, 0x000000, 0)
        .setOrigin(0.5, 0.5);
      this.physics.add.existing(collider, true);
      // One-way platforms: only block from above. Players + enemies jump
      // UP through them from below; falling onto them lands normally.
      // Bullets always pass through (we never register a bullet-vs-this
      // collider for the one-way group, see below).
      if (p.oneWay) {
        const body = collider.body as Phaser.Physics.Arcade.StaticBody;
        body.checkCollision.down = false;
        body.checkCollision.left = false;
        body.checkCollision.right = false;
        this.oneWayPlatforms.add(collider);
      } else {
        this.platforms.add(collider);
      }
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
        levelIndex: this.levelIndex,
        kills: this.combo.totalKills,
        best: this.combo.best,
        score: this.combo.score,
        unlockedWeapons: Array.from(this.unlockedWeapons),
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
            unlockedWeapons: Array.from(this.unlockedWeapons),
          });
        },
      });
    });
  }
}
