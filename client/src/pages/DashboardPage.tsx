/**
 * Student Dashboard — ExamForge AI LMS
 *
 * Tabs: Overview | Today's Activities | Chapter Heatmap | Attendance | Live Classes | Lesson Plans | Assessments | Assignments | Bridge Courses
 */
import { useState } from "react";
import { Link, useLocation } from "wouter";
import PlatformLayout from "@/components/PlatformLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Target, Trophy, TrendingUp, Zap, Calendar, CheckSquare,
  Video, FileText, FileCheck, Brain, Atom, FlaskConical, Calculator,
  Clock, AlertCircle, ChevronRight, BarChart3, Activity,
  Loader2, ArrowRight, Star, CheckCircle, Lock
} from "lucide-react";

// ─── Heatmap color helpers ─────────────────────────────────────────────────────
function getHeatColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-green-400";
  if (score >= 40) return "bg-yellow-400";
  if (score >= 20) return "bg-orange-400";
  if (score > 0) return "bg-red-400";
  return "bg-gray-100";
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab() {
  const { user, isAuthenticated } = useAuth();
  const { data: summary, isLoading } = trpc.chapters.getDashboardSummary.useQuery(undefined, { enabled: isAuthenticated });
  const { data: analytics } = trpc.assessments.getAnalytics.useQuery(undefined, { enabled: isAuthenticated });
  const { data: heatmap } = trpc.analytics.getHeatmap.useQuery({});
  const { data: prediction } = trpc.analytics.getPrediction.useQuery({ examId: "jee_main" });

  const overallProgress = summary?.overallProgress || 0;
  const subjectSummary = summary?.subjectSummary || {};

  const subjects = [
    { id: "physics", label: "Physics", icon: Atom, color: "text-blue-600", bg: "bg-blue-50", chapters: 25 },
    { id: "chemistry", label: "Chemistry", icon: FlaskConical, color: "text-green-600", bg: "bg-green-50", chapters: 28 },
    { id: "mathematics", label: "Mathematics", icon: Calculator, color: "text-amber-600", bg: "bg-amber-50", chapters: 27 },
  ];

  if (isLoading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-200 text-sm mb-1">Welcome back,</p>
            <h2 className="text-2xl font-bold">{user?.name || "JEE Aspirant"}</h2>
            <p className="text-indigo-200 text-sm mt-1">
              {summary?.completed ? `🔥 ${summary.completed} chapters done! Keep it up.` : "Start your JEE preparation journey today."}
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{Math.round(overallProgress)}%</div>
            <div className="text-indigo-200 text-xs">Overall Progress</div>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-indigo-200 mt-1">
          <span>{summary?.completed || 0} chapters completed</span>
          <span>{summary?.totalChapters || 80} total chapters</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Chapters Done", value: summary?.completed || 0, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Assessments", value: analytics?.totalAttempts || 0, icon: Target, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Avg Score", value: analytics?.avgScore ? `${Math.round(analytics.avgScore)}%` : "—", icon: BarChart3, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Predicted Score", value: prediction ? `${prediction.predictedScore}/300` : "—", icon: Trophy, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(s => (
          <Card key={s.label} className="border-gray-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject progress cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subjects.map(sub => {
          const subData = (subjectSummary as any)[sub.id];
          const total = subData?.total || sub.chapters;
          const completed = subData?.completed || 0;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          return (
            <Link key={sub.id} href={`/subject/${sub.id}`}>
              <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${sub.bg} flex items-center justify-center`}>
                      <sub.icon className={`w-5 h-5 ${sub.color}`} />
                    </div>
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${sub.color}`}>{pct}%</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900">{sub.label}</h3>
                  <p className="text-sm text-gray-500 mb-3">{completed}/{total} chapters</p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${sub.color.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                    <span>In Progress: {subData?.inProgress || 0}</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Mock Test", icon: Trophy, href: "/mock-test/jee_main_full", color: "bg-indigo-600" },
            { label: "Study Plan", icon: Calendar, href: "/study-plan", color: "bg-teal-600" },
            { label: "Performance", icon: BarChart3, href: "/performance", color: "bg-purple-600" },
            { label: "All Chapters", icon: BookOpen, href: "/subject/physics", color: "bg-amber-600" },
          ].map(a => (
            <Link key={a.label} href={a.href}>
              <button className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl ${a.color} text-white text-sm font-medium hover:opacity-90 transition-opacity`}>
                <a.icon className="w-4 h-4" />
                {a.label}
              </button>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Performance overview */}
      {analytics && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Best Score", value: analytics.bestScore ? `${Math.round(analytics.bestScore)}%` : "—", color: "text-emerald-600" },
                { label: "Average Score", value: analytics.avgScore ? `${Math.round(analytics.avgScore)}%` : "—", color: "text-gray-900" },
                { label: "Pass Rate", value: analytics.passRate ? `${Math.round(analytics.passRate)}%` : "—", color: "text-gray-900" },
                { label: "Total Attempts", value: analytics.totalAttempts || 0, color: "text-gray-900" },
              ].map(item => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={`font-semibold ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Topics to Focus On
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.weakTopics && analytics.weakTopics.length > 0 ? (
                <div className="space-y-2">
                  {analytics.weakTopics.slice(0, 5).map((item: { topic: string; count: number }, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                      <span className="text-gray-600">{item.topic}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Complete more assessments to identify weak topics.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Chapter Performance Heatmap Tab ──────────────────────────────────────────
function PerformanceHeatmapTab() {
  const { data: heatmap, isLoading } = trpc.analytics.getHeatmap.useQuery({});

  const CHAPTERS_BY_SUBJECT: Record<string, string[]> = {
    Physics: [
      "Units & Measurement", "Kinematics", "Laws of Motion", "Work Energy Power", "Rotational Motion",
      "Gravitation", "Properties of Matter", "Thermodynamics", "Kinetic Theory", "Oscillations",
      "Waves", "Electrostatics", "Current Electricity", "Magnetic Effects", "Electromagnetic Induction",
      "AC Circuits", "EM Waves", "Ray Optics", "Wave Optics", "Dual Nature",
      "Atoms & Nuclei", "Semiconductors", "Communication Systems", "Experimental Physics", "Modern Physics"
    ],
    Chemistry: [
      "Basic Concepts", "Atomic Structure", "Chemical Bonding", "States of Matter", "Thermodynamics",
      "Equilibrium", "Redox Reactions", "Hydrogen", "s-Block Elements", "p-Block Elements",
      "Organic Chemistry Basics", "Hydrocarbons", "Environmental Chemistry", "Solid State", "Solutions",
      "Electrochemistry", "Chemical Kinetics", "Surface Chemistry", "Metallurgy", "d & f Block",
      "Coordination Compounds", "Haloalkanes", "Alcohols & Phenols", "Aldehydes & Ketones",
      "Carboxylic Acids", "Amines", "Biomolecules", "Polymers"
    ],
    Mathematics: [
      "Sets & Relations", "Complex Numbers", "Quadratic Equations", "Sequences & Series", "Binomial Theorem",
      "Permutations & Combinations", "Mathematical Induction", "Matrices", "Determinants", "Limits",
      "Continuity", "Differentiation", "Applications of Derivatives", "Integrals", "Applications of Integrals",
      "Differential Equations", "Vectors", "3D Geometry", "Straight Lines", "Circles",
      "Conic Sections", "Probability", "Statistics", "Trigonometry", "Inverse Trigonometry",
      "Mathematical Reasoning", "Linear Programming"
    ],
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap p-4 bg-gray-50 rounded-xl">
        <span className="text-sm text-gray-500 font-medium">Score Legend:</span>
        {[
          { label: "≥80% Mastered", color: "bg-emerald-500" },
          { label: "60–79% Good", color: "bg-green-400" },
          { label: "40–59% Fair", color: "bg-yellow-400" },
          { label: "20–39% Weak", color: "bg-orange-400" },
          { label: "<20% Critical", color: "bg-red-400" },
          { label: "Not Attempted", color: "bg-gray-100 border border-gray-200" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${l.color}`} />
            <span className="text-xs text-gray-600">{l.label}</span>
          </div>
        ))}
      </div>

      {Object.entries(CHAPTERS_BY_SUBJECT).map(([subject, chapters]) => (
        <Card key={subject} className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-gray-900 flex items-center gap-2">
              {subject === "Physics" && <Atom className="w-4 h-4 text-blue-600" />}
              {subject === "Chemistry" && <FlaskConical className="w-4 h-4 text-green-600" />}
              {subject === "Mathematics" && <Calculator className="w-4 h-4 text-amber-600" />}
              {subject}
              <span className="text-xs text-gray-400 font-normal ml-1">({chapters.length} chapters)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-13 gap-1.5">
              {chapters.map((ch, i) => {
                const key = `${subject.charAt(0)}${i + 1}`;
                const score = (heatmap as any)?.[key] || 0;
                return (
                  <div
                    key={ch}
                    title={`${ch}: ${score}%`}
                    className={`w-full aspect-square rounded-md ${getHeatColor(score)} cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center`}
                  >
                    <span className="text-[9px] font-bold text-white drop-shadow">{i + 1}</span>
                  </div>
                );
              })}
            </div>
            {/* Chapter index */}
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-0.5">
              {chapters.slice(0, 9).map((ch, i) => {
                const key = `${subject.charAt(0)}${i + 1}`;
                const score = (heatmap as any)?.[key] || 0;
                return (
                  <div key={ch} className="flex items-center gap-1.5 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${getHeatColor(score)}`} />
                    <span className="truncate">{i + 1}. {ch}</span>
                    <span className="text-gray-400 flex-shrink-0">{score}%</span>
                  </div>
                );
              })}
              {chapters.length > 9 && (
                <p className="text-xs text-gray-400 col-span-full mt-1">Hover cells for all chapter details</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Attendance Calendar Tab ───────────────────────────────────────────────────
function AttendanceTab() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const firstDay = new Date(year, monthNum - 1, 1).getDay();

  // Simulated attendance (replace with real trpc query once teacher marks attendance)
  const mockAttendance: Record<number, "present" | "absent" | "late"> = {};
  const today = new Date();
  const isCurrentMonth = month === today.toISOString().slice(0, 7);
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;
  for (let d = 1; d <= lastDay; d++) {
    const rand = Math.random();
    mockAttendance[d] = rand > 0.15 ? "present" : rand > 0.07 ? "late" : "absent";
  }

  const presentDays = Object.values(mockAttendance).filter(v => v === "present").length;
  const lateDays = Object.values(mockAttendance).filter(v => v === "late").length;
  const absentDays = Object.values(mockAttendance).filter(v => v === "absent").length;
  const totalMarked = presentDays + lateDays + absentDays;
  const attendancePct = totalMarked > 0 ? Math.round(((presentDays + lateDays * 0.5) / totalMarked) * 100) : 0;
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Present", value: presentDays, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Late", value: lateDays, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Absent", value: absentDays, color: "text-red-600", bg: "bg-red-50" },
          { label: "Attendance %", value: `${attendancePct}%`, color: attendancePct >= 75 ? "text-emerald-600" : "text-red-600", bg: attendancePct >= 75 ? "bg-emerald-50" : "bg-red-50" },
        ].map(s => (
          <Card key={s.label} className="border-gray-200 shadow-sm">
            <CardContent className="p-5 text-center">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {attendancePct < 75 && totalMarked > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">Your attendance is below 75%. Please attend more classes to avoid academic penalties.</p>
        </div>
      )}

      {/* Calendar */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base text-gray-900">Attendance Calendar</CardTitle>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const status = mockAttendance[day];
              const isToday = day === today.getDate() && isCurrentMonth;
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all
                    ${isToday ? "ring-2 ring-indigo-500 ring-offset-1" : ""}
                    ${status === "present" ? "bg-emerald-100 text-emerald-700" :
                      status === "absent" ? "bg-red-100 text-red-700" :
                      status === "late" ? "bg-amber-100 text-amber-700" :
                      "bg-gray-50 text-gray-300"}
                  `}
                >
                  {day}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            {[
              { label: "Present", cls: "bg-emerald-100 text-emerald-700" },
              { label: "Late", cls: "bg-amber-100 text-amber-700" },
              { label: "Absent", cls: "bg-red-100 text-red-700" },
              { label: "No Class", cls: "bg-gray-50 text-gray-300" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded text-xs flex items-center justify-center font-medium ${l.cls}`}>1</div>
                <span className="text-xs text-gray-500">{l.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Daily Activities Tab ──────────────────────────────────────────────────────
function DailyActivitiesTab() {
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const activities = [
    { time: "9:00 AM", type: "live-class", title: "Physics — Electromagnetic Induction", teacher: "Dr. Sharma", status: "upcoming", icon: Video, color: "bg-blue-100 text-blue-700" },
    { time: "11:00 AM", type: "lesson-plan", title: "Chemistry — Electrochemistry (Lesson Plan)", teacher: "Ms. Patel", status: "today", icon: Calendar, color: "bg-green-100 text-green-700" },
    { time: "2:00 PM", type: "test", title: "Mathematics Weekly Test — Calculus", teacher: "Mr. Kumar", status: "upcoming", icon: FileCheck, color: "bg-purple-100 text-purple-700" },
    { time: "4:00 PM", type: "assignment", title: "Physics Assignment — Optics Problems", teacher: "Dr. Sharma", status: "due-today", icon: FileText, color: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-gray-900">{today}</h2>
      </div>
      <div className="space-y-3">
        {activities.map((act, i) => {
          const Icon = act.icon;
          return (
            <Card key={i} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="text-right flex-shrink-0 w-16">
                    <span className="text-xs font-medium text-gray-500">{act.time}</span>
                  </div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${act.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{act.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{act.teacher}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {act.status === "upcoming" && <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Upcoming</Badge>}
                    {act.status === "today" && <Badge className="bg-green-100 text-green-700 border-0 text-xs">Today</Badge>}
                    {act.status === "due-today" && <Badge className="bg-red-100 text-red-700 border-0 text-xs">Due Today</Badge>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Placeholder Tab ───────────────────────────────────────────────────────────
function PlaceholderTab({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-20 text-gray-400">
      <Icon className="w-14 h-14 mx-auto mb-4 opacity-20" />
      <p className="font-semibold text-gray-600 text-lg">{title}</p>
      <p className="text-sm mt-2 max-w-sm mx-auto">{description}</p>
    </div>
  );
}

// ─── Main DashboardPage ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "activities", label: "Today", icon: Zap },
    { id: "heatmap", label: "Chapter Heatmap", icon: Activity },
    { id: "attendance", label: "Attendance", icon: CheckSquare },
    { id: "live-classes", label: "Live Classes", icon: Video },
    { id: "lesson-plans", label: "Lesson Plans", icon: Calendar },
    { id: "assessments", label: "Assessments", icon: FileCheck },
    { id: "assignments", label: "Assignments", icon: FileText },
    { id: "bridge", label: "Bridge Courses", icon: Brain },
  ];

  return (
    <PlatformLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Track your progress, attend classes, and manage your learning</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-px border-b border-gray-200">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "text-indigo-600 border-indigo-600 bg-indigo-50/50"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "activities" && <DailyActivitiesTab />}
        {activeTab === "heatmap" && <PerformanceHeatmapTab />}
        {activeTab === "attendance" && <AttendanceTab />}
        {activeTab === "live-classes" && <PlaceholderTab icon={Video} title="Live Classes" description="Your teacher will schedule live classes here. You'll receive a notification when a class is about to start." />}
        {activeTab === "lesson-plans" && <PlaceholderTab icon={Calendar} title="Lesson Plans" description="Your teacher's daily lesson plans will appear here once published. Plans are read-only for students." />}
        {activeTab === "assessments" && <PlaceholderTab icon={FileCheck} title="Assessments" description="Chapter assessments and tests assigned by your teacher will appear here." />}
        {activeTab === "assignments" && <PlaceholderTab icon={FileText} title="Assignments" description="Assignments from your teachers will appear here with due dates and submission status." />}
        {activeTab === "bridge" && <PlaceholderTab icon={Brain} title="Bridge Courses" description="AI-powered bridge course suggestions approved by your teacher will appear here to help fill knowledge gaps." />}
      </div>
    </PlatformLayout>
  );
}
