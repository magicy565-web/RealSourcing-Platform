/**
 * RealSourcing - Sourcing Demand Detail Page
 * AI 采购需求详情页
 *
 * 功能：
 * - 展示 AI 提取的结构化采购需求
 * - 展示工厂生产参数（MOQ / BOM / 成本 / 交期）
 * - 生成 SD 3.5 Turbo 产品渲染图
 * - 一键发布到公开需求池（供应商 AI 可发现）
 * - 语义搜索相似需求
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, Sparkles, Package, Factory, DollarSign, Clock,
  Zap, CheckCircle2, Loader2, AlertCircle, Image, Globe,
  ChevronRight, Copy, ExternalLink, RefreshCw, Eye,
  Layers, Palette, Ruler, ShieldCheck, TrendingUp,
  Brain, Search, Share2, Download, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ── 常量 ──────────────────────────────────────────────────────────────────────

const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px)
`;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: "Queued",     color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  processing:  { label: "Processing", color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  extracted:   { label: "Extracted",  color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  transformed: { label: "Ready",      color: "#4ade80", bg: "rgba(74,222,128,0.12)"  },
  published:   { label: "Published",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  failed:      { label: "Failed",     color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

// ── 工具函数 ──────────────────────────────────────────────────────────────────

function copyToClipboard(text: string, label = "Copied") {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
}

function formatCurrency(val: string | null | undefined): string {
  if (!val) return "—";
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── 子组件：参数卡片 ───────────────────────────────────────────────────────────

function ParamCard({
  icon: Icon, label, value, accent = false
}: {
  icon: React.ElementType; label: string; value: React.ReactNode; accent?: boolean
}) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${
      accent
        ? "bg-purple-500/8 border-purple-500/20"
        : "bg-white/3 border-white/8 hover:bg-white/5"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-3.5 h-3.5 ${accent ? "text-purple-400" : "text-gray-500"}`} />
        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className={`text-sm font-semibold ${accent ? "text-purple-200" : "text-white"}`}>
        {value ?? "—"}
      </div>
    </div>
  );
}

// ── 子组件：标签列表 ───────────────────────────────────────────────────────────

function TagList({ items, color = "purple" }: { items: unknown; color?: string }) {
  const arr = Array.isArray(items) ? items as string[] : [];
  if (arr.length === 0) return <span className="text-gray-600 text-sm">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {arr.map((item, i) => (
        <span
          key={i}
          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
            color === "green"
              ? "bg-green-500/10 border-green-500/20 text-green-300"
              : color === "blue"
              ? "bg-blue-500/10 border-blue-500/20 text-blue-300"
              : "bg-purple-500/10 border-purple-500/20 text-purple-300"
          }`}
        >
          {String(item)}
        </span>
      ))}
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function SourcingDemandDetail() {
  const params = useParams<{ id: string }>();
  const demandId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [isGeneratingRender, setIsGeneratingRender] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "params" | "render" | "match" | "search">("overview");

  // ── tRPC ──────────────────────────────────────────────────────────────────

  const { data, isLoading, refetch } = trpc.demands.getById.useQuery(
    { id: demandId },
    { enabled: !!demandId && !!user }
  );

  const generateRenderMutation = trpc.demands.generateRender.useMutation({
    onSuccess: (res) => {
      setIsGeneratingRender(false);
      toast.success("Render image generated!");
      refetch();
    },
    onError: (err) => {
      setIsGeneratingRender(false);
      toast.error("Render failed: " + err.message);
    },
  });

  const publishMutation = trpc.demands.publish.useMutation({
    onSuccess: () => {
      setIsPublishing(false);
      toast.success("Demand published to supplier network!");
      refetch();
    },
    onError: (err) => {
      setIsPublishing(false);
      toast.error("Publish failed: " + err.message);
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const semanticSearch = trpc.demands.semanticSearch.useQuery(
    { query: searchQuery, topK: 8, minSimilarity: 0.45 },
    { enabled: hasSearched && searchQuery.length > 5 }
  );

  const matchResults = trpc.demands.getMatchResults.useQuery(
    { demandId },
    { enabled: activeTab === "match" }
  );

  const triggerMatchMutation = trpc.demands.triggerMatch.useMutation({
    onSuccess: () => {
      toast.success("AI Matching complete! Found top matches.");
      matchResults.refetch();
    },
    onError: (err) => toast.error("Match failed: " + err.message),
  });

  // ── Render helpers ────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
        <Button onClick={() => setLocation("/login")} className="bg-purple-600 hover:bg-purple-700">
          Sign In
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-4">Demand not found</p>
          <Button onClick={() => setLocation("/sourcing-demands")} variant="outline"
            className="border-white/20 text-gray-400">
            Back to Demands
          </Button>
        </div>
      </div>
    );
  }

  const { demand, params: mfgParams } = data as {
    demand: any;
    params: any;
  };

  const status = STATUS_CONFIG[demand.status] ?? STATUS_CONFIG.pending;
  const isReady = demand.status === "transformed" || demand.status === "published";
  const isPublished = demand.status === "published";
  const hasRender = !!mfgParams?.renderImageUrl;
  const keyFeatures = Array.isArray(demand.keyFeatures) ? demand.keyFeatures : [];
  const visualRefs = Array.isArray(demand.visualReferences) ? demand.visualReferences as string[] : [];

  const TABS = [
    { id: "overview" as const, label: "Overview",   icon: Eye },
    { id: "params"   as const, label: "Production", icon: Factory,    disabled: !isReady },
    { id: "render"   as const, label: "Render",     icon: Image,      disabled: !isReady },
    { id: "match"    as const, label: "Find Factories", icon: Zap,    disabled: !isReady },
    { id: "search"   as const, label: "Similar Demands", icon: Search, disabled: !isPublished },
  ];

  return (
    <div className="min-h-screen text-white"
      style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "32px 32px", opacity: 0.6 }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Back + Header ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button
            onClick={() => setLocation("/sourcing-demands")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Demands
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/30 to-purple-800/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white mb-1">
                  {demand.productName ?? "Processing..."}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: status.bg, color: status.color }}
                  >
                    {demand.status === "processing" && <Loader2 className="w-3 h-3 animate-spin" />}
                    {demand.status === "published" && <Zap className="w-3 h-3" />}
                    {demand.status === "transformed" && <CheckCircle2 className="w-3 h-3" />}
                    {status.label}
                  </div>
                  <span className="text-xs text-gray-600">#{demand.id}</span>
                  {demand.contentUrl && (
                    <a
                      href={demand.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-purple-400/70 hover:text-purple-300 transition-colors"
                    >
                      <Globe className="w-3 h-3" />
                      Source
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {isReady && !isPublished && (
                <Button
                  onClick={() => { setIsPublishing(true); publishMutation.mutate({ demandId }); }}
                  disabled={isPublishing}
                  className="h-9 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-semibold shadow-lg shadow-amber-500/20"
                >
                  {isPublishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  Publish to Network
                </Button>
              )}
              {isPublished && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-300 font-medium">Live on Supplier Network</span>
                </div>
              )}
              <button
                onClick={() => refetch()}
                className="p-2 rounded-xl border border-white/8 text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-6 bg-white/3 border border-white/8 rounded-xl p-1 w-fit">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25"
                    : tab.disabled
                    ? "text-gray-700 cursor-not-allowed"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.disabled && (
                  <span className="text-xs text-gray-700 ml-1">🔒</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ───────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-5"
            >
              {/* Main info */}
              <div className="lg:col-span-2 space-y-5">
                {/* Product description */}
                <div className="rounded-2xl border border-white/8 p-5"
                  style={{ background: "rgba(255,255,255,0.02)" }}>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    AI Extracted Information
                  </h3>
                  {demand.productDescription ? (
                    <p className="text-sm text-gray-300 leading-relaxed">{demand.productDescription}</p>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Extracting product information...</span>
                    </div>
                  )}
                </div>

                {/* Key features */}
                {keyFeatures.length > 0 && (
                  <div className="rounded-2xl border border-white/8 p-5"
                    style={{ background: "rgba(255,255,255,0.02)" }}>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400" />
                      Key Features
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {keyFeatures.map((f: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                          <span className="text-sm text-gray-300">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visual references */}
                {visualRefs.length > 0 && (
                  <div className="rounded-2xl border border-white/8 p-5"
                    style={{ background: "rgba(255,255,255,0.02)" }}>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Image className="w-4 h-4 text-blue-400" />
                      Visual References
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {visualRefs.slice(0, 6).map((url, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/8 bg-white/3">
                          <img
                            src={url}
                            alt={`Reference ${i + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Side panel */}
              <div className="space-y-4">
                {/* Quick stats */}
                <div className="rounded-2xl border border-white/8 p-5 space-y-3"
                  style={{ background: "rgba(255,255,255,0.02)" }}>
                  <h3 className="text-sm font-semibold text-white mb-1">Demand Summary</h3>

                  {[
                    { label: "Est. Quantity", value: demand.estimatedQuantity, icon: Package },
                    { label: "Target Price", value: demand.targetPrice ? formatCurrency(demand.targetPrice) : null, icon: DollarSign },
                    { label: "Content Type", value: demand.contentType?.toUpperCase(), icon: Globe },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-3.5 h-3.5 text-gray-600" />
                        <span className="text-xs text-gray-500">{item.label}</span>
                      </div>
                      <span className="text-xs font-medium text-white">{item.value ?? "—"}</span>
                    </div>
                  ))}
                </div>

                {/* Customization notes */}
                {demand.customizationNotes && (
                  <div className="rounded-2xl border border-purple-500/20 p-4"
                    style={{ background: "rgba(124,58,237,0.05)" }}>
                    <h3 className="text-xs font-semibold text-purple-300 mb-2 uppercase tracking-wider">
                      Customization Notes
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed">{demand.customizationNotes}</p>
                  </div>
                )}

                {/* Next steps */}
                {!isReady && demand.status !== "failed" && (
                  <div className="rounded-2xl border border-blue-500/20 p-4"
                    style={{ background: "rgba(59,130,246,0.05)" }}>
                    <h3 className="text-xs font-semibold text-blue-300 mb-3 uppercase tracking-wider">
                      Processing Pipeline
                    </h3>
                    {[
                      { label: "Content ingested",       done: ["extracted","transformed","published"].includes(demand.status) },
                      { label: "Demand extracted",       done: ["transformed","published"].includes(demand.status) },
                      { label: "Parameters generated",   done: ["transformed","published"].includes(demand.status) },
                    ].map((step) => (
                      <div key={step.label} className="flex items-center gap-2 mb-2">
                        {step.done
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                          : <div className="w-3.5 h-3.5 rounded-full border border-gray-600 flex-shrink-0" />
                        }
                        <span className={`text-xs ${step.done ? "text-green-300" : "text-gray-500"}`}>
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Production Parameters Tab */}
          {activeTab === "params" && (
            <motion.div
              key="params"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              {mfgParams ? (
                <>
                  {/* Core metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <ParamCard icon={Package}    label="MOQ"         value={mfgParams.moq}                    accent />
                    <ParamCard icon={DollarSign} label="Unit Cost"   value={formatCurrency(mfgParams.unitCostEstimate)} accent />
                    <ParamCard icon={Clock}      label="Lead Time"   value={mfgParams.leadTimeDays ? `${mfgParams.leadTimeDays} days` : null} />
                    <ParamCard icon={DollarSign} label="Tooling Cost" value={formatCurrency(mfgParams.toolingCost)} />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Materials & BOM */}
                    <div className="rounded-2xl border border-white/8 p-5"
                      style={{ background: "rgba(255,255,255,0.02)" }}>
                      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-blue-400" />
                        Bill of Materials
                      </h3>
                      {Array.isArray(mfgParams.materials) && mfgParams.materials.length > 0 ? (
                        <div className="space-y-2">
                          {(mfgParams.materials as any[]).map((mat: any, i: number) => (
                            <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                              <div>
                                <p className="text-sm font-medium text-white">{mat.name}</p>
                                {mat.specification && (
                                  <p className="text-xs text-gray-500 mt-0.5">{mat.specification}</p>
                                )}
                              </div>
                              {mat.estimatedCost && (
                                <span className="text-xs text-green-300 font-medium">{formatCurrency(String(mat.estimatedCost))}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No materials specified</p>
                      )}
                    </div>

                    {/* Dimensions & Colors */}
                    <div className="space-y-4">
                      {/* Dimensions */}
                      <div className="rounded-2xl border border-white/8 p-5"
                        style={{ background: "rgba(255,255,255,0.02)" }}>
                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Ruler className="w-4 h-4 text-cyan-400" />
                          Dimensions & Weight
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Dimensions", value: mfgParams.dimensions },
                            { label: "Weight",     value: mfgParams.weight },
                          ].map((item) => (
                            <div key={item.label}>
                              <p className="text-xs text-gray-600 mb-1">{item.label}</p>
                              <p className="text-sm text-white font-medium">{item.value ?? "—"}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Colors */}
                      <div className="rounded-2xl border border-white/8 p-5"
                        style={{ background: "rgba(255,255,255,0.02)" }}>
                        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Palette className="w-4 h-4 text-pink-400" />
                          Color Requirements
                        </h3>
                        {Array.isArray(mfgParams.colorRequirements) && mfgParams.colorRequirements.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {(mfgParams.colorRequirements as any[]).map((c: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/8">
                                {c.hex && (
                                  <div
                                    className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0"
                                    style={{ background: c.hex }}
                                  />
                                )}
                                <span className="text-xs text-gray-300">{c.name}</span>
                                {c.pantone && (
                                  <span className="text-xs text-gray-600">({c.pantone})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">No color specs</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Certifications & Factory types */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-white/8 p-5"
                      style={{ background: "rgba(255,255,255,0.02)" }}>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-green-400" />
                        Required Certifications
                      </h3>
                      <TagList items={mfgParams.certifications} color="green" />
                    </div>
                    <div className="rounded-2xl border border-white/8 p-5"
                      style={{ background: "rgba(255,255,255,0.02)" }}>
                      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Factory className="w-4 h-4 text-blue-400" />
                        Suggested Factory Types
                      </h3>
                      <TagList items={mfgParams.suggestedFactoryTypes} color="blue" />
                    </div>
                  </div>

                  {/* Packaging */}
                  {mfgParams.packagingRequirements && (
                    <div className="rounded-2xl border border-white/8 p-5"
                      style={{ background: "rgba(255,255,255,0.02)" }}>
                      <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-400" />
                        Packaging Requirements
                      </h3>
                      <p className="text-sm text-gray-300">{mfgParams.packagingRequirements}</p>
                    </div>
                  )}

                  {/* Copy params button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(mfgParams, null, 2), "Parameters")}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/8 text-gray-400 text-xs hover:bg-white/5 hover:text-gray-200 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy as JSON
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-4" />
                  <p className="text-gray-400">Generating production parameters...</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Render Tab */}
          {activeTab === "render" && (
            <motion.div
              key="render"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Render preview */}
                <div className="rounded-2xl border border-white/8 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Image className="w-4 h-4 text-purple-400" />
                      Product Render
                    </h3>
                    {hasRender && (
                      <a
                        href={mfgParams.renderImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    )}
                  </div>

                  <div className="p-5">
                    {hasRender ? (
                      <div className="aspect-square rounded-xl overflow-hidden border border-white/8">
                        <img
                          src={mfgParams.renderImageUrl}
                          alt="AI Generated Product Render"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-xl border border-dashed border-white/15 flex flex-col items-center justify-center gap-3 bg-white/2">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                          <Image className="w-7 h-7 text-purple-400/60" />
                        </div>
                        <p className="text-sm text-gray-500 text-center max-w-xs">
                          Generate a professional product render using Stable Diffusion 3.5 Turbo
                        </p>
                        <Button
                          onClick={() => {
                            setIsGeneratingRender(true);
                            generateRenderMutation.mutate({ demandId });
                          }}
                          disabled={isGeneratingRender}
                          className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-sm"
                        >
                          {isGeneratingRender ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Generating... (up to 5 min)
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Render
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Render info */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/8 p-5"
                    style={{ background: "rgba(255,255,255,0.02)" }}>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      About This Render
                    </h3>
                    <div className="space-y-3 text-sm text-gray-400">
                      <p>Generated by <span className="text-white font-medium">Stable Diffusion 3.5 Large Turbo</span> via Alibaba Cloud DashScope.</p>
                      <p>The AI automatically builds a professional product photography prompt based on your product name, materials, colors, and category.</p>
                      <p className="text-xs text-gray-600">Resolution: 1024×1024 · Stored on Aliyun OSS</p>
                    </div>
                  </div>

                  {isGeneratingRender && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-2xl border border-purple-500/20 p-5"
                      style={{ background: "rgba(124,58,237,0.05)" }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                        <p className="text-sm font-medium text-purple-300">Generating render...</p>
                      </div>
                      <div className="space-y-2 text-xs text-gray-500">
                        <p>1. Building product prompt from parameters</p>
                        <p>2. Submitting to SD 3.5 Turbo queue</p>
                        <p>3. Waiting for generation (2-5 min)</p>
                        <p>4. Uploading to OSS storage</p>
                      </div>
                    </motion.div>
                  )}

                  {hasRender && (
                    <div className="rounded-2xl border border-green-500/20 p-5"
                      style={{ background: "rgba(74,222,128,0.05)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <p className="text-sm font-medium text-green-300">Render Complete</p>
                      </div>
                      <p className="text-xs text-gray-500 break-all">{mfgParams.renderImageUrl}</p>
                      <button
                        onClick={() => copyToClipboard(mfgParams.renderImageUrl, "URL")}
                        className="flex items-center gap-1.5 mt-3 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        Copy URL
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Factory Matching Tab (4.0 Core) */}
          {activeTab === "match" && (
            <motion.div
              key="match"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-400" />
                    AI Factory Matching
                  </h2>
                  <p className="text-sm text-gray-500">Real-time matching based on your production parameters and factory availability</p>
                </div>
                <Button 
                  onClick={() => triggerMatchMutation.mutate({ demandId })}
                  disabled={triggerMatchMutation.isLoading}
                  className="bg-amber-600 hover:bg-amber-500 text-white"
                >
                  {triggerMatchMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Refresh Matches
                </Button>
              </div>

              {matchResults.isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-4" />
                  <p className="text-gray-500 text-sm">Scanning 10,000+ verified factories...</p>
                </div>
              ) : !matchResults.data || matchResults.data.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-20 text-center">
                  <Factory className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400 mb-6">No matches yet. Trigger AI matching to find your perfect partner.</p>
                  <Button 
                    onClick={() => triggerMatchMutation.mutate({ demandId })}
                    className="bg-purple-600 hover:bg-purple-500"
                  >
                    Start AI Matching
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchResults.data.map((result, i) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative rounded-2xl border border-white/8 bg-white/3 p-5 hover:bg-white/5 hover:border-amber-500/30 transition-all overflow-hidden"
                    >
                      {/* Match Score Badge */}
                      <div className="absolute top-0 right-0 p-3">
                        <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                          {Math.round(parseFloat(result.matchScore))} % Match
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {result.factoryLogo ? (
                            <img src={result.factoryLogo} alt={result.factoryName} className="w-full h-full object-cover" />
                          ) : (
                            <Factory className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-white mb-1 truncate group-hover:text-amber-400 transition-colors">
                            {result.factoryName}
                          </h4>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs text-gray-500">{result.factoryCategory}</span>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${result.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                              <span className={`text-[10px] font-medium uppercase tracking-wider ${result.isOnline ? 'text-green-400' : 'text-gray-600'}`}>
                                {result.isOnline ? 'Online Now' : 'Offline'}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-4 italic">
                            "{result.matchReason}"
                          </p>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              className="h-8 text-[10px] border-white/10 hover:bg-white/5"
                              onClick={() => setLocation(`/factories/${result.factoryId}`)}
                            >
                              View Profile
                            </Button>
                            <Button 
                              className={`h-8 text-[10px] ${result.isOnline ? 'bg-green-600 hover:bg-green-500' : 'bg-purple-600 hover:bg-purple-500'} text-white`}
                              onClick={() => {
                                if (result.isOnline) {
                                  toast.success("Connecting to factory agent...");
                                  // TODO: 接入 30 分钟实时握手流程
                                } else {
                                  toast.info("Factory is offline. Sending offline inquiry...");
                                }
                              }}
                            >
                              {result.isOnline ? 'Start Live Chat' : 'Send Inquiry'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Semantic Search Tab */}
          {activeTab === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div className="rounded-2xl border border-white/8 p-5"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  Semantic Demand Search
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Describe what you're looking for — AI finds semantically similar published demands from other buyers
                </p>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") setHasSearched(true); }}
                      placeholder="e.g. wireless earbuds with ANC, 5000 units, CE certified..."
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>
                  <Button
                    onClick={() => setHasSearched(true)}
                    disabled={searchQuery.length < 5}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-5"
                  >
                    Search
                  </Button>
                </div>
                {demand.productName && (
                  <button
                    onClick={() => { setSearchQuery(demand.productName); setHasSearched(true); }}
                    className="mt-2 text-xs text-purple-400/70 hover:text-purple-300 transition-colors"
                  >
                    Search for "{demand.productName}" →
                  </button>
                )}
              </div>

              {/* Search results */}
              {hasSearched && (
                <div className="space-y-3">
                  {semanticSearch.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    </div>
                  ) : semanticSearch.data?.results.length === 0 ? (
                    <div className="text-center py-12">
                      <Search className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No similar demands found</p>
                      <p className="text-gray-600 text-xs mt-1">Try a different description</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Found <span className="text-white font-medium">{semanticSearch.data?.results.length}</span> similar demands
                          from <span className="text-white font-medium">{semanticSearch.data?.totalSearched}</span> published
                          · Model: <span className="text-purple-400">{semanticSearch.data?.queryModel}</span>
                        </p>
                      </div>
                      {semanticSearch.data?.results.map((result, i) => (
                        <motion.div
                          key={result.demandId}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="rounded-xl border border-white/8 p-4 hover:bg-white/3 transition-all cursor-pointer"
                          onClick={() => setLocation(`/sourcing-demands/${result.demandId}`)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-white truncate">{result.productName}</p>
                                <div
                                  className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    background: `rgba(${Math.round(result.similarity * 74)}, ${Math.round(result.similarity * 222)}, ${Math.round(result.similarity * 128)}, 0.12)`,
                                    color: `rgb(${Math.round(result.similarity * 74)}, ${Math.round(result.similarity * 222)}, ${Math.round(result.similarity * 128)})`,
                                  }}
                                >
                                  {Math.round(result.similarity * 100)}% match
                                </div>
                              </div>
                              {result.productDescription && (
                                <p className="text-xs text-gray-500 line-clamp-2">{result.productDescription}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                {result.estimatedQuantity && (
                                  <span className="text-xs text-gray-600">Qty: {result.estimatedQuantity}</span>
                                )}
                                {result.targetPrice && (
                                  <span className="text-xs text-gray-600">Price: {formatCurrency(result.targetPrice)}</span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0 mt-1" />
                          </div>
                        </motion.div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
