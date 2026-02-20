import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Video, TrendingUp, Search, CheckCircle2, Users } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* 标签 */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8">
              <span className="text-sm text-purple-400 font-semibold">AI-Powered B2B Sourcing Platform</span>
            </div>

            {/* 主标题 */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              告别中间商
              <br />
              <span className="text-gradient-purple">直连真实工厂</span>
            </h1>

            {/* 副标题 */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
              AI 智能匹配，视频实时谈判，让全球采购商直接找到的工厂
            </p>

            {/* CTA 按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/register">
                <Button size="lg" className="btn-gradient-purple text-lg px-8 py-6 h-auto">
                  免费注册工厂
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-purple-500/50 hover:bg-purple-500/10">
                观看演示 ▸
              </Button>
            </div>

            {/* 数据展示 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-gradient-purple mb-2">500+</div>
                <div className="text-muted-foreground">认证工厂</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gradient-purple mb-2">2000+</div>
                <div className="text-muted-foreground">全球采购商</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-gradient-purple mb-2">98%</div>
                <div className="text-muted-foreground">满意度</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 合作品牌 */}
      <section className="py-16 border-y border-border/50">
        <div className="container">
          <p className="text-center text-muted-foreground mb-8">已有全球知名品牌信任 RealSourcing</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            <div className="text-2xl font-bold">amazon</div>
            <div className="text-2xl font-bold">Walmart</div>
            <div className="text-2xl font-bold">● TARGET</div>
            <div className="text-2xl font-bold">IKEA</div>
            <div className="text-2xl font-bold">H&M</div>
          </div>
        </div>
      </section>

      {/* 核心功能 */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">平台核心功能</h2>
            <p className="text-xl text-muted-foreground">为 B2B 采购提供全方位的协作工具和服务</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 功能卡片 1 */}
            <Card className="glass-card hover:glow-purple transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-purple-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Search className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">AI 精准匹配</h3>
                <p className="text-muted-foreground leading-relaxed">
                  根据您的产品需求自动推荐优质工厂，AI 智能分析匹配度，节省您的寻源时间
                </p>
              </CardContent>
            </Card>

            {/* 功能卡片 2 */}
            <Card className="glass-card hover:glow-purple transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-blue-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Video className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">视频实时谈判</h3>
                <p className="text-muted-foreground leading-relaxed">
                  面对面展示工厂实力，快速建立信任，1:1 私密视频选品会议，高效沟通
                </p>
              </CardContent>
            </Card>

            {/* 功能卡片 3 */}
            <Card className="glass-card hover:glow-purple transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-green-600/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4">全流程透明跟进</h3>
                <p className="text-muted-foreground leading-relaxed">
                  商机状态一目了然，AI 提醒跟进时机，确保每个商机都不会错过
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 为什么选择我们 */}
      <section className="py-24 bg-gradient-to-b from-transparent to-purple-950/20">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">为什么选择 RealSourcing</h2>
              <p className="text-xl text-muted-foreground">连接真实工厂，开启高效采购新时代</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg mb-2">AI 智能匹配，精准推荐优质工厂</h4>
                  <p className="text-muted-foreground">基于您的需求和历史数据，智能推荐最合适的工厂</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg mb-2">1:1 私密视频选品会议</h4>
                  <p className="text-muted-foreground">与工厂直接对话，实时查看产品和生产线</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg mb-2">真实工厂直连，杜绝中间商</h4>
                  <p className="text-muted-foreground">所有工厂经过严格认证，确保真实可靠</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-lg mb-2">全流程数字化管理</h4>
                  <p className="text-muted-foreground">从寻源到下单，全程在线协作，提升效率</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <Card className="glass-card glow-purple">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-purple-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">准备好开始了吗？</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                加入 RealSourcing，连接全球优质工厂，开启高效采购新时代
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="btn-gradient-purple text-lg px-8 py-6 h-auto">
                    免费注册
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-purple-500/50 hover:bg-purple-500/10">
                    立即登录
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
