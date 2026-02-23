import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Play, Check, X, ChevronRight,
  Users, TrendingUp, Zap, Shield, Video,
  Languages, Star, Globe2, Bot,
  ChevronLeft, ChevronDown, Factory, Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const T = {
  bg: "#0A0A0A",
  surface: "#111111",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.15)",
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.45)",
  textSubtle: "rgba(255,255,255,0.25)",
  accent: "#5E6AD2",
  accentGlow: "rgba(94,106,210,0.15)",
  green: "#4ADE80",
  amber: "#FBBF24",
  red: "#F87171",
};

function FadeIn({ children, delay = 0, y = 16, className = "" }: {
  children: React.ReactNode; delay?: number; y?: number; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >{children}</motion.div>
  );
}

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 50;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 20);
    return () => clearInterval(timer);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

const ACTIVITIES = [
  { flag: "🇦🇪", name: "Ahmed Al-Rashid", action: "booked a factory inspection in Guangzhou", time: "2m ago" },
  { flag: "🇺🇸", name: "Sarah Johnson", action: "closed a $120K deal via live webinar", time: "5m ago" },
  { flag: "🇩🇪", name: "Klaus Weber", action: "received AI-translated quotation from 3 factories", time: "8m ago" },
  { flag: "🇬🇧", name: "Emma Clarke", action: "started a video negotiation with Shenzhen supplier", time: "12m ago" },
  { flag: "🇫🇷", name: "Pierre Dubois", action: "matched with 5 certified LED factories", time: "15m ago" },
  { flag: "🇯🇵", name: "Tanaka Hiroshi", action: "completed sample verification via live stream", time: "18m ago" },
];

function ActivityTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ACTIVITIES.length), 3500);
    return () => clearInterval(t);
  }, []);
  const item = ACTIVITIES[idx];
  return (
    <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full text-sm"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}>
      <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: T.green }} />
      <AnimatePresence mode="wait">
        <motion.span key={idx}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="truncate max-w-xs" style={{ color: T.textMuted }}>
          <span style={{ color: T.text }}>{item.flag} {item.name}</span>
          {" "}{item.action}
          <span className="ml-2 text-xs" style={{ color: T.textSubtle }}>{item.time}</span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

