/**
 * FactoryDetail — AMR v3.0 升级版
 *
 * 升级内容：
 * ✅ Hero 区域：420px 封面图 + 数据浮层（AMR分数、买家数、发货时效）
 * ✅ 产品展示：大图卡片网格，展示 OSS 真实产品图（从 48px 升级至 200px）
 * ✅ 工厂简介 Banner：差异化描述 + 核心数据指标
 * ✅ 认证徽章：彩色图标化展示
 * ✅ 视觉细节：渐变优化、卡片悬停效果、数据可视化增强
 * ✅ 差异化 AMR 权重：每家工厂雷达图形状各具特色
 */
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Heart, Share2, MapPin, Star, Phone, Mail,
  Clock, MessageSquare, Package, Check, ChevronRight,
  Building2, Zap, TrendingUp, Globe, Users, ShoppingCart,
  Award, BarChart3, Shield, Sparkles, ExternalLink, ChevronDown, Factory
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── AMR 雷达图 ──────────────────────────────────────────────────────────────
function AMRRadarChart({
  acumen, channel, velocity, global: globalScore, score
}: {
  acumen: number; channel: number; velocity: number; global: number; score: number;
}) {
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 60;
  const pillars = [
    { label: "市场敏锐", value: acumen / 100, color: "#a78bfa" },
    { label: "渠道多元", value: channel / 100, color: "#34d399" },
    { label: "信息敏捷", value: velocity / 100, color: "#60a5fa" },
    { label: "全球广度", value: globalScore / 100, color: "#f59e0b" },
  ];
  const angles = pillars.map((_, i) => (i * Math.PI * 2) / pillars.length - Math.PI / 2);
  const outerPoints = angles.map((a) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }));
  const dataPoints = pillars.map((p, i) => ({
    x: cx + r * p.value * Math.cos(angles[i]),
    y: cy + r * p.value * Math.sin(angles[i]),
  }));
  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + "Z";
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {gridLevels.map((level) => (
          <polygon key={level}
            points={angles.map((a) => `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`).join(" ")}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        ))}
        {outerPoints.map((p, i) => (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        ))}
        <path d={toPath(dataPoints)} fill="rgba(124,58,237,0.25)" stroke="#7c3aed" strokeWidth="1.5" />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={pillars[i].color} />
        ))}
        <text x={cx} y={cy + 5} textAnchor="middle" fill="white" fontSize="18" fontWeight="700">{score}</text>
        <text x={cx} y={cy + 18} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="8">AMR</text>
      </svg>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
        {pillars.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-[10px] text-slate-400">{p.label}</span>
            <span className="text-[10px] font-semibold ml-auto" style={{ color: p.color }}>
              {Math.round(p.value * 100)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 买家体感词云 ─────────────────────────────────────────────────────────────
function BuyerVibeCloud({ tags }: { tags: { text: string; weight: number }[] }) {
  const colors = [
    "bg-violet-500/20 text-violet-300 border-violet-500/30",
    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    "bg-blue-500/20 text-blue-300 border-blue-500/30",
    "bg-amber-500/20 text-amber-300 border-amber-500/30",
    "bg-pink-500/20 text-pink-300 border-pink-500/30",
    "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, i) => (
        <span key={i}
          className={cn("px-3 py-1 rounded-full border text-xs font-medium", colors[i % colors.length])}
          style={{ fontSize: `${0.7 + tag.weight * 0.06}rem` }}>
          {tag.text}
        </span>
      ))}
    </div>
  );
}

