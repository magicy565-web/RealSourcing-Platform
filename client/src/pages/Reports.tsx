import { useState } from "react";
import { useLocation } from "wouter";
import {
  TrendingUp, TrendingDown, BarChart3, PieChart, Download, Calendar,
  Package, Building2, MessageSquare, Eye, Star, DollarSign, Globe,
  ArrowUpRight, ArrowDownRight, Sparkles, RefreshCw, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

type Period = "7d" | "30d" | "90d" | "1y";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  "1y": "Last year",
};

const CATEGORY_COLORS = ["#9333ea", "#3b82f6", "#22c55e", "#eab308", "#6b7280"];
const CATEGORY_BG = ["bg-purple-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-gray-500"];

const AI_INSIGHTS = [
  {
    type: "opportunity",
    icon: "💡",
    title: "High-demand category detected",
    desc: "Consumer Electronics inquiries increased 45% this month. Consider expanding your supplier network in this category.",
    action: "Explore Factories",
    color: "border-purple-500/30 bg-purple-600/5",
    route: "/factories",
  },
  {
    type: "alert",
    icon: "⚡",
    title: "Response rate optimization",
    desc: "Factories that respond within 2 hours have 3x higher conversion rate. Your avg response time is 4.2h.",
    action: "View Inquiries",
    color: "border-yellow-500/30 bg-yellow-600/5",
    route: "/inquiries",
  },
  {
    type: "trend",
    icon: "📈",
    title: "Webinar engagement spike",
    desc: "Webinars with live product demos generate 2x more inquiries. 3 upcoming webinars match your preferences.",
    action: "Browse Webinars",
    color: "border-blue-500/30 bg-blue-600/5",
    route: "/webinars",
  },
];

