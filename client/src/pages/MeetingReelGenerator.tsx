import { ArrowLeft, Play, Sparkles, Clock, Smartphone, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function MeetingReelGenerator() {
  const { id } = useParams<{ id: string }>();
  const meetingId = parseInt(id || "1", 10);
  const [, setLocation] = useLocation();

  const [selectedTemplate, setSelectedTemplate] = useState("launch");
  const [duration, setDuration] = useState("30s");
  const [format, setFormat] = useState("9:16");
  const [subtitle, setSubtitle] = useState("dual");
  const [watermark, setWatermark] = useState(true);
  const [bgm, setBgm] = useState("tech");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  // tRPC queries
  const { data: meeting, isLoading } = trpc.meetings.byId.useQuery({ id: meetingId });

  // tRPC mutations
  const generateClipsMutation = trpc.reel.generateMeetingClips.useMutation({
    onSuccess: (_data) => {
      toast.success("Reel generated successfully!");
      setIsGenerating(false);
      setGenerated(true);
    },
    onError: (err) => {
      toast.error("Failed to generate reel: " + err.message);
      setIsGenerating(false);
    },
  });

  const templates = [
    { id: "launch", name: "Product Launch", icon: "🚀", color: "from-purple-500 to-blue-500" },
    { id: "strength", name: "Factory Showcase", icon: "🏭", color: "from-orange-500 to-yellow-500" },
    { id: "qa", name: "Q&A Highlights", icon: "💬", color: "from-green-500 to-cyan-500" },
    { id: "data", name: "Data Driven", icon: "📊", color: "from-pink-500 to-rose-500" },
  ];

  const factoryName = meeting?.factory?.name ?? "Factory";
  const buyerName = meeting?.buyer?.name ?? "Buyer";
  const transcripts = meeting?.transcripts ?? [];

  const highlights = transcripts.length > 0
    ? transcripts.slice(0, 3).map((t: any) => ({
        time: t.createdAt ? new Date(t.createdAt).toLocaleTimeString() : "00:00:00",
        label: t.content ?? "Key moment",
        icon: "🎯",
      }))
    : [
        { time: "00:05:23", label: "Product first shown", icon: "🎯" },
        { time: "00:12:45", label: "Price negotiation", icon: "💰" },
        { time: "00:18:30", label: "Factory tour", icon: "🏭" },
      ];

  const handleGenerate = () => {
    setIsGenerating(true);
    generateClipsMutation.mutate({
      meetingId,
      template: selectedTemplate,
      duration,
      format,
      subtitle,
      watermark,
      bgm,
    });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]">
      {/* 顶部栏 */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#0F0F23]/80 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation(`/meeting-detail/${meetingId}`)}
            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-semibold">AI Meeting Reel Generator</h1>
            <p className="text-sm text-gray-400">
              {meeting?.title ?? "Meeting"} — {factoryName} x {buyerName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-purple-400 font-semibold">AI Auto Edit</span>
        </div>
      </div>

      <div className="pt-16 flex h-screen">
        {/* 左侧：会议素材预览 */}
        <div className="flex-1 p-6">
          <div className="h-full flex flex-col gap-4">
            {/* 视频预览 */}
            <div className="flex-1 bg-black/50 rounded-xl overflow-hidden relative border border-purple-500/20">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    {generated ? (
                      <CheckCircle className="w-16 h-16 text-white" />
                    ) : (
                      <Play className="w-16 h-16 text-white" />
                    )}
                  </div>
                  <p className="text-white text-lg font-semibold mb-2">
                    {generated ? "Reel Generated!" : "Meeting Recording"}
                  </p>
                  <p className="text-gray-400 text-sm">{factoryName} x {buyerName}</p>
                  {meeting?.durationMinutes && (
                    <p className="text-purple-400 text-xs mt-1">Duration: {meeting.durationMinutes} min</p>
                  )}
                </div>
              </div>
              <div className="absolute top-4 left-4 px-4 py-2 bg-black/70 backdrop-blur-xl rounded-lg border border-white/20">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-mono">
                    {meeting?.durationMinutes
                      ? `${String(Math.floor(meeting.durationMinutes / 60)).padStart(2, "0")}:${String(meeting.durationMinutes % 60).padStart(2, "0")}:00`
                      : "00:00:00"}
                  </span>
                </div>
              </div>
            </div>

            {/* 音频波形可视化 */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
              <h3 className="text-white font-semibold mb-3">Audio Waveform</h3>
              <div className="h-24 bg-black/30 rounded-lg flex items-end justify-around px-2 gap-1">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                    style={{ height: `${20 + Math.sin(i * 0.5) * 40 + Math.cos(i * 0.3) * 30}%` }}
                  />
                ))}
              </div>
            </div>

            {/* AI 自动标记高光时刻 */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">AI Key Moments</h3>
                {transcripts.length > 0 && (
                  <span className="text-xs text-green-400 ml-auto">Live from transcript</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {highlights.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-3 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-purple-400 text-xs font-mono">{item.time}</span>
                    </div>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：配置面板 */}
        <div className="w-96 bg-[#0F0F23]/80 backdrop-blur-xl border-l border-purple-500/20 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 模板选择 */}
            <div>
              <h3 className="text-white font-semibold mb-3">Reel Template</h3>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={cn(
                      "p-4 rounded-xl border transition-all",
                      selectedTemplate === template.id
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-white/10 bg-white/5 hover:border-purple-500/30"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl",
                      template.color
                    )}>
                      {template.icon}
                    </div>
                    <p className={cn(
                      "text-sm font-medium",
                      selectedTemplate === template.id ? "text-purple-400" : "text-gray-400"
                    )}>
                      {template.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* 时长 */}
            <div>
              <h3 className="text-white font-semibold mb-3">Duration</h3>
              <div className="flex gap-2">
                {["15s", "30s", "60s"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all",
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

            {/* 格式 */}
            <div>
              <h3 className="text-white font-semibold mb-3">Format</h3>
              <div className="flex gap-2">
                {[{ id: "9:16", label: "9:16 Portrait" }, { id: "16:9", label: "16:9 Landscape" }].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all",
                      format === f.id
                        ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-purple-500/30"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 字幕语言 */}
            <div>
              <h3 className="text-white font-semibold mb-3">Subtitles</h3>
              <div className="flex gap-2">
                {[{ id: "zh", label: "Chinese" }, { id: "en", label: "English" }, { id: "dual", label: "Bilingual" }].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSubtitle(lang.id)}
                    className={cn(
                      "flex-1 py-3 rounded-lg border transition-all",
                      subtitle === lang.id
                        ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-purple-500/30"
                    )}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 品牌水印 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Brand Watermark</h3>
                <button
                  onClick={() => setWatermark(!watermark)}
                  className={cn("w-12 h-6 rounded-full transition-all", watermark ? "bg-purple-500" : "bg-white/20")}
                >
                  <div className={cn("w-5 h-5 bg-white rounded-full transition-transform", watermark ? "translate-x-6" : "translate-x-0.5")} />
                </button>
              </div>
            </div>

            {/* BGM 风格 */}
            <div>
              <h3 className="text-white font-semibold mb-3">Background Music</h3>
              <div className="space-y-2">
                {[
                  { id: "tech", label: "Tech Vibe", icon: "🎵" },
                  { id: "light", label: "Upbeat", icon: "🎶" },
                  { id: "business", label: "Corporate", icon: "🎼" },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setBgm(style.id)}
                    className={cn(
                      "w-full py-3 px-4 rounded-lg border transition-all flex items-center gap-3",
                      bgm === style.id
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-white/10 bg-white/5 hover:border-purple-500/30"
                    )}
                  >
                    <span className="text-2xl">{style.icon}</span>
                    <span className={bgm === style.id ? "text-purple-400" : "text-gray-400"}>{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 预览效果 */}
            <div>
              <h3 className="text-white font-semibold mb-3">Preview</h3>
              <div className="bg-black/50 rounded-xl p-4 border border-purple-500/20">
                <div className="w-32 mx-auto aspect-[9/16] bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-12 h-12 text-purple-400" />
                </div>
                <p className="text-center text-gray-400 text-sm mt-3">Portrait preview</p>
              </div>
            </div>
          </div>

          {/* 底部生成按钮 */}
          <div className="p-6 border-t border-white/10 space-y-3">
            {generated ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Reel Generated!</span>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  onClick={() => setLocation(`/meeting-detail/${meetingId}`)}
                >
                  View in Meeting Detail
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white py-6 text-lg font-semibold"
                onClick={handleGenerate}
                disabled={isGenerating || generateClipsMutation.isPending}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Meeting Reel
                  </>
                )}
              </Button>
            )}
            <p className="text-center text-gray-400 text-sm">
              <Clock className="w-4 h-4 inline mr-1" />
              Estimated time: ~2 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
