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
  // Where the visual transitions from "exterior pavement" to "interior marble"
  exteriorEndX: number;
  // Elevator goal — y is the ground level it sits on
  elevator: { x: number; y: number };
  // Platforms — solid colliders. The player can land on top of them. Anything
  // taller than waist height acts as a wall + climbable surface.
  // p.y = TOP (walkable surface) of the platform, p.y + p.height = bottom.
  platforms: Platform[];
  // Low obstacles you can ONLY pass under by sliding.
  // o.y = TOP of the obstacle, o.y + o.height = bottom.
  lowObstacles: LowObstacle[];
  enemies: EnemySpawn[];
};

export const lobbyLevel: LevelData = {
  width: 3200,
  height: 600,
  groundY: 540,
  playerStart: { x: 100, y: 540 },
  exteriorEndX: 820,
  elevator: { x: 3060, y: 540 },
  platforms: [
    // Reception desk — vault-able (jump on top, walk across)
    { x: 1280, y: 496, width: 96, height: 44 },
    // Tall file cabinet — blocks straight-line movement, can climb via jump
    { x: 1900, y: 480, width: 40, height: 60 },
  ],
  lowObstacles: [
    // "WET FLOOR" beam hanging at chest height — slide under to pass.
    // Bottom at 510 leaves a ~30px gap above ground (slide body is 22 tall).
    {
      x: 2380,
      y: 478,
      width: 96,
      height: 32,
      textureKey: "low_obstacle",
    },
  ],
  enemies: [
    { type: "guard", x: 1050 },
    { type: "guard", x: 1660 },
    { type: "guard", x: 2720 },
  ],
};
