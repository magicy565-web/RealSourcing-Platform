import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as SolarIcon } from "@iconify/react";
import BuyerSidebar from "@/components/BuyerSidebar";
import { trpc } from "@/lib/trpc";

// ── Icons ────────────────────────────────────────────────────────────────────
const SIcon = ({ name, className }: { name: string; className?: string }) => (
  <SolarIcon icon={`solar:${name}`} className={className} />
);
const Building2 = (p: any) => <SIcon name="buildings-2-bold-duotone" {...p} />;
const Image = (p: any) => <SIcon name="gallery-bold-duotone" {...p} />;
const Video = (p: any) => <SIcon name="videocamera-record-bold-duotone" {...p} />;
const Certificate = (p: any) => <SIcon name="verified-check-bold-duotone" {...p} />;
const Send = (p: any) => <SIcon name="send-square-bold-duotone" {...p} />;
const ChevronRight = (p: any) => <SIcon name="alt-arrow-right-bold-duotone" {...p} />;

// ── Constants ────────────────────────────────────────────────────────────────
const FEATURE_CARDS = [
  {
    id: "factories",
    icon: Building2,
    color: "#7c3aed",
    title: "500+ 认证工厂",
    desc: "已验证供应商",
    prompt: "Show me verified factories with CE certification",
  },
  {
    id: "image",
    icon: Image,
    color: "#06b6d4",
    title: "图片分析",
    desc: "上传设计或产品照片",
    prompt: "I want to analyze a product catalog",
  },
  {
    id: "video",
    icon: Video,
    color: "#10b981",
    title: "实时视频会议",
    desc: "与工厂直接沟通",
    prompt: "Help me schedule a live video meeting",
  },
  {
    id: "cert",
    icon: Certificate,
    color: "#f59e0b",
    title: "证书验证",
    desc: "CE/FCC/RoHS 合规检查",
    prompt: "Verify CE and FCC certifications",
  },
];

// ── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ── Feature Card Component ──────────────────────────────────────────────────
function FeatureCard({
  card,
  onClick,
}: {
  card: (typeof FEATURE_CARDS)[0];
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const IconComp = card.icon;

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative p-4 rounded-lg text-center overflow-hidden transition-all duration-300"
      style={{
        background: hovered ? `${card.color}15` : "rgba(255,255,255,0.05)",
        border: hovered ? `1px solid ${card.color}40` : "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Shimmer on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent, ${card.color}30, transparent)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <div className="relative z-10 mb-2 flex justify-center">
        <IconComp
          className="w-6 h-6"
          style={{ color: card.color }}
        />
      </div>

      {/* Title */}
      <p className="text-xs font-semibold text-white mb-1">{card.title}</p>
      <p className="text-xs text-gray-400">{card.desc}</p>
    </motion.button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = trpc.ai.procurementChat.useMutation({
    onSuccess: (response) => {
      const aiMessage: Message = {
        id: Date.now(),
        role: "assistant",
        content: response.content || response.response,
        timestamp: new Date(),
      };
      setMessages((prev) => prev.filter((m) => m.id !== -1).concat(aiMessage));
      setIsLoading(false);
    },
    onError: () => {
      setMessages((prev) => prev.filter((m) => m.id !== -1));
      setIsLoading(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: msg,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const loadingMessage: Message = {
      id: -1,
      role: "assistant",
      content: "...",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, loadingMessage]);

    const history = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    history.push({ role: "user", content: msg });

    chatMutation.mutate({
      messages: history,
      context: { currentPage: "ai-assistant" },
    });
  };

  const isEmptyChat = messages.length === 0;

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <BuyerSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {isEmptyChat ? (
            // Welcome View
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center px-6 py-12"
            >
              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-12"
              >
                <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  RealSourcing AI 4.0
                </h1>
                <p className="text-gray-400 text-base">
                  您的采购顾问 — 15 分钟内匹配认证工厂
                </p>
              </motion.div>

              {/* Input Box */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-2xl mb-12"
              >
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="描述您的采购需求..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                    rows={3}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading}
                    className="absolute bottom-3 right-3 p-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </motion.div>

              {/* Feature Cards Grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-4xl"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {FEATURE_CARDS.map((card) => (
                    <FeatureCard
                      key={card.id}
                      card={card}
                      onClick={() => handleSend(card.prompt)}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            // Chat View
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800 text-gray-100"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-800 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gray-700 px-6 py-4">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="继续提问..."
                    className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                    rows={2}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading}
                    className="absolute bottom-3 right-3 p-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
