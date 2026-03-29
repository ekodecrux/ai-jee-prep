import { useState } from "react";
import { useParams, Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  BookOpen, Target, Zap, Clock, ChevronLeft, Star, Lock,
  RefreshCw, CheckCircle, AlertCircle, Loader2, BookMarked,
  FileQuestion, BarChart3, Lightbulb, ArrowRight
} from "lucide-react";

export default function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("narration");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questionFilter, setQuestionFilter] = useState<{ difficulty?: string; type?: string; exam?: string }>({});

  const { data: chapter, isLoading: chapterLoading } = trpc.chapters.getById.useQuery({ chapterId });
  const { data: narration, isLoading: narrationLoading, refetch: refetchNarration } = trpc.content.getNarration.useQuery({ chapterId });
  const { data: questions, isLoading: questionsLoading } = trpc.content.getQuestions.useQuery({ chapterId, limit: 50 });
  const { data: assessmentList } = trpc.content.getAssessments.useQuery({ chapterId });
  const { data: progressData } = trpc.chapters.getUserProgress.useQuery({ subjectId: chapter?.subjectId || "" }, { enabled: !!chapter && isAuthenticated });

  const generateContent = trpc.content.generateContent.useMutation();
  const markRead = trpc.chapters.markNarrationRead.useMutation();

  const progress = progressData?.find(p => p.chapterId === chapterId);
  const isLocked = progress?.status === "locked";

  const handleGenerateNarration = async () => {
    setIsGenerating(true);
    try {
      await generateContent.mutateAsync({ chapterId });
      await refetchNarration();
      toast.success("Content generated successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    try {
      await generateContent.mutateAsync({ chapterId });
      toast.success("Questions generated successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate questions");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkRead = async () => {
    if (!isAuthenticated) return;
    await markRead.mutateAsync({ chapterId });
    toast.success("Marked as read! Keep going.");
  };

  const filteredQuestions = questions?.filter(q => {
    if (questionFilter.difficulty && q.difficulty !== questionFilter.difficulty) return false;
    if (questionFilter.type && q.questionType !== questionFilter.type) return false;
    if (questionFilter.exam && q.examId !== questionFilter.exam) return false;
    return true;
  }) || [];

  if (chapterLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="skeleton h-40 rounded-2xl mb-6" />
          <div className="skeleton h-8 w-64 mb-4" />
          <div className="skeleton h-96 rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (!chapter) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Chapter Not Found</h2>
          <Link href="/"><Button variant="outline">Go Home</Button></Link>
        </div>
      </Layout>
    );
  }

  const subjectColors: Record<string, string> = {
    physics: "text-physics", chemistry: "text-chemistry", mathematics: "text-mathematics"
  };
  const subjectBg: Record<string, string> = {
    physics: "subject-bg-physics subject-physics", chemistry: "subject-bg-chemistry subject-chemistry", mathematics: "subject-bg-mathematics subject-mathematics"
  };

  return (
    <Layout>
      <div className="container py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href={`/subject/${chapter.subjectId}`} className="hover:text-foreground transition-colors capitalize">{chapter.subjectId}</Link>
          <span>/</span>
          <span className="text-foreground">{chapter.title}</span>
        </div>

        {/* Chapter header */}
        <div className={`${subjectBg[chapter.subjectId] || ""} rounded-2xl p-6 mb-6`}>
          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold uppercase tracking-wider ${subjectColors[chapter.subjectId] || "text-primary"}`}>
                  {chapter.subject?.name} · {chapter.curriculumId === "ncert_class11" ? "Class 11" : "Class 12"}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">Chapter {chapter.sortOrder}</span>
              </div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground mb-3">{chapter.title}</h1>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {chapter.weightageMain?.importanceLevel && (
                  <span className={chapter.weightageMain.importanceLevel === "critical" ? "badge-critical" : chapter.weightageMain.importanceLevel === "high" ? "badge-high" : "badge-medium-imp"}>
                    {chapter.weightageMain.importanceLevel === "critical" ? "🔥 Critical" : `${chapter.weightageMain.importanceLevel} weightage`}
                  </span>
                )}
                {chapter.difficultyLevel && (
                  <span className={`badge-${chapter.difficultyLevel}`}>{chapter.difficultyLevel}</span>
                )}
                {chapter.hasNarration && (
                  <span className="badge-easy">✓ Narration Ready</span>
                )}
                <span className="badge-foundation">{chapter.questionCount || 0} questions</span>
              </div>

              {/* Key topics */}
              {(chapter.keyTopics as string[] || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(chapter.keyTopics as string[]).slice(0, 6).map((topic: string) => (
                    <span key={topic} className="text-xs bg-card/60 border border-border/50 rounded-full px-2.5 py-0.5 text-muted-foreground">
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right panel */}
            <div className="flex flex-col gap-3 lg:w-48">
              <div className="stat-card text-center">
                <div className="text-xl font-bold text-foreground">{chapter.estimatedStudyHours || 8}h</div>
                <div className="text-xs text-muted-foreground">Estimated study time</div>
              </div>
              {progress?.bestScore ? (
                <div className="stat-card text-center">
                  <div className="text-xl font-bold text-green-400">{Math.round(progress.bestScore)}%</div>
                  <div className="text-xs text-muted-foreground">Best score</div>
                </div>
              ) : null}
              <Link href={`/chapter/${chapterId}/assess`}>
                <Button className="w-full gap-2" size="sm" disabled={isLocked}>
                  <Target className="w-4 h-4" />
                  Take Assessment
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Locked notice */}
        {isLocked && (
          <div className="flex items-center gap-3 bg-red-900/20 border border-red-700/30 rounded-xl p-4 mb-6">
            <Lock className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold text-red-300">Chapter Locked</div>
              <div className="text-xs text-red-400/80">Complete the previous chapter with 60%+ score to unlock this chapter.</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger value="narration" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Narration Script</span>
              <span className="sm:hidden">Narration</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <FileQuestion className="w-4 h-4" />
              <span className="hidden sm:inline">Past Questions</span>
              <span className="sm:hidden">Questions</span>
              {questions && <span className="ml-1 text-xs bg-primary/20 text-primary rounded-full px-1.5">{questions.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="assessments" className="gap-2">
              <Target className="w-4 h-4" />
              Assessments
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Narration Tab */}
          <TabsContent value="narration">
            {narrationLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : narration ? (
              <div className="bg-card border border-border rounded-xl p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-display font-bold text-xl text-foreground">Teacher Narration Script</h2>
                    <p className="text-sm text-muted-foreground mt-1">{narration.wordCount?.toLocaleString() || "3000+"} words · Comprehensive coverage</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleGenerateNarration} disabled={isGenerating}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                      Regenerate
                    </Button>
                    {isAuthenticated && !progress?.narrationRead && (
                      <Button size="sm" onClick={handleMarkRead} className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </div>

                <div className="narration-content prose prose-invert max-w-none space-y-4">
                  {narration.introduction && <div><h2>Introduction</h2><p>{narration.introduction}</p></div>}
                  {narration.conceptualExplanation && <div><h2>Conceptual Explanation</h2><p>{narration.conceptualExplanation}</p></div>}
                  {narration.formulasAndDerivations && <div><h2>Formulas & Derivations</h2><p>{narration.formulasAndDerivations}</p></div>}
                  {narration.solvedExamples && <div><h2>Solved Examples</h2><p>{narration.solvedExamples}</p></div>}
                  {narration.advancedConcepts && <div><h2>Advanced Concepts</h2><p>{narration.advancedConcepts}</p></div>}
                  {narration.examSpecificTips && <div><h2>JEE Exam Tips</h2><p>{narration.examSpecificTips}</p></div>}
                  {narration.commonMistakes && <div><h2>Common Mistakes</h2><p>{narration.commonMistakes}</p></div>}
                  {narration.quickRevisionSummary && <div><h2>Quick Revision Summary</h2><p>{narration.quickRevisionSummary}</p></div>}
                  {narration.mnemonics && <div><h2>Mnemonics & Memory Aids</h2><p>{narration.mnemonics}</p></div>}
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-bold text-lg text-foreground mb-2">Narration Script Not Yet Generated</h3>
                <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
                  Click below to generate a comprehensive 3000+ word teacher narration script for this chapter using AI.
                  This covers all concepts, problem-solving approaches, and JEE-specific insights.
                </p>
                <Button onClick={handleGenerateNarration} disabled={isGenerating} className="gap-2">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {isGenerating ? "Generating..." : "Generate Narration Script"}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {["", "easy", "medium", "hard"].map(d => (
                <button key={d} onClick={() => setQuestionFilter(f => ({ ...f, difficulty: d || undefined }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${questionFilter.difficulty === (d || undefined) ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {d ? d.charAt(0).toUpperCase() + d.slice(1) : "All Difficulty"}
                </button>
              ))}
              <div className="w-px bg-border" />
              {["", "mcq", "nat", "integer", "multi_correct"].map(t => (
                <button key={t} onClick={() => setQuestionFilter(f => ({ ...f, type: t || undefined }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${questionFilter.type === (t || undefined) ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {t ? t.toUpperCase().replace("_", " ") : "All Types"}
                </button>
              ))}
              <div className="w-px bg-border" />
              {["", "jee_main", "jee_advanced"].map(e => (
                <button key={e} onClick={() => setQuestionFilter(f => ({ ...f, exam: e || undefined }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${questionFilter.exam === (e || undefined) ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {e ? (e === "jee_main" ? "JEE Main" : "JEE Advanced") : "Both Exams"}
                </button>
              ))}
            </div>

            {questionsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
              </div>
            ) : filteredQuestions.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-2">Showing {filteredQuestions.length} questions</div>
                {filteredQuestions.map((q, idx) => (
                  <QuestionCard key={q.id} question={q} index={idx + 1} />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <FileQuestion className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold text-lg text-foreground mb-2">No Questions Yet</h3>
                <p className="text-muted-foreground text-sm mb-6">Generate past-year style questions for this chapter.</p>
                <Button onClick={handleGenerateQuestions} disabled={isGenerating} className="gap-2">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                  {isGenerating ? "Generating..." : "Generate Questions"}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Assessments Tab */}
          <TabsContent value="assessments">
            {assessmentList && assessmentList.length > 0 ? (
              <div className="space-y-4">
                {assessmentList.map((asmt: any) => (
                  <div key={asmt.assessmentId} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{asmt.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{asmt.description}</p>
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{(asmt.questionIds as number[])?.length || 0} questions</span>
                          <span>·</span>
                          <span>{asmt.timeLimitMinutes || 30} minutes</span>
                          <span>·</span>
                          <span>Pass: {asmt.passingScore || 60}%</span>
                          {asmt.assessmentType === "chapter_test" && <><span>·</span><span>3 attempts/day</span></>}
                        </div>
                      </div>
                      <Link href={`/chapter/${chapterId}/assess?id=${asmt.assessmentId}`}>
                        <Button size="sm" className="gap-2">
                          Start <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-bold text-lg text-foreground mb-2">No Assessments Yet</h3>
                <p className="text-muted-foreground text-sm mb-2">Assessments are auto-generated when questions are available.</p>
                <Link href={`/chapter/${chapterId}/assess`}>
                  <Button className="gap-2 mt-4">
                    <Target className="w-4 h-4" />
                    Go to Assessment
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Weightage info */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  JEE Weightage
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">JEE Main Weightage</span>
                    <span className={chapter.weightageMain?.avgQuestionsPerYear ? "text-foreground" : "text-muted-foreground"}>
                      {chapter.weightageMain?.avgQuestionsPerYear ? `~${chapter.weightageMain.avgQuestionsPerYear} Q/year` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">JEE Advanced Weightage</span>
                    <span className={chapter.weightageAdvanced?.avgQuestionsPerYear ? "text-foreground" : "text-muted-foreground"}>
                      {chapter.weightageAdvanced?.avgQuestionsPerYear ? `~${chapter.weightageAdvanced.avgQuestionsPerYear} Q/year` : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Importance Level</span>
                    <span className={chapter.weightageMain?.importanceLevel === "critical" ? "badge-critical" : chapter.weightageMain?.importanceLevel === "high" ? "badge-high" : "badge-medium-imp"}>
                      {chapter.weightageMain?.importanceLevel || "medium"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Study tips */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  Study Tips
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    Read the narration script completely before attempting questions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    Practice past JEE questions after understanding concepts
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    Score 60%+ in chapter assessment to unlock the next chapter
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">→</span>
                    Chapter tests are limited to 3 attempts per day
                  </li>
                </ul>
              </div>

              {/* Key topics */}
              {(chapter.keyTopics as string[] || []).length > 0 && (
                <div className="bg-card border border-border rounded-xl p-5 sm:col-span-2">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Key Topics Covered
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(chapter.keyTopics as string[]).map((topic: string) => (
                      <span key={topic} className="text-xs bg-primary/10 border border-primary/20 rounded-full px-3 py-1 text-primary">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Question card component
function QuestionCard({ question, index }: { question: any; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);

  const typeLabel: Record<string, string> = {
    mcq: "MCQ", nat: "NAT", integer: "Integer", multi_correct: "Multi-Correct"
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">Q{index}</span>
          <span className={`badge-${question.difficulty || "medium"}`}>{question.difficulty || "medium"}</span>
          <span className="badge-foundation">{typeLabel[question.questionType] || question.questionType}</span>
          {question.year && <span className="text-xs text-muted-foreground">{question.year}</span>}
          {question.examId && <span className="text-xs text-muted-foreground">{question.examId === "jee_main" ? "JEE Main" : "JEE Adv"}</span>}
        </div>
        <span className="text-xs text-muted-foreground">+{question.marks || 4} / -{question.negativeMarks || 1}</span>
      </div>

      <p className="text-sm text-foreground leading-relaxed mb-3">{question.questionText}</p>

      {/* Options for MCQ */}
      {question.questionType === "mcq" && question.options && (
        <div className="grid sm:grid-cols-2 gap-2 mb-3">
          {(question.options as string[]).map((opt: string, i: number) => {
            const label = String.fromCharCode(65 + i);
            const isCorrect = showAnswer && question.correctAnswer === label;
            return (
              <div key={i} className={`text-xs p-2 rounded-lg border ${isCorrect ? "border-green-600 bg-green-900/20 text-green-300" : "border-border text-muted-foreground"}`}>
                <strong className="mr-1">{label}.</strong>{opt}
              </div>
            );
          })}
        </div>
      )}

      {/* Show/hide answer */}
      <div className="flex items-center gap-3">
        <button onClick={() => setShowAnswer(!showAnswer)} className="text-xs text-primary hover:text-primary/80 transition-colors">
          {showAnswer ? "Hide Answer" : "Show Answer & Solution"}
        </button>
        {question.conceptTested && (
          <span className="text-xs text-muted-foreground">Concept: {question.conceptTested}</span>
        )}
      </div>

      {showAnswer && (
        <div className="mt-3 p-3 bg-green-900/10 border border-green-700/30 rounded-lg">
          <div className="text-xs font-semibold text-green-400 mb-1">
            Answer: {question.correctAnswer || question.numericalAnswer || (question.correctOptions as string[] || []).join(", ")}
          </div>
          {question.solution && (
            <p className="text-xs text-muted-foreground leading-relaxed">{question.solution}</p>
          )}
        </div>
      )}
    </div>
  );
}
