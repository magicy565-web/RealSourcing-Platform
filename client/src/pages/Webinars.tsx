import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BuyerSidebar from "@/components/BuyerSidebar";
import { Search, Filter, Calendar, Building2, Users, Bell, User, Radio } from "lucide-react";
import { useLocation } from "wouter";

export default function Webinars() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const webinars = [
    {
      id: 1,
      title: "2025 TikTok 爆款蓝牙耳机新品发布会",
      factory: "深圳科技工厂",
      status: "live",
      viewers: 1234,
      time: "正在直播",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=250&fit=crop",
      category: "电子产品"
    },
    {
      id: 2,
      title: "2025秋冬运动服饰选品会",
      factory: "广州服装厂",
      status: "upcoming",
      viewers: null,
      time: "明天 14:00",
      image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=250&fit=crop",
      category: "服装"
    },
    {
      id: 3,
      title: "智能家居产品出口合规指南",
      factory: "东莞智能科技",
      status: "upcoming",
      viewers: null,
      time: "后天 10:00",
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=250&fit=crop",
      category: "智能家居"
    },
    {
      id: 4,
      title: "儿童益智玩具出口合规指南",
      factory: "东莞玩具厂",
      status: "past",
      viewers: null,
      time: "已结束",
      image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=250&fit=crop",
      category: "玩具"
    },
    {
      id: 5,
      title: "环保包装材料新品发布",
      factory: "上海包装厂",
      status: "live",
      viewers: 856,
      time: "正在直播",
      image: "https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?w=400&h=250&fit=crop",
      category: "包装"
    },
    {
      id: 6,
      title: "户外运动装备选品会",
      factory: "宁波运动用品厂",
      status: "upcoming",
      viewers: null,
      time: "下周一 15:00",
      image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=250&fit=crop",
      category: "运动用品"
    },
  ];

  const filteredWebinars = webinars.filter((webinar) => {
    const matchesSearch = webinar.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         webinar.factory.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || webinar.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <BuyerSidebar userRole="buyer" />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="h-16 border-b border-border/50 flex items-center justify-between px-8">
          <h1 className="text-2xl font-bold">Webinars</h1>
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
                <SelectItem value="upcoming">即将开始</SelectItem>
                <SelectItem value="past">已结束</SelectItem>
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
                      {webinars.filter(w => w.status === "live").length}
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
                      {webinars.filter(w => w.status === "upcoming").length}
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
                    <div className="text-3xl font-bold mb-1">12</div>
                    <div className="text-muted-foreground text-sm">场已报名</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                      src={webinar.image}
                      alt={webinar.title}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {webinar.status === "live" && (
                        <span className="badge-live flex items-center gap-1">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                          LIVE
                        </span>
                      )}
                      {webinar.status === "upcoming" && (
                        <span className="badge-upcoming">UPCOMING</span>
                      )}
                      {webinar.status === "past" && (
                        <span className="badge-past">PAST</span>
                      )}
                    </div>
                    {/* Viewers Count (for live) */}
                    {webinar.status === "live" && webinar.viewers && (
                      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {webinar.viewers.toLocaleString()}
                      </div>
                    )}
                    {/* Category */}
                    <div className="absolute bottom-3 left-3 bg-purple-600/80 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold">
                      {webinar.category}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Factory */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center">
                        <Building2 className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-muted-foreground">{webinar.factory}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-lg mb-3 line-clamp-2 group-hover:text-purple-400 transition-colors">
                      {webinar.title}
                    </h3>

                    {/* Time & Action */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{webinar.time}</span>
                      </div>
                      
                      {webinar.status === "live" && (
                        <Button size="sm" className="btn-gradient-purple">
                          立即参与
                        </Button>
                      )}
                      {webinar.status === "upcoming" && (
                        <Button size="sm" variant="outline" className="border-purple-500/50">
                          注册
                        </Button>
                      )}
                      {webinar.status === "past" && (
                        <Button size="sm" variant="outline" className="border-purple-500/50">
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
        </div>
      </div>
    </div>
  );
}
