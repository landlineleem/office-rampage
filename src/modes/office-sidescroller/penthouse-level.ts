import type { LevelData } from "./lobby-level";

// Floor 7 — The CEO's Penthouse
// Final floor. Luxury marble + glass + open-floor plan with a massive
// executive desk at the back and floor-to-ceiling windows showing the
// Manhattan skyline. The CEO himself stands behind his desk.
// One mini-encounter, then the boss.

export const penthouseLevel: LevelData = {
  name: "Penthouse",
  theme: "penthouse",
  width: 2800,
  height: 600,
  groundY: 540,
  playerStart: { x: 140, y: 540 },
  exteriorEndX: 0,
  elevator: { x: 2620, y: 540 },
  platforms: [
    // Executive desk — long, imposing, behind which the CEO stands.
    // Player can vault it.
    { x: 1800, y: 444, width: 320, height: 96 },
  ],
  lowObstacles: [
    // Low art installation hanging from the ceiling
    { x: 1100, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
  ],
  enemies: [
    // Two final bodyguards
    { kind: "heavy", x: 700 },
    { kind: "heavy", x: 1300 },
    // The CEO behind his desk
    { kind: "ceo", x: 2100 },
  ],
  doorSpawners: [
    // Heavy reinforcements as you advance
    { x: 1000, triggerX: 800, kind: "heavy" },
    { x: 1700, triggerX: 1500, kind: "heavy" },
  ],
};
