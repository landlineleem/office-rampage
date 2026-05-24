export const SideScrollerConfig = {
  player: {
    runSpeed: 340, // faster — old 280 felt sluggish in big arenas
    jumpVelocity: 900, // higher initial velocity...
    gravity: 2700, // ...and stronger gravity = same apex height (~150px)
    //                  but TIGHTER jump arc, less hang time. Less floaty.
    slideMs: 420, // slightly shorter so slide doesn't dominate
    slideVelocity: 620, // and faster — slides feel like a burst, not a glide
    coyoteMs: 120,
    invulnMs: 450,
    maxHP: 100,
    guardBulletDamage: 18,
    guardContactDamage: 15,
    bodyWidth: 18,
    bodyHeight: 44,
    slideBodyHeight: 22,
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
