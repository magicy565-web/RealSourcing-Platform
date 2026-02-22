/**
 * Meetings.tsx — 买家会议列表页
 *
 * 功能：
 * - 展示买家所有历史和即将进行的1:1选品会议
 * - 支持按状态筛选（全部/即将/已完成/已取消）
 * - 快速进入会议室 / 查看AI摘要 / 预约新会议
 */
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Calendar, Video, Building2, Clock, CheckCircle2, XCircle,
  ArrowRight, Plus, Bell, User, Search, Filter, Play,
  MessageSquare, FileText, Sparkles, AlertCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type MeetingFilter = "all" | "scheduled" | "completed" | "cancelled";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  scheduled: {
    label: "即将进行",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: <Clock className="w-3 h-3" />,
  },
  in_progress: {
    label: "进行中",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: <Play className="w-3 h-3" />,
  },
  completed: {
    label: "已完成",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  cancelled: {
    label: "已取消",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    icon: <XCircle className="w-3 h-3" />,
  },
};

function MeetingCard({ meeting, onEnter, onViewDetail }: {
  meeting: any;
  onEnter: (id: number) => void;
  onViewDetail: (id: number) => void;
}) {
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
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/30 transition-all group">
      <div className="flex items-start justify-between gap-4">
        {/* 左侧：工厂信息 */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* 工厂 Logo */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            {meeting.factory?.logo ? (
              <img src={meeting.factory.logo} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-purple-400" />
            )}
          </div>
          {/* 会议信息 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">{meeting.title || "选品会议"}</h3>
            <p className="text-gray-400 text-sm truncate">
              {meeting.factory?.name || "工厂"}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              {scheduledAt && (
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(scheduledAt)}</span>
                </div>
              )}
              {meeting.durationMinutes && (
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>{meeting.durationMinutes} 分钟</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* 右侧：状态 + 操作 */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={cn("flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border", status.color)}>
            {status.icon}
            {status.label}
          </span>
          <div className="flex gap-2">
            {isUpcoming && (
              <Button
                size="sm"
                onClick={() => onEnter(meeting.id)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-xs h-8"
              >
                <Video className="w-3.5 h-3.5 mr-1" />
                进入会议
              </Button>
            )}
            {isPast && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetail(meeting.id)}
                className="border-white/20 text-gray-400 hover:text-white text-xs h-8"
              >
                <FileText className="w-3.5 h-3.5 mr-1" />
                查看详情
              </Button>
            )}
          </div>
        </div>
      </div>
      {/* AI 摘要预览（已完成的会议） */}
      {meeting.status === "completed" && meeting.aiSummary && (
        <div className="mt-4 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-purple-300 text-xs font-medium">AI 会议摘要</span>
          </div>
          <p className="text-gray-400 text-xs line-clamp-2">
            {Array.isArray(meeting.aiSummary)
              ? meeting.aiSummary[0]
              : typeof meeting.aiSummary === "string"
              ? meeting.aiSummary
              : "摘要已生成，点击查看详情"}
          </p>
        </div>
      )}
    </div>
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
    // 状态筛选
    if (filter === "scheduled" && m.status !== "scheduled" && m.status !== "in_progress") return false;
    if (filter === "completed" && m.status !== "completed") return false;
    if (filter === "cancelled" && m.status !== "cancelled") return false;
    // 搜索筛选
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const title = (m.title || "").toLowerCase();
      const factoryName = (m.factory?.name || "").toLowerCase();
      if (!title.includes(q) && !factoryName.includes(q)) return false;
    }
    return true;
  });

  // 统计数据
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
    <div className="flex min-h-screen bg-[#0F0F23]">
      <BuyerSidebar userRole={user?.role || "buyer"} />
      <div className="flex-1 overflow-auto">
        {/* 顶部栏 */}
        <div className="h-16 border-b border-white/8 flex items-center justify-between px-8">
          <div>
            <h1 className="text-white font-bold text-lg">我的会议</h1>
            <p className="text-gray-500 text-xs">管理您的所有1:1选品会议</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/notifications")}
              className="relative text-gray-400 hover:text-white"
            >
              <Bell className="w-5 h-5" />
              {(unreadCount as number) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                  {unreadCount as number}
                </span>
              )}
            </Button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) || <User className="w-4 h-4" />}
            </div>
          </div>
        </div>

        <div className="p-8 max-w-5xl mx-auto">
          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "全部会议", value: stats.total, icon: <Calendar className="w-5 h-5 text-purple-400" />, color: "from-purple-500/10 to-purple-600/5" },
              { label: "即将进行", value: stats.upcoming, icon: <Clock className="w-5 h-5 text-blue-400" />, color: "from-blue-500/10 to-blue-600/5" },
              { label: "已完成", value: stats.completed, icon: <CheckCircle2 className="w-5 h-5 text-green-400" />, color: "from-green-500/10 to-green-600/5" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className={cn("bg-gradient-to-br border border-white/10 rounded-2xl p-5", color)}>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    {icon}
                  </div>
                </div>
                <p className="text-3xl font-black text-white">{value}</p>
                <p className="text-gray-400 text-sm mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* 搜索 + 筛选 + 预约按钮 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索会议标题或工厂名称..."
                className="pl-10 bg-white/5 border-white/15 text-white placeholder:text-gray-600 focus:border-purple-500/50"
              />
            </div>
            <Button
              onClick={() => setLocation("/factories")}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              预约新会议
            </Button>
          </div>

          {/* 筛选 Tab */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {FILTER_TABS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                  filter === key
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white"
                )}
              >
                {label}
                {count > 0 && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full font-bold",
                    filter === key ? "bg-purple-500/40 text-purple-200" : "bg-white/10 text-gray-500"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 会议列表 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : filteredMeetings.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-white font-semibold mb-2">
                {filter === "all" ? "还没有会议记录" : `没有${FILTER_TABS.find(t => t.key === filter)?.label}的会议`}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {filter === "all"
                  ? "找到感兴趣的工厂，预约一场1:1选品会议吧"
                  : "换个筛选条件试试"}
              </p>
              {filter === "all" && (
                <Button
                  onClick={() => setLocation("/factories")}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  浏览工厂并预约会议
                </Button>
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
