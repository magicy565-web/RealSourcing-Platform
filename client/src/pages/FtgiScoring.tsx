/**
 * FtgiScoring — FTGI 认证评分中心
 *
 * 完整流水线：
 *   上传材料 → JSON 结构化 → AI 权重评分 → × 0.4 → 最终得分 → 可视化
 *
 * 仅工厂角色可访问（/ftgi-scoring）
 */

import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload, FileText, Image, Package, Globe, Trash2,
  Loader2, Sparkles, RefreshCw, CheckCircle2, AlertCircle,
  Clock, ChevronRight, BarChart3, Shield, Zap, TrendingUp,
  Users, Info, ArrowRight,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from "recharts";

// ── 文档类型配置 ──────────────────────────────────────────────────────────────
const DOC_TYPE_CONFIG = {
  image: {
    label: "工厂图片",
    desc: "车间、设备、生产线等照片",
    icon: Image,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    accept: "image/jpeg,image/png,image/webp,image/gif",
  },
  certification: {
    label: "认证文件",
    desc: "ISO、CE、FDA 等认证证书 PDF",
    icon: Shield,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    accept: "application/pdf,image/jpeg,image/png",
  },
  transaction: {
    label: "交易记录",
    desc: "订单记录、发票、合同等",
    icon: Package,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    accept: "application/pdf,.xlsx,.xls,.csv,image/jpeg,image/png",
  },
  customs: {
    label: "海关数据",
    desc: "出口报关单、海关数据截图",
    icon: Globe,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    accept: "application/pdf,.xlsx,.xls,.csv,image/jpeg,image/png",
  },
  other: {
    label: "其他材料",
    desc: "公司简介、荣誉证书等",
    icon: FileText,
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
    accept: "*",
  },
} as const;

type DocType = keyof typeof DOC_TYPE_CONFIG;

// ── 解析状态标签 ──────────────────────────────────────────────────────────────
function ParseStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending:    { label: "等待解析", className: "bg-slate-700 text-slate-300", icon: <Clock className="w-3 h-3" /> },
    processing: { label: "AI 解析中", className: "bg-blue-900/60 text-blue-300 animate-pulse", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    done:       { label: "解析完成", className: "bg-emerald-900/60 text-emerald-300", icon: <CheckCircle2 className="w-3 h-3" /> },
    failed:     { label: "解析失败", className: "bg-red-900/60 text-red-300", icon: <AlertCircle className="w-3 h-3" /> },
  };
  const cfg = map[status] ?? map.pending;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full", cfg.className)}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ── FTGI 五维雷达图 ───────────────────────────────────────────────────────────
