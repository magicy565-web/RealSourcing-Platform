/**
 * HumanScorePanel — 工厂人工评分可视化面板
 *
 * 展示三个子模块的得分及合并后的 FTGI 贡献值：
 *   - 买家交易评分   (50% 权重)
 *   - Webinar 社区投票 (30% 权重)
 *   - 专家评审团打分 (20% 权重)
 *
 * 同时展示与 AI 评分（60%）合并后的最终 FTGI 总分
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users, Star, BarChart2, Award, ChevronRight,
  TrendingUp, Shield, MessageSquare, Loader2,
  CheckCircle2, Info,
} from "lucide-react";
import FactoryReviewForm from "./FactoryReviewForm";

// ── 工具函数 ──────────────────────────────────────────────────────────────────
function formatScore(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  return Math.round(parseFloat(String(val)) * 10) / 10;
}

// ── 分数圆环 ──────────────────────────────────────────────────────────────────
function ScoreRing({
  score,
  maxScore,
  size = 80,
  strokeWidth = 6,
  color = "#8b5cf6",
  label,
}: {
  score: number;
  maxScore: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(score / maxScore, 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#1e2035" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white leading-none">{score.toFixed(1)}</span>
        {label && <span className="text-[9px] text-slate-500 mt-0.5">{label}</span>}
      </div>
    </div>
  );
}

// ── 子模块卡片 ────────────────────────────────────────────────────────────────
function ModuleCard({
  icon: Icon,
  title,
  score,
  weight,
  count,
  countLabel,
  color,
  bgColor,
  borderColor,
  breakdown,
}: {
  icon: React.ElementType;
  title: string;
  score: number;
  weight: string;
  count: number;
  countLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  breakdown?: Record<string, number>;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={cn("rounded-xl border p-4 space-y-3 transition-all", bgColor, borderColor)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", bgColor)}>
            <Icon className={cn("w-3.5 h-3.5", color)} />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">{title}</div>
            <div className="text-[10px] text-slate-500">权重 {weight}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-lg font-bold", color)}>{score.toFixed(1)}</div>
          <div className="text-[10px] text-slate-500">{count} {countLabel}</div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color.replace("text-", "bg-"))}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* 展开细节 */}
      {breakdown && Object.keys(breakdown).length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300"
        >
          <ChevronRight className={cn("w-3 h-3 transition-transform", expanded && "rotate-90")} />
          {expanded ? "收起" : "查看细节"}
        </button>
      )}

      {expanded && breakdown && (
        <div className="space-y-1.5 pt-1">
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="flex items-center justify-between text-[10px]">
              <span className="text-slate-500">{key}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", color.replace("text-", "bg-"))}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="text-slate-400 w-8 text-right">{val.toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
interface HumanScorePanelProps {
  factoryId: number;
  factoryName: string;
  aiScore?: number;      // AI 评分（满分 60）
  compact?: boolean;     // 紧凑模式（用于列表卡片）
}

export default function HumanScorePanel({
  factoryId,
  factoryName,
  aiScore,
  compact = false,
}: HumanScorePanelProps) {
  const { user } = useAuth();
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: humanScore, isLoading, refetch } = trpc.humanScores.getScore.useQuery(
    { factoryId },
    { staleTime: 30_000 }
  );

  const { data: reviews } = trpc.humanScores.getReviews.useQuery(
    { factoryId },
    { enabled: !compact }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
      </div>
    );
  }

  const hs = formatScore(humanScore?.humanScore);
  const ftgiContrib = formatScore(humanScore?.ftgiContribution);
  const reviewScore = formatScore(humanScore?.scoreFromReviews);
  const webinarScore = formatScore(humanScore?.scoreFromWebinars);
  const expertScore = formatScore(humanScore?.scoreFromExperts);
  const reviewCount = humanScore?.reviewCount ?? 0;
  const voteCount = humanScore?.webinarVoteCount ?? 0;
  const expertCount = humanScore?.expertReviewCount ?? 0;

  // 最终 FTGI 总分 = AI贡献 + 人工贡献
  const totalFtgi = (aiScore ?? 0) + ftgiContrib;

  // 紧凑模式：仅显示核心数字
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-slate-400">人工</span>
          <span className="text-sm font-bold text-blue-400">{ftgiContrib.toFixed(1)}</span>
          <span className="text-[10px] text-slate-600">/40</span>
        </div>
        {aiScore !== undefined && (
          <>
            <span className="text-slate-700">+</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-slate-400">AI</span>
              <span className="text-sm font-bold text-violet-400">{aiScore.toFixed(1)}</span>
              <span className="text-[10px] text-slate-600">/60</span>
            </div>
            <span className="text-slate-700">=</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white">{totalFtgi.toFixed(1)}</span>
              <span className="text-[10px] text-slate-600">/100</span>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-bold text-white">人工评分</span>
          <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-500/30">
            占 FTGI 40%
          </Badge>
        </div>
        {user && (
          <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-white/10 text-slate-400 hover:text-white"
              >
                <Star className="w-3 h-3 mr-1" />
                写评价
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0d0e1f] border-white/10 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">提交工厂评价</DialogTitle>
              </DialogHeader>
              <FactoryReviewForm
                factoryId={factoryId}
                factoryName={factoryName}
                onSuccess={() => { setReviewOpen(false); refetch(); }}
                onCancel={() => setReviewOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* 总分展示 */}
      <div className="bg-gradient-to-br from-blue-500/5 to-violet-500/5 border border-white/5 rounded-2xl p-5">
        <div className="flex items-center gap-6">
          <ScoreRing
            score={ftgiContrib}
            maxScore={40}
            size={88}
            color="#3b82f6"
            label="/ 40"
          />
          <div className="flex-1 space-y-2">
            <div>
              <div className="text-2xl font-bold text-white">
                {ftgiContrib.toFixed(1)}
                <span className="text-sm text-slate-500 font-normal ml-1">/ 40 分</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                人工评分原始分 {hs.toFixed(1)} × 系数 0.4
              </div>
            </div>

            {/* 与 AI 分合并 */}
            {aiScore !== undefined && (
              <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs text-slate-400">FTGI 总分</span>
                <span className="text-sm font-bold text-white ml-auto">
                  {totalFtgi.toFixed(1)}
                  <span className="text-[10px] text-slate-500 font-normal"> / 100</span>
                </span>
              </div>
            )}

            {/* 样本数量 */}
            <div className="flex gap-3 text-[10px] text-slate-500">
              <span>{reviewCount} 条评价</span>
              <span>·</span>
              <span>{voteCount} 票投票</span>
              <span>·</span>
              <span>{expertCount} 位专家</span>
            </div>
          </div>
        </div>
      </div>

      {/* 三个子模块 */}
      <div className="space-y-3">
        <ModuleCard
          icon={Star}
          title="买家交易评分"
          score={reviewScore}
          weight="50%"
          count={reviewCount}
          countLabel="条评价"
          color="text-amber-400"
          bgColor="bg-amber-500/5"
          borderColor="border-amber-500/10"
          breakdown={
            reviews && reviews.length > 0
              ? {
                  "沟通效率": reviews.reduce((s, r) => s + r.ratingCommunication, 0) / reviews.length / 5 * 100,
                  "产品质量": reviews.reduce((s, r) => s + r.ratingQuality, 0) / reviews.length / 5 * 100,
                  "交付周期": reviews.reduce((s, r) => s + r.ratingLeadTime, 0) / reviews.length / 5 * 100,
                  "服务态度": reviews.reduce((s, r) => s + r.ratingService, 0) / reviews.length / 5 * 100,
                }
              : undefined
          }
        />

        <ModuleCard
          icon={BarChart2}
          title="社区 Webinar 投票"
          score={webinarScore}
          weight="30%"
          count={voteCount}
          countLabel="票"
          color="text-violet-400"
          bgColor="bg-violet-500/5"
          borderColor="border-violet-500/10"
        />

        <ModuleCard
          icon={Award}
          title="专家评审团"
          score={expertScore}
          weight="20%"
          count={expertCount}
          countLabel="位专家"
          color="text-emerald-400"
          bgColor="bg-emerald-500/5"
          borderColor="border-emerald-500/10"
        />
      </div>

      {/* 说明 */}
      <div className="flex items-start gap-2 bg-white/2 border border-white/5 rounded-xl p-3">
        <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          人工评分由买家交易评价（50%）、Webinar 社区投票（30%）和专家评审（20%）加权计算，
          乘以系数 0.4 后贡献至 FTGI 总分（最高 40 分）。评价数量越多，分数越可信。
        </p>
      </div>

      {/* 最近评价列表 */}
      {reviews && reviews.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400">最近买家评价</div>
          {reviews.slice(0, 3).map(review => (
            <div key={review.id} className="bg-[#141628] border border-white/5 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      className={cn(
                        "w-3 h-3",
                        s <= review.ratingOverall
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-700"
                      )}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {review.isVerifiedPurchase === 1 && (
                    <div className="flex items-center gap-1 text-[9px] text-emerald-400">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>已验证购买</span>
                    </div>
                  )}
                  <span className="text-[10px] text-slate-600">
                    {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>
              {review.comment && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {review.comment}
                </p>
              )}
              <div className="flex gap-3 text-[10px] text-slate-600">
                <span>沟通 {review.ratingCommunication}★</span>
                <span>质量 {review.ratingQuality}★</span>
                <span>交期 {review.ratingLeadTime}★</span>
                <span>服务 {review.ratingService}★</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
