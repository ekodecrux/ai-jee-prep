# ExamForge AI — JEE Master Prep Platform

A full-stack, multi-tenant educational ERP platform built for JEE (and any competitive exam) preparation. Supports **5 user roles** with fully separated portals, real-time live classes, Stripe fee payments, PDF report cards, AI-powered content generation, and a comprehensive Institute management system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Node.js, Express 4, tRPC 11 |
| Database | MySQL / TiDB (via Drizzle ORM) |
| Auth | Manus OAuth (JWT session cookies) |
| Payments | Stripe Checkout + Webhooks |
| Live Classes | Jitsi Meet (embedded iframe) |
| PDF Generation | jsPDF (client-side) |
| Email | SMTP (Nodemailer) |
| Storage | S3 (file uploads) |
| AI/LLM | Built-in Forge API (GPT-4 class) |

---

## User Roles & Portals

| Role | Portal URL | Features |
|---|---|---|
| **Student** | `/dashboard` | Chapters, Study Plan, Assignments, Report Card, Live Classes, Performance |
| **Teacher** | `/teacher` | Classes, Lesson Plans, Assignments, Grading, Live Classes (Jitsi), Tests |
| **Parent** | `/parent` | Child Overview, Attendance, Report Card, Assignments, Fee Payments (Stripe) |
| **Institute Admin** | `/institute-admin` | Users, Classes, Fees, Attendance, Alerts, Settings |
| **Super Admin** | `/super-admin` | All Institutes, Onboarding, Analytics, System Health |

---

## Key Features

### Multi-Tenant Architecture
- Each institute is isolated with its own members, classes, and data
- Role-based access control enforced at both API and UI layers
- Institute self-registration with auto-generated invite links for all roles
- Welcome email sent to Institute Admin with shareable invite links

### Content & Learning
- 80 JEE chapters seeded with weightage, difficulty, and study plan data
- AI-generated narration scripts (3000+ words per chapter)
- MCQ, NAT, Integer, and Multi-correct question types
- 20-month adaptive study plan with Indian holiday awareness
- Chapter performance heatmap (green/amber/red)
- JEE score prediction engine

### Live Classes
- Jitsi Meet embedded directly in Teacher and Student portals
- Teachers schedule sessions; students see upcoming classes and join with one click
- Room names derived from session IDs for security

### Fee Management
- Institute Admin creates fee records per student
- Parents pay fees via Stripe Checkout from their portal
- Stripe webhook auto-updates fee status to "paid"
- Monthly fee collection reports

### Report Cards
- PDF report cards downloadable by Students and Parents
- Shows attendance %, subject-wise grades, assessment scores, teacher remarks

### Assignments
- Teachers create assignments per class+subject with due dates
- Students submit answers from their portal
- Teachers grade with marks and feedback

---

## Project Structure

```
client/
  src/
    pages/          ← All portal pages (DashboardPage, TeacherPortal, ParentPortal, etc.)
    components/     ← Shared UI (PlatformLayout, JitsiMeet, ReportCard, LiveClassesTab)
    contexts/       ← Auth context
    hooks/          ← Custom hooks
    lib/trpc.ts     ← tRPC client
    App.tsx         ← Routes & role-based guards
drizzle/
  schema.ts         ← All database table definitions
  *.sql             ← Migration files
server/
  routers/          ← Feature routers (erp, assignments, fees, feePayments, reportCard)
  routers.ts        ← Root tRPC router
  db.ts             ← Query helpers
  email.ts          ← Email sending helpers
  _core/            ← Framework (OAuth, context, LLM, Stripe webhook)
shared/             ← Shared types and constants
```

---

## Database Schema

Key tables (see `drizzle/schema.ts` for full definitions):

- `users` — platform users (OAuth)
- `institutes` — multi-tenant institute records
- `instituteMembers` — user-to-institute role assignments (student/teacher/parent/institute_admin)
- `instituteClasses` — classes within an institute
- `instituteSubjects` — subjects per class
- `classSubjectTeachers` — teacher-to-class-subject mapping
- `parentStudentLinks` — parent-to-student relationships
- `attendanceRecords` — daily attendance
- `lessonPlans` — teacher lesson plans
- `onlineClasses` — live class sessions (Jitsi)
- `institute_assignments` — assignments created by teachers
- `assignment_submissions` — student submissions with grades
- `feeRecords` — fee records per student
- `feePayments` — Stripe payment records
- `inviteTokens` — role-specific invite tokens

---

## Environment Variables

The following environment variables are required (injected by the Manus platform in production):

```env
DATABASE_URL=          # MySQL/TiDB connection string
JWT_SECRET=            # Session cookie signing secret
VITE_APP_ID=           # Manus OAuth application ID
OAUTH_SERVER_URL=      # Manus OAuth backend base URL
VITE_OAUTH_PORTAL_URL= # Manus login portal URL
STRIPE_SECRET_KEY=     # Stripe secret key
VITE_STRIPE_PUBLISHABLE_KEY= # Stripe publishable key
STRIPE_WEBHOOK_SECRET= # Stripe webhook signing secret
SMTP_HOST=             # SMTP server host
SMTP_PORT=             # SMTP server port
SMTP_USER=             # SMTP username
SMTP_PASS=             # SMTP password
SMTP_FROM_EMAIL=       # From email address
SMTP_FROM_NAME=        # From display name
BUILT_IN_FORGE_API_URL= # Manus LLM API URL
BUILT_IN_FORGE_API_KEY= # Manus LLM API key
```

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm drizzle-kit generate
# Apply migration SQL via your database client

# Start development server
pnpm dev

# Run tests
pnpm test

# TypeScript check
npx tsc --noEmit
```

---

## Testing

47 Vitest tests across 4 test files:
- `server/auth.logout.test.ts` — auth flow tests
- `server/jee.test.ts` — JEE content and chapter tests
- `server/features.test.ts` — assignments and fees router tests
- `server/email.test.ts` — SMTP email service test

---

## Live Demo

Visit the deployed platform: **[jeemasterprep-f58cx8ks.manus.space](https://jeemasterprep-f58cx8ks.manus.space)**

- Click **"Preview Demo"** on any role card to explore without logging in
- Click **"Register Your Institute"** to create a new institute
- Use Stripe test card `4242 4242 4242 4242` for payment testing

---

## License

MIT
