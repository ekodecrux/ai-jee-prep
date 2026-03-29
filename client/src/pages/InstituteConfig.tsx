import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { RoleGuard } from "@/components/RoleGuard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CheckCircle2, ChevronRight, ChevronLeft, Settings2, BookOpen,
  GraduationCap, Calendar, Clock, FileText, Zap, AlertCircle,
  FlaskConical, Calculator, Atom, Brain, Globe, Building2
} from "lucide-react";

// ─── Exam Registry ─────────────────────────────────────────────────────────────
const EXAM_REGISTRY = [
  {
    id: "jee_main",
    name: "JEE Main",
    fullName: "Joint Entrance Examination (Main)",
    category: "Engineering",
    icon: "⚙️",
    duration: "3 hours",
    marks: 300,
    questionTypes: ["MCQ", "NAT (Numerical)"],
    subjects: ["Physics", "Chemistry", "Mathematics"],
    chapters: 80,
    description: "National level engineering entrance for NITs, IIITs, and CFTIs",
    color: "from-blue-600 to-cyan-600",
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
  },
  {
    id: "jee_advanced",
    name: "JEE Advanced",
    fullName: "Joint Entrance Examination (Advanced)",
    category: "Engineering",
    icon: "🏆",
    duration: "3 hours × 2 papers",
    marks: 360,
    questionTypes: ["MCQ", "Multi-correct", "NAT", "Integer type"],
    subjects: ["Physics", "Chemistry", "Mathematics"],
    chapters: 80,
    description: "IIT entrance — toughest engineering exam in India",
    color: "from-purple-600 to-indigo-600",
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
  },
  {
    id: "neet",
    name: "NEET UG",
    fullName: "National Eligibility cum Entrance Test (UG)",
    category: "Medical",
    icon: "🏥",
    duration: "3 hours 20 minutes",
    marks: 720,
    questionTypes: ["MCQ"],
    subjects: ["Physics", "Chemistry", "Biology (Botany + Zoology)"],
    chapters: 97,
    description: "National medical entrance for MBBS/BDS admissions",
    color: "from-green-600 to-emerald-600",
    border: "border-green-500/30",
    bg: "bg-green-500/10",
  },
  {
    id: "gate",
    name: "GATE",
    fullName: "Graduate Aptitude Test in Engineering",
    category: "Post-Graduate",
    icon: "🎓",
    duration: "3 hours",
    marks: 100,
    questionTypes: ["MCQ", "NAT"],
    subjects: ["Engineering Mathematics", "Subject-specific"],
    chapters: 60,
    description: "Post-graduate engineering entrance for M.Tech/PSU jobs",
    color: "from-orange-600 to-amber-600",
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
  },
  {
    id: "upsc_cse",
    name: "UPSC CSE",
    fullName: "UPSC Civil Services Examination",
    category: "Civil Services",
    icon: "🏛️",
    duration: "Multiple stages",
    marks: 2025,
    questionTypes: ["MCQ (Prelims)", "Subjective (Mains)"],
    subjects: ["GS Paper I-IV", "Optional Subject", "Essay"],
    chapters: 120,
    description: "India's premier civil services exam for IAS/IPS/IFS",
    color: "from-red-600 to-rose-600",
    border: "border-red-500/30",
    bg: "bg-red-500/10",
  },
  {
    id: "cbse_11",
    name: "CBSE Class 11",
    fullName: "CBSE Board Examination — Class 11",
    category: "Academic",
    icon: "📚",
    duration: "3 hours per paper",
    marks: 100,
    questionTypes: ["MCQ", "Short Answer", "Long Answer"],
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology"],
    chapters: 40,
    description: "CBSE annual board examination for Class 11 students",
    color: "from-teal-600 to-cyan-600",
    border: "border-teal-500/30",
    bg: "bg-teal-500/10",
  },
  {
    id: "cbse_12",
    name: "CBSE Class 12",
    fullName: "CBSE Board Examination — Class 12",
    category: "Academic",
    icon: "🎯",
    duration: "3 hours per paper",
    marks: 100,
    questionTypes: ["MCQ", "Short Answer", "Long Answer"],
    subjects: ["Physics", "Chemistry", "Mathematics", "Biology"],
    chapters: 40,
    description: "CBSE board examination — critical for college admissions",
    color: "from-sky-600 to-blue-600",
    border: "border-sky-500/30",
    bg: "bg-sky-500/10",
  },
  {
    id: "custom",
    name: "Custom Exam",
    fullName: "Institute-Defined Custom Examination",
    category: "Custom",
    icon: "⚡",
    duration: "Configurable",
    marks: 0,
    questionTypes: ["All types"],
    subjects: ["Configurable"],
    chapters: 0,
    description: "Define your own exam pattern, subjects, and question types",
    color: "from-gray-600 to-slate-600",
    border: "border-gray-500/30",
    bg: "bg-gray-500/10",
  },
];

