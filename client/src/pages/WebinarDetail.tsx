import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Share2, Star, Users, Clock, Globe, Target, Link2, Play,
  Calendar, Award, ChevronRight, Facebook, Linkedin, Copy, Check, Bookmark, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_WEBINAR = {
  id: 1,
  title: "2025 TikTok爆款蓝牙耳机新品发布会",
  status: "live" as "live" | "upcoming" | "ended",
  coverImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&h=600&fit=crop",
  scheduledAt: new Date(Date.now() + 2 * 3600000 + 45 * 60000),
  scheduledDisplay: "2025-02-20 14:00",
  duration: 90,
  registeredCount: 1234,
  onlineCount: 1234,
  targetAudience: "采购商、贸易商",
  language: "中文 + 英文翻译",
  shareLink: "https://realsourcing.com/webinar/1",
  description:
    "本场 Webinar 将展示深圳科技工厂最新的 2025 年 TikTok 爆款蓝牙耳机系列，深度解析产品核心竞争力、市场趋势及选品策略，助力买家抓住下一波流量红利。",
  factory: {
    id: 1,
    name: "深圳科技工厂",
    logo: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=80&h=80&fit=crop",
    rating: 4.9,
    industry: "消费电子",
    certifications: ["CE", "ISO9001"],
    description: "进款企业产品，拣究新作进厂，遴证、产业红利。",
  },
  host: {
    name: "张伟",
    title: "CEO",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
  },
  products: [
    {
      id: 1,
      name: "ANC 3.0 降噪耳机",
      price: "$45",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
    },
    {
      id: 2,
      name: "运动蓝牙耳机",
      price: "$38",
      image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=300&h=300&fit=crop",
    },
    {
      id: 3,
      name: "入耳式耳机",
      price: "$28",
      image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop",
    },
  ],
  relatedWebinars: [
    {
      id: 2,
      title: "AI 驱动的未来趋势",
      scheduledAt: "2025-02-20 14:00",
      image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=80&h=80&fit=crop",
    },
    {
      id: 3,
      title: "数据安全与隐私保护",
      scheduledAt: "2025-02-20 14:00",
      image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=80&h=80&fit=crop",
    },
    {
      id: 4,
      title: "构建高效团队工作流",
      scheduledAt: "2025-02-20 14:00",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    },
  ],
};

