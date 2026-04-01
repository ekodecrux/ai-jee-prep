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

## Phase 16: Multi-Tenant Authentication System

### Schema Extensions
- [x] inviteTokens table: token (uuid), email, role, instituteId, classId, invitedBy, expiresAt, usedAt, isUsed
- [ ] instituteSettings table: instituteId, brandColor, logoUrl, customDomain, maxStudents, subscriptionPlan, subscriptionExpiry
- [ ] roleSessions table: userId, role, instituteId, lastActiveAt (for audit trail)

### Backend Auth Middleware
- [x] requireRole(roles[]) middleware: checks ctx.user.role against allowed roles
- [x] requireInstituteAccess middleware: ensures user belongs to the institute they are accessing
- [x] inviteRouter: createInvite, validateInvite, acceptInvite, listPendingInvites, revokeInvite
- [ ] onboardingRouter: completeProfile, setRole, linkToInstitute, linkParentToStudent
- [ ] Institute-scoped data isolation: all queries filtered by instituteId for institute_admin/teacher/student/parent

### Frontend Auth Guards
- [x] RoleGuard component: wraps routes, redirects unauthorized users to correct portal
- [ ] useRoleAuth() hook: returns { role, instituteId, canAccess(route) }
- [x] Post-login redirect: super_admin → /super-admin, institute_admin → /institute-admin, teacher → /teacher, student → /dashboard, parent → /parent
- [x] Onboarding wizard: new users without role → /onboarding → select role → complete profile
- [x] Invite acceptance page: /invite/:token → validates token → creates account → assigns role

