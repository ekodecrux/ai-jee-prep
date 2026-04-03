/**
 * PlatformLayout — Unified LMS Shell
 *
 * Role-aware sidebar with grouped navigation for:
 * - Super Admin / Admin
 * - Institute Admin
 * - Teacher
 * - Student
 * - Parent
 *
 * Mirrors the reference Eduaacademy LMS pattern:
 * fixed sidebar + top bar + main content area
 */
import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap, LogOut, Home, LayoutDashboard, Users, BookOpen,
  Calendar, CheckSquare, BarChart3, Video, FileText, Bell,
  Settings, Shield, School, UserCheck, Heart, ChevronDown,
  ChevronRight, Menu, X, User, Atom, FlaskConical, Calculator,
  Trophy, Map, Search, Code2, Activity, Target, TrendingUp,
  ClipboardCheck, Briefcase, AlertCircle, BookMarked, Brain,
  PieChart, Building2, UserPlus, Layers, Award, FileCheck,
  MessageSquare, Zap, Star, Clock, ChevronLeft, CreditCard
} from "lucide-react";

// ─── Role-specific menu configurations ────────────────────────────────────────

type MenuItem = {
  id: string;
  label: string;
  icon: any;
  path?: string;
  type?: "group";
  subItems?: { id: string; label: string; icon: any; path: string }[];
};

const SUPER_ADMIN_MENU: MenuItem[] = [
  { id: "overview", label: "Platform Overview", icon: Home, path: "/super-admin" },
  {
    id: "institutes-group", label: "Institutes", icon: Building2, type: "group",
    subItems: [
      { id: "all-institutes", label: "All Institutes", icon: Building2, path: "/super-admin?tab=institutes" },
      { id: "onboard", label: "Onboard Institute", icon: UserPlus, path: "/super-admin?tab=onboard" },
    ]
  },
  {
    id: "platform-group", label: "Platform", icon: Layers, type: "group",
    subItems: [
      { id: "knowledge-base", label: "Knowledge Base", icon: BookOpen, path: "/super-admin?tab=knowledge" },
      { id: "api-management", label: "API Management", icon: Code2, path: "/super-admin?tab=api" },
      { id: "system-health", label: "System Health", icon: Activity, path: "/super-admin?tab=health" },
    ]
  },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/super-admin?tab=analytics" },
];

const INSTITUTE_ADMIN_MENU: MenuItem[] = [
  { id: "overview", label: "Dashboard", icon: Home, path: "/institute-admin" },
  {
    id: "users-group", label: "User Management", icon: Users, type: "group",
    subItems: [
      { id: "teachers", label: "Teachers", icon: UserCheck, path: "/institute-admin?tab=teachers" },
      { id: "students", label: "Students", icon: GraduationCap, path: "/institute-admin?tab=students" },
      { id: "parents", label: "Parents", icon: Heart, path: "/institute-admin?tab=parents" },
    ]
  },
  {
    id: "academics-group", label: "Academics", icon: BookOpen, type: "group",
    subItems: [
      { id: "classes", label: "Classes", icon: Layers, path: "/institute-admin?tab=classes" },
      { id: "subjects", label: "Subjects", icon: BookMarked, path: "/institute-admin?tab=subjects" },
      { id: "teacher-mapping", label: "Teacher Mapping", icon: UserCheck, path: "/institute-admin?tab=mapping" },
    ]
  },
  {
    id: "reports-group", label: "Reports", icon: BarChart3, type: "group",
    subItems: [
      { id: "attendance-summary", label: "Attendance Summary", icon: CheckSquare, path: "/institute-admin?tab=attendance" },
      { id: "low-attendance", label: "Low Attendance Alerts", icon: AlertCircle, path: "/institute-admin?tab=alerts" },
    ]
  },
  { id: "settings", label: "Settings", icon: Settings, path: "/institute-admin?tab=settings" },
];

