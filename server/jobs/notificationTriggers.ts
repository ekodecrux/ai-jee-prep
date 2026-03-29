/**
 * Automated Notification Triggers
 * Runs daily to check for overdue lessons, mock tests, streak risks, and plan delays.
 * Called from server startup and can be triggered manually from admin panel.
 */

import { and, eq, lt, lte, isNull, ne, sql, gte } from "drizzle-orm";
import { getDb } from "../db";
import {
  users, chapters, chapterProgress, mockTestSchedule,
  lessonPlanDays, notifications, chapterHeatmap,
} from "../../drizzle/schema";
import { sendOverdueNotification, sendMockTestUnlockEmail } from "../email";

export interface TriggerResult {
  overdueLesson: number;
  mockTestUnlocked: number;
  streakAtRisk: number;
  planBehind: number;
  weakChapterAlerts: number;
  total: number;
}

async function createNotification(
  db: Awaited<ReturnType<typeof getDb>>,
  userId: number,
  type: string,
  title: string,
  message: string,
  urgency: "info" | "warning" | "critical" | "success",
  relatedId?: number,
  relatedType?: string
) {
  if (!db) return;
  try {
    await (db as any).insert(notifications).values({
      userId,
      type,
      title,
      message,
      urgency,
      relatedId: relatedId ? String(relatedId) : null,
      relatedType: relatedType || null,
      isRead: false,
    });
  } catch {
    // Silently ignore duplicate notifications
  }
}

/**
 * Check for overdue lesson plan sessions and create notifications
 */
async function checkOverdueLessons(db: Awaited<ReturnType<typeof getDb>>): Promise<number> {
  if (!db) return 0;
  let count = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Get all lesson plan entries that are past due and not completed
    const todayStr = today.toISOString().split("T")[0];
    const overdue = await db.select({
      userId: lessonPlanDays.userId,
      chapterId: lessonPlanDays.chapterId,
      scheduledDate: lessonPlanDays.planDate,
      sessionType: lessonPlanDays.sessionType,
    })
      .from(lessonPlanDays)
      .where(
        and(
          lt(lessonPlanDays.planDate, todayStr),
          eq(lessonPlanDays.isCompleted, false),
          ne(lessonPlanDays.isHoliday, true)
        )
      )
      .limit(200);

    for (const item of overdue) {
      const chapter = await db.select({ title: chapters.title })
        .from(chapters)
        .where(eq(chapters.chapterId, item.chapterId ?? ""))
        .limit(1);

      const chapterTitle = chapter[0]?.title || item.chapterId || "Unknown Chapter";
      const daysOverdue = Math.floor((today.getTime() - new Date(String(item.scheduledDate)).getTime()) / (1000 * 60 * 60 * 24));

      await createNotification(
        db,
        item.userId,
        "lesson_overdue",
        `Overdue Lesson: ${chapterTitle}`,
        `Your lesson on "${chapterTitle}" was scheduled ${daysOverdue} day${daysOverdue > 1 ? "s" : ""} ago and hasn't been completed. Reschedule it now to stay on track.`,
        daysOverdue > 3 ? "critical" : daysOverdue > 1 ? "warning" : "info",
        undefined,
        "lesson"
      );
      count++;
    }
  } catch (err) {
    console.error("[NotificationTrigger] checkOverdueLessons error:", err);
  }
  return count;
}

/**
 * Check for mock tests that have just unlocked and notify students
 */
async function checkMockTestUnlocks(db: Awaited<ReturnType<typeof getDb>>): Promise<number> {
  if (!db) return 0;
  let count = 0;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  try {
    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    // Mock tests that unlocked in the last 24 hours
    const newlyUnlocked = await db.select()
      .from(mockTestSchedule)
      .where(
        and(
          lte(mockTestSchedule.scheduledUnlockDate, todayStr),
          gte(mockTestSchedule.scheduledUnlockDate, yesterdayStr),
          eq(mockTestSchedule.isActive, true)
        )
      )
      .limit(50);

    if (newlyUnlocked.length === 0) return 0;

    // Get all students to notify
    const students = await db.select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(sql`${users.role} = 'student'`)
      .limit(1000);

    for (const mockTest of newlyUnlocked) {
      for (const student of students) {
        await createNotification(
          db,
          student.id,
          "mock_test_unlocked",
          `Mock Test Unlocked: ${mockTest.title}`,
          `${mockTest.title} is now available! This is a ${mockTest.examId === "jee_advanced" ? "JEE Advanced" : "JEE Main"} style test. Take it on ${mockTest.scheduledUnlockDate || "the scheduled date"}.`,
        "warning",
        mockTest.id,
          "mock_test"
        );
        count++;

        // Send email notification
        if (student.email) {
          try {
            await sendMockTestUnlockEmail({
              to: student.email,
              name: student.name || "Student",
              testName: mockTest.title,
              testDate: mockTest.scheduledUnlockDate || "",
              testUrl: `https://jeemasterprep-f58cx8ks.manus.space/mock-tests`,
            });
          } catch {
            // Email failure should not block notification creation
          }
        }
      }
    }
  } catch (err) {
    console.error("[NotificationTrigger] checkMockTestUnlocks error:", err);
  }
  return count;
}

/**
 * Check for students who haven't studied in 2+ days (streak at risk)
 */
