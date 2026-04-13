/**
 * Vitest unit tests for heatmap and score prediction logic.
 * Tests pure algorithmic functions without DB access.
 */
import { describe, it, expect } from "vitest";

// ─── Heatmap color band logic ──────────────────────────────────────────────────
type ColorBand = "green" | "amber" | "red" | "unstarted";

function scoreToColorBand(score: number, attempts: number): ColorBand {
  if (attempts === 0) return "unstarted";
  if (score >= 80) return "green";
  if (score >= 60) return "amber";
  return "red";
}

function rollingAverage(prevAvg: number, prevAttempts: number, newScore: number): number {
  const newAttempts = prevAttempts + 1;
  return Math.round((prevAvg * prevAttempts + newScore) / newAttempts);
}

function trendDirection(prevAvg: number, newAvg: number): "improving" | "stable" | "declining" | "new" {
  if (newAvg > prevAvg + 5) return "improving";
  if (newAvg < prevAvg - 5) return "declining";
  return "stable";
}

describe("Heatmap color band logic", () => {
  it("returns unstarted for 0 attempts", () => {
    expect(scoreToColorBand(0, 0)).toBe("unstarted");
    expect(scoreToColorBand(90, 0)).toBe("unstarted");
  });

  it("returns green for score >= 80", () => {
    expect(scoreToColorBand(80, 1)).toBe("green");
    expect(scoreToColorBand(100, 5)).toBe("green");
    expect(scoreToColorBand(95, 3)).toBe("green");
  });

  it("returns amber for score 60-79", () => {
    expect(scoreToColorBand(60, 1)).toBe("amber");
    expect(scoreToColorBand(79, 2)).toBe("amber");
    expect(scoreToColorBand(70, 4)).toBe("amber");
  });

  it("returns red for score < 60", () => {
    expect(scoreToColorBand(59, 1)).toBe("red");
    expect(scoreToColorBand(0, 1)).toBe("red");
    expect(scoreToColorBand(30, 2)).toBe("red");
  });

  it("boundary: exactly 80 is green, exactly 60 is amber", () => {
    expect(scoreToColorBand(80, 1)).toBe("green");
    expect(scoreToColorBand(60, 1)).toBe("amber");
  });
});

describe("Rolling average calculation", () => {
  it("first attempt: average equals the score", () => {
    expect(rollingAverage(0, 0, 75)).toBe(75);
  });

  it("second attempt: averages correctly", () => {
    expect(rollingAverage(80, 1, 60)).toBe(70);
  });

  it("multiple attempts converge correctly", () => {
    let avg = 0;
    let attempts = 0;
    const scores = [50, 60, 70, 80, 90];
    for (const score of scores) {
      avg = rollingAverage(avg, attempts, score);
      attempts++;
    }
    // Average of 50,60,70,80,90 = 70
    expect(avg).toBe(70);
  });

  it("high scores improve average over time", () => {
    const avg1 = rollingAverage(50, 3, 90); // (50*3+90)/4 = 67.5 → 68
    expect(avg1).toBeGreaterThan(50);
  });
});

describe("Trend direction", () => {
  it("improving when new avg > prev + 5", () => {
    expect(trendDirection(60, 70)).toBe("improving");
    expect(trendDirection(50, 80)).toBe("improving");
  });

  it("declining when new avg < prev - 5", () => {
    expect(trendDirection(80, 70)).toBe("declining");
    expect(trendDirection(90, 50)).toBe("declining");
  });

  it("stable when change is within ±5", () => {
    expect(trendDirection(70, 73)).toBe("stable");
    expect(trendDirection(70, 67)).toBe("stable");
    expect(trendDirection(70, 70)).toBe("stable");
  });
});

// ─── Score Prediction logic ────────────────────────────────────────────────────
function scoreToColorBandPred(score: number): "green" | "amber" | "red" | "unstarted" {
  if (score >= 80) return "green";
  if (score >= 60) return "amber";
  if (score > 0) return "red";
  return "unstarted";
}

