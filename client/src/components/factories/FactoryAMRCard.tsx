/**
 * FactoryAMRCard — AMR v2.0 社区驱动工厂卡片
 *
 * 设计哲学：
 * - 不显示"成立年份"，不显示"员工人数"
 * - 首屏核心：AMR 综合指数 + 渠道能力图标
 * - 信任来源：买家体感标签（圈内口碑），而非平台自评
 * - 行动导向：直接展示"小单可接"、"FBA 支持"等决策关键信息
 * - v2.1：hover 快捷操作展开层 + framer-motion 动画
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, ArrowRight, Zap, Users, TrendingUp,
  Handshake, Video, MessageSquare, Star, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── 渠道能力图标配置 ─────────────────────────────────────────────────────────
const CHANNEL_ICONS: Record<string, { label: string; color: string; bg: string }> = {
  dropshipping: { label: "Dropship",   color: "text-emerald-300", bg: "bg-emerald-500/15 border-emerald-500/30" },
  amazon_fba:   { label: "Amazon FBA", color: "text-amber-300",   bg: "bg-amber-500/15 border-amber-500/30" },
  shopify:      { label: "Shopify",    color: "text-blue-300",    bg: "bg-blue-500/15 border-blue-500/30" },
  trade_show:   { label: "展会参展",   color: "text-violet-300",  bg: "bg-violet-500/15 border-violet-500/30" },
  small_moq:    { label: "小单友好",   color: "text-pink-300",    bg: "bg-pink-500/15 border-pink-500/30" },
  blind_ship:   { label: "白标发货",   color: "text-cyan-300",    bg: "bg-cyan-500/15 border-cyan-500/30" },
};

// ─── AMR 雷达评分 Mini 组件 ──────────────────────────────────────────────────
function AMRScoreMini({
  score, acumen, channel, velocity, global,
}: {
  score: number; acumen: number; channel: number; velocity: number; global: number;
}) {
  const pillars = [
    { label: "市场", value: acumen,   color: "#a78bfa" },
    { label: "渠道", value: channel,  color: "#34d399" },
    { label: "响应", value: velocity, color: "#60a5fa" },
    { label: "全球", value: global,   color: "#f59e0b" },
  ];

  return (
    <div className="flex items-center gap-3">
      {/* 综合分数圆环 */}
      <div className="relative w-12 h-12 shrink-0">
        <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
          <circle cx="22" cy="22" r="18" fill="none" stroke="#1e1b4b" strokeWidth="4" />
          <circle
            cx="22" cy="22" r="18" fill="none"
            stroke="#7c3aed" strokeWidth="4"
            strokeDasharray={`${(score / 100) * 113} 113`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-violet-300">
          {score}
        </span>
      </div>

      {/* 四维柱状 */}
      <div className="flex gap-1.5 items-end h-8">
        {pillars.map((p) => (
          <div key={p.label} className="flex flex-col items-center gap-0.5">
            <motion.div
              className="w-4 rounded-sm"
              initial={{ height: 4 }}
              animate={{ height: Math.max(4, (p.value / 100) * 24) }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              style={{ backgroundColor: p.color, opacity: 0.85 }}
            />
            <span className="text-[9px] text-slate-500">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 体感标签 ────────────────────────────────────────────────────────────────
function VibeTag({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-700/50 border border-slate-600/40 text-slate-300">
      {tag}
    </span>
  );
}

// ─── 渠道能力标签 ────────────────────────────────────────────────────────────
function ChannelBadge({ channelKey }: { channelKey: string }) {
  const cfg = CHANNEL_ICONS[channelKey];
  if (!cfg) return null;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border", cfg.bg, cfg.color)}>
      {cfg.label}
    </span>
  );
}

// ─── 快捷操作按钮 ────────────────────────────────────────────────────────────
function QuickActionBtn({
  icon, label, color, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.06, y: -1 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        background: `${color}12`,
        border: `1px solid ${color}30`,
        borderRadius: 10, padding: "8px 4px",
        cursor: "pointer", transition: "background 0.2s",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = `${color}22`)}
      onMouseLeave={e => (e.currentTarget.style.background = `${color}12`)}
    >
      <span style={{ color }}>{icon}</span>
      <span style={{ color, fontSize: 10, fontWeight: 700 }}>{label}</span>
    </motion.button>
  );
}

// ─── 主组件 Props ─────────────────────────────────────────────────────────────
export interface FactoryAMRData {
  id: string;
  name: string;
  city?: string;
  country?: string;
  category?: string;
  logo?: string;
  coverImage?: string;
  status?: string;
  amrScore?: number;
  amrAcumen?: number;
  amrChannel?: number;
  amrVelocity?: number;
  amrGlobal?: number;
  channels?: string[];
  vibeTags?: string[];
  avgShipHours?: number;
  activeGlobalBuyers?: number;
  mentorEndorsement?: string;
}

interface FactoryAMRCardProps {
  factory: FactoryAMRData;
  onViewDetails?: (factoryId: string) => void;
  onQuickInquiry?: (factoryId: string) => void;
  onQuickMeeting?: (factoryId: string) => void;
}

export function FactoryAMRCard({ factory, onViewDetails, onQuickInquiry, onQuickMeeting }: FactoryAMRCardProps) {
  const [, setLocation] = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  const [quickActionDone, setQuickActionDone] = useState<string | null>(null);

  const amrScore    = factory.amrScore    ?? 72;
  const amrAcumen   = factory.amrAcumen   ?? 68;
  const amrChannel  = factory.amrChannel  ?? 80;
  const amrVelocity = factory.amrVelocity ?? 75;
  const amrGlobal   = factory.amrGlobal   ?? 65;
  const channels    = factory.channels    ?? ["dropshipping", "small_moq"];
  const vibeTags    = factory.vibeTags    ?? ["英文沟通流畅", "快速打样", "小单可接"];

  const handleViewDetails = () => {
    if (onViewDetails) onViewDetails(factory.id);
    else setLocation(`/factory/${factory.id}`);
  };

  const handleQuickAction = (type: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickActionDone(type);
    setTimeout(() => setQuickActionDone(null), 2000);
    if (type === "inquiry") onQuickInquiry?.(factory.id);
    if (type === "meeting") onQuickMeeting?.(factory.id);
    if (type === "ai") setLocation(`/ai-assistant?q=我想了解 ${factory.name} 的产品`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#141628]"
      style={{
        borderColor: isHovered ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.1)",
        boxShadow: isHovered ? "0 0 28px rgba(124,58,237,0.18)" : "none",
        transition: "border-color 0.25s, box-shadow 0.25s",
      }}
    >
      {/* ── 封面图 ── */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
        <motion.img
          src={factory.coverImage || factory.logo || "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop"}
          alt={factory.name}
          className="w-full h-full object-cover opacity-80"
          animate={isHovered ? { scale: 1.06 } : { scale: 1 }}
          transition={{ duration: 0.5 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141628] via-[#141628]/30 to-transparent" />

        {/* 导师背书金标 */}
        {factory.mentorEndorsement && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-500/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg shadow-amber-500/30">
            <span className="text-xs font-bold text-amber-950">⭐ 导师严选</span>
          </div>
        )}

        {/* 活跃买家数 */}
        {factory.activeGlobalBuyers && factory.activeGlobalBuyers > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
            <Users className="w-3 h-3 text-violet-400" />
            <span className="text-[11px] text-slate-300 font-medium">{factory.activeGlobalBuyers} 买家活跃</span>
          </div>
        )}

        {/* 平均发货时效 */}
        {factory.avgShipHours && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-emerald-600/80 backdrop-blur-sm px-2 py-1 rounded-full">
            <Zap className="w-3 h-3 text-emerald-200" />
            <span className="text-[11px] text-emerald-100 font-semibold">{factory.avgShipHours}h 发货</span>
          </div>
        )}

        {/* hover 快捷操作浮层 */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0 flex items-center justify-center gap-3"
              style={{ background: "rgba(8,8,20,0.55)", backdropFilter: "blur(2px)" }}
            >
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.93 }}
                onClick={e => { e.stopPropagation(); handleViewDetails(); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 12, padding: "10px 14px", cursor: "pointer",
                }}
              >
                <Eye size={18} color="#e2e8f0" />
                <span style={{ color: "#e2e8f0", fontSize: 10, fontWeight: 700 }}>查看详情</span>
              </motion.button>
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.93 }}
                onClick={e => handleQuickAction("inquiry", e)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  background: quickActionDone === "inquiry" ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.4)",
                  borderRadius: 12, padding: "10px 14px", cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {quickActionDone === "inquiry"
                  ? <span style={{ fontSize: 18 }}>✓</span>
                  : <Handshake size={18} color="#34d399" />
                }
                <span style={{ color: "#34d399", fontSize: 10, fontWeight: 700 }}>
                  {quickActionDone === "inquiry" ? "已发送" : "快速询盘"}
                </span>
              </motion.button>
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.93 }}
                onClick={e => handleQuickAction("ai", e)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.4)",
                  borderRadius: 12, padding: "10px 14px", cursor: "pointer",
                }}
              >
                <MessageSquare size={18} color="#a78bfa" />
                <span style={{ color: "#a78bfa", fontSize: 10, fontWeight: 700 }}>AI 咨询</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 内容区 ── */}
      <div className="p-4 space-y-3">

        {/* 工厂名称 + 位置 */}
        <div>
          <h3
            className="font-semibold text-sm leading-tight cursor-pointer line-clamp-1 transition-colors duration-200"
            style={{ color: isHovered ? "#c4b5fd" : "#f1f5f9" }}
            onClick={handleViewDetails}
          >
            {factory.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <MapPin className="w-3 h-3 text-violet-400/60 shrink-0" />
            <span>{[factory.city, factory.country].filter(Boolean).join(", ") || "Unknown"}</span>
            {factory.category && (
              <>
                <span className="mx-0.5">·</span>
                <span className="text-violet-400/70 font-medium">{factory.category}</span>
              </>
            )}
          </div>
        </div>

        {/* AMR 评分 */}
        <div className="flex items-center justify-between bg-slate-900/50 rounded-xl px-3 py-2 border border-white/5">
          <AMRScoreMini
            score={amrScore}
            acumen={amrAcumen}
            channel={amrChannel}
            velocity={amrVelocity}
            global={amrGlobal}
          />
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">AMR 指数</p>
            <p className="text-lg font-bold text-violet-300">{amrScore}</p>
          </div>
        </div>

        {/* 渠道能力标签 */}
        {channels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {channels.slice(0, 4).map((ch) => (
              <ChannelBadge key={ch} channelKey={ch} />
            ))}
          </div>
        )}

        {/* 买家体感词云 */}
        {vibeTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {vibeTags.slice(0, 3).map((tag) => (
              <VibeTag key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* 导师背书详情 */}
        {factory.mentorEndorsement && (
          <div className="flex items-start gap-2 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/80 leading-relaxed">{factory.mentorEndorsement}</p>
          </div>
        )}

        {/* 底部快捷操作（hover 展开） */}
        <AnimatePresence>
          {isHovered ? (
            <motion.div
              key="quick-actions"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ display: "flex", gap: 6, paddingTop: 4 }}>
                <QuickActionBtn
                  icon={<Handshake size={14} />}
                  label="询盘"
                  color="#10b981"
                  onClick={e => handleQuickAction("inquiry", e)}
                />
                <QuickActionBtn
                  icon={<Video size={14} />}
                  label="会议"
                  color="#7c3aed"
                  onClick={e => handleQuickAction("meeting", e)}
                />
                <QuickActionBtn
                  icon={<MessageSquare size={14} />}
                  label="AI 咨询"
                  color="#a78bfa"
                  onClick={e => handleQuickAction("ai", e)}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div key="cta-btn" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button
                className="w-full h-9 text-xs bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border border-violet-400/20 shadow-sm shadow-violet-500/20 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-300"
                onClick={handleViewDetails}
              >
                查看工厂详情
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
