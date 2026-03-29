import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  chapterHeatmap, jeeScorePredictions, weeklyPerformance,
  chapters, assessmentAttempts, chapterProgress,
  examChapterWeightage, subjects,
} from "../../drizzle/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";

export const analyticsRouter = router({
  // ─── Chapter Heatmap ───────────────────────────────────────────────────────
  getHeatmap: protectedProcedure
    .input(z.object({ subjectId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      // Get all chapters
      const allChapters = await db.select({
        chapterId: chapters.chapterId,
        title: chapters.title,
        subjectId: chapters.subjectId,
        curriculumId: chapters.curriculumId,
        chapterNo: chapters.chapterNo,
        sortOrder: chapters.sortOrder,
      }).from(chapters)
        .where(input.subjectId ? eq(chapters.subjectId, input.subjectId) : sql`1=1`)
        .orderBy(chapters.subjectId, chapters.sortOrder);

      // Get heatmap data for user
      const heatmapData = await db.select()
        .from(chapterHeatmap)
        .where(eq(chapterHeatmap.userId, ctx.user.id));

      const heatmapMap = new Map(heatmapData.map(h => [h.chapterId, h]));

      // Merge
      const result = allChapters.map(ch => {
        const hm = heatmapMap.get(ch.chapterId);
        return {
          ...ch,
          heatmapScore: hm?.heatmapScore || 0,
          colorBand: hm?.colorBand || "unstarted",
          assessmentAvgScore: hm?.assessmentAvgScore || 0,
          pastPaperAvgScore: hm?.pastPaperAvgScore || 0,
          mockTestAvgScore: hm?.mockTestAvgScore || 0,
          attemptsCount: hm?.attemptsCount || 0,
          trendDirection: hm?.trendDirection || "new",
          previousColorBand: hm?.previousColorBand || "unstarted",
          lastUpdated: hm?.lastUpdated || null,
        };
      });

      // Summary stats
      const green = result.filter(r => r.colorBand === "green").length;
      const amber = result.filter(r => r.colorBand === "amber").length;
      const red = result.filter(r => r.colorBand === "red").length;
      const unstarted = result.filter(r => r.colorBand === "unstarted").length;

      return {
        chapters: result,
        summary: { green, amber, red, unstarted, total: result.length },
      };
    }),

  // Update heatmap after an assessment attempt
  updateHeatmap: protectedProcedure
    .input(z.object({
      chapterId: z.string(),
      subjectId: z.string(),
      scoreType: z.enum(["assessment", "past_paper", "mock_test"]),
      score: z.number().min(0).max(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const [existing] = await db.select()
        .from(chapterHeatmap)
        .where(and(
          eq(chapterHeatmap.userId, ctx.user.id),
          eq(chapterHeatmap.chapterId, input.chapterId),
        ));

      const prevColorBand = existing?.colorBand || "unstarted";
      const prevAssessment = existing?.assessmentAvgScore || 0;
      const prevPastPaper = existing?.pastPaperAvgScore || 0;
      const prevMockTest = existing?.mockTestAvgScore || 0;
      const prevAttempts = existing?.attemptsCount || 0;

      // Update the relevant score with exponential moving average
      const alpha = 0.4; // weight for new score
      let newAssessment = prevAssessment;
      let newPastPaper = prevPastPaper;
      let newMockTest = prevMockTest;

      if (input.scoreType === "assessment") {
        newAssessment = prevAttempts === 0 ? input.score : prevAssessment * (1 - alpha) + input.score * alpha;
      } else if (input.scoreType === "past_paper") {
        newPastPaper = prevAttempts === 0 ? input.score : prevPastPaper * (1 - alpha) + input.score * alpha;
      } else {
        newMockTest = prevAttempts === 0 ? input.score : prevMockTest * (1 - alpha) + input.score * alpha;
      }

      // Composite heatmap score: assessment 50%, past paper 30%, mock 20%
      const heatmapScore = newAssessment * 0.5 + newPastPaper * 0.3 + newMockTest * 0.2;

      // Color band thresholds
      let colorBand: "green" | "amber" | "red" | "unstarted" = "red";
      if (heatmapScore >= 80) colorBand = "green";
      else if (heatmapScore >= 60) colorBand = "amber";
      else colorBand = "red";

      // Trend
      const bandOrder = { unstarted: 0, red: 1, amber: 2, green: 3 };
      const prevOrder = bandOrder[prevColorBand];
      const newOrder = bandOrder[colorBand];
      let trendDirection: "improving" | "stable" | "declining" | "new" = "stable";
      if (prevColorBand === "unstarted") trendDirection = "new";
      else if (newOrder > prevOrder) trendDirection = "improving";
      else if (newOrder < prevOrder) trendDirection = "declining";

      if (existing) {
        await db.update(chapterHeatmap)
          .set({
            heatmapScore,
            colorBand,
            assessmentAvgScore: newAssessment,
            pastPaperAvgScore: newPastPaper,
            mockTestAvgScore: newMockTest,
            attemptsCount: prevAttempts + 1,
            previousColorBand: prevColorBand,
            trendDirection,
            lastUpdated: new Date(),
          })
          .where(and(
            eq(chapterHeatmap.userId, ctx.user.id),
            eq(chapterHeatmap.chapterId, input.chapterId),
          ));
      } else {
        await db.insert(chapterHeatmap).values({
          userId: ctx.user.id,
          chapterId: input.chapterId,
          subjectId: input.subjectId,
          heatmapScore,
          colorBand,
          assessmentAvgScore: newAssessment,
          pastPaperAvgScore: newPastPaper,
          mockTestAvgScore: newMockTest,
          attemptsCount: 1,
          previousColorBand: "unstarted",
          trendDirection: "new",
          lastUpdated: new Date(),
        });
      }

      return { success: true, heatmapScore, colorBand, trendDirection };
    }),

  // ─── JEE Score Prediction ─────────────────────────────────────────────────
  getPrediction: protectedProcedure
    .input(z.object({ examId: z.string().default("jee_main") }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const [prediction] = await db.select()
        .from(jeeScorePredictions)
        .where(and(
          eq(jeeScorePredictions.userId, ctx.user.id),
          eq(jeeScorePredictions.examId, input.examId),
        ))
        .orderBy(desc(jeeScorePredictions.updatedAt))
        .limit(1);

      return prediction || null;
    }),

  generatePrediction: protectedProcedure
    .input(z.object({ examId: z.string().default("jee_main") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      // Gather heatmap data
      const heatmapData = await db.select()
        .from(chapterHeatmap)
        .where(eq(chapterHeatmap.userId, ctx.user.id));

      // Get chapter weightage
      const weightageData = await db.select({
        chapterId: examChapterWeightage.chapterId,
        importanceLevel: examChapterWeightage.importanceLevel,
        avgQuestionsPerYear: examChapterWeightage.avgQuestionsPerYear,
      }).from(examChapterWeightage)
        .where(eq(examChapterWeightage.examId, input.examId));

      const weightageMap = new Map(weightageData.map(w => [w.chapterId, w]));

      // Get total chapters
      const allChapters = await db.select({
        chapterId: chapters.chapterId,
        title: chapters.title,
        subjectId: chapters.subjectId,
      }).from(chapters);

      const heatmapMap = new Map(heatmapData.map(h => [h.chapterId, h]));

      // Calculate predicted score
      const maxScore = input.examId === "jee_advanced" ? 360 : 300;
      const importanceWeights = { critical: 4, high: 3, medium: 2, low: 1 };

      let totalWeight = 0;
      let weightedScore = 0;
      const subjectScores: Record<string, { predicted: number; max: number; confidence: number; totalWeight: number; weightedScore: number }> = {
        physics: { predicted: 0, max: input.examId === "jee_advanced" ? 120 : 100, confidence: 0, totalWeight: 0, weightedScore: 0 },
        chemistry: { predicted: 0, max: input.examId === "jee_advanced" ? 120 : 100, confidence: 0, totalWeight: 0, weightedScore: 0 },
        mathematics: { predicted: 0, max: input.examId === "jee_advanced" ? 120 : 100, confidence: 0, totalWeight: 0, weightedScore: 0 },
      };

      const weakChapters: Array<{ chapterId: string; title: string; currentScore: number; potentialGain: number }> = [];

      for (const ch of allChapters) {
        const hm = heatmapMap.get(ch.chapterId);
        const wt = weightageMap.get(ch.chapterId);
        const importance = wt?.importanceLevel || "medium";
        const weight = importanceWeights[importance] || 2;
        const score = hm?.heatmapScore || 0;

        totalWeight += weight;
        weightedScore += score * weight;

        const subj = subjectScores[ch.subjectId];
        if (subj) {
          subj.totalWeight += weight;
          subj.weightedScore += score * weight;
        }

        // Flag weak chapters
        if (score < 60 && (importance === "critical" || importance === "high")) {
          const potentialGain = ((80 - score) / 100) * weight * (maxScore / totalWeight || 1);
          weakChapters.push({
            chapterId: ch.chapterId,
            title: ch.title,
            currentScore: Math.round(score),
            potentialGain: Math.round(potentialGain),
          });
        }
      }

      // Overall predicted score
      const overallPercent = totalWeight > 0 ? weightedScore / totalWeight : 0;
      const predictedScore = Math.round((overallPercent / 100) * maxScore);

      // Subject scores
      for (const [subjectId, subj] of Object.entries(subjectScores)) {
        const pct = subj.totalWeight > 0 ? subj.weightedScore / subj.totalWeight : 0;
        subj.predicted = Math.round((pct / 100) * subj.max);
        subj.confidence = Math.min(100, Math.round((heatmapData.filter(h => h.subjectId === subjectId).length / 25) * 100));
      }

      // Confidence based on data points
      const dataPoints = heatmapData.length;
      const confidencePercent = Math.min(95, Math.round((dataPoints / 80) * 100));

      // Optimistic/conservative
      const optimisticScore = Math.min(maxScore, Math.round(predictedScore * 1.15));
      const conservativeScore = Math.round(predictedScore * 0.85);

      // Rank prediction (rough estimate based on JEE statistics)
      const rankEstimate = predictedScore > 250 ? Math.round(50000 * (1 - (predictedScore - 250) / 50))
        : predictedScore > 200 ? Math.round(50000 + 100000 * (1 - (predictedScore - 200) / 50))
        : predictedScore > 150 ? Math.round(150000 + 200000 * (1 - (predictedScore - 150) / 50))
        : 500000;

      const recommendations = [
        ...weakChapters.slice(0, 3).map(w => `Improve "${w.title}" — currently at ${w.currentScore}%, potential +${w.potentialGain} marks`),
        dataPoints < 20 ? "Complete more chapter assessments to improve prediction accuracy" : null,
        overallPercent < 60 ? "Focus on high-weightage chapters first for maximum score gain" : null,
      ].filter(Boolean) as string[];

      // Get existing prediction for score history
      const [existingPred] = await db.select()
        .from(jeeScorePredictions)
        .where(and(
          eq(jeeScorePredictions.userId, ctx.user.id),
          eq(jeeScorePredictions.examId, input.examId),
        ));

      const today = new Date().toISOString().split("T")[0];
      const prevHistory = (existingPred?.scoreHistory as Array<{ date: string; score: number }>) || [];
      const scoreHistory = [...prevHistory.slice(-11), { date: today, score: predictedScore }];

      const predictionData = {
        userId: ctx.user.id,
        examId: input.examId,
        predictedScore,
        maxPossibleScore: maxScore,
        optimisticScore,
        conservativeScore,
        confidencePercent,
        predictedRank: rankEstimate,
        predictedRankRange: { min: Math.round(rankEstimate * 0.7), max: Math.round(rankEstimate * 1.3) },
        subjectScores: {
          physics: { predicted: subjectScores.physics.predicted, max: subjectScores.physics.max, confidence: subjectScores.physics.confidence },
          chemistry: { predicted: subjectScores.chemistry.predicted, max: subjectScores.chemistry.max, confidence: subjectScores.chemistry.confidence },
          mathematics: { predicted: subjectScores.mathematics.predicted, max: subjectScores.mathematics.max, confidence: subjectScores.mathematics.confidence },
        },
        weakChapters: weakChapters.slice(0, 5),
        recommendations,
        scoreHistory,
        dataPointsUsed: dataPoints,
        generatedAt: new Date(),
        updatedAt: new Date(),
      };

      if (existingPred) {
        await db.update(jeeScorePredictions)
          .set(predictionData)
          .where(eq(jeeScorePredictions.id, existingPred.id));
      } else {
        await db.insert(jeeScorePredictions).values(predictionData);
      }

      return predictionData;
    }),

  // ─── Weekly Performance ───────────────────────────────────────────────────
  getWeeklyPerformance: protectedProcedure
    .input(z.object({ weeks: z.number().min(1).max(52).default(12) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      return await db.select()
        .from(weeklyPerformance)
        .where(eq(weeklyPerformance.userId, ctx.user.id))
        .orderBy(desc(weeklyPerformance.weekStartDate))
        .limit(input.weeks);
    }),

  // Record weekly performance snapshot
  recordWeeklySnapshot: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    const weekStartDate = monday.toISOString().split("T")[0];

    // Get this week's attempts
    const weekStart = new Date(weekStartDate);
    const attempts = await db.select({
      score: assessmentAttempts.percentage,
      chapterId: assessmentAttempts.chapterId,
      examId: assessmentAttempts.examId,
    }).from(assessmentAttempts)
      .where(and(
        eq(assessmentAttempts.userId, ctx.user.id),
        gte(assessmentAttempts.startedAt, weekStart),
      ));

    const avgScore = attempts.length > 0
      ? attempts.reduce((s, a) => s + (a.score || 0), 0) / attempts.length
      : 0;

    // Get heatmap summary
    const heatmap = await db.select({ colorBand: chapterHeatmap.colorBand, subjectId: chapterHeatmap.subjectId, heatmapScore: chapterHeatmap.heatmapScore })
      .from(chapterHeatmap)
      .where(eq(chapterHeatmap.userId, ctx.user.id));

    const green = heatmap.filter(h => h.colorBand === "green").length;
    const amber = heatmap.filter(h => h.colorBand === "amber").length;
    const red = heatmap.filter(h => h.colorBand === "red").length;

    const physicsScores = heatmap.filter(h => h.subjectId === "physics");
    const chemScores = heatmap.filter(h => h.subjectId === "chemistry");
    const mathScores = heatmap.filter(h => h.subjectId === "mathematics");

    const avg = (arr: typeof heatmap) => arr.length > 0 ? arr.reduce((s, h) => s + h.heatmapScore, 0) / arr.length : 0;

    // Get prediction
    const [pred] = await db.select()
      .from(jeeScorePredictions)
      .where(eq(jeeScorePredictions.userId, ctx.user.id))
      .orderBy(desc(jeeScorePredictions.updatedAt))
      .limit(1);

    const weekNum = Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Upsert weekly performance
    const existing = await db.select()
      .from(weeklyPerformance)
      .where(and(
        eq(weeklyPerformance.userId, ctx.user.id),
        eq(weeklyPerformance.weekStartDate, weekStartDate),
      ));

    const perfData = {
      userId: ctx.user.id,
      weekStartDate,
      weekNumber: weekNum,
      year: now.getFullYear(),
      avgScore,
      assessmentsTaken: attempts.length,
      greenChapters: green,
      amberChapters: amber,
      redChapters: red,
      physicsAvg: avg(physicsScores),
      chemistryAvg: avg(chemScores),
      mathematicsAvg: avg(mathScores),
      predictedJeeMainScore: pred?.predictedScore || null,
    };

    if (existing.length > 0) {
      await db.update(weeklyPerformance).set(perfData).where(eq(weeklyPerformance.id, existing[0].id));
    } else {
      await db.insert(weeklyPerformance).values(perfData);
    }

    return { success: true, weekStartDate, avgScore };
  }),

  // ─── Full Performance Dashboard Data ─────────────────────────────────────
  getPerformanceDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

    // Heatmap summary
    const heatmap = await db.select()
      .from(chapterHeatmap)
      .where(eq(chapterHeatmap.userId, ctx.user.id));

    const green = heatmap.filter(h => h.colorBand === "green").length;
    const amber = heatmap.filter(h => h.colorBand === "amber").length;
    const red = heatmap.filter(h => h.colorBand === "red").length;
    const unstarted = 80 - heatmap.length;

    // JEE readiness score (0-100)
    const jeeReadiness = Math.round((green * 100 + amber * 60 + red * 20) / 80);

    // Predictions
    const predictions = await db.select()
      .from(jeeScorePredictions)
      .where(eq(jeeScorePredictions.userId, ctx.user.id))
      .orderBy(desc(jeeScorePredictions.updatedAt));

    const mainPred = predictions.find(p => p.examId === "jee_main") || null;
    const advPred = predictions.find(p => p.examId === "jee_advanced") || null;

    // Weekly performance (last 8 weeks)
    const weeklyData = await db.select()
      .from(weeklyPerformance)
      .where(eq(weeklyPerformance.userId, ctx.user.id))
      .orderBy(desc(weeklyPerformance.weekStartDate))
      .limit(8);

    // Recent attempts
    const recentAttempts = await db.select()
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.userId, ctx.user.id))
      .orderBy(desc(assessmentAttempts.startedAt))
      .limit(10);

    // Chapter progress
    const progress = await db.select()
      .from(chapterProgress)
      .where(eq(chapterProgress.userId, ctx.user.id));

    const completedChapters = progress.filter(p => p.status === "completed").length;

    // Subject-wise heatmap
    const physicsHeatmap = heatmap.filter(h => h.subjectId === "physics");
    const chemHeatmap = heatmap.filter(h => h.subjectId === "chemistry");
    const mathHeatmap = heatmap.filter(h => h.subjectId === "mathematics");

    const subjectAvg = (arr: typeof heatmap) =>
      arr.length > 0 ? Math.round(arr.reduce((s, h) => s + h.heatmapScore, 0) / arr.length) : 0;

    // Top strong/weak chapters
    const sortedChapters = [...heatmap].sort((a, b) => b.heatmapScore - a.heatmapScore);
    const strongestChapters = sortedChapters.slice(0, 5);
    const weakestChapters = sortedChapters.filter(h => h.heatmapScore > 0).slice(-5).reverse();

    return {
      jeeReadiness,
      heatmapSummary: { green, amber, red, unstarted, total: 80 },
      completedChapters,
      subjectReadiness: {
        physics: subjectAvg(physicsHeatmap),
        chemistry: subjectAvg(chemHeatmap),
        mathematics: subjectAvg(mathHeatmap),
      },
      predictions: { main: mainPred, advanced: advPred },
      weeklyTrend: weeklyData.reverse(),
      recentAttempts,
      strongestChapters,
      weakestChapters,
    };
  }),
});
