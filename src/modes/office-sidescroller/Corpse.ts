import Phaser from "phaser";

// A "ragdoll" corpse — really just a sprite with arcade physics that
// gets a launch velocity from the direction of the killing hit, tumbles
// with a tweened rotation, lands on the ground, then settles into a
// flat lying-down pose. Stays on screen until the scene resets.

export class Corpse extends Phaser.Physics.Arcade.Sprite {
  private settled = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    hitDirection: number,
    facingRight: boolean
  ) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1.0);
    this.setDepth(7);
    this.setFlipX(!facingRight);
    // Apply the same display size as the live guard so the corpse
    // visually matches the body that just died.
    this.setDisplaySize(76, 156);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(2200);
    body.setVelocityX(hitDirection * Phaser.Math.Between(180, 320));
    body.setVelocityY(-Phaser.Math.Between(280, 460));
    body.setCollideWorldBounds(false);
    // Wide flat hitbox so the corpse skids on the floor
    const src = this.texture.source[0];
    const sx = 76 / src.width;
    const sy = 156 / src.height;
    body.setSize(36 / sx, 144 / sy);
    body.setOffset(((76 - 36) / 2) / sx, (156 - 144) / sy);

    // Spin while airborne
    const spinTarget = hitDirection >= 0 ? Math.PI * 1.7 : -Math.PI * 1.7;
    scene.tweens.add({
      targets: this,
      rotation: spinTarget,
      duration: 900,
      ease: "Cubic.easeOut",
    });

    // Settle after a beat: stop velocity, rotate to flat (90°), tint darker
    scene.time.delayedCall(950, () => this.settle(hitDirection));
  }

  private settle(direction: number): void {
    if (this.settled) return;
    this.settled = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    body.setVelocityY(0);
    body.setAllowGravity(false);
    body.setImmovable(true);
    // Lie on the side facing direction of travel
    const finalRot = direction >= 0 ? Math.PI / 2 : -Math.PI / 2;
    this.scene.tweens.add({
      targets: this,
      rotation: finalRot,
      duration: 300,
      ease: "Cubic.easeOut",
    });
    // Slightly darker to read as "dead"
    this.scene.tweens.add({
      targets: this,
      alpha: 0.85,
      duration: 600,
    });
    this.setTint(0x9a9aa0);
  }
}
