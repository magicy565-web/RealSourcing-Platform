import { useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import { Icon as SolarIcon } from "@iconify/react";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

// Solar Icons Duotone 图标组件封装
const SIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => (
  <SolarIcon icon={`solar:${name}`} className={className} style={style} />
);

// 图标别名（对应 lucide 的命名）
const Radio = (p: any) => <SIcon name="radio-bold-duotone" {...p} />;
const Calendar = (p: any) => <SIcon name="calendar-bold-duotone" {...p} />;
const Building2 = (p: any) => <SIcon name="buildings-2-bold-duotone" {...p} />;
const FileText = (p: any) => <SIcon name="file-text-bold-duotone" {...p} />;
const TrendingUp = (p: any) => <SIcon name="graph-up-bold-duotone" {...p} />;
const Bell = (p: any) => <SIcon name="bell-bing-bold-duotone" {...p} />;
const User = (p: any) => <SIcon name="user-circle-bold-duotone" {...p} />;
const Send = (p: any) => <SIcon name="send-square-bold-duotone" {...p} />;
const Clock = (p: any) => <SIcon name="clock-circle-bold-duotone" {...p} />;
const Package = (p: any) => <SIcon name="delivery-bold-duotone" {...p} />;
const ArrowRight = (p: any) => <SIcon name="arrow-right-bold-duotone" {...p} />;
const Sparkles = (p: any) => <SIcon name="magic-stick-2-bold-duotone" {...p} />;
const Video = (p: any) => <SIcon name="videocamera-bold-duotone" {...p} />;
const ChevronRight = (p: any) => <SIcon name="alt-arrow-right-bold-duotone" {...p} />;
const Zap = (p: any) => <SIcon name="bolt-bold-duotone" {...p} />;
const Globe = (p: any) => <SIcon name="globe-bold-duotone" {...p} />;
const BarChart3 = (p: any) => <SIcon name="chart-2-bold-duotone" {...p} />;
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BlurFade } from "@/components/magicui/blur-fade";

const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px)
`;

// LIVE 脉冲动效组件
function LivePulse() {
  return (
    <span className="relative flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      <span className="text-[10px] font-bold text-red-400">LIVE</span>
    </span>
  );
}

function StatCard({
  icon: Icon, value, label, accent, onClick, badge, loading
}: {
  icon: any; value: number | string; label: string; accent: string;
  onClick?: () => void; badge?: string; loading?: boolean;
}) {
  const isLive = badge === "LIVE";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      onClick={onClick}
      className="rounded-2xl p-6 relative overflow-hidden cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${accent}20`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* BorderBeam 流光边框 */}
      <BorderBeam
        size={80}
        duration={8}
        colorFrom={accent}
        colorTo={`${accent}40`}
      />

      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `${accent}10`, filter: "blur(20px)" }} />

      <div className="flex items-center justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}15` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        {badge && (
          isLive ? <LivePulse /> : (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
              {badge}
            </span>
          )
        )}
      </div>
      <div className="text-3xl font-black text-white mb-1">
        {loading ? (
          <span className="w-8 h-7 block rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
        ) : typeof value === "number" ? (
          <NumberTicker value={value} className="text-3xl font-black text-white" />
        ) : value}
      </div>
      <div className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>{label}</div>
    </motion.div>
  );
}

