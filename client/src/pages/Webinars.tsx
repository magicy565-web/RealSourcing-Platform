import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, Filter, Calendar, Users, Bell, User, Radio, Loader2, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Webinars() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── tRPC Queries（不得修改）──────────────────────────────────────────────
  const { data: webinars = [], isLoading } = trpc.webinars.list.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();

  // 不得修改：tRPC 注册 mutation
  const registerMutation = trpc.webinars.register.useMutation({
    onSuccess: () => {
      toast.success("注册成功！");
    },
    onError: (err) => {
      toast.error(`注册失败: ${err.message}`);
    },
  });

  // ── Filtering（不得修改）─────────────────────────────────────────────────
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
    if (status === "live")
      return (
        <Badge variant="live" className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </Badge>
      );
    if (status === "scheduled" || status === "upcoming")
      return <Badge variant="upcoming">即将开始</Badge>;
    return <Badge variant="past">已结束</Badge>;
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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <BuyerSidebar userRole={user?.role || "buyer"} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="h-16 bg-card border-b border-border/60 flex items-center justify-between px-8">
          <div>
            <h1 className="text-xl font-bold text-foreground">在线研讨会</h1>
            <p className="text-xs text-muted-foreground">发现并参与精彩的工厂展示活动</p>
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

        {/* Content */}
        <div className="p-8 max-w-7xl mx-auto">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-xl border border-border/60 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Radio className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? <span className="w-6 h-5 block bg-muted/50 rounded animate-pulse" /> : liveCount}
                </div>
                <div className="text-xs text-muted-foreground font-medium">场直播中</div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border/60 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? <span className="w-6 h-5 block bg-muted/50 rounded animate-pulse" /> : upcomingCount}
                </div>
                <div className="text-xs text-muted-foreground font-medium">场即将开始</div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border/60 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {isLoading ? <span className="w-6 h-5 block bg-muted/50 rounded animate-pulse" /> : webinars.length}
                </div>
                <div className="text-xs text-muted-foreground font-medium">场总计</div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索 Webinar、工厂、产品类别..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 h-10">
                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="live">正在直播</SelectItem>
                <SelectItem value="scheduled">即将开始</SelectItem>
                <SelectItem value="completed">已结束</SelectItem>
              </SelectContent>
            </Select>

            <Button className="h-10 shadow-sm shadow-primary/20">
              <Calendar className="w-4 h-4 mr-2" />
              我的日程
            </Button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">加载 Webinar...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Webinar Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredWebinars.map((webinar) => (
                  <Card
                    key={webinar.id}
                    className="card-hover overflow-hidden cursor-pointer group border-border/60"
                    onClick={() => setLocation(`/webinar/${webinar.id}`)}
                  >
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative overflow-hidden">
                        <img
                          src={
                            webinar.coverImage ||
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=250&fit=crop"
                          }
                          alt={webinar.title}
                          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                          {getStatusBadge(webinar.status)}
                        </div>
                        {/* Live 直播遮罩 */}
                        {webinar.status === "live" && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Title */}
                        <h3 className="font-semibold text-foreground text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {webinar.title}
                        </h3>

                        {/* Time & Action */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatTime(webinar.scheduledAt)}</span>
                          </div>

                          {webinar.status === "live" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs px-3 shadow-sm shadow-primary/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/webinar/${webinar.id}`);
                              }}
                            >
                              立即参与
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          )}
                          {(webinar.status === "scheduled" || webinar.status === "upcoming") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-3"
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
                              className="h-7 text-xs px-3"
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
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">未找到匹配的 Webinar</h3>
                  <p className="text-muted-foreground text-sm">尝试调整搜索条件或筛选器</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
