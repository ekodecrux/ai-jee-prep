import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Atom, FlaskConical, Calculator, ArrowRight, Star,
  BookOpen, Target, Zap, BarChart3, Shield, Clock,
  CheckCircle, Trophy, Brain, TrendingUp, ChevronRight,
  Map, Play
} from "lucide-react";
import Layout from "@/components/Layout";

const SUBJECTS = [
  {
    id: "physics",
    name: "Physics",
    icon: Atom,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    chapters: 25,
    class11: 14,
    class12: 11,
    desc: "Mechanics, Thermodynamics, Electrostatics, Magnetism, Optics, Modern Physics",
    keyTopics: ["Kinematics", "Laws of Motion", "Work & Energy", "Electrostatics", "Current Electricity", "Optics"],
  },
  {
    id: "chemistry",
    name: "Chemistry",
    icon: FlaskConical,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    chapters: 28,
    class11: 14,
    class12: 14,
    desc: "Physical Chemistry, Organic Chemistry, Inorganic Chemistry with reaction mechanisms",
    keyTopics: ["Mole Concept", "Atomic Structure", "Chemical Bonding", "Organic Reactions", "Coordination Compounds", "Electrochemistry"],
  },
  {
    id: "mathematics",
    name: "Mathematics",
    icon: Calculator,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    chapters: 27,
    class11: 13,
    class12: 14,
    desc: "Algebra, Calculus, Coordinate Geometry, Trigonometry, Probability & Statistics",
    keyTopics: ["Sets & Functions", "Quadratic Equations", "Limits & Derivatives", "Integration", "Vectors", "Probability"],
  },
];

const FEATURES = [
  { icon: Brain, title: "AI Avatar Priya", desc: "3000+ word narration per chapter with voice interaction and doubt solving", color: "text-primary" },
  { icon: Target, title: "10-Year Past Papers", desc: "JEE Main (2014–2024) + JEE Advanced with MCQ, NAT, Integer types", color: "text-violet-600" },
  { icon: BarChart3, title: "Performance Heatmap", desc: "80-chapter green/amber/red heatmap with JEE score prediction", color: "text-emerald-600" },
  { icon: Shield, title: "Proctored Mock Tests", desc: "36 pre-scheduled mock tests with webcam anti-cheating system", color: "text-rose-600" },
  { icon: Map, title: "20-Month Study Plan", desc: "NCERT-aligned plan with 43 Indian holidays and adaptive rescheduling", color: "text-amber-600" },
  { icon: Zap, title: "Progressive Unlock", desc: "Class 11 → Class 12 gated at 80% completion following NCERT order", color: "text-sky-600" },
];

const STATS = [
  { value: "80", label: "Chapters", sub: "All JEE topics" },
  { value: "2400+", label: "Past Questions", sub: "10 years of papers" },
  { value: "36", label: "Mock Tests", sub: "Pre-scheduled" },
  { value: "20", label: "Month Plan", sub: "Class 11 + 12" },
];