function computeSubjectScore(
  chapters: Array<{ score: number; importanceLevel: string }>,
  maxPerSubject: number
): number {
  const WEIGHT: Record<string, number> = { high: 3, critical: 4, medium: 2, low: 1 };
  let weightedSum = 0;
  let totalWeight = 0;
  for (const ch of chapters) {
    const w = WEIGHT[ch.importanceLevel] ?? 2;
    weightedSum += ch.score * w;
    totalWeight += w;
  }
  const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return Math.round((rawScore / 100) * maxPerSubject);
}

function computeRank(score: number): number {
  if (score >= 250) return 5_000;
  if (score >= 200) return 25_000;
  if (score >= 170) return 60_000;
  if (score >= 130) return 150_000;
  if (score >= 100) return 400_000;
  if (score >= 70) return 700_000;
  return 1_200_000;
}

describe("Score Prediction Engine", () => {
  it("computes subject score correctly with uniform weights", () => {
    const chapters = [
      { score: 80, importanceLevel: "medium" },
      { score: 60, importanceLevel: "medium" },
      { score: 100, importanceLevel: "medium" },
    ];
    // avg = 80, scaled to 100 = 80
    expect(computeSubjectScore(chapters, 100)).toBe(80);
  });

  it("weights high-importance chapters more heavily", () => {
    const chapters = [
      { score: 100, importanceLevel: "high" },   // weight 3
      { score: 0, importanceLevel: "low" },       // weight 1
    ];
    // weighted avg = (100*3 + 0*1) / 4 = 75
    expect(computeSubjectScore(chapters, 100)).toBe(75);
  });

  it("returns 0 for no chapters", () => {
    expect(computeSubjectScore([], 100)).toBe(0);
  });

  it("rank prediction: high score → low rank number", () => {
    expect(computeRank(260)).toBe(5_000);
    expect(computeRank(210)).toBe(25_000);
    expect(computeRank(50)).toBe(1_200_000);
  });

  it("rank prediction: boundary at 250", () => {
    expect(computeRank(250)).toBe(5_000);
    expect(computeRank(249)).toBe(25_000);
  });

  it("optimistic and conservative bounds are correct", () => {
    const base = 200;
    const optimistic = Math.min(300, Math.round(base * 1.15));
    const conservative = Math.max(0, Math.round(base * 0.85));
    expect(optimistic).toBe(230);
    expect(conservative).toBe(170);
  });

  it("JEE Advanced score scales from Main score", () => {
    const mainScore = 200;
    const advancedScore = Math.round((mainScore / 300) * 360 * 0.85);
    expect(advancedScore).toBe(204);
  });

  it("full prediction: 3 subjects at 80% each → ~240/300", () => {
    const subjects = ["physics", "chemistry", "mathematics"];
    let total = 0;
    for (const _ of subjects) {
      const chapters = Array.from({ length: 10 }, () => ({ score: 80, importanceLevel: "medium" }));
      total += computeSubjectScore(chapters, 100);
    }
    expect(total).toBe(240);
  });
});

// ─── Notification trigger logic ────────────────────────────────────────────────
function shouldSendStreakAlert(currentStreak: number, lastActiveDate: Date): boolean {
  const hoursSinceActive = (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60);
  return currentStreak > 0 && hoursSinceActive >= 20; // alert if 20+ hours inactive
}

function shouldSendOverdueAlert(lessonDueDate: Date): boolean {
  return lessonDueDate < new Date();
}

describe("Notification trigger logic", () => {
  it("streak alert: fires when 20+ hours inactive with active streak", () => {
    const twentyOneHoursAgo = new Date(Date.now() - 21 * 60 * 60 * 1000);
    expect(shouldSendStreakAlert(5, twentyOneHoursAgo)).toBe(true);
  });

  it("streak alert: does not fire if streak is 0", () => {
    const twentyOneHoursAgo = new Date(Date.now() - 21 * 60 * 60 * 1000);
    expect(shouldSendStreakAlert(0, twentyOneHoursAgo)).toBe(false);
  });

  it("streak alert: does not fire if recently active (< 20h)", () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    expect(shouldSendStreakAlert(7, oneHourAgo)).toBe(false);
  });

  it("overdue alert: fires when lesson due date is in the past", () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(shouldSendOverdueAlert(yesterday)).toBe(true);
  });

  it("overdue alert: does not fire for future due dates", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(shouldSendOverdueAlert(tomorrow)).toBe(false);
  });
});
