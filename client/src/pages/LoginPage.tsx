import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, UserCheck, Heart, Building2, Shield,
  ArrowRight, CheckCircle, Sparkles, BookOpen, Target,
  Zap, BarChart3, Users, Lock, ChevronRight, ChevronLeft,
  Plus, Chrome, Github, Monitor, Mail,
} from "lucide-react";

const ROLES = [
  {
    id: "student",
    role: "Student",
    icon: GraduationCap,
    gradient: "from-blue-500 to-indigo-600",
    hoverGlow: "hover:shadow-blue-500/25",
    border: "border-blue-500/30",
    ring: "ring-blue-400",
    text: "text-blue-400",
    badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    desc: "Access your personalised study plan, AI-narrated chapters, live classes, past papers, and performance analytics.",
    perks: ["AI-powered study plan", "Live class access", "Report card & heatmap", "Score prediction"],
    exams: ["JEE", "NEET", "GATE", "UPSC", "CAT"],
  },
  {
    id: "teacher",
    role: "Teacher",
    icon: UserCheck,
    gradient: "from-teal-500 to-emerald-600",
    hoverGlow: "hover:shadow-teal-500/25",
    border: "border-teal-500/30",
    ring: "ring-teal-400",
    text: "text-teal-400",
    badge: "bg-teal-500/10 text-teal-400 border border-teal-500/20",
    desc: "Manage classes, create lesson plans, conduct live sessions, assign homework, and track student progress.",
    perks: ["Lesson plan builder", "Jitsi live classes", "Assignment & grading", "Student analytics"],
    exams: ["All Boards", "IIT-JEE", "NEET", "CBSE"],
  },
  {
    id: "parent",
    role: "Parent",
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    hoverGlow: "hover:shadow-rose-500/25",
    border: "border-rose-500/30",
    ring: "ring-rose-400",
    text: "text-rose-400",
    badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    desc: "Monitor your child's attendance, chapter heatmap, report card, and pay fees securely online.",
    perks: ["Attendance tracking", "Chapter heatmap", "Report card download", "Online fee payment"],
    exams: ["All Exams"],
  },
  {
    id: "institute_admin",
    role: "Institute Admin",
    icon: Building2,
    gradient: "from-amber-500 to-orange-600",
    hoverGlow: "hover:shadow-amber-500/25",
    border: "border-amber-500/30",
    ring: "ring-amber-400",
    text: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    desc: "Onboard staff and students, manage classes, track fee collection, and generate monthly reports.",
    perks: ["User onboarding & invites", "Class & subject setup", "Fee management", "Attendance reports"],
    exams: ["All Exams"],
  },
  {
    id: "super_admin",
    role: "Super Admin",
    icon: Shield,
    gradient: "from-purple-500 to-violet-600",
    hoverGlow: "hover:shadow-purple-500/25",
    border: "border-purple-500/30",
    ring: "ring-purple-400",
    text: "text-purple-400",
    badge: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    desc: "Oversee all institutes, manage subscriptions, control global content, and monitor system health.",
    perks: ["Multi-institute dashboard", "Global content control", "API management", "System health"],
    exams: ["Platform-wide"],
  },
];

// Social login providers — all route through Manus OAuth (single provider)
const SOCIAL_PROVIDERS = [
  {
    id: "google",
    label: "Continue with Google",
    icon: Chrome,
    bg: "bg-white hover:bg-gray-50",
    text: "text-gray-800",
    border: "border-gray-200",
  },
  {
    id: "github",
    label: "Continue with GitHub",
    icon: Github,
    bg: "bg-gray-900 hover:bg-gray-800",
    text: "text-white",
    border: "border-gray-700",
  },
  {
    id: "microsoft",
    label: "Continue with Microsoft",
    icon: Monitor,
    bg: "bg-[#0078D4] hover:bg-[#106EBE]",
    text: "text-white",
    border: "border-[#0078D4]",
  },
  {
    id: "email",
    label: "Continue with Email",
    icon: Mail,
    bg: "bg-gray-800 hover:bg-gray-700",
    text: "text-white",
    border: "border-gray-600",
  },
];

