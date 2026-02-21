import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, MapPin, Star, Heart, ArrowRight, Loader2 } from "lucide-react";

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
}

/**
 * FactoryCard 组件
 * 
 * 职责：
 * - 展示单个工厂的卡片信息
 * - 处理用户交互（查看详情、收藏）
 * - 应用黑紫霓虹风格 UI
 * 
 * 设计特点：
 * - 玻璃拟态背景（半透明 + 模糊）
 * - 紫色霓虹边框和光晕
 * - 悬停时卡片放大和边框发光
 * - 认证和评分徽章
 */
export function FactoryCard({
  factory,
  onViewDetails,
  onToggleFavorite,
  isFavoritePending = false,
}: FactoryCardProps) {
  return (
    <Card
      className="card-hover overflow-hidden cursor-pointer group border-border/60 transition-all duration-300 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)]"
      onClick={() => onViewDetails(factory.id)}
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

          {/* 认证徽章 */}
          {factory.status === "active" && (
            <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1 shadow-lg shadow-emerald-600/20">
              <Award className="w-3 h-3" />
              认证工厂
            </div>
          )}

          {/* 评分徽章 */}
          {factory.overallScore && (
            <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1 border border-amber-500/30 shadow-lg shadow-amber-500/10">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              {Number(factory.overallScore).toFixed(1)}
            </div>
          )}
        </div>

        {/* ── 内容区域 ────────────────────────────────────────────────────── */}
        <div className="p-4 bg-gradient-to-b from-slate-900/50 to-slate-950/80 backdrop-blur-sm border-t border-violet-500/10">
          {/* 名称和位置 */}
          <div className="mb-3">
            <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-violet-400 transition-colors text-sm line-clamp-2">
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

          {/* 操作按钮 */}
          <div className="flex gap-2 mt-4">
            <Button
              className="flex-1 h-8 text-xs shadow-sm shadow-violet-500/20 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border border-violet-400/20 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/30"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(factory.id);
              }}
            >
              查看详情
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-violet-500/30 hover:border-red-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(factory.id);
              }}
              disabled={isFavoritePending}
            >
              {isFavoritePending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Heart className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
