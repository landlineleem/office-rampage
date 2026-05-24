import type { LevelData } from "./lobby-level";

// Floor 2 — Open Plan Cubicles
export const cubiclesLevel: LevelData = {
  name: "Cubicles",
  theme: "cubicles",
  width: 4000,
  height: 600,
  groundY: 540,
  playerStart: { x: 140, y: 540 },
  exteriorEndX: 0,
  elevator: { x: 3820, y: 540 },
  platforms: [
    { x: 900, y: 444, width: 200, height: 96 },
    { x: 1700, y: 444, width: 200, height: 96 },
    { x: 2000, y: 432, width: 76, height: 108 },
    { x: 2500, y: 444, width: 200, height: 96 },
    { x: 3300, y: 444, width: 200, height: 96 },
  ],
  lowObstacles: [
    { x: 1300, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
    { x: 2200, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
    { x: 2900, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
  ],
  enemies: [
    { kind: "guard", x: 600 },
    { kind: "intern", x: 1400 },
    { kind: "guard", x: 2200 },
    { kind: "intern", x: 2900 },
    { kind: "guard", x: 3550 },
  ],
  doorSpawners: [
    { x: 1000, triggerX: 800, kind: "intern" },
    { x: 1900, triggerX: 1700, kind: "guard" },
    { x: 2700, triggerX: 2500, kind: "intern" },
    { x: 3200, triggerX: 3000, kind: "guard" },
    { x: 3700, triggerX: 3450, kind: "guard" },
  ],
};
