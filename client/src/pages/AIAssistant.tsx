import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import {
  Sparkles, Send, Building2, Package, MessageSquare, TrendingUp,
  ChevronRight, Star, DollarSign, Mic, Paperclip, RefreshCw,
  ThumbsUp, ThumbsDown, Copy, ExternalLink, Zap, Globe, Shield
} from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  cards?: FactoryCard[] | ProductCard[];
  type?: "text" | "factory_results" | "product_results" | "analysis";
}

interface FactoryCard {
  id: number;
  name: string;
  country: string;
  rating: number;
  certifications: string[];
  moq: string;
  leadTime: string;
  matchScore: number;
}

interface ProductCard {
  id: number;
  name: string;
  factory: string;
  price: string;
  moq: string;
  rating: number;
}

const QUICK_PROMPTS = [
  "Find factories for wireless earbuds with CE certification",
  "Compare prices for 1000 units of phone cases",
  "What's the average lead time for electronics factories?",
  "Help me write an inquiry for headphones",
  "Show me top-rated factories in Shenzhen",
  "Analyze my sourcing performance this month",
];

const MOCK_FACTORIES: FactoryCard[] = [
  { id: 1, name: "SZ Electronics Co., Ltd", country: "🇨🇳 Shenzhen", rating: 4.9, certifications: ["CE", "FCC", "RoHS"], moq: "100 units", leadTime: "25-30 days", matchScore: 97 },
  { id: 2, name: "Guangzhou Audio Tech", country: "🇨🇳 Guangzhou", rating: 4.7, certifications: ["CE", "ISO9001"], moq: "200 units", leadTime: "30-35 days", matchScore: 89 },
  { id: 3, name: "Dongguan Sound Factory", country: "🇨🇳 Dongguan", rating: 4.6, certifications: ["CE", "FCC"], moq: "500 units", leadTime: "20-25 days", matchScore: 82 },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! I'm your AI sourcing assistant powered by advanced language models. I can help you:\n\n• **Find and compare factories** based on your requirements\n• **Analyze pricing** and negotiate strategies\n• **Draft professional inquiries** to suppliers\n• **Provide market insights** and sourcing recommendations\n\nWhat are you looking to source today?",
    timestamp: new Date(),
    suggestions: [
      "Find wireless earbuds factories",
      "Help me write an inquiry",
      "Analyze my sourcing data",
      "Compare factory prices",
    ],
  },
];

