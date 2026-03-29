import { Link } from "wouter";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import {
  Atom, FlaskConical, Calculator, Trophy, Target, BookOpen,
  TrendingUp, Clock, CheckCircle, Lock, Zap, BarChart3,
  GraduationCap, ArrowRight, Star, AlertCircle
} from "lucide-react";

const SUBJECT_META = {
  physics: { label: "Physics", icon: Atom, color: "text-physics", bg: "subject-bg-physics subject-physics" },
  chemistry: { label: "Chemistry", icon: FlaskConical, color: "text-chemistry", bg: "subject-bg-chemistry subject-chemistry" },
  mathematics: { label: "Mathematics", icon: Calculator, color: "text-mathematics", bg: "subject-bg-mathematics subject-mathematics" },
};

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const { data: summary, isLoading } = trpc.chapters.getDashboardSummary.useQuery(undefined, { enabled: isAuthenticated });
  const { data: analytics } = trpc.assessments.getAnalytics.useQuery(undefined, { enabled: isAuthenticated });

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container py-24 text-center">
          <GraduationCap className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-3">Sign In to Access Your Dashboard</h2>
          <p className="text-muted-foreground mb-6">Track your progress, view analytics, and continue your JEE preparation journey.</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="gap-2">
            <GraduationCap className="w-4 h-4" />
            Sign In to Continue
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="skeleton h-32 rounded-2xl mb-6" />
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </Layout>
    );
  }

  const overallProgress = summary?.overallProgress || 0;
  const subjectSummary = summary?.subjectSummary || {};

  return (
    <Layout>
      <div className="container py-6">
        {/* Welcome header */}
        <div className="hero-gradient rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Welcome back,</div>
              <h1 className="font-display text-2xl font-bold text-foreground">{user?.name || "JEE Aspirant"}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {summary?.completed ? `🔥 ${summary.completed} chapters done! Keep it up.` : "Start your JEE preparation journey today."}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-display font-bold text-primary">{Math.round(overallProgress)}%</div>
              <div className="text-xs text-muted-foreground">Overall Progress</div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="mt-4">
            <div className="progress-bar h-3">
              <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{summary?.completed || 0} chapters completed</span>
              <span>{summary?.totalChapters || 80} total chapters</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Chapters Done", value: summary?.completed || 0, icon: CheckCircle, color: "text-green-400" },
            { label: "Assessments Taken", value: analytics?.totalAttempts || 0, icon: Target, color: "text-primary" },
            { label: "Avg Score", value: analytics?.avgScore ? `${Math.round(analytics.avgScore)}%` : "—", icon: BarChart3, color: "text-yellow-400" },
            { label: "Est. Completion", value: summary?.estimatedCompletionMonths ? `${summary.estimatedCompletionMonths}mo` : "—", icon: Clock, color: "text-blue-400" },
          ].map(stat => (
            <div key={stat.label} className="stat-card text-center">
              <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
              <div className="text-xl font-display font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Subject progress */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">        {(["physics", "chemistry", "mathematics"] as const).map(subjectId => {
            const meta = SUBJECT_META[subjectId];
            const subjectData = subjectSummary[subjectId];
            const total = subjectData?.total || 0;
            const completed = subjectData?.completed || 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const Icon = meta.icon;

            return (
              <Link key={subjectId} href={`/subject/${subjectId}`}>
                <div className={`${meta.bg} chapter-card group`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground text-sm">{meta.label}</div>
                      <div className="text-xs text-muted-foreground">{completed}/{total} chapters</div>
                    </div>
                    <div className={`text-lg font-bold ${meta.color}`}>{Math.round(pct)}%</div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Completed: {completed}</span>
                    <span>In Progress: {subjectData?.inProgress || 0}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Next chapters to study */}


        {/* Analytics */}
        {analytics && (
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {/* Score trend */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Performance Overview
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Best Score</span>
                  <span className="font-semibold text-green-400">{analytics.bestScore ? `${Math.round(analytics.bestScore)}%` : "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average Score</span>
                  <span className="font-semibold text-foreground">{analytics.avgScore ? `${Math.round(analytics.avgScore)}%` : "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pass Rate</span>
                  <span className="font-semibold text-foreground">{analytics.passRate ? `${Math.round(analytics.passRate)}%` : "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Attempts</span>
                  <span className="font-semibold text-foreground">{analytics.totalAttempts || 0}</span>
                </div>
              </div>
            </div>

            {/* Weak topics */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                Topics to Focus On
              </h3>
              {analytics.weakTopics && analytics.weakTopics.length > 0 ? (
                <div className="space-y-2">
                  {analytics.weakTopics.slice(0, 5).map((item: { topic: string; count: number }, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-yellow-900/30 border border-yellow-700/40 flex items-center justify-center text-xs text-yellow-400 flex-shrink-0">{i + 1}</span>
                      <span className="text-muted-foreground">{item.topic}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Complete more assessments to identify weak topics.</p>
              )}
            </div>
          </div>
        )}

        {/* Mock tests */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" />
              Full Mock Tests
            </h3>
            <Link href="/mock-test/jee_main_mock_1">
              <Button size="sm" variant="outline" className="gap-2">
                View All <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          <div className="flex items-start gap-3 text-sm text-muted-foreground bg-yellow-900/10 border border-yellow-700/20 rounded-lg p-3">
            <Lock className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <span>Full mock tests unlock after completing all chapters in a subject. Keep progressing!</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
