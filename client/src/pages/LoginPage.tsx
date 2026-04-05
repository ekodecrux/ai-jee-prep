import { useState } from "react";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, UserCheck, Heart, Building2, Shield,
  ArrowRight, CheckCircle, Sparkles, BookOpen, Target,
  Zap, BarChart3, Users, Lock, ChevronRight
} from "lucide-react";

const ROLES = [
  {
    id: "student",
    role: "Student",
    icon: GraduationCap,
    gradient: "from-blue-500 to-indigo-600",
    lightBg: "bg-blue-50",
    border: "border-blue-200",
    ring: "ring-blue-400",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700",
    desc: "Access your personalised study plan, chapter narrations, live classes, past papers, and performance analytics.",
    perks: ["80 AI-narrated chapters", "Live class access", "Report card & heatmap", "JEE score prediction"],
  },
  {
    id: "teacher",
    role: "Teacher",
    icon: UserCheck,
    gradient: "from-teal-500 to-emerald-600",
    lightBg: "bg-teal-50",
    border: "border-teal-200",
    ring: "ring-teal-400",
    text: "text-teal-700",
    badge: "bg-teal-100 text-teal-700",
    desc: "Manage classes, create lesson plans, conduct Jitsi live sessions, assign homework, and grade students.",
    perks: ["Lesson plan builder", "Jitsi live classes", "Assignment & grading", "Student progress view"],
  },
  {
    id: "parent",
    role: "Parent",
    icon: Heart,
    gradient: "from-rose-500 to-pink-600",
    lightBg: "bg-rose-50",
    border: "border-rose-200",
    ring: "ring-rose-400",
    text: "text-rose-700",
    badge: "bg-rose-100 text-rose-700",
    desc: "Monitor your child's attendance, chapter heatmap, report card, and pay fees securely via Stripe.",
    perks: ["Attendance tracking", "Chapter heatmap view", "Report card download", "Online fee payment"],
  },
  {
    id: "institute_admin",
    role: "Institute Admin",
    icon: Building2,
    gradient: "from-amber-500 to-orange-600",
    lightBg: "bg-amber-50",
    border: "border-amber-200",
    ring: "ring-amber-400",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    desc: "Onboard staff and students, manage classes, track fee collection, and generate monthly reports.",
    perks: ["User onboarding & invites", "Class & subject setup", "Fee management", "Attendance reports"],
  },
  {
    id: "super_admin",
    role: "Super Admin",
    icon: Shield,
    gradient: "from-purple-500 to-violet-600",
    lightBg: "bg-purple-50",
    border: "border-purple-200",
    ring: "ring-purple-400",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-700",
    desc: "Oversee all institutes, manage subscriptions, control global content, and monitor system health.",
    perks: ["Multi-institute dashboard", "Global content control", "API key management", "System health monitor"],
  },
];

