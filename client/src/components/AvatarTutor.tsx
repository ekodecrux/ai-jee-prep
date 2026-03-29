import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, X, ChevronDown, MessageCircle, Sparkles } from "lucide-react";

type AvatarState = "idle" | "speaking" | "listening" | "thinking" | "celebrating";

interface AvatarTutorProps {
  chapterId?: string;
  chapterTitle?: string;
  context?: string;
  mode?: "lesson" | "doubt" | "welcome" | "parent";
  onClose?: () => void;
  minimized?: boolean;
}

// ─── Animated SVG Avatar (Priya) ─────────────────────────────────────────────
function PriyaAvatar({ state }: { state: AvatarState }) {
  return (
    <svg
      viewBox="0 0 100 120"
      className={`w-full h-full ${state === "celebrating" ? "avatar-celebrating" : "avatar-breathe"}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background glow */}
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="oklch(0.55 0.22 250 / 0.3)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="skinGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#f5c5a3" />
          <stop offset="100%" stopColor="#e8a882" />
        </radialGradient>
        <radialGradient id="hairGrad" cx="50%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#3d2314" />
          <stop offset="100%" stopColor="#1a0d08" />
        </radialGradient>
      </defs>

      {/* Glow */}
      <ellipse cx="50" cy="75" rx="35" ry="20" fill="url(#bgGlow)" />

      {/* Body / Saree */}
      <ellipse cx="50" cy="105" rx="28" ry="22" fill="#4f46e5" opacity="0.9" />
      <ellipse cx="50" cy="98" rx="20" ry="14" fill="#6366f1" />
      {/* Saree border */}
      <path d="M 22 105 Q 50 115 78 105" stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.8" />

      {/* Neck */}
      <rect x="44" y="72" width="12" height="10" rx="4" fill="url(#skinGrad)" />

      {/* Head */}
      <ellipse
        cx="50" cy="55" rx="22" ry="24"
        fill="url(#skinGrad)"
        className={state === "thinking" ? "avatar-thinking" : ""}
      />

      {/* Hair */}
      <ellipse cx="50" cy="38" rx="22" ry="14" fill="url(#hairGrad)" />
      {/* Hair parting */}
      <path d="M 50 28 L 50 38" stroke="#5c3317" strokeWidth="1" />
      {/* Hair bun */}
      <circle cx="50" cy="28" r="7" fill="url(#hairGrad)" />
      <circle cx="50" cy="28" r="4" fill="#5c3317" />
      {/* Bindi */}
      <circle cx="50" cy="44" r="1.5" fill="#dc2626" />

      {/* Ears */}
      <ellipse cx="28" cy="55" rx="3" ry="4" fill="url(#skinGrad)" />
      <ellipse cx="72" cy="55" rx="3" ry="4" fill="url(#skinGrad)" />
      {/* Earrings */}
      <circle cx="28" cy="59" r="2" fill="#fbbf24" />
      <circle cx="72" cy="59" r="2" fill="#fbbf24" />

      {/* Eyes */}
      <g className="avatar-blink">
        {/* Left eye */}
        <ellipse cx="42" cy="52" rx="4" ry="3.5" fill="white" />
        <circle cx="42" cy="52" r="2.5" fill="#3d2314" />
        <circle cx="42" cy="52" r="1.5" fill="#1a0d08" />
        <circle cx="43" cy="51" r="0.7" fill="white" />
        {/* Left eyebrow */}
        <path d="M 38 47 Q 42 45 46 47" stroke="#3d2314" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Left eyelashes */}
        <path d="M 38 50 L 37 48" stroke="#1a0d08" strokeWidth="0.8" />
        <path d="M 46 50 L 47 48" stroke="#1a0d08" strokeWidth="0.8" />

        {/* Right eye */}
        <ellipse cx="58" cy="52" rx="4" ry="3.5" fill="white" />
        <circle cx="58" cy="52" r="2.5" fill="#3d2314" />
        <circle cx="58" cy="52" r="1.5" fill="#1a0d08" />
        <circle cx="59" cy="51" r="0.7" fill="white" />
        {/* Right eyebrow */}
        <path d="M 54 47 Q 58 45 62 47" stroke="#3d2314" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        {/* Right eyelashes */}
        <path d="M 54 50 L 53 48" stroke="#1a0d08" strokeWidth="0.8" />
        <path d="M 62 50 L 63 48" stroke="#1a0d08" strokeWidth="0.8" />
      </g>

      {/* Nose */}
      <path d="M 50 55 Q 47 60 48 62 Q 50 63 52 62 Q 53 60 50 55" fill="url(#skinGrad)" stroke="#d4956a" strokeWidth="0.5" />

      {/* Mouth */}
      <g className={state === "speaking" ? "avatar-speaking" : ""}>
        {state === "speaking" ? (
          <>
            <path d="M 43 67 Q 50 72 57 67" stroke="#c0725a" strokeWidth="1.5" fill="#e8a882" strokeLinecap="round" />
            <path d="M 44 67 Q 50 70 56 67" fill="#dc8b7a" />
          </>
        ) : state === "celebrating" ? (
          <>
            <path d="M 43 67 Q 50 74 57 67" stroke="#c0725a" strokeWidth="1.5" fill="#e8a882" strokeLinecap="round" />
            <path d="M 44 67 Q 50 72 56 67" fill="#dc8b7a" />
            {/* Teeth */}
            <path d="M 44 67 Q 50 70 56 67 L 56 69 Q 50 72 44 69 Z" fill="white" />
          </>
        ) : (
          <path d="M 44 67 Q 50 70 56 67" stroke="#c0725a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}
        {/* Lips */}
        <path d="M 43 67 Q 50 65 57 67" stroke="#b05a42" strokeWidth="0.8" fill="none" />
      </g>

      {/* Cheeks (blush) */}
      <ellipse cx="37" cy="60" rx="5" ry="3" fill="#f87171" opacity="0.25" />
      <ellipse cx="63" cy="60" rx="5" ry="3" fill="#f87171" opacity="0.25" />

      {/* Necklace */}
      <path d="M 38 76 Q 50 82 62 76" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
      <circle cx="50" cy="81" r="2" fill="#fbbf24" />

      {/* State indicators */}
      {state === "thinking" && (
        <g>
          <circle cx="68" cy="40" r="2" fill="oklch(0.55 0.22 250)" opacity="0.6" />
          <circle cx="74" cy="34" r="3" fill="oklch(0.55 0.22 250)" opacity="0.7" />
          <circle cx="80" cy="26" r="4" fill="oklch(0.55 0.22 250)" opacity="0.8" />
          <text x="77" y="29" textAnchor="middle" fontSize="5" fill="white">?</text>
        </g>
      )}
      {state === "celebrating" && (
        <g>
          <text x="20" y="30" fontSize="8" fill="#fbbf24">★</text>
          <text x="72" y="25" fontSize="6" fill="#34d399">✓</text>
          <text x="15" y="50" fontSize="5" fill="#f87171">♦</text>
          <text x="80" y="45" fontSize="5" fill="#818cf8">●</text>
        </g>
      )}
    </svg>
  );
}

// ─── Voice Wave Indicator ─────────────────────────────────────────────────────
function VoiceWave({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="flex items-end gap-0.5 h-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="voice-wave-bar"
          style={{ height: `${20 + Math.random() * 60}%`, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

// ─── Main Avatar Tutor Component ──────────────────────────────────────────────
export default function AvatarTutor({
  chapterId,
  chapterTitle,
  context,
  mode = "doubt",
  onClose,
  minimized: initialMinimized = false,
}: AvatarTutorProps) {
  const [state, setState] = useState<AvatarState>("idle");
  const [minimized, setMinimized] = useState(initialMinimized);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [inputText, setInputText] = useState("");
  const [conversation, setConversation] = useState<Array<{ role: "user" | "avatar"; text: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSpeechText, setCurrentSpeechText] = useState("");

  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of conversation
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation]);

  // Welcome message on mount
  useEffect(() => {
    const welcomeMessages: Record<string, string> = {
      lesson: `Namaste! I'm Priya, your AI tutor. Today we'll study ${chapterTitle || "this chapter"} together. I'll explain each concept clearly with examples. You can ask me any doubt anytime!`,
      doubt: `Hi! I'm Priya. Ask me any doubt about ${chapterTitle || "your studies"} and I'll explain it clearly with examples.`,
      welcome: "Namaste! I'm Priya, your personal JEE tutor. I'm here to help you master all 80 chapters and crack JEE with confidence!",
      parent: `Hello! I'm Priya, your child's AI tutor. I can give you a detailed update on their progress in ${chapterTitle || "all subjects"}.`,
    };
    const msg = welcomeMessages[mode];
    setConversation([{ role: "avatar", text: msg }]);
    if (voiceEnabled) speakText(msg);
  }, []);

  // Text-to-Speech
  const speakText = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Pick a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(
      (v) =>
        v.name.includes("Female") ||
        v.name.includes("Samantha") ||
        v.name.includes("Victoria") ||
        v.name.includes("Karen") ||
        v.name.includes("Moira") ||
        (v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
    ) || voices.find((v) => v.lang.startsWith("en-IN")) || voices[0];

    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.rate = 0.92;
    utterance.pitch = 1.1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setState("speaking");
      setIsSpeaking(true);
      setCurrentSpeechText(text);
    };
    utterance.onend = () => {
      setState("idle");
      setIsSpeaking(false);
      setCurrentSpeechText("");
    };
    utterance.onerror = () => {
      setState("idle");
      setIsSpeaking(false);
    };

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // Stop speaking
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setState("idle");
    setIsSpeaking(false);
  };

  // Voice input (Speech Recognition)
  const startListening = () => {
    type SpeechRecognitionCtor = new () => { lang: string; continuous: boolean; interimResults: boolean; onstart: (() => void) | null; onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void; };
    const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in your browser. Please use Chrome.");
      return;
    }

    stopSpeaking();
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setState("listening");
      setIsListening(true);
    };
    recognition.onresult = (event: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
      setState("idle");
      // Auto-submit after voice input
      handleAsk(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setState("idle");
    };
    recognition.onend = () => {
      setIsListening(false);
      if (state === "listening") setState("idle");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setState("idle");
  };

  // Ask a question to the AI
  const handleAsk = async (question?: string) => {
    const q = question || inputText.trim();
    if (!q) return;

    setInputText("");
    setConversation((prev) => [...prev, { role: "user", text: q }]);
    setState("thinking");
    setIsLoading(true);

    try {
      // Use LLM directly via fetch for doubt clarification
      const response = await fetch("/api/v1/ask-doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, chapterId: chapterId || "", context: context || chapterTitle || "" }),
      });
      const data = await response.json();
      const answer = data.answer || "I couldn't find an answer. Please try rephrasing your question.";
      setConversation((prev) => [...prev, { role: "avatar", text: answer }]);
      setState("idle");
      setIsLoading(false);

      if (voiceEnabled) speakText(answer);
    } catch {
      const fallback = "I'm sorry, I couldn't process that question right now. Please try again or rephrase your doubt.";
      setConversation((prev) => [...prev, { role: "avatar", text: fallback }]);
      setState("idle");
      setIsLoading(false);
    }
  };

  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setMinimized(false)}
          className="md3-fab flex items-center gap-2 px-4 rounded-2xl"
          style={{ width: "auto", height: "3.5rem" }}
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-900 flex-shrink-0">
            <PriyaAvatar state="idle" />
          </div>
          <span className="text-sm font-medium text-white">Ask Priya</span>
          {conversation.length > 1 && (
            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {conversation.filter((c) => c.role === "avatar").length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col" style={{ width: "360px" }}>
      {/* Avatar Panel */}
      <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-3 border-b border-border bg-muted/30">
          {/* Avatar */}
          <div className="relative w-14 h-16 flex-shrink-0">
            <div className="w-full h-full rounded-xl overflow-hidden bg-gradient-to-b from-indigo-950 to-indigo-900">
              <PriyaAvatar state={state} />
            </div>
            {/* Status indicator */}
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
                state === "speaking" ? "bg-blue-400 animate-pulse" :
                state === "listening" ? "bg-green-400 animate-pulse" :
                state === "thinking" ? "bg-amber-400 animate-pulse" :
                "bg-gray-400"
              }`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-foreground">Priya</span>
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-muted-foreground">AI Tutor</span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {state === "speaking" ? (
                <span className="text-blue-400 flex items-center gap-1">
                  <VoiceWave active={true} />
                  Speaking...
                </span>
              ) : state === "listening" ? (
                <span className="text-green-400">Listening to you...</span>
              ) : state === "thinking" ? (
                <span className="text-amber-400">Thinking...</span>
              ) : (
                <span>{chapterTitle ? `📚 ${chapterTitle}` : "Ready to help"}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (isSpeaking) stopSpeaking();
              }}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title={voiceEnabled ? "Mute voice" : "Enable voice"}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-muted-foreground" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
            </button>
            <button
              onClick={() => setMinimized(true)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation */}
        <div className="p-3 space-y-3 overflow-y-auto" style={{ maxHeight: "280px" }}>
          {conversation.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.role === "avatar" && (
                <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-900 flex-shrink-0 mt-0.5">
                  <PriyaAvatar state="idle" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-muted text-foreground rounded-tl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-indigo-900 flex-shrink-0">
                <PriyaAvatar state="thinking" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAsk()}
              placeholder="Ask Priya a doubt..."
              className="flex-1 bg-muted rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/50 transition-colors"
              disabled={isLoading || isListening}
            />
            <button
              onClick={isListening ? stopListening : startListening}
              className={`p-2 rounded-full transition-all ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
              }`}
              title={isListening ? "Stop listening" : "Voice input"}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleAsk()}
              disabled={!inputText.trim() || isLoading}
              className="p-2 rounded-full bg-primary text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Powered by AI · Voice input supported in Chrome
          </p>
        </div>
      </div>
    </div>
  );
}
