import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2, ShieldAlert } from "lucide-react";

type Role = "super_admin" | "admin" | "institute_admin" | "teacher" | "student" | "parent" | "user";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Verifying your access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // redirect handled in useEffect
  }

  const userRole = (user as any)?.role as Role;

  // super_admin and admin can access everything
  if (userRole === "super_admin" || userRole === "admin") {
    return <>{children}</>;
  }

  if (!allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6 max-w-md text-center p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">
              This page is only accessible to{" "}
              <strong className="text-foreground">{allowedRoles.join(", ").replace(/_/g, " ")}</strong> accounts.
              Your current role is <strong className="text-foreground">{userRole?.replace(/_/g, " ") || "unknown"}</strong>.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setLocation("/")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Home
            </button>
            <button
              onClick={() => setLocation("/dashboard")}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
            >
              My Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── Role-aware redirect hook ─────────────────────────────────────────────────
export function useRoleRedirect() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const redirectToRolePortal = () => {
    if (loading || !isAuthenticated) return;
    const role = (user as any)?.role as Role;
    switch (role) {
      case "super_admin":
      case "admin":
        setLocation("/super-admin");
        break;
      case "institute_admin":
        setLocation("/institute-admin");
        break;
      case "teacher":
        setLocation("/teacher");
        break;
      case "parent":
        setLocation("/parent");
        break;
      case "student":
      default:
        setLocation("/dashboard");
        break;
    }
  };

  return { redirectToRolePortal, role: (user as any)?.role as Role | undefined };
}
