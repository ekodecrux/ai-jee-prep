import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  Atom, FlaskConical, Calculator, GraduationCap, Target, BookOpen,
  Clock, Trophy, ArrowRight, CheckCircle, Zap, Star, Code2,
  ChevronRight, BarChart3, Lock, Unlock
} from "lucide-react";

const SUBJECT_META = {
  physics: { label: "Physics", icon: Atom, color: "text-physics", bg: "subject-bg-physics subject-physics", chapters: 25, desc: "Mechanics, Electrostatics, Optics, Modern Physics & more" },
  chemistry: { label: "Chemistry", icon: FlaskConical, color: "text-chemistry", bg: "subject-bg-chemistry subject-chemistry", chapters: 28, desc: "Physical, Organic & Inorganic Chemistry with reactions" },
  mathematics: { label: "Mathematics", icon: Calculator, color: "text-mathematics", bg: "subject-bg-mathematics subject-mathematics", chapters: 27, desc: "Calculus, Algebra, Coordinate Geometry, Probability & more" },
};

const FEATURES = [
  { icon: BookOpen, title: "3000+ Word Narrations", desc: "Comprehensive teacher narration scripts for every chapter with multiple problem-solving approaches", color: "text-physics" },
  { icon: Target, title: "10 Years Past Papers", desc: "Complete JEE Main & Advanced past questions (2014–2024) with detailed solutions, tagged by difficulty", color: "text-chemistry" },
  { icon: Zap, title: "Dynamic Assessments", desc: "MCQ, NAT, and Integer type questions matching actual JEE pattern. 3 attempts/day for chapter tests", color: "text-mathematics" },
  { icon: Lock, title: "Progressive Unlock", desc: "Class 11 → Class 12 gated progression. 80% Class 11 completion required before Class 12 unlocks", color: "text-yellow-400" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track your progress, identify weak topics, and monitor your readiness for the actual exam", color: "text-blue-400" },
  { icon: Code2, title: "REST API for ERP/LMS", desc: "Full API v1 with API key auth, versioning, and Swagger docs for integration with any platform", color: "text-green-400" },
];

const STATS = [
  { value: "80", label: "Chapters", sub: "All JEE topics" },
  { value: "2400+", label: "Past Questions", sub: "10 years of papers" },
  { value: "3", label: "Subjects", sub: "Phy · Chem · Math" },
  { value: "24", label: "Month Plan", sub: "Class 11 + 12" },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Start with Class 11", desc: "Begin with foundational chapters following NCERT order. Each chapter has narration + assessment." },
  { step: "02", title: "Read & Learn", desc: "Study the 3000+ word teacher narration script with concepts, derivations, and worked examples." },
  { step: "03", title: "Practice Past Papers", desc: "Solve 10 years of JEE Main & Advanced questions for the chapter, sorted by difficulty." },
  { step: "04", title: "Take Chapter Assessment", desc: "Score 60%+ to unlock the next chapter. Timed chapter tests simulate actual JEE conditions." },
  { step: "05", title: "Unlock Class 12", desc: "After 80% of Class 11 chapters, Class 12 content unlocks automatically." },
  { step: "06", title: "Attempt Full Mocks", desc: "Complete all chapters to unlock full JEE Main & Advanced mock tests with real exam pattern." },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: allChapters } = trpc.chapters.listAll.useQuery({ examId: "jee_main" });

  const chapterCount = allChapters?.length || 80;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container py-16 lg:py-24">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-sm text-primary mb-6">
              <Star className="w-3.5 h-3.5" />
              JEE Main + Advanced · Both Exams · 10 Years Past Papers
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Master JEE with the{" "}
              <span className="text-primary">Complete</span>{" "}
              <span className="text-primary">Knowledge</span>{" "}
              Repository
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl">
              {chapterCount} chapters across Physics, Chemistry & Mathematics. Comprehensive teacher
              narration scripts, 10 years of past questions, dynamic assessments, and a 24-month
              progressive study plan. Designed so that{" "}
              <strong className="text-foreground">100% assessment completion = JEE topper.</strong>
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-12">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/study-plan">
                    <Button size="lg" variant="outline" className="gap-2">
                      <Clock className="w-5 h-5" />
                      View 24-Month Plan
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={() => window.location.href = getLoginUrl()} className="gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Start Preparing Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Link href="/study-plan">
                    <Button size="lg" variant="outline" className="gap-2">
                      <Clock className="w-5 h-5" />
                      View Study Plan
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STATS.map(stat => (
                <div key={stat.label} className="stat-card text-center">
                  <div className="text-2xl font-display font-bold text-primary">{stat.value}</div>
                  <div className="text-sm font-semibold text-foreground">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Three Subjects, One Platform</h2>
          <p className="text-muted-foreground text-sm">Complete chapter-wise coverage for all JEE subjects</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {(Object.entries(SUBJECT_META) as [string, typeof SUBJECT_META.physics][]).map(([id, meta]) => {
            const Icon = meta.icon;
            return (
              <Link key={id} href={`/subject/${id}`}>
                <div className={`${meta.bg} chapter-card group h-full`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center">
                      <Icon className={`w-6 h-6 ${meta.color}`} />
                    </div>
                    <div>
                      <div className="font-display font-bold text-foreground">{meta.label}</div>
                      <div className={`text-sm ${meta.color}`}>{meta.chapters} chapters</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{meta.desc}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    Explore chapters <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Everything You Need to Crack JEE</h2>
          <p className="text-muted-foreground text-sm">A complete ecosystem — not just notes, not just questions, but a full learning system</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
                <div className={`w-10 h-10 rounded-xl bg-background flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="container py-12">
        <div className="text-center mb-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">How the Progressive Learning System Works</h2>
          <p className="text-muted-foreground text-sm">Designed to mirror the NCERT Class 11 → Class 12 flow so you never feel lost</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map(step => (
            <div key={step.step} className="bg-card border border-border rounded-xl p-5">
              <div className="font-mono text-3xl font-bold text-primary/30 mb-2">{step.step}</div>
              <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Schedule Preview */}
      <section className="container py-12">
        <div className="hero-gradient rounded-2xl p-6 lg:p-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">Optimized Daily Schedule</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                The platform follows a research-backed daily time split: Mathematics gets the most time
                (3h/day) as it requires the most practice, followed by Physics (2.5h/day) and Chemistry (2h/day).
              </p>
              <div className="space-y-2">
                {[
                  { subject: "Mathematics", hours: "3h/day", color: "text-mathematics", bg: "bg-mathematics/10 border-mathematics/30" },
                  { subject: "Physics", hours: "2.5h/day", color: "text-physics", bg: "bg-physics/10 border-physics/30" },
                  { subject: "Chemistry", hours: "2h/day", color: "text-chemistry", bg: "bg-chemistry/10 border-chemistry/30" },
                ].map(s => (
                  <div key={s.subject} className={`flex items-center justify-between p-3 rounded-xl border ${s.bg}`}>
                    <span className={`text-sm font-semibold ${s.color}`}>{s.subject}</span>
                    <span className="text-sm font-bold text-foreground">{s.hours}</span>
                  </div>
                ))}
              </div>
              <Link href="/study-plan">
                <Button className="mt-4 gap-2" variant="outline">
                  View Full 24-Month Plan <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-semibold text-foreground mb-2">Assessment Scoring System</div>
              {[
                { label: "Pass threshold", value: "60%", desc: "Minimum to unlock next chapter", icon: CheckCircle, color: "text-green-400" },
                { label: "Daily attempts", value: "3/day", desc: "Chapter tests (practice mode unlimited)", icon: Target, color: "text-primary" },
                { label: "Mock test unlock", value: "100%", desc: "All chapters in subject must be completed", icon: Trophy, color: "text-yellow-400" },
                { label: "JEE Topper goal", value: "100%", desc: "100% assessment completion = guaranteed topper", icon: Zap, color: "text-orange-400" },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 bg-card/60 border border-border/50 rounded-xl p-3">
                    <Icon className={`w-5 h-5 ${item.color} flex-shrink-0`} />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                    <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="container py-12">
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-green-900/20 border border-green-700/30 flex items-center justify-center flex-shrink-0">
              <Code2 className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground mb-1">Universal Knowledge Platform API</h2>
              <p className="text-muted-foreground text-sm">
                Not just a JEE app — a standalone knowledge repository with a full REST API v1.
                Integrate with any ERP, LMS, or academic platform. Extensible to NEET, GATE, UPSC, and any curriculum.
              </p>
            </div>
          </div>
          <div className="bg-background border border-border rounded-xl p-4 mb-4">
            <code className="text-sm text-green-300 font-mono">
              GET /api/v1/chapters?subjectId=physics&amp;examId=jee_main<br />
              GET /api/v1/chapters/:id/narration<br />
              GET /api/v1/questions?chapterId=PHY_C11_01&amp;difficulty=hard<br />
              GET /api/v1/assessments?chapterId=PHY_C11_01<br />
              GET /api/v1/search?q=kinematics
            </code>
          </div>
          <Link href="/api-docs">
            <Button variant="outline" className="gap-2">
              View Full API Documentation <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-12 pb-16">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Ready to Start Your JEE Journey?</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
            Join thousands of students using the most comprehensive JEE preparation platform.
            Start from Chapter 1 and work your way to JEE topper status.
          </p>
          {isAuthenticated ? (
            <Link href="/subject/physics">
              <Button size="lg" className="gap-2">
                <Atom className="w-5 h-5" />
                Start with Physics
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          ) : (
            <Button size="lg" onClick={() => window.location.href = getLoginUrl()} className="gap-2">
              <GraduationCap className="w-5 h-5" />
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