function WebinarMockUI() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [translating, setTranslating] = useState(false);
  const messages = [
    { from: "buyer", text: "Can you show me the production line for the LED module?" },
    { from: "ai", text: "🤖 AI: 请展示LED模组的生产线" },
    { from: "factory", text: "当然，请看这里 — 我们每天可以生产50,000个单位。" },
    { from: "ai", text: "🤖 AI: Of course — we can produce 50,000 units per day." },
  ];
  useEffect(() => {
    const t = setInterval(() => {
      setTranslating(true);
      setTimeout(() => { setMsgIdx(i => (i + 1) % messages.length); setTranslating(false); }, 600);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden w-full"
      style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: "#FF5F57" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#FFBD2E" }} />
          <div className="w-3 h-3 rounded-full" style={{ background: "#28CA41" }} />
        </div>
        <div className="flex-1 text-center text-xs" style={{ color: T.textSubtle }}>RealSourcing — Live Webinar</div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: T.red }} />
          <span className="text-xs" style={{ color: T.red }}>LIVE</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        <div className="rounded-xl aspect-video relative overflow-hidden" style={{ background: "#1a1a2e" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Factory className="w-8 h-8" style={{ color: T.textSubtle }} />
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md"
            style={{ background: "rgba(0,0,0,0.7)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.green }} />
            <span className="text-xs text-white">Shenzhen Factory</span>
          </div>
        </div>
        <div className="rounded-xl aspect-video relative overflow-hidden" style={{ background: "#1a2e1a" }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="w-8 h-8" style={{ color: T.textSubtle }} />
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md"
            style={{ background: "rgba(0,0,0,0.7)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.green }} />
            <span className="text-xs text-white">Ahmed · Dubai</span>
          </div>
        </div>
      </div>
      <div className="mx-3 mb-3 rounded-xl p-3" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2 mb-2">
          <Languages className="w-3.5 h-3.5" style={{ color: T.accent }} />
          <span className="text-xs font-medium" style={{ color: T.accent }}>AI Real-time Translation</span>
          {translating && (
            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }}
              className="flex gap-0.5 ml-auto">
              {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full" style={{ background: T.accent }} />)}
            </motion.div>
          )}
        </div>
        <AnimatePresence mode="wait">
          <motion.p key={msgIdx}
            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.25 }}
            className="text-xs leading-relaxed"
            style={{ color: messages[msgIdx].from === "ai" ? T.accent : T.textMuted }}>
            {messages[msgIdx].text}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="px-3 pb-3 flex items-center justify-between">
        <div className="flex -space-x-2">
          {["🇦🇪","🇨🇳","🇺🇸","🇩🇪"].map((flag, i) => (
            <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2"
              style={{ background: T.surface, borderColor: T.bg }}>{flag}</div>
          ))}
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs border-2"
            style={{ background: T.accentGlow, borderColor: T.bg, color: T.accent }}>+12</div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: T.accentGlow, color: T.accent }}>
          <Sparkles className="w-3 h-3" />AI Summary Active
        </div>
      </div>
    </div>
  );
}

const FACTORIES = [
  { name: "Shenzhen TechMold Co.", category: "Electronics Manufacturing", location: "Shenzhen, China",
    rating: 4.9, reviews: 312, moq: "500 pcs", certs: ["ISO 9001","CE","RoHS"], response: "< 2h", badge: "Top Rated" },
  { name: "Guangzhou Apparel Group", category: "Textile & Apparel", location: "Guangzhou, China",
    rating: 4.8, reviews: 489, moq: "200 pcs", certs: ["OEKO-TEX","GOTS"], response: "< 1h", badge: "Fast Response" },
  { name: "Yiwu Packaging Solutions", category: "Packaging & Printing", location: "Yiwu, China",
    rating: 4.7, reviews: 256, moq: "1000 pcs", certs: ["FSC","ISO 14001"], response: "< 3h", badge: "Eco Certified" },
  { name: "Dongguan Furniture Works", category: "Furniture & Home Decor", location: "Dongguan, China",
    rating: 4.9, reviews: 178, moq: "50 pcs", certs: ["CARB","FSC"], response: "< 2h", badge: "Premium" },
];

function FactoryCard({ factory }: { factory: typeof FACTORIES[0] }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}
      className="rounded-xl p-5 flex-shrink-0 w-72"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-white mb-0.5">{factory.name}</div>
          <div className="text-xs" style={{ color: T.textMuted }}>{factory.category}</div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: T.accentGlow, color: T.accent }}>{factory.badge}</span>
      </div>
      <div className="flex items-center gap-1 mb-3">
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        <span className="text-sm font-medium text-white">{factory.rating}</span>
        <span className="text-xs" style={{ color: T.textSubtle }}>({factory.reviews})</span>
        <span className="mx-1.5 text-xs" style={{ color: T.textSubtle }}>·</span>
        <Globe2 className="w-3 h-3" style={{ color: T.textSubtle }} />
        <span className="text-xs" style={{ color: T.textMuted }}>{factory.location}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {factory.certs.map(c => (
          <span key={c} className="text-xs px-2 py-0.5 rounded-md"
            style={{ background: "rgba(255,255,255,0.05)", color: T.textMuted, border: `1px solid ${T.border}` }}>{c}</span>
        ))}
      </div>
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="text-xs" style={{ color: T.textMuted }}>MOQ: <span className="text-white">{factory.moq}</span></div>
        <div className="text-xs" style={{ color: T.textMuted }}>Response: <span style={{ color: T.green }}>{factory.response}</span></div>
      </div>
    </motion.div>
  );
}

const AI_CONVERSATION = [
  { role: "user", text: "I need 5,000 units of wireless earbuds, budget $8/unit, delivery in 6 weeks." },
  { role: "ai", text: "Analyzing 500+ certified factories... Found 12 matches with verified production capacity." },
  { role: "ai", text: "Top match: Shenzhen AudioTech Co. — ISO 9001, 4.9★, MOQ 1,000 units, can deliver in 4 weeks at $7.2/unit." },
  { role: "user", text: "Can you schedule a live inspection for next Tuesday?" },
  { role: "ai", text: "✓ Webinar booked: Tuesday 10:00 AM (Dubai time). AI translator enabled. Recording will be auto-generated." },
];

