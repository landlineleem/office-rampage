import type { LevelData } from "./lobby-level";

// Floor 6 — The Hallway
// Long narrow corridor with identical numbered doors lining the walls.
// Wave after wave of guards pour out as you advance. Speed-run
// friendly final approach before the CEO's penthouse. No big arena
// obstacles — pure combat density.

export const hallwayLevel: LevelData = {
  name: "Hallway",
  theme: "hallway",
  width: 4400,
  height: 600,
  groundY: 540,
  playerStart: { x: 140, y: 540 },
  exteriorEndX: 0,
  elevator: { x: 4220, y: 540 },
  platforms: [
    // Single mid corridor cart
    { x: 2200, y: 470, width: 200, height: 70 },
  ],
  lowObstacles: [
    // Several low banners / fire hose reels strung across the corridor
    { x: 800, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
    { x: 1600, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
    { x: 2900, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
    { x: 3700, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
  ],
  enemies: [
    { kind: "guard", x: 500 },
    { kind: "intern", x: 1000 },
    { kind: "guard", x: 1400 },
    { kind: "heavy", x: 1900 },
    { kind: "guard", x: 2400 },
    { kind: "intern", x: 2700 },
    { kind: "heavy", x: 3100 },
    { kind: "guard", x: 3500 },
    { kind: "heavy", x: 3900 },
  ],
  // 8 door spawners — about one every 500px. The whole floor is a gauntlet.
  doorSpawners: [
    { x: 700, triggerX: 500, kind: "intern" },
    { x: 1200, triggerX: 1000, kind: "guard" },
    { x: 1700, triggerX: 1500, kind: "intern" },
    { x: 2100, triggerX: 1900, kind: "heavy" },
    { x: 2500, triggerX: 2300, kind: "intern" },
    { x: 3000, triggerX: 2800, kind: "guard" },
    { x: 3400, triggerX: 3200, kind: "heavy" },
    { x: 3800, triggerX: 3600, kind: "guard" },
  ],
};
