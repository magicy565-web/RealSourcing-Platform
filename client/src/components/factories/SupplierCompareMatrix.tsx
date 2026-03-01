import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  X, ShieldCheck, Star, Package, Clock, DollarSign,
  TrendingUp, Award, Globe, Building2, CheckCircle2,
  AlertCircle, Sparkles, ChevronDown, ChevronUp, Info,
  BarChart3, Zap, Eye, EyeOff, Share2, ChevronLeft,
  ChevronRight, GripVertical, Minus, Plus, Copy, Check,
  Users, Calendar, Activity, Target, MessageSquare,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SupplierForCompare {
  quoteId: string;
  factoryId?: number;
  factoryName: string;
  factoryScore: number;
  isVerified: boolean;
  productName?: string;
  productCategory?: string;
  unitPrice?: number | null;
  currency?: string;
  moq?: number;
  leadTimeDays?: number;
  matchScore: number;
  matchReasons?: string[];
  certifications?: string[];
  location?: string;
  // 扩展字段（AI 对比矩阵专用）
  foundedYear?: number;
  employeeCount?: string;
  mainMarkets?: string[];
  paymentTerms?: string;
  aiRecommendReason?: string;
  aiRecommendIndex?: number; // 0-100
  exportExperience?: string;
  sampleAvailable?: boolean;
  privateLabelSupport?: boolean;
  // 多维度评分（来自 factoryScores 表）
  qualityScore?: number;
  serviceScore?: number;
  deliveryScore?: number;
  priceCompetitiveness?: number;
  onTimeDeliveryRate?: number;
  totalTransactions?: number;
  totalReviews?: number;
  responseRate?: number;
  avgResponseTime?: string;
}

interface SupplierCompareMatrixProps {
  suppliers: SupplierForCompare[];
  onClose: () => void;
  onSelectSupplier?: (supplier: SupplierForCompare) => void;
}

// ─── Industry Benchmarks ──────────────────────────────────────────────────────
const INDUSTRY_AVG = {
  unitPrice: null as null,      // 品类差异大，不做行业均值
  moq: 800,                     // 行业平均 MOQ
  leadTimeDays: 32,             // 行业平均交期（天）
  qualityScore: 4.2,
  deliveryScore: 4.0,
  priceCompetitiveness: 72,
  onTimeDeliveryRate: 85,
};

// ─── Cert Config ──────────────────────────────────────────────────────────────
const CERT_CONFIG: Record<string, { color: string; label: string; desc: string }> = {
  CE:       { color: "#3b82f6", label: "CE",       desc: "欧盟合规认证，进入欧洲市场必备" },
  FCC:      { color: "#8b5cf6", label: "FCC",      desc: "美国联邦通信委员会认证" },
  RoHS:     { color: "#10b981", label: "RoHS",     desc: "欧盟有害物质限制指令" },
  ISO9001:  { color: "#f59e0b", label: "ISO 9001", desc: "国际质量管理体系标准" },
  "ISO 9001": { color: "#f59e0b", label: "ISO 9001", desc: "国际质量管理体系标准" },
  BSCI:     { color: "#ec4899", label: "BSCI",     desc: "商业社会合规倡议，欧洲零售商要求" },
  FDA:      { color: "#ef4444", label: "FDA",      desc: "美国食品药品监督管理局认证" },
  UL:       { color: "#06b6d4", label: "UL",       desc: "美国安全认证实验室认证" },
  REACH:    { color: "#84cc16", label: "REACH",    desc: "欧盟化学品注册、评估、授权和限制" },
  OEKO:     { color: "#22c55e", label: "OEKO-TEX", desc: "纺织品生态安全认证" },
};

// ─── Section Config ───────────────────────────────────────────────────────────
type SectionKey = "basic" | "scores" | "terms" | "certs" | "ai";
const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "basic",  label: "工厂概况",   icon: <Building2 size={12} />, color: "#7c3aed" },
  { key: "scores", label: "综合评分",   icon: <BarChart3 size={12} />, color: "#f59e0b" },
  { key: "terms",  label: "商业条款",   icon: <DollarSign size={12} />, color: "#10b981" },
  { key: "certs",  label: "资质认证",   icon: <ShieldCheck size={12} />, color: "#3b82f6" },
  { key: "ai",     label: "AI 推荐",    icon: <Sparkles size={12} />, color: "#a78bfa" },
];

// ─── Utility Helpers ──────────────────────────────────────────────────────────
function isMobile() {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

/** 判断两个单元格值是否"相同"（用于差异高亮） */
function cellsAreSame(values: (string | number | boolean | null | undefined)[]): boolean {
  const defined = values.filter(v => v !== undefined && v !== null && v !== "—" && v !== "");
  if (defined.length < 2) return true; // 数据不足，视为相同（不高亮）
  return defined.every(v => String(v) === String(defined[0]));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function CertBadge({ cert, showTooltip = false }: { cert: string; showTooltip?: boolean }) {
  const cfg = CERT_CONFIG[cert] || { color: "#64748b", label: cert, desc: "" };
  const [hovered, setHovered] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        background: `${cfg.color}18`,
        border: `1px solid ${cfg.color}50`,
        borderRadius: 5, padding: "2px 7px",
        color: cfg.color, fontSize: 10, fontWeight: 700,
        letterSpacing: "0.04em", cursor: showTooltip ? "help" : "default",
        transition: "all 0.15s",
        ...(hovered && showTooltip ? { background: `${cfg.color}28` } : {}),
      }}>
        <ShieldCheck size={9} />
        {cfg.label}
      </span>
      {showTooltip && hovered && cfg.desc && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)",
          background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8, padding: "8px 10px",
          color: "#cbd5e1", fontSize: 11, lineHeight: 1.5,
          whiteSpace: "nowrap", zIndex: 100,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          pointerEvents: "none",
        }}>
          {cfg.desc}
          <div style={{
            position: "absolute", top: "100%", left: "50%",
            transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid rgba(255,255,255,0.12)",
          }} />
        </div>
      )}
    </span>
  );
}

