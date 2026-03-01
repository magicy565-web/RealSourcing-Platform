import React, { useState, useEffect } from "react";
import {
  Sparkles, Plus, X, Check, ChevronDown, ChevronUp,
  MessageSquare, DollarSign, Package, Shield, Clock,
  Truck, FileText, Loader2, Edit3, GripVertical,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AgendaItem {
  id: string;
  text: string;
  category: "pricing" | "quality" | "logistics" | "customization" | "certification" | "general";
  isAISuggested: boolean;
  isSelected: boolean;
}

interface AIAgendaSuggestionProps {
  factoryName?: string;
  productCategory?: string;
  sourcingContext?: string; // 来自AI对话的寻源上下文
  onAgendaChange?: (items: AgendaItem[]) => void;
  compact?: boolean;
}

// ─── Category Config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<AgendaItem["category"], { label: string; color: string; icon: React.ReactNode }> = {
  pricing:       { label: "价格条款",  color: "#10b981", icon: <DollarSign size={11} /> },
  quality:       { label: "品质管控",  color: "#3b82f6", icon: <Shield size={11} /> },
  logistics:     { label: "物流交期",  color: "#f59e0b", icon: <Truck size={11} /> },
  customization: { label: "定制需求",  color: "#8b5cf6", icon: <Package size={11} /> },
  certification: { label: "认证资质",  color: "#ec4899", icon: <FileText size={11} /> },
  general:       { label: "综合沟通",  color: "#64748b", icon: <MessageSquare size={11} /> },
};