const TEACHER_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/teacher" },
  {
    id: "teaching-group", label: "Teaching", icon: Briefcase, type: "group",
    subItems: [
      { id: "my-classes", label: "My Classes", icon: Layers, path: "/teacher?tab=classes" },
      { id: "lesson-plans", label: "Lesson Plans", icon: Calendar, path: "/teacher?tab=lesson-plans" },
      { id: "live-classes", label: "Live Classes", icon: Video, path: "/teacher?tab=live-classes" },
    ]
  },
  {
    id: "assessment-group", label: "Assessment", icon: FileCheck, type: "group",
    subItems: [
      { id: "attendance", label: "Mark Attendance", icon: CheckSquare, path: "/teacher?tab=attendance" },
      { id: "assignments", label: "Assignments", icon: FileText, path: "/teacher?tab=assignments" },
      { id: "tests", label: "Tests & Exams", icon: ClipboardCheck, path: "/teacher?tab=tests" },
    ]
  },
  { id: "my-students", label: "My Students", icon: Users, path: "/teacher?tab=students" },
  { id: "bridge-courses", label: "Bridge Courses", icon: Brain, path: "/teacher?tab=bridge" },
  { id: "reports", label: "Reports", icon: BarChart3, path: "/teacher?tab=reports" },
];

const STUDENT_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
  { id: "daily-activities", label: "Today's Activities", icon: Zap, path: "/dashboard?tab=activities" },
  {
    id: "learning-group", label: "Learning", icon: BookOpen, type: "group",
    subItems: [
      { id: "physics", label: "Physics", icon: Atom, path: "/subject/physics" },
      { id: "chemistry", label: "Chemistry", icon: FlaskConical, path: "/subject/chemistry" },
      { id: "mathematics", label: "Mathematics", icon: Calculator, path: "/subject/mathematics" },
    ]
  },
  {
    id: "practice-group", label: "Practice", icon: Trophy, type: "group",
    subItems: [
      { id: "mock-tests", label: "Mock Tests", icon: Trophy, path: "/mock-test/jee_main_full" },
      { id: "assessments", label: "Assessments", icon: FileCheck, path: "/dashboard?tab=assessments" },
      { id: "assignments", label: "Assignments", icon: FileText, path: "/dashboard?tab=assignments" },
    ]
  },
  { id: "live-classes", label: "Live Classes", icon: Video, path: "/dashboard?tab=live-classes" },
  { id: "lesson-plans", label: "Lesson Plans", icon: Calendar, path: "/dashboard?tab=lesson-plans" },
  { id: "attendance", label: "My Attendance", icon: CheckSquare, path: "/dashboard?tab=attendance" },
  { id: "performance", label: "Performance", icon: BarChart3, path: "/performance" },
  { id: "study-plan", label: "Study Plan", icon: Map, path: "/study-plan" },
  { id: "bridge-courses", label: "Bridge Courses", icon: Brain, path: "/dashboard?tab=bridge" },
  { id: "report-card", label: "Report Card", icon: GraduationCap, path: "/dashboard?tab=report-card" },
];

const PARENT_MENU: MenuItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Home, path: "/parent" },
  { id: "child-profile", label: "Child Profile", icon: User, path: "/parent?tab=profile" },
  { id: "attendance", label: "Attendance", icon: CheckSquare, path: "/parent?tab=attendance" },
  { id: "lesson-plans", label: "Lesson Plans", icon: Calendar, path: "/parent?tab=lesson-plans" },
  { id: "assignments", label: "Assignments", icon: FileText, path: "/parent?tab=assignments" },
  { id: "assessments", label: "Assessments", icon: FileCheck, path: "/parent?tab=assessments" },
  { id: "live-classes", label: "Live Classes", icon: Video, path: "/parent?tab=live-classes" },
  { id: "progress", label: "Progress & Analytics", icon: BarChart3, path: "/parent?tab=progress" },
  { id: "fees", label: "Fee Payments", icon: CreditCard, path: "/parent?tab=fees" },
  { id: "alerts", label: "Alerts", icon: AlertCircle, path: "/parent?tab=alerts" },
];

