import type { LevelData } from "./lobby-level";

// Floor 2 — Open Plan Cubicles (verticality, simplified)
//
// One ground route + an optional upper route via stairs on the left.
// Upper route holds snipers that pepper the ground floor. Climbing up
// lets you flank them from the high ground.
//
// Stairs widened to 100px each so they're easy to land on; only 2 jumps
// to mezzanine instead of the previous 3.

export const cubiclesLevel: LevelData = {
  name: "Cubicles",
  theme: "cubicles",
  width: 4200,
  height: 600,
  groundY: 540,
  playerStart: { x: 140, y: 540 },
  exteriorEndX: 0,
  elevator: { x: 4020, y: 540 },
  platforms: [
    // GROUND FLOOR
    { x: 600, y: 444, width: 200, height: 96 }, // workstation 1
    { x: 2900, y: 444, width: 200, height: 96 }, // workstation 2
    { x: 3650, y: 444, width: 200, height: 96 }, // workstation 3
    { x: 3350, y: 432, width: 76, height: 108 }, // file cabinet

    // LEFT-SIDE CLIMB — 2 wide steps up to the mezzanine
    { x: 1150, y: 446, width: 110, height: 94 }, // step 1 (top y=446, ~94px climb)
    { x: 1320, y: 370, width: 110, height: 170 }, // step 2 (top y=370, ~76px climb to mezz)

    // MEZZANINE — one-way, spans 1500-2700 at y=300. Easy to land on
    // from step 2 (only 70px above).
    {
      x: 1500,
      y: 300,
      width: 1200,
      height: 22,
      oneWay: true,
      textureKey: "mezzanine",
    },

    // RIGHT-SIDE DROP — wide platform you can land on after stepping
    // off the mezzanine, then drop again to the ground.
    { x: 2800, y: 420, width: 120, height: 120 },
  ],
  lowObstacles: [
    // Hanging fluorescent tubes — slide under on the ground route
    { x: 1900, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
    { x: 3200, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
  ],
  enemies: [
    // Ground floor mix
    { kind: "guard", x: 400 },
    { kind: "intern", x: 1700 },
    { kind: "guard", x: 2400 },
    { kind: "intern", x: 3100 },
    { kind: "guard", x: 3800 },
    // SNIPERS on the mezzanine (spawn at mezz top y=300)
    { kind: "sniper", x: 1700, y: 300 },
    { kind: "sniper", x: 2400, y: 300 },
  ],
  doorSpawners: [
    { x: 900, triggerX: 700, kind: "intern" },
    { x: 1700, triggerX: 1500, kind: "guard" },
    { x: 3100, triggerX: 2900, kind: "intern" },
    { x: 3700, triggerX: 3500, kind: "heavy" },
  ],
};
