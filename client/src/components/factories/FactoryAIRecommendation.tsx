import { useFactoryAIRecommendation } from "@/hooks/useFactoryAIRecommendation";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, CheckCircle2, AlertCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

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
 * 展示 LLM 生成的工厂推荐理由，并收集用户反馈。
 * - 主要推荐理由（一句话，高转化）
 * - 详细推荐理由（3-5 条，基于数据）
 * - 信任指标（3-4 条，强化信任）
 * - 用户反馈按钮（👍/👎）
 */
export function FactoryAIRecommendation({
  factoryId,
  compact = false,
  buyerPreferences,
}: FactoryAIRecommendationProps) {
  const { recommendation, isLoading, error, requestRecommendation, hasRequested } =
    useFactoryAIRecommendation(factoryId, buyerPreferences);

  const [feedbackGiven, setFeedbackGiven] = useState<"helpful" | "not_helpful" | null>(null);

  const feedbackMutation = trpc.factories.submitAIRecommendationFeedback.useMutation({
    onSuccess: () => {
      toast.success("感谢您的反馈！这将帮助我们改进 AI 推荐。");
    },
    onError: () => {
      toast.error("反馈提交失败，请稍后重试。");
      setFeedbackGiven(null);
    },
  });

  const handleFeedback = (isHelpful: boolean) => {
    if (feedbackGiven) return;
    setFeedbackGiven(isHelpful ? "helpful" : "not_helpful");
    feedbackMutation.mutate({
      factoryId,
      isHelpful,
      recommendationMainReason: recommendation?.mainReason,
    });
  };

  // ── 紧凑模式（工厂卡片中使用）─────────────────────────────────────────────
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
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-2 space-y-2">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-violet-300 font-medium flex-1">{recommendation.mainReason}</p>
            </div>
            {/* 紧凑模式反馈按钮 */}
            {!feedbackGiven ? (
              <div className="flex items-center gap-1 pt-1">
                <span className="text-xs text-slate-500 mr-1">有帮助吗？</span>
                <button
                  onClick={() => handleFeedback(true)}
                  className="p-1 rounded hover:bg-violet-500/20 text-slate-400 hover:text-violet-400 transition-colors"
                  title="有帮助"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="没帮助"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 pt-1">
                {feedbackGiven === "helpful" ? "👍 感谢反馈！" : "👎 已记录，我们会改进"}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── 完整模式（工厂详情页使用）────────────────────────────────────────────────
  return (
    <div className="space-y-4 bg-gradient-to-br from-violet-950/20 to-slate-950/20 border border-violet-500/20 rounded-lg p-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">AI 推荐分析</h3>
          {recommendation?.generatedByAI === false && (
            <span className="text-xs text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded">规则生成</span>
          )}
          {recommendation?.generatedByAI === true && (
            <span className="text-xs text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">AI 生成</span>
          )}
        </div>
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

          {/* 用户反馈区域 */}
          <div className="pt-2 border-t border-slate-700/50 flex items-center gap-3">
            <span className="text-xs text-slate-400">这个推荐对您有帮助吗？</span>
            {!feedbackGiven ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFeedback(true)}
                  disabled={feedbackMutation.isPending}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-all"
                >
                  <ThumbsUp className="w-3 h-3" />
                  有帮助
                </button>
                <button
                  onClick={() => handleFeedback(false)}
                  disabled={feedbackMutation.isPending}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all"
                >
                  <ThumbsDown className="w-3 h-3" />
                  没帮助
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                {feedbackGiven === "helpful" ? "👍 感谢您的反馈！" : "👎 已记录，我们会持续改进"}
              </span>
            )}
          </div>
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
