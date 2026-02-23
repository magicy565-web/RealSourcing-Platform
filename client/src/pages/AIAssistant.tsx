import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Send, Building2, Package, MessageSquare, TrendingUp,
  RefreshCw, Copy, ExternalLink, Zap, Globe, Shield, Loader2,
  Bot, User, ChevronRight, DollarSign
} from "lucide-react";
import { Particles } from "@/components/magicui/particles";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BlurFade } from "@/components/magicui/blur-fade";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  suggestedActions?: string[];
  isStreaming?: boolean;
}

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
  content: `Hello! I'm your **AI Procurement Assistant** powered by advanced language models.

I can help you with:
- **Find and evaluate factories** based on your requirements
- **Analyze pricing** and negotiate better terms
- **Draft professional inquiries** to suppliers
- **Provide market insights** and sourcing recommendations
- **Answer questions** about B2B procurement and trade

What are you looking to source today?`,
  timestamp: new Date(),
  suggestions: [
    "Find wireless earbuds factories",
    "Help me write an inquiry",
    "Analyze sourcing performance",
    "Compare factory prices",
  ],
};

const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px)
`;

export default function AIAssistant() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        const withoutLoading = prev.filter(m => m.id !== -1);
        return [...withoutLoading, aiMessage];
      });
    },
    onError: (error) => {
      setMessages((prev) => prev.filter(m => m.id !== -1));
      toast.error("AI 响应失败：" + error.message);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function extractSuggestions(content: string): string[] {
    const lines = content.split('\n');
    const suggestions: string[] = [];
    for (const line of lines) {
      const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*/);
      if (match && suggestions.length < 4) suggestions.push(match[1]);
    }
    return suggestions;
  }

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || chatMutation.isPending) return;

    const userMessage: Message = { id: Date.now(), role: "user", content: messageText, timestamp: new Date() };
    const loadingMessage: Message = { id: -1, role: "assistant", content: "", timestamp: new Date(), isStreaming: true };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput("");

    const history = messages
      .filter(m => m.id !== 1 && m.id !== -1)
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
    history.push({ role: "user", content: messageText });

    chatMutation.mutate({ messages: history, context: { currentPage: "ai-assistant" } });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("已复制到剪贴板");
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    textareaRef.current?.focus();
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: GRID_BG, backgroundSize: "40px 40px" }} />
      {/* Particles 背景 — 极低密度，营造 AI 科技感 */}
      <Particles
        className="fixed inset-0 pointer-events-none z-0"
        quantity={25}
        color="#7c3aed"
        ease={80}
        size={0.5}
      />

      {/* ── 左侧边栏 ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-64 flex flex-col relative z-10 overflow-hidden"
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)" }}
      >
        {/* 侧边栏 BorderBeam */}
        <BorderBeam size={200} duration={12} colorFrom="#7c3aed" colorTo="#a78bfa20" />
        {/* Header */}
        <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", boxShadow: "0 0 20px rgba(124,58,237,0.35)" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">AI Procurement</h2>
              <p className="text-[10px] flex items-center gap-1" style={{ color: "#4ade80" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
                Powered by Qwen Plus
              </p>
            </div>
          </div>
          <ShimmerButton
            onClick={handleReset}
            className="w-full h-9 text-sm font-medium justify-center"
            shimmerColor="#c4b5fd"
            background="rgba(124,58,237,0.15)"
            borderRadius="0.75rem"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />New Conversation
          </ShimmerButton>
        </div>

        {/* Quick Actions */}
        <div className="p-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.25)" }}>Quick Actions</p>
          <div className="space-y-0.5">
            {QUICK_PROMPTS.map((prompt) => (
              <motion.button
                key={prompt}
                whileHover={{ x: 3 }}
                onClick={() => handleSend(prompt)}
                disabled={chatMutation.isPending}
                className="w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-all disabled:opacity-50"
                style={{ color: "rgba(255,255,255,0.35)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white", e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)", e.currentTarget.style.background = "transparent")}
              >
                <ChevronRight className="w-3 h-3 inline mr-1" style={{ color: "#7c3aed" }} />
                {prompt}
              </motion.button>
            ))}
          </div>
        </div>

        {/* AI Capabilities */}
        <div className="p-3 mt-auto">
          <div className="rounded-xl p-3 space-y-2"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)" }}>
            <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "#c4b5fd" }}>
              <Zap className="w-3 h-3" />AI Capabilities
            </p>
            {[
              { icon: <Building2 className="w-3 h-3" />, text: "Factory matching" },
              { icon: <DollarSign className="w-3 h-3" />, text: "Price analysis" },
              { icon: <MessageSquare className="w-3 h-3" />, text: "Inquiry drafting" },
              { icon: <TrendingUp className="w-3 h-3" />, text: "Market insights" },
              { icon: <Globe className="w-3 h-3" />, text: "Multi-language" },
              { icon: <Shield className="w-3 h-3" />, text: "Trade compliance" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                <span style={{ color: "#7c3aed" }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── 主聊天区 ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-6"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5" style={{ color: "#7c3aed" }} />
            <h1 className="font-semibold text-white text-sm">AI Procurement Assistant</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.25)", color: "#4ade80" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
              Live
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Package className="w-3.5 h-3.5" />
            {messages.filter(m => m.role === "user").length} messages
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <BlurFade key={msg.id} delay={idx === 0 ? 0.1 : 0} inView>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 group ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 self-start mt-0.5"
                  style={{
                    background: msg.role === "assistant"
                      ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                      : "rgba(59,130,246,0.70)",
                    boxShadow: msg.role === "assistant" ? "0 0 16px rgba(124,58,237,0.30)" : "none",
                  }}>
                  {msg.role === "assistant" ? <Sparkles className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                </div>

                {/* Content */}
                <div className={`max-w-[78%] space-y-2 ${msg.role === "user" ? "items-end flex flex-col" : ""}`}>
                  {msg.isStreaming ? (
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.40)" }}>
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#7c3aed" }} />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                      style={{
                        background: msg.role === "assistant" ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #3b82f6, #2563eb)",
                        border: msg.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none",
                        borderRadius: msg.role === "assistant" ? "0 1rem 1rem 1rem" : "1rem 0 1rem 1rem",
                        color: msg.role === "assistant" ? "rgba(255,255,255,0.80)" : "white",
                      }}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:text-white prose-strong:text-white">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
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
                        onMouseEnter={(e) => (e.currentTarget.style.color = "white", e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)", e.currentTarget.style.background = "transparent")}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </motion.button>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
                        {msg.timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Suggested actions */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.suggestedActions.map((action) => {
                        const [type, id] = action.split(':');
                        const labels: Record<string, string> = {
                          VIEW_FACTORY: '查看工厂', REQUEST_SAMPLE: '申请样品',
                          SEND_INQUIRY: '发送询价', SCHEDULE_MEETING: '预约会议',
                        };
                        return (
                          <motion.button
                            key={action}
                            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              if (type === 'VIEW_FACTORY') setLocation(`/factory/${id}`);
                              else if (type === 'SEND_INQUIRY') setLocation(`/inquiries`);
                              else if (type === 'SCHEDULE_MEETING') setLocation(`/meetings`);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
                            style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.30)", color: "#c4b5fd" }}
                          >
                            <ExternalLink className="w-3 h-3" />
                            {labels[type] || type}
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* Suggestion chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && !msg.isStreaming && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.suggestions.map((s) => (
                        <motion.button
                          key={s}
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => handleSend(s)}
                          disabled={chatMutation.isPending}
                          className="px-3 py-1.5 rounded-lg text-xs transition-all disabled:opacity-50"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.40)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "white", e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.40)", e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
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

        {/* ── Input Area ── */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)" }}>
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end rounded-2xl px-4 py-3 transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
              onFocus={(e) => e.currentTarget.style.borderColor = "rgba(124,58,237,0.45)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about factories, pricing, sourcing strategies... (Enter to send, Shift+Enter for new line)"
                className="flex-1 bg-transparent border-0 resize-none text-sm text-white outline-none min-h-[36px] max-h-32"
                style={{ color: "white" }}
                rows={1}
                disabled={chatMutation.isPending}
              />
              <ShimmerButton
                onClick={() => handleSend()}
                disabled={!input.trim() || chatMutation.isPending}
                className="h-9 w-9 flex-shrink-0 disabled:opacity-40"
                shimmerColor="#c4b5fd"
                background="linear-gradient(135deg, #7c3aed, #4f46e5)"
                borderRadius="0.75rem"
              >
                {chatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
              </ShimmerButton>
            </div>
            <p className="text-center text-xs mt-2" style={{ color: "rgba(255,255,255,0.18)" }}>
              Powered by Alibaba DashScope (Qwen Plus) · Responses may not be 100% accurate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
