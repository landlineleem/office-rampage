import { lobbyLevel } from "./lobby-level";
import { cubiclesLevel } from "./cubicles-level";
import type { LevelData } from "./lobby-level";

// Ordered campaign — index 0 is the first floor, index N is the last.
export const LEVELS: LevelData[] = [lobbyLevel, cubiclesLevel];

export function getLevel(index: number): LevelData {
  return LEVELS[Math.min(Math.max(0, index), LEVELS.length - 1)];
}

export function hasNextLevel(index: number): boolean {
  return index + 1 < LEVELS.length;
}
