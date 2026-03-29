/**
 * Universal Knowledge Platform — Public REST API v1
 * Fully documented RESTful API for ERP/LMS integration
 * Base path: /api/v1
 */
import { Router, Request, Response, NextFunction } from "express";
import { getDb } from "../db";
import { invokeLLM } from "../_core/llm";
import { chapters, subjects, curricula, exams, examChapterWeightage, narrationScripts, questions, assessments, apiKeys } from "../../drizzle/schema";
import { eq, and, like, sql } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// ─── API Key Auth Middleware ───────────────────────────────────────────────────
const apiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.headers["x-api-key"] as string || req.query.api_key as string;
  if (!key) {
    return res.status(401).json({ error: "API key required. Pass via X-Api-Key header or ?api_key= query param." });
  }

  const db = await getDb();
  if (!db) return res.status(503).json({ error: "Database unavailable" });

  const keyHash = crypto.createHash("sha256").update(key).digest("hex");
  const keyRecord = await db.select().from(apiKeys).where(
    and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true))
  ).limit(1);

  if (!keyRecord.length) {
    return res.status(401).json({ error: "Invalid or inactive API key" });
  }

  if (keyRecord[0].expiresAt && keyRecord[0].expiresAt < new Date()) {
    return res.status(401).json({ error: "API key expired" });
  }

  // Update last used
  await db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, keyRecord[0].id));

  (req as any).apiKey = keyRecord[0];
  next();
};

// ─── Rate Limiting (simple in-memory) ────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = (req as any).apiKey?.id || req.ip;
  const limit = (req as any).apiKey?.rateLimit || 100;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window

  const record = rateLimitMap.get(key);
  if (!record || record.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", limit - 1);
    return next();
  }

  if (record.count >= limit) {
    res.setHeader("Retry-After", Math.ceil((record.resetAt - now) / 1000));
    return res.status(429).json({ error: "Rate limit exceeded. Retry after 1 minute." });
  }

  record.count++;
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", limit - record.count);
  next();
};

// ─── Standard Response Helpers ────────────────────────────────────────────────
const ok = (res: Response, data: any, meta?: any) => res.json({ success: true, data, meta, timestamp: new Date().toISOString(), version: "v1" });
const err = (res: Response, status: number, message: string) => res.status(status).json({ success: false, error: message, timestamp: new Date().toISOString(), version: "v1" });

// ─── Swagger/OpenAPI Docs ─────────────────────────────────────────────────────
router.get("/docs", (_req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "Universal Knowledge Platform API",
      version: "1.0.0",
      description: "RESTful API for accessing JEE (and other exam) educational content. Integrate with any ERP, LMS, or educational platform.",
      contact: { name: "Knowledge Platform Team" }
    },
    servers: [{ url: "/api/v1", description: "Production API v1" }],
    security: [{ ApiKeyAuth: [] }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: "apiKey", in: "header", name: "X-Api-Key" }
      }
    },
    paths: {
      "/exams": { get: { summary: "List all exams", tags: ["Exams"] } },
      "/subjects": { get: { summary: "List all subjects", tags: ["Subjects"] } },
      "/chapters": { get: { summary: "List all chapters", parameters: [{ name: "subjectId", in: "query" }, { name: "curriculumId", in: "query" }, { name: "examId", in: "query" }], tags: ["Chapters"] } },
      "/chapters/{chapterId}": { get: { summary: "Get chapter by ID", tags: ["Chapters"] } },
      "/chapters/{chapterId}/narration": { get: { summary: "Get teacher narration script", tags: ["Content"] } },
      "/chapters/{chapterId}/questions": { get: { summary: "Get questions for a chapter", parameters: [{ name: "difficulty", in: "query" }, { name: "type", in: "query" }, { name: "limit", in: "query" }], tags: ["Questions"] } },
      "/chapters/{chapterId}/assessments": { get: { summary: "Get assessments for a chapter", tags: ["Assessments"] } },
      "/questions": { get: { summary: "Search questions", parameters: [{ name: "subjectId", in: "query" }, { name: "examId", in: "query" }, { name: "year", in: "query" }, { name: "difficulty", in: "query" }, { name: "type", in: "query" }], tags: ["Questions"] } },
      "/search": { get: { summary: "Full-text search across chapters, topics, questions", parameters: [{ name: "q", in: "query", required: true }], tags: ["Search"] } },
      "/study-plan": { get: { summary: "Get 24-month study plan for JEE", tags: ["Study Plan"] } }
    }
  });
});

