import type { LevelData } from "./lobby-level";

// Floor 5 — The Server Room
// Industrial dark with blue LED glow, server racks lining the walls,
// cooling pipes overhead, grated floors. Mix of guards + interns.

export const serverLevel: LevelData = {
  name: "Server Room",
  theme: "server_room",
  width: 4200,
  height: 600,
  groundY: 540,
  playerStart: { x: 140, y: 540 },
  exteriorEndX: 0,
  elevator: { x: 4020, y: 540 },
  platforms: [
    // Network switch rack
    { x: 700, y: 432, width: 76, height: 108 },
    // Cable trough / vault step
    { x: 1100, y: 488, width: 240, height: 52 },
    // Server tower cluster
    { x: 1700, y: 432, width: 76, height: 108 },
    // Floor router
    { x: 2100, y: 488, width: 200, height: 52 },
    // Mainframe (taller wall)
    { x: 2700, y: 410, width: 96, height: 130 },
    // Cable trough
    { x: 3200, y: 488, width: 240, height: 52 },
    // Final blade server
    { x: 3700, y: 432, width: 76, height: 108 },
  ],
  lowObstacles: [
    // Cooling pipes overhead — slide
    { x: 1400, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
    { x: 2400, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
    { x: 3400, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
  ],
  enemies: [
    { kind: "guard", x: 500 },
    { kind: "intern", x: 1300 },
    { kind: "guard", x: 1900 },
    { kind: "heavy", x: 2400 },
    { kind: "intern", x: 3000 },
    { kind: "intern", x: 3300 },
    { kind: "guard", x: 3800 },
  ],
  doorSpawners: [
    { x: 900, triggerX: 700, kind: "intern" },
    { x: 1500, triggerX: 1300, kind: "guard" },
    { x: 2200, triggerX: 2000, kind: "intern" },
    { x: 2900, triggerX: 2700, kind: "heavy" },
    { x: 3500, triggerX: 3300, kind: "guard" },
  ],
};
