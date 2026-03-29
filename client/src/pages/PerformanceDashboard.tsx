import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, ReferenceLine,
} from "recharts";
import {
  TrendingUp, TrendingDown, Minus, Target, Zap, AlertTriangle,
  CheckCircle, BookOpen, Award, BarChart2, Brain, Calendar,
  ChevronRight, RefreshCw, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Heatmap Cell ─────────────────────────────────────────────────────────────
function HeatmapCell({ chapter }: { chapter: any }) {
  const colorMap = {
    green: "bg-emerald-500 border-emerald-400",
    amber: "bg-amber-400 border-amber-300",
    red: "bg-red-500 border-red-400",
    unstarted: "bg-slate-700 border-slate-600",
  };
  const band = chapter.colorBand as keyof typeof colorMap;

  return (
    <Link href={`/chapter/${chapter.chapterId}`}>
      <div
        className={`${colorMap[band]} border rounded cursor-pointer transition-all hover:scale-105 hover:z-10 relative group`}
        style={{ width: 28, height: 28 }}
        title={`${chapter.title} — ${Math.round(chapter.heatmapScore)}%`}
      >
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 z-20 pointer-events-none border border-slate-700">
          {chapter.title}<br />
          <span className="text-slate-300">{Math.round(chapter.heatmapScore)}%</span>
        </div>
      </div>
    </Link>
  );
}

// ─── Score Gauge ──────────────────────────────────────────────────────────────
function ScoreGauge({ score, max, label, color }: { score: number; max: number; label: string; color: string }) {
  const pct = Math.round((score / max) * 100);
  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-2">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={`${pct * 2.51} 251`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-white">{score}</span>
          <span className="text-xs text-slate-400">/{max}</span>
        </div>
      </div>
      <p className="text-sm text-slate-300">{label}</p>
    </div>
  );
}

