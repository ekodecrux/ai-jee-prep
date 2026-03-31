import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users, BookOpen, Upload, Plus, GraduationCap, UserCheck,
  BarChart3, Bell, Key, FileText, ChevronRight, Download,
  School, Calendar, ClipboardList, Settings, AlertCircle,
  Zap, CheckCircle2, Loader2, RefreshCw, Link2, BookMarked,
  UserX, UserCheck2, Pencil, Trash2, Search, UserPlus, Link2 as LinkIcon, BarChart2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// ─── Institute context — in a real app this comes from user's session/membership
// For now we use the first institute the admin belongs to (or a hardcoded demo)
const DEMO_INSTITUTE_ID = 1; // Will be replaced by real membership lookup

export default function InstituteAdminPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [dragOver, setDragOver] = useState(false);
  const [instituteId] = useState(DEMO_INSTITUTE_ID);

  // ── ERP Queries ──────────────────────────────────────────────────────────
  const members = trpc.erp.listInstituteMembers.useQuery({ instituteId });
  const teachers = trpc.erp.listInstituteMembers.useQuery({ instituteId, role: "teacher" });
  const students = trpc.erp.listInstituteMembers.useQuery({ instituteId, role: "student" });
  const parents = trpc.erp.listInstituteMembers.useQuery({ instituteId, role: "parent" });
  const classes = trpc.erp.listClasses.useQuery({ instituteId });
  const subjects = trpc.erp.listSubjects.useQuery({ instituteId });
  const teacherMappings = trpc.erp.listTeacherMappings.useQuery({ instituteId });

  // ── ERP Mutations ─────────────────────────────────────────────────────────
  const inviteMember = trpc.erp.inviteMember.useMutation({
    onSuccess: () => { toast.success("Invite sent!"); members.refetch(); teachers.refetch(); students.refetch(); parents.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const createClass = trpc.erp.createClass.useMutation({
    onSuccess: () => { toast.success("Class created!"); classes.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const createSubject = trpc.erp.createSubject.useMutation({
    onSuccess: () => { toast.success("Subject created!"); subjects.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const assignTeacher = trpc.erp.assignTeacherToClassSubject.useMutation({
    onSuccess: () => { toast.success("Teacher assigned!"); teacherMappings.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const deactivateMember = trpc.erp.deactivateMember.useMutation({
    onSuccess: () => { toast.success("Member deactivated"); members.refetch(); teachers.refetch(); students.refetch(); parents.refetch(); },
  });

  // ── Enroll student in class ───────────────────────────────────────────────
  const enrollStudent_mut = trpc.erp.enrollStudentInClass.useMutation({
    onSuccess: () => { toast.success(`${enrollStudent?.name} enrolled successfully!`); setShowEnrollDialog(false); students.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  // ── Link parent to student ────────────────────────────────────────────────
  const linkParent_mut = trpc.erp.linkParentToStudent.useMutation({
    onSuccess: () => { toast.success(`Parent linked to ${linkStudent?.name}!`); setShowLinkParentDialog(false); },
    onError: (e) => toast.error(e.message),
  });

  // ── Form states ───────────────────────────────────────────────────────────
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", role: "student" as "teacher" | "student" | "parent", classId: "" });
  const [classForm, setClassForm] = useState({ name: "", grade: "11" as "11" | "12" | "dropper" | "integrated", academicYear: "2025-26", examFocus: "jee_main", maxStudents: 60 });
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", colorHex: "#6366f1" });
  const [mappingForm, setMappingForm] = useState({ teacherId: "", classId: "", subjectId: "" });
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showClassDialog, setShowClassDialog] = useState(false);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);

  // ── Assign-to-Class dialog state ─────────────────────────────────────────
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [enrollStudent, setEnrollStudent] = useState<{ memberId: number; userId: number; name: string } | null>(null);
  const [enrollClassId, setEnrollClassId] = useState("");
  const [enrollYear, setEnrollYear] = useState("2025-26");

  // ── Link Parent dialog state ──────────────────────────────────────────────
  const [showLinkParentDialog, setShowLinkParentDialog] = useState(false);
  const [linkStudent, setLinkStudent] = useState<{ memberId: number; userId: number; name: string } | null>(null);
  const [linkParentId, setLinkParentId] = useState("");
  const [linkRelation, setLinkRelation] = useState<"father" | "mother" | "guardian" | "other">("guardian");

  // ── Attendance Summary state ──────────────────────────────────────────────
  const [attSummaryClassId, setAttSummaryClassId] = useState<number | null>(null);
  const [attSummaryMonth, setAttSummaryMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // ── Attendance summary query ──────────────────────────────────────────────
  const attSummary = trpc.erp.getAttendanceSummary.useQuery(
    { instituteId, classId: attSummaryClassId!, month: attSummaryMonth },
    { enabled: !!attSummaryClassId }
  );

  // Legacy state
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; chapter: string; done: boolean } | null>(null);
  const generateContent = trpc.content.generateContent.useMutation();
  const { data: allChapters } = trpc.chapters.listAll.useQuery({ examId: "jee_main" });
  const { data: stats } = trpc.admin.getDashboardStats.useQuery();
  const { data: mockSchedule } = trpc.admin.getMockTestSchedule.useQuery();

  const handleBulkGenerate = async (_type: "narration" | "questions" | "assessment") => {
    const chapList = allChapters || [];
    if (chapList.length === 0) { toast.error("No chapters found"); return; }
    setBulkProgress({ current: 0, total: chapList.length, chapter: "", done: false });
    let done = 0;
    for (const ch of chapList) {
      setBulkProgress({ current: done, total: chapList.length, chapter: ch.title, done: false });
      try { await generateContent.mutateAsync({ chapterId: ch.chapterId }); } catch { }
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

        {/* ERP Dialogs */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Invite Member</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Role</Label>
                <Select value={inviteForm.role} onValueChange={(v: any) => setInviteForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Full Name *</Label><Input placeholder="e.g. Arjun Sharma" value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Email *</Label><Input type="email" placeholder="arjun@email.com" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Cancel</Button>
                <Button disabled={inviteMember.isPending} onClick={() => {
                  if (!inviteForm.name || !inviteForm.email) { toast.error("Name and email required"); return; }
                  inviteMember.mutate({ instituteId, email: inviteForm.email, name: inviteForm.name, role: inviteForm.role });
                  setShowInviteDialog(false);
                }}>{inviteMember.isPending ? "Sending..." : "Send Invite"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Class</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Class Name *</Label><Input placeholder="e.g. Class 11 - Batch A" value={classForm.name} onChange={e => setClassForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Grade</Label>
                  <Select value={classForm.grade} onValueChange={(v: any) => setClassForm(f => ({ ...f, grade: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11">Grade 11</SelectItem>
                      <SelectItem value="12">Grade 12</SelectItem>
                      <SelectItem value="dropper">Dropper</SelectItem>
                      <SelectItem value="integrated">Integrated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Max Students</Label><Input type="number" value={classForm.maxStudents} onChange={e => setClassForm(f => ({ ...f, maxStudents: Number(e.target.value) }))} /></div>
              </div>
              <div><Label>Academic Year</Label><Input value={classForm.academicYear} onChange={e => setClassForm(f => ({ ...f, academicYear: e.target.value }))} /></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowClassDialog(false)}>Cancel</Button>
                <Button disabled={createClass.isPending} onClick={() => {
                  if (!classForm.name) { toast.error("Class name required"); return; }
                  createClass.mutate({ instituteId, ...classForm });
                  setShowClassDialog(false);
                }}>{createClass.isPending ? "Creating..." : "Create Class"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Create Subject</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Subject Name *</Label><Input placeholder="e.g. Physics" value={subjectForm.name} onChange={e => setSubjectForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Code</Label><Input placeholder="PHY" value={subjectForm.code} onChange={e => setSubjectForm(f => ({ ...f, code: e.target.value }))} /></div>
                <div><Label>Color</Label><Input type="color" value={subjectForm.colorHex} onChange={e => setSubjectForm(f => ({ ...f, colorHex: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowSubjectDialog(false)}>Cancel</Button>
                <Button disabled={createSubject.isPending} onClick={() => {
                  if (!subjectForm.name) { toast.error("Subject name required"); return; }
                  createSubject.mutate({ instituteId, ...subjectForm });
                  setShowSubjectDialog(false);
                }}>{createSubject.isPending ? "Creating..." : "Create Subject"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Enroll Student in Class Dialog ── */}
        <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Assign Student to Class</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm font-medium text-blue-800">{enrollStudent?.name}</p>
                <p className="text-xs text-blue-600">Will be enrolled in the selected class</p>
              </div>
              <div><Label>Class *</Label>
                <Select value={enrollClassId} onValueChange={setEnrollClassId}>
                  <SelectTrigger><SelectValue placeholder="Select class…" /></SelectTrigger>
                  <SelectContent>
                    {(classes.data ?? []).map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name} — Grade {c.grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Academic Year</Label>
                <Input value={enrollYear} onChange={e => setEnrollYear(e.target.value)} placeholder="2025-26" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowEnrollDialog(false)}>Cancel</Button>
                <Button
                  disabled={!enrollClassId || enrollStudent_mut.isPending}
                  onClick={() => {
                    if (!enrollStudent || !enrollClassId) return;
                    enrollStudent_mut.mutate({
                      instituteId,
                      studentId: enrollStudent.userId,
                      classId: Number(enrollClassId),
                    });
                  }}
                >
                  {enrollStudent_mut.isPending ? "Enrolling…" : "Enroll Student"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Link Parent Dialog ── */}
        <Dialog open={showLinkParentDialog} onOpenChange={setShowLinkParentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Link Parent to Student</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm font-medium text-amber-800">{linkStudent?.name}</p>
                <p className="text-xs text-amber-600">Select a parent to link to this student</p>
              </div>
              <div><Label>Parent *</Label>
                <Select value={linkParentId} onValueChange={setLinkParentId}>
                  <SelectTrigger><SelectValue placeholder="Select parent…" /></SelectTrigger>
                  <SelectContent>
                    {(parents.data ?? []).length === 0 && (
                      <SelectItem value="_none" disabled>No parents onboarded yet</SelectItem>
                    )}
                    {(parents.data ?? []).map(p => (
                      <SelectItem key={p.userId} value={String(p.userId)}>{p.name} ({p.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Relationship</Label>
                <Select value={linkRelation} onValueChange={(v) => setLinkRelation(v as "father" | "mother" | "guardian" | "other")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowLinkParentDialog(false)}>Cancel</Button>
                <Button
                  disabled={!linkParentId || linkParentId === "_none" || linkParent_mut.isPending}
                  onClick={() => {
                    if (!linkStudent || !linkParentId || linkParentId === "_none") return;
                    linkParent_mut.mutate({
                      instituteId,
                      parentId: Number(linkParentId),
                      studentId: linkStudent.userId,
                      relationship: linkRelation as "father" | "mother" | "guardian" | "other",
                    });
                  }}
                >
                  {linkParent_mut.isPending ? "Linking…" : "Link Parent"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Assign Teacher to Class &amp; Subject</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <div><Label>Teacher</Label>
                <Select value={mappingForm.teacherId} onValueChange={v => setMappingForm(f => ({ ...f, teacherId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                  <SelectContent>{(teachers.data ?? []).map(t => <SelectItem key={t.userId} value={String(t.userId)}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Class</Label>
                <Select value={mappingForm.classId} onValueChange={v => setMappingForm(f => ({ ...f, classId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>{(classes.data ?? []).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Subject</Label>
                <Select value={mappingForm.subjectId} onValueChange={v => setMappingForm(f => ({ ...f, subjectId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{(subjects.data ?? []).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowMappingDialog(false)}>Cancel</Button>
                <Button disabled={assignTeacher.isPending} onClick={() => {
                  if (!mappingForm.teacherId || !mappingForm.classId || !mappingForm.subjectId) { toast.error("All fields required"); return; }
                  assignTeacher.mutate({ instituteId, teacherId: Number(mappingForm.teacherId), classId: Number(mappingForm.classId), subjectId: Number(mappingForm.subjectId) });
                  setShowMappingDialog(false);
                }}>{assignTeacher.isPending ? "Assigning..." : "Assign"}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users ({members.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="classes">Classes ({classes.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="subjects">Subjects ({subjects.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="mappings">Teacher Mapping</TabsTrigger>
            <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
            <TabsTrigger value="content">Content Upload</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Generate</TabsTrigger>
            <TabsTrigger value="attendance">Attendance Summary</TabsTrigger>
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
                  {students.data && students.data.length > 0 ? (
                    <div className="space-y-2">
                      {students.data.slice(0, 5).map((s) => (
                        <div key={s.memberId} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
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

          {/* ── Users Tab ── */}
          <TabsContent value="users" className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">User Management</h2>
                <p className="text-sm text-muted-foreground">Teachers, students, and parents in your institute</p>
              </div>
              <Button size="sm" className="gap-2" onClick={() => setShowInviteDialog(true)}>
                <Plus className="w-4 h-4" /> Invite Member
              </Button>
            </div>

            {/* Role summary cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Teachers", data: teachers.data, icon: UserCheck, color: "text-green-500", bg: "bg-green-50" },
                { label: "Students", data: students.data, icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-50" },
                { label: "Parents", data: parents.data, icon: Users, color: "text-amber-500", bg: "bg-amber-50" },
              ].map((r) => (
                <Card key={r.label} className="border-border bg-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${r.bg} flex items-center justify-center`}>
                      <r.icon className={`w-5 h-5 ${r.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{r.data?.length ?? 0}</p>
                      <p className="text-xs text-muted-foreground">{r.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Full member list */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3"><CardTitle className="text-base">All Members</CardTitle></CardHeader>
              <CardContent className="p-0">
                {members.isLoading && <div className="text-center py-8 text-muted-foreground">Loading...</div>}
                {(members.data ?? []).length === 0 && !members.isLoading && (
                  <div className="text-center py-10 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No members yet. Invite your first teacher or student.</p>
                  </div>
                )}
                <div className="divide-y divide-border">
                  {(members.data ?? []).map((m) => (
                    <div key={m.memberId} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {(m.name || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{m.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs capitalize ${
                          m.role === "teacher" ? "text-green-600 border-green-300" :
                          m.role === "student" ? "text-blue-600 border-blue-300" :
                          "text-amber-600 border-amber-300"
                        }`}>{m.role}</Badge>
                        <Badge variant={m.isActive ? "default" : "secondary"} className="text-xs">
                          {m.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {m.role === "student" && m.isActive && (
                          <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              setEnrollStudent({ memberId: m.memberId, userId: m.userId, name: m.name || "Student" });
                              setEnrollClassId("");
                              setShowEnrollDialog(true);
                            }}>
                            <UserPlus className="w-3 h-3 mr-1" /> Assign Class
                          </Button>
                        )}
                        {m.role === "student" && m.isActive && (
                          <Button variant="ghost" size="sm" className="text-xs text-amber-600 hover:text-amber-700"
                            onClick={() => {
                              setLinkStudent({ memberId: m.memberId, userId: m.userId, name: m.name || "Student" });
                              setLinkParentId("");
                              setShowLinkParentDialog(true);
                            }}>
                            <LinkIcon className="w-3 h-3 mr-1" /> Link Parent
                          </Button>
                        )}
                        {m.isActive && (
                          <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-600"
                            onClick={() => deactivateMember.mutate({ memberId: m.memberId, instituteId })}>
                            <UserX className="w-3 h-3 mr-1" /> Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Classes Tab ── */}
          <TabsContent value="classes" className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Class Management</h2>
                <p className="text-sm text-muted-foreground">Create and manage classes/batches for your institute</p>
              </div>
              <Button size="sm" className="gap-2" onClick={() => setShowClassDialog(true)}>
                <Plus className="w-4 h-4" /> Create Class
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.isLoading && <div className="col-span-3 text-center py-8 text-muted-foreground">Loading...</div>}
              {(classes.data ?? []).map((cls) => (
                <Card key={cls.id} className="border-border bg-card">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">Grade {cls.grade} · {cls.academicYear}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Max {cls.maxStudents}</Badge>
                    </div>
                    {cls.teacherName && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserCheck className="w-3 h-3" /> {cls.teacherName}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {!classes.isLoading && !(classes.data?.length) && (
                <Card className="col-span-3 border-dashed border-border">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">No classes yet. Create your first class.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Subjects Tab ── */}
          <TabsContent value="subjects" className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Subject Management</h2>
                <p className="text-sm text-muted-foreground">Define subjects taught at your institute</p>
              </div>
              <Button size="sm" className="gap-2" onClick={() => setShowSubjectDialog(true)}>
                <Plus className="w-4 h-4" /> Add Subject
              </Button>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(subjects.data ?? []).map((sub) => (
                <Card key={sub.id} className="border-border bg-card">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: (sub.colorHex || "#6366f1") + "22" }}>
                      <BookMarked className="w-5 h-5" style={{ color: sub.colorHex || "#6366f1" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{sub.name}</p>
                      {sub.code && <p className="text-xs text-muted-foreground">{sub.code}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!subjects.isLoading && !(subjects.data?.length) && (
                <Card className="col-span-4 border-dashed border-border">
                  <CardContent className="py-12 text-center">
                    <BookMarked className="w-10 h-10 mx-auto mb-2 opacity-30 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">No subjects yet. Add Physics, Chemistry, Maths etc.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Teacher Mapping Tab ── */}
          <TabsContent value="mappings" className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Teacher ↔ Class ↔ Subject Mapping</h2>
                <p className="text-sm text-muted-foreground">Assign teachers to specific classes and subjects</p>
              </div>
              <Button size="sm" className="gap-2" onClick={() => setShowMappingDialog(true)}>
                <Link2 className="w-4 h-4" /> Assign Teacher
              </Button>
            </div>
            <Card className="border-border bg-card">
              <CardContent className="p-0">
                {teacherMappings.isLoading && <div className="text-center py-8 text-muted-foreground">Loading...</div>}
                {(teacherMappings.data ?? []).length === 0 && !teacherMappings.isLoading && (
                  <div className="text-center py-10 text-muted-foreground">
                    <Link2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No mappings yet. Assign teachers to classes and subjects.</p>
                  </div>
                )}
                <div className="divide-y divide-border">
                  {(teacherMappings.data ?? []).map((m) => (
                    <div key={m.id} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-sm font-semibold text-green-600">
                          {(m.teacherName || "T")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{m.teacherName || "—"}</p>
                          <p className="text-xs text-muted-foreground">{m.className} · {m.subjectName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{m.subjectName}</Badge>
                        <Badge variant="outline" className="text-xs">{m.className}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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

          {/* ── Attendance Summary Tab ── */}
          <TabsContent value="attendance" className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Monthly Attendance Summary</h2>
                <p className="text-sm text-muted-foreground">View per-student attendance percentages for any class and month</p>
              </div>
            </div>

            {/* Selectors */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Class</Label>
                    <Select
                      value={attSummaryClassId ? String(attSummaryClassId) : ""}
                      onValueChange={(v) => setAttSummaryClassId(Number(v))}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Select class…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(classes.data ?? []).map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name} — Grade {c.grade}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Month</Label>
                    <input
                      type="month"
                      value={attSummaryMonth}
                      onChange={e => setAttSummaryMonth(e.target.value)}
                      className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary table */}
            {attSummaryClassId ? (
              <Card className="border-border bg-card">
                <CardContent className="p-0">
                  {attSummary.isLoading ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <BarChart2 className="w-8 h-8 mx-auto mb-2 animate-pulse opacity-40" />
                      <p className="text-sm">Loading attendance data…</p>
                    </div>
                  ) : attSummary.data && attSummary.data.length > 0 ? (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th className="text-center">Present</th>
                          <th className="text-center">Absent</th>
                          <th className="text-center">Late</th>
                          <th className="text-center">Total Days</th>
                          <th className="text-center">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attSummary.data.map((row) => (
                          <tr key={row.studentId}>
                            <td className="font-medium text-foreground">{row.studentName || `Student #${row.studentId}`}</td>
                            <td className="text-center text-green-600 font-medium">{Number(row.present)}</td>
                            <td className="text-center text-red-600 font-medium">{Number(row.absent)}</td>
                            <td className="text-center text-amber-600 font-medium">{Number(row.late)}</td>
                            <td className="text-center text-muted-foreground">{Number(row.total)}</td>
                            <td className="text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      row.attendancePercent >= 75 ? "bg-green-500" :
                                      row.attendancePercent >= 50 ? "bg-amber-500" : "bg-red-500"
                                    }`}
                                    style={{ width: `${row.attendancePercent}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-semibold ${
                                  row.attendancePercent >= 75 ? "text-green-600" :
                                  row.attendancePercent >= 50 ? "text-amber-600" : "text-red-600"
                                }`}>{row.attendancePercent}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No attendance records for this class and month</p>
                      <p className="text-xs mt-1">Teachers must mark attendance from the Teacher Portal first</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <BarChart2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">Select a class and month to view attendance</p>
              </div>
            )}
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
