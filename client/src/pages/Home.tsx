import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  Building2, TrendingUp, CheckCircle2, Users, Zap, Globe, Shield,
  Star, ArrowRight, Play, Sparkles, ChevronDown, BarChart3,
  Video, MessageSquare, Languages, Flame, Lock, Eye
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

// ── Magic UI 组件（精准增强，不改变布局）──────────────────────────────────
import { Particles } from "@/components/magicui/particles";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BlurFade } from "@/components/magicui/blur-fade";

// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────────────────────
const BG = "linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)";
const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.04) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.04) 1px, transparent 1px)
`;

// ─────────────────────────────────────────────────────────────────────────────
// Glassmorphism Stat Card
// ─────────────────────────────────────────────────────────────────────────────
function StatPill({ value, suffix, label, accent }: {
  value: number; suffix?: string; label: string; accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-center px-8 py-6 rounded-2xl relative overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${accent}25`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div className="text-4xl font-black text-white mb-1">
        <NumberTicker value={value} className="text-white text-4xl font-black" />
        {suffix && <span className="text-white">{suffix}</span>}
      </div>
      <div className="text-white/40 text-sm">{label}</div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bento Feature Card
// ─────────────────────────────────────────────────────────────────────────────
function BentoCard({
  icon: Icon, title, description, badge, accent, glow, className, children, withBeam = false
}: {
  icon: any; title: string; description: string; badge?: string;
  accent: string; glow: string; className?: string; children?: React.ReactNode;
  withBeam?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className={cn("rounded-2xl p-6 relative overflow-hidden", className)}
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${accent}20`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      {/* Glow orb */}
      <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: glow, filter: "blur(40px)" }} />

      {badge && (
        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-3"
          style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
          {badge}
        </span>
      )}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
        style={{ background: `${accent}15` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <h3 className="text-white font-bold text-base mb-2">{title}</h3>
      <p className="text-white/45 text-sm leading-relaxed">{description}</p>
      {children}
      {withBeam && (
        <BorderBeam size={120} duration={8} colorFrom={accent} colorTo={`${accent}40`} borderWidth={1} />
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Card
// ─────────────────────────────────────────────────────────────────────────────
function PricingCard({
  name, price, period, description, features, cta, highlighted = false
}: {
  name: string; price: string; period: string; description: string;
  features: string[]; cta: string; highlighted?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      className="relative rounded-2xl p-8"
      style={highlighted ? {
        background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.10))",
        border: "1px solid rgba(124,58,237,0.40)",
        boxShadow: "0 8px 40px rgba(124,58,237,0.20), inset 0 1px 0 rgba(255,255,255,0.08)",
      } : {
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {highlighted && (
        <>
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
            style={{ background: "linear-gradient(90deg, #7c3aed, #4f46e5)" }} />
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="text-white text-[10px] font-bold px-3 py-1 rounded-full"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              最受欢迎
            </span>
          </div>
        </>
      )}
      <div className="mb-6">
        <h3 className="text-white font-bold text-lg mb-1">{name}</h3>
        <p className="text-white/40 text-sm">{description}</p>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-black text-white">{price}</span>
        <span className="text-white/35 text-sm ml-1">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-white/60">{f}</span>
          </li>
        ))}
      </ul>
      <Link href="/register">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-xl font-bold text-sm"
          style={highlighted ? {
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "white",
            boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
          } : {
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.80)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          {cta}
        </motion.button>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Testimonial Card
// ─────────────────────────────────────────────────────────────────────────────
function TestimonialCard({ name, role, company, content, avatar, flag }: {
  name: string; role: string; company: string; content: string; avatar: string; flag: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-white/60 text-sm leading-relaxed mb-5">"{content}"</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
          {avatar}
        </div>
        <div>
          <p className="text-white text-sm font-semibold">{flag} {name}</p>
          <p className="text-white/35 text-xs">{role} · {company}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
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
    <div className="min-h-screen" style={{ background: BG, fontFamily: "'Inter', 'DM Sans', sans-serif" }}>

      {/* ── 全局背景网格 ── */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "40px 40px" }} />

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: "rgba(5, 3, 16, 0.85)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                <span className="text-white font-black text-sm">RS</span>
              </div>
              <span className="text-white font-bold text-lg tracking-tight">RealSourcing</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { href: "/webinars", label: "Webinar" },
              { href: "/factories", label: "工厂库" },
              { href: "#features", label: "功能" },
              { href: "#pricing", label: "定价" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <span className="text-white/45 hover:text-white cursor-pointer transition-colors text-sm font-medium">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="text-white/50 hover:text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                登录
              </button>
            </Link>
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-white text-sm font-bold px-4 py-2 rounded-xl"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
                }}
              >
                免费开始
              </motion.button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-36 pb-28 overflow-hidden">
        {/* Magic UI: Particles 背景 */}
        <Particles
          className="absolute inset-0 pointer-events-none"
          quantity={80}
          color="#a78bfa"
          size={0.5}
          staticity={60}
        />

        {/* Glow orbs */}
        <div className="absolute top-20 right-[8%] w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-[3%] w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(79,70,229,0.10) 0%, transparent 70%)" }} />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
              style={{
                background: "rgba(124,58,237,0.12)",
                border: "1px solid rgba(124,58,237,0.30)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-violet-300 text-xs font-semibold tracking-wide">PRD 3.1 · AI-Powered B2B Sourcing</span>
            </motion.div>

            {/* Headline — BlurFade 入场动画 */}
            <BlurFade delay={0.1} inView>
              <h1
                className="text-5xl md:text-7xl font-black mb-6 leading-[1.08] tracking-tight text-white"
              >
                告别中间商<br />
                <span style={{
                  background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #67e8f9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  直连真实工厂
                </span>
              </h1>
            </BlurFade>

            {/* Subheadline — BlurFade 入场动画 */}
            <BlurFade delay={0.2} inView>
              <p
                className="text-lg md:text-xl text-white/45 mb-10 max-w-2xl mx-auto leading-relaxed"
              >
                AI 智能匹配 · 视频实时谈判 · 自动录制存档<br />
                让全球采购商在 48 小时内找到并验证理想工厂
              </p>
            </BlurFade>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-20"
            >
              <Link href="/register">
                {/* Magic UI: ShimmerButton 替换主 CTA */}
                <ShimmerButton
                  shimmerColor="#c4b5fd"
                  background="linear-gradient(135deg, #7c3aed, #4f46e5)"
                  borderRadius="12px"
                  className="flex items-center gap-2 px-8 py-4 text-white font-bold text-base"
                  style={{ boxShadow: "0 8px 32px rgba(124,58,237,0.40)" }}
                >
                  免费开始采购 <ArrowRight className="w-4 h-4" />
                </ShimmerButton>
              </Link>
              <Link href="/webinars">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  <Play className="w-4 h-4" /> 观看 Demo
                </motion.button>
              </Link>
            </motion.div>

            {/* Stats Row — NumberTicker 替换 AnimatedNumber */}
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <StatPill value={500} suffix="+" label="认证工厂" accent="#a78bfa" />
              <StatPill value={2000} suffix="+" label="全球采购商" accent="#67e8f9" />
              <StatPill value={98} suffix="%" label="满意度" accent="#4ade80" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-white/20 text-xs mb-6 tracking-widest uppercase">全球品牌采购商信任 RealSourcing</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-30">
            {["Walmart", "Target", "ASOS", "Zalando", "Noon", "Carrefour", "Lulu"].map((brand) => (
              <span key={brand} className="text-white font-bold text-sm tracking-wider">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bento Features Grid ── */}
      <section id="features" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
              重新定义 B2B 采购
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              从发现到成交，AI 驱动的全链路采购协作平台
            </p>
          </motion.div>

          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-4">

            {/* 大卡片 - TikTok 风格直播 — BorderBeam 增强 */}
            <BentoCard
              icon={Flame}
              title="TikTok 风格 Webinar 直播间"
              description="沉浸式选品直播，FOMO 引擎实时触发，买家在直播间内完成意向锁定，转化率高达 61.7%。"
              badge="核心功能"
              accent="#f472b6"
              glow="rgba(244,114,182,0.08)"
              className="col-span-12 md:col-span-7"
              withBeam={true}
            >
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "平均在线时长", value: "24 min" },
                  { label: "意向转化率", value: "61.7%" },
                  { label: "场均线索", value: "47 条" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl p-3 text-center"
                    style={{ background: "rgba(244,114,182,0.08)", border: "1px solid rgba(244,114,182,0.15)" }}>
                    <p className="text-white font-black text-lg">{s.value}</p>
                    <p className="text-white/35 text-[10px]">{s.label}</p>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* AI 实时翻译 */}
            <BentoCard
              icon={Languages}
              title="AI 实时翻译"
              description="中英文双向实时字幕，延迟低于 2 秒，消除语言壁垒。"
              badge="AI 驱动"
              accent="#67e8f9"
              glow="rgba(103,232,249,0.08)"
              className="col-span-12 md:col-span-5"
            />

            {/* 工厂认证 */}
            <BentoCard
              icon={Shield}
              title="三重工厂认证"
              description="营业执照 + 生产资质 + 实地视频验证，确保每家工厂真实可信。"
              accent="#4ade80"
              glow="rgba(74,222,128,0.08)"
              className="col-span-12 md:col-span-4"
            />

            {/* 视频谈判 */}
            <BentoCard
              icon={Video}
              title="视频实时谈判"
              description="高清视频会议 + 自动录制 + AI 摘要，每一次沟通都有据可查。"
              accent="#a78bfa"
              glow="rgba(167,139,250,0.08)"
              className="col-span-12 md:col-span-4"
            />

            {/* AI 采购助理 — BorderBeam 增强 (badge="NEW") */}
            <BentoCard
              icon={Zap}
              title="AI 采购助理"
              description="智能匹配工厂、自动生成询盘、分析报价差异，让采购决策更快更准。"
              badge="NEW"
              accent="#fb923c"
              glow="rgba(251,146,60,0.08)"
              className="col-span-12 md:col-span-4"
              withBeam={true}
            />

            {/* 私密谈判室 */}
            <BentoCard
              icon={Lock}
              title="L1 私密谈判室"
              description="邀请制精英买家专属空间，绕开公域噪音，直接进入信任闭环。"
              accent="#818cf8"
              glow="rgba(129,140,248,0.08)"
              className="col-span-12 md:col-span-6"
            />

            {/* 全球工厂库 */}
            <BentoCard
              icon={Globe}
              title="500+ 认证工厂库"
              description="覆盖美妆、3C、家居、服装等主流品类，支持多维度筛选与对比。"
              accent="#34d399"
              glow="rgba(52,211,153,0.08)"
              className="col-span-12 md:col-span-6"
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">三步完成采购</h2>
            <p className="text-white/40 text-lg">从注册到成交，最快 48 小时</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* 连接线 */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5"
              style={{ background: "linear-gradient(90deg, rgba(124,58,237,0.4), rgba(79,70,229,0.4))" }} />

            {[
              { step: "01", icon: Building2, title: "发现认证工厂", desc: "AI 根据您的品类需求，从 500+ 认证工厂中精准匹配最优候选。", accent: "#a78bfa" },
              { step: "02", icon: Video, title: "视频实时谈判", desc: "发起视频会议，AI 实时翻译，自动录制，所有细节都有存档。", accent: "#67e8f9" },
              { step: "03", icon: CheckCircle2, title: "锁定样品下单", desc: "在平台内完成样品申请，追踪物流，一键转正式订单。", accent: "#4ade80" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="rounded-2xl p-8 relative"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid ${item.accent}20`,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ background: `linear-gradient(90deg, ${item.accent}, transparent)` }} />
                <div className="text-5xl font-black mb-4"
                  style={{ color: `${item.accent}25`, lineHeight: 1 }}>
                  {item.step}
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${item.accent}15` }}>
                  <item.icon className="w-5 h-5" style={{ color: item.accent }} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">全球买家的真实评价</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <TestimonialCard
              name="Ahmed Al-Maktoum"
              role="采购总监"
              company="Dubai Retail Group"
              content="RealSourcing 的直播间让我在 30 分钟内就锁定了 3 家优质工厂。AI 翻译非常流畅，感觉就像在和中国工厂面对面谈判。"
              avatar="A"
              flag="🇦🇪"
            />
            <TestimonialCard
              name="Sarah Jenkins"
              role="品牌创始人"
              company="London Beauty Co."
              content="以前找工厂要花 2-3 个月，现在用 RealSourcing 一周就完成了样品确认。工厂认证体系让我非常放心。"
              avatar="S"
              flag="🇬🇧"
            />
            <TestimonialCard
              name="Priya Sharma"
              role="电商运营总监"
              company="Mumbai Brands"
              content="Webinar 直播间的 FOMO 机制太厉害了，我们在直播中直接锁定了 30 件样品，比传统询盘快了 10 倍。"
              avatar="P"
              flag="🇮🇳"
            />
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white mb-4">透明定价</h2>
            <p className="text-white/40 text-lg">无隐藏费用，随时可取消</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PricingCard
              name="免费版"
              price="$0"
              period="/月"
              description="适合初次探索的采购商"
              features={["5 次视频会议/月", "基础工厂搜索", "AI 翻译（有限次数）", "社区支持"]}
              cta="免费开始"
            />
            <PricingCard
              name="专业版"
              price="$99"
              period="/月"
              description="适合活跃采购商和中小品牌"
              features={["无限视频会议", "AI 摘要 & 录制", "Meeting Reel 生成", "优先工厂匹配", "专属客户成功经理"]}
              cta="立即升级"
              highlighted
            />
            <PricingCard
              name="企业版"
              price="定制"
              period=""
              description="适合大型品牌和采购团队"
              features={["多账号团队协作", "私有化部署选项", "API 集成", "专属谈判顾问", "SLA 保障"]}
              cta="联系销售团队"
            />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">常见问题</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left transition-all"
                  style={{ background: faqOpen === i ? "rgba(124,58,237,0.06)" : "rgba(255,255,255,0.02)" }}
                >
                  <span className="text-white font-medium text-sm">{faq.q}</span>
                  <ChevronDown className={cn("w-4 h-4 text-white/30 transition-transform flex-shrink-0 ml-4", faqOpen === i && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 text-white/45 text-sm leading-relaxed border-t pt-4"
                        style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden p-14"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.10))",
              border: "1px solid rgba(124,58,237,0.25)",
              boxShadow: "0 16px 64px rgba(124,58,237,0.15)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5"
              style={{ background: "linear-gradient(90deg, transparent, #7c3aed, transparent)" }} />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">准备好开始了吗？</h2>
              <p className="text-white/45 text-lg mb-8 max-w-xl mx-auto">
                加入 2000+ 全球采购商，用 AI 驱动的方式找到理想工厂
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-base"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      boxShadow: "0 8px 32px rgba(124,58,237,0.40)",
                    }}
                  >
                    免费开始 <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link href="/factories">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.75)",
                    }}
                  >
                    浏览工厂库
                  </motion.button>
                </Link>
              </div>
              <p className="text-white/20 text-xs mt-5">无需信用卡 · 免费试用 14 天 · 随时取消</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-12"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                  <span className="text-white font-black text-xs">RS</span>
                </div>
                <span className="text-white font-bold">RealSourcing</span>
              </div>
              <p className="text-white/25 text-xs leading-relaxed">AI 驱动的 B2B 采购协作平台，连接全球买家与认证工厂。</p>
            </div>
            {[
              {
                title: "产品",
                links: [
                  { href: "/webinars", label: "Webinar" },
                  { href: "/factories", label: "工厂库" },
                  { href: "/ai-assistant", label: "AI 采购助理" },
                ]
              },
              {
                title: "公司",
                links: [
                  { href: "#", label: "关于我们" },
                  { href: "#", label: "联系我们" },
                  { href: "#", label: "隐私政策" },
                ]
              },
              {
                title: "快速入口",
                links: [
                  { href: "/register", label: "注册工厂" },
                  { href: "/register", label: "注册买家" },
                  { href: "/login", label: "登录" },
                ]
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white/60 font-semibold text-sm mb-3">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href}>
                        <span className="text-white/25 hover:text-white/60 cursor-pointer transition-colors text-xs">{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-6 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="text-white/15 text-xs">© 2025 RealSourcing. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
