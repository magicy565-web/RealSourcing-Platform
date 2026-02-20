import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { 
  Radio, 
  Calendar, 
  Building2, 
  FileText, 
  TrendingUp, 
  Bell, 
  User,
  Send,
  Smile
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // 如果是工厂用户，重定向到工厂 Dashboard
  if (user?.role === "factory") {
    setLocation("/factory-dashboard");
    return null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <BuyerSidebar userRole={user?.role || "buyer"} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Bar */}
        <div className="h-16 border-b border-border/50 flex items-center justify-end px-8 gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center cursor-pointer">
            <User className="w-5 h-5" />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">
              早上好，Magic <span className="inline-block animate-bounce">👋</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              今天有 3 场 Webinar 等待您参与，AI 已为您推荐 12 家工厂
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Card 1 */}
            <Card className="glass-card hover:glow-purple transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-600/20 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-red-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">2</div>
                <div className="text-muted-foreground text-sm">场直播中</div>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="glass-card hover:glow-purple transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">5</div>
                <div className="text-muted-foreground text-sm">场即将开始</div>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="glass-card hover:glow-purple transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-green-400 text-sm font-semibold">+12 本周</span>
                </div>
                <div className="text-4xl font-bold mb-1">128</div>
                <div className="text-muted-foreground text-sm">家已合作工厂</div>
              </CardContent>
            </Card>

            {/* Card 4 */}
            <Card className="glass-card hover:glow-purple transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-1">12</div>
                <div className="text-muted-foreground text-sm">场已报名 Webinar</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* AI 推荐 Webinar */}
            <div className="lg:col-span-2">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">✨ AI 推荐 Webinar</h2>
                    <Button variant="link" className="text-purple-400">
                      查看全部 →
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {/* Webinar 1 - LIVE */}
                    <div className="flex gap-4 p-4 rounded-lg bg-background/30 hover:bg-background/50 transition-all cursor-pointer">
                      <div className="relative">
                        <img
                          src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=120&fit=crop"
                          alt="Webinar"
                          className="w-32 h-20 rounded-lg object-cover"
                        />
                        <span className="absolute top-2 left-2 badge-live">LIVE</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3 h-3" />
                          </div>
                          <span className="text-sm text-muted-foreground">深圳科技工厂</span>
                        </div>
                        <h3 className="font-semibold mb-2">2025 TikTok 爆款蓝牙耳机新品发布会</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="text-red-400">🔴 1,234人在线</span>
                        </div>
                      </div>
                      <Button className="btn-gradient-purple self-center">
                        立即参与
                      </Button>
                    </div>

                    {/* Webinar 2 - UPCOMING */}
                    <div className="flex gap-4 p-4 rounded-lg bg-background/30 hover:bg-background/50 transition-all cursor-pointer">
                      <div className="relative">
                        <img
                          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=200&h=120&fit=crop"
                          alt="Webinar"
                          className="w-32 h-20 rounded-lg object-cover"
                        />
                        <span className="absolute top-2 left-2 badge-upcoming">UPCOMING</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3 h-3" />
                          </div>
                          <span className="text-sm text-muted-foreground">广州服装厂</span>
                        </div>
                        <h3 className="font-semibold mb-2">2025秋冬运动服饰品会</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>明天 14:00</span>
                        </div>
                      </div>
                      <Button variant="outline" className="self-center border-purple-500/50">
                        注册
                      </Button>
                    </div>

                    {/* Webinar 3 - PAST */}
                    <div className="flex gap-4 p-4 rounded-lg bg-background/30 hover:bg-background/50 transition-all cursor-pointer">
                      <div className="relative">
                        <img
                          src="https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=200&h=120&fit=crop"
                          alt="Webinar"
                          className="w-32 h-20 rounded-lg object-cover"
                        />
                        <span className="absolute top-2 left-2 badge-past">PAST</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3 h-3" />
                          </div>
                          <span className="text-sm text-muted-foreground">东莞玩具厂</span>
                        </div>
                        <h3 className="font-semibold mb-2">儿童益智玩具出口合规指南</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>已结束</span>
                        </div>
                      </div>
                      <Button variant="outline" className="self-center border-purple-500/50">
                        回放
                      </Button>
                    </div>
                  </div>
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

                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div className="flex-1 bg-background/50 rounded-lg p-3">
                        <p className="text-sm mb-3">
                          🎯 我已为您找到 8 家匹配工厂，其中 3 家即将开始Webinar...
                        </p>
                        <div className="space-y-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full justify-start text-left border-purple-500/30"
                          >
                            查看推荐工厂
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full justify-start text-left border-purple-500/30"
                          >
                            浏览相关 Webinar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full justify-start text-left border-purple-500/30"
                          >
                            发起询价
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input */}
                  <div className="relative">
                    <Input
                      placeholder="输入您的采购需求..."
                      className="pr-20 bg-background/50 border-purple-500/30"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="w-8 h-8">
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button size="icon" className="w-8 h-8 btn-gradient-purple">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
