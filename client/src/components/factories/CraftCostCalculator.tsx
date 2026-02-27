/**
 * CraftCostCalculator
 * 工艺成本计算模块
 *
 * 功能：
 *   - 基础成本输入（材料成本、人工成本、管理费用）
 *   - 工艺加价选择（刺绣/烫印/丝印/升华/激光切割等）
 *   - 数量阶梯折扣计算
 *   - 利润率设置
 *   - 自动计算建议报价（含阶梯报价）
 *   - 一键填入 QuoteSubmitForm
 */
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Calculator, Plus, Trash2, ChevronDown, ChevronUp,
  DollarSign, Percent, Package, Layers, Zap, ArrowRight,
  RefreshCw, Copy, CheckCircle2
} from 'lucide-react';

interface CraftOption {
  id: string;
  name: string;
  baseMarkup: number;   // 基础加价百分比
  perUnitCost: number;  // 每件固定成本（USD）
  description: string;
}

interface TierInput {
  qty: number;
  discount: number;  // 折扣百分比（0-30）
}

interface CalculatorResult {
  baseUnitCost: number;
  craftCost: number;
  totalCostPerUnit: number;
  suggestedPrice: number;
  tierPricing: { qty: number; unitPrice: number }[];
  profitMargin: number;
}

const CRAFT_OPTIONS: CraftOption[] = [
  { id: 'embroidery',    name: '刺绣',       baseMarkup: 20, perUnitCost: 0.8,  description: '针数越多成本越高，适合 LOGO 类图案' },
  { id: 'screen_print', name: '丝印',        baseMarkup: 8,  perUnitCost: 0.3,  description: '颜色越多成本越高，适合大批量' },
  { id: 'heat_transfer', name: '烫印/热转印', baseMarkup: 10, perUnitCost: 0.4,  description: '适合简单图案，颜色鲜艳' },
  { id: 'sublimation',  name: '升华印花',    baseMarkup: 15, perUnitCost: 0.6,  description: '全彩效果，适合涤纶面料' },
  { id: 'laser_cut',    name: '激光切割',    baseMarkup: 14, perUnitCost: 0.5,  description: '精度高，适合复杂形状' },
  { id: 'custom_label', name: '定制标签',    baseMarkup: 5,  perUnitCost: 0.15, description: '含挂牌、织唛、洗水唛' },
  { id: 'special_wash', name: '特殊水洗',    baseMarkup: 10, perUnitCost: 0.35, description: '石洗、做旧、酵素洗等' },
  { id: 'coating',      name: '涂层处理',    baseMarkup: 12, perUnitCost: 0.45, description: '防水、防污涂层' },
];

interface CraftCostCalculatorProps {
  onApplyToQuote?: (result: { unitPrice: number; tierPricing: { qty: number; unitPrice: number }[] }) => void;
}