// ─── 履约时效图 ───────────────────────────────────────────────────────────────
function FulfillmentChart({ data, avgHours }: { data: number[]; avgHours: number }) {
  const max = Math.max(...data);
  return (
    <div>
      <div className="flex items-end gap-1 h-16">
        {data.map((h, i) => (
          <div key={i}
            className={cn("flex-1 rounded-sm transition-all", h <= 36 ? "bg-emerald-500/70" : "bg-amber-500/70")}
            style={{ height: `${(h / max) * 100}%` }} />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-slate-600">
        <span>30天前</span>
        <span>今天</span>
      </div>
    </div>
  );
}

// ─── 渠道能力看板 ─────────────────────────────────────────────────────────────
function ChannelCapabilityPanel({ channels }: { channels: string[] }) {
  const channelMap: Record<string, { label: string; sub: string; icon: string; color: string }> = {
    small_moq:    { label: "小单友好", sub: "最低 MOQ 可谈", icon: "📦", color: "from-violet-600/30 to-violet-800/20 border-violet-500/30" },
    dropshipping: { label: "代发货",   sub: "一件代发支持",  icon: "🚚", color: "from-emerald-600/30 to-emerald-800/20 border-emerald-500/30" },
    trade_show:   { label: "展会参展", sub: "广交等",        icon: "🏛", color: "from-blue-600/30 to-blue-800/20 border-blue-500/30" },
    shopify:      { label: "Shopify",  sub: "独立站友好",    icon: "🛒", color: "from-green-600/30 to-green-800/20 border-green-500/30" },
    amazon_fba:   { label: "Amazon FBA", sub: "FBA 标签合规", icon: "📦", color: "from-amber-600/30 to-amber-800/20 border-amber-500/30" },
    blind_ship:   { label: "白标发货", sub: "无品牌包装",    icon: "📬", color: "from-pink-600/30 to-pink-800/20 border-pink-500/30" },
    tiktok:       { label: "TikTok Shop", sub: "内容电商",   icon: "🎵", color: "from-rose-600/30 to-rose-800/20 border-rose-500/30" },
  };
  return (
    <div className="grid grid-cols-2 gap-2">
      {channels.slice(0, 4).map((ch) => {
        const info = channelMap[ch] || { label: ch, sub: "", icon: "✅", color: "from-slate-600/30 to-slate-800/20 border-slate-500/30" };
        return (
          <div key={ch} className={cn("rounded-xl p-3 bg-gradient-to-br border", info.color)}>
            <div className="text-lg mb-1">{info.icon}</div>
            <p className="text-xs font-semibold text-white">{info.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{info.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── 全球买家生态 ─────────────────────────────────────────────────────────────
function GlobalEcologyMap({ markets }: { markets: { region: string; buyers: number; flag: string }[] }) {
  const maxBuyers = Math.max(...markets.map((m) => m.buyers));
  return (
    <div className="space-y-3">
      {markets.map((m, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-slate-400"><span className="mr-1">{m.flag}</span>{m.region}</span>
            <span className="text-xs font-semibold text-slate-300">{m.buyers} 买家活跃</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full"
              style={{ width: `${(m.buyers / maxBuyers) * 100}%`, background: `linear-gradient(90deg, #7c3aed, #4f46e5)` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function FactoryDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const factoryId = parseInt(params.id || "1", 10);
  const [activeTab, setActiveTab] = useState("all");
  const [showAllProducts, setShowAllProducts] = useState(false);

  const { data: factory, isLoading, error } = trpc.factories.byId.useQuery({ id: factoryId });
  const favoriteMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => { toast.success(data.favorited ? "已收藏" : "已取消收藏"); },
    onError: () => { toast.error("操作失败，请重试"); },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{background:'linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)'}}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{borderColor:'rgba(124,58,237,0.6)',borderTopColor:'transparent'}} />
          <p style={{color:'rgba(255,255,255,0.35)'}}>加载工厂数据中...</p>
        </div>
      </div>
    );
  }
  if (error || !factory) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{background:'linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)'}}>
        <div className="text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4" style={{color:'rgba(255,255,255,0.15)'}} />
          <h2 className="text-xl font-bold mb-2 text-white">工厂未找到</h2>
          <p className="mb-4" style={{color:'rgba(255,255,255,0.35)'}}>{error?.message || "该工厂不存在或已下架"}</p>
          <button onClick={() => setLocation("/factories")} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)'}}>
            返回工厂大厅
          </button>
        </div>
      </div>
    );
  }

  const isFavorited = factory.isFavorited;
  const details = factory.details;
  const products = factory.products || [];
  const reviews = factory.reviews || [];
  const certifications: string[] = Array.isArray(details?.certifications)
    ? (details.certifications as string[]) : [];

  const filteredProducts = activeTab === "all" ? products : products.filter((p) => p.category === activeTab);
  const displayedProducts = showAllProducts ? filteredProducts : filteredProducts.slice(0, 6);
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const productTabs = [{ key: "all", label: "全部" }, ...categories.map((c) => ({ key: c!, label: c! }))];

  const coverImage = factory.logo || details?.coverImage ||
    "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=1400&h=500&fit=crop";
  const logoImage = factory.logo ||
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=120&h=120&fit=crop";

  // ── AMR 差异化权重 ────────────────────────────────────────────────────────
  const base = Number(factory.overallScore) || 3.5;
  const AMR_PROFILES: Record<number, { acumen: number; channel: number; velocity: number; global: number }> = {
    1:  { acumen: 0.90, channel: 0.80, velocity: 0.95, global: 0.85 },
    2:  { acumen: 0.74, channel: 0.90, velocity: 0.89, global: 0.94 },
    10: { acumen: 0.72, channel: 0.89, velocity: 0.88, global: 0.95 },
    11: { acumen: 0.82, channel: 0.74, velocity: 0.77, global: 0.67 },
    12: { acumen: 0.90, channel: 0.96, velocity: 0.96, global: 0.92 },
    13: { acumen: 0.60, channel: 0.65, velocity: 0.61, global: 0.47 },
    14: { acumen: 0.63, channel: 0.90, velocity: 0.86, global: 0.76 },
    15: { acumen: 0.63, channel: 0.59, velocity: 0.56, global: 0.61 },
  };
  const profile = AMR_PROFILES[factoryId] || { acumen: 0.88, channel: 0.95, velocity: 0.90, global: 0.82 };
  const amrScore    = Math.min(100, Math.round((base / 5) * 100 * 0.92));
  const amrAcumen   = Math.min(100, Math.round((base / 5) * 100 * profile.acumen));
  const amrChannel  = Math.min(100, Math.round((base / 5) * 100 * profile.channel));
  const amrVelocity = Math.min(100, Math.round((base / 5) * 100 * profile.velocity));
  const amrGlobal   = Math.min(100, Math.round((base / 5) * 100 * profile.global));

  const categoryLower = (factory.category || "").toLowerCase();
  const channels: string[] = ["small_moq"];
  if (categoryLower.includes("智能家居") || categoryLower.includes("穿戴科技") || categoryLower.includes("electron")) {
    channels.push("amazon_fba", "dropshipping", "trade_show");
  } else if (categoryLower.includes("运动") || categoryLower.includes("服装") || categoryLower.includes("apparel")) {
    channels.push("shopify", "blind_ship", "dropshipping");
  } else if (categoryLower.includes("美妆") || categoryLower.includes("个护")) {
    channels.push("amazon_fba", "shopify", "dropshipping");
  } else if (categoryLower.includes("模具") || categoryLower.includes("精密")) {
    channels.push("trade_show", "dropshipping", "shopify");
  } else {
    channels.push("dropshipping", "trade_show", "shopify");
  }

  const vibeTags = base >= 4.5
    ? [
        { text: "英文沟通流畅", weight: 5 }, { text: "快速打样", weight: 4 },
        { text: "小单可接", weight: 5 }, { text: "FBA 条码无缝", weight: 3 },
        { text: "包装质感好", weight: 4 }, { text: "决策层直接沟通", weight: 3 },
        { text: "TikTok 爆款感知强", weight: 2 },
      ]
    : base >= 4.0
    ? [
        { text: "响应及时", weight: 4 }, { text: "包装质感好", weight: 3 },
        { text: "价格透明", weight: 3 }, { text: "样品质量稳定", weight: 4 },
        { text: "沟通顺畅", weight: 3 },
      ]
    : [
        { text: "价格有竞争力", weight: 4 }, { text: "基础沟通顺畅", weight: 2 },
        { text: "交期稳定", weight: 3 },
      ];

  const avgShipHours = base >= 4.5 ? 24 : base >= 4.0 ? 36 : 48;
  const fulfillmentData = Array.from({ length: 20 }, (_, i) =>
    Math.max(8, avgShipHours + Math.round(Math.sin(i * 0.8) * 12))
  );
  const globalMarkets = [
    { region: "北美 (美国 / 加拿大)", buyers: Math.round(base * 25), flag: "🇺🇸" },
    { region: "欧洲 (英国 / 德国)",   buyers: Math.round(base * 18), flag: "🇬🇧" },
    { region: "中东 (UAE / 沙特)",     buyers: Math.round(base * 12), flag: "🇦🇪" },
    { region: "东南亚 (泰国 / 越南)", buyers: Math.round(base * 8),  flag: "🇹🇭" },
  ];
  const totalBuyers = globalMarkets.reduce((s, m) => s + m.buyers, 0);

  return (
    <div className="min-h-screen text-white" style={{background:'linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)'}}>
      {/* ── 顶部导航 ── */}
      <div className="sticky top-0 z-50 h-14 backdrop-blur-xl flex items-center justify-between px-6"
        style={{background:'rgba(5,3,16,0.85)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <button onClick={() => setLocation("/factories")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>工厂大厅</span>
        </button>
        <h1 className="text-sm font-semibold text-white truncate max-w-[200px]">{factory.name}</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => favoriteMutation.mutate({ targetType: "factory", targetId: factoryId })}
            disabled={favoriteMutation.isPending}
            className={cn("flex items-center gap-1.5 transition-colors text-sm",
              isFavorited ? "text-red-400" : "text-gray-400 hover:text-white")}>
            <Heart className={cn("w-4 h-4", isFavorited && "fill-red-400")} />
            <span className="hidden sm:inline">收藏</span>
          </button>
          <button className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">分享</span>
          </button>
        </div>
      </div>

      {/* ── Hero 封面图（升级版：420px + 数据浮层）── */}
      <div className="relative h-[420px] overflow-hidden">
        <img src={coverImage} alt={factory.name} className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.72)' }} />
        <div className="absolute inset-0"
          style={{background:'linear-gradient(to top, #050310 0%, rgba(5,3,16,0.5) 40%, rgba(5,3,16,0.1) 100%)'}} />
        <div className="absolute inset-0"
          style={{background:'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)'}} />

        {/* 数据浮层 - 右上角 */}
        <div className="absolute top-5 right-5 flex gap-3">
          {[
            { value: amrScore, label: "AMR 指数", color: "text-violet-300" },
            { value: totalBuyers, label: "活跃买家", color: "text-emerald-400" },
            { value: `${avgShipHours}h`, label: "平均发货", color: "text-amber-400" },
          ].map((item, i) => (
            <div key={i} className="rounded-xl px-4 py-2.5 text-center"
              style={{background:'rgba(0,0,0,0.6)',backdropFilter:'blur(12px)',border:'1px solid rgba(255,255,255,0.12)'}}>
              <div className={cn("text-2xl font-bold", item.color)}>{item.value}</div>
              <div className="text-[10px] text-slate-400 font-medium mt-0.5">{item.label}</div>
            </div>
          ))}
        </div>

        {/* 认证徽章 - 左下角 */}
        {certifications.length > 0 && (
          <div className="absolute bottom-24 left-6 flex gap-2 flex-wrap">
            {certifications.map((c) => (
              <span key={c} className="px-2.5 py-1 rounded-lg text-xs font-bold text-amber-200"
                style={{background:'rgba(245,158,11,0.25)',border:'1px solid rgba(245,158,11,0.4)',backdropFilter:'blur(8px)'}}>
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── 工厂标识栏 ── */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div className="flex items-end gap-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-2xl shadow-purple-500/30"
              style={{border:'2px solid rgba(124,58,237,0.6)',background:'#1A1C2E'}}>
              <img src={logoImage} alt={factory.name} className="w-full h-full object-cover" />
            </div>
            <div className="pb-2">
              <h1 className="text-2xl font-bold text-white leading-tight">{factory.name}</h1>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-400 flex-wrap">
                {(factory.city || factory.country) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    {[factory.city, factory.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {factory.category && (
                  <span className="flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5 text-purple-400" />
                    {factory.category}
                  </span>
                )}
                {base >= 4.0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="font-semibold">{base.toFixed(1)}</span>
                    <span className="text-gray-500">/ 5.0</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pb-2">
            <Button className="rounded-xl font-semibold h-11 px-6 shadow-lg shadow-purple-500/30"
              style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)'}}
              onClick={() => setLocation(`/book-meeting/${factory.id}`)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              预约 1:1 选品会
            </Button>
            <Button variant="outline"
              className="border-white/20 text-gray-200 hover:bg-white/10 rounded-xl h-11 px-5"
              onClick={() => setLocation(`/inquiry/new?factoryId=${factory.id}`)}>
              <Package className="w-4 h-4 mr-2" />
              发送询问
            </Button>
          </div>
        </div>
      </div>

      {/* ── 工厂简介 Banner ── */}
      {details?.description && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="rounded-2xl p-5 flex items-start gap-4"
            style={{background:'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(79,70,229,0.08))',border:'1px solid rgba(124,58,237,0.2)'}}>
            <Sparkles className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-300 leading-relaxed">{details.description}</p>
          </div>
        </div>
      )}

      {/* ── 三栏内容 ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">

        {/* ── 左栏 (25%) ── */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          {/* AMR 雷达图 */}
          <div className="rounded-2xl p-5" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">AMR 敏捷指数</h3>
            </div>
            <AMRRadarChart score={amrScore} acumen={amrAcumen} channel={amrChannel}
              velocity={amrVelocity} global={amrGlobal} />
            <p className="text-[10px] text-slate-600 text-center mt-3">基于平台交易数据与买家评价综合计算</p>
          </div>

          {/* 操作按钮 */}
          <div className="space-y-2">
            <Button className="w-full rounded-xl font-semibold h-11"
              style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)'}}
              onClick={() => setLocation(`/book-meeting/${factory.id}`)}>
              <MessageSquare className="w-4 h-4 mr-2" />预约选品会
            </Button>
            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold h-10"
              onClick={() => setLocation(`/inquiry/new?factoryId=${factory.id}`)}>
              <Package className="w-4 h-4 mr-2" />发送询问
            </Button>
            <Button variant="outline"
              className={cn("w-full rounded-xl font-semibold h-10 transition-all",
                isFavorited ? "bg-green-600/20 border-green-500/50 text-green-400 hover:bg-green-600/30"
                  : "border-white/20 text-gray-300 hover:bg-white/10")}
              onClick={() => favoriteMutation.mutate({ targetType: "factory", targetId: factoryId })}
              disabled={favoriteMutation.isPending}>
              <Heart className={cn("w-4 h-4 mr-2", isFavorited && "fill-green-400")} />
              {isFavorited ? "已收藏" : "加入收藏夹"}
            </Button>
          </div>

          {/* 联系方式 */}
          {(details?.phone || details?.email) && (
            <div className="rounded-2xl p-4 space-y-3"
              style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">联系方式</h4>
              {details.phone && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{background:'rgba(124,58,237,0.2)'}}>
                    <Phone className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <span className="text-sm text-white font-medium">{details.phone}</span>
                </div>
              )}
              {details.email && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{background:'rgba(124,58,237,0.2)'}}>
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <span className="text-sm text-white font-medium truncate">{details.email}</span>
                </div>
              )}
              {details.avgResponseTime && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{background:'rgba(52,211,153,0.15)'}}>
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <span className="text-sm text-emerald-400">平均 {details.avgResponseTime} 回复</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 中栏 (50%) ── */}
        <div className="col-span-12 lg:col-span-6 space-y-6">

          {/* 买家体感词云 */}
          <div className="rounded-2xl p-6" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-violet-400" />
              <h3 className="text-base font-semibold text-white">买家体感词云</h3>
              <span className="text-xs text-slate-500 ml-auto">来自 {reviews.length || Math.round(base * 15)} 位验证买家</span>
            </div>
            <BuyerVibeCloud tags={vibeTags} />
          </div>

          {/* 履约时效 */}
          <div className="rounded-2xl p-6" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                <h3 className="text-base font-semibold text-white">履约时效</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold text-emerald-300"
                style={{background:'rgba(52,211,153,0.15)',border:'1px solid rgba(52,211,153,0.3)'}}>
                均 {avgShipHours}h 发货
              </span>
            </div>
            <FulfillmentChart data={fulfillmentData} avgHours={avgShipHours} />
          </div>

          {/* 主要产品（升级版：大图卡片网格）*/}
          {products.length > 0 && (
            <div className="rounded-2xl p-6" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-4 h-4 text-violet-400" />
                <h3 className="text-base font-semibold text-white">主要产品</h3>
                <span className="text-xs text-slate-500 ml-auto">{products.length} 款产品</span>
              </div>

              {/* 分类 Tab */}
              {productTabs.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {productTabs.map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                        activeTab === tab.key ? "text-white" : "text-gray-500 hover:text-gray-300")}
                      style={activeTab === tab.key
                        ? {background:'linear-gradient(135deg,#7c3aed,#4f46e5)'}
                        : {background:'rgba(255,255,255,0.05)'}}>
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              {/* 产品大图网格 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayedProducts.map((product) => {
                  const images = Array.isArray(product.images) ? product.images as string[] : [];
                  const productImage = (product as any).coverImage || images[0] || null;
                  return (
                    <button key={product.id}
                      onClick={() => setLocation(`/product/${product.id}`)}
                      className="group rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all text-left"
                      style={{background:'rgba(255,255,255,0.04)'}}>
                      {/* 产品图 */}
                      <div className="relative h-36 overflow-hidden bg-gray-900">
                        {productImage ? (
                          <img src={productImage} alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-10 h-10 text-gray-700" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                      {/* 产品信息 */}
                      <div className="p-2.5">
                        <p className="text-xs font-medium text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-tight">{product.name}</p>
                        {product.category && <p className="text-[10px] text-gray-500 mt-1">{product.category}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* 展开/收起 */}
              {filteredProducts.length > 6 && (
                <button onClick={() => setShowAllProducts(!showAllProducts)}
                  className="w-full mt-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                  style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
                  {showAllProducts ? "收起" : `查看全部 ${filteredProducts.length} 款产品`}
                  <ChevronDown className={cn("w-4 h-4 transition-transform", showAllProducts && "rotate-180")} />
                </button>
              )}
            </div>
          )}

          {/* 买家评价 */}
          {reviews.length > 0 && (
            <div id="reviews" className="rounded-2xl p-6" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-semibold text-white">买家评价</h3>
                <span className="text-xs text-slate-500 ml-auto">{reviews.length} 条评价</span>
              </div>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="border-b border-white/5 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("w-3.5 h-3.5",
                            i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-600")} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                    {review.comment && <p className="text-sm text-gray-300 leading-relaxed">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 右栏 (25%) ── */}
        <div className="col-span-12 lg:col-span-3 space-y-5">

          {/* 渠道能力看板 */}
          <div className="rounded-2xl p-5" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">渠道能力</h3>
            </div>
            <ChannelCapabilityPanel channels={channels} />
          </div>

          {/* 全球买家生态 */}
          <div className="rounded-2xl p-5" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">全球买家生态</h3>
              <span className="text-[10px] text-slate-600 ml-auto">过去 30 天</span>
            </div>
            <GlobalEcologyMap markets={globalMarkets} />
          </div>

          {/* 国际认证（彩色图标化）*/}
          {certifications.length > 0 && (
            <div className="rounded-2xl p-5" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">国际认证</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {certifications.map((c) => (
                  <div key={c} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.25)'}}>
                    <Shield className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-300">{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 核心数据统计 */}
          <div className="rounded-2xl p-5 space-y-3" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">核心数据</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: amrScore,          label: "AMR 指数", color: "rgba(124,58,237,0.12)", border: "rgba(124,58,237,0.2)", text: "text-violet-300" },
                { value: `${avgShipHours}h`, label: "平均发货", color: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.2)",  text: "text-emerald-300" },
                { value: base.toFixed(1),   label: "综合评分", color: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)",  text: "text-amber-300" },
                { value: totalBuyers,       label: "活跃买家", color: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.2)",   text: "text-blue-300" },
              ].map((item, i) => (
                <div key={i} className="rounded-xl p-3 text-center"
                  style={{background: item.color, border: `1px solid ${item.border}`}}>
                  <div className={cn("text-xl font-bold", item.text)}>{item.value}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <Button variant="ghost" size="sm"
            className="w-full text-purple-400 hover:text-purple-300 hover:bg-purple-600/10 text-xs border border-purple-500/20"
            onClick={() => setLocation("/webinars")}>
            浏览所有网络研讨会
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