// ─── Role config ───────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, {
  menu: MenuItem[];
  label: string;
  color: string;
  bgGradient: string;
  accentColor: string;
}> = {
  super_admin: {
    menu: SUPER_ADMIN_MENU,
    label: "Super Admin",
    color: "text-purple-600",
    bgGradient: "from-purple-600 to-indigo-600",
    accentColor: "bg-purple-600",
  },
  admin: {
    menu: SUPER_ADMIN_MENU,
    label: "Platform Admin",
    color: "text-purple-600",
    bgGradient: "from-purple-600 to-indigo-600",
    accentColor: "bg-purple-600",
  },
  institute_admin: {
    menu: INSTITUTE_ADMIN_MENU,
    label: "Institute Admin",
    color: "text-blue-600",
    bgGradient: "from-blue-600 to-cyan-600",
    accentColor: "bg-blue-600",
  },
  teacher: {
    menu: TEACHER_MENU,
    label: "Teacher",
    color: "text-teal-600",
    bgGradient: "from-teal-600 to-emerald-600",
    accentColor: "bg-teal-600",
  },
  student: {
    menu: STUDENT_MENU,
    label: "Student",
    color: "text-indigo-600",
    bgGradient: "from-indigo-600 to-blue-600",
    accentColor: "bg-indigo-600",
  },
  user: {
    menu: STUDENT_MENU,
    label: "Student",
    color: "text-indigo-600",
    bgGradient: "from-indigo-600 to-blue-600",
    accentColor: "bg-indigo-600",
  },
  parent: {
    menu: PARENT_MENU,
    label: "Parent",
    color: "text-rose-600",
    bgGradient: "from-rose-600 to-pink-600",
    accentColor: "bg-rose-600",
  },
};