export default function CraftCostCalculator({ onApplyToQuote }: CraftCostCalculatorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // 基础成本
  const [materialCost, setMaterialCost] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [overheadCost, setOverheadCost] = useState('');

  // 选中的工艺
  const [selectedCrafts, setSelectedCrafts] = useState<string[]>([]);

  // 利润率
  const [profitMargin, setProfitMargin] = useState(25);

  // 阶梯折扣
  const [tiers, setTiers] = useState<TierInput[]>([
    { qty: 100,  discount: 0 },
    { qty: 500,  discount: 8 },
    { qty: 1000, discount: 15 },
  ]);

  // 计算结果
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleCraft = (id: string) => {
    setSelectedCrafts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const addTier = () => {
    const lastQty = tiers[tiers.length - 1]?.qty ?? 100;
    setTiers(prev => [...prev, { qty: lastQty * 2, discount: Math.min(30, (tiers[tiers.length - 1]?.discount ?? 0) + 5) }]);
  };

  const removeTier = (idx: number) => {
    setTiers(prev => prev.filter((_, i) => i !== idx));
  };

  const calculate = useCallback(() => {
    const mat = parseFloat(materialCost) || 0;
    const lab = parseFloat(laborCost) || 0;
    const ovh = parseFloat(overheadCost) || 0;
    const baseCost = mat + lab + ovh;

    if (baseCost <= 0) return;

    // 计算工艺成本
    const selectedCraftData = CRAFT_OPTIONS.filter(c => selectedCrafts.includes(c.id));
    const craftMarkupPct = selectedCraftData.reduce((sum, c) => sum + c.baseMarkup, 0);
    const craftPerUnit = selectedCraftData.reduce((sum, c) => sum + c.perUnitCost, 0);
    const craftCost = baseCost * (craftMarkupPct / 100) + craftPerUnit;

    const totalCost = baseCost + craftCost;
    const suggestedPrice = totalCost * (1 + profitMargin / 100);

    // 阶梯报价
    const tierPricing = tiers
      .filter(t => t.qty > 0)
      .sort((a, b) => a.qty - b.qty)
      .map(t => ({
        qty: t.qty,
        unitPrice: parseFloat((suggestedPrice * (1 - t.discount / 100)).toFixed(2)),
      }));

    setResult({
      baseUnitCost: baseCost,
      craftCost,
      totalCostPerUnit: totalCost,
      suggestedPrice: parseFloat(suggestedPrice.toFixed(2)),
      tierPricing,
      profitMargin,
    });
  }, [materialCost, laborCost, overheadCost, selectedCrafts, profitMargin, tiers]);

  const handleApply = () => {
    if (!result) return;
    onApplyToQuote?.({
      unitPrice: result.suggestedPrice,
      tierPricing: result.tierPricing,
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/10 rounded-2xl border border-amber-500/20 overflow-hidden">
      {/* 标题栏 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-amber-300 font-medium text-sm">工艺成本计算器</span>
          <span className="text-gray-500 text-xs">· 快速估算报价</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-amber-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-400" />
        )}
      </button>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-4 pb-4 space-y-4"
        >
          {/* 基础成本输入 */}
          <div>
            <h4 className="text-gray-300 text-xs font-medium mb-2 uppercase tracking-wider">基础成本（USD/件）</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '材料成本', value: materialCost, setter: setMaterialCost, placeholder: '如 2.50' },
                { label: '人工成本', value: laborCost, setter: setLaborCost, placeholder: '如 1.20' },
                { label: '管理费用', value: overheadCost, setter: setOverheadCost, placeholder: '如 0.50' },
              ].map(field => (
                <div key={field.label}>
                  <label className="text-gray-500 text-xs block mb-1">{field.label}</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                    <input
                      type="number"
                      value={field.value}
                      onChange={e => field.setter(e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full bg-white/10 border border-white/20 rounded-lg pl-5 pr-2 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 工艺选择 */}
          <div>
            <h4 className="text-gray-300 text-xs font-medium mb-2 uppercase tracking-wider">工艺加价（可多选）</h4>
            <div className="grid grid-cols-2 gap-2">
              {CRAFT_OPTIONS.map(craft => (
                <button
                  key={craft.id}
                  onClick={() => toggleCraft(craft.id)}
                  className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-all ${
                    selectedCrafts.includes(craft.id)
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                    selectedCrafts.includes(craft.id)
                      ? 'bg-amber-500 border-amber-500'
                      : 'border-gray-600'
                  }`}>
                    {selectedCrafts.includes(craft.id) && (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium">{craft.name}</span>
                      <span className="text-xs text-amber-400/70">+{craft.baseMarkup}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">{craft.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 利润率 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-300 text-xs font-medium uppercase tracking-wider">目标利润率</h4>
              <span className="text-amber-300 text-sm font-bold">{profitMargin}%</span>
            </div>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={profitMargin}
              onChange={e => setProfitMargin(parseInt(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5%（薄利）</span>
              <span>30%（标准）</span>
              <span>60%（高端）</span>
            </div>
          </div>

          {/* 阶梯折扣 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-300 text-xs font-medium uppercase tracking-wider">阶梯折扣设置</h4>
              <button
                onClick={addTier}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                添加档位
              </button>
            </div>
            <div className="space-y-2">
              {tiers.map((tier, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <div className="relative flex-1">
                      <Package className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                      <input
                        type="number"
                        value={tier.qty}
                        onChange={e => setTiers(prev => prev.map((t, i) => i === idx ? { ...t, qty: parseInt(e.target.value) || 0 } : t))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-7 pr-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500/50"
                        placeholder="数量"
                      />
                    </div>
                    <span className="text-gray-500 text-xs">件起</span>
                    <div className="relative flex-1">
                      <Percent className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
                      <input
                        type="number"
                        value={tier.discount}
                        min={0}
                        max={30}
                        onChange={e => setTiers(prev => prev.map((t, i) => i === idx ? { ...t, discount: parseInt(e.target.value) || 0 } : t))}
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-7 pr-2 py-1.5 text-white text-xs focus:outline-none focus:border-amber-500/50"
                        placeholder="折扣"
                      />
                    </div>
                    <span className="text-gray-500 text-xs">折扣</span>
                  </div>
                  {tiers.length > 1 && (
                    <button
                      onClick={() => removeTier(idx)}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 计算按钮 */}
          <Button
            onClick={calculate}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white text-sm"
          >
            <Calculator className="w-4 h-4 mr-1.5" />
            计算建议报价
          </Button>

          {/* 计算结果 */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl p-4 space-y-3 border border-amber-500/20"
            >
              <h4 className="text-amber-300 text-xs font-medium uppercase tracking-wider">计算结果</h4>

              {/* 成本分解 */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">基础成本</span>
                  <span className="text-gray-200">${result.baseUnitCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">工艺成本</span>
                  <span className="text-gray-200">+${result.craftCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-white/10 pt-1.5">
                  <span className="text-gray-300">总成本</span>
                  <span className="text-white font-medium">${result.totalCostPerUnit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">利润（{result.profitMargin}%）</span>
                  <span className="text-green-400">+${(result.suggestedPrice - result.totalCostPerUnit).toFixed(2)}</span>
                </div>
              </div>

              {/* 建议报价 */}
              <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                <p className="text-gray-400 text-xs">建议报价（MOQ 起）</p>
                <p className="text-amber-300 text-2xl font-bold mt-0.5">${result.suggestedPrice}</p>
                <p className="text-gray-500 text-xs">/ 件</p>
              </div>

              {/* 阶梯报价预览 */}
              {result.tierPricing.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs mb-1.5">阶梯报价预览</p>
                  <div className="space-y-1">
                    {result.tierPricing.map((tier, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-gray-400">{tier.qty.toLocaleString()}+ 件</span>
                        <span className="text-white">${tier.unitPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 应用到报价表单 */}
              {onApplyToQuote && (
                <Button
                  onClick={handleApply}
                  className={`w-full text-sm ${
                    copied
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {copied ? (
                    <><CheckCircle2 className="w-4 h-4 mr-1.5" />已填入报价表单</>
                  ) : (
                    <><ArrowRight className="w-4 h-4 mr-1.5" />填入报价表单</>
                  )}
                </Button>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
