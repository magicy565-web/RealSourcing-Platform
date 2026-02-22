import { useState } from "react";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Bell, Check, Trash2, CheckCheck, Calendar, MessageSquare, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

type NotificationFilter = "all" | "unread" | "read";

export default function Notifications() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const { data: notifications = [], refetch } = trpc.notifications.list.useQuery();
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => { refetch(); toast.success("已标记为已读"); },
  });
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => { refetch(); toast.success("已全部标记为已读"); },
  });
  const deleteMutation = { mutate: (_: any) => toast.info("功能暂未开放"), isPending: false };

  const filteredNotifications = notifications.filter((n: any) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "webinar": return <Calendar className="w-5 h-5" style={{ color: "#a78bfa" }} />;
      case "message": return <MessageSquare className="w-5 h-5" style={{ color: "#60a5fa" }} />;
      case "review": return <Building2 className="w-5 h-5" style={{ color: "#34d399" }} />;
      default: return <Bell className="w-5 h-5" style={{ color: "rgba(255,255,255,0.4)" }} />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return new Date(date).toLocaleDateString("zh-CN");
  };

  const filterTabs: { key: NotificationFilter; label: string; count: number }[] = [
    { key: "all", label: "全部", count: notifications.length },
    { key: "unread", label: "未读", count: notifications.filter((n: any) => !n.isRead).length },
    { key: "read", label: "已读", count: notifications.filter((n: any) => n.isRead).length },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)" }}>
      <BuyerSidebar userRole={user?.role || "buyer"} />

      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div
          className="h-16 flex items-center justify-between px-8 sticky top-0 z-10"
          style={{ background: "rgba(5,3,16,0.85)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)" }}>
              <Bell className="w-4 h-4" style={{ color: "#a78bfa" }} />
            </div>
            <h1 className="text-lg font-bold text-white">消息通知</h1>
          </div>
          <button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            <CheckCheck className="w-4 h-4" />
            全部标记为已读
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={filter === tab.key ? {
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  color: "#fff",
                  boxShadow: "0 0 16px rgba(124,58,237,0.3)"
                } : {
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)"
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Bell className="w-8 h-8" style={{ color: "rgba(255,255,255,0.2)" }} />
              </div>
              <p className="text-lg font-medium text-white mb-2">暂无通知</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                {filter === "unread" ? "所有通知都已读完" : "还没有收到任何通知"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className="rounded-2xl p-5 transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: !notification.isRead ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.07)",
                    backdropFilter: "blur(20px)",
                    borderLeft: !notification.isRead ? "3px solid #7c3aed" : undefined,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1.5">
                        <h3 className="font-semibold text-white">{notification.title}</h3>
                        <span className="text-xs whitespace-nowrap" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>{notification.content}</p>

                      <div className="flex items-center gap-2">
                        {notification.link && (
                          <Link href={notification.link}>
                            <button className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}>
                              查看详情 →
                            </button>
                          </Link>
                        )}
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsReadMutation.mutate({ id: notification.id })}
                            disabled={markAsReadMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}
                          >
                            <Check className="w-3 h-3" />
                            标记已读
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate({ id: notification.id })}
                          disabled={deleteMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={{ background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,0.7)" }}
                        >
                          <Trash2 className="w-3 h-3" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