function ScoreBar({
  value, max = 100, color = "#7c3aed", showValue = true, benchmark,
}: {
  value: number; max?: number; color?: string; showValue?: boolean; benchmark?: number;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const benchmarkPct = benchmark ? Math.min((benchmark / max) * 100, 100) : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
      <div style={{
        flex: 1, height: 6, background: "rgba(255,255,255,0.06)",
        borderRadius: 3, overflow: "visible", position: "relative",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 3, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
        }} />
        {benchmarkPct !== null && (
          <div style={{
            position: "absolute", top: -3, left: `${benchmarkPct}%`,
            width: 2, height: 12, background: "rgba(255,255,255,0.3)",
            borderRadius: 1, transform: "translateX(-50%)",
          }} title={`行业均值 ${benchmark}`} />
        )}
      </div>
      {showValue && (
        <span style={{ color: "#94a3b8", fontSize: 11, minWidth: 28, textAlign: "right" }}>
          {value.toFixed(value >= 10 ? 0 : 1)}
        </span>
      )}
    </div>
  );
}

function RadarChart({ scores, size = 100 }: {
  scores: { label: string; value: number; max: number; color: string }[];
  size?: number;
}) {
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const n = scores.length;
  const angle = (i: number) => (i * 2 * Math.PI) / n - Math.PI / 2;
  const point = (i: number, ratio: number) => ({
    x: cx + r * ratio * Math.cos(angle(i)),
    y: cy + r * ratio * Math.sin(angle(i)),
  });
  const gridLevels = [0.25, 0.5, 0.75, 1.0];
  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  const dataPoints = scores.map((s, i) => point(i, Math.min(s.value / s.max, 1)));
  const avgColor = "#7c3aed";

  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      {/* Grid */}
      {gridLevels.map(lvl => (
        <polygon key={lvl}
          points={scores.map((_, i) => { const p = point(i, lvl); return `${p.x},${p.y}`; }).join(" ")}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1}
        />
      ))}
      {/* Axes */}
      {scores.map((_, i) => {
        const p = point(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />;
      })}
      {/* Data polygon */}
      <path d={toPath(dataPoints)} fill={`${avgColor}22`} stroke={avgColor} strokeWidth={1.5} />
      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={avgColor} />
      ))}
      {/* Labels */}
      {scores.map((s, i) => {
        const p = point(i, 1.28);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fill="#64748b" fontSize={8} fontWeight={600}>
            {s.label}
          </text>
        );
      })}
    </svg>
  );
}

