import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Radio,
  Calendar,
  Building2,
  FileText,
  TrendingUp,
  Bell,
  User,
  Send,
  Smile,
  Clock,
  Users,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [aiInput, setAiInput] = useState("");

  // 如果是工厂用户，重定向到工厂 Dashboard
  if (user?.role === "factory") {
    setLocation("/factory-dashboard");
    return null;
  }

  // ── tRPC Queries ──────────────────────────────────────────────────────────
  const { data: webinars = [], isLoading: webinarsLoading } = trpc.webinars.list.useQuery();
  const { data: meetings = [], isLoading: meetingsLoading } = trpc.meetings.myMeetings.useQuery();
  const { data: inquiries = [], isLoading: inquiriesLoading } = trpc.inquiries.myInquiries.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();

  // ── Derived Stats ─────────────────────────────────────────────────────────
  const liveWebinars = webinars.filter((w) => w.status === "live");
  const upcomingWebinars = webinars.filter((w) => w.status === "scheduled" || w.status === "upcoming");
  const pendingInquiries = inquiries.filter((i) => i.status === "pending");

  const getWebinarStatusBadge = (status: string) => {
    if (status === "live") return <span className="badge-live">LIVE</span>;
    if (status === "scheduled" || status === "upcoming") return <span className="badge-upcoming">UPCOMING</span>;
    return <span className="badge-past">PAST</span>;
  };

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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <BuyerSidebar userRole={user?.role || "buyer"} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="h-16 border-b border-border/50 flex items-center justify-end px-8 gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setLocation("/notifications")}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Button>
          <div
            className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center cursor-pointer"
            onClick={() => setLocation("/settings")}
          >
            <User className="w-5 h-5" />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              早上好，{user?.name || "采购商"} <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              {liveWebinars.length > 0
                ? `现在有 ${liveWebinars.length} 场 Webinar 正在直播`
                : upcomingWebinars.length > 0
                ? `即将有 ${upcomingWebinars.length} 场 Webinar 等待您参与`
                : "欢迎回来，开始您的采购之旅"}
              {pendingInquiries.length > 0 && `，${pendingInquiries.length} 条询价待处理`}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card 1 - Live Webinars */}
            <Card className="glass-card hover:glow-purple transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">
                  {webinarsLoading ? (
                    <span className="w-8 h-8 block bg-white/10 rounded animate-pulse" />
                  ) : liveWebinars.length}
                </div>
                <div className="text-muted-foreground text-sm">场直播中</div>
              </CardContent>
            </Card>

            {/* Card 2 - Upcoming */}
            <Card className="glass-card hover:glow-purple transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">
                  {webinarsLoading ? (
                    <span className="w-8 h-8 block bg-white/10 rounded animate-pulse" />
                  ) : upcomingWebinars.length}
                </div>
                <div className="text-muted-foreground text-sm">场即将开始</div>
              </CardContent>
            </Card>

            {/* Card 3 - Meetings */}
            <Card className="glass-card hover:glow-purple transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">
                  {meetingsLoading ? (
                    <span className="w-8 h-8 block bg-white/10 rounded animate-pulse" />
                  ) : meetings.length}
                </div>
                <div className="text-muted-foreground text-sm">场已安排会议</div>
              </CardContent>
            </Card>

            {/* Card 4 - Inquiries */}
            <Card className="glass-card hover:glow-purple transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">
                  {inquiriesLoading ? (
                    <span className="w-8 h-8 block bg-white/10 rounded animate-pulse" />
                  ) : inquiries.length}
                </div>
                <div className="text-muted-foreground text-sm">条询价记录</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Webinar 列表 */}
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">✨ 推荐 Webinar</h2>
                    <Button
                      variant="link"
                      className="text-purple-400"
                      onClick={() => setLocation("/webinars")}
                    >
                      查看全部 →
                    </Button>
                  </div>

                  {webinarsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : webinars.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Radio className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>暂无 Webinar</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {webinars.slice(0, 3).map((webinar) => (
                        <div
                          key={webinar.id}
                          className="flex gap-4 p-4 rounded-lg bg-background/30 hover:bg-background/50 transition-all cursor-pointer"
                          onClick={() => setLocation(`/webinar/${webinar.id}`)}
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={
                                webinar.coverImage ||
                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=120&fit=crop"
                              }
                              alt={webinar.title}
                              className="w-32 h-20 rounded-lg object-cover"
                            />
                            <span className="absolute top-2 left-2">
                              {getWebinarStatusBadge(webinar.status)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold mb-2 truncate">{webinar.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {formatScheduledAt(webinar.scheduledAt)}
                              </span>
                            </div>
                          </div>
                          {webinar.status === "live" ? (
                            <Button
                              className="btn-gradient-purple self-center flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/webinar/${webinar.id}`);
                              }}
                            >
                              立即参与
                            </Button>
                          ) : webinar.status === "scheduled" || webinar.status === "upcoming" ? (
                            <Button
                              variant="outline"
                              className="self-center border-purple-500/50 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/webinar/${webinar.id}`);
                              }}
                            >
                              注册
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="self-center border-purple-500/50 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/webinar/${webinar.id}`);
                              }}
                            >
                              回放
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AI 采购助理 */}
            <div className="lg:col-span-1">
              <Card className="glass-card h-full">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <h2 className="text-xl font-bold">AI 采购助理</h2>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="flex-1 bg-background/50 rounded-lg p-3">
                        <p className="text-sm">
                          👋 您好！我是您的AI采购助理。请告诉我您的采购需求，我来帮您精准匹配优质工厂。
                        </p>
                      </div>
                    </div>

                    {inquiries.length > 0 && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="flex-1 bg-background/50 rounded-lg p-3">
                          <p className="text-sm mb-3">
                            📋 您有 {inquiries.length} 条询价记录，其中 {pendingInquiries.length} 条待处理。
                          </p>
                          <div className="space-y-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full justify-start text-left border-purple-500/30"
                              onClick={() => setLocation("/factories")}
                            >
                              查看推荐工厂
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full justify-start text-left border-purple-500/30"
                              onClick={() => setLocation("/webinars")}
                            >
                              浏览相关 Webinar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full justify-start text-left border-purple-500/30"
                              onClick={() => setLocation("/inquiries")}
                            >
                              查看询价记录
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="relative">
                    <Input
                      placeholder="输入您的采购需求..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      className="pr-20 bg-background/50 border-purple-500/30"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && aiInput.trim()) {
                          setLocation(`/ai-assistant?q=${encodeURIComponent(aiInput)}`);
                          setAiInput("");
                        }
                      }}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="w-8 h-8">
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="w-8 h-8 btn-gradient-purple"
                        onClick={() => {
                          if (aiInput.trim()) {
                            setLocation(`/ai-assistant?q=${encodeURIComponent(aiInput)}`);
                            setAiInput("");
                          }
                        }}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Meetings */}
          {meetings.length > 0 && (
            <div className="mt-8">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">最近会议</h2>
                    <Button
                      variant="link"
                      className="text-purple-400"
                      onClick={() => setLocation("/meetings")}
                    >
                      查看全部 →
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {meetings.slice(0, 3).map((meeting) => (
                      <div
                        key={meeting.id}
                        className="p-4 rounded-lg bg-background/30 hover:bg-background/50 transition-all cursor-pointer border border-white/5"
                        onClick={() => setLocation(`/meeting/${meeting.id}`)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          {meeting.factory?.logo ? (
                            <img
                              src={meeting.factory.logo}
                              alt={meeting.factory.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-purple-400" />
                            </div>
                          )}
                          <span className="text-sm text-muted-foreground truncate">
                            {meeting.factory?.name || "Unknown Factory"}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm truncate mb-1">{meeting.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatScheduledAt(meeting.scheduledAt)}</span>
                          <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                            meeting.status === "completed" ? "bg-green-500/20 text-green-400" :
                            meeting.status === "in_progress" ? "bg-blue-500/20 text-blue-400" :
                            meeting.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {meeting.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
