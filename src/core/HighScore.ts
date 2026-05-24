// Persistent high-score tracking via localStorage.

const KEY = "office-rampage:highscore";

export interface HighScore {
  score: number;
  floor: number;
  bestCombo: number;
  kills: number;
  date: string;
}

export function loadHighScore(): HighScore | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HighScore>;
    if (typeof parsed.score !== "number") return null;
    return {
      score: parsed.score,
      floor: parsed.floor ?? 1,
      bestCombo: parsed.bestCombo ?? 0,
      kills: parsed.kills ?? 0,
      date: parsed.date ?? "",
    };
  } catch {
    return null;
  }
}

export function saveHighScore(hs: HighScore): boolean {
  try {
    const existing = loadHighScore();
    if (existing && existing.score >= hs.score) return false;
    localStorage.setItem(KEY, JSON.stringify(hs));
    return true;
  } catch {
    return false;
  }
}
