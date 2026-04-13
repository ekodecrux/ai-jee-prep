/**
 * Public Exam Detail Page — /exams/:examId
 * Shows syllabus, chapter breakdown, past paper stats, and a "Start Preparing" CTA.
 * Accessible without login (public route).
 */
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Clock, Target, Users, TrendingUp, CheckCircle,
  ChevronRight, ArrowLeft, Zap, Star, BarChart2, Calendar,
  FlaskConical, Calculator, Atom, Globe, Brain, FileText
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Exam data ────────────────────────────────────────────────────────────────

const EXAM_DATA: Record<string, {
  id: string;
  name: string;
  fullName: string;
  tagline: string;
  color: string;
  bgGradient: string;
  icon: React.ReactNode;
  conductedBy: string;
  frequency: string;
  totalSeats: string;
  avgApplicants: string;
  duration: string;
  totalMarks: number;
  subjects: Array<{
    name: string;
    icon: React.ReactNode;
    color: string;
    chapters: number;
    weightage: string;
    topics: string[];
  }>;
  examPattern: Array<{ section: string; questions: number; marks: number; negative: string }>;
  keyDates: Array<{ event: string; month: string }>;
  topicWeightage: Array<{ topic: string; percent: number; subject: string }>;
  tips: string[];
  cutoffs: Array<{ category: string; cutoff: string }>;
}> = {
  jee_main: {
    id: "jee_main",
    name: "JEE Main",
    fullName: "Joint Entrance Examination (Main)",
    tagline: "Gateway to NITs, IIITs & CFTIs",
    color: "text-blue-600",
    bgGradient: "from-blue-600 to-indigo-700",
    icon: <Atom className="w-8 h-8" />,
    conductedBy: "National Testing Agency (NTA)",
    frequency: "Twice a year (Jan & Apr)",
    totalSeats: "~31,000 (NITs + IIITs + CFTIs)",
    avgApplicants: "~12 lakh",
    duration: "3 hours",
    totalMarks: 300,
    subjects: [
      {
        name: "Physics",
        icon: <Atom className="w-4 h-4" />,
        color: "text-blue-500",
        chapters: 29,
        weightage: "33%",
        topics: ["Mechanics", "Thermodynamics", "Electrostatics", "Optics", "Modern Physics", "Waves"],
      },
      {
        name: "Chemistry",
        icon: <FlaskConical className="w-4 h-4" />,
        color: "text-green-500",
        chapters: 30,
        weightage: "33%",
        topics: ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry", "Coordination Compounds"],
      },
      {
        name: "Mathematics",
        icon: <Calculator className="w-4 h-4" />,
        color: "text-purple-500",
        chapters: 21,
        weightage: "33%",
        topics: ["Calculus", "Algebra", "Coordinate Geometry", "Vectors & 3D", "Probability", "Trigonometry"],
      },
    ],
    examPattern: [
      { section: "Physics — MCQ", questions: 20, marks: 80, negative: "-1" },
      { section: "Physics — Integer", questions: 5, marks: 20, negative: "0" },
      { section: "Chemistry — MCQ", questions: 20, marks: 80, negative: "-1" },
      { section: "Chemistry — Integer", questions: 5, marks: 20, negative: "0" },
      { section: "Mathematics — MCQ", questions: 20, marks: 80, negative: "-1" },
      { section: "Mathematics — Integer", questions: 5, marks: 20, negative: "0" },
    ],
    keyDates: [
      { event: "Application Form", month: "Nov–Dec" },
      { event: "Admit Card", month: "Jan" },
      { event: "Session 1 Exam", month: "Jan–Feb" },
      { event: "Session 2 Exam", month: "Apr" },
      { event: "Result", month: "Feb & May" },
    ],
    topicWeightage: [
      { topic: "Mechanics", percent: 22, subject: "Physics" },
      { topic: "Organic Chemistry", percent: 18, subject: "Chemistry" },
      { topic: "Calculus", percent: 20, subject: "Mathematics" },
      { topic: "Electrostatics", percent: 12, subject: "Physics" },
      { topic: "Coordinate Geometry", percent: 14, subject: "Mathematics" },
      { topic: "Physical Chemistry", percent: 15, subject: "Chemistry" },
    ],
    tips: [
      "Focus on NCERT for Chemistry — 40% questions are directly from NCERT",
      "Practice 30+ questions daily per subject for speed",
      "Attempt 10 full mock tests in the last 2 months",
      "Revise formula sheets every Sunday",
      "Target 85+ percentile in all three subjects equally",
    ],
    cutoffs: [
      { category: "General", cutoff: "89–93 percentile" },
      { category: "OBC-NCL", cutoff: "74–79 percentile" },
      { category: "SC", cutoff: "54–60 percentile" },
      { category: "ST", cutoff: "44–50 percentile" },
    ],
  },
  jee_advanced: {
    id: "jee_advanced",
    name: "JEE Advanced",
    fullName: "Joint Entrance Examination (Advanced)",
    tagline: "The Gateway to IITs",
    color: "text-orange-600",
    bgGradient: "from-orange-600 to-red-700",
    icon: <Star className="w-8 h-8" />,
    conductedBy: "IITs (rotational basis)",
    frequency: "Once a year (May–June)",
    totalSeats: "~17,000 (IITs)",
    avgApplicants: "~2.5 lakh (top JEE Main qualifiers)",
    duration: "3 hours × 2 papers",
    totalMarks: 360,
    subjects: [
      { name: "Physics", icon: <Atom className="w-4 h-4" />, color: "text-orange-500", chapters: 29, weightage: "33%", topics: ["Mechanics", "Electrodynamics", "Optics", "Modern Physics", "Thermodynamics"] },
      { name: "Chemistry", icon: <FlaskConical className="w-4 h-4" />, color: "text-green-500", chapters: 30, weightage: "33%", topics: ["Physical Chemistry", "Organic Reactions", "Inorganic Chemistry"] },
      { name: "Mathematics", icon: <Calculator className="w-4 h-4" />, color: "text-purple-500", chapters: 21, weightage: "33%", topics: ["Calculus", "Complex Numbers", "Probability", "Matrices", "Vectors"] },
    ],
    examPattern: [
      { section: "Paper 1 — MCQ (single)", questions: 10, marks: 30, negative: "-1" },
      { section: "Paper 1 — MCQ (multi)", questions: 6, marks: 24, negative: "-2" },
      { section: "Paper 1 — Integer", questions: 6, marks: 24, negative: "0" },
      { section: "Paper 2 — MCQ (single)", questions: 10, marks: 30, negative: "-1" },
      { section: "Paper 2 — MCQ (multi)", questions: 6, marks: 24, negative: "-2" },
      { section: "Paper 2 — Integer", questions: 6, marks: 24, negative: "0" },
    ],
    keyDates: [
      { event: "JEE Main Result (eligibility)", month: "May" },
      { event: "Registration", month: "May" },
      { event: "Admit Card", month: "May" },
      { event: "Exam Day", month: "May–Jun" },
      { event: "Result", month: "Jun" },
    ],
    topicWeightage: [
      { topic: "Mechanics", percent: 25, subject: "Physics" },
      { topic: "Calculus", percent: 22, subject: "Mathematics" },
      { topic: "Organic Chemistry", percent: 20, subject: "Chemistry" },
      { topic: "Electrodynamics", percent: 15, subject: "Physics" },
      { topic: "Algebra", percent: 18, subject: "Mathematics" },
      { topic: "Physical Chemistry", percent: 15, subject: "Chemistry" },
    ],
    tips: [
      "Solve previous 10 years' JEE Advanced papers — pattern repeats",
      "Master multi-correct MCQs — negative marking is harsh",
      "Deep conceptual clarity matters more than speed here",
      "Practice integer-type questions daily — no negative marking",
      "Target 35%+ in each subject for a safe rank",
    ],
    cutoffs: [
      { category: "General", cutoff: "~90 marks (25%)" },
      { category: "OBC-NCL", cutoff: "~81 marks" },
      { category: "SC", cutoff: "~45 marks" },
      { category: "ST", cutoff: "~45 marks" },
    ],
  },
  neet: {
    id: "neet",
    name: "NEET",
    fullName: "National Eligibility cum Entrance Test",
    tagline: "Gateway to MBBS, BDS & AYUSH",
    color: "text-emerald-600",
    bgGradient: "from-emerald-600 to-teal-700",
    icon: <FlaskConical className="w-8 h-8" />,
    conductedBy: "National Testing Agency (NTA)",
    frequency: "Once a year (May)",
    totalSeats: "~1.08 lakh (MBBS) + BDS + AYUSH",
    avgApplicants: "~24 lakh",
    duration: "3 hours 20 minutes",
    totalMarks: 720,
    subjects: [
      { name: "Physics", icon: <Atom className="w-4 h-4" />, color: "text-blue-500", chapters: 29, weightage: "25%", topics: ["Mechanics", "Thermodynamics", "Optics", "Modern Physics", "Electrostatics"] },
      { name: "Chemistry", icon: <FlaskConical className="w-4 h-4" />, color: "text-green-500", chapters: 30, weightage: "25%", topics: ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"] },
      { name: "Biology (Botany)", icon: <Globe className="w-4 h-4" />, color: "text-emerald-500", chapters: 22, weightage: "25%", topics: ["Cell Biology", "Plant Physiology", "Genetics", "Ecology"] },
      { name: "Biology (Zoology)", icon: <Brain className="w-4 h-4" />, color: "text-teal-500", chapters: 20, weightage: "25%", topics: ["Human Physiology", "Animal Kingdom", "Reproduction", "Evolution"] },
    ],
    examPattern: [
      { section: "Physics", questions: 45, marks: 180, negative: "-1" },
      { section: "Chemistry", questions: 45, marks: 180, negative: "-1" },
      { section: "Botany", questions: 45, marks: 180, negative: "-1" },
      { section: "Zoology", questions: 45, marks: 180, negative: "-1" },
    ],
    keyDates: [
      { event: "Application Form", month: "Feb–Mar" },
      { event: "Admit Card", month: "Apr–May" },
      { event: "Exam Day", month: "May" },
      { event: "Result", month: "Jun" },
      { event: "Counselling", month: "Jul–Aug" },
    ],
    topicWeightage: [
      { topic: "Human Physiology", percent: 20, subject: "Biology" },
      { topic: "Genetics & Evolution", percent: 18, subject: "Biology" },
      { topic: "Organic Chemistry", percent: 15, subject: "Chemistry" },
      { topic: "Mechanics", percent: 14, subject: "Physics" },
      { topic: "Cell Biology", percent: 12, subject: "Biology" },
      { topic: "Physical Chemistry", percent: 12, subject: "Chemistry" },
    ],
    tips: [
      "Biology is 50% of NEET — master NCERT Biology line by line",
      "Solve 50+ MCQs daily from Biology",
      "Focus on diagrams — many questions are diagram-based",
      "Chemistry NCERT is sufficient for 80% of Chemistry questions",
      "Target 600+ for a safe MBBS seat in government college",
    ],
    cutoffs: [
      { category: "General", cutoff: "720–137 marks" },
      { category: "OBC/SC/ST", cutoff: "136–107 marks" },
      { category: "PwD General", cutoff: "136–121 marks" },
    ],
  },
  gate: {
    id: "gate",
    name: "GATE",
    fullName: "Graduate Aptitude Test in Engineering",
    tagline: "Gateway to PSUs & M.Tech/MS admissions",
    color: "text-violet-600",
    bgGradient: "from-violet-600 to-purple-700",
    icon: <Brain className="w-8 h-8" />,
    conductedBy: "IITs & IISc (rotational)",
    frequency: "Once a year (Feb)",
    totalSeats: "PSU jobs + M.Tech seats",
    avgApplicants: "~9 lakh",
    duration: "3 hours",
    totalMarks: 100,
    subjects: [
      { name: "Core Engineering", icon: <Brain className="w-4 h-4" />, color: "text-violet-500", chapters: 25, weightage: "72%", topics: ["Subject-specific core topics"] },
      { name: "Engineering Mathematics", icon: <Calculator className="w-4 h-4" />, color: "text-purple-500", chapters: 10, weightage: "13%", topics: ["Linear Algebra", "Calculus", "Probability", "Differential Equations"] },
      { name: "General Aptitude", icon: <FileText className="w-4 h-4" />, color: "text-pink-500", chapters: 5, weightage: "15%", topics: ["Verbal Ability", "Numerical Ability", "Reasoning"] },
    ],
    examPattern: [
      { section: "MCQ (1 mark)", questions: 25, marks: 25, negative: "-0.33" },
      { section: "MCQ (2 marks)", questions: 30, marks: 60, negative: "-0.67" },
      { section: "Numerical (NAT)", questions: 15, marks: 15, negative: "0" },
    ],
    keyDates: [
      { event: "Application Form", month: "Sep–Oct" },
      { event: "Admit Card", month: "Jan" },
      { event: "Exam", month: "Feb" },
      { event: "Result", month: "Mar" },
      { event: "Scorecard", month: "Mar–Apr" },
    ],
    topicWeightage: [
      { topic: "Core Subject Topics", percent: 72, subject: "Engineering" },
      { topic: "Engineering Mathematics", percent: 13, subject: "Mathematics" },
      { topic: "General Aptitude", percent: 15, subject: "Aptitude" },
    ],
    tips: [
      "GATE score is valid for 3 years — plan PSU applications accordingly",
      "Focus on NAT questions — no negative marking",
      "Engineering Mathematics is common across all branches — master it",
      "Solve 10 years of previous GATE papers",
      "Target 60+ marks for top PSU eligibility",
    ],
    cutoffs: [
      { category: "General", cutoff: "~28–35 marks" },
      { category: "OBC-NCL", cutoff: "~25–31 marks" },
      { category: "SC/ST/PwD", cutoff: "~18–23 marks" },
    ],
  },
  upsc: {
    id: "upsc",
    name: "UPSC CSE",
    fullName: "Union Public Service Commission — Civil Services Exam",
    tagline: "The path to IAS, IPS, IFS & more",
    color: "text-amber-600",
    bgGradient: "from-amber-600 to-orange-700",
    icon: <Globe className="w-8 h-8" />,
    conductedBy: "Union Public Service Commission",
    frequency: "Once a year",
    totalSeats: "~1,000 (IAS + IPS + IFS + others)",
    avgApplicants: "~10 lakh",
    duration: "Prelims: 4h | Mains: 25h+ | Interview: 45 min",
    totalMarks: 2025,
    subjects: [
      { name: "General Studies", icon: <Globe className="w-4 h-4" />, color: "text-amber-500", chapters: 30, weightage: "60%", topics: ["History", "Geography", "Polity", "Economy", "Environment", "Science & Tech", "Current Affairs"] },
      { name: "CSAT", icon: <Brain className="w-4 h-4" />, color: "text-orange-500", chapters: 8, weightage: "Qualifying", topics: ["Reading Comprehension", "Logical Reasoning", "Basic Numeracy"] },
      { name: "Optional Subject", icon: <BookOpen className="w-4 h-4" />, color: "text-red-500", chapters: 20, weightage: "40%", topics: ["Chosen from 48 optional subjects"] },
    ],
    examPattern: [
      { section: "Prelims GS Paper I", questions: 100, marks: 200, negative: "-0.67" },
      { section: "Prelims CSAT Paper II", questions: 80, marks: 200, negative: "-0.83" },
      { section: "Mains GS Papers (I–IV)", questions: 20, marks: 1000, negative: "0" },
      { section: "Mains Optional (I & II)", questions: 8, marks: 500, negative: "0" },
      { section: "Essay Paper", questions: 2, marks: 250, negative: "0" },
    ],
    keyDates: [
      { event: "Notification", month: "Feb" },
      { event: "Prelims Exam", month: "Jun" },
      { event: "Mains Exam", month: "Sep" },
      { event: "Interview", month: "Jan–May (next year)" },
      { event: "Final Result", month: "May–Jun" },
    ],
    topicWeightage: [
      { topic: "Current Affairs", percent: 25, subject: "GS" },
      { topic: "Indian Polity", percent: 15, subject: "GS" },
      { topic: "History", percent: 15, subject: "GS" },
      { topic: "Geography", percent: 12, subject: "GS" },
      { topic: "Economy", percent: 13, subject: "GS" },
      { topic: "Environment", percent: 10, subject: "GS" },
    ],
    tips: [
      "Read The Hindu / Indian Express daily for current affairs",
      "NCERT books (6–12) are the foundation — read them thoroughly",
      "Choose optional subject based on interest and scoring potential",
      "Answer writing practice is critical for Mains success",
      "Attempt at least 5 full Prelims mock tests before the exam",
    ],
    cutoffs: [
      { category: "General", cutoff: "~98–105 marks (Prelims)" },
      { category: "OBC", cutoff: "~96–102 marks" },
      { category: "SC", cutoff: "~82–90 marks" },
      { category: "ST", cutoff: "~77–85 marks" },
    ],
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExamDetailPage() {
  const params = useParams<{ examId: string }>();
  const examId = params.examId ?? "";
  const { user } = useAuth();

  const exam = EXAM_DATA[examId];

  if (!exam) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Exam Not Found</h1>
        <p className="text-muted-foreground mb-6">The exam "{examId}" doesn't exist in our database.</p>
        <Link href="/">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${exam.bgGradient} text-white`}>
        <div className="container py-12">
          <Link href="/">
            <button className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
          </Link>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white flex-shrink-0">
              {exam.icon}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-bold">{exam.name}</h1>
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {exam.frequency}
                </Badge>
              </div>
              <p className="text-white/80 text-lg mb-1">{exam.fullName}</p>
              <p className="text-white/60 text-sm mb-6">{exam.tagline}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Conducted By", value: exam.conductedBy, icon: <FileText className="w-4 h-4" /> },
                  { label: "Total Marks", value: exam.totalMarks.toString(), icon: <Target className="w-4 h-4" /> },
                  { label: "Avg Applicants", value: exam.avgApplicants, icon: <Users className="w-4 h-4" /> },
                  { label: "Duration", value: exam.duration, icon: <Clock className="w-4 h-4" /> },
                ].map(stat => (
                  <div key={stat.label} className="bg-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-white/60 text-xs mb-1">
                      {stat.icon}
                      {stat.label}
                    </div>
                    <p className="font-semibold text-white text-sm">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0">
              {user ? (
                <Link href="/study-plan">
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-white/90 gap-2 font-semibold">
                    <Zap className="w-5 h-5" />
                    Start Preparing
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-white/90 gap-2 font-semibold">
                    <Zap className="w-5 h-5" />
                    Start Preparing Free
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subjects */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Subjects & Syllabus
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {exam.subjects.map(subject => (
                  <Card key={subject.name}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className={subject.color}>{subject.icon}</span>
                        {subject.name}
                        <Badge variant="secondary" className="ml-auto text-xs">{subject.weightage}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-3">{subject.chapters} chapters</p>
                      <div className="flex flex-wrap gap-1.5">
                        {subject.topics.map(topic => (
                          <span key={topic} className="text-xs bg-muted rounded-md px-2 py-1 text-foreground">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Exam Pattern */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" />
                Exam Pattern
              </h2>
              <Card>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Section</th>
                          <th className="text-center py-2 px-3 text-muted-foreground font-medium">Questions</th>
                          <th className="text-center py-2 px-3 text-muted-foreground font-medium">Marks</th>
                          <th className="text-center py-2 pl-3 text-muted-foreground font-medium">Negative</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exam.examPattern.map((row, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="py-2.5 pr-4 text-foreground">{row.section}</td>
                            <td className="py-2.5 px-3 text-center text-foreground">{row.questions}</td>
                            <td className="py-2.5 px-3 text-center font-medium text-foreground">{row.marks}</td>
                            <td className={`py-2.5 pl-3 text-center font-medium ${row.negative === "0" ? "text-green-600" : "text-red-500"}`}>
                              {row.negative}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-muted/50">
                          <td className="py-2.5 pr-4 font-bold text-foreground">Total</td>
                          <td className="py-2.5 px-3 text-center font-bold text-foreground">
                            {exam.examPattern.reduce((s, r) => s + r.questions, 0)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-foreground">{exam.totalMarks}</td>
                          <td className="py-2.5 pl-3 text-center text-muted-foreground">—</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Topic Weightage */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                High-Weightage Topics
              </h2>
              <div className="space-y-3">
                {exam.topicWeightage.map(item => (
                  <div key={item.topic} className="flex items-center gap-3">
                    <div className="w-32 text-sm text-foreground flex-shrink-0">{item.topic}</div>
                    <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-10 text-right">{item.percent}%</span>
                    <Badge variant="outline" className="text-xs w-24 justify-center">{item.subject}</Badge>
                  </div>
                ))}
              </div>
            </section>

            {/* Expert Tips */}
            <section>
              <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                Expert Preparation Tips
              </h2>
              <div className="space-y-3">
                {exam.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-muted/40 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* CTA */}
            <Card className="border-primary/30 bg-gradient-to-b from-primary/5 to-transparent">
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">Start Preparing Today</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get AI-powered study plans, chapter-wise assessments, and live performance tracking.
                </p>
                {user ? (
                  <Link href="/study-plan">
                    <Button className="w-full gap-2">
                      <Zap className="w-4 h-4" />
                      Open Study Plan
                    </Button>
                  </Link>
                ) : (
                  <a href={getLoginUrl()} className="block">
                    <Button className="w-full gap-2">
                      <Zap className="w-4 h-4" />
                      Start Free
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>

            {/* Key Dates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Key Dates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exam.keyDates.map((date, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{date.event}</span>
                      <Badge variant="secondary" className="text-xs">{date.month}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cutoffs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  Typical Cutoffs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {exam.cutoffs.map((cut, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{cut.category}</span>
                      <span className="font-medium text-foreground text-xs">{cut.cutoff}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">* Based on recent years' trends. Actual cutoffs vary.</p>
              </CardContent>
            </Card>

            {/* Total seats */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground text-sm">Available Seats</span>
                </div>
                <p className="text-2xl font-bold text-primary">{exam.totalSeats}</p>
                <p className="text-xs text-muted-foreground mt-1">Across all participating institutions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
