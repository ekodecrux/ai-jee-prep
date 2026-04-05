import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, BookOpen, Users, BarChart3, Shield, ArrowRight,
  CheckCircle, Star, Atom, FlaskConical, Calculator, Building2,
  UserCheck, Heart, Layers, ChevronRight, Zap, Trophy, Target,
  Code2, Brain
} from "lucide-react";

const ROLES = [
  {
    role: "Student",
    icon: GraduationCap,
    color: "from-indigo-500 to-blue-600",
    bg: "bg-indigo-50 border-indigo-200",
    text: "text-indigo-700",
    desc: "Access your personalised study plan, chapter narrations, past papers, live classes, and performance analytics.",
    features: ["80 chapters with narrations", "10 years past papers", "Chapter assessments", "Report card & heatmap"],
  },
  {
    role: "Teacher",
    icon: UserCheck,
    color: "from-teal-500 to-emerald-600",
    bg: "bg-teal-50 border-teal-200",
    text: "text-teal-700",
    desc: "Manage your classes, create lesson plans, conduct live sessions, assign homework, and track student progress.",
    features: ["Lesson plan builder", "Live class scheduler", "Assignment & grading", "Bridge course approvals"],
  },
  {
    role: "Parent",
    icon: Heart,
    color: "from-rose-500 to-pink-600",
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    desc: "Monitor your child's attendance, chapter heatmap, report card, and receive real-time alerts from teachers.",
    features: ["Attendance tracking", "Chapter heatmap view", "Report card download", "Low-attendance alerts"],
  },
  {
    role: "Institute Admin",
    icon: Building2,
    color: "from-blue-500 to-cyan-600",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    desc: "Onboard teachers, students and parents, manage classes, track fees, and generate collection reports.",
    features: ["User onboarding & invites", "Class & subject setup", "Fee management", "Attendance reports"],
  },
  {
    role: "Super Admin",
    icon: Shield,
    color: "from-purple-500 to-indigo-600",
    bg: "bg-purple-50 border-purple-200",
    text: "text-purple-700",
    desc: "Oversee all institutes on the platform, manage subscriptions, control global content, and monitor system health.",
    features: ["Multi-institute dashboard", "Global content control", "API key management", "System health monitor"],
  },
];

const FEATURES = [
  { icon: BookOpen, title: "AI-Powered Narrations", desc: "3000+ word teacher narration scripts for every chapter with derivations, worked examples, and JEE tips.", color: "text-indigo-600", bg: "bg-indigo-50" },
  { icon: Target, title: "10 Years Past Papers", desc: "Complete JEE Main & Advanced past questions (2014–2024) tagged by difficulty, type, and chapter.", color: "text-teal-600", bg: "bg-teal-50" },
  { icon: BarChart3, title: "Performance Analytics", desc: "Chapter heatmap, score predictions, weak-topic alerts, and a 24-month adaptive study plan.", color: "text-blue-600", bg: "bg-blue-50" },
  { icon: Layers, title: "Multi-Tenant ERP", desc: "Full institute management — onboard users, manage classes, track fees, and generate reports.", color: "text-purple-600", bg: "bg-purple-50" },
  { icon: Zap, title: "Live Classes", desc: "Schedule and conduct live sessions with attendance tracking, recordings, and doubt boards.", color: "text-amber-600", bg: "bg-amber-50" },
  { icon: Code2, title: "REST API v1", desc: "Full public API with versioning and API key auth — integrate with any ERP or LMS platform.", color: "text-rose-600", bg: "bg-rose-50" },
];

