/**
 * IncomePredictor — Dropshipping 月收入预测引擎
 *
 * 核心价值：ChatGPT 无法回答「我卖这个，一个月能赚多少？」
 * 本组件基于行业基准数据，为 Dropshipper 提供专业的月收入预测。
 *
 * 数学模型：
 *   月净利润 = (月流量 × 转化率 × 客单价) - 产品成本 - 运费 - 平台费 - 广告费 - 退款损失
 */
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, DollarSign, ShoppingCart, Truck, Zap,
  ChevronDown, ChevronUp, Info, AlertTriangle, CheckCircle2,
  BarChart3, Target, Percent
} from "lucide-react";

// ─── 行业基准数据（来源：Shopify, Statista, Qikify 2025-2026 数据）──────────────
const INDUSTRY_BENCHMARKS = {
  // 电商平均转化率（Shopify 全球平均 1.4%, 优质店铺 2.5-3.5%）
  conversionRates: {
    conservative: 0.015,  // 保守：1.5%
    average: 0.025,       // 平均：2.5%
    optimistic: 0.035,    // 乐观：3.5%
  },
  // 退款/争议率（Dropshipping 行业平均 2-5%）
  refundRate: 0.03,
  // Shopify 平台费率（Basic Plan: 2.9% + $0.30/单）
  platformFeeRate: 0.029,
  platformFeeFixed: 0.30,
  // 广告 ROAS 基准（Dropshipping Facebook/TikTok Ads 平均 2-3x）
  avgROAS: 2.5,
  // 利润率行业基准（Dropshipping 平均 15-20%）
  avgProfitMargin: { low: 0.15, high: 0.30 },
};

// ─── 按品类的行业基准（用于智能建议）─────────────────────────────────────────────
const NICHE_BENCHMARKS: Record<string, {
  avgAOV: number;        // 平均客单价
  avgMargin: number;     // 平均利润率
  convRate: number;      // 典型转化率
  competition: "low" | "medium" | "high";
  label: string;
}> = {
  electronics: { avgAOV: 45, avgMargin: 0.20, convRate: 0.018, competition: "high", label: "电子产品" },
  fashion: { avgAOV: 35, avgMargin: 0.25, convRate: 0.022, competition: "high", label: "服装配饰" },
  home: { avgAOV: 40, avgMargin: 0.28, convRate: 0.025, competition: "medium", label: "家居用品" },
  beauty: { avgAOV: 30, avgMargin: 0.35, convRate: 0.030, competition: "medium", label: "美妆护肤" },
  pets: { avgAOV: 38, avgMargin: 0.30, convRate: 0.028, competition: "low", label: "宠物用品" },
  sports: { avgAOV: 42, avgMargin: 0.25, convRate: 0.020, competition: "medium", label: "运动健身" },
  toys: { avgAOV: 28, avgMargin: 0.32, convRate: 0.026, competition: "low", label: "玩具礼品" },
  other: { avgAOV: 35, avgMargin: 0.22, convRate: 0.022, competition: "medium", label: "其他品类" },
};

// ─── 类型定义 ─────────────────────────────────────────────────────────────────
interface PredictionInputs {
  sellingPrice: number;       // 目标售价（USD）
  productCost: number;        // 产品成本（USD，来自供应商）
  shippingCost: number;       // 运费（USD/单）
  monthlyTraffic: number;     // 月流量（访客数）
  adSpend: number;            // 月广告预算（USD）
  niche: keyof typeof NICHE_BENCHMARKS;
  scenario: "conservative" | "average" | "optimistic";
}

interface PredictionResult {
  // 单件经济模型
  landedCost: number;         // 到岸成本 = 产品成本 + 运费
  platformFee: number;        // 单件平台费
  grossProfitPerUnit: number; // 单件毛利润
  grossMargin: number;        // 毛利率

