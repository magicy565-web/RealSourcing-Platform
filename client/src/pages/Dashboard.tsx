import { useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import { Icon as SolarIcon } from "@iconify/react";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BlurFade } from "@/components/magicui/blur-fade";

// Solar Icons 封装
const SIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => (
  <SolarIcon icon={`solar:${name}`} className={className} style={style} />
);
const Radio = (p: any) => <SIcon name="radio-bold-duotone" {...p} />;
const Calendar = (p: any) => <SIcon name="calendar-bold-duotone" {...p} />;
const Building2 = (p: any) => <SIcon name="buildings-2-bold-duotone" {...p} />;
const FileText = (p: any) => <SIcon name="file-text-bold-duotone" {...p} />;
const Bell = (p: any) => <SIcon name="bell-bing-bold-duotone" {...p} />;
const User = (p: any) => <SIcon name="user-circle-bold-duotone" {...p} />;
const Send = (p: any) => <SIcon name="send-square-bold-duotone" {...p} />;
const Clock = (p: any) => <SIcon name="clock-circle-bold-duotone" {...p} />;
const Package = (p: any) => <SIcon name="delivery-bold-duotone" {...p} />;
const ArrowRight = (p: any) => <SIcon name="arrow-right-bold-duotone" {...p} />;
const Sparkles = (p: any) => <SIcon name="magic-stick-2-bold-duotone" {...p} />;
const Video = (p: any) => <SIcon name="videocamera-bold-duotone" {...p} />;
const Zap = (p: any) => <SIcon name="bolt-bold-duotone" {...p} />;
const Globe = (p: any) => <SIcon name="globe-bold-duotone" {...p} />;
const Rocket = (p: any) => <SIcon name="rocket-bold-duotone" {...p} />;

