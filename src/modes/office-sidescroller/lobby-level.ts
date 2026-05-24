export type Platform = { x: number; y: number; width: number; height: number };

export type LowObstacle = {
  // The horizontal collider — only collides with the player's tall hitbox,
  // NOT the slide hitbox. Slide under to pass.
  x: number;
  y: number;
  width: number;
  height: number;
  textureKey: string;
};

export type EnemySpawn = { type: "guard"; x: number; y: number };

export type LevelData = {
  width: number;
  height: number;
  groundY: number;
  playerStart: { x: number; y: number };
  // Where the visual transitions from "exterior pavement" to "interior marble"
  exteriorEndX: number;
  // Where the elevator (level goal) sits
  elevator: { x: number; y: number };
  // Platforms = solid colliders (act as floors/walls when the player meets them
  // from above). Big tall props like file cabinets also use this — they block
  // movement entirely.
  platforms: Platform[];
  // Low obstacles you can ONLY pass under by sliding
  lowObstacles: LowObstacle[];
  enemies: EnemySpawn[];
};

export const lobbyLevel: LevelData = {
  width: 3200,
  height: 600,
  groundY: 540,
  playerStart: { x: 100, y: 480 },
  exteriorEndX: 820,
  elevator: { x: 3060, y: 470 },
  platforms: [
    // Reception desk — vaultable: player can jump on top of it
    { x: 1280, y: 510, width: 96, height: 30 },
    // File cabinet — taller, blocks straight-line movement, can climb via jump
    { x: 1900, y: 488, width: 40, height: 52 },
  ],
  lowObstacles: [
    // "Wet Floor" sign at chest height — must slide under
    {
      x: 2380,
      y: 480,
      width: 96,
      height: 32,
      textureKey: "low_obstacle",
    },
  ],
  enemies: [
    { type: "guard", x: 1050, y: 480 },
    { type: "guard", x: 1660, y: 480 },
    { type: "guard", x: 2720, y: 480 },
  ],
};
