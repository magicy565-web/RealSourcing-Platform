import { useWebinar } from '@/contexts/WebinarContext';
import { Heart, TrendingUp, Zap, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { DUBAI_SESSION_PRODUCTS, getViralScoreColor, type TikTokProduct } from '@/data/tiktokIntelData';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

/**
 * WebinarProducts - 精进点4：TikTok 情报数据区
 *
 * 升级内容：
 * - 使用硬编码的 DUBAI_SESSION_PRODUCTS 数据（伪直连，100% 稳定）
 * - 展示 TikTok 病毒指数、播放量、点击率等数据
 * - 视觉上看起来像实时拉取的全息数据情报
 * - 集成零摩擦抢单按钮（精进点3）
 */

export function WebinarProducts() {
  const { claimSlot, addFomoMessage, favorites, toggleFavorite } = useWebinar();
  const [claimedIds, setClaimedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleClaim = async (product: TikTokProduct) => {
    if (claimedIds.includes(product.id)) return;

    // 撒花动效
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#ff6b35', '#f7c59f', '#efefd0', '#004e89', '#1a936f'],
    });

    // 存入数据库
    await claimSlot(product.id, product.name, product.moq);

    // 广播剧场效应已在 WebinarContext.claimSlot 内部处理，此处不再重复广播，以防消息刷屏

    setClaimedIds((prev) => [...prev, product.id]);

    toast.success(`🎉 ${product.moq} 名额已锁定！供应链管家将在2小时内 WhatsApp 联系您。`, {
      duration: 6000,
      style: { background: '#0a2e1a', border: '1px solid #22c55e', color: '#4ade80' },
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F23]/80 rounded-xl border border-purple-500/20">
      {/* 标题栏 */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-red-400" />
          <span className="text-white font-semibold text-sm">TikTok 爆款情报</span>
        </div>
        <div className="flex items-center gap-1.5 bg-red-500/20 rounded-full px-2.5 py-1">
          <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
          <span className="text-red-400 text-xs font-medium">实时数据</span>
        </div>
      </div>

      {/* 产品列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {DUBAI_SESSION_PRODUCTS.map((product) => {
          const isFavorited = favorites.includes(product.id);
          const isClaimed = claimedIds.includes(product.id);
          const isExpanded = expandedId === product.id;
          const slotsLeft = product.slots;
          const slotsPct = Math.round((slotsLeft / product.totalSlots) * 100);

          return (
            <div
              key={product.id}
              className={`rounded-xl border transition-all ${
                isClaimed
                  ? 'border-green-500/40 bg-green-500/5'
                  : 'border-white/10 bg-white/5 hover:border-purple-500/30'
              }`}
            >
              {/* 产品头部 */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : product.id)}
                className="w-full p-3 text-left"
              >
                <div className="flex items-start gap-3">
                  {/* 产品图标 */}
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-3xl flex-shrink-0 border border-white/10">
                    {product.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-white font-semibold text-sm">{product.name}</h4>
                        <p className="text-gray-400 text-xs">{product.nameEn}</p>
                      </div>
                      {/* 病毒指数徽章 */}
                      <div className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 ${getViralScoreColor(product.viralScore)}`}>
                        🔥 {product.viralScore}
                      </div>
                    </div>

                    {/* TikTok 核心数据 */}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-red-400 text-xs font-medium">{product.tiktokViews} 播放</span>
                      <span className="text-green-400 text-xs">CTR {product.ctr}</span>
                      <span className="text-orange-400 text-xs">{product.trend}</span>
                    </div>
                  </div>
                </div>

                {/* 名额进度条 */}
                <div className="mt-2.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-gray-500 text-xs">测试批次名额</span>
                    <span className={`text-xs font-bold ${slotsLeft <= 3 ? 'text-red-400' : 'text-orange-400'}`}>
                      仅剩 {slotsLeft} 个
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
                      style={{ width: `${100 - slotsPct}%` }}
                    />
                  </div>
                </div>
              </button>

              {/* 展开详情 */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-white/10 pt-3 space-y-3">
                  {/* 完整病毒指数数据 */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '播放量', value: product.tiktokViews, color: 'text-red-400' },
                      { label: '点赞', value: product.tiktokLikes, color: 'text-pink-400' },
                      { label: '评论', value: product.tiktokComments, color: 'text-blue-400' },
                      { label: '分享', value: product.tiktokShares, color: 'text-purple-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-white/5 rounded-lg p-2 text-center">
                        <p className={`text-xs font-bold ${color}`}>{value}</p>
                        <p className="text-gray-500 text-[10px]">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* 价格与MOQ */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                      <p className="text-gray-400 text-xs mb-0.5">工厂底价</p>
                      <p className="text-white font-bold text-lg">{product.price}</p>
                      <p className="text-gray-500 text-xs">per unit</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2.5 border border-white/10">
                      <p className="text-gray-400 text-xs mb-0.5">最小起订量</p>
                      <p className="text-white font-bold text-lg">{product.moq}</p>
                      <p className="text-gray-500 text-xs">minimum order</p>
                    </div>
                  </div>

                  {/* 产品标签 */}
                  <div className="flex flex-wrap gap-1.5">
                    {product.dropshipping && (
                      <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full border border-green-500/30">
                        ✓ 一件代发
                      </span>
                    )}
                    {product.customizable && (
                      <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">
                        ✓ 支持定制
                      </span>
                    )}
                    <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-0.5 rounded-full border border-purple-500/30">
                      发货 {product.leadTime}
                    </span>
                    {product.certifications.map((cert) => (
                      <span key={cert} className="bg-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                        {cert}
                      </span>
                    ))}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    {/* 收藏按钮 */}
                    <button
                      onClick={() => toggleFavorite(product.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm transition-all active:scale-95 ${
                        isFavorited
                          ? 'bg-red-500/20 border-red-500/40 text-red-400'
                          : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                      {isFavorited ? '已收藏' : '收藏'}
                    </button>

                    {/* 抢单按钮 */}
                    <button
                      onClick={() => handleClaim(product)}
                      disabled={isClaimed}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                        isClaimed
                          ? 'bg-green-600/80 text-white cursor-default'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          已锁定
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          抢占 {product.moq}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