function AIDemo() {
  const [visibleCount, setVisibleCount] = useState(1);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const t = setInterval(() => {
      setVisibleCount(c => { if (c >= AI_CONVERSATION.length) { clearInterval(t); return c; } return c + 1; });
    }, 1200);
    return () => clearInterval(t);
  }, [inView]);
  return (
    <div ref={ref} className="rounded-xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${T.border}` }}>
        <Bot className="w-4 h-4" style={{ color: T.accent }} />
        <span className="text-sm font-medium text-white">AI Sourcing Assistant</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: T.accentGlow, color: T.accent }}>Online</span>
      </div>
      <div className="p-4 space-y-3 min-h-[240px]">
        {AI_CONVERSATION.slice(0, visibleCount).map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed"
              style={msg.role === "user"
                ? { background: T.accent, color: "#fff" }
                : { background: T.bg, color: T.textMuted, border: `1px solid ${T.border}` }}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {visibleCount < AI_CONVERSATION.length && (
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} className="flex gap-1 pl-1">
            {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: T.textSubtle }} />)}
          </motion.div>
        )}
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  { quote: "RealSourcing cut our sourcing cycle from 3 months to 1 week. The live webinar format with AI translation is a game-changer.", name: "Ahmed Al-Maktoum", role: "Procurement Director", company: "Dubai Retail Group", flag: "🇦🇪", rating: 5 },
  { quote: "We verified 3 factories in a single afternoon via live video. The AI summary saved us hours of note-taking.", name: "Sarah Jenkins", role: "Brand Founder", company: "London Beauty Co.", flag: "🇬🇧", rating: 5 },
  { quote: "The FOMO mechanism in the webinar room is incredible. We locked in 30 samples during a live session.", name: "Priya Sharma", role: "E-commerce Director", company: "Mumbai Brands", flag: "🇮🇳", rating: 5 },
  { quote: "Best B2B sourcing tool I have used. The factory verification system gives us full confidence before placing orders.", name: "Klaus Weber", role: "Head of Sourcing", company: "Berlin Goods GmbH", flag: "🇩🇪", rating: 5 },
];

