import { useFactoryAIRecommendation } from "@/hooks/useFactoryAIRecommendation";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

interface FactoryAIRecommendationProps {
  factoryId: number;
  compact?: boolean; // 紧凑模式（用于卡片）
  buyerPreferences?: {
    preferredCategories?: string[];
    preferredCountries?: string[];
    minQualityScore?: number;
  };
}

/**
 * FactoryAIRecommendation 组件
 * 
 * 展示 OpenAI 生成的工厂推荐理由
 * - 主要推荐理由（一句话，高转化）
 * - 详细推荐理由（3-5 条，基于数据）
 * - 信任指标（3-4 条，强化信任）
 */
export function FactoryAIRecommendation({
  factoryId,
  compact = false,
  buyerPreferences,
}: FactoryAIRecommendationProps) {
  const { recommendation, isLoading, error, requestRecommendation, hasRequested } =
    useFactoryAIRecommendation(factoryId, buyerPreferences);

  // 紧凑模式：只显示主要推荐理由和请求按钮
  if (compact) {
    return (
      <div className="space-y-2">
        {!hasRequested && (
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
            onClick={requestRecommendation}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            查看 AI 推荐理由
          </Button>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>AI 正在分析中...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 py-2">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}

        {recommendation && !isLoading && (
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-2">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-300 font-medium">{recommendation.mainReason}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 完整模式：显示所有推荐信息
  return (
    <div className="space-y-4 bg-gradient-to-br from-violet-950/20 to-slate-950/20 border border-violet-500/20 rounded-lg p-4">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">AI 推荐分析</h3>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
          <p className="text-sm text-slate-400">AI 正在深度分析该工厂的数据...</p>
        </div>
      )}

      {/* 错误状态 */}
      {error && !isLoading && (
        <div className="flex items-start gap-3 py-4 bg-red-500/10 border border-red-500/20 rounded p-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-300 font-medium">生成推荐失败</p>
            <p className="text-xs text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* 推荐内容 */}
      {recommendation && !isLoading && (
        <div className="space-y-3">
          {/* 主要推荐理由 */}
          <div className="bg-violet-600/20 border-l-2 border-violet-500 pl-3 py-2">
            <p className="text-sm font-semibold text-violet-300">{recommendation.mainReason}</p>
          </div>

          {/* 详细推荐理由 */}
          {recommendation.detailedReasons.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">详细理由</p>
              <ul className="space-y-1.5">
                {recommendation.detailedReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 信任指标 */}
          {recommendation.trustIndicators.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-700/50">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">信任指标</p>
              <ul className="space-y-1.5">
                {recommendation.trustIndicators.map((indicator, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 初始状态：请求按钮 */}
      {!hasRequested && !isLoading && !recommendation && !error && (
        <Button
          onClick={requestRecommendation}
          className="w-full bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white text-sm"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          生成 AI 推荐分析
        </Button>
      )}
    </div>
  );
}
