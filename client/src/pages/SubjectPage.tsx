import { useParams, Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Atom, FlaskConical, Calculator, Lock, CheckCircle, Circle,
  BookOpen, Target, Clock, ChevronRight, AlertCircle, Zap, Star
} from "lucide-react";

const SUBJECT_META: Record<string, { label: string; icon: any; color: string; bgClass: string; borderClass: string; description: string }> = {
  physics: { label: "Physics", icon: Atom, color: "text-physics", bgClass: "subject-bg-physics", borderClass: "subject-physics", description: "From Kinematics to Modern Physics — master all 25 chapters" },
  chemistry: { label: "Chemistry", icon: FlaskConical, color: "text-chemistry", bgClass: "subject-bg-chemistry", borderClass: "subject-chemistry", description: "Physical, Organic & Inorganic Chemistry — all 28 chapters" },
  mathematics: { label: "Mathematics", icon: Calculator, color: "text-mathematics", bgClass: "subject-bg-mathematics", borderClass: "subject-mathematics", description: "Algebra, Calculus, Geometry & more — all 27 chapters" },
};

const WEIGHTAGE_COLORS: Record<string, string> = {
  critical: "badge-critical",
  high: "badge-high",
  medium: "badge-medium-imp",
  low: "badge-low",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "badge-easy",
  medium: "badge-medium",
  hard: "badge-hard",
};

const STATUS_ICONS: Record<string, any> = {
  locked: Lock,
  unlocked: Circle,
  in_progress: Zap,
  completed: CheckCircle,
};

const STATUS_COLORS: Record<string, string> = {
  locked: "text-muted-foreground",
  unlocked: "text-blue-400",
  in_progress: "text-yellow-400",
  completed: "text-green-400",
};

export default function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { isAuthenticated } = useAuth();
  const meta = SUBJECT_META[subjectId] || SUBJECT_META.physics;
  const Icon = meta.icon;

  const { data: chapters, isLoading } = trpc.chapters.listBySubject.useQuery({ subjectId });
  const { data: progressData } = trpc.chapters.getUserProgress.useQuery(
    { subjectId },
    { enabled: isAuthenticated }
  );

  const progressMap = new Map(progressData?.map(p => [p.chapterId, p]) || []);

  const class11Chapters = chapters?.filter(c => c.curriculumId === "ncert_class11") || [];
  const class12Chapters = chapters?.filter(c => c.curriculumId === "ncert_class12") || [];

  const completedCount = progressData?.filter(p => p.status === "completed").length || 0;
  const totalCount = chapters?.length || 0;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const renderChapterCard = (chapter: any) => {
    const progress = progressMap.get(chapter.chapterId);
    const status = progress?.status || "locked";
    const isLocked = status === "locked";
    const StatusIcon = STATUS_ICONS[status] || Lock;

    return (
      <Link key={chapter.chapterId} href={isLocked ? "#" : `/chapter/${chapter.chapterId}`}>
        <div className={`chapter-card ${isLocked ? "locked" : ""} ${meta.bgClass} relative`}>
          {/* Lock overlay */}
          {isLocked && (
            <div className="absolute top-3 right-3">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
          )}

          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-8 h-8 rounded-lg bg-card flex items-center justify-center flex-shrink-0 text-sm font-bold ${meta.color}`}>
              {chapter.sortOrder}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground leading-tight">{chapter.title}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <StatusIcon className={`w-3 h-3 ${STATUS_COLORS[status]}`} />
                <span className={`text-xs ${STATUS_COLORS[status]} capitalize`}>{status.replace("_", " ")}</span>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {chapter.jeeWeightage && (
              <span className={WEIGHTAGE_COLORS[chapter.jeeWeightage] || "badge-medium-imp"}>
                {chapter.jeeWeightage === "critical" ? "🔥 Critical" : chapter.jeeWeightage}
              </span>
            )}
            {chapter.difficultyLevel && (
              <span className={DIFFICULTY_COLORS[chapter.difficultyLevel] || "badge-medium"}>
                {chapter.difficultyLevel}
              </span>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {chapter.estimatedStudyHours || 8}h
            </span>
            {progress?.bestScore ? (
              <span className="flex items-center gap-1 text-green-400">
                <Star className="w-3 h-3" />
                Best: {Math.round(progress.bestScore)}%
              </span>
            ) : null}
          </div>

          {/* Progress bar if in progress */}
          {status === "in_progress" && progress?.bestScore ? (
            <div className="mt-2">
              <div className="progress-bar">
                <div className="progress-bar-fill amber" style={{ width: `${progress.bestScore}%` }} />
              </div>
            </div>
          ) : null}
        </div>
      </Link>
    );
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className={`${meta.bgClass} ${meta.borderClass} rounded-2xl p-6 mb-8`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-card flex items-center justify-center">
                <Icon className={`w-8 h-8 ${meta.color}`} />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">{meta.label}</h1>
                <p className="text-muted-foreground text-sm mt-1">{meta.description}</p>
              </div>
            </div>

            {/* Progress */}
            {isAuthenticated && (
              <div className="text-right">
                <div className="text-2xl font-display font-bold text-foreground">{progressPct}%</div>
                <div className="text-xs text-muted-foreground">{completedCount}/{totalCount} completed</div>
              </div>
            )}
          </div>

          {isAuthenticated && (
            <div className="mt-4">
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-card/60 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-foreground">{class11Chapters.length}</div>
              <div className="text-xs text-muted-foreground">Class 11</div>
            </div>
            <div className="bg-card/60 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-foreground">{class12Chapters.length}</div>
              <div className="text-xs text-muted-foreground">Class 12</div>
            </div>
            <div className="bg-card/60 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-foreground">{totalCount}</div>
              <div className="text-xs text-muted-foreground">Total Chapters</div>
            </div>
          </div>
        </div>

        {/* Class 12 unlock notice */}
        {isAuthenticated && (
          <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 mb-6">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-yellow-300">Progressive Unlock System</div>
              <div className="text-xs text-yellow-400/80 mt-0.5">
                Complete 80% of Class 11 chapters (score 60%+) to unlock Class 12 content.
                Each chapter must be passed to unlock the next one.
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Class 11 */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-blue-900/40 border border-blue-700/50 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">11</span>
                </div>
                <h2 className="font-display font-bold text-lg text-foreground">Class 11 Chapters</h2>
                <span className="text-sm text-muted-foreground">({class11Chapters.length} chapters)</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {class11Chapters.map(renderChapterCard)}
              </div>
            </div>

            {/* Class 12 */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-green-900/40 border border-green-700/50 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-400">12</span>
                </div>
                <h2 className="font-display font-bold text-lg text-foreground">Class 12 Chapters</h2>
                <span className="text-sm text-muted-foreground">({class12Chapters.length} chapters)</span>
                <span className="badge-medium-imp ml-2">Requires 80% Class 11</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {class12Chapters.map(renderChapterCard)}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
