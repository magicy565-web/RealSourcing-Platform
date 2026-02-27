/**
 * QuoteSubmitForm - 工厂侧报价提交表单
 * 
 * 功能：
 * - 结构化报价信息输入（单价、MOQ、交期）
 * - 阶梯报价支持
 * - 样品信息（可选）
 * - 付款和装运条款
 * - 工厂备注
 * 
 * 集成位置：FactoryDashboard 询价详情面板
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  DollarSign, Package, Calendar, Plus, Trash2, ChevronDown,
  Loader2, AlertCircle, CheckCircle2, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface QuoteSubmitFormProps {
  inquiryId: number;
  factoryId: number;
  productName?: string;
  buyerName?: string;
  quantity?: number;
  onSuccess?: () => void;
}

interface TierPrice {
  qty: number;
  unitPrice: number;
}

export function QuoteSubmitForm({
  inquiryId,
  factoryId,
  productName,
  buyerName,
  quantity,
  onSuccess,
}: QuoteSubmitFormProps) {
  // ── 基础报价信息 ──────────────────────────────────────────────────────────
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [moq, setMoq] = useState<string>('');
  const [leadTimeDays, setLeadTimeDays] = useState<string>('');

  // ── 阶梯报价 ──────────────────────────────────────────────────────────────
  const [tierPricing, setTierPricing] = useState<TierPrice[]>([]);
  const [showTierForm, setShowTierForm] = useState(false);
  const [tierQty, setTierQty] = useState<string>('');
  const [tierPrice, setTierPrice] = useState<string>('');

  // ── 样品信息 ──────────────────────────────────────────────────────────────
  const [sampleAvailable, setSampleAvailable] = useState(true);
  const [samplePrice, setSamplePrice] = useState<string>('');
  const [sampleLeadDays, setSampleLeadDays] = useState<string>('');

  // ── 条款和备注 ────────────────────────────────────────────────────────────
  const [paymentTerms, setPaymentTerms] = useState<string>('30% deposit, 70% before shipment');
  const [shippingTerms, setShippingTerms] = useState<string>('FOB');
  const [factoryNotes, setFactoryNotes] = useState<string>('');

  // ── 表单状态 ──────────────────────────────────────────────────────────────
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    tiers: false,
    sample: false,
    terms: false,
  });

  // ── 提交报价 mutation ──────────────────────────────────────────────────────
  const submitMutation = trpc.rfq.submit.useMutation({
    onSuccess: () => {
      toast.success('✅ 报价已提交！', {
        description: '买家将在几分钟内收到您的报价。',
      });
      resetForm();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('❌ 提交失败', {
        description: error.message || '请检查表单信息后重试',
      });
    },
  });

  // ── 验证表单 ──────────────────────────────────────────────────────────────
  const validateForm = useCallback(() => {
    if (!unitPrice || isNaN(parseFloat(unitPrice))) {
      toast.error('请输入有效的单价');
      return false;
    }
    if (!moq || isNaN(parseInt(moq))) {
      toast.error('请输入有效的 MOQ');
      return false;
    }
    if (!leadTimeDays || isNaN(parseInt(leadTimeDays))) {
      toast.error('请输入有效的交期（天数）');
      return false;
    }
    return true;
  }, [unitPrice, moq, leadTimeDays]);

  // ── 提交表单 ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    submitMutation.mutate({
      inquiryId,
      factoryId,
      unitPrice: parseFloat(unitPrice),
      currency,
      moq: parseInt(moq),
      leadTimeDays: parseInt(leadTimeDays),
      tierPricing: tierPricing.length > 0 ? tierPricing : undefined,
      sampleAvailable,
      samplePrice: samplePrice ? parseFloat(samplePrice) : undefined,
      sampleLeadDays: sampleLeadDays ? parseInt(sampleLeadDays) : undefined,
      paymentTerms: paymentTerms || undefined,
      shippingTerms: shippingTerms || undefined,
      factoryNotes: factoryNotes || undefined,
    });
  }, [validateForm, submitMutation, inquiryId, factoryId, unitPrice, currency, moq, leadTimeDays, tierPricing, sampleAvailable, samplePrice, sampleLeadDays, paymentTerms, shippingTerms, factoryNotes]);

  // ── 重置表单 ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setUnitPrice('');
    setMoq('');
    setLeadTimeDays('');
    setTierPricing([]);
    setSamplePrice('');
    setSampleLeadDays('');
    setFactoryNotes('');
  };

  // ── 添加阶梯价格 ──────────────────────────────────────────────────────────
  const addTierPrice = () => {
    if (!tierQty || !tierPrice || isNaN(parseInt(tierQty)) || isNaN(parseFloat(tierPrice))) {
      toast.error('请输入有效的数量和价格');
      return;
    }
    const newTier: TierPrice = {
      qty: parseInt(tierQty),
      unitPrice: parseFloat(tierPrice),
    };
    setTierPricing([...tierPricing, newTier].sort((a, b) => a.qty - b.qty));
    setTierQty('');
    setTierPrice('');
  };

  // ── 删除阶梯价格 ──────────────────────────────────────────────────────────
  const removeTierPrice = (index: number) => {
    setTierPricing(tierPricing.filter((_, i) => i !== index));
  };

  // ── 切换分组展开 ──────────────────────────────────────────────────────────
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* 信息提示 */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-300">
          <p className="font-medium mb-1">💡 提交报价后，买家将立即收到通知</p>
          <p>请确保所有信息准确无误。您可以随时更新报价。</p>
        </div>
      </div>

      {/* ── 基础报价信息 ── */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
        <button
          onClick={() => toggleSection('basic')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-400" />
            <span className="font-medium text-white">基础报价信息</span>
            <Badge variant="secondary" className="ml-2">必填</Badge>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              expandedSections.basic ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {expandedSections.basic && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 p-4 space-y-4"
            >
              {/* 单价和货币 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                    单价 *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="例如：5.50"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                    货币
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CNY">CNY</option>
                  </select>
                </div>
              </div>

              {/* MOQ 和交期 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                    最小起订量 (MOQ) *
                  </label>
                  <Input
                    type="number"
                    placeholder="例如：100"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                    交期（天数）*
                  </label>
                  <Input
                    type="number"
                    placeholder="例如：30"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* 价格预估 */}
              {unitPrice && moq && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {moq} 件的总价估算：
                  </span>
                  <span className="font-bold text-purple-300">
                    {currency} {(parseFloat(unitPrice) * parseInt(moq)).toFixed(2)}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 阶梯报价 ── */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
        <button
          onClick={() => toggleSection('tiers')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-green-400" />
            <span className="font-medium text-white">阶梯报价</span>
            {tierPricing.length > 0 && (
              <Badge variant="outline" className="ml-2">{tierPricing.length} 层</Badge>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              expandedSections.tiers ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {expandedSections.tiers && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 p-4 space-y-3"
            >
              {/* 现有阶梯列表 */}
              {tierPricing.length > 0 && (
                <div className="space-y-2">
                  {tierPricing.map((tier, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/5"
                    >
                      <span className="text-sm text-gray-300">
                        {tier.qty.toLocaleString()} 件 @ {currency} {tier.unitPrice.toFixed(2)}/件
                      </span>
                      <button
                        onClick={() => removeTierPrice(idx)}
                        className="p-1 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 添加新阶梯 */}
              {showTierForm ? (
                <div className="space-y-2 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="数量"
                      value={tierQty}
                      onChange={(e) => setTierQty(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="单价"
                      value={tierPrice}
                      onChange={(e) => setTierPrice(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={addTierPrice}
                      className="flex-1 h-8 text-xs"
                    >
                      确认
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowTierForm(false);
                        setTierQty('');
                        setTierPrice('');
                      }}
                      className="flex-1 h-8 text-xs"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowTierForm(true)}
                  className="w-full h-8 text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  添加阶梯价格
                </Button>
              )}

              <p className="text-xs text-gray-500">
                💡 阶梯报价可以帮助买家了解大订单的优惠幅度
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 样品信息 ── */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
        <button
          onClick={() => toggleSection('sample')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-white">样品信息</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              expandedSections.sample ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {expandedSections.sample && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 p-4 space-y-3"
            >
              {/* 是否提供样品 */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sampleAvailable}
                  onChange={(e) => setSampleAvailable(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-300">可提供样品</span>
              </label>

              {sampleAvailable && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                      样品价格
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="例如：10.00"
                      value={samplePrice}
                      onChange={(e) => setSamplePrice(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                      样品交期（天）
                    </label>
                    <Input
                      type="number"
                      placeholder="例如：7"
                      value={sampleLeadDays}
                      onChange={(e) => setSampleLeadDays(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 付款和装运条款 ── */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
        <button
          onClick={() => toggleSection('terms')}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="font-medium text-white">付款和装运条款</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              expandedSections.terms ? 'rotate-180' : ''
            }`}
          />
        </button>

        <AnimatePresence>
          {expandedSections.terms && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/10 p-4 space-y-3"
            >
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                  付款条款
                </label>
                <Input
                  placeholder="例如：30% deposit, 70% before shipment"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                  装运条款
                </label>
                <select
                  value={shippingTerms}
                  onChange={(e) => setShippingTerms(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none"
                >
                  <option value="FOB">FOB (Free on Board)</option>
                  <option value="CIF">CIF (Cost, Insurance, Freight)</option>
                  <option value="DDP">DDP (Delivered Duty Paid)</option>
                  <option value="EXW">EXW (Ex Works)</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 工厂备注 ── */}
      <div>
        <label className="text-xs font-medium text-gray-400 mb-1.5 block">
          工厂备注（可选）
        </label>
        <Textarea
          placeholder="分享任何额外信息，例如产品特性、认证、生产能力等..."
          value={factoryNotes}
          onChange={(e) => setFactoryNotes(e.target.value)}
          rows={3}
          className="text-sm"
        />
      </div>

      {/* ── 提交按钮 ── */}
      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={submitMutation.isPending}
          className="flex-1 h-10 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50"
        >
          {submitMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              提交中...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              提交报价
            </>
          )}
        </Button>
        <Button
          onClick={resetForm}
          variant="outline"
          className="h-10"
          disabled={submitMutation.isPending}
        >
          重置
        </Button>
      </div>
    </motion.div>
  );
}