// ─── Countdown Hook ───────────────────────────────────────────────────────────
function useCountdown(target: Date) {
  const [remaining, setRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = target.getTime() - Date.now();
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
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown(MOCK_WEBINAR.scheduledAt);
  const webinar = MOCK_WEBINAR;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(webinar.shareLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = {
    live: { label: "LIVE", className: "bg-red-500 text-white" },
    upcoming: { label: "即将开始", className: "bg-amber-500 text-white" },
    ended: { label: "已结束", className: "bg-gray-600 text-white" },
  }[webinar.status];

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
          <button className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
            <Share2 className="w-4 h-4" />
            <span>分享</span>
          </button>
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={cn(
              "flex items-center gap-1.5 transition-colors text-sm",
              isBookmarked ? "text-amber-400" : "text-gray-400 hover:text-white"
            )}
          >
            <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-amber-400")} />
            <span>收藏</span>
          </button>
        </div>
      </div>

      {/* ── Hero Image ── */}
      <div className="relative h-[460px] overflow-hidden">
        <img
          src={webinar.coverImage}
          alt={webinar.title}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F1A] via-[#0D0F1A]/50 to-transparent" />

        {/* Bottom-left: Factory + Title + Status */}
        <div className="absolute bottom-8 left-8 max-w-[55%]">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/30 bg-purple-900/50 flex items-center justify-center">
              <img
                src={webinar.factory.logo}
                alt={webinar.factory.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-sm text-gray-200 font-medium">{webinar.factory.name}</span>
          </div>
          <div className="flex items-start gap-3">
            <h2 className="text-3xl font-bold leading-tight text-white">
              {webinar.title}
            </h2>
            <Badge
              className={cn(
                "shrink-0 mt-1 text-xs px-2 py-0.5 rounded font-bold uppercase",
                statusConfig.className,
                webinar.status === "live" && "animate-pulse"
              )}
            >
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Bottom-right: CTA */}
        {webinar.status === "live" && (
          <div className="absolute bottom-8 right-8 flex flex-col items-center gap-2">
            <Button
              onClick={() => setLocation(`/webinar-live/${webinar.id}`)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 h-auto rounded-full text-base font-semibold shadow-2xl shadow-purple-500/40 transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 mr-2 fill-white" />
              [立即进入直播间]
            </Button>
            <p className="text-sm text-gray-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {webinar.onlineCount.toLocaleString()} 人在线
            </p>
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
                <span>2025-02-20 14:00 - 15:30</span>
              </div>
              <div className="flex items-center gap-2 text-green-400 font-medium">
                <Users className="w-4 h-4 shrink-0" />
                <span>已报名：<strong>{webinar.registeredCount.toLocaleString()}</strong> 人</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Target className="w-4 h-4 text-purple-400 shrink-0" />
                <span>适合人群：{webinar.targetAudience}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Globe className="w-4 h-4 text-purple-400 shrink-0" />
                <span>语言：{webinar.language}</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400 col-span-2">
                <Link2 className="w-4 h-4 shrink-0" />
                <a href={webinar.shareLink} className="hover:underline truncate text-purple-400">
                  {webinar.shareLink}
                </a>
              </div>
            </div>
          </div>

          {/* Two-column: Webinar Intro + Factory Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Webinar Description */}
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-3 text-white">Webinar 介绍</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{webinar.description}</p>
            </div>

            {/* Factory Info */}
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-4 text-white">工厂介绍</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-purple-900/30 border border-purple-500/30">
                  <img
                    src={webinar.factory.logo}
                    alt={webinar.factory.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-white">{webinar.factory.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-sm text-amber-400 font-medium">{webinar.factory.rating}</span>
                    <span className="text-gray-600">|</span>
                    <span className="text-xs text-gray-400">{webinar.factory.industry}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mb-3">
                {webinar.factory.certifications.map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className="border-purple-500/50 text-purple-300 text-xs px-2"
                  >
                    {c}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-400 mb-4">{webinar.factory.description}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation(`/factory/${webinar.factory.id}`)}
                  className="border-white/20 text-gray-300 hover:bg-white/10 text-xs"
                >
                  进入工厂主页
                </Button>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs"
                  onClick={() => setLocation(`/meeting/new?factoryId=${webinar.factory.id}`)}
                >
                  发起 1:1 选品会议
                </Button>
              </div>
            </div>
          </div>

          {/* Products Showcase */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-5 text-white">本场展示产品</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {webinar.products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/50 transition-all group"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-white truncate">{product.name}</p>
                    <p className="text-purple-400 text-sm font-semibold mt-0.5">{product.price}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 border-purple-500/40 text-purple-300 hover:bg-purple-600/20 text-xs h-8"
                      onClick={() => setLocation(`/product/${product.id}`)}
                    >
                      询价
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column (1/3) ── */}
        <div className="space-y-5">

          {/* Webinar Info / Register Card */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-4 text-white">Webinar 信息</h3>

            {/* Big Date */}
            <div className="text-2xl font-bold text-white mb-2">
              2025-02-20 14:00
            </div>

            {/* Countdown (upcoming only) */}
            {webinar.status === "upcoming" && (
              <div className="flex items-center gap-1.5 text-amber-400 font-medium text-sm mb-3">
                <Clock className="w-4 h-4" />
                <span>
                  距开始 <strong>{countdown.hours}</strong> 小时{" "}
                  <strong>{countdown.minutes}</strong> 分
                </span>
              </div>
            )}

            {/* Registered count */}
            <div className="flex items-center gap-2 text-green-400 text-sm mb-5">
              <Users className="w-4 h-4" />
              <span>已报名 {webinar.registeredCount.toLocaleString()} 人</span>
            </div>

            {/* Host */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-purple-500/40">
                <img
                  src={webinar.host.avatar}
                  alt={webinar.host.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{webinar.host.name}</p>
                <p className="text-xs text-gray-400">{webinar.host.title}</p>
              </div>
            </div>

            {/* CTA Button */}
            {webinar.status === "live" ? (
              <Button
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl h-12 text-base shadow-lg shadow-purple-500/30"
                onClick={() => setLocation(`/webinar-live/${webinar.id}`)}
              >
                <Play className="w-4 h-4 mr-2 fill-white" />
                立即进入直播间
              </Button>
            ) : webinar.status === "upcoming" ? (
              <>
                <Button
                  className={cn(
                    "w-full font-semibold rounded-xl h-12 text-base transition-all",
                    isRegistered
                      ? "bg-green-600/20 border border-green-500/50 text-green-400 hover:bg-green-600/30"
                      : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                  )}
                  onClick={() => setIsRegistered(!isRegistered)}
                >
                  {isRegistered ? (
                    <><Check className="w-4 h-4 mr-2" />已注册</>
                  ) : (
                    "[立即注册]"
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  注册后将收到 Webinar 链接和提醒
                </p>
              </>
            ) : (
              <Button
                className="w-full bg-gray-700/50 text-gray-500 cursor-not-allowed rounded-xl h-12"
                disabled
              >
                已结束
              </Button>
            )}
          </div>

          {/* Share Card */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-4 text-white">分享此 Webinar</h3>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center hover:bg-blue-600/40 transition-colors">
                <Facebook className="w-5 h-5 text-blue-400" />
              </button>
              <button className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
              <button className="w-10 h-10 rounded-xl bg-blue-700/20 border border-blue-600/30 flex items-center justify-center hover:bg-blue-700/40 transition-colors">
                <Linkedin className="w-5 h-5 text-blue-400" />
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-gray-400 hover:text-white"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>{copied ? "已复制" : "复制链接"}</span>
              </button>
            </div>
          </div>

          {/* Related Webinars */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-base font-semibold mb-4 text-white">相关 Webinar</h3>
            <div className="space-y-3">
              {webinar.relatedWebinars.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setLocation(`/webinar/${r.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all group text-left"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-800">
                    <img
                      src={r.image}
                      alt={r.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                      {r.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.scheduledAt}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-purple-400 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
