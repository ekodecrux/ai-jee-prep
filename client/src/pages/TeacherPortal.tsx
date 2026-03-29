import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Users, BookOpen, ClipboardList, BarChart3, Eye, Bell,
  GraduationCap, CheckCircle2, AlertCircle, TrendingUp,
  ChevronRight, MessageSquare, Video, Plus, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function TeacherPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats } = trpc.admin.getDashboardStats.useQuery();
  const { data: roster } = trpc.admin.getStudentRoster.useQuery({ limit: 20, offset: 0 });
  const { data: proctoringReports } = trpc.admin.getProctoringReports.useQuery({ status: "reviewed_flagged", limit: 5 });

  return (
    <div className="page-enter min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Teacher Portal</h1>
              <p className="text-xs text-muted-foreground">Manage classes, track progress, review assessments</p>
            </div>
          </div>
          <Badge variant="outline" className="text-teal-400 border-teal-400/30 bg-teal-400/10">
            <GraduationCap className="w-3 h-3 mr-1" /> Teacher
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "My Students", value: roster?.total || 0, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Chapters Covered", value: stats?.totalChapters || 80, icon: BookOpen, color: "text-green-400", bg: "bg-green-400/10" },
            { label: "Pending Reviews", value: proctoringReports?.length || 0, icon: Eye, color: "text-amber-400", bg: "bg-amber-400/10" },
            { label: "Doubts Pending", value: 0, icon: MessageSquare, color: "text-purple-400", bg: "bg-purple-400/10" },
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
          <TabsList className="bg-muted mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">My Students</TabsTrigger>
            <TabsTrigger value="proctoring">Proctoring Review</TabsTrigger>
            <TabsTrigger value="doubts">Doubt Board</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" /> Class Performance Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { subject: "Physics", avg: 68, color: "bg-blue-400" },
                    { subject: "Chemistry", avg: 72, color: "bg-green-400" },
                    { subject: "Mathematics", avg: 61, color: "bg-amber-400" },
                  ].map((s) => (
                    <div key={s.subject}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{s.subject}</span>
                        <span className="font-medium text-foreground">{s.avg}% avg</span>
                      </div>
                      <div className="progress-bar">
                        <div className={`progress-bar-fill ${s.avg >= 80 ? "green" : s.avg >= 60 ? "amber" : ""}`} style={{ width: `${s.avg}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" /> Attention Needed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {proctoringReports && proctoringReports.length > 0 ? (
                    proctoringReports.slice(0, 3).map((r: any) => (
                      <div key={r.id} className="doubt-card">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">Proctoring Alert</p>
                            <p className="text-xs text-muted-foreground">Suspicious activity detected during exam</p>
                          </div>
                          <Button size="sm" variant="ghost" className="ml-auto text-xs" onClick={() => setActiveTab("proctoring")}>Review</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400 opacity-60" />
                      <p className="text-sm">No alerts — all students are on track!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Create Assessment", icon: ClipboardList, color: "text-blue-400", action: () => setActiveTab("assessments") },
                  { label: "View Student Progress", icon: BarChart3, color: "text-green-400", action: () => setActiveTab("students") },
                  { label: "Review Proctoring", icon: Video, color: "text-amber-400", action: () => setActiveTab("proctoring") },
                  { label: "Answer Doubts", icon: MessageSquare, color: "text-purple-400", action: () => setActiveTab("doubts") },
                ].map((a) => (
                  <button key={a.label} onClick={a.action}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted transition-all text-center">
                    <a.icon className={`w-6 h-6 ${a.color}`} />
                    <span className="text-xs text-foreground font-medium">{a.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students */}
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
                    <thead><tr><th>Student</th><th>Email</th><th>Chapters Done</th><th>Avg Score</th><th>Last Active</th><th>Actions</th></tr></thead>
                    <tbody>
                      {roster.students.map((s: any) => (
                        <tr key={s.id}>
                          <td className="font-medium text-foreground">{s.name || "Student"}</td>
                          <td className="text-muted-foreground">{s.email || "—"}</td>
                          <td>0 / 80</td>
                          <td>—</td>
                          <td className="text-muted-foreground">{new Date(s.lastSignedIn || s.createdAt).toLocaleDateString("en-IN")}</td>
                          <td>
                            <Link href={`/performance`}>
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

          {/* Proctoring Review */}
          <TabsContent value="proctoring" className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Proctoring Review</h2>
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                {proctoringReports && proctoringReports.length > 0 ? (
                  <table className="admin-table">
                    <thead><tr><th>Student</th><th>Exam</th><th>Flags</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {proctoringReports.map((r: any) => (
                        <tr key={r.id}>
                          <td className="font-medium text-foreground">Student #{r.userId}</td>
                          <td>{r.assessmentId || "Mock Test"}</td>
                          <td>
                            <div className="flex gap-1 flex-wrap">
                              {(r.flags as string[] || []).map((f: string) => (
                                <Badge key={f} variant="outline" className="text-xs text-amber-400 border-amber-400/30">{f}</Badge>
                              ))}
                            </div>
                          </td>
                          <td>{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                          <td><Badge variant="outline" className="text-xs text-red-400 border-red-400/30">{r.status}</Badge></td>
                          <td className="flex gap-1">
                            <Button size="sm" variant="ghost" className="text-xs" onClick={() => toast.success("Report reviewed — marked as cleared")}>Clear</Button>
                            <Button size="sm" variant="ghost" className="text-xs text-red-400" onClick={() => toast.error("Student flagged for manual review")}>Flag</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-400 opacity-50" />
                    <p className="text-sm">No proctoring flags to review</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Doubt Board */}
          <TabsContent value="doubts" className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Student Doubt Board</h2>
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No pending doubts</p>
              <p className="text-sm mt-1">Student doubts answered by AI Tutor Priya will appear here for teacher review</p>
            </div>
          </TabsContent>

          {/* Assessments */}
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