function BestTag({ label, color = "#34d399" }: { label: string; color?: string }) {
  return (
    <span style={{
      background: `${color}18`, border: `1px solid ${color}45`,
      borderRadius: 4, padding: "1px 6px",
      color, fontSize: 9, fontWeight: 800, letterSpacing: "0.03em",
      whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

function DiffTag() {
  return (
    <span style={{
      background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.35)",
      borderRadius: 4, padding: "1px 5px",
      color: "#fbbf24", fontSize: 9, fontWeight: 700,
    }}>差异</span>
  );
}

function EmptyCell({ reason }: { reason?: string }) {
  return (
    <span style={{
      color: "#334155", fontSize: 11, fontStyle: "italic",
      display: "flex", alignItems: "center", gap: 4,
    }}>
      <Minus size={10} style={{ opacity: 0.4 }} />
      {reason || "暂无数据"}
    </span>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", cursor: "help" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <Info size={11} color="#475569" />
      {show && (
        <div style={{
          position: "absolute", left: "calc(100% + 6px)", top: "50%",
          transform: "translateY(-50%)",
          background: "#1e293b", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8, padding: "8px 10px",
          color: "#cbd5e1", fontSize: 11, lineHeight: 1.6,
          width: 200, zIndex: 200,
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
          pointerEvents: "none",
        }}>
          {text}
        </div>
      )}
    </span>
  );
}

// ─── Row Component ────────────────────────────────────────────────────────────
interface MatrixRowProps {
  label: string;
  icon?: React.ReactNode;
  tooltip?: string;
  suppliers: SupplierForCompare[];
  renderCell: (s: SupplierForCompare, idx: number) => React.ReactNode;
  /** 用于差异检测的原始值提取 */
  getValue?: (s: SupplierForCompare) => string | number | boolean | null | undefined;
  showDiffOnly?: boolean;
  /** 移动端当前显示的供应商索引 */
  mobileActiveIdx?: number;
}

function MatrixRow({
  label, icon, tooltip, suppliers, renderCell, getValue, showDiffOnly, mobileActiveIdx = 0,
}: MatrixRowProps) {
  const mobile = isMobile();
  const values = getValue ? suppliers.map(getValue) : [];
  const allSame = getValue ? cellsAreSame(values) : false;
  const hasDiff = !allSame;

  if (showDiffOnly && allSame) return null;

  return (
    <div style={{
      display: mobile ? "block" : "grid",
      gridTemplateColumns: mobile ? undefined : `180px repeat(${suppliers.length}, 1fr)`,
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      background: hasDiff && showDiffOnly
        ? "rgba(245,158,11,0.04)"
        : "transparent",
      transition: "background 0.2s",
    }}>
      {/* Label cell */}
      <div style={{
        padding: mobile ? "8px 16px 4px" : "10px 16px",
        display: "flex", alignItems: "center", gap: 6,
        borderRight: mobile ? "none" : "1px solid rgba(255,255,255,0.04)",
        background: "rgba(255,255,255,0.01)",
      }}>
        {icon && <span style={{ color: "#475569", flexShrink: 0 }}>{icon}</span>}
        <span style={{ color: "#64748b", fontSize: 11, fontWeight: 600, flex: 1 }}>{label}</span>
        {hasDiff && !showDiffOnly && <DiffTag />}
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      {/* Value cells */}
      {mobile ? (
        // Mobile: show only active supplier
        <div style={{ padding: "4px 16px 10px 38px" }}>
          {renderCell(suppliers[mobileActiveIdx], mobileActiveIdx)}
        </div>
      ) : (
        suppliers.map((s, i) => (
          <div key={s.quoteId} style={{
            padding: "10px 14px",
            borderLeft: "1px solid rgba(255,255,255,0.04)",
            display: "flex", alignItems: "center",
          }}>
            {renderCell(s, i)}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({
  label, icon, color, isOpen, onToggle, diffCount,
}: {
  label: string; icon: React.ReactNode; color: string;
  isOpen: boolean; onToggle: () => void; diffCount?: number;
}) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px",
        background: isOpen ? `${color}08` : "rgba(255,255,255,0.02)",
        cursor: "pointer",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        transition: "background 0.2s",
        userSelect: "none",
      }}
    >
      <span style={{ color }}>{icon}</span>
      <span style={{
        color: "#94a3b8", fontSize: 11, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.1em", flex: 1,
      }}>
        {label}
      </span>
      {diffCount !== undefined && diffCount > 0 && (
        <span style={{
          background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)",
          borderRadius: 10, padding: "1px 7px",
          color: "#fbbf24", fontSize: 10, fontWeight: 700,
        }}>{diffCount} 项差异</span>
      )}
      <span style={{ color: "#475569" }}>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SupplierCompareMatrix({
  suppliers,
  onClose,
  onSelectSupplier,
}: SupplierCompareMatrixProps) {
  const [showDiffOnly, setShowDiffOnly] = useState(false);
  const [openSections, setOpenSections] = useState<Set<SectionKey>>(
    () => new Set(["basic", "scores", "terms", "certs", "ai"] as SectionKey[])
  );
  const [mobileActiveIdx, setMobileActiveIdx] = useState(0);
  const [orderedSuppliers, setOrderedSuppliers] = useState(suppliers);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );
  const dragSrcIdx = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Responsive listener
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const mobile = windowWidth < 768;

  // Sync suppliers prop → orderedSuppliers
  useEffect(() => {
    setOrderedSuppliers(suppliers);
  }, [suppliers]);

  // ── Computed best values ──
  const prices = orderedSuppliers.map(s => s.unitPrice).filter((p): p is number => p != null && p > 0);
  const moqs = orderedSuppliers.map(s => s.moq).filter((m): m is number => m != null && m > 0);
  const leads = orderedSuppliers.map(s => s.leadTimeDays).filter((l): l is number => l != null && l > 0);
  const ais = orderedSuppliers.map(s => s.aiRecommendIndex ?? Math.round(s.matchScore * 0.9));

  const bestPrice = prices.length ? Math.min(...prices) : null;
  const bestMoq = moqs.length ? Math.min(...moqs) : null;
  const bestLead = leads.length ? Math.min(...leads) : null;
  const bestAI = ais.length ? Math.max(...ais) : null;

  // ── Section toggle ──
  const toggleSection = (key: SectionKey) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── Drag-to-reorder columns ──
  const handleDragStart = (idx: number) => { dragSrcIdx.current = idx; };
  const handleDrop = (idx: number) => {
    if (dragSrcIdx.current === null || dragSrcIdx.current === idx) return;
    const next = [...orderedSuppliers];
    const [moved] = next.splice(dragSrcIdx.current, 1);
    next.splice(idx, 0, moved);
    setOrderedSuppliers(next);
    dragSrcIdx.current = null;
  };

  // ── Share ──
  const handleShare = useCallback(() => {
    const ids = orderedSuppliers.map(s => s.quoteId).join(",");
    const url = `${window.location.origin}${window.location.pathname}?compare=${encodeURIComponent(ids)}`;
    navigator.clipboard.writeText(url).then(() => {
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2000);
    });
  }, [orderedSuppliers]);

  // ── Diff count per section ──
  const getDiffCount = (getters: ((s: SupplierForCompare) => string | number | boolean | null | undefined)[]) => {
    return getters.filter(g => !cellsAreSame(orderedSuppliers.map(g))).length;
  };

  // ── Radar scores ──
  const radarScores = (s: SupplierForCompare) => [
    { label: "品质", value: s.qualityScore ?? s.factoryScore, max: 5, color: "#f59e0b" },
    { label: "服务", value: s.serviceScore ?? s.factoryScore * 0.95, max: 5, color: "#10b981" },
    { label: "交期", value: s.deliveryScore ?? s.factoryScore * 0.9, max: 5, color: "#3b82f6" },
    { label: "价格", value: (s.priceCompetitiveness ?? 72) / 20, max: 5, color: "#a78bfa" },
    { label: "响应", value: s.responseRate ? s.responseRate / 20 : s.factoryScore * 0.85, max: 5, color: "#ec4899" },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────
  const maxCols = mobile ? 1 : Math.min(orderedSuppliers.length, 4);
  const displaySuppliers = orderedSuppliers.slice(0, maxCols);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: mobile ? 0 : "16px",
    }}>
      <div style={{
        width: "100%", maxWidth: mobile ? "100%" : 960,
        height: mobile ? "100%" : "min(90vh, 800px)",
        background: "#0f172a",
        border: mobile ? "none" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: mobile ? 0 : 20,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 25px 80px rgba(0,0,0,0.7)",
      }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(124,58,237,0.06)",
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BarChart3 size={16} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#f1f5f9", fontSize: 15, fontWeight: 700 }}>
              AI 供应商对比矩阵
            </div>
            <div style={{ color: "#64748b", fontSize: 11, marginTop: 1 }}>
              {orderedSuppliers.length} 家供应商 · 拖拽列标题可调整顺序
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Diff toggle */}
            <button
              onClick={() => setShowDiffOnly(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 12px",
                background: showDiffOnly
                  ? "rgba(245,158,11,0.15)"
                  : "rgba(255,255,255,0.05)",
                border: showDiffOnly
                  ? "1px solid rgba(245,158,11,0.45)"
                  : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: showDiffOnly ? "#fbbf24" : "#64748b",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {showDiffOnly ? <Eye size={13} /> : <EyeOff size={13} />}
              {mobile ? "差异" : "仅显示差异"}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "6px 12px",
                background: shareState === "copied"
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(255,255,255,0.05)",
                border: shareState === "copied"
                  ? "1px solid rgba(16,185,129,0.4)"
                  : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                color: shareState === "copied" ? "#34d399" : "#64748b",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {shareState === "copied" ? <Check size={13} /> : <Share2 size={13} />}
              {mobile ? "" : shareState === "copied" ? "已复制" : "分享"}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#64748b",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Mobile Tab Navigator ── */}
        {mobile && (
          <div style={{
            display: "flex", alignItems: "center",
            padding: "10px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.02)",
            gap: 8, flexShrink: 0,
          }}>
            <button
              onClick={() => setMobileActiveIdx(i => Math.max(0, i - 1))}
              disabled={mobileActiveIdx === 0}
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: mobileActiveIdx === 0 ? "not-allowed" : "pointer",
                opacity: mobileActiveIdx === 0 ? 0.3 : 1,
                color: "#94a3b8",
              }}
            ><ChevronLeft size={14} /></button>

            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ color: "#f1f5f9", fontSize: 13, fontWeight: 700 }}>
                {orderedSuppliers[mobileActiveIdx]?.factoryName}
              </div>
              <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>
                {mobileActiveIdx + 1} / {orderedSuppliers.length}
              </div>
            </div>

            <button
              onClick={() => setMobileActiveIdx(i => Math.min(orderedSuppliers.length - 1, i + 1))}
              disabled={mobileActiveIdx === orderedSuppliers.length - 1}
              style={{
                width: 28, height: 28, borderRadius: 6,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: mobileActiveIdx === orderedSuppliers.length - 1 ? "not-allowed" : "pointer",
                opacity: mobileActiveIdx === orderedSuppliers.length - 1 ? 0.3 : 1,
                color: "#94a3b8",
              }}
            ><ChevronRight size={14} /></button>
          </div>
        )}

        {/* ── Column Headers (Desktop) ── */}
        {!mobile && (
          <div style={{
            display: "grid",
            gridTemplateColumns: `180px repeat(${displaySuppliers.length}, 1fr)`,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)",
            flexShrink: 0,
            position: "sticky", top: 0, zIndex: 10,
          }}>
            <div style={{ padding: "12px 16px" }}>
              <span style={{ color: "#334155", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                对比维度
              </span>
            </div>
            {displaySuppliers.map((s, i) => {
              const aiIdx = s.aiRecommendIndex ?? Math.round(s.matchScore * 0.9);
              const isTop = aiIdx === bestAI;
              return (
                <div
                  key={s.quoteId}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(i)}
                  style={{
                    padding: "12px 14px",
                    borderLeft: "1px solid rgba(255,255,255,0.06)",
                    background: isTop ? "rgba(124,58,237,0.07)" : "transparent",
                    cursor: "grab",
                    transition: "background 0.2s",
                    position: "relative",
                  }}
                >
                  {isTop && (
                    <div style={{
                      position: "absolute", top: 0, left: "50%",
                      transform: "translateX(-50%)",
                      background: "linear-gradient(90deg,#7c3aed,#a855f7)",
                      borderRadius: "0 0 6px 6px",
                      padding: "2px 10px",
                      color: "#fff", fontSize: 9, fontWeight: 800,
                      letterSpacing: "0.06em",
                      display: "flex", alignItems: "center", gap: 3,
                    }}>
                      <Sparkles size={8} /> AI 推荐
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: isTop ? 8 : 0 }}>
                    <GripVertical size={12} color="#334155" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: isTop ? "#e2e8f0" : "#cbd5e1",
                        fontSize: 12, fontWeight: 700,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {s.factoryName}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                        {s.isVerified && (
                          <span style={{
                            display: "flex", alignItems: "center", gap: 2,
                            color: "#10b981", fontSize: 9, fontWeight: 700,
                          }}>
                            <CheckCircle2 size={9} /> 已验厂
                          </span>
                        )}
                        <span style={{ color: "#475569", fontSize: 10 }}>
                          {s.location || "中国"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <div style={{
                          flex: 1, height: 3, background: "rgba(255,255,255,0.06)",
                          borderRadius: 2, overflow: "hidden",
                        }}>
                          <div style={{
                            width: `${s.matchScore}%`, height: "100%",
                            background: isTop
                              ? "linear-gradient(90deg,#7c3aed,#a855f7)"
                              : "rgba(100,116,139,0.5)",
                            borderRadius: 2,
                          }} />
                        </div>
                        <span style={{
                          color: isTop ? "#a78bfa" : "#64748b",
                          fontSize: 10, fontWeight: 700,
                        }}>{s.matchScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Scrollable Body ── */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>

          {/* ════ Section: 工厂概况 ════ */}
          <SectionHeader
            label="工厂概况"
            icon={<Building2 size={12} />}
            color="#7c3aed"
            isOpen={openSections.has("basic")}
            onToggle={() => toggleSection("basic")}
            diffCount={getDiffCount([
              s => s.location,
              s => s.foundedYear,
              s => s.employeeCount,
            ])}
          />
          {openSections.has("basic") && (
            <>
              <MatrixRow
                label="所在地区" icon={<Globe size={12} />}
                suppliers={displaySuppliers}
                getValue={s => s.location}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => s.location
                  ? <span style={{ color: "#cbd5e1", fontSize: 12 }}>{s.location}</span>
                  : <EmptyCell />
                }
              />
              <MatrixRow
                label="成立年限" icon={<Calendar size={12} />}
                tooltip="工厂成立至今的年数，年限越长通常代表更丰富的出口经验"
                suppliers={displaySuppliers}
                getValue={s => s.foundedYear ? new Date().getFullYear() - s.foundedYear : null}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  if (!s.foundedYear) return <EmptyCell />;
                  const years = new Date().getFullYear() - s.foundedYear;
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 600 }}>
                        {years} 年
                      </span>
                      {years >= 10 && (
                        <BestTag label="老厂" color="#f59e0b" />
                      )}
                    </div>
                  );
                }}
              />
              <MatrixRow
                label="员工规模" icon={<Users size={12} />}
                suppliers={displaySuppliers}
                getValue={s => s.employeeCount}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => s.employeeCount
                  ? <span style={{ color: "#cbd5e1", fontSize: 12 }}>{s.employeeCount}</span>
                  : <EmptyCell />
                }
              />
              <MatrixRow
                label="主营市场" icon={<Globe size={12} />}
                suppliers={displaySuppliers}
                getValue={s => (s.mainMarkets || []).join(",")}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  const markets = s.mainMarkets;
                  if (!markets || markets.length === 0) return <EmptyCell />;
                  return (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {markets.map(m => (
                        <span key={m} style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderRadius: 4, padding: "1px 6px",
                          color: "#94a3b8", fontSize: 10,
                        }}>{m}</span>
                      ))}
                    </div>
                  );
                }}
              />
              <MatrixRow
                label="语言能力" icon={<MessageSquare size={12} />}
                suppliers={displaySuppliers}
                getValue={s => s.exportExperience}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => s.exportExperience
                  ? <span style={{ color: "#cbd5e1", fontSize: 12 }}>{s.exportExperience}</span>
                  : <EmptyCell />
                }
              />
            </>
          )}

          {/* ════ Section: 综合评分 ════ */}
          <SectionHeader
            label="综合评分"
            icon={<BarChart3 size={12} />}
            color="#f59e0b"
            isOpen={openSections.has("scores")}
            onToggle={() => toggleSection("scores")}
            diffCount={getDiffCount([
              s => s.factoryScore,
              s => s.qualityScore,
              s => s.deliveryScore,
            ])}
          />
          {openSections.has("scores") && (
            <>
              {/* Radar overview row */}
              <div style={{
                display: mobile ? "block" : "grid",
                gridTemplateColumns: mobile ? undefined : `180px repeat(${displaySuppliers.length}, 1fr)`,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: "rgba(245,158,11,0.02)",
              }}>
                <div style={{
                  padding: "12px 16px",
                  display: "flex", alignItems: "center", gap: 6,
                  borderRight: mobile ? "none" : "1px solid rgba(255,255,255,0.04)",
                  background: "rgba(255,255,255,0.01)",
                }}>
                  <Activity size={12} color="#475569" />
                  <span style={{ color: "#64748b", fontSize: 11, fontWeight: 600 }}>能力雷达图</span>
                </div>
                {mobile ? (
                  <div style={{ padding: "12px 16px 12px 38px", display: "flex", justifyContent: "center" }}>
                    <RadarChart scores={radarScores(displaySuppliers[mobileActiveIdx])} size={110} />
                  </div>
                ) : (
                  displaySuppliers.map(s => (
                    <div key={s.quoteId} style={{
                      padding: "12px 14px",
                      borderLeft: "1px solid rgba(255,255,255,0.04)",
                      display: "flex", justifyContent: "center",
                    }}>
                      <RadarChart scores={radarScores(s)} size={100} />
                    </div>
                  ))
                )}
              </div>

              <MatrixRow
                label="综合评分" icon={<Star size={12} />}
                tooltip="平台综合评分（满分 5 分），基于品质、服务、交期、价格等维度加权计算"
                suppliers={displaySuppliers}
                getValue={s => s.factoryScore}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={(s, i) => {
                  const best = displaySuppliers.every(o => o.factoryScore <= s.factoryScore);
                  return (
                    <div style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ color: best ? "#fbbf24" : "#cbd5e1", fontSize: 13, fontWeight: 700 }}>
                          ★ {s.factoryScore.toFixed(1)}
                        </span>
                        {best && <BestTag label="最高" color="#f59e0b" />}
                      </div>
                      <ScoreBar value={s.factoryScore} max={5} color="#f59e0b" showValue={false} />
                    </div>
                  );
                }}
              />
              <MatrixRow
                label="品质评分" icon={<Award size={12} />}
                tooltip="基于买家评价和验厂报告综合计算的品质维度评分"
                suppliers={displaySuppliers}
                getValue={s => s.qualityScore ?? s.factoryScore}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  const val = s.qualityScore ?? s.factoryScore;
                  return (
                    <div style={{ width: "100%" }}>
                      <ScoreBar value={val} max={5} color="#10b981"
                        benchmark={INDUSTRY_AVG.qualityScore} />
                      <div style={{ color: "#475569", fontSize: 9, marginTop: 3 }}>
                        行业均值 {INDUSTRY_AVG.qualityScore}
                      </div>
                    </div>
                  );
                }}
              />
              <MatrixRow
                label="交期履约率" icon={<Clock size={12} />}
                tooltip="按时交货的订单比例，行业均值约 85%"
                suppliers={displaySuppliers}
                getValue={s => s.onTimeDeliveryRate ?? s.deliveryScore}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  const rate = s.onTimeDeliveryRate;
                  if (rate == null) return <EmptyCell reason="数据积累中" />;
                  const best = displaySuppliers.every(o => (o.onTimeDeliveryRate ?? 0) <= rate);
                  return (
                    <div style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ color: best ? "#34d399" : "#cbd5e1", fontSize: 12, fontWeight: 600 }}>
                          {rate.toFixed(0)}%
                        </span>
                        {best && <BestTag label="最高" />}
                      </div>
                      <ScoreBar value={rate} max={100} color="#3b82f6"
                        benchmark={INDUSTRY_AVG.onTimeDeliveryRate} />
                    </div>
                  );
                }}
              />
              <MatrixRow
                label="成交记录" icon={<Activity size={12} />}
                tooltip="平台内累计完成的交易笔数，数量越多代表经验越丰富"
                suppliers={displaySuppliers}
                getValue={s => s.totalTransactions}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  if (s.totalTransactions == null) return <EmptyCell reason="数据积累中" />;
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 600 }}>
                        {s.totalTransactions.toLocaleString()} 笔
                      </span>
                      {s.totalReviews != null && (
                        <span style={{ color: "#475569", fontSize: 10 }}>
                          {s.totalReviews} 评价
                        </span>
                      )}
                    </div>
                  );
                }}
              />
            </>
          )}

          {/* ════ Section: 商业条款 ════ */}
          <SectionHeader
            label="商业条款"
            icon={<DollarSign size={12} />}
            color="#10b981"
            isOpen={openSections.has("terms")}
            onToggle={() => toggleSection("terms")}
            diffCount={getDiffCount([
              s => s.unitPrice,
              s => s.moq,
              s => s.leadTimeDays,
              s => s.paymentTerms,
              s => s.privateLabelSupport,
              s => s.sampleAvailable,
            ])}
          />
          {openSections.has("terms") && (
            <>
              <MatrixRow
                label="参考单价" icon={<DollarSign size={12} />}
                tooltip="基于您的预算区间估算的参考价格，实际价格以双方谈判为准"
                suppliers={displaySuppliers}
                getValue={s => s.unitPrice}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  if (!s.unitPrice) return <EmptyCell reason="待询价" />;
                  const isBest = bestPrice !== null && s.unitPrice === bestPrice;
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        color: isBest ? "#34d399" : "#cbd5e1",
                        fontSize: 14, fontWeight: isBest ? 800 : 600,
                      }}>
                        ${s.unitPrice.toFixed(2)}
                      </span>
                      {isBest && <BestTag label="最低价" />}
                    </div>
                  );
                }}
              />
              <MatrixRow
                label="最低起订量" icon={<Package size={12} />}
                tooltip={`行业均值约 ${INDUSTRY_AVG.moq.toLocaleString()} 件，低于均值代表更灵活的合作门槛`}
                suppliers={displaySuppliers}
                getValue={s => s.moq}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  if (!s.moq) return <EmptyCell />;
                  const isBest = bestMoq !== null && s.moq === bestMoq;
                  const belowAvg = s.moq < INDUSTRY_AVG.moq;
                  return (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{
                          color: isBest ? "#34d399" : "#cbd5e1",
                          fontSize: 13, fontWeight: isBest ? 700 : 500,
                        }}>
                          {s.moq.toLocaleString()} 件
                        </span>
                        {isBest && <BestTag label="最低" />}
                        {belowAvg && !isBest && (
                          <span style={{ color: "#64748b", fontSize: 9 }}>低于均值</span>
                        )}
                      </div>
                      <div style={{ color: "#475569", fontSize: 9 }}>
                        行业均值 {INDUSTRY_AVG.moq.toLocaleString()} 件
                      </div>
                    </div>
                  );
                }}
              />
              <MatrixRow
                label="交期预估" icon={<Clock size={12} />}
                tooltip={`行业均值约 ${INDUSTRY_AVG.leadTimeDays} 天，包含生产和国内运输时间`}
                suppliers={displaySuppliers}
                getValue={s => s.leadTimeDays}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  if (!s.leadTimeDays) return <EmptyCell />;
                  const isBest = bestLead !== null && s.leadTimeDays === bestLead;
                  const aboveAvg = s.leadTimeDays > INDUSTRY_AVG.leadTimeDays;
                  return (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{
                          color: isBest ? "#34d399" : aboveAvg ? "#f87171" : "#cbd5e1",
                          fontSize: 13, fontWeight: isBest ? 700 : 500,
                        }}>
                          {s.leadTimeDays} 天
                        </span>
                        {isBest && <BestTag label="最快" />}
                        {aboveAvg && !isBest && (
                          <span style={{ color: "#64748b", fontSize: 9 }}>高于均值</span>
                        )}
                      </div>
                      <div style={{ color: "#475569", fontSize: 9 }}>
                        行业均值 {INDUSTRY_AVG.leadTimeDays} 天
                      </div>
                    </div>
                  );
                }}
              />
              <MatrixRow
                label="付款条件" icon={<DollarSign size={12} />}
                suppliers={displaySuppliers}
                getValue={s => s.paymentTerms}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => s.paymentTerms
                  ? <span style={{ color: "#cbd5e1", fontSize: 12 }}>{s.paymentTerms}</span>
                  : <EmptyCell />
                }
              />
              <MatrixRow
                label="私标支持" icon={<Award size={12} />}
                tooltip="是否支持在产品上印制您的品牌 Logo 和包装设计"
                suppliers={displaySuppliers}
                getValue={s => s.privateLabelSupport}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  if (s.privateLabelSupport === undefined) return <EmptyCell />;
                  return s.privateLabelSupport ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <CheckCircle2 size={13} color="#10b981" />
                      <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600 }}>支持</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <AlertCircle size={13} color="#64748b" />
                      <span style={{ color: "#64748b", fontSize: 12 }}>不支持</span>
                    </div>
                  );
                }}
              />
              <MatrixRow
                label="样品提供" icon={<Package size={12} />}
                tooltip="是否可在下单前提供实物样品，通常需支付样品费和运费"
                suppliers={displaySuppliers}
                getValue={s => s.sampleAvailable}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  if (s.sampleAvailable === undefined) return <EmptyCell />;
                  return s.sampleAvailable ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <CheckCircle2 size={13} color="#10b981" />
                      <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600 }}>可提供</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <AlertCircle size={13} color="#64748b" />
                      <span style={{ color: "#64748b", fontSize: 12 }}>不可提供</span>
                    </div>
                  );
                }}
              />
            </>
          )}

          {/* ════ Section: 资质认证 ════ */}
          <SectionHeader
            label="资质认证"
            icon={<ShieldCheck size={12} />}
            color="#3b82f6"
            isOpen={openSections.has("certs")}
            onToggle={() => toggleSection("certs")}
            diffCount={getDiffCount([s => (s.certifications || []).join(",")])}
          />
          {openSections.has("certs") && (
            <MatrixRow
              label="已验证认证" icon={<ShieldCheck size={12} />}
              tooltip="经 AI 验厂系统核实的有效认证，悬停查看认证说明"
              suppliers={displaySuppliers}
              getValue={s => (s.certifications || []).join(",")}
              showDiffOnly={showDiffOnly}
              mobileActiveIdx={mobileActiveIdx}
              renderCell={s => {
                const certs = s.certifications || [];
                if (certs.length === 0) return <EmptyCell reason="暂无认证记录" />;
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {certs.map(c => <CertBadge key={c} cert={c} showTooltip />)}
                  </div>
                );
              }}
            />
          )}

          {/* ════ Section: AI 推荐 ════ */}
          <SectionHeader
            label="AI 推荐"
            icon={<Sparkles size={12} />}
            color="#a78bfa"
            isOpen={openSections.has("ai")}
            onToggle={() => toggleSection("ai")}
            diffCount={getDiffCount([s => s.aiRecommendIndex ?? Math.round(s.matchScore * 0.9)])}
          />
          {openSections.has("ai") && (
            <>
              <MatrixRow
                label="AI 匹配度" icon={<Target size={12} />}
                tooltip="基于您的寻源需求（品类、预算、交期、认证要求）与供应商能力的综合匹配度"
                suppliers={displaySuppliers}
                getValue={s => s.matchScore}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  const isBest = displaySuppliers.every(o => o.matchScore <= s.matchScore);
                  return (
                    <div style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{
                          color: isBest ? "#a78bfa" : "#cbd5e1",
                          fontSize: 13, fontWeight: 700,
                        }}>{s.matchScore}%</span>
                        {isBest && <BestTag label="最高匹配" color="#a78bfa" />}
                      </div>
                      <ScoreBar value={s.matchScore} max={100} color="#7c3aed" showValue={false} />
                    </div>
                  );
                }}
              />
              <MatrixRow
                label="AI 推荐指数" icon={<TrendingUp size={12} />}
                tooltip="综合匹配度、历史成交、响应速度、认证完整度等多维度计算的 AI 推荐得分"
                suppliers={displaySuppliers}
                getValue={s => s.aiRecommendIndex ?? Math.round(s.matchScore * 0.9)}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  const idx = s.aiRecommendIndex ?? Math.round(s.matchScore * 0.9);
                  const isBest = idx === bestAI;
                  return (
                    <div style={{ width: "100%" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{
                          color: isBest ? "#a78bfa" : "#94a3b8",
                          fontSize: 13, fontWeight: 700,
                        }}>{idx}</span>
                        {isBest && <BestTag label="AI 首选" color="#a78bfa" />}
                      </div>
                      <ScoreBar value={idx} max={100} color={isBest ? "#7c3aed" : "#475569"} showValue={false} />
                    </div>
                  );
                }}
              />
              <MatrixRow
                label="AI 推荐理由" icon={<Sparkles size={12} />}
                suppliers={displaySuppliers}
                getValue={s => s.aiRecommendReason || (s.matchReasons?.[0])}
                showDiffOnly={showDiffOnly}
                mobileActiveIdx={mobileActiveIdx}
                renderCell={s => {
                  const idx = s.aiRecommendIndex ?? Math.round(s.matchScore * 0.9);
                  const reason = s.aiRecommendReason || s.matchReasons?.[0];
                  const level = idx >= 85 ? "强烈推荐" : idx >= 70 ? "推荐" : "可考虑";
                  const levelColor = idx >= 85 ? "#a78bfa" : idx >= 70 ? "#34d399" : "#64748b";
                  return (
                    <div>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: `${levelColor}15`,
                        border: `1px solid ${levelColor}40`,
                        borderRadius: 5, padding: "2px 8px",
                        color: levelColor, fontSize: 10, fontWeight: 700,
                        marginBottom: reason ? 5 : 0,
                      }}>
                        <Zap size={9} /> {level}
                      </span>
                      {reason && (
                        <div style={{ color: "#64748b", fontSize: 11, lineHeight: 1.5 }}>
                          {reason}
                        </div>
                      )}
                      {s.matchReasons && s.matchReasons.length > 1 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                          {s.matchReasons.slice(1).map((r, i) => (
                            <span key={i} style={{
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.07)",
                              borderRadius: 4, padding: "1px 5px",
                              color: "#475569", fontSize: 9,
                            }}>{r}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
            </>
          )}

          <div style={{ height: 20 }} />
        </div>

        {/* ── Footer: CTA ── */}
        <div style={{
          display: mobile ? "block" : "grid",
          gridTemplateColumns: mobile ? undefined : `180px repeat(${displaySuppliers.length}, 1fr)`,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          flexShrink: 0,
          padding: mobile ? "12px 16px" : undefined,
        }}>
          {!mobile && (
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "center" }}>
              <span style={{ color: "#334155", fontSize: 11, fontWeight: 700 }}>选择供应商</span>
            </div>
          )}
          {mobile ? (
            <button
              onClick={() => onSelectSupplier?.(orderedSuppliers[mobileActiveIdx])}
              style={{
                width: "100%",
                background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                border: "none", borderRadius: 12,
                padding: "13px", color: "#fff",
                fontSize: 14, fontWeight: 700,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <Sparkles size={14} />
              选择 {orderedSuppliers[mobileActiveIdx]?.factoryName} · 发起询盘
            </button>
          ) : (
            displaySuppliers.map(s => {
              const aiIdx = s.aiRecommendIndex ?? Math.round(s.matchScore * 0.9);
              const isTop = aiIdx === bestAI;
              return (
                <div key={s.quoteId} style={{
                  padding: "12px 14px",
                  borderLeft: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <button
                    onClick={() => onSelectSupplier?.(s)}
                    style={{
                      width: "100%",
                      background: isTop
                        ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                        : "rgba(255,255,255,0.05)",
                      border: isTop ? "none" : "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 10, padding: "10px 14px",
                      color: isTop ? "#fff" : "#94a3b8",
                      fontSize: 12, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}
                    onMouseEnter={e => {
                      if (!isTop) {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                        (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isTop) {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                        (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8";
                      }
                    }}
                  >
                    {isTop && <Sparkles size={12} />}
                    {isTop ? "AI 推荐 · 选择" : "选择此供应商"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
