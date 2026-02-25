/**
 * RealSourcing 4.0 - Sourcing Room
 * 需求沟通室：买家与工厂 30 分钟首次对话核心体验
 *
 * 功能：
 * - AI 智能开场白（自动发送）
 * - 实时消息（WebSocket）
 * - 需求摘要侧边栏
 * - 工厂信息卡片
 * - 快速回复模板
 * - 消息时间轴
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, Send, Loader2, Factory, Package, Sparkles,
  MessageSquare, Clock, CheckCircle2, Bot, User, Building2,
  DollarSign, Globe, ChevronDown, Zap, RefreshCw,
  Phone, Video, AlertCircle, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/hooks/useSocket";

// ── 常量 ──────────────────────────────────────────────────────────────────────

const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px)
`;

/** 快速回复模板 */
const QUICK_REPLIES_BUYER = [
  "What's your MOQ for this product?",
  "Can you share your production capacity?",
  "What certifications do you have?",
  "What's the lead time for a sample order?",
  "Can you provide a price breakdown?",
];

const QUICK_REPLIES_FACTORY = [
  "We have experience with this type of product.",
  "Our MOQ is flexible, let's discuss.",
  "We can provide samples within 7-10 days.",
  "We hold ISO 9001 and relevant certifications.",
  "Our current capacity can meet your requirements.",
];

// ── 消息气泡组件 ───────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: any;
  currentUserId: number;
  factoryName?: string;
}

