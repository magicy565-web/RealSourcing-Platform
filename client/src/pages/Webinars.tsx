import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, Filter, Calendar, Building2, Users, Bell, User, Radio, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Webinars() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── tRPC Queries ──────────────────────────────────────────────────────────
  const { data: webinars = [], isLoading } = trpc.webinars.list.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();

  const registerMutation = trpc.webinars.register.useMutation({
    onSuccess: () => {
      toast.success("注册成功！");
    },
    onError: (err) => {
      toast.error(`注册失败: ${err.message}`);
    },
  });

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filteredWebinars = webinars.filter((webinar) => {
    const matchesSearch =
      webinar.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (webinar.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || webinar.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const liveCount = webinars.filter((w) => w.status === "live").length;
  const upcomingCount = webinars.filter((w) => w.status === "scheduled" || w.status === "upcoming").length;

  const getStatusBadge = (status: string) => {
    if (status === "live") return <span className="badge-live flex items-center gap-1"><span className="w-2 h-2 bg-white rounded-full animate-pulse" />LIVE</span>;
    if (status === "scheduled" || status === "upcoming") return <span className="badge-upcoming">UPCOMING</span>;
    return <span className="badge-past">PAST</span>;
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
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <BuyerSidebar userRole={user?.role || "buyer"} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="h-16 border-b border-border/50 flex items-center justify-between px-8">
          <h1 className="text-2xl font-bold">Webinars</h1>
          <div className="flex items-center gap-4">
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
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="搜索 Webinar、工厂、产品类别..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-purple-500/30"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-background/50 border-purple-500/30">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="live">正在直播</SelectItem>
                <SelectItem value="scheduled">即将开始</SelectItem>
                <SelectItem value="completed">已结束</SelectItem>
              </SelectContent>
            </Select>

            <Button className="btn-gradient-purple">
              <Calendar className="w-4 h-4 mr-2" />
              我的日程
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      {isLoading ? <span className="w-8 h-6 block bg-white/10 rounded animate-pulse" /> : liveCount}
                    </div>
                    <div className="text-muted-foreground text-sm">场直播中</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      {isLoading ? <span className="w-8 h-6 block bg-white/10 rounded animate-pulse" /> : upcomingCount}
                    </div>
                    <div className="text-muted-foreground text-sm">场即将开始</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      {isLoading ? <span className="w-8 h-6 block bg-white/10 rounded animate-pulse" /> : webinars.length}
                    </div>
                    <div className="text-muted-foreground text-sm">场总计</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">加载 Webinar...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Webinar Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWebinars.map((webinar) => (
                  <Card
                    key={webinar.id}
                    className="glass-card hover:glow-purple transition-all group cursor-pointer"
                    onClick={() => setLocation(`/webinar/${webinar.id}`)}
                  >
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img
                          src={
                            webinar.coverImage ||
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=250&fit=crop"
                          }
                          alt={webinar.title}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          {getStatusBadge(webinar.status)}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        {/* Title */}
                        <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors">
                          {webinar.title}
                        </h3>

                        {/* Time & Action */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>{formatTime(webinar.scheduledAt)}</span>
                          </div>

                          {webinar.status === "live" && (
                            <Button
                              size="sm"
                              className="btn-gradient-purple"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/webinar/${webinar.id}`);
                              }}
                            >
                              立即参与
                            </Button>
                          )}
                          {(webinar.status === "scheduled" || webinar.status === "upcoming") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-purple-500/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                registerMutation.mutate({ webinarId: webinar.id });
                              }}
                              disabled={registerMutation.isPending}
                            >
                              注册
                            </Button>
                          )}
                          {(webinar.status === "completed" || webinar.status === "past") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-purple-500/50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/webinar/${webinar.id}`);
                              }}
                            >
                              回放
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {filteredWebinars.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">未找到匹配的 Webinar</h3>
                  <p className="text-muted-foreground">尝试调整搜索条件或筛选器</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
