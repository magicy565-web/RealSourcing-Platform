/**
 * RealSourcing - Sourcing Demand Page
 * AI 多模态采购需求页面
 *
 * 功能：
 * - 提交 URL / 视频 / PDF 内容，AI 自动提取结构化采购需求
 * - 查看历史需求列表及处理状态
 * - 跳转详情页查看生产参数、渲染图、发布需求
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Sparkles, Globe, Video, FileText, Upload, ArrowRight,
  Clock, CheckCircle2, Loader2, AlertCircle, Package,
  ChevronRight, Zap, Brain, Factory, Image, Search,
  TrendingUp, Plus, RefreshCw, ExternalLink, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ── 常量 ──────────────────────────────────────────────────────────────────────

const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px)
`;

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; icon: React.ReactNode; progress: number
}> = {
  pending:     { label: "Queued",       color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: <Clock className="w-3 h-3" />,        progress: 5  },
  processing:  { label: "Processing",   color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  icon: <Loader2 className="w-3 h-3 animate-spin" />, progress: 35 },
  extracted:   { label: "Extracted",    color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: <Brain className="w-3 h-3" />,         progress: 65 },
  transformed: { label: "Ready",        color: "#4ade80", bg: "rgba(74,222,128,0.12)",  icon: <CheckCircle2 className="w-3 h-3" />,  progress: 90 },
  published:   { label: "Published",    color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: <Zap className="w-3 h-3" />,           progress: 100 },
  failed:      { label: "Failed",       color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: <AlertCircle className="w-3 h-3" />,   progress: 0  },
};

const INPUT_TYPES = [
  {
    id: "url" as const,
    icon: Globe,
    label: "Web URL",
    description: "TikTok, Instagram, product pages, news articles",
    placeholder: "https://www.tiktok.com/@brand/video/...",
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/10",
  },
  {
    id: "video" as const,
    icon: Video,
    label: "Video URL",
    description: "YouTube, Vimeo, or direct video links",
    placeholder: "https://youtube.com/watch?v=...",
    gradient: "from-rose-500/20 to-pink-500/20",
    border: "border-rose-500/30",
    glow: "shadow-rose-500/10",
  },
  {
    id: "pdf" as const,
    icon: FileText,
    label: "PDF Report",
    description: "Product specs, market reports, catalogs",
    placeholder: "https://example.com/product-spec.pdf",
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/10",
  },
];

const PIPELINE_STEPS = [
  { icon: Globe,       label: "Content Ingestion",    desc: "Extracting page content" },
  { icon: Brain,       label: "AI Analysis",          desc: "Identifying product info" },
  { icon: Package,     label: "Demand Modeling",      desc: "Structuring requirements" },
  { icon: Factory,     label: "Factory Parameters",   desc: "Generating production specs" },
  { icon: Image,       label: "Render Generation",    desc: "Creating product visuals" },
  { icon: Search,      label: "Vector Embedding",     desc: "Enabling semantic search" },
];

const EXAMPLE_URLS = [
  { label: "TikTok viral product", url: "https://www.tiktok.com/@techgadgets/video/example" },
  { label: "Amazon bestseller",    url: "https://www.amazon.com/dp/B0EXAMPLE" },
  { label: "Product spec PDF",     url: "https://example.com/spec-sheet.pdf" },
];

// ── 类型 ──────────────────────────────────────────────────────────────────────

type InputType = "url" | "video" | "pdf";

interface ProcessingState {
  demandId: number | null;
  currentStep: number;
  isComplete: boolean;
  productName?: string;
  moq?: string;
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function SourcingDemandPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // 表单状态
  const [activeType, setActiveType] = useState<InputType>("url");
  const [contentUrl, setContentUrl] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processing, setProcessing] = useState<ProcessingState | null>(null);
  const [showForm, setShowForm] = useState(true);

  // 搜索
  const [searchQuery, setSearchQuery] = useState("");

  // tRPC
  const { data: myDemands = [], isLoading: demandsLoading, refetch: refetchDemands } =
    trpc.demands.myDemands.useQuery(undefined, { enabled: !!user });

  const submitMutation = trpc.demands.submitAndProcess.useMutation({
    onSuccess: (data) => {
      setProcessing({
        demandId: data.demandId,
        currentStep: 5,
        isComplete: true,
        productName: data.productName,
        moq: data.moq,
      });
      setIsSubmitting(false);
      toast.success(`✅ "${data.productName}" processed successfully!`);
      refetchDemands();
      setTimeout(() => {
        setLocation(`/sourcing-demands/${data.demandId}`);
      }, 2000);
    },
    onError: (err) => {
      setIsSubmitting(false);
      setProcessing(null);
      toast.error("Processing failed: " + err.message);
    },
  });

  const handleSubmit = async () => {
    if (!contentUrl.trim()) {
      toast.error("Please enter a URL or link");
      return;
    }
    setIsSubmitting(true);
    setShowForm(false);

    // 模拟进度动画
    let step = 0;
    const interval = setInterval(() => {
      step = Math.min(step + 1, 4);
      setProcessing(prev => prev ? { ...prev, currentStep: step } : {
        demandId: null, currentStep: step, isComplete: false
      });
    }, 3000);

    setProcessing({ demandId: null, currentStep: 0, isComplete: false });

    submitMutation.mutate({
      contentType: activeType,
      contentUrl: contentUrl.trim(),
      additionalNotes: additionalNotes.trim() || undefined,
    }, {
      onSettled: () => clearInterval(interval),
    });
  };

  const filteredDemands = myDemands.filter((d: any) =>
    !searchQuery ||
    (d.productName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.productDescription ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <p className="text-white text-xl mb-4">Sign in to use AI Sourcing</p>
          <Button onClick={() => setLocation("/login")} className="bg-purple-600 hover:bg-purple-700">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white"
      style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
      {/* Grid background */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "32px 32px", opacity: 0.6 }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AI Sourcing Intelligence</h1>
              <p className="text-sm text-gray-400">Submit any URL, video, or PDF — AI extracts structured sourcing demands</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 mt-4">
            {[
              { label: "Total Demands", value: myDemands.length },
              { label: "Ready", value: myDemands.filter((d: any) => d.status === "transformed" || d.status === "published").length },
              { label: "Published", value: myDemands.filter((d: any) => d.status === "published").length },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-xl font-bold text-white">{stat.value}</span>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left Panel: Submit Form / Processing ─────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            <AnimatePresence mode="wait">
              {showForm && !isSubmitting ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-2xl border border-white/8 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(20px)" }}
                >
                  {/* Form header */}
                  <div className="px-5 py-4 border-b border-white/8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-white">New Sourcing Request</h2>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-purple-500/15 border border-purple-500/25">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                        <span className="text-xs text-purple-300 font-medium">AI Ready</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Input type selector */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Content Type</p>
                      <div className="grid grid-cols-3 gap-2">
                        {INPUT_TYPES.map((type) => {
                          const Icon = type.icon;
                          const isActive = activeType === type.id;
                          return (
                            <button
                              key={type.id}
                              onClick={() => setActiveType(type.id)}
                              className={`relative p-3 rounded-xl border text-left transition-all duration-200 ${
                                isActive
                                  ? `bg-gradient-to-br ${type.gradient} ${type.border} shadow-lg ${type.glow}`
                                  : "border-white/8 bg-white/2 hover:bg-white/5"
                              }`}
                            >
                              <Icon className={`w-4 h-4 mb-1.5 ${isActive ? "text-white" : "text-gray-500"}`} />
                              <p className={`text-xs font-medium ${isActive ? "text-white" : "text-gray-400"}`}>
                                {type.label}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* URL input */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                        {INPUT_TYPES.find(t => t.id === activeType)?.label} Link
                      </p>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          value={contentUrl}
                          onChange={(e) => setContentUrl(e.target.value)}
                          placeholder={INPUT_TYPES.find(t => t.id === activeType)?.placeholder}
                          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 focus:ring-purple-500/20 text-sm h-10"
                          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        />
                      </div>
                      {/* Example URLs */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {EXAMPLE_URLS.map((ex) => (
                          <button
                            key={ex.label}
                            onClick={() => setContentUrl(ex.url)}
                            className="text-xs text-purple-400/70 hover:text-purple-300 transition-colors"
                          >
                            {ex.label} →
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                        Additional Notes <span className="normal-case text-gray-600">(optional)</span>
                      </p>
                      <Textarea
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        placeholder="e.g. Need 5000 units, custom logo, CE certification required..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/50 resize-none text-sm"
                        rows={3}
                      />
                    </div>

                    {/* Submit button */}
                    <Button
                      onClick={handleSubmit}
                      disabled={!contentUrl.trim() || isSubmitting}
                      className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold shadow-lg shadow-purple-600/25 transition-all duration-200 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Analyze with AI
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-purple-500/20 overflow-hidden"
                  style={{ background: "rgba(124,58,237,0.05)", backdropFilter: "blur(20px)" }}
                >
                  <div className="px-5 py-4 border-b border-purple-500/15">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-white">
                        {processing?.isComplete ? "Processing Complete" : "AI Processing..."}
                      </h2>
                      {!processing?.isComplete && (
                        <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                      )}
                      {processing?.isComplete && (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      )}
                    </div>
                    {contentUrl && (
                      <p className="text-xs text-gray-500 mt-1 truncate">{contentUrl}</p>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    {PIPELINE_STEPS.map((step, idx) => {
                      const currentStep = processing?.currentStep ?? -1;
                      const isDone = idx < currentStep || processing?.isComplete;
                      const isActive = idx === currentStep && !processing?.isComplete;
                      const Icon = step.icon;

                      return (
                        <motion.div
                          key={step.label}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                            isActive ? "bg-purple-500/15 border border-purple-500/25" :
                            isDone  ? "bg-green-500/8 border border-green-500/15" :
                                      "opacity-30"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isDone  ? "bg-green-500/20" :
                            isActive ? "bg-purple-500/20" :
                                      "bg-white/5"
                          }`}>
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                            ) : isActive ? (
                              <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                            ) : (
                              <Icon className="w-3.5 h-3.5 text-gray-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`text-xs font-medium ${
                              isDone ? "text-green-300" : isActive ? "text-purple-300" : "text-gray-600"
                            }`}>{step.label}</p>
                            {isActive && (
                              <p className="text-xs text-gray-500">{step.desc}</p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}

                    {processing?.isComplete && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                      >
                        <p className="text-sm font-semibold text-green-300 mb-1">
                          {processing.productName}
                        </p>
                        {processing.moq && (
                          <p className="text-xs text-gray-400">MOQ: {processing.moq}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">Redirecting to details...</p>
                      </motion.div>
                    )}

                    {!processing?.isComplete && (
                      <button
                        onClick={() => { setShowForm(true); setProcessing(null); setIsSubmitting(false); }}
                        className="w-full mt-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* How it works card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/8 p-5"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">How It Works</h3>
              </div>
              <div className="space-y-3">
                {[
                  { step: "01", text: "Submit any product URL, viral video, or PDF spec sheet" },
                  { step: "02", text: "AI vision model extracts product details, pricing, and features" },
                  { step: "03", text: "System generates factory-ready production parameters (MOQ, BOM, cost)" },
                  { step: "04", text: "SD 3.5 Turbo renders a professional product visualization" },
                  { step: "05", text: "Publish to demand pool — supplier AIs discover and match your needs" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-3">
                    <span className="text-xs font-mono text-purple-500/60 mt-0.5 flex-shrink-0">{item.step}</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Right Panel: Demand History ───────────────────────────────── */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-white/8 overflow-hidden h-full"
              style={{ background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)" }}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-white">My Demands</h2>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    {myDemands.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => refetchDemands()}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { setShowForm(true); setProcessing(null); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/25 text-purple-300 text-xs font-medium hover:bg-purple-600/30 transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    New
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="px-5 py-3 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search demands..."
                    className="pl-8 h-8 bg-white/5 border-white/8 text-white placeholder:text-gray-600 text-xs focus:border-purple-500/40"
                  />
                </div>
              </div>

              {/* List */}
              <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 320px)" }}>
                {demandsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                ) : filteredDemands.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-purple-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-300 mb-1">No demands yet</p>
                    <p className="text-xs text-gray-600 max-w-xs">
                      Submit a URL, video, or PDF to let AI extract your first sourcing demand
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    <AnimatePresence>
                      {filteredDemands.map((demand: any, idx: number) => {
                        const status = STATUS_CONFIG[demand.status] ?? STATUS_CONFIG.pending;
                        const createdAt = demand.createdAt ? new Date(demand.createdAt) : null;
                        const relativeTime = createdAt
                          ? (() => {
                              const diff = Date.now() - createdAt.getTime();
                              const h = Math.floor(diff / 3600000);
                              const d = Math.floor(diff / 86400000);
                              if (h < 1) return "Just now";
                              if (h < 24) return `${h}h ago`;
                              return `${d}d ago`;
                            })()
                          : "";

                        return (
                          <motion.div
                            key={demand.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setLocation(`/sourcing-demands/${demand.id}`)}
                            className="px-5 py-4 hover:bg-white/3 cursor-pointer transition-all group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                {/* Icon */}
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Package className="w-4 h-4 text-purple-400" />
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-medium text-white truncate group-hover:text-purple-200 transition-colors">
                                      {demand.productName ?? "Processing..."}
                                    </p>
                                    {demand.status === "published" && (
                                      <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                                    )}
                                  </div>

                                  <p className="text-xs text-gray-500 truncate mb-2">
                                    {demand.productDescription ?? demand.contentUrl ?? "Analyzing content..."}
                                  </p>

                                  {/* Status + progress */}
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                      style={{ background: status.bg, color: status.color }}
                                    >
                                      {status.icon}
                                      {status.label}
                                    </div>
                                    <span className="text-xs text-gray-600">{relativeTime}</span>
                                  </div>

                                  {/* Progress bar for active processing */}
                                  {(demand.status === "processing" || demand.status === "extracted") && (
                                    <div className="mt-2">
                                      <Progress value={status.progress} className="h-1 bg-white/5" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Arrow */}
                              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-2" />
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
