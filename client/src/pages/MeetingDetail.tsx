import { useState, useRef } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Download, Play, Pause, Sparkles, CheckCircle,
  Send, Loader2, Building2, Calendar, FileText, MessageSquare,
  DollarSign, Package, Clock, TrendingUp, Zap, RefreshCw,
  Copy, ChevronDown, ChevronUp, Target, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  completed:   { label: "Completed",   className: "bg-green-500/20 border-green-500/40 text-green-400" },
  in_progress: { label: "In Progress", className: "bg-blue-500/20 border-blue-500/40 text-blue-400" },
  scheduled:   { label: "Scheduled",   className: "bg-amber-500/20 border-amber-500/40 text-amber-400" },
  cancelled:   { label: "Cancelled",   className: "bg-red-500/20 border-red-500/40 text-red-400" },
};

const SENTIMENT_CONFIG = {
  positive: { label: "Positive", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30" },
  neutral:  { label: "Neutral",  color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" },
  negative: { label: "Negative", color: "text-red-400",   bg: "bg-red-500/10 border-red-500/30" },
};

export default function MeetingDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const meetingId = parseInt(params.id || "1", 10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [minutesSent, setMinutesSent] = useState(false);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [aiSummaryData, setAiSummaryData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: meeting, isLoading, error, refetch } = trpc.meetings.byId.useQuery({ id: meetingId });

  // AI 摘要生成
  const generateSummaryMutation = trpc.ai.generateMeetingSummary.useMutation({
    onSuccess: (data) => {
      setAiSummaryData(data.summary);
      refetch();
      toast.success("AI summary generated successfully!");
    },
    onError: (err) => {
      toast.error("Failed to generate summary: " + err.message);
    },
  });

  const handleGenerateSummary = () => {
    generateSummaryMutation.mutate({ meetingId });
  };

  const handleGenerateReel = () => {
    setLocation(`/meeting-reel-generator/${meetingId}`);
  };

  const handleSendMinutes = () => {
    setMinutesSent(true);
    toast.success("Meeting minutes sent to all participants");
    setTimeout(() => setMinutesSent(false), 3000);
  };

  const handleVideoToggle = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleCopyTranscript = () => {
    const transcripts = meeting?.transcripts ?? [];
    const text = transcripts
      .map((t: any) => `[${t.timestamp || ""}] ${t.speakerName || "Speaker"}: ${t.content}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Transcript copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Meeting Not Found</h2>
          <p className="text-gray-400 mb-4">{error?.message || "The meeting does not exist."}</p>
          <Button onClick={() => setLocation("/dashboard")} className="bg-purple-600 hover:bg-purple-500">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.scheduled;
  const aiSummary = aiSummaryData?.keyPoints ?? (Array.isArray(meeting.aiSummary) ? (meeting.aiSummary as string[]) : []);
  const followUpActions = aiSummaryData?.followUpActions ?? (Array.isArray(meeting.followUpActions) ? (meeting.followUpActions as string[]) : []);
  const transcripts = meeting.transcripts ?? [];
  const displayTranscripts = transcriptExpanded ? transcripts : transcripts.slice(0, 5);

  // AI 摘要的结构化商务条款
  const businessTerms = aiSummaryData ? [
    { icon: <DollarSign className="w-4 h-4" />, label: "Price Discussed", value: aiSummaryData.priceDiscussed, color: "text-green-400" },
    { icon: <Package className="w-4 h-4" />,    label: "MOQ",             value: aiSummaryData.moqDiscussed,   color: "text-blue-400" },
    { icon: <Clock className="w-4 h-4" />,      label: "Lead Time",       value: aiSummaryData.leadTime,       color: "text-amber-400" },
    { icon: <Target className="w-4 h-4" />,     label: "Next Step",       value: aiSummaryData.nextStep,       color: "text-purple-400" },
  ].filter(t => t.value) : [];

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white">
      {/* ── Top Navigation ── */}
      <div className="sticky top-0 z-50 h-14 bg-[#0D0F1A]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-sm border border-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Meetings
        </button>
        <h1 className="text-sm font-semibold truncate max-w-md text-white">{meeting.title}</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-purple-500/50 text-purple-300 hover:bg-purple-600/20 gap-1.5 h-8"
            onClick={handleGenerateReel}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Reel
          </Button>
          <Button size="sm" variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10 gap-1.5 h-8">
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
        </div>
      </div>

      {/* ── Hero Section ── */}
      <div className="bg-gradient-to-br from-purple-900/40 via-[#141628] to-amber-900/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">{meeting.title}</h1>
            <p className="text-gray-400 text-sm mb-4">
              {meeting.scheduledAt
                ? new Date(meeting.scheduledAt).toLocaleString("zh-CN")
                : "TBD"}
              {meeting.durationMinutes ? ` · ${meeting.durationMinutes} min` : ""}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("text-xs px-3 py-1 border", statusConfig.className)}>
                {statusConfig.label}
              </Badge>
              {aiSummaryData?.buyerSentiment && (
                <Badge className={cn("text-xs px-3 py-1 border", SENTIMENT_CONFIG[aiSummaryData.buyerSentiment as keyof typeof SENTIMENT_CONFIG]?.bg)}>
                  <span className={SENTIMENT_CONFIG[aiSummaryData.buyerSentiment as keyof typeof SENTIMENT_CONFIG]?.color}>
                    {SENTIMENT_CONFIG[aiSummaryData.buyerSentiment as keyof typeof SENTIMENT_CONFIG]?.label} Buyer
                  </span>
                </Badge>
              )}
              {aiSummaryData?.dealProbability !== undefined && (
                <Badge className="bg-purple-500/20 border border-purple-500/40 text-purple-400 text-xs px-3 py-1">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  {aiSummaryData.dealProbability}% Deal Probability
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-6 mt-6">
              {meeting.buyer && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-500/60 bg-purple-900/30 flex items-center justify-center">
                    {meeting.buyer.avatar ? (
                      <img src={meeting.buyer.avatar} alt={meeting.buyer.name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-purple-300">{(meeting.buyer.name || "B").slice(0, 1)}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300">{meeting.buyer.name}</p>
                </div>
              )}
              {meeting.factory && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500/60 bg-blue-900/30 flex items-center justify-center">
                    {meeting.factory.logo ? (
                      <img src={meeting.factory.logo} alt={meeting.factory.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-blue-300" />
                    )}
                  </div>
                  <p className="text-xs text-gray-300">{meeting.factory.name}</p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Products Shown",  value: (meeting as any).productsShownCount || 0,  color: "text-green-400" },
              { label: "Products Liked",  value: (meeting as any).productsLikedCount || 0,  color: "text-purple-400" },
              { label: "Inquiries Made",  value: (meeting as any).inquiriesMadeCount || 0,  color: "text-amber-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Recording Player */}
          {meeting.recordingUrl ? (
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10">
              <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
                <video
                  ref={videoRef}
                  src={meeting.recordingUrl}
                  className="w-full h-full object-cover"
                  poster={meeting.recordingThumbnail || undefined}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-all cursor-pointer" onClick={handleVideoToggle}>
                  {!isPlaying && (
                    <div className="w-16 h-16 rounded-full bg-purple-600/80 hover:bg-purple-600 flex items-center justify-center shadow-xl transition-all hover:scale-110">
                      <Play className="w-7 h-7 ml-1 fill-white" />
                    </div>
                  )}
                </div>
                {isPlaying && (
                  <button
                    onClick={handleVideoToggle}
                    className="absolute bottom-4 left-4 w-10 h-10 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-all"
                  >
                    <Pause className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
              <div className="px-4 py-3 bg-[#0D0F1A] flex items-center justify-between">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Meeting Recording
                  {meeting.durationMinutes && <span className="text-gray-600">· {meeting.durationMinutes} min</span>}
                </span>
                <a href={meeting.recordingUrl} download className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-8 text-center">
              <Play className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Recording not available yet</p>
              <p className="text-gray-600 text-xs mt-1">Recording will appear here after the meeting ends</p>
            </div>
          )}

          {/* AI Business Terms (shown after AI analysis) */}
          {businessTerms.length > 0 && (
            <div className="bg-[#141628] border border-amber-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-base font-semibold text-white">Key Business Terms</h3>
                <Badge className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs px-2 py-0.5">
                  AI Extracted
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {businessTerms.map((term) => (
                  <div key={term.label} className="bg-white/5 rounded-xl p-3 border border-white/10">
                    <div className={cn("flex items-center gap-1.5 text-xs mb-1", term.color)}>
                      {term.icon}
                      {term.label}
                    </div>
                    <p className="text-sm font-semibold text-white">{term.value}</p>
                  </div>
                ))}
              </div>
              {aiSummaryData?.rawSummary && (
                <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-xs text-gray-400 leading-relaxed">{aiSummaryData.rawSummary}</p>
                </div>
              )}
            </div>
          )}

          {/* Transcript */}
          {transcripts.length > 0 && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  Meeting Transcript
                  <Badge className="bg-white/10 text-gray-400 text-xs px-2 py-0.5">{transcripts.length} segments</Badge>
                </h3>
                <button
                  onClick={handleCopyTranscript}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy All
                </button>
              </div>
              <div className="space-y-3">
                {displayTranscripts.map((t: any, i: number) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-purple-400 font-mono shrink-0 w-14 text-xs mt-0.5">
                      {t.timestamp || ""}
                    </span>
                    <div>
                      {t.speakerName && (
                        <span className="font-semibold text-purple-300 mr-2">{t.speakerName}:</span>
                      )}
                      <span className="text-gray-400">{t.content}</span>
                    </div>
                  </div>
                ))}
              </div>
              {transcripts.length > 5 && (
                <button
                  onClick={() => setTranscriptExpanded(!transcriptExpanded)}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors py-2 border-t border-white/5"
                >
                  {transcriptExpanded ? (
                    <><ChevronUp className="w-4 h-4" />Show Less</>
                  ) : (
                    <><ChevronDown className="w-4 h-4" />Show {transcripts.length - 5} More Segments</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Meeting Inquiries */}
          {meeting.inquiries && meeting.inquiries.length > 0 && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                Related Inquiries ({meeting.inquiries.length})
              </h3>
              <div className="space-y-3">
                {meeting.inquiries.map((inq: any) => (
                  <div
                    key={inq.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                    onClick={() => setLocation("/inquiries")}
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        Inquiry #{inq.id}
                        {inq.quantity ? ` — ${inq.quantity} units` : ""}
                      </p>
                      {inq.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{inq.notes}</p>
                      )}
                    </div>
                    <Badge className={cn(
                      "text-xs border",
                      inq.status === "replied"  ? "bg-green-500/20 border-green-500/40 text-green-400" :
                      inq.status === "pending"  ? "bg-amber-500/20 border-amber-500/40 text-amber-400" :
                      "bg-gray-500/20 border-gray-500/40 text-gray-400"
                    )}>
                      {inq.status === "replied" ? "Replied" : inq.status === "pending" ? "Pending" : inq.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* AI Summary */}
          <div className="bg-[#141628] border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-white">AI Meeting Summary</h3>
                <Badge className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs px-2 py-0.5">
                  AI
                </Badge>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={generateSummaryMutation.isPending}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-300 transition-colors disabled:opacity-50"
                title="Re-generate summary"
              >
                {generateSummaryMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {aiSummary.length > 0 ? (
              <ul className="space-y-2">
                {aiSummary.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-3">
                  {transcripts.length > 0
                    ? "Generate AI summary from transcript"
                    : "No transcript available yet"}
                </p>
                <Button
                  size="sm"
                  onClick={handleGenerateSummary}
                  disabled={generateSummaryMutation.isPending || transcripts.length === 0}
                  className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 gap-1.5 h-8 text-xs"
                >
                  {generateSummaryMutation.isPending ? (
                    <><Loader2 className="w-3 h-3 animate-spin" />Generating...</>
                  ) : (
                    <><Zap className="w-3 h-3" />Generate with AI</>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Follow-up Actions */}
          {followUpActions.length > 0 && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Follow-up Actions
              </h3>
              <div className="space-y-2">
                {followUpActions.map((action: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-purple-400">{i + 1}</span>
                    </div>
                    <span className="text-sm text-gray-300">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Reel Generator */}
          <div className="bg-[#141628] border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-base font-semibold text-white">AI Highlight Reel</h3>
              <Badge className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs px-2 py-0.5">AI</Badge>
            </div>
            {(meeting as any).aiReelUrl ? (
              <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl">
                <Play className="w-4 h-4 mr-2" />
                Play Highlight Reel
              </Button>
            ) : (
              <Button
                className="w-full bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-xl"
                onClick={handleGenerateReel}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Reel
              </Button>
            )}
          </div>

          {/* Send Meeting Minutes */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-400" />
              Send Meeting Minutes
            </h3>
            <Button
              className={cn(
                "w-full rounded-xl font-semibold",
                minutesSent
                  ? "bg-green-600/20 text-green-400 border border-green-500/30"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              )}
              onClick={handleSendMinutes}
              disabled={minutesSent}
            >
              {minutesSent ? (
                <><CheckCircle className="w-4 h-4 mr-2" />Sent!</>
              ) : (
                <><Send className="w-4 h-4 mr-2" />Send Minutes</>
              )}
            </Button>
          </div>

          {/* Factory Info */}
          {meeting.factory && (
            <div
              className="bg-[#141628] border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-purple-500/40 transition-all"
              onClick={() => setLocation(`/factory/${meeting.factory!.id}`)}
            >
              <h3 className="text-base font-semibold text-white mb-4">Factory Info</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-purple-900/30 border border-purple-500/30 flex items-center justify-center">
                  {meeting.factory.logo ? (
                    <img src={meeting.factory.logo} alt={meeting.factory.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-purple-400" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">{meeting.factory.name}</p>
                  {(meeting.factory.city || meeting.factory.country) && (
                    <p className="text-sm text-gray-400">
                      {[meeting.factory.city, meeting.factory.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
