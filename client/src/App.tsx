import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import SubjectPage from "./pages/SubjectPage";
import ChapterPage from "./pages/ChapterPage";
import AssessmentPage from "./pages/AssessmentPage";
import DashboardPage from "./pages/DashboardPage";
import StudyPlanPage from "./pages/StudyPlanPage";
import ApiDocsPage from "./pages/ApiDocsPage";
import SearchPage from "./pages/SearchPage";
import MockTestPage from "./pages/MockTestPage";
import PerformanceDashboard from "./pages/PerformanceDashboard";
import ProctoredExam from "./pages/ProctoredExam";
import SuperAdminPortal from "./pages/SuperAdminPortal";
import InstituteAdminPortal from "./pages/InstituteAdminPortal";
import TeacherPortal from "./pages/TeacherPortal";
import ParentPortal from "./pages/ParentPortal";
import InstituteConfig from "./pages/InstituteConfig";
import OnboardingWizard from "./pages/OnboardingWizard";

// ─── Role → canonical portal path ────────────────────────────────────────────
const ROLE_HOME: Record<string, string> = {
  super_admin: "/super-admin",
  admin: "/super-admin",
  institute_admin: "/institute-admin",
  teacher: "/teacher",
  parent: "/parent",
  student: "/dashboard",
  user: "/dashboard",
};

// ─── Guard: redirect unauthenticated users to /login ─────────────────────────
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <>{children}</>;
}

// ─── Guard: redirect authenticated users away from /login and / ──────────────
function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const { data: membership, isLoading: membershipLoading } = trpc.erp.getMyMembership.useQuery(
    undefined,
    { enabled: isAuthenticated, retry: false }
  );

  if (loading || (isAuthenticated && membershipLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="h-3 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (isAuthenticated && membership) {
    const dest = ROLE_HOME[membership.role] ?? "/dashboard";
    return <Redirect to={dest} />;
  }

  return <>{children}</>;
}

// ─── Guard: ensure user has the correct ERP role to access a portal ──────────
function RoleGuard({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();
  const { data: membership, isLoading: membershipLoading } = trpc.erp.getMyMembership.useQuery(
    undefined,
    { enabled: isAuthenticated, retry: false }
  );

  if (!isAuthenticated) return <Redirect to="/login" />;

  if (loading || membershipLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="h-3 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const role = membership?.role ?? "student";
  if (!allowedRoles.includes(role)) {
    // Redirect to their correct portal
    const dest = ROLE_HOME[role] ?? "/dashboard";
    return <Redirect to={dest} />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* ── Public (unauthenticated) ── */}
      <Route path="/login">
        <GuestGuard><LoginPage /></GuestGuard>
      </Route>
      <Route path="/search" component={SearchPage} />
      <Route path="/api-docs" component={ApiDocsPage} />
      <Route path="/onboard" component={OnboardingWizard} />

      {/* ── Landing page: redirect authenticated users to their portal ── */}
      <Route path="/">
        <GuestGuard><Home /></GuestGuard>
      </Route>

      {/* ── Student / general learning (accessible to all authenticated users) ── */}
      <Route path="/subject/:subjectId">
        <AuthGuard><SubjectPage /></AuthGuard>
      </Route>
      <Route path="/chapter/:chapterId">
        <AuthGuard><ChapterPage /></AuthGuard>
      </Route>
      <Route path="/chapter/:chapterId/assess">
        <AuthGuard><AssessmentPage /></AuthGuard>
      </Route>
      <Route path="/chapter/:chapterId/exam">
        <AuthGuard><ProctoredExam /></AuthGuard>
      </Route>

      {/* ── Student portal ── */}
      <Route path="/dashboard">
        <RoleGuard allowedRoles={["student", "user"]}><DashboardPage /></RoleGuard>
      </Route>
      <Route path="/study-plan">
        <RoleGuard allowedRoles={["student", "user"]}><StudyPlanPage /></RoleGuard>
      </Route>
      <Route path="/performance">
        <RoleGuard allowedRoles={["student", "user"]}><PerformanceDashboard /></RoleGuard>
      </Route>
      <Route path="/mock-test/:mockTestId">
        <RoleGuard allowedRoles={["student", "user"]}><MockTestPage /></RoleGuard>
      </Route>

      {/* ── Teacher portal ── */}
      <Route path="/teacher">
        <RoleGuard allowedRoles={["teacher"]}><TeacherPortal /></RoleGuard>
      </Route>

      {/* ── Parent portal ── */}
      <Route path="/parent">
        <RoleGuard allowedRoles={["parent"]}><ParentPortal /></RoleGuard>
      </Route>

      {/* ── Institute Admin portal ── */}
      <Route path="/institute-admin">
        <RoleGuard allowedRoles={["institute_admin"]}><InstituteAdminPortal /></RoleGuard>
      </Route>
      <Route path="/institute-config">
        <RoleGuard allowedRoles={["institute_admin"]}><InstituteConfig /></RoleGuard>
      </Route>

      {/* ── Super Admin portal ── */}
      <Route path="/super-admin">
        <RoleGuard allowedRoles={["super_admin", "admin"]}><SuperAdminPortal /></RoleGuard>
      </Route>

      {/* ── Fallback ── */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