// ─── Exams ────────────────────────────────────────────────────────────────────
router.get("/exams", apiKeyAuth, rateLimit, async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) return err(res, 503, "Database unavailable");
    const data = await db.select().from(exams).where(eq(exams.isActive, true));
    ok(res, data, { count: data.length });
  } catch (e: any) { err(res, 500, e.message); }
});

// ─── Subjects ─────────────────────────────────────────────────────────────────
router.get("/subjects", apiKeyAuth, rateLimit, async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) return err(res, 503, "Database unavailable");
    const data = await db.select().from(subjects).where(eq(subjects.isActive, true));
    ok(res, data, { count: data.length });
  } catch (e: any) { err(res, 500, e.message); }
});

// ─── Curricula ────────────────────────────────────────────────────────────────
router.get("/curricula", apiKeyAuth, rateLimit, async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) return err(res, 503, "Database unavailable");
    const data = await db.select().from(curricula).where(eq(curricula.isActive, true));
    ok(res, data, { count: data.length });
  } catch (e: any) { err(res, 500, e.message); }
});

// ─── Chapters ─────────────────────────────────────────────────────────────────
router.get("/chapters", apiKeyAuth, rateLimit, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return err(res, 503, "Database unavailable");

    const { subjectId, curriculumId, examId } = req.query as Record<string, string>;

    const conditions: any[] = [eq(chapters.isActive, true)];
    if (subjectId) conditions.push(eq(chapters.subjectId, subjectId));
    if (curriculumId) conditions.push(eq(chapters.curriculumId, curriculumId));

    const data = await db.select({
      chapter: chapters,
      subject: subjects
    })
      .from(chapters)
      .leftJoin(subjects, eq(chapters.subjectId, subjects.subjectId))
      .where(and(...conditions))
      .orderBy(chapters.subjectId, chapters.sortOrder);

    // Attach weightage if examId provided
    let weightageMap = new Map();
    if (examId) {
      const weightageData = await db.select().from(examChapterWeightage).where(eq(examChapterWeightage.examId, examId));
      weightageMap = new Map(weightageData.map(w => [w.chapterId, w]));
    }

    const result = data.map(row => ({
      ...row.chapter,
      subject: row.subject,
      weightage: examId ? (weightageMap.get(row.chapter.chapterId) || null) : undefined
    }));

    ok(res, result, { count: result.length, filters: { subjectId, curriculumId, examId } });
  } catch (e: any) { err(res, 500, e.message); }
});

router.get("/chapters/:chapterId", apiKeyAuth, rateLimit, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return err(res, 503, "Database unavailable");

    const result = await db.select({
      chapter: chapters,
      subject: subjects,
      curriculum: curricula
    })
      .from(chapters)
      .leftJoin(subjects, eq(chapters.subjectId, subjects.subjectId))
      .leftJoin(curricula, eq(chapters.curriculumId, curricula.curriculumId))
      .where(eq(chapters.chapterId, req.params.chapterId))
      .limit(1);

    if (!result.length) return err(res, 404, "Chapter not found");

    const [wMain, wAdv] = await Promise.all([
      db.select().from(examChapterWeightage).where(and(eq(examChapterWeightage.chapterId, req.params.chapterId), eq(examChapterWeightage.examId, "jee_main"))).limit(1),
      db.select().from(examChapterWeightage).where(and(eq(examChapterWeightage.chapterId, req.params.chapterId), eq(examChapterWeightage.examId, "jee_advanced"))).limit(1)
    ]);

    ok(res, {
      ...result[0].chapter,
      subject: result[0].subject,
      curriculum: result[0].curriculum,
      weightage: { jeeMain: wMain[0] || null, jeeAdvanced: wAdv[0] || null }
    });
  } catch (e: any) { err(res, 500, e.message); }
});

