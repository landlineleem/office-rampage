import type { LevelData } from "./lobby-level";

// Floor 2 — Open Plan Cubicles
// No exterior; player walks out of the elevator (left edge) into an
// open-plan office floor with desks to vault, hanging fluorescent
// tubes to slide under, and more guards than the lobby.

export const cubiclesLevel: LevelData = {
  name: "Cubicles",
  theme: "cubicles",
  width: 4000,
  height: 600,
  groundY: 540,
  playerStart: { x: 140, y: 540 },
  exteriorEndX: 0, // no outdoor section
  elevator: { x: 3820, y: 540 },
  platforms: [
    // Workstation desk #1 — vault-able
    { x: 900, y: 444, width: 200, height: 96 },
    // Workstation desk #2 + file cabinet stack
    { x: 1700, y: 444, width: 200, height: 96 },
    { x: 2000, y: 432, width: 76, height: 108 },
    // Workstation desk #3
    { x: 2500, y: 444, width: 200, height: 96 },
    // Workstation desk #4
    { x: 3300, y: 444, width: 200, height: 96 },
  ],
  lowObstacles: [
    // Hanging fluorescent tubes — slide under
    { x: 1300, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
    { x: 2200, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
    { x: 2900, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
  ],
  enemies: [
    { type: "guard", x: 600 },
    { type: "guard", x: 1400 },
    { type: "guard", x: 2200 },
    { type: "guard", x: 2900 },
    { type: "guard", x: 3550 },
  ],
  doorSpawners: [
    { x: 1000, triggerX: 800 },
    { x: 1900, triggerX: 1700 },
    { x: 2700, triggerX: 2500 },
    { x: 3200, triggerX: 3000 },
    { x: 3700, triggerX: 3450 },
  ],
};

export const LEVELS: LevelData[] = [];
