/**
 * JEE Score Prediction Engine Router
 * Calculates predicted JEE Main (out of 300) and JEE Advanced (out of 360)
 * scores from the student's chapter heatmap data.
 *
 * Algorithm:
 *  1. Fetch all heatmap entries for the student
 *  2. For each chapter, look up its JEE weightage (from chapterWeightage table)
 *  3. Compute a weighted average per subject
 *  4. Scale to JEE Main marks (Physics 100, Chemistry 100, Mathematics 100)
 *  5. Identify weak chapters with highest potential gain
 *  6. Store result in jeeScorePredictions table
 */
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  chapterHeatmap,
  jeeScorePredictions,
  chapters,
  examChapterWeightage as chapterWeightage,
} from "../../drizzle/schema";

// JEE Main: 100 marks per subject (Physics, Chemistry, Mathematics)
const JEE_MAIN_MAX_PER_SUBJECT = 100;
// JEE Advanced: 120 marks per subject
const JEE_ADVANCED_MAX_PER_SUBJECT = 120;

// Weightage multipliers for difficulty bands
const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  high: 1.4,
  medium: 1.0,
  low: 0.7,
};

async function computePrediction(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

  // Get all heatmap entries for this user
  const heatmapEntries = await db
    .select({
      chapterId: chapterHeatmap.chapterId,
      subjectId: chapterHeatmap.subjectId,
      heatmapScore: chapterHeatmap.heatmapScore,
      colorBand: chapterHeatmap.colorBand,
      attemptsCount: chapterHeatmap.attemptsCount,
    })
    .from(chapterHeatmap)
    .where(eq(chapterHeatmap.userId, userId));

  // Get all chapters with weightage info
  const allChapters = await db
    .select({
      chapterId: chapters.chapterId,
      subjectId: chapters.subjectId,
      title: chapters.title,
      importanceLevel: chapterWeightage.importanceLevel,
      avgQuestionsPerYear: chapterWeightage.avgQuestionsPerYear,
    })
    .from(chapters)
    .leftJoin(chapterWeightage, eq(chapters.chapterId, chapterWeightage.chapterId))
    .where(eq(chapters.isActive, true));

  const heatmapMap = new Map(heatmapEntries.map(e => [e.chapterId, e]));

  // Group chapters by subject
  const subjectChapters: Record<string, typeof allChapters> = {};
  allChapters.forEach(ch => {
    if (!subjectChapters[ch.subjectId]) subjectChapters[ch.subjectId] = [];
    subjectChapters[ch.subjectId].push(ch);
  });

  // Compute weighted score per subject
  const subjectScores: Record<string, { predicted: number; max: number; confidence: number }> = {};
  let totalDataPoints = 0;

  for (const [subjectId, subjectChs] of Object.entries(subjectChapters)) {
    let weightedSum = 0;
    let totalWeight = 0;
    let attemptedCount = 0;

    subjectChs.forEach(ch => {
      const entry = heatmapMap.get(ch.chapterId);
      const weightLevel = ch.importanceLevel || "medium";
      const diffMult = 1.0; // no separate difficulty field in schema

      // Weight = weightage level × difficulty multiplier
      const weightMultiplier =
        weightLevel === "high" ? 3 * diffMult :
        weightLevel === "medium" ? 2 * diffMult :
        1 * diffMult;

      const score = entry ? entry.heatmapScore : 0; // 0 for unstarted chapters
      weightedSum += score * weightMultiplier;
      totalWeight += weightMultiplier;
      if (entry && (entry.attemptsCount ?? 0) > 0) {
        attemptedCount++;
        totalDataPoints++;
      }
    });

    const rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0; // 0-100
    const predicted = Math.round((rawScore / 100) * JEE_MAIN_MAX_PER_SUBJECT);
    const confidence = subjectChs.length > 0
      ? Math.round((attemptedCount / subjectChs.length) * 100)
      : 0;

    subjectScores[subjectId] = {
      predicted,
      max: JEE_MAIN_MAX_PER_SUBJECT,
      confidence,
    };
  }

  // Total predicted JEE Main score
  const physicsScore = subjectScores["physics"]?.predicted ?? 0;
  const chemistryScore = subjectScores["chemistry"]?.predicted ?? 0;
  const mathScore = subjectScores["mathematics"]?.predicted ?? 0;
  const predictedMainScore = physicsScore + chemistryScore + mathScore;

  // JEE Advanced is harder — apply 0.85 scaling factor
  const predictedAdvancedScore = Math.round(
    (predictedMainScore / 300) * 360 * 0.85
  );

  // Optimistic (best case: +15%) and conservative (worst case: -15%)
  const optimisticScore = Math.min(300, Math.round(predictedMainScore * 1.15));
  const conservativeScore = Math.max(0, Math.round(predictedMainScore * 0.85));
  const confidencePercent = Math.round(
    Object.values(subjectScores).reduce((sum, s) => sum + s.confidence, 0) /
    Math.max(1, Object.keys(subjectScores).length)
  );

  // Rank prediction (rough approximation based on JEE Main 2024 data)
  // Top 1% ≈ 250+, Top 5% ≈ 200+, Top 10% ≈ 170+, Top 25% ≈ 130+
  let predictedRank = 1_200_000; // default: bottom quartile
  if (predictedMainScore >= 250) predictedRank = 5_000;
  else if (predictedMainScore >= 200) predictedRank = 25_000;
  else if (predictedMainScore >= 170) predictedRank = 60_000;
  else if (predictedMainScore >= 130) predictedRank = 150_000;
  else if (predictedMainScore >= 100) predictedRank = 400_000;
  else if (predictedMainScore >= 70) predictedRank = 700_000;

  // Identify weak chapters with highest potential gain
  const weakChapters = allChapters
    .filter(ch => {
      const entry = heatmapMap.get(ch.chapterId);
      return !entry || entry.heatmapScore < 60;
    })
    .map(ch => {
      const entry = heatmapMap.get(ch.chapterId);
      const currentScore = entry?.heatmapScore ?? 0;
      const weightLevel = ch.importanceLevel || "medium";
      const potentialGain = Math.round(
        ((80 - currentScore) / 100) * JEE_MAIN_MAX_PER_SUBJECT *
        (weightLevel === "high" ? 0.15 : weightLevel === "medium" ? 0.08 : 0.04)
      );
      return {
        chapterId: ch.chapterId,
        title: ch.title,
        subjectId: ch.subjectId,
        currentScore,
        potentialGain: Math.max(1, potentialGain),
      };
    })
    .sort((a, b) => b.potentialGain - a.potentialGain)
    .slice(0, 5);

  const recommendations = [
    weakChapters.length > 0
      ? `Focus on "${weakChapters[0].title}" — improving it to 80% could add ~${weakChapters[0].potentialGain} marks`
      : "Great progress! Keep revising all chapters to maintain your score.",
    confidencePercent < 50
      ? "Attempt more chapter assessments to improve prediction accuracy."
      : "Your prediction is based on solid data. Keep up the momentum!",
    predictedMainScore < 150
      ? "Prioritise high-weightage chapters in Physics and Mathematics."
      : predictedMainScore < 200
      ? "You're on track — focus on converting amber chapters to green."
      : "Excellent! Aim for perfect scores in your strongest chapters.",
  ];

  return {
    predictedScore: predictedMainScore,
    predictedAdvancedScore,
    optimisticScore,
    conservativeScore,
    confidencePercent,
    predictedRank,
    predictedRankRange: {
      min: Math.max(1, predictedRank - Math.round(predictedRank * 0.2)),
      max: predictedRank + Math.round(predictedRank * 0.3),
    },
    subjectScores,
    weakChapters,
    recommendations,
    dataPointsUsed: totalDataPoints,
  };
}

