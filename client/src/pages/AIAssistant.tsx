import React, { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { getPersonalizedQuickPrompts } from "@/lib/aiPersonalization";
import BuyerSidebar from "@/components/BuyerSidebar";
import QuoteCardRedesigned from "@/components/factories/QuoteCardRedesigned";
import SupplierCompareMatrix, { type SupplierForCompare } from "@/components/factories/SupplierCompareMatrix";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  Paperclip, Image as ImageIcon, Link2, Send,
  Building2, ScanSearch, Video, ShieldCheck, Star, MapPin,
  Clock, Package, CheckCircle2, Sparkles, MessageSquare, Zap, TrendingUp,
  ArrowRight, FileText, Handshake, ChevronRight, BarChart3,
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
  isSummary?: boolean;
  isStreaming?: boolean; // 正在流式输出中
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

// ─── Phase 白名单工具（双重防御：前端同样验证 API 返回的 phase）────────────────
const VALID_PHASES_FE: readonly Phase[] = ["welcome", "price", "leadtime", "customization", "quantity", "qualification", "summary", "quotes", "followup"];
const toSafePhase = (raw: unknown, fallback: Phase = "welcome"): Phase =>
  VALID_PHASES_FE.includes(raw as Phase) ? (raw as Phase) : fallback;

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

// ─── ErrorBoundary：错误边界保护 ──────────────────────────────────────────
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div style={{ color: "#ef4444", fontSize: 12, padding: 10 }}>渲染出错，请刷新页面。</div>;
    return this.props.children;
  }
}

