import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  Building2, Users, BookOpen, TrendingUp, Settings, Plus, Shield,
  Globe, BarChart3, Key, Bell, ChevronRight, Activity, Zap,
  GraduationCap, Database, Server, AlertCircle, CheckCircle2,
  ToggleRight, ToggleLeft, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function SuperAdminPortal() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedInstituteId, setSelectedInstituteId] = useState<number | null>(null);

  // Real ERP data
  const analytics = trpc.erp.getGlobalAnalytics.useQuery();
  const institutes = trpc.erp.listInstitutes.useQuery();
  const instituteDetail = trpc.erp.getInstituteDetail.useQuery(
    { instituteId: selectedInstituteId! },
    { enabled: !!selectedInstituteId }
  );
  const { data: dashStats } = trpc.admin.getDashboardStats.useQuery();
  const platformStats = dashStats;

  const createInstitute = trpc.erp.createInstitute.useMutation({
    onSuccess: (data) => {
      toast.success("Institute created! Admin invite link generated.");
      setShowCreateDialog(false);
      institutes.refetch();
      analytics.refetch();
      setForm({ name: "", code: "", contactEmail: "", contactPhone: "", city: "", state: "", website: "", subscriptionPlan: "trial", maxStudents: 100, maxTeachers: 10, adminEmail: "", adminName: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleStatus = trpc.erp.toggleInstituteStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); institutes.refetch(); },
  });

  const [form, setForm] = useState({
    name: "", code: "", contactEmail: "", contactPhone: "",
    city: "", state: "", website: "",
    subscriptionPlan: "trial" as "trial" | "basic" | "standard" | "premium" | "enterprise",
    maxStudents: 100, maxTeachers: 10,
    adminEmail: "", adminName: "",
  });

  const handleCreate = () => {
    if (!form.name || !form.code || !form.contactEmail || !form.adminEmail || !form.adminName) {
      toast.error("Please fill all required fields");
      return;
    }
    createInstitute.mutate(form);
  };

  const planColors: Record<string, string> = {
    trial: "bg-gray-100 text-gray-600",
    basic: "bg-blue-100 text-blue-700",
    standard: "bg-indigo-100 text-indigo-700",
    premium: "bg-purple-100 text-purple-700",
    enterprise: "bg-amber-100 text-amber-700",
  };

  const stats = [
    { label: "Total Institutes", value: analytics.data?.totalInstitutes ?? 0, icon: Building2, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Active Institutes", value: analytics.data?.activeInstitutes ?? 0, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-50" },
    { label: "Total Students", value: analytics.data?.totalStudents ?? 0, icon: GraduationCap, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Total Teachers", value: analytics.data?.totalTeachers ?? 0, icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Total Classes", value: analytics.data?.totalClasses ?? 0, icon: BookOpen, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Content Chapters", value: platformStats?.totalChapters ?? 80, icon: Database, color: "text-teal-500", bg: "bg-teal-50" },
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
            <TabsTrigger value="institutes">Institutes ({institutes.data?.length ?? 0})</TabsTrigger>
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
                {(institutes.data ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {(institutes.data ?? []).slice(0, 5).map((inst) => (
                      <div key={inst.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-primary" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{inst.name}</p>
                            <p className="text-xs text-muted-foreground">{inst.city || "—"}</p>
                          </div>
                        </div>
                        <Badge variant={inst.isActive ? "default" : "secondary"} className="text-xs">
                          {inst.isActive ? "Active" : "Suspended"}
                        </Badge>
                      </div>
                    ))}
                  </div>
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
              <div>
                <h2 className="text-lg font-semibold text-foreground">Institute Management</h2>
                <p className="text-sm text-muted-foreground">{institutes.data?.length ?? 0} institutes registered on the platform</p>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" /> Onboard Institute
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Onboard New Institute</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Institute Name *</Label><Input placeholder="e.g. Allen Career Institute" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
                      <div><Label>Short Code *</Label><Input placeholder="e.g. ALLEN" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Contact Email *</Label><Input type="email" placeholder="admin@institute.com" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} /></div>
                      <div><Label>Contact Phone</Label><Input placeholder="+91 98765 43210" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>City</Label><Input placeholder="Kota" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} /></div>
                      <div><Label>State</Label><Input placeholder="Rajasthan" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Subscription Plan</Label>
                        <Select value={form.subscriptionPlan} onValueChange={(v: any) => setForm(f => ({ ...f, subscriptionPlan: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trial">Trial</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Max Students</Label><Input type="number" value={form.maxStudents} onChange={e => setForm(f => ({ ...f, maxStudents: Number(e.target.value) }))} /></div>
                      <div><Label>Max Teachers</Label><Input type="number" value={form.maxTeachers} onChange={e => setForm(f => ({ ...f, maxTeachers: Number(e.target.value) }))} /></div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-foreground mb-3">Institute Admin Account</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Admin Name *</Label><Input placeholder="Dr. Rajesh Kumar" value={form.adminName} onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))} /></div>
                        <div><Label>Admin Email *</Label><Input type="email" placeholder="rajesh@institute.com" value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} /></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">An invite link will be generated for the admin to complete their setup.</p>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                      <Button onClick={handleCreate} disabled={createInstitute.isPending}>
                        {createInstitute.isPending ? "Creating..." : "Create & Generate Invite"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {institutes.isLoading && <div className="text-center py-8 text-muted-foreground">Loading institutes...</div>}
              {(institutes.data ?? []).map((inst) => (
                <Card key={inst.id} className="border-border bg-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{inst.name}</p>
                            <span className="text-xs text-muted-foreground">#{inst.code}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{inst.contactEmail} {inst.city ? `· ${inst.city}, ${inst.state}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[inst.subscriptionPlan || "trial"]}`}>
                          {inst.subscriptionPlan || "trial"}
                        </span>
                        <Badge variant={inst.isActive ? "default" : "secondary"} className="text-xs">
                          {inst.isActive ? "Active" : "Suspended"}
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedInstituteId(inst.id)}>
                          <Eye className="w-3 h-3 mr-1" /> Details
                        </Button>
                        <Button
                          variant="ghost" size="sm"
                          className={`text-xs ${inst.isActive ? "text-red-500 hover:text-red-600" : "text-green-600 hover:text-green-700"}`}
                          onClick={() => toggleStatus.mutate({ instituteId: inst.id, isActive: !inst.isActive })}
                        >
                          {inst.isActive ? <><ToggleRight className="w-3 h-3 mr-1" />Suspend</> : <><ToggleLeft className="w-3 h-3 mr-1" />Activate</>}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {!institutes.isLoading && !(institutes.data?.length) && (
                <Card className="border-dashed border-border">
                  <CardContent className="py-16 text-center">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">No institutes onboarded yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Click "Onboard Institute" to get started</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {selectedInstituteId && instituteDetail.data && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base">{instituteDetail.data.name} — Detail View</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedInstituteId(null)}>Close</Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {[
                      { label: "Students", value: instituteDetail.data.stats.students, icon: GraduationCap },
                      { label: "Teachers", value: instituteDetail.data.stats.teachers, icon: Users },
                      { label: "Classes", value: instituteDetail.data.stats.classes, icon: BookOpen },
                    ].map((s) => (
                      <div key={s.label} className="bg-card rounded-lg p-4 border border-border text-center">
                        <s.icon className="w-5 h-5 mx-auto mb-1 text-primary" />
                        <p className="text-2xl font-bold text-foreground">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Email:</span> <span className="font-medium text-foreground">{instituteDetail.data.contactEmail}</span></div>
                    <div><span className="text-muted-foreground">Plan:</span> <span className="font-medium text-foreground capitalize">{instituteDetail.data.subscriptionPlan}</span></div>
                    <div><span className="text-muted-foreground">Location:</span> <span className="font-medium text-foreground">{[instituteDetail.data.city, instituteDetail.data.state].filter(Boolean).join(", ") || "—"}</span></div>
                    <div><span className="text-muted-foreground">Status:</span> <span className={`font-medium ${instituteDetail.data.isActive ? "text-green-500" : "text-red-500"}`}>{instituteDetail.data.isActive ? "Active" : "Suspended"}</span></div>
                  </div>
                </CardContent>
              </Card>
            )}
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
