import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Sparkles, Save, Send, Check, ChevronDown, Volume2,
  Subtitles, Music, Share2, Play, Pause, Smartphone, Monitor,
  Twitter, Linkedin, TrendingUp, RefreshCw, Copy, Hash
} from "lucide-react";

interface Clip {
  id: number;
  start: string;
  end: string;
  label: string;
  score: number;
  selected: boolean;
  waveform: number[];
}

const MOCK_CLIPS: Clip[] = [
  {
    id: 1, start: "00:05", end: "00:35", label: "Product Highlight", score: 95, selected: true,
    waveform: [20, 45, 30, 60, 80, 55, 70, 40, 65, 85, 50, 75, 30, 55, 70, 45, 60, 80, 35, 65]
  },
  {
    id: 2, start: "01:15", end: "01:45", label: "Price Reveal", score: 88, selected: false,
    waveform: [35, 55, 70, 45, 60, 80, 40, 65, 50, 75, 30, 55, 70, 45, 60, 80, 35, 65, 50, 40]
  },
  {
    id: 3, start: "02:50", end: "03:20", label: "Factory Tour", score: 82, selected: false,
    waveform: [50, 65, 40, 75, 55, 70, 45, 60, 80, 35, 65, 50, 40, 70, 55, 45, 60, 75, 30, 55]
  },
];

const BGM_OPTIONS = [
  "Tech Electronic", "Corporate Upbeat", "Ambient Chill", "Energetic Pop", "Minimal Piano"
];

const FONTS = ["Inter", "Poppins", "Montserrat", "Roboto", "Playfair Display"];

const PLATFORMS = [
  { id: "tiktok", label: "TikTok", icon: "🎵", color: "bg-black border-white/20" },
  { id: "linkedin", label: "LinkedIn", icon: "💼", color: "bg-blue-900/30 border-blue-500/30" },
  { id: "twitter", label: "Twitter", icon: "🐦", color: "bg-sky-900/30 border-sky-500/30" },
];

export default function AIReelEditor() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [clips, setClips] = useState<Clip[]>(MOCK_CLIPS);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [selectedBGM, setSelectedBGM] = useState("Tech Electronic");
  const [volume, setVolume] = useState(60);
  const [aiCopy, setAiCopy] = useState(
    "🎧 Discover the future of audio! Our ANC 3.0 Headphones deliver crystal-clear sound with industry-leading noise cancellation. Perfect for professionals and audiophiles alike. MOQ: 100 units | Factory-direct pricing from $45/unit"
  );
  const [hashtags] = useState(["#ConsumerElectronics", "#B2BSourcing", "#Headphones", "#FactoryDirect", "#RealSourcing", "#ANC"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["tiktok", "linkedin"]);
  const [previewFormat, setPreviewFormat] = useState<"mobile" | "desktop">("mobile");
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(false);

  const toggleClip = (clipId: number) => {
    setClips((prev) => prev.map((c) => c.id === clipId ? { ...c, selected: !c.selected } : c));
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  const handleGenerateCopy = async () => {
    setIsGeneratingCopy(true);
    await new Promise((r) => setTimeout(r, 2000));
    setAiCopy("🚀 Factory-direct audio excellence! Our ANC 3.0 Headphones combine premium sound quality with advanced noise cancellation technology. Trusted by 500+ global buyers. Get factory pricing starting at $45/unit with MOQ of just 100 units. Connect with us on RealSourcing today!");
    setIsGeneratingCopy(false);
    toast.success("AI copy regenerated!");
  };

  const handleSaveDraft = () => {
    toast.success("Draft saved successfully!");
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }
    setIsPublishing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsPublishing(false);
    toast.success(`Reel published to ${selectedPlatforms.join(", ")}!`);
    setLocation(`/webinar/${id}`);
  };

  const selectedClips = clips.filter((c) => c.selected);
  const totalDuration = selectedClips.length * 30;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between px-6 py-4 bg-black/60 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-4">
          <button onClick={() => setLocation(`/webinar/${id}`)} className="text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Reel Editor
            </h1>
            <p className="text-xs text-muted-foreground">Webinar #{id} · {selectedClips.length} clips selected · ~{totalDuration}s</p>
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
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Publishing...</>
            ) : (
              <><Send className="w-4 h-4" />Publish Now</>
            )}
          </Button>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* 左侧预览 */}
        <div className="w-72 flex flex-col items-center justify-center bg-black/30 border-r border-white/10 p-6">
          {/* 格式切换 */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setPreviewFormat("mobile")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                previewFormat === "mobile" ? "bg-purple-600 text-white" : "bg-white/10 text-muted-foreground hover:text-white"
              )}
            >
              <Smartphone className="w-3.5 h-3.5" />
              9:16
            </button>
            <button
              onClick={() => setPreviewFormat("desktop")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                previewFormat === "desktop" ? "bg-purple-600 text-white" : "bg-white/10 text-muted-foreground hover:text-white"
              )}
            >
              <Monitor className="w-3.5 h-3.5" />
              16:9
            </button>
          </div>

          {/* 手机预览框 */}
          <div className={cn(
            "relative bg-black rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl",
            previewFormat === "mobile" ? "w-44 h-80" : "w-64 h-40"
          )}>
            {/* 视频内容 */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-900/30 via-black to-black flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🎧</div>
                <p className="text-white text-xs font-semibold px-2">ANC 3.0 Headphones</p>
                <p className="text-purple-400 text-xs font-bold mt-1">$45/unit</p>
              </div>
            </div>

            {/* 字幕叠加 */}
            {showSubtitles && (
              <div className="absolute bottom-8 left-0 right-0 px-3">
                <div className="bg-black/70 rounded px-2 py-1 text-center">
                  <p className="text-white text-[10px]" style={{ fontFamily: selectedFont }}>
                    "Discover the future of audio..."
                  </p>
                </div>
              </div>
            )}

            {/* 播放按钮 */}
            <button
              onClick={() => setPreviewPlaying(!previewPlaying)}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-all"
            >
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                {previewPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
              </div>
            </button>

            {/* TikTok 风格 UI 元素 */}
            {previewFormat === "mobile" && (
              <div className="absolute right-2 bottom-16 flex flex-col gap-3 items-center">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Share2 className="w-4 h-4 text-white" />
                </div>
              </div>
            )}
          </div>

          {/* 平台预览标签 */}
          <div className="flex gap-2 mt-4">
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreviewFormat("mobile")}
                className={cn(
                  "px-2 py-1 rounded text-xs border transition-all",
                  selectedPlatforms.includes(p.id) ? "border-purple-500 text-purple-300 bg-purple-600/10" : "border-white/15 text-muted-foreground"
                )}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 右侧编辑面板 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI 推荐片段 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Recommended Clips
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
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400 text-xs font-semibold">{clip.score}% match</span>
                    </div>
                  </div>
                  {/* 波形图 */}
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
                onClick={handleGenerateCopy}
                disabled={isGeneratingCopy}
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-600/10 gap-1.5 h-7 text-xs"
              >
                {isGeneratingCopy ? (
                  <><span className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />Generating...</>
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
            {/* Hashtags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {hashtags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-purple-600/20 border border-purple-500/30 rounded-full text-xs text-purple-300 flex items-center gap-1">
                  <Hash className="w-2.5 h-2.5" />
                  {tag.replace("#", "")}
                </span>
              ))}
            </div>
            <button
              onClick={() => { navigator.clipboard.writeText(aiCopy + "\n\n" + hashtags.join(" ")); toast.success("Copied to clipboard!"); }}
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

// 缺少的 Heart icon
function Heart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
