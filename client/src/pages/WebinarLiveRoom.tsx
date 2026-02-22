import { useState, useCallback, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { WebinarProvider, useWebinar } from '@/contexts/WebinarContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Users, Wifi, X, TrendingUp, Zap, ChevronUp,
  Flame, Star, ShoppingBag, MessageCircle, Heart, Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ─────────────────────────────────────────────────────────────────────────────
// TikTok 爆款情报数据（迪拜专场）
// ─────────────────────────────────────────────────────────────────────────────
export const TIKTOK_INTEL_DATA = [
  {
    id: 1,
    name: 'LED美白面膜仪',
    nameEn: 'LED Glow Mask',
    emoji: '✨',
    tiktokViews: '48.2M',
    tiktokLikes: '3.1M',
    viralScore: 98,
    ctr: '12.4%',
    price: '$8.50',
    moq: '50 pcs',
    slots: 3,
    totalSlots: 10,
    category: '美妆仪器',
    trend: '+340%',
    color: 'from-violet-500 to-purple-600',
    accentColor: '#a78bfa',
    glowColor: 'rgba(167, 139, 250, 0.4)',
    videoThumb: 'https://picsum.photos/seed/mask/400/600',
  },
  {
    id: 2,
    name: '磁吸无线充电器',
    nameEn: 'MagSafe Wireless Charger',
    emoji: '⚡',
    tiktokViews: '31.7M',
    tiktokLikes: '2.4M',
    viralScore: 94,
    ctr: '9.8%',
    price: '$6.20',
    moq: '100 pcs',
    slots: 5,
    totalSlots: 15,
    category: '数码配件',
    trend: '+210%',
    color: 'from-cyan-500 to-blue-600',
    accentColor: '#67e8f9',
    glowColor: 'rgba(103, 232, 249, 0.4)',
    videoThumb: 'https://picsum.photos/seed/charger/400/600',
  },
  {
    id: 3,
    name: '迷你空气炸锅',
    nameEn: 'Mini Air Fryer',
    emoji: '🍟',
    tiktokViews: '22.9M',
    tiktokLikes: '1.8M',
    viralScore: 89,
    ctr: '8.1%',
    price: '$12.80',
    moq: '30 pcs',
    slots: 7,
    totalSlots: 20,
    category: '小家电',
    trend: '+180%',
    color: 'from-orange-500 to-amber-600',
    accentColor: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.4)',
    videoThumb: 'https://picsum.photos/seed/fryer/400/600',
  },
];

export const FOMO_SCRIPTS = [
  { delay: 10000,  message: '🔥 Ahmed (Dubai) just locked 100 units of LED Mask!', type: 'fomo' as const },
  { delay: 25000,  message: '⚡ NYC brand secured 50-unit test batch — only 2 slots left!', type: 'fomo' as const },
  { delay: 42000,  message: '🇦🇪 Riyadh seller grabbed the last MagSafe Charger batch!', type: 'fomo' as const },
  { delay: 60000,  message: '🚀 3 buyers competing for the same Air Fryer slot right now!', type: 'fomo' as const },
  { delay: 85000,  message: '💥 Flash price ends in 5 min — 2 LED Mask slots remaining!', type: 'fomo' as const },
  { delay: 110000, message: '🏆 Sarah from London just claimed her test batch. Smart move!', type: 'fomo' as const },
];

