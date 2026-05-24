import Phaser from "phaser";

// One-shot particle bursts. We allocate an emitter per call and destroy
// it after the particles die — keeps the API trivial and Phaser is fine
// with this pattern at our event rates.

export class Particles {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // Muzzle flash: bright yellow/white cone in the firing direction +
  // a quick bright flash sprite at the barrel.
  muzzleFlash(x: number, y: number, angleRad: number): void {
    const deg = (angleRad * 180) / Math.PI;
    const em = this.scene.add.particles(x, y, "particle_spark", {
      speed: { min: 120, max: 320 },
      angle: { min: deg - 18, max: deg + 18 },
      scale: { start: 1.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 90, max: 180 },
      tint: [0xfff5d0, 0xffe066, 0xffa040],
      blendMode: "ADD",
    });
    em.setDepth(15);
    em.explode(7);
    this.scene.time.delayedCall(220, () => em.destroy());

    // Bright flash at the muzzle itself (sprite, not particles, for control)
    const flash = this.scene.add.image(x, y, "muzzle_flash");
    flash.setBlendMode(Phaser.BlendModes.ADD);
    flash.setRotation(angleRad);
    flash.setDepth(15);
    flash.setScale(1.4, 0.9);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 0.2,
      scaleY: 0.2,
      alpha: 0,
      duration: 80,
      onComplete: () => flash.destroy(),
    });
  }

  // Sparks at a bullet impact point — small omnidirectional burst with
  // a touch of gravity so they fall realistically.
  impactSparks(x: number, y: number, count = 8): void {
    const em = this.scene.add.particles(x, y, "particle_spark", {
      speed: { min: 90, max: 260 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 200, max: 380 },
      tint: [0xffe066, 0xffa040, 0xfff5d0],
      blendMode: "ADD",
      gravityY: 500,
    });
    em.setDepth(15);
    em.explode(count);
    this.scene.time.delayedCall(450, () => em.destroy());
  }

  // Thin gray smoke puff — drifts upward, fades. Use sparingly so the
  // screen doesn't get crowded.
  smokePuff(x: number, y: number, count = 3): void {
    const em = this.scene.add.particles(x, y, "particle_smoke", {
      speed: { min: 18, max: 60 },
      angle: { min: 240, max: 300 },
      scale: { start: 0.35, end: 1.1 },
      alpha: { start: 0.45, end: 0 },
      lifespan: { min: 600, max: 900 },
      tint: 0xaaaaaa,
    });
    em.setDepth(14);
    em.explode(count);
    this.scene.time.delayedCall(1000, () => em.destroy());
  }

  // Dark debris chunks — fall with gravity, tumble.
  debrisBurst(x: number, y: number, count = 8): void {
    const em = this.scene.add.particles(x, y, "particle_debris", {
      speed: { min: 80, max: 260 },
      angle: { min: 200, max: 340 },
      scale: { start: 1.2, end: 0.6 },
      alpha: { start: 1, end: 0.4 },
      lifespan: { min: 700, max: 1200 },
      gravityY: 900,
      rotate: { min: 0, max: 360 },
      tint: [0x2a2f3a, 0x4a4f5c, 0x1f232c],
    });
    em.setDepth(13);
    em.explode(count);
    this.scene.time.delayedCall(1400, () => em.destroy());
  }

  // Guard death — red splatter + dark debris combo.
  guardDeath(x: number, y: number): void {
    const em = this.scene.add.particles(x, y, "particle_spark", {
      speed: { min: 60, max: 240 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 300, max: 500 },
      tint: [0xc73a3a, 0x8a1818, 0xff5252, 0x2a2f3a],
      gravityY: 700,
    });
    em.setDepth(14);
    em.explode(22);
    this.scene.time.delayedCall(600, () => em.destroy());
    this.debrisBurst(x, y, 10);
    this.smokePuff(x, y - 8, 2);
  }

  // Player hit — red flash particles + a couple of debris bits.
  playerHit(x: number, y: number): void {
    const em = this.scene.add.particles(x, y, "particle_spark", {
      speed: { min: 40, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.9, end: 0 },
      lifespan: { min: 200, max: 380 },
      tint: [0xc73a3a, 0xff5252],
    });
    em.setDepth(14);
    em.explode(10);
    this.scene.time.delayedCall(450, () => em.destroy());
  }

  // Slide dust — kicked-up trail behind a sliding character.
  slideDust(x: number, y: number, direction: number): void {
    const em = this.scene.add.particles(x, y, "particle_smoke", {
      speed: { min: 30, max: 100 },
      angle: { min: direction > 0 ? 150 : 30, max: direction > 0 ? 210 : 30 },
      scale: { start: 0.3, end: 0.8 },
      alpha: { start: 0.5, end: 0 },
      lifespan: { min: 300, max: 500 },
      tint: 0xc8b890,
    });
    em.setDepth(11);
    em.explode(4);
    this.scene.time.delayedCall(600, () => em.destroy());
  }
}
