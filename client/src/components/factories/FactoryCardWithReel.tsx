import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Award, MapPin, Star, ArrowRight, Loader2, Zap, Play } from "lucide-react";
import { FactoryTrustBadges } from "./FactoryTrustBadges";
import { FactoryMatchScore } from "./FactoryMatchScore";
import { FactoryQuickActions } from "./FactoryQuickActions";
import { FactoryReelPlayer, FactoryReel } from "./FactoryReelPlayer";
import { ReelOverlay, ReelOverlayData } from "./ReelOverlay";
import { ReelTimeline, Keyframe } from "./ReelTimeline";

interface Factory {
  id: string;
  name: string;
  city?: string;
  country?: string;
  category?: string;
  logo?: string;
  status?: string;
  overallScore?: number;
}

interface FactoryCardWithReelProps {
  factory: Factory;
  onViewDetails: (factoryId: string) => void;
  onToggleFavorite: (factoryId: string) => void;
  isFavoritePending?: boolean;
  // GTM 3.1 功能
  matchScore?: { score: number; reason: string; tags: string[] };
  onlineStatus?: { isOnline: boolean; availableForCall: boolean };
  onVideoCall?: () => void;
  onScheduleMeeting?: () => void;
  onRequestSample?: () => void;
  isFavorited?: boolean;
  // Factory Reel 功能
  reel?: FactoryReel;
  reelKeyframes?: Keyframe[];
  trustBadges?: Array<{ label: string; color: "red" | "green" | "blue" | "purple" | "amber" }>;
}

/**
 * FactoryCardWithReel 组件
 * 
 * 升级版 FactoryCard，集成了 Factory Reel 沉浸式展厅功能
 * 
 * 特性：
 * - 卡片内静音视频预览
 * - 点击卡片进入全屏沉浸模式
 * - 平滑的过渡动画
 * - 黑紫色霓虹交互效果
 * - GTM 3.1 核心功能（AI 匹配、在线状态、快捷操作）
 */
export function FactoryCardWithReel({
  factory,
  onViewDetails,
  onToggleFavorite,
  isFavoritePending = false,
  matchScore,
  onlineStatus,
  onVideoCall,
  onScheduleMeeting,
  onRequestSample,
  isFavorited = false,
  reel,
  reelKeyframes = [],
  trustBadges = [],
}: FactoryCardWithReelProps) {
  const [isFullscreenReel, setIsFullscreenReel] = useState(false);
  const [reelCurrentTime, setReelCurrentTime] = useState(0);

  // ── 如果没有 Reel，降级到普通卡片 ────────────────────────────────────────
  if (!reel) {
    return (
      <Card className="card-hover overflow-hidden group border-border/60 transition-all duration-300 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]">
        <CardContent className="p-0">
          {/* 普通卡片内容 */}
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 h-44">
            <img
              src={
                factory.logo ||
                "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop"
              }
              alt={factory.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          {/* ... 其他卡片内容 ... */}
        </CardContent>
      </Card>
    );
  }

  // ── Reel Overlay 数据 ────────────────────────────────────────────────────
  const reelOverlayData: ReelOverlayData = {
    factoryName: factory.name,
    factoryId: factory.id,
    isOnline: onlineStatus?.isOnline || false,
    matchScore: matchScore?.score || 0,
    trustBadges: trustBadges,
    isFavorited: isFavorited,
  };

  // ── 全屏 Reel 模式 ────────────────────────────────────────────────────────
  if (isFullscreenReel) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* 关闭按钮 */}
        <button
          onClick={() => setIsFullscreenReel(false)}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          ✕
        </button>

        {/* 全屏播放器 */}
        <div className="flex-1 flex items-center justify-center">
          <FactoryReelPlayer
            reel={reel}
            autoPlay={true}
            muted={false}
            className="w-full h-full"
          />
        </div>

        {/* 底部信息栏 */}
        <div className="bg-gradient-to-t from-black via-black/80 to-transparent p-6 space-y-4">
          {/* Reel Overlay 交互层 */}
          <ReelOverlay
            data={reelOverlayData}
            onCallClick={onVideoCall}
            onSampleClick={onRequestSample}
            onFavoriteToggle={onToggleFavorite}
            onViewDetails={() => {
              setIsFullscreenReel(false);
              onViewDetails(factory.id);
            }}
          />

          {/* Timeline */}
          {reelKeyframes.length > 0 && (
            <ReelTimeline
              duration={reel.duration}
              currentTime={reelCurrentTime}
              keyframes={reelKeyframes}
              onSeek={(time) => setReelCurrentTime(time)}
            />
          )}
        </div>
      </div>
    );
  }

  // ── 卡片模式（带 Reel 预览） ────────────────────────────────────────────
  return (
    <Card className="card-hover overflow-hidden group border-border/60 transition-all duration-300 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] cursor-pointer">
      <CardContent className="p-0">
        {/* ── 视频预览区域 ────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden bg-black h-44 group"
          onClick={() => setIsFullscreenReel(true)}
        >
          {/* 静音视频预览 */}
          <FactoryReelPlayer
            reel={reel}
            autoPlay={true}
            muted={true}
            isCompact={true}
            className="w-full h-full"
          />

          {/* 播放按钮覆盖层 */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-all duration-300">
            <div className="w-12 h-12 rounded-full bg-purple-500/80 backdrop-blur-sm border border-purple-400/50 flex items-center justify-center group-hover:bg-purple-500/100 group-hover:scale-110 transition-all">
              <Play className="w-6 h-6 text-white fill-white ml-0.5" />
            </div>
          </div>

          {/* 在线状态指示器 */}
          {onlineStatus?.isOnline && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-lg shadow-emerald-600/30 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-emerald-200" />
              <span className="text-xs font-semibold text-emerald-100">在线</span>
            </div>
          )}

          {/* 认证徽章 */}
          {factory.status === "active" && (
            <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1 shadow-lg shadow-emerald-600/20">
              <Award className="w-3 h-3" />
              认证工厂
            </div>
          )}
        </div>

        {/* ── 信息区域 ────────────────────────────────────────────────────── */}
        <div className="p-4 space-y-3">
          {/* 工厂名称 + 位置 */}
          <div>
            <h3 className="font-semibold text-white text-base group-hover:text-purple-300 transition-colors">
              {factory.name}
            </h3>
            {(factory.city || factory.country) && (
              <div className="flex items-center gap-1 text-xs text-white/60 mt-1">
                <MapPin className="w-3 h-3" />
                <span>
                  {factory.city}
                  {factory.city && factory.country ? ", " : ""}
                  {factory.country}
                </span>
              </div>
            )}
          </div>

          {/* AI 匹配度 */}
          {matchScore && (
            <FactoryMatchScore
              score={matchScore.score}
              reason={matchScore.reason}
              tags={matchScore.tags}
            />
          )}

          {/* 信任徽章 */}
          {trustBadges.length > 0 && (
            <FactoryTrustBadges badges={trustBadges} />
          )}

          {/* 快捷操作栏 */}
          <FactoryQuickActions
            isOnline={onlineStatus?.isOnline || false}
            onVideoCall={onVideoCall}
            onRequestSample={onRequestSample}
            onToggleFavorite={() => onToggleFavorite(factory.id)}
            isFavorited={isFavorited}
            isFavoritePending={isFavoritePending}
            onViewDetails={() => onViewDetails(factory.id)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default FactoryCardWithReel;

