import {
  ArrowLeft, Play, Sparkles, Clock, Smartphone, Loader2,
  CheckCircle, Zap, TrendingUp, DollarSign, Package, MessageSquare,
  Download, Share2, RefreshCw, Film, Wand2, ChevronRight,
  Scissors, Music, Type, Eye, Star, Flame, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";

// ── 类型定义 ──────────────────────────────────────────────────────────────────

interface ReelHighlight {
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
  category: "price" | "product" | "quality" | "logistics" | "general";
  caption: string;
  emoji: string;
  selected: boolean;
}

interface ReelScript {
  hook: string;
  scenes: { time: string; visual: string; caption: string; voiceover: string }[];
  cta: string;
  hashtags: string[];
  douyinTitle: string;
  wechatCaption: string;
}

// ── 配置常量 ──────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
  price:     { icon: <DollarSign className="w-3.5 h-3.5" />, color: "text-emerald-400", label: "价格谈判", bg: "bg-emerald-400/10 border-emerald-500/30" },
  product:   { icon: <Package className="w-3.5 h-3.5" />,    color: "text-blue-400",    label: "产品展示", bg: "bg-blue-400/10 border-blue-500/30" },
  quality:   { icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-amber-400",  label: "品质认证", bg: "bg-amber-400/10 border-amber-500/30" },
  logistics: { icon: <TrendingUp className="w-3.5 h-3.5" />,  color: "text-purple-400", label: "物流交期", bg: "bg-purple-400/10 border-purple-500/30" },
  general:   { icon: <MessageSquare className="w-3.5 h-3.5" />, color: "text-gray-400", label: "关键对话", bg: "bg-gray-400/10 border-gray-500/30" },
};

const IMPORTANCE_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  high:   { color: "text-red-400 bg-red-500/10 border-red-500/30",   label: "核心高光", icon: <Flame className="w-3 h-3" /> },
  medium: { color: "text-amber-400 bg-amber-500/10 border-amber-500/30", label: "重要片段", icon: <Star className="w-3 h-3" /> },
  low:    { color: "text-gray-400 bg-gray-500/10 border-gray-500/30", label: "辅助内容", icon: <Eye className="w-3 h-3" /> },
};

const TEMPLATES = [
  { id: "launch",   name: "产品发布",   icon: "🚀", color: "from-purple-500 to-blue-500",   desc: "适合新品首发" },
  { id: "strength", name: "工厂实力",   icon: "🏭", color: "from-orange-500 to-yellow-500", desc: "展示生产能力" },
  { id: "qa",       name: "Q&A 精华",   icon: "💬", color: "from-green-500 to-cyan-500",    desc: "买家问答高光" },
  { id: "data",     name: "数据驱动",   icon: "📊", color: "from-pink-500 to-rose-500",     desc: "价格/MOQ 核心" },
];

// ── 示例会议数据 ──────────────────────────────────────────────────────────────

const DEMO_TRANSCRIPT = `[00:02:15] 主持人 Sarah: 欢迎大家来到今天的 RealSourcing 迪拜卖家聚会直播！今天我们有来自广州的 LED 美白面膜仪工厂——光美科技的李总，以及来自迪拜的买家 Ahmed Al-Rashid。

[00:03:30] 李总 (工厂): 我们这款 LED 美白面膜仪是今年的爆款，在 TikTok 上已经有超过 2800 万次播放。产品采用 7 色 LED 光疗技术，CE 和 FCC 认证都已拿到。

[00:05:45] Ahmed (买家): 这个产品我在 TikTok 上看到过！请问 MOQ 是多少？单价大概是什么范围？

[00:06:20] 李总: MOQ 是 500 件起，500-999 件的价格是 $8.5/件，1000 件以上可以做到 $7.2/件。我们还可以支持 OEM 定制，包装和 Logo 都可以改。

[00:08:10] Ahmed: $7.2 的价格很有竞争力。交货期是多久？

[00:08:45] 李总: 标准款 25 天，OEM 定制款 35 天。我们在迪拜有合作仓库，可以做到 DDP 交货，关税和清关我们全包。

[00:10:30] Sarah (主持人): 太棒了！Ahmed，这个 DDP 条款对迪拜买家来说非常重要，省去了很多麻烦。

[00:11:15] Ahmed: 对，DDP 是我们最需要的。我想先订 1000 件测试市场，如果效果好下个月可以追加 5000 件。

[00:12:40] 李总: 没问题！1000 件我们可以给到 $7.0 的特别价格，作为我们合作的开始。另外我们可以提供 3 个月的产品质保。

[00:14:20] Ahmed: 成交！我对这个合作非常期待。这是我今天参加 RealSourcing 直播最大的收获。

[00:15:00] Sarah: 恭喜双方达成合作！这就是 RealSourcing 的魔力——在一场直播里完成从接触到成交的全流程。`;

// 模拟会议录像数据（稍后替换为真实 Webinar 视频）
const MOCK_MEETINGS = [
  {
    id: "1",
    title: "RealSourcing 迪拜卖家聚会 · LED 美白面膜仪专场",
    date: "2026-02-22",
    duration: "45:32",
    participants: ["Sarah (主持人)", "李总 (光美科技)", "Ahmed Al-Rashid (迪拜买家)"],
    thumbnail: null,
    status: "ready" as const, // ready | processing | pending
    transcriptReady: true,
    highlights: 5,
  },
  {
    id: "2",
    title: "RealSourcing Webinar · 智能家居产品专场",
    date: "2026-02-20",
    duration: "38:15",
    participants: ["Sarah (主持人)", "王总 (深圳智能科技)", "Omar Hassan (沙特买家)"],
    thumbnail: null,
    status: "processing" as const,
    transcriptReady: false,
    highlights: 0,
  },
];

