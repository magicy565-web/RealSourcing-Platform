/**
 * RealSourcing 4.0 — Matching Dashboard (完全重构版)
 *
 * 设计理念：
 * - 上方：工厂匹配结果区（AMR 卡片，实时 WebSocket 推送）
 * - 下方：AI 对话微调区（自然语言指令，实时重排）
 * - 顶部：15 分钟倒计时 + 状态 Ticker
 * - 侧滑：工厂详情 Drawer（完整雷达图 + 认证 + 指标）
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, Zap, Clock, CheckCircle2, Loader2,
  MessageSquare, Shield, Globe, Sparkles, Send, X, Timer,
  BarChart3, Star, BadgeCheck, Activity, RefreshCw,
  AlertTriangle, Play, TrendingUp, Factory, MapPin,
  Users, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/hooks/useSocket";
import { ScoreRing } from "@/components/matching/ScoreRing";
import { AMRDimensionBars } from "@/components/matching/AMRDimensionBars";
import { AMRRadarChart, type AMRDimensions } from "@/components/matching/AMRRadarChart";

// ── Constants ─────────────────────────────────────────────────────────────────
const MATCH_WINDOW_SECONDS = 15 * 60;

const GRID_BG = `
  linear-gradient(rgba(124,58,237,0.025) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124,58,237,0.025) 1px, transparent 1px)
`;

// ── Types ─────────────────────────────────────────────────────────────────────
type HandshakeStatus = "idle" | "pending" | "accepted" | "rejected" | "expired";

interface HandshakeState {
  status: HandshakeStatus;
  handshakeId?: number;
  roomSlug?: string;
}

interface MatchResult {
  id: number;
  matchScore: number;
  matchReason?: string;
  matchReasons?: string[];
  structuredReasons?: Array<{ icon: string; label: string; value: string; highlight: boolean }>;
  factoryId: number;
  amrScore?: number;
  amrAcumen?: number;
  amrChannel?: number;
  amrVelocity?: number;
  amrGlobal?: number;
  factory?: {
    id: number;
    name: string;
    logoUrl?: string;
    coverImage?: string;
    category?: string;
    country?: string;
    city?: string;
    isOnline: boolean;
    location?: string;
    rating?: number;
    reviewCount?: number;
    certificationStatus?: string;
    certifications?: string[];
    responseRate?: number;
    averageResponseTime?: number;
    aiVerificationScore?: number;
    complianceScore?: number;
    trustBadges?: string[];
    totalOrders?: number;
    disputeRate?: number;
    hasReel?: boolean;
    moq?: number;
  };
}

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

// ── Countdown Hook ────────────────────────────────────────────────────────────
function useCountdown(targetSeconds: number) {
  const [remaining, setRemaining] = useState(targetSeconds);
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining]);
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  const isUrgent = remaining < 180;
  const isExpired = remaining === 0;
  return { m, s, isUrgent, isExpired };
}

// ── Score Config ──────────────────────────────────────────────────────────────
function getScoreConfig(score: number) {
  if (score >= 90) return { label: "Perfect Match", color: "#4ade80", bg: "rgba(74,222,128,0.1)",  border: "rgba(74,222,128,0.25)"  };
  if (score >= 75) return { label: "Strong Match",  color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.25)"  };
  if (score >= 60) return { label: "Good Match",    color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)" };
  return              { label: "Possible",          color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)"   };
}

// ── Skeleton Card ─────────────────────────────────────────────────────────────
function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl border border-white/5 overflow-hidden"
      style={{ background: "rgba(255,255,255,0.015)" }}
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-white/5 rounded animate-pulse w-3/4" />
            <div className="h-2.5 bg-white/5 rounded animate-pulse w-1/2" />
          </div>
          <div className="w-12 h-12 rounded-full bg-white/5 animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-16 h-2 bg-white/5 rounded animate-pulse" />
              <div className="flex-1 h-1 bg-white/5 rounded animate-pulse" />
              <div className="w-6 h-2 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t border-white/5">
          <div className="flex-1 h-2 bg-white/5 rounded animate-pulse" />
          <div className="w-24 h-7 bg-white/5 rounded-lg animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Match Card ────────────────────────────────────────────────────────────────
interface MatchCardProps {
  match: MatchResult;
  index: number;
  handshakeState: HandshakeState;
  onRequestChat: (factoryId: number, matchId: number) => void;
  onViewDetails: (match: MatchResult) => void;
  isRequesting: boolean;
  overrideScore?: number;
}

function MatchCard({ match, index, handshakeState, onRequestChat, onViewDetails, isRequesting, overrideScore }: MatchCardProps) {
  const score = overrideScore ?? match.matchScore ?? 0;
  const cfg = getScoreConfig(score);
  const factory = match.factory;
  const name = factory?.name ?? `Factory #${match.factoryId}`;
  const isOnline = factory?.isOnline ?? false;
  const certs = factory?.certifications ?? [];

  const amrDimensions: AMRDimensions = {
    acumen:   match.amrAcumen   ?? Math.round(score * 0.85),
    channel:  match.amrChannel  ?? Math.round(score * 0.9),
    velocity: match.amrVelocity ?? Math.round(score * 0.88),
    global:   match.amrGlobal   ?? Math.round(score * 0.82),
    trust:    factory?.aiVerificationScore ?? 70,
  };

  const borderColor =
    handshakeState.status === "accepted" ? "rgba(74,222,128,0.35)" :
    handshakeState.status === "pending"  ? "rgba(245,158,11,0.35)"  :
    cfg.border;

  return (
    <motion.div
      layout
      layoutId={`card-${match.factoryId}`}
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group relative overflow-hidden rounded-2xl cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.022)",
        backdropFilter: "blur(24px)",
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 24px rgba(124,58,237,0.06)`,
      }}
      onClick={() => onViewDetails(match)}
    >
      {/* Top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)` }} />

      {/* Cover strip */}
      {factory?.coverImage && (
        <div className="relative h-20 overflow-hidden">
          <img src={factory.coverImage} alt={name}
            className="w-full h-full object-cover opacity-35 group-hover:opacity-50 transition-opacity duration-500" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0d1a]" />
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden border border-white/10 bg-gradient-to-br from-violet-900/50 to-slate-900 flex items-center justify-center">
              {factory?.logoUrl ? (
                <img src={factory.logoUrl} alt={name} className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <Factory className="w-4 h-4 text-violet-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-bold text-white truncate leading-tight">{name}</h3>
                {factory?.aiVerificationScore && factory.aiVerificationScore >= 80 && (
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {factory?.location && (
                  <span className="text-[11px] text-gray-500 flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />{factory.location}
                  </span>
                )}
                {factory?.category && (
                  <span className="text-[11px] text-gray-600 truncate">{factory.category}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <ScoreRing score={score} size={52} strokeWidth={4} animated />
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isOnline
                ? "bg-green-500/12 border border-green-500/20 text-green-400"
                : "bg-gray-800/50 border border-gray-700/30 text-gray-600"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-400 animate-pulse" : "bg-gray-600"}`} />
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>

        {/* AMR Bars */}
        <div className="mb-4">
          <AMRDimensionBars
            acumen={amrDimensions.acumen}
            channel={amrDimensions.channel}
            velocity={amrDimensions.velocity}
            global={amrDimensions.global}
            compact
          />
        </div>

        {/* Structured reasons */}
        {match.structuredReasons && match.structuredReasons.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {match.structuredReasons.slice(0, 3).map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-1 h-1 rounded-full flex-shrink-0 ${r.highlight ? "bg-green-400" : "bg-gray-600"}`} />
                <span className="text-[11px] text-gray-500">
                  <span className="text-gray-400 font-medium">{r.label}:</span> {r.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Match reasons (fallback) */}
        {(!match.structuredReasons || match.structuredReasons.length === 0) && match.matchReasons && match.matchReasons.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {match.matchReasons.slice(0, 2).map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-400/70 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] text-gray-500 leading-relaxed">{r}</span>
              </div>
            ))}
          </div>
        )}

        {/* Certs */}
        {certs.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {certs.slice(0, 4).map((c, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 border border-blue-500/15 text-blue-400">{c}</span>
            ))}
            {certs.length > 4 && <span className="px-1.5 py-0.5 rounded text-[10px] text-gray-600">+{certs.length - 4}</span>}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-3">
            {factory?.averageResponseTime && factory.averageResponseTime > 0 && (
              <span className="text-[11px] text-gray-600 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {factory.averageResponseTime < 60 ? `${factory.averageResponseTime}min` : `${Math.round(factory.averageResponseTime / 60)}h`}
              </span>
            )}
            {factory?.totalOrders && factory.totalOrders > 0 && (
              <span className="text-[11px] text-gray-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />{factory.totalOrders} orders
              </span>
            )}
          </div>

          {handshakeState.status === "accepted" ? (
            <button onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/15 border border-green-500/25 text-green-300">
              <CheckCircle2 className="w-3.5 h-3.5" />Room Ready
            </button>
          ) : handshakeState.status === "pending" ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Loader2 className="w-3 h-3 animate-spin" />Awaiting...
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onRequestChat(match.factoryId, match.id); }}
              disabled={isRequesting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:opacity-90"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
            >
              {isRequesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3" />}
              Request Chat
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Factory Detail Drawer ─────────────────────────────────────────────────────
function FactoryDetailDrawer({
  match, onClose, onRequestChat, handshakeState, isRequesting, onNavigateToRoom,
}: {
  match: MatchResult | null;
  onClose: () => void;
  onRequestChat: (factoryId: number, matchId: number) => void;
  handshakeState: HandshakeState;
  isRequesting: boolean;
  onNavigateToRoom: (slug: string) => void;
}) {
  const factory = match?.factory;
  const score = match?.matchScore ?? 0;
  const cfg = getScoreConfig(score);

  const amrDimensions: AMRDimensions = {
    acumen:   match?.amrAcumen   ?? Math.round(score * 0.85),
    channel:  match?.amrChannel  ?? Math.round(score * 0.9),
    velocity: match?.amrVelocity ?? Math.round(score * 0.88),
    global:   match?.amrGlobal   ?? Math.round(score * 0.82),
    trust:    factory?.aiVerificationScore ?? 70,
  };

  return (
    <AnimatePresence>
      {match && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto"
            style={{ background: "linear-gradient(160deg,#0d0d1f 0%,#0a0a18 100%)", borderLeft: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Drawer header */}
            <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-white/6"
              style={{ background: "rgba(13,13,31,0.95)", backdropFilter: "blur(20px)" }}>
              <div>
                <h2 className="text-base font-bold text-white">{factory?.name ?? "Factory Details"}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{factory?.location}</p>
              </div>
              <button onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Cover */}
              {factory?.coverImage && (
                <div className="relative h-32 rounded-xl overflow-hidden">
                  <img src={factory.coverImage} alt={factory.name} className="w-full h-full object-cover opacity-55" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d1f] to-transparent" />
                </div>
              )}

              {/* Score */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4" style={{ color: cfg.color }} />
                    <span className="text-sm font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">AI Semantic Match Score</p>
                </div>
                <ScoreRing score={score} size={72} strokeWidth={5} animated sublabel="Match" />
              </div>

              {/* AMR Radar */}
              <div className="rounded-xl border border-white/6 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
                  AMR Performance Radar
                </h3>
                <div className="flex justify-center">
                  <AMRRadarChart dimensions={amrDimensions} size={200} animated showLabels />
                </div>
              </div>

              {/* AMR Bars */}
              <div className="rounded-xl border border-white/6 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dimension Breakdown</h3>
                <AMRDimensionBars
                  acumen={amrDimensions.acumen}
                  channel={amrDimensions.channel}
                  velocity={amrDimensions.velocity}
                  global={amrDimensions.global}
                />
              </div>

              {/* Certifications */}
              {factory?.certifications && factory.certifications.length > 0 && (
                <div className="rounded-xl border border-white/6 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />Certifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {factory.certifications.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-300">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Total Orders",   value: factory?.totalOrders ?? "—",  icon: <TrendingUp className="w-3.5 h-3.5" /> },
                  { label: "Dispute Rate",   value: factory?.disputeRate != null ? `${factory.disputeRate.toFixed(1)}%` : "—", icon: <Activity className="w-3.5 h-3.5" /> },
                  { label: "Response Rate",  value: factory?.responseRate != null ? `${factory.responseRate.toFixed(0)}%` : "—", icon: <Zap className="w-3.5 h-3.5" /> },
                  { label: "AI Trust Score", value: factory?.aiVerificationScore ?? "—", icon: <BadgeCheck className="w-3.5 h-3.5" /> },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl border border-white/6 p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">{m.icon}<span className="text-[10px] uppercase tracking-wider font-medium">{m.label}</span></div>
                    <p className="text-lg font-bold text-white tabular-nums">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Match reasons */}
              {match?.matchReasons && match.matchReasons.length > 0 && (
                <div className="rounded-xl border border-white/6 p-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />AI Match Analysis
                  </h3>
                  <div className="space-y-2">
                    {match.matchReasons.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                        <p className="text-xs text-gray-400 leading-relaxed">{r}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="pb-4">
                {handshakeState.status === "accepted" ? (
                  <button
                    onClick={() => handshakeState.roomSlug && onNavigateToRoom(handshakeState.roomSlug)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-green-500/15 border border-green-500/25 text-green-300 hover:bg-green-500/25 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />Enter Sourcing Room
                  </button>
                ) : handshakeState.status === "pending" ? (
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Loader2 className="w-4 h-4 animate-spin" />Awaiting factory response...
                  </div>
                ) : (
                  <button
                    onClick={() => match && onRequestChat(match.factoryId, match.id)}
                    disabled={isRequesting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
                    style={{ background: `linear-gradient(135deg,${cfg.color}20,${cfg.color}10)`, border: `1px solid ${cfg.border}`, color: cfg.color, boxShadow: `0 0 20px ${cfg.color}15` }}
                  >
                    {isRequesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    Request Chat with Factory
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MatchingDashboard() {
  const { id } = useParams<{ id: string }>();
  const demandId = parseInt(id ?? "0");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const socket = useSocket();

  const [handshakeStates, setHandshakeStates] = useState<Map<number, HandshakeState>>(new Map());
  const [requestingFactoryId, setRequestingFactoryId] = useState<number | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [scoreOverrides, setScoreOverrides] = useState<Map<number, number>>(new Map());
  const [sortedFactoryIds, setSortedFactoryIds] = useState<number[]>([]);
  const [tickerMsg, setTickerMsg] = useState("AI is scanning 10,000+ verified suppliers...");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { m, s, isUrgent, isExpired } = useCountdown(MATCH_WINDOW_SECONDS);

  // Queries
  const demandQuery = trpc.sourcingDemands.getById.useQuery({ id: demandId }, { enabled: !!demandId });
  const matchResults = trpc.sourcingDemands.getMatchResults.useQuery({ demandId }, { enabled: !!demandId, refetchInterval: false });
  const handshakesByDemand = trpc.knowledge.getHandshakesByDemand.useQuery({ demandId }, { enabled: !!demandId });

  // Mutations
  const triggerMatchMutation = trpc.sourcingDemands.triggerMatch.useMutation({
    onSuccess: () => { setIsTriggering(false); setTickerMsg("AI matching triggered — results will appear shortly"); },
    onError: () => setIsTriggering(false),
  });

  const createHandshakeMutation = trpc.knowledge.createHandshake.useMutation({
    onSuccess: (result: any) => {
      const fid = requestingFactoryId;
      if (fid) {
        setHandshakeStates(prev => { const n = new Map(prev); n.set(fid, { status: "pending", handshakeId: result?.id }); return n; });
      }
      setRequestingFactoryId(null);
      toast.success("Chat request sent! Factory has 15 minutes to respond.");
    },
    onError: () => setRequestingFactoryId(null),
  });

  const refineMatchMutation = trpc.sourcingDemands.refineMatch.useMutation({
    onSuccess: (result: any) => {
      setIsRefining(false);
      if (result?.rankedFactoryIds) setSortedFactoryIds(result.rankedFactoryIds);
      if (result?.scores) {
        const m = new Map<number, number>();
        for (const [k, v] of Object.entries(result.scores)) m.set(parseInt(k), v as number);
        setScoreOverrides(m);
      }
      const summary = result?.summary ?? "Match refined based on your preferences";
      setChatMessages(prev => [...prev, { role: "ai", content: summary, timestamp: new Date() }]);
      setTickerMsg(summary);
    },
    onError: () => {
      setIsRefining(false);
      setChatMessages(prev => [...prev, { role: "ai", content: "Sorry, I couldn't process that. Please try again.", timestamp: new Date() }]);
    },
  });

  // WebSocket
  useEffect(() => {
    if (!socket || !demandId) return;
    socket.emit("join_demand_room", { demandId });

    socket.on("match_complete", (data: any) => {
      if (data.demandId !== demandId) return;
      matchResults.refetch();
      const count = data.factoryCount ?? "several";
      toast.success(`✨ ${count} factories matched!`, { description: "Results updated below", duration: 4000 });
      setTickerMsg(`AI found ${count} matching factories`);
    });

    socket.on("match_expired", (data: any) => {
      if (data.demandId !== demandId) return;
      toast.warning("⏰ 15-minute window closed", { description: "You can re-trigger matching anytime", duration: 8000 });
    });

    socket.on("handshake_accepted", (data: any) => {
      const { handshakeId, factoryId, factoryName, roomSlug } = data;
      setHandshakeStates(prev => { const n = new Map(prev); n.set(factoryId, { status: "accepted", handshakeId, roomSlug }); return n; });
      toast.success(`🎉 ${factoryName} accepted!`, {
        action: { label: "Enter Room", onClick: () => setLocation(`/sourcing-room/${roomSlug}`) },
        duration: 12000,
      });
      setTickerMsg(`${factoryName} accepted your chat request`);
    });

    socket.on("handshake_rejected", (data: any) => {
      const { factoryId, factoryName } = data;
      setHandshakeStates(prev => { const n = new Map(prev); n.set(factoryId, { status: "rejected" }); return n; });
      toast.error(`${factoryName} declined the request`);
    });

    socket.on("handshake_expired", (data: any) => {
      const { handshakeId } = data;
      setHandshakeStates(prev => {
        const n = new Map(prev);
        for (const [fid, state] of n.entries()) {
          if (state.handshakeId === handshakeId) n.set(fid, { ...state, status: "expired" });
        }
        return n;
      });
    });

    // 4.1: 监听 Open Claw Agent 报价到达事件
    socket.on("quote_received", (data: any) => {
      if (data.demandId !== demandId) return;
      const priceDisplay = data.unitPrice
        ? `${data.currency ?? 'USD'} ${Number(data.unitPrice).toFixed(2)}/unit`
        : '';
      const sourceLabel = data.source === 'feishu_bitable'
        ? '飞书报价库'
        : data.source === 'claw_agent'
        ? 'AI 助手'
        : data.source ?? 'AI';
      toast.success(`🎉 收到报价！`, {
        description: `来源：${sourceLabel}${priceDisplay ? ` · ${priceDisplay}` : ''}${data.moq ? ` · MOQ: ${data.moq}` : ''}`,
        duration: 15000,
      });
    });
    return () => {
      socket.off("match_complete");
      socket.off("match_expired");
      socket.off("handshake_accepted");
      socket.off("handshake_rejected");
      socket.off("handshake_expired");
      socket.off("quote_received");
      socket.emit("leave_demand_room", { demandId });
    };
  }, [socket, demandId]);

  // Restore handshake states from DB
  useEffect(() => {
    if (!handshakesByDemand.data) return;
    const map = new Map<number, HandshakeState>();
    for (const h of handshakesByDemand.data as any[]) {
      const existing = map.get(h.factoryId);
      if (!existing || h.status === "accepted") {
        map.set(h.factoryId, { status: h.status, handshakeId: h.id, roomSlug: h.roomSlug ?? undefined });
      }
    }
    setHandshakeStates(map);
  }, [handshakesByDemand.data]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleRequestChat = useCallback((factoryId: number, matchResultId: number) => {
    if (!user) return;
    setRequestingFactoryId(factoryId);
    createHandshakeMutation.mutate({ demandId, factoryId, matchResultId });
  }, [user, demandId, createHandshakeMutation]);

  const handleTriggerMatch = () => {
    setIsTriggering(true);
    triggerMatchMutation.mutate({ demandId });
  };

  const handleSendChat = () => {
    const instruction = chatInput.trim();
    if (!instruction || isRefining) return;
    setChatMessages(prev => [...prev, { role: "user", content: instruction, timestamp: new Date() }]);
    setChatInput("");
    setIsRefining(true);
    refineMatchMutation.mutate({ demandId, instruction });
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendChat(); }
  };

  // Sorted matches
  const demand = (demandQuery.data as any)?.demand;
  const rawMatches: MatchResult[] = (matchResults.data as any)?.matches ?? [];
  const matches: MatchResult[] = sortedFactoryIds.length > 0
    ? [...rawMatches].sort((a, b) => {
        const ai = sortedFactoryIds.indexOf(a.factoryId);
        const bi = sortedFactoryIds.indexOf(b.factoryId);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
    : rawMatches;

  const hasMatches = matches.length > 0;
  const pendingCount = Array.from(handshakeStates.values()).filter(s => s.status === "pending").length;
  const acceptedCount = Array.from(handshakeStates.values()).filter(s => s.status === "accepted").length;

  return (
    <div className="min-h-screen text-white flex flex-col"
      style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "32px 32px" }} />

      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-white/6"
        style={{ background: "rgba(5,3,16,0.92)", backdropFilter: "blur(24px)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setLocation(`/sourcing-demands/${demandId}`)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/8 transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <span className="text-sm font-bold text-white truncate">
                  {demand?.productName ?? "AI Factory Matching"}
                </span>
              </div>
              {demand?.estimatedQuantity && (
                <p className="text-[11px] text-gray-600 truncate">
                  {demand.estimatedQuantity} units · {demand.targetPrice ?? "Price TBD"}
                </p>
              )}
            </div>
          </div>

          {/* Center stats */}
          <div className="hidden md:flex items-center gap-4">
            {hasMatches && (
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5" />
                <span className="font-semibold text-white">{matches.length}</span> matched
              </span>
            )}
            {pendingCount > 0 && (
              <span className="text-xs text-amber-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />{pendingCount} pending
              </span>
            )}
            {acceptedCount > 0 && (
              <span className="text-xs text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />{acceptedCount} accepted
              </span>
            )}
          </div>

          {/* Countdown */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border flex-shrink-0 ${
            isExpired ? "border-gray-700/30 bg-gray-800/20 text-gray-600"
            : isUrgent ? "border-red-500/30 bg-red-500/8 text-red-400"
            : "border-violet-500/20 bg-violet-500/8 text-violet-300"
          }`}>
            <Timer className={`w-3.5 h-3.5 ${isUrgent && !isExpired ? "animate-pulse" : ""}`} />
            <span className="text-sm font-bold tabular-nums">
              {isExpired ? "Expired" : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`}
            </span>
          </div>
        </div>

        {/* Ticker */}
        <div className="border-t border-white/4 overflow-hidden h-7 flex items-center px-4 sm:px-6">
          <AnimatePresence mode="wait">
            <motion.p key={tickerMsg}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="text-[11px] text-gray-600 flex items-center gap-2">
              <Activity className="w-3 h-3 text-violet-500 flex-shrink-0" />
              {tickerMsg}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-5">

        {/* Results area */}
        <div className="flex-1">
          {/* Empty state */}
          {!hasMatches && !matchResults.isLoading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl border border-violet-500/20 bg-violet-500/8 flex items-center justify-center mb-6">
                <Sparkles className="w-9 h-9 text-violet-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Ready to Find Your Factories</h2>
              <p className="text-sm text-gray-500 max-w-sm mb-8">
                AI will scan 10,000+ verified suppliers and match them to your demand in seconds.
                Results appear in real-time as they're found.
              </p>
              <button onClick={handleTriggerMatch} disabled={isTriggering}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
                style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.3),rgba(124,58,237,0.15))", border: "1px solid rgba(124,58,237,0.4)", color: "#a78bfa", boxShadow: "0 0 24px rgba(124,58,237,0.15)" }}>
                {isTriggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isTriggering ? "Matching in progress..." : "Start AI Matching"}
              </button>
            </motion.div>
          )}

          {/* Skeletons */}
          {matchResults.isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[0,1,2].map(i => <SkeletonCard key={i} index={i} />)}
            </div>
          )}

          {/* Cards */}
          {hasMatches && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">{matches.length} Matched Factories</h2>
                  {sortedFactoryIds.length > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/20 text-violet-400 font-medium">AI Refined</span>
                  )}
                </div>
                <button onClick={handleTriggerMatch} disabled={isTriggering}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  {isTriggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Re-run
                </button>
              </div>

              <LayoutGroup>
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {matches.map((match, index) => {
                      const hs = handshakeStates.get(match.factoryId) ?? { status: "idle" };
                      return (
                        <MatchCard
                          key={match.id ?? match.factoryId}
                          match={match}
                          index={index}
                          handshakeState={hs}
                          onRequestChat={handleRequestChat}
                          onViewDetails={setSelectedMatch}
                          isRequesting={requestingFactoryId === match.factoryId}
                          overrideScore={scoreOverrides.get(match.factoryId)}
                        />
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              </LayoutGroup>
            </>
          )}
        </div>

        {/* ── AI Chat Area ──────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/6 overflow-hidden flex-shrink-0"
          style={{ background: "rgba(255,255,255,0.018)", backdropFilter: "blur(20px)" }}>
          {/* Chat history */}
          {chatMessages.length > 0 && (
            <div className="max-h-48 overflow-y-auto p-4 space-y-3 border-b border-white/5">
              {chatMessages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "ai" && (
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-violet-400" />
                    </div>
                  )}
                  <div className={`max-w-xs rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-violet-500/15 border border-violet-500/20 text-violet-200"
                      : "bg-white/5 border border-white/8 text-gray-300"
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isRefining && (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/25 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-xs text-gray-500">
                    Refining match results...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input */}
          <div className="p-3 flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder={hasMatches
                  ? 'Refine results, e.g. "I need BSCI certified factories" or "Prioritize faster response time"'
                  : "Describe what you're looking for and AI will match factories..."}
                rows={1}
                className="w-full bg-transparent text-sm text-white placeholder-gray-600 resize-none focus:outline-none leading-relaxed"
                style={{ maxHeight: "80px" }}
              />
            </div>
            <button onClick={handleSendChat} disabled={!chatInput.trim() || isRefining}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-30"
              style={{
                background: chatInput.trim() ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)",
                border: chatInput.trim() ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.08)",
              }}>
              <Send className="w-4 h-4 text-violet-300" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Factory Detail Drawer ─────────────────────────────────────────────── */}
      <FactoryDetailDrawer
        match={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onRequestChat={handleRequestChat}
        handshakeState={selectedMatch ? (handshakeStates.get(selectedMatch.factoryId) ?? { status: "idle" }) : { status: "idle" }}
        isRequesting={selectedMatch ? requestingFactoryId === selectedMatch.factoryId : false}
        onNavigateToRoom={slug => setLocation(`/sourcing-room/${slug}`)}
      />
    </div>
  );
}
