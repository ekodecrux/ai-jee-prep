import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, GraduationCap, Building2, Users, BookOpen, Heart, Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

const ROLE_CONFIG = {
  super_admin: {
    icon: "👑",
    label: "Super Admin",
    color: "from-yellow-500 to-orange-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    description: "Platform owner — manage all institutes, subscriptions, and global content",
    features: ["Onboard institutes", "Manage subscriptions", "Global content control", "Platform analytics"],
  },
  institute_admin: {
    icon: "🏫",
    label: "Institute Admin",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    description: "Manage your institute — onboard teachers, students, parents, and configure exams",
    features: ["Configure exam syllabus", "Onboard staff & students", "Upload custom content", "Manage API keys"],
  },
  teacher: {
    icon: "👩‍🏫",
    label: "Teacher",
    color: "from-purple-500 to-indigo-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    description: "Manage your classes, create assessments, and track student progress",
    features: ["Class management", "Custom assessments", "Student progress tracking", "Proctoring review"],
  },
  student: {
    icon: "🎓",
    label: "Student",
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    description: "Learn from AI avatar Priya, take assessments, and track your exam preparation journey",
    features: ["AI avatar lessons", "Chapter assessments", "Performance heatmap", "Score prediction"],
  },
  parent: {
    icon: "👨‍👩‍👧",
    label: "Parent",
    color: "from-rose-500 to-pink-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    description: "Monitor your child's progress, get weekly reports, and communicate with teachers",
    features: ["Child progress view", "Weekly reports", "Teacher communication", "Heatmap overview"],
  },
};

