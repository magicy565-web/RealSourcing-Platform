import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Sparkles, Save, Send, Check, Volume2,
  Subtitles, Music, Share2, Play, Pause, Smartphone, Monitor,
  RefreshCw, Copy, Hash, TrendingUp, Loader2, AlertCircle,
} from "lucide-react";

// ── 类型定义 ──────────────────────────────────────────────────────────────────

interface Clip {
  id: number;
  start: string;
  end: string;
  label: string;
  score: number;
  selected: boolean;
  waveform: number[];
  category?: string;
  importance?: string;
}

interface ReelScript {
  hook: string;
  segments: Array<{
    timeRange: string;
    visual: string;
    voiceover: string;
    text: string;
  }>;
  cta: string;
  hashtags: string[];
}

// ── 常量 ──────────────────────────────────────────────────────────────────────

const MOCK_CLIPS: Clip[] = [
  {
    id: 1, start: "00:05", end: "00:35", label: "Product Highlight", score: 95, selected: true,
    waveform: [20, 45, 30, 60, 80, 55, 70, 40, 65, 85, 50, 75, 30, 55, 70, 45, 60, 80, 35, 65],
    category: "product", importance: "high",
  },
  {
    id: 2, start: "01:15", end: "01:45", label: "Price Reveal", score: 88, selected: false,
    waveform: [35, 55, 70, 45, 60, 80, 40, 65, 50, 75, 30, 55, 70, 45, 60, 80, 35, 65, 50, 40],
    category: "price", importance: "high",
  },
  {
    id: 3, start: "02:50", end: "03:20", label: "Factory Tour", score: 82, selected: false,
    waveform: [50, 65, 40, 75, 55, 70, 45, 60, 80, 35, 65, 50, 40, 70, 55, 45, 60, 75, 30, 55],
    category: "general", importance: "medium",
  },
];

const BGM_OPTIONS = [
  "Tech Electronic", "Corporate Upbeat", "Ambient Chill", "Energetic Pop", "Minimal Piano"
];

const FONTS = ["Inter", "Poppins", "Montserrat", "Roboto", "Playfair Display"];

const PLATFORMS = [
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "twitter", label: "Twitter", icon: "🐦" },
];

