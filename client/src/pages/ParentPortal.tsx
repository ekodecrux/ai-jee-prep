import { useState } from "react";
import { useLocation } from "wouter";
import ReportCard from "@/components/ReportCard";
import { CreditCard, CheckCircle, XCircle, Clock as ClockIcon } from "lucide-react";
import PlatformLayout from "@/components/PlatformLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users, BookOpen, BarChart3, Bell, TrendingUp, Calendar,
  CheckCircle2, AlertCircle, MessageSquare, ChevronRight,
  Heart, Star, Award, Clock, GraduationCap, Target,
  Video, FileText, ExternalLink, BookMarked
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function ParentPortal() {
  const { user } = useAuth();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");


  const { data: heatmapRaw } = trpc.analytics.getHeatmap.useQuery({});
  const { data: prediction } = trpc.analytics.getPrediction.useQuery({ examId: "jee_main" });
  const { data: lessonPlan } = trpc.lessonPlan.getPlanProgress.useQuery();
  // ERP-based lesson plans and live classes for child's class
  const { data: erpLessonPlans } = trpc.lessonPlansErp.list.useQuery(
    { instituteId: 0, classId: 0 },
    { enabled: false } // will be enabled once we have child's classId
  );
  const { data: upcomingClasses } = trpc.onlineClasses.list.useQuery(
    { instituteId: 0, classId: 0 },
    { enabled: false } // will be enabled once we have child's classId
  );

  const heatmapData = heatmapRaw?.chapters || [];
  const greenChapters = heatmapRaw?.summary?.green || 0;
  const amberChapters = heatmapRaw?.summary?.amber || 0;
  const redChapters = heatmapRaw?.summary?.red || 0;
  const totalAttempted = greenChapters + amberChapters + redChapters;

  return (
    <PlatformLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor your child's academic progress and activities</p>
        </div>
        {/* Child Progress Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Chapters Mastered", value: greenChapters, icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
            { label: "Needs Attention", value: amberChapters + redChapters, icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-400/10" },
            { label: "Predicted JEE Score", value: prediction?.predictedScore ? `${prediction.predictedScore}/360` : "—", icon: Target, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "Study Streak", value: `0 days`, icon: Award, color: "text-purple-400", bg: "bg-purple-400/10" },
          ].map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted mb-6 flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="heatmap">Chapter Heatmap</TabsTrigger>
            <TabsTrigger value="lesson-plans">Lesson Plans</TabsTrigger>
            <TabsTrigger value="live-classes">Live Classes</TabsTrigger>
            <TabsTrigger value="schedule">Study Schedule</TabsTrigger>
            <TabsTrigger value="reports">Weekly Reports</TabsTrigger>
            <TabsTrigger value="report-card">Report Card</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="fees">Fee Payments</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Prediction Card */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-400" /> JEE Score Prediction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {prediction ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-foreground mb-1">
                          {prediction.predictedScore}<span className="text-lg text-muted-foreground">/360</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Predicted JEE Main Score</p>
                        <Badge variant="outline" className={`mt-2 ${(prediction.confidencePercent || 0) >= 70 ? "text-green-400 border-green-400/30" : (prediction.confidencePercent || 0) >= 40 ? "text-amber-400 border-amber-400/30" : "text-red-400 border-red-400/30"}`}>
                          {(prediction.confidencePercent || 0)}% confidence
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: "Physics", score: (prediction.subjectScores as any)?.physics?.predicted || 0, max: 120 },
                          { label: "Chemistry", score: (prediction.subjectScores as any)?.chemistry?.predicted || 0, max: 120 },
                          { label: "Mathematics", score: (prediction.subjectScores as any)?.mathematics?.predicted || 0, max: 120 },
                        ].map((s) => (
                          <div key={s.label}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{s.label}</span>
                              <span className="text-foreground">{s.score}/{s.max}</span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress-bar-fill" style={{ width: `${(s.score / s.max) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Prediction available after 5+ chapters completed</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" /> Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {heatmapData && heatmapData.length > 0 ? (
                    <div className="space-y-2">
                      {heatmapData.slice(0, 5).map((ch: any) => (
                        <div key={ch.chapterId} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ch.colorBand === "green" ? "bg-green-400" : ch.colorBand === "amber" ? "bg-amber-400" : ch.colorBand === "red" ? "bg-red-400" : "bg-muted"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{ch.title}</p>
                            <p className="text-xs text-muted-foreground">Score: {ch.assessmentAvgScore || 0}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No activity yet — encourage your child to start studying!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {false && (
              <Card className="border-amber-400/20 bg-amber-400/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-amber-400">
                    <AlertCircle className="w-4 h-4" /> Attention Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[].map((alert: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">{alert}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Heatmap */}
          <TabsContent value="heatmap" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Chapter Performance Heatmap</h2>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> ≥80% Mastered</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> 60–79% Improving</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> &lt;60% Needs Help</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-muted inline-block" /> Not Started</span>
              </div>
            </div>
            {["Physics", "Chemistry", "Mathematics"].map((subject) => {
              const subjectChapters = heatmapData?.filter((c: any) => c.subjectId?.toLowerCase().includes(subject.toLowerCase())) || [];
              return (
                <Card key={subject} className="border-border bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">{subject}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="heatmap-grid">
                      {subjectChapters.map((ch: any) => (
                        <div
                          key={ch.chapterId}
                          className={`heatmap-cell ${ch.colorBand || "unstarted"}`}
                          title={`${ch.title}: ${ch.assessmentAvgScore || 0}%`}
                        >
                          <span className="text-xs font-medium">{ch.chapterNo}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Lesson Plans (read-only for parent) */}
          <TabsContent value="lesson-plans" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Child's Lesson Plans</h2>
              <p className="text-sm text-gray-500 mt-1">View what your child's teacher has planned — objectives, activities, and homework for each class day.</p>
            </div>
            {erpLessonPlans && erpLessonPlans.length > 0 ? (
              <div className="space-y-4">
                {erpLessonPlans.map((lp: any) => (
                  <Card key={lp.id} className="border-border shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{lp.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{lp.date} · {lp.estimatedMinutes || 45} min</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          lp.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>{lp.status === "published" ? "Published" : "Draft"}</span>
                      </div>
                      {lp.objectives && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Learning Objectives</p>
                          <p className="text-sm text-gray-700">{lp.objectives}</p>
                        </div>
                      )}
                      {lp.homework && (
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <BookMarked className="w-3 h-3" /> Homework
                          </p>
                          <p className="text-sm text-amber-900">{lp.homework}</p>
                        </div>
                      )}
                      {lp.activities && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Activities</p>
                          <p className="text-sm text-gray-600">{lp.activities}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-gray-600">No lesson plans available yet</p>
                <p className="text-sm mt-1 max-w-sm mx-auto">Once your child is enrolled in a class and the teacher publishes lesson plans, they will appear here for you to review.</p>
              </div>
            )}
          </TabsContent>

          {/* Live Classes (read-only for parent) */}
          <TabsContent value="live-classes" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Live Classes</h2>
              <p className="text-sm text-gray-500 mt-1">View your child's scheduled online classes. Join links are visible to students only.</p>
            </div>
            {upcomingClasses && upcomingClasses.length > 0 ? (
              <div className="space-y-3">
                {upcomingClasses.map((cls: any) => (
                  <Card key={cls.id} className="border-border shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <Video className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{cls.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {cls.scheduledAt ? new Date(cls.scheduledAt).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Time TBD"}
                          {cls.durationMinutes ? ` · ${cls.durationMinutes} min` : ""}
                        </p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                        cls.status === "live" ? "bg-red-100 text-red-700" :
                        cls.status === "scheduled" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                      }`}>
                        {cls.status === "live" ? "🔴 Live Now" : cls.status === "scheduled" ? "Scheduled" : "Ended"}
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium text-gray-600">No upcoming classes scheduled</p>
                <p className="text-sm mt-1 max-w-sm mx-auto">Your child's teacher will schedule live online classes here. You'll be able to see the schedule and timing.</p>
              </div>
            )}
          </TabsContent>

          {/* Schedule */}
          <TabsContent value="schedule" className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">20-Month Study Schedule</h2>
            {lessonPlan ? (
              <Card className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Month Progress</span>
                      <span className="font-semibold text-foreground">{lessonPlan.currentMonth || 1} / 20</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${((lessonPlan.currentMonth || 1) / 20) * 100}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {lessonPlan.completedDays || 0} days completed · {lessonPlan.onTrack ? "On track ✓" : "Behind schedule"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Study plan not yet started</p>
              </div>
            )}
          </TabsContent>

          {/* Weekly Reports */}
          <TabsContent value="reports" className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Weekly Performance Reports</h2>
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Weekly reports will appear here</p>
              <p className="text-sm mt-1">Reports are generated every Sunday with a full summary of the week's performance</p>
            </div>
          </TabsContent>

          <TabsContent value="report-card" className="space-y-6">
            <ReportCard mode="parent" />
          </TabsContent>

          {/* Attendance */}
          <TabsContent value="attendance" className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Child's Attendance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {[
                { label: "Total Classes", value: "—", color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Present", value: "—", color: "text-green-600", bg: "bg-green-50" },
                { label: "Attendance %", value: "—", color: "text-indigo-600", bg: "bg-indigo-50" },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-opacity-20`}>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-700 font-medium mb-1">
                <AlertCircle className="w-4 h-4" /> Attendance Tracking
              </div>
              <p className="text-sm text-amber-600">Detailed attendance records will appear here once the Institute Admin marks attendance for your child's class.</p>
            </div>
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments" className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Child's Assignments</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
                <FileText className="w-4 h-4" /> Assignment Overview
              </div>
              <p className="text-sm text-blue-600">Assignments created by teachers for your child's class will appear here. You can track submission status and grades.</p>
            </div>
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No assignments found yet</p>
            </div>
          </TabsContent>

          {/* Progress */}
          <TabsContent value="progress" className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Academic Progress</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-500" /> Chapter Completion</h3>
                <div className="space-y-3">
                  {[
                    { label: "Physics", green: greenChapters, total: 25 },
                    { label: "Chemistry", green: 0, total: 28 },
                    { label: "Mathematics", green: 0, total: 27 },
                  ].map(s => (
                    <div key={s.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{s.label}</span>
                        <span className="text-gray-800 font-medium">{s.green}/{s.total}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${(s.green / s.total) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Target className="w-4 h-4 text-indigo-500" /> JEE Readiness</h3>
                {prediction ? (
                  <div className="text-center">
                    <div className="text-5xl font-bold text-indigo-600 mb-1">{prediction.predictedScore}<span className="text-xl text-gray-400">/360</span></div>
                    <p className="text-sm text-gray-500">Predicted JEE Main Score</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      {["Physics", "Chemistry", "Mathematics"].map((sub, i) => (
                        <div key={sub} className="bg-gray-50 rounded-lg p-2">
                          <div className="text-lg font-bold text-gray-800">{(prediction.subjectScores as any)?.[sub.toLowerCase()]?.predicted || 0}</div>
                          <div className="text-xs text-gray-400">{sub.slice(0, 4)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Target className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Available after 5+ chapters completed</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Alerts */}
          <TabsContent value="alerts" className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Alerts &amp; Notifications</h2>
            <div className="space-y-3">
              {(redChapters + amberChapters) > 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                    <AlertCircle className="w-4 h-4" /> Low Performance Alert
                  </div>
                  <p className="text-sm text-red-600">{redChapters} chapter(s) scored below 60%. Encourage your child to revisit these topics.</p>
                </div>
              ) : null}
              {amberChapters > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-700 font-medium mb-1">
                    <AlertCircle className="w-4 h-4" /> Improvement Needed
                  </div>
                  <p className="text-sm text-amber-600">{amberChapters} chapter(s) scored between 60–79%. More practice recommended.</p>
                </div>
              ) : null}
              {(redChapters + amberChapters) === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                    <CheckCircle2 className="w-4 h-4" /> All Clear
                  </div>
                  <p className="text-sm text-green-600">No alerts at the moment. Your child is on track!</p>
                </div>
              ) : null}
            </div>
          </TabsContent>

          {/* Fee Payments — Stripe powered */}
          <TabsContent value="fees" className="space-y-6">
            <ParentFeesTab />
          </TabsContent>
        </Tabs>
      </div>
    </PlatformLayout>
  );
}

// ─── Parent Fees Tab — Stripe Checkout ───────────────────────────────────────────────
function ParentFeesTab() {
  const { isAuthenticated } = useAuth();
  const [payingId, setPayingId] = useState<number | null>(null);

  // Get parent's linked children via erp
  const { data: parentDash } = trpc.erp.getParentDashboard.useQuery(undefined, { enabled: isAuthenticated });
  const children = (parentDash as any)?.children || [];
  const firstChild = children[0];
  const childStudentId = firstChild?.id ?? null; // institute_members.id

  // Fetch fee records for the child
  const { data: feeList, isLoading } = trpc.feePayments.getMyChildFees.useQuery(
    { studentId: childStudentId! },
    { enabled: !!childStudentId }
  );

  const createCheckout = trpc.feePayments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        toast.success("Redirecting to secure payment page...");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initiate payment");
    },
    onSettled: () => setPayingId(null),
  });

  const handlePay = (feeRecordId: number) => {
    setPayingId(feeRecordId);
    createCheckout.mutate({ feeRecordId, origin: window.location.origin });
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    paid:    { label: "Paid",    color: "text-green-700 bg-green-50 border-green-200",  icon: CheckCircle },
    pending: { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200",  icon: ClockIcon },
    overdue: { label: "Overdue", color: "text-red-700 bg-red-50 border-red-200",        icon: XCircle },
    waived:  { label: "Waived",  color: "text-gray-500 bg-gray-50 border-gray-200",     icon: CheckCircle },
  };

  if (!childStudentId) return (
    <div className="text-center py-20 text-gray-400">
      <CreditCard className="w-14 h-14 mx-auto mb-4 opacity-20" />
      <p className="font-semibold text-gray-600 text-lg">No child linked</p>
      <p className="text-sm mt-2">Your account is not yet linked to a student. Contact your institute admin.</p>
    </div>
  );

  if (isLoading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
  );

  const totalDue = (feeList || []).filter((f: any) => f.status === "pending" || f.status === "overdue").reduce((s: number, f: any) => s + f.amount, 0);
  const totalPaid = (feeList || []).filter((f: any) => f.status === "paid").reduce((s: number, f: any) => s + f.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Fee Payments</h2>
        <p className="text-sm text-gray-500 mt-1">Pay your child's institute fees securely via Stripe</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-5">
            <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">Amount Due</p>
            <p className="text-3xl font-bold text-amber-700 mt-1">₹{totalDue.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-5">
            <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Total Paid</p>
            <p className="text-3xl font-bold text-green-700 mt-1">₹{totalPaid.toLocaleString("en-IN")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Fee records list */}
      {!feeList || feeList.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-gray-600">No fee records found</p>
          <p className="text-sm mt-1">Your institute admin will add fee records here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feeList.map((fee: any) => {
            const cfg = statusConfig[fee.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            const isPaying = payingId === fee.id;
            const canPay = fee.status === "pending" || fee.status === "overdue";
            return (
              <Card key={fee.id} className="border-gray-200 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {cfg.label}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">{fee.feeType.replace(/_/g, " ")}</span>
                      </div>
                      <p className="font-semibold text-gray-900">{fee.description || `${fee.feeType.replace(/_/g, " ")} Fee`}</p>
                      <p className="text-sm text-gray-500 mt-0.5">Due: {new Date(fee.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xl font-bold text-gray-900">₹{fee.amount.toLocaleString("en-IN")}</p>
                      {canPay && (
                        <Button
                          size="sm"
                          className="mt-2 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => handlePay(fee.id)}
                          disabled={isPaying || createCheckout.isPending}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {isPaying ? "Opening..." : "Pay Now"}
                        </Button>
                      )}
                    </div>
                  </div>
                  {fee.notes && <p className="text-xs text-gray-400 mt-2 border-t pt-2">{fee.notes}</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        Payments are processed securely via Stripe. Use card <strong>4242 4242 4242 4242</strong> for testing.
      </p>
    </div>
  );
}
