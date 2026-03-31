import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Users, BookOpen, ClipboardList, BarChart3, Eye,
  GraduationCap, CheckCircle2, AlertCircle, TrendingUp,
  MessageSquare, Video, Plus, Calendar, ChevronDown,
  CheckSquare, XSquare, Clock, Save, RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// ─── Attendance status helpers ────────────────────────────────────────────────
type AttendanceStatus = "present" | "absent" | "late" | "excused";

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  present:  { label: "Present",  color: "text-green-600",  bg: "bg-green-50 border-green-200",  icon: CheckSquare },
  absent:   { label: "Absent",   color: "text-red-600",    bg: "bg-red-50 border-red-200",      icon: XSquare },
  late:     { label: "Late",     color: "text-amber-600",  bg: "bg-amber-50 border-amber-200",  icon: Clock },
  excused:  { label: "Excused",  color: "text-blue-600",   bg: "bg-blue-50 border-blue-200",    icon: CheckSquare },
};

const STATUS_CYCLE: AttendanceStatus[] = ["present", "absent", "late", "excused"];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function TeacherPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // ─── Attendance state ────────────────────────────────────────────────────
  const [attInstituteId, setAttInstituteId] = useState<number | null>(null);
  const [attClassId, setAttClassId] = useState<number | null>(null);
  const [attDate, setAttDate] = useState(todayStr());
  const [attRecords, setAttRecords] = useState<Record<number, AttendanceStatus>>({});
  const [attSaved, setAttSaved] = useState(false);

  // ─── Legacy queries (overview/students/proctoring) ───────────────────────
  const { data: stats } = trpc.admin.getDashboardStats.useQuery();
  const { data: roster } = trpc.admin.getStudentRoster.useQuery({ limit: 20, offset: 0 });
  const { data: proctoringReports } = trpc.admin.getProctoringReports.useQuery({ status: "reviewed_flagged", limit: 5 });

  // ─── Teacher dashboard (my classes + institute context) ──────────────────
  const { data: teacherDash } = trpc.erp.getTeacherDashboard.useQuery();

  // Derive institute ID from teacher's first membership
  const myInstituteId = useMemo(() => {
    if (attInstituteId) return attInstituteId;
    return (teacherDash as any)?.instituteId ?? null;
  }, [attInstituteId, teacherDash]);

  // ─── Classes for attendance picker ───────────────────────────────────────
  const { data: myClasses } = trpc.erp.listClasses.useQuery(
    { instituteId: myInstituteId! },
    { enabled: !!myInstituteId }
  );

  // ─── Students in selected class ──────────────────────────────────────────
  const { data: classStudents, isLoading: studentsLoading } = trpc.erp.listClassStudents.useQuery(
    { classId: attClassId! },
    { enabled: !!attClassId }
  );

  // ─── Existing attendance for selected class+date ─────────────────────────
  const { data: existingAtt, refetch: refetchAtt } = trpc.erp.getAttendance.useQuery(
    { instituteId: myInstituteId!, classId: attClassId!, date: attDate },
    { enabled: !!myInstituteId && !!attClassId && !!attDate }
  );

  // Pre-fill records from existing attendance when data loads
  useMemo(() => {
    if (existingAtt && existingAtt.length > 0) {
      const map: Record<number, AttendanceStatus> = {};
      existingAtt.forEach((r) => { map[r.studentId] = r.status as AttendanceStatus; });
      setAttRecords(map);
      setAttSaved(true);
    } else if (classStudents && classStudents.length > 0) {
      // Default all to present
      const map: Record<number, AttendanceStatus> = {};
      classStudents.forEach((s) => { map[s.studentId] = "present"; });
      setAttRecords(map);
      setAttSaved(false);
    }
  }, [existingAtt, classStudents]);

  // ─── Mark attendance mutation ─────────────────────────────────────────────
  const markAtt = trpc.erp.markAttendance.useMutation({
    onSuccess: () => {
      toast.success(`Attendance saved for ${attDate}`);
      setAttSaved(true);
      refetchAtt();
    },
    onError: (e) => toast.error(e.message),
  });

  function cycleStatus(studentId: number) {
    setAttRecords((prev) => {
      const current = prev[studentId] ?? "present";
      const idx = STATUS_CYCLE.indexOf(current);
      const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
      return { ...prev, [studentId]: next };
    });
    setAttSaved(false);
  }

  function markAll(status: AttendanceStatus) {
    if (!classStudents) return;
    const map: Record<number, AttendanceStatus> = {};
    classStudents.forEach((s) => { map[s.studentId] = status; });
    setAttRecords(map);
    setAttSaved(false);
  }

  function saveAttendance() {
    if (!myInstituteId || !attClassId || !classStudents) return;
    const records = classStudents.map((s) => ({
      studentId: s.studentId,
      status: attRecords[s.studentId] ?? "present",
    }));
    markAtt.mutate({ instituteId: myInstituteId, classId: attClassId, date: attDate, records });
  }

  // ─── Attendance summary counts ────────────────────────────────────────────
  const attCounts = useMemo(() => {
    const vals = Object.values(attRecords);
    return {
      present: vals.filter((v) => v === "present").length,
      absent:  vals.filter((v) => v === "absent").length,
      late:    vals.filter((v) => v === "late").length,
      excused: vals.filter((v) => v === "excused").length,
      total:   vals.length,
    };
  }, [attRecords]);

  return (
    <div className="page-enter min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Teacher Portal</h1>
              <p className="text-xs text-muted-foreground">Manage classes, attendance, and assessments</p>
            </div>
          </div>
          <Badge variant="outline" className="text-teal-600 border-teal-300 bg-teal-50">
            <GraduationCap className="w-3 h-3 mr-1" /> Teacher
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "My Students", value: roster?.total || 0, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Chapters Covered", value: stats?.totalChapters || 80, icon: BookOpen, color: "text-green-600", bg: "bg-green-50" },
            { label: "Pending Reviews", value: proctoringReports?.length || 0, icon: Eye, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "My Classes", value: myClasses?.length || 0, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="students">My Students</TabsTrigger>
            <TabsTrigger value="proctoring">Proctoring</TabsTrigger>
            <TabsTrigger value="doubts">Doubt Board</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
          </TabsList>

          {/* ─── Overview ─────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" /> Class Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { subject: "Physics", avg: 68, color: "bg-blue-500" },
                    { subject: "Chemistry", avg: 72, color: "bg-green-500" },
                    { subject: "Mathematics", avg: 61, color: "bg-amber-500" },
                  ].map((s) => (
                    <div key={s.subject}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{s.subject}</span>
                        <span className="font-medium text-foreground">{s.avg}% avg</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.avg}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" /> Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Mark Attendance", icon: Calendar, color: "text-teal-600", action: () => setActiveTab("attendance") },
                    { label: "View Students", icon: BarChart3, color: "text-blue-600", action: () => setActiveTab("students") },
                    { label: "Review Proctoring", icon: Video, color: "text-amber-600", action: () => setActiveTab("proctoring") },
                    { label: "Answer Doubts", icon: MessageSquare, color: "text-purple-600", action: () => setActiveTab("doubts") },
                  ].map((a) => (
                    <button key={a.label} onClick={a.action}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/50 transition-all text-center">
                      <a.icon className={`w-6 h-6 ${a.color}`} />
                      <span className="text-xs text-foreground font-medium">{a.label}</span>
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── Attendance ───────────────────────────────────────────────── */}
          <TabsContent value="attendance" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">Mark Attendance</h2>
              {attSaved && (
                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 gap-1 self-start sm:self-auto">
                  <CheckCircle2 className="w-3 h-3" /> Saved
                </Badge>
              )}
            </div>

            {/* Selectors */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <div className="grid sm:grid-cols-3 gap-4">
                  {/* Class selector */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Class</label>
                    {myClasses && myClasses.length > 0 ? (
                      <Select
                        value={attClassId ? String(attClassId) : ""}
                        onValueChange={(v) => {
                          setAttClassId(Number(v));
                          setAttRecords({});
                          setAttSaved(false);
                          // derive institute from class
                          const cls = myClasses.find((c) => c.id === Number(v));
                          if (cls) setAttInstituteId((cls as any).instituteId ?? null);
                        }}
                      >
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select class…" />
                        </SelectTrigger>
                        <SelectContent>
                          {myClasses.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name} — Grade {c.grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground py-2">No classes assigned yet</p>
                    )}
                  </div>

                  {/* Date picker */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Date</label>
                    <input
                      type="date"
                      value={attDate}
                      max={todayStr()}
                      onChange={(e) => {
                        setAttDate(e.target.value);
                        setAttRecords({});
                        setAttSaved(false);
                      }}
                      className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* Summary counts */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Summary</label>
                    <div className="flex gap-2 flex-wrap">
                      {(Object.entries(attCounts) as [string, number][]).filter(([k]) => k !== "total").map(([status, count]) => (
                        <span key={status}
                          className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_CONFIG[status as AttendanceStatus].bg} ${STATUS_CONFIG[status as AttendanceStatus].color}`}>
                          {count} {status}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student attendance list */}
            {attClassId && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-600" />
                    {classStudents ? `${classStudents.length} Students` : "Loading…"}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs gap-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      onClick={() => markAll("present")}>
                      <CheckSquare className="w-3 h-3" /> All Present
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs gap-1 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                      onClick={() => markAll("absent")}>
                      <XSquare className="w-3 h-3" /> All Absent
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {studentsLoading ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin opacity-40" />
                      <p className="text-sm">Loading students…</p>
                    </div>
                  ) : classStudents && classStudents.length > 0 ? (
                    <>
                      <div className="divide-y divide-border">
                        {classStudents.map((s, idx) => {
                          const status = attRecords[s.studentId] ?? "present";
                          const cfg = STATUS_CONFIG[status];
                          return (
                            <div key={s.studentId}
                              className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                              {/* Index */}
                              <span className="text-xs text-muted-foreground w-6 text-right shrink-0">{idx + 1}</span>
                              {/* Avatar */}
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                                {(s.name || "S")[0].toUpperCase()}
                              </div>
                              {/* Name / email */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{s.name || "Student"}</p>
                                <p className="text-xs text-muted-foreground truncate">{s.email || "—"}</p>
                              </div>
                              {/* Status toggle button */}
                              <button
                                onClick={() => cycleStatus(s.studentId)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:opacity-80 ${cfg.bg} ${cfg.color}`}
                              >
                                <cfg.icon className="w-3.5 h-3.5" />
                                {cfg.label}
                                <ChevronDown className="w-3 h-3 opacity-50" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {/* Save button */}
                      <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
                        <p className="text-sm text-muted-foreground">
                          {attCounts.present} present · {attCounts.absent} absent · {attCounts.late} late · {attCounts.excused} excused
                        </p>
                        <Button
                          onClick={saveAttendance}
                          disabled={markAtt.isPending}
                          className="gap-2"
                        >
                          {markAtt.isPending ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {attSaved ? "Update Attendance" : "Save Attendance"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No students enrolled in this class yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!attClassId && (
              <div className="text-center py-16 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Select a class and date to mark attendance</p>
                <p className="text-sm mt-1">Click a student's status badge to cycle through Present → Absent → Late → Excused</p>
              </div>
            )}
          </TabsContent>

          {/* ─── Students ─────────────────────────────────────────────────── */}
          <TabsContent value="students" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">My Students</h2>
              <Button size="sm" variant="outline" className="gap-2">
                <BarChart3 className="w-4 h-4" /> Export Report
              </Button>
            </div>
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                {roster?.students && roster.students.length > 0 ? (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Student</th><th>Email</th><th>Chapters Done</th><th>Avg Score</th><th>Last Active</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.students.map((s: any) => (
                        <tr key={s.id}>
                          <td className="font-medium text-foreground">{s.name || "Student"}</td>
                          <td className="text-muted-foreground">{s.email || "—"}</td>
                          <td>0 / 80</td>
                          <td>—</td>
                          <td className="text-muted-foreground">{new Date(s.lastSignedIn || s.createdAt).toLocaleDateString("en-IN")}</td>
                          <td>
                            <Link href="/performance">
                              <Button size="sm" variant="ghost" className="text-xs">View Progress</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No students assigned yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Proctoring ───────────────────────────────────────────────── */}
          <TabsContent value="proctoring" className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Proctoring Review</h2>
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                {proctoringReports && proctoringReports.length > 0 ? (
                  <table className="admin-table">
                    <thead>
                      <tr><th>Student</th><th>Exam</th><th>Flags</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {proctoringReports.map((r: any) => (
                        <tr key={r.id}>
                          <td className="font-medium text-foreground">Student #{r.userId}</td>
                          <td>{r.assessmentId || "Mock Test"}</td>
                          <td>
                            <div className="flex gap-1 flex-wrap">
                              {(r.flags as string[] || []).map((f: string) => (
                                <Badge key={f} variant="outline" className="text-xs text-amber-600 border-amber-300">{f}</Badge>
                              ))}
                            </div>
                          </td>
                          <td>{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                          <td><Badge variant="outline" className="text-xs text-red-600 border-red-300">{r.status}</Badge></td>
                          <td className="flex gap-1">
                            <Button size="sm" variant="ghost" className="text-xs" onClick={() => toast.success("Marked as cleared")}>Clear</Button>
                            <Button size="sm" variant="ghost" className="text-xs text-red-600" onClick={() => toast.error("Flagged for review")}>Flag</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-60" />
                    <p className="text-sm">No proctoring flags to review</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Doubt Board ──────────────────────────────────────────────── */}
          <TabsContent value="doubts" className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Student Doubt Board</h2>
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No pending doubts</p>
              <p className="text-sm mt-1">Student doubts answered by AI Tutor will appear here for teacher review</p>
            </div>
          </TabsContent>

          {/* ─── Assessments ──────────────────────────────────────────────── */}
          <TabsContent value="assessments" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Custom Assessments</h2>
              <Button size="sm" className="gap-2" onClick={() => toast.info("Assessment builder coming soon!")}>
                <Plus className="w-4 h-4" /> Create Assessment
              </Button>
            </div>
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No custom assessments created yet</p>
              <p className="text-sm mt-1">Create chapter-wise or topic-wise assessments for your class</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