const STATS = [
  { value: "80", label: "Chapters" },
  { value: "2,400+", label: "Questions" },
  { value: "5", label: "User Roles" },
  { value: "∞", label: "Institutes" },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  const selected = ROLES.find(r => r.id === selectedRole);

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-x-hidden">
      {/* Top nav bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-gray-950/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <GraduationCap className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm leading-none">ExamForge AI</span>
            <span className="block text-white/40 text-[10px] leading-none mt-0.5">Universal Knowledge Platform</span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleLogin}
          className="gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border-0 text-xs h-8 px-4"
        >
          Sign In <ArrowRight className="w-3 h-3" />
        </Button>
      </nav>

      {/* Hero section */}
      <div className="pt-24 pb-16 px-6 text-center relative">
        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-indigo-300 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Multi-Tenant LMS Platform — JEE, NEET, GATE & More
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-5 tracking-tight">
            One Platform,{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Every Role
            </span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
            Students, Teachers, Parents, Institute Admins, and Super Admins — each with their own
            dedicated portal, real-time data, and AI-powered tools.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-12">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-white">{s.value}</div>
                <div className="text-gray-500 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Main CTA */}
          <Button
            size="lg"
            onClick={handleLogin}
            className="gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 h-14 px-10 text-base font-semibold shadow-2xl shadow-indigo-900/50 rounded-xl"
          >
            <GraduationCap className="w-5 h-5" />
            Sign In with Manus OAuth
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-gray-600 text-xs mt-3 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" /> Secure OAuth 2.0 · No password required · Free to start
          </p>
        </div>
      </div>

      {/* Role cards section */}
      <div className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white mb-2">Choose Your Role</h2>
          <p className="text-gray-500 text-sm">
            After signing in, you'll be automatically directed to your portal based on your assigned role.
            Click a card to preview what each role can do.
          </p>
        </div>

        {/* Role grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
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
                    ? `bg-gradient-to-br ${r.gradient} border-transparent shadow-2xl scale-[1.02]`
                    : "bg-gray-900 border-white/8 hover:border-white/20 hover:bg-gray-800/80"
                  }
                `}
              >
                {/* Icon */}
                <div className={`
                  w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all
                  ${isSelected ? "bg-white/20" : `bg-gradient-to-br ${r.gradient}`}
                `}>
                  <Icon className="w-5.5 h-5.5 text-white" />
                </div>

                {/* Role name */}
                <div className={`font-bold text-sm mb-1 ${isSelected ? "text-white" : "text-gray-100"}`}>
                  {r.role}
                </div>

                {/* Short desc */}
                <p className={`text-xs leading-relaxed ${isSelected ? "text-white/80" : "text-gray-500"}`}>
                  {r.desc.split(",")[0]}.
                </p>

                {/* Arrow indicator */}
                <ChevronRight className={`
                  absolute top-4 right-4 w-4 h-4 transition-all
                  ${isSelected ? "text-white/70 rotate-90" : "text-gray-700 group-hover:text-gray-400"}
                `} />
              </button>
            );
          })}
        </div>

        {/* Expanded role detail */}
        {selected && (
          <div className={`rounded-2xl border bg-gray-900 border-white/10 p-8 mb-8 transition-all`}>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Left: role info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selected.gradient} flex items-center justify-center`}>
                    <selected.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selected.role} Portal</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selected.badge}`}>
                      Role: {selected.id}
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{selected.desc}</p>
                <Button
                  onClick={handleLogin}
                  className={`gap-2 bg-gradient-to-r ${selected.gradient} text-white border-0 hover:opacity-90`}
                >
                  Sign in as {selected.role}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Right: perks */}
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                  What you get
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selected.perks.map(perk => (
                    <div key={perk} className="flex items-center gap-2.5 bg-gray-800/60 rounded-xl px-3.5 py-2.5">
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 bg-gradient-to-br ${selected.gradient} rounded-full text-white`} />
                      <span className="text-gray-300 text-sm">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="rounded-2xl bg-gray-900 border border-white/8 p-8">
          <h3 className="text-lg font-bold text-white mb-6 text-center">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "1",
                icon: Lock,
                title: "Sign in with Manus",
                desc: "One-click OAuth login — no password, no registration form. Your Manus account is all you need.",
                gradient: "from-indigo-500 to-blue-600",
              },
              {
                step: "2",
                icon: Users,
                title: "Get assigned a role",
                desc: "Institute Admins create institutes and send invite links. Students, Teachers, and Parents join via invite codes.",
                gradient: "from-teal-500 to-emerald-600",
              },
              {
                step: "3",
                icon: BarChart3,
                title: "Access your portal",
                desc: "You're automatically redirected to your role-specific portal with all features, data, and tools ready.",
                gradient: "from-purple-500 to-violet-600",
              },
            ].map(step => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 font-semibold uppercase tracking-widest mb-1">Step {step.step}</div>
                    <h4 className="text-white font-semibold text-sm mb-1">{step.title}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom CTA strip */}
      <div className="border-t border-white/5 bg-gray-900/50 px-6 py-10 text-center">
        <p className="text-gray-400 text-sm mb-4">
          Ready to get started? Sign in now — new users are automatically registered on first login.
        </p>
        <Button
          size="lg"
          onClick={handleLogin}
          className="gap-3 bg-white text-gray-900 hover:bg-gray-100 border-0 h-12 px-8 text-sm font-bold rounded-xl"
        >
          <GraduationCap className="w-5 h-5" />
          Sign In with Manus OAuth
          <ArrowRight className="w-4 h-4" />
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-xs text-gray-600">
          {["Secure OAuth 2.0", "No password needed", "Free to start", "All roles supported"].map(t => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
