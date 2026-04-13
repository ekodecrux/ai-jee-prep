/**
 * Streak Alert Job
 *
 * Runs daily at 8 PM (20:00) server time.
 * Queries all students with currentStreak > 0 and lastActivityDate < 20 hours ago,
 * then inserts a "streak_at_risk" notification so the bell badge lights up
 * before midnight, prompting students to log in and keep their streak alive.
 */
import { getDb } from "../db";
import { userStreaks, notifications, users } from "../../drizzle/schema";
import { eq, and, lt, gt, sql } from "drizzle-orm";

/**
 * Core job logic — can be called independently for testing.
 */
export async function runStreakAlertJob(): Promise<{
  studentsChecked: number;
  alertsSent: number;
  skipped: number;
}> {
  const db = await getDb();
  if (!db) {
    console.warn("[StreakAlertJob] DB unavailable, skipping run");
    return { studentsChecked: 0, alertsSent: 0, skipped: 0 };
  }

  // Find all students with an active streak
  const activeStreaks = await db
    .select({
      userId: userStreaks.userId,
      currentStreak: userStreaks.currentStreak,
      lastActivityDate: userStreaks.lastActivityDate,
    })
    .from(userStreaks)
    .where(gt(userStreaks.currentStreak, 0));

  let studentsChecked = 0;
  let alertsSent = 0;
  let skipped = 0;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0]; // "YYYY-MM-DD"

  for (const streak of activeStreaks) {
    studentsChecked++;

    // Check if last activity was more than 20 hours ago
    if (!streak.lastActivityDate) {
      skipped++;
      continue;
    }

    const lastActive = new Date(streak.lastActivityDate + "T00:00:00Z");
    const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

    if (hoursSinceActive < 20) {
      skipped++; // Student was active recently — no alert needed
      continue;
    }

    // Check if we already sent a streak_at_risk notification today
    const existingToday = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, streak.userId),
          eq(notifications.type, "streak_at_risk"),
          sql`DATE(${notifications.createdAt}) = ${todayStr}`
        )
      )
      .limit(1);

    if (existingToday.length > 0) {
      skipped++; // Already notified today
      continue;
    }

    // Insert streak_at_risk notification
    const streakDays = streak.currentStreak;
    const hoursLeft = Math.max(0, Math.round(24 - hoursSinceActive));

    await db.insert(notifications).values({
      userId: streak.userId,
      type: "streak_at_risk",
      title: `🔥 Your ${streakDays}-day streak is at risk!`,
      message: `You haven't studied today yet. Log in and complete at least one chapter or assessment in the next ${hoursLeft} hour${hoursLeft !== 1 ? "s" : ""} to keep your streak alive.`,
      urgency: hoursLeft <= 4 ? "critical" : "warning",
      actionUrl: "/dashboard",
      relatedType: "streak",
    });

    alertsSent++;
  }

  console.log(
    `[StreakAlertJob] Done — checked:${studentsChecked} alerts:${alertsSent} skipped:${skipped}`
  );

  return { studentsChecked, alertsSent, skipped };
}

/**
 * Schedule the streak alert job to run daily at 8 PM (20:00) server time.
 * Call this once from server startup.
 */
export function scheduleStreakAlertJob(): void {
  function getNextRunMs(): number {
    const now = new Date();
    const next = new Date(now);
    next.setHours(20, 0, 0, 0); // 8 PM today
    if (next <= now) {
      next.setDate(next.getDate() + 1); // Tomorrow at 8 PM
    }
    return next.getTime() - now.getTime();
  }

  function scheduleNextRun() {
    const msUntilNext = getNextRunMs();
    console.log(
      `[StreakAlertJob] Next run scheduled in ${Math.round(msUntilNext / 60000)} minutes (8 PM daily)`
    );
    setTimeout(() => {
      runStreakAlertJob().catch(err =>
        console.error("[StreakAlertJob] Run failed:", err)
      );
      scheduleNextRun(); // Reschedule for tomorrow
    }, msUntilNext);
  }

  scheduleNextRun();
}