// ─── Accept Invite Flow ────────────────────────────────────────────────────────
function AcceptInviteFlow({ token }: { token: string }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const acceptInvite = trpc.authExt.acceptInvite.useMutation({
    onSuccess: (data) => {
      toast.success(`Welcome! You've been onboarded as ${data.role}.`);
      setTimeout(() => setLocation("/"), 1500);
    },
    onError: (err: unknown) => {
      toast.error("Failed to accept invite: " + (err instanceof Error ? err.message : String(err)));
    },
  });

  const verifyToken = trpc.authExt.validateInvite.useQuery({ token }, { enabled: !!token });

  if (verifyToken.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verifying your invite...</p>
        </div>
      </div>
    );
  }

  if (verifyToken.error || !verifyToken.data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Invalid or Expired Invite</h1>
          <p className="text-muted-foreground">This invite link is invalid or has already been used. Please contact your institute admin for a new invite.</p>
          <Button onClick={() => setLocation("/")} className="gap-2">
            <ArrowRight className="h-4 w-4" /> Go to Home
          </Button>
        </div>
      </div>
    );
  }

  const invite = verifyToken.data;
  const roleConfig = ROLE_CONFIG[invite.role as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.student;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center">
          <div className={`w-20 h-20 rounded-full ${roleConfig.bg} border-2 ${roleConfig.border} flex items-center justify-center mx-auto mb-4`}>
            <span className="text-4xl">{roleConfig.icon}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">You're Invited!</h1>
          <p className="text-muted-foreground">
            You've been invited to join <strong className="text-foreground">{invite.instituteName || "ExamForge AI"}</strong> as a <strong className="text-foreground">{roleConfig.label}</strong>.
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-base">What you'll get access to:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {roleConfig.features.map(feature => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="bg-muted/30 rounded-xl p-4 text-sm text-muted-foreground">
          <p><strong className="text-foreground">Invited by:</strong> Institute Admin</p>
          <p><strong className="text-foreground">Email:</strong> {invite.email}</p>
          <p><strong className="text-foreground">Role:</strong> {roleConfig.label}</p>
        </div>

        {!user ? (
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">Please sign in to accept this invite</p>
            <Button
              className="w-full gap-2"
              onClick={() => window.location.href = `/api/oauth/login?returnTo=/onboard?token=${token}`}
            >
              <Mail className="h-4 w-4" /> Sign in to Accept Invite
            </Button>
          </div>
        ) : (
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={() => acceptInvite.mutate({ token, name: user?.name || "" })}
            disabled={acceptInvite.isPending}
          >
            {acceptInvite.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Accepting...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Accept & Join as {roleConfig.label}</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Self Enrollment Flow ──────────────────────────────────────────────────────
function SelfEnrollFlow() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"student" | "institute_admin" | "parent" | null>(null);
  const [step, setStep] = useState<"select_role" | "fill_details" | "done">("select_role");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [childName, setChildName] = useState("");
  const { user } = useAuth();

  const startOnboarding = trpc.authExt.startOnboarding.useMutation({
    onSuccess: () => {
      setStep("done");
      toast.success("Enrollment successful! Welcome to ExamForge AI.");
    },
    onError: (err: unknown) => {
      toast.error("Enrollment failed: " + (err instanceof Error ? err.message : String(err)));
    },
  });

  const handleEnroll = () => {
    if (!selectedRole) return;
    startOnboarding.mutate({
      role: selectedRole as "student" | "parent",
      name: name || user?.name || "",
    });
  };

  if (step === "done") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mx-auto border-2 border-green-500/40">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">You're all set! 🎉</h1>
          <p className="text-muted-foreground">Your account has been configured. Start your learning journey now.</p>
          <Button onClick={() => setLocation("/")} size="lg" className="gap-2 w-full">
            <ArrowRight className="h-4 w-4" /> Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (step === "fill_details" && selectedRole) {
    const roleConfig = ROLE_CONFIG[selectedRole];
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-6">
          <div className="text-center">
            <span className="text-5xl">{roleConfig.icon}</span>
            <h1 className="text-2xl font-bold text-foreground mt-3">Complete Your Profile</h1>
            <p className="text-muted-foreground">Enrolling as {roleConfig.label}</p>
          </div>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Your Name</Label>
                <Input
                  placeholder="Enter your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="bg-background"
                />
              </div>
              {selectedRole === "institute_admin" && (
                <div className="space-y-2">
                  <Label>Institute Name</Label>
                  <Input
                    placeholder="e.g., Brilliant Study Centre, Hyderabad"
                    value={instituteName}
                    onChange={e => setInstituteName(e.target.value)}
                    className="bg-background"
                  />
                </div>
              )}
              {selectedRole === "parent" && (
                <div className="space-y-2">
                  <Label>Child's Name</Label>
                  <Input
                    placeholder="Enter your child's name"
                    value={childName}
                    onChange={e => setChildName(e.target.value)}
                    className="bg-background"
                  />
                </div>
              )}
            </CardContent>
          </Card>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("select_role")} className="flex-1">Back</Button>
            <Button
              onClick={handleEnroll}
              disabled={startOnboarding.isPending || !name}
              className="flex-1 gap-2"
            >
              {startOnboarding.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Enrolling...</> : <><CheckCircle2 className="h-4 w-4" /> Complete Enrollment</>}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-4">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Join JEE Master Prep</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">How would you like to join?</h1>
          <p className="text-muted-foreground text-lg">Choose your role to get started. Each role has a tailored experience.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["student", "institute_admin", "parent"] as const).map(role => {
            const config = ROLE_CONFIG[role];
            const isSelected = selectedRole === role;
            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`text-left p-6 rounded-2xl border-2 transition-all duration-200 ${
                  isSelected
                    ? `${config.border} ${config.bg} shadow-lg scale-[1.02]`
                    : "border-border/40 bg-card hover:border-border hover:bg-card/80"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{config.icon}</span>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                </div>
                <div className="font-bold text-foreground text-xl mb-2">{config.label}</div>
                <p className="text-sm text-muted-foreground mb-4">{config.description}</p>
                <div className="space-y-1">
                  {config.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-green-400 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {selectedRole && (
          <div className="text-center">
            <Button
              size="lg"
              onClick={() => {
                if (!user) {
                  window.location.href = `/api/oauth/login?returnTo=/onboard?selfEnroll=true&role=${selectedRole}`;
                } else {
                  setStep("fill_details");
                }
              }}
              className="gap-2 px-8"
            >
              Continue as {ROLE_CONFIG[selectedRole].label} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Already have an invite?{" "}
          <a href="/onboard?showInviteInput=true" className="text-primary hover:underline">Enter invite token</a>
        </p>
      </div>
    </div>
  );
}

// ─── Main Onboarding Router ────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const [searchParams] = useState(() => new URLSearchParams(window.location.search));
  const token = searchParams.get("token");
  const selfEnroll = searchParams.get("selfEnroll");

  if (token) return <AcceptInviteFlow token={token} />;
  return <SelfEnrollFlow />;
}
