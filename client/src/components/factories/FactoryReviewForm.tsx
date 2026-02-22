/**
 * FactoryReviewForm — 买家多维度评价表单
 *
 * 支持五个维度的星级评分：
 *   - 总体满意度
 *   - 沟通效率
 *   - 产品质量
 *   - 交付周期
 *   - 服务态度
 *
 * 评价提交后自动触发后台人工评分重新计算
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";

// ── 维度配置 ──────────────────────────────────────────────────────────────────
const RATING_DIMENSIONS = [
  {
    key: "ratingOverall" as const,
    label: "总体满意度",
    desc: "综合评价这次合作体验",
    color: "text-amber-400",
    fill: "fill-amber-400",
  },
  {
    key: "ratingCommunication" as const,
    label: "沟通效率",
    desc: "响应速度、沟通清晰度",
    color: "text-violet-400",
    fill: "fill-violet-400",
  },
  {
    key: "ratingQuality" as const,
    label: "产品质量",
    desc: "产品是否符合预期规格",
    color: "text-emerald-400",
    fill: "fill-emerald-400",
  },
  {
    key: "ratingLeadTime" as const,
    label: "交付周期",
    desc: "是否按时交货",
    color: "text-blue-400",
    fill: "fill-blue-400",
  },
  {
    key: "ratingService" as const,
    label: "服务态度",
    desc: "售前售后服务质量",
    color: "text-pink-400",
    fill: "fill-pink-400",
  },
] as const;

type RatingKey = typeof RATING_DIMENSIONS[number]["key"];

// ── 星级评分组件 ──────────────────────────────────────────────────────────────
function StarRating({
  value,
  onChange,
  color,
  fill,
}: {
  value: number;
  onChange: (v: number) => void;
  color: string;
  fill: string;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            className={cn(
              "w-6 h-6 transition-colors",
              star <= display ? `${color} ${fill}` : "text-slate-600"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ── 评分标签 ──────────────────────────────────────────────────────────────────
const RATING_LABELS: Record<number, string> = {
  1: "很差",
  2: "较差",
  3: "一般",
  4: "满意",
  5: "非常满意",
};

// ── 主组件 ────────────────────────────────────────────────────────────────────
interface FactoryReviewFormProps {
  factoryId: number;
  factoryName: string;
  orderId?: number;
  isVerifiedPurchase?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function FactoryReviewForm({
  factoryId,
  factoryName,
  orderId,
  isVerifiedPurchase = false,
  onSuccess,
  onCancel,
}: FactoryReviewFormProps) {
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    ratingOverall:       0,
    ratingCommunication: 0,
    ratingQuality:       0,
    ratingLeadTime:      0,
    ratingService:       0,
  });
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const addReview = trpc.humanScores.addReview.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("评价提交成功！感谢您的反馈，这将帮助其他买家做出更好的决策。");
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(`提交失败：${err.message}`);
    },
  });

  const allRated = Object.values(ratings).every(v => v > 0);

  const handleSubmit = () => {
    if (!allRated) {
      toast.error("请为所有维度打分");
      return;
    }
    addReview.mutate({
      factoryId,
      orderId,
      ...ratings,
      comment: comment.trim() || undefined,
      isVerifiedPurchase,
    });
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">评价已提交！</h3>
          <p className="text-sm text-slate-400 mt-1">
            您的评价将帮助平台更准确地评估 <span className="text-white">{factoryName}</span> 的 FTGI 人工评分。
          </p>
        </div>
        {isVerifiedPurchase && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300">已验证购买 · 此评价权重更高</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div>
        <h3 className="text-base font-bold text-white">评价 {factoryName}</h3>
        <p className="text-xs text-slate-400 mt-1">
          您的评价将贡献到工厂的 FTGI 人工评分（占总分 40%）
        </p>
        {isVerifiedPurchase && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>已验证购买 · 此评价权重是普通评价的 2 倍</span>
          </div>
        )}
      </div>

      {/* 五维评分 */}
      <div className="space-y-4">
        {RATING_DIMENSIONS.map(dim => (
          <div key={dim.key} className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">{dim.label}</div>
              <div className="text-[11px] text-slate-500">{dim.desc}</div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StarRating
                value={ratings[dim.key]}
                onChange={v => setRatings(prev => ({ ...prev, [dim.key]: v }))}
                color={dim.color}
                fill={dim.fill}
              />
              {ratings[dim.key] > 0 && (
                <span className={cn("text-xs font-medium w-14 text-right", dim.color)}>
                  {RATING_LABELS[ratings[dim.key]]}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 文字评论 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span>详细评论</span>
          <span className="text-slate-500 font-normal text-xs">（选填）</span>
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="分享您的合作体验，帮助其他买家做出更好的决策..."
          maxLength={1000}
          rows={4}
          className={cn(
            "w-full bg-[#141628] border border-white/10 rounded-xl px-4 py-3",
            "text-sm text-white placeholder:text-slate-600",
            "focus:outline-none focus:border-violet-500/50 resize-none",
            "transition-colors"
          )}
        />
        <div className="text-right text-[10px] text-slate-600">{comment.length}/1000</div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 border-white/10 text-slate-400 hover:text-white"
          >
            取消
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!allRated || addReview.isPending}
          className={cn(
            "flex-1 bg-violet-600 hover:bg-violet-500 text-white font-semibold",
            "disabled:opacity-40 disabled:cursor-not-allowed"
          )}
        >
          {addReview.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" />提交中...</>
          ) : (
            "提交评价"
          )}
        </Button>
      </div>
    </div>
  );
}