  // 月度预测
  monthlyOrders: number;      // 月订单数
  monthlyRevenue: number;     // 月营业额
  monthlyProductCost: number; // 月产品成本
  monthlyShipping: number;    // 月运费
  monthlyPlatformFee: number; // 月平台费
  monthlyRefundLoss: number;  // 月退款损失
  monthlyNetProfit: number;   // 月净利润
  netMargin: number;          // 净利率

  // 广告效率
  adROAS: number;             // 广告回报率
  cpa: number;                // 单次获客成本

  // 风险评估
  breakEvenOrders: number;    // 月盈亏平衡订单数
  riskLevel: "low" | "medium" | "high";
  riskReason: string;

  // AI 建议
  aiInsights: string[];
}

// ─── 核心计算引擎 ─────────────────────────────────────────────────────────────
function calculatePrediction(inputs: PredictionInputs): PredictionResult {
  const { sellingPrice, productCost, shippingCost, monthlyTraffic, adSpend, niche, scenario } = inputs;
  const nicheBenchmark = NICHE_BENCHMARKS[niche];

  // 转化率（基于场景和品类基准）
  const baseConvRate = INDUSTRY_BENCHMARKS.conversionRates[scenario];
  const convRate = (baseConvRate + nicheBenchmark.convRate) / 2;

  // 单件经济模型
  const landedCost = productCost + shippingCost;
  const platformFee = sellingPrice * INDUSTRY_BENCHMARKS.platformFeeRate + INDUSTRY_BENCHMARKS.platformFeeFixed;
  const grossProfitPerUnit = sellingPrice - landedCost - platformFee;
  const grossMargin = grossProfitPerUnit / sellingPrice;

  // 广告带来的流量（基于 ROAS 反推）
  const adRevenue = adSpend * INDUSTRY_BENCHMARKS.avgROAS;
  const adOrders = adRevenue / sellingPrice;
  const adTraffic = adOrders / convRate;

  // 总流量 = 自然流量 + 广告流量
  const totalTraffic = monthlyTraffic + adTraffic;
  const monthlyOrders = Math.round(totalTraffic * convRate);

  // 月度财务预测
  const monthlyRevenue = monthlyOrders * sellingPrice;
  const monthlyProductCost = monthlyOrders * productCost;
  const monthlyShipping = monthlyOrders * shippingCost;
  const monthlyPlatformFee = monthlyOrders * platformFee;
  const monthlyRefundLoss = monthlyRevenue * INDUSTRY_BENCHMARKS.refundRate;
  const monthlyNetProfit = monthlyRevenue - monthlyProductCost - monthlyShipping
    - monthlyPlatformFee - monthlyRefundLoss - adSpend;
  const netMargin = monthlyRevenue > 0 ? monthlyNetProfit / monthlyRevenue : 0;

  // 广告效率
  const adROAS = adSpend > 0 ? adRevenue / adSpend : 0;
  const cpa = adOrders > 0 ? adSpend / adOrders : 0;

  // 盈亏平衡
  const breakEvenOrders = grossProfitPerUnit > 0
    ? Math.ceil(adSpend / grossProfitPerUnit)
    : 999;

  // 风险评估
  let riskLevel: "low" | "medium" | "high" = "low";
  let riskReason = "";
  if (grossMargin < 0.15) {
    riskLevel = "high";
    riskReason = "毛利率低于 15%，广告费波动可能导致亏损";
  } else if (grossMargin < 0.25) {
    riskLevel = "medium";
    riskReason = "毛利率处于行业平均水平，需严格控制广告成本";
  } else {
    riskLevel = "low";
    riskReason = "毛利率健康，具备较强的抗风险能力";
  }
  if (nicheBenchmark.competition === "high" && riskLevel === "low") {
    riskLevel = "medium";
    riskReason = "该品类竞争激烈，建议差异化选品";
  }

  // AI 洞察建议
  const aiInsights: string[] = [];
  if (grossMargin > 0.30) {
    aiInsights.push(`✅ 毛利率 ${(grossMargin * 100).toFixed(1)}% 超过行业均值，定价策略合理`);
  } else if (grossMargin < 0.20) {
    aiInsights.push(`⚠️ 毛利率 ${(grossMargin * 100).toFixed(1)}% 偏低，建议将售价提高至 $${(landedCost / 0.75).toFixed(2)} 以上`);
  }
  if (cpa > sellingPrice * 0.3) {
    aiInsights.push(`⚠️ 单次获客成本 $${cpa.toFixed(2)} 偏高，建议优化广告素材或降低竞价`);
  } else if (cpa < sellingPrice * 0.15) {
    aiInsights.push(`✅ 单次获客成本 $${cpa.toFixed(2)} 表现优秀，广告效率高`);
  }
  if (monthlyNetProfit > 3000) {
    aiInsights.push(`🚀 预计月净利润 $${monthlyNetProfit.toFixed(0)}，已达到中级 Dropshipper 水平`);
  } else if (monthlyNetProfit < 0) {
    aiInsights.push(`🔴 当前参数下预计亏损，建议提高售价或降低广告预算`);
  }
  if (nicheBenchmark.competition === "low") {
    aiInsights.push(`🎯 ${nicheBenchmark.label} 属于蓝海品类，竞争压力小，建议快速占领市场`);
  }

  return {
    landedCost, platformFee, grossProfitPerUnit, grossMargin,
    monthlyOrders, monthlyRevenue, monthlyProductCost, monthlyShipping,
    monthlyPlatformFee, monthlyRefundLoss, monthlyNetProfit, netMargin,
    adROAS, cpa, breakEvenOrders, riskLevel, riskReason, aiInsights,
  };
}

