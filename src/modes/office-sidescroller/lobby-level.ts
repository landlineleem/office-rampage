export type Platform = { x: number; y: number; width: number; height: number };

export type LowObstacle = {
  // The obstacle hangs in the air with a gap below it. Standing body collides
  // with it; slide body is short enough to pass underneath. Slide to advance.
  x: number;
  y: number;
  width: number;
  height: number;
  textureKey: string;
};

export type EnemySpawn = { type: "guard"; x: number };

// A wall door that opens and spits out a guard when the player crosses
// `triggerX`. One-shot.
export type DoorSpawner = {
  x: number;
  triggerX: number;
};

export type LevelTheme = "lobby" | "cubicles";

export type LevelData = {
  name: string;
  theme: LevelTheme;
  width: number;
  height: number;
  groundY: number;
  playerStart: { x: number; y: number };
  exteriorEndX: number;
  elevator: { x: number; y: number };
  // p.y = TOP (walkable surface) of the platform, p.y + p.height = bottom.
  platforms: Platform[];
  // o.y = TOP of the obstacle, o.y + o.height = bottom.
  lowObstacles: LowObstacle[];
  enemies: EnemySpawn[];
  doorSpawners: DoorSpawner[];
};

export const lobbyLevel: LevelData = {
  name: "Lobby",
  theme: "lobby",
  width: 3600,
  height: 600,
  groundY: 540,
  playerStart: { x: 140, y: 540 },
  exteriorEndX: 900,
  elevator: { x: 3420, y: 540 },
  platforms: [
    { x: 1500, y: 444, width: 200, height: 96 },
    { x: 2200, y: 432, width: 76, height: 108 },
  ],
  lowObstacles: [
    { x: 2750, y: 414, width: 160, height: 66, textureKey: "low_obstacle" },
  ],
  // Guards visible at the start
  enemies: [
    { type: "guard", x: 1180 },
    { type: "guard", x: 1900 },
    { type: "guard", x: 3100 },
  ],
  // Doors that open as the player advances. Each spawns one guard.
  doorSpawners: [
    { x: 1300, triggerX: 1100 },
    { x: 2000, triggerX: 1750 },
    { x: 2600, triggerX: 2400 },
    { x: 3250, triggerX: 3050 },
  ],
};