// ─── AI 生成议题（模拟，实际可接入 LLM API）────────────────────────────────────
function generateAISuggestions(
  factoryName?: string,
  productCategory?: string,
  context?: string,
): AgendaItem[] {
  const baseItems: Omit<AgendaItem, "id" | "isAISuggested" | "isSelected">[] = [
    {
      text: `确认 ${productCategory || "产品"} 的最新报价及价格区间（含 MOQ 阶梯价格）`,
      category: "pricing",
    },
    {
      text: "了解工厂私标定制能力：包装设计、Logo 印刷、产品颜色/规格定制",
      category: "customization",
    },
    {
      text: "确认现有认证（CE/FCC/RoHS）的有效期及认证文件获取方式",
      category: "certification",
    },
    {
      text: "询问样品提供政策：样品费用、运费承担、样品交期",
      category: "quality",
    },
    {
      text: "了解正式订单交期：从付款到发货的完整时间线",
      category: "logistics",
    },
    {
      text: "确认付款条件：T/T 比例、信用证是否接受、PayPal 等",
      category: "pricing",
    },
    {
      text: "了解品质管控流程：IQC/IPQC/OQC 标准及第三方验货政策",
      category: "quality",
    },
    {
      text: "询问售后保障：质量问题处理流程、退换货政策",
      category: "general",
    },
  ];

  // 根据上下文动态添加
  if (context?.includes("蓝牙") || context?.includes("电子") || productCategory?.includes("电子")) {
    baseItems.splice(3, 0, {
      text: "确认 FCC/CE 认证的具体型号覆盖范围及测试报告",
      category: "certification",
    });
  }
  if (context?.includes("服装") || context?.includes("纺织") || productCategory?.includes("服装")) {
    baseItems.splice(3, 0, {
      text: "了解面料成分、OEKO-TEX 认证及洗涤标签定制",
      category: "certification",
    });
  }
  if (context?.includes("亚马逊") || context?.includes("FBA")) {
    baseItems.splice(5, 0, {
      text: "确认 FBA 标签服务：FNSKU 贴标、包装尺寸合规",
      category: "logistics",
    });
  }

  return baseItems.map((item, i) => ({
    ...item,
    id: `ai-${i}`,
    isAISuggested: true,
    isSelected: i < 5, // 默认选中前5条
  }));
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AIAgendaSuggestion({
  factoryName,
  productCategory,
  sourcingContext,
  onAgendaChange,
  compact = false,
}: AIAgendaSuggestionProps) {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [newItemText, setNewItemText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [generated, setGenerated] = useState(false);

  // 自动生成（首次加载）
  useEffect(() => {
    if (!generated) {
      handleGenerate();
    }
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    // 模拟 AI 生成延迟
    await new Promise(r => setTimeout(r, 1200));
    const suggestions = generateAISuggestions(factoryName, productCategory, sourcingContext);
    setItems(suggestions);
    setIsGenerating(false);
    setGenerated(true);
    onAgendaChange?.(suggestions.filter(i => i.isSelected));
  };

  const toggleItem = (id: string) => {
    const updated = items.map(item =>
      item.id === id ? { ...item, isSelected: !item.isSelected } : item
    );
    setItems(updated);
    onAgendaChange?.(updated.filter(i => i.isSelected));
  };

  const removeItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    setItems(updated);
    onAgendaChange?.(updated.filter(i => i.isSelected));
  };

  const addCustomItem = () => {
    if (!newItemText.trim()) return;
    const newItem: AgendaItem = {
      id: `custom-${Date.now()}`,
      text: newItemText.trim(),
      category: "general",
      isAISuggested: false,
      isSelected: true,
    };
    const updated = [...items, newItem];
    setItems(updated);
    setNewItemText("");
    onAgendaChange?.(updated.filter(i => i.isSelected));
  };

  const startEdit = (item: AgendaItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = (id: string) => {
    if (!editText.trim()) return;
    const updated = items.map(item =>
      item.id === id ? { ...item, text: editText.trim() } : item
    );
    setItems(updated);
    setEditingId(null);
    onAgendaChange?.(updated.filter(i => i.isSelected));
  };

  const selectedCount = items.filter(i => i.isSelected).length;

  return (
    <div style={{
      background: "rgba(124,58,237,0.06)",
      border: "1px solid rgba(124,58,237,0.2)",
      borderRadius: 14,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "14px 16px",
          cursor: "pointer",
          borderBottom: isExpanded ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}
        onClick={() => setIsExpanded(e => !e)}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "rgba(124,58,237,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Sparkles size={14} color="#a78bfa" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#e2e8f0", fontWeight: 700, fontSize: 13 }}>
            AI 议题建议
          </div>
          <div style={{ color: "#64748b", fontSize: 11, marginTop: 1 }}>
            {isGenerating
              ? "AI 正在生成议题..."
              : `已选 ${selectedCount} 条议题 · 基于您的寻源需求智能生成`
            }
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!isGenerating && (
            <button
              onClick={e => { e.stopPropagation(); handleGenerate(); }}
              style={{
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: 6, padding: "4px 10px",
                color: "#a78bfa", fontSize: 10, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              重新生成
            </button>
          )}
          {isExpanded ? <ChevronUp size={16} color="#475569" /> : <ChevronDown size={16} color="#475569" />}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div style={{ padding: "14px 16px" }}>
          {isGenerating ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "20px", justifyContent: "center",
            }}>
              <Loader2 size={18} color="#7c3aed" style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ color: "#64748b", fontSize: 13 }}>AI 正在分析您的寻源需求，生成个性化议题...</span>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <>
              {/* Category legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <span key={key} style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    background: `${cfg.color}12`,
                    border: `1px solid ${cfg.color}30`,
                    borderRadius: 5, padding: "2px 7px",
                    color: cfg.color, fontSize: 10, fontWeight: 600,
                  }}>
                    {cfg.icon}{cfg.label}
                  </span>
                ))}
              </div>

              {/* Agenda items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map(item => {
                  const cfg = CATEGORY_CONFIG[item.category];
                  const isEditing = editingId === item.id;
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 8,
                        background: item.isSelected
                          ? "rgba(124,58,237,0.08)"
                          : "rgba(255,255,255,0.02)",
                        border: `1px solid ${item.isSelected
                          ? "rgba(124,58,237,0.25)"
                          : "rgba(255,255,255,0.06)"}`,
                        borderRadius: 10, padding: "10px 12px",
                        transition: "all 0.2s",
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleItem(item.id)}
                        style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0, marginTop: 1,
                          background: item.isSelected ? "#7c3aed" : "rgba(255,255,255,0.06)",
                          border: `1px solid ${item.isSelected ? "#7c3aed" : "rgba(255,255,255,0.15)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", transition: "all 0.2s",
                        }}
                      >
                        {item.isSelected && <Check size={11} color="#fff" />}
                      </button>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <input
                              autoFocus
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveEdit(item.id); if (e.key === "Escape") setEditingId(null); }}
                              style={{
                                flex: 1, background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(124,58,237,0.4)",
                                borderRadius: 6, padding: "4px 8px",
                                color: "#e2e8f0", fontSize: 12, outline: "none",
                              }}
                            />
                            <button onClick={() => saveEdit(item.id)} style={{ background: "#7c3aed", border: "none", borderRadius: 5, padding: "4px 8px", color: "#fff", cursor: "pointer", fontSize: 11 }}>保存</button>
                            <button onClick={() => setEditingId(null)} style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 5, padding: "4px 8px", color: "#64748b", cursor: "pointer", fontSize: 11 }}>取消</button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                            <span style={{
                              color: item.isSelected ? "#e2e8f0" : "#475569",
                              fontSize: 12, lineHeight: 1.5, flex: 1,
                              transition: "color 0.2s",
                            }}>
                              {item.text}
                            </span>
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 3,
                            background: `${cfg.color}12`,
                            border: `1px solid ${cfg.color}25`,
                            borderRadius: 4, padding: "1px 6px",
                            color: cfg.color, fontSize: 9, fontWeight: 700,
                          }}>
                            {cfg.icon}{cfg.label}
                          </span>
                          {item.isAISuggested && (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 3,
                              color: "#475569", fontSize: 9,
                            }}>
                              <Sparkles size={8} />AI 建议
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {!isEditing && (
                        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => startEdit(item)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "#334155", padding: "3px",
                              borderRadius: 5, transition: "all 0.2s",
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#334155"; }}
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "#334155", padding: "3px",
                              borderRadius: 5, transition: "all 0.2s",
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#334155"; }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add custom item */}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  value={newItemText}
                  onChange={e => setNewItemText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addCustomItem(); }}
                  placeholder="添加自定义议题..."
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8, padding: "8px 12px",
                    color: "#e2e8f0", fontSize: 12, outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(124,58,237,0.4)"; }}
                  onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                />
                <button
                  onClick={addCustomItem}
                  disabled={!newItemText.trim()}
                  style={{
                    background: newItemText.trim() ? "rgba(124,58,237,0.2)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${newItemText.trim() ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 8, padding: "8px 14px",
                    color: newItemText.trim() ? "#a78bfa" : "#334155",
                    fontSize: 12, fontWeight: 700, cursor: newItemText.trim() ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", gap: 5,
                    transition: "all 0.2s",
                  }}
                >
                  <Plus size={13} />添加
                </button>
              </div>

              {/* Summary */}
              {selectedCount > 0 && (
                <div style={{
                  marginTop: 12,
                  background: "rgba(16,185,129,0.06)",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 8, padding: "8px 12px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Check size={13} color="#34d399" />
                  <span style={{ color: "#34d399", fontSize: 11, fontWeight: 600 }}>
                    已选 {selectedCount} 条议题将发送给工厂，帮助双方提前准备
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
