import Phaser from "phaser";

// A simpler death animation: small launch in hit direction, falls with
// gravity, tilts onto its side, settles for ~2s, then fades out and
// is destroyed. No more wild spinning.

export class Corpse extends Phaser.Physics.Arcade.Sprite {
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
    this.setDisplaySize(76, 156);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(2200);
    // Modest launch — feel like the hit "knocked them off their feet",
    // not "shot them into orbit".
    body.setVelocityX(hitDirection * 90);
    body.setVelocityY(-160);
    body.setCollideWorldBounds(false);
    const src = this.texture.source[0];
    const sx = 76 / src.width;
    const sy = 156 / src.height;
    body.setSize(36 / sx, 144 / sy);
    body.setOffset(((76 - 36) / 2) / sx, (156 - 144) / sy);

    // Tilt to a "fallen on side" pose — single smooth rotation, no spin.
    const fallenRot = hitDirection >= 0 ? Math.PI / 2.3 : -Math.PI / 2.3;
    scene.tweens.add({
      targets: this,
      rotation: fallenRot,
      duration: 450,
      ease: "Cubic.easeOut",
    });

    // After ~600ms, body has hit the ground and settled — freeze it.
    scene.time.delayedCall(650, () => {
      if (!this.active) return;
      const b = this.body as Phaser.Physics.Arcade.Body;
      if (b) {
        b.setVelocityX(0);
        b.setVelocityY(0);
        b.setAllowGravity(false);
      }
      this.setTint(0x9a9aa0);
    });

    // 2s after spawn, fade to transparent, then destroy.
    scene.time.delayedCall(2000, () => {
      if (!this.active) return;
      scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 500,
        ease: "Cubic.easeIn",
        onComplete: () => this.destroy(),
      });
    });
  }
}