// ─── 格式化工具 ───────────────────────────────────────────────────────────────
const fmt = (n: number, decimals = 0) =>
  new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(n);

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

// ─── 滑块输入组件 ─────────────────────────────────────────────────────────────
function SliderInput({
  label, value, min, max, step, prefix, suffix,
  onChange, hint
}: {
  label: string; value: number; min: number; max: number; step: number;
  prefix?: string; suffix?: string;
  onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{
          color: "#e2e8f0", fontSize: 13, fontWeight: 700,
          background: "rgba(124,58,237,0.15)", padding: "2px 10px",
          borderRadius: 6, border: "1px solid rgba(124,58,237,0.3)",
        }}>
          {prefix}{value.toLocaleString()}{suffix}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: "100%", height: 4, borderRadius: 2,
          appearance: "none", cursor: "pointer",
          background: `linear-gradient(to right, #7c3aed ${((value - min) / (max - min)) * 100}%, rgba(124,58,237,0.2) 0%)`,
          outline: "none", border: "none",
        }}
      />
      {hint && <p style={{ color: "#475569", fontSize: 10, marginTop: 3 }}>{hint}</p>}
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
interface IncomePredictorProps {
  productCost?: number;   // 从供应商卡片传入的产品成本
  productName?: string;   // 产品名称
  className?: string;
}

