/**
 * Adaptive Study Plan Router
 *
 * Uses LLM to generate a personalised weekly study schedule based on:
 * - Student's weak chapters (from assessment attempts)
 * - Target exam and date
 * - Remaining weeks until exam
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { adaptiveStudyPlans, chapterProgress, assessmentAttempts, chapters } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMondayOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function getDaysUntil(targetDate: string): number {
  const now = new Date();
  const target = new Date(targetDate);
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

// ─── Types ───────────────────────────────────────────────────────────────────
type AdaptiveStudyPlanJson = {
  weekLabel: string;
  daysUntilExam: number;
  dailySchedule: Array<{
    day: string;
    subjects: Array<{
      subject: string;
      chapter: string;
      chapterId: string;
      activity: string;
      durationMinutes: number;
      priority: "high" | "medium" | "low";
    }>;
    totalMinutes: number;
  }>;
  weeklyGoals: string[];
  focusAreas: string[];
  motivationalNote: string;
};

// ─── Router ───────────────────────────────────────────────────────────────────

export const studyPlanRouter = router({
  /**
   * Get the current week's active study plan for the authenticated user.
   */
  getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const weekStart = getMondayOfWeek(new Date());
    const [plan] = await db
      .select()
      .from(adaptiveStudyPlans)
      .where(
        and(
          eq(adaptiveStudyPlans.userId, ctx.user.id),
          eq(adaptiveStudyPlans.weekStart, weekStart),
          eq(adaptiveStudyPlans.isActive, true)
        )
      )
      .limit(1);
    return plan ?? null;
  }),

  /**
   * Get all past study plans for the user (most recent first).
   */
  getPlanHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    return db
      .select()
      .from(adaptiveStudyPlans)
      .where(eq(adaptiveStudyPlans.userId, ctx.user.id))
      .orderBy(desc(adaptiveStudyPlans.weekStart))
      .limit(8);
  }),

  /**
   * Generate (or regenerate) a personalised weekly study plan using the LLM.
   */
  generatePlan: protectedProcedure
    .input(
      z.object({
        examId: z.string().default("jee_main"),
        targetExamDate: z.string().optional(),
        forceRegenerate: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const weekStart = getMondayOfWeek(new Date());

      // Return existing plan if not forcing regeneration
      if (!input.forceRegenerate) {
        const [existing] = await db
          .select()
          .from(adaptiveStudyPlans)
          .where(
            and(
              eq(adaptiveStudyPlans.userId, ctx.user.id),
              eq(adaptiveStudyPlans.weekStart, weekStart),
              eq(adaptiveStudyPlans.isActive, true)
            )
          )
          .limit(1);
        if (existing) return existing;
      }

      // ── Gather student performance data ──────────────────────────────────
      const progressRecords = await db
        .select()
        .from(chapterProgress)
        .where(eq(chapterProgress.userId, ctx.user.id));

      const recentAttempts = await db
        .select()
        .from(assessmentAttempts)
        .where(eq(assessmentAttempts.userId, ctx.user.id))
        .orderBy(desc(assessmentAttempts.startedAt))
        .limit(30);

      const allChapters = await db
        .select({
          chapterId: chapters.chapterId,
          title: chapters.title,
          subjectId: chapters.subjectId,
          difficultyLevel: chapters.difficultyLevel,
        })
        .from(chapters)
        .limit(80);

      // Identify weak chapters (score < 60% or never attempted)
      const weakChapterIds: string[] = [];
      const chapterScoreMap: Record<string, number> = {};

      for (const attempt of recentAttempts) {
        if (attempt.chapterId) {
          const prev = chapterScoreMap[attempt.chapterId];
          if (prev === undefined || (attempt.percentage ?? 0) > prev) {
            chapterScoreMap[attempt.chapterId] = attempt.percentage ?? 0;
          }
        }
      }

      for (const ch of allChapters) {
        const cid = ch.chapterId ?? "";
        const score = chapterScoreMap[cid];
        if (score === undefined || score < 60) {
          weakChapterIds.push(cid);
        }
      }

      const weakChapters = allChapters
        .filter(c => weakChapterIds.includes(c.chapterId ?? ""))
        .slice(0, 15);

      const completedChapters = progressRecords.filter(p => p.status === "completed").length;
      const totalChapters = allChapters.length;
      const daysUntilExam = input.targetExamDate ? getDaysUntil(input.targetExamDate) : 180;
      const weeksRemaining = Math.ceil(daysUntilExam / 7);

      const weakChapterSummary = weakChapters
        .map(c => `${c.title} (${c.subjectId}, ${c.difficultyLevel})`)
        .join(", ");

      // ── Build LLM prompt ──────────────────────────────────────────────────
      const prompt = `You are an expert JEE/NEET exam coach creating a personalised weekly study plan.

Student Context:
- Target Exam: ${input.examId.replace("_", " ").toUpperCase()}
- Days until exam: ${daysUntilExam} (${weeksRemaining} weeks remaining)
- Chapters completed: ${completedChapters}/${totalChapters}
- Weak chapters needing attention: ${weakChapterSummary || "None identified yet — focus on foundation chapters"}

Create a detailed 7-day study plan for this week. The plan must be realistic, focused on the weak areas, and balanced across subjects.

Return ONLY valid JSON matching this exact structure:
{
  "weekLabel": "Week of [date range]",
  "daysUntilExam": ${daysUntilExam},
  "dailySchedule": [
    {
      "day": "Monday",
      "subjects": [
        {
          "subject": "Physics",
          "chapter": "Chapter title",
          "chapterId": "PHY_C11_01",
          "activity": "Read narration + solve 10 practice questions",
          "durationMinutes": 90,
          "priority": "high"
        }
      ],
      "totalMinutes": 180
    }
  ],
  "weeklyGoals": ["Complete Thermodynamics revision", "Score 70%+ in Chemistry mock"],
  "focusAreas": ["Organic Chemistry", "Calculus"],
  "motivationalNote": "A short, genuine motivational message for the student"
}

Rules:
- Include all 7 days (Monday through Sunday)
- Sunday should be lighter (revision/rest)
- Total daily study time: 3-4 hours on weekdays, 2 hours on Sunday
- Prioritise weak chapters but include some strong chapters for confidence`;

      let generatedPlan: unknown;
      try {
        const llmResponse = await invokeLLM({
          messages: [
            { role: "system" as const, content: "You are a world-class exam coaching AI. Always return valid JSON only, no markdown." },
            { role: "user" as const, content: prompt },
          ],
        });
        const rawContent = llmResponse.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : "{}";
        generatedPlan = JSON.parse(content);
      } catch {
        // Fallback plan if LLM fails
        generatedPlan = {
          weekLabel: `Week of ${weekStart}`,
          daysUntilExam,
          dailySchedule: [
            { day: "Monday", subjects: [{ subject: "Physics", chapter: "Kinematics", chapterId: "PHY_C11_01", activity: "Read narration + 10 practice questions", durationMinutes: 90, priority: "high" }, { subject: "Mathematics", chapter: "Sets & Relations", chapterId: "MAT_C11_01", activity: "Concept review + 15 problems", durationMinutes: 90, priority: "medium" }], totalMinutes: 180 },
            { day: "Tuesday", subjects: [{ subject: "Chemistry", chapter: "Basic Concepts", chapterId: "CHE_C11_01", activity: "Read narration + practice MCQs", durationMinutes: 90, priority: "high" }, { subject: "Physics", chapter: "Laws of Motion", chapterId: "PHY_C11_02", activity: "Solve 20 problems", durationMinutes: 90, priority: "high" }], totalMinutes: 180 },
            { day: "Wednesday", subjects: [{ subject: "Mathematics", chapter: "Trigonometry", chapterId: "MAT_C11_02", activity: "Formula revision + 20 problems", durationMinutes: 120, priority: "high" }, { subject: "Chemistry", chapter: "Atomic Structure", chapterId: "CHE_C11_02", activity: "Concept reading", durationMinutes: 60, priority: "medium" }], totalMinutes: 180 },
            { day: "Thursday", subjects: [{ subject: "Physics", chapter: "Work & Energy", chapterId: "PHY_C11_03", activity: "Narration + past year questions", durationMinutes: 90, priority: "high" }, { subject: "Mathematics", chapter: "Complex Numbers", chapterId: "MAT_C11_03", activity: "Practice 15 problems", durationMinutes: 90, priority: "medium" }], totalMinutes: 180 },
            { day: "Friday", subjects: [{ subject: "Chemistry", chapter: "Chemical Bonding", chapterId: "CHE_C11_03", activity: "Deep dive + MCQ practice", durationMinutes: 120, priority: "high" }, { subject: "Physics", chapter: "Gravitation", chapterId: "PHY_C11_05", activity: "Formula sheet + 10 questions", durationMinutes: 60, priority: "medium" }], totalMinutes: 180 },
            { day: "Saturday", subjects: [{ subject: "All Subjects", chapter: "Weekly Mock Test", chapterId: "MOCK_WEEKLY", activity: "Full 3-subject mock test (90 min) + review", durationMinutes: 150, priority: "high" }], totalMinutes: 150 },
            { day: "Sunday", subjects: [{ subject: "All Subjects", chapter: "Revision & Rest", chapterId: "REVISION", activity: "Review weak areas from the week, light reading", durationMinutes: 90, priority: "low" }], totalMinutes: 90 },
          ],
          weeklyGoals: ["Complete 5 chapter narrations", "Score 60%+ on weekly mock", "Revise all weak chapters"],
          focusAreas: weakChapters.slice(0, 3).map(c => c.title ?? ""),
          motivationalNote: `You have ${weeksRemaining} weeks until your exam. Every hour of focused study today compounds into marks on exam day. Stay consistent!`,
        };
      }

      // Deactivate old plans for this week
      await db
        .update(adaptiveStudyPlans)
        .set({ isActive: false })
        .where(
          and(
            eq(adaptiveStudyPlans.userId, ctx.user.id),
            eq(adaptiveStudyPlans.weekStart, weekStart)
          )
        );

      // Insert new plan
      const [result] = await db.insert(adaptiveStudyPlans).values({
        userId: ctx.user.id,
        examId: input.examId,
        targetExamDate: input.targetExamDate ?? null,
        weekStart,
        generatedPlan: generatedPlan as AdaptiveStudyPlanJson,
        weakChapters: weakChapterIds.slice(0, 10),
        isActive: true,
      });

      const insertId = (result as { insertId: number }).insertId;
      const [newPlan] = await db
        .select()
        .from(adaptiveStudyPlans)
        .where(eq(adaptiveStudyPlans.id, insertId))
        .limit(1);

      return newPlan;
    }),
});
