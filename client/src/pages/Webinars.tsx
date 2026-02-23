import { useState } from "react";
import { motion } from "framer-motion";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, Filter, Calendar, Users, Bell, User, Radio, Loader2, ArrowRight, Play } from "lucide-react";
import { useLocation } from "wouter";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { BlurFade } from "@/components/magicui/blur-fade";

const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px)
`;

export default function Webinars() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: webinars = [], isLoading } = trpc.webinars.list.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();

  const registerMutation = trpc.webinars.register.useMutation({
    onSuccess: () => toast.success("注册成功！"),
    onError: (err) => toast.error(`注册失败: ${err.message}`),
  });

  const filteredWebinars = webinars.filter((webinar) => {
    const matchesSearch =
      webinar.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (webinar.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || webinar.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const liveCount = webinars.filter((w) => w.status === "live").length;
  const upcomingCount = webinars.filter((w) => w.status === "scheduled" || w.status === "upcoming").length;

  const getStatusStyle = (status: string) => {
    if (status === "live") return { bg: "rgba(239,68,68,0.20)", color: "#f87171", label: "LIVE", dot: true };
    if (status === "scheduled" || status === "upcoming") return { bg: "rgba(96,165,250,0.15)", color: "#60a5fa", label: "即将开始", dot: false };
    return { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", label: "已结束", dot: false };
  };

  const formatTime = (scheduledAt: Date | null | undefined) => {
    if (!scheduledAt) return "TBD";
    const d = new Date(scheduledAt);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    if (diff < 0) return "已结束";
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 24) return `今天 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    if (days === 1) return `明天 ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "40px 40px" }} />

      <BuyerSidebar userRole={user?.role || "buyer"} />

      <div className="flex-1 overflow-auto relative z-10">
        {/* Top Bar */}
        <div className="h-16 flex items-center justify-between px-8"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(5,3,16,0.80)",
            backdropFilter: "blur(20px)",
          }}>
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-violet-400" />
              <h1 className="text-lg font-bold text-white">在线研讨会</h1>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>发现并参与精彩的工厂展示活动</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => setLocation("/notifications")}
            >
              <Bell className="w-4 h-4" style={{ color: "rgba(255,255,255,0.60)" }} />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />}
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
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { icon: Radio, value: liveCount, label: "场直播中", accent: "#f87171", isLive: true },
              { icon: Calendar, value: upcomingCount, label: "场即将开始", accent: "#a78bfa", isLive: false },
              { icon: Users, value: webinars.length, label: "场总计", accent: "#4ade80", isLive: false },
            ].map((stat, i) => (
              <BlurFade key={i} delay={0.05 + i * 0.08} inView>
                <div
                  className="rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${stat.accent}18`,
                    backdropFilter: "blur(20px)",
                  }}
                >
                  {/* LIVE 卡片添加 BorderBeam */}
                  {stat.isLive && stat.value > 0 && (
                    <BorderBeam size={100} duration={5} colorFrom="#f87171" colorTo="#f8717130" />
                  )}
                  <div className="absolute top-0 left-0 right-0 h-0.5"
                    style={{ background: `linear-gradient(90deg, ${stat.accent}, transparent)` }} />
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${stat.accent}15` }}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.accent }} />
                  </div>
                  <div>
                    <div className="text-3xl font-black text-white">
                      {isLoading
                        ? <span className="w-7 h-6 block rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                        : stat.value > 0
                          ? <NumberTicker value={stat.value} className="text-3xl font-black text-white" />
                          : <span>0</span>
                      }
                    </div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{stat.label}</div>
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.25)" }} />
              <input
                placeholder="搜索 Webinar、工厂、产品类别..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-xl text-sm text-white placeholder:text-white/20 outline-none"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.55)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-4 h-10 rounded-xl text-sm text-white outline-none appearance-none cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <option value="all" style={{ background: "#0f0c1a" }}>全部状态</option>
                <option value="live" style={{ background: "#0f0c1a" }}>正在直播</option>
                <option value="scheduled" style={{ background: "#0f0c1a" }}>即将开始</option>
                <option value="completed" style={{ background: "#0f0c1a" }}>已结束</option>
              </select>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="h-10 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            >
              <Calendar className="w-4 h-4" />
              我的日程
            </motion.button>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3 text-violet-400" />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>加载 Webinar...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredWebinars.map((webinar, i) => {
                  const st = getStatusStyle(webinar.status);
                  const isLive = webinar.status === "live";
                  return (
                    <BlurFade key={webinar.id} delay={0.1 + i * 0.06} inView>
                    <motion.div
                      whileHover={{ y: -4 }}
                      className="rounded-2xl overflow-hidden cursor-pointer group relative"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: isLive ? "1px solid rgba(248,113,113,0.25)" : "1px solid rgba(255,255,255,0.07)",
                        backdropFilter: "blur(20px)",
                      }}
                      onClick={() => setLocation(`/webinar/${webinar.id}`)}
                    >
                      {/* LIVE 卡片 BorderBeam */}
                      {isLive && <BorderBeam size={120} duration={6} colorFrom="#f87171" colorTo="#f8717120" />}
                      {/* Image */}
                      <div className="relative overflow-hidden" style={{ height: "11rem" }}>
                        <img
                          src={webinar.coverImage || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=250&fit=crop"}
                          alt={webinar.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(5,3,16,0.7) 0%, transparent 60%)" }} />
                        <div className="absolute top-3 left-3">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5"
                            style={{ background: st.bg, color: st.color, backdropFilter: "blur(8px)" }}>
                            {st.dot && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: st.color }} />}
                            {st.label}
                          </span>
                        </div>
                        {webinar.status === "live" && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{ background: "rgba(124,58,237,0.80)", backdropFilter: "blur(8px)" }}>
                              <Play className="w-5 h-5 text-white ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2 leading-snug group-hover:text-violet-300 transition-colors">
                          {webinar.title}
                        </h3>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                            <Calendar className="w-3.5 h-3.5" />
                            {formatTime(webinar.scheduledAt)}
                          </div>
                          {webinar.status === "live" && (
                            <motion.button
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              className="h-7 px-3 rounded-lg text-xs font-bold text-white flex items-center gap-1"
                              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                              onClick={(e) => { e.stopPropagation(); setLocation(`/webinar/${webinar.id}`); }}
                            >
                              立即参与 <ArrowRight className="w-3 h-3" />
                            </motion.button>
                          )}
                          {(webinar.status === "scheduled" || webinar.status === "upcoming") && (
                            <motion.button
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              className="h-7 px-3 rounded-lg text-xs font-medium"
                              style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                color: "rgba(255,255,255,0.60)",
                              }}
                              onClick={(e) => { e.stopPropagation(); registerMutation.mutate({ webinarId: webinar.id }); }}
                              disabled={registerMutation.isPending}
                            >
                              注册
                            </motion.button>
                          )}
                          {(webinar.status === "completed" || webinar.status === "past") && (
                            <motion.button
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              className="h-7 px-3 rounded-lg text-xs font-medium"
                              style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                color: "rgba(255,255,255,0.60)",
                              }}
                              onClick={(e) => { e.stopPropagation(); setLocation(`/webinar/${webinar.id}`); }}
                            >
                              回放
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    </BlurFade>
                  );
                })}
              </div>

              {filteredWebinars.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.20)" }}>
                    <Search className="w-8 h-8 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">未找到匹配的 Webinar</h3>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>尝试调整搜索条件或筛选器</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
