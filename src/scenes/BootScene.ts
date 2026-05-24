import Phaser from "phaser";

// Side-view sprite generator. All characters drawn facing RIGHT.
// Phaser sprites flip with setFlipX(true) when facing LEFT.
//
// Texture canvas size is chosen so each character's *visual* width is roughly
// 24-28px and height roughly 48-56px — small enough to look "indie 2D" and
// large enough to read.

// Sprite keys that we'll *try* to load as real PNG art from
// `public/assets/sprites/{key}.png`. If a file is missing, BootScene
// generates a procedural fallback so the game still runs.
const REAL_ART_KEYS = [
  "player_idle",
  "player_walk_0",
  "player_walk_1",
  "player_jump",
  "player_fall",
  "player_slide",
  "guard_idle",
  "guard_walk_0",
  "guard_walk_1",
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "Boot" });
  }

  preload(): void {
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      // 404s on optional art assets are expected during early dev — log quietly.
      console.info(`[asset] missing ${file.key} — using procedural fallback`);
    });
    for (const key of REAL_ART_KEYS) {
      this.load.image(key, `assets/sprites/${key}.png`);
    }
  }

  create(): void {
    // Player body frames — only generate procedural if real PNG didn't load
    if (!this.textures.exists("player_idle"))
      this.makeTexture("player_idle", 32, 56, (g) => this.drawPlayerBody(g, 16, 32, "idle"));
    if (!this.textures.exists("player_walk_0"))
      this.makeTexture("player_walk_0", 32, 56, (g) => this.drawPlayerBody(g, 16, 32, "walk0"));
    if (!this.textures.exists("player_walk_1"))
      this.makeTexture("player_walk_1", 32, 56, (g) => this.drawPlayerBody(g, 16, 32, "walk1"));
    if (!this.textures.exists("player_jump"))
      this.makeTexture("player_jump", 32, 56, (g) => this.drawPlayerBody(g, 16, 32, "jump"));
    if (!this.textures.exists("player_fall"))
      this.makeTexture("player_fall", 32, 56, (g) => this.drawPlayerBody(g, 16, 32, "fall"));
    if (!this.textures.exists("player_slide"))
      this.makeTexture("player_slide", 56, 32, (g) => this.drawPlayerSlide(g, 28, 16));

    // The aiming arm + pistol always procedural — it rotates dynamically with
    // the mouse, which AI sprites can't help with.
    this.makeTexture("player_arm", 28, 8, (g) => this.drawPlayerArm(g));

    if (!this.textures.exists("guard_idle"))
      this.makeTexture("guard_idle", 32, 56, (g) => this.drawGuard(g, 16, 32, "idle"));
    if (!this.textures.exists("guard_walk_0"))
      this.makeTexture("guard_walk_0", 32, 56, (g) => this.drawGuard(g, 16, 32, "walk0"));
    if (!this.textures.exists("guard_walk_1"))
      this.makeTexture("guard_walk_1", 32, 56, (g) => this.drawGuard(g, 16, 32, "walk1"));
    this.makeTexture("guard_arm", 26, 8, (g) => this.drawGuardArm(g));

    // Projectiles
    this.makeTexture("staple", 12, 6, (g) => this.drawStaple(g));
    this.makeTexture("guard_bullet", 8, 4, (g) => this.drawGuardBullet(g));

    // Muzzle flash
    this.makeTexture("muzzle", 16, 12, (g) => this.drawMuzzle(g));

    // Level props
    this.makeTexture("desk", 96, 44, (g) => this.drawReceptionDesk(g));
    this.makeTexture("file_cabinet", 40, 60, (g) => this.drawFileCabinet(g));
    this.makeTexture("low_obstacle", 96, 32, (g) => this.drawLowObstacle(g));
    this.makeTexture("elevator", 100, 130, (g) => this.drawElevator(g));
    this.makeTexture("plant", 36, 60, (g) => this.drawFloorPlant(g));
    this.makeTexture("column", 32, 200, (g) => this.drawColumn(g));
    this.makeTexture("monitor_wall", 60, 36, (g) => this.drawWallMonitor(g));
    this.makeTexture("lamppost", 24, 180, (g) => this.drawLamppost(g));
    this.makeTexture("revolving_door", 80, 160, (g) => this.drawRevolvingDoor(g));

    // Background layers
    this.makeTexture("sky_gradient", 64, 360, (g) => this.drawSkyGradient(g));
    this.makeTexture("skyline_back", 800, 200, (g) => this.drawSkyline(g, "back"));
    this.makeTexture("skyline_front", 800, 240, (g) => this.drawSkyline(g, "front"));
    this.makeTexture("pavement_tile", 64, 32, (g) => this.drawPavement(g));
    this.makeTexture("marble_tile", 64, 32, (g) => this.drawMarble(g));
    this.makeTexture("lobby_wall", 64, 64, (g) => this.drawLobbyWall(g));

    this.scene.start("Menu");
  }

  private makeTexture(
    key: string,
    w: number,
    h: number,
    draw: (g: Phaser.GameObjects.Graphics) => void
  ): void {
    const g = this.add.graphics({ x: 0, y: 0 });
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // ---------- Player body ----------
  private drawPlayerBody(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    pose: "idle" | "walk0" | "walk1" | "jump" | "fall"
  ): void {
    // Shadow (only when grounded poses)
    if (pose === "idle" || pose === "walk0" || pose === "walk1") {
      g.fillStyle(0x000000, 0.3);
      g.fillEllipse(cx, cy + 24, 22, 5);
    }

    // Legs by pose
    g.fillStyle(0x1a1d28, 1);
    if (pose === "idle") {
      g.fillRect(cx - 5, cy + 8, 4, 16);
      g.fillRect(cx + 1, cy + 8, 4, 16);
    } else if (pose === "walk0") {
      g.fillRect(cx - 7, cy + 8, 4, 16); // front
      g.fillRect(cx + 2, cy + 10, 4, 14); // back
    } else if (pose === "walk1") {
      g.fillRect(cx - 4, cy + 10, 4, 14);
      g.fillRect(cx + 3, cy + 8, 4, 16);
    } else if (pose === "jump") {
      // tucked
      g.fillRect(cx - 5, cy + 6, 4, 9);
      g.fillRect(cx + 1, cy + 6, 4, 9);
    } else {
      // fall
      g.fillRect(cx - 6, cy + 8, 4, 14);
      g.fillRect(cx + 2, cy + 8, 4, 14);
    }

    // Shoes
    g.fillStyle(0x000000, 1);
    if (pose === "idle") {
      g.fillRect(cx - 6, cy + 22, 5, 2);
      g.fillRect(cx + 1, cy + 22, 5, 2);
    } else if (pose === "walk0") {
      g.fillRect(cx - 8, cy + 22, 5, 2);
      g.fillRect(cx + 2, cy + 22, 5, 2);
    } else if (pose === "walk1") {
      g.fillRect(cx - 5, cy + 22, 5, 2);
      g.fillRect(cx + 3, cy + 22, 5, 2);
    } else if (pose === "jump") {
      g.fillRect(cx - 6, cy + 13, 5, 2);
      g.fillRect(cx + 1, cy + 13, 5, 2);
    } else {
      g.fillRect(cx - 7, cy + 20, 5, 2);
      g.fillRect(cx + 2, cy + 20, 5, 2);
    }

    // Torso (shirt) — slightly lean forward on walk
    const torsoX = pose === "walk0" || pose === "walk1" ? cx + 0 : cx;
    g.fillStyle(0x4cc4ff, 1);
    g.fillRoundedRect(torsoX - 7, cy - 6, 14, 16, 3);
    // shading on back side
    g.fillStyle(0x3aa5e0, 1);
    g.fillRoundedRect(torsoX - 7, cy - 6, 5, 16, 3);

    // Tie (red, hangs from collar)
    g.fillStyle(0xa31818, 1);
    g.fillTriangle(torsoX - 1, cy - 4, torsoX + 1, cy - 4, torsoX, cy + 4);
    g.fillStyle(0xc52828, 1);
    g.fillRect(torsoX - 1, cy - 5, 3, 2); // knot

    // Belt
    g.fillStyle(0x2a1a0a, 1);
    g.fillRect(torsoX - 7, cy + 9, 14, 2);
    g.fillStyle(0xc59842, 1);
    g.fillRect(torsoX - 1, cy + 9, 3, 2);

    // Head (slight bob on walk)
    const headY = cy - 12 + (pose === "walk0" || pose === "walk1" ? 1 : 0);
    g.fillStyle(0xffd6b0, 1);
    g.fillCircle(cx, headY, 5);
    // Hair
    g.fillStyle(0x2c1a0e, 1);
    g.fillEllipse(cx, headY - 4, 11, 4);
    g.fillRect(cx - 5, headY - 4, 2, 4);
    // Ear
    g.fillStyle(0xe8b890, 1);
    g.fillCircle(cx + 4, headY, 1.3);

    // Body outline (cel look)
    g.lineStyle(1, 0x12141b, 1);
    g.strokeRoundedRect(torsoX - 7, cy - 6, 14, 16, 3);
    g.strokeCircle(cx, headY, 5);
  }

  private drawPlayerSlide(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number
  ): void {
    // Horizontal pose — head right, legs left, body laid out lengthwise.
    // Speed lines behind for motion feel.
    g.fillStyle(0xffe066, 0.25);
    g.fillRect(0, cy - 3, 8, 1);
    g.fillRect(2, cy - 1, 10, 1);
    g.fillRect(0, cy + 3, 8, 1);

    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + 12, 36, 4);

    // Legs (extended to the LEFT, behind direction of motion)
    g.fillStyle(0x1a1d28, 1);
    g.fillRect(cx - 22, cy + 2, 14, 5);
    g.fillRect(cx - 22, cy + 7, 14, 4);
    // Shoes
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 24, cy + 2, 3, 4);
    g.fillRect(cx - 24, cy + 7, 3, 4);

    // Torso (shirt) horizontal
    g.fillStyle(0x4cc4ff, 1);
    g.fillRoundedRect(cx - 10, cy - 4, 16, 12, 3);
    g.fillStyle(0x3aa5e0, 1);
    g.fillRoundedRect(cx - 10, cy + 4, 16, 4, 2);

    // Tie flapping back
    g.fillStyle(0xa31818, 1);
    g.fillTriangle(cx - 4, cy + 0, cx - 4, cy + 4, cx - 10, cy + 2);

    // Belt
    g.fillStyle(0x2a1a0a, 1);
    g.fillRect(cx - 10, cy + 5, 4, 3);

    // Head (right side)
    g.fillStyle(0xffd6b0, 1);
    g.fillCircle(cx + 9, cy - 1, 5);
    g.fillStyle(0x2c1a0e, 1);
    g.fillEllipse(cx + 9, cy - 5, 10, 4);

    // Body outline
    g.lineStyle(1, 0x12141b, 1);
    g.strokeRoundedRect(cx - 10, cy - 4, 16, 12, 3);
    g.strokeCircle(cx + 9, cy - 1, 5);
  }

  private drawPlayerArm(g: Phaser.GameObjects.Graphics): void {
    // 28x8. Sleeve on left, hand + pistol on right. Origin will be (0, 0.5).
    // Sleeve (shirt blue)
    g.fillStyle(0x4cc4ff, 1);
    g.fillRect(0, 1, 12, 6);
    g.fillStyle(0x3aa5e0, 1);
    g.fillRect(0, 5, 12, 2);
    // Hand
    g.fillStyle(0xffd6b0, 1);
    g.fillRect(12, 2, 4, 5);
    // Pistol barrel
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(16, 2, 11, 3);
    // Pistol grip
    g.fillStyle(0x4a2a1a, 1);
    g.fillRect(15, 4, 4, 4);
    // Front sight
    g.fillStyle(0x4a4a4a, 1);
    g.fillRect(25, 1, 2, 1);
    // Outline
    g.lineStyle(1, 0x12141b, 1);
    g.strokeRect(0, 1, 12, 6);
    g.strokeRect(16, 2, 11, 3);
  }

  // ---------- Guard ----------
  private drawGuard(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    pose: "idle" | "walk0" | "walk1"
  ): void {
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(cx, cy + 24, 22, 5);

    // Legs (black uniform pants)
    g.fillStyle(0x0d0f17, 1);
    if (pose === "walk0") {
      g.fillRect(cx - 7, cy + 8, 4, 16);
      g.fillRect(cx + 2, cy + 10, 4, 14);
    } else if (pose === "walk1") {
      g.fillRect(cx - 4, cy + 10, 4, 14);
      g.fillRect(cx + 3, cy + 8, 4, 16);
    } else {
      g.fillRect(cx - 5, cy + 8, 4, 16);
      g.fillRect(cx + 1, cy + 8, 4, 16);
    }
    g.fillStyle(0x000000, 1);
    g.fillRect(cx - 6, cy + 22, 5, 2);
    g.fillRect(cx + 1, cy + 22, 5, 2);

    // Torso (dark navy security uniform)
    g.fillStyle(0x1e2a4a, 1);
    g.fillRoundedRect(cx - 7, cy - 6, 14, 16, 3);
    g.fillStyle(0x14213a, 1);
    g.fillRoundedRect(cx - 7, cy - 6, 5, 16, 3);

    // Badge (gold star)
    g.fillStyle(0xffd84d, 1);
    g.fillCircle(cx + 2, cy - 1, 2);
    g.fillStyle(0xc59842, 1);
    g.fillCircle(cx + 2, cy - 1, 1);

    // Belt + holster
    g.fillStyle(0x1a1006, 1);
    g.fillRect(cx - 7, cy + 9, 14, 2);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(cx + 4, cy + 9, 4, 4);

    // Head with cap
    const headY = cy - 12;
    g.fillStyle(0xe8c098, 1);
    g.fillCircle(cx, headY, 5);
    // Cap
    g.fillStyle(0x14213a, 1);
    g.fillEllipse(cx, headY - 4, 12, 5);
    g.fillRect(cx - 6, headY - 4, 12, 2);
    g.fillStyle(0x000000, 1);
    g.fillRect(cx, headY - 2, 6, 1); // brim
    // Mustache
    g.fillStyle(0x2c1a0e, 1);
    g.fillRect(cx - 1, headY + 2, 5, 1);

    g.lineStyle(1, 0x080a12, 1);
    g.strokeRoundedRect(cx - 7, cy - 6, 14, 16, 3);
    g.strokeCircle(cx, headY, 5);
  }

  private drawGuardArm(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x1e2a4a, 1);
    g.fillRect(0, 1, 12, 6);
    g.fillStyle(0xe8c098, 1);
    g.fillRect(12, 2, 4, 5);
    // Larger handgun
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(16, 1, 9, 4);
    g.fillStyle(0x4a2a1a, 1);
    g.fillRect(15, 3, 4, 5);
    g.lineStyle(1, 0x080a12, 1);
    g.strokeRect(0, 1, 12, 6);
    g.strokeRect(16, 1, 9, 4);
  }

  // ---------- Projectiles ----------
  private drawStaple(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xd0d0d0, 1);
    g.fillRect(10, 0, 2, 6);
    g.fillRect(0, 0, 12, 2);
    g.fillRect(0, 4, 12, 2);
    g.lineStyle(1, 0x6b6b6b, 1);
    g.strokeRect(10, 0, 2, 6);
  }

  private drawGuardBullet(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xffa040, 1);
    g.fillRect(0, 1, 8, 2);
    g.fillStyle(0xff5020, 1);
    g.fillRect(6, 0, 2, 4);
  }

  private drawMuzzle(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xfff080, 0.95);
    g.fillTriangle(0, 6, 14, 0, 14, 12);
    g.fillStyle(0xffe040, 0.6);
    g.fillCircle(4, 6, 3);
  }

  // ---------- Props ----------
  private drawReceptionDesk(g: Phaser.GameObjects.Graphics): void {
    // 96 wide x 44 tall
    g.fillStyle(0x3a2c1c, 1);
    g.fillRoundedRect(0, 0, 96, 44, 4);
    g.fillStyle(0x8b6a4a, 1);
    g.fillRoundedRect(2, 2, 92, 40, 3);
    g.fillStyle(0x6b4a2a, 1);
    g.fillRoundedRect(2, 2, 92, 8, 2); // counter top
    // Wood grain
    g.lineStyle(1, 0x6b4a2a, 0.5);
    for (let i = 14; i < 40; i += 6) g.lineBetween(4, i, 92, i);
    // Computer monitor on top
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(38, -16, 22, 16, 2);
    g.fillStyle(0x4cc4ff, 0.8);
    g.fillRoundedRect(40, -14, 18, 12, 1);
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(47, -2, 4, 3);
    g.fillRect(43, 1, 12, 2);
    // Pen cup
    g.fillStyle(0xc4c4c4, 1);
    g.fillRect(74, -5, 6, 6);
    g.fillStyle(0xff5252, 1);
    g.fillRect(75, -8, 1, 4);
    g.fillStyle(0x4cc4ff, 1);
    g.fillRect(77, -8, 1, 4);
    g.lineStyle(1, 0x1a1d28, 1);
    g.strokeRoundedRect(0, 0, 96, 44, 4);
  }

  private drawFileCabinet(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x666b78, 1);
    g.fillRoundedRect(0, 0, 40, 60, 2);
    g.fillStyle(0x4a4f5c, 1);
    g.fillRoundedRect(2, 2, 36, 56, 2);
    // Drawers
    for (let i = 0; i < 3; i++) {
      const y = 4 + i * 18;
      g.fillStyle(0x5a5f6c, 1);
      g.fillRect(4, y, 32, 16);
      g.fillStyle(0x3a3f4c, 1);
      g.fillRect(16, y + 7, 8, 2); // handle
      g.fillStyle(0x88ddff, 0.5);
      g.fillRect(6, y + 2, 8, 4); // label
    }
    g.lineStyle(1, 0x1a1d28, 1);
    g.strokeRoundedRect(0, 0, 40, 60, 2);
  }

  private drawLowObstacle(g: Phaser.GameObjects.Graphics): void {
    // A horizontal beam / banner / pipe hanging at a low height — you
    // must slide under it.
    g.fillStyle(0x6b3e1a, 1);
    g.fillRect(0, 0, 96, 8);
    g.fillStyle(0x8b6a4a, 1);
    g.fillRect(0, 0, 96, 3);
    g.fillStyle(0xff5252, 1);
    g.fillRect(0, 8, 96, 16);
    g.fillStyle(0xffffff, 1);
    const label = "WET FLOOR";
    g.fillStyle(0xffffff, 1);
    // Just decorative blocks suggesting letters
    for (let i = 0; i < label.length; i++) {
      g.fillRect(8 + i * 8, 12, 5, 8);
    }
    g.fillStyle(0x6b3e1a, 1);
    g.fillRect(0, 24, 96, 4);
    g.lineStyle(1, 0x1a1d28, 1);
    g.strokeRect(0, 0, 96, 32);
  }

  private drawElevator(g: Phaser.GameObjects.Graphics): void {
    // 100 x 130
    g.fillStyle(0x3a3d48, 1);
    g.fillRect(0, 0, 100, 130);
    g.fillStyle(0xc4c4c4, 1);
    g.fillRect(4, 4, 92, 122);
    // Door split
    g.fillStyle(0x9a9a9a, 1);
    g.fillRect(48, 4, 4, 122);
    // Door handles
    g.fillStyle(0x4a4a4a, 1);
    g.fillCircle(40, 80, 2);
    g.fillCircle(60, 80, 2);
    // Floor indicator (lit up)
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(40, 110, 20, 12);
    g.fillStyle(0xffe066, 1);
    g.fillRect(45, 113, 10, 6);
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(48, 115, 4, 2);
    g.lineStyle(2, 0x1a1d28, 1);
    g.strokeRect(0, 0, 100, 130);
  }

  private drawFloorPlant(g: Phaser.GameObjects.Graphics): void {
    // Pot
    g.fillStyle(0x6b3e1a, 1);
    g.fillTriangle(8, 38, 28, 38, 30, 60);
    g.fillTriangle(8, 38, 30, 60, 6, 60);
    g.fillStyle(0x4a2a10, 1);
    g.fillRect(6, 38, 24, 4);
    // Foliage
    g.fillStyle(0x2e7a3a, 1);
    g.fillEllipse(18, 22, 28, 28);
    g.fillStyle(0x3e9a4a, 1);
    g.fillCircle(10, 18, 7);
    g.fillCircle(26, 18, 7);
    g.fillCircle(18, 10, 8);
    g.fillStyle(0x6abd5a, 1);
    g.fillCircle(13, 14, 3);
    g.fillCircle(23, 14, 3);
  }

  private drawColumn(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xc4c4c4, 1);
    g.fillRect(0, 0, 32, 200);
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(2, 0, 4, 200);
    g.fillStyle(0xdddddd, 1);
    g.fillRect(26, 0, 4, 200);
    g.fillStyle(0x999999, 1);
    g.fillRect(0, 0, 32, 6);
    g.fillRect(0, 194, 32, 6);
  }

  private drawWallMonitor(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x1a1a1a, 1);
    g.fillRoundedRect(0, 0, 60, 36, 2);
    g.fillStyle(0x4cc4ff, 0.85);
    g.fillRoundedRect(3, 3, 54, 28, 2);
    // Stock ticker
    g.fillStyle(0xffe066, 1);
    g.fillRect(6, 10, 30, 3);
    g.fillStyle(0xff5252, 1);
    g.fillRect(6, 18, 22, 3);
    g.fillStyle(0x6abd5a, 1);
    g.fillRect(6, 24, 36, 3);
  }

  private drawLamppost(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x2a2a2a, 1);
    g.fillRect(10, 0, 4, 180);
    g.fillRect(6, 174, 12, 6);
    // Lamp head
    g.fillStyle(0x4a4a4a, 1);
    g.fillRect(4, 0, 16, 8);
    g.fillStyle(0xffe066, 0.85);
    g.fillRect(6, 8, 12, 8);
  }

  private drawRevolvingDoor(g: Phaser.GameObjects.Graphics): void {
    // Glass cylinder + vanes
    g.fillStyle(0x1a2a3a, 0.4);
    g.fillRoundedRect(4, 0, 72, 160, 4);
    g.fillStyle(0xc4c4c4, 1);
    g.fillRect(0, 0, 4, 160);
    g.fillRect(76, 0, 4, 160);
    g.fillRect(0, 0, 80, 4);
    g.fillRect(0, 156, 80, 4);
    // Vanes (X shape)
    g.fillStyle(0x3a3d48, 1);
    g.fillRect(38, 4, 4, 152);
    g.fillRect(4, 78, 72, 4);
    // Glass shimmer
    g.fillStyle(0xffffff, 0.15);
    g.fillRect(10, 4, 6, 70);
    g.fillRect(60, 86, 6, 70);
  }

  // ---------- Backgrounds ----------
  private drawSkyGradient(g: Phaser.GameObjects.Graphics): void {
    // Vertical gradient from deep blue to warm horizon
    const steps = 24;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const r = Math.round(20 + t * 90);
      const gn = Math.round(28 + t * 60);
      const b = Math.round(72 + t * 30);
      const color = (r << 16) | (gn << 8) | b;
      g.fillStyle(color, 1);
      g.fillRect(0, Math.floor((i * 360) / steps), 64, Math.ceil(360 / steps) + 1);
    }
  }

  private drawSkyline(
    g: Phaser.GameObjects.Graphics,
    layer: "back" | "front"
  ): void {
    const width = 800;
    const baseY = layer === "back" ? 200 : 240;
    g.fillStyle(layer === "back" ? 0x1a2238 : 0x0c1320, 1);
    // Building silhouettes
    let x = 0;
    while (x < width) {
      const w = Phaser.Math.Between(40, 80);
      const h = Phaser.Math.Between(layer === "back" ? 60 : 100, layer === "back" ? 160 : 220);
      g.fillRect(x, baseY - h, w, h);
      // Window lights
      g.fillStyle(0xffe066, layer === "back" ? 0.5 : 0.8);
      for (let wx = x + 4; wx < x + w - 4; wx += 6) {
        for (let wy = baseY - h + 6; wy < baseY - 6; wy += 8) {
          if (Math.random() > 0.55) g.fillRect(wx, wy, 2, 3);
        }
      }
      g.fillStyle(layer === "back" ? 0x1a2238 : 0x0c1320, 1);
      x += w + Phaser.Math.Between(2, 8);
    }
  }

  private drawPavement(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0x3a3d48, 1);
    g.fillRect(0, 0, 64, 32);
    g.fillStyle(0x2a2d38, 1);
    g.fillRect(0, 0, 64, 2);
    g.lineStyle(1, 0x4a4d58, 0.5);
    g.lineBetween(0, 16, 64, 16);
    g.lineBetween(32, 0, 32, 32);
    // Speckle
    g.fillStyle(0x5a5d68, 0.4);
    for (let i = 0; i < 8; i++) {
      g.fillRect(Phaser.Math.Between(0, 60), Phaser.Math.Between(4, 30), 2, 2);
    }
  }

  private drawMarble(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xd4d6dc, 1);
    g.fillRect(0, 0, 64, 32);
    g.fillStyle(0xc0c2c8, 1);
    g.fillRect(0, 0, 64, 2);
    // Marble veining
    g.lineStyle(1, 0xb0b3ba, 0.6);
    g.lineBetween(4, 8, 18, 14);
    g.lineBetween(30, 18, 48, 26);
    g.lineStyle(1, 0xa0a3aa, 0.4);
    g.lineBetween(20, 4, 36, 10);
    g.lineBetween(50, 20, 60, 30);
    // Subtle tile seam
    g.lineStyle(1, 0xb0b3ba, 0.7);
    g.lineBetween(32, 0, 32, 32);
  }

  private drawLobbyWall(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(0xe8d8b8, 1);
    g.fillRect(0, 0, 64, 64);
    g.lineStyle(1, 0xc8b890, 0.5);
    g.lineBetween(0, 32, 64, 32);
    g.lineBetween(32, 0, 32, 64);
    // Faint wallpaper pattern
    g.fillStyle(0xd8c898, 0.4);
    g.fillCircle(16, 16, 4);
    g.fillCircle(48, 48, 4);
  }
}