const COMPARISON = [
  { feature: "直连工厂，零中间商", rs: true, alibaba: false, traditional: false },
  { feature: "实时视频谈判", rs: true, alibaba: false, traditional: false },
  { feature: "AI 实时翻译", rs: true, alibaba: false, traditional: false },
  { feature: "自动录制 & AI 摘要", rs: true, alibaba: false, traditional: false },
  { feature: "三重工厂认证", rs: true, alibaba: "partial", traditional: false },
  { feature: "48h 采购周期", rs: true, alibaba: false, traditional: false },
  { feature: "样品追踪", rs: true, alibaba: "partial", traditional: true },
  { feature: "零平台佣金", rs: true, alibaba: false, traditional: false },
];

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const factoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const scrollFactories = (dir: "left" | "right") => {
    if (!factoryScrollRef.current) return;
    factoryScrollRef.current.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  };

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: "'Inter', -apple-system, sans-serif", minHeight: "100vh" }}>

      <motion.nav className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled ? "rgba(10,10,10,0.9)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? `1px solid ${T.border}` : "1px solid transparent",
          transition: "all 0.3s ease",
        }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
                style={{ background: T.accent }}>RS</div>
              <span className="font-semibold text-white">RealSourcing</span>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-7">
            {[["Webinar","/webinars"],["工厂库","/factories"],["功能","#features"],["定价","#pricing"]].map(([label, href]) => (
              <Link key={label} href={href as string}>
                <span className="text-sm cursor-pointer transition-colors" style={{ color: T.textMuted }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}>{label}</span>
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="text-sm px-4 py-2 rounded-lg transition-colors" style={{ color: T.textMuted }}
                onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}>登录</button>
            </Link>
            <Link href="/register">
              <button className="text-sm px-4 py-2 rounded-lg font-medium transition-all"
                style={{ background: T.text, color: T.bg }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.9")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>免费开始</button>
            </Link>
          </div>
        </div>
      </motion.nav>

      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(94,106,210,0.12) 0%, transparent 70%)" }} />
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <FadeIn delay={0}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-8"
                  style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
                  PRD 3.1 · AI-Powered B2B Sourcing
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </FadeIn>
              <FadeIn delay={0.08}>
                <h1 className="text-5xl lg:text-6xl font-black leading-[1.06] tracking-tight mb-6">
                  告别中间商<br />
                  <span style={{ color: T.accent }}>直连真实工厂</span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.14}>
                <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: T.textMuted }}>
                  AI 智能匹配 · 视频实时谈判 · 自动录制存档<br />
                  让全球采购商在 <strong className="text-white">48 小时</strong>内找到并验证理想工厂
                </p>
              </FadeIn>
              <FadeIn delay={0.2}>
                <div className="flex flex-col sm:flex-row gap-3 mb-10">
                  <Link href="/register">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                      style={{ background: T.text, color: T.bg }}>
                      免费开始采购 <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
                  <Link href="/webinars">
                    <motion.button whileHover={{ borderColor: T.borderHover }}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-colors"
                      style={{ border: `1px solid ${T.border}`, color: T.textMuted }}>
                      <Play className="w-4 h-4" /> 观看 Demo
                    </motion.button>
                  </Link>
                </div>
              </FadeIn>
              <FadeIn delay={0.26}><ActivityTicker /></FadeIn>
            </div>
            <FadeIn delay={0.15} y={24} className="relative">
              <WebinarMockUI />
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute -left-6 top-1/3 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                <TrendingUp className="w-4 h-4" style={{ color: T.green }} />
                <span className="text-white font-semibold">61.7%</span>
                <span style={{ color: T.textMuted }}>转化率</span>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.75, duration: 0.5 }}
                className="absolute -right-4 bottom-1/4 hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                <Shield className="w-4 h-4" style={{ color: T.accent }} />
                <span className="text-white font-semibold">三重认证</span>
              </motion.div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-16" style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8">
            {[{ value: 500, suffix: "+", label: "认证工厂" },{ value: 2000, suffix: "+", label: "全球采购商" },{ value: 98, suffix: "%", label: "满意度" }].map((stat, i) => (
              <FadeIn key={i} delay={i * 0.1} className="text-center">
                <div className="text-4xl font-black text-white mb-1"><Counter target={stat.value} suffix={stat.suffix} /></div>
                <div className="text-sm" style={{ color: T.textMuted }}>{stat.label}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs mb-8 tracking-widest uppercase" style={{ color: T.textSubtle }}>全球品牌采购商信任 RealSourcing</p>
          <div className="flex flex-wrap justify-center items-center gap-10">
            {["Walmart","Target","ASOS","Zalando","Noon","Carrefour","Lulu"].map(brand => (
              <span key={brand} className="text-base font-bold" style={{ color: T.textSubtle }}>{brand}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-24" style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn>
              <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: T.accent }}>AI 采购助手</div>
              <h2 className="text-4xl font-black mb-5 leading-tight">描述需求，AI 自动<br />匹配最优工厂</h2>
              <p className="text-base mb-8 leading-relaxed" style={{ color: T.textMuted }}>
                输入您的产品需求、预算和交期，AI 在 500+ 认证工厂中实时筛选，自动安排视频验厂，全程 AI 翻译与摘要。
              </p>
              <div className="space-y-3">
                {["500+ 认证工厂实时匹配","AI 自动生成询盘与报价对比","一键预约视频验厂","全程 AI 翻译，无语言障碍"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: T.accentGlow }}>
                      <Check className="w-3 h-3" style={{ color: T.accent }} />
                    </div>
                    <span className="text-sm" style={{ color: T.textMuted }}>{item}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.15}><AIDemo /></FadeIn>
          </div>
        </div>
      </section>

      <section className="py-24" style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <FadeIn>
              <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: T.accent }}>精选工厂</div>
              <h2 className="text-4xl font-black leading-tight">500+ 认证工厂<br />等待您的询盘</h2>
            </FadeIn>
            <div className="hidden md:flex gap-2">
              {(["left","right"] as const).map(dir => (
                <button key={dir} onClick={() => scrollFactories(dir)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{ border: `1px solid ${T.border}`, color: T.textMuted }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.text; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}>
                  {dir === "left" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
          <div ref={factoryScrollRef} className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: "none" }}>
            {FACTORIES.map((f, i) => (
              <FadeIn key={i} delay={i * 0.08}><FactoryCard factory={f} /></FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: T.accent }}>工作流程</div>
            <h2 className="text-4xl font-black">三步完成采购</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: Zap, title: "发现认证工厂", desc: "AI 根据您的品类需求，从 500+ 认证工厂中精准匹配最优候选。" },
              { step: "02", icon: Video, title: "视频实时谈判", desc: "发起视频会议，AI 实时翻译，自动录制，所有细节都有存档。" },
              { step: "03", icon: TrendingUp, title: "锁定样品下单", desc: "在平台内完成样品申请，追踪物流，一键转正式订单。" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <div className="text-xs font-bold mb-5" style={{ color: T.textSubtle }}>{item.step}</div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: T.accentGlow }}>
                  <item.icon className="w-5 h-5" style={{ color: T.accent }} />
                </div>
                <h3 className="text-lg font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: T.textMuted }}>{item.desc}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-4xl mx-auto px-6">
          <FadeIn className="text-center mb-12">
            <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: T.accent }}>\u7adp品对比</div>
            <h2 className="text-4xl font-black">为什么选择 RealSourcing</h2>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              <div className="grid grid-cols-4 px-6 py-4" style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                <div className="text-sm font-medium" style={{ color: T.textMuted }}>功能</div>
                {["RealSourcing","阿里巴巴","传统模式"].map(h => (
                  <div key={h} className="text-sm font-semibold text-center text-white">{h}</div>
                ))}
              </div>
              {COMPARISON.map((row, i) => (
                <div key={i} className="grid grid-cols-4 px-6 py-3.5 items-center"
                  style={{ borderBottom: i < COMPARISON.length - 1 ? `1px solid ${T.border}` : "none",
                    background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                  <div className="text-sm" style={{ color: T.textMuted }}>{row.feature}</div>
                  {[row.rs, row.alibaba, row.traditional].map((val, j) => (
                    <div key={j} className="flex justify-center">
                      {val === true ? <Check className="w-4 h-4" style={{ color: T.green }} />
                        : val === "partial" ? <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(251,191,36,0.1)", color: T.amber }}>部分</span>
                        : <X className="w-4 h-4" style={{ color: "rgba(255,255,255,0.2)" }} />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-24" style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-12">
            <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: T.accent }}>用户评价</div>
            <h2 className="text-4xl font-black">全球买家的真实反馈</h2>
          </FadeIn>
          <div className="relative max-w-2xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={testimonialIdx}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl p-8 text-center"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex justify-center gap-0.5 mb-6">
                  {Array(TESTIMONIALS[testimonialIdx].rating).fill(0).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-base leading-relaxed mb-6" style={{ color: T.textMuted }}>
                  "{TESTIMONIALS[testimonialIdx].quote}"
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: T.bg }}>
                    {TESTIMONIALS[testimonialIdx].flag}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">{TESTIMONIALS[testimonialIdx].name}</div>
                    <div className="text-xs" style={{ color: T.textMuted }}>{TESTIMONIALS[testimonialIdx].role} · {TESTIMONIALS[testimonialIdx].company}</div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIdx(i)}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ background: i === testimonialIdx ? T.text : T.textSubtle,
                    transform: i === testimonialIdx ? "scale(1.3)" : "scale(1)" }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-24" style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <FadeIn className="text-center mb-14">
            <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: T.accent }}>定价</div>
            <h2 className="text-4xl font-black mb-4">简单透明的定价</h2>
            <p className="text-base" style={{ color: T.textMuted }}>无隐藏费用，按需升级</p>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "免费版", price: "$0", period: "/月", desc: "适合个人买家探索平台",
                features: ["5 次视频会议/月","基础工厂搜索","AI 翻译（有限次数）","社区支持"], cta: "免费开始", highlight: false },
              { name: "专业版", price: "$99", period: "/月", desc: "适合活跃采购团队",
                features: ["无限视频会议","AI 摘要 & 录制","Meeting Reel 生成","优先工厂匹配","专属客户成功经理"], cta: "免费开始", highlight: true, badge: "最受欢迎" },
              { name: "企业版", price: "定制", period: "", desc: "适合大型采购组织",
                features: ["多账号团队协作","私有化部署选项","API 集成","专属谈判顾问","SLA 保障"], cta: "联系销售团队", highlight: false },
            ].map((plan, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="rounded-2xl p-7 h-full flex flex-col relative"
                  style={{ background: plan.highlight ? T.accentGlow : T.surface,
                    border: `1px solid ${plan.highlight ? T.accent : T.border}` }}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: T.accent, color: "#fff" }}>{plan.badge}</span>
                    </div>
                  )}
                  <div className="mb-6">
                    <div className="text-sm font-semibold text-white mb-1">{plan.name}</div>
                    <div className="text-3xl font-black text-white mb-1">{plan.price}
                      <span className="text-base font-normal" style={{ color: T.textMuted }}>{plan.period}</span></div>
                    <div className="text-sm" style={{ color: T.textMuted }}>{plan.desc}</div>
                  </div>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: plan.highlight ? T.accent : T.green }} />
                        <span style={{ color: T.textMuted }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.cta === "联系销售团队" ? "/contact" : "/register"}>
                    <motion.button whileHover={{ opacity: 0.9 }} whileTap={{ scale: 0.98 }}
                      className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
                      style={plan.highlight
                        ? { background: T.accent, color: "#fff" }
                        : { background: "transparent", color: T.textMuted, border: `1px solid ${T.border}` }}>
                      {plan.cta}
                    </motion.button>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-3xl mx-auto px-6">
          <FadeIn className="text-center mb-12">
            <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: T.accent }}>常见问题</div>
            <h2 className="text-4xl font-black">有疑问？我们来解答</h2>
          </FadeIn>
          <div className="space-y-2">
            {[
              { q: "RealSourcing 与阿里巴巴有什么区别？", a: "阿里巴巴是一个目录式平台，买卖双方通过文字沟通。RealSourcing 提供实时视频谈判、AI 翻译和自动录制，让您像在工厂现场一样与供应商沟通。" },
              { q: "如何确保工厂的真实性？", a: "所有工厂须通过三重认证：营业执照核验、生产资质审查、实地视频验证。我们的 AI 系统还会持续监控工厂的响应率和交付记录。" },
              { q: "视频会议支持哪些语言翻译？", a: "目前支持中文、英语、阿拉伯语、法语、德语、日语、西班牙语等 12 种语言的实时 AI 翻译，延迟低于 2 秒。" },
              { q: "样品费用如何结算？", a: "样品费用由工厂直接报价，通过平台担保支付。正式下单后，部分工厂会退还样品费用。" },
              { q: "工厂注册需要费用吗？", a: "工厂基础注册完全免费。我们提供付费的认证工厂套餐，帮助工厂获得更多曝光和优先匹配机会。" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                  <button className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors"
                    style={{ background: faqOpen === i ? T.surface : "transparent" }}
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                    <span className="text-sm font-medium text-white">{item.q}</span>
                    <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 flex-shrink-0 ml-4" style={{ color: T.textMuted }} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {faqOpen === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                        <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: T.textMuted }}>{item.a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeIn>
            <div className="rounded-2xl p-14" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <h2 className="text-4xl font-black mb-4">准备好开始了吗？</h2>
              <p className="text-base mb-8" style={{ color: T.textMuted }}>加入 2,000+ 全球采购商，在 48 小时内找到您的理想工厂</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm"
                    style={{ background: T.text, color: T.bg }}>
                    免费开始 <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <Link href="/factories">
                  <motion.button whileHover={{ borderColor: T.borderHover }}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-medium text-sm"
                    style={{ border: `1px solid ${T.border}`, color: T.textMuted }}>
                    浏览工厂库
                  </motion.button>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <footer className="py-12" style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black text-white"
                style={{ background: T.accent }}>RS</div>
              <span className="text-sm font-semibold text-white">RealSourcing</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {[["Webinar","/webinars"],["工厂库","/factories"],["AI 采购助理","/ai-assistant"],["关于我们","/about"],["联系我们","/contact"],["隐私政策","/privacy"]].map(([label, href]) => (
                <Link key={label} href={href as string}>
                  <span className="text-xs cursor-pointer transition-colors" style={{ color: T.textSubtle }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.textMuted)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.textSubtle)}>{label}</span>
                </Link>
              ))}
            </div>
            <div className="text-xs" style={{ color: T.textSubtle }}>© 2026 RealSourcing</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
