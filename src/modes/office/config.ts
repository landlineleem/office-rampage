export const OfficeConfig = {
  player: {
    speed: 240,
    maxHP: 3,
    invulnMs: 700,
  },
  stapler: {
    fireRateMs: 110,
    bulletSpeed: 700,
    bulletLifeMs: 700,
  },
  intern: {
    speed: 120,
    hp: 1,
    contactCooldownMs: 700,
  },
  caffeine: {
    maxMs: 5000,
    killRefillMs: 500,
    slowFactor: 0.3,
    withdrawalMs: 1000,
    withdrawalSpeedFactor: 0.5,
  },
  combo: {
    windowMs: 2000,
  },
  arena: {
    width: 1600,
    height: 1000,
  },
  spawn: {
    enemiesPerWaveBase: 4,
    enemiesPerWavePerN: 2,
    spawnIntervalMs: 600,
    waveBreatherMs: 4000,
  },
};