// ─── Narration Scripts ────────────────────────────────────────────────────────
router.get("/chapters/:chapterId/narration", apiKeyAuth, rateLimit, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return err(res, 503, "Database unavailable");

    const result = await db.select().from(narrationScripts).where(eq(narrationScripts.chapterId, req.params.chapterId)).limit(1);
    if (!result.length) return err(res, 404, "Narration script not yet generated. Access via the web platform to trigger generation.");

    ok(res, result[0]);
  } catch (e: any) { err(res, 500, e.message); }
});

// ─── Questions ────────────────────────────────────────────────────────────────
router.get("/chapters/:chapterId/questions", apiKeyAuth, rateLimit, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return err(res, 503, "Database unavailable");

    const { difficulty, type, limit = "20", includeAnswers = "false" } = req.query as Record<string, string>;

    const conditions: any[] = [eq(questions.chapterId, req.params.chapterId), eq(questions.isActive, true)];
    if (difficulty) conditions.push(eq(questions.difficulty, difficulty as any));
    if (type) conditions.push(eq(questions.questionType, type as any));

    const data = await db.select().from(questions).where(and(...conditions)).limit(parseInt(limit));

    const result = data.map(q => ({
      ...q,
      ...(includeAnswers !== "true" ? { correctAnswer: undefined, correctOptions: undefined, numericalAnswer: undefined, solution: undefined } : {})
    }));

    ok(res, result, { count: result.length, chapterId: req.params.chapterId });
  } catch (e: any) { err(res, 500, e.message); }
});

router.get("/questions", apiKeyAuth, rateLimit, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return err(res, 503, "Database unavailable");

    const { subjectId, examId, year, difficulty, type, limit = "50", includeAnswers = "false" } = req.query as Record<string, string>;

    const conditions: any[] = [eq(questions.isActive, true)];
    if (subjectId) conditions.push(eq(questions.subjectId, subjectId));
    if (examId) conditions.push(eq(questions.examId, examId));
    if (year) conditions.push(eq(questions.year, parseInt(year)));
    if (difficulty) conditions.push(eq(questions.difficulty, difficulty as any));
    if (type) conditions.push(eq(questions.questionType, type as any));

    const data = await db.select().from(questions).where(and(...conditions)).limit(Math.min(parseInt(limit), 200));

    const result = data.map(q => ({
      ...q,
      ...(includeAnswers !== "true" ? { correctAnswer: undefined, correctOptions: undefined, numericalAnswer: undefined, solution: undefined } : {})
    }));

    ok(res, result, { count: result.length });
  } catch (e: any) { err(res, 500, e.message); }
});

// ─── Assessments ──────────────────────────────────────────────────────────────
router.get("/chapters/:chapterId/assessments", apiKeyAuth, rateLimit, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return err(res, 503, "Database unavailable");

    const data = await db.select().from(assessments).where(
      and(eq(assessments.chapterId, req.params.chapterId), eq(assessments.isActive, true))
    );
    ok(res, data, { count: data.length });
  } catch (e: any) { err(res, 500, e.message); }
});

// ─── Search ───────────────────────────────────────────────────────────────────
router.get("/search", apiKeyAuth, rateLimit, async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return err(res, 503, "Database unavailable");

    const { q, subjectId } = req.query as Record<string, string>;
    if (!q || q.length < 2) return err(res, 400, "Query must be at least 2 characters");

    const conditions: any[] = [eq(chapters.isActive, true)];
    if (subjectId) conditions.push(eq(chapters.subjectId, subjectId));

    const allChapters = await db.select({ chapter: chapters, subject: subjects })
      .from(chapters)
      .leftJoin(subjects, eq(chapters.subjectId, subjects.subjectId))
      .where(and(...conditions));

    const qLower = q.toLowerCase();
    const matchedChapters = allChapters.filter(row => {
      const ch = row.chapter;
      return (
        ch.title.toLowerCase().includes(qLower) ||
        (ch.tags as string[] || []).some((t: string) => t.toLowerCase().includes(qLower)) ||
        (ch.keyTopics as string[] || []).some((t: string) => t.toLowerCase().includes(qLower))
      );
    });

    ok(res, { chapters: matchedChapters }, { query: q, totalResults: matchedChapters.length });
  } catch (e: any) { err(res, 500, e.message); }
});

