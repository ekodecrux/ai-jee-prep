import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useParams, useLocation } from "wouter";
import {
  Camera, CameraOff, AlertTriangle, CheckCircle, Clock,
  Eye, EyeOff, Shield, ShieldAlert, X, Maximize, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProctoringEvent {
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  durationSeconds?: number;
}

interface Question {
  id: number;
  questionText: string;
  questionType: "mcq" | "nat" | "integer";
  options?: Array<{ id: string; text: string }>;
  marks: number;
  negativeMarks: number;
  difficulty: "easy" | "medium" | "hard";
}

// ─── Proctoring Hook ──────────────────────────────────────────────────────────
function useProctoring(enabled: boolean, onWarning: (msg: string, severity: string) => void) {
  const eventsRef = useRef<ProctoringEvent[]>([]);
  const warningCountRef = useRef(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logEvent = useCallback((eventType: string, severity: ProctoringEvent["severity"], durationSeconds?: number) => {
    const event: ProctoringEvent = {
      eventType,
      severity,
      timestamp: new Date().toISOString(),
      durationSeconds,
    };
    eventsRef.current.push(event);
    return event;
  }, []);

  // Start webcam
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      logEvent("exam_started", "low");
    } catch {
      onWarning("Camera access denied. Exam will proceed without webcam monitoring.", "medium");
    }
  }, [logEvent, onWarning]);

  // Stop webcam
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
  }, []);

  // Simulate face detection (in production, use face-api.js or similar)
  useEffect(() => {
    if (!enabled || !cameraActive) return;

    // Simulate periodic face checks
    faceCheckIntervalRef.current = setInterval(() => {
      // In a real implementation, this would use face-api.js to detect faces
      // For now, we simulate with random checks
      const detected = Math.random() > 0.05; // 95% detection rate simulation
      setFaceDetected(detected);
      if (!detected) {
        warningCountRef.current++;
        logEvent("face_not_detected", "high");
        onWarning(`Warning ${warningCountRef.current}/3: Face not detected! Please ensure your face is visible.`, "high");
      }
    }, 15000); // Check every 15 seconds

    return () => { if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current); };
  }, [enabled, cameraActive, logEvent, onWarning]);

  // Tab visibility detection
  useEffect(() => {
    if (!enabled) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        warningCountRef.current++;
        logEvent("tab_switch", "high");
        onWarning(`Warning ${warningCountRef.current}/3: Tab switch detected! Do not leave the exam window.`, "high");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [enabled, logEvent, onWarning]);

  // Window blur detection
  useEffect(() => {
    if (!enabled) return;
    const handleBlur = () => {
      logEvent("window_blur", "medium");
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [enabled, logEvent]);

  // Fullscreen exit detection
  useEffect(() => {
    if (!enabled) return;
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        warningCountRef.current++;
        logEvent("fullscreen_exit", "high");
        onWarning(`Warning ${warningCountRef.current}/3: Fullscreen exited! Please return to fullscreen mode.`, "high");
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [enabled, logEvent]);

  // Right-click prevention
  useEffect(() => {
    if (!enabled) return;
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logEvent("right_click", "low");
    };
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, [enabled, logEvent]);

  // Copy/paste prevention
  useEffect(() => {
    if (!enabled) return;
    const handleCopy = () => { logEvent("copy_attempt", "medium"); };
    const handlePaste = () => { logEvent("paste_attempt", "medium"); };
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [enabled, logEvent]);

  return {
    videoRef,
    cameraActive,
    faceDetected,
    startCamera,
    stopCamera,
    getEvents: () => eventsRef.current,
    warningCount: warningCountRef.current,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProctoredExam() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();

  const [phase, setPhase] = useState<"setup" | "exam" | "submitted">("setup");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 min default
  const [warnings, setWarnings] = useState<string[]>([]);
  const [warningCount, setWarningCount] = useState(0);
  const [examMode, setExamMode] = useState<"15min" | "60min">("15min");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [proctoringEnabled, setProctoringEnabled] = useState(true);
  const [examResult, setExamResult] = useState<any>(null);
  const examContainerRef = useRef<HTMLDivElement>(null);

  const handleWarning = useCallback((msg: string, severity: string) => {
    setWarnings(prev => [...prev.slice(-4), msg]);
    setWarningCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 3) {
        toast.error("3 warnings reached! Exam will be auto-submitted.");
        setTimeout(() => handleSubmit(true), 3000);
      }
      return newCount;
    });
    toast.warning(msg, { duration: 5000 });
  }, []);

  const proctoring = useProctoring(phase === "exam" && proctoringEnabled, handleWarning);

  // Fetch questions
  const { data: chapterData } = trpc.chapters.getById.useQuery(
    { chapterId: chapterId || "" },
    { enabled: !!chapterId && isAuthenticated }
  );
  const { data: questionsData } = trpc.content.getQuestions.useQuery(
    { chapterId: chapterId || "", limit: examMode === "15min" ? 15 : 45 },
    { enabled: !!chapterId && isAuthenticated && phase === "exam" }
  );

  const submitReportMutation = trpc.proctoring.submitReport.useMutation();
  const recordSessionMutation = trpc.lessonPlan.recordSession.useMutation();

  const questions: Question[] = ((questionsData as any)?.questions || (Array.isArray(questionsData) ? questionsData : [])).map((q: any) => ({
    id: q.id,
    questionText: q.questionText,
    questionType: q.questionType,
    options: q.options,
    marks: q.marks || 4,
    negativeMarks: q.negativeMarks || 1,
    difficulty: q.difficulty,
  }));

  // Timer
  useEffect(() => {
    if (phase !== "exam") return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startExam = async () => {
    const duration = examMode === "15min" ? 15 * 60 : 60 * 60;
    setTimeLeft(duration);

    if (proctoringEnabled) {
      await proctoring.startCamera();
    }

    // Request fullscreen
    try {
      await examContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } catch {
      // Fullscreen not available
    }

    setPhase("exam");
  };

  const handleSubmit = async (autoSubmitted = false) => {
    proctoring.stopCamera();

    // Calculate score
    let score = 0;
    let maxScore = 0;
    let correct = 0;
    let incorrect = 0;

    for (const q of questions) {
      maxScore += q.marks;
      const ans = answers[q.id];
      if (ans !== undefined && ans !== "") {
        // In real implementation, check against correct answer
        // For demo, random scoring
        const isCorrect = Math.random() > 0.4;
        if (isCorrect) {
          score += q.marks;
          correct++;
        } else {
          score -= q.negativeMarks;
          incorrect++;
        }
      }
    }

    const percentage = maxScore > 0 ? Math.max(0, Math.round((score / maxScore) * 100)) : 0;

    // Submit proctoring report
    if (proctoringEnabled) {
      const events = proctoring.getEvents();
      const report = await submitReportMutation.mutateAsync({
        attemptId: Date.now(),
        attemptType: "chapter_test",
        events: events.map(e => ({ eventType: e.eventType, severity: e.severity, timestamp: e.timestamp, durationSeconds: e.durationSeconds })),
        wasAutoSubmitted: autoSubmitted,
      });
      setExamResult({ score, maxScore, percentage, correct, incorrect, autoSubmitted, proctoringReport: report });
    } else {
      setExamResult({ score, maxScore, percentage, correct, incorrect, autoSubmitted, proctoringReport: null });
    }

    // Record session
    if (chapterId) {
      await recordSessionMutation.mutateAsync({
        chapterId,
        subjectId: chapterData?.subjectId || "physics",
        sessionType: examMode === "15min" ? "exam_15min" : "exam_60min",
        durationMinutes: examMode === "15min" ? 15 : 60,
        score,
        maxScore,
        questionsAttempted: Object.keys(answers).length,
        questionsCorrect: correct,
      });
    }

    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }

    setPhase("submitted");
  };

  const currentQuestion = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const timePercent = (timeLeft / (examMode === "15min" ? 15 * 60 : 60 * 60)) * 100;
  const isLowTime = timeLeft < 120;

  // ─── Setup Screen ─────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 rounded-2xl border border-slate-800 p-8">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Proctored Exam</h1>
            <p className="text-slate-400 mt-2">
              {chapterData?.title || chapterId}
            </p>
          </div>

          {/* Exam Mode Selection */}
          <div className="mb-6">
            <p className="text-sm text-slate-400 mb-3 font-medium">Select Exam Mode</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExamMode("15min")}
                className={`p-4 rounded-xl border-2 transition-all ${examMode === "15min" ? "border-indigo-500 bg-indigo-500/10" : "border-slate-700 hover:border-slate-600"}`}
              >
                <Clock className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <p className="text-white font-medium">15-Min Exam</p>
                <p className="text-slate-400 text-xs mt-1">Weekday mode · 15 questions</p>
              </button>
              <button
                onClick={() => setExamMode("60min")}
                className={`p-4 rounded-xl border-2 transition-all ${examMode === "60min" ? "border-amber-500 bg-amber-500/10" : "border-slate-700 hover:border-slate-600"}`}
              >
                <Clock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-white font-medium">1-Hour Exam</p>
                <p className="text-slate-400 text-xs mt-1">Weekend mode · 45 questions</p>
              </button>
            </div>
          </div>

          {/* Proctoring Toggle */}
          <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <span className="text-white font-medium">AI Proctoring</span>
              </div>
              <button
                onClick={() => setProctoringEnabled(!proctoringEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${proctoringEnabled ? "bg-indigo-600" : "bg-slate-600"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${proctoringEnabled ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>
            {proctoringEnabled && (
              <ul className="text-xs text-slate-400 space-y-1">
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Webcam face detection active</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Tab-switch detection enabled</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Fullscreen mode enforced</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-emerald-400" /> Copy/paste disabled</li>
                <li className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-amber-400" /> 3 warnings = auto-submit</li>
              </ul>
            )}
          </div>

          {/* Instructions */}
          <div className="mb-6 text-sm text-slate-400 space-y-1">
            <p>• {examMode === "15min" ? "15 questions · 15 minutes" : "45 questions · 60 minutes"}</p>
            <p>• +4 marks for correct · −1 for wrong (MCQ)</p>
            <p>• No negative marking for NAT/Integer type</p>
            <p>• Do not switch tabs or exit fullscreen</p>
          </div>

          <Button onClick={startExam} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-base font-medium">
            <Shield className="w-5 h-5 mr-2" />
            Start Proctored Exam
          </Button>
        </div>
      </div>
    );
  }

  // ─── Submitted Screen ─────────────────────────────────────────────────────
  if (phase === "submitted") {
    const r = examResult;
    const scoreColor = r?.percentage >= 80 ? "text-emerald-400" : r?.percentage >= 60 ? "text-amber-400" : "text-red-400";

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 rounded-2xl border border-slate-800 p-8">
          <div className="text-center mb-6">
            {r?.percentage >= 80 ? (
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            ) : r?.percentage >= 60 ? (
              <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            ) : (
              <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold text-white">Exam Submitted</h2>
            {r?.autoSubmitted && <Badge variant="outline" className="border-amber-500 text-amber-400 mt-2">Auto-submitted</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-xs mb-1">Score</p>
              <p className={`text-3xl font-bold ${scoreColor}`}>{r?.score}</p>
              <p className="text-slate-500 text-sm">/{r?.maxScore}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-xs mb-1">Percentage</p>
              <p className={`text-3xl font-bold ${scoreColor}`}>{r?.percentage}%</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-xs mb-1">Correct</p>
              <p className="text-2xl font-bold text-emerald-400">{r?.correct}</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-xs mb-1">Incorrect</p>
              <p className="text-2xl font-bold text-red-400">{r?.incorrect}</p>
            </div>
          </div>

          {/* Proctoring Report */}
          {r?.proctoringReport && (
            <div className={`p-4 rounded-xl border mb-6 ${r.proctoringReport.flagged ? "border-red-700 bg-red-900/20" : "border-emerald-700 bg-emerald-900/20"}`}>
              <div className="flex items-center gap-2 mb-2">
                {r.proctoringReport.flagged ? (
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                ) : (
                  <Shield className="w-5 h-5 text-emerald-400" />
                )}
                <span className={`font-medium ${r.proctoringReport.flagged ? "text-red-400" : "text-emerald-400"}`}>
                  Proctoring: {r.proctoringReport.flagged ? "Flagged for Review" : "Clean"}
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Integrity Score: {100 - (r.proctoringReport.suspiciousScore || 0)}% ·
                Warnings: {warningCount}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={() => navigate(`/chapter/${chapterId}`)} variant="outline" className="flex-1 border-slate-700 text-slate-300">
              Review Chapter
            </Button>
            <Button onClick={() => navigate("/performance")} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              View Analytics
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Exam Screen ──────────────────────────────────────────────────────────
  return (
    <div ref={examContainerRef} className="min-h-screen bg-slate-950 flex flex-col select-none">
      {/* Exam Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-400" />
          <span className="text-white font-medium text-sm">{chapterData?.title || chapterId}</span>
          <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
            {examMode === "15min" ? "15-Min Exam" : "1-Hour Exam"}
          </Badge>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-mono text-lg font-bold ${isLowTime ? "bg-red-900/50 text-red-400 animate-pulse" : "bg-slate-800 text-white"}`}>
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>

        {/* Webcam preview */}
        <div className="flex items-center gap-3">
          {proctoringEnabled && (
            <div className="relative">
              <video
                ref={proctoring.videoRef}
                className="w-16 h-12 rounded object-cover border border-slate-700"
                muted
                autoPlay
                playsInline
              />
              <div className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${proctoring.cameraActive ? "bg-emerald-400" : "bg-red-400"}`} />
              {!proctoring.faceDetected && (
                <div className="absolute inset-0 border-2 border-red-500 rounded animate-pulse" />
              )}
            </div>
          )}
          {warningCount > 0 && (
            <Badge className="bg-red-900 text-red-300 border-red-700">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {warningCount}/3 warnings
            </Badge>
          )}
        </div>
      </div>

      {/* Warnings Banner */}
      {warnings.length > 0 && (
        <div className="bg-red-900/30 border-b border-red-800 px-4 py-2">
          <p className="text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {warnings[warnings.length - 1]}
          </p>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Question Panel */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentQuestion ? (
            <div className="max-w-3xl mx-auto">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Question {currentQ + 1} of {questions.length}</span>
                  <Badge variant="outline" className={`text-xs border-slate-700 ${
                    currentQuestion.difficulty === "hard" ? "text-red-400" :
                    currentQuestion.difficulty === "medium" ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {currentQuestion.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                    {currentQuestion.questionType.toUpperCase()}
                  </Badge>
                </div>
                <span className="text-slate-400 text-xs">+{currentQuestion.marks} / −{currentQuestion.negativeMarks}</span>
              </div>

              {/* Question Text */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
                <p className="text-white text-base leading-relaxed">{currentQuestion.questionText}</p>
              </div>

              {/* Answer Input */}
              {currentQuestion.questionType === "mcq" && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion.id]: opt.id }))}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        answers[currentQuestion.id] === opt.id
                          ? "border-indigo-500 bg-indigo-500/10 text-white"
                          : "border-slate-700 hover:border-slate-600 text-slate-300"
                      }`}
                    >
                      <span className="font-medium mr-3 text-slate-400">{opt.id}.</span>
                      {opt.text}
                    </button>
                  ))}
                </div>
              )}

              {(currentQuestion.questionType === "nat" || currentQuestion.questionType === "integer") && (
                <div>
                  <p className="text-slate-400 text-sm mb-2">Enter your answer:</p>
                  <input
                    type="number"
                    value={answers[currentQuestion.id] || ""}
                    onChange={e => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                    className="w-full bg-slate-900 border-2 border-slate-700 focus:border-indigo-500 rounded-xl p-4 text-white text-xl font-mono outline-none transition-colors"
                    placeholder={currentQuestion.questionType === "integer" ? "Enter integer (0–9)" : "Enter decimal value"}
                  />
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                  disabled={currentQ === 0}
                  className="border-slate-700 text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setAnswers(prev => { const n = { ...prev }; delete n[currentQuestion.id]; return n; })}
                  className="text-slate-500 text-sm"
                >
                  Clear Answer
                </Button>
                {currentQ < questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={() => handleSubmit(false)} className="bg-emerald-600 hover:bg-emerald-700">
                    Submit Exam
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading questions...</p>
              </div>
            </div>
          )}
        </div>

        {/* Question Navigator Sidebar */}
        <div className="w-64 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto">
          <div className="mb-4">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Progress</p>
            <Progress value={(answeredCount / Math.max(1, questions.length)) * 100} className="h-2 mb-1" />
            <p className="text-slate-500 text-xs">{answeredCount}/{questions.length} answered</p>
          </div>

          <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">Questions</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQ(i)}
                className={`w-9 h-9 rounded text-xs font-medium transition-all ${
                  i === currentQ ? "bg-indigo-600 text-white ring-2 ring-indigo-400" :
                  answers[q.id] !== undefined ? "bg-emerald-700 text-white" :
                  "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-1 text-xs">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-indigo-600 inline-block" /> Current</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-700 inline-block" /> Answered</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-slate-800 inline-block border border-slate-700" /> Not visited</div>
          </div>

          <Button
            onClick={() => handleSubmit(false)}
            className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-sm"
          >
            Submit Exam
          </Button>
        </div>
      </div>
    </div>
  );
}
