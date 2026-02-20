import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Download, MoreHorizontal, Play, Pause, Volume2, Settings,
  Maximize, SkipForward, Sparkles, CheckCircle, Users, Clock, Send, Linkedin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_MEETING = {
  id: 1,
  title: "Bluetooth Headphones Selection - Alice Wang",
  status: "completed" as "completed" | "in_progress" | "scheduled" | "cancelled",
  scheduledAt: "2025-02-19 14:00 - 15:30",
  durationMinutes: 90,
  buyer: {
    id: 1,
    name: "Alice Wang",
    company: "TikTok",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop",
  },
  factoryCeo: {
    id: 2,
    name: "CEO Zhang Wei",
    title: "CEO",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
  },
  recordingThumbnail: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=450&fit=crop",
  outcomes: {
    productsShown: 12,
    liked: 3,
    inquiries: 2,
  },
  aiSummary: [
    "Client interested in Product A",
    "Asked for MOQ",
    "Requested 3 samples",
  ],
  aiReelThumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=400&fit=crop",
  aiReelDuration: "9:16",
  transcript: [
    { time: "14:05", speaker: "Zhang Wei", text: "This is our latest ANC 3.0 headphone. It features improved noise cancellation technology and up to 40 hours of battery life..." },
    { time: "14:08", speaker: "Alice Wang", text: "That sounds impressive. What's the MOQ for this model?" },
    { time: "14:09", speaker: "Zhang Wei", text: "The minimum order quantity is 500 units. We can offer better pricing for orders above 2000 units." },
    { time: "14:12", speaker: "Alice Wang", text: "Can we arrange for 3 sample units before placing a bulk order?" },
    { time: "14:13", speaker: "Zhang Wei", text: "Absolutely, we can ship samples within 3-5 business days." },
  ],
  followUpActions: ["Send Samples", "Send Quote"],
  relatedMeetings: [
    { id: 2, title: "Smart Watch Selection", date: "2025-02-15", avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop" },
    { id: 3, title: "Earbuds Review", date: "2025-02-10", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop" },
  ],
};

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  completed: { label: "Completed", className: "bg-green-500/20 border-green-500/40 text-green-400" },
  in_progress: { label: "In Progress", className: "bg-blue-500/20 border-blue-500/40 text-blue-400" },
  scheduled: { label: "Scheduled", className: "bg-amber-500/20 border-amber-500/40 text-amber-400" },
  cancelled: { label: "Cancelled", className: "bg-red-500/20 border-red-500/40 text-red-400" },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function MeetingDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [reelGenerating, setReelGenerating] = useState(false);
  const [reelGenerated, setReelGenerated] = useState(false);
  const [minutesSent, setMinutesSent] = useState(false);
  const meeting = MOCK_MEETING;
  const statusConfig = STATUS_CONFIG[meeting.status];

  const handleGenerateReel = () => {
    setReelGenerating(true);
    setTimeout(() => { setReelGenerating(false); setReelGenerated(true); }, 2500);
  };

  const handleSendMinutes = () => {
    setMinutesSent(true);
    setTimeout(() => setMinutesSent(false), 3000);
  };

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

        <h1 className="text-sm font-semibold truncate max-w-md text-white">
          {meeting.title}
        </h1>

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
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 text-gray-300 hover:bg-white/10 gap-1.5 h-8"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </Button>
          <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors border border-white/10">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/40 via-[#141628] to-amber-900/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: Meeting Title + Participants */}
          <div>
            <h1 className="text-4xl font-bold mb-3 leading-tight text-white">
              {meeting.title}
            </h1>
            <p className="text-gray-400 mb-8 text-sm">{meeting.scheduledAt}</p>

            <div className="flex items-center gap-8">
              {[meeting.buyer, meeting.factoryCeo].map((person, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500/60 shadow-xl shadow-purple-500/20">
                    <img
                      src={person.avatar}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-gray-300 font-medium">{person.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Video Thumbnail + Stats */}
          <div>
            {/* Video Screenshot */}
            <div className="relative rounded-xl overflow-hidden border border-white/10 mb-4 bg-black/50">
              <img
                src={meeting.recordingThumbnail}
                alt="Meeting recording"
                className="w-full h-full object-cover opacity-80"
                style={{ aspectRatio: "16/9" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-14 h-14 rounded-full bg-purple-600/80 hover:bg-purple-600 flex items-center justify-center shadow-xl transition-all hover:scale-110"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-1 fill-white" />
                  )}
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Duration:", value: `${Math.floor(meeting.durationMinutes / 60)}h ${meeting.durationMinutes % 60}m`, color: "text-white" },
                { label: "Products:", value: meeting.outcomes.productsShown, color: "text-green-400" },
                { label: "Saved:", value: meeting.outcomes.liked, color: "text-purple-400" },
                { label: "Inquiries:", value: meeting.outcomes.inquiries, color: "text-amber-400" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"
                >
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">

        {/* Left: Video Player + Transcript (50%) */}
        <div className="col-span-12 lg:col-span-6 space-y-5">
          {/* Video Player */}
          <div className="bg-black rounded-2xl overflow-hidden border border-white/10">
            <div className="relative" style={{ aspectRatio: "16/9" }}>
              <img
                src={meeting.recordingThumbnail}
                alt="Recording"
                className="w-full h-full object-cover opacity-80"
              />
              {/* Aspect Ratio Label */}
              <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/60 text-xs text-gray-300">
                16:9
              </div>
              {/* Play Button */}
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

            {/* Player Controls */}
            <div className="px-4 py-3 bg-[#0D0F1A]">
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-white/10 rounded-full mb-3 cursor-pointer group">
                <div className="h-full w-1/3 bg-purple-500 rounded-full relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              {/* Controls Row */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:text-purple-400 transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <SkipForward className="w-4 h-4" />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Volume2 className="w-4 h-4" />
                </button>
                {/* Volume Slider */}
                <div className="w-20 h-1 bg-white/10 rounded-full cursor-pointer">
                  <div className="h-full w-3/4 bg-white/60 rounded-full" />
                </div>
                <span className="text-xs text-gray-500 ml-1">30:00 / 1:30:00</span>
                <div className="flex-1" />
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Real-time Transcript */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-white">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Real-time Transcript
            </h3>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {meeting.transcript.map((line, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="text-gray-500 shrink-0 font-mono text-xs mt-0.5">
                    {line.time}
                  </span>
                  <div>
                    <span className="font-semibold text-purple-300">{line.speaker}: </span>
                    <span className="text-gray-400">{line.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: AI Summary + Reel (25%) */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          {/* AI Generated Summary */}
          <div className="bg-[#141628] border border-amber-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-base font-semibold text-white">AI Generated Summary</h3>
              <Badge className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs px-2 py-0.5">
                AI Tag
              </Badge>
            </div>
            <div className="space-y-3">
              {meeting.aiSummary.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Generated Meeting Reel */}
          <div className="bg-[#141628] border border-amber-500/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-base font-semibold text-white">AI Generated Meeting Reel</h3>
              <Badge className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs px-2 py-0.5">
                AI Tag
              </Badge>
            </div>

            {/* Reel Preview */}
            {reelGenerated ? (
              <div className="relative rounded-xl overflow-hidden bg-black/50 mb-4 cursor-pointer group" style={{ aspectRatio: "9/16", maxHeight: "260px" }}>
                <img
                  src={meeting.aiReelThumbnail}
                  alt="AI Reel"
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-purple-600/80 flex items-center justify-center">
                    <Play className="w-5 h-5 ml-0.5 fill-white" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-xs text-gray-300">
                  {meeting.aiReelDuration}
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "relative rounded-xl overflow-hidden bg-black/30 border-2 border-dashed mb-4 flex flex-col items-center justify-center cursor-pointer transition-colors",
                  reelGenerating ? "border-purple-500/60" : "border-white/20 hover:border-purple-500/50"
                )}
                style={{ aspectRatio: "9/16", maxHeight: "260px" }}
                onClick={handleGenerateReel}
              >
                {reelGenerating ? (
                  <>
                    <div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mb-3" />
                    <p className="text-sm text-purple-400">Generating...</p>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-8 h-8 text-purple-400 mb-2" />
                    <p className="text-sm text-gray-400">Click to generate</p>
                  </>
                )}
              </div>
            )}

            {/* Share Buttons */}
            <div className="space-y-2">
              <Button
                className="w-full bg-black text-white border border-white/20 hover:bg-white/10 gap-2 text-sm rounded-xl h-9"
                size="sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
                </svg>
                Share to TikTok
              </Button>
              <Button
                className="w-full bg-blue-700 hover:bg-blue-600 text-white gap-2 text-sm rounded-xl h-9"
                size="sm"
              >
                <Linkedin className="w-4 h-4" />
                Share to LinkedIn
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Meeting Info Card (25%) */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          {/* Meeting Info Card */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
            <h3 className="text-base font-semibold mb-4 text-white">Meeting Info Card</h3>

            {/* Buyer Info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/40 shrink-0">
                <img
                  src={meeting.buyer.avatar}
                  alt={meeting.buyer.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-white">{meeting.buyer.name}</p>
                <p className="text-sm text-gray-400">{meeting.buyer.company}</p>
              </div>
            </div>

            {/* Status */}
            <Badge className={cn("border text-xs px-2.5 py-1 mb-4", statusConfig.className)}>
              {statusConfig.label}
            </Badge>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs h-8"
                onClick={handleSendMinutes}
              >
                {minutesSent ? "Sent!" : "Send Minutes"}
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs h-8"
                onClick={() => setLocation(`/meeting/new?relatedId=${meeting.id}`)}
              >
                Follow-up Meeting
              </Button>
            </div>
          </div>

          {/* Outcomes */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
            <h3 className="text-base font-semibold mb-4 text-white">Outcomes</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{meeting.outcomes.productsShown}</p>
                <p className="text-xs text-gray-500 mt-0.5">Products Shown</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">{meeting.outcomes.liked}</p>
                <p className="text-xs text-gray-500 mt-0.5">Liked</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-400">{meeting.outcomes.inquiries}</p>
                <p className="text-xs text-gray-500 mt-0.5">Inquiries</p>
              </div>
            </div>
          </div>

          {/* Follow-up Actions */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
            <h3 className="text-base font-semibold mb-4 text-white">Follow-up Actions</h3>
            <div className="space-y-2.5">
              {meeting.followUpActions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  className="w-full border-white/20 text-gray-300 hover:bg-white/10 hover:text-white rounded-xl h-10 justify-center"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>

          {/* Related Meetings */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
            <h3 className="text-base font-semibold mb-4 text-white">Related Meetings</h3>
            <div className="space-y-3">
              {meeting.relatedMeetings.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setLocation(`/meeting/${m.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all group text-left"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-gray-800">
                    <img src={m.avatar} alt={m.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                      {m.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{m.date}</p>
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
