import React, { useState } from "react";
import { Phone, Gift, Heart, Share2, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/**
 * Reel 交互层数据接口
 */
export interface ReelOverlayData {
  factoryName: string;
  factoryId: string;
  isOnline: boolean;
  matchScore: number; // 0-100
  trustBadges: Array<{
    label: string;
    color: "red" | "green" | "blue" | "purple" | "amber";
  }>;
  isFavorited?: boolean;
}

interface ReelOverlayProps {
  data: ReelOverlayData;
  onCallClick?: () => void;
  onSampleClick?: () => void;
  onFavoriteToggle?: (isFavorited: boolean) => void;
  onShareClick?: () => void;
  onViewDetails?: () => void;
}

/**
 * ReelOverlay 组件
 * 
 * 功能：
 * - 显示工厂信息和信任标签
 * - 一键连线按钮（在线时突出显示）
 * - 申请样品快捷入口
 * - 收藏和分享功能
 * - 黑紫色霓虹交互效果
 */
export function ReelOverlay({
  data,
  onCallClick,
  onSampleClick,
  onFavoriteToggle,
  onShareClick,
  onViewDetails,
}: ReelOverlayProps) {
  const [isFavorited, setIsFavorited] = useState(data.isFavorited || false);
  const [showSampleMenu, setShowSampleMenu] = useState(false);

  const handleFavoriteToggle = () => {
    const newState = !isFavorited;
    setIsFavorited(newState);
    onFavoriteToggle?.(newState);
  };

  // ── 信任徽章颜色映射 ──────────────────────────────────────────────────────
  const badgeColorMap = {
    red: "bg-red-500/20 text-red-300 border-red-500/50",
    green: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
    blue: "bg-blue-500/20 text-blue-300 border-blue-500/50",
    purple: "bg-purple-500/20 text-purple-300 border-purple-500/50",
    amber: "bg-amber-500/20 text-amber-300 border-amber-500/50",
  };

  return (
    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none">
      {/* 顶部：工厂信息 + 在线状态 */}
      <div className="pointer-events-auto space-y-3">
        {/* 工厂名称 + 在线指示器 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">{data.factoryName}</h3>
            <div className="flex items-center gap-2">
              {/* 在线状态 */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    data.isOnline ? "bg-emerald-400" : "bg-gray-500"
                  }`}
                />
                <span className="text-xs font-medium text-white/70">
                  {data.isOnline ? "在线可连线" : "离线"}
                </span>
              </div>

              {/* AI 匹配度 */}
              <div className="flex items-center gap-1.5 ml-2">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {Math.round(data.matchScore / 10)}
                  </span>
                </div>
                <span className="text-xs font-medium text-white/70">AI 匹配</span>
              </div>
            </div>
          </div>

          {/* 分享按钮 */}
          <button
            onClick={onShareClick}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            title="分享"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        {/* 信任徽章组 */}
        <div className="flex flex-wrap gap-2">
          {data.trustBadges.map((badge, idx) => (
            <div
              key={idx}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border backdrop-blur-sm transition-all hover:scale-105 ${
                badgeColorMap[badge.color]
              }`}
            >
              ✓ {badge.label}
            </div>
          ))}
        </div>
      </div>

      {/* 底部：操作按钮 */}
      <div className="pointer-events-auto space-y-2">
        {/* 一键连线（优先级最高） */}
        {data.isOnline && (
          <button
            onClick={onCallClick}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-purple-500/50 active:scale-95"
          >
            <Phone className="w-5 h-5" />
            立即连线
          </button>
        )}

        {/* 申请样品 + 收藏 + 查看详情 */}
        <div className="grid grid-cols-3 gap-2">
          {/* 申请样品 */}
          <button
            onClick={onSampleClick}
            className="py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-all hover:shadow-lg hover:shadow-purple-500/20"
            title="申请样品"
          >
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">样品</span>
          </button>

          {/* 收藏 */}
          <button
            onClick={handleFavoriteToggle}
            className={`py-2.5 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
              isFavorited
                ? "bg-purple-500/20 border-purple-500/50 text-purple-300 hover:bg-purple-500/30"
                : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20 hover:border-white/40"
            }`}
            title={isFavorited ? "已收藏" : "收藏"}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
            <span className="hidden sm:inline">{isFavorited ? "已收" : "收藏"}</span>
          </button>

          {/* 查看详情 */}
          <button
            onClick={onViewDetails}
            className="py-2.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white text-sm font-medium flex items-center justify-center gap-1.5 transition-all hover:shadow-lg hover:shadow-purple-500/20"
            title="查看详情"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="hidden sm:inline">详情</span>
          </button>
        </div>

        {/* 离线提示 */}
        {!data.isOnline && (
          <div className="py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-center">
            该工厂暂时离线，您可以申请样品或预约会议
          </div>
        )}
      </div>

      {/* 右侧竖向操作栏（仅在大屏幕显示） */}
      <div className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-3 pointer-events-auto">
        {/* 匹配度详情 */}
        <button
          className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 flex items-center justify-center text-white transition-all hover:shadow-lg hover:shadow-purple-500/50 hover:scale-110"
          title="查看匹配度详情"
        >
          <span className="text-sm font-bold">{Math.round(data.matchScore / 10)}</span>
        </button>

        {/* 评价 */}
        <button
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
          title="查看评价"
        >
          <span className="text-lg">★</span>
        </button>

        {/* 分享 */}
        <button
          onClick={onShareClick}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
          title="分享"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default ReelOverlay;
