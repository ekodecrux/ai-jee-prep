/**
 * Content Generation Router
 * Handles LLM-based generation of narration scripts, questions, and assessments
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { narrationScripts, questions, assessments, chapters } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ─── Generate Narration Script ────────────────────────────────────────────────
export const generateNarration = async (chapterId: string, chapterTitle: string, subjectId: string, keyTopics: string[]) => {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Check if already generated
  const existing = await db.select().from(narrationScripts).where(eq(narrationScripts.chapterId, chapterId)).limit(1);
  if (existing.length > 0 && existing[0].wordCount && existing[0].wordCount > 500) {
    return existing[0];
  }

  const topicsStr = keyTopics.join(", ");
  const prompt = `You are an expert JEE teacher with 20+ years of experience. Write a comprehensive teacher narration script for the chapter "${chapterTitle}" in ${subjectId.charAt(0).toUpperCase() + subjectId.slice(1)}.

The script must cover these key topics: ${topicsStr}

Structure your response as a JSON object with these exact fields:
{
  "introduction": "3-4 paragraphs introducing the chapter, its importance in JEE, and real-world connections. Minimum 400 words.",
  "conceptualExplanation": "Deep conceptual explanation of all key topics with intuitive understanding. Minimum 800 words. Include analogies and physical intuition.",
  "formulasAndDerivations": "All important formulas with step-by-step derivations and explanations. Minimum 600 words. Use plain text math notation like F = ma, E = mc^2.",
  "solvedExamples": "5 detailed solved examples ranging from easy to hard, showing complete step-by-step solutions. Minimum 700 words.",
  "advancedConcepts": "Advanced topics and JEE Advanced level concepts for this chapter. Minimum 400 words.",
  "examSpecificTips": "Specific tips for JEE Main and JEE Advanced for this chapter, common question patterns, time-saving tricks. Minimum 300 words.",
  "commonMistakes": "Top 5-7 common mistakes students make in this chapter with corrections. Minimum 300 words.",
  "quickRevisionSummary": "A concise revision summary with all key points, formulas, and concepts in bullet format. Minimum 200 words.",
  "mnemonics": "Memory tricks, mnemonics, and shortcuts for remembering key concepts and formulas. Minimum 150 words."
}

Write in a clear, engaging teacher's voice. Be thorough, accurate, and JEE-focused.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert JEE educator. Always respond with valid JSON only." },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "narration_script",
        strict: true,
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
            mnemonics: { type: "string" }
          },
          required: ["introduction", "conceptualExplanation", "formulasAndDerivations", "solvedExamples", "advancedConcepts", "examSpecificTips", "commonMistakes", "quickRevisionSummary", "mnemonics"],
          additionalProperties: false
        }
      }
    }
  });

  const content = JSON.parse(response.choices[0].message.content as string);
  const totalWords = Object.values(content).join(" ").split(/\s+/).length;

  const scriptData = {
    chapterId,
    ...content,
    wordCount: totalWords,
    language: "en",
    generatedBy: "llm"
  };

  if (existing.length > 0) {
    await db.update(narrationScripts).set(scriptData).where(eq(narrationScripts.chapterId, chapterId));
  } else {
    await db.insert(narrationScripts).values(scriptData);
  }

  const result = await db.select().from(narrationScripts).where(eq(narrationScripts.chapterId, chapterId)).limit(1);
  return result[0];
};

// ─── Generate Questions ───────────────────────────────────────────────────────
export const generateQuestions = async (chapterId: string, chapterTitle: string, subjectId: string, keyTopics: string[]) => {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Check if already have questions
  const existing = await db.select().from(questions).where(eq(questions.chapterId, chapterId)).limit(1);
  if (existing.length > 0) return existing;

  const topicsStr = keyTopics.join(", ");
  const prompt = `You are an expert JEE question setter. Generate 20 high-quality questions for the chapter "${chapterTitle}" in ${subjectId}.

Key topics: ${topicsStr}

Generate a mix of:
- 8 MCQ questions (single correct) from JEE Main pattern (years 2015-2024)
- 4 Multi-correct questions from JEE Advanced pattern
- 4 Numerical Answer Type (NAT) questions
- 4 Integer type questions (answer is a non-negative integer)

Distribute difficulty: 4 easy, 10 medium, 6 hard.

Return a JSON array of question objects. Each object must have:
{
  "questionType": "mcq" | "multi_correct" | "nat" | "integer",
  "difficulty": "easy" | "medium" | "hard",
  "source": "official_exam" | "ai_generated",
  "year": 2015-2024 or null,
  "paperCode": "JEE Main 2023 Jan" or null,
  "questionText": "The full question text",
  "options": {"A": "...", "B": "...", "C": "...", "D": "..."} or null for nat/integer,
  "correctAnswer": "A" or "B" or "C" or "D" or numeric string,
  "correctOptions": ["A","C"] or null (only for multi_correct),
  "numericalAnswer": 3.14 or null,
  "solution": "Complete step-by-step solution",
  "conceptTested": "Name of the specific concept tested",
  "marks": 4,
  "negativeMarks": 1
}

Make questions authentic, JEE-level, and test deep understanding. Include questions that appeared in actual JEE exams where possible.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert JEE question setter. Always respond with valid JSON only." },
      { role: "user", content: prompt }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "questions_list",
        strict: true,
        schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  questionType: { type: "string" },
                  difficulty: { type: "string" },
                  source: { type: "string" },
                  year: { type: ["integer", "null"] },
                  paperCode: { type: ["string", "null"] },
                  questionText: { type: "string" },
                  options: { type: ["object", "null"] },
                  correctAnswer: { type: "string" },
                  correctOptions: { type: ["array", "null"], items: { type: "string" } },
                  numericalAnswer: { type: ["number", "null"] },
                  solution: { type: "string" },
                  conceptTested: { type: "string" },
                  marks: { type: "integer" },
                  negativeMarks: { type: "number" }
                },
                required: ["questionType", "difficulty", "source", "questionText", "correctAnswer", "solution", "conceptTested", "marks", "negativeMarks"],
                additionalProperties: false
              }
            }
          },
          required: ["questions"],
          additionalProperties: false
        }
      }
    }
  });

  const parsed = JSON.parse(response.choices[0].message.content as string);
  const questionsList = parsed.questions;

  const insertedIds: number[] = [];
  for (const q of questionsList) {
    const [result] = await db.insert(questions).values({
      chapterId,
      subjectId,
      examId: q.source === "official_exam" ? (q.paperCode?.includes("Advanced") ? "jee_advanced" : "jee_main") : "jee_main",
      questionType: q.questionType,
      difficulty: q.difficulty,
      source: q.source,
      year: q.year,
      paperCode: q.paperCode,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      correctOptions: q.correctOptions,
      numericalAnswer: q.numericalAnswer,
      solution: q.solution,
      conceptTested: q.conceptTested,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      isVerified: false,
      isActive: true
    });
    if ((result as any).insertId) insertedIds.push((result as any).insertId);
  }

  return await db.select().from(questions).where(eq(questions.chapterId, chapterId));
};

// ─── Generate Assessment ──────────────────────────────────────────────────────
export const generateAssessment = async (chapterId: string, chapterTitle: string, subjectId: string) => {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  // Check if assessments already exist
  const existing = await db.select().from(assessments).where(eq(assessments.chapterId, chapterId)).limit(1);
  if (existing.length > 0) return existing;

  // Get questions for this chapter
  const chapterQuestions = await db.select().from(questions).where(and(eq(questions.chapterId, chapterId), eq(questions.isActive, true)));
  if (chapterQuestions.length === 0) return [];

  const questionIds = chapterQuestions.map(q => q.id);
  const practiceIds = questionIds; // All questions for practice
  const testIds = questionIds.slice(0, Math.min(15, questionIds.length)); // 15 for timed test

  const practiceAssessmentId = `${chapterId}_PRACTICE`;
  const testAssessmentId = `${chapterId}_TEST`;

  await db.insert(assessments).values([
    {
      assessmentId: practiceAssessmentId,
      chapterId,
      examId: "jee_main",
      subjectId,
      title: `${chapterTitle} — Practice Mode`,
      description: `Unlimited practice for ${chapterTitle}. Instant feedback after each question.`,
      assessmentType: "practice",
      durationMinutes: 0, // No time limit for practice
      totalMarks: practiceIds.length * 4,
      passingScore: 0, // No passing score for practice
      maxDailyAttempts: 999,
      questionIds: practiceIds,
      instructions: "Practice mode: Attempt all questions at your own pace. Instant feedback is provided after each answer.",
      isActive: true
    },
    {
      assessmentId: testAssessmentId,
      chapterId,
      examId: "jee_main",
      subjectId,
      title: `${chapterTitle} — Chapter Test`,
      description: `Timed chapter test for ${chapterTitle}. Maximum 3 attempts per day.`,
      assessmentType: "chapter_test",
      durationMinutes: 30,
      totalMarks: testIds.length * 4,
      passingScore: 60,
      maxDailyAttempts: 3,
      questionIds: testIds,
      instructions: "Timed test: 30 minutes. +4 marks for correct, -1 for wrong MCQ. Score 60% to unlock the next chapter.",
      isActive: true
    }
  ]).onDuplicateKeyUpdate({ set: { isActive: true } });

  return await db.select().from(assessments).where(eq(assessments.chapterId, chapterId));
};

// ─── tRPC Router ──────────────────────────────────────────────────────────────
export const contentRouter = router({
  // Get narration script for a chapter (generates if not exists)
  getNarration: publicProcedure
    .input(z.object({ chapterId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const existing = await db.select().from(narrationScripts).where(eq(narrationScripts.chapterId, input.chapterId)).limit(1);
      if (existing.length > 0 && existing[0].wordCount && existing[0].wordCount > 500) {
        return existing[0];
      }

      // Get chapter info
      const chapterData = await db.select().from(chapters).where(eq(chapters.chapterId, input.chapterId)).limit(1);
      if (!chapterData.length) throw new Error("Chapter not found");
      const chapter = chapterData[0];

      return await generateNarration(
        chapter.chapterId,
        chapter.title,
        chapter.subjectId,
        (chapter.keyTopics as string[]) || []
      );
    }),

  // Get questions for a chapter (generates if not exists)
  getQuestions: publicProcedure
    .input(z.object({
      chapterId: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      questionType: z.enum(["mcq", "nat", "integer", "multi_correct"]).optional(),
      source: z.enum(["official_exam", "practice", "ai_generated"]).optional(),
      limit: z.number().default(20)
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      let existing = await db.select().from(questions).where(eq(questions.chapterId, input.chapterId));

      if (existing.length === 0) {
        const chapterData = await db.select().from(chapters).where(eq(chapters.chapterId, input.chapterId)).limit(1);
        if (!chapterData.length) throw new Error("Chapter not found");
        const chapter = chapterData[0];
        existing = await generateQuestions(chapter.chapterId, chapter.title, chapter.subjectId, (chapter.keyTopics as string[]) || []);
      }

      // Apply filters
      let filtered = existing;
      if (input.difficulty) filtered = filtered.filter(q => q.difficulty === input.difficulty);
      if (input.questionType) filtered = filtered.filter(q => q.questionType === input.questionType);
      if (input.source) filtered = filtered.filter(q => q.source === input.source);

      return filtered.slice(0, input.limit);
    }),

  // Get assessments for a chapter (generates if not exists)
  getAssessments: publicProcedure
    .input(z.object({ chapterId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      let existing = await db.select().from(assessments).where(eq(assessments.chapterId, input.chapterId));

      if (existing.length === 0) {
        const chapterData = await db.select().from(chapters).where(eq(chapters.chapterId, input.chapterId)).limit(1);
        if (!chapterData.length) throw new Error("Chapter not found");
        const chapter = chapterData[0];
        existing = await generateAssessment(chapter.chapterId, chapter.title, chapter.subjectId);
      }

      return existing;
    }),

  // Trigger generation for a chapter (admin only, or auto on first access)
  generateContent: publicProcedure
    .input(z.object({ chapterId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB not available");

      const chapterData = await db.select().from(chapters).where(eq(chapters.chapterId, input.chapterId)).limit(1);
      if (!chapterData.length) throw new Error("Chapter not found");
      const chapter = chapterData[0];

      const [narration, qs] = await Promise.all([
        generateNarration(chapter.chapterId, chapter.title, chapter.subjectId, (chapter.keyTopics as string[]) || []),
        generateQuestions(chapter.chapterId, chapter.title, chapter.subjectId, (chapter.keyTopics as string[]) || [])
      ]);

      const assmts = await generateAssessment(chapter.chapterId, chapter.title, chapter.subjectId);

      return {
        chapterId: input.chapterId,
        narrationWordCount: narration?.wordCount || 0,
        questionsGenerated: qs.length,
        assessmentsCreated: assmts.length
      };
    })
});
