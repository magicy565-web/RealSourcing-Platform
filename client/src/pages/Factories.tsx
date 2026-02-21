import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, Filter, MapPin, Star, Users, Bell, User, Building2, Award, TrendingUp, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function Factories() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // ── tRPC Queries ──────────────────────────────────────────────────────────
  const { data: factories = [], isLoading } = trpc.factories.list.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();

  const favoriteMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.favorited ? "已收藏" : "已取消收藏");
    },
    onError: () => {
      toast.error("操作失败，请重试");
    },
  });

  // ── Filtering ─────────────────────────────────────────────────────────────
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

  // Derive unique categories
  const categories = Array.from(new Set(factories.map((f) => f.category).filter(Boolean)));

  // Avg score
  const avgScore = factories.length > 0
    ? (factories.reduce((sum, f) => sum + Number(f.overallScore || 0), 0) / factories.length).toFixed(1)
    : "0.0";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <BuyerSidebar userRole={user?.role || "buyer"} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="h-16 border-b border-border/50 flex items-center justify-between px-8">
          <h1 className="text-2xl font-bold">工厂大厅</h1>
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
                placeholder="搜索工厂名称、地区、产品类别..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-purple-500/30"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 bg-background/50 border-purple-500/30">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类别</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat!} value={cat!}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button className="btn-gradient-purple">
              <TrendingUp className="w-4 h-4 mr-2" />
              AI 推荐
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      {isLoading ? <span className="w-8 h-6 block bg-white/10 rounded animate-pulse" /> : factories.length}
                    </div>
                    <div className="text-muted-foreground text-sm">认证工厂</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      {isLoading ? <span className="w-8 h-6 block bg-white/10 rounded animate-pulse" /> : categories.length}
                    </div>
                    <div className="text-muted-foreground text-sm">产品类别</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      {isLoading ? <span className="w-8 h-6 block bg-white/10 rounded animate-pulse" /> : filteredFactories.length}
                    </div>
                    <div className="text-muted-foreground text-sm">筛选结果</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold mb-1">
                      {isLoading ? <span className="w-8 h-6 block bg-white/10 rounded animate-pulse" /> : avgScore}
                    </div>
                    <div className="text-muted-foreground text-sm">平均评分</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-600/20 flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-400" />
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
                <p className="text-muted-foreground">加载工厂数据...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Factory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFactories.map((factory) => (
                  <Card
                    key={factory.id}
                    className="glass-card hover:glow-purple transition-all group cursor-pointer"
                    onClick={() => setLocation(`/factory/${factory.id}`)}
                  >
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative overflow-hidden rounded-t-lg">
                        <img
                          src={
                            factory.logo ||
                            "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop"
                          }
                          alt={factory.name}
                          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {/* Verified Badge */}
                        {factory.status === "active" && (
                          <div className="absolute top-3 left-3 bg-green-600/80 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            认证工厂
                          </div>
                        )}
                        {/* Score Badge */}
                        {factory.overallScore && (
                          <div className="absolute top-3 right-3 bg-purple-600/80 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-bold">
                            ⭐ {Number(factory.overallScore).toFixed(1)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        {/* Name & Location */}
                        <div className="mb-3">
                          <h3 className="font-bold text-lg mb-2 group-hover:text-purple-400 transition-colors">
                            {factory.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{[factory.city, factory.country].filter(Boolean).join(", ") || "Unknown"}</span>
                            {factory.category && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{factory.category}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button className="flex-1 btn-gradient-purple" size="sm">
                            查看详情
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-purple-500/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              favoriteMutation.mutate({ targetType: "factory", targetId: factory.id });
                            }}
                            disabled={favoriteMutation.isPending}
                          >
                            收藏
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {filteredFactories.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">未找到匹配的工厂</h3>
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