const STATS = [
  { value: "80", label: "Chapters", sub: "All JEE topics" },
  { value: "2400+", label: "Past Questions", sub: "10 years of papers" },
  { value: "5", label: "User Roles", sub: "Multi-tenant" },
  { value: "24", label: "Month Plan", sub: "Class 11 + 12" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">ExamForge AI</span>
            <span className="hidden sm:inline text-xs text-gray-400 border border-gray-200 rounded-full px-2 py-0.5 ml-1">Multi-Tenant LMS</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <a href="#roles" className="hover:text-gray-900 transition-colors">Roles</a>
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <Link href="/api-docs" className="hover:text-gray-900 transition-colors">API Docs</Link>
            <Link href="/search" className="hover:text-gray-900 transition-colors">Search</Link>
          </nav>
          <Link href="/login">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white" size="sm">
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50 pt-20 pb-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-100 rounded-full opacity-40 blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-100 rounded-full opacity-30 blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-100 border border-indigo-200 rounded-full px-4 py-1.5 text-sm text-indigo-700 mb-6">
            <Star className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
            JEE Main + Advanced · 5 User Roles · Full ERP
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
            The Complete<br />
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">JEE Preparation</span><br />
            Platform
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            One platform for students, teachers, parents, and institute admins.
            AI-powered narrations, past papers, live classes, fee management, and analytics — all in one place.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Link href="/login">
              <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 text-base font-semibold shadow-lg shadow-indigo-200">
                <GraduationCap className="w-5 h-5" />Get Started Free<ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/api-docs">
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-base border-gray-300">
                <Code2 className="w-5 h-5" />View API Docs
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                <div className="text-3xl font-extrabold text-indigo-600 mb-0.5">{s.value}</div>
                <div className="text-sm font-semibold text-gray-700">{s.label}</div>
                <div className="text-xs text-gray-400">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section id="roles" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">One Platform, Five Roles</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Each user type gets a completely separate, role-specific portal with only the features they need. No clutter, no confusion.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROLES.map(r => {
              const Icon = r.icon;
              return (
                <div key={r.role} className={`border rounded-2xl p-6 ${r.bg} hover:shadow-md transition-shadow`}>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center mb-4 shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className={`text-xl font-bold mb-2 ${r.text}`}>{r.role}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{r.desc}</p>
                  <ul className="space-y-1.5 mb-5">
                    {r.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${r.text}`} />{f}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => window.location.href = '/login'} className={`w-full gap-2 bg-gradient-to-r ${r.color} text-white border-0 hover:opacity-90`} size="sm">
                    Sign in as {r.role} <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Everything You Need to Crack JEE</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">A complete ecosystem — not just notes, not just questions, but a full learning and management system.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Three Subjects, One Platform</h2>
            <p className="text-lg text-gray-500">Complete chapter-wise coverage for all JEE subjects</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Atom, label: "Physics", chapters: 25, color: "from-blue-500 to-indigo-600", bg: "bg-blue-50 border-blue-100", text: "text-blue-700", desc: "Mechanics, Electrostatics, Optics, Modern Physics & more", path: "/subject/physics" },
              { icon: FlaskConical, label: "Chemistry", chapters: 28, color: "from-teal-500 to-green-600", bg: "bg-teal-50 border-teal-100", text: "text-teal-700", desc: "Physical, Organic & Inorganic Chemistry with reactions", path: "/subject/chemistry" },
              { icon: Calculator, label: "Mathematics", chapters: 27, color: "from-amber-500 to-orange-600", bg: "bg-amber-50 border-amber-100", text: "text-amber-700", desc: "Calculus, Algebra, Coordinate Geometry, Probability & more", path: "/subject/mathematics" },
            ].map(s => {
              const Icon = s.icon;
              return (
                <Link key={s.label} href={s.path}>
                  <div className={`border rounded-2xl p-6 ${s.bg} hover:shadow-md transition-all cursor-pointer group`}>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-sm`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-xl font-bold ${s.text}`}>{s.label}</h3>
                      <span className={`text-sm font-medium ${s.text} opacity-70`}>{s.chapters} chapters</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4">{s.desc}</p>
                    <div className={`flex items-center gap-1 text-sm font-medium ${s.text} group-hover:gap-2 transition-all`}>
                      Explore chapters <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold mb-4">How the Multi-Tenant System Works</h2>
            <p className="text-indigo-200 text-lg max-w-2xl mx-auto">A single platform that serves every stakeholder in an educational institute.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "01", icon: Building2, title: "Institute Onboards", desc: "Super Admin creates an institute. Institute Admin configures classes, subjects, and teacher mappings." },
              { step: "02", icon: Users, title: "Users Are Invited", desc: "Institute Admin sends invite links to teachers, students, and parents. Each accepts and gets their role." },
              { step: "03", icon: BookOpen, title: "Learning Begins", desc: "Students access narrations, past papers, and assessments. Teachers schedule live classes and assignments." },
              { step: "04", icon: BarChart3, title: "Analytics & Reports", desc: "Parents track attendance and report cards. Admins monitor fees, alerts, and overall institute performance." },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-indigo-300 font-mono text-sm font-bold">{s.step}</span>
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-indigo-200 text-sm leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-500 mb-8">Sign in with your Manus account. Your role is automatically detected and you'll be taken straight to your portal.</p>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Link href="/login">
              <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-8 text-base font-semibold shadow-lg shadow-indigo-200">
                <GraduationCap className="w-5 h-5" />Sign In with Manus<ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline" className="gap-2 h-12 px-8 text-base border-gray-300">
                <BookOpen className="w-5 h-5" />Browse Content
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {["Secure OAuth 2.0", "No password needed", "Role auto-detected", "Free to start"].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-sm text-gray-400">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />{t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-700">ExamForge AI</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/search" className="hover:text-gray-600 transition-colors">Search</Link>
            <Link href="/api-docs" className="hover:text-gray-600 transition-colors">API Docs</Link>
            <Link href="/onboard" className="hover:text-gray-600 transition-colors">Onboarding</Link>
          </div>
          <p className="text-sm text-gray-400">© 2025 ExamForge AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
