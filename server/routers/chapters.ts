/**
 * Chapters Router — tRPC procedures for chapter listing, progress, and study plan
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { chapters, subjects, curricula, examChapterWeightage, chapterProgress, narrationScripts, questions, assessments } from "../../drizzle/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

export const chaptersRouter = router({
  // List all chapters for a subject
  listBySubject: publicProcedure
    .input(z.object({
      subjectId: z.string(),
      curriculumId: z.string().optional()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      let query = db.select().from(chapters).where(
        and(
          eq(chapters.subjectId, input.subjectId),
          eq(chapters.isActive, true)
        )
      );

      const result = await db.select().from(chapters).where(
        and(
          eq(chapters.subjectId, input.subjectId),
          eq(chapters.isActive, true),
          ...(input.curriculumId ? [eq(chapters.curriculumId, input.curriculumId)] : [])
        )
      ).orderBy(chapters.sortOrder);

      return result;
    }),

  // Get all chapters (all subjects) with subject info
  listAll: publicProcedure
    .input(z.object({
      examId: z.string().default("jee_main")
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const allChapters = await db.select({
        chapter: chapters,
        subject: subjects
      })
        .from(chapters)
        .leftJoin(subjects, eq(chapters.subjectId, subjects.subjectId))
        .where(eq(chapters.isActive, true))
        .orderBy(chapters.subjectId, chapters.sortOrder);

      // Get weightage data
      const weightageData = await db.select().from(examChapterWeightage)
        .where(eq(examChapterWeightage.examId, input.examId));

      const weightageMap = new Map(weightageData.map(w => [w.chapterId, w]));

      return allChapters.map(row => ({
        ...row.chapter,
        subject: row.subject,
        weightage: weightageMap.get(row.chapter.chapterId) || null
      }));
    }),

  // Get a single chapter with full details
  getById: publicProcedure
    .input(z.object({ chapterId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const result = await db.select({
        chapter: chapters,
        subject: subjects,
        curriculum: curricula
      })
        .from(chapters)
        .leftJoin(subjects, eq(chapters.subjectId, subjects.subjectId))
        .leftJoin(curricula, eq(chapters.curriculumId, curricula.curriculumId))
        .where(eq(chapters.chapterId, input.chapterId))
        .limit(1);

      if (!result.length) throw new Error("Chapter not found");

      const [weightageMain, weightageAdv] = await Promise.all([
        db.select().from(examChapterWeightage).where(
          and(eq(examChapterWeightage.chapterId, input.chapterId), eq(examChapterWeightage.examId, "jee_main"))
        ).limit(1),
        db.select().from(examChapterWeightage).where(
          and(eq(examChapterWeightage.chapterId, input.chapterId), eq(examChapterWeightage.examId, "jee_advanced"))
        ).limit(1)
      ]);

      // Check if content is generated
      const [narration, questionCount] = await Promise.all([
        db.select({ id: narrationScripts.id, wordCount: narrationScripts.wordCount }).from(narrationScripts).where(eq(narrationScripts.chapterId, input.chapterId)).limit(1),
        db.select({ count: sql<number>`count(*)` }).from(questions).where(eq(questions.chapterId, input.chapterId))
      ]);

      return {
        ...result[0].chapter,
        subject: result[0].subject,
        curriculum: result[0].curriculum,
        weightageMain: weightageMain[0] || null,
        weightageAdvanced: weightageAdv[0] || null,
        hasNarration: narration.length > 0 && (narration[0].wordCount || 0) > 500,
        questionCount: questionCount[0]?.count || 0
      };
    }),

  // Get user's progress for all chapters
  getUserProgress: protectedProcedure
    .input(z.object({
      subjectId: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const progressData = await db.select().from(chapterProgress).where(
        and(
          eq(chapterProgress.userId, ctx.user.id),
          ...(input.subjectId ? [eq(chapterProgress.subjectId, input.subjectId)] : [])
        )
      );

      return progressData;
    }),

  // Initialize progress for a user (called on first login)
  initializeProgress: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      // Check if already initialized
      const existing = await db.select().from(chapterProgress).where(eq(chapterProgress.userId, ctx.user.id)).limit(1);
      if (existing.length > 0) return { initialized: false, message: "Already initialized" };

      // Get all chapters
      const allChapters = await db.select().from(chapters).where(eq(chapters.isActive, true)).orderBy(chapters.subjectId, chapters.sortOrder);

      // First chapter of each subject is unlocked, rest are locked
      const subjectFirstChapter: Record<string, boolean> = {};
      const progressRows = allChapters.map(ch => {
        const isFirst = !subjectFirstChapter[ch.subjectId];
        if (isFirst) subjectFirstChapter[ch.subjectId] = true;
        return {
          userId: ctx.user.id,
          chapterId: ch.chapterId,
          subjectId: ch.subjectId,
          curriculumId: ch.curriculumId,
          status: isFirst ? "unlocked" as const : "locked" as const,
          narrationRead: false,
          bestScore: 0,
          totalAttempts: 0,
          timeSpentMinutes: 0
        };
      });

      // Insert in batches of 50
      for (let i = 0; i < progressRows.length; i += 50) {
        await db.insert(chapterProgress).values(progressRows.slice(i, i + 50)).onDuplicateKeyUpdate({ set: { userId: ctx.user.id } });
      }

      return { initialized: true, chaptersInitialized: progressRows.length };
    }),

  // Mark narration as read and potentially unlock next chapter
  markNarrationRead: protectedProcedure
    .input(z.object({ chapterId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      await db.update(chapterProgress).set({
        narrationRead: true,
        narrationReadAt: new Date(),
        status: "in_progress"
      }).where(
        and(eq(chapterProgress.userId, ctx.user.id), eq(chapterProgress.chapterId, input.chapterId))
      );

      return { success: true };
    }),

  // Update progress after assessment
  updateProgress: protectedProcedure
    .input(z.object({
      chapterId: z.string(),
      score: z.number(),
      maxScore: z.number(),
      passed: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const existing = await db.select().from(chapterProgress).where(
        and(eq(chapterProgress.userId, ctx.user.id), eq(chapterProgress.chapterId, input.chapterId))
      ).limit(1);

      const percentage = (input.score / input.maxScore) * 100;
      const currentBest = existing[0]?.bestScore || 0;
      const newBest = Math.max(currentBest, percentage);
      const newStatus = input.passed ? "completed" : "in_progress";

      await db.update(chapterProgress).set({
        bestScore: newBest,
        totalAttempts: (existing[0]?.totalAttempts || 0) + 1,
        lastAttemptAt: new Date(),
        status: newStatus,
        completedAt: input.passed ? new Date() : undefined
      }).where(
        and(eq(chapterProgress.userId, ctx.user.id), eq(chapterProgress.chapterId, input.chapterId))
      );

      // If passed, unlock next chapter
      if (input.passed) {
        const chapter = await db.select().from(chapters).where(eq(chapters.chapterId, input.chapterId)).limit(1);
        if (chapter.length) {
          const nextChapter = await db.select().from(chapters).where(
            and(
              eq(chapters.subjectId, chapter[0].subjectId),
              eq(chapters.curriculumId, chapter[0].curriculumId),
              eq(chapters.isActive, true)
            )
          ).orderBy(chapters.sortOrder);

          const currentIdx = nextChapter.findIndex(c => c.chapterId === input.chapterId);
          if (currentIdx >= 0 && currentIdx + 1 < nextChapter.length) {
            const next = nextChapter[currentIdx + 1];

            // Check if Class 12 unlock requires 80% Class 11 completion
            if (next.curriculumId === "ncert_class12" && chapter[0].curriculumId === "ncert_class11") {
              const class11Chapters = await db.select().from(chapters).where(
                and(eq(chapters.subjectId, chapter[0].subjectId), eq(chapters.curriculumId, "ncert_class11"), eq(chapters.isActive, true))
              );
              const class11Progress = await db.select().from(chapterProgress).where(
                and(
                  eq(chapterProgress.userId, ctx.user.id),
                  eq(chapterProgress.subjectId, chapter[0].subjectId),
                  eq(chapterProgress.curriculumId, "ncert_class11")
                )
              );
              const completedCount = class11Progress.filter(p => p.status === "completed").length;
              const requiredCount = Math.ceil(class11Chapters.length * 0.8);
              if (completedCount < requiredCount) {
                return { success: true, nextUnlocked: false, message: `Complete ${requiredCount - completedCount} more Class 11 chapters to unlock Class 12` };
              }
            }

            await db.update(chapterProgress).set({ status: "unlocked" }).where(
              and(eq(chapterProgress.userId, ctx.user.id), eq(chapterProgress.chapterId, next.chapterId))
            );
            return { success: true, nextUnlocked: true, nextChapterId: next.chapterId };
          }
        }
      }

      return { success: true, nextUnlocked: false };
    }),

  // Get study plan (24-month roadmap)
  getStudyPlan: publicProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const allChapters = await db.select({
        chapter: chapters,
        subject: subjects
      })
        .from(chapters)
        .leftJoin(subjects, eq(chapters.subjectId, subjects.subjectId))
        .where(eq(chapters.isActive, true))
        .orderBy(chapters.subjectId, chapters.sortOrder);

      // Build 24-month study plan
      // Class 11: Months 1-12, Class 12: Months 13-24
      const class11Chapters = allChapters.filter(r => r.chapter.curriculumId === "ncert_class11");
      const class12Chapters = allChapters.filter(r => r.chapter.curriculumId === "ncert_class12");

      const buildMonthlyPlan = (chapterList: typeof allChapters, startMonth: number) => {
        const plan: Record<number, typeof allChapters> = {};
        const totalChapters = chapterList.length;
        const chaptersPerMonth = Math.ceil(totalChapters / 12);

        chapterList.forEach((ch, idx) => {
          const month = startMonth + Math.floor(idx / chaptersPerMonth);
          if (!plan[month]) plan[month] = [];
          plan[month].push(ch);
        });
        return plan;
      };

      const class11Plan = buildMonthlyPlan(class11Chapters, 1);
      const class12Plan = buildMonthlyPlan(class12Chapters, 13);

      return {
        totalMonths: 24,
        class11: { months: 1, to: 12, plan: class11Plan },
        class12: { months: 13, to: 24, plan: class12Plan },
        dailySchedule: {
          physics: { hours: 2.5, description: "Mechanics, Electricity, Optics" },
          chemistry: { hours: 2, description: "Physical, Organic, Inorganic" },
          mathematics: { hours: 3, description: "Calculus, Algebra, Geometry" },
          revision: { hours: 1, description: "Previous day revision + practice problems" },
          total: 8.5
        }
      };
    }),

  // Get dashboard summary for a user
  getDashboardSummary: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const progress = await db.select().from(chapterProgress).where(eq(chapterProgress.userId, ctx.user.id));
      const allChapters = await db.select().from(chapters).where(eq(chapters.isActive, true));

      const totalChapters = allChapters.length;
      const completed = progress.filter(p => p.status === "completed").length;
      const inProgress = progress.filter(p => p.status === "in_progress").length;
      const unlocked = progress.filter(p => p.status === "unlocked").length;
      const locked = progress.filter(p => p.status === "locked").length;

      const subjectSummary: Record<string, { total: number; completed: number; inProgress: number; avgScore: number }> = {};
      for (const subjectId of ["physics", "chemistry", "mathematics"]) {
        const subjectChapters = allChapters.filter(c => c.subjectId === subjectId);
        const subjectProgress = progress.filter(p => p.subjectId === subjectId);
        const completedSubject = subjectProgress.filter(p => p.status === "completed");
        const avgScore = completedSubject.length > 0
          ? completedSubject.reduce((sum, p) => sum + (p.bestScore || 0), 0) / completedSubject.length
          : 0;

        subjectSummary[subjectId] = {
          total: subjectChapters.length,
          completed: completedSubject.length,
          inProgress: subjectProgress.filter(p => p.status === "in_progress").length,
          avgScore: Math.round(avgScore * 10) / 10
        };
      }

      const overallProgress = totalChapters > 0 ? Math.round((completed / totalChapters) * 100) : 0;

      return {
        totalChapters,
        completed,
        inProgress,
        unlocked,
        locked,
        overallProgress,
        subjectSummary,
        estimatedCompletionMonths: Math.ceil((totalChapters - completed) / 4) // ~4 chapters/month
      };
    }),

  // Search chapters
  search: publicProcedure
    .input(z.object({
      query: z.string().min(2),
      subjectId: z.string().optional()
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const allChapters = await db.select({
        chapter: chapters,
        subject: subjects
      })
        .from(chapters)
        .leftJoin(subjects, eq(chapters.subjectId, subjects.subjectId))
        .where(
          and(
            eq(chapters.isActive, true),
            ...(input.subjectId ? [eq(chapters.subjectId, input.subjectId)] : [])
          )
        );

      const q = input.query.toLowerCase();
      return allChapters.filter(row => {
        const ch = row.chapter;
        return (
          ch.title.toLowerCase().includes(q) ||
          (ch.tags as string[] || []).some((t: string) => t.toLowerCase().includes(q)) ||
          (ch.keyTopics as string[] || []).some((t: string) => t.toLowerCase().includes(q))
        );
      });
    })
});