const CURRICULA = [
  { id: "ncert", name: "NCERT", description: "National Council of Educational Research and Training — standard for JEE/NEET", icon: "📖" },
  { id: "cbse", name: "CBSE", description: "Central Board of Secondary Education curriculum", icon: "🏫" },
  { id: "state_board", name: "State Board", description: "State-specific curriculum (AP, TS, MH, KA, etc.)", icon: "🗺️" },
  { id: "icse", name: "ICSE/ISC", description: "Indian Certificate of Secondary Education", icon: "📜" },
  { id: "custom", name: "Custom Curriculum", description: "Institute-defined custom syllabus", icon: "⚙️" },
];

const CLASS_LEVELS = [
  { id: "11_only", name: "Class 11 Only", description: "First year — foundation building", months: 12 },
  { id: "12_only", name: "Class 12 Only", description: "Second year — advanced topics + exam prep", months: 12 },
  { id: "11_12", name: "Class 11 + 12 (Integrated)", description: "Full 2-year program — recommended for JEE/NEET", months: 24 },
  { id: "dropper", name: "Dropper / Repeater", description: "Full revision + advanced practice", months: 12 },
];

const DURATIONS = [
  { id: "12", label: "12 Months", description: "Intensive — 1 year program", months: 12 },
  { id: "20", label: "20 Months", description: "Balanced — recommended for JEE", months: 20 },
  { id: "24", label: "24 Months", description: "Comprehensive — full 2-year program", months: 24 },
  { id: "custom", label: "Custom Duration", description: "Set your own timeline", months: 0 },
];

const SESSION_MODES = [
  {
    id: "narration_30",
    name: "30-Min Lesson Mode",
    description: "Structured chapter narration with AI avatar Priya — key concepts, examples, and explanations",
    icon: "🎓",
    frequency: "Weekdays (Mon–Fri)",
    recommended: true,
  },
  {
    id: "exam_15",
    name: "15-Min Weekday Exam",
    description: "Quick 10-question chapter test — JEE pattern, instant feedback",
    icon: "⚡",
    frequency: "Weekdays (Mon–Fri)",
    recommended: true,
  },
  {
    id: "exam_60",
    name: "1-Hr Weekend Exam",
    description: "Full 30-question exam covering 3 subjects — JEE/NEET pattern with proctoring",
    icon: "🏆",
    frequency: "Saturdays",
    recommended: true,
  },
  {
    id: "mock_full",
    name: "Full Mock Test (3 hrs)",
    description: "Complete JEE/NEET pattern mock test — proctored, timed, full paper",
    icon: "📝",
    frequency: "Monthly",
    recommended: true,
  },
  {
    id: "revision_45",
    name: "45-Min Revision Session",
    description: "Focused revision of weak chapters identified by heatmap",
    icon: "🔄",
    frequency: "Sundays",
    recommended: false,
  },
];

