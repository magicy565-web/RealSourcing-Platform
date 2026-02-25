import { useState, useEffect, useRef, useCallback } from "react";
import type React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import ReactMarkdown from "react-markdown";
import { Icon as SolarIcon } from "@iconify/react";
import { Particles } from "@/components/magicui/particles";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BlurFade } from "@/components/magicui/blur-fade";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";

// ── Solar Icons 封装 ────────────────────────────────────────────────────────
const SIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => (
  <SolarIcon icon={`solar:${name}`} className={className} style={style} />
);
const Sparkles = (p: any) => <SIcon name="magic-stick-2-bold-duotone" {...p} />;
const Send = (p: any) => <SIcon name="send-square-bold-duotone" {...p} />;
const Building2 = (p: any) => <SIcon name="buildings-2-bold-duotone" {...p} />;
const Package = (p: any) => <SIcon name="delivery-bold-duotone" {...p} />;
const MessageSquare = (p: any) => <SIcon name="chat-round-dots-bold-duotone" {...p} />;
const TrendingUp = (p: any) => <SIcon name="chart-2-bold-duotone" {...p} />;
const RefreshCw = (p: any) => <SIcon name="refresh-circle-bold-duotone" {...p} />;
const Copy = (p: any) => <SIcon name="copy-bold-duotone" {...p} />;
const ExternalLink = (p: any) => <SIcon name="arrow-right-up-bold-duotone" {...p} />;
const Zap = (p: any) => <SIcon name="bolt-bold-duotone" {...p} />;
const Globe = (p: any) => <SIcon name="globe-bold-duotone" {...p} />;
const Shield = (p: any) => <SIcon name="shield-check-bold-duotone" {...p} />;
const Bot = (p: any) => <SIcon name="cpu-bolt-bold-duotone" {...p} />;
const User = (p: any) => <SIcon name="user-circle-bold-duotone" {...p} />;
const ChevronRight = (p: any) => <SIcon name="alt-arrow-right-bold-duotone" {...p} />;
const DollarSign = (p: any) => <SIcon name="dollar-minimalistic-bold-duotone" {...p} />;
const Loader = (p: any) => <SIcon name="refresh-circle-bold-duotone" {...p} />;
const Video = (p: any) => <SIcon name="videocamera-record-bold-duotone" {...p} />;
const Image = (p: any) => <SIcon name="gallery-bold-duotone" {...p} />;
const Certificate = (p: any) => <SIcon name="verified-check-bold-duotone" {...p} />;
const Attach = (p: any) => <SIcon name="paperclip-bold-duotone" {...p} />;
const Camera = (p: any) => <SIcon name="camera-bold-duotone" {...p} />;
const Link = (p: any) => <SIcon name="link-bold-duotone" {...p} />;
const Clock = (p: any) => <SIcon name="clock-circle-bold-duotone" {...p} />;
const Plus = (p: any) => <SIcon name="add-square-bold-duotone" {...p} />;
const Trash = (p: any) => <SIcon name="trash-bin-trash-bold-duotone" {...p} />;

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  suggestedActions?: string[];
  isStreaming?: boolean;
}

interface Session {
  id: string;
  title: string;
  preview: string;
  timestamp: Date;
  tag?: string;
  messages: Message[];
}

// ── Constants ────────────────────────────────────────────────────────────────
const FEATURE_CARDS = [
  {
    id: "factories",
    icon: Building2,
    iconColor: "#7c3aed",
    iconBg: "rgba(124,58,237,0.15)",
    title: "500+ Verified Factories",
    desc: "Audited suppliers with real export records",
    prompt: "Show me verified electronics factories with CE certification",
    animClass: "animate-float-1",
    glowColor: "rgba(124,58,237,0.20)",
  },
  {
    id: "image",
    icon: Image,
    iconColor: "#06b6d4",
    iconBg: "rgba(6,182,212,0.15)",
    title: "Image & PDF Analysis",
    desc: "Upload designs, catalogs, or product photos",
    prompt: "I want to analyze a product catalog or design file",
    animClass: "animate-float-2",
    glowColor: "rgba(6,182,212,0.20)",
  },
  {
    id: "video",
    icon: Video,
    iconColor: "#10b981",
    iconBg: "rgba(16,185,129,0.15)",
    title: "Live Video Meetings",
    desc: "Connect with factories in real-time",
    prompt: "Help me schedule a live video meeting with a factory",
    animClass: "animate-float-3",
    glowColor: "rgba(16,185,129,0.20)",
  },
  {
    id: "cert",
    icon: Certificate,
    iconColor: "#f59e0b",
    iconBg: "rgba(245,158,11,0.15)",
    title: "Cert Verification",
    desc: "CE, FCC, RoHS, ISO compliance checks",
    prompt: "Verify CE and FCC certifications for a factory",
    animClass: "animate-float-4",
    glowColor: "rgba(245,158,11,0.20)",
  },
];

