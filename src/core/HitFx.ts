import Phaser from "phaser";

// Tactile combat feedback: brief physics pauses, scaled screen shakes,
// full-screen flash overlays. All effects are short and additive — many
// can fire in the same frame.

export class HitFx {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  // Briefly pauses physics for tactile "punch" feel. Timers + tweens
  // continue so particle bursts still animate.
  hitPause(durationMs: number): void {
    if (durationMs <= 0) return;
    this.scene.physics.world.pause();
    this.scene.time.delayedCall(durationMs, () => {
      this.scene.physics.world.resume();
    });
  }

  shake(intensity: number, durationMs: number): void {
    this.scene.cameras.main.shake(durationMs, intensity);
  }

  // Full-screen color flash that fades out. Color is RGB, alpha 0-1.
  flash(color: number, durationMs: number, alpha = 0.35): void {
    const cam = this.scene.cameras.main;
    const overlay = this.scene.add.rectangle(
      cam.worldView.x,
      cam.worldView.y,
      cam.width,
      cam.height,
      color,
      alpha
    );
    overlay.setOrigin(0, 0);
    overlay.setScrollFactor(0);
    overlay.setDepth(1500);
    this.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: durationMs,
      onComplete: () => overlay.destroy(),
    });
  }

  // Brief camera zoom punch — quick zoom in then back out. Use sparingly.
  zoomPunch(intensity = 1.04, durationMs = 90): void {
    const cam = this.scene.cameras.main;
    const baseZoom = cam.zoom;
    cam.setZoom(baseZoom * intensity);
    this.scene.tweens.add({
      targets: cam,
      zoom: baseZoom,
      duration: durationMs,
      ease: "Cubic.easeOut",
    });
  }

  // --- Combo presets ---

  // Bullet meets enemy without killing — small shake, no pause.
  guardHit(): void {
    this.shake(0.003, 70);
  }

  // Enemy dies — bigger shake, tiny hit-pause, gentle zoom punch.
  guardKill(): void {
    this.hitPause(60);
    this.shake(0.009, 180);
    this.zoomPunch(1.03, 110);
  }

  // Player takes damage — red flash, bigger shake, small pause.
  playerHurt(): void {
    this.hitPause(40);
    this.shake(0.014, 180);
    this.flash(0xff3030, 220, 0.32);
  }

  // Player dies — huge flash + shake.
  playerDeath(): void {
    this.shake(0.022, 600);
    this.flash(0xff0000, 500, 0.55);
  }

  // Slow-mo activation pulse — quick cyan flash.
  slowMoEnter(): void {
    this.flash(0x88ddff, 220, 0.18);
  }
}