export default function LoginPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const preselectedRole = searchParams.get("role");
  const initialRole = preselectedRole && ROLES.find(r => r.id === preselectedRole) ? preselectedRole : null;
  const initialCarouselIndex = preselectedRole ? Math.max(0, ROLES.findIndex(r => r.id === preselectedRole)) : 0;
  const [selectedRole, setSelectedRole] = useState<string | null>(initialRole);
  const [carouselIndex, setCarouselIndex] = useState(initialCarouselIndex);
  const [, navigate] = useLocation();
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  const handleDemo = (roleId: string) => {
    navigate(`/demo?role=${roleId}`);
  };

  const selected = ROLES.find(r => r.id === selectedRole);

  const scrollCarousel = (dir: "left" | "right") => {
    const next = dir === "right"
      ? Math.min(carouselIndex + 1, ROLES.length - 1)
      : Math.max(carouselIndex - 1, 0);
    setCarouselIndex(next);
    if (carouselRef.current) {
      const card = carouselRef.current.children[next] as HTMLElement;
      card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/8 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[600px] h-[300px] bg-blue-600/6 rounded-full blur-[160px]" />
      </div>

      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-4 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm leading-none group-hover:text-indigo-300 transition-colors">ExamForge AI</span>
            <span className="hidden sm:block text-white/30 text-[10px] leading-none mt-0.5">Universal Knowledge Platform</span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/register-institute">
            <Button size="sm" variant="ghost" className="gap-1.5 text-gray-400 hover:text-white text-xs h-8 px-3 hidden sm:flex">
              <Plus className="w-3 h-3" /> Register Institute
            </Button>
          </Link>
          <Button size="sm" onClick={handleLogin} className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border-0 text-xs h-8 px-4 shadow-lg shadow-indigo-900/40">
            Sign In <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </nav>

      <div className="relative z-10 pt-20 pb-10 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Two-column layout on large screens */}
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start pt-8 lg:pt-16">

          {/* LEFT: Sign-in panel */}
          <div className="w-full lg:w-[420px] lg:sticky lg:top-24 flex-shrink-0">
            {/* Brand badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3.5 py-1.5 text-indigo-300 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              JEE · NEET · GATE · UPSC · CAT · K-12
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-3 tracking-tight">
              Sign in to{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                ExamForge AI
              </span>
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              One platform for every role — Students, Teachers, Parents, Institute Admins, and Super Admins each get their own dedicated portal.
            </p>

            {/* Social login buttons */}
            <div className="space-y-3 mb-6">
              {SOCIAL_PROVIDERS.map(provider => {
                const Icon = provider.icon;
                return (
                  <button
                    key={provider.id}
                    onClick={handleLogin}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl border font-medium text-sm
                      transition-all duration-150 shadow-sm hover:shadow-md
                      ${provider.bg} ${provider.text} ${provider.border}
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {provider.label}
                    <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-50" />
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-gray-600 text-xs">or sign in with Manus</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Primary Manus OAuth button */}
            <Button
              onClick={handleLogin}
              className="w-full gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 h-12 text-sm font-semibold shadow-xl shadow-indigo-900/40 rounded-xl mb-4"
            >
              <GraduationCap className="w-4 h-4" />
              Continue with Manus OAuth
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>

            <p className="text-gray-600 text-xs flex items-center justify-center gap-1.5 mb-8">
              <Lock className="w-3 h-3" /> OAuth 2.0 · No password required · Free to start
            </p>

            {/* Institute admin CTA */}
            <div className="rounded-xl bg-amber-500/8 border border-amber-500/15 p-4">
              <p className="text-amber-300 text-xs font-semibold mb-1">🏫 New institute?</p>
              <p className="text-gray-500 text-xs mb-3">Register your school or coaching centre and get invite links for all roles in 2 minutes.</p>
              <Link href="/register-institute">
                <Button size="sm" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 hover:opacity-90 w-full text-xs">
                  <Building2 className="w-3.5 h-3.5" />
                  Register Your Institute
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </Button>
              </Link>
            </div>
          </div>

          {/* RIGHT: Role cards + detail */}
          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Choose Your Role</h2>
              <p className="text-gray-500 text-sm">
                After signing in, you'll be automatically directed to your portal. Click a card to preview what each role can do.
              </p>
            </div>

            {/* Desktop grid */}
            <div className="hidden sm:grid grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRole(isSelected ? null : r.id)}
                    className={`
                      relative text-left rounded-2xl border p-5 transition-all duration-200 cursor-pointer group
                      ${isSelected
                        ? `bg-gradient-to-br ${r.gradient} border-transparent shadow-2xl ${r.hoverGlow} scale-[1.02]`
                        : `bg-gray-900/60 border-white/8 hover:border-white/15 hover:bg-gray-800/60 hover:shadow-xl ${r.hoverGlow}`
                      }
                    `}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all ${isSelected ? "bg-white/20" : `bg-gradient-to-br ${r.gradient}`}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className={`font-bold text-sm mb-1 ${isSelected ? "text-white" : "text-gray-100"}`}>
                      {r.role}
                    </div>
                    <p className={`text-xs leading-relaxed mb-3 ${isSelected ? "text-white/80" : "text-gray-500"}`}>
                      {r.desc.split(",")[0]}.
                    </p>
                    {/* Exam tags */}
                    <div className="flex flex-wrap gap-1">
                      {r.exams.slice(0, 3).map(exam => (
                        <span key={exam} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isSelected ? "bg-white/20 text-white" : r.badge}`}>
                          {exam}
                        </span>
                      ))}
                    </div>
                    <ChevronRight className={`absolute top-4 right-4 w-4 h-4 transition-all ${isSelected ? "text-white/70 rotate-90" : "text-gray-700 group-hover:text-gray-400"}`} />
                  </button>
                );
              })}
            </div>

            {/* Mobile carousel */}
            <div className="sm:hidden mb-5">
              <div className="relative">
                <div
                  ref={carouselRef}
                  className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {ROLES.map((r, idx) => {
                    const Icon = r.icon;
                    const isSelected = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => { setCarouselIndex(idx); setSelectedRole(isSelected ? null : r.id); }}
                        className={`flex-shrink-0 w-[72vw] max-w-[260px] snap-center text-left rounded-2xl border p-5 transition-all duration-200 cursor-pointer ${isSelected ? `bg-gradient-to-br ${r.gradient} border-transparent shadow-2xl` : "bg-gray-900/60 border-white/8"}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${isSelected ? "bg-white/20" : `bg-gradient-to-br ${r.gradient}`}`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className={`font-bold text-sm mb-1 ${isSelected ? "text-white" : "text-gray-100"}`}>{r.role}</div>
                        <p className={`text-xs leading-relaxed ${isSelected ? "text-white/80" : "text-gray-500"}`}>{r.desc.split(",")[0]}.</p>
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <button onClick={() => scrollCarousel("left")} disabled={carouselIndex === 0} className="w-8 h-8 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4 text-gray-300" />
                  </button>
                  <div className="flex gap-1.5">
                    {ROLES.map((_, i) => (
                      <button key={i} onClick={() => { setCarouselIndex(i); const card = carouselRef.current?.children[i] as HTMLElement; card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" }); }} className={`h-1.5 rounded-full transition-all ${i === carouselIndex ? "bg-indigo-400 w-4" : "bg-gray-700 w-1.5"}`} />
                    ))}
                  </div>
                  <button onClick={() => scrollCarousel("right")} disabled={carouselIndex === ROLES.length - 1} className="w-8 h-8 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center disabled:opacity-30">
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded role detail */}
            {selected && (
              <div className={`rounded-2xl border bg-gray-900/80 ${selected.border} p-6 mb-6 transition-all backdrop-blur-sm`}>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${selected.gradient} flex items-center justify-center shadow-lg`}>
                        <selected.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{selected.role} Portal</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selected.badge}`}>
                          {selected.exams.join(" · ")}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-5">{selected.desc}</p>

                    {selected.id === "institute_admin" && (
                      <div className="mb-5 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/15">
                        <p className="text-amber-300 text-xs font-semibold mb-2">🏫 New to ExamForge AI? Register your institute in 2 minutes.</p>
                        <Link href="/register-institute">
                          <Button size="sm" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 hover:opacity-90 text-xs">
                            <Building2 className="w-3.5 h-3.5" /> Create Your Institute <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={handleLogin} className={`gap-2 bg-gradient-to-r ${selected.gradient} text-white border-0 hover:opacity-90 shadow-lg`}>
                        Sign in as {selected.role} <ArrowRight className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleDemo(selected.id)} variant="outline" className="gap-2 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white">
                        <BookOpen className="w-4 h-4" /> Preview Demo
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">What you get</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selected.perks.map(perk => (
                        <div key={perk} className="flex items-center gap-2.5 bg-gray-800/50 rounded-xl px-3.5 py-2.5 border border-white/5">
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${selected.text}`} />
                          <span className="text-gray-300 text-sm">{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="rounded-2xl bg-gray-900/60 border border-white/6 p-6 backdrop-blur-sm">
              <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" /> How it works
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { step: "1", icon: Lock, title: "Sign in", desc: "One-click OAuth login — no password, no registration form. Your account is all you need.", gradient: "from-indigo-500 to-blue-600" },
                  { step: "2", icon: Users, title: "Get your role", desc: "Institute Admins register and send invite links. Students, Teachers, and Parents join via invite codes.", gradient: "from-teal-500 to-emerald-600" },
                  { step: "3", icon: BarChart3, title: "Access your portal", desc: "Automatically redirected to your role-specific portal with all features, data, and AI tools ready.", gradient: "from-purple-500 to-violet-600" },
                ].map(step => {
                  const Icon = step.icon;
                  return (
                    <div key={step.step} className="flex gap-3.5">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-0.5">Step {step.step}</div>
                        <h4 className="text-white font-semibold text-sm mb-1">{step.title}</h4>
                        <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 pt-6 border-t border-white/5">
              {[
                { icon: Shield, label: "OAuth 2.0 Secure" },
                { icon: Target, label: "5 Exam Boards" },
                { icon: Users, label: "5 User Roles" },
                { icon: CheckCircle, label: "Free to Start" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-gray-500 text-xs">
                  <Icon className="w-3.5 h-3.5 text-green-500" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/5 bg-gray-900/30 px-4 sm:px-8 py-6 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <GraduationCap className="w-3 h-3 text-white" />
            </div>
            <span className="text-gray-500 text-xs">© 2026 ExamForge AI · Universal Knowledge Platform</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <Link href="/" className="hover:text-gray-400 transition-colors">Home</Link>
            <Link href="/demo?role=student" className="hover:text-gray-400 transition-colors">Demo</Link>
            <Link href="/register-institute" className="hover:text-gray-400 transition-colors">Register Institute</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