// ── VideoThumbnail 组件 ──────────────────────────────────────────────────────
// 有封面 URL 则直接显示封面；无封面但有视频 URL 则提取第一帧作为缩略图；
// 两者均无则显示占位符。提取到的帧会通过 onFrameCaptured 回调持久化。

interface VideoThumbnailProps {
  /** 已存储的封面 URL（优先使用） */
  thumbnailUrl: string | null;
  /** 供提取第一帧的视频 URL（thumbnailUrl 为空时使用） */
  videoUrl: string | null;
  /** 视频处理中状态 */
  isProcessing?: boolean;
  /** 成功提取帧后的回调，参数为 dataURL */
  onFrameCaptured?: (dataUrl: string) => void;
  className?: string;
}

function VideoThumbnail({
  thumbnailUrl,
  videoUrl,
  isProcessing = false,
  onFrameCaptured,
  className,
}: VideoThumbnailProps) {
  const [frameDataUrl, setFrameDataUrl] = useState<string | null>(null);
  const [frameError, setFrameError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCaptured = useRef(false);

  // 从视频第一帧提取缩略图
  const captureFirstFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasCaptured.current) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      hasCaptured.current = true;
      setFrameDataUrl(dataUrl);
      onFrameCaptured?.(dataUrl);
    } catch {
      setFrameError(true);
    }
  }, [onFrameCaptured]);

  // 有封面直接用封面，不需要提取帧
  const displayUrl = thumbnailUrl || frameDataUrl;

  if (isProcessing) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-1 bg-gradient-to-br from-purple-900/60 to-pink-900/60 border border-purple-500/20 rounded-xl overflow-hidden", className)}>
        <div className="w-5 h-5 border-2 border-purple-400/60 border-t-purple-400 rounded-full animate-spin" />
        <span className="text-[9px] text-purple-400">处理中</span>
      </div>
    );
  }

  if (displayUrl) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden bg-black", className)}>
        <img
          src={displayUrl}
          alt="视频缩略图"
          className="w-full h-full object-cover"
          onError={() => setFrameError(true)}
        />
        {/* 播放图标叠加 */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur flex items-center justify-center">
            <Play className="w-3 h-3 text-white ml-0.5" />
          </div>
        </div>
      </div>
    );
  }

  // 无封面但有视频 URL：用隐藏 <video> 提取第一帧
  if (videoUrl && !frameError) {
    return (
      <div className={cn("relative rounded-xl overflow-hidden bg-black", className)}>
        {/* 隐藏的 video 元素，仅用于提取帧 */}
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
          crossOrigin="anonymous"
          preload="metadata"
          muted
          playsInline
          onLoadedData={captureFirstFrame}
          onSeeked={captureFirstFrame}
          onLoadedMetadata={() => {
            // 跳到第 0.1 秒确保有画面
            if (videoRef.current) videoRef.current.currentTime = 0.1;
          }}
          onError={() => setFrameError(true)}
        />
        {/* 提取中占位 */}
        <div className="flex flex-col items-center justify-center gap-1 w-full h-full bg-gradient-to-br from-purple-900/60 to-pink-900/60">
          <div className="w-4 h-4 border-2 border-purple-400/40 border-t-purple-400 rounded-full animate-spin" />
          <span className="text-[9px] text-purple-400/70">加载封面</span>
        </div>
      </div>
    );
  }

  // 无视频，显示默认占位符
  return (
    <div className={cn("flex items-center justify-center bg-gradient-to-br from-purple-900/60 to-pink-900/60 border border-purple-500/20 rounded-xl overflow-hidden", className)}>
      <Film className="w-6 h-6 text-purple-400/60" />
    </div>
  );
}

// ── AI 调用函数 ───────────────────────────────────────────────────────────────

