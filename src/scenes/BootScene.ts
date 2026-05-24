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
    this.makeTexture("staple", 16, 10, (g) => this.drawStaple(g));
    this.makeTexture("guard_bullet", 8, 4, (g) => this.drawGuardBullet(g));

    // Muzzle flash sprite (one-shot bright burst at the barrel)
    this.makeTexture("muzzle", 16, 12, (g) => this.drawMuzzle(g));
    this.makeTexture("muzzle_flash", 40, 24, (g) => this.drawMuzzleFlash(g));

    // Particle textures
    this.makeTexture("particle_spark", 6, 6, (g) => this.drawParticleSpark(g));
    this.makeTexture("particle_smoke", 24, 24, (g) => this.drawParticleSmoke(g));
    this.makeTexture("particle_debris", 6, 6, (g) => this.drawParticleDebris(g));

    // Bullet trail glows (stretched gradient bars, ADD-blended)
    this.makeTexture("bullet_trail_player", 60, 8, (g) => this.drawBulletTrail(g, 60, 8, 0xffe066));
    this.makeTexture("bullet_trail_guard", 48, 6, (g) => this.drawBulletTrail(g, 48, 6, 0xffa040));
    this.makeTexture("bullet_glow", 16, 16, (g) => this.drawBulletGlow(g));

    // Vignette via raw canvas (Phaser Graphics doesn't do real radial gradients)
    this.makeVignetteCanvas("vignette", 1280, 720);

    // Custom mouse crosshair
    this.makeTexture("crosshair", 36, 36, (g) => this.drawCrosshair(g));

    // Weapon pickup icon
    this.makeTexture("auto_stapler_pickup", 56, 32, (g) => this.drawAutoStaplerPickup(g));

    // Level props — scaled up roughly 2-3x from v0.x to match the new
    // ~156px-tall character.
    this.makeTexture("desk", 200, 96, (g) => this.drawReceptionDesk(g));
    this.makeTexture("file_cabinet", 76, 108, (g) => this.drawFileCabinet(g));
    this.makeTexture("low_obstacle", 160, 66, (g) => this.drawLowObstacle(g));
    this.makeTexture("elevator", 168, 250, (g) => this.drawElevator(g));
    this.makeTexture("elevator_door", 76, 222, (g) => this.drawElevatorDoor(g));
    this.makeTexture("plant", 88, 144, (g) => this.drawFloorPlant(g));
    this.makeTexture("column", 60, 380, (g) => this.drawColumn(g));
    this.makeTexture("monitor_wall", 120, 72, (g) => this.drawWallMonitor(g));
    this.makeTexture("lamppost", 30, 260, (g) => this.drawLamppost(g));
    this.makeTexture("revolving_door", 140, 280, (g) => this.drawRevolvingDoor(g));
    this.makeTexture("ceiling_light", 80, 16, (g) => this.drawCeilingLight(g));

    // Background layers
    this.makeTexture("sky_gradient", 64, 400, (g) => this.drawSkyGradient(g));
    this.makeTexture("skyline_back", 1000, 240, (g) => this.drawSkyline(g, "back"));
    this.makeTexture("skyline_front", 1000, 300, (g) => this.drawSkyline(g, "front"));
    this.makeTexture("pavement_tile", 96, 48, (g) => this.drawPavement(g));
    this.makeTexture("marble_tile", 96, 48, (g) => this.drawMarble(g));
    this.makeTexture("lobby_wall", 96, 96, (g) => this.drawLobbyWall(g));
    this.makeTexture("cubicle_wall", 96, 96, (g) => this.drawCubicleWall(g));
    this.makeTexture("carpet_tile", 96, 48, (g) => this.drawCarpet(g));
    this.makeTexture("cubicle_divider", 200, 130, (g) => this.drawCubicleDivider(g));
    this.makeTexture("office_chair", 60, 100, (g) => this.drawOfficeChair(g));
    this.makeTexture("hanging_light", 160, 24, (g) => this.drawHangingLight(g));
    this.makeTexture("water_cooler_2", 60, 130, (g) => this.drawWaterCooler(g));
    this.makeTexture("server_rack", 84, 200, (g) => this.drawServerRack(g));
    this.makeTexture("office_door", 60, 140, (g) => this.drawOfficeDoor(g));

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
    // 28x8. Sleeve on left, hand + pistol on right. Origin (0, 0.5) so
    // rotation pivots at the shoulder. White sleeve to match the AI
    // character's white dress shirt.
    // Sleeve (white shirt, rolled-up cuff at the wrist)
    g.fillStyle(0xf5f5f5, 1);
    g.fillRect(0, 1, 12, 6);
    g.fillStyle(0xdadada, 1);
    g.fillRect(0, 5, 12, 2);
    // Cuff
    g.fillStyle(0xc0c0c0, 1);
    g.fillRect(10, 1, 2, 6);
    // Hand
    g.fillStyle(0xffd6b0, 1);
    g.fillRect(12, 2, 4, 5);
    g.fillStyle(0xe8b890, 1);
    g.fillRect(12, 5, 4, 2);
    // Pistol — beefier, two-tone metal
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(15, 1, 13, 4);    // slide
    g.fillStyle(0x3a3a3a, 1);
    g.fillRect(15, 1, 13, 1);    // top highlight
    g.fillStyle(0x4a2a1a, 1);
    g.fillRect(14, 4, 4, 5);     // grip
    g.fillStyle(0x6b3e1a, 1);
    g.fillRect(14, 4, 1, 5);     // grip highlight
    g.fillStyle(0x4a4a4a, 1);
    g.fillRect(26, 0, 2, 1);     // front sight
    // Outlines (cel-ish)
    g.lineStyle(1, 0x000000, 0.5);
    g.strokeRect(0, 1, 12, 6);
    g.strokeRect(15, 1, 13, 4);
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
    // 16 x 10 — actual staple shape. Bullets travel +x, so the bend is
    // on the LEFT (the bullet's tail) and the two prongs lead RIGHT
    // toward whatever they're about to hit.
    // Spine / bend (back of staple)
    g.fillStyle(0xd6d6dc, 1);
    g.fillRect(0, 0, 4, 10);
    // Top prong
    g.fillRect(4, 0, 11, 2);
    // Bottom prong
    g.fillRect(4, 8, 11, 2);
    // Sharper tips
    g.fillRect(14, 0, 2, 3);
    g.fillRect(14, 7, 2, 3);
    // Top highlight (catches light)
    g.fillStyle(0xf2f2f6, 1);
    g.fillRect(0, 0, 16, 1);
    g.fillRect(0, 0, 1, 10);
    // Bottom shadow
    g.fillStyle(0x9a9aa0, 1);
    g.fillRect(0, 9, 16, 1);
    g.fillRect(3, 8, 13, 1);
    g.fillRect(3, 1, 13, 1);
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

  private drawMuzzleFlash(g: Phaser.GameObjects.Graphics): void {
    // 40 x 24 — bright radial burst sprite. Used by Particles.muzzleFlash
    // as the instant flash overlay before sparks fly outward.
    g.fillStyle(0xfff0a0, 0.9);
    g.fillEllipse(20, 12, 36, 18);
    g.fillStyle(0xffe066, 1);
    g.fillEllipse(20, 12, 22, 12);
    g.fillStyle(0xffffff, 0.95);
    g.fillEllipse(20, 12, 10, 6);
  }

  private drawParticleSpark(g: Phaser.GameObjects.Graphics): void {
    // White 4x4 — will be tinted at emit time. Slight rounding for softness.
    g.fillStyle(0xffffff, 1);
    g.fillRect(1, 0, 4, 6);
    g.fillRect(0, 1, 6, 4);
  }

  private drawParticleSmoke(g: Phaser.GameObjects.Graphics): void {
    // Soft circle gradient — approximate with concentric circles of
    // decreasing alpha.
    for (let r = 12; r >= 1; r--) {
      g.fillStyle(0xffffff, (1 - r / 12) * 0.18);
      g.fillCircle(12, 12, r);
    }
  }

  private drawParticleDebris(g: Phaser.GameObjects.Graphics): void {
    // Small chunky square — will be tinted dark at emit time.
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 6, 6);
  }

  private drawBulletTrail(
    g: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
    color: number
  ): void {
    // Horizontal gradient — fully transparent on left, opaque on right.
    // Sprite uses origin (1, 0.5) so the bright end is at the bullet and
    // the trail fades off behind.
    for (let x = 0; x < w; x++) {
      const t = x / (w - 1);
      const alpha = Math.pow(t, 1.6) * 0.85;
      g.fillStyle(color, alpha);
      g.fillRect(x, 0, 1, h);
    }
  }

  private drawBulletGlow(g: Phaser.GameObjects.Graphics): void {
    // Soft 16x16 radial glow — drawn behind each bullet via ADD blend.
    for (let r = 8; r >= 1; r--) {
      g.fillStyle(0xffffff, (1 - r / 8) * 0.4);
      g.fillCircle(8, 8, r);
    }
  }

  private drawAutoStaplerPickup(g: Phaser.GameObjects.Graphics): void {
    // 56 x 32 — chunky auto stapler icon (looks like a long mean stapler)
    const W = 56;
    // Drop shadow underneath
    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(W / 2, 28, 40, 6);
    // Lower body (red)
    g.fillStyle(0xc73a3a, 1);
    g.fillRoundedRect(4, 14, W - 8, 12, 3);
    // Lower body shading
    g.fillStyle(0x8a1818, 1);
    g.fillRect(4, 22, W - 8, 4);
    // Upper jaw (gunmetal)
    g.fillStyle(0x3a3f4c, 1);
    g.fillRoundedRect(8, 6, W - 16, 10, 2);
    g.fillStyle(0x5a5f6c, 1);
    g.fillRect(8, 6, W - 16, 2);
    // Hinge pin
    g.fillStyle(0xe8b33a, 1);
    g.fillCircle(W - 12, 12, 3);
    // Trigger / button indicator
    g.fillStyle(0xffe066, 1);
    g.fillRect(W - 18, 16, 4, 6);
    // Outline
    g.lineStyle(1, 0x12141b, 1);
    g.strokeRoundedRect(4, 14, W - 8, 12, 3);
    g.strokeRoundedRect(8, 6, W - 16, 10, 2);
  }

  private drawCrosshair(g: Phaser.GameObjects.Graphics): void {
    // 36 x 36 — bright crosshair with center dot
    const c = 18;
    g.lineStyle(2, 0xffe066, 0.95);
    // Four ticks
    g.lineBetween(c - 14, c, c - 5, c);
    g.lineBetween(c + 5, c, c + 14, c);
    g.lineBetween(c, c - 14, c, c - 5);
    g.lineBetween(c, c + 5, c, c + 14);
    // Center dot
    g.fillStyle(0xff5252, 1);
    g.fillCircle(c, c, 1.5);
    // Outer faint ring
    g.lineStyle(1, 0xffe066, 0.3);
    g.strokeCircle(c, c, 14);
  }

  private makeVignetteCanvas(key: string, w: number, h: number): void {
    // Render a real radial gradient to a canvas, then register it as a
    // Phaser texture. Used as a screen overlay during slow-mo.
    if (this.textures.exists(key)) return;
    const canvas = this.textures.createCanvas(key, w, h);
    if (!canvas) return;
    const ctx = canvas.getContext();
    const cx = w / 2;
    const cy = h / 2;
    const inner = Math.min(w, h) * 0.18;
    const outer = Math.sqrt(cx * cx + cy * cy);
    const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(0.5, "rgba(0,0,0,0.15)");
    grad.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    canvas.refresh();
  }

  // ---------- Props ----------
  // Style note: cohesive limited palette, flat shading, strong silhouettes.
  // Gameplay objects (desk/cabinet/elevator/wet-floor) carry visual weight;
  // pure decor (columns/plants/monitors) is quieter.

  private drawReceptionDesk(g: Phaser.GameObjects.Graphics): void {
    // 200 x 96 — a wide warm-wood reception desk.
    const W = 200, H = 96;
    // Counter top (darker)
    g.fillStyle(0x3a2814, 1);
    g.fillRect(0, 0, W, 12);
    // Front body
    g.fillStyle(0x8a6438, 1);
    g.fillRect(0, 12, W, H - 12);
    // Front-panel shading
    g.fillStyle(0x6e4f2c, 1);
    g.fillRect(0, H - 16, W, 16);
    // Vertical panel divisions
    g.fillStyle(0x6e4f2c, 1);
    g.fillRect(W / 3 - 2, 12, 4, H - 12);
    g.fillRect((W / 3) * 2 - 2, 12, 4, H - 12);
    // Brass kickplate
    g.fillStyle(0x9a7b3a, 1);
    g.fillRect(0, H - 6, W, 6);
    // Brand placard (gold rectangle on the front)
    g.fillStyle(0xc9982a, 1);
    g.fillRect(W / 2 - 36, 36, 72, 18);
    g.fillStyle(0x1e1408, 1);
    g.fillRect(W / 2 - 28, 42, 56, 2);
    g.fillRect(W / 2 - 28, 46, 40, 2);
  }

  private drawFileCabinet(g: Phaser.GameObjects.Graphics): void {
    // 76 x 108 — steel filing cabinet, 3 drawers. Sized so the player can
    // just barely jump on top of it.
    const W = 76, H = 108;
    g.fillStyle(0x4a4f5c, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0x6a6f7c, 1);
    g.fillRect(0, 0, W, 4);
    g.fillStyle(0x3a3f4c, 1);
    g.fillRect(W - 6, 0, 6, H);
    const drawers = 3;
    const drawerH = (H - 8) / drawers;
    for (let i = 0; i < drawers; i++) {
      const y = 6 + i * drawerH;
      g.fillStyle(0x2a2f3a, 1);
      g.fillRect(4, y, W - 8, 2);
      g.fillStyle(0x5a5f6c, 1);
      g.fillRect(4, y + 2, W - 8, 4);
      g.fillStyle(0x1f232c, 1);
      g.fillRect(W / 2 - 10, y + drawerH / 2, 20, 4);
      g.fillStyle(0xe8e3d2, 1);
      g.fillRect(W / 2 - 14, y + 6, 28, 6);
    }
  }

  private drawLowObstacle(g: Phaser.GameObjects.Graphics): void {
    // 160 x 66 — yellow/black hazard barrier you slide under.
    const W = 160, H = 66;
    // Hanging chains from ceiling (decorative top edge)
    g.fillStyle(0x2a2f3a, 1);
    g.fillRect(20, 0, 4, 6);
    g.fillRect(W - 24, 0, 4, 6);
    // Top bar
    g.fillStyle(0x1f232c, 1);
    g.fillRect(0, 4, W, 10);
    // Yellow body with diagonal hazard stripes
    g.fillStyle(0xe8b833, 1);
    g.fillRect(0, 14, W, H - 22);
    g.fillStyle(0x1f232c, 1);
    const stripeW = 14;
    for (let x = -H; x < W; x += stripeW * 2) {
      g.fillTriangle(x, H - 8, x + stripeW, H - 8, x + stripeW + 16, 14);
      g.fillTriangle(x, H - 8, x + 16, 14, x + stripeW + 16, 14);
    }
    // Top text band (lighter yellow)
    g.fillStyle(0xf4d680, 1);
    g.fillRect(8, 18, W - 16, 12);
    g.fillStyle(0x1f232c, 1);
    // Stylized "CAUTION" — just chunky blocks reading as letters
    const letters = 7;
    const letterW = ((W - 32) - (letters - 1) * 2) / letters;
    for (let i = 0; i < letters; i++) {
      g.fillRect(16 + i * (letterW + 2), 20, letterW, 8);
    }
    // Bottom bar
    g.fillStyle(0x1f232c, 1);
    g.fillRect(0, H - 8, W, 8);
  }

  private drawElevator(g: Phaser.GameObjects.Graphics): void {
    // 168 x 250 — elevator FRAME only (no doors). Doors are separate
    // animated sprites placed on top inside the dark cab area.
    const W = 168, H = 250;
    // Wall recess (dark) — elevator sits inside this frame
    g.fillStyle(0x18181f, 1);
    g.fillRect(0, 0, W, H);
    // Steel frame
    g.fillStyle(0x6b6e7a, 1);
    g.fillRect(8, 8, W - 16, H - 16);
    g.fillStyle(0x4a4d58, 1);
    g.fillRect(8, 8, W - 16, 6);
    g.fillRect(8, H - 14, W - 16, 6);
    // Open cab interior (dark)
    g.fillStyle(0x0d0e12, 1);
    g.fillRect(16, 14, W - 32, H - 28);
    // Soft cab interior glow
    g.fillStyle(0xfaf0c8, 0.06);
    g.fillRect(16, 14, W - 32, H - 28);
    // Floor of the cab inside (lit)
    g.fillStyle(0x2a2d36, 1);
    g.fillRect(16, H - 22, W - 32, 8);
    // Floor indicator panel (above door)
    g.fillStyle(0x18181f, 1);
    g.fillRect(W / 2 - 24, -22, 48, 18);
    g.fillStyle(0xe8b33a, 1);
    g.fillRect(W / 2 - 18, -18, 36, 10);
    g.fillStyle(0x18181f, 1);
    g.fillRect(W / 2 - 4, -16, 8, 6); // "1" digit placeholder
    // Up arrow indicator
    g.fillStyle(0x6abd5a, 1);
    g.fillTriangle(W - 28, 28, W - 18, 16, W - 8, 28);
  }

  private drawElevatorDoor(g: Phaser.GameObjects.Graphics): void {
    // 76 x 222 — one door panel. Two of these slide together for the
    // elevator's closing animation. Brushed steel.
    const W = 76, H = 222;
    g.fillStyle(0xb8bbc4, 1);
    g.fillRect(0, 0, W, H);
    // Top + bottom shadow bands
    g.fillStyle(0x9a9da4, 1);
    g.fillRect(0, 0, W, 4);
    g.fillRect(0, H - 4, W, 4);
    // Vertical brushed lines
    g.fillStyle(0xa0a3ac, 0.7);
    for (let x = 4; x < W; x += 6) g.fillRect(x, 4, 1, H - 8);
    // Inner edge shadow (where the doors meet)
    g.fillStyle(0x6a6d76, 1);
    g.fillRect(W - 4, 4, 4, H - 8);
    // Handle dimple
    g.fillStyle(0x4a4d58, 1);
    g.fillRect(W - 12, H / 2 - 12, 4, 24);
  }

  private drawFloorPlant(g: Phaser.GameObjects.Graphics): void {
    // 88 x 144 — tall potted ficus, simple silhouette.
    const W = 88, H = 144;
    // Pot
    const potTop = H - 44;
    g.fillStyle(0x3d2210, 1);
    g.fillTriangle(14, potTop, W - 14, potTop, W - 8, H);
    g.fillTriangle(14, potTop, W - 8, H, 8, H);
    // Pot lip
    g.fillStyle(0x5c3a1a, 1);
    g.fillRect(8, potTop - 4, W - 16, 6);
    // Foliage (layered green silhouettes)
    g.fillStyle(0x1e3f2a, 1); // deepest layer
    g.fillEllipse(W / 2, potTop - 20, W - 4, 64);
    g.fillStyle(0x2e5a3a, 1);
    g.fillEllipse(W / 2 - 12, potTop - 32, 50, 50);
    g.fillEllipse(W / 2 + 12, potTop - 26, 48, 48);
    g.fillEllipse(W / 2, potTop - 48, 56, 56);
    // Highlights
    g.fillStyle(0x4a8f4a, 1);
    g.fillCircle(W / 2 - 10, potTop - 50, 6);
    g.fillCircle(W / 2 + 18, potTop - 38, 5);
    g.fillCircle(W / 2 - 18, potTop - 28, 5);
  }

  private drawColumn(g: Phaser.GameObjects.Graphics): void {
    // 60 x 380 — tall marble column, simple gradient + capital + base.
    const W = 60, H = 380;
    // Shaft body
    g.fillStyle(0xeaeaee, 1);
    g.fillRect(0, 0, W, H);
    // Subtle vertical shading (right side darker)
    g.fillStyle(0xd0d2d8, 1);
    g.fillRect(W - 12, 0, 12, H);
    // Left side highlight
    g.fillStyle(0xf6f6f8, 1);
    g.fillRect(0, 0, 6, H);
    // Capital (top decorative)
    g.fillStyle(0xc8cad0, 1);
    g.fillRect(-4, 0, W + 8, 18);
    g.fillStyle(0xeaeaee, 1);
    g.fillRect(-4, 0, W + 8, 6);
    // Base (bottom decorative)
    g.fillStyle(0xc8cad0, 1);
    g.fillRect(-4, H - 24, W + 8, 24);
    g.fillStyle(0xa0a3aa, 1);
    g.fillRect(-4, H - 8, W + 8, 8);
  }

  private drawWallMonitor(g: Phaser.GameObjects.Graphics): void {
    // 120 x 72 — flat screen displaying a stock-ticker chart.
    const W = 120, H = 72;
    // Wall mount shadow
    g.fillStyle(0x1a1c22, 0.35);
    g.fillRect(6, H - 6, W - 12, 4);
    // Bezel
    g.fillStyle(0x1f232c, 1);
    g.fillRect(0, 0, W, H);
    // Screen
    g.fillStyle(0x103040, 1);
    g.fillRect(6, 6, W - 12, H - 12);
    // Stock chart line
    g.fillStyle(0x6abd5a, 1);
    g.fillRect(12, 38, 14, 3);
    g.fillRect(26, 32, 14, 3);
    g.fillRect(40, 36, 14, 3);
    g.fillRect(54, 24, 14, 3);
    g.fillRect(68, 28, 14, 3);
    g.fillRect(82, 20, 14, 3);
    g.fillRect(96, 16, 14, 3);
    // Number readout
    g.fillStyle(0xffe066, 1);
    g.fillRect(12, 10, 36, 6);
    g.fillStyle(0xc73a3a, 1);
    g.fillRect(12, 52, 24, 4);
  }

  private drawLamppost(g: Phaser.GameObjects.Graphics): void {
    // 30 x 260 — slim modern street lamp with a glowing head.
    const W = 30, H = 260;
    // Pole
    g.fillStyle(0x1f232c, 1);
    g.fillRect(W / 2 - 2, 24, 4, H - 24);
    // Base
    g.fillStyle(0x14171f, 1);
    g.fillRect(W / 2 - 8, H - 8, 16, 8);
    // Lamp arm
    g.fillStyle(0x1f232c, 1);
    g.fillRect(W / 2 - 2, 18, 4, 8);
    // Lamp head
    g.fillStyle(0x2a2e38, 1);
    g.fillRect(0, 6, W, 12);
    g.fillStyle(0x14171f, 1);
    g.fillRect(0, 4, W, 4);
    // Glow
    g.fillStyle(0xf4d680, 0.95);
    g.fillRect(4, 18, W - 8, 8);
    // Halo
    g.fillStyle(0xf4d680, 0.18);
    g.fillCircle(W / 2, 24, 22);
  }

  private drawRevolvingDoor(g: Phaser.GameObjects.Graphics): void {
    // 140 x 280 — wider, taller, real glass-cylinder look.
    const W = 140, H = 280;
    // Frame
    g.fillStyle(0x2a2f3a, 1);
    g.fillRect(0, 0, W, H);
    // Glass interior (cool tinted)
    g.fillStyle(0x4a6b8b, 0.45);
    g.fillRect(8, 8, W - 16, H - 16);
    // Vanes (cross divider)
    g.fillStyle(0x14171f, 1);
    g.fillRect(W / 2 - 3, 8, 6, H - 16);
    g.fillRect(8, H / 2 - 3, W - 16, 6);
    // Top + bottom trim (brushed metal)
    g.fillStyle(0xa0a3ac, 1);
    g.fillRect(0, 0, W, 8);
    g.fillRect(0, H - 8, W, 8);
    // Glass highlights
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(14, 14, 8, H / 2 - 22);
    g.fillRect(W / 2 + 8, H / 2 + 8, 8, H / 2 - 22);
  }

  private drawCeilingLight(g: Phaser.GameObjects.Graphics): void {
    // 80 x 16 — recessed ceiling fixture casting a warm glow.
    const W = 80, H = 16;
    g.fillStyle(0x1f232c, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0xfaf0c8, 1);
    g.fillRect(4, 4, W - 8, H - 8);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(8, 6, W - 16, 2);
  }

  // ---------- Backgrounds ----------
  private drawSkyGradient(g: Phaser.GameObjects.Graphics): void {
    // Dusk gradient — deep navy at top, warm horizon at bottom.
    const steps = 36;
    const top = [0x16, 0x1f, 0x33]; // deep navy
    const mid = [0x3a, 0x4a, 0x6a];
    const bot = [0x7b, 0x6a, 0x5a]; // warm violet-rust horizon
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      let r: number, gn: number, b: number;
      if (t < 0.5) {
        const k = t * 2;
        r = Math.round(top[0] + (mid[0] - top[0]) * k);
        gn = Math.round(top[1] + (mid[1] - top[1]) * k);
        b = Math.round(top[2] + (mid[2] - top[2]) * k);
      } else {
        const k = (t - 0.5) * 2;
        r = Math.round(mid[0] + (bot[0] - mid[0]) * k);
        gn = Math.round(mid[1] + (bot[1] - mid[1]) * k);
        b = Math.round(mid[2] + (bot[2] - mid[2]) * k);
      }
      g.fillStyle((r << 16) | (gn << 8) | b, 1);
      g.fillRect(0, Math.floor((i * 400) / steps), 64, Math.ceil(400 / steps) + 1);
    }
  }

  private drawSkyline(
    g: Phaser.GameObjects.Graphics,
    layer: "back" | "front"
  ): void {
    // Cleaner silhouettes — fewer buildings, more atmospheric.
    const W = 1000;
    const baseY = layer === "back" ? 240 : 300;
    const baseColor = layer === "back" ? 0x202a44 : 0x0e1424;
    const lightAlpha = layer === "back" ? 0.45 : 0.9;
    g.fillStyle(baseColor, 1);
    let x = 0;
    while (x < W) {
      const w = Phaser.Math.Between(layer === "back" ? 70 : 90, layer === "back" ? 130 : 170);
      const h = Phaser.Math.Between(layer === "back" ? 90 : 140, layer === "back" ? 200 : 280);
      g.fillStyle(baseColor, 1);
      g.fillRect(x, baseY - h, w, h);
      // Building top accent (antenna or setback)
      if (Math.random() > 0.6) {
        const aW = Phaser.Math.Between(8, 18);
        const aH = Phaser.Math.Between(12, 28);
        g.fillRect(x + w / 2 - aW / 2, baseY - h - aH, aW, aH);
      }
      // Window lights — denser but smaller
      g.fillStyle(0xf2d680, lightAlpha);
      const wCols = Math.floor((w - 14) / 8);
      const wRows = Math.floor((h - 14) / 12);
      for (let cx = 0; cx < wCols; cx++) {
        for (let cy = 0; cy < wRows; cy++) {
          if (Math.random() > 0.55) {
            g.fillRect(x + 7 + cx * 8, baseY - h + 8 + cy * 12, 3, 4);
          }
        }
      }
      x += w + Phaser.Math.Between(0, 6);
    }
  }

  private drawPavement(g: Phaser.GameObjects.Graphics): void {
    // 96 x 48 — dark concrete sidewalk panels.
    const W = 96, H = 48;
    g.fillStyle(0x2d2f38, 1);
    g.fillRect(0, 0, W, H);
    // Panel divisions
    g.fillStyle(0x1f2128, 1);
    g.fillRect(0, 0, W, 2);
    g.fillRect(W / 2 - 1, 0, 2, H);
    // Subtle highlight along top edge of each panel
    g.fillStyle(0x40434c, 0.5);
    g.fillRect(2, 2, W / 2 - 4, 2);
    g.fillRect(W / 2 + 2, 2, W / 2 - 4, 2);
  }

  private drawMarble(g: Phaser.GameObjects.Graphics): void {
    // 96 x 48 — large polished marble tiles.
    const W = 96, H = 48;
    g.fillStyle(0xc5c9d2, 1);
    g.fillRect(0, 0, W, H);
    // Top sheen
    g.fillStyle(0xdde0e8, 1);
    g.fillRect(0, 0, W, 4);
    // Tile seams
    g.fillStyle(0x9ca0aa, 1);
    g.fillRect(0, 0, W, 1);
    g.fillRect(W / 2 - 1, 0, 1, H);
    // Subtle vein (one per tile)
    g.fillStyle(0x9ca0aa, 0.4);
    g.fillRect(12, 18, 24, 1);
    g.fillRect(W / 2 + 18, 30, 28, 1);
  }

  private drawLobbyWall(g: Phaser.GameObjects.Graphics): void {
    // 96 x 96 — clean warm cream wall, almost flat.
    const W = 96, H = 96;
    g.fillStyle(0xe8d0ac, 1);
    g.fillRect(0, 0, W, H);
    // Subtle wash (warmer near bottom)
    g.fillStyle(0xd9bf95, 0.4);
    g.fillRect(0, H / 2, W, H / 2);
    // Wainscoting trim line
    g.fillStyle(0x6e4f2c, 1);
    g.fillRect(0, H - 8, W, 4);
    g.fillStyle(0x8a6438, 1);
    g.fillRect(0, H - 4, W, 4);
  }

  private drawCubicleWall(g: Phaser.GameObjects.Graphics): void {
    // 96 x 96 — industrial gray office wall with subtle panel lines.
    const W = 96, H = 96;
    g.fillStyle(0xb8bcc4, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0xa0a4ac, 0.5);
    g.fillRect(0, H / 2, W, H / 2);
    // Vertical seam lines (drywall panels)
    g.fillStyle(0x8c9098, 0.5);
    g.fillRect(W / 2 - 1, 0, 1, H);
    // Floor trim
    g.fillStyle(0x2c2f38, 1);
    g.fillRect(0, H - 6, W, 6);
  }

  private drawCarpet(g: Phaser.GameObjects.Graphics): void {
    // 96 x 48 — industrial gray office carpet, subtle weave.
    const W = 96, H = 48;
    g.fillStyle(0x5a5d68, 1);
    g.fillRect(0, 0, W, H);
    // Tile seams (large 24" carpet squares)
    g.fillStyle(0x4a4d58, 1);
    g.fillRect(0, 0, W, 2);
    g.fillRect(W / 2 - 1, 0, 2, H);
    // Subtle weave dots
    g.fillStyle(0x6c6f78, 0.4);
    for (let y = 6; y < H; y += 4) {
      for (let x = 6; x < W; x += 4) {
        g.fillRect(x, y, 1, 1);
      }
    }
  }

  private drawCubicleDivider(g: Phaser.GameObjects.Graphics): void {
    // 200 x 130 — fabric-covered partition wall (background decor).
    const W = 200, H = 130;
    // Frame edges
    g.fillStyle(0x4a4f5c, 1);
    g.fillRect(0, 0, W, H);
    // Fabric panel
    g.fillStyle(0x7a8a9a, 1);
    g.fillRect(4, 4, W - 8, H - 12);
    // Subtle fabric weave shading
    g.fillStyle(0x5a6a7a, 0.35);
    for (let y = 8; y < H - 16; y += 6) g.fillRect(6, y, W - 12, 1);
    // Top cap
    g.fillStyle(0x2a2f3a, 1);
    g.fillRect(0, 0, W, 6);
    // Base/foot
    g.fillStyle(0x2a2f3a, 1);
    g.fillRect(0, H - 8, W, 8);
    // Cable management notch on right side
    g.fillStyle(0x1f232c, 1);
    g.fillRect(W - 18, H / 2 - 8, 14, 16);
  }

  private drawOfficeChair(g: Phaser.GameObjects.Graphics): void {
    // 60 x 100 — rolling office chair (side view).
    const W = 60, H = 100;
    // Wheel base (5-star spider)
    g.fillStyle(0x1f232c, 1);
    g.fillRect(8, H - 12, W - 16, 6);
    g.fillCircle(12, H - 4, 5);
    g.fillCircle(W - 12, H - 4, 5);
    // Hydraulic pole
    g.fillStyle(0x4a4d58, 1);
    g.fillRect(W / 2 - 3, H - 50, 6, 38);
    // Seat
    g.fillStyle(0x2a2f3a, 1);
    g.fillRect(8, H - 60, W - 16, 14);
    // Backrest
    g.fillStyle(0x2a2f3a, 1);
    g.fillRect(W - 22, H - 100, 14, 50);
    g.fillStyle(0x3a3f4c, 1);
    g.fillRect(W - 20, H - 98, 10, 46);
    // Armrest
    g.fillStyle(0x4a4d58, 1);
    g.fillRect(8, H - 70, 8, 22);
  }

  private drawHangingLight(g: Phaser.GameObjects.Graphics): void {
    // 160 x 24 — fluorescent tube hanging from ceiling. Used as a
    // low obstacle to slide under.
    const W = 160;
    // Chains
    g.fillStyle(0x2a2f3a, 1);
    g.fillRect(W / 4 - 1, 0, 2, 6);
    g.fillRect((W / 4) * 3 - 1, 0, 2, 6);
    // Housing
    g.fillStyle(0x6a6f7c, 1);
    g.fillRect(0, 6, W, 10);
    g.fillStyle(0x4a4d58, 1);
    g.fillRect(0, 6, W, 3);
    // Tube (bright white)
    g.fillStyle(0xfaf0c8, 1);
    g.fillRect(8, 10, W - 16, 4);
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(10, 11, W - 20, 1);
    // Reflector below
    g.fillStyle(0x4a4d58, 1);
    g.fillRect(0, 16, W, 4);
    // Glow underneath (additive feel)
    g.fillStyle(0xfaf0c8, 0.3);
    g.fillRect(8, 20, W - 16, 4);
  }

  private drawWaterCooler(g: Phaser.GameObjects.Graphics): void {
    // 60 x 130 — water cooler.
    const W = 60, H = 130;
    // Bottle (upside-down jug)
    g.fillStyle(0xc8e0f0, 1);
    g.fillRect(8, 0, W - 16, 40);
    g.fillStyle(0x88aabe, 0.7);
    g.fillRect(10, 4, W - 20, 32);
    // Cap
    g.fillStyle(0x2a4a5a, 1);
    g.fillRect(20, 38, W - 40, 8);
    // Cooler body
    g.fillStyle(0xe8e8ec, 1);
    g.fillRect(0, 46, W, H - 46);
    g.fillStyle(0xc8c8cc, 1);
    g.fillRect(0, 46, W, 4);
    // Spigot
    g.fillStyle(0x2a2f3a, 1);
    g.fillRect(W / 2 - 6, 80, 12, 8);
    g.fillStyle(0x88c8ff, 1);
    g.fillCircle(W / 2 - 6, 84, 2);
    g.fillStyle(0xff5252, 1);
    g.fillCircle(W / 2 + 6, 84, 2);
    // Drip tray
    g.fillStyle(0x1f232c, 1);
    g.fillRect(W / 2 - 12, 96, 24, 6);
  }

  private drawOfficeDoor(g: Phaser.GameObjects.Graphics): void {
    // 60 x 140 — closed office door, brown wood with frosted glass panel
    // in the top third and a brass doorknob on the right.
    const W = 60, H = 140;
    // Frame
    g.fillStyle(0x2a1d10, 1);
    g.fillRect(0, 0, W, H);
    // Door body
    g.fillStyle(0x7a4a22, 1);
    g.fillRect(3, 3, W - 6, H - 3);
    // Wood grain stripes
    g.fillStyle(0x5c3a18, 1);
    for (let y = 8; y < H - 4; y += 16) g.fillRect(6, y, W - 12, 1);
    // Frosted glass top panel
    g.fillStyle(0xc8d6dc, 1);
    g.fillRect(8, 12, W - 16, 40);
    g.fillStyle(0xa8b6bc, 0.6);
    g.fillRect(8, 12, W - 16, 4);
    g.fillStyle(0xe4ecef, 0.4);
    g.fillRect(10, 16, W - 20, 30);
    // Glass panel frame
    g.lineStyle(2, 0x4a2d10, 1);
    g.strokeRect(8, 12, W - 16, 40);
    // Lower panel divider
    g.fillStyle(0x4a2d10, 1);
    g.fillRect(8, 80, W - 16, 2);
    // Doorknob
    g.fillStyle(0xc59842, 1);
    g.fillCircle(W - 12, 100, 4);
    g.fillStyle(0xe8b33a, 1);
    g.fillCircle(W - 13, 99, 1.5);
    // Hinge marks
    g.fillStyle(0x1a1006, 1);
    g.fillCircle(5, 20, 2);
    g.fillCircle(5, 120, 2);
  }

  private drawServerRack(g: Phaser.GameObjects.Graphics): void {
    // 84 x 200 — server rack with blinking LEDs (a few rendered as
    // tiny lit rects).
    const W = 84, H = 200;
    g.fillStyle(0x1a1d24, 1);
    g.fillRect(0, 0, W, H);
    g.fillStyle(0x2a2f3a, 1);
    g.fillRect(4, 4, W - 8, H - 8);
    // Rack units (8 slots)
    for (let i = 0; i < 8; i++) {
      const y = 8 + i * 24;
      g.fillStyle(0x14171f, 1);
      g.fillRect(8, y, W - 16, 20);
      // Status LEDs (random color)
      const colors = [0x6abd5a, 0xffe066, 0xc73a3a, 0x88ddff];
      for (let j = 0; j < 3; j++) {
        const c = colors[Math.floor(Math.random() * colors.length)];
        g.fillStyle(c, 1);
        g.fillRect(14 + j * 8, y + 6, 2, 2);
      }
      // Drive bay slot
      g.fillStyle(0x3a3f4c, 1);
      g.fillRect(W - 24, y + 4, 14, 12);
    }
  }
}
