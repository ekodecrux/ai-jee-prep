/**
 * NotificationBell
 * Floating bell icon with unread badge. Clicking opens a dropdown panel
 * showing recent notifications (streak alerts, overdue lessons, milestones).
 * Uses the existing notifications tRPC router.
 */
import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCheck, Flame, BookOpen, Trophy, AlertTriangle, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Urgency = "info" | "warning" | "critical" | "success";
type NotifType = string;

const URGENCY_STYLES: Record<Urgency, { bg: string; border: string; icon: React.ReactNode }> = {
  info:     { bg: "bg-blue-50",    border: "border-blue-200",   icon: <Info className="w-3.5 h-3.5 text-blue-500" /> },
  warning:  { bg: "bg-amber-50",   border: "border-amber-200",  icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> },
  critical: { bg: "bg-red-50",     border: "border-red-200",    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> },
  success:  { bg: "bg-emerald-50", border: "border-emerald-200", icon: <Trophy className="w-3.5 h-3.5 text-emerald-500" /> },
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  streak_at_risk:       <Flame className="w-3.5 h-3.5 text-orange-500" />,
  lesson_overdue:       <BookOpen className="w-3.5 h-3.5 text-red-500" />,
  score_milestone:      <Trophy className="w-3.5 h-3.5 text-amber-500" />,
  weak_chapter_alert:   <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
  assessment_reminder:  <BookOpen className="w-3.5 h-3.5 text-blue-500" />,
};

function timeAgo(date: Date | string): string {
  const ms = Date.now() - new Date(date).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { data: countData, refetch: refetchCount } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { refetchInterval: 30_000 } // poll every 30s
  );
  const { data: notifications, isLoading, refetch: refetchList } = trpc.notifications.getMyNotifications.useQuery(
    { limit: 15, unreadOnly: false },
    { enabled: open }
  );

  const markAsRead = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => { refetchCount(); refetchList(); },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => {
      toast.success("All notifications marked as read");
      refetchCount();
      refetchList();
    },
  });

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = countData?.count ?? 0;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-foreground" />
              <span className="font-semibold text-foreground text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : !notifications || notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <p className="text-sm text-muted-foreground">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notif: typeof notifications[number]) => {
                const urgency = (notif.urgency as Urgency) || "info";
                const style = URGENCY_STYLES[urgency];
                const typeIcon = TYPE_ICONS[notif.type as NotifType] || style.icon;
                return (
                  <div
                    key={notif.id}
                    className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notif.isRead ? "bg-blue-50/40" : ""
                    }`}
                    onClick={() => {
                      if (!notif.isRead) markAsRead.mutate({ notificationId: notif.id });
                      if (notif.actionUrl) window.location.href = notif.actionUrl;
                    }}
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 w-7 h-7 rounded-full ${style.bg} ${style.border} border flex items-center justify-center shrink-0`}>
                      {typeIcon}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold leading-snug ${notif.isRead ? "text-muted-foreground" : "text-foreground"}`}>
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {/* Unread dot */}
                    {!notif.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-border bg-muted/30">
            <p className="text-[10px] text-muted-foreground text-center">
              Notifications auto-refresh every 30 seconds
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
