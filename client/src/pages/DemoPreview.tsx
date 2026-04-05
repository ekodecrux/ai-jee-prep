import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap, UserCheck, Heart, Building2, Shield,
  ArrowLeft, ArrowRight, BookOpen, BarChart3, Calendar,
  Users, CheckCircle, Clock, TrendingUp, AlertCircle,
  FileText, DollarSign, Activity, Star, Zap, Target,
  ChevronRight, Bell, Search, Settings, LogIn,
} from "lucide-react";

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_SUBJECTS = [
  { name: "Physics", progress: 68, color: "bg-blue-500", chapters: 24, done: 16 },
  { name: "Chemistry", progress: 54, color: "bg-green-500", chapters: 20, done: 11 },
  { name: "Mathematics", progress: 81, color: "bg-purple-500", chapters: 28, done: 23 },
];

const MOCK_STUDENTS = [
  { name: "Arjun Sharma", class: "XII-A", attendance: 92, grade: "A" },
  { name: "Priya Patel", class: "XII-A", attendance: 88, grade: "B+" },
  { name: "Rohan Mehta", class: "XII-B", attendance: 75, grade: "B" },
  { name: "Sneha Gupta", class: "XII-B", attendance: 95, grade: "A+" },
];

const MOCK_FEES = [
  { student: "Arjun Sharma", amount: 45000, status: "paid", due: "Mar 2026" },
  { student: "Priya Patel", amount: 45000, status: "pending", due: "Mar 2026" },
  { student: "Rohan Mehta", amount: 45000, status: "overdue", due: "Feb 2026" },
  { student: "Sneha Gupta", amount: 45000, status: "paid", due: "Mar 2026" },
];

const MOCK_INSTITUTES = [
  { name: "Brilliant Academy", city: "Mumbai", students: 342, status: "active" },
  { name: "Apex Coaching", city: "Delhi", students: 218, status: "active" },
  { name: "Zenith Institute", city: "Bangalore", students: 156, status: "trial" },
  { name: "Pinnacle Classes", city: "Pune", students: 89, status: "active" },
];

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLES = [
  { id: "student", label: "Student", icon: GraduationCap, gradient: "from-blue-500 to-indigo-600", color: "blue" },
  { id: "teacher", label: "Teacher", icon: UserCheck, gradient: "from-teal-500 to-emerald-600", color: "teal" },
  { id: "parent", label: "Parent", icon: Heart, gradient: "from-rose-500 to-pink-600", color: "rose" },
  { id: "institute_admin", label: "Institute Admin", icon: Building2, gradient: "from-amber-500 to-orange-600", color: "amber" },
  { id: "super_admin", label: "Super Admin", icon: Shield, gradient: "from-purple-500 to-violet-600", color: "purple" },
];

// ─── Demo portal components ───────────────────────────────────────────────────

