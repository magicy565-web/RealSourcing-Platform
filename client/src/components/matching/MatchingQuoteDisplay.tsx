/**
 * MatchingQuoteDisplay - 在 MatchingDashboard 工厂卡片上显示报价
 * 
 * 功能：
 * - 显示来自工厂的最新报价
 * - 显示报价详情（单价、MOQ、交期）
 * - 集成到 MatchCard 中
 * - 实时更新报价状态
 */

import { motion } from 'framer-motion';
import { TrendingDown, Clock, Package, AlertCircle } from 'lucide-react';

interface Quote {
  id: number;
  unitPrice: number;
  currency: string;
  moq: number;
  leadTimeDays: number;
  tierPricing?: Array<{ qty: number; unitPrice: number }>;
  sampleAvailable?: boolean;
  samplePrice?: number;
  createdAt: string;
}

interface MatchingQuoteDisplayProps {
  quote?: Quote;
  factoryName?: string;
  isNew?: boolean;
}

export function MatchingQuoteDisplay({
  quote,
  factoryName,
  isNew = false,
}: MatchingQuoteDisplayProps) {
  if (!quote) return null;

  const bestTierPrice = quote.tierPricing && quote.tierPricing.length > 0
    ? quote.tierPricing[quote.tierPricing.length - 1].unitPrice
    : null;

  const priceDiscount = bestTierPrice && bestTierPrice < quote.unitPrice
    ? Math.round(((quote.unitPrice - bestTierPrice) / quote.unitPrice) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 space-y-2.5"
    >
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-semibold text-purple-300">报价已收到</span>
          {isNew && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 border border-red-500/30 text-red-400">
              NEW
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-500">
          {new Date(quote.createdAt).toLocaleDateString('zh-CN')}
        </span>
      </div>

      {/* 主要价格信息 */}
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-white">
          {quote.currency} {quote.unitPrice.toFixed(2)}
        </span>
        <span className="text-xs text-gray-500">/件</span>

        {priceDiscount && (
          <span className="ml-auto px-2 py-0.5 rounded text-xs font-semibold bg-green-500/15 border border-green-500/25 text-green-400">
            ↓ {priceDiscount}% 优惠
          </span>
        )}
      </div>

      {/* 关键参数 */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-gray-400">
          <Package className="w-3 h-3 text-amber-400" />
          <span>MOQ: <span className="text-white font-semibold">{quote.moq.toLocaleString()}</span></span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Clock className="w-3 h-3 text-blue-400" />
          <span>交期: <span className="text-white font-semibold">{quote.leadTimeDays} 天</span></span>
        </div>
      </div>

      {/* 阶梯报价提示 */}
      {quote.tierPricing && quote.tierPricing.length > 0 && (
        <div className="p-2 rounded bg-white/5 border border-white/10">
          <p className="text-[10px] text-gray-500 mb-1.5">📊 阶梯报价：</p>
          <div className="space-y-1">
            {quote.tierPricing.map((tier, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px]">
                <span className="text-gray-600">{tier.qty.toLocaleString()} 件+</span>
                <span className="font-semibold text-green-400">
                  {quote.currency} {tier.unitPrice.toFixed(2)}/件
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 样品信息 */}
      {quote.sampleAvailable && (
        <div className="flex items-center gap-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
          <span className="text-[10px] text-amber-300">
            ✓ 可提供样品
            {quote.samplePrice && ` · ${quote.currency} ${quote.samplePrice.toFixed(2)}`}
            {quote.sampleLeadDays && ` · ${quote.sampleLeadDays} 天`}
          </span>
        </div>
      )}

      {/* 行动提示 */}
      <p className="text-[10px] text-gray-500 italic">
        💡 点击工厂卡片查看完整报价详情
      </p>
    </motion.div>
  );
}
