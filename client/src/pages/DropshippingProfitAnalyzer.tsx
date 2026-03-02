/**
 * DropshippingProfitAnalyzer — Dropshipping 利润预测分析页面
 * RealSourcing 4.x 核心差异化功能
 */
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, DollarSign, ShoppingCart,
  Info, AlertTriangle, CheckCircle2, Target,
  BarChart3, Percent, ArrowUp, ArrowDown, Minus,
  Package, Star, Award,
} from "lucide-react";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";

// ─── 行业基准数据 ─────────────────────────────────────────────────────────────
const BENCHMARKS = {
  conversionRates: { conservative: 0.012, average: 0.022, optimistic: 0.035 },
  refundRate: 0.03,
  platformFeeRate: 0.029,
  platformFeeFixed: 0.30,
  repeatPurchaseRate: 0.15,
  avgROAS: 2.5,
  seasonality: [0.85, 0.80, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.10, 1.05, 1.30, 1.55],
};

const NICHES = {
  electronics: { label: "电子产品", emoji: "📱", avgAOV: 45, avgMargin: 0.20, convRate: 0.018, competition: "high" as const, growth: 0.12, adCPM: 18, saturation: 85, tip: "高竞争，建议聚焦细分品类（如无线充电、智能家居配件）" },
  fashion: { label: "服装配饰", emoji: "👗", avgAOV: 35, avgMargin: 0.28, convRate: 0.022, competition: "high" as const, growth: 0.08, adCPM: 14, saturation: 78, tip: "退货率偏高，建议提供精准的尺码指南" },
  home: { label: "家居用品", emoji: "🏠", avgAOV: 42, avgMargin: 0.30, convRate: 0.026, competition: "medium" as const, growth: 0.18, adCPM: 12, saturation: 55, tip: "视觉驱动品类，高质量产品图片可显著提升转化率" },
  beauty: { label: "美妆护肤", emoji: "💄", avgAOV: 32, avgMargin: 0.38, convRate: 0.032, competition: "medium" as const, growth: 0.22, adCPM: 16, saturation: 60, tip: "KOL 合作效果显著，建议分配 30% 预算给网红营销" },
  pets: { label: "宠物用品", emoji: "🐾", avgAOV: 38, avgMargin: 0.32, convRate: 0.030, competition: "low" as const, growth: 0.25, adCPM: 10, saturation: 40, tip: "🔥 蓝海品类！宠物主人忠诚度高，复购率可达 25%+" },
  sports: { label: "运动健身", emoji: "💪", avgAOV: 44, avgMargin: 0.26, convRate: 0.021, competition: "medium" as const, growth: 0.15, adCPM: 13, saturation: 62, tip: "1月和9月为旺季，提前备货可获得 40% 额外收益" },
  toys: { label: "玩具礼品", emoji: "🎁", avgAOV: 28, avgMargin: 0.35, convRate: 0.028, competition: "low" as const, growth: 0.20, adCPM: 9, saturation: 38, tip: "Q4 销量是平时的 3-5 倍，提前布局节日营销" },
  health: { label: "健康保健", emoji: "💊", avgAOV: 50, avgMargin: 0.42, convRate: 0.024, competition: "medium" as const, growth: 0.30, adCPM: 20, saturation: 50, tip: "高利润品类，但需注意平台广告政策限制" },
  other: { label: "其他品类", emoji: "📦", avgAOV: 35, avgMargin: 0.24, convRate: 0.022, competition: "medium" as const, growth: 0.10, adCPM: 12, saturation: 55, tip: "建议先做市场调研，确认目标用户画像" },
};

type NicheKey = keyof typeof NICHES;
type Scenario = "conservative" | "average" | "optimistic";

interface Inputs {
  sellingPrice: number;
  productCost: number;
  shippingCost: number;
  monthlyTraffic: number;
  adSpend: number;
  niche: NicheKey;
  scenario: Scenario;
}

