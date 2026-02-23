import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "wouter";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
  useMotionValue,
  useSpring,
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
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  Users,
  Globe,
  Shield,
  Zap,
  TrendingUp,
  Award,
  Clock,
  BarChart3,
  Sparkles,
  Bot,
  Send,
  Package,
  FileText,
  CheckCircle2,
} from "lucide-react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#09090b",          // zinc-950
  surface: "#18181b",     // zinc-900
  surfaceHover: "#27272a",// zinc-800
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  text: "#fafafa",        // zinc-50
  textMuted: "#a1a1aa",   // zinc-400
  textSubtle: "#52525b",  // zinc-600
  accent: "#6366f1",      // indigo-500
  accentHover: "#818cf8", // indigo-400
  accentDim: "rgba(99,102,241,0.12)",
  green: "#22c55e",
  greenDim: "rgba(34,197,94,0.12)",
  amber: "#f59e0b",
  red: "#ef4444",
};

// ─── Fade-in wrapper ─────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
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
    let start = 0;
    const step = Math.ceil(to / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer); }
      else setVal(start);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);
  return (
    <span ref={ref}>
      {val.toLocaleString()}{suffix}
    </span>
  );
}

// ─── Live Activity Ticker ─────────────────────────────────────────────────────
const ACTIVITIES = [
  { flag: "🇦🇪", name: "Ahmed Al-Maktoum", city: "Dubai", action: "booked a factory tour", item: "LED Lighting Factory · Guangzhou", time: "2m ago" },
  { flag: "🇬🇧", name: "Sarah Jenkins", city: "London", action: "confirmed sample order", item: "Skincare OEM · Shenzhen", time: "5m ago" },
  { flag: "🇺🇸", name: "Michael Chen", city: "New York", action: "started a video negotiation", item: "Electronics Factory · Dongguan", time: "8m ago" },
  { flag: "🇩🇪", name: "Klaus Weber", city: "Munich", action: "received AI meeting summary", item: "Auto Parts Supplier · Tianjin", time: "11m ago" },
  { flag: "🇮🇳", name: "Priya Sharma", city: "Mumbai", action: "matched with 3 factories", item: "Textile Manufacturer · Hangzhou", time: "14m ago" },
  { flag: "🇫🇷", name: "Marie Dubois", city: "Paris", action: "signed NDA with factory", item: "Cosmetics OEM · Shanghai", time: "17m ago" },
  { flag: "🇸🇦", name: "Khalid Al-Rashid", city: "Riyadh", action: "placed first order", item: "Furniture Factory · Foshan", time: "20m ago" },
  { flag: "🇦🇺", name: "James Wilson", city: "Sydney", action: "completed factory verification", item: "Sporting Goods · Xiamen", time: "23m ago" },
];

function LiveTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % ACTIVITIES.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        padding: "12px 0",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", gap: 16 }}>
        {/* Live badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", background: C.green,
            boxShadow: `0 0 8px ${C.green}`,
            animation: "pulse 2s infinite",
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.green, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            LIVE
          </span>
        </div>
        <div style={{ width: 1, height: 16, background: C.border }} />
        {/* Animated activity */}
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textMuted, flex: 1 }}
          >
            <span style={{ fontSize: 16 }}>{ACTIVITIES[idx].flag}</span>
            <span style={{ color: C.text, fontWeight: 500 }}>{ACTIVITIES[idx].name}</span>
            <span>from {ACTIVITIES[idx].city}</span>
            <span style={{ color: C.textSubtle }}>·</span>
            <span>{ACTIVITIES[idx].action}:</span>
            <span style={{ color: C.accentHover, fontWeight: 500 }}>{ACTIVITIES[idx].item}</span>
            <span style={{ marginLeft: "auto", color: C.textSubtle, fontSize: 12 }}>{ACTIVITIES[idx].time}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Webinar Mock UI (Hero Right Panel) ──────────────────────────────────────
const TRANSLATION_MSGS = [
  { zh: "请展示模组的生产线", en: "Please show the production line for the module" },
  { zh: "我们每天可以生产 5000 件", en: "We can produce 5,000 units per day" },
  { zh: "最小起订量是多少？", en: "What is the minimum order quantity?" },
  { zh: "MOQ 是 500 件，样品 3-5 天", en: "MOQ is 500 units, samples in 3-5 days" },
];