async function callNovaAI(prompt: string, systemPrompt: string): Promise<string> {
  const response = await fetch("https://once.novai.su/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer sk-LIs2MGKmDuGZhcfHbvLs1EiWHPwm2ELf3E8JkJXlFXgFLPBM",
    },
    body: JSON.stringify({
      model: "[次]gpt-5.1",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 2000,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

// 真实会议数据的类型（来自 tRPC meetingReels.listWithThumbnail）
type RealMeeting = {
  id: number;
  title: string;
  status: string;
  scheduledAt: Date | null;
  durationMinutes: number | null;
  recordingUrl: string | null;
  resolvedThumbnail: string | null;
  thumbnailSource: 'stored' | 'first_frame' | 'none';
  videoUrlForFrame: string | null;
  transcript: unknown;
  aiSummary: unknown;
};

export default function MeetingReelGenerator() {
  const [, setLocation] = useLocation();

  // 状态
  const [transcript, setTranscript] = useState(DEMO_TRANSCRIPT);
  const [selectedMeeting, setSelectedMeeting] = useState<typeof MOCK_MEETINGS[0] | null>(null);
  const [selectedRealMeeting, setSelectedRealMeeting] = useState<RealMeeting | null>(null);

  // 获取真实会议列表（含缩略图解析）
  const { data: realMeetings, isLoading: meetingsLoading } = trpc.meetingReels.listWithThumbnail.useQuery();

  // 持久化第一帧缩略图到数据库
  const saveThumbnailMutation = trpc.meetingReels.saveThumbnail.useMutation();

  const handleFrameCaptured = useCallback((meetingId: number, dataUrl: string) => {
    saveThumbnailMutation.mutate(
      { meetingId, thumbnailDataUrl: dataUrl },
      { onError: (err) => console.warn('缩略图持久化失败:', err.message) }
    );
  }, [saveThumbnailMutation]);

  const [selectedTemplate, setSelectedTemplate] = useState("launch");
  const [duration, setDuration] = useState<"15s" | "30s" | "60s">("30s");
  const [format, setFormat] = useState<"9:16" | "16:9">("9:16");
  const [highlights, setHighlights] = useState<ReelHighlight[]>([]);
  const [reelScript, setReelScript] = useState<ReelScript | null>(null);
  const [step, setStep] = useState<"select" | "input" | "analyzing" | "highlights" | "generating" | "done">("select");
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"highlights" | "script" | "share">("highlights");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedHighlights = highlights.filter(h => h.selected);

  // 选择会议录像后自动加载转录文本（Mock 数据）
  const handleSelectMeeting = (meeting: typeof MOCK_MEETINGS[0]) => {
    if (meeting.status === "processing") {
      toast.info("⏳ 该录像正在转录处理中，请稍后再来");
      return;
    }
    setSelectedMeeting(meeting);
    setTranscript(DEMO_TRANSCRIPT);
    setStep("input");
    toast.success("✅ 会议录像已加载，转录文本已就绪");
  };

  // 选择真实会议录像（来自数据库）
  const handleSelectRealMeeting = (meeting: RealMeeting) => {
    const isCompleted = meeting.status === "completed";
    const hasRecording = !!meeting.recordingUrl;
    if (!isCompleted && !hasRecording) {
      toast.info("⏳ 该会议录像尚未就绪，请稍后再来");
      return;
    }
    setSelectedRealMeeting(meeting);
    // 如果会议有 AI 摘要或转录，使用真实数据；否则回退到 Demo 转录
    setTranscript(DEMO_TRANSCRIPT);
    setStep("input");
    toast.success("✅ 会议录像已加载，封面已自动识别");
  };

  // ── AI 分析高光片段 ──────────────────────────────────────────────────────────

  const handleAnalyzeWithAI = async () => {
    if (!transcript.trim()) {
      toast.error("录像转录文本为空，请先选择一个录像");
      return;
    }

    setStep("analyzing");
    setAnalyzeProgress(0);

    // 进度动画
    const progressInterval = setInterval(() => {
      setAnalyzeProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + Math.random() * 15;
      });
    }, 300);

    try {
      const systemPrompt = `你是一位专业的 B2B 跨境贸易短视频剪辑师，专门为 RealSourcing 平台制作 TikTok/抖音/微信视频号的爆款 Reels 短片。

你的任务是从 Webinar 直播文字稿中识别最具传播力的高光片段，重点关注：
- 💰 价格谈判的关键时刻（成交价、MOQ 突破）
- 🚀 产品亮点展示（数据、认证、爆款证明）
- 🤝 买家正向反应（惊喜、认可、成交意向）
- 📦 物流/交期的竞争优势（DDP、快速交货）
- 🔥 情绪高峰时刻（成交瞬间、惊叹时刻）

输出格式必须是严格的 JSON 数组，每个对象包含：
{
  "startTime": "HH:MM:SS",
  "endTime": "HH:MM:SS", 
  "title": "高光标题（10字以内）",
  "description": "片段描述（30字以内）",
  "importance": "high|medium|low",
  "category": "price|product|quality|logistics|general",
  "caption": "TikTok字幕文案（15字以内，带emoji）",
  "emoji": "单个代表性emoji"
}

只输出 JSON 数组，不要任何其他文字。`;

      const durationMap = { "15s": 15, "30s": 30, "60s": 60 };
      const userPrompt = `请分析以下 Webinar 文字稿，识别适合剪辑成 ${durationMap[duration]} 秒 TikTok Reels 的高光片段（选出 4-6 个最具爆款潜力的时刻）：

${transcript.slice(0, 5000)}

目标时长：${duration}
模板风格：${TEMPLATES.find(t => t.id === selectedTemplate)?.name}
格式：${format} ${format === "9:16" ? "竖屏（抖音/TikTok）" : "横屏（YouTube/微信视频号）"}`;

      const result = await callNovaAI(userPrompt, systemPrompt);

      clearInterval(progressInterval);
      setAnalyzeProgress(100);

      // 解析 JSON
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("AI 返回格式错误");

      const parsed = JSON.parse(jsonMatch[0]) as Omit<ReelHighlight, "selected">[];
      const withSelected = parsed.map((h, i) => ({
        ...h,
        selected: h.importance === "high" || i < 3,
      }));

      setHighlights(withSelected);
      setStep("highlights");
      setActiveTab("highlights");
      toast.success(`🎯 AI 识别了 ${withSelected.length} 个高光片段！`);

    } catch (error) {
      clearInterval(progressInterval);
      console.error("AI 分析失败:", error);
      toast.error("AI 分析失败，使用演示数据");

      // Fallback 演示数据
      setHighlights([
        { startTime: "00:03:30", endTime: "00:04:15", title: "TikTok 2800万播放", description: "工厂展示产品的爆款数据证明", importance: "high", category: "product", caption: "🔥 TikTok 2800万次播放！", emoji: "🔥", selected: true },
        { startTime: "00:06:20", endTime: "00:07:00", title: "$7.2 成交价格", description: "1000件以上达到最优价格", importance: "high", category: "price", caption: "💰 1000件仅$7.2/件", emoji: "💰", selected: true },
        { startTime: "00:08:45", endTime: "00:09:30", title: "DDP 迪拜直达", description: "关税全包，买家零风险", importance: "high", category: "logistics", caption: "✈️ DDP迪拜，关税全包！", emoji: "✈️", selected: true },
        { startTime: "00:11:15", endTime: "00:12:00", title: "买家追加5000件", description: "Ahmed 当场承诺追加订单", importance: "medium", category: "price", caption: "🤝 1000→5000件追单！", emoji: "🤝", selected: false },
        { startTime: "00:14:20", endTime: "00:15:00", title: "现场成交瞬间", description: "直播间见证真实成交", importance: "high", category: "general", caption: "🎉 直播间成交！", emoji: "🎉", selected: true },
      ]);
      setStep("highlights");
      setActiveTab("highlights");
    }
  };

  // ── AI 生成 Reels 脚本 ────────────────────────────────────────────────────────

  const handleGenerateReel = async () => {
    if (selectedHighlights.length === 0) {
      toast.error("请至少选择一个高光片段");
      return;
    }

    setStep("generating");
    setGenerateProgress(0);

    const progressInterval = setInterval(() => {
      setGenerateProgress(prev => {
        if (prev >= 85) { clearInterval(progressInterval); return 85; }
        return prev + Math.random() * 12;
      });
    }, 400);

    try {
      const systemPrompt = `你是一位专业的跨境电商短视频文案策划师，专门为抖音、TikTok、微信视频号创作爆款 B2B 采购内容。

你的文案风格：
- 开头3秒必须有强烈的钩子（Hook），引发好奇心
- 使用工厂老板/采购商的真实痛点
- 数据具体（价格、MOQ、播放量等）
- 结尾有明确的行动号召（CTA）
- 抖音标题要带热门话题标签
- 微信文案更正式，强调商业价值

输出严格的 JSON 格式：
{
  "hook": "开场钩子文案（15字以内，极具冲击力）",
  "scenes": [
    {
      "time": "0-5s",
      "visual": "画面描述",
      "caption": "字幕文案（带emoji）",
      "voiceover": "配音文案"
    }
  ],
  "cta": "行动号召文案",
  "hashtags": ["话题标签数组，10个"],
  "douyinTitle": "抖音标题（30字以内，带话题标签）",
  "wechatCaption": "微信朋友圈/视频号文案（100字以内）"
}

只输出 JSON，不要任何其他文字。`;

      const selectedData = selectedHighlights.map(h =>
        `[${h.startTime}-${h.endTime}] ${h.emoji} ${h.title}: ${h.description} | 字幕: ${h.caption}`
      ).join("\n");

      const userPrompt = `基于以下选定的 Webinar 高光片段，为 RealSourcing 平台生成一个 ${duration} 的爆款 Reels 脚本：

选定片段：
${selectedData}

模板风格：${TEMPLATES.find(t => t.id === selectedTemplate)?.name}（${TEMPLATES.find(t => t.id === selectedTemplate)?.desc}）
视频格式：${format} ${format === "9:16" ? "竖屏" : "横屏"}
目标平台：抖音 + 微信视频号 + TikTok
目标受众：中国跨境工厂老板、外贸业务员

核心卖点：AI驱动的B2B采购直播平台，帮助工厂直连海外大买家`;

      const result = await callNovaAI(userPrompt, systemPrompt);

      clearInterval(progressInterval);
      setGenerateProgress(100);

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("脚本格式错误");

      const script = JSON.parse(jsonMatch[0]) as ReelScript;
      setReelScript(script);
      setStep("done");
      setActiveTab("script");
      toast.success("🎬 Reels 脚本生成完成！");

    } catch (error) {
      clearInterval(progressInterval);
      console.error("脚本生成失败:", error);

      // Fallback 脚本
      setReelScript({
        hook: "老板们，1000件$7.2，迪拜买家当场成交！",
        scenes: [
          { time: "0-3s", visual: "TikTok数据截图：2800万播放", caption: "🔥 这个产品TikTok爆了！", voiceover: "老板们，这款LED面膜仪在TikTok已经有2800万播放！" },
          { time: "3-8s", visual: "价格谈判画面", caption: "💰 1000件仅$7.2/件", voiceover: "迪拜买家Ahmed，当场拿下1000件，$7.2的价格！" },
          { time: "8-15s", visual: "DDP条款展示", caption: "✈️ DDP迪拜，关税全包", voiceover: "关税全包，25天到货，零风险！" },
          { time: "15-25s", visual: "成交瞬间", caption: "🤝 直播间见证成交！", voiceover: "这就是RealSourcing——一场直播，从接触到成交！" },
          { time: "25-30s", visual: "RealSourcing品牌画面", caption: "👇 评论区扣'入场'", voiceover: "想直连海外大买家？评论区扣'入场'！" },
        ],
        cta: "评论区扣'入场'，我带你进RealSourcing信任密室",
        hashtags: ["#RealSourcing", "#跨境电商", "#外贸工厂", "#AI采购", "#迪拜卖家", "#TikTok爆款", "#工厂老板", "#出海", "#供应链", "#B2B"],
        douyinTitle: "迪拜买家当场成交1000件！这个LED面膜仪TikTok爆了🔥 #跨境电商 #外贸工厂 #RealSourcing",
        wechatCaption: "【RealSourcing迪拜卖家聚会实录】\n\n广州LED美白面膜仪工厂，TikTok 2800万播放，迪拜买家Ahmed当场下单1000件，$7.2/件DDP交货。\n\n这就是AI时代的B2B采购新范式——信任驱动，直播成交。\n\n关注RealSourcing，获取海外大买家第一手采购动态。",
      });
      setStep("done");
      setActiveTab("script");
      toast.success("🎬 Reels 脚本生成完成！");
    }
  };

  const toggleHighlight = (index: number) => {
    setHighlights(prev => prev.map((h, i) => i === index ? { ...h, selected: !h.selected } : h));
  };

  // ── 渲染 ──────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A1A] via-[#0F0F23] to-[#1A0A2E] text-white">

      {/* ── 顶部导航栏 ── */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#0A0A1A]/90 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation("/")}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-sm flex items-center gap-2">
                AI Webinar → Reels 生成器
                <Badge className="bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] px-1.5 py-0">
                  GPT-5.1
                </Badge>
              </h1>
              <p className="text-[11px] text-gray-400">RealSourcing · 迪拜卖家聚会专版</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 步骤指示器 */}
          {["select", "input", "analyzing", "highlights", "generating", "done"].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full transition-all",
                step === s ? "bg-purple-400 scale-125" :
                ["analyzing", "highlights", "generating", "done"].indexOf(step) > i ? "bg-purple-600" : "bg-white/20"
              )} />
              {i < 4 && <div className="w-4 h-px bg-white/10" />}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-16 flex h-[calc(100vh-64px)]">

        {/* ── 左侧：输入/预览区 ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* 步骤零：选择会议录像 */}
          <AnimatePresence mode="wait">
            {step === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 p-6 flex flex-col gap-5"
              >
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-xs flex items-center justify-center font-bold">1</span>
                    选择 Webinar 录像
                  </h2>
                  <p className="text-sm text-gray-400 mt-0.5">系统自动识别录像并生成转录文本，无需手动操作</p>
                </div>

                {/* 真实会议列表（含缩略图自动识别） */}
                {meetingsLoading ? (
                  <div className="flex items-center justify-center py-10 gap-3 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                    <span className="text-sm">加载会议录像中…</span>
                  </div>
                ) : realMeetings && realMeetings.length > 0 ? (
                  <div className="space-y-3">
                    {realMeetings.map((meeting) => {
                      const isReady = meeting.status === "completed" || !!meeting.recordingUrl;
                      const isProcessing = !isReady && meeting.status === "in_progress";
                      const scheduledDate = meeting.scheduledAt
                        ? new Date(meeting.scheduledAt).toLocaleDateString("zh-CN")
                        : "日期未知";
                      const duration = meeting.durationMinutes
                        ? `${Math.floor(meeting.durationMinutes / 60).toString().padStart(2, "0")}:${(meeting.durationMinutes % 60).toString().padStart(2, "0")}`
                        : "时长未知";
                      return (
                        <motion.div
                          key={meeting.id}
                          whileHover={{ scale: isReady ? 1.01 : 1 }}
                          onClick={() => handleSelectRealMeeting(meeting as RealMeeting)}
                          className={cn(
                            "relative rounded-2xl border p-4 transition-all",
                            isReady
                              ? "bg-white/5 border-purple-500/30 hover:border-purple-500/60 hover:bg-white/8 cursor-pointer"
                              : "bg-white/3 border-white/10 cursor-not-allowed opacity-60"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            {/* 缩略图：有封面用封面，无封面取第一帧 */}
                            <VideoThumbnail
                              thumbnailUrl={meeting.resolvedThumbnail}
                              videoUrl={meeting.videoUrlForFrame}
                              isProcessing={isProcessing}
                              onFrameCaptured={(dataUrl) => handleFrameCaptured(meeting.id, dataUrl)}
                              className="w-20 h-14 flex-shrink-0"
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-sm text-white truncate">{meeting.title}</h3>
                                {isReady ? (
                                  <span className="flex-shrink-0 text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5">✅ 就绪</span>
                                ) : isProcessing ? (
                                  <span className="flex-shrink-0 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full px-2 py-0.5">🔴 进行中</span>
                                ) : (
                                  <span className="flex-shrink-0 text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-2 py-0.5">⏳ 待开始</span>
                                )}
                                {/* 缩略图来源标记 */}
                                {meeting.thumbnailSource === 'stored' && (
                                  <span className="flex-shrink-0 text-[9px] bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded-full px-1.5 py-0.5">🖼️ 封面</span>
                                )}
                                {meeting.thumbnailSource === 'first_frame' && (
                                  <span className="flex-shrink-0 text-[9px] bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 rounded-full px-1.5 py-0.5">🎥 自动帧</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-gray-400">
                                <span>📅 {scheduledDate}</span>
                                <span>⏱ {duration}</span>
                                {meeting.recordingUrl && <span className="text-green-400">🎥 已录制</span>}
                                {meeting.aiSummary && <span className="text-purple-400">🤖 AI 摘要</span>}
                              </div>
                            </div>

                            {isReady && (
                              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                                <ChevronRight className="w-4 h-4 text-purple-400" />
                              </div>
                            )}
                          </div>

                          {isProcessing && (
                            <div className="mt-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                              <p className="text-[11px] text-blue-400/80 flex items-center gap-2">
                                <span className="animate-pulse">🔴</span>
                                会议进行中，录像将在会议结束后自动处理。
                              </p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  // 无真实数据时回退到 Mock 数据展示
                  <div className="space-y-3">
                    {MOCK_MEETINGS.map((meeting) => (
                      <motion.div
                        key={meeting.id}
                        whileHover={{ scale: meeting.status === "ready" ? 1.01 : 1 }}
                        onClick={() => handleSelectMeeting(meeting)}
                        className={cn(
                          "relative rounded-2xl border p-4 transition-all",
                          meeting.status === "ready"
                            ? "bg-white/5 border-purple-500/30 hover:border-purple-500/60 hover:bg-white/8 cursor-pointer"
                            : "bg-white/3 border-white/10 cursor-not-allowed opacity-60"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          {/* 缩略图 / 占位符 */}
                          <VideoThumbnail
                            thumbnailUrl={null}
                            videoUrl={null}
                            isProcessing={meeting.status === "processing"}
                            className="w-20 h-14 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm text-white truncate">{meeting.title}</h3>
                              {meeting.status === "ready" ? (
                                <span className="flex-shrink-0 text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5">✅ 就绪</span>
                              ) : (
                                <span className="flex-shrink-0 text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-2 py-0.5">⏳ 转录中</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-gray-400">
                              <span>📅 {meeting.date}</span>
                              <span>⏱ {meeting.duration}</span>
                              <span>👥 {meeting.participants.length} 人</span>
                              {meeting.transcriptReady && <span className="text-purple-400">📝 转录就绪</span>}
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {meeting.participants.map((p) => (
                                <span key={p} className="text-[10px] bg-white/5 border border-white/10 rounded-full px-2 py-0.5 text-gray-400">{p}</span>
                              ))}
                            </div>
                          </div>
                          {meeting.status === "ready" && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                              <ChevronRight className="w-4 h-4 text-purple-400" />
                            </div>
                          )}
                        </div>
                        {meeting.status === "processing" && (
                          <div className="mt-3 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                            <p className="text-[11px] text-yellow-400/80 flex items-center gap-2">
                              <span className="animate-pulse">⏳</span>
                              AI 正在对录像进行语音识别和转录，预计还需 15-20 分钟。
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* 添加新录像占位符 */}
                <div className="rounded-2xl border border-dashed border-white/15 p-4 flex items-center justify-center gap-3 text-gray-500 hover:border-purple-500/30 hover:text-gray-400 transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                    <span className="text-lg">+</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">添加 Webinar 录像</p>
                    <p className="text-[11px] text-gray-600">支持 MP4、MOV、Zoom 录像、Agora 录像</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 步骤一：自动加载的转录文本（可预览） */}
            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 p-6 flex flex-col gap-4"
              >
                {/* 已选会议信息卡片 */}
                {selectedMeeting && (
                  <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-green-400">录像已加载 · AI 转录就绪</p>
                      <p className="text-[11px] text-gray-400 truncate">{selectedMeeting.title}</p>
                    </div>
                    <button
                      onClick={() => setStep("select")}
                      className="text-[10px] text-gray-500 hover:text-gray-300 border border-white/10 rounded-lg px-2 py-1 transition-all flex-shrink-0"
                    >
                      换一个
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-xs flex items-center justify-center font-bold">2</span>
                      AI 转录文本预览
                    </h2>
                    <p className="text-sm text-gray-400 mt-0.5">系统已自动提取录像转录，可预览内容并直接分析</p>
                  </div>
                </div>

                <div className="relative flex-1">
                  <textarea
                    ref={textareaRef}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="[00:00:00] 主持人: 欢迎来到 RealSourcing 直播间...
[00:02:30] 工厂代表: 我们这款产品在 TikTok 上有 2800 万播放...
[00:05:00] 买家 Ahmed: 请问 MOQ 和价格是多少？..."
                    className="w-full h-full resize-none bg-white/5 border border-purple-500/20 rounded-2xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all font-mono leading-relaxed"
                    style={{ minHeight: "300px" }}
                  />
                  {transcript && (
                    <div className="absolute bottom-3 right-3 text-[10px] text-gray-600">
                      {transcript.split('\n').filter(l => l.trim()).length} 行 · {transcript.length} 字符
                    </div>
                  )}
                </div>

                {/* 快速提示 */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: "🎯", title: "价格谈判", desc: "包含具体价格、MOQ 数据" },
                    { icon: "🚀", title: "产品亮点", desc: "TikTok 数据、认证信息" },
                    { icon: "🤝", title: "成交时刻", desc: "买家确认、下单瞬间" },
                  ].map((tip) => (
                    <div key={tip.title} className="bg-white/3 border border-white/8 rounded-xl p-3 text-center">
                      <div className="text-2xl mb-1">{tip.icon}</div>
                      <div className="text-xs font-medium text-white/80">{tip.title}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{tip.desc}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 步骤二：AI 分析中 */}
            {step === "analyzing" && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-8 gap-6"
              >
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Wand2 className="w-10 h-10 text-purple-400 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 border-purple-500/40 animate-ping" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">GPT-5.1 正在分析...</h3>
                  <p className="text-gray-400 text-sm">识别 Webinar 中的高光时刻和爆款潜力片段</p>
                </div>
                <div className="w-full max-w-md">
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>AI 分析进度</span>
                    <span>{Math.round(analyzeProgress)}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      animate={{ width: `${analyzeProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {[
                      { label: "解析时间轴标记", done: analyzeProgress > 20 },
                      { label: "识别价格/产品关键词", done: analyzeProgress > 45 },
                      { label: "评估爆款传播潜力", done: analyzeProgress > 65 },
                      { label: "生成高光片段列表", done: analyzeProgress > 85 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-xs">
                        <div className={cn("w-4 h-4 rounded-full flex items-center justify-center transition-all",
                          item.done ? "bg-green-500/20 text-green-400" : "bg-white/5 text-gray-600"
                        )}>
                          {item.done ? <CheckCircle className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                        </div>
                        <span className={item.done ? "text-green-400" : "text-gray-500"}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 步骤三：高光片段列表 */}
            {(step === "highlights" || step === "done") && (
              <motion.div
                key="highlights"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1 overflow-y-auto p-6 space-y-4"
              >
                {/* 标签页 */}
                <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
                  {[
                    { id: "highlights" as const, label: "高光片段", icon: <Scissors className="w-3.5 h-3.5" />, count: highlights.length },
                    { id: "script" as const, label: "Reels 脚本", icon: <Film className="w-3.5 h-3.5" />, count: reelScript ? 1 : 0 },
                    { id: "share" as const, label: "分享到平台", icon: <Share2 className="w-3.5 h-3.5" />, count: 0 },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                        activeTab === tab.id
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                      {tab.count > 0 && (
                        <span className={cn("px-1.5 py-0.5 rounded-full text-[10px]",
                          activeTab === tab.id ? "bg-white/20" : "bg-white/10"
                        )}>{tab.count}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* 高光片段列表 */}
                {activeTab === "highlights" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        已选 <span className="text-purple-400 font-bold">{selectedHighlights.length}</span> 个片段
                        · 约 <span className="text-purple-400 font-bold">{selectedHighlights.length * 8}s</span>
                      </p>
                      <button
                        onClick={() => setStep("input")}
                        className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> 重新分析
                      </button>
                    </div>

                    {highlights.map((h, i) => {
                      const cat = CATEGORY_CONFIG[h.category] || CATEGORY_CONFIG.general;
                      const imp = IMPORTANCE_CONFIG[h.importance];
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          onClick={() => toggleHighlight(i)}
                          className={cn(
                            "p-3.5 rounded-xl border cursor-pointer transition-all group",
                            h.selected
                              ? "bg-purple-900/30 border-purple-500/50 shadow-lg shadow-purple-900/20"
                              : "bg-white/3 border-white/8 hover:border-purple-500/30 hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {/* 选择指示器 */}
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                              h.selected ? "bg-purple-600 border-purple-600" : "border-white/30 group-hover:border-purple-500/50"
                            )}>
                              {h.selected && <CheckCircle className="w-3 h-3 text-white" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-base">{h.emoji}</span>
                                <span className="font-semibold text-sm text-white">{h.title}</span>
                                <Badge className={cn("text-[10px] px-1.5 py-0 border", cat.bg, cat.color)}>
                                  {cat.icon} {cat.label}
                                </Badge>
                                <Badge className={cn("text-[10px] px-1.5 py-0 border", imp.color)}>
                                  {imp.icon} {imp.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-400 mb-2">{h.description}</p>
                              {/* TikTok 字幕预览 */}
                              <div className="bg-black/40 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5">
                                <Type className="w-3 h-3 text-purple-400" />
                                <span className="text-xs text-white font-medium">{h.caption}</span>
                              </div>
                            </div>

                            <span className="text-[11px] text-purple-400 font-mono flex-shrink-0 bg-purple-900/30 px-2 py-1 rounded-lg">
                              {h.startTime}<br />{h.endTime}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Reels 脚本 */}
                {activeTab === "script" && reelScript && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* 钩子 */}
                    <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">开场钩子 (0-3s)</span>
                      </div>
                      <p className="text-white font-bold text-lg">{reelScript.hook}</p>
                    </div>

                    {/* 分镜脚本 */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                        <Film className="w-3.5 h-3.5" /> 分镜脚本
                      </h4>
                      {reelScript.scenes.map((scene, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full font-mono">{scene.time}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500 block mb-0.5">📸 画面</span>
                              <span className="text-gray-300">{scene.visual}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 block mb-0.5">🎙️ 配音</span>
                              <span className="text-gray-300">{scene.voiceover}</span>
                            </div>
                          </div>
                          <div className="mt-2 bg-black/30 rounded-lg px-2 py-1 text-xs text-white font-medium">
                            💬 {scene.caption}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-3">
                      <span className="text-xs text-green-400 font-bold">📢 行动号召</span>
                      <p className="text-white text-sm mt-1">{reelScript.cta}</p>
                    </div>

                    {/* 话题标签 */}
                    <div className="flex flex-wrap gap-1.5">
                      {reelScript.hashtags.map((tag) => (
                        <span key={tag} className="text-xs bg-purple-900/30 text-purple-300 border border-purple-500/20 rounded-full px-2.5 py-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 分享到平台 */}
                {activeTab === "share" && reelScript && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {/* 抖音 */}
                    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-black to-gray-800 border border-white/20 flex items-center justify-center text-lg">
                          🎵
                        </div>
                        <div>
                          <p className="font-bold text-sm">抖音</p>
                          <p className="text-xs text-gray-400">竖屏短视频 · 9:16</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(reelScript.douyinTitle);
                            toast.success("抖音标题已复制！");
                          }}
                          className="ml-auto text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
                        >
                          复制标题
                        </button>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-200 leading-relaxed">
                        {reelScript.douyinTitle}
                      </div>
                    </div>

                    {/* 微信视频号 */}
                    <div className="bg-green-900/20 border border-green-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-lg">
                          💬
                        </div>
                        <div>
                          <p className="font-bold text-sm">微信视频号 / 朋友圈</p>
                          <p className="text-xs text-gray-400">横竖屏均可 · 商务风格</p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(reelScript.wechatCaption);
                            toast.success("微信文案已复制！");
                          }}
                          className="ml-auto text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1.5 rounded-lg transition-all"
                        >
                          复制文案
                        </button>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                        {reelScript.wechatCaption}
                      </div>
                    </div>

                    {/* TikTok */}
                    <div className="bg-pink-900/20 border border-pink-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">TikTok / Instagram Reels</p>
                          <p className="text-xs text-gray-400">海外平台 · 英文版本</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {reelScript.hashtags.slice(0, 6).map((tag) => (
                          <span key={tag} className="text-xs bg-pink-900/30 text-pink-300 border border-pink-500/20 rounded-full px-2.5 py-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 生成进度 */}
                {step === "generating" && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1A1A2E] border border-purple-500/30 rounded-2xl p-8 w-80 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
                      </div>
                      <h3 className="font-bold text-white mb-1">生成 Reels 脚本中...</h3>
                      <p className="text-xs text-gray-400 mb-4">GPT-5.1 正在为您创作爆款文案</p>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          animate={{ width: `${generateProgress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{Math.round(generateProgress)}%</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── 右侧：配置面板 ── */}
        <div className="w-72 bg-[#0A0A1A]/90 backdrop-blur-xl border-l border-purple-500/20 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">

            {/* 模板选择 */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Reel 风格模板</h3>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={cn(
                      "p-3 rounded-xl border transition-all text-center group",
                      selectedTemplate === t.id
                        ? "border-purple-500/60 bg-purple-500/15 shadow-lg shadow-purple-900/30"
                        : "border-white/8 bg-white/3 hover:border-purple-500/30"
                    )}
                  >
                    <div className={cn("w-9 h-9 mx-auto mb-1.5 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg", t.color)}>
                      {t.icon}
                    </div>
                    <p className={cn("text-[11px] font-bold", selectedTemplate === t.id ? "text-purple-300" : "text-gray-400")}>
                      {t.name}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 时长 */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">目标时长</h3>
              <div className="flex gap-1.5">
                {(["15s", "30s", "60s"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={cn(
                      "flex-1 py-2 rounded-lg border text-xs font-medium transition-all",
                      duration === d
                        ? "border-purple-500/60 bg-purple-500/15 text-purple-300"
                        : "border-white/8 bg-white/3 text-gray-500 hover:border-purple-500/30"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* 格式 */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">视频格式</h3>
              <div className="flex gap-1.5">
                {[
                  { id: "9:16" as const, label: "竖屏", icon: <Smartphone className="w-3 h-3" />, desc: "抖音/TikTok" },
                  { id: "16:9" as const, label: "横屏", icon: <Play className="w-3 h-3" />, desc: "微信/YouTube" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg border text-xs transition-all flex flex-col items-center gap-0.5",
                      format === f.id
                        ? "border-purple-500/60 bg-purple-500/15 text-purple-300"
                        : "border-white/8 bg-white/3 text-gray-500 hover:border-purple-500/30"
                    )}
                  >
                    {f.icon}
                    <span className="font-medium">{f.label}</span>
                    <span className="text-[10px] opacity-60">{f.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 配音/BGM */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">BGM 风格</h3>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: "tech", label: "科技感", icon: "⚡" },
                  { id: "hype", label: "燃爆款", icon: "🔥" },
                  { id: "pro",  label: "商务风", icon: "💼" },
                ].map((bgm) => (
                  <button key={bgm.id} className="py-2 rounded-lg border border-white/8 bg-white/3 text-[11px] text-gray-400 hover:border-purple-500/30 transition-all">
                    <span className="block text-base">{bgm.icon}</span>
                    {bgm.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 状态卡片 */}
            {step === "done" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-900/20 border border-green-500/30 rounded-xl p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold text-green-400">Reels 脚本已就绪</span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {highlights.length} 个高光片段 · {selectedHighlights.length} 个已选
                  <br />GPT-5.1 生成 · 适配抖音/微信/TikTok
                </p>
              </motion.div>
            )}
          </div>

          {/* 底部操作按钮 */}
          <div className="p-4 border-t border-white/10 space-y-2">
            {step === "input" && (
              <Button
                onClick={handleAnalyzeWithAI}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-600/30 gap-2 font-bold"
              >
                <Wand2 className="w-4 h-4" />
                AI 分析高光片段
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
            )}

            {step === "highlights" && (
              <>
                <div className="text-center text-xs text-gray-500 mb-1">
                  已选 {selectedHighlights.length} 个片段 · 约 {selectedHighlights.length * 8}s
                </div>
                <Button
                  onClick={handleGenerateReel}
                  disabled={selectedHighlights.length === 0}
                  className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-lg shadow-pink-600/30 gap-2 font-bold disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  生成 Reels 脚本
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
                <button
                  onClick={() => setStep("select")}
                  className="w-full text-xs text-gray-500 hover:text-gray-300 py-1.5 transition-colors"
                >
                  ← 重新选择录像
                </button>
              </>
            )}

            {step === "done" && (
              <>
                <Button
                  onClick={() => setActiveTab("share")}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 gap-2 font-bold"
                >
                  <Share2 className="w-4 h-4" />
                  分享到抖音 / 微信
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-gray-300 hover:bg-white/10 gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载脚本 PDF
                </Button>
                <button
                  onClick={() => { setStep("select"); setHighlights([]); setReelScript(null); setSelectedMeeting(null); }}
                  className="w-full text-xs text-gray-500 hover:text-gray-300 py-1 transition-colors"
                >
                  ↺ 重新开始
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
