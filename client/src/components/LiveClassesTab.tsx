/**
 * LiveClassesTab — Shared component for Teacher and Student live class views
 *
 * Teacher view: Create sessions, start/end live classes, see scheduled sessions
 * Student view: See upcoming live classes, join with one click
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Video, Plus, Clock, Users, Play, Square, Calendar, BookOpen, Loader2, X } from "lucide-react";
import JitsiMeet from "./JitsiMeet";

interface LiveClassesTabProps {
  role: "teacher" | "student" | "parent";
  instituteId: number;
  classId?: number;
}

export default function LiveClassesTab({ role, instituteId, classId }: LiveClassesTabProps) {
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeSession, setActiveSession] = useState<{ id: number; title: string; roomName: string } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>(classId ? String(classId) : "");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");

  const utils = trpc.useUtils();

  const classes = trpc.erp.listClasses.useQuery(
    { instituteId },
    { enabled: !!instituteId }
  );

  const sessions = trpc.onlineClasses.list.useQuery(
    { instituteId, classId: classId || undefined, upcoming: true },
    { enabled: !!instituteId }
  );

  const createSession = trpc.onlineClasses.create.useMutation({
    onSuccess: () => {
      toast.success("Live class session created!");
      setShowCreateDialog(false);
      setTitle(""); setDescription(""); setScheduledAt(""); setDuration("60");
      utils.onlineClasses.list.invalidate();
    },
    onError: (err) => toast.error("Failed to create session: " + err.message),
  });

  const updateStatus = trpc.onlineClasses.updateStatus.useMutation({
    onSuccess: () => utils.onlineClasses.list.invalidate(),
    onError: (err) => toast.error("Failed to update status: " + err.message),
  });

  const handleCreate = () => {
    if (!title || !scheduledAt || !selectedClassId) {
      toast.error("Please fill in all required fields");
      return;
    }
    createSession.mutate({
      instituteId,
      classId: Number(selectedClassId),
      title,
      description: description || undefined,
      scheduledAt: new Date(scheduledAt).getTime(),
      durationMinutes: Number(duration),
      type: "live_class",
    });
  };

  const handleStartClass = (session: any) => {
    // Generate a deterministic room name from session ID
    const roomName = `session-${session.id}-${instituteId}`;
    updateStatus.mutate({ id: session.id, status: "live", meetingUrl: roomName });
    setActiveSession({ id: session.id, title: session.title, roomName });
  };

  const handleJoinClass = (session: any) => {
    const roomName = session.meetingUrl || `session-${session.id}-${instituteId}`;
    setActiveSession({ id: session.id, title: session.title, roomName });
  };

  const handleEndClass = () => {
    if (activeSession && role === "teacher") {
      updateStatus.mutate({ id: activeSession.id, status: "ended" });
    }
    setActiveSession(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live": return "bg-red-100 text-red-700 border-red-200";
      case "scheduled": return "bg-blue-100 text-blue-700 border-blue-200";
      case "ended": return "bg-gray-100 text-gray-600 border-gray-200";
      case "cancelled": return "bg-orange-100 text-orange-700 border-orange-200";
      default: return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  // ── Full-screen Jitsi view ────────────────────────────────────────────────────
  if (activeSession) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white font-medium">{activeSession.title}</span>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">LIVE</Badge>
          </div>
          <div className="flex items-center gap-2">
            {role === "teacher" && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-2"
                onClick={handleEndClass}
              >
                <Square className="w-3 h-3" /> End Class
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-300 hover:text-white gap-2"
              onClick={() => setActiveSession(null)}
            >
              <X className="w-4 h-4" /> Minimize
            </Button>
          </div>
        </div>
        <div className="flex-1">
          <JitsiMeet
            roomName={activeSession.roomName}
            displayName={user?.name || "Participant"}
            isHost={role === "teacher"}
            onClose={handleEndClass}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Live Classes</h2>
          <p className="text-sm text-gray-500">
            {role === "teacher"
              ? "Schedule and host live video sessions for your students"
              : "Join your scheduled live classes"}
          </p>
        </div>
        {role === "teacher" && (
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4" /> Schedule Class
          </Button>
        )}
      </div>

      {/* Live now banner */}
      {sessions.data?.some((s: any) => s.status === "live") && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">A class is live right now!</p>
            <p className="text-sm text-red-600">Click "Join" to enter the session</p>
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div className="space-y-3">
        {sessions.isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        )}

        {!sessions.isLoading && (sessions.data?.length ?? 0) === 0 && (
          <div className="text-center py-14 bg-white rounded-xl border border-gray-200">
            <Video className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-700">No upcoming live classes</p>
            <p className="text-sm text-gray-400 mt-1">
              {role === "teacher"
                ? "Schedule your first live class to get started"
                : "Your teacher hasn't scheduled any live classes yet"}
            </p>
          </div>
        )}

        {sessions.data?.map((session: any) => (
          <Card key={session.id} className={`border ${session.status === "live" ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-white"}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${session.status === "live" ? "bg-red-100" : "bg-indigo-100"}`}>
                    <Video className={`w-5 h-5 ${session.status === "live" ? "text-red-600" : "text-indigo-600"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate">{session.title}</h3>
                      <Badge className={`text-xs border ${getStatusColor(session.status)}`}>
                        {session.status === "live" ? "🔴 LIVE" : session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </Badge>
                    </div>
                    {session.description && (
                      <p className="text-sm text-gray-500 mt-0.5 truncate">{session.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.scheduledAt).toLocaleDateString("en-IN", {
                          weekday: "short", day: "numeric", month: "short",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(session.scheduledAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {session.durationMinutes} min
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {role === "teacher" && session.status === "scheduled" && (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-green-600 hover:bg-green-700"
                      onClick={() => handleStartClass(session)}
                      disabled={updateStatus.isPending}
                    >
                      <Play className="w-3.5 h-3.5" /> Start
                    </Button>
                  )}
                  {role === "teacher" && session.status === "live" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      onClick={() => handleStartClass(session)}
                    >
                      <Video className="w-3.5 h-3.5" /> Rejoin
                    </Button>
                  )}
                  {(role === "student" || role === "parent") && session.status === "live" && (
                    <Button
                      size="sm"
                      className="gap-1.5 bg-red-600 hover:bg-red-700"
                      onClick={() => handleJoinClass(session)}
                    >
                      <Play className="w-3.5 h-3.5" /> Join Now
                    </Button>
                  )}
                  {(role === "student" || role === "parent") && session.status === "scheduled" && (
                    <Button size="sm" variant="outline" disabled className="gap-1.5 text-gray-400">
                      <Clock className="w-3.5 h-3.5" /> Upcoming
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Session Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600" />
              Schedule Live Class
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Session Title *</Label>
              <Input
                placeholder="e.g., Kinematics — Motion in 2D"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Class *</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.data?.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input
                placeholder="Brief description of what will be covered"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (min)</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">60 min</SelectItem>
                    <SelectItem value="90">90 min</SelectItem>
                    <SelectItem value="120">120 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={createSession.isPending || !title || !scheduledAt || !selectedClassId}
              className="gap-2"
            >
              {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
