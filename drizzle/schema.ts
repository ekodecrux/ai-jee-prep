/**
 * Universal Knowledge Platform — Database Schema
 *
 * Designed to be exam-agnostic and curriculum-agnostic.
 * JEE (Main + Advanced) is the first seeded exam, but the schema
 * supports NEET, GATE, UPSC, CBSE, IB, A-Levels, and any academic curriculum.
 *
 * ERP/LMS integrations consume data via the RESTful public API (/api/v1/).
 */

import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  float,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── API Keys (for ERP/LMS integration) ──────────────────────────────────────
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  keyName: varchar("keyName", { length: 128 }).notNull(),
  keyHash: varchar("keyHash", { length: 256 }).notNull().unique(), // SHA-256 of the actual key
  keyPrefix: varchar("keyPrefix", { length: 16 }).notNull(),       // First 8 chars for display
  scopes: json("scopes").$type<string[]>(),                        // ["read:chapters","read:questions",...]
  rateLimit: int("rateLimit").default(100),                        // requests per minute
  isActive: boolean("isActive").default(true).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ApiKey = typeof apiKeys.$inferSelect;

// ─── Exams Registry ───────────────────────────────────────────────────────────
// Extensible: JEE Main, JEE Advanced, NEET, GATE, UPSC, CBSE, IB, A-Levels...
export const exams = mysqlTable("exams", {
  id: int("id").autoincrement().primaryKey(),
  examId: varchar("examId", { length: 64 }).notNull().unique(),     // e.g. "jee_main", "neet", "gate_cs"
  name: varchar("name", { length: 256 }).notNull(),
  fullName: varchar("fullName", { length: 512 }),
  category: mysqlEnum("category", ["engineering", "medical", "civil_services", "academic", "other"]).notNull(),
  conductingBody: varchar("conductingBody", { length: 256 }),       // NTA, UPSC, etc.
  country: varchar("country", { length: 64 }).default("India"),
  description: text("description"),
  officialUrl: varchar("officialUrl", { length: 512 }),
  isActive: boolean("isActive").default(true).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Exam = typeof exams.$inferSelect;

// ─── Subjects ─────────────────────────────────────────────────────────────────
// Subjects are shared across exams (Physics appears in JEE, NEET, etc.)
export const subjects = mysqlTable("subjects", {
  id: int("id").autoincrement().primaryKey(),
  subjectId: varchar("subjectId", { length: 64 }).notNull().unique(), // e.g. "physics", "chemistry"
  name: varchar("name", { length: 256 }).notNull(),
  shortName: varchar("shortName", { length: 32 }),
  iconName: varchar("iconName", { length: 64 }),
  colorHex: varchar("colorHex", { length: 7 }),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Subject = typeof subjects.$inferSelect;

// ─── Exam-Subject Mapping ─────────────────────────────────────────────────────
export const examSubjects = mysqlTable("exam_subjects", {
  id: int("id").autoincrement().primaryKey(),
  examId: varchar("examId", { length: 64 }).notNull(),
  subjectId: varchar("subjectId", { length: 64 }).notNull(),
  totalChapters: int("totalChapters").default(0),
  weightagePercent: float("weightagePercent"),
  sortOrder: int("sortOrder").default(0),
});

// ─── Curricula ────────────────────────────────────────────────────────────────
// A curriculum defines the grade/level structure (e.g., Class 11, Class 12, Semester 1)
export const curricula = mysqlTable("curricula", {
  id: int("id").autoincrement().primaryKey(),
  curriculumId: varchar("curriculumId", { length: 64 }).notNull().unique(), // e.g. "ncert_class11"
  name: varchar("name", { length: 256 }).notNull(),
  board: varchar("board", { length: 128 }),                         // NCERT, CBSE, IB, Cambridge
  gradeLevel: varchar("gradeLevel", { length: 64 }),               // "Class 11", "Year 1", "Semester 1"
  gradeLevelNum: int("gradeLevelNum"),                              // 11, 12, 1, 2 — for ordering
  country: varchar("country", { length: 64 }).default("India"),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Curriculum = typeof curricula.$inferSelect;

// ─── Chapters ─────────────────────────────────────────────────────────────────
// Central content unit — belongs to a subject + curriculum, referenced by exams
export const chapters = mysqlTable("chapters", {
  id: int("id").autoincrement().primaryKey(),
  chapterId: varchar("chapterId", { length: 64 }).notNull().unique(), // e.g. "PHY_C11_01"
  subjectId: varchar("subjectId", { length: 64 }).notNull(),
  curriculumId: varchar("curriculumId", { length: 64 }).notNull(),
  chapterNo: int("chapterNo").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 256 }),                           // URL-friendly title
  ncertChapterRef: varchar("ncertChapterRef", { length: 64 }),
  prerequisites: json("prerequisites").$type<string[]>(),           // array of chapterIds
  keyTopics: json("keyTopics").$type<string[]>(),
  learningObjectives: json("learningObjectives").$type<string[]>(),
  difficultyLevel: mysqlEnum("difficultyLevel", ["foundation", "intermediate", "advanced"]).default("intermediate"),
  estimatedStudyHours: float("estimatedStudyHours"),
  tags: json("tags").$type<string[]>(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Chapter = typeof chapters.$inferSelect;

// ─── Exam-Chapter Weightage ───────────────────────────────────────────────────
// Each exam can assign different weightage to the same chapter
export const examChapterWeightage = mysqlTable("exam_chapter_weightage", {
  id: int("id").autoincrement().primaryKey(),
  examId: varchar("examId", { length: 64 }).notNull(),
  chapterId: varchar("chapterId", { length: 64 }).notNull(),
  weightagePercent: varchar("weightagePercent", { length: 16 }),
  avgQuestionsPerYear: float("avgQuestionsPerYear"),
  importanceLevel: mysqlEnum("importanceLevel", ["low", "medium", "high", "critical"]).default("medium"),
  notes: text("notes"),
});

// ─── Narration Scripts ────────────────────────────────────────────────────────
export const narrationScripts = mysqlTable("narration_scripts", {
  id: int("id").autoincrement().primaryKey(),
  chapterId: varchar("chapterId", { length: 64 }).notNull().unique(),
  introduction: text("introduction"),
  conceptualExplanation: text("conceptualExplanation"),
  formulasAndDerivations: text("formulasAndDerivations"),
  solvedExamples: text("solvedExamples"),
  advancedConcepts: text("advancedConcepts"),
  examSpecificTips: text("examSpecificTips"),
  commonMistakes: text("commonMistakes"),
  quickRevisionSummary: text("quickRevisionSummary"),
  mnemonics: text("mnemonics"),
  wordCount: int("wordCount").default(0),
  language: varchar("language", { length: 16 }).default("en"),
  generatedBy: varchar("generatedBy", { length: 64 }).default("llm"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type NarrationScript = typeof narrationScripts.$inferSelect;

// ─── Questions ────────────────────────────────────────────────────────────────
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  chapterId: varchar("chapterId", { length: 64 }).notNull(),
  subjectId: varchar("subjectId", { length: 64 }).notNull(),
  examId: varchar("examId", { length: 64 }).notNull(),              // which exam this Q is from
  questionType: mysqlEnum("questionType", ["mcq", "nat", "integer", "multi_correct", "subjective", "assertion_reason"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull(),
  source: mysqlEnum("source", ["official_exam", "practice", "ai_generated"]).notNull(),
  year: int("year"),
  paperCode: varchar("paperCode", { length: 32 }),                  // e.g. "Paper 1", "Paper 2", "Shift 1"
  questionText: text("questionText").notNull(),
  questionHtml: text("questionHtml"),                               // Rich HTML with LaTeX/MathML
  options: json("options").$type<{ A: string; B: string; C: string; D: string } | null>(),
  correctAnswer: varchar("correctAnswer", { length: 256 }).notNull(),
  correctOptions: json("correctOptions").$type<string[]>(),
  numericalAnswer: float("numericalAnswer"),
  answerRange: json("answerRange").$type<{ min: number; max: number } | null>(),
  solution: text("solution").notNull(),
  solutionHtml: text("solutionHtml"),
  conceptTested: varchar("conceptTested", { length: 256 }),
  topicTags: json("topicTags").$type<string[]>(),
  marks: int("marks").default(4),
  negativeMarks: float("negativeMarks").default(1),
  isVerified: boolean("isVerified").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Question = typeof questions.$inferSelect;

// ─── Assessments ─────────────────────────────────────────────────────────────
export const assessments = mysqlTable("assessments", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: varchar("assessmentId", { length: 64 }).notNull().unique(),
  chapterId: varchar("chapterId", { length: 64 }),                  // null for cross-chapter/mock
  examId: varchar("examId", { length: 64 }).notNull(),
  subjectId: varchar("subjectId", { length: 64 }),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  assessmentType: mysqlEnum("assessmentType", ["practice", "chapter_test", "subject_mock", "full_mock"]).notNull(),
  durationMinutes: int("durationMinutes").default(30),
  totalMarks: int("totalMarks").default(100),
  passingScore: int("passingScore").default(60),
  maxDailyAttempts: int("maxDailyAttempts").default(3),
  questionIds: json("questionIds").$type<number[]>().notNull(),
  instructions: text("instructions"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Assessment = typeof assessments.$inferSelect;

// ─── Chapter Progress ─────────────────────────────────────────────────────────
export const chapterProgress = mysqlTable("chapter_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chapterId: varchar("chapterId", { length: 64 }).notNull(),
  subjectId: varchar("subjectId", { length: 64 }).notNull(),
  curriculumId: varchar("curriculumId", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["locked", "unlocked", "in_progress", "completed"]).default("locked").notNull(),
  narrationRead: boolean("narrationRead").default(false).notNull(),
  narrationReadAt: timestamp("narrationReadAt"),
  bestScore: float("bestScore").default(0),
  totalAttempts: int("totalAttempts").default(0),
  lastAttemptAt: timestamp("lastAttemptAt"),
  completedAt: timestamp("completedAt"),
  timeSpentMinutes: int("timeSpentMinutes").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ChapterProgress = typeof chapterProgress.$inferSelect;

// ─── Assessment Attempts ──────────────────────────────────────────────────────
export const assessmentAttempts = mysqlTable("assessment_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentId: varchar("assessmentId", { length: 64 }).notNull(),
  chapterId: varchar("chapterId", { length: 64 }),
  examId: varchar("examId", { length: 64 }).notNull(),
  attemptType: mysqlEnum("attemptType", ["practice", "chapter_test", "subject_mock", "full_mock"]).notNull(),
  answers: json("answers").$type<Record<string, string>>().notNull(),
  score: float("score").notNull(),
  maxScore: float("maxScore").notNull(),
  percentage: float("percentage").notNull(),
  timeTakenSeconds: int("timeTakenSeconds"),
  passed: boolean("passed").default(false).notNull(),
  questionResults: json("questionResults").$type<Array<{
    questionId: number;
    userAnswer: string;
    correct: boolean;
    marks: number;
    conceptTested?: string;
  }>>(),
  weakTopics: json("weakTopics").$type<string[]>(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type AssessmentAttempt = typeof assessmentAttempts.$inferSelect;

// ─── Daily Attempt Limits ─────────────────────────────────────────────────────
export const dailyAttemptLimits = mysqlTable("daily_attempt_limits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentId: varchar("assessmentId", { length: 64 }).notNull(),
  attemptDate: varchar("attemptDate", { length: 10 }).notNull(),   // YYYY-MM-DD
  attemptsUsed: int("attemptsUsed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Mock Tests ───────────────────────────────────────────────────────────────
export const mockTests = mysqlTable("mock_tests", {
  id: int("id").autoincrement().primaryKey(),
  mockTestId: varchar("mockTestId", { length: 64 }).notNull().unique(),
  examId: varchar("examId", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  testType: mysqlEnum("testType", ["subject_mock", "full_mock"]).notNull(),
  subjectId: varchar("subjectId", { length: 64 }),                  // null for full mock
  durationMinutes: int("durationMinutes").default(180),
  totalMarks: int("totalMarks").default(300),
  questionIds: json("questionIds").$type<number[]>().notNull(),
  sectionConfig: json("sectionConfig").$type<Array<{
    subjectId: string;
    questionCount: number;
    marks: number;
  }>>(),
  unlockRequirement: json("unlockRequirement").$type<{
    type: "all_chapters" | "subject_chapters";
    subjectId?: string;
    minCompletionPercent: number;
  }>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MockTest = typeof mockTests.$inferSelect;

// ─── Mock Test Attempts ───────────────────────────────────────────────────────
export const mockTestAttempts = mysqlTable("mock_test_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mockTestId: varchar("mockTestId", { length: 64 }).notNull(),
  answers: json("answers").$type<Record<string, string>>(),
  score: float("score"),
  maxScore: float("maxScore"),
  percentage: float("percentage"),
  rank: int("rank"),
  timeTakenSeconds: int("timeTakenSeconds"),
  sectionScores: json("sectionScores").$type<Record<string, number>>(),
  questionResults: json("questionResults").$type<Array<{
    questionId: number;
    userAnswer: string;
    correct: boolean;
    marks: number;
  }>>(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress"),
});
