import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import {
  Sparkles, Brain, Shield, BarChart3, BookOpen, Zap,
  ArrowRight, CheckCircle, Building2, GraduationCap,
  Users, Globe, Code2, Star, ChevronRight, Play,
  Target, TrendingUp, Award, Clock, Layers
} from "lucide-react";
import Layout from "@/components/Layout";

// ─── Exam Catalog (preview on landing) ────────────────────────────────────────
const EXAM_CATALOG = [
  {
    id: "jee",
    name: "JEE",
    fullName: "Joint Entrance Examination",
    category: "Engineering",
    categoryClass: "exam-engineering",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    chapters: 80,
    status: "active",
    badge: "Featured",
    badgeColor: "bg-primary text-white",
    icon: "⚡",
    desc: "India's premier engineering entrance — JEE Main & Advanced with 10-year past papers",
  },
  {
    id: "neet",
    name: "NEET",
    fullName: "National Eligibility cum Entrance Test",
    category: "Medical",
    categoryClass: "exam-medical",
    subjects: ["Physics", "Chemistry", "Biology"],
    chapters: 97,
    status: "coming_soon",
    badge: "Coming Soon",
    badgeColor: "bg-emerald-100 text-emerald-700",
    icon: "🧬",
    desc: "Medical entrance covering NCERT-aligned Biology, Physics & Chemistry",
  },
  {
    id: "gate",
    name: "GATE",
    fullName: "Graduate Aptitude Test in Engineering",
    category: "Post-Graduate",
    categoryClass: "exam-gate",
    subjects: ["Core Engineering", "Mathematics", "Aptitude"],
    chapters: 60,
    status: "coming_soon",
    badge: "Coming Soon",
    badgeColor: "bg-violet-100 text-violet-700",
    icon: "🔬",
    desc: "Post-graduate engineering entrance for IITs, NITs, and PSU recruitment",
  },
  {
    id: "upsc",
    name: "UPSC CSE",
    fullName: "Civil Services Examination",
    category: "Civil Services",
    categoryClass: "exam-civil",
    subjects: ["GS Paper I–IV", "CSAT", "Optional"],
    chapters: 120,
    status: "coming_soon",
    badge: "Coming Soon",
    badgeColor: "bg-orange-100 text-orange-700",
    icon: "🏛️",
    desc: "India's most prestigious civil services exam — Prelims, Mains & Interview",
  },
  {
    id: "cat",
    name: "CAT",
    fullName: "Common Admission Test",
    category: "Management",
    categoryClass: "exam-management",
    subjects: ["VARC", "DILR", "Quantitative"],
    chapters: 45,
    status: "coming_soon",
    badge: "Coming Soon",
    badgeColor: "bg-amber-100 text-amber-700",
    icon: "📊",
    desc: "IIM entrance test covering verbal ability, data interpretation & quant",
  },
  {
    id: "boards",
    name: "Board Exams",
    fullName: "CBSE / ICSE / State Boards",
    category: "Academic",
    categoryClass: "exam-board",
    subjects: ["All Streams", "Class 10", "Class 12"],
    chapters: 200,
    status: "coming_soon",
    badge: "Coming Soon",
    badgeColor: "bg-sky-100 text-sky-700",
    icon: "📚",
    desc: "Comprehensive board exam preparation for CBSE, ICSE, and state curricula",
  },
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI Avatar Tutor",
    desc: "Meet Priya — your personal AI tutor with voice narration, doubt clarification, and 6 emotional states. Available 24/7 for every chapter.",
    color: "text-primary",
    bg: "bg-primary/8",
  },
  {
    icon: Shield,
    title: "Anti-Cheating Proctoring",
    desc: "Webcam-based face detection, tab-switch monitoring, fullscreen enforcement, and 3-warning auto-submit for exam integrity.",
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    icon: BarChart3,
    title: "Performance Heatmap",
    desc: "80-chapter visual heatmap (green/amber/red) with JEE score prediction, confidence bands, and weak-chapter identification.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: Layers,
    title: "Multi-Exam Platform",
    desc: "One platform for JEE, NEET, GATE, UPSC, CAT, and board exams. Institutes configure their exam catalog; the platform auto-adapts.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Target,
    title: "Adaptive Study Plans",
    desc: "20-month AI-generated study plans aligned with Indian holidays, NCERT flow, and adaptive rescheduling when students fall behind.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: Code2,
    title: "REST API for ERP/LMS",
    desc: "Full API v1 with API key auth, versioning, rate limiting, and Swagger docs. Any ERP or LMS can integrate in minutes.",
    color: "text-sky-600",
    bg: "bg-sky-50",
  },
];