function QuickAction({
  icon: Icon, label, desc, accent, onClick, badge
}: {
  icon: any; label: string; desc: string; accent: string; onClick: () => void; badge?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="rounded-2xl p-5 cursor-pointer relative overflow-hidden group"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid rgba(255,255,255,0.07)`,
      }}
    >
      {/* BorderBeam on hover via group */}
      <BorderBeam
        size={60}
        duration={10}
        colorFrom={accent}
        colorTo={`${accent}30`}
      />

      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}15` }}>
          <Icon className="w-5 h-5" style={{ color: accent }} />
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${accent}15`, color: accent }}>
              {badge}
            </span>
          )}
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1"
            style={{ color: "rgba(255,255,255,0.20)" }} />
        </div>
      </div>
      <p className="text-white font-semibold text-sm mb-0.5">{label}</p>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{desc}</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [aiInput, setAiInput] = useState("");

  if (user?.role === "factory") {
    setLocation("/factory-dashboard");
    return null;
  }

  const { data: webinars = [], isLoading: webinarsLoading } = trpc.webinars.list.useQuery();
  const { data: meetings = [], isLoading: meetingsLoading } = trpc.meetings.myMeetings.useQuery();
  const { data: inquiries = [], isLoading: inquiriesLoading } = trpc.inquiries.myInquiries.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();
  const { data: sampleOrders = [] } = trpc.sampleOrders.mySampleOrders.useQuery();

  const liveWebinars = webinars.filter((w) => w.status === "live");
  const upcomingWebinars = webinars.filter((w) => w.status === "scheduled" || w.status === "upcoming");
  const pendingInquiries = inquiries.filter((i) => i.status === "pending");
  const shippedSamples = sampleOrders.filter((o: any) => o.status === "shipped").length;

  const formatScheduledAt = (date: Date | null | undefined) => {
    if (!date) return "TBD";
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (diff < 0) return "已结束";
    if (hours < 24) return `今天 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (days === 1) return `明天 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  const getStatusStyle = (status: string) => {
    if (status === "live") return { bg: "rgba(239,68,68,0.15)", color: "#f87171", label: "LIVE" };
    if (status === "scheduled" || status === "upcoming") return { bg: "rgba(59,130,246,0.15)", color: "#60a5fa", label: "即将开始" };
    return { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", label: "已结束" };
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "40px 40px" }} />

      <BuyerSidebar userRole={user?.role || "buyer"} />

      <div className="flex-1 overflow-auto relative z-10">
        {/* Top Bar */}
        <div className="h-16 flex items-center justify-end px-8 gap-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,3,16,0.80)", backdropFilter: "blur(20px)" }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            onClick={() => setLocation("/notifications")}
          >
            <Bell className="w-4 h-4" style={{ color: "rgba(255,255,255,0.60)" }} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
            )}
          </motion.button>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            onClick={() => setLocation("/settings")}
          >
            <User className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        <div className="p-8">
          {/* Greeting - BlurFade 入场 */}
          <BlurFade delay={0.05} inView>
            <div className="mb-8">
              <h1 className="text-4xl font-black text-white mb-2">
                {greeting}，{user?.name || "采购商"} 👋
              </h1>
              <p style={{ color: "rgba(255,255,255,0.40)" }}>
                {liveWebinars.length > 0
                  ? `现在有 ${liveWebinars.length} 场 Webinar 正在直播`
                  : upcomingWebinars.length > 0
                  ? `即将有 ${upcomingWebinars.length} 场 Webinar 等待您参与`
                  : "欢迎回来，开始您的采购之旅"}
                {pendingInquiries.length > 0 && `，${pendingInquiries.length} 条询价待处理`}
              </p>
            </div>
          </BlurFade>

          {/* Stats Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Radio} value={liveWebinars.length} label="场直播中" accent="#f87171" loading={webinarsLoading}
              badge={liveWebinars.length > 0 ? "LIVE" : undefined} onClick={() => setLocation("/webinars")} />
            <StatCard icon={Calendar} value={upcomingWebinars.length} label="场即将开始" accent="#60a5fa" loading={webinarsLoading}
              onClick={() => setLocation("/webinars")} />
            <StatCard icon={Building2} value={meetings.length} label="场已安排会议" accent="#a78bfa" loading={meetingsLoading}
              onClick={() => setLocation("/meetings")} />
            <StatCard icon={FileText} value={inquiries.length} label="条询价记录" accent="#4ade80" loading={inquiriesLoading}
              badge={pendingInquiries.length > 0 ? `${pendingInquiries.length} 待处理` : undefined}
              onClick={() => setLocation("/inquiries")} />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Webinar 列表 */}
            <div className="lg:col-span-2">
              <BlurFade delay={0.1} inView>
                <div className="rounded-2xl overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div className="flex items-center justify-between px-6 py-5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <h2 className="text-lg font-bold text-white">推荐 Webinar</h2>
                    </div>
                    <button onClick={() => setLocation("/webinars")}
                      className="text-sm font-medium flex items-center gap-1 transition-colors"
                      style={{ color: "#a78bfa" }}>
                      查看全部 <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    {webinarsLoading ? (
                      [1, 2, 3].map((i) => (
                        <div key={i} className="h-20 rounded-xl animate-pulse"
                          style={{ background: "rgba(255,255,255,0.04)" }} />
                      ))
                    ) : webinars.length === 0 ? (
                      <div className="text-center py-10" style={{ color: "rgba(255,255,255,0.25)" }}>
                        <Radio className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">暂无 Webinar</p>
                      </div>
                    ) : (
                      webinars.slice(0, 3).map((webinar, idx) => {
                        const st = getStatusStyle(webinar.status);
                        return (
                          <BlurFade key={webinar.id} delay={0.12 + idx * 0.05} inView>
                            <motion.div
                              whileHover={{ x: 4 }}
                              className="flex gap-4 p-4 rounded-xl cursor-pointer transition-all"
                              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                              onClick={() => setLocation(`/webinar/${webinar.id}`)}
                            >
                              <div className="relative flex-shrink-0">
                                <img
                                  src={webinar.coverImage || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=120&fit=crop"}
                                  alt={webinar.title}
                                  className="w-28 h-18 rounded-xl object-cover"
                                  style={{ width: "7rem", height: "4.5rem" }}
                                />
                                <span className="absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                                  style={{ background: st.bg, color: st.color }}>
                                  {webinar.status === "live" ? (
                                    <span className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                      LIVE
                                    </span>
                                  ) : st.label}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold text-sm truncate mb-1">{webinar.title}</h3>
                                <p className="text-xs truncate mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
                                  {webinar.description || "精选工厂直播选品"}
                                </p>
                                <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                                  <Clock className="w-3 h-3" />
                                  {formatScheduledAt(webinar.scheduledAt)}
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="self-center flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold"
                                style={webinar.status === "live" ? {
                                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                                  color: "white",
                                } : {
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  color: "rgba(255,255,255,0.60)",
                                }}
                                onClick={(e) => { e.stopPropagation(); setLocation(`/webinar/${webinar.id}`); }}
                              >
                                {webinar.status === "live" ? "立即参与" : webinar.status === "scheduled" ? "注册" : "回放"}
                              </motion.button>
                            </motion.div>
                          </BlurFade>
                        );
                      })
                    )}
                  </div>
                </div>
              </BlurFade>
            </div>

            {/* AI 采购助理 */}
            <div className="lg:col-span-1">
              <BlurFade delay={0.15} inView>
                <div className="rounded-2xl h-full flex flex-col overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div className="flex items-center gap-2.5 px-6 py-5"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(167,139,250,0.15)" }}>
                      <Zap className="w-4 h-4 text-violet-400" />
                    </div>
                    <h2 className="text-lg font-bold text-white">AI 采购助理</h2>
                    <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.25)" }}>
                      BETA
                    </span>
                  </div>

                  <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    <BlurFade delay={0.2} inView>
                      <div className="flex gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1 rounded-xl p-3 text-sm"
                          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)", color: "rgba(255,255,255,0.70)" }}>
                          👋 您好！我是您的AI采购助理。请告诉我您的采购需求，我来帮您精准匹配优质工厂。
                        </div>
                      </div>
                    </BlurFade>

                    {inquiries.length > 0 && (
                      <BlurFade delay={0.25} inView>
                        <div className="flex gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="flex-1 rounded-xl p-3"
                            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
                            <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.70)" }}>
                              📋 您有 {inquiries.length} 条询价记录，其中 {pendingInquiries.length} 条待处理。
                            </p>
                            <div className="space-y-2">
                              {[
                                { label: "查看推荐工厂", href: "/factories" },
                                { label: "浏览相关 Webinar", href: "/webinars" },
                                { label: "查看询价记录", href: "/inquiries" },
                              ].map((btn) => (
                                <button key={btn.label} onClick={() => setLocation(btn.href)}
                                  className="w-full text-left text-xs px-3 py-2 rounded-lg transition-all"
                                  style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(124,58,237,0.20)",
                                    color: "rgba(255,255,255,0.55)",
                                  }}>
                                  {btn.label} →
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </BlurFade>
                    )}
                  </div>

                  <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="relative">
                      <input
                        placeholder="输入您的采购需求..."
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        className="w-full pl-4 pr-12 h-10 rounded-xl text-sm text-white placeholder:text-white/20 outline-none"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.10)",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && aiInput.trim()) {
                            setLocation(`/ai-assistant?q=${encodeURIComponent(aiInput)}`);
                            setAiInput("");
                          }
                        }}
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                        onClick={() => {
                          if (aiInput.trim()) {
                            setLocation(`/ai-assistant?q=${encodeURIComponent(aiInput)}`);
                            setAiInput("");
                          }
                        }}
                      >
                        <Send className="w-3.5 h-3.5 text-white" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <QuickAction icon={Video} label="预约会议" desc="与工厂面对面谈判" accent="#60a5fa" onClick={() => setLocation("/factories")} />
            <QuickAction icon={Package} label="样品订单" desc={`${sampleOrders.length} 条订单`} accent="#fbbf24" onClick={() => setLocation("/sample-orders")}
              badge={shippedSamples > 0 ? `${shippedSamples} 运输中` : undefined} />
            <QuickAction icon={Sparkles} label="AI 采购助理" desc="智能工厂匹配" accent="#a78bfa" onClick={() => setLocation("/ai-assistant")} />
            <QuickAction icon={FileText} label="询价记录" desc={`${pendingInquiries.length} 条待回复`} accent="#4ade80" onClick={() => setLocation("/inquiries")} />
          </div>

          {/* Recent Meetings */}
          {meetings.length > 0 && (
            <BlurFade delay={0.2} inView>
              <div className="rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div className="flex items-center justify-between px-6 py-5"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-violet-400" />
                    <h2 className="text-lg font-bold text-white">最近会议</h2>
                  </div>
                  <button onClick={() => setLocation("/meetings")}
                    className="text-sm font-medium flex items-center gap-1"
                    style={{ color: "#a78bfa" }}>
                    查看全部 <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {meetings.slice(0, 3).map((meeting, idx) => (
                    <BlurFade key={meeting.id} delay={0.22 + idx * 0.05} inView>
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="p-4 rounded-xl cursor-pointer relative overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        onClick={() => setLocation(`/meeting/${meeting.id}`)}
                      >
                        <BorderBeam size={50} duration={12} colorFrom="#7c3aed" colorTo="#a78bfa40" />
                        <div className="flex items-center gap-2.5 mb-2">
                          {meeting.factory?.logo ? (
                            <img src={meeting.factory.logo} alt={meeting.factory.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ background: "rgba(124,58,237,0.15)" }}>
                              <Building2 className="w-4 h-4 text-violet-400" />
                            </div>
                          )}
                          <span className="text-xs truncate" style={{ color: "rgba(255,255,255,0.40)" }}>
                            {meeting.factory?.name || "Unknown Factory"}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm text-white truncate mb-1.5">{meeting.title}</h3>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                            <Clock className="w-3 h-3" />
                            {formatScheduledAt(meeting.scheduledAt)}
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={
                              meeting.status === "completed" ? { background: "rgba(74,222,128,0.12)", color: "#4ade80" } :
                              meeting.status === "in_progress" ? { background: "rgba(96,165,250,0.12)", color: "#60a5fa" } :
                              meeting.status === "cancelled" ? { background: "rgba(248,113,113,0.12)", color: "#f87171" } :
                              { background: "rgba(251,191,36,0.12)", color: "#fbbf24" }
                            }>
                            {meeting.status}
                          </span>
                        </div>
                      </motion.div>
                    </BlurFade>
                  ))}
                </div>
              </div>
            </BlurFade>
          )}
        </div>
      </div>
    </div>
  );
}
