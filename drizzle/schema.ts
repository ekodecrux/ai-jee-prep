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

// ─── Tuition Session Modes ────────────────────────────────────────────────────
// Tracks individual lesson/exam sessions in tuition-center mode
export const tuitionSessions = mysqlTable("tuition_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chapterId: varchar("chapterId", { length: 64 }).notNull(),
  subjectId: varchar("subjectId", { length: 64 }).notNull(),
  sessionType: mysqlEnum("sessionType", [
    "lesson_30min",    // 30-min condensed narration
    "exam_15min",      // 15-min weekday quick exam (10 questions)
    "exam_60min",      // 1-hr weekend exam (30 questions)
    "practice",        // unlimited practice mode
    "revision",        // revision session
  ]).notNull(),
  scheduledDate: varchar("scheduledDate", { length: 10 }),  // YYYY-MM-DD
  scheduledTime: varchar("scheduledTime", { length: 5 }),   // HH:MM
  durationMinutes: int("durationMinutes"),
  completedAt: timestamp("completedAt"),
  score: float("score"),
  maxScore: float("maxScore"),
  percentage: float("percentage"),
  questionsAttempted: int("questionsAttempted").default(0),
  questionsCorrect: int("questionsCorrect").default(0),
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "missed"]).default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TuitionSession = typeof tuitionSessions.$inferSelect;

// ─── Indian Holidays ──────────────────────────────────────────────────────────
// Pre-seeded national + major regional holidays for 20-month plan scheduling
export const indianHolidays = mysqlTable("indian_holidays", {
  id: int("id").autoincrement().primaryKey(),
  holidayDate: varchar("holidayDate", { length: 10 }).notNull().unique(), // YYYY-MM-DD
  name: varchar("name", { length: 256 }).notNull(),
  type: mysqlEnum("type", ["national", "regional", "festival", "exam_related"]).notNull(),
  isStudyOff: boolean("isStudyOff").default(true).notNull(),  // skip lesson on this day
  description: text("description"),
});
export type IndianHoliday = typeof indianHolidays.$inferSelect;

