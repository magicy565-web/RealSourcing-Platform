import { useEffect, useRef, useState } from "react";
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
        <div className="w-px h-4 bg-white/10" />
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 text-sm text-white/50 min-w-0"
          >
            <span className="text-base">{a.flag}</span>
            <span className="text-white/80 font-medium">{a.name}</span>
            <span>来自 {a.city}</span>
            <span className="text-white/20">·</span>
            <span>{a.action}:</span>
            <span className="text-violet-400 font-medium truncate">{a.item}</span>
            <span className="ml-auto text-white/25 text-xs shrink-0">{a.time} ago</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Webinar Mock UI ──────────────────────────────────────────────────────────
const TRANSLATIONS = [
  { zh: "请展示模组的生产线", en: "Please show the production line for the module" },
  { zh: "我们每天可以生产 5000 件", en: "We can produce 5,000 units per day" },
  { zh: "最小起订量是多少？", en: "What is the minimum order quantity?" },
  { zh: "MOQ 是 500 件，样品 3-5 天", en: "MOQ is 500 units, samples in 3-5 days" },
];

function WebinarMock() {
  const [tIdx, setTIdx] = useState(0);
  const [mic, setMic] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setTIdx(i => (i + 1) % TRANSLATIONS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative w-full max-w-[520px] rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0c0c10] shadow-[0_40px_100px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]">
      {/* Glow behind the card */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-violet-500/10 to-transparent pointer-events-none" />

      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          {["#ff5f57","#febc2e","#28c840"].map((c,i) => (
            <div key={i} style={{background:c}} className="w-3 h-3 rounded-full" />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
          <span className="text-xs font-semibold text-white/80">LIVE · Webinar Room #2847</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/40 text-xs">
          <Users size={11} />
          <span>47</span>
        </div>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-2 gap-0.5 p-0.5">
        {/* Factory */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-blue-950 to-slate-900 flex items-end p-2">
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">🏭</div>
          <div className="relative z-10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-white/60 bg-black/50 px-1.5 py-0.5 rounded">Guangzhou LED Factory</span>
          </div>
        </div>
        {/* Buyer */}
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-violet-950 to-indigo-900 flex items-end p-2">
          <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">👤</div>
          <div className="relative z-10 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-white/60 bg-black/50 px-1.5 py-0.5 rounded">🇦🇪 Ahmed · Dubai Retail</span>
          </div>
        </div>
      </div>

      {/* AI Translation */}
      <div className="mx-2 mt-2 rounded-xl border border-violet-500/20 bg-violet-500/[0.06] p-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={12} className="text-violet-400" />
          <span className="text-[10px] font-bold text-violet-400 tracking-widest">AI REAL-TIME TRANSLATION</span>
          <div className="ml-auto flex gap-1">
            {[0,1,2].map(i => (
              <motion.span key={i} className="w-1 h-1 rounded-full bg-violet-400"
                animate={{opacity:[0.3,1,0.3]}}
                transition={{duration:1.2,delay:i*0.2,repeat:Infinity}}
              />
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tIdx}
            initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} exit={{opacity:0,x:6}}
            transition={{duration:0.2}}
          >
            <p className="text-xs text-white/40 mb-1">🇨🇳 {TRANSLATIONS[tIdx].zh}</p>
            <p className="text-sm text-white/85 font-medium">🇬🇧 {TRANSLATIONS[tIdx].en}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 px-4 py-3">
        {[
          { icon: <Mic size={13}/>, active: mic, onClick: ()=>setMic(v=>!v) },
          { icon: <Video size={13}/>, active: true, onClick: ()=>{} },
          { icon: <MessageSquare size={13}/>, active: true, onClick: ()=>{} },
        ].map((b,i) => (
          <button key={i} onClick={b.onClick}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              b.active
                ? "bg-white/[0.08] border border-white/[0.1] text-white/70 hover:bg-white/[0.12]"
                : "bg-red-500/20 border border-red-500/30 text-red-400"
            }`}
          >{b.icon}</button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 bg-violet-500/15 border border-violet-500/25 rounded-full px-3 py-1">
          <Bot size={11} className="text-violet-400" />
          <span className="text-[11px] font-semibold text-violet-400">AI Summary Ready</span>
        </div>
      </div>
    </div>
  );
}

// ─── AI Chat Demo ─────────────────────────────────────────────────────────────
const CHAT = [
  { role: "user", text: "我需要采购 LED 灯具，月需求 5000 件，预算 $8/件，需要 CE 认证" },
  { role: "ai", text: "已收到您的需求，正在从 500+ 认证工厂中为您匹配..." },
  { role: "ai", text: "✅ 为您找到 3 家高度匹配的工厂：\n\n**1. 广州明亮照明** — 4.9⭐ · CE+RoHS · $6.8/件\n**2. 深圳光华电子** — 4.8⭐ · CE+UL · $7.2/件\n**3. 东莞星辉科技** — 4.7⭐ · CE · $7.5/件" },
  { role: "user", text: "帮我预约广州明亮照明的视频会议" },
  { role: "ai", text: "✅ 已创建 Webinar 直播间 #2847\n📅 明天 10:00 AM (GMT+8)\n🔗 邀请链接已发至您的邮箱\n\n会议将自动录制，AI 实时翻译已开启。" },
];

function AIDemoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [count, setCount] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const next = () => {
      if (i >= CHAT.length) return;
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setCount(c => c + 1);
        i++;
        if (i < CHAT.length) setTimeout(next, 700);
      }, CHAT[i].role === "ai" ? 1100 : 350);
    };
    setTimeout(next, 500);
  }, [inView]);

  return (
    <section ref={ref} className="py-32 px-6">
      <div className="mx-auto max-w-6xl grid grid-cols-2 gap-20 items-center">
        {/* Left */}
        <FadeUp>
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-6">
            <Bot size={13} className="text-violet-400" />
            <span className="text-xs font-bold text-violet-400 tracking-widest uppercase">AI Sourcing Assistant</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-5">
            描述需求，<br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
              AI 完成剩下的一切
            </span>
          </h2>
          <p className="text-lg text-white/50 leading-relaxed mb-8">
            输入采购需求，AI 自动从 500+ 认证工厂中精准匹配，
            生成询盘，预约视频会议，全程中英双语。
          </p>
          <div className="flex flex-col gap-3">
            {[
              "自然语言描述需求，无需填写复杂表单",
              "AI 实时分析工厂评分、价格、认证资质",
              "一键预约视频会议，自动发送邀请",
              "会议结束后自动生成 AI 摘要与行动清单",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 size={17} className="text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-sm text-white/55">{item}</span>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* Right: chat */}
        <FadeUp delay={0.12}>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                <Bot size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">RealSourcing AI</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  在线 · 平均响应 &lt;2s
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="p-4 flex flex-col gap-3 min-h-[300px]">
              <AnimatePresence>
                {CHAT.slice(0, count).map((msg, i) => (
                  <motion.div key={i}
                    initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    transition={{duration:0.25}}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-sm"
                        : "bg-white/[0.06] border border-white/[0.08] text-white/80 rounded-bl-sm"
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {typing && (
                <motion.div initial={{opacity:0}} animate={{opacity:1}}
                  className="flex gap-1.5 px-3.5 py-2.5 items-center"
                >
                  {[0,1,2].map(i => (
                    <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400"
                      animate={{y:[0,-4,0]}}
                      transition={{duration:0.55,delay:i*0.12,repeat:Infinity}}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] bg-white/[0.02]">
              <div className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/25">
                描述您的采购需求...
              </div>
              <button className="w-9 h-9 rounded-lg bg-violet-600 hover:bg-violet-500 flex items-center justify-center transition-colors">
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Factory Cards ────────────────────────────────────────────────────────────
const FACTORIES = [
  { name: "广州明亮照明科技", cat: "LED & Lighting", rating: 4.9, reviews: 312, moq: "500 units", lead: "15-20d", price: "$6.8–$12", tags: ["CE","RoHS","ISO 9001"], badge: "Top Supplier", badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/25", emoji: "💡" },
  { name: "深圳光华电子有限公司", cat: "Consumer Electronics", rating: 4.8, reviews: 287, moq: "1,000 units", lead: "20-25d", price: "$3.2–$8", tags: ["CE","UL","FCC"], badge: "Verified", badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", emoji: "📱" },
  { name: "东莞星辉纺织品公司", cat: "Apparel & Textiles", rating: 4.7, reviews: 198, moq: "200 units", lead: "10-15d", price: "$4.5–$15", tags: ["OEKO-TEX","ISO 9001"], badge: "Fast Response", badgeClass: "bg-violet-500/15 text-violet-400 border-violet-500/25", emoji: "👗" },
  { name: "佛山家居家具制造", cat: "Furniture & Home", rating: 4.8, reviews: 156, moq: "50 units", lead: "25-35d", price: "$45–$280", tags: ["FSC","ISO 14001"], badge: "New", badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/25", emoji: "🪑" },
  { name: "杭州美妆护肤OEM", cat: "Cosmetics & Skincare", rating: 4.9, reviews: 421, moq: "1,000 units", lead: "30-45d", price: "$1.2–$6", tags: ["GMP","FDA","ISO 22716"], badge: "Top Supplier", badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/25", emoji: "💄" },
];

function FactoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);
  const scroll = (d: "left"|"right") => scrollRef.current?.scrollBy({left:d==="left"?-300:300,behavior:"smooth"});
  const onScroll = () => {
    if (!scrollRef.current) return;
    const {scrollLeft,scrollWidth,clientWidth} = scrollRef.current;
    setCanL(scrollLeft > 0);
    setCanR(scrollLeft < scrollWidth - clientWidth - 4);
  };

  return (
    <section className="py-32 border-y border-white/[0.06] bg-white/[0.015]">
      <div className="mx-auto max-w-6xl px-6">
        <FadeUp>
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-4">
                <Award size={13} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">Verified Factories</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                500+ 认证工厂<br />等待您的询盘
              </h2>
              <p className="text-white/45 mt-3 text-base">每家工厂均经过三重认证：营业执照 + 生产资质 + 实地视频验证</p>
            </div>
            <div className="flex gap-2">
              {(["left","right"] as const).map(d => (
                <button key={d} onClick={()=>scroll(d)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                    (d==="left"?canL:canR)
                      ? "border-white/15 text-white/60 hover:bg-white/[0.06] hover:text-white"
                      : "border-white/[0.05] text-white/20 cursor-default"
                  }`}
                >
                  {d==="left" ? <ChevronLeft size={18}/> : <ChevronRight size={18}/>}
                </button>
              ))}
            </div>
          </div>
        </FadeUp>

        <div ref={scrollRef} onScroll={onScroll}
          className="flex gap-4 overflow-x-auto pb-1"
          style={{scrollbarWidth:"none"}}
        >
          {FACTORIES.map((f, i) => (
            <motion.div key={i}
              whileHover={{y:-4,borderColor:"rgba(255,255,255,0.14)"}}
              transition={{duration:0.2}}
              className="min-w-[260px] max-w-[272px] shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center text-2xl">{f.emoji}</div>
                <span className={`text-[11px] font-bold border rounded-full px-2 py-0.5 ${f.badgeClass}`}>{f.badge}</span>
              </div>
              <p className="text-sm font-semibold text-white mb-0.5">{f.name}</p>
              <p className="text-xs text-white/40 mb-3">{f.cat}</p>
              <div className="flex items-center gap-1.5 mb-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={11} className={s <= Math.floor(f.rating) ? "fill-amber-400 text-amber-400" : "text-white/15"} />
                  ))}
                </div>
                <span className="text-xs font-semibold text-white">{f.rating}</span>
                <span className="text-xs text-white/35">({f.reviews})</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {f.tags.map(t => (
                  <span key={t} className="text-[10px] font-semibold text-white/40 bg-white/[0.05] border border-white/[0.07] rounded px-1.5 py-0.5">{t}</span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[["MOQ",f.moq],["Lead",f.lead],["Price",f.price]].map(([l,v],j) => (
                  <div key={j}>
                    <p className="text-white/25 mb-0.5">{l}</p>
                    <p className={`font-semibold ${j===2?"text-emerald-400":"text-white/70"}`}>{v}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Global Map ───────────────────────────────────────────────────────────────
const BUYERS = [
  {x:22,y:28,flag:"🇺🇸"},{x:48,y:26,flag:"🇬🇧"},{x:50,y:24,flag:"🇩🇪"},
  {x:57,y:35,flag:"🇦🇪"},{x:48,y:28,flag:"🇫🇷"},{x:85,y:65,flag:"🇦🇺"},
];
const HUB = {x:71,y:40};

function GlobalMap() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [lines, setLines] = useState<number[]>([]);
  useEffect(() => {
    if (!inView) return;
    BUYERS.forEach((_,i) => setTimeout(()=>setLines(p=>[...p,i]), i*280));
  }, [inView]);

  return (
    <section ref={ref} className="py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <FadeUp className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-5">
            <Globe size={13} className="text-violet-400" />
            <span className="text-xs font-bold text-violet-400 tracking-widest uppercase">Global Network</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">连接全球买家与中国工厂</h2>
          <p className="text-white/45 mt-3 text-base">实时撮合来自 60+ 国家的采购商与中国制造商</p>
        </FadeUp>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
          <svg viewBox="0 0 100 60" className="w-full block" preserveAspectRatio="xMidYMid meet">
            <rect width="100" height="60" fill="#0a0a0f"/>
            {[10,20,30,40,50,60,70,80,90].map(x=>(
              <line key={x} x1={x} y1="0" x2={x} y2="60" stroke="rgba(255,255,255,0.025)" strokeWidth="0.25"/>
            ))}
            {[10,20,30,40,50].map(y=>(
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.025)" strokeWidth="0.25"/>
            ))}
            {/* Hub glow */}
            <circle cx={HUB.x} cy={HUB.y} r="4" fill="rgba(139,92,246,0.08)"/>
            <circle cx={HUB.x} cy={HUB.y} r="2" fill="rgba(139,92,246,0.2)"/>
            <circle cx={HUB.x} cy={HUB.y} r="1.2" fill="#a78bfa"/>
            {BUYERS.map((b,i) => (
              <g key={i}>
                <motion.line x1={b.x} y1={b.y} x2={HUB.x} y2={HUB.y}
                  stroke="#8b5cf6" strokeWidth="0.35" strokeDasharray="1 0.8"
                  initial={{opacity:0,pathLength:0}}
                  animate={lines.includes(i)?{opacity:0.45,pathLength:1}:{}}
                  transition={{duration:1.1,ease:"easeOut"}}
                />
                <motion.circle cx={b.x} cy={b.y} r="0.9" fill="#c4b5fd"
                  initial={{scale:0}} animate={lines.includes(i)?{scale:1}:{}}
                  transition={{duration:0.3}}
                />
              </g>
            ))}
          </svg>
          <div className="flex justify-center gap-8 py-4 border-t border-white/[0.06]">
            {[
              {dot:"bg-violet-400",label:"认证工厂 (500+)"},
              {dot:"bg-purple-300",label:"活跃买家 (60+ 国家)"},
            ].map((item,i) => (
              <div key={i} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${item.dot}`}/>
                <span className="text-xs text-white/40">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Compare Table ────────────────────────────────────────────────────────────
const ROWS = [
  {f:"视频实时谈判",rs:true,ali:false,trad:false},
  {f:"AI 实时翻译",rs:true,ali:false,trad:false},
  {f:"会议自动录制 + AI 摘要",rs:true,ali:false,trad:false},
  {f:"三重工厂认证",rs:true,ali:"部分",trad:false},
  {f:"AI 智能工厂匹配",rs:true,ali:false,trad:false},
  {f:"私密谈判室",rs:true,ali:false,trad:false},
  {f:"直接联系工厂",rs:true,ali:false,trad:true},
];

function CompareTable() {
  return (
    <section className="py-32 px-6 border-t border-white/[0.06] bg-white/[0.015]">
      <div className="mx-auto max-w-4xl">
        <FadeUp className="text-center mb-14">
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">为什么选择 RealSourcing？</h2>
          <p className="text-white/45 text-base">我们不是另一个 B2B 目录，我们是视频优先的采购平台</p>
        </FadeUp>
        <FadeUp delay={0.1}>
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden">
            <div className="grid grid-cols-4 bg-white/[0.03] border-b border-white/[0.08]">
              {["功能","RealSourcing","阿里巴巴","传统模式"].map((h,i) => (
                <div key={i} className={`px-5 py-3.5 text-sm font-semibold border-r last:border-r-0 border-white/[0.06] ${
                  i===0?"text-white/40":i===1?"text-center":"text-center text-white/30"
                }`}>
                  {i===1 ? (
                    <div className="inline-flex items-center gap-1.5 bg-violet-500/15 border border-violet-500/25 rounded-full px-2.5 py-0.5 text-violet-400">
                      <Sparkles size={11}/> {h}
                    </div>
                  ) : h}
                </div>
              ))}
            </div>
            {ROWS.map((row,i) => (
              <div key={i} className={`grid grid-cols-4 border-b last:border-b-0 border-white/[0.05] ${i%2===0?"":"bg-white/[0.015]"}`}>
                <div className="px-5 py-3.5 text-sm text-white/50 border-r border-white/[0.06]">{row.f}</div>
                {[row.rs,row.ali,row.trad].map((v,j) => (
                  <div key={j} className={`px-5 py-3.5 flex justify-center items-center border-r last:border-r-0 border-white/[0.06] ${j===0?"bg-violet-500/[0.04]":""}`}>
                    {v===true && <Check size={15} className="text-emerald-400"/>}
                    {v===false && <X size={15} className="text-white/20"/>}
                    {typeof v==="string" && <span className="text-xs text-amber-400">{v}</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { quote: "RealSourcing 彻底改变了我们的采购方式。Webinar 直播间让我在 30 分钟内就锁定了 3 家优质工厂，AI 翻译非常流畅，感觉就像在和中国工厂面对面谈判。", name: "Ahmed Al-Maktoum", role: "采购总监 · Dubai Retail Group", flag: "🇦🇪", av: "A", avColor: "from-amber-500 to-orange-600" },
  { quote: "以前找工厂要花 2-3 个月，现在用 RealSourcing 一周就完成了样品确认。工厂认证体系让我非常放心，再也不用担心被骗了。", name: "Sarah Jenkins", role: "品牌创始人 · London Beauty Co.", flag: "🇬🇧", av: "S", avColor: "from-pink-500 to-rose-600" },
  { quote: "Webinar 直播间的 FOMO 机制太厉害了，我们在直播中直接锁定了 30 件样品，比传统询盘快了 10 倍。AI 摘要功能让我们的团队协作效率大幅提升。", name: "Priya Sharma", role: "电商运营总监 · Mumbai Brands", flag: "🇮🇳", av: "P", avColor: "from-violet-500 to-purple-700" },
  { quote: "作为不懂中文的欧洲买家，以前和中国工厂沟通是噩梦。RealSourcing 的 AI 实时翻译让语言障碍完全消失，我现在每周都在平台上谈生意。", name: "Klaus Weber", role: "采购经理 · Munich Industrial GmbH", flag: "🇩🇪", av: "K", avColor: "from-cyan-500 to-blue-600" },
];

function Testimonials() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1)%TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);
  const t = TESTIMONIALS[idx];
  return (
    <section className="py-32 px-6">
      <div className="mx-auto max-w-3xl text-center">
        <FadeUp>
          <p className="text-xs font-bold text-white/25 tracking-widest uppercase mb-14">全球买家的真实评价</p>
          <AnimatePresence mode="wait">
            <motion.div key={idx}
              initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}}
              transition={{duration:0.4}}
            >
              <div className="flex justify-center gap-1 mb-6">
                {[1,2,3,4,5].map(s => <Star key={s} size={18} className="fill-amber-400 text-amber-400"/>)}
              </div>
              <blockquote className="text-xl lg:text-2xl text-white/80 leading-relaxed italic mb-8 tracking-tight">
                "{t.quote}"
              </blockquote>
              <div className="flex items-center justify-center gap-3">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.avColor} flex items-center justify-center text-white font-bold text-base`}>
                  {t.av}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{t.flag} {t.name}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-2 mt-10">
            {TESTIMONIALS.map((_,i) => (
              <button key={i} onClick={()=>setIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i===idx?"w-6 bg-violet-500":"w-2 bg-white/20"}`}
              />
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PLANS = [
  { name:"免费版", price:"$0", period:"/月", desc:"适合初次探索的采购商", features:["5 次视频会议/月","基础工厂搜索","AI 翻译（有限次数）","社区支持"], cta:"免费开始", highlight:false },
  { name:"专业版", price:"$99", period:"/月", desc:"适合活跃采购商和中小品牌", features:["无限视频会议","AI 摘要 & 录制","Meeting Reel 生成","优先工厂匹配","专属客户成功经理"], cta:"立即升级", highlight:true },
  { name:"企业版", price:"定制", period:"", desc:"适合大型品牌和采购团队", features:["多账号团队协作","私有化部署选项","API 集成","专属谈判顾问","SLA 保障"], cta:"联系销售团队", highlight:false },
];

function Pricing() {
  return (
    <section id="pricing" className="py-32 px-6 border-t border-white/[0.06] bg-white/[0.015]">
      <div className="mx-auto max-w-5xl">
        <FadeUp className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">简单透明的定价</h2>
          <p className="text-white/45 text-base">从免费版开始，随业务增长升级</p>
        </FadeUp>
        <div className="grid grid-cols-3 gap-6">
          {PLANS.map((p,i) => (
            <FadeUp key={i} delay={i*0.08}>
              <div className={`relative rounded-2xl border p-7 h-full flex flex-col ${
                p.highlight
                  ? "border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-transparent"
                  : "border-white/[0.08] bg-white/[0.02]"
              }`}>
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[11px] font-bold tracking-wider px-3 py-1 rounded-full">
                    最受欢迎
                  </div>
                )}
                <p className="text-base font-semibold text-white mb-1">{p.name}</p>
                <p className="text-sm text-white/40 mb-5">{p.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-bold text-white tracking-tight">{p.price}</span>
                  <span className="text-sm text-white/40">{p.period}</span>
                </div>
                <div className="flex flex-col gap-2.5 mb-7 flex-1">
                  {p.features.map((f,j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <Check size={14} className={p.highlight?"text-violet-400":"text-emerald-400"} />
                      <span className="text-sm text-white/50">{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register">
                  <button className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                    p.highlight
                      ? "bg-violet-600 hover:bg-violet-500 text-white"
                      : "border border-white/[0.1] text-white/50 hover:bg-white/[0.05] hover:text-white/70"
                  }`}>
                    {p.cta}
                  </button>
                </Link>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  { q:"RealSourcing 与阿里巴巴有什么区别？", a:"阿里巴巴是 B2B 目录，您只能发消息询价，无法实时视频沟通。RealSourcing 是视频优先的采购平台，支持实时视频谈判、AI 翻译、自动录制和 AI 摘要，让采购决策更快、更安全。" },
  { q:"如何确保工厂的真实性？", a:"每家工厂都经过三重认证：① 营业执照核验（工商局数据） ② 生产资质审核（行业认证文件） ③ 实地视频验证（我们的团队现场录制生产线）。未通过认证的工厂无法在平台上接单。" },
  { q:"视频会议支持哪些语言翻译？", a:"目前支持中英双向实时翻译，延迟低于 2 秒。阿拉伯语、德语、法语、印地语翻译正在开发中，预计 2025 Q2 上线。" },
  { q:"样品费用如何结算？", a:"样品费用由买家和工厂直接协商，平台不收取额外手续费。我们提供安全的第三方支付通道（Stripe/PayPal），样品确认后费用才会释放给工厂。" },
  { q:"工厂注册需要费用吗？", a:"工厂基础注册完全免费。通过认证后，工厂可以免费接受买家的视频会议邀请。平台仅在成功成交后收取小额服务费（2.5%），无成交不收费。" },
];

function FAQ() {
  const [open, setOpen] = useState<number|null>(null);
  return (
    <section className="py-32 px-6">
      <div className="mx-auto max-w-2xl">
        <FadeUp className="text-center mb-14">
          <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">常见问题</h2>
        </FadeUp>
        <div className="flex flex-col gap-1">
          {FAQS.map((faq,i) => (
            <FadeUp key={i} delay={i*0.04}>
              <div className={`rounded-xl overflow-hidden transition-all ${open===i?"border border-white/[0.1] bg-white/[0.03]":"border border-transparent"}`}>
                <button onClick={()=>setOpen(open===i?null:i)}
                  className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${open===i?"border-b border-white/[0.08]":""}`}
                >
                  <span className="text-sm font-medium text-white/80">{faq.q}</span>
                  <motion.div animate={{rotate:open===i?180:0}} transition={{duration:0.2}}>
                    <ChevronDown size={16} className="text-white/30 shrink-0 ml-4" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {open===i && (
                    <motion.div
                      initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}}
                      transition={{duration:0.22}}
                    >
                      <p className="px-5 py-4 text-sm text-white/45 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] font-sans antialiased">

      {/* ── Navbar ── */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "border-b border-white/[0.06] bg-[#09090b]/85 backdrop-blur-xl" : ""
        }`}
      >
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-[12px] font-black text-white">
                RS
              </div>
              <span className="text-sm font-bold text-white">RealSourcing</span>
            </div>
          </Link>
          <div className="flex gap-1 flex-1">
            {[{l:"Webinar",h:"/webinars"},{l:"工厂库",h:"/factories"},{l:"功能",h:"#features"},{l:"定价",h:"#pricing"}].map(item => (
              <Link key={item.l} href={item.h}>
                <button className="px-3 py-1.5 rounded-md text-sm text-white/45 hover:text-white/75 hover:bg-white/[0.05] transition-all">
                  {item.l}
                </button>
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <button className="px-3.5 py-1.5 text-sm text-white/45 hover:text-white/70 transition-colors">登录</button>
            </Link>
            <Link href="/register">
              <button className="px-4 py-1.5 rounded-lg bg-white text-[#09090b] text-sm font-semibold hover:bg-white/90 transition-colors">
                免费开始
              </button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center overflow-hidden">
        {/* Purple glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/[0.07] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-purple-700/[0.05] rounded-full blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-6xl w-full relative z-10">
          <div className="grid grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <motion.div
                initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.5}}
                className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-7"
              >
                <Sparkles size={12} className="text-violet-400" />
                <span className="text-xs font-bold text-violet-400 tracking-widest uppercase">PRD 3.1 · AI-Powered B2B Sourcing</span>
              </motion.div>

              <motion.h1
                initial={{opacity:0,y:28}} animate={{opacity:1,y:0}}
                transition={{duration:0.7,delay:0.1,ease:[0.16,1,0.3,1]}}
                className="text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-[-0.03em] mb-5"
              >
                告别中间商<br />
                <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                  直连真实工厂
                </span>
              </motion.h1>

              <motion.p
                initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                transition={{duration:0.6,delay:0.2}}
                className="text-lg text-white/50 leading-relaxed mb-8 max-w-[420px]"
              >
                AI 智能匹配 · 视频实时谈判 · 自动录制存档<br />
                让全球采购商在 <strong className="text-white/80">48 小时</strong>内找到并验证理想工厂
              </motion.p>

              <motion.div
                initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                transition={{duration:0.6,delay:0.3}}
                className="flex gap-3 mb-12"
              >
                <Link href="/register">
                  <button className="flex items-center gap-2 bg-white text-[#09090b] px-6 py-3 rounded-xl text-sm font-bold hover:bg-white/90 transition-colors">
                    免费开始采购 <ArrowRight size={15}/>
                  </button>
                </Link>
                <Link href="/webinars">
                  <button className="flex items-center gap-2 border border-white/[0.1] text-white/60 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-white/[0.05] hover:text-white/80 transition-all">
                    <Play size={14}/> 观看 Demo
                  </button>
                </Link>
              </motion.div>

              <motion.div
                initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.6,delay:0.5}}
                className="flex gap-10"
              >
                {[{v:500,s:"+",l:"认证工厂"},{v:2000,s:"+",l:"全球采购商"},{v:98,s:"%",l:"满意度"}].map((stat,i) => (
                  <div key={i}>
                    <p className="text-3xl font-black text-white tracking-tight">
                      <Counter to={stat.v} suffix={stat.s}/>
                    </p>
                    <p className="text-xs text-white/35 mt-1">{stat.l}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Webinar Mock */}
            <motion.div
              initial={{opacity:0,x:40,scale:0.97}} animate={{opacity:1,x:0,scale:1}}
              transition={{duration:0.9,delay:0.15,ease:[0.16,1,0.3,1]}}
              className="flex justify-center"
            >
              <WebinarMock />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Live Ticker ── */}
      <LiveTicker />

      {/* ── Brand Trust ── */}
      <section className="py-12 px-6 border-b border-white/[0.05]">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-[11px] font-bold text-white/20 tracking-widest uppercase mb-6">全球品牌采购商信任 REALSOURCING</p>
          <div className="flex justify-center flex-wrap gap-10">
            {["Walmart","Target","ASOS","Zalando","Noon","Carrefour","Lulu"].map(b => (
              <span key={b} className="text-sm font-bold text-white/20 tracking-wide">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Demo ── */}
      <AIDemoSection />

      {/* ── Factory Carousel ── */}
      <FactoryCarousel />

      {/* ── Global Map ── */}
      <GlobalMap />

      {/* ── Features Grid ── */}
      <section id="features" className="py-32 px-6 border-t border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto max-w-6xl">
          <FadeUp className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">为现代采购而生的每一个功能</h2>
            <p className="text-white/45 text-base">从发现工厂到完成交易，全程在平台内完成</p>
          </FadeUp>
          <div className="grid grid-cols-3 gap-4">
            {[
              {icon:<Video size={20}/>,title:"TikTok 风格 Webinar 直播间",desc:"沉浸式选品直播，FOMO 引擎实时触发，转化率高达 61.7%。",color:"text-amber-400",bg:"bg-amber-500/10",stats:[{v:"24 min",l:"平均在线"},{v:"61.7%",l:"意向转化"}]},
              {icon:<Sparkles size={20}/>,title:"AI 实时翻译",desc:"中英双向实时字幕，延迟低于 2 秒，消除语言壁垒。",color:"text-violet-400",bg:"bg-violet-500/10"},
              {icon:<Shield size={20}/>,title:"三重工厂认证",desc:"营业执照 + 生产资质 + 实地视频验证，确保每家工厂真实可信。",color:"text-emerald-400",bg:"bg-emerald-500/10"},
              {icon:<Video size={20}/>,title:"视频实时谈判",desc:"高清视频会议 + 自动录制 + AI 摘要，每一次沟通都有据可查。",color:"text-cyan-400",bg:"bg-cyan-500/10"},
              {icon:<Bot size={20}/>,title:"AI 采购助理",desc:"智能匹配工厂，自动生成询盘，分析报价差异。",color:"text-purple-400",bg:"bg-purple-500/10",badge:"NEW"},
              {icon:<Globe size={20}/>,title:"500+ 认证工厂库",desc:"覆盖美妆、3C、家居、服装等主流品类，支持多维度筛选。",color:"text-emerald-400",bg:"bg-emerald-500/10"},
            ].map((f,i) => (
              <FadeUp key={i} delay={i*0.06}>
                <motion.div whileHover={{y:-3}} transition={{duration:0.2}}
                  className="rounded-xl border border-white/[0.07] bg-[#09090b] p-6 h-full"
                >
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center ${f.color} mb-4`}>
                    {f.icon}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    {f.badge && (
                      <span className="text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/25 rounded px-1.5 py-0.5">{f.badge}</span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed mb-3">{f.desc}</p>
                  {f.stats && (
                    <div className="flex gap-5">
                      {f.stats.map((s,j) => (
                        <div key={j}>
                          <p className={`text-lg font-bold ${f.color}`}>{s.v}</p>
                          <p className="text-[11px] text-white/25">{s.l}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compare ── */}
      <CompareTable />

      {/* ── 3-Step ── */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <FadeUp className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">三步完成采购</h2>
          </FadeUp>
          <div className="grid grid-cols-3 gap-12">
            {[
              {n:"01",icon:<Package size={22}/>,title:"发现认证工厂",desc:"AI 根据您的品类需求，从 500+ 认证工厂中精准匹配最优候选。",color:"text-violet-400",bg:"bg-violet-500/10",border:"border-violet-500/20"},
              {n:"02",icon:<Video size={22}/>,title:"视频实时谈判",desc:"发起视频会议，AI 实时翻译，自动录制，所有细节都有存档。",color:"text-emerald-400",bg:"bg-emerald-500/10",border:"border-emerald-500/20"},
              {n:"03",icon:<FileText size={22}/>,title:"锁定样品下单",desc:"在平台内完成样品申请，追踪物流，一键转正式订单。",color:"text-amber-400",bg:"bg-amber-500/10",border:"border-amber-500/20"},
            ].map((s,i) => (
              <FadeUp key={i} delay={i*0.1} className="text-center">
                <p className={`text-6xl font-black ${s.color} opacity-15 leading-none mb-4 tracking-tighter`}>{s.n}</p>
                <div className={`w-14 h-14 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center ${s.color} mx-auto mb-5`}>
                  {s.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <Testimonials />

      {/* ── Pricing ── */}
      <Pricing />

      {/* ── FAQ ── */}
      <FAQ />

      {/* ── Final CTA ── */}
      <section className="py-32 px-6 border-t border-white/[0.06] bg-white/[0.015] text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-600/[0.05] to-transparent pointer-events-none" />
        <FadeUp className="relative z-10">
          <h2 className="text-5xl lg:text-6xl font-black text-white tracking-[-0.03em] mb-5">
            准备好开始了吗？
          </h2>
          <p className="text-lg text-white/45 mb-10">加入 2,000+ 全球采购商，今天就找到您的理想工厂</p>
          <div className="flex gap-3 justify-center">
            <Link href="/register">
              <button className="flex items-center gap-2 bg-white text-[#09090b] px-8 py-3.5 rounded-xl text-base font-bold hover:bg-white/90 transition-colors">
                免费开始 <ArrowRight size={17}/>
              </button>
            </Link>
            <Link href="/factories">
              <button className="flex items-center gap-2 border border-white/[0.1] text-white/50 px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-white/[0.05] hover:text-white/70 transition-all">
                浏览工厂库
              </button>
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-white/[0.05]">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-[10px] font-black text-white">RS</div>
            <span className="text-sm font-semibold text-white/30">RealSourcing</span>
          </div>
          <div className="flex gap-6">
            {[{l:"Webinar",h:"/webinars"},{l:"工厂库",h:"/factories"},{l:"AI 助理",h:"/dashboard"},{l:"关于",h:"#"},{l:"联系",h:"#"}].map(item => (
              <Link key={item.l} href={item.h}>
                <span className="text-xs text-white/20 hover:text-white/40 transition-colors cursor-pointer">{item.l}</span>
              </Link>
            ))}
          </div>
          <span className="text-xs text-white/20">© 2025 RealSourcing</span>
        </div>
      </footer>
    </div>
  );
}
