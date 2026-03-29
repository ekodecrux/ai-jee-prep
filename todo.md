# Universal Knowledge Platform — JEE Master Prep

## Architecture Decisions
- Platform is exam-agnostic: supports JEE, NEET, UPSC, GATE, academics, and more
- API-first design: full RESTful public API with versioning (/api/v1/...)
- Any ERP/LMS can integrate via API keys and consume all content
- JEE is the first "exam" seeded; schema supports multiple exams/curricula
- Chapter data enriched with: weightage, difficulty, study plan month, daily time split

## Phase 1: Database Schema & Registry
- [x] Apply full exam-agnostic schema migration (16 tables)
- [x] Seed exam registry: JEE Main, JEE Advanced
- [x] Seed subjects: Physics, Chemistry, Mathematics
- [x] Seed curricula: NCERT Class 11, NCERT Class 12

## Phase 2: Chapter Seeding with Enriched Data
- [x] Seed all 80 chapters with chapterId, subject, curriculum, prerequisites, keyTopics
- [x] Enrich each chapter with weightage level from planning doc
- [x] Enrich each chapter with difficulty rating
- [x] Add daily time split recommendations (Physics 2.5h, Chemistry 2h, Maths 3h)
- [x] Add monthly study flow data for Class 11 (12 months) and Class 12 (12 months)

## Phase 3: Content Generation (LLM)
- [x] LLM narration script generation endpoint (3000+ words per chapter)
- [x] LLM past question generation (MCQ, NAT, Integer, Multi-correct)
- [x] LLM chapter assessment generation (practice + chapter test)
- [x] Auto-generate on first chapter access if content not yet available

## Phase 4: RESTful Public API v1
- [x] Express REST router at /api/v1/ with versioning middleware
- [x] API key authentication via X-API-Key header
- [x] Rate limiting per API key
- [x] GET /api/v1/exams
- [x] GET /api/v1/subjects
- [x] GET /api/v1/chapters (with filters)
- [x] GET /api/v1/chapters/:chapterId
- [x] GET /api/v1/chapters/:chapterId/narration
- [x] GET /api/v1/questions (with filters: year, type, difficulty, source)
- [x] GET /api/v1/questions/stats
- [x] GET /api/v1/assessments
- [x] GET /api/v1/assessments/:assessmentId
- [x] GET /api/v1/search

## Phase 5: Internal tRPC API
- [x] chapters.listBySubject, listAll, getById
- [x] chapters.getUserProgress, initializeProgress, markNarrationRead, updateProgress
- [x] chapters.getDashboardSummary, getStudyPlan, search
- [x] content.getNarration, getQuestions, getAssessments, generateContent
- [x] assessments.getById, checkDailyLimit, submitAttempt
- [x] assessments.getAttemptHistory, getMockTests, checkMockTestUnlock, getAnalytics

## Phase 6: Frontend Core
- [x] Landing page: hero, features, API showcase, subject stats, how-it-works
- [x] Global sidebar navigation with subject links
- [x] Subject page: Class 11/12 separation, lock/unlock UI, weightage badges
- [x] Chapter detail page: tabbed narration, past questions, assessment
- [x] Past questions viewer: year/exam/type/difficulty filter, solution toggle
- [x] Assessment engine: MCQ, NAT, Integer type questions with timer
- [x] Practice mode: unlimited attempts with instant feedback
- [x] Timed chapter test: countdown timer, 3 attempts/day enforcement
- [x] Search page: full-text search with subject filter and quick terms
- [x] Study plan page: 24-month visual roadmap with daily schedule

## Phase 7: Dashboard & Developer Portal
- [x] Student dashboard: progress overview, subject breakdown, analytics
- [x] Performance analytics: avg score, best score, pass rate, weak topics
- [x] Mock test page: unlock status, section breakdown, progress bar
- [x] API Developer Portal: endpoint reference, code examples (curl/JS/Python)

## Phase 8: Polish & Delivery
- [x] Dark academic theme with custom CSS design tokens
- [x] Subject color coding (Physics=blue, Chemistry=green, Mathematics=orange)
- [x] Responsive layout (mobile + desktop)
- [x] Loading states and error handling throughout
- [x] 27 Vitest unit tests passing (auth, chapters, content, assessments, validation)
- [x] Zero TypeScript errors
- [x] Final checkpoint saved