function WebinarMockUI() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [vidOn, setVidOn] = useState(true);
  const [participants] = useState(47);

  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % TRANSLATION_MSGS.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{
      background: "#0d0d0f",
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      overflow: "hidden",
      width: "100%",
      maxWidth: 520,
      boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
    }}>
      {/* Title bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px",
        background: "#111113",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", background: C.red,
            boxShadow: `0 0 6px ${C.red}`,
          }} />
          <span style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>LIVE · Webinar Room #2847</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.textMuted, fontSize: 12 }}>
          <Users size={12} />
          <span>{participants}</span>
        </div>
      </div>

      {/* Video grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, padding: 2 }}>
        {/* Factory video */}
        <div style={{
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          borderRadius: 8,
          padding: 12,
          aspectRatio: "16/9",
          position: "relative",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: 8,
            background: "linear-gradient(135deg, #0f3460 0%, #16213e 50%, #0d1117 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {/* Factory silhouette */}
            <div style={{ textAlign: "center", opacity: 0.6 }}>
              <div style={{ fontSize: 28 }}>🏭</div>
            </div>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{
              background: "rgba(0,0,0,0.7)", color: C.text, fontSize: 10,
              padding: "2px 6px", borderRadius: 4, fontWeight: 500,
            }}>
              Guangzhou LED Factory
            </span>
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
            <span style={{ fontSize: 10, color: C.textMuted }}>HD · 1080p</span>
          </div>
        </div>

        {/* Buyer video */}
        <div style={{
          background: "linear-gradient(135deg, #1a0a2e 0%, #2d1b69 100%)",
          borderRadius: 8,
          padding: 12,
          aspectRatio: "16/9",
          position: "relative",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: 8,
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ textAlign: "center", opacity: 0.6 }}>
              <div style={{ fontSize: 28 }}>👤</div>
            </div>
          </div>
          <div style={{ position: "relative", zIndex: 1 }}>
            <span style={{
              background: "rgba(0,0,0,0.7)", color: C.text, fontSize: 10,
              padding: "2px 6px", borderRadius: 4, fontWeight: 500,
            }}>
              🇦🇪 Ahmed · Dubai Retail
            </span>
          </div>
          <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green }} />
            <span style={{ fontSize: 10, color: C.textMuted }}>Connected</span>
          </div>
        </div>
      </div>

      {/* AI Translation panel */}
      <div style={{
        margin: "8px 8px 0",
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: "10px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Sparkles size={12} style={{ color: C.accent }} />
          <span style={{ fontSize: 11, color: C.accent, fontWeight: 600, letterSpacing: "0.06em" }}>
            AI REAL-TIME TRANSLATION
          </span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                style={{ width: 4, height: 4, borderRadius: "50%", background: C.accent }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={msgIdx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>
              🇨🇳 {TRANSLATION_MSGS[msgIdx].zh}
            </div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
              🇬🇧 {TRANSLATION_MSGS[msgIdx].en}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 8, padding: "10px 16px 12px",
      }}>
        {[
          { icon: micOn ? <Mic size={14} /> : <MicOff size={14} />, active: micOn, onClick: () => setMicOn(v => !v) },
          { icon: vidOn ? <Video size={14} /> : <VideoOff size={14} />, active: vidOn, onClick: () => setVidOn(v => !v) },
          { icon: <MessageSquare size={14} />, active: true, onClick: () => {} },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.onClick}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              background: btn.active ? C.surfaceHover : C.red + "33",
              border: `1px solid ${btn.active ? C.border : C.red + "66"}`,
              color: btn.active ? C.text : C.red,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {btn.icon}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {/* AI Summary badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: C.accentDim,
          border: `1px solid ${C.accent}44`,
          borderRadius: 20, padding: "4px 10px",
        }}>
          <Bot size={11} style={{ color: C.accent }} />
          <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>AI Summary Ready</span>
        </div>
      </div>
    </div>
  );
}

// ─── AI Demo Chat ─────────────────────────────────────────────────────────────
const AI_CHAT_FLOW = [
  { role: "user", text: "我需要采购 LED 灯具，月需求 5000 件，预算 $8/件，需要 CE 认证" },
  { role: "ai", text: "已收到您的需求。正在从 500+ 认证工厂中为您匹配..." },
  { role: "ai", text: "✅ 为您找到 3 家高度匹配的工厂：\n\n**1. 广州明亮照明** — 评分 4.9 ⭐ · CE+RoHS · $6.8/件\n**2. 深圳光华电子** — 评分 4.8 ⭐ · CE+UL · $7.2/件\n**3. 东莞星辉科技** — 评分 4.7 ⭐ · CE · $7.5/件" },
  { role: "user", text: "帮我预约广州明亮照明的视频会议" },
  { role: "ai", text: "✅ 已为您创建 Webinar 直播间 #2847\n📅 明天 10:00 AM (GMT+8)\n🔗 已发送邀请链接至您的邮箱\n\n会议将自动录制，AI 实时翻译已开启。" },
];

function AIDemoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const show = () => {
      if (i >= AI_CHAT_FLOW.length) return;
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setVisibleCount(c => c + 1);
        i++;
        if (i < AI_CHAT_FLOW.length) setTimeout(show, 800);
      }, AI_CHAT_FLOW[i].role === "ai" ? 1200 : 400);
    };
    setTimeout(show, 600);
  }, [inView]);

  return (
    <section ref={ref} style={{ padding: "120px 24px", background: C.bg }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          {/* Left: text */}
          <FadeIn>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: C.accentDim, border: `1px solid ${C.accent}44`,
              borderRadius: 20, padding: "4px 12px", marginBottom: 24,
            }}>
              <Bot size={14} style={{ color: C.accent }} />
              <span style={{ fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: "0.06em" }}>
                AI SOURCING ASSISTANT
              </span>
            </div>
            <h2 style={{
              fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 700,
              color: C.text, lineHeight: 1.15, marginBottom: 20,
              letterSpacing: "-0.02em",
            }}>
              描述需求，<br />
              <span style={{ color: C.accent }}>AI 完成剩下的一切</span>
            </h2>
            <p style={{ fontSize: 17, color: C.textMuted, lineHeight: 1.7, marginBottom: 32 }}>
              输入您的采购需求，AI 助理自动从 500+ 认证工厂中精准匹配，
              生成询盘，预约视频会议，全程中英双语。
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                "自然语言描述需求，无需填写复杂表单",
                "AI 实时分析工厂评分、价格、认证资质",
                "一键预约视频会议，自动发送邀请",
                "会议结束后自动生成 AI 摘要与行动清单",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <CheckCircle2 size={18} style={{ color: C.green, flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 15, color: C.textMuted }}>{item}</span>
                </div>
              ))}
            </div>
          </FadeIn>

          {/* Right: chat UI */}
          <FadeIn delay={0.15}>
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
            }}>
              {/* Chat header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "14px 16px",
                borderBottom: `1px solid ${C.border}`,
                background: "#111113",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.accent}, #8b5cf6)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bot size={16} style={{ color: "#fff" }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>RealSourcing AI</div>
                  <div style={{ fontSize: 11, color: C.green, display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, display: "inline-block" }} />
                    在线 · 平均响应 &lt;2s
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, minHeight: 320 }}>
                <AnimatePresence>
                  {AI_CHAT_FLOW.slice(0, visibleCount).map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        display: "flex",
                        justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                      }}
                    >
                      <div style={{
                        maxWidth: "85%",
                        background: msg.role === "user"
                          ? `linear-gradient(135deg, ${C.accent}, #7c3aed)`
                          : C.surfaceHover,
                        border: msg.role === "ai" ? `1px solid ${C.border}` : "none",
                        borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        padding: "10px 14px",
                        fontSize: 13,
                        color: C.text,
                        lineHeight: 1.6,
                        whiteSpace: "pre-line",
                      }}>
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing indicator */}
                {typing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ display: "flex", gap: 4, padding: "8px 14px", alignItems: "center" }}
                  >
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent }}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Input bar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "12px 16px",
                borderTop: `1px solid ${C.border}`,
                background: "#111113",
              }}>
                <div style={{
                  flex: 1, background: C.surfaceHover,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: "8px 12px",
                  fontSize: 13, color: C.textSubtle,
                }}>
                  描述您的采购需求...
                </div>
                <button style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: C.accent, border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}>
                  <Send size={15} style={{ color: "#fff" }} />
                </button>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ─── Factory Card ─────────────────────────────────────────────────────────────