### Onboarding Flows
- [ ] Super Admin: onboard institute form (name, contact, plan, admin email) → sends invite to institute admin
- [ ] Institute Admin: bulk CSV student upload, individual teacher/parent invite with email
- [ ] Teacher: accept invite → set profile → see assigned classes
- [ ] Student: self-enroll or accept invite → set profile (grade, target year, school)
- [ ] Parent: enroll child (enter child's student ID or email) → link account → access parent portal

## Phase 17: Gap Closures

### Avatar Integration
- [x] Embed AvatarTutor in ChapterPage (bottom-right floating, collapsible)
- [x] Avatar auto-starts narrating when student opens narration tab
- [ ] Avatar listens for doubts during lesson
- [ ] Speed controls: 0.75x / 1x / 1.25x / 1.5x on avatar narration
- [ ] Sentence-by-sentence highlighted text scroll as avatar speaks

### Lesson Mode Selector
- [ ] 30-min Lesson Mode: condensed narration, key concepts, avatar narrates
- [ ] 15-min Weekday Exam Mode: 10 questions, timed, JEE pattern
- [ ] 60-min Weekend Exam Mode: 30 questions, 3 subjects, full JEE pattern
- [ ] Mode selector UI in chapter page and study plan

### Admin Bulk Generation UI
- [x] "Generate All 80 Chapters" button in Institute Admin portal
- [x] Real-time progress tracker: per-chapter status (pending/generating/done/error)
- [ ] Individual chapter regenerate button

### Automated Notification Triggers
- [x] Server-side daily check: overdue lessons → create notifications
- [x] Mock test unlock check: scheduledUnlockDate passes → notify student
- [ ] Streak at risk: no activity in 24h → notify
- [ ] Weak chapter alert: score < 60% after 2 attempts → notify
- [ ] Plan behind alert: missed > 3 days → notify

### Real Face Detection
- [ ] Integrate face-api.js (CDN) in ProctoredExam
- [ ] Real face detection: no face → warning, multiple faces → warning
- [ ] Gaze estimation: looking away repeatedly → flag

### Teacher Assessment Builder
- [ ] Pick questions from question bank by chapter/type/difficulty
- [ ] Set timer, assign to class, schedule date
- [ ] View results per student

### Parent-Teacher Avatar Interaction
- [ ] Parent portal "Ask About My Child" → avatar proxy answers from child's data

## Phase 17: Exam-Agnostic Admin Configuration Panel

### Exam Registry (pre-seeded, extensible)
- [ ] JEE Main — Engineering entrance, MCQ+NAT, 3 hrs, 300 marks
- [ ] JEE Advanced — Engineering (IIT), MCQ+NAT+Integer+Multi-correct, 3 hrs x2 papers
- [ ] NEET UG — Medical entrance, MCQ, 3 hrs 20 min, 720 marks
- [ ] GATE — Graduate engineering, MCQ+NAT, 3 hrs, 100 marks
- [ ] UPSC CSE — Civil services, subjective+MCQ, multiple stages
- [ ] CBSE Board Class 11 — Academic, MCQ+subjective
- [ ] CBSE Board Class 12 — Academic, MCQ+subjective
- [ ] State Board Class 11/12 — Academic (configurable per state)
- [ ] Custom Exam — Institute can define their own exam pattern

### Institute Admin Configuration Panel (7-Step Wizard)
- [x] Step 1: Select Exam(s) — multi-select from exam registry with descriptions
- [x] Step 2: Select Academic Curriculum — NCERT / CBSE / State Board / Custom
- [x] Step 3: Select Class Level — Class 11 only / Class 12 only / Both (11+12 integrated)
- [x] Step 4: Configure Study Duration — 12 months / 20 months / 24 months / Custom
- [x] Step 5: Configure Session Modes — enable/disable: 30-min lesson / 15-min weekday exam / 60-min weekend exam
- [x] Step 6: Configure Mock Test Schedule — auto-generate based on exam date + duration
- [x] Step 7: Review & Activate — shows summary of chapters, assessments, mock tests that will be auto-configured
- [ ] On Activate: platform auto-configures chapters, study plan, assessments, mock tests for all enrolled students

### Auto-Configuration Engine (triggered on Activate)
- [ ] Filter chapters by selected exam syllabus and assign to institute
- [ ] Set chapter ordering based on selected curriculum (NCERT flow)
- [ ] Generate monthly study plan with Indian holidays for selected duration
- [ ] Configure lesson duration limits per session mode
- [ ] Pre-create mock test schedule with unlock dates
- [ ] All student workflows auto-adapt: heatmap thresholds, score prediction, notifications

### Exam-Aware Student Experience
- [ ] Student dashboard shows only chapters relevant to institute's selected exam(s)
- [ ] Assessment questions filtered by exam type (JEE Main vs JEE Advanced vs NEET pattern)
- [ ] Mock tests follow selected exam's actual paper pattern (marks, duration, question types)
- [ ] Score prediction calibrated to selected exam (JEE Main 300 / NEET 720 / GATE 100)
- [ ] Heatmap color thresholds configurable per exam (80% for JEE, 70% for NEET)

### Teacher & Parent Visibility
- [ ] Teachers see only chapters/assessments for their institute's configured exam
- [ ] Parents see child's progress in context of selected exam
- [ ] Notifications reference the specific exam name

## Phase 14: Narration Scripts Knowledge Base

- [x] Generate AI narration scripts for all 80 JEE chapters (Physics 25, Chemistry 28, Mathematics 27)
- [x] Save scripts permanently to narration_scripts table (knowledge base — never regenerated)
- [x] Each script has 9 sections: Introduction, Conceptual Explanation, Formulas & Derivations, Solved Examples, Advanced Concepts, Exam Tips, Common Mistakes, Quick Revision Summary, Mnemonics
- [x] Total knowledge base: 185,485 words across 80 chapters
- [x] Idempotent generation script at scripts/generate-narrations.mjs (skips already-generated chapters)

## Phase 15: Multi-Tenant ERP+LMS System

### Database Schema
- [x] institutes table (tenant): id, name, code, subdomain, logo, contactEmail, plan, status, createdAt
- [x] institute_users table: id, instituteId, name, email, phone, passwordHash, role (admin|teacher|student|parent), status, createdAt
- [x] classes table: id, instituteId, name (Grade 1-12), section, classTeacherId
- [x] subjects table: id, instituteId, name, code, description
- [x] teacher_class_subjects table: teacherId, classId, subjectId, instituteId
- [x] student_enrollments table: studentId, classId, instituteId, academicYear
- [x] parent_student_map table: parentId, studentId, instituteId, relation
- [x] attendance table: studentId, classId, subjectId, date, status, markedBy, instituteId
- [x] assignments table: id, title, classId, subjectId, teacherId, dueDate, description, instituteId
- [x] assignment_submissions table: id, assignmentId, studentId, submittedAt, grade, feedback
- [x] audit_logs table: id, userId, instituteId, action, details, ip, createdAt

### Server / Auth
- [x] Multi-tenant auth middleware: validate JWT, attach instituteId+role to ctx
- [x] Institute login endpoint: email+password scoped to institute code
- [x] tRPC procedures: institutes CRUD (super admin only)
- [x] tRPC procedures: institute users CRUD (institute admin scoped)
- [x] tRPC procedures: classes, sections, subjects management
- [x] tRPC procedures: teacher-class-subject mapping
- [x] tRPC procedures: student enrollment (class assignment)
- [x] tRPC procedures: parent-student mapping
- [x] tRPC procedures: attendance marking and reports
- [x] tRPC procedures: assignments CRUD + submissions

### Super Admin Portal
- [x] Institute list page with status, plan, user counts
- [x] Create/Edit institute form (name, code, subdomain, contact, plan)
- [x] Activate/Suspend institute toggle
- [x] Global analytics: total institutes, users, active sessions
- [x] Institute Admin account creation from Super Admin

### Institute Admin Portal
- [x] User Management: Teachers list with create/edit/deactivate
- [x] User Management: Students list with create/edit/deactivate
- [x] User Management: Parents list with create/edit/deactivate
- [x] Bulk invite via email (send onboarding link)
- [x] Class Management: create classes (Grade + Section), assign class teacher
- [x] Subject Management: create subjects, assign to classes
- [x] Teacher Mapping: assign teacher to class+subject
- [x] Student Enrollment: assign student to class+section
- [x] Parent-Student Mapping: link parent to one or more students
- [ ] Institute settings page (logo, name, contact)

### Teacher Dashboard
- [ ] My Classes & Subjects view
- [ ] Attendance marking interface (class-wise)
- [ ] Assignments: create, view submissions, grade
- [ ] Study materials upload

### Student Dashboard
- [ ] My Class, Subjects, Timetable view
- [ ] View assignments and submit
- [ ] View attendance record
- [ ] View grades

### Parent Dashboard
- [ ] View linked children
- [ ] Child attendance and performance summary
- [ ] Notifications from teachers

### Tests
- [ ] Vitest: tenant isolation (user cannot access another institute's data)
- [ ] Vitest: RBAC (teacher cannot access admin routes)
- [ ] Vitest: institute user login flow

## Phase 16: ERP Feature Completions

- [x] Attendance marking UI in Teacher portal (class selector, date picker, student list, present/absent toggle)
- [x] Wire Teacher portal attendance to erp.markAttendance and erp.getAttendance procedures
- [x] Monthly attendance summary tab in Institute Admin portal
- [x] Assign-to-Class button + dialog on student rows in Institute Admin Users tab
- [x] Link Parent dialog on student rows in Institute Admin portal (search parent, set relationship)
- [x] erp.markAttendance procedure (bulk mark per class per date)
- [x] erp.getAttendance procedure (fetch attendance for class+date)
- [x] erp.getMonthlyAttendanceSummary procedure (per-student monthly stats)
- [ ] erp.getParentStudentLinks procedure (list parent-student links for an institute)

## Phase 17: Student/Parent/Teacher Advanced Features

### Database Schema
- [ ] online_classes table: id, instituteId, classId, subjectId, teacherId, title, description, meetingUrl, scheduledAt, durationMinutes, status (scheduled|live|ended), recordingUrl
- [ ] lesson_plans table: id, instituteId, classId, subjectId, teacherId, date, title, objectives, activities, resources, homework, status (draft|published), isAiGenerated
- [ ] bridge_courses table: id, instituteId, studentId, teacherId, chapterId, reason, aiSuggestion, status (pending|approved|rejected|completed), createdAt
- [ ] low_attendance_alerts table: id, instituteId, studentId, attendancePercent, alertSentAt, notifiedAdmin, notifiedParent

### Server Procedures
- [ ] erp.createOnlineClass (teacher creates class with meeting link)
- [ ] erp.listOnlineClasses (for teacher/student/parent filtered by classId)
- [ ] erp.createLessonPlan (manual lesson plan creation by teacher)
- [ ] erp.autoGenerateLessonPlan (AI-powered lesson plan generation)
- [ ] erp.listLessonPlans (for teacher/student/parent by classId+date range)
- [ ] erp.getStudentAttendanceCalendar (per-student daily attendance for heatmap)
- [ ] erp.getStudentChapterPerformance (per-chapter scores for heatmap)
- [ ] erp.getParentDashboard (child attendance, grades, lesson plans, upcoming tests)
- [ ] erp.suggestBridgeCourse (AI analyzes performance and suggests bridge topics)
- [ ] erp.approveBridgeCourse (teacher approves/rejects AI suggestion)
- [ ] erp.checkLowAttendance (scan all students, flag <75%, send alerts)

### Student Portal
- [ ] Attendance calendar heatmap (monthly grid, green=present, red=absent, amber=late)
- [ ] Monthly attendance percentage badge
- [ ] Chapter performance heatmap (80 chapters, color by score %)
- [ ] Daily activities feed: today's online classes + assigned tests + lesson plan
- [ ] Webcam-enabled test attempt UI (camera permission request, proctoring overlay)
- [ ] Bridge course suggestions card (shows AI-approved suggestions)

### Parent Portal
- [ ] Dedicated parent dashboard page (/parent-portal)
- [ ] Child selector (if parent linked to multiple students)
- [ ] Child attendance summary + calendar heatmap
- [ ] Assignment grades table
- [ ] Lesson plan read-only view (today + upcoming week)
- [ ] Upcoming mock test schedule
- [ ] Low-attendance alert banner

### Teacher Portal
- [ ] Online class creation form (title, subject, class, date/time, meeting URL, duration)
- [ ] Upcoming classes list with join/edit/cancel actions
- [ ] Test creation form (title, class, subject, questions, duration, webcam required toggle)
- [ ] Lesson plan builder: manual form (objectives, activities, resources, homework)
- [ ] AI auto-generate lesson plan button (selects chapter, calls LLM)
- [ ] Published lesson plans list visible to students and parents
- [ ] Bridge course approval queue (approve/reject AI suggestions per student)

### Low-Attendance Alerts
- [ ] Auto-scan trigger (manual from Institute Admin + scheduled)
- [ ] In-app notification to Institute Admin for flagged students
- [ ] Email alert to linked parent(s) of flagged student
- [ ] Alert history log in Institute Admin portal

## Phase 18: Teacher & Student Portal Wiring

- [x] Teacher portal: Create Class dialog wired to onlineClasses.create (meeting URL, webcam toggle, class/subject selectors, date/time picker)
- [x] Teacher portal: List upcoming online classes in Schedule tab from onlineClasses.list
- [x] Teacher portal: Lesson Plans tab with manual entry form
- [x] Teacher portal: AI auto-generate lesson plan button (topic input → AI generates full plan)
- [x] Student dashboard: Today tab shows upcoming online classes with join links
- [x] Student dashboard: Today tab shows today's lesson plan (objectives, homework)
- [x] Student dashboard: Daily activities feed sorted by scheduled time

## Phase 19: Bridge Courses, Low-Attendance Alerts, Parent Lesson Plans

- [x] Server: erp.listBridgeCourses procedure for student (list approved/pending courses for student)
- [x] Server: erp.checkAndSendAttendanceAlerts procedure (check all students <75%, create alerts, send email to parent + notify admin)
- [x] Server: erp.getParentChildLessonPlans procedure (fetch lesson plans for child's enrolled class)
- [x] Student dashboard: Bridge Courses tab wired to real data (AI suggestion card, approval status badge, progress tracking)
- [x] Student dashboard: Bridge Courses tab shows teacher-approved courses with topic list and estimated hours
- [x] Parent portal: Lesson Plans section wired to child's class lesson plans (read-only, homework highlighted)
- [x] Parent portal: Show child's upcoming online classes
- [x] Low-attendance background job: nightly cron check at 11 PM, flag <75%, create alert record, send email to parent + in-app notification to Institute Admin
- [ ] Alert history tab in Institute Admin portal showing all low-attendance alerts (pending)