export default function AIAssistant() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // 模拟 AI 响应
    await new Promise((r) => setTimeout(r, 1500));

    let aiResponse: Message;

    if (messageText.toLowerCase().includes("factory") || messageText.toLowerCase().includes("find")) {
      aiResponse = {
        id: Date.now() + 1,
        role: "assistant",
        content: "I found **3 highly-matched factories** for wireless earbuds with CE certification. Here are the top results based on your requirements:",
        timestamp: new Date(),
        type: "factory_results",
        cards: MOCK_FACTORIES,
        suggestions: [
          "Contact SZ Electronics",
          "Compare all 3 factories",
          "Filter by MOQ < 200 units",
          "Show more results",
        ],
      };
    } else if (messageText.toLowerCase().includes("inquiry") || messageText.toLowerCase().includes("write")) {
      aiResponse = {
        id: Date.now() + 1,
        role: "assistant",
        content: `Here's a professional inquiry template for you:\n\n---\n\n**Subject:** Inquiry for Wireless Earbuds - 1000 Units\n\nDear [Factory Name],\n\nI am writing to inquire about your wireless earbuds products. We are a buyer based in the United States looking to source **1,000 units** for our Q2 launch.\n\n**Requirements:**\n- CE and FCC certifications required\n- Custom branding/OEM available?\n- Target price: $25-30/unit\n- Delivery: within 45 days\n\nCould you please provide:\n1. Your best price for 1,000 units\n2. Sample availability and cost\n3. Lead time and payment terms\n\nLooking forward to your response.\n\nBest regards,\n[Your Name]`,
        timestamp: new Date(),
        suggestions: [
          "Copy this inquiry",
          "Customize for specific product",
          "Send to SZ Electronics",
          "Add more requirements",
        ],
      };
    } else if (messageText.toLowerCase().includes("analyze") || messageText.toLowerCase().includes("performance")) {
      aiResponse = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Based on your sourcing activity this month, here are the key insights:\n\n📈 **Performance Summary:**\n- Total inquiries: **48** (+12% vs last month)\n- Response rate: **87%** (industry avg: 72%)\n- Avg. response time: **4.2 hours**\n\n💡 **AI Recommendations:**\n1. **Consumer Electronics** is your strongest category — consider expanding your supplier network here\n2. 3 factories haven't responded in 7+ days — consider following up or finding alternatives\n3. Webinar attendance correlates with 2x higher inquiry conversion — you have 3 upcoming webinars matching your preferences\n\n🎯 **Next Actions:**\n- Follow up on 3 pending inquiries\n- Attend the SZ Electronics webinar tomorrow at 2PM",
        timestamp: new Date(),
        type: "analysis",
        suggestions: [
          "View detailed report",
          "Follow up on pending inquiries",
          "Browse upcoming webinars",
          "Export analysis",
        ],
      };
    } else {
      aiResponse = {
        id: Date.now() + 1,
        role: "assistant",
        content: `I understand you're asking about "${messageText}". Let me help you with that.\n\nBased on current market data and your sourcing history, I can provide personalized recommendations. Could you share more details about:\n\n1. **Product category** you're interested in\n2. **Target quantity** (MOQ requirements)\n3. **Budget range** per unit\n4. **Required certifications** (CE, FCC, etc.)\n\nThis will help me find the most relevant factories and provide accurate pricing insights.`,
        timestamp: new Date(),
        suggestions: [
          "Find factories for electronics",
          "Help with pricing analysis",
          "Draft an inquiry email",
          "Show market trends",
        ],
      };
    }

    setMessages((prev) => [...prev, aiResponse]);
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* 左侧历史记录 */}
      <div className="w-64 flex flex-col border-r border-white/10 bg-card/20">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm">AI Assistant</h2>
              <p className="text-[10px] text-green-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />Online
              </p>
            </div>
          </div>
          <Button
            onClick={() => setMessages(INITIAL_MESSAGES)}
            className="w-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 gap-2 text-sm h-9"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New Conversation
          </Button>
        </div>

        {/* 快捷提示 */}
        <div className="p-3 border-b border-white/10">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Actions</p>
          <div className="space-y-1">
            {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-white hover:bg-white/5 transition-all truncate"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* AI 能力说明 */}
        <div className="p-3 mt-auto">
          <div className="bg-purple-600/10 border border-purple-500/20 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-purple-300">AI Capabilities</p>
            {[
              { icon: <Building2 className="w-3 h-3" />, text: "Factory matching" },
              { icon: <DollarSign className="w-3 h-3" />, text: "Price analysis" },
              { icon: <MessageSquare className="w-3 h-3" />, text: "Inquiry drafting" },
              { icon: <TrendingUp className="w-3 h-3" />, text: "Market insights" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-purple-400">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 主聊天区 */}
      <div className="flex-1 flex flex-col">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
              {/* 头像 */}
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 self-start",
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-purple-600 to-purple-400"
                  : "bg-blue-600"
              )}>
                {msg.role === "assistant" ? (
                  <Sparkles className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-white text-xs font-bold">You</span>
                )}
              </div>

              {/* 消息内容 */}
              <div className={cn("max-w-[75%] space-y-3", msg.role === "user" && "items-end flex flex-col")}>
                <div className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "assistant"
                    ? "bg-white/8 text-white rounded-tl-sm border border-white/10"
                    : "bg-purple-600 text-white rounded-tr-sm"
                )}>
                  {/* Markdown 简单渲染 */}
                  <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/\n/g, "<br/>")
                    }}
                  />
                </div>

                {/* 工厂卡片 */}
                {msg.type === "factory_results" && msg.cards && (
                  <div className="space-y-2 w-full">
                    {(msg.cards as FactoryCard[]).map((factory) => (
                      <div key={factory.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-purple-500/30 transition-all">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-white">{factory.name}</span>
                              <Badge className="bg-green-500/20 text-green-400 text-[10px] px-1.5">
                                {factory.matchScore}% match
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{factory.country}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                            <span className="text-sm font-semibold text-yellow-400">{factory.rating}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          <span>MOQ: {factory.moq}</span>
                          <span>·</span>
                          <span>Lead time: {factory.leadTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mb-3">
                          {factory.certifications.map((cert) => (
                            <span key={cert} className="px-1.5 py-0.5 bg-blue-600/20 text-blue-300 rounded text-[10px] font-medium">
                              {cert}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 h-7 text-xs gap-1"
                            onClick={() => setLocation(`/factory/${factory.id}`)}
                          >
                            View Factory <ExternalLink className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-purple-600 hover:bg-purple-500 h-7 text-xs gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />Inquire
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 建议按钮 */}
                {msg.suggestions && msg.role === "assistant" && (
                  <div className="flex flex-wrap gap-2">
                    {msg.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSend(suggestion)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/30 rounded-full text-xs text-muted-foreground hover:text-purple-300 transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {/* 消息操作 */}
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied!"); }}
                      className="text-muted-foreground hover:text-white transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button className="text-muted-foreground hover:text-green-400 transition-colors">
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button className="text-muted-foreground hover:text-red-400 transition-colors">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-muted-foreground ml-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 加载中 */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/8 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区 */}
        <div className="px-6 py-4 border-t border-white/10 bg-card/20">
          {/* 快捷提示 */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSend(prompt)}
                className="flex-shrink-0 px-3 py-1.5 bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/30 rounded-full text-xs text-muted-foreground hover:text-purple-300 transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* 输入框 */}
          <div className="flex items-end gap-3">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-purple-500 transition-all">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything about sourcing... (Press Enter to send)"
                rows={2}
                className="w-full bg-transparent text-sm text-white resize-none focus:outline-none placeholder:text-muted-foreground"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button className="text-muted-foreground hover:text-white transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button className="text-muted-foreground hover:text-white transition-colors">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Powered by GPT-4</span>
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <Zap className="w-3 h-3" />
                    <span>Fast</span>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 h-12 w-12 p-0 flex-shrink-0 shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            AI responses are for reference only. Always verify information with suppliers directly.
          </p>
        </div>
      </div>
    </div>
  );
}
