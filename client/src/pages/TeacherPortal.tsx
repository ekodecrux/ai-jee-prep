import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import PlatformLayout from "@/components/PlatformLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Users, BookOpen, ClipboardList, BarChart3, Eye,
  GraduationCap, CheckCircle2, AlertCircle, TrendingUp,
  MessageSquare, Video, Plus, Calendar, ChevronDown,
  CheckSquare, XSquare, Clock, Save, RefreshCw,
  Wand2, FileText, ExternalLink, Wifi, WifiOff,
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

  // ─── Online Classes state ──────────────────────────────────────────────────
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [ocTitle, setOcTitle] = useState("");
  const [ocDesc, setOcDesc] = useState("");
  const [ocClassId, setOcClassId] = useState<number | null>(null);
  const [ocSubjectId, setOcSubjectId] = useState<number | null>(null);
  const [ocDate, setOcDate] = useState("");
  const [ocTime, setOcTime] = useState("09:00");
  const [ocDuration, setOcDuration] = useState(60);
  const [ocMeetingUrl, setOcMeetingUrl] = useState("");
  const [ocWebcam, setOcWebcam] = useState(false);
  const [ocType, setOcType] = useState<"live_class" | "test" | "doubt_session">("live_class");

  // ─── Lesson Plan state ────────────────────────────────────────────────────
  const [showCreateLP, setShowCreateLP] = useState(false);
  const [lpTitle, setLpTitle] = useState("");
  const [lpDate, setLpDate] = useState(new Date().toISOString().slice(0, 10));
  const [lpObjectives, setLpObjectives] = useState("");
  const [lpContent, setLpContent] = useState("");
  const [lpResources, setLpResources] = useState("");
  const [lpHomework, setLpHomework] = useState("");
  const [lpClassId, setLpClassId] = useState<number | null>(null);
  const [lpAiTopic, setLpAiTopic] = useState("");
  const [lpAiLoading, setLpAiLoading] = useState(false);

  // ─── Online Classes queries/mutations ────────────────────────────────────
  const { data: upcomingClasses, refetch: refetchClasses } = trpc.onlineClasses.list.useQuery(
    { instituteId: myInstituteId!, upcoming: true },
    { enabled: !!myInstituteId }
  );
  const createClass = trpc.onlineClasses.create.useMutation({
    onSuccess: () => { toast.success("Class scheduled!"); setShowCreateClass(false); refetchClasses(); resetOcForm(); },
    onError: (e) => toast.error(e.message),
  });

  // ─── Lesson Plan queries/mutations ───────────────────────────────────────
  const { data: lessonPlans, refetch: refetchLP } = trpc.lessonPlansErp.list.useQuery(
    { instituteId: myInstituteId! },
    { enabled: !!myInstituteId }
  );
  const createLP = trpc.lessonPlansErp.create.useMutation({
    onSuccess: () => { toast.success("Lesson plan saved!"); setShowCreateLP(false); refetchLP(); resetLpForm(); },
    onError: (e) => toast.error(e.message),
  });
  const aiGenerateLP = trpc.lessonPlansErp.aiGenerate.useMutation({
    onSuccess: (res) => {
      if (res.plan) {
        setLpTitle(res.plan.title);
        setLpObjectives(res.plan.objectives);
        setLpContent(res.plan.content);
        setLpResources(res.plan.resources);
        setLpHomework(res.plan.homework);
      }
      toast.success("AI lesson plan generated!");
      setLpAiLoading(false);
      refetchLP();
    },
    onError: (e) => { toast.error(e.message); setLpAiLoading(false); },
  });

  function resetOcForm() {
    setOcTitle(""); setOcDesc(""); setOcClassId(null); setOcSubjectId(null);
    setOcDate(""); setOcTime("09:00"); setOcDuration(60); setOcMeetingUrl(""); setOcWebcam(false);
  }
  function resetLpForm() {
    setLpTitle(""); setLpObjectives(""); setLpContent(""); setLpResources(""); setLpHomework(""); setLpAiTopic("");
  }

  function submitCreateClass() {
    if (!myInstituteId || !ocClassId || !ocTitle || !ocDate) { toast.error("Fill all required fields"); return; }
    const scheduledAt = new Date(`${ocDate}T${ocTime}:00`).getTime();
    createClass.mutate({
      instituteId: myInstituteId, classId: ocClassId, subjectId: ocSubjectId ?? undefined,
      title: ocTitle, description: ocDesc, scheduledAt, durationMinutes: ocDuration,
      meetingUrl: ocMeetingUrl || undefined, webcamRequired: ocWebcam, type: ocType,
    });
  }

  function submitCreateLP() {
    if (!myInstituteId || !lpClassId || !lpTitle) { toast.error("Fill all required fields"); return; }
    createLP.mutate({
      instituteId: myInstituteId, classId: lpClassId, title: lpTitle, date: lpDate,
      objectives: lpObjectives, content: lpContent, resources: lpResources, homework: lpHomework,
    });
  }

  function runAiGenerate() {
    if (!myInstituteId || !lpClassId || !lpAiTopic) { toast.error("Select a class and enter a topic"); return; }
    setLpAiLoading(true);
    aiGenerateLP.mutate({
      instituteId: myInstituteId, classId: lpClassId, topic: lpAiTopic, date: lpDate,
      durationMinutes: 45,
    });
  }

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
    <PlatformLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your classes, attendance, lesson plans, and assessments</p>
        </div>
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
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="lesson-plans">Lesson Plans</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="students">My Students</TabsTrigger>
            <TabsTrigger value="proctoring">Proctoring</TabsTrigger>
            <TabsTrigger value="doubts">Doubt Board</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
          </TabsList>

          {/* ─── Schedule ─────────────────────────────────────────────────── */}
          <TabsContent value="schedule" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Online Classes & Sessions</h2>
                <p className="text-sm text-muted-foreground">Schedule live classes, tests, and doubt sessions</p>
              </div>
              <Dialog open={showCreateClass} onOpenChange={setShowCreateClass}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Schedule Class</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Schedule Online Session</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label>Session Title *</Label>
                        <Input placeholder="e.g. Kinematics — Live Doubt Session" value={ocTitle} onChange={e => setOcTitle(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select value={ocType} onValueChange={v => setOcType(v as any)}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="live_class">Live Class</SelectItem>
                            <SelectItem value="test">Online Test</SelectItem>
                            <SelectItem value="doubt_session">Doubt Session</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Class *</Label>
                        <Select value={ocClassId?.toString() ?? ""} onValueChange={v => setOcClassId(Number(v))}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>
                            {myClasses?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}{(c as any).section ? ` - ${(c as any).section}` : ""}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Date *</Label>
                        <Input type="date" value={ocDate} onChange={e => setOcDate(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input type="time" value={ocTime} onChange={e => setOcTime(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label>Duration (min)</Label>
                        <Input type="number" value={ocDuration} onChange={e => setOcDuration(Number(e.target.value))} className="mt-1" min={15} max={180} />
                      </div>
                      <div className="col-span-2">
                        <Label>Meeting URL (Google Meet / Zoom)</Label>
                        <Input placeholder="https://meet.google.com/..." value={ocMeetingUrl} onChange={e => setOcMeetingUrl(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea placeholder="What will be covered..." value={ocDesc} onChange={e => setOcDesc(e.target.value)} className="mt-1" rows={2} />
                      </div>
                      <div className="flex items-center gap-3 pt-4">
                        <Switch checked={ocWebcam} onCheckedChange={setOcWebcam} id="webcam-toggle" />
                        <Label htmlFor="webcam-toggle" className="cursor-pointer">
                          {ocWebcam ? <span className="flex items-center gap-1 text-amber-600"><Wifi className="w-4 h-4" /> Webcam Required</span> : <span className="flex items-center gap-1 text-muted-foreground"><WifiOff className="w-4 h-4" /> Webcam Optional</span>}
                        </Label>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1" onClick={submitCreateClass} disabled={createClass.isPending}>
                        {createClass.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null} Schedule Session
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateClass(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Upcoming classes list */}
            {!upcomingClasses || upcomingClasses.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No upcoming sessions</p>
                <p className="text-sm mt-1">Click "Schedule Class" to create your first online session</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map((cls: any) => {
                  const dt = new Date(cls.scheduledAt);
                  const typeColors: Record<string, string> = { live_class: "bg-blue-100 text-blue-700", test: "bg-red-100 text-red-700", doubt_session: "bg-purple-100 text-purple-700" };
                  const typeLabels: Record<string, string> = { live_class: "Live Class", test: "Online Test", doubt_session: "Doubt Session" };
                  return (
                    <Card key={cls.id} className="border-border bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[cls.type] ?? "bg-gray-100 text-gray-700"}`}>{typeLabels[cls.type] ?? cls.type}</span>
                              {cls.webcamRequired && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium flex items-center gap-1"><Wifi className="w-3 h-3" /> Webcam</span>}
                              <Badge variant={cls.status === "live" ? "default" : "secondary"} className="text-xs">{cls.status}</Badge>
                            </div>
                            <p className="font-semibold text-foreground truncate">{cls.title}</p>
                            {cls.description && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{cls.description}</p>}
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {dt.toLocaleDateString()} at {dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {cls.durationMinutes} min
                            </p>
                          </div>
                          {cls.meetingUrl && (
                            <a href={cls.meetingUrl} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="gap-1 shrink-0">
                                <ExternalLink className="w-3 h-3" /> Join
                              </Button>
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ─── Lesson Plans ─────────────────────────────────────────────── */}
          <TabsContent value="lesson-plans" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Lesson Plans</h2>
                <p className="text-sm text-muted-foreground">Create manually or let AI generate a full plan in seconds</p>
              </div>
              <Dialog open={showCreateLP} onOpenChange={setShowCreateLP}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Plan</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Create Lesson Plan</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-2">
                    {/* AI Generate strip */}
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                      <p className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-2"><Wand2 className="w-4 h-4" /> AI Auto-Generate</p>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter topic, e.g. Newton's Laws of Motion"
                          value={lpAiTopic}
                          onChange={e => setLpAiTopic(e.target.value)}
                          className="flex-1 bg-white"
                        />
                        <Button
                          variant="default"
                          className="gap-1 shrink-0 bg-indigo-600 hover:bg-indigo-700"
                          onClick={runAiGenerate}
                          disabled={lpAiLoading || !lpAiTopic || !lpClassId}
                        >
                          {lpAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                          {lpAiLoading ? "Generating..." : "Generate"}
                        </Button>
                      </div>
                      {!lpClassId && <p className="text-xs text-indigo-600 mt-1">Select a class below first</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label>Title *</Label>
                        <Input placeholder="Lesson title" value={lpTitle} onChange={e => setLpTitle(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label>Class *</Label>
                        <Select value={lpClassId?.toString() ?? ""} onValueChange={v => setLpClassId(Number(v))}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                          <SelectContent>
                            {myClasses?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}{(c as any).section ? ` - ${(c as any).section}` : ""}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Date</Label>
                        <Input type="date" value={lpDate} onChange={e => setLpDate(e.target.value)} className="mt-1" />
                      </div>
                      <div className="col-span-2">
                        <Label>Learning Objectives</Label>
                        <Textarea placeholder="By end of lesson, students will be able to..." value={lpObjectives} onChange={e => setLpObjectives(e.target.value)} className="mt-1" rows={3} />
                      </div>
                      <div className="col-span-2">
                        <Label>Lesson Content / Activities</Label>
                        <Textarea placeholder="Introduction, key concepts, activities, examples..." value={lpContent} onChange={e => setLpContent(e.target.value)} className="mt-1" rows={4} />
                      </div>
                      <div>
                        <Label>Resources</Label>
                        <Textarea placeholder="NCERT, HC Verma, YouTube links..." value={lpResources} onChange={e => setLpResources(e.target.value)} className="mt-1" rows={2} />
                      </div>
                      <div>
                        <Label>Homework</Label>
                        <Textarea placeholder="Practice problems, reading..." value={lpHomework} onChange={e => setLpHomework(e.target.value)} className="mt-1" rows={2} />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button className="flex-1" onClick={submitCreateLP} disabled={createLP.isPending}>
                        {createLP.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Lesson Plan
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateLP(false)}>Cancel</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Lesson plans list */}
            {!lessonPlans || lessonPlans.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No lesson plans yet</p>
                <p className="text-sm mt-1">Create your first lesson plan manually or use AI to generate one instantly</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lessonPlans.map((lp: any) => (
                  <Card key={lp.id} className="border-border bg-card">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">{lp.date}</span>
                            {lp.isAiGenerated && <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium flex items-center gap-1"><Wand2 className="w-3 h-3" /> AI</span>}
                            <Badge variant="secondary" className="text-xs">{lp.status}</Badge>
                          </div>
                          <p className="font-semibold text-foreground">{lp.title}</p>
                          {lp.objectives && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{lp.objectives}</p>}
                          {lp.homework && <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><BookOpen className="w-3 h-3" /> HW: {lp.homework}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

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
    </PlatformLayout>
  );
}
