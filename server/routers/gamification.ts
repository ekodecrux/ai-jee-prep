/**
 * Gamification Router
 *
 * Manages streaks, XP, levels, badges, and leaderboards.
 *
 * XP Award Table:
 *   login             +5 XP
 *   chapter_complete  +20 XP
 *   assessment_pass   +30 XP
 *   streak_3          +25 XP (3-day streak milestone)
 *   streak_7          +50 XP (7-day streak milestone)
 *   streak_30         +100 XP (30-day streak milestone)
 *   perfect_score     +40 XP (100% on assessment)
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { userStreaks, xpLedger, userXpSummary, users, instituteMembers, classEnrollments } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

// ─── Constants ────────────────────────────────────────────────────────────────

const XP_REWARDS: Record<string, number> = {
  login: 5,
  chapter_complete: 20,
  assessment_pass: 30,
  streak_3: 25,
  streak_7: 50,
  streak_30: 100,
  perfect_score: 40,
  plan_generated: 10,
};

const BADGES: Array<{ slug: string; label: string; condition: (xp: number, streak: number) => boolean }> = [
  { slug: "first_login", label: "First Login", condition: (xp) => xp >= 5 },
  { slug: "streak_3", label: "3-Day Streak", condition: (_, streak) => streak >= 3 },
  { slug: "streak_7", label: "Week Warrior", condition: (_, streak) => streak >= 7 },
  { slug: "streak_30", label: "Month Master", condition: (_, streak) => streak >= 30 },
  { slug: "level_5", label: "Level 5 Scholar", condition: (xp) => xp >= 2000 },
  { slug: "level_10", label: "Level 10 Expert", condition: (xp) => xp >= 4500 },
  { slug: "xp_500", label: "XP Pioneer", condition: (xp) => xp >= 500 },
  { slug: "xp_1000", label: "XP Champion", condition: (xp) => xp >= 1000 },
];

function computeLevel(totalXp: number): number {
  return Math.floor(totalXp / 500) + 1;
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getMondayOfWeek(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

// ─── Internal helper: award XP and update streak ──────────────────────────────

async function awardXpInternal(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  action: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<{ xpEarned: number; newTotal: number; newLevel: number; streakBonuses: string[] }> {
  const baseXp = XP_REWARDS[action] ?? 0;
  const today = getTodayDate();
  const weekStart = getMondayOfWeek();
  const streakBonuses: string[] = [];
  let totalXpEarned = baseXp;

  // ── Update streak ────────────────────────────────────────────────────────
  const [streakRow] = await db
    .select()
    .from(userStreaks)
    .where(eq(userStreaks.userId, userId))
    .limit(1);

  let currentStreak = streakRow?.currentStreak ?? 0;
  let longestStreak = streakRow?.longestStreak ?? 0;
  let totalActiveDays = streakRow?.totalActiveDays ?? 0;
  const lastActivity = streakRow?.lastActivityDate;

  if (lastActivity !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (lastActivity === yesterdayStr) {
      currentStreak += 1;
    } else if (lastActivity !== today) {
      currentStreak = 1;
    }

    totalActiveDays += 1;
    if (currentStreak > longestStreak) longestStreak = currentStreak;

    // Streak milestone bonuses
    if (currentStreak === 3) {
      totalXpEarned += XP_REWARDS.streak_3;
      streakBonuses.push("streak_3");
    } else if (currentStreak === 7) {
      totalXpEarned += XP_REWARDS.streak_7;
      streakBonuses.push("streak_7");
    } else if (currentStreak === 30) {
      totalXpEarned += XP_REWARDS.streak_30;
      streakBonuses.push("streak_30");
    }

    if (streakRow) {
      await db.update(userStreaks).set({
        currentStreak,
        longestStreak,
        lastActivityDate: today,
        totalActiveDays,
      }).where(eq(userStreaks.userId, userId));
    } else {
      await db.insert(userStreaks).values({
        userId,
        currentStreak,
        longestStreak,
        lastActivityDate: today,
        totalActiveDays,
      });
    }
  }

  // ── Log XP entry ─────────────────────────────────────────────────────────
  if (totalXpEarned > 0) {
    await db.insert(xpLedger).values({
      userId,
      action,
      xpEarned: totalXpEarned,
      description: description ?? action,
      metadata: metadata ?? null,
    });
  }

  // ── Update XP summary ────────────────────────────────────────────────────
  const [summaryRow] = await db
    .select()
    .from(userXpSummary)
    .where(eq(userXpSummary.userId, userId))
    .limit(1);

  const prevTotal = summaryRow?.totalXp ?? 0;
  const prevWeekly = summaryRow?.weeklyXp ?? 0;
  const prevWeekStart = summaryRow?.weekStartDate;
  const newTotal = prevTotal + totalXpEarned;
  const newWeekly = prevWeekStart === weekStart ? prevWeekly + totalXpEarned : totalXpEarned;
  const newLevel = computeLevel(newTotal);

  // Compute earned badges
  const existingBadges: string[] = summaryRow?.badges ?? [];
  const newBadges = BADGES
    .filter(b => !existingBadges.includes(b.slug) && b.condition(newTotal, currentStreak))
    .map(b => b.slug);
  const allBadges = [...existingBadges, ...newBadges];

  if (summaryRow) {
    await db.update(userXpSummary).set({
      totalXp: newTotal,
      weeklyXp: newWeekly,
      level: newLevel,
      badges: allBadges,
      weekStartDate: weekStart,
    }).where(eq(userXpSummary.userId, userId));
  } else {
    await db.insert(userXpSummary).values({
      userId,
      totalXp: newTotal,
      weeklyXp: newWeekly,
      level: newLevel,
      badges: allBadges,
      weekStartDate: weekStart,
    });
  }

  return { xpEarned: totalXpEarned, newTotal, newLevel, streakBonuses };
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const gamificationRouter = router({
  /**
   * Get the current user's full gamification stats.
   */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const [streak] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, ctx.user.id))
      .limit(1);

    const [summary] = await db
      .select()
      .from(userXpSummary)
      .where(eq(userXpSummary.userId, ctx.user.id))
      .limit(1);

    const recentXp = await db
      .select()
      .from(xpLedger)
      .where(eq(xpLedger.userId, ctx.user.id))
      .orderBy(desc(xpLedger.createdAt))
      .limit(10);

    return {
      streak: streak ?? { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, lastActivityDate: null },
      xp: summary ?? { totalXp: 0, weeklyXp: 0, level: 1, badges: [] },
      recentActivity: recentXp,
    };
  }),

  /**
   * Get the platform-wide leaderboard (top 50 by total XP).
   * Optionally filter to a specific class.
   */
  getLeaderboard: protectedProcedure
    .input(z.object({
      classId: z.number().optional(),
      limit: z.number().min(5).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Get top XP summaries
      const topSummaries = await db
        .select({
          userId: userXpSummary.userId,
          totalXp: userXpSummary.totalXp,
          weeklyXp: userXpSummary.weeklyXp,
          level: userXpSummary.level,
          badges: userXpSummary.badges,
        })
        .from(userXpSummary)
        .orderBy(desc(userXpSummary.totalXp))
        .limit(input.limit);

      if (topSummaries.length === 0) return { entries: [], myRank: null };

      // Fetch user names
      const userIds = topSummaries.map(s => s.userId);
      const userRows = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`);

      const nameMap = Object.fromEntries(userRows.map(u => [u.id, u.name ?? "Anonymous"]));

      const entries = topSummaries.map((s, i) => ({
        rank: i + 1,
        userId: s.userId,
        name: nameMap[s.userId] ?? "Anonymous",
        totalXp: s.totalXp,
        weeklyXp: s.weeklyXp,
        level: s.level,
        badges: s.badges ?? [],
        isCurrentUser: s.userId === ctx.user.id,
      }));

      // Find current user's rank if not in top list
      const myEntry = entries.find(e => e.isCurrentUser);
      let myRank: number | null = myEntry?.rank ?? null;

      if (!myRank) {
        const [mySummary] = await db
          .select({ totalXp: userXpSummary.totalXp })
          .from(userXpSummary)
          .where(eq(userXpSummary.userId, ctx.user.id))
          .limit(1);

        if (mySummary) {
          const [{ count }] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(userXpSummary)
            .where(sql`${userXpSummary.totalXp} > ${mySummary.totalXp}`);
          myRank = (count ?? 0) + 1;
        }
      }

      return { entries, myRank };
    }),

  /**
   * Award XP to the current user for a specific action.
   * Called from frontend after completing activities.
   */
  awardXp: protectedProcedure
    .input(z.object({
      action: z.enum(["login", "chapter_complete", "assessment_pass", "perfect_score", "plan_generated"]),
      description: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      return awardXpInternal(db, ctx.user.id, input.action, input.description, input.metadata);
    }),

  /**
   * Get the streak status for today (has the user been active today?).
   */
  getStreakStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const today = getTodayDate();
    const [streak] = await db
      .select()
      .from(userStreaks)
      .where(eq(userStreaks.userId, ctx.user.id))
      .limit(1);

    return {
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      isActiveToday: streak?.lastActivityDate === today,
      lastActivityDate: streak?.lastActivityDate ?? null,
    };
  }),
});
