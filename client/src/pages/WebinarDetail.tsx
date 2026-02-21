import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Share2, Star, Users, Clock, Globe, Target, Link2, Play,
  Calendar, Award, ChevronRight, Facebook, Linkedin, Copy, Check, Bookmark, X,
  Loader2, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(target: Date | null) {
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!target) return;
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setRemaining({ hours: 0, minutes: 0, seconds: 0 }); return; }
      setRemaining({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return remaining;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function WebinarDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const webinarId = parseInt(params.id || "1", 10);
  const [copied, setCopied] = useState(false);

  // ── tRPC Queries ──────────────────────────────────────────────────────────
  const { data: webinar, isLoading, error } = trpc.webinars.byId.useQuery({ id: webinarId });
  const { data: allWebinars = [] } = trpc.webinars.list.useQuery();

  const registerMutation = trpc.webinars.register.useMutation({
    onSuccess: () => {
      toast.success("注册成功！");
    },
    onError: (err) => {
      toast.error(`注册失败: ${err.message}`);
    },
  });

  const favoriteMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.favorited ? "已收藏" : "已取消收藏");
    },
    onError: () => {
      toast.error("操作失败，请重试");
    },
  });

  const countdown = useCountdown(webinar?.scheduledAt || null);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/webinar/${webinarId}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading / Error States ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading webinar...</p>
        </div>
      </div>
    );
  }

  if (error || !webinar) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Webinar Not Found</h2>
          <p className="text-gray-400 mb-4">{error?.message || "The webinar you're looking for doesn't exist."}</p>
          <Button onClick={() => setLocation("/webinars")} className="bg-purple-600 hover:bg-purple-500">
            Browse Webinars
          </Button>
        </div>
      </div>
    );
  }

  // ── Derived Data ──────────────────────────────────────────────────────────
  const status = webinar.status as "live" | "scheduled" | "upcoming" | "completed" | "past";
  const isLive = status === "live";
  const isUpcoming = status === "scheduled" || status === "upcoming";
  const isEnded = status === "completed" || status === "past";

  const statusConfig = isLive
    ? { label: "LIVE", className: "bg-red-500 text-white" }
    : isUpcoming
    ? { label: "即将开始", className: "bg-amber-500 text-white" }
    : { label: "已结束", className: "bg-gray-600 text-white" };

  const relatedWebinars = allWebinars
    .filter((w) => w.id !== webinarId)
    .slice(0, 3);

  const shareLink = `${window.location.origin}/webinar/${webinarId}`;

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white">
      {/* ── Top Navigation ── */}
      <div className="sticky top-0 z-50 h-14 bg-[#0D0F1A]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
        <button
          onClick={() => setLocation("/webinars")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </button>

        <h1 className="text-sm font-semibold truncate max-w-md text-white">
          {webinar.title}
        </h1>

        <div className="flex items-center gap-4">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? "已复制" : "分享"}</span>
          </button>
          <button
            onClick={() => favoriteMutation.mutate({ targetType: "webinar", targetId: webinar.id })}
            disabled={favoriteMutation.isPending}
            className={cn(
              "flex items-center gap-1.5 transition-colors text-sm",
              "text-gray-400 hover:text-amber-400"
            )}
          >
            <Bookmark className="w-4 h-4" />
            <span>收藏</span>
          </button>
        </div>
      </div>

      {/* ── Hero Image ── */}
      <div className="relative h-[460px] overflow-hidden">
        <img
          src={
            webinar.coverImage ||
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&h=600&fit=crop"
          }
          alt={webinar.title}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F1A] via-[#0D0F1A]/50 to-transparent" />

        {/* Bottom-left: Host + Title + Status */}
        <div className="absolute bottom-8 left-8 max-w-[55%]">
          {webinar.host && (
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-white/30 bg-purple-900/50 flex items-center justify-center">
                {webinar.host.avatar ? (
                  <img src={webinar.host.avatar} alt={webinar.host.name || ""} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-purple-300">
                    {(webinar.host.name || "H").slice(0, 1)}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-200 font-medium">{webinar.host.name}</span>
            </div>
          )}
          <div className="flex items-start gap-3">
            <h2 className="text-3xl font-bold leading-tight text-white">
              {webinar.title}
            </h2>
            <Badge
              className={cn(
                "shrink-0 mt-1 text-xs px-2 py-0.5 rounded font-bold uppercase",
                statusConfig.className,
                isLive && "animate-pulse"
              )}
            >
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Bottom-right: CTA */}
        {isLive && (
          <div className="absolute bottom-8 right-8 flex flex-col items-center gap-2">
            <Button
              className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 h-auto rounded-full text-base font-semibold shadow-2xl shadow-purple-500/40 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 mr-2 fill-white" />
              立即进入直播间
            </Button>
            <p className="text-sm text-gray-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {webinar.participantCount} 人在线
            </p>
          </div>
        )}

        {isUpcoming && (
          <div className="absolute bottom-8 right-8 flex flex-col items-end gap-3">
            {/* Countdown */}
            <div className="flex gap-2">
              {[
                { val: countdown.hours, label: "时" },
                { val: countdown.minutes, label: "分" },
                { val: countdown.seconds, label: "秒" },
              ].map(({ val, label }) => (
                <div key={label} className="flex flex-col items-center bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[56px]">
                  <span className="text-2xl font-bold text-white tabular-nums">
                    {String(val).padStart(2, "0")}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">{label}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => registerMutation.mutate({ webinarId: webinar.id })}
              disabled={registerMutation.isPending || webinar.isRegistered}
              className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 h-auto rounded-full text-base font-semibold"
            >
              {webinar.isRegistered ? (
                <><Check className="w-4 h-4 mr-2" />已报名</>
              ) : registerMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />报名中...</>
              ) : (
                "立即报名"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Basic Info Card */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-4 text-white">基本信息</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  {webinar.scheduledAt
                    ? new Date(webinar.scheduledAt).toLocaleString("zh-CN", {
                        year: "numeric", month: "2-digit", day: "2-digit",
                        hour: "2-digit", minute: "2-digit"
                      })
                    : "TBD"}
                  {webinar.duration ? ` (${webinar.duration} 分钟)` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <Users className="w-4 h-4 shrink-0" />
                <span>已报名：<strong>{webinar.participantCount}</strong> 人</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400 col-span-2">
                <Link2 className="w-4 h-4 shrink-0" />
                <span className="truncate text-purple-400">{shareLink}</span>
                <button onClick={handleCopyLink} className="ml-1 text-gray-400 hover:text-white">
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Webinar Description */}
          {webinar.description && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-3 text-white">Webinar 介绍</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{webinar.description}</p>
            </div>
          )}

          {/* Host Info */}
          {webinar.host && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-4 text-white">主持人</h3>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-purple-900/30 border border-purple-500/30 flex items-center justify-center">
                  {webinar.host.avatar ? (
                    <img src={webinar.host.avatar} alt={webinar.host.name || ""} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-purple-300">
                      {(webinar.host.name || "H").slice(0, 1)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">{webinar.host.name}</p>
                  <p className="text-sm text-gray-400 mt-0.5">Webinar Host</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column (1/3) ── */}
        <div className="space-y-5">
          {/* Registration CTA */}
          <div className="bg-[#141628] border border-purple-500/40 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-4 text-white">
              {isLive ? "正在直播" : isUpcoming ? "立即报名" : "回放"}
            </h3>
            <div className="space-y-3">
              {isLive && (
                <Button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl h-12">
                  <Play className="w-4 h-4 mr-2 fill-white" />
                  进入直播间
                </Button>
              )}
              {isUpcoming && (
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl h-12"
                  onClick={() => registerMutation.mutate({ webinarId: webinar.id })}
                  disabled={registerMutation.isPending || webinar.isRegistered}
                >
                  {webinar.isRegistered ? (
                    <><Check className="w-4 h-4 mr-2" />已报名</>
                  ) : registerMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />报名中...</>
                  ) : (
                    "立即报名"
                  )}
                </Button>
              )}
              {isEnded && (
                <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl h-12">
                  <Play className="w-4 h-4 mr-2" />
                  观看回放
                </Button>
              )}
              <p className="text-xs text-gray-500 text-center">
                {webinar.participantCount} 人已报名
              </p>
            </div>
          </div>

          {/* Share */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-4 text-white">分享</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { bg: "bg-green-600/20 border-green-500/30", icon: "🟢", label: "WeChat" },
                { bg: "bg-blue-700/20 border-blue-600/30", icon: "💼", label: "LinkedIn" },
                { bg: "bg-blue-600/20 border-blue-500/30", icon: "📘", label: "Facebook" },
                { bg: "bg-sky-600/20 border-sky-500/30", icon: "🐦", label: "Twitter" },
              ].map((s) => (
                <button
                  key={s.label}
                  className={cn(
                    "aspect-square rounded-xl border flex items-center justify-center text-xl hover:scale-105 transition-transform",
                    s.bg
                  )}
                  title={s.label}
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Related Webinars */}
          {relatedWebinars.length > 0 && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-4 text-white">相关 Webinar</h3>
              <div className="space-y-3">
                {relatedWebinars.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-white/5 rounded-xl p-2 -mx-2 transition-all"
                    onClick={() => setLocation(`/webinar/${w.id}`)}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-purple-900/30">
                      {w.coverImage ? (
                        <img src={w.coverImage} alt={w.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Radio className="w-6 h-6 text-purple-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white line-clamp-2">{w.title}</p>
                      {w.scheduledAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(w.scheduledAt).toLocaleDateString("zh-CN")}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
