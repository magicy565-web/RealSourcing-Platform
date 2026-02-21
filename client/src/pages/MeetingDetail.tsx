import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Download, Play, Pause, Sparkles, CheckCircle,
  Send, Loader2, Building2, Calendar, FileText, MessageSquare
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

export default function MeetingDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const meetingId = parseInt(params.id || "1", 10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reelGenerating, setReelGenerating] = useState(false);
  const [reelGenerated, setReelGenerated] = useState(false);
  const [minutesSent, setMinutesSent] = useState(false);

  const { data: meeting, isLoading, error } = trpc.meetings.byId.useQuery({ id: meetingId });

  const handleGenerateReel = () => {
    setReelGenerating(true);
    setTimeout(() => { setReelGenerating(false); setReelGenerated(true); }, 2500);
  };

  const handleSendMinutes = () => {
    setMinutesSent(true);
    toast.success("会议纪要已发送");
    setTimeout(() => setMinutesSent(false), 3000);
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
  const aiSummary = Array.isArray(meeting.aiSummary) ? (meeting.aiSummary as string[]) : [];
  const followUpActions = Array.isArray(meeting.followUpActions) ? (meeting.followUpActions as string[]) : [];
  const transcripts = meeting.transcripts || [];

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white">
      {/* Top Navigation */}
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
            disabled={reelGenerating}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {reelGenerating ? "Generating..." : "Generate Reel"}
          </Button>
          <Button size="sm" variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10 gap-1.5 h-8">
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-purple-900/40 via-[#141628] to-amber-900/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">{meeting.title}</h1>
            <p className="text-gray-400 text-sm mb-4">
              {meeting.scheduledAt
                ? new Date(meeting.scheduledAt).toLocaleString("zh-CN")
                : "TBD"}
              {meeting.durationMinutes ? ` · ${meeting.durationMinutes} 分钟` : ""}
            </p>
            <Badge className={cn("text-xs px-3 py-1 border", statusConfig.className)}>
              {statusConfig.label}
            </Badge>
            <div className="flex items-center gap-6 mt-6">
              {meeting.buyer && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/60 bg-purple-900/30 flex items-center justify-center">
                    {meeting.buyer.avatar ? (
                      <img src={meeting.buyer.avatar} alt={meeting.buyer.name || ""} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-purple-300">
                        {(meeting.buyer.name || "B").slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-300">{meeting.buyer.name}</p>
                </div>
              )}
              {meeting.factory && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500/60 bg-blue-900/30 flex items-center justify-center">
                    {meeting.factory.logo ? (
                      <img src={meeting.factory.logo} alt={meeting.factory.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-7 h-7 text-blue-300" />
                    )}
                  </div>
                  <p className="text-xs text-gray-300">{meeting.factory.name}</p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Products Shown", value: (meeting as any).productsShownCount || 0, color: "text-green-400" },
              { label: "Products Liked", value: (meeting as any).productsLikedCount || 0, color: "text-purple-400" },
              { label: "Inquiries Made", value: (meeting as any).inquiriesMadeCount || 0, color: "text-amber-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recording */}
          {(meeting.recordingUrl || meeting.recordingThumbnail) && (
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10">
              <div className="relative" style={{ aspectRatio: "16/9" }}>
                {meeting.recordingThumbnail && (
                  <img
                    src={meeting.recordingThumbnail}
                    alt="Recording"
                    className="w-full h-full object-cover opacity-80"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 rounded-full bg-purple-600/80 hover:bg-purple-600 flex items-center justify-center shadow-xl transition-all hover:scale-110"
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7" />
                    ) : (
                      <Play className="w-7 h-7 ml-1 fill-white" />
                    )}
                  </button>
                </div>
              </div>
              <div className="px-4 py-3 bg-[#0D0F1A] flex items-center justify-between">
                <span className="text-sm text-gray-400">会议录像</span>
                <Button variant="outline" size="sm" className="border-white/20 text-gray-300">
                  <Download className="w-4 h-4 mr-2" />
                  下载录像
                </Button>
              </div>
            </div>
          )}

          {/* Transcript */}
          {transcripts.length > 0 && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <FileText className="w-4 h-4 text-purple-400" />
                会议记录
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {transcripts.map((t: any, i: number) => (
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
            </div>
          )}

          {/* Meeting Inquiries */}
          {meeting.inquiries && meeting.inquiries.length > 0 && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                相关询价 ({meeting.inquiries.length})
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
                        询价 #{inq.id}
                        {inq.quantity ? ` — ${inq.quantity} 件` : ""}
                      </p>
                      {inq.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{inq.notes}</p>
                      )}
                    </div>
                    <Badge className={cn(
                      "text-xs",
                      inq.status === "replied" ? "bg-green-500/20 text-green-400" :
                      inq.status === "pending" ? "bg-amber-500/20 text-amber-400" :
                      "bg-gray-500/20 text-gray-400"
                    )}>
                      {inq.status === "replied" ? "已回复" :
                       inq.status === "pending" ? "待回复" : inq.status}
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
          {aiSummary.length > 0 && (
            <div className="bg-[#141628] border border-amber-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-base font-semibold text-white">AI 会议摘要</h3>
                <Badge className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs px-2 py-0.5">
                  AI
                </Badge>
              </div>
              <ul className="space-y-2">
                {aiSummary.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Follow-up Actions */}
          {followUpActions.length > 0 && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">跟进事项</h3>
              <div className="space-y-2">
                {followUpActions.map((action: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                    <span className="text-sm text-gray-300">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Reel Generator */}
          <div className="bg-[#141628] border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-base font-semibold text-white">AI 精彩片段</h3>
              <Badge className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs px-2 py-0.5">
                AI
              </Badge>
            </div>
            {(reelGenerated || (meeting as any).aiReelUrl) ? (
              <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl">
                <Play className="w-4 h-4 mr-2" />
                播放精彩片段
              </Button>
            ) : (
              <Button
                className="w-full bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded-xl"
                onClick={handleGenerateReel}
                disabled={reelGenerating}
              >
                {reelGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    生成 AI 精彩片段
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Send Meeting Minutes */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-4">发送会议纪要</h3>
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
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  已发送
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  发送纪要
                </>
              )}
            </Button>
          </div>

          {/* Factory Info */}
          {meeting.factory && (
            <div
              className="bg-[#141628] border border-white/10 rounded-2xl p-6 cursor-pointer hover:border-purple-500/40 transition-all"
              onClick={() => setLocation(`/factory/${meeting.factory!.id}`)}
            >
              <h3 className="text-base font-semibold text-white mb-4">工厂信息</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-purple-900/30 border border-purple-500/30 flex items-center justify-center">
                  {meeting.factory.logo ? (
                    <img
                      src={meeting.factory.logo}
                      alt={meeting.factory.name}
                      className="w-full h-full object-cover"
                    />
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
