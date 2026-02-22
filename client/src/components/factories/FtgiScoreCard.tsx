/**
 * FtgiScoreCard — 工厂详情页侧边栏 FTGI 合并评分卡片
 *
 * 展示内容：
 *   - FTGI 总分（AI 60% + 人工 40%）大数字
 *   - 五维雷达图（AI 维度）
 *   - AI 贡献 / 人工贡献 双进度条
 *   - 认证等级徽章
 */

import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";
import { Shield, Zap, TrendingUp, Globe, Users, Sparkles, Award } from "lucide-react";

// ── 认证等级配置 ──────────────────────────────────────────────────────────────
function getCertLevel(total: number) {
  if (total >= 85) return { label: "铂金认证", color: "text-cyan-300",   bg: "bg-cyan-500/10 border-cyan-500/30",   icon: "🏆" };
  if (total >= 70) return { label: "金牌认证", color: "text-amber-300",  bg: "bg-amber-500/10 border-amber-500/30",  icon: "🥇" };
  if (total >= 55) return { label: "银牌认证", color: "text-slate-300",  bg: "bg-slate-500/10 border-slate-500/30",  icon: "🥈" };
  if (total >= 40) return { label: "铜牌认证", color: "text-orange-300", bg: "bg-orange-500/10 border-orange-500/30", icon: "🥉" };
  return { label: "认证中",   color: "text-slate-400",  bg: "bg-slate-800 border-slate-700",          icon: "⏳" };
}

// ── 五维雷达图（紧凑版） ──────────────────────────────────────────────────────
function MiniRadar({ d1, d2, d3, d4, d5 }: {
  d1: number; d2: number; d3: number; d4: number; d5: number;
}) {
  const data = [
    { dim: "信任", v: d1 },
    { dim: "履约", v: d2 },
    { dim: "市场", v: d3 },
    { dim: "生态", v: d4 },
    { dim: "社区", v: d5 },
  ];
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
        <PolarGrid stroke="#1e1b4b" />
        <PolarAngleAxis dataKey="dim" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="v" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} strokeWidth={2}
          dot={{ fill: "#a78bfa", r: 3 }} />
        <Tooltip
          contentStyle={{ background: "#1e1b4b", border: "1px solid #312e81", borderRadius: 6, fontSize: 12 }}
          formatter={(v: number) => [`${v.toFixed(1)}`, "分"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────
export default function FtgiScoreCard({ factoryId }: { factoryId: number }) {
  const { data: aiScore } = trpc.ftgi.getScore.useQuery({ factoryId }, {
    refetchInterval: 30000,
  });
  const { data: humanScore } = trpc.humanScores.getHumanScore.useQuery({ factoryId }, {
    refetchInterval: 30000,
  });

  const hasAiScore   = aiScore?.status === "done";
  const aiPts        = hasAiScore ? Number(aiScore.ftgiScore)  : 0;
  const humanPts     = humanScore ? Number(humanScore.ftgiContribution) : 0;
  const totalFtgi    = Math.min(100, aiPts + humanPts);
  const certLevel    = getCertLevel(totalFtgi);

  // 无任何数据时不渲染
  if (!hasAiScore && !humanScore) return null;

  return (
    <div className="bg-[#141628] border border-white/10 rounded-2xl p-5 space-y-4">
      {/* 标题行 */}
      <div className="flex items-center gap-2">
        <Award className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">FTGI 认证指数</h3>
        <span className={cn("ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border", certLevel.bg, certLevel.color)}>
          {certLevel.icon} {certLevel.label}
        </span>
      </div>

      {/* 总分大数字 */}
      <div className="text-center py-2">
        <div className="text-5xl font-black text-white tracking-tight">
          {totalFtgi.toFixed(1)}
        </div>
        <div className="text-[11px] text-slate-500 mt-1">满分 100 分</div>
      </div>

      {/* AI + 人工双进度条 */}
      <div className="space-y-2.5">
        {/* AI 贡献 */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-violet-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI 评分（60%）
            </span>
            <span className="text-white font-bold">{aiPts.toFixed(1)} / 60</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-purple-400 rounded-full transition-all duration-700"
              style={{ width: `${(aiPts / 60) * 100}%` }}
            />
          </div>
        </div>
        {/* 人工贡献 */}
        <div>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-emerald-400 flex items-center gap-1">
              <Users className="w-3 h-3" /> 社区评分（40%）
            </span>
            <span className="text-white font-bold">{humanPts.toFixed(1)} / 40</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 rounded-full transition-all duration-700"
              style={{ width: `${(humanPts / 40) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 五维雷达图（AI 维度） */}
      {hasAiScore && (
        <div>
          <div className="text-[10px] text-slate-500 text-center mb-1">AI 五维评分</div>
          <MiniRadar
            d1={Number(aiScore.d1Trust)}
            d2={Number(aiScore.d2Fulfillment)}
            d3={Number(aiScore.d3Market)}
            d4={Number(aiScore.d4Ecosystem)}
            d5={Number(aiScore.d5Community)}
          />
          {/* 五维标签 */}
          <div className="grid grid-cols-5 gap-1 mt-2">
            {[
              { icon: Shield,     label: "信任", key: "d1Trust",       color: "text-amber-400" },
              { icon: Zap,        label: "履约", key: "d2Fulfillment", color: "text-emerald-400" },
              { icon: TrendingUp, label: "市场", key: "d3Market",      color: "text-violet-400" },
              { icon: Globe,      label: "生态", key: "d4Ecosystem",   color: "text-blue-400" },
              { icon: Users,      label: "社区", key: "d5Community",   color: "text-pink-400" },
            ].map(({ icon: Icon, label, key, color }) => (
              <div key={key} className="text-center">
                <Icon className={cn("w-3.5 h-3.5 mx-auto mb-0.5", color)} />
                <div className="text-[9px] text-slate-500">{label}</div>
                <div className={cn("text-[11px] font-bold", color)}>
                  {Number((aiScore as any)[key] ?? 0).toFixed(0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 人工评分摘要 */}
      {humanScore && Number(humanScore.humanScore) > 0 && (
        <div className="border-t border-white/5 pt-3 space-y-1.5">
          <div className="text-[10px] text-slate-500 mb-2">社区评分构成</div>
          {[
            { label: "买家交易评价", value: Number(humanScore.scoreFromReviews), count: humanScore.reviewCount, color: "bg-blue-400" },
            { label: "Webinar 投票", value: Number(humanScore.scoreFromWebinars), count: humanScore.webinarVoteCount, color: "bg-purple-400" },
            { label: "专家评审",     value: Number(humanScore.scoreFromExperts),  count: humanScore.expertReviewCount, color: "bg-amber-400" },
          ].map(({ label, value, count, color }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="text-[10px] text-slate-400 w-20 shrink-0">{label}</div>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 w-8 text-right">{Number(count) > 0 ? `${Number(count)}条` : "—"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
