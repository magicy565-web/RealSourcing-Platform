import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import {
  motion,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  Play,
  Star,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mic,
  Video,
  MessageSquare,
  Users,
  Globe,
  Shield,
  Zap,
  Award,
  Bot,
  Send,
  Package,
  FileText,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Flame,
  Eye,
  BarChart3,
  Languages,
  Lock,
} from "lucide-react";

// ─── Fade-in on scroll ───────────────────────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let n = 0;
    const step = Math.ceil(to / 50);
    const t = setInterval(() => {
      n += step;
      if (n >= to) { setVal(to); clearInterval(t); }
      else setVal(n);
    }, 20);
    return () => clearInterval(t);
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── Live Ticker ─────────────────────────────────────────────────────────────
const ACTIVITIES = [
  { flag: "🇦🇪", name: "Ahmed", city: "Dubai", action: "预约了工厂参观", item: "广州 LED 照明工厂", time: "2m" },
  { flag: "🇬🇧", name: "Sarah", city: "London", action: "确认了样品订单", item: "深圳护肤 OEM", time: "5m" },
  { flag: "🇺🇸", name: "Michael", city: "New York", action: "开始了视频谈判", item: "东莞电子工厂", time: "8m" },
  { flag: "🇩🇪", name: "Klaus", city: "Munich", action: "收到了 AI 会议摘要", item: "天津汽配供应商", time: "11m" },
  { flag: "🇮🇳", name: "Priya", city: "Mumbai", action: "匹配了 3 家工厂", item: "杭州纺织制造商", time: "14m" },
  { flag: "🇫🇷", name: "Marie", city: "Paris", action: "与工厂签署了 NDA", item: "上海美妆 OEM", time: "17m" },
];

function LiveTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ACTIVITIES.length), 3200);
    return () => clearInterval(t);
  }, []);
  const a = ACTIVITIES[idx];
  return (
    <div className="border-y border-white/[0.06] bg-white/[0.02] py-3">
      <div className="mx-auto max-w-6xl px-6 flex items-center gap-4">
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          <span className="text-[11px] font-semibold text-emerald-400 tracking-widest uppercase">LIVE</span>
        </div>
        <span className="text-white/60 text-sm">{a.flag} <strong>{a.name}</strong> {a.action} <strong>{a.item}</strong></span>
        <span className="text-white/30 text-xs ml-auto">{a.time}</span>
      </div>
    </div>
  );
}

// ─── Stat Pill ───────────────────────────────────────────────────────────────
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
        <Counter to={value} suffix={suffix} />
      </div>
      <div className="text-white/40 text-sm">{label}</div>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
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
    <div className="min-h-screen bg-[#09090b]">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/8"
        style={{
          background: "rgba(9, 9, 11, 0.85)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-purple-600/30">
                <img src="/images/logo-mark.png" alt="RealSourcing" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-bold text-lg">RealSourcing</span>
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
                <span className="text-white/50 hover:text-white cursor-pointer transition-colors text-sm font-medium">
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

      {/* ── Live Ticker ── */}
      <LiveTicker />

      {/* ── Hero Section (Two Column Layout) ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Text Content */}
            <FadeUp>
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                style={{
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(124,58,237,0.30)",
                  width: "fit-content",
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-violet-300 text-xs font-semibold tracking-wide">PRD 3.1 · AI-Powered B2B Sourcing</span>
              </motion.div>

              <h1 className="text-5xl md:text-6xl font-black mb-6 leading-[1.08] tracking-tight text-white">
                告别中间商<br />
                <span style={{
                  background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #67e8f9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  直连真实工厂
                </span>
              </h1>

              <p className="text-lg text-white/50 mb-10 max-w-xl leading-relaxed">
                AI 智能匹配 · 视频实时谈判 · 自动录制存档<br />
                让全球采购商在 48 小时内找到并验证理想工厂
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link href="/register">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-3 rounded-xl font-bold text-white flex items-center gap-2 group"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                    }}
                  >
                    免费开始采购 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3 rounded-xl font-bold text-white flex items-center gap-2"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <Play className="w-4 h-4" /> 观看 Demo
                </motion.button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <StatPill value={500} suffix="+" label="认证工厂" accent="#a78bfa" />
                <StatPill value={2000} suffix="+" label="全球采购商" accent="#67e8f9" />
                <StatPill value={98} suffix="%" label="满意度" accent="#4ade80" />
              </div>
            </FadeUp>

            {/* Right Column: Product Preview */}
            <FadeUp delay={0.2}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                }}
              >
                {/* Macbook-style window frame */}
                <div className="bg-gradient-to-b from-white/10 to-white/5 px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Video Room Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-semibold text-white">LIVE · Webinar Room #2547</span>
                    </div>
                    <span className="text-xs text-white/40">47 人</span>
                  </div>

                  {/* Two video boxes */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="aspect-video rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/20 flex items-center justify-center">
                      <div className="text-center">
                        <Building2 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-xs text-blue-300">Guangzhou LED Factory</p>
                      </div>
                    </div>
                    <div className="aspect-video rounded-lg bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/20 flex items-center justify-center">
                      <div className="text-center">
                        <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                        <p className="text-xs text-purple-300">Abroad · Dubai Retail</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Translation */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <Languages className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs space-y-1">
                        <p className="text-white/60">🇨🇳 我们的产品采用最新的 LED 芯片技术...</p>
                        <p className="text-cyan-300">🇬🇧 Our products use the latest LED chip technology...</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-white">AI Summary Ready</span>
                    </div>
                    <p className="text-xs text-white/50">会议自动生成摘要、行动项和下一步跟进计划</p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <Mic className="w-4 h-4 text-white/60" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <Video className="w-4 h-4 text-white/60" />
                      </button>
                      <button className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <MessageSquare className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                    <button className="px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold transition-colors">
                      AI Summary Ready
                    </button>
                  </div>
                </div>
              </motion.div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-white/20 text-xs mb-6 tracking-widest uppercase">全球品牌采购商信任 RealSourcing</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-30">
            {["Walmart", "Target", "ASOS", "Zalando", "Noon", "Carrefour", "Lulu", "H&M", "Zara", "Amazon"].map((brand) => (
              <span key={brand} className="text-white font-bold text-sm tracking-wider">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-6">
          <FadeUp className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">常见问题</h2>
            <p className="text-white/40">快速了解 RealSourcing 如何改变您的采购方式</p>
          </FadeUp>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <motion.button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full text-left p-4 rounded-xl transition-all"
                  style={{
                    background: faqOpen === i ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.04)",
                    border: faqOpen === i ? "1px solid rgba(124,58,237,0.30)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${faqOpen === i ? "rotate-180" : ""}`} />
                  </div>
                  <AnimatePresence>
                    {faqOpen === i && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-white/50 text-sm mt-3"
                      >
                        {faq.a}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.button>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-20 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeUp>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">准备好开始采购了吗？</h2>
            <p className="text-white/40 mb-8 max-w-2xl mx-auto">加入 1,900+ 全球采购商，在 48 小时内找到并验证理想工厂</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3 rounded-xl font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                    boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                  }}
                >
                  免费开始
                </motion.button>
              </Link>
              <Link href="/factories">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-8 py-3 rounded-xl font-bold text-white"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  浏览工厂库
                </motion.button>
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center text-white/40 text-sm">
          <p>© 2026 RealSourcing. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
