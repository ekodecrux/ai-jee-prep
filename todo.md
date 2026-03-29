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

## Phase 9: Tuition Center Operating System Extensions

### Database Schema Extensions
- [x] lessonSessions table: sessionType (narration_30min/exam_15min/exam_60min/weekend_exam), chapterId, scheduledAt, completedAt, score
- [x] chapterHeatmap table: userId, chapterId, heatmapScore (0-100), colorBand (green/amber/red), lastUpdated
- [x] jeeScorePredictions table: userId, predictedScore, confidenceLevel, weakAreas, updatedAt
- [x] adaptiveLessonPlan table: planId, userId, month, week, day, chapterId, sessionType, isHoliday, holidayName
- [x] mockTestSchedule table: mockTestId, unlockDate, isPreGenerated, examType (main/advanced)
- [x] indianHolidays table: date, name, type (national/regional/festival)

### Admin Content Management Panel
- [ ] Protected /admin route (admin role only)
- [ ] Bulk content pre-generation trigger for all 80 chapters
- [ ] Generation progress tracker (real-time status per chapter)
- [ ] Narration script editor (view/edit generated content)
- [ ] Question bank manager (add/edit/delete questions per chapter)
- [ ] Chapter weightage editor
- [ ] API key management (generate, revoke, view usage stats)
- [ ] Mock test schedule manager (set unlock dates)
- [ ] Student roster and performance overview

### Tuition Center Lesson Modes
- [ ] 30-min Lesson Mode: condensed narration with key concepts only
- [ ] 15-min Weekday Exam Mode: 10 questions, timed, JEE pattern
- [ ] 1-hr Weekend Exam Mode: 30 questions, full JEE pattern, 3 subjects
- [ ] Session scheduler showing today's lesson and next session
- [ ] Lesson completion tracking per mode

### 20-Month Adaptive Study Plan
- [ ] Pre-generate 20-month calendar (Month 1-12: Class 11, Month 13-20: Class 12)
- [ ] Indian national holidays seeded: Republic Day, Holi, Independence Day, Diwali, Dussehra, Eid, Christmas, etc.
- [ ] Regional festival buffer days (no lessons on major holidays)
- [ ] Weekly schedule: Mon-Fri (30-min lesson + 15-min exam), Sat (1-hr exam), Sun (rest/revision)
- [ ] Chapter-to-month mapping for all 80 chapters
- [ ] Adaptive rescheduling when student falls behind

### Chapter Performance Heatmap
- [ ] 80-chapter heatmap grid (color-coded: green ≥80%, amber 60-79%, red <60%)
- [ ] Real-time update after every assessment attempt
- [ ] Subject-wise heatmap view (Physics / Chemistry / Mathematics)
- [ ] 20-month target: all chapters green by Month 20
- [ ] Heatmap history (track improvement over time)
- [ ] Export heatmap as progress report

### JEE Score Prediction Engine
- [ ] Per-chapter performance scoring (weighted by JEE weightage)
- [ ] Predicted JEE Main score (out of 300)
- [ ] Predicted JEE Advanced score (out of 360)
- [ ] Confidence band (optimistic / realistic / conservative)
- [ ] Weak area identification (chapters dragging score down)
- [ ] "If you improve X chapter by Y%, your score increases by Z" insights
- [ ] Score trajectory chart (monthly prediction trend)
- [ ] Target rank prediction based on score

### Adaptive Learning Engine
- [ ] Auto-detect struggling chapters (score < 60% after 2 attempts)
- [ ] Reschedule struggling chapters with extra revision sessions
- [ ] Boost fast learners (score > 90%) by unlocking next chapter early
- [ ] Weekly performance report with adaptive recommendations
- [ ] Alert when student is at risk of not completing 20-month plan

### Mock Test Pre-Generation & Schedule
- [ ] Pre-generate 20 JEE Main mock tests (1 per month)
- [ ] Pre-generate 10 JEE Advanced mock tests (1 per 2 months)
- [ ] Schedule-based unlock (mock test unlocks on specific calendar date)
- [ ] Mock test results contribute to heatmap and prediction score

## Phase 10: AI Anti-Cheating Proctoring System

