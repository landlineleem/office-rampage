import type { LevelData } from "./lobby-level";

// Floor 4 — The Break Room
// Cafeteria with white tile floor, vending machines, fridges,
// long counters as vault obstacles. Sniper enemies introduced
// (they perch on counters and pick you off). Drops Red Swingline.

export const breakroomLevel: LevelData = {
  name: "Break Room",
  theme: "break_room",
  width: 4000,
  height: 600,
  groundY: 540,
  playerStart: { x: 140, y: 540 },
  exteriorEndX: 0,
  elevator: { x: 3820, y: 540 },
  platforms: [
    // First counter — vault-able
    { x: 800, y: 470, width: 320, height: 70 },
    // Vending machine cluster — tall blocker
    { x: 1500, y: 432, width: 76, height: 108 },
    // Mid counter
    { x: 1900, y: 470, width: 280, height: 70 },
    // Snack island / tall pillar
    { x: 2500, y: 432, width: 76, height: 108 },
    // Second counter — vault-able
    { x: 2900, y: 470, width: 320, height: 70 },
  ],
  lowObstacles: [
    // Awning over the kitchen pass-through
    { x: 1200, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
    { x: 2300, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
  ],
  enemies: [
    { kind: "guard", x: 600 },
    // Snipers perched on top of counters — y offset so they spawn on the
    // platform instead of the ground.
    { kind: "sniper", x: 900, y: 466 },
    { kind: "intern", x: 1800 },
    { kind: "sniper", x: 2000, y: 466 },
    { kind: "heavy", x: 2700 },
    { kind: "sniper", x: 3000, y: 466 },
    { kind: "guard", x: 3500 },
  ],
  doorSpawners: [
    { x: 1100, triggerX: 900, kind: "intern" },
    { x: 1700, triggerX: 1500, kind: "guard" },
    { x: 2600, triggerX: 2400, kind: "intern" },
    { x: 3300, triggerX: 3100, kind: "heavy" },
  ],
  rewardPickup: { kind: "swingline" },
};