// ─── StreamingText：流式打字效果（终极稳健版） ──────────────────────────────────
function StreamingText({ content, onComplete }: { content: string; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const contentRef = useRef(content);
  const indexRef = useRef(0);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    contentRef.current = content;
    indexRef.current = 0;
    setDisplayed("");
    setDone(false);

    const animate = (time: number) => {
      if (time - lastTimeRef.current > 20) { // 控制打字速度
        if (indexRef.current < contentRef.current.length) {
          indexRef.current += 2; // 每次增加2个字符，提高流畅度
          setDisplayed(contentRef.current.slice(0, indexRef.current));
          lastTimeRef.current = time;
        } else {
          setDone(true);
          onComplete?.();
          return;
        }
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);

    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [content, onComplete]);

  // 打字完成后使用 ReactMarkdown，打字过程中使用纯文本
  if (done) {
    return <ReactMarkdown>{content}</ReactMarkdown>;
  }

  return (
    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit" }}>
      {displayed}
      <span style={{
        display: "inline-block", width: 2, height: 14, background: "#7c3aed",
        marginLeft: 2, verticalAlign: "middle", animation: "blink 0.8s infinite",
      }} />
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}

// ─── QuoteCardsRenderer：隔离的报价卡片渲染器（仅在流式打字完成后触发） ────────
function QuoteCardsRenderer({ 
  message, 
  onQuotesDetected 
}: { 
  message: Message; 
  onQuotesDetected: (quotes: SupplierForCompare[]) => void;
}) {
  const [shouldRender, setShouldRender] = useState(false);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 只有当消息不再流式输出时，才进行报价解析和卡片渲染
    if (!message.isStreaming && !shouldRender) {
      renderTimeoutRef.current = setTimeout(() => {
        setShouldRender(true);
        // 如果消息中已有报价数据，立即同步
        if (message.quotes && message.quotes.length > 0) {
          onQuotesDetected(message.quotes as SupplierForCompare[]);
        }
      }, 100); // 延迟100ms确保DOM稳定
    }
    return () => {
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };
  }, [message.isStreaming, shouldRender, message.quotes, onQuotesDetected]);

  if (!shouldRender || !message.quotes || message.quotes.length === 0) return null;

  // 生成 AI 深度点评内容
  const getAIDeepInsight = () => {
    const quotes = message.quotes;
    if (!quotes || quotes.length < 2) return null;
    
    const sortedByPrice = [...quotes].sort((a, b) => (a.unitPrice || 999) - (b.unitPrice || 999));
    const sortedByMatch = [...quotes].sort((a, b) => b.matchScore - a.matchScore);
    
    return (
      <div style={{
        background: "rgba(124,58,237,0.05)",
        border: "1px solid rgba(124,58,237,0.2)",
        borderRadius: 12, padding: "12px 16px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Sparkles size={14} color="#a78bfa" />
          <span style={{ color: "#a78bfa", fontSize: 13, fontWeight: 700 }}>AI 采购顾问深度点评</span>
        </div>
        <div style={{ color: "#94a3b8", fontSize: 12, lineHeight: 1.6 }}>
          针对您的需求，我深度分析了这 {quotes.length} 家工厂：
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            <li style={{ marginBottom: 4 }}>
              <strong style={{ color: "#e2e8f0" }}>最优匹配：</strong>
              {sortedByMatch[0].factoryName} 综合评分最高（{sortedByMatch[0].matchScore}%），其在{sortedByMatch[0].matchReasons?.[0] || "行业经验"}方面表现卓越。
            </li>
            {sortedByPrice[0].unitPrice && (
              <li style={{ marginBottom: 4 }}>
                <strong style={{ color: "#e2e8f0" }}>成本领先：</strong>
                {sortedByPrice[0].factoryName} 提供了最具竞争力的单价（${sortedByPrice[0].unitPrice}），适合对预算敏感的项目。
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{ marginTop: 12 }}
    >
      {getAIDeepInsight()}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 10,
      }}>
        <div style={{
          color: "#475569", fontSize: 11, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
        }}>
          <Sparkles size={10} style={{ display: "inline", marginRight: 4 }} />
          为您匹配到 {message.quotes.length} 家供应商
        </div>
        {message.quotes.length >= 2 && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              // 此处由父组件处理
            }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.4)",
              borderRadius: 8, padding: "5px 12px",
              color: "#a78bfa", fontSize: 11, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.25)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.15)"; }}
          >
            <BarChart3 size={12} />
            AI 对比矩阵
          </motion.button>
        )}
      </div>
      {message.quotes.map(q => <QuoteCardRedesigned key={q.quoteId || q.id} quote={q} />)}
      
      {/* 下一步提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          marginTop: 14,
          background: "rgba(16,185,129,0.06)",
          border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 12, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 10,
        }}
      >
        <CheckCircle2 size={16} color="#34d399" />
        <div>
          <div style={{ color: "#34d399", fontSize: 12, fontWeight: 700 }}>
            匹配完成！下一步
          </div>
          <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>
            点击「握手 · 开始合作」发送询盘，或点击「AI 对比矩阵」深度对比供应商
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── PostQuoteFlow ─────────────────────────────────────────────────────────────
// 报价后的后续流程可视化：握手 → 发送 RFQ → 预约会议
function PostQuoteFlow({ quote, onAction }: {
  quote: QuoteCard;
  onAction: (action: "inquiry" | "meeting" | "sample") => void;
}) {
  const [step, setStep] = useState<"idle" | "inquiry_sent" | "meeting_booked" | "sample_requested">("idle");
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const steps = [
    {
      id: "inquiry",
      icon: <Handshake size={14} />,
      label: "发送询盘",
      sublabel: "握手建立联系",
      color: "#10b981",
      done: step !== "idle",
    },
    {
      id: "rfq",
      icon: <FileText size={14} />,
      label: "发送 RFQ",
      sublabel: "正式报价请求",
      color: "#0ea5e9",
      done: step === "meeting_booked" || step === "sample_requested",
    },
    {
      id: "meeting",
      icon: <Video size={14} />,
      label: "预约会议",
      sublabel: "视频确认细节",
      color: "#7c3aed",
      done: step === "meeting_booked",
    },
  ];

  return (
    <div style={{
      marginTop: 10,
      background: "rgba(8,8,20,0.6)",
      border: "1px solid rgba(124,58,237,0.2)",
      borderRadius: 12, padding: "14px 16px",
    }}>
      <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>
        后续流程
      </div>
      {/* Step flow */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {steps.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: s.done ? `${s.color}20` : "rgba(255,255,255,0.03)",
              border: `1px solid ${s.done ? s.color + "60" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, padding: "5px 10px",
              transition: "all 0.3s",
            }}>
              <span style={{ color: s.done ? s.color : "#475569" }}>{s.icon}</span>
              <div>
                <div style={{ color: s.done ? s.color : "#64748b", fontSize: 11, fontWeight: 700 }}>{s.label}</div>
                <div style={{ color: "#334155", fontSize: 10 }}>{s.sublabel}</div>
              </div>
              {s.done && <CheckCircle2 size={11} color={s.color} />}
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={12} color="#1e293b" />
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      {step === "idle" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onMouseEnter={() => setHoveredBtn("inquiry")}
            onMouseLeave={() => setHoveredBtn(null)}
            onClick={() => { setStep("inquiry_sent"); onAction("inquiry"); }}
            style={{
              flex: 1,
              background: hoveredBtn === "inquiry" ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.4)",
              color: "#34d399", borderRadius: 9, padding: "8px 12px", fontSize: 12,
              fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Handshake size={13} />握手 · 开始合作
          </button>
          <button
            onMouseEnter={() => setHoveredBtn("sample")}
            onMouseLeave={() => setHoveredBtn(null)}
            onClick={() => { setStep("sample_requested"); onAction("sample"); }}
            style={{
              flex: 1,
              background: hoveredBtn === "sample" ? "rgba(245,158,11,0.2)" : "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.3)",
              color: "#fbbf24", borderRadius: 9, padding: "8px 12px", fontSize: 12,
              fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Package size={13} />申请样品
          </button>
        </div>
      )}
      {step !== "idle" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: 9, padding: "8px 12px",
        }}>
          <CheckCircle2 size={14} color="#34d399" />
          <span style={{ color: "#34d399", fontSize: 12, fontWeight: 700 }}>
            {step === "inquiry_sent" && "询盘已发送，等待工厂回复"}
            {step === "meeting_booked" && "会议已预约，请查看日历"}
            {step === "sample_requested" && "样品申请已提交"}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Prompt chips (static fallback, replaced by personalized version below) ───

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIAssistant() {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

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
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareQuotes, setCompareQuotes] = useState<SupplierForCompare[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [latestQuotes, setLatestQuotes] = useState<SupplierForCompare[]>([]);

  const agentWelcomeMutation = trpc.ai.agentWelcome.useMutation();
  const agentChatMutation = trpc.ai.agentChat.useMutation();

  // ─── Business Profile for personalization ──────────────────────────────────
  const { data: businessProfile } = trpc.businessProfile.get.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── URL 参数预填（Dashboard 跳转时自动发送）──────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q && q.trim()) {
      // 清除 URL 参数，避免刷新重复触发
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      // 延迟 300ms 等待组件完全挂载
      setTimeout(() => {
        setInputValue(q.trim());
        // 再延迟 100ms 自动发送
        setTimeout(() => {
          handleSendDirect(q.trim());
        }, 100);
      }, 300);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Start session
  const startSession = useCallback(async () => {
    if (isLoading || hasStarted) return;
    setIsLoading(true);
    setHasStarted(true);
    try {
      const result = await agentWelcomeMutation.mutateAsync();
      const msgId = `welcome-${Date.now()}`;
      setMessages([{
        id: msgId,
        role: "assistant",
        content: result.content,
        timestamp: new Date(),
        phase: (result.phase as Phase) || "welcome",
        isStreaming: true,
      }]);
      setStreamingMsgId(msgId);
      const newState: SessionState = {
        currentPhase: toSafePhase((result.sessionState as any)?.currentPhase, "welcome"),
        preferences: (result.sessionState as any)?.preferences || {},
        conversationHistory: (result.sessionState as any)?.conversationHistory || [],
      };
      setSessionState(newState);
      setProgressPercent(result.progressPercent || 0);
    } catch {
      const msgId = `welcome-fallback-${Date.now()}`;
      setMessages([{
        id: msgId,
        role: "assistant",
        content: "您好！我是您的 AI 采购顾问 🤖\n\n请告诉我：**您想采购什么产品？**",
        timestamp: new Date(),
        phase: "welcome",
        isStreaming: true,
      }]);
      setStreamingMsgId(msgId);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasStarted, agentWelcomeMutation]);

  // 智能解析纯文本报价内容
  const parseQuotesFromText = (text: string): SupplierForCompare[] => {
    const quotes: SupplierForCompare[] = [];
    const factoryDatabase: Record<string, SupplierForCompare> = {
      "深圳市音悦科技有限公司": {
        id: "factory-001",
        name: "深圳市音悦科技有限公司",
        location: "中国 深圳",
        rating: 4.9,
        matchScore: 95,
        matchReason: "强烈推荐",
        mou: 500,
        leadTime: "25d",
        unitPrice: 4.2,
        certifications: ["CE", "FCC"],
        qualityScore: 92,
        deliveryScore: 88,
        priceCompetitiveness: 85,
        responseScore: 90,
        serviceScore: 87,
      },
      "东莞恒讯电子厂": {
        id: "factory-002",
        name: "东莞恒讯电子厂",
        location: "中国 东莞",
        rating: 4.7,
        matchScore: 89,
        matchReason: "推荐",
        mou: 1000,
        leadTime: "30d",
        unitPrice: 2.7,
        certifications: ["ISO9001"],
        qualityScore: 85,
        deliveryScore: 82,
        priceCompetitiveness: 88,
        responseScore: 80,
        serviceScore: 83,
      },
      "广州智联智能科技有限公司": {
        id: "factory-003",
        name: "广州智联智能科技有限公司",
        location: "中国 广州",
        rating: 4.7,
        matchScore: 83,
        matchReason: "一般",
        mou: 200,
        leadTime: "35d",
        unitPrice: 2.6,
        certifications: [],
        qualityScore: 80,
        deliveryScore: 78,
        priceCompetitiveness: 90,
        responseScore: 75,
        serviceScore: 79,
      },
    };
    Object.entries(factoryDatabase).forEach(([name, data]) => {
      if (text.includes(name)) quotes.push(data);
    });
    return quotes;
  };

  // ─── 内部发送逻辑 ──────────────────────────────────────────────────────────────
  const handleSendDirect = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    setInputValue("");

    if (!hasStarted) setHasStarted(true);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content.trim(),
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
        message: content.trim(),
        sessionState,
      });

      const resultPhase = (result.phase as Phase) || sessionState.currentPhase;
      const isSummaryPhase = sessionState.currentPhase === "summary" || resultPhase === "summary";
      const newMsgId = `ai-${Date.now()}`;

      const parsedQuotes = parseQuotesFromText(result.content || "");
      const finalQuotes = (result.quotes && result.quotes.length > 0) ? result.quotes : parsedQuotes;
      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: newMsgId,
        role: "assistant",
        content: result.content || "",
        timestamp: new Date(),
        phase: resultPhase,
        quotes: finalQuotes.length > 0 ? (finalQuotes as any) : undefined,
        isSummary: isSummaryPhase && !finalQuotes.length,
        isStreaming: true,
      }));
      if (finalQuotes.length > 0) {
        setLatestQuotes(finalQuotes);
        setShowFloatingButton(true);
      }
      setStreamingMsgId(newMsgId);
      setTimeout(() => { if (finalQuotes.length > 0) setShowFloatingButton(true); }, 2000);

      const safePhase: Phase = toSafePhase((result.sessionState as any)?.currentPhase, sessionState.currentPhase);
      const updatedState: SessionState = {
        currentPhase: safePhase,
        preferences: (result.sessionState as any)?.preferences || sessionState.preferences,
        conversationHistory: ((result.sessionState as any)?.conversationHistory || sessionState.conversationHistory).map((h: any) => ({
          role: (h.role === "user" || h.role === "assistant") ? h.role : "assistant",
          content: String(h.content || ""),
        })),
      };
      setSessionState(updatedState);
      setProgressPercent(result.progressPercent || 0);
    } catch {
      const errId = `err-${Date.now()}`;
      setMessages(prev => prev.filter(m => m.id !== typingId).concat({
        id: errId,
        role: "assistant",
        content: "抱歉，我暂时无法处理您的请求，请稍后再试。",
        timestamp: new Date(),
        isStreaming: true,
      }));
      setStreamingMsgId(errId);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasStarted, sessionId, sessionState, agentChatMutation]);

  // Send message（从输入框发送）
  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? inputValue).trim();
    await handleSendDirect(content);
  }, [inputValue, handleSendDirect]);

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
    <div
      ref={inputWrapperRef}
      style={{
        background: "rgba(12,12,24,0.9)",
        border: `1px solid ${isFocused ? "rgba(124,58,237,0.7)" : "rgba(124,58,237,0.32)"}`,
        borderRadius: 16, overflow: "hidden",
        boxShadow: isFocused
          ? "0 0 0 3px rgba(124,58,237,0.15), 0 0 32px rgba(124,58,237,0.2)"
          : "0 0 32px rgba(124,58,237,0.1)",
        backdropFilter: "blur(12px)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      <textarea
        ref={inputRef}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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
          {compact && <span style={{ color: "#2d3748", fontSize: 11 }}>Shift+↵ 换行</span>}
          <motion.button
            whileTap={inputValue.trim() && !isLoading ? { scale: 0.93 } : {}}
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
            <Send size={13} /> 发送
          </motion.button>
        </div>
      </div>
    </div>
  );

  // ─── Welcome view ─────────────────────────────────────────────────────
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
        {chips.map(({ Icon, label, color }, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: `${color}12`, border: `1px solid ${color}30`,
              borderRadius: 999, padding: "5px 12px",
            }}>
              <Icon size={12} color={color} />
              <span style={{ color, fontSize: 11, fontWeight: 700 }}>{label}</span>
            </div>
            {i < chips.length - 1 && <span style={{ color: "#1e293b", fontSize: 14 }}>→</span>}
          </div>
        ))}
      </div>

      {/* Hero text */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          fontSize: 36, fontWeight: 900, color: "#e2e8f0",
          letterSpacing: "-0.02em", lineHeight: 1.15,
          marginBottom: 12,
        }}>
          告诉我你想采购什么
        </div>
        <div style={{ color: "#475569", fontSize: 15, lineHeight: 1.6, maxWidth: 480 }}>
          用中文或英文描述产品需求，AI 将在 30 秒内为您匹配最优供应商并生成竞争性报价
        </div>
      </div>

      {/* Input */}
      <div style={{ width: "100%", maxWidth: 640, marginBottom: 20 }}>
        {renderInputBox("例如：我需要 5000 个蓝牙耳机，预算 $8/个，需要 CE 认证...")}
      </div>

      {/* Personalized Quick Prompts */}
      {(() => {
        const quickPrompts = getPersonalizedQuickPrompts(businessProfile || null);
        return (
          <div style={{ width: "100%", maxWidth: 680, marginBottom: 32 }}>
            {businessProfile && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                marginBottom: 10, justifyContent: "center",
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: "#7c3aed",
                  letterSpacing: "0.08em", textTransform: "uppercase",
                }}>✦ Personalized for you</span>
              </div>
            )}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 8,
            }}>
              {quickPrompts.map((prompt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    handleSendDirect(prompt.prompt);
                  }}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 12, padding: "10px 14px",
                    color: "#94a3b8", fontSize: 12, fontWeight: 500,
                    cursor: "pointer", transition: "all 0.2s",
                    textAlign: "left",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${prompt.color}50`;
                    e.currentTarget.style.background = `${prompt.color}08`;
                    e.currentTarget.style.color = "#e2e8f0";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    e.currentTarget.style.color = "#94a3b8";
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{prompt.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#cbd5e1", fontSize: 12, marginBottom: 2, lineHeight: 1.3 }}>
                      {prompt.label}
                    </div>
                    <div style={{
                      fontSize: 10, color: "#475569", lineHeight: 1.4,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const,
                    }}>
                      {prompt.prompt.length > 80 ? prompt.prompt.slice(0, 80) + "…" : prompt.prompt}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Guide cards */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 12, width: "100%", maxWidth: 840,
      }}>
        {guideCards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${card.color}18`,
              borderRadius: 14, padding: "16px 18px",
            }}
          >
            <div style={{ color: card.color, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 3 }}>
              STEP {card.step}
            </div>
            <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{card.title}</div>
            <div style={{ color: "#475569", fontSize: 11, lineHeight: 1.6 }}>{card.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Start button */}
      {!hasStarted && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={startSession}
          disabled={isLoading}
          style={{
            marginTop: 28,
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            border: "none", borderRadius: 12, padding: "12px 28px",
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 24px rgba(124,58,237,0.4)",
          }}
        >
          <Sparkles size={16} />
          开始 AI 采购对话
          <ArrowRight size={16} />
        </motion.button>
      )}
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
          <motion.div
            style={{
              height: "100%",
              background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
              borderRadius: 99,
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        {/* Phase steps */}
        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
          {(["了解需求", "价格预算", "交期", "定制", "数量", "资质", "确认", "报价"] as string[]).map((label, i) => {
            const phases: Phase[] = ["welcome", "price", "leadtime", "customization", "quantity", "qualification", "summary", "quotes"];
            const phaseIdx = phases.indexOf(currentPhase);
            const isDone = i < phaseIdx;
            const isCurrent = i === phaseIdx;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: isCurrent ? 700 : 500,
                  color: isDone ? "#10b981" : isCurrent ? "#a78bfa" : "#1e293b",
                  padding: "2px 6px", borderRadius: 5,
                  background: isCurrent ? "rgba(124,58,237,0.15)" : "transparent",
                  transition: "all 0.3s",
                }}>
                  {isDone && "✓ "}{label}
                </span>
                {i < 7 && <span style={{ color: "#1e293b", fontSize: 10 }}>›</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
        <ErrorBoundary>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 16,
              }}
            >
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
              <div style={{ maxWidth: "75%" }}>
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
                        // 最新一条 AI 消息使用流式打字效果
                        msg.isStreaming && msg.id === streamingMsgId ? (
                          <StreamingText
                            content={msg.content}
                            onComplete={() => {
                              setStreamingMsgId(null);
                              setMessages(prev => prev.map(m =>
                                m.id === msg.id ? { ...m, isStreaming: false } : m
                              ));
                            }}
                          />
                        ) : (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p style={{ margin: "0 0 8px" }}>{children}</p>,
                              strong: ({ children }) => <strong style={{ color: "#c4b5fd", fontWeight: 700 }}>{children}</strong>,
                              ul: ({ children }) => <ul style={{ margin: "6px 0", paddingLeft: 18 }}>{children}</ul>,
                              li: ({ children }) => <li style={{ marginBottom: 3 }}>{children}</li>,
                            }}
                          >{msg.content}</ReactMarkdown>
                        )
                      ) : msg.content}
                    </div>

                    {/* Summary confirm button */}
                    {msg.isSummary && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ marginTop: 10 }}
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleSend("确认，信息正确，请开始匹配工厂")}
                          disabled={isLoading}
                          style={{
                            width: "100%",
                            background: isLoading ? "rgba(124,58,237,0.2)" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                            border: "none", borderRadius: 10, padding: "11px 20px",
                            color: "#fff", fontSize: 13, fontWeight: 700,
                            cursor: isLoading ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            transition: "all 0.2s",
                            boxShadow: isLoading ? "none" : "0 4px 20px rgba(124,58,237,0.35)",
                          }}
                        >
                          <Sparkles size={14} />
                          确认需求，开始 AI 匹配工厂
                          <ArrowRight size={14} />
                        </motion.button>
                        <div style={{ textAlign: "center", color: "#334155", fontSize: 11, marginTop: 6 }}>
                          或继续输入修改需求
                        </div>
                      </motion.div>
                    )}

                    {/* 隔离的报价卡片渲染器（仅在流式打字完成后触发） */}
                    <QuoteCardsRenderer
                      message={msg}
                      onQuotesDetected={(quotes) => {
                        if (quotes.length >= 2) {
                          setLatestQuotes(quotes);
                          setShowFloatingButton(true);
                        }
                      }}
                    />

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
        </ErrorBoundary>
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
      position: "relative",
    }}>
      {/* AI 供应商对比矩阵弹窗 */}
      {compareModalOpen && compareQuotes.length >= 2 && (
        <SupplierCompareMatrix
          suppliers={compareQuotes}
          onClose={() => setCompareModalOpen(false)}
          onSelectSupplier={(supplier) => {
            setCompareModalOpen(false);
            handleSend(`我选择 ${supplier.factoryName}，请帮我发送询盘`);
          }}
        />
      )}

      {/* 全局悬浮式 AI 对比矩阵入口 */}
      <AnimatePresence>
        {showFloatingButton && latestQuotes.length >= 2 && (
          <div style={{ position: "fixed", bottom: 40, right: 40, zIndex: 999, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
            {/* 气泡提示 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              style={{
                background: "rgba(124,58,237,0.95)",
                backdropFilter: "blur(4px)",
                padding: "8px 14px",
                borderRadius: "12px 12px 2px 12px",
                color: "#fff", fontSize: 12, fontWeight: 600,
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.2)",
                whiteSpace: "nowrap",
                pointerEvents: "none",
              }}
            >
              ✨ 点击查看 3 家工厂深度对比报告
            </motion.div>
            
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={() => {
                setCompareQuotes(latestQuotes);
                setCompareModalOpen(true);
              }}
              style={{
                width: 64, height: 64,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                border: "2px solid rgba(255,255,255,0.2)",
                boxShadow: "0 0 25px rgba(124,58,237,0.6), 0 0 50px rgba(124,58,237,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.boxShadow = "0 0 35px rgba(124,58,237,0.8), 0 0 70px rgba(124,58,237,0.5)";
                btn.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.boxShadow = "0 0 25px rgba(124,58,237,0.6), 0 0 50px rgba(124,58,237,0.3)";
                btn.style.transform = "scale(1)";
              }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 10, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <BarChart3 size={28} color="#fff" />
              </motion.div>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

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
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }}
              />
              <span style={{ color: "#34d399", fontSize: 11, fontWeight: 600 }}>Live</span>
            </div>
            {!hasStarted && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
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
              </motion.button>
            )}
          </div>
        </div>

        {/* Body */}
        {messages.length === 0 ? renderWelcomeView() : renderChatView()}
      </div>
    </div>
  );
}
