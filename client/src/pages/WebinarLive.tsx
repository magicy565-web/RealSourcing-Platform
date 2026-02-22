import { useState, useEffect, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { WebinarProvider } from '@/contexts/WebinarContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Users, Heart, ArrowLeft, Square, Package,
  MessageSquare, Target, Zap, TrendingUp, Globe,
  ChevronRight, Flame, Eye, BarChart3, Activity,
  CheckCircle2, Clock, Send, Star, ShoppingBag
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Mock 数据
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_LEADS = [
  {
    id: 1,
    buyerName: 'Ahmed Al-Maktoum',
    buyerEmail: 'ahmed@dubai-retail.ae',
    country: '🇦🇪',
    city: 'Dubai',
    productName: 'LED美白面膜仪',
    quantity: '100 units',
    value: '$850',
    status: 'hot',
    time: '2 min ago',
    avatar: 'A',
  },
  {
    id: 2,
    buyerName: 'Sarah Jenkins',
    buyerEmail: 'sarah@london-beauty.co.uk',
    country: '🇬🇧',
    city: 'London',
    productName: 'LED美白面膜仪',
    quantity: '50 units',
    value: '$425',
    status: 'warm',
    time: '8 min ago',
    avatar: 'S',
  },
  {
    id: 3,
    buyerName: 'Omar Hassan',
    buyerEmail: 'omar@abu-dhabi-tech.com',
    country: '🇦🇪',
    city: 'Abu Dhabi',
    productName: '磁吸无线充电器',
    quantity: '200 units',
    value: '$1,240',
    status: 'hot',
    time: '15 min ago',
    avatar: 'O',
  },
  {
    id: 4,
    buyerName: 'Priya Sharma',
    buyerEmail: 'priya@mumbai-brands.in',
    country: '🇮🇳',
    city: 'Mumbai',
    productName: '迷你空气炸锅',
    quantity: '30 units',
    value: '$384',
    status: 'new',
    time: '22 min ago',
    avatar: 'P',
  },
];

const PRODUCTS = [
  { id: 1, name: 'LED美白面膜仪', nameEn: 'LED Glow Mask', emoji: '✨', price: '$8.50', moq: '50 pcs', slots: 3, viralScore: 98, color: 'from-violet-500 to-purple-600', accent: '#a78bfa', glow: 'rgba(167,139,250,0.3)' },
  { id: 2, name: '磁吸无线充电器', nameEn: 'MagSafe Charger', emoji: '⚡', price: '$6.20', moq: '100 pcs', slots: 5, viralScore: 94, color: 'from-cyan-500 to-blue-600', accent: '#67e8f9', glow: 'rgba(103,232,249,0.3)' },
  { id: 3, name: '迷你空气炸锅', nameEn: 'Mini Air Fryer', emoji: '🍟', price: '$12.80', moq: '30 pcs', slots: 7, viralScore: 89, color: 'from-orange-500 to-amber-600', accent: '#fb923c', glow: 'rgba(251,146,60,0.3)' },
];

const CHAT_MESSAGES = [
  { id: 1, name: 'Ahmed', msg: 'What is the MOQ for the LED mask?', time: '13:42', flag: '🇦🇪' },
  { id: 2, name: 'Sarah', msg: 'Can you do custom packaging?', time: '13:43', flag: '🇬🇧' },
  { id: 3, name: 'Omar', msg: 'I need 200 units of the charger ASAP', time: '13:44', flag: '🇦🇪' },
  { id: 4, name: 'Priya', msg: 'What certifications does the air fryer have?', time: '13:45', flag: '🇮🇳' },
  { id: 5, name: 'James', msg: 'Is there a sample available?', time: '13:46', flag: '🇺🇸' },
];

// ─────────────────────────────────────────────────────────────────────────────
// 实时指标卡片（Glassmorphism Bento）
// ─────────────────────────────────────────────────────────────────────────────
function MetricCard({
  icon, label, value, sub, accent, glow, trend
}: {
  icon: React.ReactNode; label: string; value: string | number;
  sub?: string; accent: string; glow: string; trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 flex flex-col gap-1 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${accent}25`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${accent}10`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div className="flex items-center justify-between mb-1">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18` }}>
          {icon}
        </div>
        {trend && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-white font-black text-2xl leading-none">{value}</p>
      <p className="text-white/40 text-xs">{label}</p>
      {sub && <p className="text-white/25 text-[10px]">{sub}</p>}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 线索卡片
// ─────────────────────────────────────────────────────────────────────────────
function LeadCard({ lead, index }: { lead: typeof MOCK_LEADS[0]; index: number }) {
  const statusConfig = {
    hot: { label: 'HOT', bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
    warm: { label: 'WARM', bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: 'rgba(245,158,11,0.25)' },
    new: { label: 'NEW', bg: 'rgba(99,102,241,0.12)', color: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  }[lead.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl p-3.5 mb-2"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* 头像 */}
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white' }}>
          {lead.avatar}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-white text-sm font-semibold truncate">{lead.buyerName}</p>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: statusConfig.bg, color: statusConfig.color, border: `1px solid ${statusConfig.border}` }}>
              {statusConfig.label}
            </span>
          </div>
          <p className="text-white/35 text-xs mb-1.5">{lead.country} {lead.city} · {lead.time}</p>
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-xs truncate">{lead.productName}</span>
            <span className="text-white/25 text-xs">·</span>
            <span className="text-white/60 text-xs">{lead.quantity}</span>
            <span className="text-emerald-400 text-xs font-bold ml-auto">{lead.value}</span>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 mt-3">
        <a
          href={`https://wa.me/?text=Hi+${lead.buyerName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(37,211,102,0.12)', color: '#4ade80', border: '1px solid rgba(37,211,102,0.20)' }}
        >
          <MessageSquare className="w-3 h-3" />
          WhatsApp
        </a>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.20)' }}>
          <Send className="w-3 h-3" />
          发报价
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 主播端控制台主体
// ─────────────────────────────────────────────────────────────────────────────
function WebinarLiveContent({ webinarId = 1 }: { webinarId?: number }) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'chat' | 'leads'>('leads');
  const [isLive, setIsLive] = useState(false);
  const [activeProductIdx, setActiveProductIdx] = useState(0);
  const [viewerCount, setViewerCount] = useState(1247);
  const [likeCount, setLikeCount] = useState(3847);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 直播计时器
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        // 模拟实时数据波动
        if (Math.random() > 0.7) setViewerCount(prev => prev + Math.floor(Math.random() * 5 - 1));
        if (Math.random() > 0.5) setLikeCount(prev => prev + Math.floor(Math.random() * 8));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLive]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const activeProduct = PRODUCTS[activeProductIdx];

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)',
        fontFamily: "'Inter', 'DM Sans', sans-serif",
      }}
    >
      {/* 背景网格 */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(124, 58, 237, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124, 58, 237, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* ══ 顶部导航栏 ══ */}
      <div
        className="relative z-10 flex items-center justify-between px-6 py-3 flex-shrink-0"
        style={{
          background: 'rgba(5, 3, 16, 0.85)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* 左侧：返回 + 标题 */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation('/')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-white font-bold text-sm">迪拜专场 · 中东TikTok爆款源头工厂直连</h1>
              {isLive ? (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)' }}
                >
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  <span className="text-red-400 text-[10px] font-bold tracking-wider">LIVE</span>
                  <span className="text-red-400/70 text-[10px] font-mono">{formatTime(elapsedTime)}</span>
                </motion.div>
              ) : (
                <span className="text-white/25 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  待开播
                </span>
              )}
            </div>
            <p className="text-white/25 text-xs mt-0.5">主播控制台 · 演示模式</p>
          </div>
        </div>

        {/* 右侧：开播按钮 */}
        <motion.button
          onClick={() => setIsLive(!isLive)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
          style={isLive ? {
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.30)',
            color: '#f87171',
          } : {
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            boxShadow: '0 4px 20px rgba(239,68,68,0.35)',
          }}
        >
          {isLive ? (
            <><Square className="w-4 h-4" /> 结束直播</>
          ) : (
            <><Radio className="w-4 h-4" /> 开始直播</>
          )}
        </motion.button>
      </div>

      {/* ══ 主体 Bento Grid ══ */}
      <div className="relative z-10 flex-1 p-5 overflow-auto">
        <div className="grid grid-cols-12 gap-4 max-w-[1600px] mx-auto">

          {/* ── 指标行（4列） ── */}
          <div className="col-span-3">
            <MetricCard
              icon={<Eye className="w-4 h-4" style={{ color: '#67e8f9' }} />}
              label="实时在线"
              value={viewerCount.toLocaleString()}
              sub="当前直播间"
              accent="#67e8f9"
              glow="rgba(103,232,249,0.3)"
              trend={isLive ? '+12' : undefined}
            />
          </div>
          <div className="col-span-3">
            <MetricCard
              icon={<Heart className="w-4 h-4" style={{ color: '#f472b6' }} />}
              label="累计点赞"
              value={likeCount.toLocaleString()}
              sub="本场直播"
              accent="#f472b6"
              glow="rgba(244,114,182,0.3)"
              trend={isLive ? '+48' : undefined}
            />
          </div>
          <div className="col-span-3">
            <MetricCard
              icon={<Target className="w-4 h-4" style={{ color: '#fb923c' }} />}
              label="意向线索"
              value={MOCK_LEADS.length}
              sub="待跟进"
              accent="#fb923c"
              glow="rgba(251,146,60,0.3)"
              trend="↑ 热度"
            />
          </div>
          <div className="col-span-3">
            <MetricCard
              icon={<TrendingUp className="w-4 h-4" style={{ color: '#4ade80' }} />}
              label="预估成交额"
              value="$2,899"
              sub="本场汇总"
              accent="#4ade80"
              glow="rgba(74,222,128,0.3)"
              trend="+61.7%"
            />
          </div>

          {/* ── 视频预览区（左侧，7列） ── */}
          <div className="col-span-7 flex flex-col gap-4">
            {/* 视频预览 */}
            <div
              className="rounded-2xl overflow-hidden relative flex items-center justify-center"
              style={{
                aspectRatio: '16/9',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              }}
            >
              {/* 背景渐变 */}
              <div className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${activeProduct.glow} 0%, transparent 70%)`,
                }}
              />
              {/* 网格 */}
              <div className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(124, 58, 237, 0.08) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(124, 58, 237, 0.08) 1px, transparent 1px)
                  `,
                  backgroundSize: '24px 24px',
                }}
              />

              {/* 中心内容 */}
              <div className="relative text-center">
                <motion.div
                  animate={isLive ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-7xl mb-4"
                >
                  {activeProduct.emoji}
                </motion.div>
                <p className="text-white/60 text-sm font-medium">{activeProduct.name}</p>
                <p className="text-white/30 text-xs mt-1">{isLive ? '直播中 · 正在推介' : '摄像头预览就绪'}</p>
              </div>

              {/* 直播状态叠层 */}
              {isLive && (
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
                    style={{ background: 'rgba(239,68,68,0.20)', border: '1px solid rgba(239,68,68,0.35)' }}
                  >
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    <span className="text-red-400 text-[10px] font-bold">LIVE</span>
                  </motion.div>
                  <span className="text-white/50 text-[10px] font-mono">{formatTime(elapsedTime)}</span>
                </div>
              )}

              {/* 右下角：在线人数 */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                <Users className="w-3 h-3 text-white/50" />
                <span className="text-white/70 text-xs font-medium">{viewerCount.toLocaleString()}</span>
              </div>
            </div>

            {/* 选品控制台 */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-violet-400" />
                  <span className="text-white font-bold text-sm">选品推介台</span>
                </div>
                <span className="text-white/30 text-xs">点击切换当前推介产品</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {PRODUCTS.map((p, i) => (
                  <motion.button
                    key={p.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveProductIdx(i)}
                    className="rounded-xl p-3.5 text-left relative overflow-hidden"
                    style={{
                      background: i === activeProductIdx ? `${p.accent}15` : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${i === activeProductIdx ? `${p.accent}40` : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: i === activeProductIdx ? `0 0 20px ${p.glow}` : 'none',
                    }}
                  >
                    {i === activeProductIdx && (
                      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${p.color}`} />
                    )}
                    <div className="text-2xl mb-2">{p.emoji}</div>
                    <p className="text-white text-xs font-bold leading-tight mb-1">{p.name}</p>
                    <p className="text-white/40 text-[10px] mb-2">{p.nameEn}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-sm">{p.price}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                        {p.viralScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-white/30 text-[10px]">MOQ {p.moq}</span>
                      <span className="text-white/20 text-[10px]">·</span>
                      <span className="text-amber-400/80 text-[10px]">剩{p.slots}名额</span>
                    </div>
                    {i === activeProductIdx && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: p.accent }} />
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* ── 右侧边栏（5列） ── */}
          <div className="col-span-5 flex flex-col gap-4">
            {/* 标签切换 */}
            <div
              className="rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                minHeight: '520px',
              }}
            >
              {/* Tab 头 */}
              <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                {[
                  { id: 'leads', icon: <Target className="w-3.5 h-3.5" />, label: '意向线索', count: MOCK_LEADS.length },
                  { id: 'chat', icon: <MessageSquare className="w-3.5 h-3.5" />, label: '直播聊天', count: CHAT_MESSAGES.length },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className="flex-1 py-3.5 flex items-center justify-center gap-2 text-xs font-semibold transition-all relative"
                    style={{
                      color: activeTab === tab.id ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                      background: activeTab === tab.id ? 'rgba(167,139,250,0.06)' : 'transparent',
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                    <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={{
                        background: activeTab === tab.id ? 'rgba(167,139,250,0.20)' : 'rgba(255,255,255,0.08)',
                        color: activeTab === tab.id ? '#a78bfa' : 'rgba(255,255,255,0.35)',
                      }}>
                      {tab.count}
                    </span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-violet-400" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab 内容 */}
              <div className="flex-1 overflow-y-auto p-3">
                <AnimatePresence mode="wait">
                  {activeTab === 'leads' && (
                    <motion.div
                      key="leads"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {MOCK_LEADS.map((lead, i) => (
                        <LeadCard key={lead.id} lead={lead} index={i} />
                      ))}
                    </motion.div>
                  )}
                  {activeTab === 'chat' && (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-2"
                    >
                      {CHAT_MESSAGES.map((msg, i) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.03)' }}
                        >
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {msg.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-violet-300 text-xs font-semibold">{msg.flag} {msg.name}</span>
                              <span className="text-white/20 text-[10px]">{msg.time}</span>
                            </div>
                            <p className="text-white/70 text-xs leading-relaxed">{msg.msg}</p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* FOMO 引擎快捷发射 */}
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-white font-bold text-sm">FOMO 引擎</span>
                <span className="text-white/30 text-xs ml-auto">一键广播</span>
              </div>
              <div className="space-y-2">
                {[
                  '🔥 仅剩 3 个测试名额，先到先得！',
                  '⚡ 刚刚有迪拜买家锁定了 100 件！',
                  '🚀 本场限时价，直播结束后恢复原价！',
                ].map((msg, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left text-xs"
                    style={{
                      background: 'rgba(251,146,60,0.06)',
                      border: '1px solid rgba(251,146,60,0.15)',
                      color: 'rgba(255,255,255,0.65)',
                    }}
                  >
                    <Send className="w-3 h-3 text-orange-400 shrink-0" />
                    {msg}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 页面入口
// ─────────────────────────────────────────────────────────────────────────────
export default function WebinarLive() {
  const [, params] = useRoute('/webinar/:id/host');
  const webinarId = params?.id ? parseInt(params.id) : 1;

  return (
    <WebinarProvider
      webinarId={webinarId}
      userId={1}
      role="host"
    >
      <WebinarLiveContent webinarId={webinarId} />
    </WebinarProvider>
  );
}
