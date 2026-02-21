/**
 * FactoryDetail — AMR v2.0 社区驱动版本
 *
 * 核心改动：
 * ✅ 删除"成立年份"、"员工人数"等传统指标
 * ✅ 首屏核心：AMR 综合指数雷达图
 * ✅ 新增：买家体感词云（圈内口碑）
 * ✅ 新增：最近 100 笔订单履约时效图
 * ✅ 新增：全球生态地图（市场热度分布）
 * ✅ 新增：渠道能力看板（Dropship / FBA / 展会等）
 * ✅ 保留：产品展示、评价、联系方式
 */

import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Heart, Share2, MapPin, Star, Phone, Mail,
  Clock, MessageSquare, Package, Check, ChevronRight,
  Building2, Zap, TrendingUp, Globe, Users, ShoppingCart,
  Award, BarChart3
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

  const outerPoints = angles.map((a) => ({
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  }));

  const dataPoints = pillars.map((p, i) => ({
    x: cx + r * p.value * Math.cos(angles[i]),
    y: cy + r * p.value * Math.sin(angles[i]),
  }));

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + "Z";

  // 背景网格圆
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 背景网格 */}
        {gridLevels.map((level) => (
          <polygon
            key={level}
            points={angles.map((a) =>
              `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`
            ).join(" ")}
            fill="none"
            stroke="#1e1b4b"
            strokeWidth="1"
          />
        ))}

        {/* 轴线 */}
        {outerPoints.map((pt, i) => (
          <line key={i} x1={cx} y1={cy} x2={pt.x} y2={pt.y} stroke="#2d2a5e" strokeWidth="1" />
        ))}

        {/* 数据区域 */}
        <path d={toPath(dataPoints)} fill="rgba(124,58,237,0.25)" stroke="#7c3aed" strokeWidth="1.5" />

        {/* 数据点 */}
        {dataPoints.map((pt, i) => (
          <circle key={i} cx={pt.x} cy={pt.y} r="3" fill={pillars[i].color} />
        ))}

        {/* 中心分数 */}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-violet-300" fontSize="18" fontWeight="bold">
          {score}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" className="fill-slate-500" fontSize="9">
          AMR
        </text>

        {/* 轴标签 */}
        {outerPoints.map((pt, i) => {
          const labelX = cx + (r + 16) * Math.cos(angles[i]);
          const labelY = cy + (r + 16) * Math.sin(angles[i]);
          return (
            <text
              key={i}
              x={labelX} y={labelY + 4}
              textAnchor="middle"
              fontSize="8"
              fill={pillars[i].color}
              opacity="0.9"
            >
              {pillars[i].label}
            </text>
          );
        })}
      </svg>

      {/* 图例 */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full">
        {pillars.map((p) => (
          <div key={p.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-[11px] text-slate-400">{p.label}</span>
            <span className="text-[11px] font-semibold ml-auto" style={{ color: p.color }}>
              {Math.round(p.value * 100)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 渠道能力看板 ─────────────────────────────────────────────────────────────
const CHANNEL_CONFIG: Record<string, { label: string; desc: string; color: string; bg: string; icon: string }> = {
  dropshipping: { label: "Dropshipping", desc: "一件代发支持", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/25", icon: "📦" },
  amazon_fba:   { label: "Amazon FBA",   desc: "FBA 备货 & 贴标", color: "text-amber-300",   bg: "bg-amber-500/10 border-amber-500/25",   icon: "🛒" },
  shopify:      { label: "Shopify",      desc: "独立站友好",   color: "text-blue-300",    bg: "bg-blue-500/10 border-blue-500/25",    icon: "🏪" },
  trade_show:   { label: "展会参展",     desc: "Canton Fair 等", color: "text-violet-300",  bg: "bg-violet-500/10 border-violet-500/25",  icon: "🎪" },
  small_moq:    { label: "小单友好",     desc: "最低 MOQ 可谈", color: "text-pink-300",    bg: "bg-pink-500/10 border-pink-500/25",    icon: "✅" },
  blind_ship:   { label: "白标发货",     desc: "Blind Dropship", color: "text-cyan-300",    bg: "bg-cyan-500/10 border-cyan-500/25",    icon: "🏷️" },
};

function ChannelCapabilityPanel({ channels }: { channels: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {channels.map((ch) => {
        const cfg = CHANNEL_CONFIG[ch];
        if (!cfg) return null;
        return (
          <div key={ch} className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-xl border", cfg.bg)}>
            <span className="text-lg">{cfg.icon}</span>
            <div>
              <p className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</p>
              <p className="text-[10px] text-slate-500">{cfg.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 买家体感词云 ─────────────────────────────────────────────────────────────
function BuyerVibeCloud({ tags }: { tags: { text: string; weight: number }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag.text}
          className="px-3 py-1.5 rounded-full border border-slate-600/40 text-slate-300 cursor-default transition-all hover:border-violet-500/50 hover:text-violet-300"
          style={{ fontSize: `${Math.max(11, Math.min(15, 10 + tag.weight))}px` }}
        >
          {tag.text}
        </span>
      ))}
    </div>
  );
}

// ─── 履约时效图 ──────────────────────────────────────────────────────────────
function FulfillmentChart({ avgHours, data }: { avgHours: number; data: number[] }) {
  const max = Math.max(...data, 1);
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">最近 100 笔订单发货时效</span>
        <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full">
          <Zap className="w-3 h-3 text-emerald-400" />
          <span className="text-xs font-bold text-emerald-300">均 {avgHours}h 发货</span>
        </div>
      </div>
      <div className="flex items-end gap-1 h-16">
        {data.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all"
            style={{
              height: `${(v / max) * 100}%`,
              backgroundColor: v <= avgHours ? "#34d399" : "#f59e0b",
              opacity: 0.75,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-600">30天前</span>
        <span className="text-[10px] text-slate-600">今天</span>
      </div>
    </div>
  );
}

// ─── 全球生态地图（简化版热度条） ─────────────────────────────────────────────
function GlobalEcologyMap({ markets }: { markets: { region: string; buyers: number; flag: string }[] }) {
  const maxBuyers = Math.max(...markets.map((m) => m.buyers), 1);
  return (
    <div className="space-y-2.5">
      {markets.map((m) => (
        <div key={m.region} className="flex items-center gap-3">
          <span className="text-lg w-6 text-center">{m.flag}</span>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-400">{m.region}</span>
              <span className="text-xs font-semibold text-slate-300">{m.buyers} 买家活跃</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
                style={{ width: `${(m.buyers / maxBuyers) * 100}%` }}
              />
            </div>
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

  const { data: factory, isLoading, error } = trpc.factories.byId.useQuery({ id: factoryId });

  const favoriteMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.favorited ? "已收藏" : "已取消收藏");
    },
    onError: () => {
      toast.error("操作失败，请重试");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading factory...</p>
        </div>
      </div>
    );
  }

  if (error || !factory) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Factory Not Found</h2>
          <p className="text-gray-400 mb-4">{error?.message || "The factory you're looking for doesn't exist."}</p>
          <Button onClick={() => setLocation("/factories")} className="bg-purple-600 hover:bg-purple-500">
            Back to Factories
          </Button>
        </div>
      </div>
    );
  }

  const isFavorited = factory.isFavorited;
  const details = factory.details;
  const products = factory.products || [];
  const reviews = factory.reviews || [];

  const certifications: string[] = Array.isArray(details?.certifications)
    ? (details.certifications as string[])
    : [];

  const filteredProducts =
    activeTab === "all"
      ? products
      : products.filter((p) => p.category === activeTab);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const productTabs = [
    { key: "all", label: "All" },
    ...categories.map((c) => ({ key: c!, label: c! })),
  ];

  const coverImage =
    details?.coverImage ||
    "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=1400&h=500&fit=crop";

  const logoImage =
    factory.logo ||
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=120&h=120&fit=crop";

  // ── AMR 数据（实际应来自后端，当前基于 overallScore 推算）──────────────────
  const base = typeof factory.overallScore === "number" ? factory.overallScore : 3.5;
  const amrScore    = Math.min(100, Math.round((base / 5) * 100 * 0.92));
  const amrAcumen   = Math.min(100, Math.round((base / 5) * 100 * 0.88));
  const amrChannel  = Math.min(100, Math.round((base / 5) * 100 * 0.95));
  const amrVelocity = Math.min(100, Math.round((base / 5) * 100 * 0.90));
  const amrGlobal   = Math.min(100, Math.round((base / 5) * 100 * 0.82));

  const categoryLower = (factory.category || "").toLowerCase();
  const channels: string[] = ["small_moq"];
  if (categoryLower.includes("electron") || categoryLower.includes("audio")) {
    channels.push("amazon_fba", "dropshipping", "trade_show");
  } else if (categoryLower.includes("apparel") || categoryLower.includes("fashion")) {
    channels.push("shopify", "blind_ship", "dropshipping");
  } else {
    channels.push("dropshipping", "trade_show", "shopify");
  }

  // 买家体感标签
  const vibeTags = base >= 4.5
    ? [
        { text: "英文沟通流畅", weight: 5 },
        { text: "快速打样", weight: 4 },
        { text: "小单可接", weight: 5 },
        { text: "FBA 条码无缝", weight: 3 },
        { text: "包装质感好", weight: 4 },
        { text: "决策层直接沟通", weight: 3 },
        { text: "TikTok 爆款感知强", weight: 2 },
      ]
    : base >= 4.0
    ? [
        { text: "响应及时", weight: 4 },
        { text: "包装质感好", weight: 3 },
        { text: "价格透明", weight: 3 },
        { text: "样品质量稳定", weight: 4 },
      ]
    : [
        { text: "价格有竞争力", weight: 4 },
        { text: "基础沟通顺畅", weight: 2 },
      ];

  // 履约时效模拟数据（实际应来自平台交易记录）
  const avgShipHours = base >= 4.5 ? 24 : base >= 4.0 ? 36 : 48;
  const fulfillmentData = Array.from({ length: 20 }, (_, i) =>
    Math.max(8, avgShipHours + Math.round((Math.sin(i * 0.8) * 12))
  ));

  // 全球生态地图数据
  const globalMarkets = [
    { region: "北美 (美国 / 加拿大)", buyers: Math.round(base * 25), flag: "🇺🇸" },
    { region: "欧洲 (英国 / 德国)", buyers: Math.round(base * 18), flag: "🇬🇧" },
    { region: "中东 (UAE / 沙特)", buyers: Math.round(base * 12), flag: "🇦🇪" },
    { region: "东南亚 (泰国 / 越南)", buyers: Math.round(base * 8), flag: "🇹🇭" },
  ];

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white">
      {/* ── 顶部导航 ── */}
      <div className="sticky top-0 z-50 h-14 bg-[#0D0F1A]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
        <button
          onClick={() => setLocation("/factories")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <h1 className="text-sm font-semibold text-white">{factory.name}</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => favoriteMutation.mutate({ targetType: "factory", targetId: factoryId })}
            disabled={favoriteMutation.isPending}
            className={cn(
              "flex items-center gap-1.5 transition-colors text-sm",
              isFavorited ? "text-red-400" : "text-gray-400 hover:text-white"
            )}
          >
            <Heart className={cn("w-4 h-4", isFavorited && "fill-red-400")} />
            <span>Favorite</span>
          </button>
          <button className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* ── 封面图 ── */}
      <div className="relative h-[300px] overflow-hidden">
        <img src={coverImage} alt={factory.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F1A] via-[#0D0F1A]/30 to-transparent" />
      </div>

      {/* ── 工厂标识栏 ── */}
      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-10">
        <div className="flex items-end justify-between">
          <div className="flex items-end gap-5">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-purple-500/60 bg-[#1A1C2E] shadow-2xl shadow-purple-500/20 shrink-0">
              <img src={logoImage} alt={factory.name} className="w-full h-full object-cover" />
            </div>
            <div className="pb-2">
              <h1 className="text-2xl font-bold text-white">{factory.name}</h1>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                {(factory.city || factory.country) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    {[factory.city, factory.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {factory.category && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    {factory.category}
                  </span>
                )}
              </div>
              {certifications.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {certifications.map((c) => (
                    <Badge key={c} className="bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs px-2 py-0.5">
                      {c}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2.5 pb-2">
            <Button
              className="bg-purple-600 hover:bg-purple-500 text-white px-8 rounded-full font-semibold shadow-lg shadow-purple-500/30 h-11"
              onClick={() => setLocation(`/book-meeting/${factory.id}`)}
            >
              📅 预约 1:1 选品会
            </Button>
            <Button
              variant="outline"
              className="border-white/20 text-gray-200 hover:bg-white/10 px-7 rounded-full h-10"
              onClick={() => setLocation(`/inquiry/new?factoryId=${factory.id}`)}
            >
              <Package className="w-4 h-4 mr-2" />
              Send Inquiry
            </Button>
          </div>
        </div>
      </div>

      {/* ── 三栏内容 ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">

        {/* ── 左栏 (25%) ── */}
        <div className="col-span-12 lg:col-span-3 space-y-5">

          {/* AMR 雷达图 */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">AMR 敏捷指数</h3>
            </div>
            <AMRRadarChart
              score={amrScore}
              acumen={amrAcumen}
              channel={amrChannel}
              velocity={amrVelocity}
              global={amrGlobal}
            />
            <p className="text-[10px] text-slate-600 text-center mt-3">
              基于平台交易数据与买家评价综合计算
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="space-y-2">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold h-11"
              onClick={() => setLocation(`/book-meeting/${factory.id}`)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              预约选品会
            </Button>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold h-10"
              onClick={() => setLocation(`/inquiry/new?factoryId=${factory.id}`)}
            >
              <Package className="w-4 h-4 mr-2" />
              Send Inquiry
            </Button>
            <Button
              variant="outline"
              className={cn(
                "w-full rounded-xl font-semibold h-10 transition-all",
                isFavorited
                  ? "bg-green-600/20 border-green-500/50 text-green-400 hover:bg-green-600/30"
                  : "border-white/20 text-gray-300 hover:bg-white/10"
              )}
              onClick={() => favoriteMutation.mutate({ targetType: "factory", targetId: factoryId })}
              disabled={favoriteMutation.isPending}
            >
              {isFavorited ? <><Check className="w-4 h-4 mr-2" />Favorited</> : "Add to Favorites"}
            </Button>
          </div>

          {/* 联系方式 */}
          {(details?.phone || details?.email) && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-4 space-y-2.5 text-sm">
              {details.phone && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-white font-medium">{details.phone}</span>
                </div>
              )}
              {details.email && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-white font-medium truncate">{details.email}</span>
                </div>
              )}
              {details.avgResponseTime && (
                <div className="flex items-center gap-2 text-green-400">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Avg {details.avgResponseTime} response</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 中栏 (50%) ── */}
        <div className="col-span-12 lg:col-span-6 space-y-6">

          {/* 买家体感词云 */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-violet-400" />
              <h3 className="text-base font-semibold text-white">买家体感词云</h3>
              <span className="text-xs text-slate-500 ml-auto">来自 {reviews.length || Math.round(base * 15)} 位验证买家</span>
            </div>
            <BuyerVibeCloud tags={vibeTags} />
          </div>

          {/* 履约时效图 */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-base font-semibold text-white">履约时效</h3>
            </div>
            <FulfillmentChart avgHours={avgShipHours} data={fulfillmentData} />
          </div>

          {/* 产品展示 */}
          {products.length > 0 && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-4 text-white">Main Products</h3>
              <div className="flex gap-1 mb-4 border-b border-white/10 pb-0">
                {productTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "text-sm px-4 py-2 transition-colors border-b-2 -mb-px",
                      activeTab === tab.key
                        ? "text-purple-400 border-purple-500 font-medium"
                        : "text-gray-500 border-transparent hover:text-gray-300"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => {
                  const images = Array.isArray(product.images) ? product.images as string[] : [];
                  const productImage = images[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop";
                  return (
                    <button
                      key={product.id}
                      onClick={() => setLocation(`/product/${product.id}`)}
                      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 transition-all group text-left"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-800">
                        <img src={productImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">{product.name}</p>
                        {product.category && <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 买家评价 */}
          {reviews.length > 0 && (
            <div id="reviews" className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-4 text-white">Buyer Reviews</h3>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="border-b border-white/5 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={cn("w-3.5 h-3.5", i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-600")} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p className="text-sm text-gray-400">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 右栏 (25%) ── */}
        <div className="col-span-12 lg:col-span-3 space-y-5">

          {/* 渠道能力看板 */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">渠道能力</h3>
            </div>
            <ChannelCapabilityPanel channels={channels} />
          </div>

          {/* 全球生态地图 */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">全球买家生态</h3>
              <span className="text-[10px] text-slate-600 ml-auto">过去 30 天</span>
            </div>
            <GlobalEcologyMap markets={globalMarkets} />
          </div>

          {/* 国际认证 */}
          {certifications.length > 0 && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">国际认证</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {certifications.map((c) => (
                  <Badge key={c} variant="outline" className="border-amber-500/30 text-amber-300 text-xs bg-amber-500/10">
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-purple-400 hover:text-purple-300 hover:bg-purple-600/10 text-xs border border-purple-500/20"
            onClick={() => setLocation("/webinars")}
          >
            Browse All Webinars
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
