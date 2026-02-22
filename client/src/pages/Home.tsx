import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight, Play, Star, Check, X, Globe2, Zap, Shield, Video,
  MessageSquare, FileText, ChevronDown, ChevronLeft, ChevronRight,
  Building2, Users, TrendingUp, Award, Sparkles, Bot, Factory,
} from "lucide-react";

// Magic UI Components
import { Particles } from "@/components/magicui/particles";
import { Globe } from "@/components/magicui/globe";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { Marquee } from "@/components/magicui/marquee";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { BorderBeam } from "@/components/magicui/border-beam";
import { MagicCard } from "@/components/magicui/magic-card";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BlurFade } from "@/components/magicui/blur-fade";
import { AnimatedGradientText } from "@/components/magicui/animated-gradient-text";
import { OrbitingCircles } from "@/components/magicui/orbiting-circles";

// ─── Data ──────────────────────────────────────────────────────────────────

const LIVE_ACTIVITIES = [
  { flag: "🇦🇪", name: "Ahmed Al-Rashid", action: "booked a factory inspection in Guangzhou", time: "2m ago" },
  { flag: "🇺🇸", name: "Sarah Johnson", action: "closed a $120K deal via live webinar", time: "5m ago" },
  { flag: "🇩🇪", name: "Klaus Weber", action: "received AI-translated quotation from 3 factories", time: "8m ago" },
  { flag: "🇬🇧", name: "Emma Clarke", action: "started a video negotiation with Shenzhen supplier", time: "12m ago" },
  { flag: "🇫🇷", name: "Pierre Dubois", action: "matched with 5 certified LED factories", time: "15m ago" },
  { flag: "🇯🇵", name: "Tanaka Hiroshi", action: "completed sample verification via live stream", time: "18m ago" },
  { flag: "🇦🇺", name: "James Mitchell", action: "saved 40% sourcing cost using AI matching", time: "22m ago" },
  { flag: "🇧🇷", name: "Carlos Silva", action: "scheduled 3 factory tours for next week", time: "25m ago" },
];

const FACTORIES = [
  {
    name: "Shenzhen TechMold Co.",
    category: "Electronics Manufacturing",
    location: "Shenzhen, China",
    rating: 4.9,
    reviews: 312,
    moq: "500 pcs",
    certifications: ["ISO 9001", "CE", "RoHS"],
    specialty: "PCB Assembly & IoT Devices",
    response: "< 2 hours",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    name: "Guangzhou Apparel Group",
    category: "Textile & Apparel",
    location: "Guangzhou, China",
    rating: 4.8,
    reviews: 489,
    moq: "200 pcs",
    certifications: ["OEKO-TEX", "GOTS", "ISO 9001"],
    specialty: "Fast Fashion & Sportswear",
    response: "< 1 hour",
    color: "from-purple-500/20 to-pink-500/20",
  },
  {
    name: "Yiwu Packaging Solutions",
    category: "Packaging & Printing",
    location: "Yiwu, China",
    rating: 4.7,
    reviews: 256,
    moq: "1000 pcs",
    certifications: ["FSC", "ISO 14001"],
    specialty: "Custom Packaging & Branding",
    response: "< 3 hours",
    color: "from-green-500/20 to-emerald-500/20",
  },
  {
    name: "Dongguan Furniture Works",
    category: "Furniture & Home Decor",
    location: "Dongguan, China",
    rating: 4.9,
    reviews: 178,
    moq: "50 pcs",
    certifications: ["CARB", "FSC", "ISO 9001"],
    specialty: "OEM/ODM Furniture",
    response: "< 4 hours",
    color: "from-orange-500/20 to-yellow-500/20",
  },
  {
    name: "Ningbo Auto Parts Ltd.",
    category: "Automotive Components",
    location: "Ningbo, China",
    rating: 4.8,
    reviews: 203,
    moq: "100 pcs",
    certifications: ["IATF 16949", "ISO 9001", "TS16949"],
    specialty: "Precision Metal Parts",
    response: "< 2 hours",
    color: "from-red-500/20 to-rose-500/20",
  },
];

const TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    title: "Head of Procurement",
    company: "RetailMax USA",
    flag: "🇺🇸",
    avatar: "SJ",
    rating: 5,
    text: "RealSourcing completely transformed how we source from China. The live webinar feature let us inspect factories in real-time without flying there. We saved $80K in travel costs last year alone.",
  },
  {
    name: "Klaus Weber",
    title: "CEO",
    company: "Weber Imports GmbH",
    flag: "🇩🇪",
    avatar: "KW",
    rating: 5,
    text: "The AI translation during live negotiations is a game-changer. I can now negotiate directly with Chinese factory owners without a translator. The quality of matches is incredibly accurate.",
  },
  {
    name: "Ahmed Al-Rashid",
    title: "Sourcing Director",
    company: "Gulf Trade Co.",
    flag: "🇦🇪",
    avatar: "AA",
    rating: 5,
    text: "We found 3 new reliable suppliers within a week. The AI-generated meeting summaries save hours of follow-up work. This platform is the future of B2B sourcing.",
  },
  {
    name: "Emma Clarke",
    title: "Founder",
    company: "Clarke & Co.",
    flag: "🇬🇧",
    avatar: "EC",
    rating: 5,
    text: "As a small business owner, I never thought I could access the same suppliers as large corporations. RealSourcing leveled the playing field. My first order was 40% cheaper than my previous supplier.",
  },
  {
    name: "Pierre Dubois",
    title: "Import Manager",
    company: "Maison Dubois",
    flag: "🇫🇷",
    avatar: "PD",
    rating: 5,
    text: "The platform's AI matching algorithm found us a niche furniture manufacturer that we never would have discovered through traditional channels. Exceptional service and technology.",
  },
];

const COMPARISON_DATA = [
  { feature: "Real-time Video Negotiation", rs: true, ali: false, trade: false },
  { feature: "AI-Powered Factory Matching", rs: true, ali: false, trade: false },
  { feature: "Live Translation (50+ Languages)", rs: true, ali: false, trade: false },
  { feature: "AI Meeting Summaries", rs: true, ali: false, trade: false },
  { feature: "Interactive Whiteboard", rs: true, ali: false, trade: false },
  { feature: "Verified Factory Inspections", rs: true, ali: true, trade: true },
  { feature: "Secure Payment Escrow", rs: true, ali: true, trade: false },
  { feature: "24/7 AI Support", rs: true, ali: false, trade: false },
  { feature: "No Middleman Fees", rs: true, ali: false, trade: false },
];

// ─── AnimatedBeam Demo Component ───────────────────────────────────────────

