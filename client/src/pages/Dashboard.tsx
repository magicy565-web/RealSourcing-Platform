import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Sparkles,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [aiInput, setAiInput] = useState("");

  // 不得修改：工厂用户重定向
  if (user?.role === "factory") {
    setLocation("/factory-dashboard");
    return null;
  }

  // ── tRPC Queries（不得修改）──────────────────────────────────────────────
  const { data: webinars = [], isLoading: webinarsLoading } = trpc.webinars.list.useQuery();
  const { data: meetings = [], isLoading: meetingsLoading } = trpc.meetings.myMeetings.useQuery();
  const { data: inquiries = [], isLoading: inquiriesLoading } = trpc.inquiries.myInquiries.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();

  // ── Derived Stats（不得修改）─────────────────────────────────────────────
  const liveWebinars = webinars.filter((w) => w.status === "live");
  const upcomingWebinars = webinars.filter((w) => w.status === "scheduled" || w.status === "upcoming");
  const pendingInquiries = inquiries.filter((i) => i.status === "pending");

  const getWebinarStatusBadge = (status: string) => {
    if (status === "live") return <Badge variant="live">LIVE</Badge>;
    if (status === "scheduled" || status === "upcoming") return <Badge variant="upcoming">即将开始</Badge>;
    return <Badge variant="past">已结束</Badge>;
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

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "早上好";
    if (hour < 18) return "下午好";
    return "晚上好";
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <BuyerSidebar userRole={user?.role || "buyer"} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="h-16 bg-card border-b border-border/60 flex items-center justify-between px-8">
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full"
              onClick={() => setLocation("/notifications")}
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background" />
              )}
            </Button>
            <div
              className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center cursor-pointer hover:bg-primary/15 transition-colors"
              onClick={() => setLocation("/settings")}
            >
              <User className="w-4.5 h-4.5 text-primary" />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8 max-w-7xl mx-auto">
          {/* Greeting Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-1.5">
              {getGreeting()}，{user?.name || "采购商"} 👋
            </h1>
            <p className="text-muted-foreground">
              {liveWebinars.length > 0
                ? `现在有 ${liveWebinars.length} 场 Webinar 正在直播`
                : upcomingWebinars.length > 0
                ? `即将有 ${upcomingWebinars.length} 场 Webinar 等待您参与`
                : "欢迎回来，开始您的采购之旅"}
              {pendingInquiries.length > 0 && `，${pendingInquiries.length} 条询价待处理`}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* Card 1 - Live Webinars */}
            <div className="stat-card group cursor-pointer" onClick={() => setLocation("/webinars")}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <Radio className="w-5 h-5 text-red-400" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {webinarsLoading ? (
                  <span className="w-8 h-6 block bg-muted/50 rounded animate-pulse" />
                ) : liveWebinars.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">场直播中</div>
              {liveWebinars.length > 0 && (
                <div className="mt-2 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                  <span className="text-xs text-red-400 font-medium">正在直播</span>
                </div>
              )}
            </div>

            {/* Card 2 - Upcoming */}
            <div className="stat-card group cursor-pointer" onClick={() => setLocation("/webinars")}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                  <Calendar className="w-5 h-5 text-violet-400" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {webinarsLoading ? (
                  <span className="w-8 h-6 block bg-muted/50 rounded animate-pulse" />
                ) : upcomingWebinars.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">场即将开始</div>
            </div>

            {/* Card 3 - Meetings */}
            <div className="stat-card group cursor-pointer" onClick={() => setLocation("/meetings")}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {meetingsLoading ? (
                  <span className="w-8 h-6 block bg-muted/50 rounded animate-pulse" />
                ) : meetings.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">场已安排会议</div>
            </div>

            {/* Card 4 - Inquiries */}
            <div className="stat-card group cursor-pointer" onClick={() => setLocation("/inquiries")}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                {inquiriesLoading ? (
                  <span className="w-8 h-6 block bg-muted/50 rounded animate-pulse" />
                ) : inquiries.length}
              </div>
              <div className="text-sm text-muted-foreground font-medium">条询价记录</div>
              {pendingInquiries.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full">
                    {pendingInquiries.length} 条待处理
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Webinar 列表 */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">推荐 Webinar</h2>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                      onClick={() => setLocation("/webinars")}
                    >
                      查看全部
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>

                  {webinarsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-muted/30 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : webinars.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Radio className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm">暂无 Webinar</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {webinars.slice(0, 3).map((webinar) => (
                        <div
                          key={webinar.id}
                          className="flex gap-4 p-3.5 rounded-xl bg-muted/30 hover:bg-primary/8 border border-border/40 hover:border-primary/25 transition-all cursor-pointer group"
                          onClick={() => setLocation(`/webinar/${webinar.id}`)}
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={
                                webinar.coverImage ||
                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=120&fit=crop"
                              }
                              alt={webinar.title}
                              className="w-28 h-18 rounded-lg object-cover"
                            />
                            <span className="absolute top-1.5 left-1.5">
                              {getWebinarStatusBadge(webinar.status)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <h3 className="font-semibold text-foreground mb-1.5 truncate text-sm">{webinar.title}</h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatScheduledAt(webinar.scheduledAt)}
                              </span>
                            </div>
                          </div>
                          {webinar.status === "live" ? (
                            <Button
                              size="sm"
                              className="self-center flex-shrink-0 shadow-sm shadow-primary/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/webinar/${webinar.id}`);
                              }}
                            >
                              立即参与
                            </Button>
                          ) : webinar.status === "scheduled" || webinar.status === "upcoming" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="self-center flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/webinar/${webinar.id}`);
                              }}
                            >
                              注册
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="self-center flex-shrink-0"
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
              <Card className="h-full">
                <CardContent className="p-6 flex flex-col h-full min-h-[360px]">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">AI 采购助理</h2>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        <span className="text-xs text-emerald-400">在线</span>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 bg-primary/8 border border-primary/15 rounded-xl rounded-tl-sm p-3">
                        <p className="text-xs text-foreground leading-relaxed">
                          👋 您好！我是您的AI采购助理。请告诉我您的采购需求，我来帮您精准匹配优质工厂。
                        </p>
                      </div>
                    </div>

                    {inquiries.length > 0 && (
                      <div className="flex gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 bg-primary/8 border border-primary/15 rounded-xl rounded-tl-sm p-3">
                          <p className="text-xs text-foreground mb-3 leading-relaxed">
                            📋 您有 {inquiries.length} 条询价记录，其中 {pendingInquiries.length} 条待处理。
                          </p>
                          <div className="space-y-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full justify-start text-left h-8 text-xs"
                              onClick={() => setLocation("/factories")}
                            >
                              查看推荐工厂
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full justify-start text-left h-8 text-xs"
                              onClick={() => setLocation("/webinars")}
                            >
                              浏览相关 Webinar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full justify-start text-left h-8 text-xs"
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
                      className="pr-20 h-10 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && aiInput.trim()) {
                          setLocation(`/ai-assistant?q=${encodeURIComponent(aiInput)}`);
                          setAiInput("");
                        }
                      }}
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                      <Button size="icon" variant="ghost" className="w-7 h-7">
                        <Smile className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => {
                          if (aiInput.trim()) {
                            setLocation(`/ai-assistant?q=${encodeURIComponent(aiInput)}`);
                            setAiInput("");
                          }
                        }}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Meetings */}
          {meetings.length > 0 && (
            <div className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">最近会议</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                      onClick={() => setLocation("/meetings")}
                    >
                      查看全部
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {meetings.slice(0, 3).map((meeting) => (
                      <div
                        key={meeting.id}
                        className="p-4 rounded-xl bg-muted/30 hover:bg-primary/8 border border-border/40 hover:border-primary/25 transition-all cursor-pointer"
                        onClick={() => setLocation(`/meeting/${meeting.id}`)}
                      >
                        <div className="flex items-center gap-2.5 mb-2.5">
                          {meeting.factory?.logo ? (
                            <img
                              src={meeting.factory.logo}
                              alt={meeting.factory.name}
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground truncate font-medium">
                            {meeting.factory?.name || "Unknown Factory"}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm text-foreground truncate mb-2">{meeting.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{formatScheduledAt(meeting.scheduledAt)}</span>
                          <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                            meeting.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            meeting.status === "in_progress" ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" :
                            meeting.status === "cancelled" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
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
