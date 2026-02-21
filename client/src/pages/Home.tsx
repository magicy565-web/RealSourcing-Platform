import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2, Video, TrendingUp, Search, CheckCircle2, Users,
  Bell, User, Zap, Globe, Shield, Star, ArrowRight, Play,
  Package, MessageSquare, Calendar, Sparkles, ChevronDown,
  Languages, Mic, FileText, BarChart3, Award, Clock
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

// ── Animated Counter ──────────────────────────────────────────────────────────
function StatCard({ value, label, suffix = "" }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-black text-gradient-purple mb-2">
        {value}{suffix}
      </div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}

// ── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon, title, description, badge, color = "purple"
}: {
  icon: any; title: string; description: string; badge?: string; color?: "purple" | "blue" | "green" | "amber";
}) {
  const colorMap = {
    purple: { bg: "bg-purple-600/20", text: "text-purple-400", glow: "hover:border-purple-500/40" },
    blue: { bg: "bg-blue-600/20", text: "text-blue-400", glow: "hover:border-blue-500/40" },
    green: { bg: "bg-green-600/20", text: "text-green-400", glow: "hover:border-green-500/40" },
    amber: { bg: "bg-amber-600/20", text: "text-amber-400", glow: "hover:border-amber-500/40" },
  };
  const c = colorMap[color];
  return (
    <Card className={cn("glass-card transition-all duration-300 group border border-white/10", c.glow, "hover:shadow-lg")}>
      <CardContent className="p-8">
        {badge && (
          <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-4">
            {badge}
          </span>
        )}
        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", c.bg)}>
          <Icon className={cn("w-7 h-7", c.text)} />
        </div>
        <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

// ── Pricing Card ──────────────────────────────────────────────────────────────
function PricingCard({
  name, price, period, description, features, cta, highlighted = false
}: {
  name: string; price: string; period: string; description: string;
  features: string[]; cta: string; highlighted?: boolean;
}) {
  return (
    <div className={cn(
      "relative rounded-2xl p-8 border transition-all",
      highlighted
        ? "bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/50 shadow-lg shadow-purple-500/10"
        : "bg-white/5 border-white/10 hover:border-white/20"
    )}>
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-4 py-1 rounded-full font-semibold">
            最受欢迎
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-white font-bold text-lg mb-1">{name}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-black text-white">{price}</span>
        <span className="text-gray-400 text-sm ml-1">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span className="text-gray-300">{f}</span>
          </li>
        ))}
      </ul>
      <Link href="/register">
        <Button
          className={cn("w-full", highlighted ? "btn-gradient-purple" : "bg-white/10 hover:bg-white/20 text-white")}
        >
          {cta}
        </Button>
      </Link>
    </div>
  );
}

