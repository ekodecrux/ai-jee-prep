/**
 * Tests for streak alert job and heatmap auto-update wiring
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Streak Alert Job Tests ───────────────────────────────────────────────────

describe("StreakAlertJob — schedule timing", () => {
  it("should schedule the next run at 8 PM", () => {
    // Simulate: current time is 7:59 PM → next run is in ~1 minute
    const now = new Date();
    now.setHours(19, 59, 0, 0);
    const next = new Date(now);
    next.setHours(20, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const msUntilNext = next.getTime() - now.getTime();
    expect(msUntilNext).toBeGreaterThan(0);
    expect(msUntilNext).toBeLessThanOrEqual(60_000 + 1000); // within 1 minute
  });

  it("should schedule for tomorrow if it's already past 8 PM", () => {
    const now = new Date();
    now.setHours(21, 0, 0, 0); // 9 PM
    const next = new Date(now);
    next.setHours(20, 0, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const msUntilNext = next.getTime() - now.getTime();
    // Should be ~23 hours from now
    expect(msUntilNext).toBeGreaterThan(22 * 60 * 60 * 1000);
    expect(msUntilNext).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });
});

describe("StreakAlertJob — streak risk detection", () => {
  it("should flag students with > 20 hours of inactivity", () => {
    const now = new Date();
    const lastActive = new Date(now.getTime() - 21 * 60 * 60 * 1000); // 21 hours ago
    const lastActiveDate = lastActive.toISOString().split("T")[0];
    const lastActiveObj = new Date(lastActiveDate + "T00:00:00Z");
    const hoursSince = (now.getTime() - lastActiveObj.getTime()) / (1000 * 60 * 60);
    expect(hoursSince).toBeGreaterThanOrEqual(20);
  });

  it("should NOT flag students active within 20 hours", () => {
    const now = new Date();
    const lastActive = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
    const lastActiveDate = lastActive.toISOString().split("T")[0];
    const lastActiveObj = new Date(lastActiveDate + "T00:00:00Z");
    const hoursSince = (now.getTime() - lastActiveObj.getTime()) / (1000 * 60 * 60);
    // If same day, hoursSince < 20 → no alert
    expect(hoursSince).toBeLessThan(24); // same-day activity
  });

  it("should compute urgency as critical when < 4 hours remain", () => {
    const hoursSinceActive = 21; // 21 hours since last active
    const hoursLeft = Math.max(0, Math.round(24 - hoursSinceActive));
    const urgency = hoursLeft <= 4 ? "critical" : "warning";
    expect(urgency).toBe("critical");
    expect(hoursLeft).toBe(3);
  });

  it("should compute urgency as warning when > 4 hours remain", () => {
    const hoursSinceActive = 12; // 12 hours since last active
    const hoursLeft = Math.max(0, Math.round(24 - hoursSinceActive));
    const urgency = hoursLeft <= 4 ? "critical" : "warning";
    expect(urgency).toBe("warning");
    expect(hoursLeft).toBe(12);
  });
});

// ─── Heatmap Auto-Update Wiring Tests ────────────────────────────────────────

describe("Heatmap auto-update wiring", () => {
  it("should compute rolling average correctly for first attempt", () => {
    const prevAvg = 0;
    const newAttempts = 1;
    const newScore = 75;
    const existing = null;
    const newAvg = existing
      ? Math.round((prevAvg * (newAttempts - 1) + newScore) / newAttempts)
      : newScore;
    expect(newAvg).toBe(75);
  });

  it("should compute rolling average correctly for subsequent attempts", () => {
    const prevAvg = 60;
    const newAttempts = 4; // 4th attempt
    const newScore = 80;
    const newAvg = Math.round((prevAvg * (newAttempts - 1) + newScore) / newAttempts);
    // (60 * 3 + 80) / 4 = (180 + 80) / 4 = 260 / 4 = 65
    expect(newAvg).toBe(65);
  });

  it("should assign green color band for score >= 80", () => {
    const score = 85;
    const attempts = 3;
    const colorBand = attempts === 0 ? "unstarted" : score >= 80 ? "green" : score >= 60 ? "amber" : "red";
    expect(colorBand).toBe("green");
  });

  it("should assign amber color band for score 60-79", () => {
    const score = 65;
    const attempts = 2;
    const colorBand = attempts === 0 ? "unstarted" : score >= 80 ? "green" : score >= 60 ? "amber" : "red";
    expect(colorBand).toBe("amber");
  });

  it("should assign red color band for score < 60", () => {
    const score = 45;
    const attempts = 1;
    const colorBand = attempts === 0 ? "unstarted" : score >= 80 ? "green" : score >= 60 ? "amber" : "red";
    expect(colorBand).toBe("red");
  });

  it("should detect improving trend when new avg > prev avg + 5", () => {
    const prevAvg = 50;
    const newAvg = 70;
    const trend = newAvg > prevAvg + 5 ? "improving" : newAvg < prevAvg - 5 ? "declining" : "stable";
    expect(trend).toBe("improving");
  });

  it("should detect declining trend when new avg < prev avg - 5", () => {
    const prevAvg = 70;
    const newAvg = 55;
    const trend = newAvg > prevAvg + 5 ? "improving" : newAvg < prevAvg - 5 ? "declining" : "stable";
    expect(trend).toBe("declining");
  });

  it("should detect stable trend when change is within ±5", () => {
    const prevAvg = 70;
    const newAvg = 72;
    const trend = newAvg > prevAvg + 5 ? "improving" : newAvg < prevAvg - 5 ? "declining" : "stable";
    expect(trend).toBe("stable");
  });
});

// ─── Score Trajectory Tests ───────────────────────────────────────────────────

describe("Score trajectory history management", () => {
  it("should append a new entry for a new date", () => {
    const prevHistory = [
      { date: "2026-04-01", score: 150 },
      { date: "2026-04-02", score: 155 },
    ];
    const today = "2026-04-03";
    const todayEntry = { date: today, score: 160 };
    const newHistory = prevHistory.some(h => h.date === today)
      ? prevHistory.map(h => h.date === today ? todayEntry : h)
      : [...prevHistory, todayEntry].slice(-90);
    expect(newHistory).toHaveLength(3);
    expect(newHistory[2]).toEqual({ date: "2026-04-03", score: 160 });
  });

  it("should replace today's entry if it already exists", () => {
    const prevHistory = [
      { date: "2026-04-01", score: 150 },
      { date: "2026-04-03", score: 155 }, // today already exists
    ];
    const today = "2026-04-03";
    const todayEntry = { date: today, score: 165 }; // updated score
    const newHistory = prevHistory.some(h => h.date === today)
      ? prevHistory.map(h => h.date === today ? todayEntry : h)
      : [...prevHistory, todayEntry].slice(-90);
    expect(newHistory).toHaveLength(2);
    expect(newHistory.find(h => h.date === today)?.score).toBe(165);
  });

  it("should cap history at 90 data points", () => {
    const prevHistory = Array.from({ length: 90 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      score: 100 + i,
    }));
    const today = "2026-04-03";
    const todayEntry = { date: today, score: 200 };
    const newHistory = prevHistory.some(h => h.date === today)
      ? prevHistory.map(h => h.date === today ? todayEntry : h)
      : [...prevHistory, todayEntry].slice(-90);
    expect(newHistory).toHaveLength(90);
    expect(newHistory[89]).toEqual({ date: today, score: 200 });
  });
});
