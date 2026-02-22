import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  Calendar, Video, Building2, Clock, CheckCircle2, XCircle,
  Plus, Bell, User, Search, Play, FileText, Sparkles, Loader2
} from "lucide-react";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

type MeetingFilter = "all" | "scheduled" | "completed" | "cancelled";

const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px)
`;

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  scheduled: { label: "即将进行", bg: "rgba(96,165,250,0.12)", color: "#60a5fa", icon: <Clock className="w-3 h-3" /> },
  in_progress: { label: "进行中", bg: "rgba(74,222,128,0.12)", color: "#4ade80", icon: <Play className="w-3 h-3" /> },
  completed: { label: "已完成", bg: "rgba(167,139,250,0.12)", color: "#a78bfa", icon: <CheckCircle2 className="w-3 h-3" /> },
  cancelled: { label: "已取消", bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.30)", icon: <XCircle className="w-3 h-3" /> },
};

function MeetingCard({ meeting, onEnter, onViewDetail }: { meeting: any; onEnter: (id: number) => void; onViewDetail: (id: number) => void }) {
  const status = STATUS_CONFIG[meeting.status] || STATUS_CONFIG.scheduled;
  const scheduledAt = meeting.scheduledAt ? new Date(meeting.scheduledAt) : null;
  const isUpcoming = meeting.status === "scheduled" || meeting.status === "in_progress";
  const isPast = meeting.status === "completed" || meeting.status === "cancelled";

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (diff < 0) return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    if (hours < 1) return "即将开始";
    if (hours < 24) return `${hours} 小时后`;
    if (days === 1) return `明天 ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
    return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.25))", border: "1px solid rgba(124,58,237,0.25)" }}>
            {meeting.factory?.logo ? (
              <img src={meeting.factory.logo} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-violet-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">{meeting.title || "选品会议"}</h3>
            <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.40)" }}>{meeting.factory?.name || "工厂"}</p>
            <div className="flex items-center gap-3 mt-1.5">
              {scheduledAt && (
                <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                  <Calendar className="w-3 h-3" />
                  {formatDate(scheduledAt)}
                </div>
              )}
              {meeting.durationMinutes && (
                <div className="flex items-center gap-1 text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>
                  <Clock className="w-3 h-3" />
                  {meeting.durationMinutes} 分钟
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
            style={{ background: status.bg, color: status.color }}>
            {status.icon}
            {status.label}
          </span>
          <div className="flex gap-2">
            {isUpcoming && (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="h-8 px-3 rounded-xl text-xs font-bold text-white flex items-center gap-1.5"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                onClick={() => onEnter(meeting.id)}
              >
                <Video className="w-3.5 h-3.5" />
                进入会议
              </motion.button>
            )}
            {isPast && (
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="h-8 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.50)" }}
                onClick={() => onViewDetail(meeting.id)}
              >
                <FileText className="w-3.5 h-3.5" />
                查看详情
              </motion.button>
            )}
          </div>
        </div>
      </div>
      {meeting.status === "completed" && meeting.aiSummary && (
        <div className="mt-4 rounded-xl p-3"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.18)" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs font-medium text-violet-300">AI 会议摘要</span>
          </div>
          <p className="text-xs line-clamp-2" style={{ color: "rgba(255,255,255,0.40)" }}>
            {Array.isArray(meeting.aiSummary) ? meeting.aiSummary[0] : typeof meeting.aiSummary === "string" ? meeting.aiSummary : "摘要已生成，点击查看详情"}
          </p>
        </div>
      )}
    </motion.div>
  );
}