interface Result {
  landedCost: number; platformFee: number; grossProfitPerUnit: number; grossMargin: number;
  monthlyOrders: number; monthlyRevenue: number; monthlyNetProfit: number; netMargin: number;
  adROAS: number; cpa: number; breakEvenOrders: number;
  riskLevel: "low" | "medium" | "high"; riskScore: number;
  costs: { label: string; value: number; color: string; pct: number }[];
  monthlyForecast: { month: string; revenue: number; profit: number; orders: number }[];
  industryAvgProfit: number; vsIndustry: number;
  aiInsights: { type: "success" | "warning" | "info" | "tip"; text: string }[];
  productScore: number;
  scoreBreakdown: { label: string; score: number; max: number }[];
}

function calculate(inputs: Inputs): Result {
  const { sellingPrice, productCost, shippingCost, monthlyTraffic, adSpend, niche, scenario } = inputs;
  const nb = NICHES[niche];
  const convRate = (BENCHMARKS.conversionRates[scenario] * 0.6 + nb.convRate * 0.4);
  const landedCost = productCost + shippingCost;
  const platformFee = sellingPrice * BENCHMARKS.platformFeeRate + BENCHMARKS.platformFeeFixed;
  const grossProfitPerUnit = sellingPrice - landedCost - platformFee;
  const grossMargin = sellingPrice > 0 ? grossProfitPerUnit / sellingPrice : 0;
  const adRevenue = adSpend * BENCHMARKS.avgROAS;
  const adOrders = adRevenue / sellingPrice;
  const organicOrders = monthlyTraffic * convRate;
  const repeatOrders = (organicOrders + adOrders) * BENCHMARKS.repeatPurchaseRate;
  const monthlyOrders = Math.round(organicOrders + adOrders + repeatOrders);
  const monthlyRevenue = monthlyOrders * sellingPrice;
  const monthlyProductCost = monthlyOrders * productCost;
  const monthlyShipping = monthlyOrders * shippingCost;
  const monthlyPlatformFee = monthlyOrders * platformFee;
  const monthlyRefundLoss = monthlyRevenue * BENCHMARKS.refundRate;
  const monthlyNetProfit = monthlyRevenue - monthlyProductCost - monthlyShipping - monthlyPlatformFee - monthlyRefundLoss - adSpend;
  const netMargin = monthlyRevenue > 0 ? monthlyNetProfit / monthlyRevenue : 0;
  const adROAS = adSpend > 0 ? adRevenue / adSpend : 0;
  const cpa = adOrders > 0 ? adSpend / adOrders : 0;
  const breakEvenOrders = grossProfitPerUnit > 0 ? Math.ceil(adSpend / grossProfitPerUnit) : 9999;
  const totalCost = monthlyProductCost + monthlyShipping + monthlyPlatformFee + monthlyRefundLoss + adSpend;
  const costs = [
    { label: "产品成本", value: monthlyProductCost, color: "#7c3aed", pct: totalCost > 0 ? monthlyProductCost / totalCost : 0 },
    { label: "广告费用", value: adSpend, color: "#ec4899", pct: totalCost > 0 ? adSpend / totalCost : 0 },
    { label: "运费", value: monthlyShipping, color: "#0ea5e9", pct: totalCost > 0 ? monthlyShipping / totalCost : 0 },
    { label: "平台费", value: monthlyPlatformFee, color: "#f59e0b", pct: totalCost > 0 ? monthlyPlatformFee / totalCost : 0 },
    { label: "退款损失", value: monthlyRefundLoss, color: "#ef4444", pct: totalCost > 0 ? monthlyRefundLoss / totalCost : 0 },
  ];
  const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
  const monthlyForecast = MONTHS.map((month, i) => ({
    month, revenue: monthlyRevenue * BENCHMARKS.seasonality[i],
    profit: monthlyNetProfit * BENCHMARKS.seasonality[i],
    orders: Math.round(monthlyOrders * BENCHMARKS.seasonality[i]),
  }));
  const industryAvgProfit = nb.avgAOV * nb.avgMargin * 200;
  const vsIndustry = industryAvgProfit > 0 ? (monthlyNetProfit - industryAvgProfit) / industryAvgProfit : 0;
  const marginScore = Math.min(100, Math.max(0, grossMargin * 250));
  const competitionScore = nb.competition === "low" ? 90 : nb.competition === "medium" ? 60 : 30;
  const growthScore = Math.min(100, nb.growth * 300);
  const profitScore = Math.min(100, Math.max(0, monthlyNetProfit / 50));
  const productScore = Math.round(marginScore * 0.35 + competitionScore * 0.25 + growthScore * 0.20 + profitScore * 0.20);
  const scoreBreakdown = [
    { label: "利润空间", score: Math.round(marginScore), max: 35 },
    { label: "市场竞争", score: Math.round(competitionScore * 0.25), max: 25 },
    { label: "增长潜力", score: Math.round(growthScore * 0.20), max: 20 },
    { label: "收益规模", score: Math.round(profitScore * 0.20), max: 20 },
  ];
  let riskLevel: "low" | "medium" | "high" = "low";
  let riskScore = 20;
  if (grossMargin < 0.15) { riskLevel = "high"; riskScore = 80; }
  else if (grossMargin < 0.25) { riskLevel = "medium"; riskScore = 50; }
  if (nb.competition === "high") riskScore = Math.min(100, riskScore + 20);
  if (cpa > sellingPrice * 0.35) riskScore = Math.min(100, riskScore + 15);
  const aiInsights: Result["aiInsights"] = [];
  if (grossMargin >= 0.30) {
    aiInsights.push({ type: "success", text: `毛利率 ${(grossMargin * 100).toFixed(1)}% 超过行业均值 ${(nb.avgMargin * 100).toFixed(0)}%，定价策略优秀` });
  } else if (grossMargin < 0.20) {
    const suggestedPrice = (landedCost / 0.72).toFixed(2);
    aiInsights.push({ type: "warning", text: `毛利率偏低，建议将售价提升至 $${suggestedPrice} 以上，可将净利润提高约 ${Math.round((parseFloat(suggestedPrice) - sellingPrice) * monthlyOrders * 0.7)} 美元/月` });
  }
  if (monthlyNetProfit > 5000) {
    aiInsights.push({ type: "success", text: `月净利润 $${monthlyNetProfit.toFixed(0)} 已达到专业 Dropshipper 水平（Top 15%），建议开始考虑品牌化运营` });
  } else if (monthlyNetProfit > 1000) {
    aiInsights.push({ type: "info", text: `月净利润 $${monthlyNetProfit.toFixed(0)} 处于初级 Dropshipper 水平，将广告预算提高 50% 预计可使利润增长至 $${(monthlyNetProfit * 1.6).toFixed(0)}` });
  } else if (monthlyNetProfit < 0) {
    aiInsights.push({ type: "warning", text: `当前参数下预计月亏损 $${Math.abs(monthlyNetProfit).toFixed(0)}，建议降低广告预算至 $${(adSpend * 0.6).toFixed(0)} 或将售价提高 20%` });
  }
  if (nb.competition === "low") {
    aiInsights.push({ type: "tip", text: `${nb.label}是蓝海品类，市场饱和度仅 ${nb.saturation}%，建议在竞争加剧前快速占领市场份额` });
  }
  if (adROAS < 2.0 && adSpend > 0) {
    aiInsights.push({ type: "warning", text: `广告 ROAS ${adROAS.toFixed(1)}x 低于行业基准 2.5x，建议优化广告素材或使用 TikTok 短视频降低 CPM` });
  }
  const annualProfit = monthlyForecast.reduce((sum, m) => sum + m.profit, 0);
  if (annualProfit > 0) {
    const q4Profit = monthlyForecast[9].profit + monthlyForecast[10].profit + monthlyForecast[11].profit;
    aiInsights.push({ type: "info", text: `考虑季节性波动，预计全年净利润约 $${annualProfit.toFixed(0)}，Q4（10-12月）将贡献约 ${Math.round((q4Profit / annualProfit) * 100)}% 的年度利润` });
  }
  aiInsights.push({ type: "tip", text: nb.tip });
  return { landedCost, platformFee, grossProfitPerUnit, grossMargin, monthlyOrders, monthlyRevenue, monthlyNetProfit, netMargin, adROAS, cpa, breakEvenOrders, riskLevel, riskScore, costs, monthlyForecast, industryAvgProfit, vsIndustry, aiInsights, productScore, scoreBreakdown };
}