export default function JeeSubBrandPage() {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <div className="min-h-screen bg-background">

        {/* ─── Breadcrumb ───────────────────────────────────────────────────── */}
        <div className="border-b border-border bg-card px-4 py-3">
          <div className="container">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/exams" className="hover:text-primary transition-colors">Exam Catalog</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">JEE</span>
            </div>
          </div>
        </div>

        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        <section className="border-b border-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/4 via-transparent to-transparent pointer-events-none" />
          <div className="container py-12 lg:py-16 relative">
            <div className="flex flex-col lg:flex-row gap-10 items-start">
              <div className="flex-1">
                {/* Sub-brand badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-full px-3 py-1 text-xs text-primary font-semibold">
                    <Star className="w-3 h-3 fill-primary" />
                    Featured Module on ExamForge AI
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="text-5xl">⚡</div>
                  <div>
                    <h1 className="font-display text-4xl font-bold text-foreground">JEE Preparation</h1>
                    <p className="text-muted-foreground">Joint Entrance Examination — Main & Advanced</p>
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed mb-6 max-w-2xl">
                  The most comprehensive JEE preparation module — 80 chapters across Physics, Chemistry & Mathematics, AI avatar Priya for narration and doubt solving, 10 years of past papers, proctored mock tests, and a 20-month adaptive study plan. Designed so that <strong className="text-foreground">100% chapter mastery = JEE topper.</strong>
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {STATS.map(stat => (
                    <div key={stat.label} className="bg-card border border-border rounded-xl p-3 shadow-card">
                      <div className="font-display text-xl font-bold text-primary">{stat.value}</div>
                      <div className="text-xs font-semibold text-foreground">{stat.label}</div>
                      <div className="text-[10px] text-muted-foreground">{stat.sub}</div>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3">
                  {isAuthenticated ? (
                    <>
                      <Link href="/dashboard">
                        <Button size="lg" className="gap-2">
                          <Play className="w-4 h-4" /> Continue Learning <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href="/performance">
                        <Button size="lg" variant="outline" className="gap-2">
                          <BarChart3 className="w-4 h-4" /> My Performance
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Button size="lg" className="gap-2" onClick={() => window.location.href = getLoginUrl()}>
                        <Zap className="w-4 h-4" /> Start JEE Prep <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Link href="/study-plan">
                        <Button size="lg" variant="outline" className="gap-2">
                          <Map className="w-4 h-4" /> View Study Plan
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Right: exam info card */}
              <div className="w-full lg:w-72 bg-card border border-border rounded-2xl p-5 shadow-card shrink-0">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Exam Details</div>
                {[
                  { label: "Conducting Body", value: "NTA (Main) · IIT (Advanced)" },
                  { label: "Frequency", value: "2× per year (Main) · 1× (Advanced)" },
                  { label: "Duration", value: "3 hours per paper" },
                  { label: "Total Marks", value: "300 (Main) · 360 (Advanced)" },
                  { label: "Question Types", value: "MCQ · NAT · Integer · Multi-correct" },
                  { label: "Negative Marking", value: "Yes — varies by section" },
                  { label: "Medium", value: "English & Hindi" },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-border/60 last:border-0 text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground font-medium text-right max-w-[55%]">{item.value}</span>
                  </div>
                ))}
                <Link href="/mock-test/jee_main_full">
                  <Button className="w-full mt-4 gap-2" size="sm">
                    <Trophy className="w-4 h-4" /> Take a Mock Test
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Subject Cards ─────────────────────────────────────────────────── */}
        <section className="py-12 border-b border-border">
          <div className="container">
            <div className="mb-8">
              <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Subjects</div>
              <h2 className="font-display text-2xl font-bold text-foreground">Three Subjects, 80 Chapters</h2>
              <p className="text-muted-foreground mt-1">Each chapter has AI narration, past questions, and a timed assessment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {SUBJECTS.map(subject => (
                <div key={subject.id} className={`bg-card border ${subject.border} rounded-2xl p-5 hover:shadow-card-hover transition-all duration-200`} style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div className={`w-10 h-10 rounded-xl ${subject.bg} flex items-center justify-center mb-4`}>
                    <subject.icon className={`w-5 h-5 ${subject.color}`} />
                  </div>
                  <h3 className="font-display font-bold text-foreground text-lg mb-1">{subject.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{subject.desc}</p>

                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 bg-muted/50 rounded-lg p-2 text-center">
                      <div className="font-bold text-foreground text-sm">{subject.class11}</div>
                      <div className="text-[10px] text-muted-foreground">Class 11</div>
                    </div>
                    <div className="flex-1 bg-muted/50 rounded-lg p-2 text-center">
                      <div className="font-bold text-foreground text-sm">{subject.class12}</div>
                      <div className="text-[10px] text-muted-foreground">Class 12</div>
                    </div>
                    <div className="flex-1 bg-primary/8 rounded-lg p-2 text-center">
                      <div className="font-bold text-primary text-sm">{subject.chapters}</div>
                      <div className="text-[10px] text-primary/70">Total</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {subject.keyTopics.slice(0, 4).map(t => (
                      <span key={t} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>

                  <Link href={`/subject/${subject.id}`}>
                    <Button size="sm" variant="outline" className={`w-full gap-1.5 ${subject.color} border-current/30`}>
                      <BookOpen className="w-3.5 h-3.5" /> Browse {subject.name} Chapters
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features ─────────────────────────────────────────────────────── */}
        <section className="py-12 bg-muted/30 border-b border-border">
          <div className="container">
            <div className="mb-8">
              <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">What's Included</div>
              <h2 className="font-display text-2xl font-bold text-foreground">Everything in the JEE Module</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map(f => (
                <div key={f.title} className="bg-card border border-border rounded-xl p-4 flex gap-3 shadow-card">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <f.icon className={`w-4.5 h-4.5 ${f.color}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm mb-1">{f.title}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Quick Links ──────────────────────────────────────────────────── */}
        <section className="py-12">
          <div className="container">
            <div className="mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">Quick Access</h2>
              <p className="text-muted-foreground mt-1">Jump directly to any part of the JEE module</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { href: "/subject/physics", icon: Atom, label: "Physics", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
                { href: "/subject/chemistry", icon: FlaskConical, label: "Chemistry", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
                { href: "/subject/mathematics", icon: Calculator, label: "Mathematics", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
                { href: "/study-plan", icon: Map, label: "Study Plan", color: "text-primary", bg: "bg-primary/8 border-primary/20" },
                { href: "/performance", icon: BarChart3, label: "Performance", color: "text-violet-600", bg: "bg-violet-50 border-violet-200" },
                { href: "/mock-test/jee_main_full", icon: Trophy, label: "Mock Tests", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
              ].map(link => (
                <Link key={link.href} href={link.href}>
                  <div className={`border rounded-xl p-4 text-center hover:shadow-card-hover transition-all duration-200 cursor-pointer ${link.bg}`}>
                    <link.icon className={`w-6 h-6 mx-auto mb-2 ${link.color}`} />
                    <div className="text-xs font-semibold text-foreground">{link.label}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Powered by ExamForge AI ──────────────────────────────────────── */}
        <div className="border-t border-border bg-muted/30 py-4">
          <div className="container text-center">
            <p className="text-xs text-muted-foreground">
              JEE Module is part of{" "}
              <Link href="/" className="text-primary font-semibold hover:underline">ExamForge AI</Link>
              {" "}— Universal AI Expert Knowledge Center · Also available: NEET, GATE, UPSC, CAT (coming soon)
            </p>
          </div>
        </div>

      </div>
    </Layout>
  );
}
