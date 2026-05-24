import Phaser from "phaser";
import { OfficeConfig } from "../modes/office/config";
import { Intern } from "../modes/office/enemies";

export class WaveManager {
  scene: Phaser.Scene;
  group: Phaser.Physics.Arcade.Group;
  arenaW: number;
  arenaH: number;
  wave = 0;
  remainingToSpawn = 0;
  nextSpawnAt = 0;
  inBreather = false;
  breatherEndsAt = 0;
  onWaveStart?: (n: number) => void;

  constructor(
    scene: Phaser.Scene,
    group: Phaser.Physics.Arcade.Group,
    arenaW: number,
    arenaH: number
  ) {
    this.scene = scene;
    this.group = group;
    this.arenaW = arenaW;
    this.arenaH = arenaH;
  }

  startNextWave(now: number): void {
    this.wave += 1;
    this.remainingToSpawn =
      OfficeConfig.spawn.enemiesPerWaveBase +
      this.wave * OfficeConfig.spawn.enemiesPerWavePerN;
    this.nextSpawnAt = now;
    this.inBreather = false;
    this.onWaveStart?.(this.wave);
  }

  update(now: number): void {
    if (this.inBreather) {
      if (now >= this.breatherEndsAt) this.startNextWave(now);
      return;
    }
    if (this.remainingToSpawn > 0 && now >= this.nextSpawnAt) {
      this.spawnIntern();
      this.remainingToSpawn -= 1;
      this.nextSpawnAt = now + OfficeConfig.spawn.spawnIntervalMs;
    }
    if (this.remainingToSpawn === 0 && this.group.countActive(true) === 0) {
      this.inBreather = true;
      this.breatherEndsAt = now + OfficeConfig.spawn.waveBreatherMs;
    }
  }

  private spawnIntern(): void {
    const side = Phaser.Math.Between(0, 3);
    const margin = 24;
    let x = 0;
    let y = 0;
    if (side === 0) {
      x = Phaser.Math.Between(margin, this.arenaW - margin);
      y = margin;
    } else if (side === 1) {
      x = this.arenaW - margin;
      y = Phaser.Math.Between(margin, this.arenaH - margin);
    } else if (side === 2) {
      x = Phaser.Math.Between(margin, this.arenaW - margin);
      y = this.arenaH - margin;
    } else {
      x = margin;
      y = Phaser.Math.Between(margin, this.arenaH - margin);
    }
    const intern = new Intern(this.scene, x, y);
    this.group.add(intern);
  }
}