function FtgiRadarChart({ scores }: {
  scores: { d1Trust: number; d2Fulfillment: number; d3Market: number; d4Ecosystem: number; d5Community: number }
}) {
  const data = [
    { dimension: "信任合规", value: scores.d1Trust,       fullMark: 100 },
    { dimension: "敏捷履约", value: scores.d2Fulfillment, fullMark: 100 },
    { dimension: "市场洞察", value: scores.d3Market,      fullMark: 100 },
    { dimension: "生态协作", value: scores.d4Ecosystem,   fullMark: 100 },
    { dimension: "社区验证", value: scores.d5Community,   fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="#1e1b4b" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, 100]}
          tick={{ fill: "#475569", fontSize: 10 }}
          tickCount={5}
        />
        <Radar
          name="FTGI"
          dataKey="value"
          stroke="#7c3aed"
          fill="#7c3aed"
          fillOpacity={0.25}
          strokeWidth={2}
          dot={{ fill: "#a78bfa", r: 4 }}
        />
        <Tooltip
          contentStyle={{ background: "#1e1b4b", border: "1px solid #312e81", borderRadius: 8 }}
          labelStyle={{ color: "#c4b5fd" }}
          itemStyle={{ color: "#e2e8f0" }}
          formatter={(value: number) => [`${value.toFixed(1)} 分`, "得分"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ── 维度得分卡片 ──────────────────────────────────────────────────────────────
const DIMENSION_META = [
  { key: "d1Trust",       label: "基础信任与合规力", weight: "20%", icon: Shield,     color: "text-amber-400",  bar: "bg-amber-400" },
  { key: "d2Fulfillment", label: "敏捷履约与交付力", weight: "30%", icon: Zap,        color: "text-emerald-400", bar: "bg-emerald-400" },
  { key: "d3Market",      label: "市场洞察与内容力", weight: "25%", icon: TrendingUp, color: "text-violet-400",  bar: "bg-violet-400" },
  { key: "d4Ecosystem",   label: "生态协作与开放性", weight: "15%", icon: Globe,      color: "text-blue-400",    bar: "bg-blue-400" },
  { key: "d5Community",   label: "社区验证与声誉",   weight: "10%", icon: Users,      color: "text-pink-400",    bar: "bg-pink-400" },
] as const;

function DimensionCard({ meta, score, reasoning }: {
  meta: typeof DIMENSION_META[number];
  score: number;
  reasoning?: string;
}) {
  const Icon = meta.icon;
  return (
    <div className="bg-[#141628] border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", meta.color)} />
          <span className="text-sm font-medium text-white">{meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
            权重 {meta.weight}
          </Badge>
          <span className={cn("text-lg font-bold", meta.color)}>{score.toFixed(1)}</span>
        </div>
      </div>
      {/* 进度条 */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", meta.bar)}
          style={{ width: `${score}%` }}
        />
      </div>
      {reasoning && (
        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{reasoning}</p>
      )}
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────────────────
export default function FtgiScoring() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"upload" | "score">("upload");
  const [uploadingType, setUploadingType] = useState<DocType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingDocType, setPendingDocType] = useState<DocType>("image");

  // ── tRPC 查询 ─────────────────────────────────────────────────────────────
  const { data: documents, refetch: refetchDocs, isLoading: docsLoading } =
    trpc.ftgi.getDocuments.useQuery(undefined, { refetchInterval: 5000 });

  // 获取当前工厂的 FTGI 分数（需要先有工厂 ID）
  const { data: myFactory } = trpc.factoryDashboard.myFactory.useQuery(undefined, {
    retry: false,
  });
  const factoryId = myFactory?.id;

  const { data: ftgiScore, refetch: refetchScore, isLoading: scoreLoading } =
    trpc.ftgi.getScore.useQuery(
      { factoryId: factoryId! },
      { enabled: !!factoryId, refetchInterval: 8000 }
    );

  // ── tRPC Mutations ────────────────────────────────────────────────────────
  const registerDoc  = trpc.ftgi.registerDocument.useMutation();
  const deleteDoc    = trpc.ftgi.deleteDocument.useMutation();
  const triggerCalc  = trpc.ftgi.triggerCalculation.useMutation();

  // ── 文件上传处理 ──────────────────────────────────────────────────────
  const handleFileSelect = useCallback(async (files: FileList | null, docType: DocType) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`文件 ${file.name} 超过 20MB 限制`);
        continue;
      }

      setUploadingType(docType);
      try {
        // 1. 直接上传到服务端 FTGI 上传端点
        const arrayBuffer = await file.arrayBuffer();
        const uploadResp = await fetch("/api/ftgi/upload", {
          method: "POST",
          headers: {
            "x-file-name": encodeURIComponent(file.name),
            "x-content-type": file.type || "application/octet-stream",
          },
          body: arrayBuffer,
          credentials: "include",
        });

        if (!uploadResp.ok) {
          const errData = await uploadResp.json().catch(() => ({}));
          throw new Error(errData.error || `上传失败 (${uploadResp.status})`);
        }

        const { url: finalUrl } = await uploadResp.json();

        // 2. 注册文档记录，触发 AI 解析
        await registerDoc.mutateAsync({
          docType,
          fileName: file.name,
          fileUrl: finalUrl,
          fileMime: file.type,
          fileSize: file.size,
        });

        toast.success(`${file.name} 上传成功，AI 正在解析中...`);
        refetchDocs();
      } catch (err) {
        toast.error(`上传失败：${err instanceof Error ? err.message : "未知错误"}`);
      } finally {
        setUploadingType(null);
      }
    }
  }, [registerDoc, refetchDocs]);

  // ── 触发评分 ──────────────────────────────────────────────────────────────
  const handleTriggerScore = async () => {
    try {
      const result = await triggerCalc.mutateAsync();
      toast.success(result.message);
      setActiveTab("score");
      setTimeout(() => refetchScore(), 3000);
    } catch (err) {
      toast.error("触发评分失败，请稍后重试");
    }
  };

  // ── 删除文档 ──────────────────────────────────────────────────────────────
  const handleDeleteDoc = async (docId: number) => {
    try {
      await deleteDoc.mutateAsync({ docId });
      toast.success("文档已删除");
      refetchDocs();
    } catch {
      toast.error("删除失败");
    }
  };

  // ── 评分状态展示 ──────────────────────────────────────────────────────────
  const scoreStatus = ftgiScore?.status ?? "pending";
  const isCalculating = scoreStatus === "calculating";
  const hasScore = scoreStatus === "done";

  const details = ftgiScore?.scoreDetails as any;
  const dimensions = details?.dimensions;

  return (
    <div className="min-h-screen bg-[#0a0b1a] text-white">
      {/* ── 顶部 Header ── */}
      <div className="border-b border-white/5 bg-[#0d0e20]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">FTGI 认证评分中心</h1>
              <p className="text-[11px] text-slate-500">工厂信任与增长指数 · AI 驱动评估</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasScore && ftgiScore && (
              <div className="flex items-center gap-2 bg-violet-600/10 border border-violet-500/20 rounded-xl px-3 py-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-sm font-bold text-violet-300">
                  FTGI {Number(ftgiScore.ftgiScore).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* ── 流程说明横幅 ── */}
        <div className="bg-gradient-to-r from-violet-900/20 to-blue-900/20 border border-violet-500/20 rounded-2xl p-5">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {[
              { step: "01", label: "上传材料", sub: "图片/认证/交易/海关" },
              { step: "02", label: "AI 结构化", sub: "自动提取关键信息" },
              { step: "03", label: "五维评分", sub: "AI 权重打分 0-100" },
              { step: "04", label: "× 系数 0.4", sub: "AI 评分修正系数" },
              { step: "05", label: "FTGI 得分", sub: "最终认证指数" },
            ].map((item, i, arr) => (
              <div key={item.step} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-violet-500 bg-violet-500/10 px-1.5 py-0.5 rounded">
                    {item.step}
                  </span>
                  <div>
                    <div className="font-semibold text-white text-xs">{item.label}</div>
                    <div className="text-[10px] text-slate-500">{item.sub}</div>
                  </div>
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab 切换 ── */}
        <div className="flex gap-1 bg-[#141628] rounded-xl p-1 w-fit">
          {[
            { id: "upload", label: "材料上传", icon: Upload },
            { id: "score",  label: "评分结果", icon: BarChart3 },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "upload" | "score")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1: 材料上传
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "upload" && (
          <div className="space-y-6">
            {/* 上传区域网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.entries(DOC_TYPE_CONFIG) as [DocType, typeof DOC_TYPE_CONFIG[DocType]][]).map(([type, cfg]) => {
                const Icon = cfg.icon;
                const isUploading = uploadingType === type;
                return (
                  <div
                    key={type}
                    className={cn(
                      "relative border rounded-2xl p-5 cursor-pointer transition-all duration-200 group",
                      "hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]",
                      cfg.bg
                    )}
                    onClick={() => {
                      setPendingDocType(type);
                      fileInputRef.current?.click();
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900/60 flex items-center justify-center shrink-0">
                        <Icon className={cn("w-5 h-5", cfg.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm">{cfg.label}</h3>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{cfg.desc}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "mt-4 flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed transition-all",
                      "border-slate-600 group-hover:border-violet-500/50",
                      isUploading ? "opacity-50 pointer-events-none" : ""
                    )}>
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
                      )}
                      <span className="text-xs text-slate-500 group-hover:text-violet-400 transition-colors">
                        {isUploading ? "上传中..." : "点击上传"}
                      </span>
                    </div>
                    {/* 已上传数量徽章 */}
                    {documents && (() => {
                      const count = documents.filter(d => d.docType === type).length;
                      return count > 0 ? (
                        <div className="absolute top-3 right-3 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">{count}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                );
              })}
            </div>

            {/* 隐藏的文件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={DOC_TYPE_CONFIG[pendingDocType].accept}
              onChange={e => handleFileSelect(e.target.files, pendingDocType)}
              onClick={e => { (e.target as HTMLInputElement).value = ""; }}
            />

            {/* 已上传文档列表 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  已上传材料
                  {documents && (
                    <span className="text-xs text-slate-500 font-normal">({documents.length} 份)</span>
                  )}
                </h2>
                <button
                  onClick={() => refetchDocs()}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {docsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                </div>
              ) : !documents || documents.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Upload className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">尚未上传任何材料</p>
                  <p className="text-xs mt-1">上传材料后，AI 将自动解析并用于评分</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map(doc => {
                    const cfg = DOC_TYPE_CONFIG[doc.docType as DocType] ?? DOC_TYPE_CONFIG.other;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={doc.id}
                        className="flex items-center gap-3 bg-[#141628] border border-white/5 rounded-xl px-4 py-3 group"
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                          <Icon className={cn("w-4 h-4", cfg.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-white font-medium truncate max-w-[200px]">
                              {doc.fileName}
                            </span>
                            <ParseStatusBadge status={doc.parseStatus} />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-500">{cfg.label}</span>
                            {doc.fileSize && (
                              <span className="text-[10px] text-slate-600">
                                · {(doc.fileSize / 1024).toFixed(0)} KB
                              </span>
                            )}
                            {doc.parsedJson && (
                              <span className="text-[10px] text-emerald-500">· 已结构化</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 触发评分按钮 */}
            <div className="flex items-center justify-between bg-gradient-to-r from-violet-900/20 to-purple-900/20 border border-violet-500/20 rounded-2xl p-5">
              <div>
                <h3 className="font-semibold text-white text-sm">准备好了？启动 AI 评分</h3>
                <p className="text-xs text-slate-400 mt-1">
                  上传的材料越多，评分越准确。AI 将综合所有材料进行五维评估。
                </p>
              </div>
              <Button
                onClick={handleTriggerScore}
                disabled={triggerCalc.isPending || !documents || documents.length === 0}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border border-violet-400/20 shadow-lg shadow-violet-500/20 shrink-0"
              >
                {triggerCalc.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />计算中...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />开始 AI 评分</>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2: 评分结果
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "score" && (
          <div className="space-y-6">
            {scoreLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                <p className="text-slate-400 text-sm">加载评分数据...</p>
              </div>
            ) : isCalculating ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-violet-400 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">AI 正在评分中...</p>
                  <p className="text-slate-400 text-sm mt-1">正在分析您的材料，请稍候（约 30-60 秒）</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchScore()} className="border-slate-700">
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />刷新查看
                </Button>
              </div>
            ) : !hasScore || !ftgiScore ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-slate-600" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold">尚未生成评分</p>
                  <p className="text-slate-400 text-sm mt-1">请先上传材料，然后点击"开始 AI 评分"</p>
                </div>
                <Button
                  onClick={() => setActiveTab("upload")}
                  className="bg-violet-600 hover:bg-violet-500"
                >
                  <Upload className="w-4 h-4 mr-2" />去上传材料
                </Button>
              </div>
            ) : (
              <>
                {/* 综合得分卡 */}
                <div className="bg-gradient-to-br from-violet-900/30 to-purple-900/20 border border-violet-500/30 rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* 雷达图 */}
                    <div className="w-full md:w-64 shrink-0">
                      <FtgiRadarChart scores={{
                        d1Trust:       Number(ftgiScore.d1Trust),
                        d2Fulfillment: Number(ftgiScore.d2Fulfillment),
                        d3Market:      Number(ftgiScore.d3Market),
                        d4Ecosystem:   Number(ftgiScore.d4Ecosystem),
                        d5Community:   Number(ftgiScore.d5Community),
                      }} />
                    </div>
                    {/* 得分详情 */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">FTGI 最终得分</p>
                        <div className="flex items-end gap-3">
                          <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                            {Number(ftgiScore.ftgiScore).toFixed(1)}
                          </span>
                          <span className="text-slate-400 text-lg mb-2">/ 40</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          原始综合分 {Number(ftgiScore.rawScore).toFixed(1)} × AI系数 {Number(ftgiScore.aiCoefficient)} = {Number(ftgiScore.ftgiScore).toFixed(1)}
                        </p>
                      </div>
                      {/* 计算公式展示 */}
                      <div className="bg-slate-900/60 rounded-xl p-3 space-y-2">
                        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">计算过程</p>
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-slate-300">加权原始分</span>
                          <span className="text-slate-500">=</span>
                          <span className="text-amber-400">信任×20%</span>
                          <span className="text-slate-600">+</span>
                          <span className="text-emerald-400">履约×30%</span>
                          <span className="text-slate-600">+</span>
                          <span className="text-violet-400">洞察×25%</span>
                          <span className="text-slate-600">+</span>
                          <span className="text-blue-400">协作×15%</span>
                          <span className="text-slate-600">+</span>
                          <span className="text-pink-400">社区×10%</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs border-t border-white/5 pt-2">
                          <span className="text-slate-300">FTGI 得分</span>
                          <span className="text-slate-500">=</span>
                          <span className="text-white font-bold">{Number(ftgiScore.rawScore).toFixed(1)}</span>
                          <span className="text-slate-500">×</span>
                          <span className="text-violet-400 font-bold">0.4</span>
                          <span className="text-slate-500">=</span>
                          <span className="text-violet-300 font-black text-base">{Number(ftgiScore.ftgiScore).toFixed(1)}</span>
                        </div>
                      </div>
                      {ftgiScore.calculatedAt && (
                        <p className="text-[10px] text-slate-600">
                          最后评分时间：{new Date(ftgiScore.calculatedAt).toLocaleString("zh-CN")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 五维详细评分 */}
                <div>
                  <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-slate-400" />
                    五维详细评分
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {DIMENSION_META.map(meta => {
                      const score = Number(ftgiScore[meta.key as keyof typeof ftgiScore] ?? 0);
                      const reasoning = dimensions?.[meta.key]?.reasoning;
                      return (
                        <DimensionCard
                          key={meta.key}
                          meta={meta}
                          score={score}
                          reasoning={reasoning}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* AI 推理详情 */}
                {dimensions && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Info className="w-4 h-4 text-slate-400" />
                      AI 评分依据
                    </h2>
                    <div className="space-y-2">
                      {DIMENSION_META.map(meta => {
                        const dim = dimensions[meta.key];
                        if (!dim?.dataPoints?.length) return null;
                        const Icon = meta.icon;
                        return (
                          <div key={meta.key} className="bg-[#141628] border border-white/5 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Icon className={cn("w-3.5 h-3.5", meta.color)} />
                              <span className="text-xs font-medium text-white">{meta.label}</span>
                              <span className={cn("text-xs font-bold ml-auto", meta.color)}>
                                {Number(ftgiScore[meta.key as keyof typeof ftgiScore] ?? 0).toFixed(1)} 分
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {dim.dataPoints.map((point: string, i: number) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full"
                                >
                                  {point}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 重新评分按钮 */}
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleTriggerScore}
                    disabled={triggerCalc.isPending}
                    className="border-slate-700 text-slate-400 hover:text-white"
                  >
                    {triggerCalc.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />计算中...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 mr-2" />重新评分</>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
