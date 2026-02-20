import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BuyerSidebar from "@/components/BuyerSidebar";
import { Search, Filter, MapPin, Star, Users, Bell, User, Building2, Award, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function Factories() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const factories = [
    {
      id: 1,
      name: "深圳科技工厂",
      location: "深圳市",
      category: "电子产品",
      rating: 4.8,
      reviews: 234,
      verified: true,
      products: 156,
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=250&fit=crop",
      tags: ["ISO认证", "出口资质", "快速响应"],
      matchScore: 95
    },
    {
      id: 2,
      name: "广州服装厂",
      location: "广州市",
      category: "服装",
      rating: 4.6,
      reviews: 189,
      verified: true,
      products: 203,
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop",
      tags: ["BSCI认证", "定制服务", "大批量"],
      matchScore: 88
    },
    {
      id: 3,
      name: "东莞智能科技",
      location: "东莞市",
      category: "智能家居",
      rating: 4.9,
      reviews: 312,
      verified: true,
      products: 89,
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=250&fit=crop",
      tags: ["专利技术", "研发能力", "智能制造"],
      matchScore: 92
    },
    {
      id: 4,
      name: "东莞玩具厂",
      location: "东莞市",
      category: "玩具",
      rating: 4.5,
      reviews: 167,
      verified: true,
      products: 245,
      image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=250&fit=crop",
      tags: ["CE认证", "安全检测", "环保材料"],
      matchScore: 85
    },
    {
      id: 5,
      name: "上海包装厂",
      location: "上海市",
      category: "包装",
      rating: 4.7,
      reviews: 198,
      verified: true,
      products: 178,
      image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=250&fit=crop",
      tags: ["环保认证", "定制设计", "快速交付"],
      matchScore: 90
    },
    {
      id: 6,
      name: "宁波运动用品厂",
      location: "宁波市",
      category: "运动用品",
      rating: 4.6,
      reviews: 156,
      verified: true,
      products: 134,
      image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=250&fit=crop",
      tags: ["品质保证", "OEM/ODM", "全球出口"],
      matchScore: 87
    },
  ];

  const filteredFactories = factories.filter((factory) => {
    const matchesSearch = factory.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         factory.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || factory.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <BuyerSidebar userRole="buyer" />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="h-16 border-b border-border/50 flex items-center justify-between px-8">
          <h1 className="text-2xl font-bold">工厂大厅</h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center cursor-pointer">
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
                <SelectItem value="电子产品">电子产品</SelectItem>
                <SelectItem value="服装">服装</SelectItem>
                <SelectItem value="智能家居">智能家居</SelectItem>
                <SelectItem value="玩具">玩具</SelectItem>
                <SelectItem value="包装">包装</SelectItem>
                <SelectItem value="运动用品">运动用品</SelectItem>
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
                    <div className="text-3xl font-bold mb-1">{factories.length}</div>
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
                    <div className="text-3xl font-bold mb-1">12</div>
                    <div className="text-muted-foreground text-sm">AI 推荐</div>
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
                    <div className="text-3xl font-bold mb-1">8</div>
                    <div className="text-muted-foreground text-sm">已合作</div>
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
                    <div className="text-3xl font-bold mb-1">4.7</div>
                    <div className="text-muted-foreground text-sm">平均评分</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-yellow-600/20 flex items-center justify-center">
                    <Star className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                      src={factory.image}
                      alt={factory.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Verified Badge */}
                    {factory.verified && (
                      <div className="absolute top-3 left-3 bg-green-600/80 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        认证工厂
                      </div>
                    )}
                    {/* Match Score */}
                    <div className="absolute top-3 right-3 bg-purple-600/80 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-bold">
                      {factory.matchScore}% 匹配
                    </div>
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
                        <span>{factory.location}</span>
                        <span className="mx-2">•</span>
                        <span>{factory.category}</span>
                      </div>
                    </div>

                    {/* Rating & Reviews */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{factory.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {factory.reviews} 条评价
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {factory.products} 款产品
                      </span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {factory.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button className="flex-1 btn-gradient-purple" size="sm">
                        查看详情
                      </Button>
                      <Button variant="outline" size="sm" className="border-purple-500/50">
                        联系
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
        </div>
      </div>
    </div>
  );
}
