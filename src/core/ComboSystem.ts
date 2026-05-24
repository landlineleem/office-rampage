import { SideScrollerConfig } from "../modes/office-sidescroller/config";

export type ComboMilestoneCallback = (count: number, label: string) => void;

const MILESTONES: Record<number, string> = {
  5: "STREAK!",
  10: "RAMPAGE!",
  15: "UNSTOPPABLE!",
  20: "GODLIKE!",
};

export class ComboSystem {
  count = 0;
  best = 0;
  totalKills = 0;
  score = 0;
  lastKillAt = -Infinity;
  onMilestone?: ComboMilestoneCallback;

  registerKill(now: number, baseScore = 100): void {
    this.totalKills += 1;
    if (now - this.lastKillAt <= SideScrollerConfig.combo.windowMs) {
      this.count += 1;
    } else {
      this.count = 1;
    }
    this.lastKillAt = now;
    if (this.count > this.best) this.best = this.count;
    // Score = enemy base * current combo. Tougher enemies + bigger combos
    // compound for big numbers.
    this.score += baseScore * this.count;
    const milestone = MILESTONES[this.count];
    if (milestone) this.onMilestone?.(this.count, milestone);
  }

  update(now: number): void {
    if (this.count > 0 && now - this.lastKillAt > SideScrollerConfig.combo.windowMs) {
      this.count = 0;
    }
  }

  break(): void {
    this.count = 0;
  }
}
