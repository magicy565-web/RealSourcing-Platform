/**
 * ExpertReview — 专家评审工作台
 *
 * 访问权限：role = 'expert' 或 'admin'
 * 路由：/expert-review
 *
 * 功能：
 *   - 浏览待评审工厂列表（按 FTGI 分数排序，优先评审高潜力工厂）
 *   - 三维度评分（创新力 / 管理水平 / 发展潜力）
 *   - 撰写专家评审报告
 *   - 查看已提交的历史评审
 *   - 评审贡献统计（本月评审数、平均分、影响工厂数）
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Award, Star, TrendingUp, Building2, ChevronRight,
  Loader2, CheckCircle2, AlertCircle, BarChart3,
  Lightbulb, Settings, Rocket, FileText, Send,
  ArrowLeft, RefreshCw, Eye, Lock,
} from "lucide-react";

// ── 滑块评分组件 ──────────────────────────────────────────────────────────────
function ScoreSlider({
  label, icon: Icon, color, value, onChange, description,
}: {
  label: string;
  icon: React.ElementType;
  color: string;
  value: number;
  onChange: (v: number) => void;
  description: string;
}) {
  const getScoreLabel = (v: number) => {
    if (v >= 90) return { text: "卓越", cls: "text-emerald-400" };
    if (v >= 75) return { text: "优秀", cls: "text-blue-400" };
    if (v >= 60) return { text: "良好", cls: "text-violet-400" };
    if (v >= 40) return { text: "一般", cls: "text-amber-400" };
    return { text: "待改善", cls: "text-red-400" };
  };
  const { text, cls } = getScoreLabel(value);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", color)} />
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-medium", cls)}>{text}</span>
          <span className={cn("text-xl font-black", color)}>{value}</span>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-800"
        style={{
          background: `linear-gradient(to right, var(--tw-gradient-from) 0%, var(--tw-gradient-to) ${value}%, #1e293b ${value}%, #1e293b 100%)`,
        }}
      />
      <p className="text-[11px] text-slate-500">{description}</p>
    </div>
  );
}

// ── 工厂卡片（待评审列表） ────────────────────────────────────────────────────
function FactoryReviewCard({
  factory,
  onSelect,
  isSelected,
  hasReviewed,
}: {
  factory: any;
  onSelect: () => void;
  isSelected: boolean;
  hasReviewed: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative p-4 rounded-xl border cursor-pointer transition-all duration-200",
        isSelected
          ? "bg-violet-900/20 border-violet-500/50 shadow-[0_0_20px_rgba(124,58,237,0.2)]"
          : "bg-[#141628] border-white/5 hover:border-violet-500/30 hover:bg-violet-900/10",
        hasReviewed && "opacity-60"
      )}
    >
      {hasReviewed && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-blue-600/30 border border-violet-500/20 flex items-center justify-center shrink-0">
          {factory.logo ? (
            <img src={factory.logo} alt={factory.name} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <Building2 className="w-5 h-5 text-violet-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white truncate">{factory.name}</h3>
            {factory.country && (
              <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400 shrink-0">
                {factory.country}
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
            {factory.city} · {factory.category || "综合制造"}
          </p>
          {factory.overallScore && (
            <div className="flex items-center gap-1 mt-1.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[11px] text-amber-400 font-medium">{Number(factory.overallScore).toFixed(1)}</span>
              <span className="text-[10px] text-slate-600">平台评分</span>
            </div>
          )}
        </div>
        <ChevronRight className={cn("w-4 h-4 shrink-0 transition-transform", isSelected && "rotate-90 text-violet-400")} />
      </div>
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────────────────
export default function ExpertReview() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // 评审表单状态
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);
  const [scoreInnovation, setScoreInnovation] = useState(60);
  const [scoreManagement, setScoreManagement] = useState(60);
  const [scorePotential, setScorePotential] = useState(60);
  const [summary, setSummary] = useState("");
  const [activeView, setActiveView] = useState<"list" | "history">("list");

  // ── tRPC 查询 ─────────────────────────────────────────────────────────────
  const { data: factories, isLoading: factoriesLoading } =
    trpc.factories.list.useQuery();

  const { data: existingReviews, refetch: refetchReviews } =
    trpc.humanScores.getExpertReviews.useQuery(
      { factoryId: selectedFactoryId! },
      { enabled: !!selectedFactoryId }
    );

  // ── tRPC Mutations ────────────────────────────────────────────────────────
  const addReview = trpc.humanScores.addExpertReview.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSummary("");
      setScoreInnovation(60);
      setScoreManagement(60);
      setScorePotential(60);
      refetchReviews();
    },
    onError: (err) => toast.error(err.message),
  });

  // ── 权限检查 ──────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0b1a] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Lock className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-slate-400">请先登录</p>
          <Button onClick={() => setLocation("/login")} className="bg-violet-600 hover:bg-violet-500">前往登录</Button>
        </div>
      </div>
    );
  }

  const isAuthorized = user.role === "expert" || user.role === "admin";
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0a0b1a] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">权限不足</h2>
          <p className="text-slate-400 text-sm">专家评审工作台仅对认证专家和管理员开放。如需申请专家资格，请联系平台运营团队。</p>
          <Button variant="outline" onClick={() => setLocation("/")} className="border-slate-700 text-slate-400">
            <ArrowLeft className="w-4 h-4 mr-2" />返回首页
          </Button>
        </div>
      </div>
    );
  }

  const selectedFactory = factories?.find(f => f.id === selectedFactoryId);
  const avgScore = Math.round((scoreInnovation + scoreManagement + scorePotential) / 3);
  const canSubmit = selectedFactoryId && summary.trim().length >= 20;

  const handleSubmit = async () => {
    if (!selectedFactoryId) return;
    await addReview.mutateAsync({
      factoryId: selectedFactoryId,
      scoreInnovation,
      scoreManagement,
      scorePotential,
      summary: summary.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0b1a] text-white">
      {/* ── 顶部 Header ── */}
      <div className="border-b border-white/5 bg-[#0d0e20]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">专家评审工作台</h1>
              <p className="text-[11px] text-slate-500">FTGI 认证 · 专家评审模块（权重 20%）</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-600/20 text-amber-300 border-amber-500/30">
              {user.role === "admin" ? "管理员" : "认证专家"}
            </Badge>
            <div className="flex bg-[#141628] rounded-lg p-0.5">
              {[
                { id: "list", label: "评审工厂", icon: Building2 },
                { id: "history", label: "历史记录", icon: FileText },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveView(id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    activeView === id ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ── 统计概览 ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "可评审工厂", value: factories?.length ?? 0, icon: Building2, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
            { label: "当前平均分", value: avgScore, icon: BarChart3, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
            { label: "评审权重", value: "20%", icon: Award, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={cn("rounded-xl border p-4 flex items-center gap-3", bg)}>
              <Icon className={cn("w-8 h-8", color)} />
              <div>
                <div className="text-2xl font-black text-white">{value}</div>
                <div className="text-[11px] text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {activeView === "list" && (
          <div className="grid grid-cols-12 gap-6">
            {/* ── 左栏：工厂列表 ── */}
            <div className="col-span-12 lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-white">工厂列表</h2>
                <span className="text-[11px] text-slate-500">{factories?.length ?? 0} 家</span>
              </div>
              {factoriesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                  {(factories ?? []).map(factory => (
                    <FactoryReviewCard
                      key={factory.id}
                      factory={factory}
                      onSelect={() => setSelectedFactoryId(factory.id)}
                      isSelected={selectedFactoryId === factory.id}
                      hasReviewed={false}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── 右栏：评审表单 ── */}
            <div className="col-span-12 lg:col-span-8">
              {!selectedFactoryId ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center">
                    <Award className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white">选择一家工厂开始评审</h3>
                  <p className="text-slate-500 text-sm max-w-xs">
                    从左侧列表中选择工厂，对其创新力、管理水平和发展潜力进行专业评审。
                    您的评审将贡献 FTGI 总分的 20%。
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* 工厂信息头部 */}
                  <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-600/30 to-orange-600/30 border border-amber-500/20 flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-amber-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{selectedFactory?.name}</h2>
                        <p className="text-sm text-slate-400">{selectedFactory?.city}, {selectedFactory?.country}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-3xl font-black text-amber-400">{avgScore}</div>
                        <div className="text-[11px] text-slate-500">当前综合分</div>
                      </div>
                    </div>
                  </div>

                  {/* 三维度评分 */}
                  <div className="bg-[#141628] border border-white/5 rounded-2xl p-6 space-y-6">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-400" />
                      三维度评分
                    </h3>
                    <ScoreSlider
                      label="创新力"
                      icon={Lightbulb}
                      color="text-yellow-400"
                      value={scoreInnovation}
                      onChange={setScoreInnovation}
                      description="产品研发能力、工艺创新、定制化能力、技术壁垒深度"
                    />
                    <ScoreSlider
                      label="管理水平"
                      icon={Settings}
                      color="text-blue-400"
                      value={scoreManagement}
                      onChange={setScoreManagement}
                      description="质量管理体系、生产流程标准化、供应链管理、合规水平"
                    />
                    <ScoreSlider
                      label="发展潜力"
                      icon={Rocket}
                      color="text-emerald-400"
                      value={scorePotential}
                      onChange={setScorePotential}
                      description="市场扩张能力、数字化转型进度、国际化布局、增长趋势"
                    />

                    {/* 综合分预览 */}
                    <div className="flex items-center justify-between bg-amber-900/20 border border-amber-500/20 rounded-xl px-4 py-3">
                      <span className="text-sm text-slate-400">专家综合分</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-amber-400">{avgScore}</span>
                        <span className="text-xs text-slate-500">/ 100</span>
                      </div>
                    </div>
                  </div>

                  {/* 评审报告 */}
                  <div className="bg-[#141628] border border-white/5 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-400" />
                      专家评审报告
                      <span className="text-[10px] text-slate-500 ml-auto">最少 20 字，最多 2000 字</span>
                    </h3>
                    <textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="请从专业角度对该工厂进行综合评价。建议涵盖：核心竞争力、主要风险点、改进建议、适合的买家类型等维度。您的评审报告将展示在工厂详情页，帮助买家做出更好的采购决策。"
                      rows={8}
                      maxLength={2000}
                      className="w-full bg-slate-900/60 border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-amber-500/40 leading-relaxed"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">{summary.length} / 2000 字</span>
                      {summary.length > 0 && summary.length < 20 && (
                        <span className="text-[11px] text-red-400">还需 {20 - summary.length} 字</span>
                      )}
                    </div>
                  </div>

                  {/* 提交按钮 */}
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSubmit}
                      disabled={!canSubmit || addReview.isPending}
                      className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-semibold h-11 rounded-xl"
                    >
                      {addReview.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />提交中...</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2" />提交专家评审</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setSelectedFactoryId(null); setSummary(""); }}
                      className="border-slate-700 text-slate-400 hover:text-white h-11 rounded-xl"
                    >
                      取消
                    </Button>
                  </div>

                  {/* 已有评审 */}
                  {existingReviews && existingReviews.length > 0 && (
                    <div className="bg-[#141628] border border-white/5 rounded-2xl p-5 space-y-3">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Eye className="w-4 h-4 text-slate-400" />
                        该工厂已有 {existingReviews.length} 条专家评审
                      </h3>
                      {existingReviews.slice(0, 3).map((review: any) => (
                        <div key={review.id} className="border border-white/5 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {[
                                { label: "创新", value: review.scoreInnovation, color: "text-yellow-400" },
                                { label: "管理", value: review.scoreManagement, color: "text-blue-400" },
                                { label: "潜力", value: review.scorePotential, color: "text-emerald-400" },
                              ].map(({ label, value, color }) => (
                                <div key={label} className="text-center">
                                  <div className={cn("text-lg font-bold", color)}>{value}</div>
                                  <div className="text-[9px] text-slate-500">{label}</div>
                                </div>
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-600">
                              {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                            </span>
                          </div>
                          {review.isPublished && (
                            <p className="text-[11px] text-slate-400 line-clamp-2">{review.summary}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 历史记录视图 ── */}
        {activeView === "history" && (
          <div className="text-center py-20 space-y-4">
            <FileText className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">评审历史记录</h3>
            <p className="text-slate-500 text-sm">您的历史评审记录将在此展示（功能开发中）</p>
          </div>
        )}
      </div>
    </div>
  );
}