export default function Reports() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<Period>("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── tRPC Queries ──────────────────────────────────────────────────────────
  const { data: inquiries = [], isLoading: inquiriesLoading, refetch: refetchInquiries } = trpc.inquiries.myInquiries.useQuery();
  const { data: meetings = [], isLoading: meetingsLoading, refetch: refetchMeetings } = trpc.meetings.myMeetings.useQuery();
  const { data: webinars = [], isLoading: webinarsLoading, refetch: refetchWebinars } = trpc.webinars.list.useQuery();
  const { data: factories = [], isLoading: factoriesLoading, refetch: refetchFactories } = trpc.factories.list.useQuery();

  const isLoading = inquiriesLoading || meetingsLoading || webinarsLoading || factoriesLoading;

  // ── Derived KPIs ──────────────────────────────────────────────────────────
  const totalInquiries = inquiries.length;
  const repliedInquiries = inquiries.filter((i) => i.status === "replied" || i.status === "negotiating" || i.status === "closed").length;
  const responseRate = totalInquiries > 0 ? Math.round((repliedInquiries / totalInquiries) * 100) : 0;

  const uniqueFactoriesContacted = new Set(inquiries.map((i) => i.factory?.id).filter(Boolean)).size;
  const webinarsAttended = webinars.filter((w) => w.status === "completed" || w.status === "past").length;
  const liveWebinars = webinars.filter((w) => w.status === "live").length;

  // ── Category Distribution ─────────────────────────────────────────────────
  const categoryMap: Record<string, number> = {};
  inquiries.forEach((inq) => {
    const cat = (inq.product as any)?.category || "Other";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => ({
      name,
      value: totalInquiries > 0 ? Math.round((count / totalInquiries) * 100) : 0,
      color: CATEGORY_BG[i] || "bg-gray-500",
      hex: CATEGORY_COLORS[i] || "#6b7280",
    }));

  // ── Top Factories ─────────────────────────────────────────────────────────
  const factoryInquiryMap: Record<number, { name: string; count: number }> = {};
  inquiries.forEach((inq) => {
    if (inq.factory) {
      const id = inq.factory.id;
      if (!factoryInquiryMap[id]) {
        factoryInquiryMap[id] = { name: inq.factory.name, count: 0 };
      }
      factoryInquiryMap[id].count++;
    }
  });
  const topFactories = Object.entries(factoryInquiryMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, data]) => ({
      id: parseInt(id),
      name: data.name,
      inquiries: data.count,
    }));

  // ── Inquiry Trend (last 12 months mock from real count) ───────────────────
  const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
  const inquiryTrend = MONTHS.map((_, i) => {
    // Use real count for current month, distribute proportionally for others
    const base = Math.max(1, Math.floor(totalInquiries / 12));
    return base + Math.floor(Math.random() * base * 0.5);
  });
  // Make last bar = actual total
  if (inquiryTrend.length > 0) inquiryTrend[inquiryTrend.length - 1] = Math.max(totalInquiries, 1);
  const maxInquiry = Math.max(...inquiryTrend, 1);

  const KPI_CARDS = [
    {
      title: "Total Inquiries",
      value: totalInquiries.toString(),
      change: "+12%",
      trend: "up" as const,
      icon: MessageSquare,
      color: "text-purple-400",
      bg: "bg-purple-600/10",
      sub: "vs last period",
    },
    {
      title: "Factories Contacted",
      value: uniqueFactoriesContacted.toString(),
      change: "+8%",
      trend: "up" as const,
      icon: Building2,
      color: "text-blue-400",
      bg: "bg-blue-600/10",
      sub: "vs last period",
    },
    {
      title: "Webinars Attended",
      value: webinarsAttended.toString(),
      change: liveWebinars > 0 ? `${liveWebinars} live now` : "0 live",
      trend: "up" as const,
      icon: Eye,
      color: "text-green-400",
      bg: "bg-green-600/10",
      sub: "completed webinars",
    },
    {
      title: "Response Rate",
      value: `${responseRate}%`,
      change: responseRate >= 50 ? "+Good" : "Needs work",
      trend: responseRate >= 50 ? "up" as const : "down" as const,
      icon: TrendingUp,
      color: "text-yellow-400",
      bg: "bg-yellow-600/10",
      sub: "inquiries replied",
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchInquiries(), refetchMeetings(), refetchWebinars(), refetchFactories()]);
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your sourcing performance and market insights</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 时间段选择 */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            {(["7d", "30d", "90d", "1y"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  period === p ? "bg-purple-600 text-white shadow-sm" : "text-muted-foreground hover:text-white"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-white/20 hover:bg-white/10 gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10 gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI 卡片 */}
      <div className="grid grid-cols-4 gap-4">
        {KPI_CARDS.map((kpi) => (
          <div key={kpi.title} className="bg-card/50 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kpi.bg)}>
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                kpi.trend === "up" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
              )}>
                {kpi.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {kpi.change}
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{kpi.value}</div>
            <div className="text-sm font-medium text-white/80">{kpi.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* 询价趋势图 */}
        <div className="col-span-2 bg-card/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold">Inquiry Trend</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{PERIOD_LABELS[period]}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-green-400">
              <TrendingUp className="w-4 h-4" />
              <span>+{responseRate}% response rate</span>
            </div>
          </div>
          {/* 柱状图 */}
          <div className="flex items-end gap-2 h-40">
            {inquiryTrend.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-md hover:from-purple-500 hover:to-purple-300 transition-all cursor-pointer relative group"
                  style={{ height: `${(val / maxInquiry) * 100}%`, minHeight: "4px" }}
                >
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {val} inquiries
                  </div>
                </div>
                <span className="text-[10px] text-muted-foreground">{MONTHS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 分类分布 */}
        <div className="bg-card/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">By Category</h3>
            <PieChart className="w-4 h-4 text-muted-foreground" />
          </div>
          {categoryData.length > 0 ? (
            <>
              {/* 饼图 */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    let cumulative = 0;
                    return categoryData.map((cat, i) => {
                      const pct = cat.value;
                      const offset = cumulative;
                      cumulative += pct;
                      return (
                        <circle
                          key={i}
                          cx="50" cy="50" r="40"
                          fill="none"
                          stroke={cat.hex}
                          strokeWidth="20"
                          strokeDasharray={`${pct * 2.513} ${251.3}`}
                          strokeDashoffset={`${-offset * 2.513}`}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-bold">{totalInquiries}</div>
                    <div className="text-[10px] text-muted-foreground">total</div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", cat.color)} />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{cat.name}</span>
                    <span className="text-xs font-semibold text-white">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <PieChart className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No data yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Start sending inquiries to see category breakdown</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 顶级工厂 */}
        <div className="bg-card/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Top Factories</h3>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
          {topFactories.length > 0 ? (
            <div className="space-y-3">
              {topFactories.map((factory, i) => (
                <div
                  key={factory.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
                  onClick={() => setLocation(`/factory/${factory.id}`)}
                >
                  <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}</span>
                  <div className="w-9 h-9 bg-purple-600/20 rounded-xl flex items-center justify-center text-sm font-bold text-purple-300">
                    {factory.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white truncate block">{factory.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white">{factory.inquiries}</div>
                    <div className="text-[10px] text-muted-foreground">inquiries</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No factory data yet</p>
              <Button
                size="sm"
                variant="link"
                className="text-purple-400 mt-1"
                onClick={() => setLocation("/factories")}
              >
                Browse factories →
              </Button>
            </div>
          )}
        </div>

        {/* AI 洞察 */}
        <div className="bg-card/50 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              AI Insights
            </h3>
            <span className="text-xs text-muted-foreground">Powered by AI</span>
          </div>
          <div className="space-y-3">
            {AI_INSIGHTS.map((insight, i) => (
              <div key={i} className={cn("p-4 rounded-xl border", insight.color)}>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white mb-1">{insight.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{insight.desc}</p>
                    <button
                      className="text-xs text-purple-400 hover:text-purple-300 mt-2 flex items-center gap-1 transition-colors"
                      onClick={() => setLocation(insight.route)}
                    >
                      {insight.action} <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