export default function PerformanceDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: dashboard, isLoading: dashLoading, refetch: refetchDash } = trpc.analytics.getPerformanceDashboard.useQuery(undefined, { enabled: isAuthenticated });
  const { data: heatmapData, isLoading: heatmapLoading } = trpc.analytics.getHeatmap.useQuery({}, { enabled: isAuthenticated });
  const { data: mainPred } = trpc.analytics.getPrediction.useQuery({ examId: "jee_main" }, { enabled: isAuthenticated });
  const { data: advPred } = trpc.analytics.getPrediction.useQuery({ examId: "jee_advanced" }, { enabled: isAuthenticated });
  const { data: weeklyData } = trpc.analytics.getWeeklyPerformance.useQuery({ weeks: 12 }, { enabled: isAuthenticated });
  const { data: planProgress } = trpc.lessonPlan.getPlanProgress.useQuery(undefined, { enabled: isAuthenticated });

  const generatePredMutation = trpc.analytics.generatePrediction.useMutation({
    onSuccess: () => refetchDash(),
  });

  if (loading || dashLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading your performance data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <BarChart2 className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Performance Dashboard</h2>
          <p className="text-slate-400 mb-6">Sign in to view your JEE performance analytics, heatmap, and score predictions.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Sign In to Continue
          </a>
        </div>
      </div>
    );
  }

  const d = dashboard;
  const jeeReadiness = d?.jeeReadiness || 0;
  const readinessColor = jeeReadiness >= 80 ? "#10b981" : jeeReadiness >= 60 ? "#f59e0b" : "#ef4444";

  // Radar chart data
  const radarData = [
    { subject: "Physics", score: d?.subjectReadiness?.physics || 0, fullMark: 100 },
    { subject: "Chemistry", score: d?.subjectReadiness?.chemistry || 0, fullMark: 100 },
    { subject: "Mathematics", score: d?.subjectReadiness?.mathematics || 0, fullMark: 100 },
  ];

  // Weekly trend chart
  const weeklyChartData = (weeklyData || []).map(w => ({
    week: `W${w.weekNumber}`,
    avg: Math.round(w.avgScore || 0),
    physics: Math.round(w.physicsAvg || 0),
    chemistry: Math.round(w.chemistryAvg || 0),
    mathematics: Math.round(w.mathematicsAvg || 0),
  }));

  // Score history chart
  const scoreHistory = (mainPred?.scoreHistory as Array<{ date: string; score: number }>) || [];
  const scoreChartData = scoreHistory.map(s => ({
    date: s.date.slice(5), // MM-DD
    score: s.score,
  }));

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-indigo-400" />
              Performance Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Real-time JEE readiness analytics for {user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => generatePredMutation.mutate({ examId: "jee_main" })}
              disabled={generatePredMutation.isPending}
              className="border-slate-700 text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${generatePredMutation.isPending ? "animate-spin" : ""}`} />
              Update Prediction
            </Button>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-slate-400">← Back</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Top KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* JEE Readiness */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 col-span-2 md:col-span-1">
            <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider">JEE Readiness</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold" style={{ color: readinessColor }}>{jeeReadiness}%</span>
            </div>
            <Progress value={jeeReadiness} className="mt-2 h-2" />
            <p className="text-xs text-slate-500 mt-1">
              {jeeReadiness >= 80 ? "Excellent — keep it up!" : jeeReadiness >= 60 ? "Good progress — push harder" : "Needs improvement"}
            </p>
          </div>

          {/* Chapters */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider">Chapters Done</p>
            <span className="text-3xl font-bold text-white">{d?.completedChapters || 0}</span>
            <span className="text-slate-500 text-lg">/80</span>
            <div className="flex gap-1 mt-2">
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-300">{d?.heatmapSummary?.green || 0} green</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900 text-amber-300">{d?.heatmapSummary?.amber || 0} amber</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-900 text-red-300">{d?.heatmapSummary?.red || 0} red</span>
            </div>
          </div>

          {/* JEE Main Prediction */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider">JEE Main Predicted</p>
            <span className="text-3xl font-bold text-indigo-400">{mainPred?.predictedScore || "—"}</span>
            <span className="text-slate-500 text-lg">/300</span>
            {mainPred && (
              <p className="text-xs text-slate-500 mt-1">
                Rank ~{mainPred.predictedRank?.toLocaleString() || "?"}
              </p>
            )}
          </div>

          {/* Plan Progress */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <p className="text-slate-400 text-xs mb-2 uppercase tracking-wider">Study Plan</p>
            {planProgress?.planExists ? (
              <>
                <span className="text-3xl font-bold text-white">{planProgress.completionPercent}%</span>
                <p className="text-xs text-slate-500 mt-1">Month {planProgress.currentMonth}/20</p>
                <div className={`text-xs mt-1 flex items-center gap-1 ${planProgress.onTrack ? "text-emerald-400" : "text-amber-400"}`}>
                  {planProgress.onTrack ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {planProgress.onTrack ? "On track" : `${planProgress.missedDays} days missed`}
                </div>
              </>
            ) : (
              <Link href="/study-plan">
                <Button size="sm" variant="outline" className="border-slate-700 text-slate-300 text-xs mt-1">
                  Start Plan
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-900 border border-slate-800 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600">Overview</TabsTrigger>
            <TabsTrigger value="heatmap" className="data-[state=active]:bg-indigo-600">Chapter Heatmap</TabsTrigger>
            <TabsTrigger value="prediction" className="data-[state=active]:bg-indigo-600">Score Prediction</TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-indigo-600">Weekly Trends</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Radar Chart */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" /> Subject Readiness
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
                    <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { label: "Physics", value: d?.subjectReadiness?.physics || 0, color: "#3b82f6" },
                    { label: "Chemistry", value: d?.subjectReadiness?.chemistry || 0, color: "#10b981" },
                    { label: "Maths", value: d?.subjectReadiness?.mathematics || 0, color: "#f59e0b" },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}%</div>
                      <div className="text-xs text-slate-500">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strongest Chapters */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-400" /> Strongest Chapters
                </h3>
                <div className="space-y-2">
                  {(d?.strongestChapters || []).length === 0 && (
                    <p className="text-slate-500 text-sm">Complete assessments to see your strongest chapters.</p>
                  )}
                  {(d?.strongestChapters || []).map((ch: any) => (
                    <div key={ch.chapterId} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 truncate max-w-[160px]">{ch.chapterId}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${ch.heatmapScore}%` }} />
                        </div>
                        <span className="text-xs text-emerald-400 w-8 text-right">{Math.round(ch.heatmapScore)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weakest Chapters */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" /> Needs Attention
                </h3>
                <div className="space-y-2">
                  {(d?.weakestChapters || []).length === 0 && (
                    <p className="text-slate-500 text-sm">No weak chapters identified yet.</p>
                  )}
                  {(d?.weakestChapters || []).map((ch: any) => (
                    <div key={ch.chapterId} className="flex items-center justify-between">
                      <span className="text-sm text-slate-300 truncate max-w-[160px]">{ch.chapterId}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 rounded-full" style={{ width: `${ch.heatmapScore}%` }} />
                        </div>
                        <span className="text-xs text-red-400 w-8 text-right">{Math.round(ch.heatmapScore)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Attempts */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 mt-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" /> Recent Attempts
              </h3>
              {(d?.recentAttempts || []).length === 0 ? (
                <p className="text-slate-500 text-sm">No attempts yet. Start a chapter assessment to see results here.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800">
                        <th className="text-left py-2 pr-4">Chapter</th>
                        <th className="text-left py-2 pr-4">Type</th>
                        <th className="text-right py-2 pr-4">Score</th>
                        <th className="text-right py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(d?.recentAttempts || []).map((a: any) => (
                        <tr key={a.id} className="border-b border-slate-800/50">
                          <td className="py-2 pr-4 text-slate-300">{a.chapterId || "Mock Test"}</td>
                          <td className="py-2 pr-4">
                            <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">{a.attemptType}</Badge>
                          </td>
                          <td className="py-2 pr-4 text-right">
                            <span className={`font-medium ${(a.percentage || 0) >= 80 ? "text-emerald-400" : (a.percentage || 0) >= 60 ? "text-amber-400" : "text-red-400"}`}>
                              {Math.round(a.percentage || 0)}%
                            </span>
                          </td>
                          <td className="py-2 text-right text-slate-500 text-xs">
                            {new Date(a.startedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Heatmap Tab */}
          <TabsContent value="heatmap">
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">80-Chapter Performance Heatmap</h3>
                  <p className="text-slate-400 text-sm mt-1">Green ≥ 80% · Amber 60–79% · Red &lt; 60% · Grey = Not started</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Green ({d?.heatmapSummary?.green || 0})</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Amber ({d?.heatmapSummary?.amber || 0})</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Red ({d?.heatmapSummary?.red || 0})</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-700 inline-block" /> Unstarted ({d?.heatmapSummary?.unstarted || 0})</span>
                </div>
              </div>

              {heatmapLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Physics */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Physics (25 chapters)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(heatmapData?.chapters || []).filter((c: any) => c.subjectId === "physics").map((ch: any) => (
                        <HeatmapCell key={ch.chapterId} chapter={ch} />
                      ))}
                    </div>
                  </div>

                  {/* Chemistry */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Chemistry (28 chapters)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(heatmapData?.chapters || []).filter((c: any) => c.subjectId === "chemistry").map((ch: any) => (
                        <HeatmapCell key={ch.chapterId} chapter={ch} />
                      ))}
                    </div>
                  </div>

                  {/* Mathematics */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Mathematics (27 chapters)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(heatmapData?.chapters || []).filter((c: any) => c.subjectId === "mathematics").map((ch: any) => (
                        <HeatmapCell key={ch.chapterId} chapter={ch} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 20-month target */}
              <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-white">20-Month Target</span>
                </div>
                <p className="text-slate-400 text-sm">
                  All 80 chapters must be <span className="text-emerald-400 font-medium">green (≥80%)</span> by Month 20.
                  You currently have <span className="text-emerald-400 font-medium">{d?.heatmapSummary?.green || 0}</span> green chapters.
                  {(d?.heatmapSummary?.green || 0) < 80 && (
                    <> You need <span className="text-amber-400 font-medium">{80 - (d?.heatmapSummary?.green || 0)}</span> more chapters to reach the target.</>
                  )}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Prediction Tab */}
          <TabsContent value="prediction">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* JEE Main Prediction */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-400" /> JEE Main Prediction
                </h3>
                {mainPred ? (
                  <>
                    <div className="flex items-center justify-center gap-8 mb-6">
                      <ScoreGauge score={mainPred.conservativeScore || 0} max={300} label="Conservative" color="#ef4444" />
                      <ScoreGauge score={mainPred.predictedScore} max={300} label="Predicted" color="#6366f1" />
                      <ScoreGauge score={mainPred.optimisticScore || 0} max={300} label="Optimistic" color="#10b981" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Predicted Rank</span>
                        <span className="text-white font-medium">~{mainPred.predictedRank?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Confidence</span>
                        <span className="text-white font-medium">{mainPred.confidencePercent}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Data Points Used</span>
                        <span className="text-white font-medium">{mainPred.dataPointsUsed} chapters assessed</span>
                      </div>
                    </div>

                    {/* Subject breakdown */}
                    {mainPred.subjectScores && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Subject Breakdown</p>
                        {Object.entries(mainPred.subjectScores as Record<string, any>).map(([subj, data]) => (
                          <div key={subj} className="flex items-center gap-3">
                            <span className="text-sm text-slate-400 w-24 capitalize">{subj}</span>
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${(data.predicted / data.max) * 100}%`,
                                  backgroundColor: subj === "physics" ? "#3b82f6" : subj === "chemistry" ? "#10b981" : "#f59e0b",
                                }}
                              />
                            </div>
                            <span className="text-sm text-white w-16 text-right">{data.predicted}/{data.max}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 mb-4">No prediction yet. Complete some chapter assessments first.</p>
                    <Button onClick={() => generatePredMutation.mutate({ examId: "jee_main" })} disabled={generatePredMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                      Generate Prediction
                    </Button>
                  </div>
                )}
              </div>

              {/* Recommendations + Score History */}
              <div className="space-y-4">
                {/* Weak Chapters */}
                {mainPred?.weakChapters && (mainPred.weakChapters as any[]).length > 0 && (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Priority Chapters
                    </h3>
                    <div className="space-y-2">
                      {(mainPred.weakChapters as any[]).map((ch: any) => (
                        <div key={ch.chapterId} className="flex items-center justify-between p-2 bg-slate-800 rounded-lg">
                          <div>
                            <p className="text-sm text-white">{ch.title}</p>
                            <p className="text-xs text-slate-500">Current: {ch.currentScore}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-emerald-400">+{ch.potentialGain} marks</p>
                            <Link href={`/chapter/${ch.chapterId}`}>
                              <Button size="sm" variant="ghost" className="text-xs text-indigo-400 h-6 px-2">Study →</Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {mainPred?.recommendations && (mainPred.recommendations as string[]).length > 0 && (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-400" /> AI Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {(mainPred.recommendations as string[]).map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <ChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Score History */}
                {scoreChartData.length > 1 && (
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-5">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" /> Score Trajectory
                    </h3>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={scoreChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} />
                        <YAxis domain={[0, 300]} tick={{ fill: "#64748b", fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff" }} />
                        <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "Target 200", fill: "#f59e0b", fontSize: 10 }} />
                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Weekly Trends Tab */}
          <TabsContent value="trends">
            <div className="space-y-6">
              {/* Weekly avg score chart */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Weekly Performance Trend</h3>
                {weeklyChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-500">
                    No weekly data yet. Complete assessments to see trends.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="week" tick={{ fill: "#64748b", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff" }} />
                      <Legend wrapperStyle={{ color: "#94a3b8" }} />
                      <ReferenceLine y={80} stroke="#10b981" strokeDasharray="3 3" label={{ value: "Target 80%", fill: "#10b981", fontSize: 10 }} />
                      <Line type="monotone" dataKey="physics" stroke="#3b82f6" strokeWidth={2} name="Physics" />
                      <Line type="monotone" dataKey="chemistry" stroke="#10b981" strokeWidth={2} name="Chemistry" />
                      <Line type="monotone" dataKey="mathematics" stroke="#f59e0b" strokeWidth={2} name="Mathematics" />
                      <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" name="Overall Avg" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Weekly stats table */}
              {weeklyData && weeklyData.length > 0 && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Weekly Stats</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800">
                          <th className="text-left py-2 pr-4">Week</th>
                          <th className="text-right py-2 pr-4">Avg Score</th>
                          <th className="text-right py-2 pr-4">Assessments</th>
                          <th className="text-right py-2 pr-4">Green</th>
                          <th className="text-right py-2 pr-4">Amber</th>
                          <th className="text-right py-2">Red</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyData.map(w => (
                          <tr key={w.id} className="border-b border-slate-800/50">
                            <td className="py-2 pr-4 text-slate-300">W{w.weekNumber} ({w.weekStartDate})</td>
                            <td className="py-2 pr-4 text-right">
                              <span className={`font-medium ${(w.avgScore || 0) >= 80 ? "text-emerald-400" : (w.avgScore || 0) >= 60 ? "text-amber-400" : "text-red-400"}`}>
                                {Math.round(w.avgScore || 0)}%
                              </span>
                            </td>
                            <td className="py-2 pr-4 text-right text-slate-400">{w.assessmentsTaken}</td>
                            <td className="py-2 pr-4 text-right text-emerald-400">{w.greenChapters}</td>
                            <td className="py-2 pr-4 text-right text-amber-400">{w.amberChapters}</td>
                            <td className="py-2 text-right text-red-400">{w.redChapters}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