// ─── Notification Bell ─────────────────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications } = trpc.notifications.getMyNotifications.useQuery({ unreadOnly: false, limit: 10 });
  const markRead = trpc.notifications.markAsRead.useMutation();
  const utils = trpc.useUtils();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <span className="font-semibold text-sm text-gray-900">Notifications</span>
              {unreadCount > 0 && <Badge variant="destructive" className="text-xs">{unreadCount} new</Badge>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications && notifications.length > 0 ? (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? "bg-blue-50/50" : ""}`}
                    onClick={() => markRead.mutate({ notificationId: n.id }, { onSuccess: () => utils.notifications.getMyNotifications.invalidate() })}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? "bg-blue-500" : "bg-gray-300"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 mb-0.5">{n.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString("en-IN")}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
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

// ─── Sidebar Menu Item ─────────────────────────────────────────────────────────
function SidebarItem({
  item, activeTab, setActiveTab, accentColor, expandedGroups, toggleGroup, location
}: {
  item: MenuItem;
  activeTab: string;
  setActiveTab: (id: string) => void;
  accentColor: string;
  expandedGroups: Record<string, boolean>;
  toggleGroup: (id: string) => void;
  location: string;
}) {
  const Icon = item.icon;

  if (item.type === "group") {
    const isExpanded = expandedGroups[item.id] ?? false;
    const isAnySubActive = item.subItems?.some(sub => activeTab === sub.id || location === sub.path);

    return (
      <div>
        <button
          onClick={() => toggleGroup(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group ${
            isAnySubActive ? "text-gray-900 font-medium" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Icon className={`w-4 h-4 flex-shrink-0 ${isAnySubActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600"}`} />
          <span className="text-sm flex-1">{item.label}</span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          )}
        </button>
        {isExpanded && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-3">
            {item.subItems?.map(sub => {
              const SubIcon = sub.icon;
              const isActive = activeTab === sub.id || location === sub.path;
              return (
                <Link key={sub.id} href={sub.path}>
                  <button
                    onClick={() => setActiveTab(sub.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left text-sm ${
                      isActive
                        ? `${accentColor} text-white font-medium shadow-sm`
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{sub.label}</span>
                  </button>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const isActive = activeTab === item.id || location === item.path;
  return (
    <Link href={item.path!}>
      <button
        onClick={() => setActiveTab(item.id)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
          isActive
            ? `${accentColor} text-white font-medium shadow-sm`
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }`}
      >
        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
        <span className="text-sm">{item.label}</span>
      </button>
    </Link>
  );
}

// ─── Main PlatformLayout ───────────────────────────────────────────────────────
interface PlatformLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function PlatformLayout({ children, activeTab: externalTab, onTabChange }: PlatformLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [internalTab, setInternalTab] = useState("dashboard");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    "learning-group": true,
    "teaching-group": true,
    "users-group": true,
    "academics-group": true,
  });
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: membership, isLoading: membershipLoading } = trpc.erp.getMyMembership.useQuery(
    undefined,
    { enabled: isAuthenticated, retry: false }
  );

  const activeTab = externalTab ?? internalTab;
  const setActiveTab = (tab: string) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // Redirect to onboarding if authenticated but has no ERP membership
  const [, navigate] = useLocation();
  useEffect(() => {
    if (isAuthenticated && !membershipLoading && !membership) {
      navigate("/onboard");
    }
  }, [isAuthenticated, membershipLoading, membership]);

  // Derive role from ERP membership (not users.role which only has user/admin)
  const erpRole = membership?.role ?? "student";
  const userRole = erpRole;
  const roleConfig = ROLE_CONFIG[userRole] || ROLE_CONFIG.student;

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <GraduationCap className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to continue</h2>
          <p className="text-gray-500 mb-4">Access your personalized learning platform</p>
          <button
            onClick={() => window.location.href = getLoginUrl()}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Show skeleton while determining ERP role
  if (membershipLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
          <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-2 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col shadow-sm
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        ${sidebarCollapsed ? "w-16" : "w-64"}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className={`flex items-center border-b border-gray-100 h-16 flex-shrink-0 ${sidebarCollapsed ? "justify-center px-2" : "px-4 gap-3"}`}>
          <div className={`flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br ${roleConfig.bgGradient} flex items-center justify-center shadow-sm`}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-gray-900 leading-tight truncate">ExamForge AI</div>
              <div className="text-xs text-gray-400 truncate">{roleConfig.label}</div>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="hidden lg:flex p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <button className="lg:hidden text-gray-400 hover:text-gray-600" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expand button when collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="hidden lg:flex items-center justify-center py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {sidebarCollapsed ? (
            // Collapsed: icon-only
            roleConfig.menu.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { if (item.path) { setActiveTab(item.id); } else toggleGroup(item.id); }}
                  title={item.label}
                  className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all ${
                    isActive ? `${roleConfig.accentColor} text-white` : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })
          ) : (
            roleConfig.menu.map(item => (
              <SidebarItem
                key={item.id}
                item={item}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                accentColor={roleConfig.accentColor}
                expandedGroups={expandedGroups}
                toggleGroup={toggleGroup}
                location={location}
              />
            ))
          )}
        </nav>

        {/* User footer */}
        <div className={`border-t border-gray-100 flex-shrink-0 ${sidebarCollapsed ? "p-2" : "p-3"}`}>
          {sidebarCollapsed ? (
            <button
              onClick={() => logout()}
              title="Logout"
              className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleConfig.bgGradient} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white text-xs font-bold">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{user?.name || "User"}</div>
                <div className="text-xs text-gray-400 truncate capitalize">{userRole.replace(/_/g, " ")}</div>
              </div>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-3 shadow-sm flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${roleConfig.bgGradient} flex items-center justify-center`}>
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-gray-900">ExamForge AI</span>
          </div>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <Link href="/search">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
                <Search className="w-4 h-4" />
              </button>
            </Link>
            <NotificationBell />
            {/* Role badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${roleConfig.bgGradient} text-white text-xs font-medium ml-1`}>
              <span>{roleConfig.label}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
