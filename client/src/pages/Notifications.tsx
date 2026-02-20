import { useState } from "react";
import { Button } from "@/components/ui/button";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { Bell, Check, Trash2, CheckCheck, Calendar, MessageSquare, AlertCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

type NotificationFilter = "all" | "unread" | "read";

export default function Notifications() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  
  const { data: notifications = [], refetch } = trpc.notifications.list.useQuery();
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("已标记为已读");
    },
  });
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("已全部标记为已读");
    },
  });
  const deleteMutation = trpc.notifications.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("已删除通知");
    },
  });

  const filteredNotifications = notifications.filter((n: any) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "webinar":
        return <Calendar className="w-5 h-5 text-purple-400" />;
      case "message":
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case "review":
        return <Building2 className="w-5 h-5 text-green-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
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

  return (
    <div className="flex min-h-screen">
      <BuyerSidebar userRole={user?.role || "buyer"} />

      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="h-16 border-b border-border/50 flex items-center justify-between px-8">
          <h1 className="text-2xl font-bold">消息通知</h1>
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            全部标记为已读
          </Button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
              className={filter === "all" ? "btn-gradient-purple" : ""}
            >
              全部 ({notifications.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              onClick={() => setFilter("unread")}
              className={filter === "unread" ? "btn-gradient-purple" : ""}
            >
              未读 ({notifications.filter((n: any) => !n.isRead).length})
            </Button>
            <Button
              variant={filter === "read" ? "default" : "outline"}
              onClick={() => setFilter("read")}
              className={filter === "read" ? "btn-gradient-purple" : ""}
            >
              已读 ({notifications.filter((n: any) => n.isRead).length})
            </Button>
          </div>

          {/* Notifications List */}
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-xl text-muted-foreground mb-2">暂无通知</p>
              <p className="text-sm text-muted-foreground">
                {filter === "unread" ? "所有通知都已读完" : "还没有收到任何通知"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`glass-card p-4 transition-all hover:glow-purple ${
                    !notification.isRead ? "border-l-4 border-l-purple-500" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-semibold text-lg">{notification.title}</h3>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatTime(notification.createdAt)}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-3">{notification.content}</p>
                      
                      <div className="flex items-center gap-2">
                        {notification.link && (
                          <Link href={notification.link}>
                            <Button size="sm" variant="outline" className="border-purple-500/30">
                              查看详情 →
                            </Button>
                          </Link>
                        )}
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => markAsReadMutation.mutate({ id: notification.id })}
                            disabled={markAsReadMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            标记已读
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate({ id: notification.id })}
                          disabled={deleteMutation.isPending}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          删除
                        </Button>
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
