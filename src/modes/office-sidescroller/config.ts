export const SideScrollerConfig = {
  player: {
    runSpeed: 280,
    jumpVelocity: 720,
    gravity: 1900,
    slideMs: 460,
    slideVelocity: 540,
    coyoteMs: 100,
    invulnMs: 450, // briefer i-frames since each hit is smaller now
    maxHP: 100,
    // Damage values for the various ways the player can take a hit
    guardBulletDamage: 18,
    guardContactDamage: 15,
    bodyWidth: 18,
    bodyHeight: 44,
    slideBodyHeight: 22,
    // Player sprite uses origin (0.5, 1.0) — y = feet. Shoulder is 30px
    // above the feet (top of the torso, just below the neck).
    shoulderOffsetY: -30,
  },
  pistol: {
    fireRateMs: 180,
    bulletSpeed: 950,
    bulletLifeMs: 1100,
    spawnOffset: 26,
  },
  guard: {
    walkSpeed: 70,
    hp: 2,
    sightDistance: 540,
    sightVerticalTolerance: 80,
    fireRateMs: 850,
    aimDelayMs: 350,
    bulletSpeed: 520,
    bulletLifeMs: 2000,
    contactCooldownMs: 700,
    patrolRange: 160,
  },
  caffeine: {
    maxMs: 5000,
    killRefillMs: 700,
    slowFactor: 0.35,
    withdrawalMs: 1000,
    withdrawalSpeedFactor: 0.5,
  },
  combo: {
    windowMs: 2500,
  },
};
