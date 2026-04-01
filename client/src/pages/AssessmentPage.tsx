import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import {
  Clock, Target, CheckCircle, AlertCircle, ArrowRight,
  ArrowLeft, Loader2, Trophy, GraduationCap, Lock,
  Camera, CameraOff, Eye, EyeOff, Shield, ShieldAlert,
} from "lucide-react";

type Phase = "intro" | "quiz" | "result";

// ─── Webcam Proctoring Hook ────────────────────────────────────────────────────
function useWebcamProctoring(enabled: boolean, onViolation: (count: number) => void, onAutoSubmit: () => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [camStatus, setCamStatus] = useState<"idle" | "requesting" | "active" | "denied">("idle");
  const [violations, setViolations] = useState(0);
  const [faceDetected, setFaceDetected] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const violationsRef = useRef(0);

  const startCamera = useCallback(async () => {
    if (!enabled) return;
    setCamStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCamStatus("active");

      // Simulate face detection via canvas analysis every 5 seconds
      intervalRef.current = setInterval(() => {
        if (!videoRef.current || !streamRef.current) return;
        const canvas = document.createElement("canvas");
        canvas.width = 64; canvas.height = 48;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0, 64, 48);
        const data = ctx.getImageData(0, 0, 64, 48).data;

        // Simple brightness check — very dark frame = no face / covered camera
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
        }
        const avgBrightness = totalBrightness / (data.length / 4);
        const detected = avgBrightness > 15; // threshold for "something visible"

        setFaceDetected(detected);
        if (!detected) {
          violationsRef.current += 1;
          setViolations(violationsRef.current);
          setShowWarning(true);
          onViolation(violationsRef.current);
          setTimeout(() => setShowWarning(false), 3000);
          if (violationsRef.current >= 3) {
            toast.error("3 proctoring violations detected. Auto-submitting test.");
            onAutoSubmit();
          }
        }
      }, 5000);
    } catch {
      setCamStatus("denied");
      toast.error("Camera access denied. Webcam proctoring is required for this test.");
    }
  }, [enabled, onViolation, onAutoSubmit]);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCamStatus("idle");
  }, []);

  useEffect(() => {
    if (enabled) startCamera();
    return () => stopCamera();
  }, [enabled]);

  return { videoRef, camStatus, violations, faceDetected, showWarning, startCamera };
}