export default function IncomePredictor({ productCost = 5, productName }: IncomePredictorProps) {
  const [expanded, setExpanded] = useState(false);
  const [inputs, setInputs] = useState<PredictionInputs>({
    sellingPrice: productCost * 3.5,  // 默认 3.5x 加价
    productCost: productCost,
    shippingCost: 3.5,
    monthlyTraffic: 5000,
    adSpend: 500,
    niche: "electronics",
    scenario: "average",
  });

  const set = useCallback(<K extends keyof PredictionInputs>(key: K, value: PredictionInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const result = useMemo(() => calculatePrediction(inputs), [inputs]);

  const riskColors = {
    low: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.3)", text: "#34d399" },
    medium: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.3)", text: "#fbbf24" },
    high: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", text: "#f87171" },
  };
  const riskColor = riskColors[result.riskLevel];

  return (
    <div style={{
      background: "rgba(8,8,20,0.6)",
      border: "1px solid rgba(124,58,237,0.25)",
      borderRadius: 14, overflow: "hidden",
      marginTop: 12,
    }}>
      {/* Header — 始终可见 */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <TrendingUp size={16} color="#fff" />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>
              Dropshipping 月收入预测
            </div>
            <div style={{ color: "#475569", fontSize: 11 }}>
              {expanded ? "收起计算器" : "AI 帮您预测这个产品的月收入潜力"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!expanded && result.monthlyNetProfit !== 0 && (
            <div style={{
              background: result.monthlyNetProfit > 0
                ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
              border: `1px solid ${result.monthlyNetProfit > 0 ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
              borderRadius: 8, padding: "4px 12px",
              color: result.monthlyNetProfit > 0 ? "#34d399" : "#f87171",
              fontSize: 13, fontWeight: 700,
            }}>
              {result.monthlyNetProfit > 0 ? "+" : ""}{fmt(result.monthlyNetProfit)}/月
            </div>
          )}
          {expanded ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

                {/* 左侧：输入参数 */}
                <div>
                  <h4 style={{ color: "#7c3aed", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                    参数设置
                  </h4>

                  {/* 场景选择 */}
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>预测场景</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(["conservative", "average", "optimistic"] as const).map(s => (
                        <button
                          key={s}
                          onClick={() => set("scenario", s)}
                          style={{
                            flex: 1, padding: "6px 4px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                            cursor: "pointer", border: "1px solid",
                            borderColor: inputs.scenario === s ? "#7c3aed" : "rgba(255,255,255,0.08)",
                            background: inputs.scenario === s ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.03)",
                            color: inputs.scenario === s ? "#a78bfa" : "#475569",
                            transition: "all 0.15s",
                          }}
                        >
                          {s === "conservative" ? "保守" : s === "average" ? "平均" : "乐观"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 品类选择 */}
                  <div style={{ marginBottom: 14 }}>
                    <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>产品品类</span>
                    <select
                      value={inputs.niche}
                      onChange={e => set("niche", e.target.value as keyof typeof NICHE_BENCHMARKS)}
                      style={{
                        width: "100%", background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7,
                        color: "#e2e8f0", fontSize: 12, padding: "7px 10px",
                        outline: "none", cursor: "pointer",
                      }}
                    >
                      {Object.entries(NICHE_BENCHMARKS).map(([key, val]) => (
                        <option key={key} value={key} style={{ background: "#0f0f1a" }}>
                          {val.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <SliderInput
                    label="目标售价" value={inputs.sellingPrice}
                    min={5} max={200} step={1} prefix="$"
                    onChange={v => set("sellingPrice", v)}
                    hint={`建议售价区间：$${(inputs.productCost * 2.5).toFixed(0)} - $${(inputs.productCost * 5).toFixed(0)}`}
                  />
                  <SliderInput
                    label="月自然流量" value={inputs.monthlyTraffic}
                    min={100} max={50000} step={100} suffix=" 访客"
                    onChange={v => set("monthlyTraffic", v)}
                    hint="来自 SEO、社媒等免费渠道的月访客数"
                  />
                  <SliderInput
                    label="月广告预算" value={inputs.adSpend}
                    min={0} max={5000} step={50} prefix="$"
                    onChange={v => set("adSpend", v)}
                    hint="Facebook/TikTok Ads 月预算"
                  />
                  <SliderInput
                    label="运费（每单）" value={inputs.shippingCost}
                    min={0} max={30} step={0.5} prefix="$"
                    onChange={v => set("shippingCost", v)}
                    hint="ePacket 约 $2-4，YunExpress 约 $3-6"
                  />
                </div>

                {/* 右侧：预测结果 */}
                <div>
                  <h4 style={{ color: "#10b981", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                    预测结果
                  </h4>

                  {/* 核心指标 */}
                  <div style={{
                    background: result.monthlyNetProfit > 0
                      ? "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))"
                      : "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))",
                    border: `1px solid ${result.monthlyNetProfit > 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                    borderRadius: 10, padding: "14px", marginBottom: 12,
                    textAlign: "center",
                  }}>
                    <div style={{ color: "#475569", fontSize: 11, marginBottom: 4 }}>预计月净利润</div>
                    <div style={{
                      fontSize: 28, fontWeight: 800,
                      color: result.monthlyNetProfit > 0 ? "#34d399" : "#f87171",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {result.monthlyNetProfit > 0 ? "+" : ""}{fmt(result.monthlyNetProfit)}
                    </div>
                    <div style={{ color: "#475569", fontSize: 11, marginTop: 4 }}>
                      净利率 {fmtPct(result.netMargin)} · 月营业额 {fmt(result.monthlyRevenue)}
                    </div>
                  </div>

                  {/* 关键指标网格 */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      { icon: ShoppingCart, label: "月订单数", value: `${result.monthlyOrders} 单`, color: "#7c3aed" },
                      { icon: Percent, label: "毛利率", value: fmtPct(result.grossMargin), color: "#0ea5e9" },
                      { icon: Target, label: "单次获客成本", value: fmt(result.cpa, 2), color: "#f59e0b" },
                      { icon: BarChart3, label: "广告 ROAS", value: `${result.adROAS.toFixed(1)}x`, color: "#10b981" },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: 8, padding: "10px 12px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                          <Icon size={11} color={color} />
                          <span style={{ color: "#475569", fontSize: 10 }}>{label}</span>
                        </div>
                        <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 700 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* 成本拆解 */}
                  <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 8, padding: "10px 12px", marginBottom: 12,
                  }}>
                    <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                      月度成本拆解
                    </div>
                    {[
                      { label: "产品成本", value: result.monthlyProductCost, color: "#7c3aed" },
                      { label: "运费", value: result.monthlyShipping, color: "#0ea5e9" },
                      { label: "平台费", value: result.monthlyPlatformFee, color: "#f59e0b" },
                      { label: "广告费", value: inputs.adSpend, color: "#ec4899" },
                      { label: "退款损失", value: result.monthlyRefundLoss, color: "#ef4444" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", marginBottom: 5,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                          <span style={{ color: "#64748b", fontSize: 11 }}>{label}</span>
                        </div>
                        <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600 }}>
                          {fmt(value)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 风险评估 */}
                  <div style={{
                    background: riskColor.bg,
                    border: `1px solid ${riskColor.border}`,
                    borderRadius: 8, padding: "10px 12px", marginBottom: 12,
                    display: "flex", alignItems: "flex-start", gap: 8,
                  }}>
                    {result.riskLevel === "low"
                      ? <CheckCircle2 size={14} color={riskColor.text} style={{ flexShrink: 0, marginTop: 1 }} />
                      : <AlertTriangle size={14} color={riskColor.text} style={{ flexShrink: 0, marginTop: 1 }} />
                    }
                    <div>
                      <div style={{ color: riskColor.text, fontSize: 11, fontWeight: 700 }}>
                        风险评级：{result.riskLevel === "low" ? "低风险" : result.riskLevel === "medium" ? "中等风险" : "高风险"}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>{result.riskReason}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI 洞察建议 */}
              {result.aiInsights.length > 0 && (
                <div style={{
                  background: "rgba(124,58,237,0.05)",
                  border: "1px solid rgba(124,58,237,0.2)",
                  borderRadius: 10, padding: "12px 14px",
                  marginTop: 4,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Zap size={12} color="#a78bfa" />
                    <span style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700 }}>AI 智能洞察</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {result.aiInsights.map((insight, i) => (
                      <div key={i} style={{ color: "#94a3b8", fontSize: 11, lineHeight: 1.5 }}>
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 免责声明 */}
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 6,
                marginTop: 10, padding: "8px 10px",
                background: "rgba(255,255,255,0.02)", borderRadius: 7,
              }}>
                <Info size={11} color="#334155" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ color: "#334155", fontSize: 10, lineHeight: 1.5, margin: 0 }}>
                  预测基于行业基准数据（Shopify 2025-2026），仅供参考。实际收入受市场竞争、广告质量、产品选择等多种因素影响。
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
