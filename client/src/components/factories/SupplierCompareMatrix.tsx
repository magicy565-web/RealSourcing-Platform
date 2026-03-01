import React, { useState } from "react";
import {
  X, ShieldCheck, Star, Package, Clock, DollarSign,
  TrendingUp, Award, Globe, Building2, CheckCircle2,
  AlertCircle, Sparkles, ChevronDown, ChevronUp, Info,
  BarChart3, Zap,
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
}

interface SupplierCompareMatrixProps {
  suppliers: SupplierForCompare[];
  onClose: () => void;
  onSelectSupplier?: (supplier: SupplierForCompare) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CERT_COLORS: Record<string, string> = {
  CE: "#3b82f6",
  FCC: "#8b5cf6",
  RoHS: "#10b981",
  ISO9001: "#f59e0b",
  "ISO 9001": "#f59e0b",
  BSCI: "#ec4899",
  FDA: "#ef4444",
  UL: "#06b6d4",
};

function CertBadge({ cert }: { cert: string }) {
  const color = CERT_COLORS[cert] || "#64748b";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: `${color}18`,
      border: `1px solid ${color}50`,
      borderRadius: 6, padding: "2px 8px",
      color, fontSize: 10, fontWeight: 700,
      letterSpacing: "0.04em",
    }}>
      <ShieldCheck size={9} />
      {cert}
    </span>
  );
}

function ScoreBar({ value, max = 100, color = "#7c3aed" }: { value: number; max?: number; color?: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 6, background: "rgba(255,255,255,0.06)",
        borderRadius: 3, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: 3, transition: "width 0.6s ease",
        }} />
      </div>
      <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, minWidth: 28 }}>
        {value}
      </span>
    </div>
  );
}