export default function Meetings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<MeetingFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: meetings = [], isLoading } = trpc.meetings.myMeetings.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();

  const filteredMeetings = (meetings as any[]).filter((m) => {
    if (filter === "scheduled" && m.status !== "scheduled" && m.status !== "in_progress") return false;
    if (filter === "completed" && m.status !== "completed") return false;
    if (filter === "cancelled" && m.status !== "cancelled") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!(m.title || "").toLowerCase().includes(q) && !(m.factory?.name || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = {
    total: (meetings as any[]).length,
    upcoming: (meetings as any[]).filter((m) => m.status === "scheduled" || m.status === "in_progress").length,
    completed: (meetings as any[]).filter((m) => m.status === "completed").length,
  };

  const FILTER_TABS: { key: MeetingFilter; label: string; count: number }[] = [
    { key: "all", label: "全部", count: stats.total },
    { key: "scheduled", label: "即将进行", count: stats.upcoming },
    { key: "completed", label: "已完成", count: stats.completed },
    { key: "cancelled", label: "已取消", count: 0 },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "40px 40px" }} />

      <BuyerSidebar userRole={user?.role || "buyer"} />

      <div className="flex-1 overflow-auto relative z-10">
        {/* Top Bar */}
        <div className="h-16 flex items-center justify-between px-8"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,3,16,0.80)", backdropFilter: "blur(20px)" }}>
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-400" />
              <h1 className="text-lg font-bold text-white">我的会议</h1>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>管理您的所有 1:1 选品会议</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => setLocation("/notifications")}
            >
              <Bell className="w-4 h-4" style={{ color: "rgba(255,255,255,0.60)" }} />
              {(unreadCount as number) > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />}
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

        <div className="p-8 max-w-5xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "全部会议", value: stats.total, icon: Calendar, accent: "#a78bfa" },
              { label: "即将进行", value: stats.upcoming, icon: Clock, accent: "#60a5fa" },
              { label: "已完成", value: stats.completed, icon: CheckCircle2, accent: "#4ade80" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${stat.accent}18`, backdropFilter: "blur(20px)" }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ background: `linear-gradient(90deg, ${stat.accent}, transparent)` }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${stat.accent}15` }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.accent }} />
                </div>
                <p className="text-3xl font-black text-white">{stat.value}</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Search + Button */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.25)" }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索会议标题或工厂名称..."
                className="w-full pl-10 pr-4 h-10 rounded-xl text-sm text-white placeholder:text-white/20 outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.55)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              className="h-10 px-5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              onClick={() => setLocation("/factories")}
            >
              <Plus className="w-4 h-4" />
              预约新会议
            </motion.button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {FILTER_TABS.map(({ key, label, count }) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setFilter(key)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                style={{
                  background: filter === key ? "rgba(124,58,237,0.20)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${filter === key ? "rgba(124,58,237,0.40)" : "rgba(255,255,255,0.08)"}`,
                  color: filter === key ? "#c4b5fd" : "rgba(255,255,255,0.40)",
                }}
              >
                {label}
                {count > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{
                      background: filter === key ? "rgba(124,58,237,0.30)" : "rgba(255,255,255,0.08)",
                      color: filter === key ? "#ddd6fe" : "rgba(255,255,255,0.30)",
                    }}>
                    {count}
                  </span>
                )}
              </motion.button>
            ))}
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Calendar className="w-8 h-8" style={{ color: "rgba(255,255,255,0.20)" }} />
              </div>
              <h3 className="text-white font-semibold mb-2">
                {filter === "all" ? "还没有会议记录" : `没有${FILTER_TABS.find(t => t.key === filter)?.label}的会议`}
              </h3>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.30)" }}>
                {filter === "all" ? "找到感兴趣的工厂，预约一场 1:1 选品会议吧" : "换个筛选条件试试"}
              </p>
              {filter === "all" && (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="h-10 px-6 rounded-xl text-sm font-semibold text-white flex items-center gap-2 mx-auto"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                  onClick={() => setLocation("/factories")}
                >
                  <Plus className="w-4 h-4" />
                  浏览工厂并预约会议
                </motion.button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeetings.map((meeting: any) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onEnter={(id) => setLocation(`/meeting/${id}`)}
                  onViewDetail={(id) => setLocation(`/meeting-detail/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
