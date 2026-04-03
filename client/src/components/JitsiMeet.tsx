/**
 * JitsiMeet — Embedded Jitsi video conferencing component
 *
 * Uses the Jitsi Meet External API (8x8.vc public instance) to embed
 * a video conference room. No API key required for basic usage.
 *
 * Teacher: starts a session → room name is derived from session ID
 * Student: joins the same room via the session's meetingUrl
 */
import { useEffect, useRef, useState } from "react";
import { Loader2, Video, VideoOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface JitsiMeetProps {
  roomName: string;
  displayName: string;
  onClose?: () => void;
  isHost?: boolean;
}

export default function JitsiMeet({ roomName, displayName, onClose, isHost = false }: JitsiMeetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Jitsi External API script
    const loadJitsi = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://8x8.vc/vpaas-magic-cookie-free/external_api.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Jitsi API"));
        document.head.appendChild(script);
      });
    };

    loadJitsi()
      .then(() => {
        if (!containerRef.current) return;
        // Sanitize room name: lowercase, alphanumeric + hyphens only
        const sanitizedRoom = `jeemaster-${roomName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`;

        apiRef.current = new window.JitsiMeetExternalAPI("8x8.vc", {
          roomName: `vpaas-magic-cookie-free/${sanitizedRoom}`,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: {
            displayName,
          },
          configOverwrite: {
            startWithAudioMuted: !isHost,
            startWithVideoMuted: !isHost,
            disableDeepLinking: true,
            prejoinPageEnabled: false,
            enableWelcomePage: false,
            toolbarButtons: [
              "microphone", "camera", "closedcaptions", "desktop",
              "fullscreen", "fodeviceselection", "hangup", "profile",
              "chat", "recording", "livestreaming", "etherpad",
              "sharedvideo", "settings", "raisehand", "videoquality",
              "filmstrip", "feedback", "stats", "shortcuts",
              "tileview", "select-background", "download", "help",
              "mute-everyone", "security"
            ],
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: "",
            SHOW_POWERED_BY: false,
            DISPLAY_WELCOME_PAGE_CONTENT: false,
            APP_NAME: "JEE Master Prep Live",
            NATIVE_APP_NAME: "JEE Master Prep",
            PROVIDER_NAME: "JEE Master Prep",
          },
        });

        apiRef.current.addEventListener("videoConferenceJoined", () => {
          setLoading(false);
        });

        apiRef.current.addEventListener("videoConferenceLeft", () => {
          onClose?.();
        });

        apiRef.current.addEventListener("readyToClose", () => {
          onClose?.();
        });

        // Fallback: hide loader after 5 seconds even if event doesn't fire
        setTimeout(() => setLoading(false), 5000);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [roomName, displayName, isHost]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-gray-900 rounded-xl p-8">
        <VideoOff className="w-12 h-12 text-red-400" />
        <p className="text-white font-medium">Failed to load video conference</p>
        <p className="text-gray-400 text-sm text-center">{error}</p>
        <Button variant="outline" onClick={onClose} className="gap-2">
          <X className="w-4 h-4" /> Close
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-900">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 z-10">
          <Video className="w-10 h-10 text-indigo-400 animate-pulse" />
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          <p className="text-gray-300 text-sm">Connecting to live class...</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