function AIRecommendBadge({ index, reason }: { index: number; reason?: string }) {
  const color = index >= 80 ? "#10b981" : index >= 60 ? "#f59e0b" : "#64748b";
  const label = index >= 80 ? "强烈推荐" : index >= 60 ? "推荐" : "一般";
  return (
    <div style={{
      background: `${color}12`,
      border: `1px solid ${color}40`,
      borderRadius: 10, padding: "10px 12px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: reason ? 6 : 0 }}>
        <Sparkles size={13} color={color} />
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>{label}</span>
        <span style={{
          marginLeft: "auto",
          background: `${color}25`,
          borderRadius: 6, padding: "1px 7px",
          color, fontSize: 12, fontWeight: 800,
        }}>{index}</span>
      </div>
      {reason && (
        <p style={{ color: "#94a3b8", fontSize: 11, lineHeight: 1.5, margin: 0 }}>
          {reason}
        </p>
      )}
    </div>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────────
function MatrixRow({
  label, icon, values, renderCell,
}: {
  label: string;
  icon: React.ReactNode;
  values: SupplierForCompare[];
  renderCell: (s: SupplierForCompare, i: number) => React.ReactNode;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `180px repeat(${values.length}, 1fr)`,
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      {/* Label */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "12px 16px",
        background: "rgba(255,255,255,0.02)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}>
        <span style={{ color: "#475569" }}>{icon}</span>
        <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>{label}</span>
      </div>
      {/* Cells */}
      {values.map((s, i) => (
        <div key={s.quoteId} style={{
          padding: "12px 14px",
          borderRight: i < values.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
          background: i === 0 ? "rgba(124,58,237,0.03)" : "transparent",
        }}>
          {renderCell(s, i)}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SupplierCompareMatrix({
  suppliers,
  onClose,
  onSelectSupplier,
}: SupplierCompareMatrixProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // 最多对比 4 家
  const displaySuppliers = suppliers.slice(0, 4);

  // 找出最佳值（用于高亮）
  const bestPrice = Math.min(...displaySuppliers.filter(s => s.unitPrice).map(s => s.unitPrice!));
  const bestMoq = Math.min(...displaySuppliers.filter(s => s.moq).map(s => s.moq!));
  const bestLeadTime = Math.min(...displaySuppliers.filter(s => s.leadTimeDays).map(s => s.leadTimeDays!));
  const bestMatch = Math.max(...displaySuppliers.map(s => s.matchScore));
  const bestAI = Math.max(...displaySuppliers.map(s => s.aiRecommendIndex ?? 0));

  const isBest = (val: number | undefined, best: number) =>
    val !== undefined && val === best;

  const toggleSection = (key: string) =>
    setExpandedSection(prev => (prev === key ? null : key));

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 960,
        maxHeight: "90vh",
        background: "linear-gradient(160deg,#08081a 0%,#0d0d22 100%)",
        border: "1px solid rgba(124,58,237,0.25)",
        borderRadius: 20,
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)",
      }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(124,58,237,0.06)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(124,58,237,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BarChart3 size={18} color="#a78bfa" />
            </div>
            <div>
              <h2 style={{ color: "#f1f5f9", fontWeight: 800, fontSize: 18, margin: 0 }}>
                AI 供应商对比矩阵
              </h2>
              <p style={{ color: "#64748b", fontSize: 12, margin: 0, marginTop: 2 }}>
                对比 {displaySuppliers.length} 家供应商 · AI 智能推荐
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)", border: "none",
              borderRadius: 8, padding: "8px", cursor: "pointer",
              color: "#64748b", display: "flex", alignItems: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLButtonElement).style.color = "#f1f5f9"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLButtonElement).style.color = "#64748b"; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable Content ── */}
        <div style={{ overflowY: "auto", flex: 1 }}>

          {/* ── Supplier Header Row ── */}
          <div style={{
            display: "grid",
            gridTemplateColumns: `180px repeat(${displaySuppliers.length}, 1fr)`,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            position: "sticky", top: 0, zIndex: 10,
          }}>
            <div style={{ padding: "16px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "#334155", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                对比维度
              </span>
            </div>
            {displaySuppliers.map((s, i) => (
              <div key={s.quoteId} style={{
                padding: "16px 14px",
                borderRight: i < displaySuppliers.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                background: i === 0 ? "rgba(124,58,237,0.05)" : "transparent",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: `rgba(${i === 0 ? "124,58,237" : i === 1 ? "14,165,233" : i === 2 ? "16,185,129" : "245,158,11"},0.2)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Building2 size={14} color={["#a78bfa", "#38bdf8", "#34d399", "#fbbf24"][i]} />
                  </div>
                  <div>
                    <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                      {s.factoryName}
                    </div>
                    {s.isVerified && (
                      <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
                        <CheckCircle2 size={10} color="#10b981" />
                        <span style={{ color: "#10b981", fontSize: 9, fontWeight: 700 }}>AI VERIFIED</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Match Score */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: s.matchScore === bestMatch ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${s.matchScore === bestMatch ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 8, padding: "4px 8px",
                }}>
                  <Zap size={11} color={s.matchScore === bestMatch ? "#a78bfa" : "#475569"} />
                  <span style={{ color: s.matchScore === bestMatch ? "#a78bfa" : "#64748b", fontWeight: 700, fontSize: 12 }}>
                    {s.matchScore}% 匹配
                  </span>
                  {s.matchScore === bestMatch && (
                    <span style={{ color: "#a78bfa", fontSize: 9, fontWeight: 800 }}>最高</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ══ Section 1: 工厂基础信息 ══ */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px",
              background: "rgba(255,255,255,0.02)",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
            }}
            onClick={() => toggleSection("basic")}
          >
            <Building2 size={13} color="#7c3aed" />
            <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", flex: 1 }}>
              工厂基础信息
            </span>
            {expandedSection === "basic" ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
          </div>

          {(expandedSection === "basic" || expandedSection === null) && (
            <>
              <MatrixRow
                label="所在地区"
                icon={<Globe size={13} />}
                values={displaySuppliers}
                renderCell={s => (
                  <span style={{ color: "#cbd5e1", fontSize: 12 }}>{s.location || "中国"}</span>
                )}
              />
              <MatrixRow
                label="成立年限"
                icon={<Building2 size={13} />}
                values={displaySuppliers}
                renderCell={s => (
                  <span style={{ color: "#cbd5e1", fontSize: 12 }}>
                    {s.foundedYear ? `${new Date().getFullYear() - s.foundedYear} 年` : "—"}
                  </span>
                )}
              />
              <MatrixRow
                label="员工规模"
                icon={<Building2 size={13} />}
                values={displaySuppliers}
                renderCell={s => (
                  <span style={{ color: "#cbd5e1", fontSize: 12 }}>{s.employeeCount || "—"}</span>
                )}
              />
              <MatrixRow
                label="主营市场"
                icon={<Globe size={13} />}
                values={displaySuppliers}
                renderCell={s => (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {(s.mainMarkets || ["欧洲", "北美"]).map(m => (
                      <span key={m} style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 4, padding: "1px 6px",
                        color: "#94a3b8", fontSize: 10,
                      }}>{m}</span>
                    ))}
                  </div>
                )}
              />
            </>
          )}

          {/* ══ Section 2: AI 验证认证 ══ */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px",
              background: "rgba(255,255,255,0.02)",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}
            onClick={() => toggleSection("certs")}
          >
            <ShieldCheck size={13} color="#10b981" />
            <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", flex: 1 }}>
              AI 验证认证
            </span>
            {expandedSection === "certs" ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
          </div>

          {(expandedSection === "certs" || expandedSection === null) && (
            <MatrixRow
              label="已验证认证"
              icon={<Award size={13} />}
              values={displaySuppliers}
              renderCell={s => (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {(s.certifications || []).length > 0
                    ? s.certifications!.map(c => <CertBadge key={c} cert={c} />)
                    : <span style={{ color: "#334155", fontSize: 11 }}>暂无认证信息</span>
                  }
                </div>
              )}
            />
          )}

          {/* ══ Section 3: 商业条款 ══ */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px",
              background: "rgba(255,255,255,0.02)",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}
            onClick={() => toggleSection("terms")}
          >
            <DollarSign size={13} color="#f59e0b" />
            <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", flex: 1 }}>
              商业条款
            </span>
            {expandedSection === "terms" ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
          </div>

          {(expandedSection === "terms" || expandedSection === null) && (
            <>
              <MatrixRow
                label="参考单价"
                icon={<DollarSign size={13} />}
                values={displaySuppliers}
                renderCell={s => {
                  const best = s.unitPrice !== undefined && s.unitPrice !== null && s.unitPrice === bestPrice;
                  return s.unitPrice ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: best ? "#34d399" : "#cbd5e1", fontWeight: best ? 700 : 400, fontSize: 13 }}>
                        ${s.unitPrice.toFixed(2)}
                      </span>
                      {best && (
                        <span style={{
                          background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)",
                          borderRadius: 4, padding: "1px 5px", color: "#34d399", fontSize: 9, fontWeight: 800,
                        }}>最低价</span>
                      )}
                    </div>
                  ) : <span style={{ color: "#334155", fontSize: 11 }}>待询价</span>;
                }}
              />
              <MatrixRow
                label="最低起订量"
                icon={<Package size={13} />}
                values={displaySuppliers}
                renderCell={s => {
                  const best = s.moq !== undefined && s.moq === bestMoq;
                  return s.moq ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: best ? "#34d399" : "#cbd5e1", fontWeight: best ? 700 : 400, fontSize: 13 }}>
                        {s.moq.toLocaleString()} 件
                      </span>
                      {best && (
                        <span style={{
                          background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)",
                          borderRadius: 4, padding: "1px 5px", color: "#34d399", fontSize: 9, fontWeight: 800,
                        }}>最低</span>
                      )}
                    </div>
                  ) : <span style={{ color: "#334155", fontSize: 11 }}>—</span>;
                }}
              />
              <MatrixRow
                label="交期预估"
                icon={<Clock size={13} />}
                values={displaySuppliers}
                renderCell={s => {
                  const best = s.leadTimeDays !== undefined && s.leadTimeDays === bestLeadTime;
                  return s.leadTimeDays ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: best ? "#34d399" : "#cbd5e1", fontWeight: best ? 700 : 400, fontSize: 13 }}>
                        {s.leadTimeDays} 天
                      </span>
                      {best && (
                        <span style={{
                          background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)",
                          borderRadius: 4, padding: "1px 5px", color: "#34d399", fontSize: 9, fontWeight: 800,
                        }}>最快</span>
                      )}
                    </div>
                  ) : <span style={{ color: "#334155", fontSize: 11 }}>—</span>;
                }}
              />
              <MatrixRow
                label="付款条件"
                icon={<DollarSign size={13} />}
                values={displaySuppliers}
                renderCell={s => (
                  <span style={{ color: "#cbd5e1", fontSize: 12 }}>{s.paymentTerms || "T/T 30%定金"}</span>
                )}
              />
              <MatrixRow
                label="私标支持"
                icon={<Award size={13} />}
                values={displaySuppliers}
                renderCell={s => (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {s.privateLabelSupport !== false ? (
                      <>
                        <CheckCircle2 size={13} color="#10b981" />
                        <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600 }}>支持</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} color="#64748b" />
                        <span style={{ color: "#64748b", fontSize: 12 }}>不支持</span>
                      </>
                    )}
                  </div>
                )}
              />
              <MatrixRow
                label="样品提供"
                icon={<Package size={13} />}
                values={displaySuppliers}
                renderCell={s => (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    {s.sampleAvailable !== false ? (
                      <>
                        <CheckCircle2 size={13} color="#10b981" />
                        <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600 }}>可提供</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} color="#64748b" />
                        <span style={{ color: "#64748b", fontSize: 12 }}>不可提供</span>
                      </>
                    )}
                  </div>
                )}
              />
            </>
          )}

          {/* ══ Section 4: AI 推荐指数 ══ */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px",
              background: "rgba(124,58,237,0.04)",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}
            onClick={() => toggleSection("ai")}
          >
            <Sparkles size={13} color="#a78bfa" />
            <span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", flex: 1 }}>
              AI 推荐指数
            </span>
            {expandedSection === "ai" ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />}
          </div>

          {(expandedSection === "ai" || expandedSection === null) && (
            <>
              <MatrixRow
                label="综合评分"
                icon={<Star size={13} />}
                values={displaySuppliers}
                renderCell={s => (
                  <ScoreBar value={s.factoryScore * 20} color="#f59e0b" />
                )}
              />
              <MatrixRow
                label="AI 推荐指数"
                icon={<TrendingUp size={13} />}
                values={displaySuppliers}
                renderCell={s => {
                  const idx = s.aiRecommendIndex ?? Math.round(s.matchScore * 0.9);
                  const best = idx === bestAI;
                  return <ScoreBar value={idx} color={best ? "#a78bfa" : "#64748b"} />;
                }}
              />
              <MatrixRow
                label="AI 推荐理由"
                icon={<Sparkles size={13} />}
                values={displaySuppliers}
                renderCell={s => {
                  const idx = s.aiRecommendIndex ?? Math.round(s.matchScore * 0.9);
                  return (
                    <AIRecommendBadge
                      index={idx}
                      reason={s.aiRecommendReason || (s.matchReasons?.[0])}
                    />
                  );
                }}
              />
            </>
          )}

          {/* ── Bottom Padding ── */}
          <div style={{ height: 16 }} />
        </div>

        {/* ── Footer: Action Buttons ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `180px repeat(${displaySuppliers.length}, 1fr)`,
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          flexShrink: 0,
        }}>
          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center" }}>
            <span style={{ color: "#334155", fontSize: 11, fontWeight: 700 }}>选择供应商</span>
          </div>
          {displaySuppliers.map((s, i) => {
            const isTop = (s.aiRecommendIndex ?? Math.round(s.matchScore * 0.9)) === bestAI;
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
                    borderRadius: 10, padding: "9px 14px",
                    color: isTop ? "#fff" : "#94a3b8",
                    fontSize: 12, fontWeight: 700,
                    cursor: "pointer", transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                  onMouseEnter={e => {
                    if (!isTop) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
                  }}
                  onMouseLeave={e => {
                    if (!isTop) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
                  }}
                >
                  {isTop && <Sparkles size={12} />}
                  {isTop ? "AI 推荐 · 选择" : "选择"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
