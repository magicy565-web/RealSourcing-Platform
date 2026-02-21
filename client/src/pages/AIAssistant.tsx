import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Send, Building2, Package, MessageSquare, TrendingUp,
  RefreshCw, Copy, ExternalLink, Zap, Globe, Shield, Loader2,
  Bot, User, ChevronRight, DollarSign
} from "lucide-react";

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
        // Remove the loading placeholder
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
    // Extract follow-up suggestions from AI response if it contains numbered lists
    const lines = content.split('\n');
    const suggestions: string[] = [];
    for (const line of lines) {
      const match = line.match(/^\d+\.\s+\*\*(.+?)\*\*/);
      if (match && suggestions.length < 4) {
        suggestions.push(match[1]);
      }
    }
    return suggestions.length > 0 ? suggestions : [];
  }

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    // Add loading placeholder
    const loadingMessage: Message = {
      id: -1,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput("");

    // Build conversation history for context (exclude welcome and loading)
    const history = messages
      .filter(m => m.id !== 1 && m.id !== -1)
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    history.push({ role: "user", content: messageText });

    chatMutation.mutate({
      messages: history,
      context: {
        currentPage: "ai-assistant",
      },
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
    toast.success("已复制到剪贴板");
  };

  const handleReset = () => {
    setMessages([WELCOME_MESSAGE]);
    setInput("");
    textareaRef.current?.focus();
  };

  return (
    <div className="flex h-screen bg-[#0D0F1A] text-white overflow-hidden">
      {/* ── 左侧边栏 ── */}
      <div className="w-64 flex flex-col border-r border-white/10 bg-[#0D0F1A]">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">AI Procurement</h2>
              <p className="text-[10px] text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Powered by Qwen Plus
              </p>
            </div>
          </div>
          <Button
            onClick={handleReset}
            className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 gap-2 text-sm h-9"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Conversation
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-white/10">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Actions</p>
          <div className="space-y-0.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                disabled={chatMutation.isPending}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all truncate disabled:opacity-50"
              >
                <ChevronRight className="w-3 h-3 inline mr-1 text-purple-400" />
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* AI Capabilities */}
        <div className="p-3 mt-auto">
          <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              AI Capabilities
            </p>
            {[
              { icon: <Building2 className="w-3 h-3" />, text: "Factory matching" },
              { icon: <DollarSign className="w-3 h-3" />, text: "Price analysis" },
              { icon: <MessageSquare className="w-3 h-3" />, text: "Inquiry drafting" },
              { icon: <TrendingUp className="w-3 h-3" />, text: "Market insights" },
              { icon: <Globe className="w-3 h-3" />, text: "Multi-language" },
              { icon: <Shield className="w-3 h-3" />, text: "Trade compliance" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-xs text-gray-500">
                <span className="text-purple-400">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 主聊天区 ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#0D0F1A]/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-purple-400" />
            <h1 className="font-semibold text-white">AI Procurement Assistant</h1>
            <Badge className="bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] px-2 py-0.5">
              Live
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Package className="w-3.5 h-3.5" />
            {messages.filter(m => m.role === "user").length} messages
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3 group", msg.role === "user" && "flex-row-reverse")}>
              {/* Avatar */}
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 self-start mt-0.5",
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-purple-600 to-violet-500 shadow-lg shadow-purple-500/20"
                  : "bg-blue-600/80"
              )}>
                {msg.role === "assistant" ? (
                  <Sparkles className="w-4 h-4 text-white" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Content */}
              <div className={cn("max-w-[78%] space-y-2", msg.role === "user" && "items-end flex flex-col")}>
                {/* Message bubble */}
                {msg.isStreaming ? (
                  <div className="bg-[#141628] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "assistant"
                      ? "bg-[#141628] border border-white/10 rounded-tl-sm text-gray-200"
                      : "bg-blue-600 text-white rounded-tr-sm"
                  )}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:text-white prose-strong:text-white">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                )}

                {/* Action buttons for assistant messages */}
                {msg.role === "assistant" && !msg.isStreaming && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-all"
                      title="Copy"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs text-gray-600">
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
                        VIEW_FACTORY: '查看工厂',
                        REQUEST_SAMPLE: '申请样品',
                        SEND_INQUIRY: '发送询价',
                        SCHEDULE_MEETING: '预约会议',
                      };
                      return (
                        <button
                          key={action}
                          onClick={() => {
                            if (type === 'VIEW_FACTORY') setLocation(`/factory/${id}`);
                            else if (type === 'SEND_INQUIRY') setLocation(`/inquiries`);
                            else if (type === 'SCHEDULE_MEETING') setLocation(`/meetings`);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs hover:bg-purple-600/30 transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {labels[type] || type}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Suggestion chips */}
                {msg.suggestions && msg.suggestions.length > 0 && !msg.isStreaming && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {msg.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        disabled={chatMutation.isPending}
                        className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-400 text-xs hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Area ── */}
        <div className="border-t border-white/10 p-4 bg-[#0D0F1A]">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end bg-[#141628] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-purple-500/50 transition-colors">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about factories, pricing, sourcing strategies... (Enter to send, Shift+Enter for new line)"
                className="flex-1 bg-transparent border-0 resize-none text-sm text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[36px] max-h-32 p-0"
                rows={1}
                disabled={chatMutation.isPending}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || chatMutation.isPending}
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl h-9 w-9 p-0 flex-shrink-0 disabled:opacity-50"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-center text-xs text-gray-600 mt-2">
              Powered by Alibaba DashScope (Qwen Plus) · Responses may not be 100% accurate
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
