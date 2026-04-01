import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  GraduationCap, BookOpen, Target, Zap, BarChart3,
  ArrowRight, CheckCircle, Users, Building2, Star
} from "lucide-react";

const FEATURES = [
  { icon: BookOpen, text: "80 chapters — Physics, Chemistry, Mathematics" },
  { icon: Target, text: "10 years of JEE Main & Advanced past papers" },
  { icon: Zap, text: "AI-powered narration scripts for every chapter" },
  { icon: BarChart3, text: "Real-time performance heatmap & score prediction" },
  { icon: Users, text: "Multi-role portal: Student, Teacher, Parent, Admin" },
  { icon: Building2, text: "Institute management with attendance & assignments" },
];

const ROLES = [
  { role: "Student", desc: "Access chapters, take tests, track your JEE readiness", color: "bg-blue-50 border-blue-200 text-blue-700" },
  { role: "Teacher", desc: "Create classes, lesson plans, assign tests, grade students", color: "bg-green-50 border-green-200 text-green-700" },
  { role: "Parent", desc: "Monitor attendance, grades, and upcoming schedule", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { role: "Institute Admin", desc: "Manage users, classes, subjects, and fee collection", color: "bg-orange-50 border-orange-200 text-orange-700" },
];

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white/20 translate-y-1/2 -translate-x-1/2" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-xl leading-none">ExamForge AI</div>
              <div className="text-white/70 text-xs">Universal Knowledge Platform</div>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Master Any Exam with<br />
            <span className="text-white/80">AI-Powered Guidance</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-10">
            The complete LMS for institutes and students — JEE, NEET, GATE, and more.
            Narration scripts, past papers, live classes, attendance, and intelligent analytics.
          </p>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.text} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/85 text-sm">{f.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats at bottom */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "80", label: "Chapters" },
            { value: "2400+", label: "Questions" },
            { value: "5", label: "User Roles" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-white/60 text-xs">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold text-foreground text-lg leading-none">ExamForge AI</div>
            <div className="text-muted-foreground text-xs">Universal Knowledge Platform</div>
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to access your dashboard, study materials, and institute portal.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-6 p-4 bg-muted rounded-xl">
              <Star className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Single sign-on via <strong className="text-foreground">Manus OAuth</strong> — secure, no password required.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full gap-3 h-12 text-base font-semibold"
              onClick={handleLogin}
            >
              <GraduationCap className="w-5 h-5" />
              Sign in with Manus
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy.
              New users are automatically registered on first sign-in.
            </p>
          </div>

          {/* Role pills */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Available for all roles
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map(r => (
                <div key={r.role} className={`border rounded-xl p-3 ${r.color}`}>
                  <div className="font-semibold text-sm mb-0.5">{r.role}</div>
                  <div className="text-xs opacity-80 leading-tight">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap gap-3 justify-center">
            {["Secure OAuth 2.0", "No password needed", "Free to start"].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
