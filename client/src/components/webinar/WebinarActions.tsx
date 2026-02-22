import { useWebinar } from '@/contexts/WebinarContext';
import { Heart, Share2, Zap, Users } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

/**
 * WebinarActions - 精进点3：零摩擦意向锁单操作栏
 *
 * 移动端专用设计：
 * - 主按钮：巨大高亮的"抢占测试批次"（橙红渐变，脉冲动效）
 * - 副操作：点赞、分享（小图标，不抢主按钮视觉焦点）
 * - 抢单流程：点击 → 撒花动效 → 绿字成功提示 → 不跳转付款页
 * - 转化率优化：0元锁定，WhatsApp后续跟进，消除付款摩擦
 */

interface WebinarActionsProps {
  /** 当前展示的产品名称 */
  productName?: string;
  /** 当前展示的产品ID */
  productId?: number;
  /** 当前展示的MOQ */
  moq?: string;
  /** 是否显示分享按钮 */
  showShare?: boolean;
  /** 抢单成功回调 */
  onClaimSuccess?: () => void;
}

export function WebinarActions({
  productName = 'LED美白面膜仪',
  productId = 1,
  moq = '50 pcs',
  showShare = true,
  onClaimSuccess,
}: WebinarActionsProps) {
  const { liked, likeCount, toggleLike, claimSlot, addFomoMessage, viewerCount } = useWebinar();
  const [isLiking, setIsLiking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // 精进点3：零摩擦抢单处理
  // 点击 → 撒花动效 → 存入数据库 → 绿字提示 → 不跳转付款
  // ─────────────────────────────────────────────────────────────
  const handleClaim = useCallback(async () => {
    if (isClaiming || hasClaimed) return;

    setIsClaiming(true);

    // 1. 立即触发全屏撒花动效（先于网络请求，保证即时反馈）
    const duration = 3500;
    const end = Date.now() + duration;
    const colors = ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a936f', '#ffd700'];

    const fireConfetti = () => {
      confetti({
        particleCount: 8,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.8 },
        colors,
        gravity: 0.8,
      });
      confetti({
        particleCount: 8,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.8 },
        colors,
        gravity: 0.8,
      });
      if (Date.now() < end) requestAnimationFrame(fireConfetti);
    };
    fireConfetti();

    // 2. 存入数据库（意向线索）
    try {
      await claimSlot(productId, productName, moq);
    } catch {
      // claimSlot 内部已处理错误，这里静默处理
    }

    // 3. 显示成功 Toast（绿字，不跳转）
    toast.success(
      `🎉 ${moq} 名额已为您锁定！\n供应链管家将在 2小时内 WhatsApp 联系您。`,
      {
        duration: 6000,
        style: {
          background: '#0a2e1a',
          border: '1px solid #22c55e',
          color: '#4ade80',
        },
      }
    );

    setHasClaimed(true);
    setIsClaiming(false);
    onClaimSuccess?.();
  }, [isClaiming, hasClaimed, claimSlot, productId, productName, moq, onClaimSuccess]);

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await toggleLike();
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `RealSourcing Live — ${productName}`,
        text: `🔥 正在直播！源头工厂直连，${moq}起订，当场锁单！`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('直播链接已复制，快分享给朋友！');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── 主抢单按钮（精进点3核心）── */}
      <button
        onClick={handleClaim}
        disabled={isClaiming}
        className={`
          relative w-full py-4 rounded-2xl font-bold text-lg text-white
          shadow-2xl shadow-orange-500/40 active:scale-95 transition-all
          overflow-hidden
          ${hasClaimed
            ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-500/40'
            : 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500'
          }
          ${isClaiming ? 'opacity-80 cursor-wait' : ''}
        `}
      >
        {/* 脉冲光效（未抢单时显示） */}
        {!hasClaimed && !isClaiming && (
          <span className="absolute inset-0 rounded-2xl animate-ping bg-orange-400/20 pointer-events-none" />
        )}

        <span className="relative flex items-center justify-center gap-2">
          {isClaiming ? (
            <>
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              正在锁定...
            </>
          ) : hasClaimed ? (
            <>
              ✅ 名额已锁定！等待WhatsApp联系
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              🚀 抢占 {moq} 首单测试批次
            </>
          )}
        </span>
      </button>

      {/* 零摩擦说明文字 */}
      {!hasClaimed && (
        <p className="text-center text-gray-500 text-xs">
          0元锁定 · 无需付款 · 供应链管家WhatsApp跟进
        </p>
      )}

      {/* 已抢单成功提示 */}
      {hasClaimed && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
          <p className="text-green-400 text-sm font-medium">
            ✅ 名额已锁定！我们的供应链管家将在 2小时内 通过 WhatsApp 联系您确认履约细节。
          </p>
          <a
            href="https://wa.me/8613800138000?text=Hi%2C+I+just+claimed+a+test+batch+on+RealSourcing+Live!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-[#25D366] text-sm font-semibold hover:underline"
          >
            📱 立即 WhatsApp 确认 →
          </a>
        </div>
      )}

      {/* ── 副操作栏（点赞 + 分享）── */}
      <div className="flex gap-2">
        {/* 点赞按钮 */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
            border transition-all active:scale-95 text-sm font-medium
            ${liked
              ? 'bg-red-500/20 border-red-500/40 text-red-400'
              : 'bg-white/5 border-white/15 text-white/70 hover:bg-white/10'
            }
          `}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span>{likeCount > 0 ? likeCount.toLocaleString() : '点赞'}</span>
        </button>

        {/* 分享按钮 */}
        {showShare && (
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 transition-all active:scale-95 text-sm font-medium"
          >
            <Share2 className="w-4 h-4" />
            <span>分享</span>
          </button>
        )}

        {/* 在线人数 */}
        <div className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-white/60 text-xs">{(viewerCount + 1247).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
