import Phaser from "phaser";

// A simpler death animation: small launch in hit direction, falls with
// gravity, tilts onto its side, settles for ~2s, then fades out and
// is destroyed.
//
// Scale-aware: pass the enemy's display scale in so the corpse matches
// the live enemy's silhouette. Earlier versions called setScale() AFTER
// setDisplaySize() which silently overrode the display size back to
// `sourceTextureWidth * scale` — for the AI guard sprite (377x661
// source) that exploded the corpse to several hundred pixels tall.

const BASE_H = 156;
const BODY_W = 36;
const BODY_H = 144;

export class Corpse extends Phaser.Physics.Arcade.Sprite {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    hitDirection: number,
    facingRight: boolean,
    scale = 1
  ) {
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 1.0);
    this.setDepth(7);
    this.setFlipX(!facingRight);

    const src = this.texture.source[0];
    // Preserve source aspect ratio so AI sprites don't squash
    const dispH = BASE_H * scale;
    const dispW = dispH * (src.width / src.height);
    const bodyW = BODY_W * scale;
    const bodyH = BODY_H * scale;
    this.setDisplaySize(dispW, dispH);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(2200);
    body.setVelocityX(hitDirection * 90);
    body.setVelocityY(-160);
    body.setCollideWorldBounds(false);
    const sx = dispW / src.width;
    const sy = dispH / src.height;
    body.setSize(bodyW / sx, bodyH / sy);
    body.setOffset(((dispW - bodyW) / 2) / sx, (dispH - bodyH) / sy);

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
