export type Platform = { x: number; y: number; width: number; height: number };

export type LowObstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
  textureKey: string;
};

export type EnemyKind = "guard" | "heavy" | "sniper" | "intern" | "ceo";

export type EnemySpawn = { kind: EnemyKind; x: number; y?: number };

// A wall door that opens and spits out a guard when the player crosses
// `triggerX`. One-shot.
export type DoorSpawner = {
  x: number;
  triggerX: number;
  kind?: EnemyKind; // defaults to "guard"
};

export type LevelTheme =
  | "lobby"
  | "cubicles"
  | "boardroom"
  | "break_room"
  | "server_room"
  | "hallway"
  | "penthouse";

export type PickupSpawn = {
  // Drops automatically at the location after the last guard dies
  kind: "auto_stapler" | "hole_punch" | "swingline";
};

export type LevelData = {
  name: string;
  theme: LevelTheme;
  width: number;
  height: number;
  groundY: number;
  playerStart: { x: number; y: number };
  exteriorEndX: number;
  elevator: { x: number; y: number };
  platforms: Platform[];
  lowObstacles: LowObstacle[];
  enemies: EnemySpawn[];
  doorSpawners: DoorSpawner[];
  // Optional pickup that drops when the floor is cleared (all guards dead +
  // all doors triggered). Awards the player a new weapon for the next floor.
  rewardPickup?: PickupSpawn;
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
  enemies: [
    { kind: "guard", x: 1180 },
    { kind: "guard", x: 1900 },
    { kind: "guard", x: 3100 },
  ],
  doorSpawners: [
    { x: 1300, triggerX: 1100 },
    { x: 2000, triggerX: 1750 },
    { x: 2600, triggerX: 2400 },
    { x: 3250, triggerX: 3050 },
  ],
  rewardPickup: { kind: "auto_stapler" },
};
