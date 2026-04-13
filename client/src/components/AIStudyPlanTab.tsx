/**
 * AI Adaptive Study Plan Tab
 * Shown inside StudyPlanPage — generates a personalised weekly schedule via LLM.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Sparkles, RefreshCw, Calendar, Target, Zap, Clock,
  ChevronDown, ChevronRight, BookOpen, FlaskConical, Calculator, Star
} from "lucide-react";

const PRIORITY_COLORS = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

const SUBJECT_ICONS: Record<string, React.ReactNode> = {
  Physics: <Zap className="w-3.5 h-3.5" />,
  Chemistry: <FlaskConical className="w-3.5 h-3.5" />,
  Mathematics: <Calculator className="w-3.5 h-3.5" />,
  "All Subjects": <Star className="w-3.5 h-3.5" />,
};

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function AIStudyPlanTab() {
  const [expandedDay, setExpandedDay] = useState<string | null>("Monday");
  const [targetDate, setTargetDate] = useState("");
  const [examId, setExamId] = useState("jee_main");

  const { data: currentPlan, isLoading: planLoading, refetch } = trpc.studyPlan.getCurrentPlan.useQuery();

  const generateMutation = trpc.studyPlan.generatePlan.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("AI Study Plan Generated!", { description: "Your personalised weekly schedule is ready." });
    },
    onError: (err) => {
      toast.error("Generation failed", { description: err.message });
    },
  });

  const handleGenerate = (forceRegenerate = false) => {
    generateMutation.mutate({
      examId,
      targetExamDate: targetDate || undefined,
      forceRegenerate,
    });
  };

  const plan = currentPlan?.generatedPlan as {
    weekLabel?: string;
    daysUntilExam?: number;
    dailySchedule?: Array<{
      day: string;
      subjects: Array<{
        subject: string;
        chapter: string;
        chapterId: string;
        activity: string;
        durationMinutes: number;
        priority: "high" | "medium" | "low";
      }>;
      totalMinutes: number;
    }>;
    weeklyGoals?: string[];
    focusAreas?: string[];
    motivationalNote?: string;
  } | null;

  const isGenerating = generateMutation.isPending;

  if (planLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Loading your study plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-violet-500/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">AI-Powered Weekly Schedule</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                The AI analyses your weak chapters and performance data to create a personalised study schedule.
                Regenerate any time to get a fresh plan.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Target Exam</Label>
                  <select
                    value={examId}
                    onChange={e => setExamId(e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                  >
                    <option value="jee_main">JEE Main</option>
                    <option value="jee_advanced">JEE Advanced</option>
                    <option value="neet">NEET</option>
                    <option value="gate">GATE</option>
                    <option value="upsc">UPSC</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Exam Date (optional)</Label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={e => setTargetDate(e.target.value)}
                    className="h-8 text-sm w-40"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {!currentPlan ? (
                <Button
                  onClick={() => handleGenerate(false)}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isGenerating ? "Generating..." : "Generate My Plan"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isGenerating ? "Regenerating..." : "Regenerate"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No plan yet */}
      {!plan && !isGenerating && (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <Sparkles className="w-12 h-12 text-primary/40 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No AI Plan Yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Click "Generate My Plan" above to get a personalised weekly study schedule based on your
            performance data and weak chapters.
          </p>
          <Button onClick={() => handleGenerate(false)} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Generate My Plan
          </Button>
        </div>
      )}

      {/* Generating skeleton */}
      {isGenerating && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
          <p className="text-center text-sm text-muted-foreground pt-2">
            <Sparkles className="w-4 h-4 inline mr-1 text-primary" />
            AI is analysing your performance and building your schedule...
          </p>
        </div>
      )}

      {/* Plan content */}
      {plan && !isGenerating && (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="text-center p-4">
              <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Week</p>
              <p className="font-semibold text-sm text-foreground truncate">{plan.weekLabel ?? "This Week"}</p>
            </Card>
            <Card className="text-center p-4">
              <Target className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Days to Exam</p>
              <p className="font-semibold text-sm text-foreground">{plan.daysUntilExam ?? "—"}</p>
            </Card>
            <Card className="text-center p-4">
              <BookOpen className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Focus Areas</p>
              <p className="font-semibold text-sm text-foreground">{plan.focusAreas?.length ?? 0} topics</p>
            </Card>
            <Card className="text-center p-4">
              <Clock className="w-5 h-5 text-violet-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Weekly Goals</p>
              <p className="font-semibold text-sm text-foreground">{plan.weeklyGoals?.length ?? 0} goals</p>
            </Card>
          </div>

          {/* Motivational note */}
          {plan.motivationalNote && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-foreground italic">"{plan.motivationalNote}"</p>
            </div>
          )}

          {/* Weekly Goals */}
          {plan.weeklyGoals && plan.weeklyGoals.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  Weekly Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.weeklyGoals.map((goal, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                        {i + 1}
                      </span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Daily Schedule */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm mb-3">Daily Schedule</h3>
            {(plan.dailySchedule ?? [])
              .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day))
              .map((dayPlan) => {
                const isExpanded = expandedDay === dayPlan.day;
                const totalHours = (dayPlan.totalMinutes / 60).toFixed(1);
                const isWeekend = ["Saturday", "Sunday"].includes(dayPlan.day);

                return (
                  <Card
                    key={dayPlan.day}
                    className={`overflow-hidden transition-all ${isWeekend ? "border-muted" : "border-border"}`}
                  >
                    <button
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                      onClick={() => setExpandedDay(isExpanded ? null : dayPlan.day)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${isWeekend ? "bg-muted-foreground" : "bg-primary"}`} />
                        <span className="font-medium text-foreground">{dayPlan.day}</span>
                        {isWeekend && (
                          <Badge variant="secondary" className="text-xs">Rest Day</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {totalHours}h
                        </span>
                        <span className="text-xs text-muted-foreground">{dayPlan.subjects.length} sessions</span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border">
                        {dayPlan.subjects.map((session, si) => (
                          <div
                            key={si}
                            className="flex items-start gap-3 p-4 border-b border-border/50 last:border-0 hover:bg-muted/20"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {SUBJECT_ICONS[session.subject] ?? <BookOpen className="w-3.5 h-3.5 text-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="font-medium text-sm text-foreground">{session.subject}</span>
                                <span className="text-xs text-muted-foreground">·</span>
                                <span className="text-xs text-muted-foreground truncate">{session.chapter}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{session.activity}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground">{session.durationMinutes}m</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[session.priority]}`}>
                                {session.priority}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
