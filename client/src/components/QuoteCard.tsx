/**
 * QuoteCard
 * 买家侧沟通室 - 报价详情卡片
 *
 * 功能：
 *   - 展示阶梯报价（Tier Pricing）
 *   - 付款条款、装运条款
 *   - 交货期、样品信息
 *   - 报价有效期倒计时
 *   - 接受/拒绝报价操作
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DollarSign, Clock, Package, Truck, CreditCard,
  CheckCircle2, XCircle, ChevronDown, ChevronUp,
  Sparkles, AlertCircle, Loader2, ShoppingCart,
  TrendingDown, Info
} from 'lucide-react';

interface TierPrice {
  qty: number;
  unitPrice: number;
}

interface QuoteCardProps {
  quote: {
    id: number;
    inquiryId: number;
    demandId?: number | null;
    factoryId: number;
    status: string;
    unitPrice?: string | null;
    currency?: string | null;
    moq?: number | null;
    leadTimeDays?: number | null;
    validUntil?: Date | string | null;
    tierPricing?: TierPrice[] | null;
    factoryNotes?: string | null;
    paymentTerms?: string | null;
    shippingTerms?: string | null;
    sampleAvailable?: number | null;
    samplePrice?: string | null;
    sampleLeadDays?: number | null;
    submittedAt?: Date | string | null;
  };
  factoryName?: string;
  onAccepted?: () => void;
  onRejected?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:  { label: '等待报价', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  quoted:   { label: '已报价',   color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30' },
  accepted: { label: '已接受',   color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  rejected: { label: '已拒绝',   color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30' },
  expired:  { label: '已过期',   color: 'text-gray-500',   bg: 'bg-gray-500/10',   border: 'border-gray-500/30' },
};

function formatCurrency(amount: string | number | null | undefined, currency = 'USD') {
  if (!amount) return '—';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(num);
}

function getValidUntilDays(validUntil: Date | string | null | undefined): number | null {
  if (!validUntil) return null;
  const diff = new Date(validUntil).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function QuoteCard({ quote, factoryName, onAccepted, onRejected, className }: QuoteCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showConfirm, setShowConfirm] = useState<'accept' | 'reject' | null>(null);

  const acceptMutation = trpc.rfq.accept.useMutation({
    onSuccess: () => {
      toast.success('已接受报价！请与工厂确认订单详情。');
      onAccepted?.();
    },
    onError: (err) => toast.error('操作失败: ' + err.message),
  });

  const rejectMutation = trpc.rfq.reject.useMutation({
    onSuccess: () => {
      toast.info('已拒绝报价');
      onRejected?.();
    },
    onError: (err) => toast.error('操作失败: ' + err.message),
  });

  const statusCfg = STATUS_CONFIG[quote.status] ?? STATUS_CONFIG.pending;
  const tierPricing: TierPrice[] = Array.isArray(quote.tierPricing) ? quote.tierPricing : [];
  const validDays = getValidUntilDays(quote.validUntil);
  const isExpired = validDays !== null && validDays === 0;
  const canAct = quote.status === 'quoted' && !isExpired;
  const currency = quote.currency ?? 'USD';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border overflow-hidden',
        statusCfg.border,
        statusCfg.bg,
        className
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">
                {factoryName ? `${factoryName} 的报价` : '工厂报价'}
              </span>
              <Badge className={cn('text-[10px] h-4 px-1.5', statusCfg.color, statusCfg.bg, 'border', statusCfg.border)}>
                {statusCfg.label}
              </Badge>
              {quote.status === 'quoted' && (
                <Sparkles className="w-3 h-3 text-yellow-400" />
              )}
            </div>
            {quote.submittedAt && (
              <p className="text-gray-500 text-xs">
                {new Date(quote.submittedAt).toLocaleString('zh-CN')} 提交
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Main price preview */}
          {quote.unitPrice && (
            <span className="text-white font-bold text-sm">
              {formatCurrency(quote.unitPrice, currency)}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 space-y-4 border-t border-white/8 pt-4">

              {/* Tier Pricing Table */}
              {tierPricing.length > 0 ? (
                <div>
                  <h4 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <TrendingDown className="w-3 h-3" />阶梯报价
                  </h4>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5">
                          <th className="text-left px-3 py-2 text-gray-400 text-xs font-medium">数量</th>
                          <th className="text-right px-3 py-2 text-gray-400 text-xs font-medium">单价</th>
                          <th className="text-right px-3 py-2 text-gray-400 text-xs font-medium">总价参考</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tierPricing.map((tier, i) => (
                          <tr key={i} className={cn(
                            'border-t border-white/5',
                            i === 0 ? 'bg-white/3' : ''
                          )}>
                            <td className="px-3 py-2.5 text-white text-xs">
                              {tier.qty.toLocaleString()} pcs
                              {i === 0 && <span className="ml-1.5 text-[10px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">MOQ</span>}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <span className={cn('font-semibold text-xs', i === 0 ? 'text-white' : 'text-green-400')}>
                                {formatCurrency(tier.unitPrice, currency)}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right text-gray-400 text-xs">
                              {formatCurrency(tier.qty * tier.unitPrice, currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : quote.unitPrice ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-gray-400 text-sm">单价</span>
                  <span className="text-white font-bold">{formatCurrency(quote.unitPrice, currency)}</span>
                </div>
              ) : null}

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-2">
                {quote.moq && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/8">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Package className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-500 text-xs">最小起订量</span>
                    </div>
                    <p className="text-white text-sm font-semibold">{quote.moq.toLocaleString()} pcs</p>
                  </div>
                )}
                {quote.leadTimeDays && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/8">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-500 text-xs">交货期</span>
                    </div>
                    <p className="text-white text-sm font-semibold">{quote.leadTimeDays} 天</p>
                  </div>
                )}
                {quote.paymentTerms && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/8">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CreditCard className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-500 text-xs">付款条款</span>
                    </div>
                    <p className="text-white text-sm font-semibold">{quote.paymentTerms}</p>
                  </div>
                )}
                {quote.shippingTerms && (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/8">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Truck className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-500 text-xs">装运条款</span>
                    </div>
                    <p className="text-white text-sm font-semibold">{quote.shippingTerms}</p>
                  </div>
                )}
              </div>

              {/* Sample Info */}
              {quote.sampleAvailable === 1 && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <div>
                      <p className="text-purple-300 text-xs font-medium">样品可提供</p>
                      <p className="text-purple-400/70 text-xs">
                        {quote.samplePrice ? `样品价格：${formatCurrency(quote.samplePrice, currency)}` : ''}
                        {quote.sampleLeadDays ? `  · 样品交期：${quote.sampleLeadDays} 天` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Factory Notes */}
              {quote.factoryNotes && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/8">
                  <div className="flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-gray-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-400 text-xs font-medium mb-1">工厂备注</p>
                      <p className="text-gray-300 text-xs leading-relaxed">{quote.factoryNotes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Valid Until */}
              {validDays !== null && (
                <div className={cn(
                  'flex items-center gap-2 p-2.5 rounded-lg text-xs',
                  validDays <= 3 ? 'bg-red-500/10 text-red-400' :
                  validDays <= 7 ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-white/5 text-gray-400'
                )}>
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {validDays === 0
                    ? '报价已过期'
                    : `报价有效期剩余 ${validDays} 天（${new Date(quote.validUntil!).toLocaleDateString('zh-CN')} 到期）`
                  }
                </div>
              )}

              {/* Action Buttons */}
              {canAct && !showConfirm && (
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={() => setShowConfirm('accept')}
                    className="flex-1 bg-green-600 hover:bg-green-500 text-white gap-2 h-9 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />接受报价
                  </Button>
                  <Button
                    onClick={() => setShowConfirm('reject')}
                    variant="outline"
                    className="flex-1 border-red-500/40 text-red-400 hover:bg-red-500/10 gap-2 h-9 text-sm"
                  >
                    <XCircle className="w-4 h-4" />拒绝
                  </Button>
                </div>
              )}

              {/* Confirm Accept */}
              {showConfirm === 'accept' && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 space-y-3">
                  <p className="text-green-300 text-sm font-medium">确认接受此报价？</p>
                  <p className="text-green-400/70 text-xs">接受后，系统将通知工厂并进入样品/订单流程。</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        acceptMutation.mutate({ inquiryId: quote.inquiryId });
                        setShowConfirm(null);
                      }}
                      disabled={acceptMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-500 h-8 text-xs"
                    >
                      {acceptMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '确认接受'}
                    </Button>
                    <Button
                      onClick={() => setShowConfirm(null)}
                      variant="ghost"
                      className="flex-1 text-gray-400 h-8 text-xs"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}

              {/* Confirm Reject */}
              {showConfirm === 'reject' && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-3">
                  <p className="text-red-300 text-sm font-medium">确认拒绝此报价？</p>
                  <p className="text-red-400/70 text-xs">拒绝后，您可以继续与工厂沟通或等待新报价。</p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        rejectMutation.mutate({ inquiryId: quote.inquiryId, reason: '买家拒绝报价' });
                        setShowConfirm(null);
                      }}
                      disabled={rejectMutation.isPending}
                      className="flex-1 bg-red-600 hover:bg-red-500 h-8 text-xs"
                    >
                      {rejectMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '确认拒绝'}
                    </Button>
                    <Button
                      onClick={() => setShowConfirm(null)}
                      variant="ghost"
                      className="flex-1 text-gray-400 h-8 text-xs"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}

              {/* Accepted state */}
              {quote.status === 'accepted' && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <p className="text-green-300 text-xs">您已接受此报价，工厂将与您确认订单详情。</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default QuoteCard;