const TRY_ASKING = [
  { tag: "Electronics", tagColor: "#7c3aed", text: "I need 500 units of wireless earbuds with CE cert" },
  { tag: "Pricing", tagColor: "#06b6d4", text: "Find factories for custom phone cases under $3/unit" },
  { tag: "Sourcing", tagColor: "#10b981", text: "Top-rated LED strip factories for TikTok Shop" },
  { tag: "OEM", tagColor: "#f59e0b", text: "Smart watch OEM with CE/FCC certification in Shenzhen" },
];

const QUICK_PROMPTS = [
  "Find factories for wireless earbuds with CE certification",
  "Compare prices for 1000 units of phone cases",
  "What's the average lead time for electronics factories?",
  "Help me write an inquiry for headphones",
  "Show me top-rated factories in Shenzhen",
  "How do I evaluate a factory's quality control?",
];

const WELCOME_MESSAGE: Message = {
  id: 1,
  role: "assistant",
  content: `Hello! I'm your **AI Procurement Advisor** powered by RealSourcing 4.0.

I can help you:
- **Match verified factories** in under 15 minutes
- **Analyze pricing** and negotiate better terms
- **Draft professional inquiries** to suppliers
- **Verify certifications** (CE, FCC, RoHS, ISO)
- **Schedule live meetings** with factory representatives

What are you looking to source today?`,
  timestamp: new Date(),
  suggestions: [
    "Find wireless earbuds factories",
    "Help me write an inquiry",
    "Verify factory certifications",
    "Compare factory prices",
  ],
};

