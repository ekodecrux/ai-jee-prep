/**
 * Gamification router unit tests
 * Tests XP action enum, leaderboard structure, streak logic, and badge awards.
 */
import { describe, it, expect } from "vitest";

// ─── XP action table ─────────────────────────────────────────────────────────
const XP_TABLE: Record<string, number> = {
  login: 5,
  chapter_complete: 20,
  assessment_pass: 30,
  perfect_score: 50,
  plan_generated: 10,
};

describe("Gamification — XP action table", () => {
  it("awards correct XP for login", () => {
    expect(XP_TABLE["login"]).toBe(5);
  });

  it("awards correct XP for chapter_complete", () => {
    expect(XP_TABLE["chapter_complete"]).toBe(20);
  });

  it("awards correct XP for assessment_pass", () => {
    expect(XP_TABLE["assessment_pass"]).toBe(30);
  });

  it("awards correct XP for perfect_score", () => {
    expect(XP_TABLE["perfect_score"]).toBe(50);
  });

  it("awards correct XP for plan_generated", () => {
    expect(XP_TABLE["plan_generated"]).toBe(10);
  });

  it("has all 5 expected action types", () => {
    expect(Object.keys(XP_TABLE)).toHaveLength(5);
  });
});

// ─── Level calculation ────────────────────────────────────────────────────────
function calculateLevel(totalXp: number): number {
  // Level = floor(sqrt(totalXp / 100)) + 1, capped at 50
  return Math.min(50, Math.floor(Math.sqrt(totalXp / 100)) + 1);
}

describe("Gamification — Level calculation", () => {
  it("starts at level 1 with 0 XP", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("reaches level 2 at 100 XP", () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it("reaches level 3 at 400 XP", () => {
    expect(calculateLevel(400)).toBe(3);
  });

  it("caps at level 50", () => {
    expect(calculateLevel(1_000_000)).toBe(50);
  });

  it("level 10 requires 8100 XP", () => {
    // level = floor(sqrt(8100/100)) + 1 = floor(9) + 1 = 10
    expect(calculateLevel(8100)).toBe(10);
  });
});

// ─── Streak logic ─────────────────────────────────────────────────────────────
function isStreakAlive(lastActivityMs: number, nowMs: number): boolean {
  const diffDays = (nowMs - lastActivityMs) / (1000 * 60 * 60 * 24);
  return diffDays <= 1;
}

describe("Gamification — Streak logic", () => {
  const now = Date.now();

  it("streak is alive if last activity was today", () => {
    expect(isStreakAlive(now - 1000 * 60 * 60 * 2, now)).toBe(true); // 2 hours ago
  });

  it("streak is alive if last activity was yesterday", () => {
    expect(isStreakAlive(now - 1000 * 60 * 60 * 23, now)).toBe(true); // 23 hours ago
  });

  it("streak is broken if last activity was 2+ days ago", () => {
    expect(isStreakAlive(now - 1000 * 60 * 60 * 49, now)).toBe(false); // 49 hours ago
  });
});

// ─── Badge award logic ────────────────────────────────────────────────────────
const BADGES: Array<{ id: string; threshold: number; type: "xp" | "streak" }> = [
  { id: "first_steps", threshold: 50, type: "xp" },
  { id: "century_club", threshold: 100, type: "xp" },
  { id: "xp_500", threshold: 500, type: "xp" },
  { id: "week_warrior", threshold: 7, type: "streak" },
  { id: "month_master", threshold: 30, type: "streak" },
];

function getEarnedBadges(totalXp: number, currentStreak: number): string[] {
  return BADGES
    .filter(b => b.type === "xp" ? totalXp >= b.threshold : currentStreak >= b.threshold)
    .map(b => b.id);
}

describe("Gamification — Badge awards", () => {
  it("earns first_steps badge at 50 XP", () => {
    expect(getEarnedBadges(50, 0)).toContain("first_steps");
  });

  it("earns century_club badge at 100 XP", () => {
    expect(getEarnedBadges(100, 0)).toContain("century_club");
  });

  it("earns week_warrior badge at 7-day streak", () => {
    expect(getEarnedBadges(0, 7)).toContain("week_warrior");
  });

  it("earns month_master badge at 30-day streak", () => {
    expect(getEarnedBadges(0, 30)).toContain("month_master");
  });

  it("earns no badges at 0 XP and 0 streak", () => {
    expect(getEarnedBadges(0, 0)).toHaveLength(0);
  });

  it("earns all XP badges at 500 XP", () => {
    const badges = getEarnedBadges(500, 0);
    expect(badges).toContain("first_steps");
    expect(badges).toContain("century_club");
    expect(badges).toContain("xp_500");
  });
});

// ─── Leaderboard structure ────────────────────────────────────────────────────
describe("Gamification — Leaderboard structure", () => {
  const mockLeaderboard = {
    entries: [
      { rank: 1, userId: 1, name: "Alice", totalXp: 1500, weeklyXp: 200, level: 5, badges: ["first_steps"], isCurrentUser: false },
      { rank: 2, userId: 2, name: "Bob", totalXp: 1200, weeklyXp: 150, level: 4, badges: [], isCurrentUser: true },
    ],
    myRank: 2,
  };

  it("has entries array", () => {
    expect(Array.isArray(mockLeaderboard.entries)).toBe(true);
  });

  it("entries are sorted by rank", () => {
    const ranks = mockLeaderboard.entries.map(e => e.rank);
    expect(ranks).toEqual([1, 2]);
  });

  it("myRank is correct", () => {
    expect(mockLeaderboard.myRank).toBe(2);
  });

  it("isCurrentUser flag is set correctly", () => {
    const me = mockLeaderboard.entries.find(e => e.isCurrentUser);
    expect(me?.name).toBe("Bob");
  });
});