// ── Testimonial Card ──────────────────────────────────────────────────────────
function TestimonialCard({ name, role, company, content, avatar }: {
  name: string; role: string; company: string; content: string; avatar: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/20 transition-all">
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
      </div>
      <p className="text-gray-300 text-sm leading-relaxed mb-4">"{content}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
          {avatar}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{name}</p>
          <p className="text-gray-500 text-xs">{role} · {company}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Home() {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "RealSourcing 与阿里巴巴有什么区别？",
      a: "阿里巴巴是目录式采购，中间商多、信息不透明。RealSourcing 直连认证工厂，支持视频实时谈判、AI 实时翻译和会议录制，让采购过程完全可追溯。"
    },
    {
      q: "如何确保工厂的真实性？",
      a: "所有工厂须提供营业执照、生产资质和实地视频验证。平台对工厂进行评分，买家可查看历史评价和认证文件。"
    },
    {
      q: "视频会议支持哪些语言翻译？",
      a: "目前支持中英文实时互译，基于声网 STT 技术，字幕延迟低于 2 秒。后续将扩展支持日语、韩语、西班牙语等。"
    },
    {
      q: "样品费用如何结算？",
      a: "样品费用由工厂自行定价，通常为产品单价的 1-2 倍。平台目前不参与资金结算，买卖双方直接协商付款方式。"
    },
    {
      q: "工厂注册需要费用吗？",
      a: "基础版免费，工厂可免费展示产品和参与 Webinar。专业版（$99/月）提供无限会议、AI 摘要、Meeting Reel 生成等高级功能。"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A0A1A] via-[#0F0F23] to-[#0A0A1A]">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0A0A1A]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center gap-3 cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-black text-sm">RS</span>
                </div>
                <span className="text-xl font-bold text-white">RealSourcing</span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <Link href="/webinars"><span className="text-gray-400 hover:text-white cursor-pointer transition-colors text-sm">Webinar</span></Link>
              <Link href="/factories"><span className="text-gray-400 hover:text-white cursor-pointer transition-colors text-sm">工厂库</span></Link>
              <a href="#features"><span className="text-gray-400 hover:text-white cursor-pointer transition-colors text-sm">功能</span></a>
              <a href="#pricing"><span className="text-gray-400 hover:text-white cursor-pointer transition-colors text-sm">定价</span></a>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">登录</Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="btn-gradient-purple">免费开始</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-20 right-[10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-[5%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-8">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-300 font-medium">PRD 3.1 · AI-Powered B2B Sourcing</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] tracking-tight text-white">
              告别中间商<br />
              <span className="text-gradient-purple">直连真实工厂</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              AI 智能匹配 · 视频实时谈判 · 自动录制存档<br />
              让全球采购商在 48 小时内找到并验证理想工厂
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/register">
                <Button size="lg" className="btn-gradient-purple text-base px-8 py-5 h-auto gap-2">
                  免费开始采购 <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/webinars">
                <Button size="lg" variant="outline" className="text-base px-8 py-5 h-auto border-white/20 text-gray-300 hover:bg-white/5 gap-2">
                  <Play className="w-4 h-4" /> 观看 Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <StatCard value="500" suffix="+" label="认证工厂" />
              <StatCard value="2000" suffix="+" label="全球采购商" />
              <StatCard value="98" suffix="%" label="满意度" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof / Brand Logos ── */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-gray-600 text-sm mb-8">已有来自全球的品牌采购商信任 RealSourcing</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40">
            {["amazon", "Walmart", "TARGET", "IKEA", "H&M", "Costco"].map(brand => (
              <div key={brand} className="text-xl font-black text-white tracking-wider">{brand}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Features ── */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">平台核心功能</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">从寻源到下单，全流程 AI 赋能的 B2B 采购协作平台</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Search}
              title="AI 精准匹配"
              description="根据您的产品需求、历史偏好和预算，AI 自动推荐最匹配的认证工厂，匹配准确率 92%。"
              badge="AI Powered"
              color="purple"
            />
            <FeatureCard
              icon={Video}
              title="1:1 视频选品会议"
              description="私密视频会议室，工厂实时展示产品和生产线。支持屏幕共享、白板协作和产品卡片侧边栏。"
              color="blue"
            />
            <FeatureCard
              icon={Languages}
              title="实时 AI 翻译"
              description="基于声网 STT 技术，中英文实时互译，字幕延迟低于 2 秒，消除语言障碍。"
              badge="New"
              color="green"
            />
            <FeatureCard
              icon={Mic}
              title="会议自动录制"
              description="会议开始自动录制，结束后上传至云端。AI 自动生成结构化摘要、价格条款和跟进行动。"
              color="amber"
            />
            <FeatureCard
              icon={Package}
              title="一键申请样品"
              description="会议中直接申请样品，填写数量和收货地址，工厂确认后实时追踪物流状态。"
              color="purple"
            />
            <FeatureCard
              icon={Sparkles}
              title="Meeting Reel 生成"
              description="AI 识别会议关键时刻（价格谈判、产品展示），自动生成 45 秒精华视频，一键分享。"
              badge="AI Powered"
              color="blue"
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-gradient-to-b from-transparent to-purple-950/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">三步开启采购</h2>
            <p className="text-gray-400 text-lg">最快 48 小时完成从寻源到样品申请的全流程</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[33%] right-[33%] h-0.5 bg-gradient-to-r from-purple-500/50 to-blue-500/50" />

            {[
              {
                step: "01",
                icon: Search,
                title: "发现工厂",
                desc: "浏览 500+ 认证工厂，或通过 AI 采购助理描述需求自动匹配",
                color: "from-purple-500 to-purple-600"
              },
              {
                step: "02",
                icon: Video,
                title: "视频谈判",
                desc: "预约 1:1 选品会议，实时查看产品、谈价格、确认 MOQ",
                color: "from-blue-500 to-blue-600"
              },
              {
                step: "03",
                icon: Package,
                title: "申请样品",
                desc: "会议中一键申请样品，追踪物流，确认质量后正式下单",
                color: "from-green-500 to-green-600"
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="text-center relative">
                  <div className={cn(
                    "w-24 h-24 rounded-2xl bg-gradient-to-br mx-auto mb-6 flex items-center justify-center shadow-lg",
                    item.color
                  )}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="text-gray-600 text-xs font-bold mb-2">{item.step}</div>
                  <h3 className="text-white font-bold text-xl mb-3">{item.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why RealSourcing ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
                为什么选择<br /><span className="text-gradient-purple">RealSourcing</span>
              </h2>
              <p className="text-gray-400 mb-8 leading-relaxed">
                传统 B2B 采购平台依赖图文目录，信息不透明、中间商多、沟通效率低。
                RealSourcing 将视频、AI 和数据融为一体，让采购决策有据可查。
              </p>
              <div className="space-y-4">
                {[
                  { icon: Shield, text: "所有工厂经过营业执照和实地视频双重认证" },
                  { icon: Zap, text: "AI 实时翻译，消除语言障碍，沟通零延迟" },
                  { icon: FileText, text: "会议自动录制 + AI 摘要，决策有据可查" },
                  { icon: BarChart3, text: "成交概率评分，帮助采购商优先跟进高价值商机" },
                  { icon: Globe, text: "支持全球工厂，覆盖 50+ 产品品类" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-gray-300 text-sm">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-3 text-center">
                <div className="p-4 border-b border-white/10 text-gray-500 text-sm">功能</div>
                <div className="p-4 border-b border-l border-white/10 text-gray-400 text-sm font-medium">传统平台</div>
                <div className="p-4 border-b border-l border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-bold">RealSourcing</div>
              </div>
              {[
                ["视频实时谈判", "❌", "✅"],
                ["AI 实时翻译", "❌", "✅"],
                ["会议自动录制", "❌", "✅"],
                ["AI 会议摘要", "❌", "✅"],
                ["样品申请追踪", "部分", "✅"],
                ["工厂认证验证", "部分", "✅"],
                ["Meeting Reel", "❌", "✅"],
              ].map(([feature, old, neo], i) => (
                <div key={i} className="grid grid-cols-3 text-center border-b border-white/5 last:border-0">
                  <div className="p-3 text-gray-400 text-xs text-left px-4">{feature}</div>
                  <div className="p-3 border-l border-white/10 text-sm">{old}</div>
                  <div className="p-3 border-l border-purple-500/20 bg-purple-500/5 text-sm">{neo}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 bg-gradient-to-b from-transparent to-purple-950/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">采购商怎么说</h2>
            <p className="text-gray-400">来自全球采购商的真实反馈</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              name="Sarah Johnson"
              role="Sourcing Manager"
              company="US Retail Co."
              content="RealSourcing 的视频会议功能彻底改变了我们的采购流程。AI 实时翻译让我们和中国工厂的沟通毫无障碍，会议录制功能更是让每次谈判都有据可查。"
              avatar="SJ"
            />
            <TestimonialCard
              name="Marcus Weber"
              role="Head of Procurement"
              company="EU Electronics GmbH"
              content="以前找工厂要花 2-3 周，现在用 AI 匹配 + 视频会议，48 小时内就能完成初步筛选。Meeting Reel 功能让我们能快速向老板汇报谈判结果。"
              avatar="MW"
            />
            <TestimonialCard
              name="Aisha Patel"
              role="Founder"
              company="UK Fashion Brand"
              content="一键申请样品功能太方便了！会议中直接申请，工厂确认后就能追踪物流。整个流程比以前快了 60%，强烈推荐给所有跨境采购商。"
              avatar="AP"
            />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">透明定价</h2>
            <p className="text-gray-400 text-lg">按需选择，随时升级</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="免费版"
              price="$0"
              period="/月"
              description="适合刚开始探索的采购商"
              features={[
                "浏览工厂库（无限制）",
                "参与公开 Webinar",
                "每月 3 次视频会议",
                "基础 AI 采购助理",
                "样品申请（无限制）",
              ]}
              cta="免费注册"
            />
            <PricingCard
              name="专业版"
              price="$99"
              period="/月"
              description="适合活跃采购商和中小品牌"
              features={[
                "无限视频会议",
                "AI 实时翻译（中英互译）",
                "会议自动录制 + 云存储",
                "AI 会议摘要生成",
                "Meeting Reel 生成器",
                "样品订单追踪看板",
                "优先客服支持",
              ]}
              cta="开始 14 天免费试用"
              highlighted
            />
            <PricingCard
              name="企业版"
              price="定制"
              period=""
              description="适合大型采购团队和品牌商"
              features={[
                "专业版全部功能",
                "多语言翻译（6 种语言）",
                "专属 AI 采购助理训练",
                "ERP/OA 系统集成",
                "专属客户成功经理",
                "SLA 99.9% 可用性保障",
              ]}
              cta="联系销售团队"
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 bg-gradient-to-b from-transparent to-purple-950/10">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">常见问题</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-all"
                >
                  <span className="text-white font-medium text-sm">{faq.q}</span>
                  <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ml-4", faqOpen === i && "rotate-180")} />
                </button>
                {faqOpen === i && (
                  <div className="px-5 pb-5 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl overflow-hidden p-12 bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-blue-600/5" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                准备好开始了吗？
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                加入 2000+ 全球采购商，用 AI 驱动的方式找到理想工厂
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="btn-gradient-purple text-base px-8 py-5 h-auto gap-2">
                    免费开始 <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/factories">
                  <Button size="lg" variant="outline" className="text-base px-8 py-5 h-auto border-white/20 text-gray-300 hover:bg-white/5">
                    浏览工厂库
                  </Button>
                </Link>
              </div>
              <p className="text-gray-600 text-xs mt-4">无需信用卡 · 免费试用 14 天 · 随时取消</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-black text-xs">RS</span>
                </div>
                <span className="text-white font-bold">RealSourcing</span>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">AI 驱动的 B2B 采购协作平台，连接全球买家与认证工厂。</p>
            </div>
            <div>
              <h4 className="text-gray-300 font-medium text-sm mb-3">产品</h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><Link href="/webinars"><span className="hover:text-gray-400 cursor-pointer transition-colors">Webinar</span></Link></li>
                <li><Link href="/factories"><span className="hover:text-gray-400 cursor-pointer transition-colors">工厂库</span></Link></li>
                <li><Link href="/ai-assistant"><span className="hover:text-gray-400 cursor-pointer transition-colors">AI 采购助理</span></Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-300 font-medium text-sm mb-3">公司</h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><span className="hover:text-gray-400 cursor-pointer transition-colors">关于我们</span></li>
                <li><span className="hover:text-gray-400 cursor-pointer transition-colors">联系我们</span></li>
                <li><span className="hover:text-gray-400 cursor-pointer transition-colors">隐私政策</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-gray-300 font-medium text-sm mb-3">快速入口</h4>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><Link href="/register"><span className="hover:text-gray-400 cursor-pointer transition-colors">注册工厂</span></Link></li>
                <li><Link href="/register"><span className="hover:text-gray-400 cursor-pointer transition-colors">注册买家</span></Link></li>
                <li><Link href="/login"><span className="hover:text-gray-400 cursor-pointer transition-colors">登录</span></Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 text-center">
            <p className="text-gray-700 text-xs">© 2025 RealSourcing. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