// LIVE 脉冲动效
function LivePulse() {
  return (
    <span className="relative flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
      </span>
      <span className="text-badge text-red-400 tracking-widest">LIVE</span>
    </span>
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
    <div className="flex min-h-screen" style={{ background: "#09090b" }}>
      {/* 背景紫色光晕 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)" }} />
      </div>

      <BuyerSidebar userRole={user?.role || "buyer"} />

      <div className="flex-1 overflow-auto relative z-10">
        {/* Top Bar */}
        <div className="h-14 flex items-center justify-end px-6 gap-3 sticky top-0 z-20"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(9,9,11,0.85)", backdropFilter: "blur(20px)" }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            onClick={() => setLocation("/notifications")}
          >
            <Bell className="w-4 h-4" style={{ color: "rgba(255,255,255,0.50)" }} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </motion.button>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            onClick={() => setLocation("/settings")}
          >
            <User className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        <div className="p-6 max-w-[1400px] mx-auto">
          {/* Greeting */}
          <BlurFade delay={0.05} inView>
            <div className="mb-6">
              <h1 className="text-heading-1 mb-1">
                {greeting}，{user?.name || "采购商"} 👋
              </h1>
              <p className="text-body text-tertiary">
                {liveWebinars.length > 0
                  ? `现在有 ${liveWebinars.length} 场 Webinar 正在直播`
                  : upcomingWebinars.length > 0
                  ? `即将有 ${upcomingWebinars.length} 场 Webinar 等待您参与`
                  : "欢迎回来，开始您的采购之旅"}
              </p>
            </div>
          </BlurFade>

          {/* ===== BENTO GRID ===== */}
          {/* Row 1: 统计数字 Bento — 不等宽布局 */}
          <BlurFade delay={0.08} inView>
            <div className="grid grid-cols-12 gap-3 mb-3">

              {/* 大卡：直播中 (col-span-4) */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setLocation("/webinars")}
                className="col-span-12 sm:col-span-6 lg:col-span-4 rounded-2xl p-6 cursor-pointer relative overflow-hidden"
                style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", minHeight: "140px" }}
              >
                <BorderBeam size={100} duration={7} colorFrom="#f87171" colorTo="#f8717130" />
                <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
                  style={{ background: "rgba(239,68,68,0.08)", filter: "blur(24px)" }} />
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(239,68,68,0.12)" }}>
                    <Radio className="w-5 h-5" style={{ color: "#f87171" }} />
                  </div>
                  {liveWebinars.length > 0 && <LivePulse />}
                </div>
                <div className="text-stat-number text-numeric mb-1">
                  {webinarsLoading ? (
                    <span className="w-10 h-9 block rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                  ) : (
                    <NumberTicker value={liveWebinars.length} className="text-stat-number text-numeric" />
                  )}
                </div>
                <p className="text-caption">场直播中</p>
              </motion.div>

              {/* 中卡：即将开始 (col-span-3) */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setLocation("/webinars")}
                className="col-span-6 sm:col-span-3 lg:col-span-3 rounded-2xl p-5 cursor-pointer relative overflow-hidden"
                style={{ background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.12)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(96,165,250,0.10)" }}>
                  <Calendar className="w-4.5 h-4.5" style={{ color: "#60a5fa" }} />
                </div>
                <div className="text-stat-number text-numeric mb-1">
                  {webinarsLoading ? (
                    <span className="w-8 h-8 block rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                  ) : (
                    <NumberTicker value={upcomingWebinars.length} className="text-stat-number text-numeric" />
                  )}
                </div>
                <p className="text-caption">场即将开始</p>
              </motion.div>

              {/* 中卡：已安排会议 (col-span-3) */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setLocation("/meetings")}
                className="col-span-6 sm:col-span-3 lg:col-span-3 rounded-2xl p-5 cursor-pointer relative overflow-hidden"
                style={{ background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.12)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(167,139,250,0.10)" }}>
                  <Building2 className="w-4.5 h-4.5" style={{ color: "#a78bfa" }} />
                </div>
                <div className="text-stat-number text-numeric mb-1">
                  {meetingsLoading ? (
                    <span className="w-8 h-8 block rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                  ) : (
                    <NumberTicker value={meetings.length} className="text-stat-number text-numeric" />
                  )}
                </div>
                <p className="text-caption">场已安排会议</p>
              </motion.div>

              {/* 小卡：询价记录 (col-span-2) */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setLocation("/inquiries")}
                className="col-span-12 sm:col-span-6 lg:col-span-2 rounded-2xl p-5 cursor-pointer relative overflow-hidden"
                style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.12)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(74,222,128,0.10)" }}>
                  <FileText className="w-4.5 h-4.5" style={{ color: "#4ade80" }} />
                </div>
                <div className="text-stat-number text-numeric mb-1">
                  {inquiriesLoading ? (
                    <span className="w-8 h-8 block rounded-lg animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                  ) : (
                    <NumberTicker value={inquiries.length} className="text-stat-number text-numeric" />
                  )}
                </div>
                <p className="text-caption">条询价记录</p>
                {pendingInquiries.length > 0 && (
                  <span className="absolute top-4 right-4 text-badge px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(74,222,128,0.15)", color: "#4ade80" }}>
                    {pendingInquiries.length} 待处理
                  </span>
                )}
              </motion.div>
            </div>
          </BlurFade>

          {/* Row 2: 主内容区 — 左宽右窄 */}
          <div className="grid grid-cols-12 gap-3 mb-3">

            {/* 左：推荐 Webinar (col-span-8) */}
            <BlurFade delay={0.12} inView className="col-span-12 lg:col-span-8">
              <div className="rounded-2xl overflow-hidden h-full"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(124,58,237,0.12)" }}>
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <h2 className="text-card-title">推荐 Webinar</h2>
                  </div>
                  <button onClick={() => setLocation("/webinars")}
                    className="text-caption font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
                    style={{ color: "#a78bfa" }}>
                    查看全部 <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="p-4 space-y-2">
                  {webinarsLoading ? (
                    [1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-xl animate-pulse"
                        style={{ background: "rgba(255,255,255,0.03)" }} />
                    ))
                  ) : webinars.length === 0 ? (
                    <div className="text-center py-12 text-muted">
                      <Radio className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-caption">暂无 Webinar</p>
                    </div>
                  ) : (
                    webinars.slice(0, 4).map((webinar, idx) => {
                      const st = getStatusStyle(webinar.status);
                      return (
                        <motion.div
                          key={webinar.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + idx * 0.04 }}
                          whileHover={{ x: 3 }}
                          className="flex items-center gap-3 p-3 rounded-xl cursor-pointer group"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                          onClick={() => setLocation(`/webinar/${webinar.id}`)}
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={webinar.coverImage || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=120&fit=crop"}
                              alt={webinar.title}
                              className="w-20 h-12 rounded-lg object-cover"
                            />
                            <span className="absolute top-1 left-1 text-badge px-1 py-0.5 rounded"
                              style={{ background: st.bg, color: st.color }}>
                              {webinar.status === "live" ? (
                                <span className="flex items-center gap-0.5">
                                  <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse" />
                                  LIVE
                                </span>
                              ) : st.label}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-card-title truncate">{webinar.title}</h3>
                            <div className="flex items-center gap-1 mt-0.5 text-tertiary" style={{ fontSize: "0.75rem" }}>
                              <Clock className="w-3 h-3" />
                              {formatScheduledAt(webinar.scheduledAt)}
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-btn"
                            style={webinar.status === "live" ? {
                              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                              color: "white",
                            } : {
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "rgba(255,255,255,0.50)",
                            }}
                            onClick={(e) => { e.stopPropagation(); setLocation(`/webinar/${webinar.id}`); }}
                          >
                            {webinar.status === "live" ? "立即参与" : webinar.status === "scheduled" ? "注册" : "回放"}
                          </motion.button>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </BlurFade>

            {/* 右：快捷操作 (col-span-4) */}
            <BlurFade delay={0.15} inView className="col-span-12 lg:col-span-4">
              <div className="rounded-2xl overflow-hidden h-full"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-2 px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(124,58,237,0.12)" }}>
                    <Zap className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                  <h2 className="text-card-title">快捷操作</h2>
                </div>

                <div className="p-3 grid grid-cols-2 gap-2">
                  {[
                    { icon: Video, label: "预约视频会议", desc: "与工厂直接沟通", accent: "#7c3aed", href: "/meetings" },
                    { icon: Package, label: "申请样品", desc: "快速下单测试", accent: "#60a5fa", href: "/sample-orders" },
                    { icon: Sparkles, label: "AI 采购助理", desc: "智能匹配工厂", accent: "#a78bfa", href: "/ai-assistant", badge: "AI" },
                    { icon: FileText, label: "发起询价", desc: "批量询价比价", accent: "#4ade80", href: "/inquiries" },
                  ].map(({ icon: Icon, label, desc, accent, href, badge }, idx) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.18 + idx * 0.04 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setLocation(href)}
                      className="rounded-xl p-3.5 cursor-pointer relative overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${accent}15` }}
                    >
                      <BorderBeam size={50} duration={10} colorFrom={accent} colorTo={`${accent}20`} />
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5"
                        style={{ background: `${accent}12` }}>
                        <Icon className="w-4 h-4" style={{ color: accent }} />
                      </div>
                      <p className="text-card-title mb-0.5 leading-tight">{label}</p>
                      <p className="text-card-desc">{desc}</p>
                      {badge && (
                        <span className="absolute top-2.5 right-2.5 text-badge px-1.5 py-0.5 rounded-full"
                          style={{ background: `${accent}15`, color: accent }}>
                          {badge}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* AI 输入框 */}
                <div className="px-3 pb-3 mt-1">
                  <div className="relative">
                    <input
                      placeholder="问 AI 助理任何采购问题..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      className="w-full pl-3 pr-10 h-9 rounded-xl text-body text-primary placeholder:text-muted outline-none"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        fontSize: "0.8125rem",
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && aiInput.trim()) {
                          setLocation(`/ai-assistant?q=${encodeURIComponent(aiInput)}`);
                          setAiInput("");
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (aiInput.trim()) {
                          setLocation(`/ai-assistant?q=${encodeURIComponent(aiInput)}`);
                          setAiInput("");
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: aiInput ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.06)" }}
                    >
                      <Send className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </BlurFade>
          </div>

          {/* Row 3: 底部 Bento — 工厂推荐 + 最近会议 + 升级横幅 */}
          <div className="grid grid-cols-12 gap-3">

            {/* 工厂推荐横幅 (col-span-5) */}
            <BlurFade delay={0.18} inView className="col-span-12 lg:col-span-5">
              <motion.div
                whileHover={{ scale: 1.005 }}
                onClick={() => setLocation("/factories")}
                className="rounded-2xl p-6 cursor-pointer relative overflow-hidden h-full"
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.08) 100%)",
                  border: "1px solid rgba(124,58,237,0.20)",
                  minHeight: "140px",
                }}
              >
                <BorderBeam size={120} duration={6} colorFrom="#7c3aed" colorTo="#a78bfa" />
                <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
                  style={{ background: "rgba(124,58,237,0.12)", filter: "blur(30px)" }} />
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-5 h-5 text-violet-400" />
                  <span className="text-label text-accent">精选工厂</span>
                </div>
                <h3 className="text-heading-2 mb-1.5">发现 2,500+ 认证工厂</h3>
                <p className="text-body mb-4">
                  覆盖电子、服装、家具等 50+ 品类
                </p>
                <div className="flex items-center gap-1.5 text-accent text-btn font-semibold">
                  浏览工厂 <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            </BlurFade>

            {/* 最近会议 (col-span-4) */}
            <BlurFade delay={0.20} inView className="col-span-12 lg:col-span-4">
              <div className="rounded-2xl overflow-hidden h-full"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(96,165,250,0.10)" }}>
                      <Video className="w-3.5 h-3.5" style={{ color: "#60a5fa" }} />
                    </div>
                    <h2 className="text-card-title">最近会议</h2>
                  </div>
                  <button onClick={() => setLocation("/meetings")}
                    className="text-caption font-medium flex items-center gap-1 hover:opacity-70"
                    style={{ color: "#a78bfa" }}>
                    全部 <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  {meetingsLoading ? (
                    [1, 2].map((i) => (
                      <div key={i} className="h-14 rounded-xl animate-pulse"
                        style={{ background: "rgba(255,255,255,0.03)" }} />
                    ))
                  ) : meetings.length === 0 ? (
                    <div className="text-center py-8 text-muted">
                      <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-caption">暂无会议记录</p>
                    </div>
                  ) : (
                    meetings.slice(0, 3).map((meeting, idx) => (
                      <motion.div
                        key={meeting.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.22 + idx * 0.04 }}
                        whileHover={{ x: 2 }}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                        onClick={() => setLocation(`/meeting/${meeting.id}`)}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(96,165,250,0.10)" }}>
                          {meeting.factory?.logo ? (
                            <img src={meeting.factory.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <Building2 className="w-4 h-4" style={{ color: "#60a5fa" }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-card-title truncate">{meeting.title}</p>
                          <p className="text-card-desc truncate">
                            {meeting.factory?.name || "Unknown Factory"}
                          </p>
                        </div>
                        <span className="text-badge px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={
                            meeting.status === "completed" ? { background: "rgba(74,222,128,0.10)", color: "#4ade80" } :
                            meeting.status === "in_progress" ? { background: "rgba(96,165,250,0.10)", color: "#60a5fa" } :
                            { background: "rgba(251,191,36,0.10)", color: "#fbbf24" }
                          }>
                          {meeting.status}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </BlurFade>

            {/* 升级 CTA 卡片 (col-span-3) */}
            <BlurFade delay={0.22} inView className="col-span-12 lg:col-span-3">
              <div className="rounded-2xl p-5 h-full relative overflow-hidden flex flex-col"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
                  style={{ background: "rgba(124,58,237,0.10)", filter: "blur(20px)" }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.20)" }}>
                  <Rocket className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-card-title mb-1.5">升级 Pro 计划</h3>
                <p className="text-card-desc mb-5 flex-1">
                  解锁无限询价、优先匹配和专属客户经理
                </p>
                <ShimmerButton
                  className="w-full h-9 text-btn font-bold rounded-xl"
                  shimmerColor="#c4b5fd"
                  background="linear-gradient(135deg, #7c3aed, #4f46e5)"
                  onClick={() => setLocation("/subscription")}
                >
                  立即升级
                </ShimmerButton>
              </div>
            </BlurFade>
          </div>
        </div>
      </div>
    </div>
  );
}
