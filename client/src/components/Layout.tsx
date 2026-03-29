import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, LayoutDashboard, Map, Search, FlaskConical,
  Calculator, Atom, Trophy, Code2, Menu, X, LogOut,
  Zap, GraduationCap, User, Shield, School, UserCheck,
  Heart, Bell, BarChart3, Target, TrendingUp, Activity
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const SUBJECTS = [
  { id: "physics", label: "Physics", icon: Atom, color: "text-blue-400", chapters: 25 },
  { id: "chemistry", label: "Chemistry", icon: FlaskConical, color: "text-green-400", chapters: 28 },
  { id: "mathematics", label: "Mathematics", icon: Calculator, color: "text-amber-400", chapters: 27 },
];

const ROLE_PORTAL_MAP: Record<string, { path: string; label: string; icon: any; color: string }> = {
  super_admin: { path: "/super-admin", label: "Super Admin", icon: Shield, color: "text-purple-400" },
  admin: { path: "/super-admin", label: "Super Admin", icon: Shield, color: "text-purple-400" },
  institute_admin: { path: "/institute-admin", label: "Institute Admin", icon: School, color: "text-blue-400" },
  teacher: { path: "/teacher", label: "Teacher Portal", icon: UserCheck, color: "text-teal-400" },
  parent: { path: "/parent", label: "Parent Portal", icon: Heart, color: "text-pink-400" },
};

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications } = trpc.notifications.getMyNotifications.useQuery({ unreadOnly: false, limit: 10 });
  const markRead = trpc.notifications.markAsRead.useMutation();
  const utils = trpc.useUtils();

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  const handleMarkRead = (id: number) => {
    markRead.mutate({ notificationId: id }, {
      onSuccess: () => utils.notifications.getMyNotifications.invalidate(),
    });
  };

  const urgencyColor = (urgency: string) => {
    if (urgency === "critical" || urgency === "high") return "text-red-400";
    if (urgency === "medium") return "text-amber-400";
    return "text-blue-400";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="font-semibold text-sm text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="outline" className="text-xs text-red-400 border-red-400/30">{unreadCount} new</Badge>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications && notifications.length > 0 ? (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-border/50 last:border-0 cursor-pointer hover:bg-muted transition-colors ${!n.isRead ? "bg-primary/5" : ""}`}
                    onClick={() => handleMarkRead(n.id)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? "bg-primary" : "bg-muted"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${urgencyColor(n.urgency)} mb-0.5`}>{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {new Date(n.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-6 h-6 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const userRole = (user as any)?.role || "student";
  const portalLink = ROLE_PORTAL_MAP[userRole];

  const NAV_ITEMS = [
    { path: "/", label: "Home", icon: Zap },
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/performance", label: "Performance", icon: BarChart3 },
    { path: "/study-plan", label: "Study Plan", icon: Map },
    { path: "/search", label: "Search", icon: Search },
    { path: "/api-docs", label: "API Docs", icon: Code2 },
  ];

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
          {/* Role Portal Link */}
          {isAuthenticated && portalLink && (
            <div className="mb-3">
              <Link href={portalLink.path}>
                <div className={`nav-item ${location === portalLink.path ? "active" : ""} border border-border/50 rounded-xl`}>
                  <portalLink.icon className={`w-4 h-4 flex-shrink-0 ${portalLink.color}`} />
                  <span className="text-sm font-medium">{portalLink.label}</span>
                </div>
              </Link>
            </div>
          )}

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

          {/* Practice */}
          <div className="pt-3 pb-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Practice</div>
            <Link href="/mock-test/jee_main_full">
              <div className={`nav-item ${location.startsWith("/mock-test") ? "active" : ""}`}>
                <Trophy className="w-4 h-4 flex-shrink-0 text-yellow-400" />
                <span className="text-sm">Mock Tests</span>
              </div>
            </Link>
          </div>

          {/* Portals (for admin roles) */}
          {isAuthenticated && (userRole === "super_admin" || userRole === "admin") && (
            <div className="pt-3 pb-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Admin</div>
              <Link href="/super-admin">
                <div className={`nav-item ${location === "/super-admin" ? "active" : ""}`}>
                  <Shield className="w-4 h-4 flex-shrink-0 text-purple-400" />
                  <span className="text-sm">Super Admin</span>
                </div>
              </Link>
              <Link href="/institute-admin">
                <div className={`nav-item ${location === "/institute-admin" ? "active" : ""}`}>
                  <School className="w-4 h-4 flex-shrink-0 text-blue-400" />
                  <span className="text-sm">Institute Admin</span>
                </div>
              </Link>
            </div>
          )}
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
                <div className="text-xs text-muted-foreground truncate capitalize">{userRole.replace("_", " ")}</div>
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
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-sm">JEE Master Prep</span>
          </div>
          <div className="flex-1" />
          <Link href="/search">
            <button className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <Search className="w-4 h-4" />
            </button>
          </Link>
          {isAuthenticated && <NotificationBell />}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
