import { useState } from "react";
import { useParams, Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  Trophy, Lock, Clock, Target, CheckCircle, Loader2,
  Atom, FlaskConical, Calculator, ArrowRight, AlertCircle
} from "lucide-react";

const MOCK_TESTS = [
  {
    id: "jee_main_mock_1",
    title: "JEE Main Full Mock Test 1",
    exam: "JEE Main",
    duration: 180,
    questions: 90,
    sections: [
      { subject: "Physics", questions: 30, marks: 120 },
      { subject: "Chemistry", questions: 30, marks: 120 },
      { subject: "Mathematics", questions: 30, marks: 120 },
    ],
    totalMarks: 360,
    description: "Full pattern JEE Main mock test covering all topics from Class 11 and Class 12.",
  },
  {
    id: "jee_main_mock_2",
    title: "JEE Main Full Mock Test 2",
    exam: "JEE Main",
    duration: 180,
    questions: 90,
    sections: [
      { subject: "Physics", questions: 30, marks: 120 },
      { subject: "Chemistry", questions: 30, marks: 120 },
      { subject: "Mathematics", questions: 30, marks: 120 },
    ],
    totalMarks: 360,
    description: "Second full pattern JEE Main mock test with emphasis on high-weightage chapters.",
  },
  {
    id: "jee_advanced_mock_1",
    title: "JEE Advanced Full Mock Test 1",
    exam: "JEE Advanced",
    duration: 180,
    questions: 54,
    sections: [
      { subject: "Physics", questions: 18, marks: 62 },
      { subject: "Chemistry", questions: 18, marks: 62 },
      { subject: "Mathematics", questions: 18, marks: 62 },
    ],
    totalMarks: 186,
    description: "Paper 1 pattern JEE Advanced mock with MCQ, multi-correct, and integer type questions.",
  },
  {
    id: "jee_advanced_mock_2",
    title: "JEE Advanced Full Mock Test 2",
    exam: "JEE Advanced",
    duration: 180,
    questions: 54,
    sections: [
      { subject: "Physics", questions: 18, marks: 62 },
      { subject: "Chemistry", questions: 18, marks: 62 },
      { subject: "Mathematics", questions: 18, marks: 62 },
    ],
    totalMarks: 186,
    description: "Paper 2 pattern JEE Advanced mock with paragraph-based and matrix match questions.",
  },
];

export default function MockTestPage() {
  const { mockTestId } = useParams<{ mockTestId: string }>();
  const { isAuthenticated } = useAuth();
  const [selectedTest, setSelectedTest] = useState(mockTestId || "jee_main_mock_1");

  const { data: unlockStatus, isLoading } = trpc.assessments.checkMockTestUnlock.useQuery(
    { mockTestId: selectedTest },
    { enabled: !!selectedTest && isAuthenticated }
  );

  const selectedMock = MOCK_TESTS.find(t => t.id === selectedTest) || MOCK_TESTS[0];

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Sign In to Access Mock Tests</h2>
          <p className="text-muted-foreground mb-6">Full mock tests require completing all chapters in a subject first.</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="gap-2">
            Sign In to Continue
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6">
        {/* Header */}
        <div className="hero-gradient rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-900/30 border border-yellow-700/50 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Full Mock Tests</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Complete all chapters in a subject to unlock full pattern mock tests.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Test list */}
          <div className="lg:col-span-1">
            <h2 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide">Available Tests</h2>
            <div className="space-y-2">
              {MOCK_TESTS.map(test => (
                <button
                  key={test.id}
                  onClick={() => setSelectedTest(test.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedTest === test.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{test.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">{test.questions} questions · {test.duration} min</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${test.exam === "JEE Main" ? "border-blue-700/50 text-blue-400 bg-blue-900/20" : "border-purple-700/50 text-purple-400 bg-purple-900/20"}`}>
                      {test.exam}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Test detail */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{selectedMock.title}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{selectedMock.description}</p>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full border flex-shrink-0 ml-4 ${selectedMock.exam === "JEE Main" ? "border-blue-700/50 text-blue-400 bg-blue-900/20" : "border-purple-700/50 text-purple-400 bg-purple-900/20"}`}>
                  {selectedMock.exam}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Duration", value: `${selectedMock.duration} min`, icon: Clock },
                  { label: "Questions", value: selectedMock.questions, icon: Target },
                  { label: "Total Marks", value: selectedMock.totalMarks, icon: Trophy },
                ].map(stat => (
                  <div key={stat.label} className="bg-background border border-border rounded-xl p-3 text-center">
                    <stat.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                    <div className="text-lg font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Section breakdown */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-foreground mb-3">Section Breakdown</h3>
                <div className="space-y-2">
                  {selectedMock.sections.map((sec, i) => {
                    const icons = [Atom, FlaskConical, Calculator];
                    const colors = ["text-physics", "text-chemistry", "text-mathematics"];
                    const Icon = icons[i];
                    return (
                      <div key={sec.subject} className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl">
                        <Icon className={`w-4 h-4 ${colors[i]}`} />
                        <span className="text-sm font-medium text-foreground flex-1">{sec.subject}</span>
                        <span className="text-xs text-muted-foreground">{sec.questions} questions</span>
                        <span className="text-xs font-semibold text-foreground">{sec.marks} marks</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unlock status */}
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking unlock status...
                </div>
              ) : unlockStatus?.unlocked ? (
                <div>
                  <div className="flex items-center gap-2 bg-green-900/20 border border-green-700/30 rounded-xl p-3 mb-4 text-sm text-green-300">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    All required chapters completed! This mock test is unlocked.
                  </div>
                  <Button className="w-full gap-2" size="lg">
                    <Target className="w-5 h-5" />
                    Start Mock Test
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex items-start gap-2 bg-yellow-900/10 border border-yellow-700/20 rounded-xl p-4 mb-4">
                    <Lock className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <div className="font-semibold text-yellow-300 mb-1">Mock Test Locked</div>
                      {"Complete all chapters in the required subjects to unlock this mock test."}
                      {unlockStatus?.required && unlockStatus.completedCount !== undefined && (
                        <div className="mt-2">
                          <div className="text-xs mb-1">Progress: {unlockStatus.completedCount}/{unlockStatus.required} chapters</div>
                          <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${(unlockStatus.completedCount / unlockStatus.required) * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full gap-2">
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