export const scorePredictionRouter = router({
  /**
   * Get the current user's JEE score prediction.
   * Returns cached result if available and < 24h old, else recomputes.
   */
  getMyPrediction: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Check for recent cached prediction (< 24h)
      const [cached] = await db
        .select()
        .from(jeeScorePredictions)
        .where(eq(jeeScorePredictions.userId, ctx.user.id))
        .orderBy(desc(jeeScorePredictions.updatedAt))
        .limit(1);

      const cacheAge = cached
        ? Date.now() - new Date(cached.updatedAt).getTime()
        : Infinity;
      const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

      if (cached && cacheAge < CACHE_TTL_MS) {
        return cached;
      }

      // Recompute
      const prediction = await computePrediction(ctx.user.id);

      if (cached) {
        await db.update(jeeScorePredictions)
          .set({
            predictedScore: prediction.predictedScore,
        optimisticScore: prediction.optimisticScore,
            conservativeScore: prediction.conservativeScore,
            confidencePercent: prediction.confidencePercent,
            predictedRank: prediction.predictedRank,
            predictedRankRange: prediction.predictedRankRange,
            subjectScores: prediction.subjectScores,
            weakChapters: prediction.weakChapters,
            recommendations: prediction.recommendations,
            dataPointsUsed: prediction.dataPointsUsed,
            updatedAt: new Date(),
          })
          .where(eq(jeeScorePredictions.id, cached.id));
        return { ...cached, ...prediction, updatedAt: new Date() };
      } else {
        const [inserted] = await db.insert(jeeScorePredictions).values({
          userId: ctx.user.id,
          examId: "jee_main",
          maxPossibleScore: 300,
          predictedScore: prediction.predictedScore,
          optimisticScore: prediction.optimisticScore,
          conservativeScore: prediction.conservativeScore,
          confidencePercent: prediction.confidencePercent,
          predictedRank: prediction.predictedRank,
          predictedRankRange: prediction.predictedRankRange,
          subjectScores: prediction.subjectScores,
          weakChapters: prediction.weakChapters,
          recommendations: prediction.recommendations,
          dataPointsUsed: prediction.dataPointsUsed,
        });
        return { id: (inserted as any).insertId, ...prediction };
      }
    }),

  /**
   * Force-recompute the prediction (ignores cache).
   */
  recalculate: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const prediction = await computePrediction(ctx.user.id);

      const [existing] = await db
        .select()
        .from(jeeScorePredictions)
        .where(eq(jeeScorePredictions.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db.update(jeeScorePredictions)
          .set({
            predictedScore: prediction.predictedScore,
            optimisticScore: prediction.optimisticScore,
            conservativeScore: prediction.conservativeScore,
            confidencePercent: prediction.confidencePercent,
            predictedRank: prediction.predictedRank,
            predictedRankRange: prediction.predictedRankRange,
            subjectScores: prediction.subjectScores,
            weakChapters: prediction.weakChapters,
            recommendations: prediction.recommendations,
            dataPointsUsed: prediction.dataPointsUsed,
            updatedAt: new Date(),
          })
          .where(eq(jeeScorePredictions.id, existing.id));
      } else {
        await db.insert(jeeScorePredictions).values({
          userId: ctx.user.id,
          examId: "jee_main",
          maxPossibleScore: 300,
          predictedScore: prediction.predictedScore,
          optimisticScore: prediction.optimisticScore,
          conservativeScore: prediction.conservativeScore,
          confidencePercent: prediction.confidencePercent,
          predictedRank: prediction.predictedRank,
          predictedRankRange: prediction.predictedRankRange,
          subjectScores: prediction.subjectScores,
          weakChapters: prediction.weakChapters,
          recommendations: prediction.recommendations,
          dataPointsUsed: prediction.dataPointsUsed,
        });
      }

      return prediction;
    }),
});
