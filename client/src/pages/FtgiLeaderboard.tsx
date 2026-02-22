/**
 * FtgiLeaderboard — FTGI 认证排行榜
 *
 * 路由：/ftgi-leaderboard
 * 访问：公开（无需登录）
 *
 * 功能：
 *   - 展示所有已获得 FTGI 评分的工厂排行榜
 *   - 按认证等级（铂金/金牌/银牌/铜牌）筛选
 *   - 按最低分数筛选
 *   - 搜索工厂名称/地区
 *   - 点击工厂跳转详情页
 *   - 五维雷达图快速预览
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Trophy, Medal, Award, Shield, Zap, TrendingUp, Globe, Users,
  Search, Filter, ChevronRight, Building2, Sparkles, Star,
  BarChart3, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

// ── 认证等级配置 ──────────────────────────────────────────────────────────────
const CERT_LEVELS = {
  all:      { label: "全部",   color: "text-slate-400",  bg: "bg-slate-800",          border: "border-slate-700",          icon: null },
  platinum: { label: "铂金",   color: "text-cyan-300",   bg: "bg-cyan-500/10",         border: "border-cyan-500/30",         icon: Trophy },
  gold:     { label: "金牌",   color: "text-amber-300",  bg: "bg-amber-500/10",        border: "border-amber-500/30",        icon: Medal },
  silver:   { label: "银牌",   color: "text-slate-300",  bg: "bg-slate-500/10",        border: "border-slate-500/30",        icon: Award },
  bronze:   { label: "铜牌",   color: "text-orange-300", bg: "bg-orange-500/10",       border: "border-orange-500/30",       icon: Shield },
} as const;

type CertLevelKey = keyof typeof CERT_LEVELS;

function getCertConfig(level: string) {
  return CERT_LEVELS[level as CertLevelKey] ?? CERT_LEVELS.all;
}

// ── 排名图标 ──────────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center"><Trophy className="w-4 h-4 text-amber-400" /></div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-slate-400/20 border border-slate-400/40 flex items-center justify-center"><Medal className="w-4 h-4 text-slate-300" /></div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center"><Medal className="w-4 h-4 text-orange-400" /></div>;
  return <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">#{rank}</div>;
}

// ── 迷你雷达图 ────────────────────────────────────────────────────────────────
function MiniRadarChart({ d1, d2, d3, d4, d5 }: { d1: number; d2: number; d3: number; d4: number; d5: number }) {
  const data = [
    { dim: "信任", v: d1 },
    { dim: "履约", v: d2 },
    { dim: "市场", v: d3 },
    { dim: "生态", v: d4 },
    { dim: "社区", v: d5 },
  ];
  return (
    <ResponsiveContainer width={100} height={80}>
      <RadarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
        <PolarGrid stroke="#1e1b4b" />
        <PolarAngleAxis dataKey="dim" tick={{ fill: "#64748b", fontSize: 8 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar dataKey="v" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} strokeWidth={1.5} />
        <Tooltip
          contentStyle={{ background: "#1e1b4b", border: "1px solid #312e81", borderRadius: 4, fontSize: 10 }}
          formatter={(v: number) => [`${v.toFixed(0)}`, ""]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ── 工厂排行卡片 ──────────────────────────────────────────────────────────────
function LeaderboardRow({
  item,
  onNavigate,
}: {
  item: any;
  onNavigate: (id: number) => void;
}) {
  const certCfg = getCertConfig(item.certLevel);
  const CertIcon = certCfg.icon;

  return (
    <div
      onClick={() => onNavigate(item.factoryId)}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200",
        "bg-[#141628] border-white/5 hover:border-violet-500/30 hover:bg-violet-900/10 hover:shadow-[0_0_20px_rgba(124,58,237,0.1)]"
      )}
    >
      {/* 排名 */}
      <RankBadge rank={item.rank} />

      {/* 工厂 Logo */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/10 flex items-center justify-center shrink-0">
        {item.factoryLogo ? (
          <img src={item.factoryLogo} alt={item.factoryName} className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <Building2 className="w-5 h-5 text-violet-400" />
        )}
      </div>

      {/* 工厂信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-white truncate">{item.factoryName}</h3>
          {CertIcon && (
            <span className={cn("flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0", certCfg.bg, certCfg.border, certCfg.color)}>
              <CertIcon className="w-2.5 h-2.5" />{certCfg.label}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 truncate">
          {[item.factoryCity, item.factoryCountry, item.factoryCategory].filter(Boolean).join(" · ")}
        </p>
        {/* 五维进度条 */}
        <div className="flex gap-1 mt-2">
          {[
            { label: "信任", value: item.d1Trust, color: "bg-amber-500" },
            { label: "履约", value: item.d2Fulfillment, color: "bg-emerald-500" },
            { label: "市场", value: item.d3Market, color: "bg-violet-500" },
            { label: "生态", value: item.d4Ecosystem, color: "bg-blue-500" },
            { label: "社区", value: item.d5Community, color: "bg-pink-500" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex-1" title={`${label}: ${value.toFixed(0)}`}>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 迷你雷达图（仅大屏显示） */}
      <div className="hidden lg:block shrink-0">
        <MiniRadarChart
          d1={item.d1Trust} d2={item.d2Fulfillment}
          d3={item.d3Market} d4={item.d4Ecosystem} d5={item.d5Community}
        />
      </div>

      {/* FTGI 总分 */}
      <div className="text-right shrink-0">
        <div className={cn("text-2xl font-black", certCfg.color)}>{item.ftgiScore.toFixed(1)}</div>
        <div className="text-[10px] text-slate-600">/ 100</div>
        <div className="text-[10px] text-slate-500 mt-0.5">AI {item.rawScore?.toFixed(0) ?? "—"}</div>
      </div>

      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 transition-colors shrink-0" />
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────────────────
export default function FtgiLeaderboard() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [certFilter, setCertFilter] = useState<CertLevelKey>("all");
  const [minScore, setMinScore] = useState<number>(0);

  const { data: leaderboard = [], isLoading } = trpc.ftgi.leaderboard.useQuery({
    limit: 100,
    certLevel: certFilter === "all" ? "all" : certFilter,
    minScore: minScore > 0 ? minScore : undefined,
  });

  // 前端搜索过滤
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const q = searchQuery.toLowerCase();
    return leaderboard.filter((item: any) =>
      item.factoryName?.toLowerCase().includes(q) ||
      item.factoryCity?.toLowerCase().includes(q) ||
      item.factoryCountry?.toLowerCase().includes(q) ||
      item.factoryCategory?.toLowerCase().includes(q)
    );
  }, [leaderboard, searchQuery]);

  // 统计数据
  const stats = useMemo(() => ({
    total: leaderboard.length,
    platinum: leaderboard.filter((i: any) => i.certLevel === "platinum").length,
    gold: leaderboard.filter((i: any) => i.certLevel === "gold").length,
    avgScore: leaderboard.length > 0
      ? leaderboard.reduce((s: number, i: any) => s + i.ftgiScore, 0) / leaderboard.length
      : 0,
  }), [leaderboard]);

  return (
    <div className="min-h-screen bg-[#0a0b1a] text-white">
      {/* ── Header ── */}
      <div className="border-b border-white/5 bg-[#0d0e20]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/factories")} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">FTGI 认证排行榜</h1>
              <p className="text-[11px] text-slate-500">AI 60% + 社区评分 40% · 实时更新</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/factories")}
            className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10 text-xs"
          >
            <Building2 className="w-3.5 h-3.5 mr-1.5" />浏览工厂
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* ── 统计概览 ── */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "已认证工厂", value: stats.total, icon: Building2, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
            { label: "铂金认证", value: stats.platinum, icon: Trophy, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
            { label: "金牌认证", value: stats.gold, icon: Medal, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
            { label: "平均 FTGI 分", value: stats.avgScore.toFixed(1), icon: BarChart3, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={cn("rounded-xl border p-4 flex items-center gap-3", bg)}>
              <Icon className={cn("w-7 h-7 shrink-0", color)} />
              <div>
                <div className="text-xl font-black text-white">{value}</div>
                <div className="text-[10px] text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 搜索 + 筛选 ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* 搜索框 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400/50" />
            <Input
              placeholder="搜索工厂名称、地区、品类..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-slate-900/40 border-violet-500/20 text-white placeholder-slate-600 focus:border-violet-500/50"
            />
          </div>

          {/* 认证等级筛选 */}
          <div className="flex gap-1.5">
            {(Object.entries(CERT_LEVELS) as [CertLevelKey, typeof CERT_LEVELS[CertLevelKey]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setCertFilter(key)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium border transition-all",
                  certFilter === key
                    ? cn(cfg.bg, cfg.border, cfg.color)
                    : "bg-transparent border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300"
                )}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* 最低分数筛选 */}
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="h-10 px-3 rounded-lg bg-slate-900/40 border border-violet-500/20 text-slate-300 text-xs focus:outline-none focus:border-violet-500/50"
          >
            <option value={0}>全部分数</option>
            <option value={40}>40+ 分</option>
            <option value={55}>55+ 分</option>
            <option value={70}>70+ 分</option>
            <option value={85}>85+ 分</option>
          </select>
        </div>

        {/* ── 排行榜列表 ── */}
        <div className="space-y-2">
          {/* 表头 */}
          <div className="flex items-center gap-4 px-4 py-2 text-[10px] text-slate-600 uppercase tracking-wider">
            <div className="w-8">排名</div>
            <div className="w-10" />
            <div className="flex-1">工厂</div>
            <div className="hidden lg:block w-24 text-center">五维分布</div>
            <div className="w-16 text-right">FTGI 分</div>
            <div className="w-4" />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-slate-500 text-sm">加载排行榜数据...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <Trophy className="w-12 h-12 text-slate-700 mx-auto" />
              <p className="text-slate-500 text-sm">
                {leaderboard.length === 0
                  ? "暂无 FTGI 评分数据。工厂完成材料上传并触发评分后将出现在此处。"
                  : "没有符合筛选条件的工厂"}
              </p>
            </div>
          ) : (
            filtered.map((item: any) => (
              <LeaderboardRow
                key={item.factoryId}
                item={item}
                onNavigate={(id) => setLocation(`/factory/${id}`)}
              />
            ))
          )}
        </div>

        {/* ── 说明 ── */}
        <div className="bg-[#141628] border border-white/5 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            FTGI 评分说明
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { icon: Shield,     label: "信任与合规", weight: "20%", color: "text-amber-400" },
              { icon: Zap,        label: "敏捷履约",   weight: "30%", color: "text-emerald-400" },
              { icon: TrendingUp, label: "市场内容",   weight: "25%", color: "text-violet-400" },
              { icon: Globe,      label: "生态协作",   weight: "15%", color: "text-blue-400" },
              { icon: Users,      label: "社区声誉",   weight: "10%", color: "text-pink-400" },
            ].map(({ icon: Icon, label, weight, color }) => (
              <div key={label} className="text-center">
                <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />
                <div className="text-[11px] text-white font-medium">{label}</div>
                <div className={cn("text-[10px] font-bold", color)}>{weight}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-4 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-violet-400" />AI 评分贡献 60%</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3 text-emerald-400" />社区评分贡献 40%</span>
            <span className="ml-auto">满分 100 分</span>
          </div>
        </div>
      </div>
    </div>
  );
}
