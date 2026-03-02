/**
 * Opportunity Radar Page
 * AI-powered product opportunity discovery for furniture niche
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import BuyerSidebar from "@/components/BuyerSidebar";
import { toast } from "sonner";
import {
  Radar, Sparkles, TrendingUp, DollarSign, Target, Zap,
  ChevronRight, Filter, RefreshCw, Bookmark, X, Eye,
  ArrowUpRight, Package, Clock, Star, AlertTriangle,
  SlidersHorizontal, Check, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Score Ring Component ─────────────────────────────────────────────────────
function ScoreRing({ score, size = 56, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? "#a855f7" : score >= 55 ? "#f59e0b" : "#6b7280";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={4} />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={4}
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white">{score}</span>
        </div>
      </div>
      {label && <span className="text-[9px] text-muted-foreground text-center leading-tight">{label}</span>}
    </div>
  );
}

// ─── Opportunity Card ─────────────────────────────────────────────────────────
function OpportunityCard({ item, onSave, onDismiss, onView }: {
  item: any;
  onSave: () => void;
  onDismiss: () => void;
  onView: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = item.opportunityScore >= 75 ? "text-purple-400" : item.opportunityScore >= 55 ? "text-amber-400" : "text-muted-foreground";
  const scoreBg = item.opportunityScore >= 75 ? "bg-purple-600/20 border-purple-500/30" : item.opportunityScore >= 55 ? "bg-amber-600/20 border-amber-500/30" : "bg-white/5 border-white/10";

  return (
    <div
      className={cn(
        "group relative bg-[#13131a] border rounded-2xl overflow-hidden transition-all duration-300",
        "hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-900/20",
        item.userAction === "saved" ? "border-purple-500/50" : "border-white/8"
      )}
    >
      {/* Opportunity Score Badge */}
      <div className={cn("absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold border", scoreBg, scoreColor)}>
        {item.opportunityScore}pt
      </div>

      {/* Product Image */}
      <div className="relative h-44 bg-gradient-to-br from-white/5 to-white/2 overflow-hidden">
        {item.coverImage ? (
          <img src={item.coverImage} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-white/10" />
          </div>
        )}
        {/* Batch badge */}
        {item.batchId && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-full text-[10px] text-white/70">
            Batch {item.batchId}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Factory */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-4 h-4 rounded-full bg-purple-600/30 flex items-center justify-center">
            <span className="text-[8px] text-purple-300 font-bold">{(item.factoryName || "F")[0]}</span>
          </div>
          <span className="text-[11px] text-muted-foreground truncate">{item.factoryName || "Verified Supplier"}</span>
          <span className="text-[10px] text-muted-foreground/50">· {item.factoryCountry || "China"}</span>
        </div>

        {/* Product Name */}
        <h3 className="text-sm font-semibold text-white mb-1.5 line-clamp-2 leading-snug">
          {item.name
            .split(' — ')
            .filter((part, idx, arr) => idx === 0 || part !== arr[0])
            .join(' — ')}
        </h3>

        {/* Headline */}
        {item.headline && (
          <p className="text-[11px] text-purple-300/80 mb-3 line-clamp-2 italic">"{item.headline}"</p>
        )}

        {/* Score Grid */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <ScoreRing score={item.trendScore || 0} size={44} label="Trend" />
          <ScoreRing score={item.marginScore || 0} size={44} label="Margin" />
          <ScoreRing score={item.competitionScore || 0} size={44} label="Low Comp" />
          <ScoreRing score={item.demandScore || 0} size={44} label="Demand" />
        </div>

        {/* Key Metrics */}
        <div className="flex items-center gap-3 mb-3 text-[11px] text-muted-foreground">
          {item.priceMin && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              <span>${item.priceMin}{item.priceMax ? `–$${item.priceMax}` : ""}</span>
            </div>
          )}
          {item.estimatedMargin && (
            <div className="flex items-center gap-1 text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>{item.estimatedMargin} margin</span>
            </div>
          )}
          {item.moq && (
            <div className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              <span>MOQ {item.moq}</span>
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => { setExpanded(!expanded); onView(); }}
          className="w-full flex items-center justify-between text-[11px] text-muted-foreground hover:text-white transition-colors mb-2"
        >
          <span>See opportunity analysis</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")} />
        </button>

        {/* Expanded Analysis */}
        {expanded && (
          <div className="border-t border-white/8 pt-3 space-y-3">
            {/* Why Now */}
            {item.whyNow && (
              <div>
                <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mb-1">Why Now</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.whyNow}</p>
              </div>
            )}

            {/* Target Audience */}
            {item.targetAudience && (
              <div>
                <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">Target Buyer</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{item.targetAudience}</p>
              </div>
            )}

            {/* Suggested Retail Price */}
            {item.suggestedRetailPrice && (
              <div className="flex items-center gap-2 p-2 bg-emerald-900/20 border border-emerald-500/20 rounded-lg">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-emerald-400 font-semibold">Suggested Retail</p>
                  <p className="text-xs text-white font-bold">{item.suggestedRetailPrice}</p>
                </div>
              </div>
            )}

            {/* Action Steps */}
            {item.actionSteps?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1.5">Action Plan</p>
                <div className="space-y-1.5">
                  {item.actionSteps.map((step: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] text-amber-400 font-bold">{i + 1}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {item.risks && (
              <div className="flex items-start gap-2 p-2 bg-red-900/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground">{item.risks}</p>
              </div>
            )}

            {/* Platforms */}
            {item.suggestedPlatforms?.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground">Best on:</span>
                {item.suggestedPlatforms.map((p: string) => (
                  <span key={p} className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/70 capitalize">
                    {p.replace("_", " ")}
                  </span>
                ))}
              </div>
            )}

            {/* Tags */}
            {item.tags?.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.tags.map((tag: string) => (
                  <span key={tag} className="px-1.5 py-0.5 bg-purple-600/10 border border-purple-500/20 rounded-full text-[10px] text-purple-400">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/8">
          <button
            onClick={onSave}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all",
              item.userAction === "saved"
                ? "bg-purple-600/30 border border-purple-500/50 text-purple-300"
                : "bg-white/5 border border-white/10 text-muted-foreground hover:bg-purple-600/20 hover:text-purple-300 hover:border-purple-500/30"
            )}
          >
            <Bookmark className="w-3.5 h-3.5" />
            {item.userAction === "saved" ? "Saved" : "Save"}
          </button>
          <button
            onClick={onDismiss}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:bg-red-600/10 hover:text-red-400 hover:border-red-500/20 transition-all"
            title="Not interested"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <a
            href={`/factories/${item.factorySlug || item.factoryId}`}
            className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 transition-all"
            title="View supplier"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
function FilterPanel({ prefs, onChange, onClose }: {
  prefs: any;
  onChange: (p: any) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(prefs || {
    priceRangeMin: null, priceRangeMax: null,
    minOpportunityScore: 0, targetPlatforms: [],
    preferredStyles: [], preferredMaterials: [],
    maxMoq: null, showNewOnly: false,
    sortBy: "opportunity_score", notifyOnNewBatch: true,
  });

  const PLATFORMS = ["shopify", "tiktok_shop", "amazon", "etsy", "woocommerce"];
  const STYLES = ["modern", "minimalist", "rustic", "industrial", "scandinavian", "bohemian", "traditional"];
  const MATERIALS = ["solid_wood", "engineered_wood", "metal", "rattan", "upholstered", "glass", "marble"];

  const toggle = (key: string, val: string) => {
    const arr: string[] = local[key] || [];
    setLocal({ ...local, [key]: arr.includes(val) ? arr.filter((x: string) => x !== val) : [...arr, val] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-80 h-full bg-[#13131a] border-l border-white/10 overflow-y-auto p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-purple-400" />
            Radar Filters
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        {/* Min Opportunity Score */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
            Min Opportunity Score: <span className="text-purple-400">{local.minOpportunityScore}</span>
          </label>
          <input
            type="range" min={0} max={90} step={5}
            value={local.minOpportunityScore}
            onChange={(e) => setLocal({ ...local, minOpportunityScore: Number(e.target.value) })}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Show all</span><span>Top only (90+)</span>
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Factory Price Range (USD)</label>
          <div className="flex items-center gap-2">
            <input
              type="number" placeholder="Min"
              value={local.priceRangeMin || ""}
              onChange={(e) => setLocal({ ...local, priceRangeMin: e.target.value ? Number(e.target.value) : null })}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50"
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="number" placeholder="Max"
              value={local.priceRangeMax || ""}
              onChange={(e) => setLocal({ ...local, priceRangeMax: e.target.value ? Number(e.target.value) : null })}
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>

        {/* Max MOQ */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Max MOQ</label>
          <input
            type="number" placeholder="e.g. 50"
            value={local.maxMoq || ""}
            onChange={(e) => setLocal({ ...local, maxMoq: e.target.value ? Number(e.target.value) : null })}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50"
          />
        </div>

        {/* Target Platforms */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Target Platforms</label>
          <div className="flex flex-wrap gap-1.5">
            {PLATFORMS.map(p => (
              <button
                key={p}
                onClick={() => toggle("targetPlatforms", p)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all capitalize",
                  (local.targetPlatforms || []).includes(p)
                    ? "bg-purple-600/30 border-purple-500/50 text-purple-300"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:border-purple-500/30"
                )}
              >
                {p.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Styles */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Preferred Styles</label>
          <div className="flex flex-wrap gap-1.5">
            {STYLES.map(s => (
              <button
                key={s}
                onClick={() => toggle("preferredStyles", s)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all capitalize",
                  (local.preferredStyles || []).includes(s)
                    ? "bg-blue-600/30 border-blue-500/50 text-blue-300"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:border-blue-500/30"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Materials */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Materials</label>
          <div className="flex flex-wrap gap-1.5">
            {MATERIALS.map(m => (
              <button
                key={m}
                onClick={() => toggle("preferredMaterials", m)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all",
                  (local.preferredMaterials || []).includes(m)
                    ? "bg-amber-600/30 border-amber-500/50 text-amber-300"
                    : "bg-white/5 border-white/10 text-muted-foreground hover:border-amber-500/30"
                )}
              >
                {m.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Sort By</label>
          <div className="space-y-1">
            {[
              { value: "opportunity_score", label: "Opportunity Score" },
              { value: "margin", label: "Profit Margin" },
              { value: "trend", label: "Trend Score" },
              { value: "newest", label: "Newest First" },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setLocal({ ...local, sortBy: opt.value })}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                  local.sortBy === opt.value
                    ? "bg-purple-600/20 text-purple-300 border border-purple-500/30"
                    : "bg-white/5 text-muted-foreground hover:bg-white/8"
                )}
              >
                {opt.label}
                {local.sortBy === opt.value && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <label className="flex items-center justify-between cursor-pointer" onClick={() => setLocal({ ...local, showNewOnly: !local.showNewOnly })}>
            <span className="text-sm text-muted-foreground">Latest batch only</span>
            <div className={cn("w-9 h-5 rounded-full transition-all relative", local.showNewOnly ? "bg-purple-600" : "bg-white/10")}>
              <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", local.showNewOnly ? "left-4.5" : "left-0.5")} />
            </div>
          </label>
          <label className="flex items-center justify-between cursor-pointer" onClick={() => setLocal({ ...local, notifyOnNewBatch: !local.notifyOnNewBatch })}>
            <span className="text-sm text-muted-foreground">Notify on new batch</span>
            <div className={cn("w-9 h-5 rounded-full transition-all relative", local.notifyOnNewBatch ? "bg-purple-600" : "bg-white/10")}>
              <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all", local.notifyOnNewBatch ? "left-4.5" : "left-0.5")} />
            </div>
          </label>
        </div>

        {/* Apply */}
        <button
          onClick={() => { onChange(local); onClose(); }}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl transition-all"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OpportunityRadar() {
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    niche: "furniture",
    priceMin: undefined as number | undefined,
    priceMax: undefined as number | undefined,
    minScore: 0,
    platforms: [] as string[],
    showNewOnly: false,
    sortBy: "opportunity_score" as const,
    pageSize: 12,
  });

  // Queries
  const { data: prefsData } = trpc.opportunityRadar.getPreferences.useQuery();
  const { data: batchData } = trpc.opportunityRadar.getLatestBatch.useQuery({ niche: "furniture" });
  const { data: feedData, isLoading, refetch } = trpc.opportunityRadar.getFeed.useQuery({
    ...filters,
    page,
  });

  // Mutations
  const savePrefs = trpc.opportunityRadar.savePreferences.useMutation();
  const recordInteraction = trpc.opportunityRadar.recordInteraction.useMutation();
  const markBatchSeen = trpc.opportunityRadar.markBatchSeen.useMutation();

  // Sync feed data to local state (for optimistic updates)
  useEffect(() => {
    if (feedData?.items) {
      setLocalItems(feedData.items);
    }
  }, [feedData?.items]);

  // Mark batch as seen when page loads
  useEffect(() => {
    if (batchData?.batch?.id && batchData.hasNewOpportunities) {
      markBatchSeen.mutate({ batchId: batchData.batch.id });
    }
  }, [batchData?.batch?.id]);

  const handleSave = (productId: number) => {
    setLocalItems(prev => prev.map(item =>
      item.id === productId
        ? { ...item, userAction: item.userAction === "saved" ? null : "saved" }
        : item
    ));
    recordInteraction.mutate({ productId, action: "saved" });
    toast.success("Saved to your radar");
  };

  const handleDismiss = (productId: number) => {
    setLocalItems(prev => prev.filter(item => item.id !== productId));
    recordInteraction.mutate({ productId, action: "dismissed" });
    toast("Opportunity dismissed");
  };

  const handleView = (productId: number) => {
    recordInteraction.mutate({ productId, action: "viewed" });
  };

  const handleApplyFilters = (newPrefs: any) => {
    setFilters(prev => ({
      ...prev,
      priceMin: newPrefs.priceRangeMin || undefined,
      priceMax: newPrefs.priceRangeMax || undefined,
      minScore: newPrefs.minOpportunityScore || 0,
      showNewOnly: newPrefs.showNewOnly,
      sortBy: newPrefs.sortBy,
    }));
    setPage(1);
    savePrefs.mutate(newPrefs);
    toast.success("Filters saved");
  };

  const totalPages = feedData?.totalPages || 1;
  const total = feedData?.total || 0;

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">
      <BuyerSidebar />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/8 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg shadow-purple-900/40">
                <Radar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Opportunity Radar</h1>
                <p className="text-xs text-muted-foreground">
                  AI-analyzed products · Furniture & Home Living
                  {total > 0 && <span className="ml-2 text-purple-400">{total} opportunities</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* New batch badge */}
              {batchData?.hasNewOpportunities && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-xs text-purple-300 font-medium">
                    {batchData.newCount} new opportunities
                  </span>
                </div>
              )}

              <button
                onClick={() => refetch()}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white hover:bg-white/8 transition-all"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:text-white hover:bg-white/8 transition-all"
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
              </button>
            </div>
          </div>

          {/* Latest batch info */}
          {batchData?.batch && (
            <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Latest batch: <span className="text-white">{batchData.batch.id}</span></span>
              </div>
              <span>·</span>
              <span>{batchData.batch.productCount} products analyzed</span>
              {batchData.batch.summary && (
                <>
                  <span>·</span>
                  <span className="text-purple-400/80 italic truncate max-w-xs">{batchData.batch.summary}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Empty state */}
          {!isLoading && localItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Radar className="w-8 h-8 text-purple-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No opportunities yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                New products are analyzed and added every 48 hours. Check back soon, or adjust your filters to see more results.
              </p>
              <button
                onClick={() => setFilters(prev => ({ ...prev, minScore: 0, showNewOnly: false }))}
                className="mt-4 px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-300 text-sm rounded-xl hover:bg-purple-600/30 transition-all"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-[#13131a] border border-white/8 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-44 bg-white/5" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-white/5 rounded w-2/3" />
                    <div className="h-4 bg-white/5 rounded" />
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-11 bg-white/5 rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grid */}
          {!isLoading && localItems.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {localItems.map((item) => (
                  <OpportunityCard
                    key={item.id}
                    item={item}
                    onSave={() => handleSave(item.id)}
                    onDismiss={() => handleDismiss(item.id)}
                    onView={() => handleView(item.id)}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-muted-foreground hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          prefs={prefsData}
          onChange={handleApplyFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}
