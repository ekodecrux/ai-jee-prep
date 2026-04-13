/**
 * Chapter Performance Heatmap Router
 * Manages per-student, per-chapter heatmap scores.
 * Updated after every assessment attempt.
 */
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  chapterHeatmap,
  chapters,
  subjects,
} from "../../drizzle/schema";

type ColorBand = "green" | "amber" | "red" | "unstarted";

function scoreToColorBand(score: number, attempts: number): ColorBand {
  if (attempts === 0) return "unstarted";
  if (score >= 80) return "green";
  if (score >= 60) return "amber";
  return "red";
}

export const heatmapRouter = router({
  /**
   * Get the full 80-chapter heatmap for the current user.
   * Returns all chapters with their heatmap entry (or default unstarted).
   */
  getMyHeatmap: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Get all active chapters with subject info
      const allChapters = await db
        .select({
          chapterId: chapters.chapterId,
          title: chapters.title,
          subjectId: chapters.subjectId,
          subjectName: subjects.name,
          subjectColor: subjects.colorHex,
          sortOrder: chapters.sortOrder,
          curriculumId: chapters.curriculumId,
        })
        .from(chapters)
        .leftJoin(subjects, eq(chapters.subjectId, subjects.subjectId))
        .where(eq(chapters.isActive, true))
        .orderBy(chapters.subjectId, chapters.sortOrder);

      // Get existing heatmap entries for this user
      const heatmapEntries = await db
        .select()
        .from(chapterHeatmap)
        .where(eq(chapterHeatmap.userId, ctx.user.id));

      const heatmapMap = new Map(heatmapEntries.map(e => [e.chapterId, e]));

      // Merge: every chapter gets a heatmap entry (real or default)
      const merged = allChapters.map(ch => {
        const entry = heatmapMap.get(ch.chapterId);
        return {
          chapterId: ch.chapterId,
          title: ch.title,
          subjectId: ch.subjectId,
          subjectName: ch.subjectName || ch.subjectId,
          subjectColor: ch.subjectColor || "#6366f1",
          curriculumId: ch.curriculumId,
          sortOrder: ch.sortOrder,
          heatmapScore: entry?.heatmapScore ?? 0,
          colorBand: (entry?.colorBand ?? "unstarted") as ColorBand,
          attemptsCount: entry?.attemptsCount ?? 0,
          assessmentAvgScore: entry?.assessmentAvgScore ?? 0,
          trendDirection: entry?.trendDirection ?? "new",
          lastUpdated: entry?.lastUpdated ?? null,
        };
      });

      // Summary stats
      const total = merged.length;
      const green = merged.filter(c => c.colorBand === "green").length;
      const amber = merged.filter(c => c.colorBand === "amber").length;
      const red = merged.filter(c => c.colorBand === "red").length;
      const unstarted = merged.filter(c => c.colorBand === "unstarted").length;
      const overallScore = total > 0
        ? Math.round(merged.reduce((sum, c) => sum + c.heatmapScore, 0) / total)
        : 0;

      return {
        chapters: merged,
        summary: { total, green, amber, red, unstarted, overallScore },
      };
    }),

  /**
   * Update heatmap for a single chapter after an assessment attempt.
   * Called automatically by the assessments router on attempt submission.
   */
  updateAfterAttempt: protectedProcedure
    .input(z.object({
      chapterId: z.string(),
      subjectId: z.string(),
      newScore: z.number().min(0).max(100),
      attemptType: z.enum(["chapter_test", "practice", "mock"]).default("chapter_test"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [existing] = await db
        .select()
        .from(chapterHeatmap)
        .where(and(
          eq(chapterHeatmap.userId, ctx.user.id),
          eq(chapterHeatmap.chapterId, input.chapterId),
        ))
        .limit(1);

      const newAttempts = (existing?.attemptsCount ?? 0) + 1;
      // Rolling average: weight new score equally with historical average
      const prevAvg = existing?.assessmentAvgScore ?? 0;
      const newAvg = existing
        ? Math.round((prevAvg * (newAttempts - 1) + input.newScore) / newAttempts)
        : input.newScore;

      const newColorBand = scoreToColorBand(newAvg, newAttempts);
      const prevColorBand = (existing?.colorBand ?? "unstarted") as ColorBand;

      let trendDirection: "improving" | "stable" | "declining" | "new" = "new";
      if (existing) {
        if (newAvg > prevAvg + 5) trendDirection = "improving";
        else if (newAvg < prevAvg - 5) trendDirection = "declining";
        else trendDirection = "stable";
      }

      if (existing) {
        await db.update(chapterHeatmap)
          .set({
            heatmapScore: newAvg,
            colorBand: newColorBand,
            previousColorBand: prevColorBand,
            assessmentAvgScore: newAvg,
            attemptsCount: newAttempts,
            trendDirection,
            lastUpdated: new Date(),
          })
          .where(eq(chapterHeatmap.id, existing.id));
      } else {
        await db.insert(chapterHeatmap).values({
          userId: ctx.user.id,
          chapterId: input.chapterId,
          subjectId: input.subjectId,
          heatmapScore: input.newScore,
          colorBand: newColorBand,
          assessmentAvgScore: input.newScore,
          attemptsCount: 1,
          trendDirection: "new",
          lastUpdated: new Date(),
          createdAt: new Date(),
        });
      }

      return {
        chapterId: input.chapterId,
        newScore: newAvg,
        colorBand: newColorBand,
        trendDirection,
        attemptsCount: newAttempts,
      };
    }),

  /**
   * Get the weakest N chapters for the current user (for study plan and prediction).
   */
  getWeakChapters: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const weak = await db
        .select({
          chapterId: chapterHeatmap.chapterId,
          subjectId: chapterHeatmap.subjectId,
          heatmapScore: chapterHeatmap.heatmapScore,
          colorBand: chapterHeatmap.colorBand,
          attemptsCount: chapterHeatmap.attemptsCount,
          title: chapters.title,
        })
        .from(chapterHeatmap)
        .leftJoin(chapters, eq(chapterHeatmap.chapterId, chapters.chapterId))
        .where(and(
          eq(chapterHeatmap.userId, ctx.user.id),
          eq(chapterHeatmap.colorBand, "red"),
        ))
        .orderBy(chapterHeatmap.heatmapScore)
        .limit(input.limit);

      return weak;
    }),
});