// ─── Study Plan ───────────────────────────────────────────────────────────────
router.get("/study-plan", apiKeyAuth, rateLimit, async (_req, res) => {
  try {
    const db = await getDb();
    if (!db) return err(res, 503, "Database unavailable");

    const allChapters = await db.select({ chapter: chapters, subject: subjects })
      .from(chapters)
      .leftJoin(subjects, eq(chapters.subjectId, subjects.subjectId))
      .where(eq(chapters.isActive, true))
      .orderBy(chapters.subjectId, chapters.sortOrder);

    const class11 = allChapters.filter(r => r.chapter.curriculumId === "ncert_class11");
    const class12 = allChapters.filter(r => r.chapter.curriculumId === "ncert_class12");

    const buildPlan = (list: typeof allChapters, startMonth: number) => {
      const plan: Record<number, any[]> = {};
      const perMonth = Math.ceil(list.length / 12);
      list.forEach((ch, idx) => {
        const month = startMonth + Math.floor(idx / perMonth);
        if (!plan[month]) plan[month] = [];
        plan[month].push({ chapterId: ch.chapter.chapterId, title: ch.chapter.title, subject: ch.subject?.name, estimatedHours: ch.chapter.estimatedStudyHours });
      });
      return plan;
    };

    ok(res, {
      totalMonths: 24,
      class11: { months: "1-12", plan: buildPlan(class11, 1) },
      class12: { months: "13-24", plan: buildPlan(class12, 13) },
      dailySchedule: { physics: "2.5 hours", chemistry: "2 hours", mathematics: "3 hours", revision: "1 hour", total: "8.5 hours" },
      unlockRule: "Complete 80% of Class 11 chapters to unlock Class 12 content"
    });
  } catch (e: any) { err(res, 500, e.message); }
});

// ─── API Key Management (public endpoint to create demo key) ──────────────────
router.post("/keys/demo", async (req, res) => {
  try {
    const db = await getDb();
    if (!db) return err(res, 503, "Database unavailable");

    // Generate a demo API key (limited rate)
    const rawKey = `ukp_demo_${crypto.randomBytes(16).toString("hex")}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.substring(0, 12);

    await db.insert(apiKeys).values({
      userId: 1, // System user
      keyName: "Demo Key",
      keyHash,
      keyPrefix,
      scopes: ["read"],
      rateLimit: 30, // 30 req/min for demo
      isActive: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    } as any);

    ok(res, {
      apiKey: rawKey,
      prefix: keyPrefix,
      rateLimit: "30 requests/minute",
      expiresIn: "7 days",
      scopes: ["read"],
      note: "This is a demo key. Contact us for production API access."
    });
  } catch (e: any) { err(res, 500, e.message); }
});

// ─── Ask Doubt (AI Avatar Tutor endpoint) ────────────────────────────────────
router.post("/ask-doubt", async (req, res) => {
  try {
    const { question, chapterId, context } = req.body;
    if (!question) return err(res, 400, "question is required");

    const db = await getDb();
    let chapterContext = context || "";

    // Fetch chapter info for richer context
    if (chapterId && db) {
      const ch = await db.select().from(chapters).where(eq(chapters.chapterId, chapterId)).limit(1);
      if (ch.length) {
        chapterContext = `Chapter: ${ch[0].title}. Key topics: ${(ch[0].keyTopics as string[] || []).join(", ")}. ${context || ""}`;
      }
    }

    const systemPrompt = `You are Priya, a warm, encouraging, and highly knowledgeable female AI tutor specializing in JEE (Joint Entrance Examination) preparation. You teach Physics, Chemistry, and Mathematics for Class 11 and 12 students.

Your teaching style:
- Explain concepts clearly with step-by-step reasoning
- Use relatable analogies and real-world examples
- Always show the formula, then the derivation, then a worked example
- Encourage the student and build their confidence
- Keep answers concise but complete (2-4 paragraphs max)
- Use simple language that a Class 11 student can understand
- If relevant, mention JEE Main/Advanced exam tips

Context: ${chapterContext}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
    });

    const answer = response.choices?.[0]?.message?.content || "I couldn't process that question. Please try again.";
    res.json({ answer, chapterId, question });
  } catch (e: any) { err(res, 500, e.message); }
});

export default router;