const FACTORIES = [
  {
    name: "广州明亮照明科技",
    nameEn: "Guangzhou Bright Lighting",
    category: "LED & Lighting",
    rating: 4.9,
    reviews: 312,
    moq: "500 units",
    leadTime: "15-20 days",
    tags: ["CE", "RoHS", "ISO 9001"],
    badge: "Top Supplier",
    badgeColor: C.amber,
    price: "$6.8–$12/unit",
    location: "Guangzhou, GD",
    emoji: "💡",
  },
  {
    name: "深圳光华电子有限公司",
    nameEn: "Shenzhen Guanghua Electronics",
    category: "Consumer Electronics",
    rating: 4.8,
    reviews: 287,
    moq: "1,000 units",
    leadTime: "20-25 days",
    tags: ["CE", "UL", "FCC", "ISO 9001"],
    badge: "Verified",
    badgeColor: C.green,
    price: "$3.2–$8/unit",
    location: "Shenzhen, GD",
    emoji: "📱",
  },
  {
    name: "东莞星辉纺织品公司",
    nameEn: "Dongguan Xinghui Textiles",
    category: "Apparel & Textiles",
    rating: 4.7,
    reviews: 198,
    moq: "200 units",
    leadTime: "10-15 days",
    tags: ["OEKO-TEX", "ISO 9001"],
    badge: "Fast Response",
    badgeColor: C.accent,
    price: "$4.5–$15/unit",
    location: "Dongguan, GD",
    emoji: "👗",
  },
  {
    name: "佛山家居家具制造",
    nameEn: "Foshan Home Furniture Mfg",
    category: "Furniture & Home",
    rating: 4.8,
    reviews: 156,
    moq: "50 units",
    leadTime: "25-35 days",
    tags: ["FSC", "ISO 14001", "CE"],
    badge: "New",
    badgeColor: "#8b5cf6",
    price: "$45–$280/unit",
    location: "Foshan, GD",
    emoji: "🪑",
  },
  {
    name: "杭州美妆护肤OEM",
    nameEn: "Hangzhou Beauty OEM",
    category: "Cosmetics & Skincare",
    rating: 4.9,
    reviews: 421,
    moq: "1,000 units",
    leadTime: "30-45 days",
    tags: ["GMP", "ISO 22716", "FDA"],
    badge: "Top Supplier",
    badgeColor: C.amber,
    price: "$1.2–$6/unit",
    location: "Hangzhou, ZJ",
    emoji: "💄",
  },
];