// ─── Step Indicator ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Select Exam(s)", icon: GraduationCap },
  { id: 2, label: "Curriculum", icon: BookOpen },
  { id: 3, label: "Class Level", icon: Brain },
  { id: 4, label: "Duration", icon: Calendar },
  { id: 5, label: "Session Modes", icon: Clock },
  { id: 6, label: "Mock Tests", icon: FileText },
  { id: 7, label: "Review & Activate", icon: Zap },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = current > step.id;
        const isCurrent = current === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all ${
              isCompleted ? "bg-green-500/20 text-green-400 border border-green-500/30" :
              isCurrent ? "bg-primary/20 text-primary border border-primary/50" :
              "bg-muted/30 text-muted-foreground border border-border/30"
            }`}>
              {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function InstituteConfig() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<string>("");
  const [selectedClassLevel, setSelectedClassLevel] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [selectedModes, setSelectedModes] = useState<string[]>(["narration_30", "exam_15", "exam_60", "mock_full"]);
  const [mockTestFrequency, setMockTestFrequency] = useState<"monthly" | "biweekly" | "weekly">("monthly");
  const [activating, setActivating] = useState(false);
  const [activated, setActivated] = useState(false);

  const toggleExam = (examId: string) => {
    setSelectedExams(prev =>
      prev.includes(examId) ? prev.filter(e => e !== examId) : [...prev, examId]
    );
  };

  const toggleMode = (modeId: string) => {
    setSelectedModes(prev =>
      prev.includes(modeId) ? prev.filter(m => m !== modeId) : [...prev, modeId]
    );
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedExams.length > 0;
      case 2: return !!selectedCurriculum;
      case 3: return !!selectedClassLevel;
      case 4: return !!selectedDuration;
      case 5: return selectedModes.length > 0;
      case 6: return true;
      default: return true;
    }
  };

  const handleActivate = async () => {
    setActivating(true);
    // Simulate activation (in production, call tRPC mutation)
    await new Promise(r => setTimeout(r, 2500));
    setActivating(false);
    setActivated(true);
    toast.success("Platform configured successfully! All student workflows are now active.", {
      description: `${selectedExams.length} exam(s) configured with ${selectedModes.length} session modes.`,
      duration: 6000,
    });
  };

  const selectedExamData = EXAM_REGISTRY.filter(e => selectedExams.includes(e.id));
  const totalChapters = selectedExamData.reduce((sum, e) => sum + e.chapters, 0);
  const durationMonths = DURATIONS.find(d => d.id === selectedDuration)?.months || 20;
  const mockTestCount = mockTestFrequency === "weekly" ? durationMonths * 4 : mockTestFrequency === "biweekly" ? durationMonths * 2 : durationMonths;

  if (activated) {
    return (
      <RoleGuard allowedRoles={["institute_admin", "admin", "super_admin"]}>
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-2xl w-full text-center space-y-8">
            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto border-2 border-green-500/40">
              <CheckCircle2 className="h-12 w-12 text-green-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-3">Platform Activated! 🎉</h1>
              <p className="text-muted-foreground text-lg">Your institute's knowledge platform is fully configured and ready for students.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Exams", value: selectedExams.length, icon: "🎯" },
                { label: "Chapters", value: totalChapters, icon: "📚" },
                { label: "Session Modes", value: selectedModes.length, icon: "⏱️" },
                { label: "Mock Tests", value: mockTestCount, icon: "📝" },
              ].map(stat => (
                <div key={stat.label} className="bg-card border border-border rounded-xl p-4">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => window.location.href = "/institute-admin"} className="gap-2">
                <Building2 className="h-4 w-4" /> Go to Admin Panel
              </Button>
              <Button variant="outline" onClick={() => window.location.href = "/admin"} className="gap-2">
                <Settings2 className="h-4 w-4" /> Manage Content
              </Button>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["institute_admin", "admin", "super_admin"]}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Settings2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Institute Configuration</h1>
                <p className="text-xs text-muted-foreground">Configure your platform — all workflows auto-adapt</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">Step {step} of {STEPS.length}</Badge>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          <StepIndicator current={step} />

          {/* Step 1: Select Exams */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Which exam(s) are you preparing for?</h2>
                <p className="text-muted-foreground">Select one or more exams. The platform auto-configures chapters, question patterns, and mock tests for each selected exam.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXAM_REGISTRY.map(exam => {
                  const isSelected = selectedExams.includes(exam.id);
                  return (
                    <button
                      key={exam.id}
                      onClick={() => toggleExam(exam.id)}
                      className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? `${exam.border} bg-gradient-to-br ${exam.color} bg-opacity-10 shadow-lg scale-[1.02]`
                          : "border-border/40 bg-card hover:border-border hover:bg-card/80"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{exam.icon}</span>
                          <div>
                            <div className="font-bold text-foreground text-lg">{exam.name}</div>
                            <div className="text-xs text-muted-foreground">{exam.category}</div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{exam.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">{exam.duration}</Badge>
                        <Badge variant="secondary" className="text-xs">{exam.marks > 0 ? `${exam.marks} marks` : "Variable"}</Badge>
                        <Badge variant="secondary" className="text-xs">{exam.chapters > 0 ? `${exam.chapters} chapters` : "Custom"}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {exam.questionTypes.map(qt => (
                          <span key={qt} className="text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full">{qt}</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedExams.length > 0 && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    <strong>{selectedExams.length} exam{selectedExams.length > 1 ? "s" : ""} selected</strong> — {selectedExamData.map(e => e.name).join(", ")}. Total: <strong>{totalChapters} chapters</strong> will be configured.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Curriculum */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Select Academic Curriculum</h2>
                <p className="text-muted-foreground">The curriculum determines chapter ordering, NCERT flow, and content alignment.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CURRICULA.map(curr => {
                  const isSelected = selectedCurriculum === curr.id;
                  return (
                    <button
                      key={curr.id}
                      onClick={() => setSelectedCurriculum(curr.id)}
                      className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-border/40 bg-card hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">{curr.icon}</span>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                      <div className="font-bold text-foreground text-lg mb-1">{curr.name}</div>
                      <p className="text-sm text-muted-foreground">{curr.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Class Level */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Select Class Level</h2>
                <p className="text-muted-foreground">This determines which chapters are included and the progressive unlock flow.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CLASS_LEVELS.map(level => {
                  const isSelected = selectedClassLevel === level.id;
                  return (
                    <button
                      key={level.id}
                      onClick={() => setSelectedClassLevel(level.id)}
                      className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-border/40 bg-card hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-bold text-foreground text-xl">{level.name}</div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                      <p className="text-muted-foreground mb-3">{level.description}</p>
                      <Badge variant="secondary">{level.months} months program</Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Duration */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Study Program Duration</h2>
                <p className="text-muted-foreground">The platform generates a complete day-by-day study plan for the selected duration, respecting Indian holidays.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DURATIONS.map(dur => {
                  const isSelected = selectedDuration === dur.id;
                  return (
                    <button
                      key={dur.id}
                      onClick={() => setSelectedDuration(dur.id)}
                      className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-lg"
                          : "border-border/40 bg-card hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-foreground text-2xl">{dur.label}</div>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                      <p className="text-muted-foreground">{dur.description}</p>
                      {dur.id === "20" && (
                        <Badge className="mt-3 bg-primary/20 text-primary border-primary/30">Recommended for JEE</Badge>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedDuration && selectedDuration !== "custom" && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-3">Auto-generated Study Plan Preview</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">{durationMonths}</div>
                      <div className="text-xs text-muted-foreground">Total Months</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{Math.round(durationMonths * 4.3)}</div>
                      <div className="text-xs text-muted-foreground">Study Weeks</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">43</div>
                      <div className="text-xs text-muted-foreground">Holidays Excluded</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{Math.round(durationMonths * 22)}</div>
                      <div className="text-xs text-muted-foreground">Study Days</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Session Modes */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Configure Session Modes</h2>
                <p className="text-muted-foreground">Select which session types to enable. Students follow these modes daily — designed to fit alongside regular Class 11/12 academics.</p>
              </div>
              <div className="space-y-3">
                {SESSION_MODES.map(mode => {
                  const isSelected = selectedModes.includes(mode.id);
                  return (
                    <button
                      key={mode.id}
                      onClick={() => toggleMode(mode.id)}
                      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-md"
                          : "border-border/40 bg-card hover:border-border"
                      }`}
                    >
                      <span className="text-3xl flex-shrink-0">{mode.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-foreground">{mode.name}</span>
                          {mode.recommended && <Badge variant="secondary" className="text-xs">Recommended</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{mode.description}</p>
                        <Badge variant="outline" className="text-xs">{mode.frequency}</Badge>
                      </div>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 6: Mock Test Schedule */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Mock Test Schedule</h2>
                <p className="text-muted-foreground">Pre-generated mock tests unlock automatically on schedule. Students cannot access future tests until the unlock date.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {(["monthly", "biweekly", "weekly"] as const).map(freq => (
                  <button
                    key={freq}
                    onClick={() => setMockTestFrequency(freq)}
                    className={`p-5 rounded-2xl border-2 text-center transition-all ${
                      mockTestFrequency === freq
                        ? "border-primary bg-primary/10 shadow-md"
                        : "border-border/40 bg-card hover:border-border"
                    }`}
                  >
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {freq === "monthly" ? durationMonths : freq === "biweekly" ? durationMonths * 2 : durationMonths * 4}
                    </div>
                    <div className="font-medium text-foreground capitalize">{freq}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {freq === "monthly" ? "1 per month" : freq === "biweekly" ? "2 per month" : "1 per week"}
                    </div>
                    {freq === "monthly" && <Badge className="mt-2 bg-primary/20 text-primary border-primary/30 text-xs">Recommended</Badge>}
                    {mockTestFrequency === freq && <CheckCircle2 className="h-4 w-4 text-primary mx-auto mt-2" />}
                  </button>
                ))}
              </div>
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h3 className="font-semibold text-foreground">Mock Test Configuration</h3>
                {selectedExamData.map(exam => (
                  <div key={exam.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{exam.icon}</span>
                      <span className="font-medium text-foreground text-sm">{exam.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{exam.duration}</span>
                      <span>•</span>
                      <span>{exam.marks > 0 ? `${exam.marks} marks` : "Variable"}</span>
                      <Badge variant="secondary" className="text-xs">
                        {mockTestFrequency === "monthly" ? durationMonths : mockTestFrequency === "biweekly" ? durationMonths * 2 : durationMonths * 4} tests
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Review & Activate */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-foreground mb-2">Review & Activate Platform</h2>
                <p className="text-muted-foreground">Review your configuration. Once activated, all student workflows, study plans, and mock tests will be auto-configured.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" /> Selected Exams
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedExamData.map(exam => (
                      <div key={exam.id} className="flex items-center gap-2 text-sm">
                        <span>{exam.icon}</span>
                        <span className="font-medium text-foreground">{exam.name}</span>
                        <span className="text-muted-foreground">— {exam.marks > 0 ? `${exam.marks} marks` : "Variable"}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" /> Curriculum & Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><span className="text-muted-foreground">Curriculum:</span> <span className="font-medium text-foreground">{CURRICULA.find(c => c.id === selectedCurriculum)?.name}</span></div>
                    <div><span className="text-muted-foreground">Class Level:</span> <span className="font-medium text-foreground">{CLASS_LEVELS.find(c => c.id === selectedClassLevel)?.name}</span></div>
                    <div><span className="text-muted-foreground">Duration:</span> <span className="font-medium text-foreground">{DURATIONS.find(d => d.id === selectedDuration)?.label}</span></div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Session Modes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {selectedModes.map(modeId => {
                      const mode = SESSION_MODES.find(m => m.id === modeId);
                      return mode ? (
                        <div key={modeId} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                          <span className="text-foreground">{mode.name}</span>
                        </div>
                      ) : null;
                    })}
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" /> Auto-Configuration Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Chapters</span><span className="font-bold text-foreground">{totalChapters}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Study Days</span><span className="font-bold text-foreground">{Math.round(durationMonths * 22)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Mock Tests</span><span className="font-bold text-foreground">{mockTestCount}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Holidays Excluded</span><span className="font-bold text-foreground">43</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Session Modes</span><span className="font-bold text-foreground">{selectedModes.length}</span></div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">What happens when you activate:</p>
                  <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                    <li>All {totalChapters} chapters are assigned to your institute's students</li>
                    <li>A {durationMonths}-month study plan is generated with Indian holidays excluded</li>
                    <li>{mockTestCount} mock tests are pre-scheduled with date-locked access</li>
                    <li>Student heatmap thresholds and score prediction are calibrated to selected exams</li>
                    <li>All notifications and reminders reference your selected exam names</li>
                    <li>AI avatar Priya adapts lesson narration to your selected curriculum</li>
                  </ul>
                </div>
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  onClick={handleActivate}
                  disabled={activating}
                  className="gap-3 px-10 py-6 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                >
                  {activating ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Configuring Platform...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      Activate Platform
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">You can reconfigure at any time from the Admin panel</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {!activated && (
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {step < 7 && (
                <Button
                  onClick={() => setStep(s => Math.min(7, s + 1))}
                  disabled={!canProceed()}
                  className="gap-2"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