### Webcam-Based Proctoring
- [ ] Webcam permission request and setup before exam starts
- [ ] Face detection using face-api.js (browser-side, no server upload)
- [ ] No face detected alert (student left screen)
- [ ] Multiple faces detected alert (someone helping)
- [ ] Gaze tracking: detect when student looks away from screen repeatedly
- [ ] Tab-switch / window-blur detection with timestamp logging
- [ ] Fullscreen enforcement: exit fullscreen = warning + timer pause
- [ ] Keyboard shortcut blocking during exam (Ctrl+C, Alt+Tab, etc.)
- [ ] Proctoring event log per attempt (timestamp, event type, severity)
- [ ] Suspicious activity score (0-100) per attempt
- [ ] Admin proctoring report: view flagged attempts with event timeline
- [ ] Student warning system: 3 warnings = exam auto-submitted

### Proctoring Database Tables
- [ ] proctoringEvents table: attemptId, userId, eventType, severity, timestamp, metadata
- [ ] proctoringReports table: attemptId, userId, suspiciousScore, flagCount, autoSubmitted, reviewStatus

## Phase 11: Comprehensive Performance Dashboard

### Dashboard Sections
- [ ] Overall JEE Readiness Score (0-100) with trend arrow
- [ ] Predicted JEE Main score (out of 300) with confidence band
- [ ] Predicted JEE Advanced score (out of 360) with confidence band
- [ ] Subject-wise readiness: Physics / Chemistry / Mathematics radar chart
- [ ] Chapter heatmap grid (80 chapters, green/amber/red)
- [ ] Weekly performance trend chart (last 8 weeks)
- [ ] Mock test performance timeline (score per mock test)
- [ ] Weekly test performance timeline
- [ ] Top 5 strongest chapters (green, high scores)
- [ ] Top 5 weakest chapters (red, needs attention)
- [ ] Study streak counter and calendar heatmap
- [ ] Time spent per subject (pie chart)
- [ ] Attempt history table with score, date, duration, proctoring flag

### Predictive Analytics
- [ ] "At current pace, you will score X in JEE Main" projection
- [ ] "To reach rank < 1000, improve these 3 chapters" recommendation
- [ ] Score trajectory: last 3 months vs next 3 months projection
- [ ] Chapter completion velocity (chapters/week) vs required pace
- [ ] Risk alert: "You are 2 weeks behind the 20-month plan"
- [ ] Adaptive recommendation cards (what to study today)

## Phase 12: Smart Notifications & Overdue Reminders

### Notification Types
- [ ] Overdue lesson alert: "You missed today's lesson on Kinematics — reschedule now"
- [ ] Overdue mock test alert: "Mock Test 3 was due yesterday — take it now"
- [ ] Streak at risk: "Study today to maintain your 7-day streak!"
- [ ] Mock test unlock notification: "Mock Test 5 is now unlocked — take it this weekend"
- [ ] Weekly summary notification: "This week: 4/5 lessons done, avg score 72%"
- [ ] Weak chapter alert: "You've scored <60% in Thermodynamics 3 times — needs revision"
- [ ] Plan behind alert: "You are 3 days behind your 20-month plan"
- [ ] Chapter unlocked notification: "Chapter 8 — Rotational Motion is now unlocked!"
- [ ] Assessment reminder: "You haven't attempted Chapter 5 assessment yet"
- [ ] Admin broadcast: teacher can send custom notifications to all students

### Notification Delivery
- [x] In-app notification bell in header with unread count badge
- [x] Notification drawer/panel with read/unread state and timestamps
- [x] Mark as read / mark all as read
- [ ] Notification categories: lesson, exam, achievement, system, admin
- [ ] Color-coded by urgency: red (overdue), amber (due today), green (achievement), blue (info)
- [ ] Manus built-in notification API for owner alerts
- [ ] Notification preferences: student can toggle which types they receive

### Notification Database
- [ ] notifications table: userId, type, title, message, urgency, isRead, relatedChapterId, relatedMockTestId, createdAt
- [ ] notificationPreferences table: userId, lessonReminders, mockTestAlerts, streakAlerts, weeklyDigest

### Automated Notification Triggers
- [ ] Daily check: scan all users for overdue lessons → create notifications
- [ ] Mock test unlock check: when scheduledUnlockDate passes → notify student
- [ ] Score milestone: first green chapter → "Congratulations!" notification
- [ ] 20-month plan risk: if missed > 5 days → urgent plan-behind notification
- [ ] Voice AI tutor: "You have 2 pending lessons" reminder on login

## Phase 13: Multi-Role Platform Architecture