const REEL_STYLES = ["科技感", "温暖专业", "活力动感", "简约商务"];
const REEL_TYPES = ["产品发布", "工厂实力", "Q&A 精华", "数据驱动"];

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function AIReelEditor() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  // 片段状态
  const [clips, setClips] = useState<Clip[]>(MOCK_CLIPS);

  // 编辑器设置
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [selectedBGM, setSelectedBGM] = useState("Tech Electronic");
  const [volume, setVolume] = useState(60);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["tiktok", "linkedin"]);
  const [previewFormat, setPreviewFormat] = useState<"mobile" | "desktop">("mobile");
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [reelStyle, setReelStyle] = useState("科技感");
  const [reelType, setReelType] = useState("产品发布");
  const [duration, setDuration] = useState(30);

  // AI 脚本状态
  const [aiScript, setAiScript] = useState<ReelScript | null>(null);
  const [aiCopy, setAiCopy] = useState(
    "🎧 Discover the future of audio! Our ANC 3.0 Headphones deliver crystal-clear sound with industry-leading noise cancellation. MOQ: 100 units | Factory-direct pricing from $45/unit"
  );
  const [hashtags, setHashtags] = useState([
    "#ConsumerElectronics", "#B2BSourcing", "#Headphones", "#FactoryDirect", "#RealSourcing",
  ]);
  const [isPublishing, setIsPublishing] = useState(false);

  // ── tRPC 调用 ──────────────────────────────────────────────────────────────

  const meetingId = id ? parseInt(id, 10) : null;

  // 获取会议高光片段（真实数据）
  const identifyHighlightsMutation = trpc.ai.identifyReelHighlights.useMutation({
    onSuccess: (data) => {
      if (data.highlights && data.highlights.length > 0) {
        const realClips: Clip[] = data.highlights.map((h, idx) => ({
          id: idx + 1,
          start: h.startTime,
          end: h.endTime,
          label: h.title,
          score: h.importance === "high" ? 90 + idx : h.importance === "medium" ? 75 + idx : 60 + idx,
          selected: h.importance === "high",
          waveform: Array.from({ length: 20 }, () => Math.floor(Math.random() * 70) + 20),
          category: h.category,
          importance: h.importance,
        }));
        setClips(realClips);
        toast.success(`AI 识别出 ${realClips.length} 个高光片段！`);
      }
    },
    onError: (err) => {
      toast.error("高光片段识别失败：" + err.message);
    },
  });

  // 生成 AI 脚本（真实后端调用）
  const generateScriptMutation = trpc.ai.generateReelScript.useMutation({
    onSuccess: (data) => {
      if (data.script) {
        setAiScript(data.script);
        // 将脚本的 hook 和 cta 填充到文案区域
        const copy = `${data.script.hook}\n\n${data.script.cta}`;
        setAiCopy(copy);
        if (data.script.hashtags && data.script.hashtags.length > 0) {
          setHashtags(data.script.hashtags.map((t: string) => t.startsWith("#") ? t : `#${t}`));
        }
        toast.success("AI 脚本生成成功！");
      } else {
        toast.warning("脚本生成完成，但格式异常，请重试。");
      }
    },
    onError: (err) => {
      toast.error("脚本生成失败：" + err.message);
    },
  });

  // 自动识别高光片段（如果有 meetingId）
  useEffect(() => {
    if (meetingId && !isNaN(meetingId)) {
      identifyHighlightsMutation.mutate({
        meetingId,
        targetDurationSeconds: duration,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId]);

  // ── 事件处理 ──────────────────────────────────────────────────────────────

  const toggleClip = (clipId: number) => {
    setClips((prev) => prev.map((c) => c.id === clipId ? { ...c, selected: !c.selected } : c));
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  const handleGenerateScript = () => {
    if (!meetingId || isNaN(meetingId)) {
      toast.error("无法获取会议 ID，请从会议详情页进入");
      return;
    }
    const selectedClipsList = clips.filter((c) => c.selected);
    if (selectedClipsList.length === 0) {
      toast.error("请至少选择一个高光片段");
      return;
    }
    generateScriptMutation.mutate({
      meetingId,
      highlights: selectedClipsList.map((c) => ({
        title: c.label,
        startTime: c.start,
        endTime: c.end,
        description: `${c.label} segment (${c.importance || "medium"} importance)`,
        category: c.category,
        importance: c.importance,
      })),
      style: reelStyle,
      duration,
      reelType,
    });
  };

  const handleSaveDraft = () => {
    toast.success("草稿已保存！");
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("请至少选择一个发布平台");
      return;
    }
    setIsPublishing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsPublishing(false);
    toast.success(`Reel 已发布到 ${selectedPlatforms.join(", ")}！`);
    if (id) setLocation(`/meeting-detail/${id}`);
  };

  const selectedClips = clips.filter((c) => c.selected);
  const totalDuration = selectedClips.reduce((sum, c) => {
    const toSec = (t: string) => {
      const parts = t.split(":").map(Number);
      return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
    };
    return sum + Math.abs(toSec(c.end) - toSec(c.start));
  }, 0);

  const isGeneratingScript = generateScriptMutation.isPending;
  const isLoadingHighlights = identifyHighlightsMutation.isPending;

  // ── 渲染 ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between px-6 py-4 bg-black/60 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation(meetingId ? `/meeting-detail/${meetingId}` : "/meetings")}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Reel Editor
            </h1>
            <p className="text-xs text-muted-foreground">
              Meeting #{id} · {selectedClips.length} clips · ~{totalDuration}s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSaveDraft} className="border-white/20 hover:bg-white/10 gap-2">
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 gap-2 shadow-lg shadow-purple-600/30"
          >
            {isPublishing ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Publishing...</>
            ) : (
              <><Send className="w-4 h-4" />Publish Now</>
            )}
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* 左侧预览 */}
        <div className="w-72 flex flex-col items-center justify-center bg-black/30 border-r border-white/10 p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setPreviewFormat("mobile")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                previewFormat === "mobile" ? "bg-purple-600 text-white" : "bg-white/10 text-muted-foreground hover:text-white"
              )}
            >
              <Smartphone className="w-3.5 h-3.5" />9:16
            </button>
            <button
              onClick={() => setPreviewFormat("desktop")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                previewFormat === "desktop" ? "bg-purple-600 text-white" : "bg-white/10 text-muted-foreground hover:text-white"
              )}
            >
              <Monitor className="w-3.5 h-3.5" />16:9
            </button>
          </div>

          <div className={cn(
            "relative bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl",
            previewFormat === "mobile" ? "w-44 h-80" : "w-64 h-40"
          )}>
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black to-black flex items-center justify-center">
              <div className="text-center px-3">
                {aiScript ? (
                  <>
                    <div className="text-2xl mb-2">✨</div>
                    <p className="text-white text-xs font-semibold leading-tight">{aiScript.hook.slice(0, 60)}...</p>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-2">🎬</div>
                    <p className="text-white text-xs font-semibold">Select clips & generate script</p>
                  </>
                )}
              </div>
            </div>

            {showSubtitles && aiScript && (
              <div className="absolute bottom-8 left-0 right-0 px-3">
                <div className="bg-black/70 rounded px-2 py-1 text-center">
                  <p className="text-white text-[10px]" style={{ fontFamily: selectedFont }}>
                    {aiScript.segments[0]?.text?.slice(0, 40) || "AI generated caption..."}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => setPreviewPlaying(!previewPlaying)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all"
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                {previewPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
              </div>
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => togglePlatform(p.id)}
                className={cn(
                  "px-2 py-1 rounded text-xs border transition-all",
                  selectedPlatforms.includes(p.id)
                    ? "border-purple-500 text-purple-300 bg-purple-600/10"
                    : "border-white/15 text-muted-foreground"
                )}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 右侧编辑面板 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* AI 脚本生成控制区 */}
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Script Generation
              </h3>
              {aiScript && (
                <Badge className="bg-emerald-600/20 text-emerald-300 text-xs border border-emerald-500/30">
                  ✅ Script Ready
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Reel 类型</label>
                <select
                  value={reelType}
                  onChange={(e) => setReelType(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {REEL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">视觉风格</label>
                <select
                  value={reelStyle}
                  onChange={(e) => setReelStyle(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {REEL_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-xs text-slate-400 whitespace-nowrap">时长目标</label>
              <input
                type="range"
                min={15}
                max={60}
                step={5}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-sm text-white w-10 text-right">{duration}s</span>
            </div>
            <Button
              onClick={handleGenerateScript}
              disabled={isGeneratingScript || selectedClips.length === 0}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 gap-2"
            >
              {isGeneratingScript ? (
                <><Loader2 className="w-4 h-4 animate-spin" />AI 正在生成脚本...</>
              ) : (
                <><Sparkles className="w-4 h-4" />Generate AI Script ({selectedClips.length} clips)</>
              )}
            </Button>
            {generateScriptMutation.isError && (
              <div className="mt-2 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>脚本生成失败，请重试</span>
              </div>
            )}
          </div>

          {/* AI 推荐片段 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Recommended Clips
                {isLoadingHighlights && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
              </h3>
              <Badge className="bg-purple-600/20 text-purple-300 text-xs">
                {selectedClips.length} selected
              </Badge>
            </div>
            <div className="space-y-3">
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => toggleClip(clip.id)}
                  className={cn(
                    "relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                    clip.selected
                      ? "bg-purple-900/30 border-purple-500 shadow-sm shadow-purple-600/20"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                        clip.selected ? "bg-purple-600 border-purple-600" : "border-white/30"
                      )}>
                        {clip.selected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <span className="font-semibold text-sm">{clip.start} – {clip.end}</span>
                        <span className="text-muted-foreground text-xs ml-2">{clip.label}</span>
                        {clip.importance === "high" && (
                          <span className="ml-2 text-xs text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">🔥 核心</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400 text-xs font-semibold">{clip.score}% match</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-0.5 h-8">
                    {clip.waveform.map((h, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 rounded-sm transition-all",
                          clip.selected ? "bg-purple-500/60" : "bg-white/20"
                        )}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI 生成的脚本预览 */}
          {aiScript && (
            <div className="bg-white/5 rounded-xl p-4 border border-purple-500/30">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Generated Script
              </h3>
              <div className="space-y-2 text-sm">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-xs text-yellow-400 font-semibold mb-1">🎣 HOOK (0-3s)</p>
                  <p className="text-white">{aiScript.hook}</p>
                </div>
                {aiScript.segments.slice(0, 3).map((seg, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-xs text-slate-400 font-semibold mb-1">📽️ {seg.timeRange}</p>
                    <p className="text-white text-xs">{seg.text || seg.voiceover}</p>
                  </div>
                ))}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <p className="text-xs text-emerald-400 font-semibold mb-1">📣 CTA</p>
                  <p className="text-white">{aiScript.cta}</p>
                </div>
              </div>
            </div>
          )}

          {/* 字幕设置 */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Subtitles className="w-4 h-4 text-blue-400" />
              Subtitles
            </h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Show Subtitles</span>
              <button
                onClick={() => setShowSubtitles(!showSubtitles)}
                className={cn(
                  "w-10 h-6 rounded-full transition-all duration-200 relative",
                  showSubtitles ? "bg-purple-600" : "bg-white/20"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200",
                  showSubtitles ? "left-5" : "left-1"
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Font</span>
              <select
                value={selectedFont}
                onChange={(e) => setSelectedFont(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* BGM */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Music className="w-4 h-4 text-green-400" />
              Background Music
            </h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Track</span>
              <select
                value={selectedBGM}
                onChange={(e) => setSelectedBGM(e.target.value)}
                className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {BGM_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <Volume2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="text-sm text-muted-foreground w-8 text-right">{volume}%</span>
            </div>
          </div>

          {/* AI 文案 */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                AI Copywriting
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerateScript}
                disabled={isGeneratingScript || selectedClips.length === 0}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-600/10 gap-1.5 h-7 text-xs"
              >
                {isGeneratingScript ? (
                  <><Loader2 className="w-3 h-3 animate-spin" />Generating...</>
                ) : (
                  <><RefreshCw className="w-3 h-3" />Regenerate</>
                )}
              </Button>
            </div>
            <textarea
              value={aiCopy}
              onChange={(e) => setAiCopy(e.target.value)}
              rows={4}
              className="w-full bg-white/5 border border-white/15 rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:border-purple-500 placeholder:text-muted-foreground"
            />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {hashtags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-purple-600/20 border border-purple-500/30 rounded-full text-xs text-purple-300 flex items-center gap-1">
                  <Hash className="w-2.5 h-2.5" />
                  {tag.replace("#", "")}
                </span>
              ))}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(aiCopy + "\n\n" + hashtags.join(" "));
                toast.success("Copied to clipboard!");
              }}
              className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy caption + hashtags
            </button>
          </div>

          {/* 发布平台 */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-pink-400" />
              Publish To
            </h3>
            <div className="space-y-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200",
                    selectedPlatforms.includes(platform.id)
                      ? "bg-purple-600/10 border-purple-500"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{platform.icon}</span>
                    <span className="font-medium">{platform.label}</span>
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                    selectedPlatforms.includes(platform.id) ? "bg-purple-600 border-purple-600" : "border-white/30"
                  )}>
                    {selectedPlatforms.includes(platform.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