const fmt = (n: number, d = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : fmt(n);

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 70 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dasharray 0.8s ease" }} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle" fill={color} fontSize={size*0.22} fontWeight="800">{score}</text>
      <text x={size/2} y={size/2+size*0.18} textAnchor="middle" dominantBaseline="middle" fill="#475569" fontSize={size*0.12}>分</text>
    </svg>
  );
}

function Slider({ label, value, min, max, step, prefix="", suffix="", onChange, hint, color="#7c3aed" }: {
  label: string; value: number; min: number; max: number; step: number;
  prefix?: string; suffix?: string; onChange: (v: number) => void; hint?: string; color?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <span style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0", background: "rgba(124,58,237,0.15)", padding: "2px 10px", borderRadius: 7, border: `1px solid ${color}40` }}>
          {prefix}{value.toLocaleString()}{suffix}
        </span>
      </div>
      <div style={{ position: "relative", height: 20, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: 5, borderRadius: 3, background: `linear-gradient(to right, ${color}, ${color}cc)`, transition: "width 0.1s" }} />
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }} />
        <div style={{ position: "absolute", left: `calc(${pct}% - 8px)`, width: 16, height: 16, borderRadius: "50%", background: color, border: "2px solid rgba(255,255,255,0.9)", boxShadow: `0 0 8px ${color}80`, transition: "left 0.1s", pointerEvents: "none" }} />
      </div>
      {hint && <p style={{ color: "#334155", fontSize: 10, marginTop: 4 }}>{hint}</p>}
    </div>
  );
}

