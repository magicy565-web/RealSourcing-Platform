import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Award, MapPin, Star, ArrowRight, Loader2, Zap, Play, TrendingUp } from "lucide-react";
import { FactoryTrustBadges } from "./FactoryTrustBadges";
import { FactoryMatchScore } from "./FactoryMatchScore";
import { FactoryQuickActions } from "./FactoryQuickActions";
import { useState } from "react";

interface FactoryCardV2Props {
  factory: any; // 增强后的工厂数据
  onViewDetails: (factoryId: string) => void;
  onToggleFavorite: (factoryId: string) => void;
  isFavoritePending?: boolean;
  onVideoCall?: () => void;
  onScheduleMeeting?: () => void;
  onRequestSample?: () => void;
  isFavorited?: boolean;
}

/**
 * FactoryCardV2 组件 (GTM 3.1 增强版)
 * 
 * 新增功能：
 * - 展示 AI 验厂评分（来自数据库）
 * - 展示信任徽章（AI 验厂、认证、无纠纷等）
 * - 展示运营指标（交易数、样品转化率等）
 * - 展示 Reel 视频预览
 * - 实时在线状态呼吸灯效果
 */
export function FactoryCardV2({
  factory,
  onViewDetails,
  onToggleFavorite,
  isFavoritePending = false,
  onVideoCall,
  onScheduleMeeting,
  onRequestSample,
  isFavorited = false,
}: FactoryCardV2Props) {
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // 从增强数据中提取 GTM 3.1 信息
  const matchScore = factory.matchScore;
  const onlineStatus = factory.onlineStatus;
  const aiScore = factory.aiVerificationScore || 0;
  const trustBadges = factory.trustBadges || [];
  const metrics = factory.operatingMetrics;
  const reels = factory.videoReels || [];

  return (
    <Card
      className="card-hover overflow-hidden group border-border/60 transition-all duration-300 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-0">
        {/* ── 图片区域 + 在线状态 ──────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 h-44">
          <img
            src={
              factory.logo ||
              "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop"
            }
            alt={factory.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* 在线状态呼吸灯 */}
          {onlineStatus?.isOnline && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-lg shadow-emerald-600/30 animate-pulse">
              <Zap className="w-3.5 h-3.5 text-emerald-200" />
              <span className="text-xs font-semibold text-emerald-100">在线</span>
            </div>
          )}

          {/* AI 验厂评分徽章 */}
          {aiScore > 0 && (
            <div className="absolute top-3 left-3 bg-violet-600/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1 shadow-lg shadow-violet-600/30">
              <TrendingUp className="w-3.5 h-3.5" />
              AI {aiScore}分
            </div>
          )}

          {/* Reel 视频指示器 */}
          {reels.length > 0 && (
            <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-full text-white text-xs font-semibold flex items-center gap-1 border border-violet-500/30 shadow-lg shadow-violet-500/10">
              <Play className="w-3 h-3 fill-current" />
              {reels.length} 视频
            </div>
          )}

          {/* 整体评分 */}
          {factory.overallScore && (
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1 border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {factory.overallScore.toFixed(1)}
            </div>
          )}
        </div>

        {/* ── 内容区域 ──────────────────────────────────────────────────────── */}
        <div className="p-4 space-y-3">
          {/* 工厂名称和位置 */}
          <div>
            <h3 className="font-semibold text-white text-sm truncate group-hover:text-violet-300 transition-colors">
              {factory.name}
            </h3>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
              <MapPin className="w-3 h-3" />
              <span>{factory.city || "未知"}, {factory.country || "未知"}</span>
            </div>
          </div>

          {/* AI 匹配度展示 */}
          {matchScore && (
            <FactoryMatchScore
              score={matchScore.score}
              reason={matchScore.reason}
              tags={matchScore.tags}
              compact
            />
          )}

          {/* 信任徽章 */}
          {trustBadges.length > 0 && (
            <FactoryTrustBadges badges={trustBadges} compact />
          )}

          {/* 运营指标预览 */}
          {metrics && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/50">
              <div className="text-center">
                <div className="text-xs text-slate-400">交易数</div>
                <div className="text-sm font-semibold text-violet-400">{metrics.totalOrders || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">转化率</div>
                <div className="text-sm font-semibold text-violet-400">
                  {metrics.sampleConversionRate?.toFixed(0) || 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400">视频浏览</div>
                <div className="text-sm font-semibold text-violet-400">{metrics.reelViewCount || 0}</div>
              </div>
            </div>
          )}

          {/* 快捷操作栏 */}
          <FactoryQuickActions
            isOnline={onlineStatus?.isOnline || false}
            onVideoCall={onVideoCall}
            onScheduleMeeting={onScheduleMeeting}
            onRequestSample={onRequestSample}
            compact
          />

          {/* 查看详情按钮 */}
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs border-violet-500/30 hover:border-violet-500/60 hover:bg-violet-500/10 text-violet-300 hover:text-violet-200"
            onClick={() => onViewDetails(factory.id)}
          >
            查看详情
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
