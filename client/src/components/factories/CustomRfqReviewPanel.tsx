/**
 * CustomRfqReviewPanel
 * 工厂侧定制报价审核界面
 *
 * 功能：
 *   - 展示 AI 解析的设计稿信息（产品类型、材料、工艺、置信度）
 *   - 显示买家的定制需求（材料、尺寸、颜色、特殊要求）
 *   - 工厂可以：接受（填写报价）/ 拒绝（说明原因）/ 提出替代方案
 *   - 工艺成本计算辅助（基于工艺类型自动估算加价幅度）
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, XCircle, AlertCircle, FileImage, Layers,
  Scissors, Zap, Package, Clock, DollarSign, ChevronDown,
  ChevronUp, MessageSquare, Lightbulb, RefreshCw
} from 'lucide-react';

interface CustomRfqSpec {
  material?: string;
  dimensions?: string;
  color?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  budgetRange?: { min: number; max: number; currency: string };
  designFileUrls?: string[];
  specialRequirements?: string;
}

interface CustomRfqItem {
  id: number;
  productName: string;
  category: string;
  description: string;
  quantity?: number;
  targetPrice?: number;
  currency?: string;
  leadTime?: number;
  customSpecJson?: string;
  status: string;
  createdAt: string;
  buyerName?: string;
}

interface CustomRfqReviewPanelProps {
  rfq: CustomRfqItem;
  onClose?: () => void;
  onSubmitted?: () => void;
}

// 工艺加价参考表
const CRAFT_MARKUP_GUIDE: Record<string, { label: string; markup: string; note: string }> = {
  embroidery:   { label: '刺绣', markup: '+15~25%', note: '视针数和面积而定' },
  heat_transfer: { label: '烫印', markup: '+8~15%', note: '适合简单图案' },
  screen_print: { label: '丝印', markup: '+5~12%', note: '颜色越多成本越高' },
  sublimation:  { label: '升华印花', markup: '+10~20%', note: '全彩效果好' },
  laser_cut:    { label: '激光切割', markup: '+12~18%', note: '精度高，适合复杂形状' },
  custom_label: { label: '定制标签', markup: '+3~8%', note: '含挂牌、织唛' },
  special_wash: { label: '特殊水洗', markup: '+6~12%', note: '石洗、做旧等' },
};

const COMPLEXITY_LABELS: Record<string, { label: string; color: string; markup: string }> = {
  simple:  { label: '简单', color: 'text-green-400 bg-green-500/10 border-green-500/30', markup: '基础价' },
  medium:  { label: '中等', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', markup: '+10~20%' },
  complex: { label: '复杂', color: 'text-red-400 bg-red-500/10 border-red-500/30', markup: '+25~50%' },
};

export default function CustomRfqReviewPanel({ rfq, onClose, onSubmitted }: CustomRfqReviewPanelProps) {
  const [action, setAction] = useState<'idle' | 'accept' | 'reject' | 'counter'>('idle');
  const [showCraftGuide, setShowCraftGuide] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 接受时的报价字段
  const [unitPrice, setUnitPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [moq, setMoq] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState(rfq.leadTime?.toString() ?? '');
  const [craftNotes, setCraftNotes] = useState('');
  const [factoryNotes, setFactoryNotes] = useState('');

  // 拒绝时的原因
  const [rejectReason, setRejectReason] = useState('');

  // 替代方案
  const [counterProposal, setCounterProposal] = useState('');
  const [counterPrice, setCounterPrice] = useState('');

  // 防御性解析：customSpecJson 格式不规范时不白屏，降级为空对象
  const spec: CustomRfqSpec = (() => {
    if (!rfq.customSpecJson) return {};
    try { return JSON.parse(rfq.customSpecJson) as CustomRfqSpec; } catch { return {}; }
  })();
  const complexity = spec.complexity ?? 'medium';
  const complexityInfo = COMPLEXITY_LABELS[complexity];

  const submitQuoteMutation = trpc.rfq.submit.useMutation();

  const handleAccept = async () => {
    if (!unitPrice || !moq) return;
    setIsSubmitting(true);
    try {
      await submitQuoteMutation.mutateAsync({
        inquiryId: rfq.id,
        unitPrice: parseFloat(unitPrice),
        currency,
        moq: parseInt(moq),
        leadTimeDays: parseInt(leadTimeDays) || 30,
        factoryNotes: [craftNotes, factoryNotes].filter(Boolean).join('\n'),
        isCustomQuote: true,
      } as any);
      onSubmitted?.();
    } catch (e) {
      console.error('[CustomRfqReview] submit error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setIsSubmitting(true);
    try {
      // 调用拒绝接口（通过 rfq.reject）
      await (trpc as any).rfq.reject.mutateAsync({
        quoteId: rfq.id,
        reason: rejectReason,
      });
      onSubmitted?.();
    } catch (e) {
      console.error('[CustomRfqReview] reject error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-900/30 to-indigo-900/20 rounded-2xl border border-purple-500/20 p-5 space-y-4"
    >
      {/* 头部：定制 RFQ 标识 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{rfq.productName}</h3>
            <p className="text-gray-400 text-xs">{rfq.category} · 定制询价 #{rfq.id}</p>
          </div>
        </div>
        <Badge className={`text-xs ${complexityInfo.color}`}>
          {complexityInfo.label}工艺 {complexityInfo.markup}
        </Badge>
      </div>

      {/* 买家需求详情 */}
      <div className="bg-white/5 rounded-xl p-4 space-y-3">
        <h4 className="text-gray-300 text-xs font-medium uppercase tracking-wider">买家定制需求</h4>
        <div className="grid grid-cols-2 gap-3">
          {spec.material && (
            <div>
              <span className="text-gray-500 text-xs">材质</span>
              <p className="text-white text-sm font-medium">{spec.material}</p>
            </div>
          )}
          {spec.dimensions && (
            <div>
              <span className="text-gray-500 text-xs">尺寸</span>
              <p className="text-white text-sm font-medium">{spec.dimensions}</p>
            </div>
          )}
          {spec.color && (
            <div>
              <span className="text-gray-500 text-xs">颜色</span>
              <p className="text-white text-sm font-medium">{spec.color}</p>
            </div>
          )}
          {rfq.quantity && (
            <div>
              <span className="text-gray-500 text-xs">数量</span>
              <p className="text-white text-sm font-medium">{rfq.quantity.toLocaleString()} 件</p>
            </div>
          )}
          {spec.budgetRange && (
            <div className="col-span-2">
              <span className="text-gray-500 text-xs">预算范围</span>
              <p className="text-white text-sm font-medium">
                {spec.budgetRange.currency} {spec.budgetRange.min}–{spec.budgetRange.max} / 件
              </p>
            </div>
          )}
        </div>
        {spec.specialRequirements && (
          <div>
            <span className="text-gray-500 text-xs">特殊要求</span>
            <p className="text-gray-200 text-sm mt-1 leading-relaxed">{spec.specialRequirements}</p>
          </div>
        )}
        {spec.designFileUrls && spec.designFileUrls.length > 0 && (
          <div className="flex items-center gap-2">
            <FileImage className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-xs">{spec.designFileUrls.length} 个设计稿文件</span>
          </div>
        )}
      </div>

      {/* 工艺成本参考指南（可折叠） */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowCraftGuide(!showCraftGuide)}
          className="w-full flex items-center justify-between p-3 text-left"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-amber-300 text-xs font-medium">工艺成本参考指南</span>
          </div>
          {showCraftGuide ? (
            <ChevronUp className="w-4 h-4 text-amber-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-amber-400" />
          )}
        </button>
        <AnimatePresence>
          {showCraftGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 grid grid-cols-1 gap-2">
                {Object.entries(CRAFT_MARKUP_GUIDE).map(([key, info]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-300 text-xs">{info.label}</span>
                      <span className="text-gray-500 text-xs">· {info.note}</span>
                    </div>
                    <span className="text-amber-300 text-xs font-medium">{info.markup}</span>
                  </div>
                ))}
                <p className="text-gray-500 text-xs mt-1 border-t border-white/5 pt-2">
                  * 以上为参考幅度，实际成本以您的工厂核算为准
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 操作按钮区 */}
      {action === 'idle' && (
        <div className="flex gap-2">
          <Button
            onClick={() => setAction('accept')}
            className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 text-sm"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            接受并报价
          </Button>
          <Button
            onClick={() => setAction('counter')}
            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-sm"
          >
            <Lightbulb className="w-4 h-4 mr-1.5" />
            提替代方案
          </Button>
          <Button
            onClick={() => setAction('reject')}
            className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm"
          >
            <XCircle className="w-4 h-4 mr-1.5" />
            无法接单
          </Button>
        </div>
      )}

      {/* 接受：填写报价 */}
      <AnimatePresence>
        {action === 'accept' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <h4 className="text-green-300 text-sm font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              填写定制报价
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">单价 *</label>
                <div className="flex gap-1">
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white text-xs w-16"
                  >
                    <option value="USD">USD</option>
                    <option value="CNY">CNY</option>
                    <option value="EUR">EUR</option>
                  </select>
                  <input
                    type="number"
                    value={unitPrice}
                    onChange={e => setUnitPrice(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">MOQ（最小起订量）*</label>
                <input
                  type="number"
                  value={moq}
                  onChange={e => setMoq(e.target.value)}
                  placeholder="100"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">交期（天）</label>
                <input
                  type="number"
                  value={leadTimeDays}
                  onChange={e => setLeadTimeDays(e.target.value)}
                  placeholder="30"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">工艺说明</label>
                <input
                  type="text"
                  value={craftNotes}
                  onChange={e => setCraftNotes(e.target.value)}
                  placeholder="如：刺绣 + 丝印"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">备注（可选）</label>
              <textarea
                value={factoryNotes}
                onChange={e => setFactoryNotes(e.target.value)}
                placeholder="如：颜色数量超过 4 色需额外收费，样品费 $50..."
                rows={2}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500/50 resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAccept}
                disabled={!unitPrice || !moq || isSubmitting}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm"
              >
                {isSubmitting ? (
                  <><RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />提交中...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-1.5" />提交报价</>
                )}
              </Button>
              <Button
                onClick={() => setAction('idle')}
                variant="outline"
                className="border-white/20 text-gray-400 text-sm"
              >
                取消
              </Button>
            </div>
          </motion.div>
        )}

        {/* 拒绝：填写原因 */}
        {action === 'reject' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <h4 className="text-red-300 text-sm font-medium flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              拒绝原因
            </h4>
            <div className="flex flex-wrap gap-2">
              {['无法做此工艺', '材料不符合要求', '产能不足', '交期太短', '预算太低'].map(reason => (
                <button
                  key={reason}
                  onClick={() => setRejectReason(reason)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    rejectReason === reason
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="或输入具体原因..."
              rows={2}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-red-500/50 resize-none"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={!rejectReason.trim() || isSubmitting}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-sm"
              >
                {isSubmitting ? '提交中...' : '确认拒绝'}
              </Button>
              <Button
                onClick={() => setAction('idle')}
                variant="outline"
                className="border-white/20 text-gray-400 text-sm"
              >
                取消
              </Button>
            </div>
          </motion.div>
        )}

        {/* 替代方案 */}
        {action === 'counter' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden"
          >
            <h4 className="text-blue-300 text-sm font-medium flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" />
              提出替代方案
            </h4>
            <p className="text-gray-400 text-xs">
              如果无法完全满足买家需求，可以提出替代方案（如：用烫印替代刺绣，成本更低）
            </p>
            <textarea
              value={counterProposal}
              onChange={e => setCounterProposal(e.target.value)}
              placeholder="例如：我们可以用热转印替代刺绣，效果相近但成本降低约 20%，交期可缩短至 20 天..."
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 resize-none"
            />
            <div>
              <label className="text-gray-400 text-xs block mb-1">参考报价（可选）</label>
              <input
                type="number"
                value={counterPrice}
                onChange={e => setCounterPrice(e.target.value)}
                placeholder="替代方案的单价（USD）"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div className="flex gap-2">
              <Button
                disabled={!counterProposal.trim() || isSubmitting}
                className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-sm"
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await submitQuoteMutation.mutateAsync({
                      inquiryId: rfq.id,
                      unitPrice: counterPrice ? parseFloat(counterPrice) : 0,
                      currency: 'USD',
                      moq: 100,
                      leadTimeDays: 30,
                      factoryNotes: `[替代方案] ${counterProposal}`,
                      isCustomQuote: true,
                    } as any);
                    onSubmitted?.();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                {isSubmitting ? '提交中...' : '发送替代方案'}
              </Button>
              <Button
                onClick={() => setAction('idle')}
                variant="outline"
                className="border-white/20 text-gray-400 text-sm"
              >
                取消
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
