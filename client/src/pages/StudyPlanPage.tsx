import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import {
  Atom, FlaskConical, Calculator, Clock, Calendar,
  ChevronDown, ChevronRight, BookOpen, Target, CheckCircle, Lock
} from "lucide-react";

const SUBJECT_META = {
  physics: { label: "Physics", icon: Atom, color: "text-physics", bg: "subject-bg-physics subject-physics" },
  chemistry: { label: "Chemistry", icon: FlaskConical, color: "text-chemistry", bg: "subject-bg-chemistry subject-chemistry" },
  mathematics: { label: "Mathematics", icon: Calculator, color: "text-mathematics", bg: "subject-bg-mathematics subject-mathematics" },
};

// 24-month study plan structure
const STUDY_PLAN = [
  // Class 11 - Months 1-12
  { month: 1, class: 11, subject: "physics", topic: "Units & Measurements + Kinematics", dailyHours: 2.5, chapters: ["PHY_C11_01", "PHY_C11_02"] },
  { month: 2, class: 11, subject: "chemistry", topic: "Some Basic Concepts + Atomic Structure", dailyHours: 2, chapters: ["CHE_C11_01", "CHE_C11_02"] },
  { month: 3, class: 11, subject: "mathematics", topic: "Sets, Relations & Functions + Trigonometry", dailyHours: 3, chapters: ["MAT_C11_01", "MAT_C11_02"] },
  { month: 4, class: 11, subject: "physics", topic: "Laws of Motion + Work, Energy & Power", dailyHours: 2.5, chapters: ["PHY_C11_03", "PHY_C11_04"] },
  { month: 5, class: 11, subject: "chemistry", topic: "Chemical Bonding + States of Matter", dailyHours: 2, chapters: ["CHE_C11_03", "CHE_C11_04"] },
  { month: 6, class: 11, subject: "mathematics", topic: "Quadratic Equations + Sequences & Series", dailyHours: 3, chapters: ["MAT_C11_03", "MAT_C11_04"] },
  { month: 7, class: 11, subject: "physics", topic: "Rotational Motion + Gravitation", dailyHours: 2.5, chapters: ["PHY_C11_05", "PHY_C11_06"] },
  { month: 8, class: 11, subject: "chemistry", topic: "Thermodynamics + Equilibrium", dailyHours: 2, chapters: ["CHE_C11_05", "CHE_C11_06"] },
  { month: 9, class: 11, subject: "mathematics", topic: "Straight Lines + Circles + Conic Sections", dailyHours: 3, chapters: ["MAT_C11_05", "MAT_C11_06", "MAT_C11_07"] },
  { month: 10, class: 11, subject: "physics", topic: "Properties of Matter + Thermodynamics", dailyHours: 2.5, chapters: ["PHY_C11_07", "PHY_C11_08"] },
  { month: 11, class: 11, subject: "chemistry", topic: "Redox + Hydrogen + s-Block Elements", dailyHours: 2, chapters: ["CHE_C11_07", "CHE_C11_08", "CHE_C11_09"] },
  { month: 12, class: 11, subject: "mathematics", topic: "Permutations + Binomial Theorem + Limits", dailyHours: 3, chapters: ["MAT_C11_08", "MAT_C11_09", "MAT_C11_10"] },
  // Class 12 - Months 13-24
  { month: 13, class: 12, subject: "physics", topic: "Electrostatics + Current Electricity", dailyHours: 2.5, chapters: ["PHY_C12_01", "PHY_C12_02"] },
  { month: 14, class: 12, subject: "chemistry", topic: "Solid State + Solutions", dailyHours: 2, chapters: ["CHE_C12_01", "CHE_C12_02"] },
  { month: 15, class: 12, subject: "mathematics", topic: "Relations & Functions + Inverse Trig", dailyHours: 3, chapters: ["MAT_C12_01", "MAT_C12_02"] },
  { month: 16, class: 12, subject: "physics", topic: "Magnetism + Electromagnetic Induction", dailyHours: 2.5, chapters: ["PHY_C12_03", "PHY_C12_04"] },
  { month: 17, class: 12, subject: "chemistry", topic: "Electrochemistry + Chemical Kinetics", dailyHours: 2, chapters: ["CHE_C12_03", "CHE_C12_04"] },
  { month: 18, class: 12, subject: "mathematics", topic: "Matrices & Determinants + Continuity", dailyHours: 3, chapters: ["MAT_C12_03", "MAT_C12_04"] },
  { month: 19, class: 12, subject: "physics", topic: "Alternating Current + Electromagnetic Waves", dailyHours: 2.5, chapters: ["PHY_C12_05", "PHY_C12_06"] },
  { month: 20, class: 12, subject: "chemistry", topic: "Coordination Compounds + Haloalkanes", dailyHours: 2, chapters: ["CHE_C12_07", "CHE_C12_08"] },
  { month: 21, class: 12, subject: "mathematics", topic: "Integrals + Differential Equations", dailyHours: 3, chapters: ["MAT_C12_06", "MAT_C12_07"] },
  { month: 22, class: 12, subject: "physics", topic: "Optics + Modern Physics", dailyHours: 2.5, chapters: ["PHY_C12_07", "PHY_C12_08"] },
  { month: 23, class: 12, subject: "chemistry", topic: "Biomolecules + Polymers + Chemistry in Everyday Life", dailyHours: 2, chapters: ["CHE_C12_12", "CHE_C12_13", "CHE_C12_14"] },
  { month: 24, class: 12, subject: "mathematics", topic: "3D Geometry + Probability + Vectors", dailyHours: 3, chapters: ["MAT_C12_09", "MAT_C12_10", "MAT_C12_11"] },
];

