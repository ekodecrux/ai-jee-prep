import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
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

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchPage} />
      <Route path="/api-docs" component={ApiDocsPage} />

      {/* Student Learning */}
      <Route path="/subject/:subjectId" component={SubjectPage} />
      <Route path="/chapter/:chapterId" component={ChapterPage} />
      <Route path="/chapter/:chapterId/assess" component={AssessmentPage} />
      <Route path="/chapter/:chapterId/exam" component={ProctoredExam} />

      {/* Student Dashboard */}
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/study-plan" component={StudyPlanPage} />
      <Route path="/performance" component={PerformanceDashboard} />
      <Route path="/mock-test/:mockTestId" component={MockTestPage} />

      {/* Role Portals */}
      <Route path="/super-admin" component={SuperAdminPortal} />
      <Route path="/institute-admin" component={InstituteAdminPortal} />
      <Route path="/teacher" component={TeacherPortal} />
      <Route path="/parent" component={ParentPortal} />

      {/* Onboarding & Configuration */}
      <Route path="/onboard" component={OnboardingWizard} />
      <Route path="/institute-config" component={InstituteConfig} />

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
