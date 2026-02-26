/**
 * RealSourcing 4.0 - Matching Dashboard
 * 15分钟实时匹配工厂核心体验页面
 *
 * 功能：
 * - 展示 AI 匹配到的工厂列表（含匹配分数、理由、在线状态）
 * - 实时倒计时（15分钟匹配窗口）
 * - 买家一键"请求对话"发起握手
 * - WebSocket 实时推送工厂接受/拒绝通知
 * - 握手成功后跳转需求沟通室
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, Factory, Zap, Clock, CheckCircle2, Loader2,
  MessageSquare, Star, Shield, Package, DollarSign, Globe,
  ChevronRight, Sparkles, TrendingUp, Award, Phone,
  AlertCircle, RefreshCw, Send, X, Wifi, WifiOff, Timer,
  Users, BarChart3, Eye, Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useSocket } from "@/hooks/useSocket";

// ── 常量 ──────────────────────────────────────────────────────────────────────

const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px)
`;

const MATCH_SCORE_CONFIG = [
  { min: 90, label: "Perfect Match", color: "#4ade80", bg: "rgba(74,222,128,0.12)", glow: "shadow-green-500/20" },
  { min: 75, label: "Strong Match",  color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  glow: "shadow-blue-500/20"  },
  { min: 60, label: "Good Match",    color: "#a78bfa", bg: "rgba(167,139,250,0.12)", glow: "shadow-purple-500/20" },
  { min: 0,  label: "Possible Match",color: "#94a3b8", bg: "rgba(148,163,184,0.12)", glow: "shadow-gray-500/10"  },
];

function getMatchConfig(score: number) {
  return MATCH_SCORE_CONFIG.find(c => score >= c.min) ?? MATCH_SCORE_CONFIG[3];
}

// ── 倒计时 Hook ────────────────────────────────────────────────────────────────

function useCountdown(targetSeconds: number) {
  const [remaining, setRemaining] = useState(targetSeconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = ((targetSeconds - remaining) / targetSeconds) * 100;
  const isUrgent = remaining < 180; // 3 分钟内变红
  const isExpired = remaining === 0;

  return { remaining, minutes, seconds, progress, isUrgent, isExpired };
}

// ── 握手状态 Map ───────────────────────────────────────────────────────────────

type HandshakeStatus = 'idle' | 'pending' | 'accepted' | 'rejected' | 'expired';

interface HandshakeState {
  status: HandshakeStatus;
  handshakeId?: number;
  roomSlug?: string;
  expiresAt?: Date;
}

// ── 子组件：工厂匹配卡片 ───────────────────────────────────────────────────────

interface FactoryMatchCardProps {
  match: any;
  handshakeState: HandshakeState;
  onRequestChat: (factoryId: number, matchResultId?: number) => void;
  isRequesting: boolean;
  onNavigateToRoom: (roomSlug: string) => void;
}

function FactoryMatchCard({
  match, handshakeState, onRequestChat, isRequesting, onNavigateToRoom
}: FactoryMatchCardProps) {
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [buyerMessage, setBuyerMessage] = useState("");
  const config = getMatchConfig(match.matchScore ?? 0);

  const handleSendRequest = () => {
    onRequestChat(match.factoryId ?? match.factory?.id, match.id);
    setShowMessageInput(false);
  };

  const isOnline = match.factory?.isOnline;
  const factoryName = match.factory?.name ?? `Factory #${match.factoryId}`;
  const score = match.matchScore ?? 0;
  const reasons = Array.isArray(match.matchReasons) ? match.matchReasons as string[] : [];
  const certifications = Array.isArray(match.factory?.certifications)
    ? match.factory.certifications as string[]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
        handshakeState.status === 'accepted'
          ? 'border-green-500/40 shadow-lg shadow-green-500/10'
          : handshakeState.status === 'pending'
          ? 'border-amber-500/40 shadow-lg shadow-amber-500/10'
          : 'border-white/8 hover:border-white/15'
      }`}
      style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(20px)" }}
    >
      {/* Card Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          {/* Factory Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-purple-600/30 to-blue-600/20 border border-white/10 flex items-center justify-center">
              {match.factory?.logoUrl ? (
                <img src={match.factory.logoUrl} alt={factoryName}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <Factory className="w-5 h-5 text-purple-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white truncate">{factoryName}</h3>
                {/* Online indicator */}
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  isOnline
                    ? 'bg-green-500/15 border border-green-500/25 text-green-300'
                    : 'bg-gray-500/10 border border-gray-600/20 text-gray-500'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {match.factory?.location && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {match.factory.location}
                  </span>
                )}
                {match.factory?.averageResponseTime > 0 && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Avg. {match.factory.averageResponseTime}min response
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Match Score */}
          <div className="flex-shrink-0 text-right">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
              style={{ background: config.bg, color: config.color }}
            >
              <Zap className="w-3.5 h-3.5" />
              {score}%
            </div>
            <p className="text-xs mt-1" style={{ color: config.color }}>{config.label}</p>
          </div>
        </div>

        {/* Match Score Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-600">AI Match Score</span>
            <span className="text-xs font-medium" style={{ color: config.color }}>{score}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${config.color}80, ${config.color})` }}
            />
          </div>
        </div>

        {/* Match Reasons */}
        {reasons.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {reasons.slice(0, 3).map((reason, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-400">{reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {certifications.slice(0, 4).map((cert, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" />
                {cert}
              </span>
            ))}
          </div>
        )}

        {/* Factory Stats */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { icon: Package, label: "MOQ", value: match.factory?.moq ?? "—" },
            { icon: Star, label: "Rating", value: match.factory?.rating ? `${match.factory.rating}/5` : "—" },
            { icon: TrendingUp, label: "Capacity", value: match.factory?.annualCapacity ?? "—" },
          ].map((stat) => (
            <div key={stat.label} className="p-2 rounded-xl bg-white/3 border border-white/5 text-center">
              <stat.icon className="w-3 h-3 text-gray-600 mx-auto mb-1" />
              <p className="text-xs font-semibold text-white truncate">{stat.value}</p>
              <p className="text-xs text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Handshake Status Banner */}
      <AnimatePresence>
        {handshakeState.status === 'pending' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-3 bg-amber-500/8 border-t border-amber-500/20"
          >
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-amber-300">Waiting for factory response...</p>
                <p className="text-xs text-amber-500/70 mt-0.5">Request expires in 15 minutes</p>
              </div>
              <HandshakeCountdown expiresAt={handshakeState.expiresAt} />
            </div>
          </motion.div>
        )}

        {handshakeState.status === 'accepted' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-3 bg-green-500/8 border-t border-green-500/20"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-green-300">Factory accepted! Sourcing room ready.</p>
              </div>
              {handshakeState.roomSlug && (
                <Button
                  size="sm"
                  onClick={() => onNavigateToRoom(handshakeState.roomSlug!)}
                  className="h-7 text-xs bg-green-600 hover:bg-green-500 text-white"
                >
                  Enter Room
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {handshakeState.status === 'rejected' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-3 bg-red-500/8 border-t border-red-500/20"
          >
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-300">Factory declined this request</p>
            </div>
          </motion.div>
        )}

        {handshakeState.status === 'expired' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-3 bg-gray-500/8 border-t border-gray-500/20"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <p className="text-xs text-gray-500">Request expired — try again</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Area */}
      {handshakeState.status === 'idle' && (
        <div className="px-5 py-4 border-t border-white/5">
          <AnimatePresence mode="wait">
            {showMessageInput ? (
              <motion.div
                key="message-input"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="space-y-3"
              >
                <Textarea
                  value={buyerMessage}
                  onChange={(e) => setBuyerMessage(e.target.value)}
                  placeholder="Add a message to the factory (optional)..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 text-sm resize-none h-20"
                  maxLength={500}
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSendRequest}
                    disabled={isRequesting}
                    className="flex-1 h-9 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-semibold shadow-lg shadow-purple-600/20"
                  >
                    {isRequesting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Send Request
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowMessageInput(false)}
                    className="h-9 text-gray-500 hover:text-gray-300"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="action-buttons"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Button
                  size="sm"
                  onClick={() => setShowMessageInput(true)}
                  disabled={isRequesting}
                  className="flex-1 h-9 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm font-semibold shadow-lg shadow-purple-600/20"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Request Chat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/factory/${match.factoryId ?? match.factory?.id}`, '_blank')}
                  className="h-9 border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// ── 握手倒计时组件 ─────────────────────────────────────────────────────────────

function HandshakeCountdown({ expiresAt }: { expiresAt?: Date }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setRemaining(diff);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="text-xs font-mono font-bold text-amber-400">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function MatchingDashboard() {
  const params = useParams<{ id: string }>();
  const demandId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // 握手状态 Map: factoryId → HandshakeState
  const [handshakeStates, setHandshakeStates] = useState<Map<number, HandshakeState>>(new Map());
  const [requestingFactoryId, setRequestingFactoryId] = useState<number | null>(null);
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);

  // 15分钟匹配窗口倒计时（从页面加载开始）
  const { minutes, seconds, progress, isUrgent, isExpired } = useCountdown(15 * 60);

  // ── tRPC ──────────────────────────────────────────────────────────────────

  const { data, isLoading, refetch } = trpc.demands.getById.useQuery(
    { id: demandId },
    { enabled: !!demandId && !!user }
  );

  const matchResults = trpc.demands.getMatchResults.useQuery(
    { demandId },
    { enabled: !!demandId && !!user, refetchInterval: 10000 }
  );

  const handshakesByDemand = trpc.knowledge.getHandshakesByDemand.useQuery(
    { demandId },
    { enabled: !!demandId && !!user, refetchInterval: 5000 }
  );

  const triggerMatchMutation = trpc.demands.triggerMatch.useMutation({
    onSuccess: () => {
      setIsTriggering(false);
      toast.success("🎯 AI matching complete! Top factories found.");
      matchResults.refetch();
    },
    onError: (err) => {
      setIsTriggering(false);
      toast.error("Matching failed: " + err.message);
    },
  });

  const createHandshakeMutation = trpc.knowledge.createHandshake.useMutation({
    onSuccess: (result, variables) => {
      setRequestingFactoryId(null);
      if (result.success) {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        setHandshakeStates(prev => new Map(prev).set(variables.factoryId, {
          status: 'pending',
          handshakeId: result.handshakeId,
          expiresAt,
        }));
        toast.success("✅ Request sent! Waiting for factory response...");
      } else {
        toast.error(result.error ?? "Failed to send request");
      }
    },
    onError: (err) => {
      setRequestingFactoryId(null);
      toast.error("Failed to send request: " + err.message);
    },
  });

  // ── WebSocket 实时通知 ─────────────────────────────────────────────────────

  const socket = useSocket();

  // 加入需求房间，接收 match_complete 推送
  useEffect(() => {
    if (!socket || !demandId) return;
    socket.emit('join_demand_room', { demandId });
    return () => {
      socket.emit('leave_demand_room', { demandId });
    };
  }, [socket, demandId]);

  useEffect(() => {
    if (!socket) return;

    // 匹配完成：实时刷新卡片列表
    socket.on('match_complete', (data: any) => {
      if (data.demandId !== demandId) return;
      matchResults.refetch();
      toast.success(`🎯 AI matched ${data.matchCount} factories for you!`, {
        description: 'Factory cards are loading below...',
        duration: 5000,
      });
    });

    // 15分钟窗口关闭
    socket.on('match_expired', (data: any) => {
      if (data.demandId !== demandId) return;
      toast.warning('⏰ Matching window closed', {
        description: data.message ?? 'The 15-minute window has ended.',
        duration: 8000,
      });
    });

    // 工厂接受握手
    socket.on('handshake_accepted', (data: any) => {
      const { handshakeId, factoryId, factoryName, roomSlug } = data;
      setHandshakeStates(prev => {
        const next = new Map(prev);
        next.set(factoryId, { status: 'accepted', handshakeId, roomSlug });
        return next;
      });
      toast.success(`🎉 ${factoryName} accepted your request! Sourcing room is ready.`, {
        action: {
          label: "Enter Room",
          onClick: () => setLocation(`/sourcing-room/${roomSlug}`),
        },
        duration: 10000,
      });
    });

    // 工厂拒绝握手
    socket.on('handshake_rejected', (data: any) => {
      const { handshakeId, factoryId, factoryName, reason } = data;
      setHandshakeStates(prev => {
        const next = new Map(prev);
        next.set(factoryId, { status: 'rejected', handshakeId });
        return next;
      });
      toast.error(`${factoryName} declined the request${reason ? `: ${reason}` : ''}`);
    });

    // 握手过期
    socket.on('handshake_expired', (data: any) => {
      const { handshakeId } = data;
      setHandshakeStates(prev => {
        const next = new Map(prev);
        for (const [fid, state] of next.entries()) {
          if (state.handshakeId === handshakeId) {
            next.set(fid, { ...state, status: 'expired' });
          }
        }
        return next;
      });
    });

    return () => {
      socket.off('match_complete');
      socket.off('match_expired');
      socket.off('handshake_accepted');
      socket.off('handshake_rejected');
      socket.off('handshake_expired');
    };
  }, [socket, demandId, setLocation]);

  // ── 从数据库恢复握手状态 ───────────────────────────────────────────────────

  useEffect(() => {
    if (!handshakesByDemand.data) return;
    const stateMap = new Map<number, HandshakeState>();
    for (const h of handshakesByDemand.data as any[]) {
      const existing = stateMap.get(h.factoryId);
      // 优先保留 accepted 状态
      if (!existing || h.status === 'accepted') {
        stateMap.set(h.factoryId, {
          status: h.status as HandshakeStatus,
          handshakeId: h.id,
          roomSlug: h.roomSlug ?? undefined,
          expiresAt: h.expiresAt ? new Date(h.expiresAt) : undefined,
        });
      }
    }
    setHandshakeStates(stateMap);
  }, [handshakesByDemand.data]);

  // ── 事件处理 ──────────────────────────────────────────────────────────────

  const handleRequestChat = useCallback((factoryId: number, matchResultId?: number) => {
    if (!user) return;
    setRequestingFactoryId(factoryId);
    createHandshakeMutation.mutate({ demandId, factoryId, matchResultId });
  }, [user, demandId, createHandshakeMutation]);

  const handleTriggerMatch = () => {
    setIsTriggering(true);
    triggerMatchMutation.mutate({ demandId });
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

  const demand = (data as any)?.demand;
  const matches: any[] = (matchResults.data as any)?.matches ?? [];
  const isMatchLoading = matchResults.isLoading;
  const hasMatches = matches.length > 0;

  // 统计
  const pendingCount = Array.from(handshakeStates.values()).filter(s => s.status === 'pending').length;
  const acceptedCount = Array.from(handshakeStates.values()).filter(s => s.status === 'accepted').length;

  return (
    <div className="min-h-screen text-white"
      style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "32px 32px", opacity: 0.6 }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {/* Back */}
          <button
            onClick={() => setLocation(`/sourcing-demands/${demandId}`)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Demand
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/30 to-purple-800/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Factory Matching</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {demand?.productName
                    ? `Finding best factories for "${demand.productName}"`
                    : "AI-powered factory discovery"}
                </p>
              </div>
            </div>

            {/* 15-min Countdown */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
              isUrgent
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-purple-500/8 border-purple-500/20'
            }`}>
              <Timer className={`w-5 h-5 ${isUrgent ? 'text-red-400' : 'text-purple-400'}`} />
              <div>
                <p className={`text-xs font-medium ${isUrgent ? 'text-red-300' : 'text-purple-300'}`}>
                  Matching Window
                </p>
                <p className={`text-xl font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-white'}`}>
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-5 flex-wrap">
            {[
              { icon: Factory, label: "Matches Found", value: matches.length, color: "text-purple-400" },
              { icon: MessageSquare, label: "Requests Sent", value: pendingCount, color: "text-amber-400" },
              { icon: CheckCircle2, label: "Accepted", value: acceptedCount, color: "text-green-400" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xl font-bold text-white">{stat.value}</span>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <Progress
              value={progress}
              className="h-1.5 bg-white/5"
            />
          </div>
        </motion.div>

        {/* ── Main Content ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left: Match List */}
          <div className="lg:col-span-3 space-y-4">

            {/* Trigger Match Button (if no matches yet) */}
            {!hasMatches && !isMatchLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-purple-500/20 p-8 text-center"
                style={{ background: "rgba(124,58,237,0.05)" }}
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Start AI Factory Matching</h3>
                <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
                  Our AI will analyze your sourcing demand and find the top matching factories
                  from our verified supplier network in seconds.
                </p>
                <Button
                  onClick={handleTriggerMatch}
                  disabled={isTriggering}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold px-8 h-11 shadow-lg shadow-purple-600/25"
                >
                  {isTriggering ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Matching in progress...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Find Matching Factories
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Loading */}
            {isMatchLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">Loading match results...</p>
                </div>
              </div>
            )}

            {/* Match Results */}
            {hasMatches && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-white">
                    {matches.length} Matched Factories
                  </h2>
                  <button
                    onClick={() => matchResults.refetch()}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matches.map((match: any, index: number) => {
                    const factoryId = match.factoryId ?? match.factory?.id ?? index;
                    const handshakeState = handshakeStates.get(factoryId) ?? { status: 'idle' };
                    return (
                      <FactoryMatchCard
                        key={match.id ?? index}
                        match={match}
                        handshakeState={handshakeState}
                        onRequestChat={handleRequestChat}
                        isRequesting={requestingFactoryId === factoryId}
                        onNavigateToRoom={(slug) => setLocation(`/sourcing-room/${slug}`)}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-4">

            {/* Demand Summary */}
            {demand && (
              <div className="rounded-2xl border border-white/8 p-5"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-400" />
                  Demand Summary
                </h3>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-xs text-gray-600 mb-0.5">Product</p>
                    <p className="text-sm font-medium text-white">{demand.productName ?? "—"}</p>
                  </div>
                  {demand.estimatedQuantity && (
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Quantity</p>
                      <p className="text-sm font-medium text-white">{demand.estimatedQuantity}</p>
                    </div>
                  )}
                  {demand.targetPrice && (
                    <div>
                      <p className="text-xs text-gray-600 mb-0.5">Target Price</p>
                      <p className="text-sm font-medium text-white">{demand.targetPrice}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="rounded-2xl border border-white/8 p-5"
              style={{ background: "rgba(255,255,255,0.02)" }}>
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                How It Works
              </h3>
              <div className="space-y-3">
                {[
                  { step: "1", title: "AI Matches Factories", desc: "Semantic matching across 10,000+ verified suppliers", color: "purple" },
                  { step: "2", title: "Request Chat", desc: "Click 'Request Chat' on any matched factory", color: "blue" },
                  { step: "3", title: "15-min Response", desc: "Factory responds within 15 minutes", color: "amber" },
                  { step: "4", title: "Enter Sourcing Room", desc: "AI-assisted negotiation begins", color: "green" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      item.color === 'purple' ? 'bg-purple-500/20 text-purple-300' :
                      item.color === 'blue' ? 'bg-blue-500/20 text-blue-300' :
                      item.color === 'amber' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {item.step}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Re-trigger match */}
            {hasMatches && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleTriggerMatch}
                disabled={isTriggering}
                className="w-full border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-xs"
              >
                {isTriggering ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />
                )}
                Re-run AI Matching
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