const STATS = [
  { value: "80+", label: "Chapters", sub: "JEE module live" },
  { value: "6", label: "Exam Types", sub: "Supported" },
  { value: "5", label: "Role Tiers", sub: "Full RBAC" },
  { value: "API v1", label: "REST API", sub: "ERP ready" },
];

const HOW_IT_WORKS_INSTITUTE = [
  { step: "01", title: "Onboard Your Institute", desc: "Register your institute, select your exam catalog (JEE, NEET, GATE, etc.), and configure your curriculum." },
  { step: "02", title: "Invite Teachers & Students", desc: "Send role-based invite links. Teachers, students, and parents each get a tailored portal." },
  { step: "03", title: "Customize Content", desc: "Upload proprietary mock tests, model papers, and study material. AI parses and integrates them into the knowledge base." },
  { step: "04", title: "Track & Improve", desc: "Monitor student performance heatmaps, get AI-driven insights, and receive automated overdue reminders." },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      <div className="min-h-screen bg-background">

        {/* ─── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border">
          {/* Subtle gradient background */}
          <div className="absolute inset-0 hero-gradient pointer-events-none" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/4 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

          <div className="container py-16 lg:py-24 relative">
            <div className="max-w-4xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Universal AI Expert Knowledge Center
              </div>

              {/* Headline */}
              <h1 className="font-display text-4xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
                Master{" "}
                <span className="text-primary">Any Exam</span>{" "}
                with AI-Powered<br className="hidden lg:block" />
                Expert Guidance
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                ExamForge AI is the universal knowledge platform for institutes and students preparing for JEE, NEET, GATE, UPSC, CAT, and board exams. AI avatar tutoring, adaptive study plans, proctored assessments, and deep analytics — all in one white-label SaaS.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-12">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard">
                      <Button size="lg" className="gap-2 shadow-sm">
                        <LayoutDashboard className="w-4 h-4" /> Go to Dashboard <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href="/exams">
                      <Button size="lg" variant="outline" className="gap-2">
                        <Layers className="w-4 h-4" /> Browse Exams
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Button size="lg" className="gap-2 shadow-sm" onClick={() => window.location.href = getLoginUrl()}>
                      <Sparkles className="w-4 h-4" /> Get Started Free <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Link href="/exams">
                      <Button size="lg" variant="outline" className="gap-2">
                        <Layers className="w-4 h-4" /> Explore Exams
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATS.map(stat => (
                  <div key={stat.label} className="bg-card border border-border rounded-xl p-4 shadow-card">
                    <div className="font-display text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm font-semibold text-foreground">{stat.label}</div>
                    <div className="text-xs text-muted-foreground">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Exam Catalog Preview ─────────────────────────────────────────── */}
        <section className="py-16 border-b border-border">
          <div className="container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Exam Catalog</div>
                <h2 className="font-display text-3xl font-bold text-foreground">One Platform, Every Exam</h2>
                <p className="text-muted-foreground mt-2 max-w-xl">
                  Start with JEE — the most comprehensive module — while NEET, GATE, UPSC, CAT, and board exams are being built.
                </p>
              </div>
              <Link href="/exams">
                <Button variant="outline" className="gap-1.5 hidden sm:flex">
                  View All Exams <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {EXAM_CATALOG.map(exam => (
                <div
                  key={exam.id}
                  className={`bg-card border border-border rounded-2xl p-5 transition-all duration-200 ${exam.status === "active" ? "hover:-translate-y-1 hover:shadow-card-hover cursor-pointer" : "opacity-75"}`}
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{exam.icon}</div>
                      <div>
                        <div className="font-display font-bold text-foreground text-lg leading-tight">{exam.name}</div>
                        <div className="text-xs text-muted-foreground">{exam.fullName}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${exam.badgeColor}`}>
                      {exam.badge}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{exam.desc}</p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {exam.subjects.map(s => (
                      <span key={s} className="text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${exam.categoryClass}`}>
                      {exam.category}
                    </span>
                    {exam.status === "active" ? (
                      <Link href={`/exams/${exam.id}`}>
                        <Button size="sm" className="gap-1.5 h-7 text-xs">
                          Start Learning <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">{exam.chapters} chapters planned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Features ─────────────────────────────────────────────────────── */}
        <section className="py-16 bg-muted/30 border-b border-border">
          <div className="container">
            <div className="text-center mb-12">
              <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Platform Capabilities</div>
              <h2 className="font-display text-3xl font-bold text-foreground">Everything You Need to Excel</h2>
              <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
                Built for serious exam preparation — from AI-powered tutoring to enterprise-grade proctoring and analytics.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(feature => (
                <div key={feature.title} className="bg-card border border-border rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200">
                  <div className={`w-10 h-10 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                    <feature.icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How It Works (Institute) ─────────────────────────────────────── */}
        <section className="py-16 border-b border-border">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">For Institutes</div>
                <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                  Onboard Your Institute in Minutes
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  ExamForge AI is a white-label SaaS. Any coaching centre, school, or university can configure their exam catalog, upload proprietary content, and start serving students — all without any technical setup.
                </p>
                <div className="space-y-4">
                  {HOW_IT_WORKS_INSTITUTE.map(step => (
                    <div key={step.step} className="flex gap-4">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{step.step}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-sm">{step.title}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex gap-3">
                  <Link href="/institute-config">
                    <Button className="gap-2">
                      <Building2 className="w-4 h-4" /> Onboard Your Institute
                    </Button>
                  </Link>
                  <Link href="/api-docs">
                    <Button variant="outline" className="gap-2">
                      <Code2 className="w-4 h-4" /> View API Docs
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right side — role cards */}
              <div className="space-y-3">
                {[
                  { icon: "👑", role: "Super Admin", desc: "Manage all institutes, subscriptions, and platform-wide content", color: "border-violet-200 bg-violet-50" },
                  { icon: "🏫", role: "Institute Admin", desc: "Configure exams, onboard staff & students, upload content", color: "border-blue-200 bg-blue-50" },
                  { icon: "👩‍🏫", role: "Teacher", desc: "Create assessments, track student progress, review proctoring reports", color: "border-teal-200 bg-teal-50" },
                  { icon: "🎓", role: "Student", desc: "Learn with AI avatar, take proctored exams, track performance", color: "border-emerald-200 bg-emerald-50" },
                  { icon: "👨‍👩‍👧", role: "Parent", desc: "Monitor child's progress, receive weekly reports, communicate with teachers", color: "border-rose-200 bg-rose-50" },
                ].map(r => (
                  <div key={r.role} className={`flex items-center gap-3 p-3 rounded-xl border ${r.color}`}>
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <div className="font-semibold text-sm text-foreground">{r.role}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── JEE Sub-brand Highlight ──────────────────────────────────────── */}
        <section className="py-16 bg-primary/4 border-b border-primary/10">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary font-medium mb-4">
                <Star className="w-3.5 h-3.5 fill-primary" />
                Featured Module — Now Live
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                JEE Preparation — The Complete Module
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                80 chapters across Physics, Chemistry & Mathematics. 3000+ word narration scripts, 10 years of JEE Main & Advanced past papers, adaptive 20-month study plan, and AI avatar Priya — all ready to use today.
              </p>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { value: "80", label: "Chapters", sub: "Phy + Chem + Math" },
                  { value: "2400+", label: "Past Questions", sub: "10 years, all types" },
                  { value: "20", label: "Month Plan", sub: "Class 11 + 12" },
                ].map(s => (
                  <div key={s.label} className="bg-card border border-border rounded-xl p-4 shadow-card">
                    <div className="font-display text-2xl font-bold text-primary">{s.value}</div>
                    <div className="text-sm font-semibold text-foreground">{s.label}</div>
                    <div className="text-xs text-muted-foreground">{s.sub}</div>
                  </div>
                ))}
              </div>
              <Link href="/exams/jee">
                <Button size="lg" className="gap-2 shadow-sm">
                  <Zap className="w-4 h-4" /> Explore JEE Module <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── CTA Footer ───────────────────────────────────────────────────── */}
        <section className="py-16">
          <div className="container">
            <div className="bg-primary rounded-3xl p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80 pointer-events-none" />
              <div className="relative">
                <h2 className="font-display text-3xl font-bold text-white mb-3">
                  Ready to Transform Exam Preparation?
                </h2>
                <p className="text-white/80 mb-8 max-w-xl mx-auto">
                  Join institutes and students already using ExamForge AI. Start with JEE today — more exams launching soon.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  {isAuthenticated ? (
                    <Link href="/dashboard">
                      <Button size="lg" variant="secondary" className="gap-2 font-semibold">
                        Go to Dashboard <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="gap-2 font-semibold"
                        onClick={() => window.location.href = getLoginUrl()}
                      >
                        <Sparkles className="w-4 h-4" /> Start Free Today
                      </Button>
                      <Link href="/institute-config">
                        <Button size="lg" variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10">
                          <Building2 className="w-4 h-4" /> Onboard Institute
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}

// Need to import LayoutDashboard for the authenticated CTA
function LayoutDashboard({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