// ── Animated GIF-like Feature Card ──────────────────────────────────────────
function FeatureCard({
  card,
  onClick,
  index,
}: {
  card: (typeof FEATURE_CARDS)[0];
  onClick: () => void;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const IconComp = card.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.08, duration: 0.4 }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center gap-4 px-5 py-4 rounded-2xl text-left w-full overflow-hidden transition-all duration-300"
      style={{
        background: hovered
          ? `rgba(255,255,255,0.06)`
          : "rgba(255,255,255,0.025)",
        border: hovered
          ? `1px solid ${card.glowColor}`
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: hovered ? `0 0 30px ${card.glowColor}` : "none",
      }}
    >
      {/* Animated icon container */}
      <div
        className="relative w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ background: card.iconBg }}
      >
        {/* Shimmer animation on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ x: "-100%", opacity: 0.6 }}
              animate={{ x: "200%", opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${card.iconColor}40, transparent)`,
              }}
            />
          )}
        </AnimatePresence>
        {/* Pulsing ring on hover */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0.6 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 rounded-xl"
              style={{ border: `1px solid ${card.iconColor}` }}
            />
          )}
        </AnimatePresence>
        <IconComp
          className="w-6 h-6 relative z-10"
          style={{ color: card.iconColor }}
        />
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-sm mb-0.5 truncate"
          style={{ color: hovered ? "#ffffff" : "rgba(255,255,255,0.85)" }}
        >
          {card.title}
        </p>
        <p
          className="text-xs truncate"
          style={{ color: "rgba(255,255,255,0.40)" }}
        >
          {card.desc}
        </p>
      </div>

      {/* Arrow indicator */}
      <motion.div
        animate={{ x: hovered ? 2 : 0, opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        style={{ color: card.iconColor }}
      >
        <ChevronRight className="w-4 h-4" />
      </motion.div>

      {/* Bottom glow line */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 left-0 right-0 h-[1px]"
            style={{ background: `linear-gradient(90deg, transparent, ${card.iconColor}, transparent)` }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ── Try Asking Card ──────────────────────────────────────────────────────────
function TryAskingCard({
  item,
  onClick,
  index,
}: {
  item: (typeof TRY_ASKING)[0];
  onClick: () => void;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.06, duration: 0.35 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col gap-2 px-4 py-3.5 rounded-xl text-left transition-all duration-200"
      style={{
        background: hovered ? "rgba(255,255,255,0.055)" : "rgba(255,255,255,0.025)",
        border: hovered
          ? `1px solid rgba(255,255,255,0.15)`
          : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full w-fit"
        style={{
          background: `${item.tagColor}20`,
          color: item.tagColor,
          border: `1px solid ${item.tagColor}30`,
        }}
      >
        {item.tag}
      </span>
      <p
        className="text-sm leading-snug"
        style={{ color: hovered ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.55)" }}
      >
        {item.text}
      </p>
    </motion.button>
  );
}

// ── Typing Dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "#7c3aed" }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIAssistant() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const [inputFocused, setInputFocused] = useState(false);

  const chatMutation = trpc.ai.procurementChat.useMutation({
    onSuccess: (response) => {
      const aiMessage: Message = {
        id: Date.now(),
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        suggestedActions: response.suggestedActions,
        suggestions: extractSuggestions(response.content),
      };
      setMessages((prev) => {
        const withoutLoading = prev.filter((m) => m.id !== -1);
        return [...withoutLoading, aiMessage];
      });
      // Update session preview
      if (activeSessionId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, preview: response.content.slice(0, 60) + "…" }
              : s
          )
        );
      }
    },
    onError: (error) => {
      setMessages((prev) => prev.filter((m) => m.id !== -1));
      toast.error("AI response failed: " + error.message);
    },
  });

  useEffect(() => {
    if (hasStarted) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, hasStarted]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [input]);

  function extractSuggestions(content: string): string[] {
    const lines = content.split("\n");
    const suggestions: string[] = [];
    for (const line of lines) {
      const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*/);
      if (match && suggestions.length < 4) suggestions.push(match[1]);
    }
    return suggestions;
  }

  const createNewSession = useCallback(
    (firstMessage: string): Session => {
      const id = Date.now().toString();
      const title =
        firstMessage.length > 40
          ? firstMessage.slice(0, 40) + "…"
          : firstMessage;
      const tag = firstMessage.toLowerCase().includes("electronic")
        ? "Electronics"
        : firstMessage.toLowerCase().includes("phone")
        ? "Accessories"
        : firstMessage.toLowerCase().includes("led") ||
          firstMessage.toLowerCase().includes("light")
        ? "Lighting"
        : "General";
      const newSession: Session = {
        id,
        title,
        preview: "Starting conversation…",
        timestamp: new Date(),
        tag,
        messages: [WELCOME_MESSAGE],
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(id);
      return newSession;
    },
    []
  );

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || chatMutation.isPending) return;

    if (!hasStarted) {
      setHasStarted(true);
      createNewSession(messageText);
    }

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    const loadingMessage: Message = {
      id: -1,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput("");

    const history = messages
      .filter((m) => m.id !== 1 && m.id !== -1)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    history.push({ role: "user", content: messageText });

    chatMutation.mutate({
      messages: history,
      context: { currentPage: "ai-assistant" },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setHasStarted(false);
    setActiveSessionId(null);
    textareaRef.current?.focus();
  };

  const handleNewSession = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    setHasStarted(false);
    setActiveSessionId(null);
  };

  const handleLoadSession = (session: Session) => {
    setMessages(session.messages.length > 1 ? session.messages : [WELCOME_MESSAGE]);
    setActiveSessionId(session.id);
    setHasStarted(session.messages.length > 1);
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      handleReset();
    }
  };

  const msgCount = messages.filter((m) => m.role === "user").length;

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const AISidebar = (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-64 flex flex-col relative z-10 overflow-hidden flex-shrink-0"
      style={{
        borderRight: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.012)",
      }}
    >
      <BorderBeam size={200} duration={14} colorFrom="#7c3aed" colorTo="#a78bfa20" />

      {/* Header */}
      <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              boxShadow: "0 0 20px rgba(124,58,237,0.30)",
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm" style={{ color: "rgba(255,255,255,0.90)" }}>
              AI Sourcing
              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-md" style={{ background: "rgba(124,58,237,0.25)", color: "#c4b5fd" }}>4.0</span>
            </h2>
            <p className="text-xs flex items-center gap-1" style={{ color: "#4ade80" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
              15-min Match
            </p>
          </div>
        </div>
        <ShimmerButton
          onClick={handleNewSession}
          className="w-full h-9 text-sm font-medium justify-center"
          shimmerColor="#c4b5fd"
          background="rgba(124,58,237,0.15)"
          borderRadius="0.75rem"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New Session
          <span className="ml-auto text-xs opacity-40">⌘K</span>
        </ShimmerButton>
      </div>

      {/* Recent Sessions */}
      <div className="flex-1 overflow-y-auto p-3">
        {sessions.length > 0 && (
          <>
            <p className="text-xs font-semibold mb-2 px-1" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
              RECENT
            </p>
            <div className="space-y-0.5 mb-4">
              {sessions.map((session) => (
                <motion.button
                  key={session.id}
                  whileHover={{ x: 2 }}
                  onClick={() => handleLoadSession(session)}
                  className="group w-full text-left px-3 py-2.5 rounded-xl transition-all relative"
                  style={{
                    background: activeSessionId === session.id ? "rgba(124,58,237,0.15)" : "transparent",
                    border: activeSessionId === session.id ? "1px solid rgba(124,58,237,0.25)" : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (activeSessionId !== session.id) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSessionId !== session.id) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.80)" }}>
                        {session.title}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.30)" }}>
                        {session.preview}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.20)" }}>
                        {session.timestamp.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {session.tag && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "rgba(124,58,237,0.15)", color: "#c4b5fd", fontSize: "10px" }}>
                          {session.tag}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg"
                    style={{ color: "rgba(255,255,255,0.30)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.10)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.30)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </motion.button>
              ))}
            </div>
          </>
        )}

        {/* Quick Start */}
        <p className="text-xs font-semibold mb-2 px-1" style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
          QUICK START
        </p>
        <div className="space-y-0.5">
          {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
            <motion.button
              key={prompt}
              whileHover={{ x: 3 }}
              onClick={() => handleSend(prompt)}
              disabled={chatMutation.isPending}
              className="w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-all disabled:opacity-50"
              style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.80)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; e.currentTarget.style.background = "transparent"; }}
            >
              <ChevronRight className="w-3 h-3 inline mr-1" style={{ color: "#7c3aed" }} />
              {prompt}
            </motion.button>
          ))}
        </div>
      </div>

      {/* AI Capabilities footer */}
      <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="rounded-xl p-3 space-y-1.5" style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.12)" }}>
          <p className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: "#c4b5fd" }}>
            <Zap className="w-3 h-3" />4.0 Capabilities
          </p>
          {[
            { icon: Building2, text: "500+ factories" },
            { icon: Image, text: "Image & PDF" },
            { icon: Link, text: "TikTok links" },
            { icon: Video, text: "Live meetings" },
            { icon: Globe, text: "EN / ZH" },
            { icon: Certificate, text: "Cert check" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
              <Icon className="w-3 h-3" style={{ color: "#7c3aed" }} />
              {text}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  // ── Welcome / Landing View ─────────────────────────────────────────────────
  const WelcomeView = (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative overflow-y-auto">
      {/* Title section */}
      <BlurFade delay={0.1} inView>
        <div className="text-center mb-8">
          <motion.h1
            className="text-4xl font-bold mb-3 tracking-tight"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            RealSourcing AI{" "}
            <span style={{ color: "#7c3aed" }}>4.0</span>
          </motion.h1>
          <p className="text-base" style={{ color: "rgba(255,255,255,0.45)" }}>
            Your AI Procurement Advisor — match verified factories in{" "}
            <span
              className="font-semibold"
              style={{ color: "#7c3aed" }}
            >
              under 15 minutes
            </span>
          </p>
        </div>
      </BlurFade>

      {/* Feature Cards Grid */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-3 mb-6">
        {FEATURE_CARDS.map((card, i) => (
          <FeatureCard
            key={card.id}
            card={card}
            index={i}
            onClick={() => {
              setInput(card.prompt);
              textareaRef.current?.focus();
            }}
          />
        ))}
      </div>

      {/* Input Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="w-full max-w-2xl mb-6"
      >
        <div
          ref={inputContainerRef}
          className="relative rounded-2xl overflow-hidden transition-all duration-300"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: inputFocused
              ? "1px solid rgba(124,58,237,0.50)"
              : "1px solid rgba(255,255,255,0.09)",
            boxShadow: inputFocused
              ? "0 0 0 3px rgba(124,58,237,0.10), 0 8px 40px rgba(124,58,237,0.12)"
              : "0 4px 24px rgba(0,0,0,0.20)",
          }}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Describe your product, paste a TikTok link, or drop a file..."
            className="w-full bg-transparent border-0 resize-none outline-none px-5 pt-4 pb-2 text-base"
            style={{
              color: "rgba(255,255,255,0.90)",
              minHeight: "72px",
              maxHeight: "160px",
            }}
            rows={2}
            disabled={chatMutation.isPending}
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 pb-3 pt-1">
            <div className="flex items-center gap-1">
              {[
                { icon: Attach, title: "Attach file" },
                { icon: Camera, title: "Upload image" },
                { icon: Link, title: "Paste link" },
              ].map(({ icon: Icon, title }) => (
                <motion.button
                  key={title}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  title={title}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                  style={{ color: "rgba(255,255,255,0.30)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.70)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.30)"; e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon className="w-4 h-4" />
                </motion.button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.20)" }}>
                ⇧ new line
              </span>
              <ShimmerButton
                onClick={() => handleSend()}
                disabled={!input.trim() || chatMutation.isPending}
                className="h-8 px-4 text-sm font-medium disabled:opacity-40"
                shimmerColor="#c4b5fd"
                background="linear-gradient(135deg, #7c3aed, #4f46e5)"
                borderRadius="0.625rem"
              >
                {chatMutation.isPending ? (
                  <Loader className="w-4 h-4 animate-spin text-white mr-1.5" />
                ) : (
                  <Send className="w-4 h-4 text-white mr-1.5" />
                )}
                Send
              </ShimmerButton>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Try Asking */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        className="w-full max-w-2xl"
      >
        <p
          className="text-center text-xs font-semibold mb-3 tracking-widest"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          TRY ASKING
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TRY_ASKING.map((item, i) => (
            <TryAskingCard
              key={item.text}
              item={item}
              index={i}
              onClick={() => handleSend(item.text)}
            />
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-xs mt-6"
        style={{ color: "rgba(255,255,255,0.15)" }}
      >
        RealSourcing AI 4.0 · Powered by Qwen Plus
      </motion.p>
    </div>
  );

  // ── Chat View ──────────────────────────────────────────────────────────────
  const ChatView = (
    <div className="flex-1 flex flex-col min-w-0 relative z-10">
      {/* Top bar */}
      <div
        className="h-14 flex items-center justify-between px-6 flex-shrink-0"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(9,9,11,0.85)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 16px rgba(124,58,237,0.25)" }}
          >
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.90)" }}>
              AI Procurement Advisor
            </h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Powered by Qwen Plus · RealSourcing 4.0
            </p>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{
              background: "rgba(74,222,128,0.10)",
              border: "1px solid rgba(74,222,128,0.20)",
              color: "#4ade80",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
            Live
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs flex items-center gap-1" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Package className="w-3.5 h-3.5" />
            {msgCount} msgs
          </span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.40)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.80)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.40)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Chat
          </motion.button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <BlurFade key={msg.id} delay={idx === 0 ? 0.05 : 0} inView>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 group ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 self-start mt-0.5"
                  style={{
                    background:
                      msg.role === "assistant"
                        ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                        : "rgba(59,130,246,0.70)",
                    boxShadow:
                      msg.role === "assistant"
                        ? "0 0 16px rgba(124,58,237,0.25)"
                        : "none",
                  }}
                >
                  {msg.role === "assistant" ? (
                    <Sparkles className="w-4 h-4 text-white" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Content */}
                <div
                  className={`max-w-[78%] space-y-2 ${msg.role === "user" ? "items-end flex flex-col" : ""}`}
                >
                  {msg.isStreaming ? (
                    <div
                      className="rounded-2xl rounded-tl-sm px-4 py-3"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <TypingDots />
                        <span className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
                          Thinking...
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="rounded-2xl px-4 py-3"
                      style={{
                        background:
                          msg.role === "assistant"
                            ? "rgba(255,255,255,0.03)"
                            : "linear-gradient(135deg, #3b82f6, #2563eb)",
                        border:
                          msg.role === "assistant"
                            ? "1px solid rgba(255,255,255,0.07)"
                            : "none",
                        borderRadius:
                          msg.role === "assistant"
                            ? "0 1rem 1rem 1rem"
                            : "1rem 0 1rem 1rem",
                      }}
                    >
                      {msg.role === "assistant" ? (
                        <div
                          className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:text-white prose-strong:text-white text-sm"
                          style={{ color: "rgba(255,255,255,0.75)" }}
                        >
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm text-white whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  {msg.role === "assistant" && !msg.isStreaming && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => handleCopy(msg.content)}
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: "rgba(255,255,255,0.25)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.80)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "transparent"; }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </motion.button>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
                        {msg.timestamp.toLocaleTimeString("en", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  {/* Suggested actions */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.suggestedActions.map((action) => {
                        const [type, id] = action.split(":");
                        const labels: Record<string, string> = {
                          VIEW_FACTORY: "View Factory",
                          REQUEST_SAMPLE: "Request Sample",
                          SEND_INQUIRY: "Send Inquiry",
                          SCHEDULE_MEETING: "Schedule Meeting",
                        };
                        return (
                          <motion.button
                            key={action}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              if (type === "VIEW_FACTORY") setLocation(`/factory/${id}`);
                              else if (type === "SEND_INQUIRY") setLocation(`/inquiries`);
                              else if (type === "SCHEDULE_MEETING") setLocation(`/meetings`);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                            style={{
                              background: "rgba(124,58,237,0.12)",
                              border: "1px solid rgba(124,58,237,0.25)",
                              color: "#c4b5fd",
                            }}
                          >
                            <ExternalLink className="w-3 h-3" />
                            {labels[type] || type}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* Suggestion chips */}
                  {msg.suggestions &&
                    msg.suggestions.length > 0 &&
                    !msg.isStreaming && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {msg.suggestions.map((s) => (
                          <motion.button
                            key={s}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handleSend(s)}
                            disabled={chatMutation.isPending}
                            className="px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-50"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "rgba(255,255,255,0.40)",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.80)"; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.40)"; e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                          >
                            {s}
                          </motion.button>
                        ))}
                      </div>
                    )}
                </div>
              </motion.div>
            </BlurFade>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        className="p-4 flex-shrink-0"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(9,9,11,0.85)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-3xl mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: inputFocused
                ? "1px solid rgba(124,58,237,0.45)"
                : "1px solid rgba(255,255,255,0.08)",
              boxShadow: inputFocused
                ? "0 0 0 3px rgba(124,58,237,0.08)"
                : "none",
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Describe your product, paste a TikTok link, or drop a file..."
              className="w-full bg-transparent border-0 resize-none outline-none px-5 pt-4 pb-2 text-sm"
              style={{
                color: "rgba(255,255,255,0.90)",
                minHeight: "52px",
                maxHeight: "140px",
              }}
              rows={1}
              disabled={chatMutation.isPending}
            />
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <div className="flex items-center gap-1">
                {[
                  { icon: Attach, title: "Attach file" },
                  { icon: Camera, title: "Upload image" },
                  { icon: Link, title: "Paste link" },
                ].map(({ icon: Icon, title }) => (
                  <motion.button
                    key={title}
                    whileHover={{ scale: 1.1 }}
                    title={title}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: "rgba(255,255,255,0.25)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </motion.button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs hidden sm:block" style={{ color: "rgba(255,255,255,0.18)" }}>
                  ⇧↵ new line · ↵ send
                </span>
                <ShimmerButton
                  onClick={() => handleSend()}
                  disabled={!input.trim() || chatMutation.isPending}
                  className="h-8 px-3 text-sm font-medium disabled:opacity-40"
                  shimmerColor="#c4b5fd"
                  background="linear-gradient(135deg, #7c3aed, #4f46e5)"
                  borderRadius="0.625rem"
                >
                  {chatMutation.isPending ? (
                    <Loader className="w-3.5 h-3.5 animate-spin text-white mr-1" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white mr-1" />
                  )}
                  Send
                </ShimmerButton>
              </div>
            </div>
          </div>
          <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.15)" }}>
            RealSourcing AI 4.0 · Powered by Qwen Plus
          </p>
        </div>
      </div>
    </div>
  );

  // ── Full Page Layout ───────────────────────────────────────────────────────
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#09090b" }}
    >
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute -top-60 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)" }}
        />
      </div>

      {/* Particles */}
      <Particles
        className="fixed inset-0 pointer-events-none z-0"
        quantity={15}
        color="#7c3aed"
        ease={80}
        size={0.4}
      />

      {/* AI Sidebar */}
      {AISidebar}

      {/* Main content */}
      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col relative z-10"
          >
            {/* Top bar for welcome view */}
            <div
              className="h-14 flex items-center justify-between px-6 flex-shrink-0"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(9,9,11,0.85)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4" style={{ color: "#7c3aed" }} />
                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.70)" }}>
                  AI Procurement Advisor
                </span>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{
                  background: "rgba(74,222,128,0.10)",
                  border: "1px solid rgba(74,222,128,0.20)",
                  color: "#4ade80",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
                Live
              </span>
            </div>
            {WelcomeView}
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col min-w-0 relative z-10"
          >
            {ChatView}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
