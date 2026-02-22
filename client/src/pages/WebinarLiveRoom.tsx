import { useState, useCallback, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { WebinarProvider, useWebinar } from '@/contexts/WebinarContext';
import { AgoraVideoCall } from '@/components/AgoraVideoCall';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, Users, Wifi, ChevronUp, X, TrendingUp, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────────────────────
// 精进点4：硬编码 TikTok 爆款情报数据（伪直连，保证100%稳定）
// 迪拜专场：中东美妆 + 小家电 + 智能配件三款爆款
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
    trend: '+340% this week',
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
    trend: '+210% this week',
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
    trend: '+180% this week',
    videoThumb: 'https://picsum.photos/seed/fryer/400/600',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 精进点2：FOMO Engine 气氛组剧本
// 在直播关键时刻自动广播预设消息，制造稀缺感
// ─────────────────────────────────────────────────────────────────────────────
export const FOMO_SCRIPTS = [
  { delay: 12000,  message: '🔥 Ahmed (Dubai) just locked 100 units of LED Mask!', type: 'fomo' as const },
  { delay: 28000,  message: '⚡ NYC brand secured 50-unit test batch — only 2 slots left!', type: 'fomo' as const },
  { delay: 45000,  message: '🇦🇪 Riyadh seller grabbed the last MagSafe Charger batch!', type: 'fomo' as const },
  { delay: 65000,  message: '🚀 3 buyers competing for the same Air Fryer slot right now!', type: 'fomo' as const },
  { delay: 90000,  message: '💥 Flash price ends in 5 min — 2 LED Mask slots remaining!', type: 'fomo' as const },
  { delay: 120000, message: '🏆 Sarah from London just claimed her test batch. Smart move!', type: 'fomo' as const },
];

// ─────────────────────────────────────────────────────────────────────────────
// 弹幕消息组件（TikTok风格）
// ─────────────────────────────────────────────────────────────────────────────
function DanmuMessage({ msg }: { msg: { id: number; userName: string; message: string; type: string; avatar: string } }) {
  if (msg.type === 'fomo') {
    return (
      <div className="flex items-center gap-2 animate-slide-in">
        <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shrink-0">
          LIVE
        </span>
        <span className="text-yellow-300 text-sm font-semibold drop-shadow-lg">{msg.message}</span>
      </div>
    );
  }
  if (msg.type === 'system') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs">{msg.message}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
        {msg.avatar?.slice(0, 1) || '?'}
      </div>
      <span className="text-white/80 text-sm">
        <span className="text-purple-300 font-medium">{msg.userName}: </span>
        {msg.message}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TikTok情报卡片（右上角悬浮）
// ─────────────────────────────────────────────────────────────────────────────
function TikTokIntelCard({ product, onClick }: { product: typeof TIKTOK_INTEL_DATA[0]; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/20 text-left w-44 active:scale-95 transition-transform"
    >
      <div className="flex items-center gap-1.5 mb-2">
        <TrendingUp className="w-3 h-3 text-red-400" />
        <span className="text-red-400 text-xs font-bold">TikTok爆款</span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-2xl">{product.emoji}</span>
        <div>
          <p className="text-white text-xs font-semibold leading-tight">{product.name}</p>
          <p className="text-gray-400 text-xs">{product.category}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <div className="bg-white/10 rounded-lg p-1.5 text-center">
          <p className="text-white text-xs font-bold">{product.tiktokViews}</p>
          <p className="text-gray-400 text-[10px]">播放量</p>
        </div>
        <div className="bg-white/10 rounded-lg p-1.5 text-center">
          <p className="text-green-400 text-xs font-bold">{product.ctr}</p>
          <p className="text-gray-400 text-[10px]">点击率</p>
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-yellow-400 text-xs font-bold">{product.price}</span>
        <span className="text-orange-400 text-xs">{product.trend}</span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 产品详情抽屉（从底部弹出）
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
    <div className="fixed inset-0 z-40 flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-[#0F0F23]/95 backdrop-blur-xl rounded-t-3xl p-6 border-t border-purple-500/30 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-4" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{product.emoji}</span>
            <div>
              <h3 className="text-white font-bold text-lg">{product.name}</h3>
              <p className="text-gray-400 text-sm">{product.nameEn}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TikTok 病毒指数 */}
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-xl p-4 mb-4 border border-red-500/30">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-red-400" />
            <span className="text-red-400 font-bold text-sm">TikTok 病毒指数</span>
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {product.viralScore}/100
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-white font-bold text-base">{product.tiktokViews}</p>
              <p className="text-gray-400 text-xs">总播放量</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-base">{product.tiktokLikes}</p>
              <p className="text-gray-400 text-xs">总点赞</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 font-bold text-base">{product.ctr}</p>
              <p className="text-gray-400 text-xs">点击率</p>
            </div>
          </div>
        </div>

        {/* 价格与MOQ */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-gray-400 text-xs mb-1">工厂底价</p>
            <p className="text-white font-bold text-xl">{product.price}</p>
            <p className="text-gray-500 text-xs">per unit</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-gray-400 text-xs mb-1">最小起订量</p>
            <p className="text-white font-bold text-xl">{product.moq}</p>
            <p className="text-gray-500 text-xs">minimum order</p>
          </div>
        </div>

        {/* 名额进度条 */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-400 text-sm">测试批次名额</span>
            <span className="text-orange-400 font-bold text-sm">仅剩 {slotsLeft} 个</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
              style={{ width: `${100 - pct}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs mt-1">{product.totalSlots - slotsLeft}/{product.totalSlots} 名额已被锁定</p>
        </div>

        {/* 抢单按钮 */}
        <button
          onClick={() => onClaim(product)}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white font-bold text-lg shadow-lg shadow-orange-500/40 active:scale-95 transition-all"
        >
          🚀 抢占 {product.moq} 首单测试批次
        </button>
        <p className="text-center text-gray-500 text-xs mt-2">0元锁定 · 供应链管家WhatsApp跟进</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 精进点3：抢单成功弹窗（零摩擦锁单 + 撒花动效）
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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0F0F23] rounded-3xl p-8 border border-green-500/40 w-full max-w-sm text-center shadow-2xl shadow-green-500/20">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-white font-bold text-2xl mb-2">名额已锁定！</h2>
        <p className="text-green-400 font-semibold text-lg mb-1">{product.name}</p>
        <p className="text-gray-400 text-sm mb-6">{product.moq} 首单测试批次</p>

        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6 text-left">
          <p className="text-green-400 font-semibold text-sm mb-1">✅ 接下来会发生什么？</p>
          <p className="text-gray-300 text-sm leading-relaxed">
            我们的供应链管家将在 <strong className="text-white">2小时内</strong> 通过 WhatsApp 与您联系，
            确认订单细节和履约安排。<br /><br />
            <strong className="text-yellow-400">无需预付款</strong>，直播结束后私域跟进。
          </p>
        </div>

        <a
          href="https://wa.me/8613800138000?text=Hi%2C+I+just+claimed+a+test+batch+on+RealSourcing+Live!"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-base mb-3 active:scale-95 transition-transform"
        >
          📱 立即 WhatsApp 确认
        </a>
        <button
          onClick={onClose}
          className="text-gray-500 text-sm hover:text-gray-300 transition-colors"
        >
          稍后联系
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 主直播间内容（沉浸式竖屏 TikTok 布局）
// ─────────────────────────────────────────────────────────────────────────────
function WebinarLiveRoomContent({ webinarId = 1 }: { webinarId?: number }) {
  const { user } = useAuth();
  const { messages, sendMessage, viewerCount, webinarTitle, factoryName, addFomoMessage } = useWebinar();

  const [activeIntelIndex, setActiveIntelIndex] = useState(0);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerProduct, setDrawerProduct] = useState<typeof TIKTOK_INTEL_DATA[0] | null>(null);
  const [claimedProduct, setClaimedProduct] = useState<typeof TIKTOK_INTEL_DATA[0] | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动聊天到底部
  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // 轮播情报卡片
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIntelIndex((prev) => (prev + 1) % TIKTOK_INTEL_DATA.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // 精进点3：抢单处理（零摩擦 + 撒花）
  const handleClaim = useCallback(
    (product: typeof TIKTOK_INTEL_DATA[0]) => {
      setShowDrawer(false);
      setDrawerProduct(null);

      // 触发全屏撒花动效
      const duration = 3000;
      const end = Date.now() + duration;
      const frame = () => {
        confetti({
          particleCount: 7,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a936f'],
        });
        confetti({
          particleCount: 7,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a936f'],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();

      // 存入数据库（意向线索）
      // claimMutation.mutate({ webinarId, productId: product.id });

      // 在聊天区广播抢单消息（剧场效应）
      addFomoMessage(`🎉 You just locked ${product.moq} of ${product.name}! Our team will WhatsApp you shortly.`);

      setClaimedProduct(product);
      setShowSuccessModal(true);
    },
    [addFomoMessage]
  );

  // 打开产品抽屉
  const handleOpenDrawer = (product: typeof TIKTOK_INTEL_DATA[0]) => {
    setDrawerProduct(product);
    setShowDrawer(true);
  };

  // 发送聊天消息
  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    await sendMessage(chatInput);
    setChatInput('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center">
        <p className="text-white">请先登录</p>
      </div>
    );
  }

  const activeProduct = TIKTOK_INTEL_DATA[activeIntelIndex];
  // 只显示最近8条消息作为弹幕
  const recentMessages = messages.slice(-8);

  return (
    <div className="relative w-full bg-black overflow-hidden"
      style={{ height: '100dvh', maxWidth: '430px', margin: '0 auto' }}>

      {/* ── 层1：全屏视频背景（70%高度） ── */}
      <div className="absolute inset-0 z-0">
        <AgoraVideoCall
          channelName={`webinar-${webinarId}`}
          userId={user.id}
          role="subscriber"
          className="w-full h-full object-cover"
        />
        {/* 渐变遮罩：底部渐黑，保证UI可读性 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none" />
      </div>

      {/* ── 层2：顶部状态栏 ── */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* 直播标识 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-red-500 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold">LIVE</span>
            </div>
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
              <Eye className="w-3 h-3 text-white/80" />
              <span className="text-white text-xs font-medium">
                {(viewerCount + 1247).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 工厂信息 */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">深</span>
            </div>
            <span className="text-white text-xs font-medium truncate max-w-[100px]">{factoryName}</span>
            <Wifi className="w-3 h-3 text-green-400" />
          </div>
        </div>
      </div>

      {/* ── 层3：右上角 TikTok 情报卡片 ── */}
      <div className="absolute top-16 right-4 z-20">
        <TikTokIntelCard
          product={activeProduct}
          onClick={() => handleOpenDrawer(activeProduct)}
        />
        {/* 切换指示点 */}
        <div className="flex justify-center gap-1 mt-2">
          {TIKTOK_INTEL_DATA.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIntelIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === activeIntelIndex ? 'bg-white w-4' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── 层4：左下角弹幕区 + 聊天输入 ── */}
      <div className="absolute bottom-[18%] left-0 right-0 z-20 px-4">
        {/* 弹幕消息流 */}
        <div className="space-y-1.5 mb-3 max-w-[65%]">
          {recentMessages.map((msg) => (
            <DanmuMessage key={msg.id} msg={msg} />
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* 聊天输入框（点击展开） */}
        {isChatOpen ? (
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="说点什么..."
              autoFocus
              className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-500 outline-none"
            />
            <button
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
              className="text-purple-400 font-semibold text-sm disabled:opacity-40"
            >
              发送
            </button>
            <button onClick={() => setIsChatOpen(false)} className="text-gray-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10"
          >
            <span className="text-gray-400 text-sm">说点什么...</span>
          </button>
        )}
      </div>

      {/* ── 层5：底部固定操作栏（15%高度）── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe-bottom">
        <div className="bg-gradient-to-t from-black via-black/95 to-transparent px-4 pt-4 pb-6">
          {/* 产品快速切换栏 */}
          <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide pb-1">
            {TIKTOK_INTEL_DATA.map((p, i) => (
              <button
                key={p.id}
                onClick={() => { setActiveIntelIndex(i); handleOpenDrawer(p); }}
                className={`flex items-center gap-1.5 shrink-0 rounded-full px-3 py-1.5 border text-xs font-medium transition-all ${
                  i === activeIntelIndex
                    ? 'bg-orange-500/30 border-orange-500/60 text-orange-300'
                    : 'bg-white/10 border-white/20 text-white/70'
                }`}
              >
                <span>{p.emoji}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>

          {/* 主抢单按钮（巨大、高亮） */}
          <button
            onClick={() => handleOpenDrawer(activeProduct)}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-2xl shadow-orange-500/50 active:scale-95 transition-all relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #F7C59F 50%, #FF6B35 100%)',
              backgroundSize: '200% 200%',
              animation: 'gradient-shift 3s ease infinite',
            }}
          >
            {/* 脉冲光效 */}
            <span className="absolute inset-0 rounded-2xl animate-ping bg-orange-400/20 pointer-events-none" />
            <span className="relative flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" />
              🚀 抢占 {activeProduct.name} 测试批次
              <span className="bg-white/20 rounded-full px-2 py-0.5 text-sm">
                仅剩{activeProduct.slots}个
              </span>
            </span>
          </button>

          {/* 底部辅助信息 */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="text-gray-500 text-xs flex items-center gap-1">
              <Users className="w-3 h-3" />
              {(viewerCount + 1247).toLocaleString()} 人在看
            </span>
            <span className="text-gray-500 text-xs">·</span>
            <span className="text-green-400 text-xs font-medium">0元锁定 · WhatsApp跟进</span>
          </div>
        </div>
      </div>

      {/* ── 产品详情抽屉 ── */}
      {showDrawer && (
        <ProductDrawer
          product={drawerProduct}
          onClose={() => { setShowDrawer(false); setDrawerProduct(null); }}
          onClaim={handleClaim}
        />
      )}

      {/* ── 抢单成功弹窗 ── */}
      {showSuccessModal && (
        <ClaimSuccessModal
          product={claimedProduct}
          onClose={() => setShowSuccessModal(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 页面入口（带 Provider）
// ─────────────────────────────────────────────────────────────────────────────
export default function WebinarLiveRoom() {
  const [, params] = useRoute('/webinar-live/:id');
  const webinarId = params?.id ? parseInt(params.id) : 1;
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center">
        <p className="text-white">请先登录</p>
      </div>
    );
  }

  return (
    <WebinarProvider
      webinarId={webinarId}
      userId={user.id}
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