function AIMatchingDemo() {
  const containerRef = useRef<HTMLDivElement>(null);
  const buyerRef = useRef<HTMLDivElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);
  const factory1Ref = useRef<HTMLDivElement>(null);
  const factory2Ref = useRef<HTMLDivElement>(null);
  const factory3Ref = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative flex h-[320px] w-full items-center justify-center overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-8">
      {/* Buyer */}
      <div ref={buyerRef} className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Users className="w-7 h-7 text-white" />
        </div>
        <span className="text-xs text-white/60 font-medium">Buyer</span>
      </div>

      {/* AI Core */}
      <div ref={aiRef} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 z-10">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-violet-500/40 ring-2 ring-violet-400/30">
          <Bot className="w-10 h-10 text-white" />
        </div>
        <span className="text-xs text-violet-300 font-semibold">AI Matcher</span>
      </div>

      {/* Factories */}
      <div className="absolute right-8 flex flex-col gap-4">
        {[
          { ref: factory1Ref, label: "Factory A", color: "from-green-500 to-emerald-500", shadow: "shadow-green-500/30" },
          { ref: factory2Ref, label: "Factory B", color: "from-orange-500 to-amber-500", shadow: "shadow-orange-500/30" },
          { ref: factory3Ref, label: "Factory C", color: "from-pink-500 to-rose-500", shadow: "shadow-pink-500/30" },
        ].map(({ ref, label, color, shadow }) => (
          <div key={label} ref={ref} className="flex flex-col items-center gap-1">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg ${shadow}`}>
              <Factory className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs text-white/50">{label}</span>
          </div>
        ))}
      </div>

      {/* Animated Beams */}
      <AnimatedBeam containerRef={containerRef} fromRef={buyerRef} toRef={aiRef} gradientStartColor="#3b82f6" gradientStopColor="#8b5cf6" curvature={-20} />
      <AnimatedBeam containerRef={containerRef} fromRef={aiRef} toRef={factory1Ref} gradientStartColor="#8b5cf6" gradientStopColor="#10b981" delay={1} />
      <AnimatedBeam containerRef={containerRef} fromRef={aiRef} toRef={factory2Ref} gradientStartColor="#8b5cf6" gradientStopColor="#f59e0b" delay={2} />
      <AnimatedBeam containerRef={containerRef} fromRef={aiRef} toRef={factory3Ref} gradientStartColor="#8b5cf6" gradientStopColor="#ec4899" delay={3} />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/40 text-center">
        AI analyzes 2,500+ factories in real-time to find your perfect match
      </div>
    </div>
  );
}

// ─── Webinar Mock UI ────────────────────────────────────────────────────────

function WebinarMockUI() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ["Live Negotiation", "AI Summary", "Whiteboard"];

  return (
    <div className="relative w-full max-w-lg rounded-2xl overflow-hidden bg-[#0d0b1a] border border-white/10 shadow-2xl shadow-violet-500/10">
      <BorderBeam size={300} duration={12} colorFrom="#7c3aed" colorTo="#06b6d4" />

      {/* Browser Chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <div className="flex-1 mx-3 bg-white/10 rounded-md px-3 py-1 text-xs text-white/40 font-mono">
          app.realsourcing.com/webinar/live
        </div>
        <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === i ? "text-violet-400 border-b-2 border-violet-400" : "text-white/40 hover:text-white/60"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 0 && (
          <div className="space-y-3">
            {/* Video Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-blue-900/40 to-blue-800/20 aspect-video flex items-center justify-center border border-blue-500/20">
                <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-300" />
                </div>
                <div className="absolute bottom-1 left-2 text-xs text-white/70 font-medium">Ahmed (Dubai)</div>
                <div className="absolute top-1 right-1 flex items-center gap-1 bg-black/40 rounded px-1.5 py-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white/60">HD</span>
                </div>
              </div>
              <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-orange-900/40 to-orange-800/20 aspect-video flex items-center justify-center border border-orange-500/20">
                <div className="w-10 h-10 rounded-full bg-orange-500/30 flex items-center justify-center">
                  <Factory className="w-5 h-5 text-orange-300" />
                </div>
                <div className="absolute bottom-1 left-2 text-xs text-white/70 font-medium">Li Wei (Shenzhen)</div>
              </div>
            </div>

            {/* AI Translation Bar */}
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-2.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs text-violet-300 font-semibold">AI Real-time Translation</span>
              </div>
              <div className="text-xs text-white/70 italic">"我们可以提供500件起订量，交货期30天..."</div>
              <div className="text-xs text-cyan-300 mt-1">→ "We can offer MOQ 500 pcs, 30-day lead time..."</div>
            </div>

            {/* Participants */}
            <div className="flex items-center justify-between text-xs text-white/40">
              <span>3 participants · 00:24:17</span>
              <div className="flex gap-2">
                <div className="px-2 py-1 rounded bg-white/5 text-white/60">🎤 Mute</div>
                <div className="px-2 py-1 rounded bg-red-500/20 text-red-400">End</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-4 h-4 text-violet-400" />
              <span className="text-sm font-semibold text-white">AI Meeting Summary</span>
              <span className="ml-auto text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Generated</span>
            </div>
            {[
              { label: "Key Agreement", content: "MOQ: 500 pcs @ $12.50/unit, Net 30 payment terms" },
              { label: "Action Items", content: "Factory to send samples by Friday; Buyer to confirm specs" },
              { label: "Next Steps", content: "Follow-up call scheduled: Dec 15, 10:00 AM GST" },
            ].map(({ label, content }) => (
              <div key={label} className="bg-white/5 rounded-lg p-2.5 border border-white/5">
                <div className="text-xs text-violet-400 font-semibold mb-1">{label}</div>
                <div className="text-xs text-white/70">{content}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10 aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mx-auto mb-2">
                  <FileText className="w-6 h-6 text-violet-400" />
                </div>
                <div className="text-xs text-white/50">Interactive whiteboard</div>
                <div className="text-xs text-white/30 mt-1">Draw · Annotate · Share specs</div>
              </div>
            </div>
            <div className="flex gap-2">
              {["✏️ Draw", "📐 Measure", "📎 Attach"].map(tool => (
                <button key={tool} className="flex-1 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors">{tool}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [factoryPage, setFactoryPage] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const factoriesPerPage = 3;
  const totalPages = Math.ceil(FACTORIES.length / factoriesPerPage);
  const visibleFactories = FACTORIES.slice(factoryPage * factoriesPerPage, (factoryPage + 1) * factoriesPerPage);

  return (
    <div className="min-h-screen bg-[#07050f] text-white overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "bg-[#07050f]/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
              <Globe2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              RealSourcing
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            {["Features", "How It Works", "Pricing", "About"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(" ", "-")}`} className="hover:text-white transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2">Sign In</button>
            </Link>
            <Link href="/register">
              <ShimmerButton
                className="text-sm px-5 py-2 font-semibold"
                background="linear-gradient(135deg, #7c3aed, #4f46e5)"
                shimmerColor="#a78bfa"
              >
                Get Started Free
              </ShimmerButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Particle Background */}
        <Particles className="absolute inset-0 z-0" quantity={120} color="#7c3aed" size={0.5} staticity={30} />

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-8">
              <BlurFade delay={0.1} inView>
                <AnimatedGradientText className="w-fit">
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-violet-300" />
                  <span className="text-sm font-medium text-white/80">
                    The Future of Global Sourcing is Here
                  </span>
                </AnimatedGradientText>
              </BlurFade>

              <BlurFade delay={0.2} inView>
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight">
                  <span className="text-white">Source Smarter.</span>
                  <br />
                  <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                    Negotiate Live.
                  </span>
                  <br />
                  <span className="text-white/80">Close Faster.</span>
                </h1>
              </BlurFade>

              <BlurFade delay={0.3} inView>
                <p className="text-lg text-white/55 leading-relaxed max-w-lg">
                  Connect with 2,500+ verified Chinese factories through live video webinars, AI-powered matching, and real-time translation. No flights. No middlemen. No language barriers.
                </p>
              </BlurFade>

              <BlurFade delay={0.4} inView>
                <div className="flex flex-wrap gap-4">
                  <Link href="/register">
                    <ShimmerButton
                      className="text-base px-7 py-3.5 font-bold"
                      background="linear-gradient(135deg, #7c3aed, #4f46e5)"
                      shimmerColor="#a78bfa"
                    >
                      Start Sourcing Free
                      <ArrowRight className="ml-2 w-4 h-4 inline" />
                    </ShimmerButton>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-3 px-6 py-3.5 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all text-base font-medium bg-white/5 backdrop-blur-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <Play className="w-3.5 h-3.5 ml-0.5" />
                    </div>
                    Watch Demo
                  </motion.button>
                </div>
              </BlurFade>

              <BlurFade delay={0.5} inView>
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex -space-x-2">
                    {["SJ", "KW", "AA", "EC", "PD"].map((initials, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 border-2 border-[#07050f] flex items-center justify-center text-xs font-bold text-white">
                        {initials[0]}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-white/50">
                    <span className="text-white font-semibold">10,000+</span> buyers trust RealSourcing
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                      <span className="ml-1 text-yellow-400 font-semibold">4.9/5</span>
                    </div>
                  </div>
                </div>
              </BlurFade>
            </div>

            {/* Right: Product Mock UI */}
            <BlurFade delay={0.3} inView>
              <div className="relative">
                <WebinarMockUI />
                {/* Floating Cards */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-6 top-16 bg-[#1a1628]/90 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Deal Closed!</div>
                      <div className="text-xs text-white/50">$45,000 · 2 min ago</div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -right-4 bottom-20 bg-[#1a1628]/90 backdrop-blur-sm border border-white/10 rounded-xl p-3 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-violet-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">AI Matched</div>
                      <div className="text-xs text-white/50">5 factories found</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </BlurFade>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
        >
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </section>

      {/* ── Live Activity Marquee ── */}
      <section className="py-6 border-y border-white/5 bg-white/[0.02] overflow-hidden">
        <Marquee pauseOnHover className="[--duration:35s]" repeat={3}>
          {LIVE_ACTIVITIES.map((activity, i) => (
            <div key={i} className="flex items-center gap-3 mx-6 px-4 py-2 rounded-full bg-white/5 border border-white/10 whitespace-nowrap">
              <span className="text-lg">{activity.flag}</span>
              <span className="text-sm font-semibold text-white">{activity.name}</span>
              <span className="text-sm text-white/50">{activity.action}</span>
              <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{activity.time}</span>
            </div>
          ))}
        </Marquee>
      </section>

      {/* ── Stats Section ── */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: 2500, suffix: "+", label: "Verified Factories", icon: Factory, color: "text-violet-400" },
            { value: 10000, suffix: "+", label: "Global Buyers", icon: Users, color: "text-cyan-400" },
            { value: 500, suffix: "M+", label: "GMV Facilitated", prefix: "$", icon: TrendingUp, color: "text-green-400" },
            { value: 50, suffix: "+", label: "Languages Supported", icon: Globe2, color: "text-orange-400" },
          ].map(({ value, suffix, label, icon: Icon, color, prefix }, i) => (
            <BlurFade key={label} delay={0.1 * i} inView>
              <MagicCard className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center" gradientColor="#1a1628">
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-4xl font-black text-white mb-1">
                  {prefix && <span>{prefix}</span>}
                  <NumberTicker value={value} className="text-4xl font-black text-white" />
                  <span>{suffix}</span>
                </div>
                <div className="text-sm text-white/50">{label}</div>
              </MagicCard>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ── AI Matching Demo ── */}
      <section className="py-20 max-w-7xl mx-auto px-6" id="features">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <BlurFade delay={0.1} inView>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium">
                <Bot className="w-4 h-4" />
                AI-Powered Matching
              </div>
              <h2 className="text-4xl font-black text-white leading-tight">
                Your AI Procurement<br />
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  Assistant Never Sleeps
                </span>
              </h2>
              <p className="text-white/55 leading-relaxed">
                Describe what you need in plain language. Our AI analyzes your requirements against 2,500+ factory profiles, certifications, and past performance data to surface the perfect matches—in seconds.
              </p>
              <ul className="space-y-3">
                {[
                  "Analyzes 50+ matching parameters per factory",
                  "Learns from your feedback to improve over time",
                  "Filters by MOQ, certifications, lead time & more",
                  "Generates comparison reports automatically",
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-white/70 text-sm">
                    <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-violet-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </BlurFade>
          <BlurFade delay={0.2} inView>
            <AIMatchingDemo />
          </BlurFade>
        </div>
      </section>

      {/* ── Factory Showcase ── */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <BlurFade delay={0.1} inView>
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-sm font-medium mb-4">
                  <Award className="w-4 h-4" />
                  Featured Factories
                </div>
                <h2 className="text-4xl font-black text-white">
                  Top-Rated Suppliers<br />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Ready to Connect</span>
                </h2>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFactoryPage(p => Math.max(0, p - 1))}
                  disabled={factoryPage === 0}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFactoryPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={factoryPage === totalPages - 1}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </BlurFade>

          <div className="grid md:grid-cols-3 gap-6">
            <AnimatePresence mode="wait">
              {visibleFactories.map((factory, i) => (
                <motion.div
                  key={factory.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <MagicCard className={`p-6 rounded-2xl bg-gradient-to-br ${factory.color} border border-white/10 h-full flex flex-col`} gradientColor="#1e1a2e">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-white text-lg">{factory.name}</h3>
                        <p className="text-white/50 text-sm mt-0.5">{factory.location}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2 py-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-bold text-yellow-400">{factory.rating}</span>
                      </div>
                    </div>

                    <div className="text-xs text-white/40 mb-3">{factory.category}</div>
                    <div className="text-sm text-white/70 mb-4 flex-1">{factory.specialty}</div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {factory.certifications.map(cert => (
                        <span key={cert} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/10">{cert}</span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-white/50 mb-4">
                      <span>MOQ: <span className="text-white/80 font-medium">{factory.moq}</span></span>
                      <span>Response: <span className="text-green-400 font-medium">{factory.response}</span></span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/10"
                    >
                      Book Live Inspection →
                    </motion.button>
                  </MagicCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── Globe Section ── */}
      <section className="py-20 max-w-7xl mx-auto px-6 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <BlurFade delay={0.1} inView>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-300 text-sm font-medium">
                <Globe2 className="w-4 h-4" />
                Global Network
              </div>
              <h2 className="text-4xl font-black text-white leading-tight">
                Sourcing Across<br />
                <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                  Every Continent
                </span>
              </h2>
              <p className="text-white/55 leading-relaxed">
                Our network spans 30+ countries with factories in China, Vietnam, India, Bangladesh, and beyond. Buyers from 80+ countries trust RealSourcing to connect them with the world's best manufacturers.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Factory Countries", value: "15+" },
                  { label: "Buyer Countries", value: "80+" },
                  { label: "Active Webinars/Month", value: "1,200+" },
                  { label: "Avg. Response Time", value: "< 2hrs" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="text-2xl font-black text-white">{value}</div>
                    <div className="text-xs text-white/50 mt-1">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </BlurFade>

          <BlurFade delay={0.2} inView>
            <div className="relative h-[400px] flex items-center justify-center">
              <Globe className="top-0" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07050f] pointer-events-none" />
            </div>
          </BlurFade>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5" id="how-it-works">
        <div className="max-w-7xl mx-auto px-6">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-white mb-4">
                From Idea to Deal in{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">3 Simple Steps</span>
              </h2>
              <p className="text-white/50 max-w-xl mx-auto">No complex onboarding. Start sourcing in minutes.</p>
            </div>
          </BlurFade>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Bot,
                title: "Describe Your Needs",
                desc: "Tell our AI what you're looking for. Product type, quantity, certifications, budget—in plain language.",
                color: "from-violet-500 to-purple-600",
                glow: "shadow-violet-500/20",
              },
              {
                step: "02",
                icon: Video,
                title: "Connect via Live Webinar",
                desc: "Join a live video session with matched factories. Tour the floor, ask questions, negotiate in real-time.",
                color: "from-cyan-500 to-blue-600",
                glow: "shadow-cyan-500/20",
              },
              {
                step: "03",
                icon: Shield,
                title: "Close with Confidence",
                desc: "AI summarizes the meeting, generates contracts, and secures your payment with escrow protection.",
                color: "from-green-500 to-emerald-600",
                glow: "shadow-green-500/20",
              },
            ].map(({ step, icon: Icon, title, desc, color, glow }, i) => (
              <BlurFade key={step} delay={0.15 * i} inView>
                <MagicCard className="p-8 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center text-center" gradientColor="#1a1628">
                  <div className="text-5xl font-black text-white/5 mb-4">{step}</div>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-2xl ${glow}`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                  <p className="text-white/50 leading-relaxed text-sm">{desc}</p>
                </MagicCard>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">RealSourcing?</span>
            </h2>
            <p className="text-white/50">See how we stack up against traditional sourcing methods</p>
          </div>
        </BlurFade>

        <BlurFade delay={0.2} inView>
          <div className="rounded-2xl overflow-hidden border border-white/10">
            <div className="grid grid-cols-4 bg-white/5 border-b border-white/10">
              <div className="p-4 text-sm font-semibold text-white/50">Feature</div>
              <div className="p-4 text-center">
                <div className="text-sm font-bold text-violet-400">RealSourcing</div>
                <div className="text-xs text-white/30 mt-0.5">AI-Powered Platform</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-sm font-semibold text-white/50">Alibaba</div>
                <div className="text-xs text-white/30 mt-0.5">Marketplace</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-sm font-semibold text-white/50">Trade Shows</div>
                <div className="text-xs text-white/30 mt-0.5">Traditional</div>
              </div>
            </div>
            {COMPARISON_DATA.map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-4 border-b border-white/5 ${i % 2 === 0 ? "bg-white/[0.02]" : ""}`}>
                <div className="p-4 text-sm text-white/70">{row.feature}</div>
                <div className="p-4 flex justify-center">
                  {row.rs ? <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-violet-400" /></div> : <X className="w-4 h-4 text-white/20" />}
                </div>
                <div className="p-4 flex justify-center">
                  {row.ali ? <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white/50" /></div> : <X className="w-4 h-4 text-white/20" />}
                </div>
                <div className="p-4 flex justify-center">
                  {row.trade ? <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"><Check className="w-3.5 h-3.5 text-white/50" /></div> : <X className="w-4 h-4 text-white/20" />}
                </div>
              </div>
            ))}
          </div>
        </BlurFade>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <BlurFade delay={0.1} inView>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-white mb-4">
                Trusted by Buyers{" "}
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Worldwide</span>
              </h2>
            </div>
          </BlurFade>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
              >
                <div className="flex justify-center mb-4">
                  {[...Array(TESTIMONIALS[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-white/80 text-lg leading-relaxed italic mb-6">
                  "{TESTIMONIALS[currentTestimonial].text}"
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {TESTIMONIALS[currentTestimonial].avatar}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">
                      {TESTIMONIALS[currentTestimonial].flag} {TESTIMONIALS[currentTestimonial].name}
                    </div>
                    <div className="text-sm text-white/50">
                      {TESTIMONIALS[currentTestimonial].title} · {TESTIMONIALS[currentTestimonial].company}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === currentTestimonial ? "bg-violet-400 w-6" : "bg-white/20"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20 max-w-7xl mx-auto px-6" id="pricing">
        <BlurFade delay={0.1} inView>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white mb-4">
              Simple,{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Transparent Pricing</span>
            </h2>
            <p className="text-white/50">Start free. Scale as you grow.</p>
          </div>
        </BlurFade>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            {
              name: "Starter",
              price: "Free",
              period: "forever",
              features: ["5 factory connections/month", "3 webinar sessions", "AI matching (basic)", "Email support"],
              cta: "Get Started",
              highlighted: false,
            },
            {
              name: "Professional",
              price: "$199",
              period: "/month",
              features: ["Unlimited connections", "Unlimited webinars", "AI matching (advanced)", "Real-time translation", "AI meeting summaries", "Priority support"],
              cta: "Start Free Trial",
              highlighted: true,
            },
            {
              name: "Enterprise",
              price: "Custom",
              period: "",
              features: ["Everything in Pro", "Dedicated account manager", "Custom AI training", "White-label option", "API access", "SLA guarantee"],
              cta: "Contact Sales",
              highlighted: false,
            },
          ].map(({ name, price, period, features, cta, highlighted }) => (
            <BlurFade key={name} delay={0.1} inView>
              <MagicCard
                className={`p-8 rounded-2xl border flex flex-col h-full ${highlighted ? "bg-gradient-to-b from-violet-600/20 to-purple-600/10 border-violet-500/30" : "bg-white/5 border-white/10"}`}
                gradientColor={highlighted ? "#2d1b69" : "#1a1628"}
              >
                {highlighted && (
                  <div className="text-center mb-4">
                    <span className="text-xs font-bold text-violet-300 bg-violet-500/20 px-3 py-1 rounded-full border border-violet-500/30">MOST POPULAR</span>
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-lg font-bold text-white/70 mb-2">{name}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{price}</span>
                    <span className="text-white/40 text-sm">{period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm text-white/70">
                      <Check className={`w-4 h-4 flex-shrink-0 ${highlighted ? "text-violet-400" : "text-white/40"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  {highlighted ? (
                    <ShimmerButton
                      className="w-full py-3 font-bold text-sm"
                      background="linear-gradient(135deg, #7c3aed, #4f46e5)"
                      shimmerColor="#a78bfa"
                    >
                      {cta}
                    </ShimmerButton>
                  ) : (
                    <button className="w-full py-3 rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all text-sm font-semibold">
                      {cta}
                    </button>
                  )}
                </Link>
              </MagicCard>
            </BlurFade>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-white/[0.02] border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <BlurFade delay={0.1} inView>
            <h2 className="text-4xl font-black text-white text-center mb-12">
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Questions</span>
            </h2>
          </BlurFade>
          <div className="space-y-3">
            {[
              { q: "How are factories verified on RealSourcing?", a: "Every factory undergoes a multi-step verification process including business license checks, ISO certification validation, and an initial video inspection by our team. We also collect and display verified buyer reviews." },
              { q: "Do I need to speak Chinese to use the platform?", a: "Not at all. Our AI provides real-time translation in 50+ languages during live webinars. You can negotiate directly with Chinese factory owners in your native language." },
              { q: "What happens if there's a dispute with a factory?", a: "All transactions are protected by our escrow system. Funds are only released when you confirm receipt and satisfaction. Our dispute resolution team is available 24/7." },
              { q: "Can I visit factories in person after connecting online?", a: "Absolutely. Many buyers use RealSourcing to shortlist factories online and then visit in person. We can also arrange guided factory tours through our local partners." },
              { q: "How does the AI matching algorithm work?", a: "Our AI analyzes your product requirements, quality standards, budget, and timeline against detailed factory profiles including production capacity, certifications, past orders, and buyer ratings to surface the best matches." },
            ].map(({ q, a }, i) => (
              <BlurFade key={i} delay={0.05 * i} inView>
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-semibold text-white text-sm">{q}</span>
                    <ChevronDown className={`w-4 h-4 text-white/40 flex-shrink-0 ml-4 transition-transform ${faqOpen === i ? "rotate-180" : ""}`} />
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
                        <div className="px-5 pb-5 text-sm text-white/55 leading-relaxed border-t border-white/5">{a}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-32 relative overflow-hidden">
        <Particles className="absolute inset-0" quantity={60} color="#7c3aed" size={0.6} />
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 via-transparent to-cyan-900/20 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <BlurFade delay={0.1} inView>
            <h2 className="text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
              Ready to Transform<br />
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Your Sourcing Strategy?
              </span>
            </h2>
            <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto">
              Join 10,000+ global buyers who source smarter with RealSourcing. Start free, no credit card required.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/register">
                <ShimmerButton
                  className="text-lg px-10 py-4 font-bold"
                  background="linear-gradient(135deg, #7c3aed, #4f46e5)"
                  shimmerColor="#a78bfa"
                >
                  Start Sourcing for Free
                  <ArrowRight className="ml-2 w-5 h-5 inline" />
                </ShimmerButton>
              </Link>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-lg px-10 py-4 rounded-full border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-all font-medium"
              >
                Schedule a Demo
              </motion.button>
            </div>
            <p className="text-white/30 text-sm mt-6">No credit card required · Free forever plan · Cancel anytime</p>
          </BlurFade>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-16 bg-[#05030c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
                  <Globe2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">RealSourcing</span>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                The world's first AI-powered live sourcing platform connecting global buyers with verified Chinese manufacturers.
              </p>
            </div>
            {[
              { title: "Platform", links: ["Features", "How It Works", "Pricing", "Security"] },
              { title: "Company", links: ["About Us", "Blog", "Careers", "Press"] },
              { title: "Support", links: ["Help Center", "Contact", "Privacy Policy", "Terms"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <h4 className="font-semibold text-white mb-4 text-sm">{title}</h4>
                <ul className="space-y-2">
                  {links.map(link => (
                    <li key={link}><a href="#" className="text-white/40 hover:text-white/70 transition-colors text-sm">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">© 2025 RealSourcing. All rights reserved.</p>
            <div className="flex items-center gap-4 text-white/30 text-sm">
              <span>🌍 English</span>
              <span>·</span>
              <span>ISO 27001 Certified</span>
              <span>·</span>
              <span>SOC 2 Type II</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