### Role Hierarchy (5-Tier SaaS)
- [x] Tier 1 — Super Admin (SaaS platform owner): onboards institutes, manages subscriptions, controls global knowledge base, platform-wide analytics
- [x] Tier 2 — Institute Admin (onboarded by Super Admin): onboards teachers, students, parents for their institution; manages classes, content, API keys
- [x] Tier 3 — Teacher (onboarded by Institute Admin): manages assigned classes, creates assessments, tracks student progress, reviews proctoring
- [x] Tier 4 — Student (onboarded by Institute Admin): studies chapters, takes exams, views own heatmap and progress
- [x] Tier 5 — Parent (onboarded by Institute Admin, linked to student): read-only view of child's progress, reports, and teacher communication

### Onboarding Flow
- [ ] Super Admin logs in → sees SaaS dashboard → clicks "Onboard Institute" → fills institute details → Institute Admin account created + invite email sent
- [ ] Institute Admin logs in → sees Institute dashboard → onboards Teachers (bulk CSV or individual invite)
- [ ] Institute Admin → onboards Students (bulk CSV or individual, assigns to class)
- [ ] Institute Admin → onboards Parents (links parent to student, sends invite)
- [ ] Each role sees only their own portal with role-specific navigation and features
- [ ] Role is stored in users.role enum: super_admin | institute_admin | teacher | student | parent

### Database Schema Extensions
- [x] institutes table: id, name, code, logoUrl, contactEmail, subscriptionPlan, isActive, createdAt
- [x] instituteMembers table: userId, instituteId, role (admin/teacher/student/parent), isActive, joinedAt
- [x] classes table: id, instituteId, name, grade (11/12), teacherId, academicYear, isActive
- [x] classEnrollments table: classId, studentId, enrolledAt, isActive
- [x] parentStudentLinks table: parentId, studentId, relationship (father/mother/guardian), isVerified
- [x] institutionContent table: id, instituteId, uploadedBy, contentType (mock_test/model_paper/chapter_dump/question_bank), title, fileUrl, fileKey, parsedStatus, parsedAt, chapterId, examId, createdAt
- [x] notifications table: userId, type, title, message, urgency, isRead, relatedId, relatedType, createdAt
- [x] notificationPreferences table: userId, lessonReminders, mockTestAlerts, streakAlerts, weeklyDigest, parentReports

### Institute Admin CMS Panel (/admin)
- [ ] Institute dashboard: student count, teacher count, active classes, content uploads
- [ ] Student onboarding: bulk CSV upload, individual add, send invite link
- [ ] Teacher onboarding: add teacher, assign to class, set permissions
- [ ] Class management: create class, assign teacher, enroll students
- [ ] Content upload: drag-and-drop PDF/DOCX/CSV, auto-parse into question bank
- [ ] Mock test builder: create from uploaded content or question bank
- [ ] Model paper manager: upload and assign to students/classes
- [ ] Chapter dump ingestion: upload chapter notes → AI extracts key concepts
- [ ] API key management: generate, revoke, view usage, set rate limits
- [ ] Notification center: broadcast to all students, specific class, or individual
- [ ] Proctoring review: view flagged exams, suspicious activity reports
- [ ] Analytics overview: class-wise performance, chapter heatmap aggregates

### Teacher Portal (/teacher)
- [ ] Teacher dashboard: my classes, today's schedule, pending reviews
- [ ] Class view: enrolled students with individual progress bars
- [ ] Assign chapters: mark chapters as required for specific class
- [ ] Custom assessment builder: pick questions from bank, set timer, assign to class
- [ ] Student progress tracker: per-student heatmap, score trends, attendance
- [ ] Proctoring review: review flagged exam attempts for my students
- [ ] Send notifications: message to class or individual student/parent
- [ ] Grade book: view all assessment scores per student per chapter
- [ ] Lesson schedule: view and manage weekly lesson plan for class
- [ ] Live doubt board: students post doubts, teacher responds

### Student Portal (/learn)
- [ ] Personalized dashboard: today's lesson, pending exams, streak, heatmap
- [ ] Chapter lessons: 30-min narration, interactive examples, voice AI tutor
- [ ] Doubt clarification: voice/text input → AI answers from knowledge base
- [ ] Assessment engine: chapter tests, practice mode, timed exams
- [ ] Proctored exam: webcam monitoring, anti-cheating, auto-submit
- [ ] Performance heatmap: 80-chapter color grid with trend arrows
- [ ] Score prediction: JEE Main/Advanced predicted score with trajectory
- [ ] Study plan: 20-month calendar with today's session highlighted
- [ ] Notifications: overdue lessons, mock test alerts, achievements
- [ ] Mock tests: pre-generated, schedule-unlocked full JEE pattern tests