async function checkStreakAtRisk(db: Awaited<ReturnType<typeof getDb>>): Promise<number> {
  if (!db) return 0;
  let count = 0;
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  try {
    // Find students whose last activity was 2+ days ago
    const atRisk = await db.select({
      userId: chapterProgress.userId,
      lastActivity: sql<Date>`MAX(${chapterProgress.lastAttemptAt})`,
    })
      .from(chapterProgress)
      .groupBy(chapterProgress.userId)
      .having(lt(sql<Date>`MAX(${chapterProgress.lastAttemptAt})`, twoDaysAgo))
      .limit(200);

    for (const student of atRisk) {
      const daysSince = Math.floor((Date.now() - new Date(student.lastActivity).getTime()) / (1000 * 60 * 60 * 24));
      await createNotification(
        db,
        student.userId,
        "streak_at_risk",
        "Study Streak at Risk! 🔥",
        `You haven't studied in ${daysSince} days. Log in today to maintain your streak and stay on track for JEE ${new Date().getFullYear() + 1}.`,
        daysSince > 5 ? "critical" : "warning",
        undefined,
        "streak"
      );
      count++;
    }
  } catch (err) {
    console.error("[NotificationTrigger] checkStreakAtRisk error:", err);
  }
  return count;
}

/**
 * Check for students behind on their 20-month plan
 */
async function checkPlanBehind(db: Awaited<ReturnType<typeof getDb>>): Promise<number> {
  if (!db) return 0;
  let count = 0;

  try {
    // Count overdue lesson plan items per user
    const today = new Date();
    const todayStr3 = today.toISOString().split("T")[0];
    const overdueByUser = await db.select({
      userId: lessonPlanDays.userId,
      overdueCount: sql<number>`COUNT(*)`,
    })
      .from(lessonPlanDays)
      .where(
        and(
          lt(lessonPlanDays.planDate, todayStr3),
          eq(lessonPlanDays.isCompleted, false),
          ne(lessonPlanDays.isHoliday, true)
        )
      )
      .groupBy(lessonPlanDays.userId)
      .having(sql`COUNT(*) >= 5`)
      .limit(200);

    for (const item of overdueByUser) {
      await createNotification(
        db,
        item.userId,
        "plan_behind_alert",
        "You Are Behind on Your 20-Month Plan",
        `You have ${item.overdueCount} overdue lessons in your study plan. At this pace, you may not complete all chapters before JEE. Review your plan and catch up this weekend.`,
        item.overdueCount > 10 ? "critical" : "warning",
        undefined,
        "plan"
      );
      count++;
    }
  } catch (err) {
    console.error("[NotificationTrigger] checkPlanBehind error:", err);
  }
  return count;
}

/**
 * Check for weak chapters (heatmap score < 60%) and alert students
 */
async function checkWeakChapters(db: Awaited<ReturnType<typeof getDb>>): Promise<number> {
  if (!db) return 0;
  let count = 0;

  try {
    // Find chapters where student scored < 60% in last 3 attempts
    const weakChapters = await db.select({
      userId: chapterHeatmap.userId,
      chapterId: chapterHeatmap.chapterId,
      currentScore: chapterHeatmap.heatmapScore,
      totalAttempts: chapterHeatmap.attemptsCount,
    })
      .from(chapterHeatmap)
      .where(
        and(
          lt(chapterHeatmap.heatmapScore, 60),
          sql`${chapterHeatmap.attemptsCount} >= 3`
        )
      )
      .limit(300);

    for (const item of weakChapters) {
      const chapter = await db.select({ title: chapters.title })
        .from(chapters)
        .where(eq(chapters.chapterId, item.chapterId ?? ""))
        .limit(1);

      const chapterTitle = chapter[0]?.title || item.chapterId || "Unknown Chapter";
      await createNotification(
        db,
        item.userId,
        "weak_chapter_alert",
        `Needs Revision: ${chapterTitle}`,
        `You've scored ${Math.round(item.currentScore)}% in "${chapterTitle}" across ${item.totalAttempts} attempts. This chapter needs focused revision before your mock tests.`,
        item.currentScore < 40 ? "critical" : "warning",
        undefined,
        "chapter"
      );
      count++;
    }
  } catch (err) {
    console.error("[NotificationTrigger] checkWeakChapters error:", err);
  }
  return count;
}

/**
 * Main trigger runner — runs all checks and returns summary
 */
export async function runAllNotificationTriggers(): Promise<TriggerResult> {
  const db = await getDb();
  if (!db) {
    console.warn("[NotificationTrigger] Database unavailable, skipping triggers");
    return { overdueLesson: 0, mockTestUnlocked: 0, streakAtRisk: 0, planBehind: 0, weakChapterAlerts: 0, total: 0 };
  }

  console.log("[NotificationTrigger] Running daily notification triggers...");

  const [overdueLesson, mockTestUnlocked, streakAtRisk, planBehind, weakChapterAlerts] = await Promise.all([
    checkOverdueLessons(db),
    checkMockTestUnlocks(db),
    checkStreakAtRisk(db),
    checkPlanBehind(db),
    checkWeakChapters(db),
  ]);

  const total = overdueLesson + mockTestUnlocked + streakAtRisk + planBehind + weakChapterAlerts;
  console.log(`[NotificationTrigger] Done: ${total} notifications created (overdue:${overdueLesson} mockTest:${mockTestUnlocked} streak:${streakAtRisk} plan:${planBehind} weak:${weakChapterAlerts})`);

  return { overdueLesson, mockTestUnlocked, streakAtRisk, planBehind, weakChapterAlerts, total };
}