// ─── 20-Month Adaptive Lesson Plan ───────────────────────────────────────────
// Pre-generated day-by-day lesson plan for each student
export const lessonPlanDays = mysqlTable("lesson_plan_days", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planDate: varchar("planDate", { length: 10 }).notNull(),     // YYYY-MM-DD
  monthNumber: int("monthNumber").notNull(),                   // 1-20
  weekNumber: int("weekNumber").notNull(),                     // 1-87 approx
  dayOfWeek: mysqlEnum("dayOfWeek", ["mon","tue","wed","thu","fri","sat","sun"]).notNull(),
  isHoliday: boolean("isHoliday").default(false).notNull(),
  holidayName: varchar("holidayName", { length: 256 }),
  chapterId: varchar("chapterId", { length: 64 }),
  subjectId: varchar("subjectId", { length: 64 }),
  sessionType: mysqlEnum("sessionType", ["lesson_30min","exam_15min","exam_60min","revision","holiday","mock_test"]),
  mockTestId: varchar("mockTestId", { length: 64 }),           // if sessionType = mock_test
  isCompleted: boolean("isCompleted").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  isRescheduled: boolean("isRescheduled").default(false).notNull(),
  originalDate: varchar("originalDate", { length: 10 }),       // if rescheduled
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LessonPlanDay = typeof lessonPlanDays.$inferSelect;

// ─── Mock Test Schedule ───────────────────────────────────────────────────────
// Pre-generated mock tests with calendar-based unlock dates
export const mockTestSchedule = mysqlTable("mock_test_schedule", {
  id: int("id").autoincrement().primaryKey(),
  mockTestId: varchar("mockTestId", { length: 64 }).notNull().unique(),
  examId: varchar("examId", { length: 64 }).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  testType: mysqlEnum("testType", ["subject_mock", "full_mock", "weekly_test"]).notNull(),
  subjectId: varchar("subjectId", { length: 64 }),
  monthNumber: int("monthNumber"),                             // which month it unlocks
  scheduledUnlockDate: varchar("scheduledUnlockDate", { length: 10 }), // YYYY-MM-DD
  durationMinutes: int("durationMinutes").default(180),
  totalMarks: int("totalMarks").default(300),
  totalQuestions: int("totalQuestions").default(90),
  sectionConfig: json("sectionConfig").$type<Array<{
    subjectId: string;
    questionCount: number;
    marks: number;
    durationMinutes?: number;
  }>>(),
  questionIds: json("questionIds").$type<number[]>(),
  isPreGenerated: boolean("isPreGenerated").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MockTestSchedule = typeof mockTestSchedule.$inferSelect;

// ─── Chapter Performance Heatmap ──────────────────────────────────────────────
// Real-time chapter-wise performance color band per student
export const chapterHeatmap = mysqlTable("chapter_heatmap", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chapterId: varchar("chapterId", { length: 64 }).notNull(),
  subjectId: varchar("subjectId", { length: 64 }).notNull(),
  heatmapScore: float("heatmapScore").default(0).notNull(),    // 0-100 composite score
  colorBand: mysqlEnum("colorBand", ["red", "amber", "green", "unstarted"]).default("unstarted").notNull(),
  // Score breakdown
  assessmentAvgScore: float("assessmentAvgScore").default(0),
  pastPaperAvgScore: float("pastPaperAvgScore").default(0),
  mockTestAvgScore: float("mockTestAvgScore").default(0),
  attemptsCount: int("attemptsCount").default(0),
  // Trend
  previousColorBand: mysqlEnum("previousColorBand", ["red", "amber", "green", "unstarted"]).default("unstarted"),
  trendDirection: mysqlEnum("trendDirection", ["improving", "stable", "declining", "new"]).default("new"),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ChapterHeatmap = typeof chapterHeatmap.$inferSelect;

// ─── JEE Score Predictions ────────────────────────────────────────────────────
// AI-generated score prediction per student, updated after each assessment
export const jeeScorePredictions = mysqlTable("jee_score_predictions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  examId: varchar("examId", { length: 64 }).notNull(),         // jee_main or jee_advanced
  // Predicted scores
  predictedScore: float("predictedScore").notNull(),           // e.g. 187 out of 300
  maxPossibleScore: float("maxPossibleScore").notNull(),        // e.g. 300
  optimisticScore: float("optimisticScore"),                   // best case
  conservativeScore: float("conservativeScore"),               // worst case
  confidencePercent: float("confidencePercent").default(50),   // 0-100
  // Rank prediction
  predictedRank: int("predictedRank"),
  predictedRankRange: json("predictedRankRange").$type<{ min: number; max: number }>(),
  // Breakdown
  subjectScores: json("subjectScores").$type<Record<string, {
    predicted: number;
    max: number;
    confidence: number;
  }>>(),
  weakChapters: json("weakChapters").$type<Array<{
    chapterId: string;
    title: string;
    currentScore: number;
    potentialGain: number;
  }>>(),
  recommendations: json("recommendations").$type<string[]>(),
  // Trajectory
  scoreHistory: json("scoreHistory").$type<Array<{
    date: string;
    score: number;
  }>>(),
  // Meta
  dataPointsUsed: int("dataPointsUsed").default(0),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type JeeScorePrediction = typeof jeeScorePredictions.$inferSelect;

// ─── Proctoring Events ────────────────────────────────────────────────────────
// Real-time anti-cheating event log during proctored exams
export const proctoringEvents = mysqlTable("proctoring_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  attemptId: int("attemptId"),                                 // assessmentAttempt.id or mockTestAttempt.id
  attemptType: mysqlEnum("attemptType", ["chapter_test", "subject_mock", "full_mock", "weekly_test"]).notNull(),
  eventType: mysqlEnum("eventType", [
    "face_not_detected",
    "multiple_faces",
    "gaze_away",
    "tab_switch",
    "window_blur",
    "fullscreen_exit",
    "keyboard_shortcut",
    "copy_attempt",
    "paste_attempt",
    "right_click",
    "exam_started",
    "exam_submitted",
    "warning_issued",
    "auto_submitted",
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("low").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  durationSeconds: int("durationSeconds"),                     // how long the event lasted
  metadata: json("metadata").$type<Record<string, unknown>>(), // extra data (gaze coords, etc.)
  warningNumber: int("warningNumber"),                         // 1, 2, or 3
});
export type ProctoringEvent = typeof proctoringEvents.$inferSelect;

// ─── Proctoring Reports ───────────────────────────────────────────────────────
// Summary report per exam attempt for admin review
export const proctoringReports = mysqlTable("proctoring_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  attemptId: int("attemptId").notNull(),
  attemptType: mysqlEnum("attemptType", ["chapter_test", "subject_mock", "full_mock", "weekly_test"]).notNull(),
  suspiciousScore: float("suspiciousScore").default(0).notNull(), // 0-100 (higher = more suspicious)
  totalEvents: int("totalEvents").default(0).notNull(),
  highSeverityEvents: int("highSeverityEvents").default(0),
  tabSwitches: int("tabSwitches").default(0),
  faceNotDetectedCount: int("faceNotDetectedCount").default(0),
  gazeAwayCount: int("gazeAwayCount").default(0),
  warningsIssued: int("warningsIssued").default(0),
  wasAutoSubmitted: boolean("wasAutoSubmitted").default(false).notNull(),
  reviewStatus: mysqlEnum("reviewStatus", ["pending", "reviewed_clean", "reviewed_flagged", "invalidated"]).default("pending"),
  reviewedBy: int("reviewedBy"),                               // admin userId
  reviewNotes: text("reviewNotes"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ProctoringReport = typeof proctoringReports.$inferSelect;

// ─── Weekly Performance Summary ──────────────────────────────────────────────
// Aggregated weekly stats for performance dashboard charts
export const weeklyPerformance = mysqlTable("weekly_performance", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weekStartDate: varchar("weekStartDate", { length: 10 }).notNull(), // YYYY-MM-DD (Monday)
  weekNumber: int("weekNumber").notNull(),                     // ISO week number
  year: int("year").notNull(),
  // Scores
  avgScore: float("avgScore").default(0),
  chaptersCompleted: int("chaptersCompleted").default(0),
  assessmentsTaken: int("assessmentsTaken").default(0),
  mockTestsTaken: int("mockTestsTaken").default(0),
  studyMinutes: int("studyMinutes").default(0),
  // Subject breakdown
  physicsAvg: float("physicsAvg").default(0),
  chemistryAvg: float("chemistryAvg").default(0),
  mathematicsAvg: float("mathematicsAvg").default(0),
  // Heatmap snapshot
  greenChapters: int("greenChapters").default(0),
  amberChapters: int("amberChapters").default(0),
  redChapters: int("redChapters").default(0),
  // Prediction at end of week
  predictedJeeMainScore: float("predictedJeeMainScore"),
  predictedJeeAdvancedScore: float("predictedJeeAdvancedScore"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WeeklyPerformance = typeof weeklyPerformance.$inferSelect;

// ─── Institutes (SaaS Multi-Tenant) ──────────────────────────────────────────
// An institute is a school, coaching center, or university using the platform
export const institutes = mysqlTable("institutes", {
  id: int("id").autoincrement().primaryKey(),
  instituteId: varchar("instituteId", { length: 64 }).notNull().unique(), // e.g. "allen_kota"
  name: varchar("name", { length: 256 }).notNull(),
  shortName: varchar("shortName", { length: 64 }),
  code: varchar("code", { length: 32 }).unique(),                   // unique short code
  logoUrl: varchar("logoUrl", { length: 512 }),
  primaryColor: varchar("primaryColor", { length: 7 }),             // brand color hex
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 32 }),
  address: text("address"),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 128 }),
  country: varchar("country", { length: 64 }).default("India"),
  website: varchar("website", { length: 512 }),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["trial", "basic", "standard", "premium", "enterprise"]).default("trial").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  maxStudents: int("maxStudents").default(100),
  maxTeachers: int("maxTeachers").default(10),
  enrollmentModel: mysqlEnum("enrollmentModel", ["institute_led", "self_enrolled", "hybrid"]).default("self_enrolled").notNull(),
  onboardedBy: int("onboardedBy"),                                  // super admin userId who approved
  isActive: boolean("isActive").default(true).notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Institute = typeof institutes.$inferSelect;

// ─── Update users.role to 5-tier SaaS roles ──────────────────────────────────
// NOTE: The users table role enum is extended via ALTER TABLE migration below.
// Roles: super_admin | institute_admin | teacher | student | parent | user (legacy)

// ─── Institute Members ────────────────────────────────────────────────────────
// Links a user to an institute with a specific role
export const instituteMembers = mysqlTable("institute_members", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  instituteId: int("instituteId").notNull(),
  role: mysqlEnum("role", ["institute_admin", "teacher", "student", "parent"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  invitedBy: int("invitedBy"),                                      // userId of who invited them
  inviteToken: varchar("inviteToken", { length: 128 }),
  inviteAcceptedAt: timestamp("inviteAcceptedAt"),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InstituteMember = typeof instituteMembers.$inferSelect;

// ─── Classes ──────────────────────────────────────────────────────────────────
// A class belongs to an institute and is managed by a teacher
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  classId: varchar("classId", { length: 64 }).notNull().unique(),
  instituteId: int("instituteId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),                 // e.g. "JEE 2026 Batch A"
  grade: mysqlEnum("grade", ["11", "12", "dropper", "integrated"]).notNull(),
  teacherId: int("teacherId"),                                      // primary teacher
  academicYear: varchar("academicYear", { length: 16 }),            // e.g. "2025-26"
  examFocus: varchar("examFocus", { length: 64 }).default("jee_main"), // jee_main, jee_advanced, both
  maxStudents: int("maxStudents").default(60),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Class = typeof classes.$inferSelect;

// ─── Class Enrollments ────────────────────────────────────────────────────────
export const classEnrollments = mysqlTable("class_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  studentId: int("studentId").notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
});

// ─── Parent-Student Links ─────────────────────────────────────────────────────
export const parentStudentLinks = mysqlTable("parent_student_links", {
  id: int("id").autoincrement().primaryKey(),
  parentId: int("parentId").notNull(),
  studentId: int("studentId").notNull(),
  relationship: mysqlEnum("relationship", ["father", "mother", "guardian", "other"]).default("guardian").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ParentStudentLink = typeof parentStudentLinks.$inferSelect;

// ─── Institution Content Uploads ──────────────────────────────────────────────
// Universities/institutes can upload their own content to augment the knowledge base
export const institutionContent = mysqlTable("institution_content", {
  id: int("id").autoincrement().primaryKey(),
  contentId: varchar("contentId", { length: 64 }).notNull().unique(),
  instituteId: int("instituteId"),                                  // null = global platform content
  uploadedBy: int("uploadedBy").notNull(),
  contentType: mysqlEnum("contentType", [
    "mock_test",
    "model_paper",
    "chapter_dump",
    "question_bank",
    "lecture_notes",
    "formula_sheet",
    "previous_year_paper",
    "reference_material",
  ]).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  fileUrl: varchar("fileUrl", { length: 1024 }),                    // S3 URL
  fileKey: varchar("fileKey", { length: 512 }),                     // S3 key
  fileType: varchar("fileType", { length: 32 }),                    // pdf, docx, csv, xlsx
  fileSizeBytes: int("fileSizeBytes"),
  chapterId: varchar("chapterId", { length: 64 }),                  // linked chapter (if applicable)
  subjectId: varchar("subjectId", { length: 64 }),
  examId: varchar("examId", { length: 64 }),
  targetGrade: mysqlEnum("targetGrade", ["11", "12", "both", "dropper"]).default("both"),
  parsedStatus: mysqlEnum("parsedStatus", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  parsedAt: timestamp("parsedAt"),
  parsedData: json("parsedData").$type<Record<string, unknown>>(),  // extracted questions/content
  questionsExtracted: int("questionsExtracted").default(0),
  isPublic: boolean("isPublic").default(false).notNull(),           // visible to all students or just institute
  isApproved: boolean("isApproved").default(false).notNull(),       // super admin approval required
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InstitutionContent = typeof institutionContent.$inferSelect;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", [
    "lesson_overdue",
    "mock_test_unlocked",
    "mock_test_overdue",
    "streak_at_risk",
    "chapter_unlocked",
    "assessment_reminder",
    "weak_chapter_alert",
    "plan_behind_alert",
    "score_milestone",
    "weekly_summary",
    "admin_broadcast",
    "teacher_message",
    "parent_report",
    "system",
  ]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  urgency: mysqlEnum("urgency", ["info", "warning", "critical", "success"]).default("info").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedId: varchar("relatedId", { length: 64 }),                  // chapterId, mockTestId, etc.
  relatedType: varchar("relatedType", { length: 64 }),              // "chapter", "mock_test", "assessment"
  actionUrl: varchar("actionUrl", { length: 512 }),                 // deep link to relevant page
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
});
export type Notification = typeof notifications.$inferSelect;

// ─── Notification Preferences ─────────────────────────────────────────────────
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  lessonReminders: boolean("lessonReminders").default(true).notNull(),
  mockTestAlerts: boolean("mockTestAlerts").default(true).notNull(),
  streakAlerts: boolean("streakAlerts").default(true).notNull(),
  weeklyDigest: boolean("weeklyDigest").default(true).notNull(),
  parentReports: boolean("parentReports").default(true).notNull(),
  teacherMessages: boolean("teacherMessages").default(true).notNull(),
  achievementAlerts: boolean("achievementAlerts").default(true).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Avatar Sessions ──────────────────────────────────────────────────────────
// Tracks AI avatar tutor interaction sessions
export const avatarSessions = mysqlTable("avatar_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chapterId: varchar("chapterId", { length: 64 }),
  sessionType: mysqlEnum("sessionType", ["lesson_narration", "doubt_clarification", "parent_report", "welcome"]).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
  durationSeconds: int("durationSeconds"),
  doubtsAsked: int("doubtsAsked").default(0),
  sectionsCompleted: json("sectionsCompleted").$type<string[]>(),   // which narration sections were completed
  voiceInputUsed: boolean("voiceInputUsed").default(false).notNull(),
  doubtsLog: json("doubtsLog").$type<Array<{ question: string; answer: string; timestamp: string }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AvatarSession = typeof avatarSessions.$inferSelect;

// ─── Student Profiles (extended info beyond users table) ──────────────────────
export const studentProfiles = mysqlTable("student_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  instituteId: int("instituteId"),                                  // null for standalone students
  enrollmentModel: mysqlEnum("enrollmentModel", ["institute", "standalone", "parent_enrolled"]).default("standalone").notNull(),
  targetExam: varchar("targetExam", { length: 64 }).default("jee_main"),
  targetYear: int("targetYear"),                                    // e.g. 2027
  currentGrade: mysqlEnum("currentGrade", ["11", "12", "dropper"]).default("11"),
  schoolName: varchar("schoolName", { length: 256 }),
  city: varchar("city", { length: 128 }),
  state: varchar("state", { length: 128 }),
  planStartDate: timestamp("planStartDate"),                        // when 20-month plan started
  planEndDate: timestamp("planEndDate"),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "premium", "institute"]).default("free").notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  avatarPreference: varchar("avatarPreference", { length: 32 }).default("priya"), // avatar name
  voicePreference: varchar("voicePreference", { length: 64 }),     // preferred TTS voice
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StudentProfile = typeof studentProfiles.$inferSelect;

// ─── Teacher Profiles ─────────────────────────────────────────────────────────
export const teacherProfiles = mysqlTable("teacher_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  instituteId: int("instituteId").notNull(),
  subjects: json("subjects").$type<string[]>(),                    // ["physics", "chemistry"]
  qualification: varchar("qualification", { length: 256 }),
  experienceYears: int("experienceYears"),
  bio: text("bio"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TeacherProfile = typeof teacherProfiles.$inferSelect;

// ─── Doubt Board ──────────────────────────────────────────────────────────────
// Students post doubts; teachers and AI can respond
export const doubtBoard = mysqlTable("doubt_board", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  chapterId: varchar("chapterId", { length: 64 }),
  questionText: text("questionText").notNull(),
  questionImageUrl: varchar("questionImageUrl", { length: 512 }),
  aiAnswer: text("aiAnswer"),
  aiAnsweredAt: timestamp("aiAnsweredAt"),
  teacherAnswer: text("teacherAnswer"),
  teacherAnsweredBy: int("teacherAnsweredBy"),
  teacherAnsweredAt: timestamp("teacherAnsweredAt"),
  status: mysqlEnum("status", ["open", "ai_answered", "teacher_answered", "resolved"]).default("open").notNull(),
  upvotes: int("upvotes").default(0),
  isPublic: boolean("isPublic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DoubtBoard = typeof doubtBoard.$inferSelect;

// ─── Invite Tokens ────────────────────────────────────────────────────────────
// Used for invite-based onboarding of all roles
export const inviteTokens = mysqlTable("invite_tokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["institute_admin", "teacher", "student", "parent"]).notNull(),
  instituteId: int("instituteId"),
  classId: int("classId"),
  linkedStudentId: int("linkedStudentId"),          // for parent invites: links to student
  invitedBy: int("invitedBy").notNull(),             // userId of who sent the invite
  expiresAt: timestamp("expiresAt").notNull(),
  usedAt: timestamp("usedAt"),
  isUsed: boolean("isUsed").default(false).notNull(),
  metadata: json("metadata").$type<Record<string, string>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type InviteToken = typeof inviteTokens.$inferSelect;

// ─── Institute Settings ───────────────────────────────────────────────────────
export const instituteSettings = mysqlTable("institute_settings", {
  id: int("id").autoincrement().primaryKey(),
  instituteId: int("instituteId").notNull().unique(),
  brandColor: varchar("brandColor", { length: 32 }).default("#2563eb"),
  logoUrl: varchar("logoUrl", { length: 512 }),
  customDomain: varchar("customDomain", { length: 256 }),
  maxStudents: int("maxStudents").default(500),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "basic", "pro", "enterprise"]).default("free").notNull(),
  subscriptionExpiry: timestamp("subscriptionExpiry"),
  featuresEnabled: json("featuresEnabled").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InstituteSettings = typeof instituteSettings.$inferSelect;

// ─── Role Sessions (Audit Trail) ──────────────────────────────────────────────
export const roleSessions = mysqlTable("role_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: varchar("role", { length: 64 }).notNull(),
  instituteId: int("instituteId"),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  loginAt: timestamp("loginAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
  logoutAt: timestamp("logoutAt"),
});
export type RoleSession = typeof roleSessions.$inferSelect;

// ─── Onboarding Progress ──────────────────────────────────────────────────────
export const onboardingProgress = mysqlTable("onboarding_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  role: varchar("role", { length: 64 }).notNull(),
  step: mysqlEnum("step", ["role_selected", "profile_complete", "institute_linked", "class_assigned", "ready"]).default("role_selected").notNull(),
  completedSteps: json("completedSteps").$type<string[]>(),
  instituteId: int("instituteId"),
  inviteTokenId: int("inviteTokenId"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;

// ─── Institute Subjects (per-institute subject catalog) ───────────────────────
export const instituteSubjects = mysqlTable("institute_subjects", {
  id: int("id").autoincrement().primaryKey(),
  instituteId: int("instituteId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  code: varchar("code", { length: 32 }),
  description: text("description"),
  colorHex: varchar("colorHex", { length: 7 }).default("#6366f1"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InstituteSubject = typeof instituteSubjects.$inferSelect;

// ─── Teacher-Class-Subject Assignments ───────────────────────────────────────
export const teacherClassSubjects = mysqlTable("teacher_class_subjects", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(),
  classId: int("classId").notNull(),
  subjectId: int("subjectId").notNull(),
  instituteId: int("instituteId").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});
export type TeacherClassSubject = typeof teacherClassSubjects.$inferSelect;

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendance = mysqlTable("attendance", {
  id: int("id").autoincrement().primaryKey(),
  instituteId: int("instituteId").notNull(),
  classId: int("classId").notNull(),
  studentId: int("studentId").notNull(),
  subjectId: int("subjectId"),                                        // null = general/daily
  date: varchar("date", { length: 10 }).notNull(),                   // YYYY-MM-DD
  status: mysqlEnum("status", ["present", "absent", "late", "excused"]).notNull(),
  markedBy: int("markedBy").notNull(),                               // teacherId
  remarks: varchar("remarks", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Attendance = typeof attendance.$inferSelect;

// ─── Assignments ──────────────────────────────────────────────────────────────
export const instituteAssignments = mysqlTable("institute_assignments", {
  id: int("id").autoincrement().primaryKey(),
  instituteId: int("instituteId").notNull(),
  classId: int("classId").notNull(),
  subjectId: int("subjectId").notNull(),
  teacherId: int("teacherId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  description: text("description"),
  dueDate: varchar("dueDate", { length: 10 }),                       // YYYY-MM-DD
  maxMarks: int("maxMarks").default(100),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InstituteAssignment = typeof instituteAssignments.$inferSelect;

// ─── Assignment Submissions ───────────────────────────────────────────────────
export const assignmentSubmissions = mysqlTable("assignment_submissions", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  studentId: int("studentId").notNull(),
  instituteId: int("instituteId").notNull(),
  fileUrl: varchar("fileUrl", { length: 1024 }),
  textContent: text("textContent"),
  grade: int("grade"),
  feedback: text("feedback"),
  gradedBy: int("gradedBy"),
  gradedAt: timestamp("gradedAt"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;

// ─── Audit Logs ───────────────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  instituteId: int("instituteId"),
  action: varchar("action", { length: 128 }).notNull(),              // e.g. "user.create", "login.failed"
  targetType: varchar("targetType", { length: 64 }),                 // "user", "class", "assignment"
  targetId: varchar("targetId", { length: 64 }),
  details: json("details").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: varchar("userAgent", { length: 512 }),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AuditLog = typeof auditLogs.$inferSelect;

// ─── Online Classes (Teacher-created live sessions) ───────────────────────────
export const onlineClasses = mysqlTable("online_classes", {
  id: int("id").autoincrement().primaryKey(),
  instituteId: int("instituteId").notNull(),
  classId: int("classId").notNull(),
  subjectId: int("subjectId"),
  teacherId: int("teacherId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  meetingUrl: varchar("meetingUrl", { length: 1024 }),
  scheduledAt: timestamp("scheduledAt").notNull(),
  durationMinutes: int("durationMinutes").default(60).notNull(),
  status: mysqlEnum("status", ["scheduled", "live", "ended", "cancelled"]).default("scheduled").notNull(),
  recordingUrl: varchar("recordingUrl", { length: 1024 }),
  webcamRequired: boolean("webcamRequired").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OnlineClass = typeof onlineClasses.$inferSelect;

// ─── Lesson Plans ─────────────────────────────────────────────────────────────
export const lessonPlans = mysqlTable("lesson_plans", {
  id: int("id").autoincrement().primaryKey(),
  instituteId: int("instituteId").notNull(),
  classId: int("classId").notNull(),
  subjectId: int("subjectId"),
  teacherId: int("teacherId").notNull(),
  chapterId: varchar("chapterId", { length: 64 }),
  date: varchar("date", { length: 16 }).notNull(),                   // "YYYY-MM-DD"
  title: varchar("title", { length: 256 }).notNull(),
  objectives: text("objectives"),
  activities: text("activities"),
  resources: text("resources"),
  homework: text("homework"),
  estimatedMinutes: int("estimatedMinutes").default(45),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  isAiGenerated: boolean("isAiGenerated").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LessonPlan = typeof lessonPlans.$inferSelect;

// ─── Bridge Courses (AI-suggested remedial topics) ────────────────────────────
export const bridgeCourses = mysqlTable("bridge_courses", {
  id: int("id").autoincrement().primaryKey(),
  instituteId: int("instituteId").notNull(),
  studentId: int("studentId").notNull(),
  teacherId: int("teacherId"),
  chapterId: varchar("chapterId", { length: 64 }),
  reason: text("reason"),                                            // Why this bridge is needed
  aiSuggestion: text("aiSuggestion"),                               // Full AI-generated plan
  weakTopics: json("weakTopics").$type<string[]>(),                 // Specific weak areas
  status: mysqlEnum("status", ["pending", "approved", "rejected", "completed"]).default("pending").notNull(),
  teacherNote: text("teacherNote"),
  approvedAt: timestamp("approvedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BridgeCourse = typeof bridgeCourses.$inferSelect;

// ─── Low Attendance Alerts ────────────────────────────────────────────────────
export const lowAttendanceAlerts = mysqlTable("low_attendance_alerts", {
  id: int("id").autoincrement().primaryKey(),
  instituteId: int("instituteId").notNull(),
  studentId: int("studentId").notNull(),
  classId: int("classId").notNull(),
  month: varchar("month", { length: 7 }).notNull(),                  // "YYYY-MM"
  attendancePercent: float("attendancePercent").notNull(),
  notifiedAdmin: boolean("notifiedAdmin").default(false).notNull(),
  notifiedParent: boolean("notifiedParent").default(false).notNull(),
  adminAlertSentAt: timestamp("adminAlertSentAt"),
  parentAlertSentAt: timestamp("parentAlertSentAt"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LowAttendanceAlert = typeof lowAttendanceAlerts.$inferSelect;

// ─── Fee Records ──────────────────────────────────────────────────────────────
export const feeRecords = mysqlTable("fee_records", {
  id: int("id").autoincrement().primaryKey(),
  instituteId: int("instituteId").notNull(),
  studentId: int("studentId").notNull(),                             // institute_members.id
  classId: int("classId"),                                           // classes.id (optional)
  feeType: varchar("feeType", { length: 64 }).notNull(),             // "tuition", "exam", "lab", "misc"
  description: varchar("description", { length: 256 }),
  amount: float("amount").notNull(),                                 // Total fee amount
  dueDate: timestamp("dueDate").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "waived"]).default("pending").notNull(),
  reminderSentAt: timestamp("reminderSentAt"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FeeRecord = typeof feeRecords.$inferSelect;

// ─── Fee Payments ─────────────────────────────────────────────────────────────
export const feePayments = mysqlTable("fee_payments", {
  id: int("id").autoincrement().primaryKey(),
  feeRecordId: int("feeRecordId").notNull(),                         // feeRecords.id
  instituteId: int("instituteId").notNull(),
  studentId: int("studentId").notNull(),
  amountPaid: float("amountPaid").notNull(),
  paymentDate: timestamp("paymentDate").defaultNow().notNull(),
  paymentMode: varchar("paymentMode", { length: 64 }),               // "cash", "upi", "bank_transfer", "cheque"
  transactionRef: varchar("transactionRef", { length: 128 }),
  recordedBy: int("recordedBy"),                                     // institute_members.id of admin
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FeePayment = typeof feePayments.$inferSelect;

// ─── User Streaks (Gamification) ──────────────────────────────────────────────
export const userStreaks = mysqlTable("user_streaks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActivityDate: varchar("lastActivityDate", { length: 10 }),
  totalActiveDays: int("totalActiveDays").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserStreak = typeof userStreaks.$inferSelect;

// ─── XP Ledger (Gamification) ─────────────────────────────────────────────────
export const xpLedger = mysqlTable("xp_ledger", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 64 }).notNull(),
  xpEarned: int("xpEarned").notNull(),
  description: varchar("description", { length: 256 }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type XpLedger = typeof xpLedger.$inferSelect;

// ─── User XP Summary (Gamification) ──────────────────────────────────────────
export const userXpSummary = mysqlTable("user_xp_summary", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  totalXp: int("totalXp").default(0).notNull(),
  weeklyXp: int("weeklyXp").default(0).notNull(),
  level: int("level").default(1).notNull(),
  badges: json("badges").$type<string[]>(),
  weekStartDate: varchar("weekStartDate", { length: 10 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserXpSummary = typeof userXpSummary.$inferSelect;

// ─── Adaptive Study Plans (AI-generated) ─────────────────────────────────────
export const adaptiveStudyPlans = mysqlTable("adaptive_study_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  examId: varchar("examId", { length: 64 }),
  targetExamDate: varchar("targetExamDate", { length: 10 }),
  weekStart: varchar("weekStart", { length: 10 }).notNull(),
  generatedPlan: json("generatedPlan").$type<{
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
  }>(),
  weakChapters: json("weakChapters").$type<string[]>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AdaptiveStudyPlan = typeof adaptiveStudyPlans.$inferSelect;
