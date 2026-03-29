import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  Clock, Target, CheckCircle, XCircle, AlertCircle, ArrowRight,
  ArrowLeft, Loader2, Trophy, BarChart3, GraduationCap, Lock
} from "lucide-react";

type Phase = "intro" | "quiz" | "result";

export default function AssessmentPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: assessments, isLoading: assLoading } = trpc.content.getAssessments.useQuery({ chapterId });
  const { data: chapter } = trpc.chapters.getById.useQuery({ chapterId });

  // Use chapter test (index 1) or practice (index 0)
  const assessment = assessments?.[1] || assessments?.[0];
  const assessmentId = assessment?.assessmentId || "";

  const { data: assessmentDetail, isLoading: detailLoading } = trpc.assessments.getById.useQuery(
    { assessmentId },
    { enabled: !!assessmentId }
  );

  const { data: dailyLimit } = trpc.assessments.checkDailyLimit.useQuery(
    { assessmentId },
    { enabled: !!assessmentId && isAuthenticated }
  );

  const submitAttempt = trpc.assessments.submitAttempt.useMutation();
  const [result, setResult] = useState<any>(null);

  const questions = (assessmentDetail?.questions || []) as any[];
  const timeLimitSec = (assessment?.durationMinutes || 30) * 60;

  // Timer
  useEffect(() => {
    if (phase === "quiz" && assessment?.assessmentType === "chapter_test" && assessment?.durationMinutes) {
      setTimeLeft(timeLimitSec);
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleStart = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setStartTime(Date.now());
    setPhase("quiz");
    setCurrentQ(0);
    setAnswers({});
  };

  const handleAnswer = (qId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await submitAttempt.mutateAsync({
        assessmentId,
        answers,
        timeTakenSeconds: timeTaken
      });
      setResult(res);
      setPhase("result");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit assessment");
    }
  };

  if (assLoading || detailLoading) {
    return (
      <Layout>
        <div className="container py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-6 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href={`/chapter/${chapterId}`} className="hover:text-foreground transition-colors">
            ← Back to {chapter?.title || "Chapter"}
          </Link>
        </div>

        {/* INTRO PHASE */}
        {phase === "intro" && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">
              {assessment?.title || `${chapter?.title} Assessment`}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">{assessment?.description}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Questions", value: questions.length },
                { label: "Time Limit", value: assessment?.durationMinutes ? `${assessment.durationMinutes} min` : "No limit" },
                { label: "Passing Score", value: `${assessment?.passingScore || 60}%` },
                { label: "Attempts Today", value: dailyLimit ? `${dailyLimit.attemptsUsed}/${dailyLimit.maxAttempts}` : "—" },
              ].map(stat => (
                <div key={stat.label} className="bg-background border border-border rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {dailyLimit?.canAttempt === false ? (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-700/30 rounded-xl p-4 mb-4 text-sm text-red-300">
                <Lock className="w-4 h-4 flex-shrink-0" />
                Daily attempt limit reached. Come back tomorrow!
              </div>
            ) : null}

            {assessment?.instructions && (
              <div className="bg-background border border-border rounded-xl p-4 text-left text-sm text-muted-foreground mb-6">
                {assessment.instructions}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Link href={`/chapter/${chapterId}`}>
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handleStart} disabled={dailyLimit?.canAttempt === false} className="gap-2">
                <Target className="w-4 h-4" />
                Start Assessment
              </Button>
            </div>
          </div>
        )}

        {/* QUIZ PHASE */}
        {phase === "quiz" && questions.length > 0 && (
          <div>
            {/* Header bar */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Question <strong className="text-foreground">{currentQ + 1}</strong> of {questions.length}
              </div>
              {assessment?.durationMinutes && assessment.durationMinutes > 0 && (
                <div className={`flex items-center gap-2 text-sm font-mono font-bold ${timeLeft < 300 ? "text-red-400" : "text-foreground"}`} aria-label="time-remaining">
                  <Clock className="w-4 h-4" />
                  {formatTime(timeLeft)}
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                {Object.keys(answers).length} answered
              </div>
            </div>

            {/* Progress bar */}
            <div className="progress-bar mb-4">
              <div className="progress-bar-fill" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
            </div>

            {/* Question */}
            {(() => {
              const q = questions[currentQ];
              const qId = q.id.toString();
              const currentAnswer = answers[qId] || "";

              return (
                <div className="bg-card border border-border rounded-xl p-6">
                  {/* Question meta */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`badge-${q.difficulty || "medium"}`}>{q.difficulty}</span>
                    <span className="badge-foundation">{q.questionType?.toUpperCase()}</span>
                    <span className="text-xs text-muted-foreground ml-auto">+{q.marks || 4} / -{q.negativeMarks || 1}</span>
                  </div>

                  {/* Question text */}
                  <p className="text-foreground leading-relaxed mb-6">{q.questionText}</p>

                  {/* MCQ options */}
                  {(q.questionType === "mcq" || q.questionType === "multi_correct") && q.options && (
                    <div className="space-y-2">
                      {Object.entries(q.options as Record<string, string>).map(([key, val]) => (
                        <button
                          key={key}
                          onClick={() => handleAnswer(qId, key)}
                          className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${currentAnswer === key ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}
                        >
                          <strong className="mr-2">{key}.</strong>{val}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* NAT / Integer input */}
                  {(q.questionType === "nat" || q.questionType === "integer") && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {q.questionType === "integer" ? "Enter a non-negative integer:" : "Enter your numerical answer:"}
                      </div>
                      <Input
                        type="number"
                        value={currentAnswer}
                        onChange={e => handleAnswer(qId, e.target.value)}
                        placeholder={q.questionType === "integer" ? "0, 1, 2, ..." : "e.g. 3.14"}
                        className="max-w-xs bg-background"
                      />
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Previous
              </Button>

              <div className="flex gap-1">
                {questions.map((_, i) => (
                  <button key={i} onClick={() => setCurrentQ(i)}
                    className={`w-7 h-7 rounded text-xs font-medium transition-all ${i === currentQ ? "bg-primary text-primary-foreground" : answers[questions[i].id.toString()] ? "bg-green-900/40 text-green-400 border border-green-700/50" : "bg-card border border-border text-muted-foreground hover:border-primary/50"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>

              {currentQ < questions.length - 1 ? (
                <Button onClick={() => setCurrentQ(q => q + 1)} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitAttempt.isPending} className="gap-2 bg-green-700 hover:bg-green-600">
                  {submitAttempt.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Submit
                </Button>
              )}
            </div>
          </div>
        )}

        {/* RESULT PHASE */}
        {phase === "result" && result && (
          <div className="bg-card border border-border rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? "bg-green-900/30 border-2 border-green-600" : "bg-red-900/30 border-2 border-red-600"}`}>
                {result.passed ? <Trophy className="w-10 h-10 text-green-400" /> : <AlertCircle className="w-10 h-10 text-red-400" />}
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                {result.passed ? "Chapter Passed! 🎉" : "Keep Practicing"}
              </h2>
              <p className="text-muted-foreground text-sm">
                {result.passed ? "Next chapter unlocked! Great work." : `Score ${result.passingScore}% to pass and unlock the next chapter.`}
              </p>
            </div>

            {/* Score */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Score", value: `${Math.round(result.percentage)}%`, color: result.passed ? "text-green-400" : "text-red-400" },
                { label: "Marks", value: `${result.score}/${result.maxScore}`, color: "text-foreground" },
                { label: "Correct", value: result.correctCount || "—", color: "text-green-400" },
                { label: "Wrong", value: result.wrongCount || "—", color: "text-red-400" },
              ].map(stat => (
                <div key={stat.label} className="bg-background border border-border rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Weak topics */}
            {result.weakTopics && result.weakTopics.length > 0 && (
              <div className="bg-yellow-900/10 border border-yellow-700/30 rounded-xl p-4 mb-6">
                <div className="text-sm font-semibold text-yellow-300 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Topics to Review
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.weakTopics.map((t: string) => (
                    <span key={t} className="text-xs bg-yellow-900/20 border border-yellow-700/30 rounded-full px-2.5 py-1 text-yellow-400">{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Link href={`/chapter/${chapterId}`}>
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Chapter
                </Button>
              </Link>
              <Button onClick={() => { setPhase("intro"); setAnswers({}); setCurrentQ(0); }} className="gap-2">
                <Target className="w-4 h-4" /> Try Again
              </Button>
              {result.passed && (
                <Link href="/dashboard">
                  <Button className="gap-2 bg-green-700 hover:bg-green-600">
                    <GraduationCap className="w-4 h-4" /> Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
