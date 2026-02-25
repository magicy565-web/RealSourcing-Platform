import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon as SolarIcon } from "@iconify/react";
import BuyerSidebar from "@/components/BuyerSidebar";
import { trpc } from "@/lib/trpc";
import ReactMarkdown from "react-markdown";

// ── Icons ────────────────────────────────────────────────────────────────────
const SIcon = ({ name, className }: { name: string; className?: string }) => (
  <SolarIcon icon={`solar:${name}`} className={className} />
);
const Building2 = (p: any) => <SIcon name="buildings-2-bold-duotone" {...p} />;
const ImageIcon = (p: any) => <SIcon name="gallery-bold-duotone" {...p} />;
const VideoIcon = (p: any) => <SIcon name="videocamera-record-bold-duotone" {...p} />;
const CertIcon = (p: any) => <SIcon name="verified-check-bold-duotone" {...p} />;
const SendIcon = (p: any) => <SIcon name="send-square-bold-duotone" {...p} />;
const AttachIcon = (p: any) => <SIcon name="paperclip-bold-duotone" {...p} />;
const CameraIcon = (p: any) => <SIcon name="camera-bold-duotone" {...p} />;
const LinkIcon = (p: any) => <SIcon name="link-bold-duotone" {...p} />;
const BotIcon = (p: any) => <SIcon name="cpu-bolt-bold-duotone" {...p} />;
const UserIcon = (p: any) => <SIcon name="user-circle-bold-duotone" {...p} />;

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

// ── Suggestion chips below the input box ─────────────────────────────────────
const SUGGESTIONS = [
  { icon: Building2, color: "#7c3aed", label: "500+ Factories", prompt: "Show me verified factories with CE certification" },
  { icon: ImageIcon, color: "#06b6d4", label: "Image Analysis", prompt: "Analyze a product catalog or design file" },
  { icon: VideoIcon, color: "#10b981", label: "Live Meetings", prompt: "Schedule a live video meeting with a factory" },
  { icon: CertIcon, color: "#f59e0b", label: "Cert Check", prompt: "Verify CE and FCC certifications for a factory" },
];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const chatMutation = trpc.ai.procurementChat.useMutation({
    onSuccess: (res: any) => {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== -1),
        { id: Date.now(), role: "assistant", content: res.content ?? res.response ?? "" },
      ]);
      setIsLoading(false);
    },
    onError: () => {
      setMessages((prev) => prev.filter((m) => m.id !== -1));
      setIsLoading(false);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
  }, [input]);

  const send = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: msg },
      { id: -1, role: "assistant", content: "" },
    ]);
    setInput("");
    setIsLoading(true);
    const history = messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    history.push({ role: "user", content: msg });
    chatMutation.mutate({ messages: history, context: { currentPage: "ai-assistant" } });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <BuyerSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {isEmpty ? (
            /* ── Welcome ─────────────────────────────────────────────────── */
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="flex-1 flex flex-col items-center justify-center px-4"
            >
              {/* Title */}
              <h1 className="text-4xl font-semibold text-white mb-8 tracking-tight">
                您想采购什么？
              </h1>

              {/* Input card — v0 style */}
              <div
                className="w-full max-w-2xl rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="描述您的产品需求..."
                  rows={3}
                  className="w-full bg-transparent px-5 pt-4 pb-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none"
                />

                {/* Bottom bar: tools + send */}
                <div className="flex items-center justify-between px-4 pb-3 pt-1">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 transition-colors">
                      <AttachIcon className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 transition-colors">
                      <CameraIcon className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 transition-colors">
                      <LinkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                    style={{ background: "#7c3aed" }}
                  >
                    <SendIcon className="w-3.5 h-3.5" />
                    Send
                  </button>
                </div>
              </div>

              {/* Suggestion chips — directly below input */}
              <div className="flex items-center gap-2 mt-4">
                {SUGGESTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.label}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => send(s.prompt)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all"
                      style={{
                        background: `${s.color}18`,
                        border: `1px solid ${s.color}35`,
                        color: s.color,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {s.label}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* ── Chat ────────────────────────────────────────────────────── */
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 max-w-3xl mx-auto w-full">
                {messages.map((msg) =>
                  msg.id === -1 ? (
                    <div key={-1} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#7c3aed22" }}>
                        <BotIcon className="w-4 h-4" style={{ color: "#7c3aed" }} />
                      </div>
                      <div className="flex items-center gap-1 pt-1">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-gray-500"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : msg.role === "user" ? (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 justify-end"
                    >
                      <div
                        className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm max-w-md"
                        style={{ background: "#7c3aed", color: "#fff" }}
                      >
                        {msg.content}
                      </div>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gray-800">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#7c3aed22" }}>
                        <BotIcon className="w-4 h-4" style={{ color: "#7c3aed" }} />
                      </div>
                      <div className="text-sm text-gray-200 leading-relaxed prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </motion.div>
                  )
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div className="px-6 py-4 max-w-3xl mx-auto w-full">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="继续提问..."
                    rows={2}
                    className="w-full bg-transparent px-5 pt-3 pb-1 text-sm text-white placeholder-gray-500 resize-none focus:outline-none"
                  />
                  <div className="flex items-center justify-between px-4 pb-3 pt-1">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 transition-colors">
                        <AttachIcon className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 transition-colors">
                        <CameraIcon className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-md text-gray-500 hover:text-gray-300 transition-colors">
                        <LinkIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => send()}
                      disabled={!input.trim() || isLoading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                      style={{ background: "#7c3aed" }}
                    >
                      <SendIcon className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