// ─── Exported helper for use in other routers ─────────────────────────────────
/**
 * Standalone function to update a student's chapter heatmap after an assessment.
 * Called from assessmentsRouter.submitAttempt so the feedback loop is instant.
 */
export async function updateHeatmapAfterAttempt(params: {
  userId: number;
  chapterId: string;
  subjectId: string;
  newScore: number;
  attemptType?: "chapter_test" | "practice" | "mock";
}): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const { userId, chapterId, subjectId, newScore } = params;

  const [existing] = await db
    .select()
    .from(chapterHeatmap)
    .where(and(eq(chapterHeatmap.userId, userId), eq(chapterHeatmap.chapterId, chapterId)))
    .limit(1);

  const newAttempts = (existing?.attemptsCount ?? 0) + 1;
  const prevAvg = existing?.assessmentAvgScore ?? 0;
  const newAvg = existing
    ? Math.round((prevAvg * (newAttempts - 1) + newScore) / newAttempts)
    : newScore;

  const newColorBand: ColorBand = newAttempts === 0
    ? "unstarted"
    : newAvg >= 80 ? "green" : newAvg >= 60 ? "amber" : "red";

  const prevColorBand = (existing?.colorBand ?? "unstarted") as ColorBand;
  let trendDirection: "improving" | "stable" | "declining" | "new" = "new";
  if (existing) {
    if (newAvg > prevAvg + 5) trendDirection = "improving";
    else if (newAvg < prevAvg - 5) trendDirection = "declining";
    else trendDirection = "stable";
  }

  if (existing) {
    await db.update(chapterHeatmap)
      .set({
        heatmapScore: newAvg,
        colorBand: newColorBand,
        previousColorBand: prevColorBand,
        assessmentAvgScore: newAvg,
        attemptsCount: newAttempts,
        trendDirection,
        lastUpdated: new Date(),
      })
      .where(eq(chapterHeatmap.id, existing.id));
  } else {
    await db.insert(chapterHeatmap).values({
      userId,
      chapterId,
      subjectId,
      heatmapScore: newScore,
      colorBand: newColorBand,
      assessmentAvgScore: newScore,
      attemptsCount: 1,
      trendDirection: "new",
      lastUpdated: new Date(),
      createdAt: new Date(),
    });
  }
}