const DAILY_SCHEDULE = [
  { time: "6:00–8:30 AM", subject: "Mathematics", hours: 2.5, note: "Highest focus time — tackle hardest problems" },
  { time: "9:00–11:00 AM", subject: "Physics", hours: 2, note: "Concept study + derivations" },
  { time: "11:30 AM–1:00 PM", subject: "Chemistry", hours: 1.5, note: "Theory + reactions" },
  { time: "2:00–4:00 PM", subject: "Revision", hours: 2, note: "Previous day revision + formula practice" },
  { time: "4:30–6:00 PM", subject: "Practice", hours: 1.5, note: "Solve 20–30 questions from past papers" },
  { time: "8:00–9:00 PM", subject: "Mock/Assessment", hours: 1, note: "Chapter tests or mini mock tests" },
];

export default function StudyPlanPage() {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const { data: studyPlan } = trpc.chapters.getStudyPlan.useQuery();

  const class11Months = STUDY_PLAN.filter(m => m.class === 11);
  const class12Months = STUDY_PLAN.filter(m => m.class === 12);

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="hero-gradient rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground mb-2">24-Month JEE Study Plan</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                A structured month-by-month roadmap covering all 80 chapters across Physics, Chemistry, and Mathematics.
                Follows NCERT Class 11 → Class 12 progression with daily time splits optimized for JEE preparation.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-1.5 text-xs bg-card/60 rounded-lg px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">Physics: <strong className="text-foreground">2.5h/day</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-card/60 rounded-lg px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-chemistry" />
                  <span className="text-muted-foreground">Chemistry: <strong className="text-foreground">2h/day</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-xs bg-card/60 rounded-lg px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-mathematics" />
                  <span className="text-muted-foreground">Mathematics: <strong className="text-foreground">3h/day</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily schedule */}
        <div className="mb-8">
          <h2 className="font-display font-bold text-lg text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recommended Daily Schedule
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DAILY_SCHEDULE.map((slot, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="font-mono text-xs text-primary mb-1">{slot.time}</div>
                <div className="font-semibold text-sm text-foreground">{slot.subject}</div>
                <div className="text-xs text-muted-foreground mt-1">{slot.note}</div>
                <div className="text-xs text-primary mt-2">{slot.hours}h</div>
              </div>
            ))}
          </div>
        </div>

        {/* Class 11 months */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-900/40 border border-blue-700/50 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-400">11</span>
            </div>
            <h2 className="font-display font-bold text-lg text-foreground">Class 11 — Months 1–12</h2>
          </div>
          <div className="space-y-3">
            {class11Months.map(month => {
              const meta = SUBJECT_META[month.subject as keyof typeof SUBJECT_META];
              const Icon = meta.icon;
              const isExpanded = expandedMonth === month.month;
              return (
                <div key={month.month} className={`${meta.bg} rounded-xl overflow-hidden`}>
                  <button
                    className="w-full p-4 flex items-center gap-4 text-left"
                    onClick={() => setExpandedMonth(isExpanded ? null : month.month)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-foreground">{month.month}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                        <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                      </div>
                      <div className="text-sm text-foreground mt-0.5">{month.topic}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{month.dailyHours}h/day</span>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/30">
                      <div className="pt-3 space-y-2">
                        <div className="text-xs text-muted-foreground mb-2">Chapters to cover this month:</div>
                        {month.chapters.map(chId => (
                          <Link key={chId} href={`/chapter/${chId}`}>
                            <div className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                              {chId}
                              <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
                            </div>
                          </Link>
                        ))}
                        <div className="mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                          <strong className="text-foreground">Goal:</strong> Complete narration + 60%+ in chapter assessment to unlock next chapter.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Class 12 months */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-900/40 border border-green-700/50 flex items-center justify-center">
              <span className="text-sm font-bold text-green-400">12</span>
            </div>
            <h2 className="font-display font-bold text-lg text-foreground">Class 12 — Months 13–24</h2>
            <span className="badge-medium-imp text-xs">Requires 80% Class 11 completion</span>
          </div>
          <div className="space-y-3">
            {class12Months.map(month => {
              const meta = SUBJECT_META[month.subject as keyof typeof SUBJECT_META];
              const Icon = meta.icon;
              const isExpanded = expandedMonth === month.month;
              return (
                <div key={month.month} className={`${meta.bg} rounded-xl overflow-hidden`}>
                  <button
                    className="w-full p-4 flex items-center gap-4 text-left"
                    onClick={() => setExpandedMonth(isExpanded ? null : month.month)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-foreground">{month.month}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                        <span className={`text-sm font-semibold ${meta.color}`}>{meta.label}</span>
                      </div>
                      <div className="text-sm text-foreground mt-0.5">{month.topic}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{month.dailyHours}h/day</span>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border/30">
                      <div className="pt-3 space-y-2">
                        <div className="text-xs text-muted-foreground mb-2">Chapters to cover this month:</div>
                        {month.chapters.map(chId => (
                          <Link key={chId} href={`/chapter/${chId}`}>
                            <div className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors">
                              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                              {chId}
                              <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
