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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/subject/:subjectId" component={SubjectPage} />
      <Route path="/chapter/:chapterId" component={ChapterPage} />
      <Route path="/chapter/:chapterId/assess" component={AssessmentPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/study-plan" component={StudyPlanPage} />
      <Route path="/search" component={SearchPage} />
      <Route path="/mock-test/:mockTestId" component={MockTestPage} />
      <Route path="/api-docs" component={ApiDocsPage} />
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