// ─────────────────────────────────────────────────────────────────────────────
// 弹幕消息组件（Glassmorphism 风格）
// ─────────────────────────────────────────────────────────────────────────────
function DanmuMessage({ msg }: { msg: { id: number; userName: string; message: string; type: string; avatar: string } }) {
  if (msg.type === 'fomo') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <span className="shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide">
          FOMO
        </span>
        <span className="text-amber-300 text-sm font-semibold drop-shadow-lg">{msg.message}</span>
      </motion.div>
    );
  }
  if (msg.type === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2"
      >
        <span className="text-white/40 text-xs italic">{msg.message}</span>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2"
    >
      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 ring-1 ring-white/20">
        {msg.avatar?.slice(0, 1) || '?'}
      </div>
      <span className="text-white/85 text-sm leading-snug">
        <span className="text-violet-300 font-semibold">{msg.userName} </span>
        {msg.message}
      </span>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TikTok 情报卡片（Glassmorphism 2.0）
// ─────────────────────────────────────────────────────────────────────────────
function TikTokIntelCard({ product, onClick }: { product: typeof TIKTOK_INTEL_DATA[0]; onClick: () => void }) {
  const slotsLeft = product.slots;
  const pct = Math.round((slotsLeft / product.totalSlots) * 100);

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="text-left w-48 overflow-hidden rounded-2xl"
      style={{
        background: 'rgba(15, 10, 30, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${product.accentColor}40`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${product.accentColor}20, 0 4px 24px ${product.glowColor}`,
      }}
    >
      {/* 顶部渐变条 */}
      <div className={`h-0.5 w-full bg-gradient-to-r ${product.color}`} />

      <div className="p-3">
        {/* 标题行 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3 h-3" style={{ color: product.accentColor }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: product.accentColor }}>
              TikTok 爆款
            </span>
          </div>
          <span className="text-[10px] font-bold text-white/50 bg-white/10 px-1.5 py-0.5 rounded-full">
            {product.trend} 🔺
          </span>
        </div>

        {/* 产品信息 */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-2xl">{product.emoji}</span>
          <div className="min-w-0">
            <p className="text-white text-xs font-bold leading-tight truncate">{product.name}</p>
            <p className="text-white/40 text-[10px]">{product.category}</p>
          </div>
        </div>

        {/* 数据网格 */}
        <div className="grid grid-cols-2 gap-1.5 mb-2.5">
          <div className="rounded-lg p-1.5 text-center" style={{ background: `${product.accentColor}15` }}>
            <p className="text-white text-xs font-bold">{product.tiktokViews}</p>
            <p className="text-white/40 text-[9px]">播放量</p>
          </div>
          <div className="rounded-lg p-1.5 text-center" style={{ background: 'rgba(34, 197, 94, 0.12)' }}>
            <p className="text-emerald-400 text-xs font-bold">{product.ctr}</p>
            <p className="text-white/40 text-[9px]">转化率</p>
          </div>
        </div>

        {/* 名额进度条 */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-white/40">测试名额</span>
            <span className="text-[9px] font-bold text-amber-400">仅剩 {slotsLeft}</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full bg-gradient-to-r ${product.color}`}
            />
          </div>
        </div>

        {/* 价格 */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-white font-bold text-sm">{product.price}</span>
          <span className="text-white/40 text-[9px]">MOQ {product.moq}</span>
        </div>
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 产品详情抽屉（Glassmorphism 底部弹出）
// ─────────────────────────────────────────────────────────────────────────────
function ProductDrawer({
  product,
  onClose,
  onClaim,
}: {
  product: typeof TIKTOK_INTEL_DATA[0] | null;
  onClose: () => void;
  onClaim: (product: typeof TIKTOK_INTEL_DATA[0]) => void;
}) {
  if (!product) return null;
  const slotsLeft = product.slots;
  const pct = Math.round((slotsLeft / product.totalSlots) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="max-h-[78vh] overflow-y-auto rounded-t-3xl"
        style={{
          background: 'rgba(10, 8, 20, 0.96)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: `1px solid ${product.accentColor}30`,
          borderBottom: 'none',
          boxShadow: `0 -8px 60px rgba(0,0,0,0.8), 0 0 0 1px ${product.accentColor}15`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部渐变条 */}
        <div className={`h-0.5 w-full bg-gradient-to-r ${product.color} rounded-t-3xl`} />

        <div className="p-6">
          {/* Handle */}
          <div className="w-10 h-1 bg-white/15 rounded-full mx-auto mb-5" />

          {/* 产品头部 */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: `${product.accentColor}20`, border: `1px solid ${product.accentColor}30` }}>
                {product.emoji}
              </div>
              <div>
                <h3 className="text-white font-bold text-xl leading-tight">{product.name}</h3>
                <p className="text-white/40 text-sm mt-0.5">{product.nameEn}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${product.accentColor}20`, color: product.accentColor, border: `1px solid ${product.accentColor}30` }}>
                    {product.category}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 病毒指数卡片 */}
          <div className="rounded-2xl p-4 mb-4"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.20)',
            }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-bold text-sm">TikTok 病毒指数</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-white font-bold text-sm">{product.viralScore}/100</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '总播放量', value: product.tiktokViews, color: 'text-white' },
                { label: '总点赞', value: product.tiktokLikes, color: 'text-pink-400' },
                { label: '点击率', value: product.ctr, color: 'text-emerald-400' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={`font-bold text-base ${stat.color}`}>{stat.value}</p>
                  <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 价格与MOQ */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: '工厂底价', value: product.price, sub: 'per unit', color: 'text-white' },
              { label: '最小起订量', value: product.moq, sub: 'minimum order', color: 'text-white' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl p-3.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-white/40 text-xs mb-1.5">{item.label}</p>
                <p className={`font-bold text-2xl ${item.color}`}>{item.value}</p>
                <p className="text-white/25 text-xs mt-0.5">{item.sub}</p>
              </div>
            ))}
          </div>

          {/* 名额进度条 */}
          <div className="rounded-xl p-4 mb-5"
            style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.20)' }}>
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-white/60 text-sm font-medium">测试批次名额</span>
              <span className="text-amber-400 font-bold text-sm">仅剩 {slotsLeft} 个</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${100 - pct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                className={`h-full rounded-full bg-gradient-to-r ${product.color}`}
              />
            </div>
            <p className="text-white/30 text-xs">{product.totalSlots - slotsLeft}/{product.totalSlots} 名额已被锁定</p>
          </div>

          {/* 抢单按钮 */}
          <motion.button
            onClick={() => onClaim(product)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${product.accentColor}, ${product.accentColor}cc)`,
              boxShadow: `0 8px 32px ${product.glowColor}, 0 0 0 1px ${product.accentColor}40`,
            }}
          >
            <span className="relative flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              抢占 {product.moq} 首单测试批次
            </span>
          </motion.button>
          <p className="text-center text-white/25 text-xs mt-3">0元锁定 · 供应链管家 WhatsApp 跟进</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 抢单成功弹窗（Glassmorphism + 金色辉光）
// ─────────────────────────────────────────────────────────────────────────────
function ClaimSuccessModal({
  product,
  onClose,
}: {
  product: typeof TIKTOK_INTEL_DATA[0] | null;
  onClose: () => void;
}) {
  if (!product) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(10, 8, 20, 0.97)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          boxShadow: '0 0 0 1px rgba(245, 158, 11, 0.15), 0 20px 80px rgba(0,0,0,0.8), 0 0 60px rgba(245, 158, 11, 0.15)',
        }}
      >
        {/* 顶部金色渐变条 */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />

        <div className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2, damping: 15 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>

          <h2 className="text-white font-bold text-2xl mb-1">名额已锁定！</h2>
          <p className="font-semibold text-lg mb-1" style={{ color: product.accentColor }}>{product.name}</p>
          <p className="text-white/40 text-sm mb-6">{product.moq} 首单测试批次</p>

          <div className="rounded-2xl p-4 mb-6 text-left"
            style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.20)' }}>
            <p className="text-emerald-400 font-semibold text-sm mb-2">✅ 接下来会发生什么？</p>
            <p className="text-white/60 text-sm leading-relaxed">
              我们的供应链管家将在 <strong className="text-white">2小时内</strong> 通过 WhatsApp 与您联系，确认订单细节和履约安排。
              <br /><br />
              <strong className="text-amber-400">无需预付款</strong>，直播结束后私域跟进。
            </p>
          </div>

          <motion.a
            href="https://wa.me/8613800138000?text=Hi%2C+I+just+claimed+a+test+batch+on+RealSourcing+Live!"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-base text-white mb-3"
            style={{
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              boxShadow: '0 4px 20px rgba(37, 211, 102, 0.35)',
            }}
          >
            <MessageCircle className="w-5 h-5" />
            立即 WhatsApp 确认
          </motion.a>

          <button
            onClick={onClose}
            className="text-white/30 text-sm hover:text-white/60 transition-colors"
          >
            稍后联系
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 主直播间内容（沉浸式竖屏 TikTok 布局 · Glassmorphism 2.0）
// ─────────────────────────────────────────────────────────────────────────────
function WebinarLiveRoomContent({ webinarId = 1 }: { webinarId?: number }) {
  const { messages, sendMessage, viewerCount, webinarTitle, factoryName, addFomoMessage } = useWebinar();

  const [activeIntelIndex, setActiveIntelIndex] = useState(0);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<typeof TIKTOK_INTEL_DATA[0] | null>(null);
  const [claimedProduct, setClaimedProduct] = useState<typeof TIKTOK_INTEL_DATA[0] | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [likeCount, setLikeCount] = useState(3847);
  const [likeParticles, setLikeParticles] = useState<{ id: number; x: number }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const particleIdRef = useRef(0);

  // 自动滚动聊天
  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  // 轮播情报卡片
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIntelIndex((prev) => (prev + 1) % TIKTOK_INTEL_DATA.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // 点赞粒子效果
  const handleLike = useCallback(() => {
    setLikeCount(prev => prev + 1);
    const id = ++particleIdRef.current;
    const x = 30 + Math.random() * 40;
    setLikeParticles(prev => [...prev, { id, x }]);
    setTimeout(() => {
      setLikeParticles(prev => prev.filter(p => p.id !== id));
    }, 1200);
  }, []);

  // 抢单处理
  const handleClaim = useCallback(
    (product: typeof TIKTOK_INTEL_DATA[0]) => {
      setShowDrawer(false);
      setDrawerProduct(null);

      const duration = 3500;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 8,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.8 },
          colors: [product.accentColor, '#ffffff', '#fbbf24', '#a78bfa'],
        });
        confetti({
          particleCount: 8,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.8 },
          colors: [product.accentColor, '#ffffff', '#fbbf24', '#a78bfa'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      addFomoMessage(`🎉 You just locked ${product.moq} of ${product.name}! Our team will WhatsApp you shortly.`);
      setClaimedProduct(product);
      setShowSuccessModal(true);
    },
    [addFomoMessage]
  );

  const handleOpenDrawer = (product: typeof TIKTOK_INTEL_DATA[0]) => {
    setDrawerProduct(product);
    setShowDrawer(true);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    await sendMessage(chatInput);
    setChatInput('');
  };

  const activeProduct = TIKTOK_INTEL_DATA[activeIntelIndex];
  const recentMessages = messages.slice(-8);

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: '100dvh', maxWidth: '430px', margin: '0 auto', background: '#050310' }}
    >
      {/* ══ 层0：沉浸式背景 ══ */}
      <div className="absolute inset-0 z-0">
        {/* 动态渐变背景 */}
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 70% 50% at 30% 20%, ${activeProduct.glowColor.replace('0.4', '0.12')} 0%, transparent 60%),
              radial-gradient(ellipse 60% 40% at 70% 70%, rgba(79, 70, 229, 0.10) 0%, transparent 55%),
              linear-gradient(160deg, #050310 0%, #0a0820 40%, #080618 100%)
            `,
            transition: 'background 1.5s ease',
          }}
        />
        {/* 网格纹理 */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(124, 58, 237, 0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(124, 58, 237, 0.06) 1px, transparent 1px)
            `,
            backgroundSize: '32px 32px',
          }}
        />
        {/* 品牌水印 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center opacity-[0.04]">
            <p className="text-white font-black tracking-[0.8em] uppercase text-3xl">REALSOURCING</p>
            <p className="text-white font-light tracking-[0.4em] uppercase text-sm mt-2">LIVE · DUBAI</p>
          </div>
        </div>
        {/* 底部渐黑遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/20 to-black/50 pointer-events-none" />
      </div>

      {/* ══ 层1：顶部状态栏 ══ */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* 直播标识 + 观看人数 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.25)',
              }}>
              <span className="w-2 h-2 bg-red-500 rounded-full animate-live-pulse" />
              <span className="text-red-400 text-xs font-bold tracking-wider">LIVE</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <Eye className="w-3 h-3 text-white/60" />
              <span className="text-white/80 text-xs font-medium">{(viewerCount + 1247).toLocaleString()}</span>
            </div>
          </div>

          {/* 工厂信息 */}
          <div className="flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <span className="text-white text-[9px] font-black">深</span>
            </div>
            <span className="text-white/80 text-xs font-medium truncate max-w-[90px]">{factoryName}</span>
            <Wifi className="w-3 h-3 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* ══ 层2：右侧操作栏（TikTok 风格）══ */}
      <div className="absolute right-3 bottom-[22%] z-20 flex flex-col items-center gap-5">
        {/* 点赞 */}
        <div className="relative flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
          </motion.button>
          <span className="text-white/60 text-[10px] font-medium">{(likeCount).toLocaleString()}</span>
          {/* 粒子 */}
          {likeParticles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: -60, scale: 0.5 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute pointer-events-none text-pink-400"
              style={{ left: `${p.x}%`, bottom: '100%' }}
            >
              ❤️
            </motion.div>
          ))}
        </div>

        {/* 分享 */}
        <div className="flex flex-col items-center gap-1">
          <button className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
            <Share2 className="w-5 h-5 text-white/70" />
          </button>
          <span className="text-white/40 text-[10px]">分享</span>
        </div>

        {/* 购物袋 */}
        <div className="flex flex-col items-center gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleOpenDrawer(activeProduct)}
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{
              background: `${activeProduct.accentColor}25`,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${activeProduct.accentColor}40`,
              boxShadow: `0 0 16px ${activeProduct.glowColor}`,
            }}
          >
            <ShoppingBag className="w-5 h-5" style={{ color: activeProduct.accentColor }} />
          </motion.button>
          <span className="text-white/40 text-[10px]">选品</span>
        </div>
      </div>

      {/* ══ 层3：右上角情报卡片 ══ */}
      <div className="absolute top-16 right-3 z-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIntelIndex}
            initial={{ opacity: 0, x: 20, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <TikTokIntelCard
              product={activeProduct}
              onClick={() => handleOpenDrawer(activeProduct)}
            />
          </motion.div>
        </AnimatePresence>
        {/* 切换指示点 */}
        <div className="flex justify-center gap-1.5 mt-2">
          {TIKTOK_INTEL_DATA.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIntelIndex(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIntelIndex ? '16px' : '6px',
                height: '6px',
                background: i === activeIntelIndex ? activeProduct.accentColor : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ══ 层4：左下角弹幕区 ══ */}
      <div className="absolute bottom-[22%] left-0 z-20 px-4 max-w-[65%]">
        <div className="space-y-2 mb-3">
          <AnimatePresence initial={false}>
            {recentMessages.map((msg) => (
              <DanmuMessage key={msg.id} msg={msg} />
            ))}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        {/* 聊天输入 */}
        <AnimatePresence>
          {isChatOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex items-center gap-2 rounded-full px-4 py-2.5"
              style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="说点什么..."
                autoFocus
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
                style={{ border: 'none', boxShadow: 'none' }}
              />
              <button onClick={handleSendChat} disabled={!chatInput.trim()}
                className="text-violet-400 font-semibold text-sm disabled:opacity-30 transition-opacity">
                发送
              </button>
              <button onClick={() => setIsChatOpen(false)} className="text-white/30 hover:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-2 rounded-full px-4 py-2"
              style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <MessageCircle className="w-3.5 h-3.5 text-white/40" />
              <span className="text-white/40 text-sm">说点什么...</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ══ 层5：底部操作栏 ══ */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe-bottom">
        <div className="px-4 pt-6 pb-6"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.98) 60%, transparent)' }}>

          {/* 产品快速切换 */}
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
            {TIKTOK_INTEL_DATA.map((p, i) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setActiveIntelIndex(i); handleOpenDrawer(p); }}
                className="flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: i === activeIntelIndex ? `${p.accentColor}25` : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${i === activeIntelIndex ? `${p.accentColor}50` : 'rgba(255,255,255,0.12)'}`,
                  color: i === activeIntelIndex ? p.accentColor : 'rgba(255,255,255,0.55)',
                  boxShadow: i === activeIntelIndex ? `0 0 12px ${p.glowColor}` : 'none',
                }}
              >
                <span>{p.emoji}</span>
                <span>{p.name}</span>
              </motion.button>
            ))}
          </div>

          {/* 主抢单按钮 */}
          <motion.button
            onClick={() => handleOpenDrawer(activeProduct)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${activeProduct.accentColor} 0%, ${activeProduct.accentColor}aa 100%)`,
              backgroundSize: '200% 200%',
              boxShadow: `0 8px 32px ${activeProduct.glowColor}, 0 0 0 1px ${activeProduct.accentColor}30`,
              animation: 'gradient-shift 3s ease infinite',
            }}
          >
            {/* 流光效果 */}
            <span className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                animation: 'shimmer 2s ease-in-out infinite',
              }}
            />
            <span className="relative flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              抢占 {activeProduct.name} 测试批次
              <span className="rounded-full px-2 py-0.5 text-sm font-bold"
                style={{ background: 'rgba(0,0,0,0.25)' }}>
                仅剩{activeProduct.slots}个
              </span>
            </span>
          </motion.button>

          {/* 底部辅助信息 */}
          <div className="flex items-center justify-center gap-4 mt-2.5">
            <span className="text-white/30 text-xs flex items-center gap-1">
              <Users className="w-3 h-3" />
              {(viewerCount + 1247).toLocaleString()} 人在看
            </span>
            <span className="text-white/20 text-xs">·</span>
            <span className="text-emerald-400/80 text-xs font-medium">0元锁定 · WhatsApp 跟进</span>
          </div>
        </div>
      </div>

      {/* ══ 产品抽屉 ══ */}
      <AnimatePresence>
        {showDrawer && (
          <ProductDrawer
            product={drawerProduct}
            onClose={() => { setShowDrawer(false); setDrawerProduct(null); }}
            onClaim={handleClaim}
          />
        )}
      </AnimatePresence>

      {/* ══ 抢单成功弹窗 ══ */}
      <AnimatePresence>
        {showSuccessModal && (
          <ClaimSuccessModal
            product={claimedProduct}
            onClose={() => setShowSuccessModal(false)}
          />
        )}
      </AnimatePresence>

      {/* CSS shimmer 动画 */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 页面入口
// ─────────────────────────────────────────────────────────────────────────────
export default function WebinarLiveRoom() {
  const [matchLive, paramsLive] = useRoute('/webinar-live/:id');
  const [matchWebinar, paramsWebinar] = useRoute('/webinar/:id/live');
  const params = paramsLive || paramsWebinar;
  const webinarId = params?.id ? parseInt(params.id) : 1;
  const { user } = useAuth();

  return (
    <WebinarProvider
      webinarId={webinarId}
      userId={user?.id || 1}
      role="subscriber"
      initialData={{
        title: '迪拜专场 · 中东TikTok爆款源头工厂直连',
        factory: {
          name: '深圳源头工厂',
          city: 'Shenzhen',
          country: 'China',
          rating: 4.9,
        },
        participantCount: 1247,
      }}
    >
      <WebinarLiveRoomContent webinarId={webinarId} />
    </WebinarProvider>
  );
}
