import Phaser from "phaser";

export type PickupKind = "auto_stapler" | "hole_punch" | "swingline";

const PICKUP_TEXTURE: Record<PickupKind, string> = {
  auto_stapler: "auto_stapler_pickup",
  hole_punch: "hole_punch_pickup",
  swingline: "swingline_pickup",
};

// A weapon pickup that drops on the ground from a dead enemy. Bobs up
// and down with a glowing halo, falls if airborne, persists until the
// player walks over it.

export class WeaponPickup extends Phaser.Physics.Arcade.Sprite {
  kind: PickupKind;
  private halo: Phaser.GameObjects.Sprite;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: PickupKind) {
    super(scene, x, y, PICKUP_TEXTURE[kind]);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.kind = kind;
    this.setOrigin(0.5, 0.5);
    this.setDepth(9);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(1800);
    body.setBounce(0.25);
    body.setSize(48, 28);
    body.setVelocityX(Phaser.Math.Between(-80, 80));
    body.setVelocityY(-220);
    body.setCollideWorldBounds(false);

    // Soft glow halo behind the pickup
    this.halo = scene.add.sprite(x, y, "particle_smoke");
    this.halo.setBlendMode(Phaser.BlendModes.ADD);
    this.halo.setTint(0xffe066);
    this.halo.setScale(2.2);
    this.halo.setDepth(8);
    scene.tweens.add({
      targets: this.halo,
      scale: 2.6,
      alpha: 0.5,
      yoyo: true,
      repeat: -1,
      duration: 700,
      ease: "Sine.easeInOut",
    });

    // "PICK UP" label above
    this.label = scene.add.text(x, y - 40, "▼ PICK UP", {
      fontFamily: "ui-monospace, monospace",
      fontSize: "12px",
      color: "#ffe066",
      stroke: "#1a1d24",
      strokeThickness: 2,
    }).setOrigin(0.5, 0.5).setDepth(10);
    scene.tweens.add({
      targets: this.label,
      y: this.label.y - 4,
      yoyo: true,
      repeat: -1,
      duration: 600,
      ease: "Sine.easeInOut",
    });

    // Slight rotation tween for "alive" feel
    scene.tweens.add({
      targets: this,
      rotation: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: "Sine.easeInOut",
    });
  }

  override preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.halo) {
      this.halo.setPosition(this.x, this.y);
    }
    if (this.label) {
      // Label tween is on its own offset; keep its X synced and let
      // the bob tween modify Y on top of that.
      this.label.setX(this.x);
    }
  }

  override destroy(fromScene?: boolean): void {
    this.halo?.destroy();
    this.label?.destroy();
    super.destroy(fromScene);
  }
}
