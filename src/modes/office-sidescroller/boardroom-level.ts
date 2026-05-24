import type { LevelData } from "./lobby-level";

// Floor 3 — The Boardroom
// Dark wood paneling, long boardroom table down the center,
// floor-to-ceiling windows on the back wall. Heavy guards introduced.
// Clearing the floor drops a Hole Punch shotgun.

export const boardroomLevel: LevelData = {
  name: "Boardroom",
  theme: "boardroom",
  width: 3800,
  height: 600,
  groundY: 540,
  playerStart: { x: 140, y: 540 },
  exteriorEndX: 0,
  elevator: { x: 3620, y: 540 },
  platforms: [
    // The boardroom table — long, narrow, vaultable, in the middle of the room
    { x: 1100, y: 450, width: 600, height: 90 },
    // Leather chair / pedestal — short vault toward the end
    { x: 2400, y: 470, width: 120, height: 70 },
    // Liquor cabinet — taller blocker
    { x: 2800, y: 432, width: 76, height: 108 },
  ],
  lowObstacles: [
    // Crystal chandelier hanging low — slide under
    { x: 2050, y: 410, width: 180, height: 70, textureKey: "low_obstacle" },
  ],
  enemies: [
    { kind: "guard", x: 600 },
    { kind: "heavy", x: 1400 },
    { kind: "guard", x: 2200 },
    { kind: "heavy", x: 3000 },
  ],
  doorSpawners: [
    { x: 900, triggerX: 700, kind: "guard" },
    { x: 1800, triggerX: 1500, kind: "heavy" },
    { x: 2600, triggerX: 2400, kind: "guard" },
    { x: 3300, triggerX: 3100, kind: "heavy" },
  ],
  rewardPickup: { kind: "hole_punch" },
};
