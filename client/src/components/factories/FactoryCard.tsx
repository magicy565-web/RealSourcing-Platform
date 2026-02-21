import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, MapPin, Star, ArrowRight, Loader2, Zap } from "lucide-react";
import { FactoryTrustBadges } from "./FactoryTrustBadges";
import { FactoryMatchScore } from "./FactoryMatchScore";
import { FactoryQuickActions } from "./FactoryQuickActions";
import { FactoryAIRecommendation } from "./FactoryAIRecommendation";
import { useState } from "react";

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

interface FactoryCardProps {
  factory: Factory;
  onViewDetails: (factoryId: string) => void;
  onToggleFavorite: (factoryId: string) => void;
  isFavoritePending?: boolean;
  // 【新增】GTM 3.1 功能
  matchScore?: { score: number; reason: string; tags: string[] };
  onlineStatus?: { isOnline: boolean; availableForCall: boolean };
  onVideoCall?: () => void;
  onScheduleMeeting?: () => void;
  onRequestSample?: () => void;
  isFavorited?: boolean;
}

/**
 * FactoryCard 组件 (GTM 3.1 版本)
 * 
 * 职责：
 * - 展示单个工厂的卡片信息
 * - 处理用户交互（查看详情、收藏、视频连线、申请样品等）
 * - 应用黑紫霓虹风格 UI
 * - 【新增】展示 AI 匹配度
 * - 【新增】展示在线状态
 * - 【新增】提供快捷操作入口
 * 
 * 设计特点：
 * - 玻璃拟态背景（半透明 + 模糊）
 * - 紫色霓虹边框和光晕
 * - 悬停时卡片放大和边框发光
 * - 动态信任徽章和在线状态
 * - 高转化操作栏
 */
export function FactoryCard({
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
}: FactoryCardProps) {
  const [showQuickActions, setShowQuickActions] = useState(false);

  return (
    <Card
      className="card-hover overflow-hidden group border-border/60 transition-all duration-300 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
    >
      <CardContent className="p-0">
        {/* ── 图片区域 ────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 h-44">
          <img
            src={
              factory.logo ||
              "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop"
            }
            alt={factory.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* 【新增】在线状态指示器 */}
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

          {/* 评分徽章 */}
          {factory.overallScore && (
            <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1 border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {Number(factory.overallScore).toFixed(1)}
            </div>
          )}

          {/* 【新增】AI 匹配度快速预览 */}
          {matchScore && matchScore.score >= 75 && (
            <div className="absolute bottom-3 right-3 bg-violet-600/90 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-white text-xs font-semibold flex items-center gap-1 shadow-lg shadow-violet-600/30">
              <span className="text-lg">✨</span>
              {matchScore.score}% 匹配
            </div>
          )}
        </div>

        {/* ── 内容区域 ────────────────────────────────────────────────────── */}
        <div className="p-4 bg-gradient-to-b from-slate-900/50 to-slate-950/80 backdrop-blur-sm border-t border-violet-500/10 space-y-3">
          {/* 名称和位置 */}
          <div>
            <h3
              className="font-semibold text-foreground mb-1.5 group-hover:text-violet-400 transition-colors text-sm line-clamp-2 cursor-pointer"
              onClick={() => onViewDetails(factory.id)}
            >
              {factory.name}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-violet-400/60" />
              <span className="line-clamp-1">
                {[factory.city, factory.country].filter(Boolean).join(", ") || "Unknown"}
              </span>
              {factory.category && (
                <>
                  <span className="mx-1">·</span>
                  <span className="text-violet-400/80 font-medium">{factory.category}</span>
                </>
              )}
            </div>
          </div>

          {/* 【新增】信任徽章 */}
          <FactoryTrustBadges
            status={factory.status}
            overallScore={factory.overallScore}
            isFavorited={isFavorited}
            matchTags={matchScore?.tags}
            isOnline={onlineStatus?.isOnline}
          />

          {/* 【新增】AI 推荐理由（紧凑模式）*/}
          <FactoryAIRecommendation
            factoryId={parseInt(factory.id, 10)}
            compact={true}
          />

          {/* 【新增】快捷操作切换 */}
          {!showQuickActions ? (
            <div className="flex gap-2">
              <Button
                className="flex-1 h-8 text-xs shadow-sm shadow-violet-500/20 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border border-violet-400/20 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/30"
                size="sm"
                onClick={() => onViewDetails(factory.id)}
              >
                查看详情
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
              <Button
                className="flex-1 h-8 text-xs shadow-sm shadow-emerald-500/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/20 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/30"
                size="sm"
                onClick={() => setShowQuickActions(true)}
                disabled={!onlineStatus?.isOnline}
              >
                快速操作
                <Zap className="w-3 h-3 ml-1" />
              </Button>
            </div>
          ) : (
            <FactoryQuickActions
              factoryId={factory.id}
              factoryName={factory.name}
              isOnline={onlineStatus?.isOnline}
              isFavorited={isFavorited}
              onVideoCall={() => {
                onVideoCall?.();
                setShowQuickActions(false);
              }}
              onScheduleMeeting={() => {
                onScheduleMeeting?.();
                setShowQuickActions(false);
              }}
              onRequestSample={() => {
                onRequestSample?.();
                setShowQuickActions(false);
              }}
              onToggleFavorite={() => {
                onToggleFavorite(factory.id);
              }}
              isLoading={isFavoritePending}
            />
          )}

          {/* 【新增】返回按钮 */}
          {showQuickActions && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-slate-400 hover:text-slate-300"
              onClick={() => setShowQuickActions(false)}
            >
              ← 返回
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
