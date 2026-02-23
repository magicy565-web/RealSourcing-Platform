import { useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import { Icon as SolarIcon } from "@iconify/react";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { BlurFade } from "@/components/magicui/blur-fade";

// Solar Icons 封装
const SIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => (
  <SolarIcon icon={`solar:${name}`} className={className} style={style} />
);
const Radio = (p: any) => <SIcon name="radio-bold-duotone" {...p} />;
const Calendar = (p: any) => <SIcon name="calendar-bold-duotone" {...p} />;
const Users = (p: any) => <SIcon name="users-group-two-rounded-bold-duotone" {...p} />;
const Bell = (p: any) => <SIcon name="bell-bing-bold-duotone" {...p} />;
const User = (p: any) => <SIcon name="user-circle-bold-duotone" {...p} />;
const Search = (p: any) => <SIcon name="magnifer-bold-duotone" {...p} />;
const Filter = (p: any) => <SIcon name="filter-bold-duotone" {...p} />;
const ArrowRight = (p: any) => <SIcon name="arrow-right-bold-duotone" {...p} />;
const Play = (p: any) => <SIcon name="play-circle-bold-duotone" {...p} />;
const Loader = (p: any) => <SIcon name="refresh-circle-bold-duotone" {...p} />;

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
    <div className="flex min-h-screen" style={{ background: "#09090b" }}>
      {/* 背景光晕 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
      </div>

      <BuyerSidebar userRole={user?.role || "buyer"} />

      <div className="flex-1 overflow-auto relative z-10">
        {/* Top Bar */}
        <div className="h-14 flex items-center justify-between px-6 sticky top-0 z-20"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(9,9,11,0.85)", backdropFilter: "blur(20px)" }}>
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-violet-400" />
              <h1 className="text-heading-3">在线研讨会</h1>
            </div>
            <p className="text-caption">发现并参与精彩的工厂展示活动</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              onClick={() => setLocation("/notifications")}
            >
              <Bell className="w-4 h-4" style={{ color: "rgba(255,255,255,0.50)" }} />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />}
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              onClick={() => setLocation("/settings")}
            >
              <User className="w-4 h-4 text-white" />
            </motion.div>
          </div>
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { icon: Radio, value: liveCount, label: "场直播中", accent: "#f87171", isLive: true },
              { icon: Calendar, value: upcomingCount, label: "场即将开始", accent: "#a78bfa", isLive: false },
              { icon: Users, value: webinars.length, label: "场总计", accent: "#4ade80", isLive: false },
            ].map((stat, i) => (
              <BlurFade key={i} delay={0.05 + i * 0.07} inView>
                <div
                  className="rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${stat.accent}18`,
                  }}
                >
                  {stat.isLive && stat.value > 0 && (
                    <BorderBeam size={100} duration={5} colorFrom="#f87171" colorTo="#f8717130" />
                  )}
                  <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: `linear-gradient(90deg, ${stat.accent}60, transparent)` }} />
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${stat.accent}15` }}>
                    <stat.icon className="w-5 h-5" style={{ color: stat.accent }} />
                  </div>
                  <div>
                    <div className="text-stat-number text-numeric">
                      {isLoading
                        ? <span className="w-7 h-6 block rounded animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                        : stat.value > 0
                          ? <NumberTicker value={stat.value} className="text-stat-number text-numeric" />
                          : <span>0</span>
                      }
                    </div>
                    <div className="text-caption">{stat.label}</div>
                  </div>
                </div>
              </BlurFade>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.25)" }} />
              <input
                placeholder="搜索 Webinar、工厂、产品类别..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-xl text-body text-primary placeholder:text-muted outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "0.875rem",
                }}
                onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.55)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.25)" }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-4 h-10 rounded-xl text-body text-primary outline-none appearance-none cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: "0.875rem",
                }}
              >
                <option value="all" style={{ background: "#09090b" }}>全部状态</option>
                <option value="live" style={{ background: "#09090b" }}>正在直播</option>
                <option value="scheduled" style={{ background: "#09090b" }}>即将开始</option>
                <option value="completed" style={{ background: "#09090b" }}>已结束</option>
              </select>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="h-10 px-5 rounded-xl text-btn font-semibold text-white flex items-center gap-2"
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
                <Loader className="w-10 h-10 animate-spin mx-auto mb-3 text-violet-400" />
                <p className="text-caption">加载 Webinar...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWebinars.map((webinar, i) => {
                  const st = getStatusStyle(webinar.status);
                  const isLive = webinar.status === "live";
                  return (
                    <BlurFade key={webinar.id} delay={0.08 + i * 0.05} inView>
                      <motion.div
                        whileHover={{ y: -3 }}
                        className="rounded-2xl overflow-hidden cursor-pointer group relative"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: isLive ? "1px solid rgba(248,113,113,0.25)" : "1px solid rgba(255,255,255,0.07)",
                        }}
                        onClick={() => setLocation(`/webinar/${webinar.id}`)}
                      >
                        {isLive && <BorderBeam size={120} duration={6} colorFrom="#f87171" colorTo="#f8717120" />}
                        {/* Image */}
                        <div className="relative overflow-hidden" style={{ height: "10rem" }}>
                          <img
                            src={webinar.coverImage || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=250&fit=crop"}
                            alt={webinar.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(9,9,11,0.75) 0%, transparent 60%)" }} />
                          <div className="absolute top-3 left-3">
                            <span className="text-badge px-2.5 py-1 rounded-full flex items-center gap-1.5"
                              style={{ background: st.bg, color: st.color, backdropFilter: "blur(8px)" }}>
                              {st.dot && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: st.color }} />}
                              {st.label}
                            </span>
                          </div>
                          {webinar.status === "live" && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ background: "rgba(124,58,237,0.80)", backdropFilter: "blur(8px)" }}>
                                <Play className="w-5 h-5 text-white" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <h3 className="text-card-title mb-2 line-clamp-2 group-hover:text-accent transition-colors">
                            {webinar.title}
                          </h3>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-1.5 text-tertiary" style={{ fontSize: "0.75rem" }}>
                              <Calendar className="w-3.5 h-3.5" />
                              {formatTime(webinar.scheduledAt)}
                            </div>
                            {webinar.status === "live" && (
                              <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="h-7 px-3 rounded-lg text-btn font-bold text-white flex items-center gap-1"
                                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                                onClick={(e) => { e.stopPropagation(); setLocation(`/webinar/${webinar.id}`); }}
                              >
                                立即参与 <ArrowRight className="w-3 h-3" />
                              </motion.button>
                            )}
                            {(webinar.status === "scheduled" || webinar.status === "upcoming") && (
                              <motion.button
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                className="h-7 px-3 rounded-lg text-btn"
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  color: "rgba(255,255,255,0.55)",
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
                                className="h-7 px-3 rounded-lg text-btn"
                                style={{
                                  background: "rgba(255,255,255,0.05)",
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  color: "rgba(255,255,255,0.55)",
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
                  <h3 className="text-heading-3 mb-2">未找到匹配的 Webinar</h3>
                  <p className="text-body">尝试调整搜索条件或筛选器</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
