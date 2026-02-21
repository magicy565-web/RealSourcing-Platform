import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Video,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Lock,
  ArrowRight,
  Star,
  Globe,
  Shield,
  Zap,
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Announcement Banner */}
      <div className="announcement-banner">
        <span>🎉 新功能上线：AI 智能采购助手，现已支持多语言对话</span>
        <a href="/register" className="ml-3 underline font-semibold hover:no-underline">
          立即体验 →
        </a>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">RealSourcing</span>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: "首页", href: "/" },
                { label: "在线研讨会", href: "/webinars" },
                { label: "工厂", href: "/factories" },
                { label: "产品", href: "#" },
              ].map((item) => (
                <Link key={item.label} href={item.href}>
                  <span className="text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                  登录
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-sm font-semibold shadow-lg shadow-primary/30">
                  免费注册
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-28 pb-24 overflow-hidden">
        {/* 背景光晕 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-violet-800/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-900/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* 标签 */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm text-primary font-semibold">AI-Powered B2B Sourcing Platform</span>
            </div>

            {/* 主标题 */}
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight text-foreground">
              直连真实工厂
              <br />
              <span className="text-gradient-purple">AI 驱动全球采购</span>
            </h1>

            {/* 副标题 */}
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
              AI 智能匹配，视频实时谈判，让全球采购商直接找到最合适的工厂
            </p>

            {/* CTA 按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register">
                <Button size="xl" className="shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 btn-gradient-purple">
                  立即免费注册
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link href="/webinars">
                <Button size="xl" variant="outline" className="border-2 border-white/10 bg-white/5 text-foreground hover:bg-white/10 hover:border-white/20">
                  观看演示视频
                  <Video className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>

            {/* 信任标签 */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground mb-16">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>无需信用卡</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-violet-400" />
                <span>工厂严格认证</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>全球 50+ 国家</span>
              </div>
            </div>

            {/* 数据展示 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                { value: "500+", label: "认证工厂" },
                { value: "2000+", label: "全球采购商" },
                { value: "98%", label: "采购商满意度" },
              ].map((stat) => (
                <div key={stat.label} className="stat-card text-center">
                  <div className="text-4xl font-bold text-gradient-purple mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 合作品牌 ── */}
      <section className="py-14 border-y border-border/40">
        <div className="container">
          <p className="text-center text-xs text-muted-foreground mb-8 font-semibold uppercase tracking-widest">
            已有全球知名品牌信任 RealSourcing
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">
            {["amazon", "Walmart", "TARGET", "IKEA", "H&M"].map((brand) => (
              <div
                key={brand}
                className="text-xl font-bold text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors cursor-default"
              >
                {brand}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 核心功能 ── */}
      <section className="py-24">
        <div className="container">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <span className="text-xs text-primary font-semibold uppercase tracking-wider">Platform Features</span>
            </div>
            <h2 className="text-heading-1 text-foreground mb-4">平台核心功能</h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              为 B2B 采购提供全方位的协作工具和服务，从寻源到成交一站式完成
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Sparkles, label: "AI 智能匹配", desc: "基于您的采购需求，AI 自动推荐最匹配的工厂", color: "text-violet-400", bg: "bg-violet-500/10" },
              { icon: Video, label: "在线研讨会", desc: "工厂实时展示产品，采购商在线互动提问", color: "text-purple-400", bg: "bg-purple-500/10" },
              { icon: Lock, label: "私密商务会议", desc: "一对一视频会议，安全高效地推进合作谈判", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
              { icon: BarChart3, label: "数据分析看板", desc: "全面追踪采购进度，数据驱动决策", color: "text-indigo-400", bg: "bg-indigo-500/10" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="card-hover border-border/40 group bg-card">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <h3 className="text-heading-3 text-foreground mb-2">{item.label}</h3>
                    <p className="text-caption text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 为什么选择我们 ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-heading-1 text-foreground mb-4">为什么选择 RealSourcing</h2>
              <p className="text-body-lg text-muted-foreground">连接真实工厂，开启高效采购新时代</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: Sparkles, color: "text-violet-400", bg: "bg-violet-500/10", title: "AI 智能匹配，精准推荐优质工厂", desc: "基于您的需求和历史数据，智能推荐最合适的工厂" },
                { icon: Video, color: "text-purple-400", bg: "bg-purple-500/10", title: "1:1 私密视频选品会议", desc: "与工厂直接对话，实时查看产品和生产线" },
                { icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10", title: "真实工厂直连，杜绝中间商", desc: "所有工厂经过严格认证，确保真实可靠" },
                { icon: TrendingUp, color: "text-indigo-400", bg: "bg-indigo-500/10", title: "全流程数字化管理", desc: "从寻源到下单，全程在线协作，提升效率" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-4 p-6 rounded-xl bg-card border border-border/40 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1.5">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── 客户评价 ── */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-heading-2 text-foreground mb-3">客户怎么说</h2>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">4.9/5 基于 200+ 条评价</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { quote: "RealSourcing 让我的采购效率提升了 3 倍，AI 匹配功能非常精准，节省了大量时间。", name: "Alice Wang", role: "TikTok 采购总监", initials: "AW", color: "bg-violet-500/20 text-violet-300" },
              { quote: "通过在线研讨会直接与工厂沟通，建立信任的速度比以前快了很多，强烈推荐！", name: "James Liu", role: "Amazon 卖家", initials: "JL", color: "bg-purple-500/20 text-purple-300" },
              { quote: "平台的工厂认证体系非常严格，找到的工厂质量都很高，再也不用担心被中间商坑了。", name: "Sarah Chen", role: "独立采购顾问", initials: "SC", color: "bg-fuchsia-500/20 text-fuchsia-300" },
            ].map((review) => (
              <Card key={review.name} className="border-border/40 bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{review.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${review.color} flex items-center justify-center text-sm font-bold`}>
                      {review.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.name}</p>
                      <p className="text-xs text-muted-foreground">{review.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-violet-900/10 to-purple-900/15 pointer-events-none" />
        <div className="absolute inset-0 border-y border-primary/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-6">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
              准备好开始了吗？
            </h2>
            <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
              加入 RealSourcing，连接全球优质工厂，开启高效采购新时代
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="xl" className="shadow-xl shadow-primary/30 btn-gradient-purple">
                  免费注册
                  <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="xl" variant="outline" className="border-2 border-white/10 bg-white/5 text-foreground hover:bg-white/10">
                  立即登录
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 border-t border-border/40">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-foreground">RealSourcing</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                连接买家和工厂的 B2B 采购协作平台，提供在线研讨会和实时视频会议功能。
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm">快速链接</h4>
              <ul className="space-y-2.5">
                <li><Link href="/webinars"><span className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors">在线研讨会</span></Link></li>
                <li><Link href="/factories"><span className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors">工厂列表</span></Link></li>
                <li><span className="text-sm text-muted-foreground hover:text-primary cursor-pointer transition-colors">产品列表</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm">联系我们</h4>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-muted-foreground">邮箱: contact@realsourcing.com</span></li>
                <li><span className="text-sm text-muted-foreground">电话: +86 400-123-4567</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-sm">关注我们</h4>
              <p className="text-sm text-muted-foreground">获取最新的行业资讯和平台动态</p>
            </div>
          </div>
          <div className="border-t border-border/40 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 RealSourcing. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
