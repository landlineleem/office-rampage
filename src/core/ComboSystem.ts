import { SideScrollerConfig } from "../modes/office-sidescroller/config";

export class ComboSystem {
  count = 0;
  best = 0;
  totalKills = 0;
  score = 0;
  lastKillAt = -Infinity;

  registerKill(now: number): void {
    this.totalKills += 1;
    if (now - this.lastKillAt <= SideScrollerConfig.combo.windowMs) {
      this.count += 1;
    } else {
      this.count = 1;
    }
    this.lastKillAt = now;
    if (this.count > this.best) this.best = this.count;
    this.score += this.count * 10;
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