### Parent Portal (/parent)
- [ ] Parent dashboard: child's overall JEE readiness score
- [ ] Child's heatmap: 80-chapter performance grid (read-only)
- [ ] Weekly progress report: lessons completed, scores, time studied
- [ ] Attendance tracker: daily study session attendance
- [ ] Score prediction: child's predicted JEE rank and score
- [ ] Notification feed: alerts from teacher, platform, and child's milestones
- [ ] Teacher contact: message teacher directly from parent portal
- [ ] Comparison view: child vs class average (anonymized)
- [ ] Monthly report card: auto-generated PDF with performance summary

## Phase 14: AI Female Teacher Avatar

### Avatar Design & Animation
- [x] Animated female teacher avatar using CSS/SVG — professional saree/formal attire
- [x] Idle animation: subtle breathing, blinking, natural head movement
- [x] Speaking animation: lip-sync mouth movement synced to Web Speech API utterance events
- [x] Listening animation: avatar leans forward, ear indicator glows
- [x] Thinking animation: avatar looks up/sideways while LLM processes
- [x] Celebrating animation: avatar claps/smiles when student answers correctly
- [ ] Concerned animation: avatar shows empathy when student struggles
- [ ] Avatar appears in bottom-right corner during lessons (collapsible)
- [ ] Full-screen avatar mode for immersive lesson experience

### Voice Narration (Text-to-Speech)
- [x] Web Speech API SpeechSynthesis for lesson narration
- [ ] Female voice selection (prefer en-IN accent for Indian students)
- [ ] Adjustable speed: 0.75x / 1x / 1.25x / 1.5x
- [ ] Pause / Resume / Replay controls
- [ ] Highlighted text scroll: current sentence highlighted as avatar speaks
- [ ] Chapter section-by-section narration with pause between sections
- [ ] Mathematical formula reading: "x squared plus 2x equals zero" style

### Voice Input for Doubts (Speech-to-Text)
- [x] Web Speech API SpeechRecognition for student voice input
- [ ] Push-to-talk button: hold to speak, release to send
- [ ] Live transcription shown while speaking
- [ ] Fallback to text input if microphone unavailable
- [ ] Doubt history: list of all questions asked in this session

### AI Doubt Resolution
- [x] Student asks doubt (voice or text) → LLM answers from chapter knowledge base
- [ ] Avatar speaks the answer with lip-sync animation
- [ ] If doubt is about a formula: avatar shows formula card alongside speech
- [ ] If doubt is about a concept: avatar shows mini diagram/example
- [ ] "Explain differently" button: avatar re-explains using analogy
- [ ] "Show example" button: avatar walks through a JEE-style problem
- [ ] Doubt escalation: if AI cannot answer → flag for teacher review

### Parent-Teacher Interaction via Avatar
- [ ] Parent portal: "Ask Teacher" button → avatar acts as teacher proxy
- [ ] Parent asks about child's progress → avatar gives personalized report
- [ ] "Why is my child struggling in Thermodynamics?" → avatar explains weak areas
- [ ] "What should my child focus on this week?" → avatar gives adaptive advice
- [ ] Avatar sends weekly summary to parent in avatar video message format

### Avatar Session Tracking
- [ ] avatarSessions table: userId, chapterId, sessionType, startedAt, endedAt, doubtsAsked, sectionsCompleted
- [ ] Track which sections student listened to vs skipped
- [ ] Doubt log: store all questions and AI answers per session

## Phase 15: 3 Enrollment Models

### Model 1: Institute-Led (B2B)
- [ ] Super Admin creates institute account → sends invite to Institute Admin
- [ ] Institute Admin logs in → onboards teachers, students, parents in bulk
- [ ] Students see institute branding (logo, colors) in their portal
- [ ] Institute gets dedicated subdomain: allen.jeemasterprep.com style

### Model 2: Self-Enrolled Institute (B2B Self-Serve)
- [ ] Public landing page "Register Your Institute" form
- [ ] Institute fills: name, contact, student count, exam focus
- [ ] Auto-creates Institute Admin account → email verification → onboarding wizard
- [ ] 14-day free trial → subscription required to continue
- [ ] Super Admin gets notification of new institute registration

### Model 3: Individual/Standalone (B2C)
- [ ] Student self-enrolls: clicks "Start Learning Free" → Manus OAuth → student account created
- [ ] Parent enrolls child: clicks "Enroll My Child" → creates parent account → adds child profile
- [ ] Parent can link to existing student account or create new one
- [ ] Standalone students get full platform access (no institute branding)
- [ ] Standalone plan: free tier (10 chapters) + premium tier (all 80 chapters)
- [ ] Parent dashboard shows child's progress without institute affiliation