function StudentDemo() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Chapters Done", value: "50/80", icon: BookOpen, color: "text-blue-600" },
          { label: "Mock Tests", value: "12", icon: FileText, color: "text-purple-600" },
          { label: "Avg Score", value: "74%", icon: TrendingUp, color: "text-green-600" },
          { label: "Streak", value: "14 days", icon: Zap, color: "text-amber-600" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subject progress */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Subject Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {MOCK_SUBJECTS.map(s => (
            <div key={s.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{s.name}</span>
                <span className="text-gray-500">{s.done}/{s.chapters} chapters · {s.progress}%</span>
              </div>
              <Progress value={s.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Upcoming */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Upcoming Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { title: "Live Class: Thermodynamics", time: "Today 4:00 PM", type: "live", color: "bg-blue-100 text-blue-700" },
            { title: "Mock Test: JEE Main Paper 1", time: "Tomorrow 10:00 AM", type: "test", color: "bg-purple-100 text-purple-700" },
            { title: "Assignment Due: Organic Chemistry", time: "Apr 8, 11:59 PM", type: "assignment", color: "bg-amber-100 text-amber-700" },
          ].map(e => (
            <div key={e.title} className="flex items-center gap-3">
              <Badge className={`text-xs ${e.color} border-0`}>{e.type}</Badge>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{e.title}</div>
                <div className="text-xs text-gray-500">{e.time}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TeacherDemo() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "My Classes", value: "4", icon: Users, color: "text-teal-600" },
          { label: "Students", value: "128", icon: GraduationCap, color: "text-blue-600" },
          { label: "Assignments", value: "8 active", icon: FileText, color: "text-purple-600" },
          { label: "Live Classes", value: "3 this week", icon: Activity, color: "text-green-600" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Student Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Student</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Class</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Attendance</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Grade</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_STUDENTS.map(s => (
                  <tr key={s.name} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium text-gray-800">{s.name}</td>
                    <td className="py-2.5 text-gray-600">{s.class}</td>
                    <td className="py-2.5">
                      <span className={`font-medium ${s.attendance >= 90 ? "text-green-600" : s.attendance >= 80 ? "text-amber-600" : "text-red-500"}`}>
                        {s.attendance}%
                      </span>
                    </td>
                    <td className="py-2.5">
                      <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">{s.grade}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { title: "XII-A Physics: Thermodynamics", time: "9:00 AM", status: "completed" },
            { title: "XII-B Chemistry: Organic Reactions", time: "11:00 AM", status: "live" },
            { title: "XI-A Mathematics: Integration", time: "2:00 PM", status: "upcoming" },
          ].map(c => (
            <div key={c.title} className="flex items-center gap-3">
              <Badge className={`text-xs border-0 ${c.status === "live" ? "bg-green-100 text-green-700" : c.status === "completed" ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700"}`}>
                {c.status}
              </Badge>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{c.title}</div>
                <div className="text-xs text-gray-500">{c.time}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ParentDemo() {
  return (
    <div className="space-y-6">
      {/* Child card */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-rose-50 to-pink-50">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold">A</div>
          <div>
            <div className="text-lg font-bold text-gray-900">Arjun Sharma</div>
            <div className="text-sm text-gray-500">Class XII-A · Brilliant Academy</div>
            <div className="flex gap-2 mt-1">
              <Badge className="bg-green-100 text-green-700 border-0 text-xs">Attendance: 92%</Badge>
              <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Rank: 5th</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Chapters Completed", value: "50/80", icon: BookOpen, color: "text-rose-600" },
          { label: "Attendance", value: "92%", icon: CheckCircle, color: "text-green-600" },
          { label: "Avg Score", value: "74%", icon: TrendingUp, color: "text-blue-600" },
          { label: "Pending Fees", value: "₹0", icon: DollarSign, color: "text-amber-600" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { text: "Completed Chapter: Thermodynamics Laws", time: "2 hours ago", icon: CheckCircle, color: "text-green-500" },
            { text: "Attended Live Class: Organic Chemistry", time: "Yesterday", icon: Activity, color: "text-blue-500" },
            { text: "Scored 82% in Mock Test #12", time: "2 days ago", icon: Star, color: "text-amber-500" },
          ].map(a => (
            <div key={a.text} className="flex items-start gap-3">
              <a.icon className={`w-4 h-4 ${a.color} mt-0.5 flex-shrink-0`} />
              <div>
                <div className="text-sm text-gray-800">{a.text}</div>
                <div className="text-xs text-gray-500">{a.time}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function InstituteAdminDemo() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: "342", icon: GraduationCap, color: "text-amber-600" },
          { label: "Teachers", value: "18", icon: UserCheck, color: "text-blue-600" },
          { label: "Classes", value: "12", icon: BookOpen, color: "text-purple-600" },
          { label: "Fee Collection", value: "₹12.4L", icon: DollarSign, color: "text-green-600" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Fee Collection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Student</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Amount</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Due</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_FEES.map(f => (
                  <tr key={f.student} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium text-gray-800">{f.student}</td>
                    <td className="py-2.5 text-gray-600">₹{f.amount.toLocaleString()}</td>
                    <td className="py-2.5 text-gray-600">{f.due}</td>
                    <td className="py-2.5">
                      <Badge className={`border-0 text-xs ${f.status === "paid" ? "bg-green-100 text-green-700" : f.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {f.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Attendance Overview (This Week)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { class: "XII-A (Physics)", present: 28, total: 30 },
            { class: "XII-B (Chemistry)", present: 25, total: 28 },
            { class: "XI-A (Mathematics)", present: 32, total: 35 },
          ].map(a => (
            <div key={a.class}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{a.class}</span>
                <span className="text-gray-500">{a.present}/{a.total} present</span>
              </div>
              <Progress value={(a.present / a.total) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SuperAdminDemo() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Institutes", value: "47", icon: Building2, color: "text-purple-600" },
          { label: "Total Students", value: "12,840", icon: GraduationCap, color: "text-blue-600" },
          { label: "Active Teachers", value: "384", icon: UserCheck, color: "text-teal-600" },
          { label: "Content Chapters", value: "80", icon: BookOpen, color: "text-amber-600" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Institute Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Institute</th>
                  <th className="text-left py-2 text-gray-500 font-medium">City</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Students</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_INSTITUTES.map(i => (
                  <tr key={i.name} className="border-b border-gray-50">
                    <td className="py-2.5 font-medium text-gray-800">{i.name}</td>
                    <td className="py-2.5 text-gray-600">{i.city}</td>
                    <td className="py-2.5 text-gray-600">{i.students}</td>
                    <td className="py-2.5">
                      <Badge className={`border-0 text-xs ${i.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {i.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">Platform Health</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "API Uptime", value: "99.9%", status: "healthy" },
            { label: "DB Response", value: "12ms", status: "healthy" },
            { label: "Active Sessions", value: "1,284", status: "healthy" },
            { label: "Error Rate", value: "0.02%", status: "healthy" },
            { label: "Storage Used", value: "42 GB", status: "warning" },
            { label: "Pending Jobs", value: "0", status: "healthy" },
          ].map(h => (
            <div key={h.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${h.status === "healthy" ? "bg-green-500" : "bg-amber-500"}`} />
              <div>
                <div className="text-xs text-gray-500">{h.label}</div>
                <div className="text-sm font-semibold text-gray-800">{h.value}</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const DEMO_COMPONENTS: Record<string, React.FC> = {
  student: StudentDemo,
  teacher: TeacherDemo,
  parent: ParentDemo,
  institute_admin: InstituteAdminDemo,
  super_admin: SuperAdminDemo,
};

// ─── Main Demo Preview Page ───────────────────────────────────────────────────
export default function DemoPreview() {
  const [, params] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialRole = searchParams.get("role") ?? "student";
  const [activeRole, setActiveRole] = useState(initialRole);

  const role = ROLES.find(r => r.id === activeRole) ?? ROLES[0];
  const DemoComponent = DEMO_COMPONENTS[activeRole] ?? StudentDemo;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="gap-1.5 text-gray-600 h-8">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Button>
            </Link>
            <div className="h-5 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${role.gradient} flex items-center justify-center`}>
                <role.icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-gray-800 text-sm">{role.label} Portal</span>
              <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Demo Mode</Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:block">This is a read-only preview with mock data</span>
            <Link href="/login">
              <Button size="sm" className={`gap-1.5 bg-gradient-to-r ${role.gradient} text-white border-0 h-8 text-xs`}>
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar: role switcher */}
        <aside className="w-48 flex-shrink-0 hidden md:block">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Switch Role</p>
            </div>
            <nav className="p-2 space-y-1">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(r.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    activeRole === r.id
                      ? `bg-gradient-to-r ${r.gradient} text-white font-medium`
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <r.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{r.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* CTA card */}
          <div className={`mt-4 rounded-xl bg-gradient-to-br ${role.gradient} p-4 text-white`}>
            <p className="text-xs font-semibold mb-1">Like what you see?</p>
            <p className="text-xs opacity-80 mb-3">Sign in to access your real {role.label} portal.</p>
            <Link href="/login">
              <Button size="sm" className="w-full bg-white/20 hover:bg-white/30 text-white border-0 text-xs h-7 gap-1">
                Sign In <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Portal header */}
          <div className={`rounded-xl bg-gradient-to-r ${role.gradient} p-5 mb-6 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <role.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">{role.label} Portal</h1>
                  <p className="text-white/70 text-xs">Demo Mode — Mock Data Only</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-60">
                <Bell className="w-4 h-4" />
                <Search className="w-4 h-4" />
                <Settings className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Mobile role switcher */}
          <div className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-1">
            {ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => setActiveRole(r.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeRole === r.id
                    ? `bg-gradient-to-r ${r.gradient} text-white`
                    : "bg-white border border-gray-200 text-gray-600"
                }`}
              >
                <r.icon className="w-3.5 h-3.5" />
                {r.label}
              </button>
            ))}
          </div>

          {/* Demo content */}
          <DemoComponent />

          {/* Bottom CTA */}
          <div className={`mt-8 rounded-xl bg-gradient-to-r ${role.gradient} p-6 text-white text-center`}>
            <h3 className="text-lg font-bold mb-1">Ready to use the real {role.label} portal?</h3>
            <p className="text-white/70 text-sm mb-4">Sign in with your Manus account to access live data, real classes, and all features.</p>
            <Link href="/login">
              <Button className="gap-2 bg-white text-gray-900 hover:bg-gray-100 border-0 font-semibold">
                <LogIn className="w-4 h-4" />
                Sign In with Manus OAuth
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
