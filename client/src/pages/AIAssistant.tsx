import React, { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import BuyerSidebar from "@/components/BuyerSidebar";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import {
  Paperclip, Image as ImageIcon, Link2, Send, ArrowRight,
  Building2, ScanSearch, Video, ShieldCheck, Star, MapPin,
  Clock, Package, CheckCircle2, Sparkles, MessageSquare, Zap, TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase =
  | "welcome" | "price" | "leadtime" | "customization"
  | "quantity" | "qualification" | "summary" | "quotes" | "followup";

interface SessionState {
  currentPhase: Phase;
  preferences: Record<string, unknown>;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

interface QuoteCard {
  quoteId: string;
  factoryId?: number;
  factoryName: string;
  factoryScore: number;
  isVerified: boolean;
  productName: string;
  productCategory?: string;
  unitPrice?: number | null;
  currency?: string;
  moq?: number;
  leadTimeDays?: number;
  matchScore: number;
  matchReasons?: string[];
  certifications?: string[];
  location?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  phase?: Phase;
  quotes?: QuoteCard[];
  isTyping?: boolean;
}

// ─── Guide cards ──────────────────────────────────────────────────────────────
const guideCards = [
  {
    step: "01", img: "/guide-01-describe.png", title: "描述需求",
    desc: "用自然语言告诉 AI 您需要什么产品、数量和规格，支持中英文、图片与 TikTok 链接。",
    color: "#7c3aed",
  },
  {
    step: "02", img: "/guide-02-match.png", title: "AI 匹配工厂",
    desc: "系统自动从 500+ 认证工厂库中筛选最匹配的供应商，并展示真实出口记录和评分。",
    color: "#0ea5e9",
  },
  {
    step: "03", img: "/guide-03-verify.png", title: "验证与报价",
    desc: "一键核查 CE、FCC、RoHS 等认证资质，同步获取多家工厂的竞争性报价。",
    color: "#10b981",
  },
  {
    step: "04", img: "/guide-04-meeting.png", title: "视频会议下单",
    desc: "通过内置视频会议与工厂实时沟通，确认样品细节，快速完成采购决策。",
    color: "#f59e0b",
  },
];

// ─── Phase config ─────────────────────────────────────────────────────────────
const PHASE_PROGRESS: Record<Phase, number> = {
  welcome: 5, price: 20, leadtime: 35, customization: 50,
  quantity: 65, qualification: 80, summary: 90, quotes: 100, followup: 100,
};
const PHASE_LABELS: Record<Phase, string> = {
  welcome: "了解需求", price: "价格预算", leadtime: "交期要求",
  customization: "定制需求", quantity: "采购数量", qualification: "工厂资质",
  summary: "需求确认", quotes: "报价结果", followup: "跟进",
};

// ─── Chips ────────────────────────────────────────────────────────────────────
const chips = [
  { Icon: Building2, label: "500+ Factories", color: "#7c3aed" },
  { Icon: ScanSearch, label: "Image Analysis", color: "#0ea5e9" },
  { Icon: Video, label: "Live Meetings", color: "#10b981" },
  { Icon: ShieldCheck, label: "Cert Check", color: "#f59e0b" },
];

// ─── TypingIndicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "10px 14px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#7c3aed",
          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}`}</style>
    </div>
  );
}

// ─── QuoteCardItem ────────────────────────────────────────────────────────────
function QuoteCardItem({ quote }: { quote: QuoteCard }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "rgba(124,58,237,0.13)" : "rgba(124,58,237,0.07)",
        border: `1px solid ${hovered ? "rgba(124,58,237,0.55)" : "rgba(124,58,237,0.22)"}`,
        borderRadius: 14, padding: "16px 18px", marginBottom: 10,
        transition: "all 0.2s", cursor: "pointer",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "rgba(124,58,237,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Building2 size={17} color="#a78bfa" />
          </div>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}>{quote.factoryName}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
              {quote.isVerified && (
                <span style={{
                  background: "rgba(16,185,129,0.15)", color: "#34d399",
                  fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 5,
                }}>✓ 已验证</span>
              )}
              <span style={{ color: "#64748b", fontSize: 11 }}>
                <MapPin size={9} style={{ display: "inline", marginRight: 2 }} />
                {quote.location || "中国"}
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#a78bfa", fontWeight: 800, fontSize: 20 }}>{quote.matchScore}%</div>
          <div style={{ color: "#475569", fontSize: 10 }}>匹配度</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 18, marginBottom: 10, flexWrap: "wrap" }}>
        {quote.unitPrice != null && (
          <div>
            <div style={{ color: "#64748b", fontSize: 10, marginBottom: 2 }}>单价</div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 15 }}>
              ${quote.unitPrice.toFixed(2)} <span style={{ color: "#475569", fontSize: 11 }}>{quote.currency || "USD"}</span>
            </div>
          </div>
        )}
        {quote.moq != null && (
          <div>
            <div style={{ color: "#64748b", fontSize: 10, marginBottom: 2 }}>MOQ</div>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13 }}>
              <Package size={10} style={{ display: "inline", marginRight: 3 }} />
              {quote.moq.toLocaleString()}
            </div>
          </div>
        )}
        {quote.leadTimeDays != null && (
          <div>
            <div style={{ color: "#64748b", fontSize: 10, marginBottom: 2 }}>交期</div>
            <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13 }}>
              <Clock size={10} style={{ display: "inline", marginRight: 3 }} />
              {quote.leadTimeDays}天
            </div>
          </div>
        )}
        <div>
          <div style={{ color: "#64748b", fontSize: 10, marginBottom: 2 }}>评分</div>
          <div style={{ color: "#fbbf24", fontWeight: 600, fontSize: 13 }}>
            <Star size={10} style={{ display: "inline", marginRight: 2 }} />
            {quote.factoryScore.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Match reasons */}
      {quote.matchReasons && quote.matchReasons.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {quote.matchReasons.map((r, i) => (
            <span key={i} style={{
              background: "rgba(99,102,241,0.12)", color: "#a5b4fc",
              fontSize: 11, padding: "2px 8px", borderRadius: 6,
            }}>
              <CheckCircle2 size={9} style={{ display: "inline", marginRight: 3 }} />{r}
            </span>
          ))}
        </div>
      )}

      {/* Certs */}
      {quote.certifications && quote.certifications.length > 0 && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
          {quote.certifications.map((c, i) => (
            <span key={i} style={{
              background: "rgba(245,158,11,0.1)", color: "#fbbf24",
              fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 5,
              border: "1px solid rgba(245,158,11,0.2)",
            }}>{c}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{
          flex: 1, background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.4)",
          color: "#c4b5fd", borderRadius: 9, padding: "7px 12px", fontSize: 12,
          cursor: "pointer", fontWeight: 600,
        }}>
          <Video size={11} style={{ display: "inline", marginRight: 5 }} />预约会议
        </button>
        <button style={{
          flex: 1, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)",
          color: "#34d399", borderRadius: 9, padding: "7px 12px", fontSize: 12,
          cursor: "pointer", fontWeight: 600,
        }}>
          <MessageSquare size={11} style={{ display: "inline", marginRight: 5 }} />发送询盘
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIAssistant() {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [sessionState, setSessionState] = useState<SessionState>({
    currentPhase: "welcome",
    preferences: {},
    conversationHistory: [],
  });
  const [progressPercent, setProgressPercent] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const agentWelcomeMutation = trpc.ai.agentWelcome.useMutation();
  const agentChatMutation = trpc.ai.agentChat.useMutation();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start session
  const startSession = useCallback(async () => {
    if (isLoading || hasStarted) return;
    setIsLoading(true);
    setHasStarted(true);
    try {
      const result = await agentWelcomeMutation.mutateAsync();
      setMessages([{
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: result.content,
        timestamp: new Date(),
        phase: (result.phase as Phase) || "welcome",
      }]);
      const newState: SessionState = {
        currentPhase: ((result.sessionState as any)?.currentPhase as Phase) || "welcome",
        preferences: (result.sessionState as any)?.preferences || {},
        conversationHistory: (result.sessionState as any)?.conversationHistory || [],
      };
      setSessionState(newState);
      setProgressPercent(result.progressPercent || 0);
    } catch {
      setMessages([{
        id: `welcome-fallback-${Date.now()}`,
        role: "assistant",
        content: "您好！我是您的 AI 采购顾问 🤖\n\n请告诉我：**您想采购什么产品？**",
        timestamp: new Date(),
        phase: "welcome",
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasStarted, agentWelcomeMutation]);

  // Send message
  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? inputValue).trim();
    if (!content || isLoading) return;
    setInputValue("");

    // If no session started yet, start one first then send
    if (!hasStarted) {
      setHasStarted(true);
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    const typingId = `typing-${Date.now()}`;
    const typingMsg: Message = {
      id: typingId, role: "assistant", content: "",
      timestamp: new Date(), isTyping: true,
    };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setIsLoading(true);

    try {
      const result = await agentChatMutation.mutateAsync({
        sessionId,
        message: content,
        sessionState,
      });

      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: result.content || "",
        timestamp: new Date(),
        phase: (result.phase as Phase) || sessionState.currentPhase,
        quotes: result.quotes as QuoteCard[] | undefined,
      }));
      const updatedState: SessionState = {
        currentPhase: ((result.sessionState as any)?.currentPhase as Phase) || sessionState.currentPhase,
        preferences: (result.sessionState as any)?.preferences || sessionState.preferences,
        conversationHistory: (result.sessionState as any)?.conversationHistory || sessionState.conversationHistory,
      };
      setSessionState(updatedState);
      setProgressPercent(result.progressPercent || 0);
    } catch {
      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "抱歉，我暂时无法处理您的请求，请稍后再试。",
        timestamp: new Date(),
      }));
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, hasStarted, sessionId, sessionState, agentChatMutation]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentPhase = sessionState.currentPhase;
  const progress = PHASE_PROGRESS[currentPhase] || progressPercent;

  // ─── Input Box (shared) ───────────────────────────────────────────────────
  const renderInputBox = (placeholder: string, compact = false) => (
    <div style={{
      background: "rgba(12,12,24,0.9)",
      border: "1px solid rgba(124,58,237,0.32)",
      borderRadius: 16, overflow: "hidden",
      boxShadow: "0 0 32px rgba(124,58,237,0.1)",
      backdropFilter: "blur(12px)",
    }}>
      <textarea
        ref={inputRef}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
        disabled={isLoading}
        style={{
          width: "100%", background: "transparent", border: "none",
          outline: "none", color: "#e2e8f0", fontSize: 15,
          padding: compact ? "14px 18px 8px" : "18px 20px 10px",
          resize: "none", fontFamily: "inherit", lineHeight: 1.6,
          boxSizing: "border-box",
        }}
      />
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px 12px",
      }}>
        <div style={{ display: "flex", gap: 2 }}>
          {[Paperclip, ImageIcon, Link2].map((Icon, i) => (
            <button key={i} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#475569", padding: "6px 7px", borderRadius: 8,
              transition: "color 0.2s",
            }}
              onMouseEnter={e => (e.currentTarget.style.color = "#a78bfa")}
              onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {compact && <span style={{ color: "#2d3748", fontSize: 11 }}>↵ new line</span>}
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: inputValue.trim() && !isLoading ? "#7c3aed" : "rgba(124,58,237,0.22)",
              border: "none", borderRadius: 10, padding: "8px 18px",
              color: inputValue.trim() && !isLoading ? "#fff" : "#4b5563",
              fontSize: 13, fontWeight: 700,
              cursor: inputValue.trim() && !isLoading ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            <Send size={13} /> Send
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Welcome view ─────────────────────────────────────────────────────────
  const renderWelcomeView = () => (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "40px 24px 60px",
      overflowY: "auto",
    }}>
      {/* Flow timeline */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 36, flexWrap: "wrap", justifyContent: "center",
      }}>
        {[
          { Icon: Zap, label: "15 min", sub: "对接供应商", color: "#7c3aed" },
          { Icon: TrendingUp, label: "30 min", sub: "收到报价", color: "#0ea5e9" },
          { Icon: Video, label: "随时", sub: "预约采购会议", color: "#10b981" },
        ].map((item, i) => (
          <React.Fragment key={i}>
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${item.color}35`,
              borderRadius: 999, padding: "6px 14px",
            }}>
              <item.Icon size={13} color={item.color} />
              <span style={{ color: item.color, fontWeight: 700, fontSize: 13 }}>{item.label}</span>
              <span style={{ color: "#64748b", fontSize: 12 }}>{item.sub}</span>
            </div>
            {i < 2 && <div style={{ color: "#1e293b", fontSize: 16 }}>—</div>}
          </React.Fragment>
        ))}
      </div>

      {/* Title */}
      <h1 style={{
        fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 800,
        color: "#f1f5f9", marginBottom: 28, textAlign: "center",
        letterSpacing: "-0.02em", lineHeight: 1.15,
      }}>
        您想采购什么？
      </h1>

      {/* Input */}
      <div style={{ width: "100%", maxWidth: 680 }}>
        {renderInputBox("描述您的产品需求...")}

        {/* Chips */}
        <div style={{ display: "flex", gap: 9, marginTop: 14, flexWrap: "wrap", justifyContent: "center" }}>
          {chips.map(({ Icon, label, color }) => (
            <button
              key={label}
              onClick={() => handleSend(label)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                background: `${color}12`,
                border: `1px solid ${color}38`,
                borderRadius: 999, padding: "7px 16px",
                color, fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = `${color}25`;
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}70`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = `${color}12`;
                (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}38`;
              }}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Guide cards */}
      <div style={{ width: "100%", maxWidth: 680, marginTop: 52 }}>
        <div style={{
          color: "#334155", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.12em", textTransform: "uppercase",
          marginBottom: 14, textAlign: "center",
        }}>使用指南</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {guideCards.map((card, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                background: "rgba(12,12,24,0.7)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14, padding: "14px 16px",
                cursor: "pointer", transition: "all 0.25s",
                position: "relative", overflow: "hidden",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.border = `1px solid ${card.color}45`;
                el.style.background = "rgba(12,12,24,0.92)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.border = "1px solid rgba(255,255,255,0.05)";
                el.style.background = "rgba(12,12,24,0.7)";
              }}
            >
              {/* Bottom glow */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${card.color}, transparent)`,
                opacity: 0.5,
              }} />
              {/* Image */}
              <img
                src={card.img} alt={card.title}
                style={{
                  width: 64, height: 64, borderRadius: 10,
                  objectFit: "cover", flexShrink: 0,
                  background: `${card.color}18`,
                }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: card.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 3 }}>
                  STEP {card.step}
                </div>
                <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{card.title}</div>
                <div style={{
                  color: "#475569", fontSize: 12, lineHeight: 1.5,
                  overflow: "hidden", display: "-webkit-box",
                  WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                }}>{card.desc}</div>
              </div>
              {/* Step watermark */}
              <div style={{
                position: "absolute", top: 8, right: 12,
                color: `${card.color}18`, fontSize: 28, fontWeight: 900,
                lineHeight: 1, pointerEvents: "none",
              }}>{card.step}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Chat view ────────────────────────────────────────────────────────────
  const renderChatView = () => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Progress bar */}
      <div style={{
        padding: "10px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(8,8,20,0.95)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={12} color="#7c3aed" />
            <span style={{ color: "#a78bfa", fontSize: 12, fontWeight: 600 }}>
              {PHASE_LABELS[currentPhase]}
            </span>
          </div>
          <span style={{ color: "#334155", fontSize: 11 }}>{progress}%</span>
        </div>
        <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${progress}%`,
            background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
            borderRadius: 99, transition: "width 0.6s ease",
          }} />
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            {msg.role === "assistant" && (
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, marginRight: 10, marginTop: 2,
              }}>
                <Sparkles size={13} color="#fff" />
              </div>
            )}
            <div style={{ maxWidth: "72%" }}>
              {msg.isTyping ? (
                <div style={{
                  background: "rgba(12,12,24,0.85)",
                  border: "1px solid rgba(124,58,237,0.18)",
                  borderRadius: "4px 16px 16px 16px",
                }}>
                  <TypingIndicator />
                </div>
              ) : (
                <>
                  <div style={{
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #7c3aed, #6d28d9)"
                      : "rgba(12,12,24,0.85)",
                    border: msg.role === "user" ? "none" : "1px solid rgba(124,58,237,0.18)",
                    borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                    padding: "12px 16px",
                    color: "#e2e8f0", fontSize: 14, lineHeight: 1.65,
                  }}>
                    {msg.role === "assistant" ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p style={{ margin: "0 0 8px" }}>{children}</p>,
                          strong: ({ children }) => <strong style={{ color: "#c4b5fd", fontWeight: 700 }}>{children}</strong>,
                          ul: ({ children }) => <ul style={{ margin: "6px 0", paddingLeft: 18 }}>{children}</ul>,
                          li: ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
                        }}
                      >{msg.content}</ReactMarkdown>
                    ) : msg.content}
                  </div>

                  {/* Quote cards */}
                  {msg.quotes && msg.quotes.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{
                        color: "#475569", fontSize: 11, fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10,
                      }}>
                        <Sparkles size={10} style={{ display: "inline", marginRight: 4 }} />
                        为您匹配到 {msg.quotes.length} 家供应商
                      </div>
                      {msg.quotes.map(q => <QuoteCardItem key={q.quoteId} quote={q} />)}
                    </div>
                  )}

                  <div style={{
                    color: "#1e293b", fontSize: 10, marginTop: 4,
                    textAlign: msg.role === "user" ? "right" : "left",
                  }}>
                    {msg.timestamp.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "14px 24px 20px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        background: "rgba(8,8,20,0.95)",
      }}>
        {renderInputBox("继续描述您的需求...", true)}
      </div>
    </div>
  );

  return (
    <div style={{
      display: "flex", height: "100vh",
      background: "#080814", color: "#e2e8f0",
      fontFamily: "Inter, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      <BuyerSidebar userRole={user?.role || "buyer"} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          background: "rgba(8,8,20,0.98)",
          backdropFilter: "blur(10px)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <div>
              <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 14 }}>AI Procurement Advisor</div>
              <div style={{ color: "#334155", fontSize: 11 }}>Powered by RealSourcing 4.0</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 999, padding: "4px 10px",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ color: "#34d399", fontSize: 11, fontWeight: 600 }}>Live</span>
            </div>
            {!hasStarted && (
              <button
                onClick={startSession}
                disabled={isLoading}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "#7c3aed", border: "none", borderRadius: 8,
                  padding: "7px 14px", color: "#fff", fontSize: 12,
                  fontWeight: 600, cursor: "pointer",
                }}
              >
                <Sparkles size={12} />开始 AI 对话
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        {messages.length === 0 ? renderWelcomeView() : renderChatView()}
      </div>
    </div>
  );
}
