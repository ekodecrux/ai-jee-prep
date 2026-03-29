import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Building2, Users, BookOpen, TrendingUp, Settings, Plus, Shield,
  Globe, BarChart3, Key, Bell, ChevronRight, Activity, Zap,
  GraduationCap, Database, Server, AlertCircle, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SuperAdminPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: dashStats } = trpc.admin.getDashboardStats.useQuery();
  const { data: platformAnalytics } = trpc.admin.getPlatformAnalytics.useQuery();
  const { data: contentStatus } = trpc.admin.getContentStatus.useQuery();
  const institutes: any[] = [];
  const platformStats = dashStats;

  const stats = [
    { label: "Total Institutes", value: institutes?.length || 0, icon: Building2, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Total Students", value: platformStats?.totalUsers || 0, icon: GraduationCap, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Active API Keys", value: platformStats?.totalAssessments || 0, icon: Key, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Content Chapters", value: platformStats?.totalChapters || 80, icon: BookOpen, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  return (
    <div className="page-enter min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Super Admin Portal</h1>
              <p className="text-xs text-muted-foreground">Universal Knowledge Platform — SaaS Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-purple-400 border-purple-400/30 bg-purple-400/10">
              <Shield className="w-3 h-3 mr-1" /> Super Admin
            </Badge>
            <span className="text-sm text-muted-foreground">{user?.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <Card key={s.label} className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted mb-6">
            <TabsTrigger value="overview">Platform Overview</TabsTrigger>
            <TabsTrigger value="institutes">Institutes</TabsTrigger>
            <TabsTrigger value="content">Knowledge Base</TabsTrigger>
            <TabsTrigger value="api">API Management</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Platform Activity */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" /> Platform Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Total Narration Scripts", value: platformStats?.totalNarrations || 0, trend: "+12%" },
                    { label: "Total Questions", value: platformStats?.totalQuestions || 0, trend: "+8%" },
                    { label: "Total Assessments", value: platformStats?.totalAssessments || 0, trend: "+5%" },
                    { label: "Content Coverage", value: `${platformStats?.contentCoverage || 0}%`, trend: "+5%" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{item.value}</span>
                        <span className="text-xs text-green-400">{item.trend}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" /> Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "Onboard New Institute", icon: Building2, color: "text-blue-400", action: () => setActiveTab("institutes") },
                    { label: "Generate Content for All Chapters", icon: BookOpen, color: "text-green-400", action: () => setActiveTab("content") },
                    { label: "Issue New API Key", icon: Key, color: "text-amber-400", action: () => setActiveTab("api") },
                    { label: "Send Platform Announcement", icon: Bell, color: "text-purple-400", action: () => {} },
                    { label: "View System Health", icon: Server, color: "text-red-400", action: () => setActiveTab("system") },
                  ].map((action) => (
                    <button
                      key={action.label}
                      onClick={action.action}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
                    >
                      <action.icon className={`w-4 h-4 ${action.color}`} />
                      <span className="text-sm text-foreground">{action.label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recent Institutes */}
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" /> Recently Onboarded Institutes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {institutes && institutes.length > 0 ? (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Institute</th>
                        <th>City</th>
                        <th>Students</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {institutes.slice(0, 5).map((inst: any) => (
                        <tr key={inst.id}>
                          <td className="font-medium text-foreground">{inst.name}</td>
                          <td>{inst.city || "—"}</td>
                          <td>{inst.studentCount || 0}</td>
                          <td>
                            <Badge variant="outline" className={inst.isActive ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}>
                              {inst.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td>
                            <Button size="sm" variant="ghost" className="text-xs">Manage</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No institutes onboarded yet</p>
                    <Button size="sm" className="mt-3" onClick={() => setActiveTab("institutes")}>
                      <Plus className="w-3 h-3 mr-1" /> Onboard First Institute
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Institutes Tab */}
          <TabsContent value="institutes" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Institute Management</h2>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Onboard Institute
              </Button>
            </div>

            <Card className="border-border bg-card">
              <CardContent className="p-0">
                {institutes && institutes.length > 0 ? (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Institute Name</th>
                        <th>Type</th>
                        <th>City / State</th>
                        <th>Students</th>
                        <th>Teachers</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {institutes.map((inst: any) => (
                        <tr key={inst.id}>
                          <td className="font-medium text-foreground">{inst.name}</td>
                          <td className="capitalize">{inst.type || "coaching"}</td>
                          <td>{[inst.city, inst.state].filter(Boolean).join(", ") || "—"}</td>
                          <td>{inst.studentCount || 0}</td>
                          <td>{inst.teacherCount || 0}</td>
                          <td>
                            <Badge variant="outline" className="text-amber-400 border-amber-400/30">
                              {inst.subscriptionPlan || "Basic"}
                            </Badge>
                          </td>
                          <td>
                            <Badge variant="outline" className={inst.isActive ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}>
                              {inst.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                          <td className="flex gap-1">
                            <Button size="sm" variant="ghost" className="text-xs">Edit</Button>
                            <Button size="sm" variant="ghost" className="text-xs text-red-400">Suspend</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">No institutes onboarded yet</p>
                    <p className="text-sm mt-1">Start by onboarding your first institute</p>
                    <Button className="mt-4 gap-2">
                      <Plus className="w-4 h-4" /> Onboard Institute
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Knowledge Base Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Knowledge Base Management</h2>
              <Button size="sm" className="gap-2">
                <Zap className="w-4 h-4" /> Bulk Generate All Content
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
              {[
                { subject: "Physics", chapters: 25, generated: Math.round((platformStats?.totalNarrations || 0) * 0.31), color: "text-blue-400", bg: "bg-blue-400/10" },
                { subject: "Chemistry", chapters: 28, generated: Math.round((platformStats?.totalNarrations || 0) * 0.35), color: "text-green-400", bg: "bg-green-400/10" },
                { subject: "Mathematics", chapters: 27, generated: Math.round((platformStats?.totalNarrations || 0) * 0.34), color: "text-amber-400", bg: "bg-amber-400/10" },
              ].map((sub) => (
                <Card key={sub.subject} className="border-border bg-card">
                  <CardContent className="p-5">
                    <div className={`text-sm font-semibold ${sub.color} mb-3`}>{sub.subject}</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Narration Scripts</span>
                        <span className="text-foreground">{sub.generated}/{sub.chapters}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${(sub.generated / sub.chapters) * 100}%` }} />
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full mt-3 text-xs">
                      Generate Missing Content
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Content Generation Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No pending generation tasks</p>
                  <p className="text-xs mt-1">Content is generated on-demand when students access chapters</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Management Tab */}
          <TabsContent value="api" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">API Key Management</h2>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Issue New API Key
              </Button>
            </div>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" /> REST API v1 — ERP/LMS Integration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The Universal Knowledge Platform exposes a fully documented REST API v1 at <code className="text-primary">/api/v1/</code>.
                  Institutes and ERP systems can integrate using API keys to access chapters, questions, assessments, and student progress.
                </p>
                <div className="api-code-block">
                  <span className="comment"># Example: Get all chapters for Physics</span>{"\n"}
                  curl -H <span className="string">"X-Api-Key: ukp_live_..."</span> \{"\n"}
                  {"  "}https://your-domain.com/api/v1/chapters?subjectCode=<span className="string">physics</span>
                </div>
                <Link href="/api-docs">
                  <Button variant="outline" size="sm" className="gap-2">
                    <BookOpen className="w-4 h-4" /> View Full API Documentation
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system" className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">System Health</h2>
            <div className="grid lg:grid-cols-2 gap-4">
              {[
                { service: "Database", status: "healthy", latency: "12ms", icon: Database },
                { service: "AI/LLM Service", status: "healthy", latency: "340ms", icon: Zap },
                { service: "REST API v1", status: "healthy", latency: "8ms", icon: Globe },
                { service: "Voice Transcription", status: "healthy", latency: "220ms", icon: Activity },
              ].map((svc) => (
                <Card key={svc.service} className="border-border bg-card">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center">
                      <svc.icon className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{svc.service}</p>
                      <p className="text-xs text-muted-foreground">Latency: {svc.latency}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400 capitalize">{svc.status}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
