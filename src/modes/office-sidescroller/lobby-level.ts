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

export type LevelData = {
  width: number;
  height: number;
  groundY: number;
  playerStart: { x: number; y: number };
  exteriorEndX: number;
  elevator: { x: number; y: number };
  // p.y = TOP (walkable surface) of the platform, p.y + p.height = bottom.
  platforms: Platform[];
  // o.y = TOP of the obstacle, o.y + o.height = bottom. Bottom must sit
  // between standing-player body top (~395) and slide-body top (~485) so
  // standing collides and sliding passes under.
  lowObstacles: LowObstacle[];
  enemies: EnemySpawn[];
};

export const lobbyLevel: LevelData = {
  width: 3600,
  height: 600,
  groundY: 540,
  playerStart: { x: 140, y: 540 },
  exteriorEndX: 900,
  elevator: { x: 3420, y: 540 },
  platforms: [
    // Reception desk — vault-able (96 tall, jump max ~136)
    { x: 1500, y: 444, width: 200, height: 96 },
    // File cabinet — just-barely vault-able (108 tall)
    { x: 2200, y: 432, width: 76, height: 108 },
  ],
  lowObstacles: [
    // Hazard barrier hanging at waist height — slide under.
    // Bottom at y=480 → blocks standing (body top ~396) but slide body
    // top (~486) clears it.
    {
      x: 2750,
      y: 414,
      width: 160,
      height: 66,
      textureKey: "low_obstacle",
    },
  ],
  enemies: [
    { type: "guard", x: 1180 },
    { type: "guard", x: 1900 },
    { type: "guard", x: 3100 },
  ],
};