export default function DropshippingProfitAnalyzer() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"forecast" | "breakdown" | "insights">("forecast");
  const [inputs, setInputs] = useState<Inputs>({
    sellingPrice: 28, productCost: 8, shippingCost: 3.5,
    monthlyTraffic: 5000, adSpend: 500, niche: "electronics", scenario: "average",
  });

  const set = useCallback(<K extends keyof Inputs>(k: K, v: Inputs[K]) =>
    setInputs(p => ({ ...p, [k]: v })), []);

  const r = useMemo(() => calculate(inputs), [inputs]);
  const profitColor = r.monthlyNetProfit > 2000 ? "#10b981" : r.monthlyNetProfit > 0 ? "#f59e0b" : "#ef4444";
  const riskColors = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };
  const insightIcons = {
    success: <CheckCircle2 size={13} color="#10b981" />,
    warning: <AlertTriangle size={13} color="#f59e0b" />,
    info: <Info size={13} color="#0ea5e9" />,
    tip: <Star size={13} color="#a78bfa" />,
  };
  const insightColors = {
    success: { bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)", text: "#6ee7b7" },
    warning: { bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)", text: "#fcd34d" },
    info: { bg: "rgba(14,165,233,0.06)", border: "rgba(14,165,233,0.2)", text: "#7dd3fc" },
    tip: { bg: "rgba(124,58,237,0.06)", border: "rgba(124,58,237,0.2)", text: "#c4b5fd" },
  };
  const maxProfit = Math.max(...r.monthlyForecast.map(m => m.profit));
  const minProfit = Math.min(...r.monthlyForecast.map(m => m.profit));
  const profitRange = maxProfit - minProfit || 1;

  return (
    <div className="flex min-h-screen" style={{ background: "#09090b" }}>
      {/* 背景光晕 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
        <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)" }} />
      </div>

      <BuyerSidebar userRole={user?.role || "buyer"} />

      <div className="flex-1 overflow-auto relative z-10">
        <div style={{ padding: "24px", maxWidth: 1200 }}>

          {/* ── 页面标题 ── */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(124,58,237,0.4)", flexShrink: 0 }}>
                <TrendingUp size={22} color="#fff" />
              </div>
              <div>
                <h1 style={{ color: "#e2e8f0", fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
                  Dropshipping 利润预测分析
                </h1>
                <p style={{ color: "#475569", fontSize: 12, margin: "3px 0 0" }}>
                  基于 Shopify 2025-2026 全球行业基准数据 · 含季节性波动预测 · 实时计算
                </p>
              </div>
            </div>
          </div>

          {/* ── 主体：左右布局 ── */}
          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18, alignItems: "start" }}>

            {/* ── 左侧：参数配置 ── */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px" }}>
              <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                参数配置
              </div>

              {/* 预测场景 */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>预测场景</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {(["conservative", "average", "optimistic"] as const).map(s => {
                    const labels = { conservative: ["保守", "📉"], average: ["平均", "📊"], optimistic: ["乐观", "📈"] };
                    const active = inputs.scenario === s;
                    return (
                      <button key={s} onClick={() => set("scenario", s)} style={{ padding: "8px 4px", borderRadius: 9, cursor: "pointer", border: `1px solid ${active ? "#7c3aed" : "rgba(255,255,255,0.07)"}`, background: active ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.02)", color: active ? "#a78bfa" : "#475569", fontSize: 10, fontWeight: 700, transition: "all 0.15s", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 16 }}>{labels[s][1]}</span>
                        <span>{labels[s][0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 品类选择 */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>产品品类</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                  {(Object.entries(NICHES) as [NicheKey, typeof NICHES[NicheKey]][]).map(([key, val]) => {
                    const active = inputs.niche === key;
                    return (
                      <button key={key} onClick={() => set("niche", key)} style={{ padding: "7px 4px", borderRadius: 8, cursor: "pointer", border: `1px solid ${active ? "#7c3aed" : "rgba(255,255,255,0.06)"}`, background: active ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.02)", color: active ? "#c4b5fd" : "#475569", fontSize: 9, fontWeight: 600, transition: "all 0.12s", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <span style={{ fontSize: 14 }}>{val.emoji}</span>
                        <span>{val.label}</span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, padding: "7px 10px", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: 8 }}>
                  <p style={{ color: "#a78bfa", fontSize: 10, margin: 0, lineHeight: 1.5 }}>💡 {NICHES[inputs.niche].tip}</p>
                </div>
              </div>

              <Slider label="产品成本（每件）" value={inputs.productCost} min={1} max={200} step={0.5} prefix="$" onChange={v => set("productCost", v)} hint="从供应商采购的单件成本" />
              <Slider label="目标售价" value={inputs.sellingPrice} min={5} max={500} step={1} prefix="$" onChange={v => set("sellingPrice", v)} hint={`建议区间：$${(inputs.productCost * 2.5).toFixed(0)} - $${(inputs.productCost * 6).toFixed(0)}`} />
              <Slider label="月自然流量" value={inputs.monthlyTraffic} min={0} max={100000} step={500} suffix=" 访客" onChange={v => set("monthlyTraffic", v)} hint="来自 SEO、社媒、口碑的免费流量" color="#0ea5e9" />
              <Slider label="月广告预算" value={inputs.adSpend} min={0} max={10000} step={100} prefix="$" onChange={v => set("adSpend", v)} hint="Facebook / TikTok / Google Ads" color="#ec4899" />
              <Slider label="运费（每单）" value={inputs.shippingCost} min={0} max={30} step={0.5} prefix="$" onChange={v => set("shippingCost", v)} hint="ePacket $2-4 · YunExpress $3-6 · DHL $8-15" color="#f59e0b" />
            </div>

            {/* ── 右侧：分析结果 ── */}
            <div>
              {/* 核心利润卡 */}
              <div style={{ background: r.monthlyNetProfit > 0 ? "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.04))" : "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.04))", border: `1px solid ${r.monthlyNetProfit > 0 ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: 14, padding: "18px 22px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: 11, marginBottom: 6 }}>预计月净利润</div>
                  <motion.div key={r.monthlyNetProfit} initial={{ scale: 1.05 }} animate={{ scale: 1 }} style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.03em", color: profitColor, fontVariantNumeric: "tabular-nums" }}>
                    {r.monthlyNetProfit > 0 ? "+" : ""}{fmt(r.monthlyNetProfit)}
                  </motion.div>
                  <div style={{ color: "#475569", fontSize: 12, marginTop: 6, display: "flex", gap: 14 }}>
                    <span>净利率 <strong style={{ color: "#94a3b8" }}>{fmtPct(r.netMargin)}</strong></span>
                    <span>月营业额 <strong style={{ color: "#94a3b8" }}>{fmt(r.monthlyRevenue)}</strong></span>
                    <span>月订单 <strong style={{ color: "#94a3b8" }}>{r.monthlyOrders} 单</strong></span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <ScoreRing score={r.productScore} size={80} />
                  <div style={{ color: "#475569", fontSize: 10 }}>选品评分</div>
                </div>
              </div>

              {/* 次级指标 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
                {[
                  { label: "毛利率", value: fmtPct(r.grossMargin), icon: <Percent size={12} color="#7c3aed" /> },
                  { label: "广告 ROAS", value: `${r.adROAS.toFixed(1)}x`, icon: <Target size={12} color="#0ea5e9" /> },
                  { label: "单次获客", value: fmt(r.cpa, 2), icon: <DollarSign size={12} color="#f59e0b" /> },
                  { label: "盈亏平衡", value: `${r.breakEvenOrders}单`, icon: <BarChart3 size={12} color="#10b981" /> },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                      {icon}<span style={{ color: "#475569", fontSize: 10 }}>{label}</span>
                    </div>
                    <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 800 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* 标签页 */}
              <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
                {(["forecast", "breakdown", "insights"] as const).map(tab => {
                  const labels = { forecast: "📈 12个月预测", breakdown: "🧮 成本拆解", insights: "💡 AI 洞察" };
                  return (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "7px 14px", borderRadius: 9, cursor: "pointer", border: `1px solid ${activeTab === tab ? "rgba(124,58,237,0.5)" : "rgba(255,255,255,0.07)"}`, background: activeTab === tab ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.02)", color: activeTab === tab ? "#a78bfa" : "#475569", fontSize: 12, fontWeight: 600, transition: "all 0.15s" }}>
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>

              {/* 标签页内容 */}
              <AnimatePresence mode="wait">
                {activeTab === "forecast" && (
                  <motion.div key="forecast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px" }}>
                      <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>月度净利润预测（含季节性波动）</div>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
                        {r.monthlyForecast.map((m, i) => {
                          const h = Math.max(4, ((m.profit - minProfit) / profitRange) * 72 + 4);
                          const isPos = m.profit >= 0;
                          const isCurrent = i === new Date().getMonth();
                          return (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                              <div title={`${m.month}: ${fmt(m.profit)}`} style={{ width: "100%", height: h, background: isPos ? "linear-gradient(to top, #10b981, #34d399)" : "linear-gradient(to top, #ef4444, #f87171)", borderRadius: "3px 3px 0 0", opacity: isCurrent ? 1 : 0.7, border: isCurrent ? "1px solid rgba(255,255,255,0.3)" : "none", transition: "height 0.4s ease" }} />
                              <span style={{ color: isCurrent ? "#94a3b8" : "#334155", fontSize: 8, fontWeight: isCurrent ? 700 : 400 }}>{m.month.replace("月","")}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        {[
                          { label: "年度净利润", value: fmt(r.monthlyForecast.reduce((s,m) => s+m.profit, 0)) },
                          { label: "年度营业额", value: fmt(r.monthlyForecast.reduce((s,m) => s+m.revenue, 0)) },
                          { label: "年度订单量", value: `${r.monthlyForecast.reduce((s,m) => s+m.orders, 0).toLocaleString()} 单` },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ textAlign: "center" }}>
                            <div style={{ color: "#475569", fontSize: 10 }}>{label}</div>
                            <div style={{ color: "#e2e8f0", fontSize: 14, fontWeight: 800, marginTop: 3 }}>{value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ color: "#64748b", fontSize: 10, marginBottom: 4 }}>vs 行业平均水平</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {r.vsIndustry > 0 ? <ArrowUp size={16} color="#10b981" /> : r.vsIndustry < 0 ? <ArrowDown size={16} color="#ef4444" /> : <Minus size={16} color="#64748b" />}
                          <span style={{ fontSize: 18, fontWeight: 800, color: r.vsIndustry > 0 ? "#10b981" : r.vsIndustry < 0 ? "#ef4444" : "#64748b" }}>
                            {r.vsIndustry > 0 ? "+" : ""}{(r.vsIndustry * 100).toFixed(0)}%
                          </span>
                          <span style={{ color: "#475569", fontSize: 11 }}>行业均值 {fmt(r.industryAvgProfit)}/月</span>
                        </div>
                      </div>
                      <div style={{ padding: "6px 14px", borderRadius: 8, background: r.riskLevel === "low" ? "rgba(16,185,129,0.1)" : r.riskLevel === "medium" ? "rgba(245,158,11,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${riskColors[r.riskLevel]}40`, color: riskColors[r.riskLevel], fontSize: 12, fontWeight: 700 }}>
                        {r.riskLevel === "low" ? "✅ 低风险" : r.riskLevel === "medium" ? "⚠️ 中等风险" : "🔴 高风险"}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "breakdown" && (
                  <motion.div key="breakdown" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px" }}>
                      <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>月度成本拆解</div>
                      {r.costs.map(({ label, value, color, pct }) => (
                        <div key={label} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                              <span style={{ color: "#94a3b8", fontSize: 12 }}>{label}</span>
                            </div>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <span style={{ color: "#64748b", fontSize: 11 }}>{(pct * 100).toFixed(0)}%</span>
                              <span style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 700 }}>{fmt(value)}</span>
                            </div>
                          </div>
                          <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.05)" }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.6, delay: 0.1 }} style={{ height: "100%", borderRadius: 3, background: color }} />
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 700 }}>月净利润</span>
                        <span style={{ fontSize: 18, fontWeight: 900, color: r.monthlyNetProfit > 0 ? "#10b981" : "#ef4444" }}>
                          {r.monthlyNetProfit > 0 ? "+" : ""}{fmt(r.monthlyNetProfit)}
                        </span>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px" }}>
                      <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>单件经济学</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        {[
                          { label: "到岸成本", value: fmt(r.landedCost, 2), sub: "产品 + 运费" },
                          { label: "平台费", value: fmt(r.platformFee, 2), sub: "Shopify 2.9%+$0.30" },
                          { label: "单件毛利", value: fmt(r.grossProfitPerUnit, 2), sub: `毛利率 ${fmtPct(r.grossMargin)}` },
                        ].map(({ label, value, sub }) => (
                          <div key={label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "10px 12px", textAlign: "center" }}>
                            <div style={{ color: "#475569", fontSize: 10, marginBottom: 5 }}>{label}</div>
                            <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 800 }}>{value}</div>
                            <div style={{ color: "#334155", fontSize: 10, marginTop: 3 }}>{sub}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "insights" && (
                  <motion.div key="insights" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "16px", marginBottom: 10, display: "flex", gap: 16, alignItems: "center" }}>
                      <ScoreRing score={r.productScore} size={80} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>选品综合评分</div>
                        {r.scoreBreakdown.map(({ label, score, max }) => (
                          <div key={label} style={{ marginBottom: 7 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                              <span style={{ color: "#64748b", fontSize: 11 }}>{label}</span>
                              <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700 }}>{score}/{max}</span>
                            </div>
                            <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.05)" }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${(score / max) * 100}%` }} transition={{ duration: 0.5 }} style={{ height: "100%", borderRadius: 2, background: score / max > 0.7 ? "#10b981" : score / max > 0.4 ? "#f59e0b" : "#ef4444" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {r.aiInsights.map((insight, i) => {
                        const c = insightColors[insight.type];
                        return (
                          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <div style={{ flexShrink: 0, marginTop: 1 }}>{insightIcons[insight.type]}</div>
                            <p style={{ color: c.text, fontSize: 12, lineHeight: 1.6, margin: 0 }}>{insight.text}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 免责声明 */}
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 9, display: "flex", alignItems: "flex-start", gap: 8 }}>
                <Info size={11} color="#334155" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ color: "#334155", fontSize: 10, margin: 0, lineHeight: 1.5 }}>
                  预测基于 Shopify 2025-2026 全球行业基准数据，含季节性调整。实际收入受市场竞争、广告质量、产品选择、运营能力等多种因素影响，仅供参考。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