function FactoryCard({ factory }: { factory: typeof FACTORIES[0] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ y: hovered ? -4 : 0 }}
      transition={{ duration: 0.2 }}
      style={{
        background: C.surface,
        border: `1px solid ${hovered ? C.borderHover : C.border}`,
        borderRadius: 12,
        padding: 20,
        minWidth: 260,
        maxWidth: 280,
        flexShrink: 0,
        cursor: "pointer",
        transition: "border-color 0.2s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: C.surfaceHover,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>
          {factory.emoji}
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: factory.badgeColor,
          background: factory.badgeColor + "22",
          border: `1px solid ${factory.badgeColor}44`,
          borderRadius: 20, padding: "2px 8px",
        }}>
          {factory.badge}
        </span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>{factory.name}</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>{factory.category} · {factory.location}</div>

      {/* Rating */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 2 }}>
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={12} style={{
              fill: s <= Math.floor(factory.rating) ? C.amber : "transparent",
              color: s <= Math.floor(factory.rating) ? C.amber : C.textSubtle,
            }} />
          ))}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{factory.rating}</span>
        <span style={{ fontSize: 12, color: C.textMuted }}>({factory.reviews})</span>
      </div>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
        {factory.tags.map(tag => (
          <span key={tag} style={{
            fontSize: 10, fontWeight: 600,
            color: C.textMuted,
            background: C.surfaceHover,
            border: `1px solid ${C.border}`,
            borderRadius: 4, padding: "2px 6px",
          }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Meta */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <div>
          <div style={{ color: C.textSubtle, marginBottom: 2 }}>MOQ</div>
          <div style={{ color: C.text, fontWeight: 500 }}>{factory.moq}</div>
        </div>
        <div>
          <div style={{ color: C.textSubtle, marginBottom: 2 }}>Lead Time</div>
          <div style={{ color: C.text, fontWeight: 500 }}>{factory.leadTime}</div>
        </div>
        <div>
          <div style={{ color: C.textSubtle, marginBottom: 2 }}>Price</div>
          <div style={{ color: C.green, fontWeight: 600 }}>{factory.price}</div>
        </div>
      </div>
    </motion.div>
  );
}

function FactoryCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  const onScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanLeft(scrollLeft > 0);
    setCanRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  return (
    <section style={{ padding: "120px 0", background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <FadeIn>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 48 }}>
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: C.greenDim, border: `1px solid ${C.green}44`,
                borderRadius: 20, padding: "4px 12px", marginBottom: 16,
              }}>
                <Award size={14} style={{ color: C.green }} />
                <span style={{ fontSize: 12, color: C.green, fontWeight: 600, letterSpacing: "0.06em" }}>
                  VERIFIED FACTORIES
                </span>
              </div>
              <h2 style={{
                fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 700,
                color: C.text, letterSpacing: "-0.02em", lineHeight: 1.2,
              }}>
                500+ 认证工厂，等待您的询盘
              </h2>
              <p style={{ fontSize: 16, color: C.textMuted, marginTop: 12 }}>
                每家工厂均经过三重认证：营业执照 + 生产资质 + 实地视频验证
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ dir: "left" as const, can: canLeft }, { dir: "right" as const, can: canRight }].map(({ dir, can }) => (
                <button
                  key={dir}
                  onClick={() => scroll(dir)}
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: can ? C.surfaceHover : "transparent",
                    border: `1px solid ${can ? C.border : C.textSubtle}`,
                    color: can ? C.text : C.textSubtle,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: can ? "pointer" : "default",
                    transition: "all 0.2s",
                  }}
                >
                  {dir === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
              ))}
            </div>
          </div>
        </FadeIn>

        <div
          ref={scrollRef}
          onScroll={onScroll}
          style={{
            display: "flex", gap: 16, overflowX: "auto",
            scrollbarWidth: "none", paddingBottom: 4,
          }}
        >
          {FACTORIES.map((f, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <FactoryCard factory={f} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Global Sourcing Map (SVG) ────────────────────────────────────────────────
const MAP_FACTORIES = [
  { x: 72, y: 38, label: "Shanghai", count: 120 },
  { x: 70, y: 40, label: "Guangzhou", count: 95 },
  { x: 71, y: 37, label: "Shenzhen", count: 88 },
  { x: 69, y: 33, label: "Beijing", count: 45 },
  { x: 75, y: 42, label: "Vietnam", count: 32 },
  { x: 68, y: 45, label: "India", count: 28 },
];
const MAP_BUYERS = [
  { x: 22, y: 28, label: "New York", flag: "🇺🇸" },
  { x: 48, y: 26, label: "London", flag: "🇬🇧" },
  { x: 50, y: 24, label: "Munich", flag: "🇩🇪" },
  { x: 57, y: 35, label: "Dubai", flag: "🇦🇪" },
  { x: 65, y: 45, label: "Mumbai", flag: "🇮🇳" },
  { x: 48, y: 28, label: "Paris", flag: "🇫🇷" },
  { x: 85, y: 65, label: "Sydney", flag: "🇦🇺" },
];

function GlobalMap() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [activeLines, setActiveLines] = useState<number[]>([]);

  useEffect(() => {
    if (!inView) return;
    const show = (i: number) => {
      if (i >= MAP_BUYERS.length) return;
      setTimeout(() => {
        setActiveLines(prev => [...prev, i]);
        show(i + 1);
      }, i * 300);
    };
    show(0);
  }, [inView]);

  // Use Guangzhou as the factory hub
  const hub = MAP_FACTORIES[1];

  return (
    <section ref={ref} style={{ padding: "120px 24px", background: C.bg }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: C.accentDim, border: `1px solid ${C.accent}44`,
            borderRadius: 20, padding: "4px 12px", marginBottom: 20,
          }}>
            <Globe size={14} style={{ color: C.accent }} />
            <span style={{ fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: "0.06em" }}>
              GLOBAL NETWORK
            </span>
          </div>
          <h2 style={{
            fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 700,
            color: C.text, letterSpacing: "-0.02em",
          }}>
            连接全球买家与中国工厂
          </h2>
          <p style={{ fontSize: 16, color: C.textMuted, marginTop: 12 }}>
            实时撮合来自 60+ 国家的采购商与中国制造商
          </p>
        </FadeIn>

        {/* Map container */}
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
        }}>
          <svg
            viewBox="0 0 100 60"
            style={{ width: "100%", display: "block" }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background */}
            <rect width="100" height="60" fill="#0d0d0f" />

            {/* Grid lines */}
            {[10, 20, 30, 40, 50, 60, 70, 80, 90].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
            ))}
            {[10, 20, 30, 40, 50].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />
            ))}

            {/* Connection lines from buyers to hub */}
            {MAP_BUYERS.map((buyer, i) => (
              <motion.line
                key={i}
                x1={buyer.x} y1={buyer.y}
                x2={hub.x} y2={hub.y}
                stroke={C.accent}
                strokeWidth="0.4"
                strokeDasharray="1 1"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={activeLines.includes(i) ? { opacity: 0.5, pathLength: 1 } : {}}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            ))}

            {/* Factory dots */}
            {MAP_FACTORIES.map((f, i) => (
              <g key={i}>
                <motion.circle
                  cx={f.x} cy={f.y} r="1.2"
                  fill={C.green}
                  initial={{ scale: 0 }}
                  animate={inView ? { scale: 1 } : {}}
                  transition={{ delay: 0.3 + i * 0.1 }}
                />
                <motion.circle
                  cx={f.x} cy={f.y} r="2.5"
                  fill="none"
                  stroke={C.green}
                  strokeWidth="0.3"
                  initial={{ opacity: 0 }}
                  animate={inView ? { opacity: [0, 0.4, 0] } : {}}
                  transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
                />
              </g>
            ))}

            {/* Buyer dots */}
            {MAP_BUYERS.map((b, i) => (
              <motion.circle
                key={i}
                cx={b.x} cy={b.y} r="1"
                fill={C.accent}
                initial={{ scale: 0 }}
                animate={activeLines.includes(i) ? { scale: 1 } : {}}
                transition={{ duration: 0.3 }}
              />
            ))}
          </svg>

          {/* Legend */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 32,
            padding: "16px 24px",
            borderTop: `1px solid ${C.border}`,
          }}>
            {[
              { color: C.green, label: "认证工厂 (500+)" },
              { color: C.accent, label: "活跃买家 (60+ 国家)" },
              { color: C.accent, label: "实时连接", dashed: true },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {item.dashed ? (
                  <div style={{ width: 20, height: 2, borderTop: `2px dashed ${item.color}`, opacity: 0.6 }} />
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                )}
                <span style={{ fontSize: 12, color: C.textMuted }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Comparison Table ─────────────────────────────────────────────────────────
const COMPARE_ROWS = [
  { feature: "视频实时谈判", rs: true, ali: false, trad: false },
  { feature: "AI 实时翻译", rs: true, ali: false, trad: false },
  { feature: "会议自动录制 + AI 摘要", rs: true, ali: false, trad: false },
  { feature: "三重工厂认证", rs: true, ali: "部分", trad: false },
  { feature: "AI 智能工厂匹配", rs: true, ali: false, trad: false },
  { feature: "样品追踪", rs: true, ali: "部分", trad: false },
  { feature: "私密谈判室 (L1)", rs: true, ali: false, trad: false },
  { feature: "直接联系工厂", rs: true, ali: false, trad: true },
];

function CompareTable() {
  return (
    <section style={{ padding: "120px 24px", background: C.surface, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{
            fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 700,
            color: C.text, letterSpacing: "-0.02em", marginBottom: 16,
          }}>
            为什么选择 RealSourcing？
          </h2>
          <p style={{ fontSize: 16, color: C.textMuted }}>
            我们不是另一个 B2B 目录，我们是视频优先的采购平台
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div style={{
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
              background: "#111113",
              borderBottom: `1px solid ${C.border}`,
            }}>
              {["功能", "RealSourcing", "阿里巴巴", "传统模式"].map((h, i) => (
                <div key={i} style={{
                  padding: "14px 20px",
                  fontSize: 13, fontWeight: 600,
                  color: i === 1 ? C.accent : C.textMuted,
                  textAlign: i === 0 ? "left" : "center",
                  borderRight: i < 3 ? `1px solid ${C.border}` : "none",
                }}>
                  {i === 1 && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: C.accentDim, border: `1px solid ${C.accent}44`,
                      borderRadius: 20, padding: "2px 8px",
                    }}>
                      <Sparkles size={11} style={{ color: C.accent }} />
                      {h}
                    </div>
                  )}
                  {i !== 1 && h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {COMPARE_ROWS.map((row, i) => (
              <div
                key={i}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                  borderBottom: i < COMPARE_ROWS.length - 1 ? `1px solid ${C.border}` : "none",
                }}
              >
                <div style={{ padding: "14px 20px", fontSize: 14, color: C.textMuted, borderRight: `1px solid ${C.border}` }}>
                  {row.feature}
                </div>
                {[row.rs, row.ali, row.trad].map((val, j) => (
                  <div key={j} style={{
                    padding: "14px 20px", textAlign: "center",
                    borderRight: j < 2 ? `1px solid ${C.border}` : "none",
                    background: j === 0 ? C.accentDim : "transparent",
                  }}>
                    {val === true && <Check size={16} style={{ color: C.green, margin: "0 auto" }} />}
                    {val === false && <X size={16} style={{ color: C.textSubtle, margin: "0 auto" }} />}
                    {typeof val === "string" && (
                      <span style={{ fontSize: 12, color: C.amber }}>{val}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "RealSourcing 彻底改变了我们的采购方式。Webinar 直播间让我在 30 分钟内就锁定了 3 家优质工厂，AI 翻译非常流畅，感觉就像在和中国工厂面对面谈判。",
    name: "Ahmed Al-Maktoum",
    role: "采购总监",
    company: "Dubai Retail Group",
    flag: "🇦🇪",
    rating: 5,
    avatar: "A",
    avatarColor: "#f59e0b",
  },
  {
    quote: "以前找工厂要花 2-3 个月，现在用 RealSourcing 一周就完成了样品确认。工厂认证体系让我非常放心，再也不用担心被骗了。",
    name: "Sarah Jenkins",
    role: "品牌创始人",
    company: "London Beauty Co.",
    flag: "🇬🇧",
    rating: 5,
    avatar: "S",
    avatarColor: "#ec4899",
  },
  {
    quote: "Webinar 直播间的 FOMO 机制太厉害了，我们在直播中直接锁定了 30 件样品，比传统询盘快了 10 倍。AI 摘要功能让我们的团队协作效率大幅提升。",
    name: "Priya Sharma",
    role: "电商运营总监",
    company: "Mumbai Brands",
    flag: "🇮🇳",
    rating: 5,
    avatar: "P",
    avatarColor: "#8b5cf6",
  },
  {
    quote: "作为一个不懂中文的欧洲买家，以前和中国工厂沟通是噩梦。RealSourcing 的 AI 实时翻译让语言障碍完全消失，我现在每周都在平台上谈生意。",
    name: "Klaus Weber",
    role: "采购经理",
    company: "Munich Industrial GmbH",
    flag: "🇩🇪",
    rating: 5,
    avatar: "K",
    avatarColor: "#06b6d4",
  },
];

function Testimonials() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  const t = TESTIMONIALS[idx];
  return (
    <section style={{ padding: "120px 24px", background: C.bg }}>
      <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <FadeIn>
          <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 48 }}>
            全球买家的真实评价
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              {/* Stars */}
              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 24 }}>
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={18} style={{ fill: C.amber, color: C.amber }} />
                ))}
              </div>

              {/* Quote */}
              <blockquote style={{
                fontSize: "clamp(16px, 2vw, 20px)",
                color: C.text,
                lineHeight: 1.7,
                fontStyle: "italic",
                marginBottom: 32,
                letterSpacing: "-0.01em",
              }}>
                "{t.quote}"
              </blockquote>

              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: t.avatarColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 700, color: "#fff",
                }}>
                  {t.avatar}
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                    {t.flag} {t.name}
                  </div>
                  <div style={{ fontSize: 13, color: C.textMuted }}>
                    {t.role} · {t.company}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 40 }}>
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 24 : 8,
                  height: 8, borderRadius: 4,
                  background: i === idx ? C.accent : C.textSubtle,
                  border: "none", cursor: "pointer",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
const PLANS = [
  {
    name: "免费版",
    price: "$0",
    period: "/月",
    desc: "适合初次探索的采购商",
    features: ["5 次视频会议/月", "基础工厂搜索", "AI 翻译（有限次数）", "社区支持"],
    cta: "免费开始",
    ctaStyle: "outline",
    highlight: false,
  },
  {
    name: "专业版",
    price: "$99",
    period: "/月",
    desc: "适合活跃采购商和中小品牌",
    features: ["无限视频会议", "AI 摘要 & 录制", "Meeting Reel 生成", "优先工厂匹配", "专属客户成功经理"],
    cta: "立即升级",
    ctaStyle: "filled",
    highlight: true,
  },
  {
    name: "企业版",
    price: "定制",
    period: "",
    desc: "适合大型品牌和采购团队",
    features: ["多账号团队协作", "私有化部署选项", "API 集成", "专属谈判顾问", "SLA 保障"],
    cta: "联系销售团队",
    ctaStyle: "outline",
    highlight: false,
  },
];

function Pricing() {
  return (
    <section style={{ padding: "120px 24px", background: C.surface, borderTop: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 64 }}>
          <h2 style={{
            fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 700,
            color: C.text, letterSpacing: "-0.02em", marginBottom: 16,
          }}>
            简单透明的定价
          </h2>
          <p style={{ fontSize: 16, color: C.textMuted }}>
            从免费版开始，随业务增长升级
          </p>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {PLANS.map((plan, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div style={{
                background: plan.highlight ? `linear-gradient(180deg, ${C.accentDim} 0%, ${C.bg} 100%)` : C.bg,
                border: `1px solid ${plan.highlight ? C.accent + "66" : C.border}`,
                borderRadius: 16,
                padding: 28,
                position: "relative",
                height: "100%",
              }}>
                {plan.highlight && (
                  <div style={{
                    position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                    background: C.accent, color: "#fff",
                    fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                    padding: "3px 12px", borderRadius: 20,
                  }}>
                    最受欢迎
                  </div>
                )}
                <div style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 6 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>{plan.desc}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  <span style={{ fontSize: 40, fontWeight: 700, color: C.text, letterSpacing: "-0.02em" }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: C.textMuted }}>{plan.period}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Check size={15} style={{ color: plan.highlight ? C.accent : C.green, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, color: C.textMuted }}>{f}</span>
                    </div>
                  ))}
                </div>
                <Link href="/register">
                  <button style={{
                    width: "100%", padding: "12px 0",
                    borderRadius: 8, fontSize: 14, fontWeight: 600,
                    cursor: "pointer", transition: "all 0.2s",
                    background: plan.ctaStyle === "filled" ? C.accent : "transparent",
                    border: `1px solid ${plan.ctaStyle === "filled" ? C.accent : C.border}`,
                    color: plan.ctaStyle === "filled" ? "#fff" : C.textMuted,
                  }}>
                    {plan.cta}
                  </button>
                </Link>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "RealSourcing 与阿里巴巴有什么区别？",
    a: "阿里巴巴是 B2B 目录，您只能发消息询价，无法实时视频沟通。RealSourcing 是视频优先的采购平台，支持实时视频谈判、AI 翻译、自动录制和 AI 摘要，让采购决策更快、更安全。",
  },
  {
    q: "如何确保工厂的真实性？",
    a: "每家工厂都经过三重认证：① 营业执照核验（工商局数据） ② 生产资质审核（行业认证文件） ③ 实地视频验证（我们的团队现场录制生产线）。未通过认证的工厂无法在平台上接单。",
  },
  {
    q: "视频会议支持哪些语言翻译？",
    a: "目前支持中英双向实时翻译，延迟低于 2 秒。阿拉伯语、德语、法语、印地语翻译正在开发中，预计 2025 Q2 上线。",
  },
  {
    q: "样品费用如何结算？",
    a: "样品费用由买家和工厂直接协商，平台不收取额外手续费。我们提供安全的第三方支付通道（Stripe/PayPal），样品确认后费用才会释放给工厂。",
  },
  {
    q: "工厂注册需要费用吗？",
    a: "工厂基础注册完全免费。通过认证后，工厂可以免费接受买家的视频会议邀请。平台仅在成功成交后收取小额服务费（2.5%），无成交不收费。",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section style={{ padding: "120px 24px", background: C.bg }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <FadeIn style={{ textAlign: "center", marginBottom: 56 }}>
          <h2 style={{
            fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 700,
            color: C.text, letterSpacing: "-0.02em",
          }}>
            常见问题
          </h2>
        </FadeIn>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {FAQS.map((faq, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <div style={{
                background: open === i ? C.surface : "transparent",
                border: `1px solid ${open === i ? C.border : "transparent"}`,
                borderRadius: 10,
                overflow: "hidden",
                transition: "all 0.2s",
              }}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    padding: "18px 20px",
                    background: "transparent", border: "none",
                    cursor: "pointer", textAlign: "left",
                    borderBottom: open === i ? `1px solid ${C.border}` : "none",
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 500, color: C.text }}>{faq.q}</span>
                  <motion.div
                    animate={{ rotate: open === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={18} style={{ color: C.textMuted, flexShrink: 0 }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div style={{ padding: "16px 20px 20px", fontSize: 14, color: C.textMuted, lineHeight: 1.7 }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main Home Component ──────────────────────────────────────────────────────
export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ── Navbar ── */}
      <motion.nav
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "0 24px",
          borderBottom: `1px solid ${scrolled ? C.border : "transparent"}`,
          background: scrolled ? "rgba(9,9,11,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          transition: "all 0.3s",
        }}
      >
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center", height: 60, gap: 32,
        }}>
          <Link href="/">
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: `linear-gradient(135deg, ${C.accent}, #7c3aed)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "#fff",
              }}>
                RS
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>RealSourcing</span>
            </div>
          </Link>

          <div style={{ display: "flex", gap: 4, flex: 1 }}>
            {[
              { label: "Webinar", href: "/webinars" },
              { label: "工厂库", href: "/factories" },
              { label: "功能", href: "#features" },
              { label: "定价", href: "#pricing" },
            ].map(item => (
              <Link key={item.label} href={item.href}>
                <button style={{
                  background: "transparent", border: "none",
                  padding: "6px 12px", borderRadius: 6,
                  fontSize: 14, color: C.textMuted, cursor: "pointer",
                  transition: "color 0.2s",
                }}>
                  {item.label}
                </button>
              </Link>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/login">
              <button style={{
                background: "transparent", border: "none",
                padding: "6px 14px", borderRadius: 6,
                fontSize: 14, color: C.textMuted, cursor: "pointer",
              }}>
                登录
              </button>
            </Link>
            <Link href="/register">
              <button style={{
                background: C.text, border: "none",
                padding: "7px 16px", borderRadius: 7,
                fontSize: 14, fontWeight: 600, color: C.bg, cursor: "pointer",
                transition: "opacity 0.2s",
              }}>
                免费开始
              </button>
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ── */}
      <section style={{ padding: "140px 24px 80px", minHeight: "100vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

            {/* Left: copy */}
            <div>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: C.accentDim, border: `1px solid ${C.accent}44`,
                  borderRadius: 20, padding: "5px 14px", marginBottom: 28,
                }}
              >
                <Sparkles size={13} style={{ color: C.accent }} />
                <span style={{ fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: "0.06em" }}>
                  PRD 3.1 · AI-Powered B2B Sourcing
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
                style={{
                  fontSize: "clamp(40px, 5.5vw, 72px)",
                  fontWeight: 800,
                  color: C.text,
                  lineHeight: 1.08,
                  letterSpacing: "-0.03em",
                  marginBottom: 20,
                }}
              >
                告别中间商<br />
                <span style={{
                  background: `linear-gradient(135deg, ${C.accent} 0%, #a78bfa 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  直连真实工厂
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                style={{
                  fontSize: 18, color: C.textMuted, lineHeight: 1.65,
                  marginBottom: 36, maxWidth: 440,
                }}
              >
                AI 智能匹配 · 视频实时谈判 · 自动录制存档<br />
                让全球采购商在 <strong style={{ color: C.text }}>48 小时</strong>内找到并验证理想工厂
              </motion.p>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                style={{ display: "flex", gap: 12, marginBottom: 48 }}
              >
                <Link href="/register">
                  <button style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: C.text, border: "none",
                    padding: "13px 24px", borderRadius: 9,
                    fontSize: 15, fontWeight: 700, color: C.bg,
                    cursor: "pointer", transition: "opacity 0.2s",
                  }}>
                    免费开始采购
                    <ArrowRight size={16} />
                  </button>
                </Link>
                <Link href="/webinars">
                  <button style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    padding: "13px 24px", borderRadius: 9,
                    fontSize: 15, fontWeight: 600, color: C.textMuted,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                    <Play size={15} />
                    观看 Demo
                  </button>
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                style={{ display: "flex", gap: 32 }}
              >
                {[
                  { value: 500, suffix: "+", label: "认证工厂" },
                  { value: 2000, suffix: "+", label: "全球采购商" },
                  { value: 98, suffix: "%", label: "满意度" },
                ].map((stat, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>
                      <Counter to={stat.value} suffix={stat.suffix} />
                    </div>
                    <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Webinar Mock UI */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
              style={{ display: "flex", justifyContent: "center" }}
            >
              <WebinarMockUI />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Live Ticker ── */}
      <LiveTicker />

      {/* ── Brand Trust ── */}
      <section style={{
        padding: "48px 24px",
        borderBottom: `1px solid ${C.border}`,
        background: C.bg,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: C.textSubtle, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 24 }}>
            全球品牌采购商信任 REALSOURCING
          </p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 40 }}>
            {["Walmart", "Target", "ASOS", "Zalando", "Noon", "Carrefour", "Lulu"].map(brand => (
              <span key={brand} style={{ fontSize: 15, fontWeight: 600, color: C.textSubtle, letterSpacing: "0.02em" }}>
                {brand}
              </span>
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
      <section id="features" style={{ padding: "120px 24px", background: C.surface, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeIn style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{
              fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 700,
              color: C.text, letterSpacing: "-0.02em", marginBottom: 16,
            }}>
              为现代采购而生的每一个功能
            </h2>
            <p style={{ fontSize: 16, color: C.textMuted }}>
              从发现工厂到完成交易，全程在平台内完成
            </p>
          </FadeIn>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { icon: <Video size={22} />, title: "TikTok 风格 Webinar 直播间", desc: "沉浸式选品直播，FOMO 引擎实时触发，买家在直播间内完成意向锁定，转化率高达 61.7%。", color: "#f59e0b", stats: [{ v: "24 min", l: "平均在线时长" }, { v: "61.7%", l: "意向转化率" }] },
              { icon: <Sparkles size={22} />, title: "AI 实时翻译", desc: "中英双向实时字幕，延迟低于 2 秒，消除语言壁垒。", color: C.accent, stats: [] },
              { icon: <Shield size={22} />, title: "三重工厂认证", desc: "营业执照 + 生产资质 + 实地视频验证，确保每家工厂真实可信。", color: C.green, stats: [] },
              { icon: <Video size={22} />, title: "视频实时谈判", desc: "高清视频会议 + 自动录制 + AI 摘要，每一次沟通都有据可查。", color: "#06b6d4", stats: [] },
              { icon: <Bot size={22} />, title: "AI 采购助理", desc: "智能匹配工厂，自动生成询盘，分析报价差异，让采购决策更快更准。", color: "#8b5cf6", stats: [], badge: "NEW" },
              { icon: <Globe size={22} />, title: "500+ 认证工厂库", desc: "覆盖美妆、3C、家居、服装等主流品类，支持多维度筛选与对比。", color: C.green, stats: [] },
            ].map((feat, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div style={{
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 12,
                  padding: 24,
                  height: "100%",
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: feat.color + "22",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: feat.color, marginBottom: 16,
                  }}>
                    {feat.icon}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{feat.title}</div>
                    {feat.badge && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: "#8b5cf622", color: "#8b5cf6",
                        border: "1px solid #8b5cf644",
                        borderRadius: 4, padding: "1px 5px",
                      }}>
                        {feat.badge}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6, marginBottom: feat.stats.length > 0 ? 16 : 0 }}>
                    {feat.desc}
                  </p>
                  {feat.stats.length > 0 && (
                    <div style={{ display: "flex", gap: 20 }}>
                      {feat.stats.map((s, j) => (
                        <div key={j}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: feat.color }}>{s.v}</div>
                          <div style={{ fontSize: 11, color: C.textSubtle }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Compare Table ── */}
      <CompareTable />

      {/* ── 3-Step Workflow ── */}
      <section style={{ padding: "120px 24px", background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeIn style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{
              fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 700,
              color: C.text, letterSpacing: "-0.02em",
            }}>
              三步完成采购
            </h2>
          </FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40 }}>
            {[
              { num: "01", icon: <Package size={24} />, title: "发现认证工厂", desc: "AI 根据您的品类需求，从 500+ 认证工厂中精准匹配最优候选。", color: C.accent },
              { num: "02", icon: <Video size={24} />, title: "视频实时谈判", desc: "发起视频会议，AI 实时翻译，自动录制，所有细节都有存档。", color: C.green },
              { num: "03", icon: <FileText size={24} />, title: "锁定样品下单", desc: "在平台内完成样品申请，追踪物流，一键转正式订单。", color: C.amber },
            ].map((step, i) => (
              <FadeIn key={i} delay={i * 0.12}>
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: 48, fontWeight: 800, color: step.color,
                    opacity: 0.2, lineHeight: 1, marginBottom: 16,
                    letterSpacing: "-0.04em",
                  }}>
                    {step.num}
                  </div>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: step.color + "22",
                    border: `1px solid ${step.color}44`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: step.color, margin: "0 auto 20px",
                  }}>
                    {step.icon}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 10 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.65 }}>{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <Testimonials />

      {/* ── Pricing ── */}
      <div id="pricing">
        <Pricing />
      </div>

      {/* ── FAQ ── */}
      <FAQ />

      {/* ── Final CTA ── */}
      <section style={{
        padding: "120px 24px",
        background: C.surface,
        borderTop: `1px solid ${C.border}`,
        textAlign: "center",
      }}>
        <FadeIn>
          <h2 style={{
            fontSize: "clamp(32px, 4.5vw, 56px)", fontWeight: 800,
            color: C.text, letterSpacing: "-0.03em", marginBottom: 20,
          }}>
            准备好开始了吗？
          </h2>
          <p style={{ fontSize: 18, color: C.textMuted, marginBottom: 40 }}>
            加入 2,000+ 全球采购商，今天就找到您的理想工厂
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/register">
              <button style={{
                display: "flex", alignItems: "center", gap: 8,
                background: C.text, border: "none",
                padding: "14px 28px", borderRadius: 9,
                fontSize: 16, fontWeight: 700, color: C.bg,
                cursor: "pointer",
              }}>
                免费开始
                <ArrowRight size={18} />
              </button>
            </Link>
            <Link href="/factories">
              <button style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "transparent",
                border: `1px solid ${C.border}`,
                padding: "14px 28px", borderRadius: 9,
                fontSize: 16, fontWeight: 600, color: C.textMuted,
                cursor: "pointer",
              }}>
                浏览工厂库
              </button>
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "40px 24px",
        borderTop: `1px solid ${C.border}`,
        background: C.bg,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: `linear-gradient(135deg, ${C.accent}, #7c3aed)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800, color: "#fff",
            }}>
              RS
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.textMuted }}>RealSourcing</span>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { label: "Webinar", href: "/webinars" },
              { label: "工厂库", href: "/factories" },
              { label: "AI 采购助理", href: "/dashboard" },
              { label: "关于我们", href: "#" },
              { label: "联系我们", href: "#" },
              { label: "隐私政策", href: "#" },
            ].map(item => (
              <Link key={item.label} href={item.href}>
                <span style={{ fontSize: 13, color: C.textSubtle, cursor: "pointer" }}>{item.label}</span>
              </Link>
            ))}
          </div>
          <span style={{ fontSize: 13, color: C.textSubtle }}>© 2025 RealSourcing</span>
        </div>
      </footer>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
