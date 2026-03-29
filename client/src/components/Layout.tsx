import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  BookOpen, LayoutDashboard, Map, Search, FlaskConical,
  Calculator, Atom, Trophy, Code2, Menu, X, LogOut,
  ChevronRight, Zap, GraduationCap, User
} from "lucide-react";

const SUBJECTS = [
  { id: "physics", label: "Physics", icon: Atom, color: "text-physics", chapters: 25 },
  { id: "chemistry", label: "Chemistry", icon: FlaskConical, color: "text-chemistry", chapters: 28 },
  { id: "mathematics", label: "Mathematics", icon: Calculator, color: "text-mathematics", chapters: 27 },
];

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Zap },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/study-plan", label: "Study Plan", icon: Map },
  { path: "/search", label: "Search", icon: Search },
  { path: "/api-docs", label: "API Docs", icon: Code2 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-border flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-display font-bold text-sm text-foreground leading-tight">JEE Master</div>
              <div className="text-xs text-muted-foreground">Knowledge Platform</div>
            </div>
          </Link>
          <button className="lg:hidden text-muted-foreground hover:text-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link key={item.path} href={item.path}>
              <div className={`nav-item ${location === item.path ? "active" : ""}`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{item.label}</span>
              </div>
            </Link>
          ))}

          {/* Subjects */}
          <div className="pt-3 pb-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Subjects</div>
            {SUBJECTS.map(subject => (
              <Link key={subject.id} href={`/subject/${subject.id}`}>
                <div className={`nav-item ${location.startsWith(`/subject/${subject.id}`) ? "active" : ""}`}>
                  <subject.icon className={`w-4 h-4 flex-shrink-0 ${subject.color}`} />
                  <span className="text-sm flex-1">{subject.label}</span>
                  <span className="text-xs text-muted-foreground">{subject.chapters}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Mock Tests */}
          <div className="pt-3 pb-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Practice</div>
            <Link href="/mock-test/jee_main_full">
              <div className={`nav-item ${location.startsWith("/mock-test") ? "active" : ""}`}>
                <Trophy className="w-4 h-4 flex-shrink-0 text-yellow-400" />
                <span className="text-sm">Mock Tests</span>
              </div>
            </Link>
          </div>
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{user.name || "Student"}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email || ""}</div>
              </div>
              <button onClick={() => logout()} className="text-muted-foreground hover:text-foreground transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Button size="sm" className="w-full" onClick={() => window.location.href = getLoginUrl()}>
              Sign In
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-sm">JEE Master Prep</span>
          </div>
          <div className="flex-1" />
          <Link href="/search">
            <Search className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
