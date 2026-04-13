import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  GraduationCap, BookOpen, Users, BarChart3, Shield, ArrowRight,
  CheckCircle, Star, Atom, FlaskConical, Calculator, Building2,
  UserCheck, Heart, Zap, Trophy, Target, Brain, Sparkles,
  MessageCircle, Clock, TrendingUp, Award, Globe, Play, ChevronRight,
  Video, Bell, FileText, PieChart, Layers, RotateCcw
} from "lucide-react";

const EXAMS = [
  { id: "jee_main", name: "JEE Main", students: "12L+", color: "bg-blue-500", icon: Atom },
  { id: "jee_advanced", name: "JEE Advanced", students: "2L+", color: "bg-indigo-600", icon: Atom },
  { id: "neet", name: "NEET UG", students: "18L+", color: "bg-green-500", icon: FlaskConical },
  { id: "gate", name: "GATE", students: "9L+", color: "bg-orange-500", icon: Calculator },
  { id: "upsc", name: "UPSC CSE", students: "10L+", color: "bg-purple-500", icon: Globe },
  { id: null, name: "CAT", students: "3L+", color: "bg-rose-500", icon: TrendingUp },
  { id: null, name: "CBSE Class 10", students: "30L+", color: "bg-teal-500", icon: BookOpen },
  { id: null, name: "CBSE Class 12", students: "15L+", color: "bg-cyan-500", icon: FileText },
];

const FEATURES = [
  {
    icon: Brain,
    title: "Adaptive AI Tutor",
    desc: "Personalised learning paths that adapt to each student's pace, gaps, and strengths — powered by knowledge graph AI.",
    gradient: "from-indigo-500 to-blue-600",
    tag: "Core AI",
  },
  {
    icon: MessageCircle,
    title: "24/7 Doubt Solver",
    desc: "Ask any question in text or voice. Get step-by-step solutions with concept explanations, not just answers.",
    gradient: "from-teal-500 to-emerald-600",
    tag: "AI-Powered",
  },
  {
    icon: Video,
    title: "Live Classes (Jitsi)",
    desc: "Teachers host live video sessions. Students join with one click. Recordings auto-saved for later review.",
    gradient: "from-purple-500 to-violet-600",
    tag: "Real-time",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    desc: "Chapter-level heatmaps, time-on-task tracking, score prediction, and parent-visible progress reports.",
    gradient: "from-rose-500 to-pink-600",
    tag: "Insights",
  },
  {
    icon: FileText,
    title: "Smart Assignments",
    desc: "Teachers create assignments per class and subject. Students submit answers. AI assists with auto-grading.",
    gradient: "from-amber-500 to-orange-600",
    tag: "Workflow",
  },
  {
    icon: Building2,
    title: "Multi-Tenant ERP",
    desc: "Full institute management — onboarding, attendance, fee collection, role-based access, and monthly reports.",
    gradient: "from-cyan-500 to-blue-600",
    tag: "Enterprise",
  },
  {
    icon: Trophy,
    title: "Gamification & Leaderboards",
    desc: "Streak tracking, XP points, badges, and class leaderboards to drive consistent daily study habits.",
    gradient: "from-yellow-500 to-amber-600",
    tag: "Engagement",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Automated reminders for fee dues, class schedules, assignment deadlines, and exam countdowns.",
    gradient: "from-green-500 to-teal-600",
    tag: "Automation",
  },
];

const ROLES = [
  { icon: GraduationCap, title: "Student", desc: "AI study plan, live classes, report card, doubt solver", color: "text-blue-400", bg: "bg-blue-500/10" },
  { icon: UserCheck, title: "Teacher", desc: "Lesson plans, assignments, grading, live sessions", color: "text-teal-400", bg: "bg-teal-500/10" },
  { icon: Heart, title: "Parent", desc: "Attendance, heatmap, report card, fee payments", color: "text-rose-400", bg: "bg-rose-500/10" },
  { icon: Building2, title: "Institute Admin", desc: "Onboarding, classes, fees, attendance reports", color: "text-amber-400", bg: "bg-amber-500/10" },
  { icon: Shield, title: "Super Admin", desc: "All institutes, analytics, system health", color: "text-purple-400", bg: "bg-purple-500/10" },
];

