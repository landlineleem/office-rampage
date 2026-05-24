import type { LevelData } from "./lobby-level";

// Floor 2 — Open Plan Cubicles (vertical edition)
//
// VERTICALITY PILOT — this is the test for whether multi-level levels
// feel good. If yes, the rest of the floors get the same treatment.
//
//                                                             elevator
//                                                                ▼
//   ━━━━━━━━━ MEZZANINE (one-way) ━━━━━━━━━              ━━━━━━━━━━━
//             [Sniper]  [Sniper]
//
//                     ┌──┐
//              ┌──┐   │  │                                  ┌──┐
//   ━┌──┐━━━━━━┘  └━━━┘  └━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┘  └━━━
//    desk        stack to climb                                desk
//   ground floor — guards + interns at large
//
// Players can take the ground route (faster) or climb the stack to
// the mezzanine for high-ground advantage against the snipers up there.

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
    // -- Ground floor --
    // Workstation desks (vault-able, 96 tall)
    { x: 600, y: 444, width: 200, height: 96 },
    { x: 3000, y: 444, width: 200, height: 96 },
    { x: 3700, y: 444, width: 200, height: 96 },

    // -- Left-side climb stack — staircase of three platforms cascading
    //    up to the mezzanine height. Each step is small so the player has
    //    to time their jumps.
    { x: 1100, y: 480, width: 60, height: 60 },  // step 1 (top y=480)
    { x: 1230, y: 420, width: 60, height: 120 }, // step 2 (top y=420)
    { x: 1360, y: 360, width: 60, height: 180 }, // step 3 (top y=360)

    // -- Mezzanine catwalk — long upper level walkway. One-way so the
    //    player can jump UP through it from below (e.g. from the desk
    //    at x=3000 directly to the underside) and land on it from above.
    {
      x: 1500,
      y: 300,
      width: 1400,
      height: 24,
      oneWay: true,
      textureKey: "mezzanine",
    },

    // -- Right-side ramp back down — gentler descent so player can move
    //    off the mezzanine without dropping the full ~240 pixels in one
    //    fall.
    { x: 2950, y: 380, width: 60, height: 160 },
    { x: 2820, y: 440, width: 60, height: 100 },

    // File cabinet near the right side (a normal tall obstacle)
    { x: 3400, y: 432, width: 76, height: 108 },
  ],
  lowObstacles: [
    // Hanging fluorescent tubes — slide under on the ground route
    { x: 1900, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
    { x: 3300, y: 414, width: 160, height: 24, textureKey: "hanging_light" },
  ],
  enemies: [
    // Ground floor mix
    { kind: "guard", x: 400 },
    { kind: "intern", x: 1800 },
    { kind: "guard", x: 2300 },
    { kind: "intern", x: 2900 },
    { kind: "guard", x: 3800 },
    // SNIPERS on the mezzanine — spawn at mezzanine top y (300) so they
    // sit on the catwalk. They'll fire down at the player on the ground.
    { kind: "sniper", x: 1700, y: 300 },
    { kind: "sniper", x: 2400, y: 300 },
  ],
  doorSpawners: [
    { x: 900, triggerX: 700, kind: "intern" },
    { x: 1700, triggerX: 1500, kind: "guard" },
    { x: 3200, triggerX: 3000, kind: "intern" },
    { x: 3700, triggerX: 3500, kind: "heavy" },
  ],
};
