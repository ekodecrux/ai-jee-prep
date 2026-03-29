import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import {
  chapters, narrationScripts, questions, assessments,
  users, chapterHeatmap, jeeScorePredictions,
  proctoringReports, proctoringEvents, apiKeys,
  mockTestSchedule, weeklyPerformance, assessmentAttempts,
} from "../../drizzle/schema";
import { eq, and, desc, sql, like, isNull } from "drizzle-orm";
import crypto from "crypto";

// Admin-only guard middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ─── Dashboard Stats ──────────────────────────────────────────────────────
  getDashboardStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

    const [totalChapters] = await db.select({ count: sql<number>`count(*)` }).from(chapters);
    const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [totalNarrations] = await db.select({ count: sql<number>`count(*)` }).from(narrationScripts);
    const [totalQuestions] = await db.select({ count: sql<number>`count(*)` }).from(questions);
    const [totalAssessments] = await db.select({ count: sql<number>`count(*)` }).from(assessments);
    const [pendingReviews] = await db.select({ count: sql<number>`count(*)` })
      .from(proctoringReports)
      .where(eq(proctoringReports.reviewStatus, "pending"));

    return {
      totalChapters: totalChapters?.count || 0,
      totalUsers: totalUsers?.count || 0,
      totalNarrations: totalNarrations?.count || 0,
      totalQuestions: totalQuestions?.count || 0,
      totalAssessments: totalAssessments?.count || 0,
      pendingProctoringReviews: pendingReviews?.count || 0,
      contentCoverage: Math.round(((totalNarrations?.count || 0) / Math.max(totalChapters?.count || 1, 1)) * 100),
    };
  }),

  // ─── Content Generation Status ────────────────────────────────────────────
  getContentStatus: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

    const allChapters = await db.select({
      chapterId: chapters.chapterId,
      title: chapters.title,
      subjectId: chapters.subjectId,
      curriculumId: chapters.curriculumId,
    }).from(chapters).orderBy(chapters.subjectId, chapters.sortOrder);

    const allNarrations = await db.select({ chapterId: narrationScripts.chapterId })
      .from(narrationScripts);
    const narrationSet = new Set(allNarrations.map(n => n.chapterId));

    const questionCounts = await db.select({
      chapterId: questions.chapterId,
      count: sql<number>`count(*)`,
    }).from(questions).groupBy(questions.chapterId);
    const questionMap = new Map(questionCounts.map(q => [q.chapterId, q.count]));

    const assessmentCounts = await db.select({
      chapterId: assessments.chapterId,
      count: sql<number>`count(*)`,
    }).from(assessments).where(sql`${assessments.chapterId} IS NOT NULL`).groupBy(assessments.chapterId);
    const assessmentMap = new Map(assessmentCounts.map(a => [a.chapterId, a.count]));

    return allChapters.map(ch => ({
      ...ch,
      hasNarration: narrationSet.has(ch.chapterId),
      questionCount: questionMap.get(ch.chapterId) || 0,
      assessmentCount: assessmentMap.get(ch.chapterId) || 0,
      isComplete: narrationSet.has(ch.chapterId) &&
        (questionMap.get(ch.chapterId) || 0) >= 10 &&
        (assessmentMap.get(ch.chapterId) || 0) >= 1,
    }));
  }),

  // ─── Bulk Generate Content for a Chapter ─────────────────────────────────
  bulkGenerateChapter: adminProcedure
    .input(z.object({ chapterId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const [chapter] = await db.select().from(chapters).where(eq(chapters.chapterId, input.chapterId));
      if (!chapter) throw new TRPCError({ code: "NOT_FOUND", message: "Chapter not found" });

      const results = { narration: false, questions: 0, assessments: 0 };

      // Generate narration if missing
      const existing = await db.select().from(narrationScripts).where(eq(narrationScripts.chapterId, input.chapterId));
      if (existing.length === 0) {
        try {
          const prompt = `You are an expert JEE teacher. Generate a comprehensive 3000+ word teacher narration script for the chapter "${chapter.title}" (${chapter.subjectId}, ${chapter.curriculumId}).

Return JSON with these exact fields:
{
  "introduction": "500+ word introduction covering why this chapter matters for JEE",
  "conceptualExplanation": "800+ word detailed conceptual explanation with all key concepts",
  "formulasAndDerivations": "600+ word section covering all important formulas with derivations",
  "solvedExamples": "500+ word section with 3-4 solved JEE-level examples",
  "advancedConcepts": "300+ word section on advanced JEE Advanced level concepts",
  "examSpecificTips": "200+ word JEE-specific tips and tricks",
  "commonMistakes": "200+ word section on common mistakes students make",
  "quickRevisionSummary": "200+ word quick revision summary",
  "mnemonics": "100+ word mnemonics and memory tricks"
}`;

          const response = await invokeLLM({
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_schema", json_schema: {
              name: "narration", strict: true,
              schema: {
                type: "object",
                properties: {
                  introduction: { type: "string" },
                  conceptualExplanation: { type: "string" },
                  formulasAndDerivations: { type: "string" },
                  solvedExamples: { type: "string" },
                  advancedConcepts: { type: "string" },
                  examSpecificTips: { type: "string" },
                  commonMistakes: { type: "string" },
                  quickRevisionSummary: { type: "string" },
                  mnemonics: { type: "string" },
                },
                required: ["introduction","conceptualExplanation","formulasAndDerivations","solvedExamples","advancedConcepts","examSpecificTips","commonMistakes","quickRevisionSummary","mnemonics"],
                additionalProperties: false,
              }
            }}
          });

          const content = JSON.parse(response.choices[0].message.content as string);
          const wordCount = Object.values(content).join(" ").split(/\s+/).length;

          await db.insert(narrationScripts).values({
            chapterId: input.chapterId,
            ...content,
            wordCount,
            generatedBy: "llm",
          });
          results.narration = true;
        } catch (e) {
          console.error("Narration generation failed:", e);
        }
      } else {
        results.narration = true;
      }

      // Generate questions if < 10
      const qCount = await db.select({ count: sql<number>`count(*)` })
        .from(questions).where(eq(questions.chapterId, input.chapterId));
      if ((qCount[0]?.count || 0) < 10) {
        try {
          const qPrompt = `Generate 15 JEE-level questions for "${chapter.title}" (${chapter.subjectId}).
Mix: 8 MCQ, 4 NAT (numerical), 3 Integer type. Mix easy/medium/hard. Include past-year style questions.
Return JSON array of questions with fields: questionType (mcq/nat/integer), difficulty (easy/medium/hard), 
questionText, options (for mcq: {A,B,C,D}), correctAnswer, solution, conceptTested, marks (4), negativeMarks (1 for mcq, 0 for nat/integer), year (2015-2024 random), source (official_exam).`;

          const qResponse = await invokeLLM({
            messages: [{ role: "user", content: qPrompt }],
            response_format: { type: "json_schema", json_schema: {
              name: "questions_list", strict: true,
              schema: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        questionType: { type: "string", enum: ["mcq","nat","integer"] },
                        difficulty: { type: "string", enum: ["easy","medium","hard"] },
                        questionText: { type: "string" },
                        options: { type: ["object","null"] },
                        correctAnswer: { type: "string" },
                        solution: { type: "string" },
                        conceptTested: { type: "string" },
                        marks: { type: "number" },
                        negativeMarks: { type: "number" },
                        year: { type: "number" },
                        source: { type: "string" },
                      },
                      required: ["questionType","difficulty","questionText","correctAnswer","solution","conceptTested","marks","negativeMarks","year","source"],
                      additionalProperties: false,
                    }
                  }
                },
                required: ["questions"],
                additionalProperties: false,
              }
            }}
          });

          const { questions: qs } = JSON.parse(qResponse.choices[0].message.content as string);
          for (const q of qs) {
            await db.insert(questions).values({
              chapterId: input.chapterId,
              subjectId: chapter.subjectId,
              examId: "jee_main",
              questionType: q.questionType,
              difficulty: q.difficulty,
              source: "official_exam",
              year: q.year,
              questionText: q.questionText,
              options: q.options || null,
              correctAnswer: q.correctAnswer,
              solution: q.solution,
              conceptTested: q.conceptTested,
              marks: q.marks || 4,
              negativeMarks: q.negativeMarks || 1,
              isVerified: false,
              isActive: true,
            });
          }
          results.questions = qs.length;
        } catch (e) {
          console.error("Question generation failed:", e);
        }
      } else {
        results.questions = qCount[0]?.count || 0;
      }

      return { success: true, chapterId: input.chapterId, results };
    }),

  // ─── Student Roster ───────────────────────────────────────────────────────
  getStudentRoster: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const studentList = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      }).from(users).orderBy(desc(users.lastSignedIn)).limit(input.limit).offset(input.offset);

      const [total] = await db.select({ count: sql<number>`count(*)` }).from(users);

      return { students: studentList, total: total?.count || 0 };
    }),

  // ─── Proctoring Review ────────────────────────────────────────────────────
  getProctoringReports: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "reviewed_clean", "reviewed_flagged", "invalidated", "all"]).default("pending"),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const query = db.select({
        id: proctoringReports.id,
        userId: proctoringReports.userId,
        attemptId: proctoringReports.attemptId,
        attemptType: proctoringReports.attemptType,
        suspiciousScore: proctoringReports.suspiciousScore,
        totalEvents: proctoringReports.totalEvents,
        highSeverityEvents: proctoringReports.highSeverityEvents,
        tabSwitches: proctoringReports.tabSwitches,
        faceNotDetectedCount: proctoringReports.faceNotDetectedCount,
        warningsIssued: proctoringReports.warningsIssued,
        wasAutoSubmitted: proctoringReports.wasAutoSubmitted,
        reviewStatus: proctoringReports.reviewStatus,
        createdAt: proctoringReports.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(proctoringReports)
      .leftJoin(users, eq(proctoringReports.userId, users.id))
      .orderBy(desc(proctoringReports.suspiciousScore))
      .limit(input.limit);

      if (input.status !== "all") {
        return await db.select({
          id: proctoringReports.id,
          userId: proctoringReports.userId,
          attemptId: proctoringReports.attemptId,
          attemptType: proctoringReports.attemptType,
          suspiciousScore: proctoringReports.suspiciousScore,
          totalEvents: proctoringReports.totalEvents,
          highSeverityEvents: proctoringReports.highSeverityEvents,
          tabSwitches: proctoringReports.tabSwitches,
          faceNotDetectedCount: proctoringReports.faceNotDetectedCount,
          warningsIssued: proctoringReports.warningsIssued,
          wasAutoSubmitted: proctoringReports.wasAutoSubmitted,
          reviewStatus: proctoringReports.reviewStatus,
          createdAt: proctoringReports.createdAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(proctoringReports)
        .leftJoin(users, eq(proctoringReports.userId, users.id))
        .where(eq(proctoringReports.reviewStatus, input.status as any))
        .orderBy(desc(proctoringReports.suspiciousScore))
        .limit(input.limit);
      }

      return await query;
    }),

  reviewProctoringReport: adminProcedure
    .input(z.object({
      reportId: z.number(),
      status: z.enum(["reviewed_clean", "reviewed_flagged", "invalidated"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      await db.update(proctoringReports)
        .set({
          reviewStatus: input.status,
          reviewNotes: input.notes,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
        })
        .where(eq(proctoringReports.id, input.reportId));

      return { success: true };
    }),

  // ─── API Key Management ───────────────────────────────────────────────────
  listApiKeys: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

    return await db.select({
      id: apiKeys.id,
      keyName: apiKeys.keyName,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      rateLimit: apiKeys.rateLimit,
      isActive: apiKeys.isActive,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      createdAt: apiKeys.createdAt,
    }).from(apiKeys).where(eq(apiKeys.userId, ctx.user.id)).orderBy(desc(apiKeys.createdAt));
  }),

  generateApiKey: adminProcedure
    .input(z.object({
      keyName: z.string().min(1).max(128),
      scopes: z.array(z.string()).default(["read:chapters", "read:questions", "read:assessments"]),
      rateLimit: z.number().default(100),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      const rawKey = `ukp_${crypto.randomBytes(32).toString("hex")}`;
      const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
      const keyPrefix = rawKey.substring(0, 12);

      await db.insert(apiKeys).values({
        userId: ctx.user.id,
        keyName: input.keyName,
        keyHash,
        keyPrefix,
        scopes: input.scopes,
        rateLimit: input.rateLimit,
        isActive: true,
      });

      return { success: true, apiKey: rawKey, keyPrefix, message: "Store this key securely — it will not be shown again." };
    }),

  revokeApiKey: adminProcedure
    .input(z.object({ keyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

      await db.update(apiKeys)
        .set({ isActive: false })
        .where(and(eq(apiKeys.id, input.keyId), eq(apiKeys.userId, ctx.user.id)));

      return { success: true };
    }),

  // ─── Mock Test Schedule Management ───────────────────────────────────────
  getMockTestSchedule: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

    return await db.select().from(mockTestSchedule).orderBy(mockTestSchedule.monthNumber);
  }),

  // ─── Platform Analytics ───────────────────────────────────────────────────
  getPlatformAnalytics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB not available" });

    // Recent weekly performance aggregates
    const recentWeeks = await db.select({
      weekStartDate: weeklyPerformance.weekStartDate,
      avgScore: sql<number>`avg(${weeklyPerformance.avgScore})`,
      totalStudents: sql<number>`count(distinct ${weeklyPerformance.userId})`,
      totalAssessments: sql<number>`sum(${weeklyPerformance.assessmentsTaken})`,
    }).from(weeklyPerformance)
      .groupBy(weeklyPerformance.weekStartDate)
      .orderBy(desc(weeklyPerformance.weekStartDate))
      .limit(12);

    // Subject performance breakdown
    const subjectPerf = await db.select({
      physicsAvg: sql<number>`avg(${weeklyPerformance.physicsAvg})`,
      chemistryAvg: sql<number>`avg(${weeklyPerformance.chemistryAvg})`,
      mathematicsAvg: sql<number>`avg(${weeklyPerformance.mathematicsAvg})`,
    }).from(weeklyPerformance);

    return { recentWeeks, subjectPerf: subjectPerf[0] || null };
  }),
});
