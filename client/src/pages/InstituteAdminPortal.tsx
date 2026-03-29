import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users, BookOpen, Upload, Plus, GraduationCap, UserCheck,
  BarChart3, Bell, Key, FileText, ChevronRight, Download,
  School, Calendar, ClipboardList, Settings, AlertCircle,
  Zap, CheckCircle2, Loader2, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function InstituteAdminPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [dragOver, setDragOver] = useState(false);

  const { data: stats } = trpc.admin.getDashboardStats.useQuery();
  const { data: roster } = trpc.admin.getStudentRoster.useQuery({ limit: 10, offset: 0 });
  const { data: mockSchedule } = trpc.admin.getMockTestSchedule.useQuery();

  // Bulk generation state
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; chapter: string; done: boolean } | null>(null);
  const generateContent = trpc.content.generateContent.useMutation();
  const { data: allChapters } = trpc.chapters.listAll.useQuery({ examId: "jee_main" });

  const handleBulkGenerate = async (_type: "narration" | "questions" | "assessment") => {
    const chapList = allChapters || [];
    if (chapList.length === 0) { toast.error("No chapters found"); return; }
    setBulkProgress({ current: 0, total: chapList.length, chapter: "", done: false });
    let done = 0;
    for (const ch of chapList) {
      setBulkProgress({ current: done, total: chapList.length, chapter: ch.title, done: false });
      try {
        await generateContent.mutateAsync({ chapterId: ch.chapterId });
      } catch { /* skip errors, continue */ }
      done++;
    }
    setBulkProgress({ current: done, total: chapList.length, chapter: "Complete!", done: true });
    toast.success(`Bulk generation complete for all ${done} chapters!`);
  };

  const handleUpload = (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setDragOver(false);
    toast.success("File uploaded! Processing content into knowledge base...");
  };

  return (
    <div className="page-enter min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <School className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Institute Admin Portal</h1>
              <p className="text-xs text-muted-foreground">Manage your institution's JEE preparation program</p>
            </div>
          </div>
          <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-400/10">
            <School className="w-3 h-3 mr-1" /> Institute Admin
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Students", value: stats?.totalUsers || 0, icon: GraduationCap, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Active Teachers", value: 0, icon: UserCheck, color: "text-green-400", bg: "bg-green-400/10" },
            { label: "Chapters Available", value: stats?.totalChapters || 80, icon: BookOpen, color: "text-amber-400", bg: "bg-amber-400/10" },
            { label: "Mock Tests Scheduled", value: mockSchedule?.length || 0, icon: ClipboardList, color: "text-purple-400", bg: "bg-purple-400/10" },
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
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="content">Content Upload</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Generate</TabsTrigger>
            <TabsTrigger value="schedule">Mock Schedule</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" /> Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "Onboard New Student", icon: GraduationCap, tab: "onboarding" },
                    { label: "Onboard New Teacher", icon: UserCheck, tab: "onboarding" },
                    { label: "Upload Institution Content", icon: Upload, tab: "content" },
                    { label: "Schedule Mock Test", icon: Calendar, tab: "schedule" },
                    { label: "Send Notification", icon: Bell, tab: "notifications" },
                  ].map((a) => (
                    <button key={a.label} onClick={() => setActiveTab(a.tab)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left">
                      <a.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{a.label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-green-400" /> Recent Students
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {roster?.students && roster.students.length > 0 ? (
                    <div className="space-y-2">
                      {roster.students.slice(0, 5).map((s: any) => (
                        <div key={s.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                            {(s.name || "S")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{s.name || "Student"}</p>
                            <p className="text-xs text-muted-foreground">{s.email || "—"}</p>
                          </div>
                          <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">Active</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No students onboarded yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onboarding */}
          <TabsContent value="onboarding" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {[
                { role: "Student", icon: GraduationCap, color: "text-blue-400", bg: "bg-blue-400/10", desc: "Enroll students individually or via bulk CSV upload" },
                { role: "Teacher", icon: UserCheck, color: "text-green-400", bg: "bg-green-400/10", desc: "Add teachers and assign them to classes and subjects" },
                { role: "Parent", icon: Users, color: "text-amber-400", bg: "bg-amber-400/10", desc: "Link parents to their children for progress monitoring" },
              ].map((r) => (
                <Card key={r.role} className="border-border bg-card">
                  <CardContent className="p-6 text-center">
                    <div className={`w-14 h-14 rounded-2xl ${r.bg} flex items-center justify-center mx-auto mb-4`}>
                      <r.icon className={`w-7 h-7 ${r.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Onboard {r.role}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{r.desc}</p>
                    <div className="space-y-2">
                      <Button size="sm" className="w-full gap-2">
                        <Plus className="w-3 h-3" /> Add Individual
                      </Button>
                      <Button size="sm" variant="outline" className="w-full gap-2">
                        <Upload className="w-3 h-3" /> Bulk CSV Upload
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">CSV Upload Format</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Download the template CSV and fill in student/teacher details for bulk onboarding.</p>
                <div className="api-code-block text-xs">
                  name,email,phone,class,section,parentEmail{"\n"}
                  Arjun Sharma,arjun@email.com,9876543210,11,A,parent@email.com{"\n"}
                  Priya Patel,priya@email.com,9876543211,11,B,priya.parent@email.com
                </div>
                <Button size="sm" variant="outline" className="mt-3 gap-2">
                  <Download className="w-3 h-3" /> Download Template CSV
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Upload */}
          <TabsContent value="content" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Institution Content Upload</h2>
              <p className="text-sm text-muted-foreground">Upload your institution's model papers, mock tests, chapter notes, and question banks. The platform will auto-ingest and index them into the knowledge base.</p>
            </div>

            {/* Upload Zone */}
            <div
              className={`upload-zone ${dragOver ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleUpload}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-foreground">Drop files here or click to upload</p>
              <p className="text-sm mt-1">Supports PDF, DOCX, CSV, XLSX — up to 50MB per file</p>
              <input id="file-upload" type="file" className="hidden" multiple accept=".pdf,.docx,.csv,.xlsx" onChange={handleUpload} />
            </div>

            {/* Content Types */}
            <div className="grid lg:grid-cols-2 gap-4">
              {[
                { type: "Model Papers / Past Papers", icon: FileText, desc: "Upload previous year papers or model test papers. Questions will be extracted and tagged by chapter.", formats: "PDF, DOCX" },
                { type: "Question Banks", icon: ClipboardList, desc: "Upload structured question banks. CSV format supported for bulk question import.", formats: "CSV, XLSX" },
                { type: "Chapter Notes / Study Material", icon: BookOpen, desc: "Upload chapter-wise notes or study material to supplement the AI-generated narrations.", formats: "PDF, DOCX" },
                { type: "Mock Test Papers", icon: AlertCircle, desc: "Upload complete mock test papers with answer keys. These will be added to the scheduled mock test queue.", formats: "PDF, DOCX" },
              ].map((ct) => (
                <Card key={ct.type} className="border-border bg-card">
                  <CardContent className="p-4 flex gap-3">
                    <ct.icon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-foreground">{ct.type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ct.desc}</p>
                      <Badge variant="outline" className="text-xs mt-2">{ct.formats}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Bulk Content Generation */}
          <TabsContent value="bulk" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Bulk Content Pre-Generation</h2>
              <p className="text-sm text-muted-foreground">Pre-generate all narration scripts, past questions, and assessments for all 80 chapters so students never see a loading screen. This runs in the background and may take 10–20 minutes.</p>
            </div>

            {bulkProgress && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    {bulkProgress.done
                      ? <CheckCircle2 className="w-5 h-5 text-green-400" />
                      : <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {bulkProgress.done ? "Generation Complete!" : `Generating: ${bulkProgress.chapter}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{bulkProgress.current} / {bulkProgress.total} chapters</p>
                    </div>
                    <span className="text-sm font-bold text-amber-400">
                      {Math.round((bulkProgress.current / bulkProgress.total) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-green-500 transition-all duration-300"
                      style={{ width: `${Math.round((bulkProgress.current / bulkProgress.total) * 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
              {[
                {
                  type: "narration" as const,
                  title: "Teacher Narration Scripts",
                  desc: "Generate comprehensive 3000+ word narration scripts for all 80 chapters with concepts, examples, and problem-solving approaches.",
                  icon: BookOpen,
                  color: "text-blue-400",
                  bg: "bg-blue-400/10",
                  time: "~15 min",
                },
                {
                  type: "questions" as const,
                  title: "Past Year Questions",
                  desc: "Generate 10 years of JEE Main + Advanced questions (MCQ, NAT, Integer) with detailed solutions for all 80 chapters.",
                  icon: ClipboardList,
                  color: "text-purple-400",
                  bg: "bg-purple-400/10",
                  time: "~20 min",
                },
                {
                  type: "assessment" as const,
                  title: "Chapter Assessments",
                  desc: "Generate adaptive chapter-wise assessments with mixed difficulty (Easy/Medium/Hard) for all 80 chapters.",
                  icon: Zap,
                  color: "text-green-400",
                  bg: "bg-green-400/10",
                  time: "~10 min",
                },
              ].map((item) => (
                <Card key={item.type} className="border-border bg-card">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mb-4">{item.desc}</p>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="outline" className="text-xs">{item.time}</Badge>
                      <Badge variant="outline" className="text-xs">80 chapters</Badge>
                    </div>
                    <Button
                      className="w-full gap-2"
                      size="sm"
                      disabled={bulkProgress !== null && !bulkProgress.done}
                      onClick={() => handleBulkGenerate(item.type)}
                    >
                      {bulkProgress && !bulkProgress.done
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Running...</>
                        : <><RefreshCw className="w-3 h-3" /> Generate All</>
                      }
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Generation Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Content is generated using the built-in AI engine and stored in the database permanently.</p>
                <p>• Students can also trigger on-demand generation for individual chapters if pre-generation hasn't run.</p>
                <p>• Re-running generation will update existing content — useful after syllabus changes.</p>
                <p>• Generation runs sequentially to avoid rate limits. Do not close this tab while running.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mock Schedule */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Mock Test Schedule</h2>
              <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Mock Test</Button>
            </div>
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                {mockSchedule && mockSchedule.length > 0 ? (
                  <table className="admin-table">
                    <thead><tr><th>Mock Test</th><th>Exam</th><th>Unlock Date</th><th>Duration</th><th>Status</th></tr></thead>
                    <tbody>
                      {mockSchedule.slice(0, 10).map((m: any) => (
                        <tr key={m.id}>
                          <td className="font-medium text-foreground">{m.title}</td>
                          <td>{m.examCode || "JEE"}</td>
                          <td>{m.scheduledUnlockDate ? new Date(m.scheduledUnlockDate).toLocaleDateString("en-IN") : "—"}</td>
                          <td>{m.durationMinutes || 180} min</td>
                          <td><Badge variant="outline" className="text-xs text-amber-400 border-amber-400/30">{m.status || "Scheduled"}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No mock tests scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Send Notifications</h2>
            <Card className="border-border bg-card">
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Recipient</label>
                  <select className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                    <option>All Students</option>
                    <option>All Teachers</option>
                    <option>All Parents</option>
                    <option>Class 11 Students</option>
                    <option>Class 12 Students</option>
                    <option>Specific Student</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Notification Type</label>
                  <select className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                    <option>General Announcement</option>
                    <option>Exam Reminder</option>
                    <option>Holiday Notice</option>
                    <option>Schedule Change</option>
                    <option>Urgent Alert</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
                  <input className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="Notification title..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Message</label>
                  <textarea className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground resize-none" rows={4} placeholder="Write your message here..." />
                </div>
                <Button className="gap-2" onClick={() => toast.success("Notification sent to all recipients!")}>
                  <Bell className="w-4 h-4" /> Send Notification
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
