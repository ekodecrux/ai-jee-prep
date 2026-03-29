/**
 * Assessments Router — tRPC procedures for assessment attempts, scoring, and limits
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { assessments, assessmentAttempts, dailyAttemptLimits, questions, mockTests, mockTestAttempts, chapterProgress, chapters } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

// ─── Helper: Get today's date string ─────────────────────────────────────────
const getTodayStr = () => new Date().toISOString().split("T")[0];

export const assessmentsRouter = router({
  // Get assessment by ID
  getById: publicProcedure
    .input(z.object({ assessmentId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const result = await db.select().from(assessments).where(eq(assessments.assessmentId, input.assessmentId)).limit(1);
      if (!result.length) throw new Error("Assessment not found");

      // Get questions
      const questionIds = result[0].questionIds as number[];
      const questionList = await db.select().from(questions).where(
        sql`id IN (${sql.join(questionIds.map(id => sql`${id}`), sql`, `)})`
      );

      return {
        ...result[0],
        questions: questionList.map(q => ({
          ...q,
          // Hide answer for non-practice assessments
          correctAnswer: undefined,
          correctOptions: undefined,
          numericalAnswer: undefined,
          solution: undefined
        }))
      };
    }),

  // Check daily attempt limit
  checkDailyLimit: protectedProcedure
    .input(z.object({ assessmentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const assessment = await db.select().from(assessments).where(eq(assessments.assessmentId, input.assessmentId)).limit(1);
      if (!assessment.length) throw new Error("Assessment not found");

      const maxAttempts = assessment[0].maxDailyAttempts || 3;
      if (maxAttempts >= 999) return { canAttempt: true, attemptsUsed: 0, maxAttempts, remaining: 999 };

      const today = getTodayStr();
      const limitRecord = await db.select().from(dailyAttemptLimits).where(
        and(
          eq(dailyAttemptLimits.userId, ctx.user.id),
          eq(dailyAttemptLimits.assessmentId, input.assessmentId),
          eq(dailyAttemptLimits.attemptDate, today)
        )
      ).limit(1);

      const attemptsUsed = limitRecord[0]?.attemptsUsed || 0;
      return {
        canAttempt: attemptsUsed < maxAttempts,
        attemptsUsed,
        maxAttempts,
        remaining: maxAttempts - attemptsUsed
      };
    }),

  // Submit assessment attempt
  submitAttempt: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
      answers: z.record(z.string(), z.string()), // questionId -> answer
      timeTakenSeconds: z.number().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const assessment = await db.select().from(assessments).where(eq(assessments.assessmentId, input.assessmentId)).limit(1);
      if (!assessment.length) throw new Error("Assessment not found");

      const asmt = assessment[0];

      // Check daily limit for chapter tests
      if (asmt.assessmentType === "chapter_test") {
        const today = getTodayStr();
        const limitRecord = await db.select().from(dailyAttemptLimits).where(
          and(
            eq(dailyAttemptLimits.userId, ctx.user.id),
            eq(dailyAttemptLimits.assessmentId, input.assessmentId),
            eq(dailyAttemptLimits.attemptDate, today)
          )
        ).limit(1);

        const attemptsUsed = limitRecord[0]?.attemptsUsed || 0;
        const maxAttempts = asmt.maxDailyAttempts || 3;

        if (attemptsUsed >= maxAttempts) {
          throw new Error(`Daily attempt limit reached (${maxAttempts} attempts per day)`);
        }

        // Update daily limit
        if (limitRecord.length > 0) {
          await db.update(dailyAttemptLimits).set({ attemptsUsed: attemptsUsed + 1 }).where(
            and(
              eq(dailyAttemptLimits.userId, ctx.user.id),
              eq(dailyAttemptLimits.assessmentId, input.assessmentId),
              eq(dailyAttemptLimits.attemptDate, today)
            )
          );
        } else {
          await db.insert(dailyAttemptLimits).values({
            userId: ctx.user.id,
            assessmentId: input.assessmentId,
            attemptDate: today,
            attemptsUsed: 1
          });
        }
      }

      // Get questions and grade
      const questionIds = asmt.questionIds as number[];
      const questionList = await db.select().from(questions).where(
        sql`id IN (${sql.join(questionIds.map(id => sql`${id}`), sql`, `)})`
      );

      let totalScore = 0;
      let maxScore = 0;
      const questionResults: Record<string, { correct: boolean; score: number; correctAnswer: string; solution: string }> = {};
      const weakTopics: string[] = [];

      for (const q of questionList) {
        const userAnswer = input.answers[q.id.toString()];
        const marks = q.marks || 4;
        const negMarks = q.negativeMarks || 1;
        maxScore += marks;

        let isCorrect = false;
        if (q.questionType === "multi_correct") {
          const userOpts = (userAnswer || "").split(",").sort();
          const correctOpts = ((q.correctOptions as string[]) || []).sort();
          isCorrect = JSON.stringify(userOpts) === JSON.stringify(correctOpts);
        } else if (q.questionType === "nat") {
          const userNum = parseFloat(userAnswer || "");
          const range = q.answerRange as { min: number; max: number } | null;
          if (range) {
            isCorrect = userNum >= range.min && userNum <= range.max;
          } else {
            isCorrect = Math.abs(userNum - (q.numericalAnswer || 0)) < 0.01;
          }
        } else {
          isCorrect = userAnswer?.trim().toUpperCase() === q.correctAnswer?.trim().toUpperCase();
        }

        const questionScore = userAnswer
          ? isCorrect ? marks : (q.questionType === "nat" || q.questionType === "integer" ? 0 : -negMarks)
          : 0;

        totalScore += questionScore;
        questionResults[q.id.toString()] = {
          correct: isCorrect,
          score: questionScore,
          correctAnswer: q.correctAnswer,
          solution: q.solution
        };

        if (!isCorrect && q.conceptTested) {
          weakTopics.push(q.conceptTested);
        }
      }

      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      const passed = percentage >= (asmt.passingScore || 60);

      const uniqueWeakTopics = Array.from(new Set(weakTopics));
      // Save attempt
      await db.insert(assessmentAttempts).values({
        assessmentId: input.assessmentId,
        chapterId: asmt.chapterId,
        examId: asmt.examId,
        attemptType: asmt.assessmentType,
        answers: input.answers,
        score: totalScore,
        maxScore,
        percentage,
        timeTakenSeconds: input.timeTakenSeconds,
        passed,
        questionResults,
        weakTopics: uniqueWeakTopics,
        completedAt: new Date()
      } as any);

      return {
        score: totalScore,
        maxScore,
        percentage: Math.round(percentage * 10) / 10,
        passed,
        questionResults,
        weakTopics: uniqueWeakTopics,
        passingScore: asmt.passingScore || 60
      };
    }),

  // Get attempt history for a user
  getAttemptHistory: protectedProcedure
    .input(z.object({
      assessmentId: z.string().optional(),
      chapterId: z.string().optional(),
      limit: z.number().default(10)
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const conditions = [eq(assessmentAttempts.userId, ctx.user.id)];
      if (input.assessmentId) conditions.push(eq(assessmentAttempts.assessmentId, input.assessmentId));
      if (input.chapterId) conditions.push(eq(assessmentAttempts.chapterId, input.chapterId));

      return await db.select().from(assessmentAttempts)
        .where(and(...conditions))
        .orderBy(sql`startedAt DESC`)
        .limit(input.limit);
    }),

  // Get mock tests
  getMockTests: publicProcedure
    .input(z.object({
      examId: z.string().default("jee_main"),
      testType: z.enum(["subject_mock", "full_mock"]).optional()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const conditions = [eq(mockTests.examId, input.examId), eq(mockTests.isActive, true)];
      if (input.testType) conditions.push(eq(mockTests.testType, input.testType));

      return await db.select().from(mockTests).where(and(...conditions));
    }),

  // Check if mock test is unlocked for user
  checkMockTestUnlock: protectedProcedure
    .input(z.object({ mockTestId: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const mockTest = await db.select().from(mockTests).where(eq(mockTests.mockTestId, input.mockTestId)).limit(1);
      if (!mockTest.length) throw new Error("Mock test not found");

      const requirement = mockTest[0].unlockRequirement as { subjectId?: string; minCompletedChapters?: number } | null;
      if (!requirement) return { unlocked: true };

      const progress = await db.select().from(chapterProgress).where(
        and(
          eq(chapterProgress.userId, ctx.user.id),
          ...(requirement.subjectId ? [eq(chapterProgress.subjectId, requirement.subjectId)] : [])
        )
      );

      const completedCount = progress.filter(p => p.status === "completed").length;
      const required = requirement.minCompletedChapters || 0;

      return {
        unlocked: completedCount >= required,
        completedCount,
        required,
        remaining: Math.max(0, required - completedCount)
      };
    }),

  // Get performance analytics for a user
  getAnalytics: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const attempts = await db.select().from(assessmentAttempts)
        .where(eq(assessmentAttempts.userId, ctx.user.id))
        .orderBy(sql`startedAt DESC`)
        .limit(100);

      if (attempts.length === 0) {
        return { totalAttempts: 0, avgScore: 0, bestScore: 0, passRate: 0, recentTrend: [], weakTopics: [] };
      }

      const avgScore = attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length;
      const bestScore = Math.max(...attempts.map(a => a.percentage));
      const passRate = (attempts.filter(a => a.passed).length / attempts.length) * 100;

      // Collect weak topics
      const topicCounts: Record<string, number> = {};
      for (const attempt of attempts) {
        const weak = (attempt.weakTopics as string[]) || [];
        for (const topic of weak) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      }
      const weakTopics = Object.entries(topicCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, count }));

      // Recent trend (last 10 attempts)
      const recentTrend = attempts.slice(0, 10).reverse().map(a => ({
        date: a.startedAt,
        percentage: a.percentage,
        passed: a.passed
      }));

      return {
        totalAttempts: attempts.length,
        avgScore: Math.round(avgScore * 10) / 10,
        bestScore: Math.round(bestScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
        recentTrend,
        weakTopics
      };
    })
});
