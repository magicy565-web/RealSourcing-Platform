import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search, Filter, MapPin, Star, Users, Bell, User,
  Building2, Award, TrendingUp, Loader2, Heart, ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";

export default function Factories() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // ── tRPC Queries（不得修改）──────────────────────────────────────────────
  const { data: factories = [], isLoading } = trpc.factories.list.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();

  // 不得修改：tRPC 收藏 mutation
  const favoriteMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.favorited ? "已收藏" : "已取消收藏");
    },
    onError: () => {
      toast.error("操作失败，请重试");
    },
  });

  // ── Filtering（不得修改）─────────────────────────────────────────────────
  const filteredFactories = factories.filter((factory) => {
    const name = factory.name || "";
    const city = factory.city || "";
    const country = factory.country || "";
    const category = factory.category || "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(factories.map((f) => f.category).filter(Boolean)));

  const avgScore =
    factories.length > 0
      ? (factories.reduce((sum, f) => sum + Number(f.overallScore || 0), 0) / factories.length).toFixed(1)
      : "0.0";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <BuyerSidebar userRole={user?.role || "buyer"} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="h-16 bg-card border-b border-border/60 flex items-center justify-between px-8">
          <div>
            <h1 className="text-xl font-bold text-foreground">工厂大厅</h1>
            <p className="text-xs text-muted-foreground">发现并联系全球认证优质工厂</p>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                icon: Building2,
                color: "blue",
                value: isLoading ? null : factories.length,
                label: "认证工厂",
              },
              {
                icon: TrendingUp,
                color: "indigo",
                value: isLoading ? null : categories.length,
                label: "产品类别",
              },
              {
                icon: Users,
                color: "emerald",
                value: isLoading ? null : filteredFactories.length,
                label: "筛选结果",
              },
              {
                icon: Star,
                color: "amber",
                value: isLoading ? null : avgScore,
                label: "平均评分",
              },
            ].map((stat, i) => {
              const Icon = stat.icon;
              const colorMap: Record<string, string> = {
                blue: "bg-violet-500/10 text-violet-400",
                indigo: "bg-purple-500/10 text-purple-400",
                emerald: "bg-emerald-500/10 text-emerald-400",
                amber: "bg-amber-500/10 text-amber-400",
              };
              return (
                <div key={i} className="bg-card rounded-xl border border-border/60 p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[stat.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {stat.value === null ? (
                        <span className="w-8 h-5 block bg-muted/50 rounded animate-pulse" />
                      ) : (
                        stat.value
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索工厂名称、地区、产品类别..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-44 h-10">
                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类别</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat!} value={cat!}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button className="h-10 shadow-sm shadow-primary/20">
              <TrendingUp className="w-4 h-4 mr-2" />
              AI 推荐
            </Button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">加载工厂数据...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Factory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredFactories.map((factory) => (
                  <Card
                    key={factory.id}
                    className="card-hover overflow-hidden cursor-pointer group border-border/60"
                    onClick={() => setLocation(`/factory/${factory.id}`)}
                  >
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative overflow-hidden">
                        <img
                          src={
                            factory.logo ||
                            "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop"
                          }
                          alt={factory.name}
                          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Verified Badge */}
                        {factory.status === "active" && (
                          <div className="absolute top-3 left-3 bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            认证工厂
                          </div>
                        )}
                        {/* Score Badge */}
                        {factory.overallScore && (
                          <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-foreground text-xs font-bold flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {Number(factory.overallScore).toFixed(1)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        {/* Name & Location */}
                        <div className="mb-3">
                          <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors text-sm">
                            {factory.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{[factory.city, factory.country].filter(Boolean).join(", ") || "Unknown"}</span>
                            {factory.category && (
                              <>
                                <span className="mx-1">·</span>
                                <span className="text-primary/80 font-medium">{factory.category}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          <Button
                            className="flex-1 h-8 text-xs shadow-sm shadow-primary/20"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/factory/${factory.id}`);
                            }}
                          >
                            查看详情
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-border/60 hover:border-red-300 hover:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              favoriteMutation.mutate({ targetType: "factory", targetId: factory.id });
                            }}
                            disabled={favoriteMutation.isPending}
                          >
                            <Heart className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {filteredFactories.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">未找到匹配的工厂</h3>
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