const STATS = [
  { value: "8+", label: "Exams Covered", icon: Target },
  { value: "5", label: "User Roles", icon: Users },
  { value: "80+", label: "AI Chapters", icon: Brain },
  { value: "2,400+", label: "Practice Questions", icon: BookOpen },
];

const TESTIMONIALS = [
  { name: "Priya S.", role: "JEE Aspirant", text: "The adaptive study plan identified my weak areas in Organic Chemistry within a week. My mock scores jumped 40 marks.", avatar: "PS" },
  { name: "Rahul M.", role: "Physics Teacher", desc: "Creating lesson plans and grading assignments used to take hours. Now it's 20 minutes.", avatar: "RM" },
  { name: "Anita K.", role: "Parent", text: "I can see exactly which chapters my son is struggling with and pay fees online. No more WhatsApp chasing.", avatar: "AK" },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [activeExamIdx, setActiveExamIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveExamIdx(i => (i + 1) % EXAMS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg shadow-indigo-200">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-gray-900 text-base leading-none">ExamForge AI</span>
              <span className="hidden sm:block text-gray-400 text-[10px] leading-none mt-0.5">Universal Knowledge Platform</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#exams" className="hover:text-indigo-600 transition-colors">Exams</a>
            <a href="#roles" className="hover:text-indigo-600 transition-colors">Roles</a>
            <Link href="/demo" className="hover:text-indigo-600 transition-colors">Demo</Link>
            <Link href="/register-institute" className="hover:text-indigo-600 transition-colors">Register Institute</Link>
          </div>
          <div className="flex items-center gap-2">
            {loading ? null : isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-md shadow-indigo-200">
                  Dashboard <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button size="sm" variant="ghost" className="text-gray-600 hover:text-gray-900 text-sm hidden sm:flex">
                    Sign In
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-md shadow-indigo-200 text-sm">
                    Get Started <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="pt-28 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-indigo-50 via-purple-50 to-transparent rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-50 to-transparent rounded-full translate-y-1/4 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Left: copy */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 text-indigo-700 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered · Multi-Tenant · Multi-Exam
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6 text-gray-900">
                The World-Class{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  AI Tutor Platform
                </span>{" "}
                for Every Exam
              </h1>

              <p className="text-gray-500 text-lg sm:text-xl leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
                From JEE and NEET to GATE, UPSC, CAT, and K-12 — ExamForge AI delivers adaptive learning, live classes, doubt solving, and complete institute management in one unified platform.
              </p>

              {/* Animated exam ticker */}
              <div className="flex items-center gap-3 mb-8 justify-center lg:justify-start">
                <span className="text-gray-400 text-sm font-medium">Preparing for:</span>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-4 py-2 min-w-[160px]">
                  {(() => {
                    const exam = EXAMS[activeExamIdx];
                    const Icon = exam.icon;
                    return (
                      <>
                        <div className={`w-2 h-2 rounded-full ${exam.color} flex-shrink-0`} />
                        <Icon className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span className="font-semibold text-gray-800 text-sm">{exam.name}</span>
                      </>
                    );
                  })()}
                </div>
                <span className="text-gray-400 text-xs">+{EXAMS.length - 1} more</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/login">
                  <Button size="lg" className="gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 h-14 px-8 text-base font-semibold shadow-2xl shadow-indigo-200 rounded-xl w-full sm:w-auto">
                    <GraduationCap className="w-5 h-5" />
                    Start Learning Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="outline" className="gap-3 border-gray-200 text-gray-700 hover:bg-gray-50 h-14 px-8 text-base rounded-xl w-full sm:w-auto">
                    <Play className="w-4 h-4 text-indigo-600" />
                    Watch Demo
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6 justify-center lg:justify-start">
                {["Free to start", "No credit card", "All exams covered"].map(t => (
                  <span key={t} className="flex items-center gap-1.5 text-gray-500 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: visual card */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none">
              <div className="relative">
                {/* Main card */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 shadow-2xl shadow-indigo-200 text-white">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-indigo-200 text-xs font-medium">Student Dashboard</p>
                      <h3 className="text-white font-bold text-lg">Arjun Sharma</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">AS</div>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: "Study Streak", value: "24 days", icon: Zap, color: "bg-yellow-400/20" },
                      { label: "Score Trend", value: "+18%", icon: TrendingUp, color: "bg-green-400/20" },
                      { label: "Rank", value: "#142", icon: Trophy, color: "bg-orange-400/20" },
                    ].map(stat => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className={`${stat.color} rounded-xl p-3 text-center`}>
                          <Icon className="w-4 h-4 text-white mx-auto mb-1" />
                          <div className="text-white font-bold text-sm">{stat.value}</div>
                          <div className="text-white/60 text-[10px]">{stat.label}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress bars */}
                  <div className="space-y-2.5">
                    {[
                      { subject: "Physics", pct: 78, color: "bg-blue-400" },
                      { subject: "Chemistry", pct: 62, color: "bg-green-400" },
                      { subject: "Mathematics", pct: 85, color: "bg-yellow-400" },
                    ].map(s => (
                      <div key={s.subject}>
                        <div className="flex justify-between text-xs text-white/70 mb-1">
                          <span>{s.subject}</span><span>{s.pct}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${s.color} rounded-full`} style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-white/60 text-xs">Next: Thermodynamics — 2:30 PM</span>
                    <span className="bg-green-400/20 text-green-300 text-xs px-2 py-0.5 rounded-full font-medium">Live Soon</span>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-gray-100">
                  <Brain className="w-5 h-5 text-indigo-600" />
                  <div>
                    <div className="text-gray-900 font-bold text-xs">AI Doubt Solved</div>
                    <div className="text-gray-400 text-[10px]">Electrostatics Q.47</div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-gray-100">
                  <Award className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="text-gray-900 font-bold text-xs">New Badge Earned</div>
                    <div className="text-gray-400 text-[10px]">7-Day Streak 🔥</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-12 px-4 sm:px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">{value}</div>
              <div className="text-gray-500 text-sm mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── EXAMS ── */}
      <section id="exams" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 rounded-full px-4 py-1.5 text-green-700 text-xs font-semibold mb-4">
              <Globe className="w-3.5 h-3.5" /> All Major Indian Exams
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              One Platform, Every Exam
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Whether you're cracking JEE, NEET, GATE, UPSC, CAT, or preparing for board exams — ExamForge AI has tailored content, practice, and analytics for every path.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {EXAMS.map((exam) => {
              const Icon = exam.icon;
              const cardContent = (
                <div className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-indigo-100 transition-all cursor-pointer h-full">
                  <div className={`w-10 h-10 rounded-xl ${exam.color} flex items-center justify-center mb-3 shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-bold text-gray-900 text-sm mb-1">{exam.name}</div>
                  <div className="text-gray-400 text-xs">{exam.students} aspirants</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                    {exam.id && <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">View details</span>}
                  </div>
                </div>
              );
              return exam.id ? (
                <Link key={exam.name} href={`/exams/${exam.id}`}>{cardContent}</Link>
              ) : <div key={exam.name}>{cardContent}</div>;
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-full px-4 py-1.5 text-purple-700 text-xs font-semibold mb-4">
              <Zap className="w-3.5 h-3.5" /> Platform Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              Built for World-Class Learning
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Every feature is designed to close the gap between where students are and where they need to be — with AI doing the heavy lifting.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-indigo-100 transition-all group">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-2 inline-block">{f.tag}</span>
                  <h3 className="font-bold text-gray-900 text-sm mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section id="roles" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 text-blue-700 text-xs font-semibold mb-6">
                <Users className="w-3.5 h-3.5" /> 5 Dedicated Portals
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                Every Role Gets Their Own World
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                No shared dashboards, no clutter. Each user type — Student, Teacher, Parent, Institute Admin, and Super Admin — gets a fully dedicated portal with exactly the tools they need.
              </p>
              <div className="space-y-3">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.title} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md hover:border-indigo-100 transition-all group">
                      <div className={`w-10 h-10 rounded-xl ${r.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${r.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm">{r.title}</div>
                        <div className="text-gray-500 text-xs">{r.desc}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 max-w-lg">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 shadow-2xl text-white">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <span className="text-gray-500 text-xs ml-2">Institute Admin Portal</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Total Students", value: "1,247", trend: "+12%", color: "text-green-400" },
                    { label: "Active Teachers", value: "48", trend: "+3", color: "text-blue-400" },
                    { label: "Fee Collection", value: "₹8.4L", trend: "94%", color: "text-amber-400" },
                    { label: "Avg Attendance", value: "87.3%", trend: "+2.1%", color: "text-purple-400" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3">
                      <span className="text-gray-400 text-sm">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-sm">{item.value}</span>
                        <span className={`text-xs font-medium ${item.color}`}>{item.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">3 pending fee reminders</span>
                    <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white border-0 px-3">Send All</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-100 rounded-full px-4 py-1.5 text-gray-700 text-xs font-semibold mb-4 shadow-sm">
              <Star className="w-3.5 h-3.5 text-yellow-500" /> Loved by Students & Educators
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">What Our Users Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text ?? t.desc}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">{t.avatar}</div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-gray-400 text-xs">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-white/5 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Free to start · No credit card required
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-5">
            Ready to Build Something World-Class?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of students, teachers, and institutes already using ExamForge AI to achieve extraordinary results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="gap-3 bg-white text-indigo-700 hover:bg-gray-50 border-0 h-14 px-10 text-base font-bold rounded-xl shadow-2xl w-full sm:w-auto">
                <GraduationCap className="w-5 h-5" />
                Start Learning Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/register-institute">
              <Button size="lg" variant="outline" className="gap-3 border-white/30 text-white hover:bg-white/10 h-14 px-10 text-base rounded-xl w-full sm:w-auto">
                <Building2 className="w-5 h-5" />
                Register Your Institute
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-extrabold text-white text-sm">ExamForge AI</span>
              </div>
              <p className="text-gray-500 text-xs max-w-xs leading-relaxed">
                Universal AI-powered exam preparation and institute management platform for India and beyond.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="text-white font-semibold mb-3 text-xs uppercase tracking-widest">Platform</div>
                <div className="space-y-2">
                  <Link href="/login" className="block hover:text-white transition-colors text-xs">Sign In</Link>
                  <Link href="/register-institute" className="block hover:text-white transition-colors text-xs">Register Institute</Link>
                  <Link href="/demo" className="block hover:text-white transition-colors text-xs">Live Demo</Link>
                </div>
              </div>
              <div>
                <div className="text-white font-semibold mb-3 text-xs uppercase tracking-widest">Exams</div>
                <div className="space-y-2">
                  {["JEE Main", "NEET UG", "GATE", "UPSC CSE"].map(e => (
                    <div key={e} className="text-xs hover:text-white transition-colors cursor-pointer">{e}</div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-white font-semibold mb-3 text-xs uppercase tracking-widest">Roles</div>
                <div className="space-y-2">
                  {["Student", "Teacher", "Parent", "Institute Admin"].map(r => (
                    <div key={r} className="text-xs hover:text-white transition-colors cursor-pointer">{r}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-gray-600 text-xs">© 2026 ExamForge AI · All rights reserved</span>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Terms of Service</span>
              <span className="hover:text-gray-400 cursor-pointer transition-colors">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
