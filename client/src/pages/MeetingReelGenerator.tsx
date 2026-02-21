import {
  ArrowLeft, Play, Sparkles, Clock, Smartphone, Loader2,
  CheckCircle, Zap, TrendingUp, DollarSign, Package, MessageSquare,
  Download, Share2, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReelHighlight {
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
  category: "price" | "product" | "quality" | "logistics" | "general";
  selected?: boolean;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  price:     { icon: <DollarSign className="w-4 h-4" />, color: "text-green-400 bg-green-400/10 border-green-500/30",    label: "Price" },
  product:   { icon: <Package className="w-4 h-4" />,    color: "text-blue-400 bg-blue-400/10 border-blue-500/30",       label: "Product" },
  quality:   { icon: <CheckCircle className="w-4 h-4" />, color: "text-amber-400 bg-amber-400/10 border-amber-500/30",   label: "Quality" },
  logistics: { icon: <TrendingUp className="w-4 h-4" />,  color: "text-purple-400 bg-purple-400/10 border-purple-500/30", label: "Logistics" },
  general:   { icon: <MessageSquare className="w-4 h-4" />, color: "text-gray-400 bg-gray-400/10 border-gray-500/30",    label: "General" },
};

const IMPORTANCE_COLOR: Record<string, string> = {
  high:   "bg-red-500/20 border-red-500/40 text-red-400",
  medium: "bg-amber-500/20 border-amber-500/40 text-amber-400",
  low:    "bg-gray-500/20 border-gray-500/40 text-gray-400",
};

const TEMPLATES = [
  { id: "launch",   name: "Product Launch",   icon: "🚀", color: "from-purple-500 to-blue-500" },
  { id: "strength", name: "Factory Showcase", icon: "🏭", color: "from-orange-500 to-yellow-500" },
  { id: "qa",       name: "Q&A Highlights",   icon: "💬", color: "from-green-500 to-cyan-500" },
  { id: "data",     name: "Data Driven",      icon: "📊", color: "from-pink-500 to-rose-500" },
];

export default function MeetingReelGenerator() {
  const { id } = useParams<{ id: string }>();
  const meetingId = parseInt(id || "1", 10);
  const [, setLocation] = useLocation();

  const [selectedTemplate, setSelectedTemplate] = useState("launch");
  const [duration, setDuration] = useState<"15s" | "30s" | "60s">("30s");
  const [format, setFormat] = useState<"9:16" | "16:9">("9:16");
  const [highlights, setHighlights] = useState<ReelHighlight[]>([]);
  const [aiAnalyzed, setAiAnalyzed] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const { data: meeting, isLoading } = trpc.meetings.byId.useQuery({ id: meetingId });

  // AI 识别关键时刻
  const identifyHighlightsMutation = trpc.ai.identifyReelHighlights.useMutation({
    onSuccess: (data) => {
      const durationMap = { "15s": 15, "30s": 30, "60s": 60 };
      const targetSecs = durationMap[duration];
      const withSelected = data.highlights.map((h, i) => ({
        ...h,
        selected: i < Math.ceil(targetSecs / 15), // 自动选中前几个
      }));
      setHighlights(withSelected);
      setAiAnalyzed(true);
      toast.success(`AI identified ${data.highlights.length} key moments!`);
    },
    onError: (err) => {
      toast.error("AI analysis failed: " + err.message);
      // 使用 fallback 高光
      setHighlights(getFallbackHighlights());
      setAiAnalyzed(true);
    },
  });

  // 生成 AI 摘要（同时触发）
  const generateSummaryMutation = trpc.ai.generateMeetingSummary.useMutation({
    onSuccess: () => {
      toast.success("AI summary saved to meeting details!");
    },
  });

  // 生成 Reel（调用后端 reel 路由）
  const generateReelMutation = trpc.reel.generateMeetingClips.useMutation({
    onSuccess: () => {
      setGenerated(true);
      toast.success("Meeting Reel generated successfully!");
    },
    onError: (err) => {
      toast.error("Reel generation failed: " + err.message);
    },
  });

  function getFallbackHighlights(): ReelHighlight[] {
    const transcripts = meeting?.transcripts ?? [];
    if (transcripts.length > 0) {
      return transcripts.slice(0, 4).map((t: any, i: number) => ({
        startTime: `00:0${i * 5}:00`,
        endTime: `00:0${i * 5 + 3}:00`,
        title: ["Product Showcase", "Price Discussion", "Quality Standards", "Delivery Terms"][i] || "Key Moment",
        description: (t.content as string)?.slice(0, 80) || "Important meeting moment",
        importance: (["high", "medium", "medium", "low"] as const)[i] || "medium",
        category: (["product", "price", "quality", "logistics"] as const)[i] || "general",
        selected: i < 2,
      }));
    }
    return [
      { startTime: "00:05:23", endTime: "00:05:53", title: "Product First Shown", description: "Factory demonstrates key product features", importance: "high", category: "product", selected: true },
      { startTime: "00:12:45", endTime: "00:13:15", title: "Price Negotiation", description: "Buyer and factory discuss unit pricing", importance: "high", category: "price", selected: true },
      { startTime: "00:18:30", endTime: "00:19:00", title: "Quality Standards", description: "CE/FCC certification requirements discussed", importance: "medium", category: "quality", selected: false },
      { startTime: "00:24:10", endTime: "00:24:40", title: "Lead Time Confirmed", description: "30-day delivery timeline agreed", importance: "medium", category: "logistics", selected: false },
    ];
  }

  const handleAnalyzeWithAI = () => {
    const durationMap = { "15s": 15, "30s": 30, "60s": 60 };
    identifyHighlightsMutation.mutate({
      meetingId,
      targetDurationSeconds: durationMap[duration],
    });
    // 同时生成摘要
    generateSummaryMutation.mutate({ meetingId });
  };

  const handleGenerate = () => {
    generateReelMutation.mutate({
      meetingId,
      template: selectedTemplate,
      duration,
      format,
      subtitle: "dual",
      watermark: true,
      bgm: "tech",
    });
  };

  const toggleHighlight = (index: number) => {
    setHighlights(prev => prev.map((h, i) => i === index ? { ...h, selected: !h.selected } : h));
  };

  const selectedHighlights = highlights.filter(h => h.selected);
  const factoryName = meeting?.factory?.name ?? "Factory";
  const buyerName = meeting?.buyer?.name ?? "Buyer";
  const transcriptCount = (meeting?.transcripts ?? []).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading meeting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E] text-white">
      {/* ── Top Bar ── */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#0F0F23]/80 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation(`/meeting-detail/${meetingId}`)}
            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              AI Meeting Reel Generator
            </h1>
            <p className="text-xs text-gray-400">
              {meeting?.title ?? "Meeting"} · {factoryName} × {buyerName}
              {transcriptCount > 0 && (
                <span className="ml-2 text-green-400">· {transcriptCount} transcript segments</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {aiAnalyzed && (
            <Badge className="bg-green-500/20 border border-green-500/40 text-green-400 text-xs">
              <Zap className="w-3 h-3 mr-1" />
              AI Analyzed
            </Badge>
          )}
          {generated && (
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-gray-300 hover:bg-white/10 gap-1.5 h-8"
            >
              <Download className="w-3.5 h-3.5" />
              Download Reel
            </Button>
          )}
        </div>
      </div>

      <div className="pt-16 flex h-screen">
        {/* ── Left: Preview + Key Moments ── */}
        <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
          {/* Video Preview */}
          <div className="bg-black/50 rounded-xl overflow-hidden relative border border-purple-500/20" style={{ aspectRatio: format === "9:16" ? "9/16" : "16/9", maxHeight: "320px" }}>
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-purple-900/20 via-black/50 to-black/80">
              <div className="text-center">
                <div className={cn(
                  "w-24 h-24 mx-auto mb-3 rounded-full flex items-center justify-center transition-all",
                  generated
                    ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30"
                    : "bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30"
                )}>
                  {generated ? (
                    <CheckCircle className="w-12 h-12 text-white" />
                  ) : (
                    <Play className="w-12 h-12 text-white ml-1" />
                  )}
                </div>
                <p className="text-white font-semibold">
                  {generated ? "Reel Ready!" : "Meeting Recording"}
                </p>
                <p className="text-gray-400 text-sm mt-1">{factoryName} × {buyerName}</p>
                {meeting?.durationMinutes && (
                  <div className="flex items-center justify-center gap-1.5 mt-2 text-purple-400 text-xs">
                    <Clock className="w-3 h-3" />
                    {meeting.durationMinutes} min recording
                  </div>
                )}
              </div>
            </div>
            {/* Format badge */}
            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded-lg text-xs text-white border border-white/20">
              {format} · {duration}
            </div>
          </div>

          {/* AI Key Moments */}
          <div className="bg-white/5 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Key Moments
                {selectedHighlights.length > 0 && (
                  <Badge className="bg-purple-600/20 text-purple-300 text-xs ml-1">
                    {selectedHighlights.length} selected
                  </Badge>
                )}
              </h3>
              {!aiAnalyzed ? (
                <Button
                  size="sm"
                  onClick={handleAnalyzeWithAI}
                  disabled={identifyHighlightsMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-500 text-white h-7 text-xs gap-1.5"
                >
                  {identifyHighlightsMutation.isPending ? (
                    <><Loader2 className="w-3 h-3 animate-spin" />Analyzing...</>
                  ) : (
                    <><Zap className="w-3 h-3" />Analyze with AI</>
                  )}
                </Button>
              ) : (
                <button
                  onClick={handleAnalyzeWithAI}
                  disabled={identifyHighlightsMutation.isPending}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Re-analyze
                </button>
              )}
            </div>

            {highlights.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click "Analyze with AI" to identify key moments</p>
                {transcriptCount > 0 && (
                  <p className="text-xs mt-1 text-green-500">{transcriptCount} transcript segments available for analysis</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {highlights.map((h, i) => {
                  const cat = CATEGORY_CONFIG[h.category] || CATEGORY_CONFIG.general;
                  return (
                    <div
                      key={i}
                      onClick={() => toggleHighlight(i)}
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer transition-all",
                        h.selected
                          ? "bg-purple-900/30 border-purple-500/50"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                            h.selected ? "bg-purple-600 border-purple-600" : "border-white/30"
                          )}>
                            {h.selected && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm text-white">{h.title}</span>
                              <Badge className={cn("text-[10px] px-1.5 py-0 border", cat.color)}>
                                {cat.label}
                              </Badge>
                              <Badge className={cn("text-[10px] px-1.5 py-0 border", IMPORTANCE_COLOR[h.importance])}>
                                {h.importance}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{h.description}</p>
                          </div>
                        </div>
                        <span className="text-xs text-purple-400 font-mono flex-shrink-0">
                          {h.startTime} – {h.endTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Config Panel ── */}
        <div className="w-80 bg-[#0F0F23]/80 backdrop-blur-xl border-l border-purple-500/20 flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Template */}
            <div>
              <h3 className="font-semibold mb-3 text-sm">Reel Template</h3>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all text-center",
                      selectedTemplate === t.id
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-white/10 bg-white/5 hover:border-purple-500/30"
                    )}
                  >
                    <div className={cn("w-10 h-10 mx-auto mb-1.5 rounded-xl bg-gradient-to-br flex items-center justify-center text-xl", t.color)}>
                      {t.icon}
                    </div>
                    <p className={cn("text-xs font-medium", selectedTemplate === t.id ? "text-purple-400" : "text-gray-400")}>
                      {t.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <h3 className="font-semibold mb-2 text-sm">Duration</h3>
              <div className="flex gap-2">
                {(["15s", "30s", "60s"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg border text-sm transition-all",
                      duration === d
                        ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-purple-500/30"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <h3 className="font-semibold mb-2 text-sm">Format</h3>
              <div className="flex gap-2">
                {([
                  { id: "9:16" as const, label: "9:16 Portrait", icon: <Smartphone className="w-3.5 h-3.5" /> },
                  { id: "16:9" as const, label: "16:9 Landscape", icon: <Play className="w-3.5 h-3.5" /> },
                ]).map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg border text-xs transition-all flex items-center justify-center gap-1.5",
                      format === f.id
                        ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-purple-500/30"
                    )}
                  >
                    {f.icon}
                    {f.id}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Summary Status */}
            {aiAnalyzed && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">AI Analysis Complete</span>
                </div>
                <p className="text-xs text-gray-400">
                  {highlights.length} key moments identified · Meeting summary saved
                </p>
              </div>
            )}

            {/* Selected Summary */}
            {selectedHighlights.length > 0 && (
              <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-3">
                <p className="text-xs text-purple-300 font-medium mb-1">Selected Clips</p>
                <p className="text-xs text-gray-400">
                  {selectedHighlights.length} clips · ~{selectedHighlights.length * 15}s total
                </p>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="p-5 border-t border-white/10 space-y-2">
            {!aiAnalyzed && (
              <Button
                onClick={handleAnalyzeWithAI}
                disabled={identifyHighlightsMutation.isPending}
                variant="outline"
                className="w-full border-purple-500/40 text-purple-300 hover:bg-purple-600/20 gap-2"
              >
                {identifyHighlightsMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Analyzing with AI...</>
                ) : (
                  <><Zap className="w-4 h-4" />Analyze with AI First</>
                )}
              </Button>
            )}
            <Button
              onClick={handleGenerate}
              disabled={generateReelMutation.isPending || generated}
              className={cn(
                "w-full gap-2 font-semibold",
                generated
                  ? "bg-green-600/20 text-green-400 border border-green-500/30"
                  : "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-600/30"
              )}
            >
              {generated ? (
                <><CheckCircle className="w-4 h-4" />Reel Generated!</>
              ) : generateReelMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Generate Reel</>
              )}
            </Button>
            {generated && (
              <Button
                variant="outline"
                className="w-full border-white/20 text-gray-300 hover:bg-white/10 gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share Reel
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