function MessageBubble({ message, currentUserId, factoryName }: MessageBubbleProps) {
  const isAI = message.senderRole === 'ai';
  const isSystem = message.messageType === 'system';
  const isMine = message.senderId === currentUserId && !isAI;
  const isFactory = message.senderRole === 'factory';

  const time = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // System message
  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center my-3"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
          <span className="text-xs text-green-300 font-medium">{message.content}</span>
        </div>
      </motion.div>
    );
  }

  // AI intro message
  if (isAI) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-3 my-4"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600/40 to-purple-800/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex-1 max-w-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-purple-300">RealSourcing AI</span>
            <span className="text-xs text-gray-600">{time}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/20 text-purple-300 text-xs">AI</span>
          </div>
          <div
            className="rounded-2xl rounded-tl-sm p-4 border border-purple-500/15"
            style={{ background: "rgba(124,58,237,0.08)" }}
          >
            <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Regular message
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 my-2 ${isMine ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isMine
          ? 'bg-purple-600/30 border border-purple-500/20'
          : 'bg-blue-600/20 border border-blue-500/20'
      }`}>
        {isMine
          ? <User className="w-4 h-4 text-purple-300" />
          : <Building2 className="w-4 h-4 text-blue-300" />
        }
      </div>

      {/* Bubble */}
      <div className={`flex-1 max-w-lg ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`flex items-center gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs font-semibold text-gray-400">
            {isMine ? 'You' : (factoryName ?? 'Factory')}
          </span>
          <span className="text-xs text-gray-600">{time}</span>
        </div>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isMine
            ? 'rounded-tr-sm bg-purple-600/25 border border-purple-500/20 text-white'
            : 'rounded-tl-sm bg-white/5 border border-white/8 text-gray-200'
        }`}>
          {message.content}
        </div>
      </div>
    </motion.div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function SourcingRoom() {
  const params = useParams<{ slug: string }>();
  const roomSlug = params.slug ?? "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 30分钟首次对话倒计时
  const [sessionSeconds, setSessionSeconds] = useState(30 * 60);
  useEffect(() => {
    if (sessionSeconds <= 0) return;
    const t = setInterval(() => setSessionSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [sessionSeconds]);
  const sessionMinutes = Math.floor(sessionSeconds / 60);
  const sessionSecs = sessionSeconds % 60;
  const isSessionUrgent = sessionSeconds < 300;

  // ── tRPC ──────────────────────────────────────────────────────────────────

  const handshakeQuery = trpc.knowledge.getHandshakeByRoomSlug.useQuery(
    { roomSlug },
    { enabled: !!roomSlug && !!user }
  );

  const handshake = handshakeQuery.data as any;
  const handshakeId = handshake?.id;

  const messagesQuery = trpc.knowledge.getSourcingRoomMessages.useQuery(
    { handshakeId: handshakeId ?? 0, limit: 100 },
    { enabled: !!handshakeId, refetchInterval: 3000 }
  );

  const demandQuery = trpc.demands.getById.useQuery(
    { id: handshake?.demandId ?? 0 },
    { enabled: !!handshake?.demandId }
  );

  const sendMessageMutation = trpc.knowledge.sendSourcingRoomMessage.useMutation({
    onSuccess: () => {
      setIsSending(false);
      messagesQuery.refetch();
    },
    onError: (err) => {
      setIsSending(false);
      toast.error("Failed to send: " + err.message);
    },
  });

  // ── WebSocket 实时消息 ─────────────────────────────────────────────────────

  const socket = useSocket();

  useEffect(() => {
    if (!socket || !handshakeId) return;

    socket.on(`sourcing_room_${handshakeId}`, (msg: any) => {
      setLocalMessages(prev => {
        // 去重
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.off(`sourcing_room_${handshakeId}`);
    };
  }, [socket, handshakeId]);

  // ── 消息合并（DB + 实时） ─────────────────────────────────────────────────

  const dbMessages: any[] = (messagesQuery.data as any[]) ?? [];
  const allMessages = [...dbMessages];
  for (const lm of localMessages) {
    if (!allMessages.some(m => m.id === lm.id)) {
      allMessages.push(lm);
    }
  }
  allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // ── 自动滚动到底部 ─────────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  // ── 发送消息 ──────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    if (!messageInput.trim() || !handshakeId || isSending) return;

    // 判断角色
    const senderRole: 'buyer' | 'factory' = 'buyer'; // 默认买家，工厂端可扩展

    setIsSending(true);
    sendMessageMutation.mutate({
      handshakeId,
      content: messageInput.trim(),
      senderRole,
    });
    setMessageInput("");
  }, [messageInput, handshakeId, isSending, sendMessageMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (text: string) => {
    setMessageInput(text);
    setShowQuickReplies(false);
    textareaRef.current?.focus();
  };

  // ── 渲染 ──────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
        <Button onClick={() => setLocation("/login")} className="bg-purple-600 hover:bg-purple-700">
          Sign In
        </Button>
      </div>
    );
  }

  if (handshakeQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!handshake) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">Sourcing room not found</p>
          <Button onClick={() => setLocation("/sourcing-demands")} variant="outline"
            className="border-white/20 text-gray-400">
            Back to Demands
          </Button>
        </div>
      </div>
    );
  }

  const demand = (demandQuery.data as any)?.demand;

  return (
    <div className="h-screen flex flex-col text-white overflow-hidden"
      style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "32px 32px", opacity: 0.6 }} />

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-shrink-0 border-b border-white/8 px-4 py-3"
        style={{ background: "rgba(5,3,16,0.9)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Back + Room Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation(`/matching/${handshake.demandId}`)}
              className="p-2 rounded-xl border border-white/8 text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-600/30 to-green-800/20 border border-green-500/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Sourcing Room</p>
                <p className="text-xs text-gray-500">
                  {demand?.productName ?? `Room ${roomSlug.slice(0, 12)}`}
                </p>
              </div>
            </div>

            {/* Connected badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-300 font-medium">Connected</span>
            </div>
          </div>

          {/* Right: Session Timer + Actions */}
          <div className="flex items-center gap-3">
            {/* Session countdown */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${
              isSessionUrgent
                ? 'bg-red-500/10 border-red-500/20 text-red-300'
                : 'bg-white/5 border-white/8 text-gray-400'
            }`}>
              <Timer className="w-3.5 h-3.5" />
              <span className="font-mono">
                {String(sessionMinutes).padStart(2, '0')}:{String(sessionSecs).padStart(2, '0')}
              </span>
              <span className="text-gray-600">session</span>
            </div>

            {/* Book meeting */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation(`/book-meeting/${handshake.factoryId}`)}
              className="h-8 border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-xs"
            >
              <Video className="w-3.5 h-3.5 mr-1.5" />
              Book Meeting
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main Layout ──────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex overflow-hidden max-w-7xl mx-auto w-full px-4 py-4 gap-4">

        {/* ── Chat Area ────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 rounded-2xl border border-white/8 overflow-hidden"
          style={{ background: "rgba(255,255,255,0.02)" }}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
            {messagesQuery.isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            ) : allMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-10 h-10 text-purple-400/50 mb-3" />
                <p className="text-gray-500 text-sm">AI is preparing the conversation...</p>
              </div>
            ) : (
              allMessages.map((msg, i) => (
                <MessageBubble
                  key={msg.id ?? i}
                  message={msg}
                  currentUserId={user.id}
                  factoryName={`Factory #${handshake.factoryId}`}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          <AnimatePresence>
            {showQuickReplies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 py-3 border-t border-white/5 flex flex-wrap gap-2"
              >
                {QUICK_REPLIES_BUYER.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickReply(reply)}
                    className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300 hover:bg-purple-500/20 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t border-white/8 p-4">
            <div className="flex items-end gap-3">
              {/* Quick reply toggle */}
              <button
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                className={`p-2 rounded-xl border transition-all flex-shrink-0 ${
                  showQuickReplies
                    ? 'bg-purple-500/20 border-purple-500/30 text-purple-300'
                    : 'border-white/8 text-gray-600 hover:text-gray-400 hover:bg-white/5'
                }`}
                title="Quick replies"
              >
                <Zap className="w-4 h-4" />
              </button>

              {/* Textarea */}
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-sm resize-none min-h-[44px] max-h-32 pr-12"
                  rows={1}
                />
              </div>

              {/* Send button */}
              <Button
                onClick={handleSend}
                disabled={!messageInput.trim() || isSending}
                className="h-11 w-11 p-0 bg-purple-600 hover:bg-purple-500 text-white flex-shrink-0 rounded-xl shadow-lg shadow-purple-600/20"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-700 mt-2 text-center">
              AI-assisted conversation • All messages are logged for quality assurance
            </p>
          </div>
        </div>

        {/* ── Sidebar ──────────────────────────────────────────────────── */}
        <div className="w-72 flex-shrink-0 space-y-4 overflow-y-auto">

          {/* Demand Info */}
          {demand && (
            <div className="rounded-2xl border border-white/8 p-4"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Package className="w-3.5 h-3.5" />
                Sourcing Demand
              </h3>
              <p className="text-sm font-semibold text-white mb-2">{demand.productName}</p>
              {demand.productDescription && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                  {demand.productDescription}
                </p>
              )}
              <div className="mt-3 space-y-2">
                {demand.estimatedQuantity && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Quantity</span>
                    <span className="text-xs font-medium text-white">{demand.estimatedQuantity}</span>
                  </div>
                )}
                {demand.targetPrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Target Price</span>
                    <span className="text-xs font-medium text-white">{demand.targetPrice}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setLocation(`/sourcing-demands/${handshake.demandId}`)}
                className="mt-3 w-full text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-center gap-1"
              >
                View full demand
                <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
              </button>
            </div>
          )}

          {/* Conversation Tips */}
          <div className="rounded-2xl border border-amber-500/15 p-4"
            style={{ background: "rgba(245,158,11,0.04)" }}>
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Conversation Tips
            </h3>
            <ul className="space-y-2">
              {[
                "Ask about production capacity and MOQ",
                "Request samples before bulk order",
                "Clarify payment terms upfront",
                "Ask for references or case studies",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60 mt-1.5 flex-shrink-0" />
                  <span className="text-xs text-gray-400">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div className="rounded-2xl border border-white/8 p-4"
            style={{ background: "rgba(255,255,255,0.02)" }}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Next Steps
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setLocation(`/book-meeting/${handshake.factoryId}`)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/3 border border-white/8 hover:bg-white/5 transition-all text-left"
              >
                <Video className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white">Book a Video Meeting</p>
                  <p className="text-xs text-gray-600">30-min factory tour</p>
                </div>
              </button>
              <button
                onClick={() => setLocation(`/sample-order/${handshake.demandId}`)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/3 border border-white/8 hover:bg-white/5 transition-all text-left"
              >
                <Package className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white">Request Sample Order</p>
                  <p className="text-xs text-gray-600">Evaluate quality first</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