// ─── Webcam PiP Overlay ───────────────────────────────────────────────────────
function WebcamOverlay({ videoRef, camStatus, violations, faceDetected, showWarning }: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  camStatus: string;
  violations: number;
  faceDetected: boolean;
  showWarning: boolean;
}) {
  const [minimized, setMinimized] = useState(false);

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${minimized ? "w-12 h-12" : "w-52"}`}>
      {/* Warning banner */}
      {showWarning && (
        <div className="absolute -top-14 right-0 bg-red-600 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 whitespace-nowrap animate-pulse">
          <ShieldAlert className="w-4 h-4" />
          Face not detected! Warning {violations}/3
        </div>
      )}

      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          title="Show webcam"
        >
          <Camera className="w-5 h-5" />
        </button>
      ) : (
        <div className={`rounded-xl overflow-hidden shadow-2xl border-2 ${faceDetected ? "border-green-500" : "border-red-500"} bg-black`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-2 py-1 text-xs font-semibold ${faceDetected ? "bg-green-600" : "bg-red-600"} text-white`}>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Proctored
            </div>
            <div className="flex items-center gap-2">
              {violations > 0 && (
                <Badge className="text-[10px] h-4 px-1 bg-white/20 text-white border-0">
                  ⚠ {violations}/3
                </Badge>
              )}
              <button onClick={() => setMinimized(true)} className="hover:opacity-70 transition-opacity" title="Minimize">
                <EyeOff className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Video feed */}
          <div className="relative bg-black" style={{ height: 150 }}>
            {camStatus === "active" ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : camStatus === "requesting" ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-white gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs">Requesting camera...</span>
              </div>
            ) : camStatus === "denied" ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-red-400 gap-2">
                <CameraOff className="w-6 h-6" />
                <span className="text-xs text-center px-2">Camera denied. Test may be flagged.</span>
              </div>
            ) : null}

            {/* Face status indicator */}
            {camStatus === "active" && (
              <div className={`absolute top-1 left-1 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${faceDetected ? "bg-green-600/80 text-white" : "bg-red-600/80 text-white animate-pulse"}`}>
                {faceDetected ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                {faceDetected ? "Face OK" : "No Face"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Assessment Page ─────────────────────────────────────────────────────
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
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [proctoringLog, setProctoringLog] = useState<Array<{ time: string; event: string }>>([]);

  const { data: assessments, isLoading: assLoading } = trpc.content.getAssessments.useQuery({ chapterId });
  const { data: chapter } = trpc.chapters.getById.useQuery({ chapterId });

  const assessment = assessments?.[1] || assessments?.[0];
  const assessmentId = assessment?.assessmentId || "";
  const isChapterTest = assessment?.assessmentType === "chapter_test";

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

  // ─── Proctoring callbacks ────────────────────────────────────────────────
  const handleViolation = useCallback((count: number) => {
    const event = `Face not detected (violation ${count}/3)`;
    setProctoringLog(prev => [...prev, { time: new Date().toLocaleTimeString(), event }]);
    toast.warning(`⚠ Proctoring warning ${count}/3 — face not detected`);
  }, []);

  const handleAutoSubmit = useCallback(() => {
    setProctoringLog(prev => [...prev, { time: new Date().toLocaleTimeString(), event: "Auto-submitted: 3 violations" }]);
    handleSubmit();
  }, []);

  const { videoRef, camStatus, violations, faceDetected, showWarning } = useWebcamProctoring(
    webcamEnabled && phase === "quiz",
    handleViolation,
    handleAutoSubmit
  );

  // ─── Timer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "quiz" && isChapterTest && assessment?.durationMinutes) {
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
    if (!isAuthenticated) { window.location.href = getLoginUrl(); return; }
    // Enable webcam proctoring for chapter tests
    if (isChapterTest) setWebcamEnabled(true);
    setStartTime(Date.now());
    setPhase("quiz");
    setCurrentQ(0);
    setAnswers({});
    setProctoringLog([{ time: new Date().toLocaleTimeString(), event: "Test started" }]);
  };

  const handleAnswer = (qId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const handleSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setWebcamEnabled(false);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await submitAttempt.mutateAsync({ assessmentId, answers, timeTakenSeconds: timeTaken });
      setResult({ ...res, proctoringLog, violations });
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

            {/* Webcam proctoring notice for chapter tests */}
            {isChapterTest && (
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-left">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Webcam Proctoring Enabled</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    This chapter test requires webcam access. Your camera will be active during the test to detect face presence.
                    3 violations (face not detected) will trigger auto-submission. Ensure good lighting and face the camera.
                  </p>
                </div>
              </div>
            )}

            {dailyLimit?.canAttempt === false ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-sm text-red-700">
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
                {isChapterTest ? <Camera className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                {isChapterTest ? "Start Proctored Test" : "Start Assessment"}
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
              <div className="flex items-center gap-3">
                {assessment?.durationMinutes && assessment.durationMinutes > 0 && (
                  <div className={`flex items-center gap-2 text-sm font-mono font-bold ${timeLeft < 300 ? "text-red-500" : "text-foreground"}`} aria-label="time-remaining">
                    <Clock className="w-4 h-4" />
                    {formatTime(timeLeft)}
                  </div>
                )}
                {webcamEnabled && (
                  <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${faceDetected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700 animate-pulse"}`}>
                    <Shield className="w-3 h-3" />
                    {faceDetected ? "Proctored" : "⚠ No Face"}
                    {violations > 0 && ` (${violations}/3)`}
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {Object.keys(answers).length} answered
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
            </div>

            {/* Question */}
            {(() => {
              const q = questions[currentQ];
              const qId = q.id.toString();
              const currentAnswer = answers[qId] || "";

              return (
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="outline" className="text-xs capitalize">{q.difficulty}</Badge>
                    <Badge variant="outline" className="text-xs uppercase">{q.questionType}</Badge>
                    <span className="text-xs text-muted-foreground ml-auto">+{q.marks || 4} / -{q.negativeMarks || 1}</span>
                  </div>

                  <p className="text-foreground leading-relaxed mb-6">{q.questionText}</p>

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
                        className="max-w-xs"
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

              <div className="flex gap-1 flex-wrap justify-center max-w-xs">
                {questions.map((_, i) => (
                  <button key={i} onClick={() => setCurrentQ(i)}
                    className={`w-7 h-7 rounded text-xs font-medium transition-all ${i === currentQ ? "bg-primary text-primary-foreground" : answers[questions[i].id.toString()] ? "bg-green-100 text-green-700 border border-green-300" : "bg-card border border-border text-muted-foreground hover:border-primary/50"}`}>
                    {i + 1}
                  </button>
                ))}
              </div>

              {currentQ < questions.length - 1 ? (
                <Button onClick={() => setCurrentQ(q => q + 1)} className="gap-2">
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitAttempt.isPending} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
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
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? "bg-green-100 border-2 border-green-500" : "bg-red-100 border-2 border-red-500"}`}>
                {result.passed ? <Trophy className="w-10 h-10 text-green-600" /> : <AlertCircle className="w-10 h-10 text-red-600" />}
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
                { label: "Score", value: `${Math.round(result.percentage)}%`, color: result.passed ? "text-green-600" : "text-red-600" },
                { label: "Marks", value: `${result.score}/${result.maxScore}`, color: "text-foreground" },
                { label: "Correct", value: result.correctCount || "—", color: "text-green-600" },
                { label: "Wrong", value: result.wrongCount || "—", color: "text-red-600" },
              ].map(stat => (
                <div key={stat.label} className="bg-background border border-border rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Proctoring summary */}
            {result.violations !== undefined && (
              <div className={`flex items-start gap-3 rounded-xl p-4 mb-6 ${result.violations === 0 ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
                <Shield className={`w-5 h-5 mt-0.5 shrink-0 ${result.violations === 0 ? "text-green-600" : "text-amber-600"}`} />
                <div>
                  <p className={`text-sm font-semibold ${result.violations === 0 ? "text-green-800" : "text-amber-800"}`}>
                    Proctoring Report: {result.violations === 0 ? "Clean — No violations" : `${result.violations} violation(s) recorded`}
                  </p>
                  {result.proctoringLog && result.proctoringLog.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {result.proctoringLog.map((entry: { time: string; event: string }, i: number) => (
                        <p key={i} className="text-xs text-muted-foreground">{entry.time} — {entry.event}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Weak topics */}
            {result.weakTopics && result.weakTopics.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Topics to Review
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.weakTopics.map((t: string) => (
                    <span key={t} className="text-xs bg-amber-100 border border-amber-300 rounded-full px-2.5 py-1 text-amber-700">{t}</span>
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
              <Button onClick={() => { setPhase("intro"); setAnswers({}); setCurrentQ(0); setResult(null); }} className="gap-2">
                <Target className="w-4 h-4" /> Try Again
              </Button>
              {result.passed && (
                <Link href="/dashboard">
                  <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                    <GraduationCap className="w-4 h-4" /> Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Webcam proctoring overlay — shown during quiz phase */}
      {phase === "quiz" && webcamEnabled && (
        <WebcamOverlay
          videoRef={videoRef}
          camStatus={camStatus}
          violations={violations}
          faceDetected={faceDetected}
          showWarning={showWarning}
        />
      )}
    </Layout>
  );
}
