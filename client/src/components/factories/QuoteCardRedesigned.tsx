import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, MapPin, Star, CheckCircle2,
  Handshake, FileText, Video, ArrowRight, X, Loader, AlertCircle,
  TrendingUp, Package, Clock, DollarSign
} from "lucide-react";

interface QuoteCard {
  quoteId: string;
  factoryId?: number;
  factoryName: string;
  factoryScore: number;
  isVerified: boolean;
  unitPrice?: number | null;
  moq?: number;
  leadTimeDays?: number;
  matchScore: number;
  location?: string;
  certifications?: string[];
  matchReasons?: string[];
}

type FlowStep = "idle" | "inquiry_sent" | "rfq_sent" | "meeting_booked";
type ActionState = "idle" | "loading" | "completed" | "error";

interface QuoteCardRedesignedProps {
  quote: QuoteCard;
  onAction?: (action: "inquiry" | "rfq" | "meeting") => void;
  demandId?: number;
  matchResultId?: number;
}

// ─── 表单输入框组件（带 focus 状态）──────────────────────────────────────────
function FormInput({
  type = "text",
  placeholder,
  value,
  onChange,
  label,
  required,
  minHeight,
}: {
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange: (v: string) => void;
  label: string;
  required?: boolean;
  minHeight?: number;
}) {
  const [focused, setFocused] = useState(false);
  const isTextarea = minHeight !== undefined;

  const baseStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    background: focused ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.05)",
    border: `1px solid ${focused ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 8,
    color: "#f1f5f9",
    fontSize: 13,
    boxSizing: "border-box" as const,
    outline: "none",
    transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
    boxShadow: focused ? "0 0 0 3px rgba(124,58,237,0.12)" : "none",
    fontFamily: "inherit",
    ...(isTextarea ? { minHeight, resize: "vertical" as const } : {}),
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5 }}>
        {label} {required && <span style={{ color: "#f87171" }}>*</span>}
      </label>
      {isTextarea ? (
        <textarea
          placeholder={placeholder}
          value={value as string}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={baseStyle}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={baseStyle}
        />
      )}
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export default function QuoteCardRedesigned({ quote, onAction, demandId = 1, matchResultId = 1 }: QuoteCardRedesignedProps) {
  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"rfq" | "meeting" | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Form state
  const [rfqQuantity, setRfqQuantity] = useState<number | null>(null);
  const [rfqNotes, setRfqNotes] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingTopic, setMeetingTopic] = useState("");

  // tRPC mutations
  const sendInquiryMutation = trpc.inquiry.send.useMutation();
  const sendRfqMutation = trpc.rfq.send.useMutation();
  const bookMeetingMutation = trpc.meetings.create.useMutation();

  const simulateProgress = (duration: number, onComplete: () => void) => {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      setProgress(Math.min((elapsed / duration) * 100, 95));
      if (elapsed >= duration) {
        clearInterval(interval);
        setProgress(100);
        setTimeout(onComplete, 300);
      }
    }, 100);
  };

  const handleAction = async () => {
    if (flowStep === "idle") {
      setActionState("loading");
      setError(null);
      setProgress(0);
      try {
        await sendInquiryMutation.mutateAsync({
          factoryId: quote.factoryId || 0,
          demandId,
          message: `对 ${quote.factoryName} 的产品感兴趣`,
        });
        simulateProgress(2000, () => {
          setFlowStep("inquiry_sent");
          setActionState("completed");
          onAction?.("inquiry");
          setTimeout(() => setActionState("idle"), 2000);
        });
      } catch {
        setError("发送询盘失败，请重试");
        setActionState("error");
        setTimeout(() => setActionState("idle"), 2000);
      }
    } else if (flowStep === "inquiry_sent") {
      setModalType("rfq");
      setShowModal(true);
      setError(null);
    } else if (flowStep === "rfq_sent") {
      setModalType("meeting");
      setShowModal(true);
      setError(null);
    }
  };

  const handleRFQSubmit = async () => {
    if (!rfqQuantity) { setError("请输入采购数量"); return; }
    setActionState("loading"); setError(null); setProgress(0);
    try {
      await sendRfqMutation.mutateAsync({ factoryId: quote.factoryId || 0, demandId, matchResultId, quantity: rfqQuantity, notes: rfqNotes });
      simulateProgress(2000, () => {
        setFlowStep("rfq_sent"); setActionState("completed"); setShowModal(false);
        setRfqQuantity(null); setRfqNotes(""); onAction?.("rfq");
        setTimeout(() => setActionState("idle"), 2000);
      });
    } catch {
      setError("发送 RFQ 失败，请重试"); setActionState("error");
      setTimeout(() => setActionState("idle"), 2000);
    }
  };

  const handleMeetingSubmit = async () => {
    if (!meetingTime) { setError("请选择会议时间"); return; }
    setActionState("loading"); setError(null); setProgress(0);
    try {
      await bookMeetingMutation.mutateAsync({ factoryId: quote.factoryId || 0, scheduledAt: meetingTime, title: meetingTopic || `与 ${quote.factoryName} 的视频会议` });
      simulateProgress(2000, () => {
        setFlowStep("meeting_booked"); setActionState("completed"); setShowModal(false);
        setMeetingTime(""); setMeetingTopic(""); onAction?.("meeting");
        setTimeout(() => setActionState("idle"), 2000);
      });
    } catch {
      setError("预约会议失败，请重试"); setActionState("error");
      setTimeout(() => setActionState("idle"), 2000);
    }
  };

  const getActionButton = () => {
    switch (flowStep) {
      case "idle": return { label: "握手 · 发送询盘", icon: <Handshake size={14} />, color: "#10b981", gradient: "linear-gradient(135deg, #10b981, #059669)" };
      case "inquiry_sent": return { label: "发送正式 RFQ", icon: <FileText size={14} />, color: "#0ea5e9", gradient: "linear-gradient(135deg, #0ea5e9, #0284c7)" };
      case "rfq_sent": return { label: "预约视频会议", icon: <Video size={14} />, color: "#7c3aed", gradient: "linear-gradient(135deg, #7c3aed, #6d28d9)" };
      case "meeting_booked": return null;
    }
  };

  const action = getActionButton();

  // 匹配度颜色
  const matchColor = quote.matchScore >= 90 ? "#10b981" : quote.matchScore >= 75 ? "#a78bfa" : "#f59e0b";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={{
          background: isHovered ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${isHovered ? "rgba(124,58,237,0.35)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 14,
          padding: "16px",
          marginBottom: 10,
          transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
          boxShadow: isHovered ? "0 4px 24px rgba(124,58,237,0.12)" : "none",
          cursor: "default",
        }}
      >
        {/* Top: Basic Info */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <motion.div
              animate={isHovered ? { scale: 1.08, rotate: 3 } : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: "rgba(124,58,237,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              <Building2 size={17} color="#a78bfa" />
            </motion.div>
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                {quote.factoryName}
                {quote.isVerified && (
                  <span title="已认证工厂">
                    <CheckCircle2 size={13} color="#10b981" />
                  </span>
                )}
              </div>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={10} />
                {quote.location || "中国"}
                <span style={{ color: "#334155" }}>·</span>
                <Star size={10} color="#f59e0b" />
                <span style={{ color: "#94a3b8" }}>{quote.factoryScore.toFixed(1)}</span>
              </div>
            </div>
          </div>
          {/* Match score */}
          <div style={{ textAlign: "right" }}>
            <motion.div
              animate={isHovered ? { scale: 1.08 } : { scale: 1 }}
              style={{ color: matchColor, fontWeight: 800, fontSize: 20, lineHeight: 1 }}
            >
              {quote.matchScore}%
            </motion.div>
            <div style={{ color: "#475569", fontSize: 9, fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>
              AI Match
            </div>
          </div>
        </div>

        {/* Middle: Key Specs */}
        <div style={{
          display: "flex", gap: 0,
          padding: "10px 0", marginBottom: 12,
          borderTop: "1px solid rgba(255,255,255,0.04)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}>
          {quote.unitPrice && (
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, color: "#475569", fontSize: 9, marginBottom: 3 }}>
                <DollarSign size={9} />PRICE
              </div>
              <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 700 }}>${quote.unitPrice.toFixed(2)}</div>
            </div>
          )}
          {quote.moq && (
            <div style={{ flex: 1, textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, color: "#475569", fontSize: 9, marginBottom: 3 }}>
                <Package size={9} />MOQ
              </div>
              <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 700 }}>{quote.moq.toLocaleString()}</div>
            </div>
          )}
          {quote.leadTimeDays && (
            <div style={{ flex: 1, textAlign: "center", borderLeft: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, color: "#475569", fontSize: 9, marginBottom: 3 }}>
                <Clock size={9} />LEAD TIME
              </div>
              <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 700 }}>{quote.leadTimeDays}d</div>
            </div>
          )}
        </div>

        {/* Certifications (hover 展开) */}
        <AnimatePresence>
          {isHovered && quote.certifications && quote.certifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden", marginBottom: 10 }}
            >
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {quote.certifications.map(cert => (
                  <span key={cert} style={{
                    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: 5, padding: "2px 7px", color: "#34d399", fontSize: 10, fontWeight: 700,
                  }}>
                    {cert}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom: Action Button or Progress */}
        {actionState === "loading" ? (
          <div style={{
            width: "100%", padding: "10px",
            background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
            borderRadius: 10, display: "flex", flexDirection: "column", gap: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a78bfa", fontSize: 12, fontWeight: 600 }}>
              <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
              正在处理中...
            </div>
            <div style={{ width: "100%", height: 4, background: "rgba(124,58,237,0.1)", borderRadius: 2, overflow: "hidden" }}>
              <motion.div
                style={{ height: "100%", background: "linear-gradient(90deg, #7c3aed, #a78bfa)", borderRadius: 2 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>
        ) : actionState === "error" ? (
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: [-6, 6, -4, 4, 0] }}
            transition={{ duration: 0.4 }}
            style={{
              width: "100%", padding: "10px",
              background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 10, color: "#f87171", fontSize: 12, fontWeight: 600,
              textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <AlertCircle size={14} />
            {error || "操作失败"}
          </motion.div>
        ) : actionState === "completed" ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              width: "100%", padding: "10px",
              background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 10, color: "#34d399", fontSize: 12, fontWeight: 600,
              textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <CheckCircle2 size={14} />
            已完成！
          </motion.div>
        ) : action ? (
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAction}
            style={{
              width: "100%", padding: "10px 14px",
              background: action.gradient,
              border: "none", borderRadius: 10,
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: `0 3px 16px ${action.color}30`,
              transition: "box-shadow 0.2s",
            }}
          >
            {action.icon}
            {action.label}
            <ArrowRight size={14} />
          </motion.button>
        ) : (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              width: "100%", padding: "10px",
              background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.25)",
              borderRadius: 10, color: "#34d399", fontSize: 12, fontWeight: 600,
              textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <CheckCircle2 size={14} />
            流程已完成，等待工厂确认
          </motion.div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                background: "rgba(10,10,24,0.98)",
                border: "1px solid rgba(124,58,237,0.25)",
                borderRadius: 18, padding: "28px",
                maxWidth: 500, width: "90%",
                maxHeight: "80vh", overflowY: "auto",
                position: "relative",
                boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowModal(false)}
                style={{
                  position: "absolute", top: 16, right: 16,
                  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, color: "#94a3b8", cursor: "pointer", padding: "5px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}
              >
                <X size={16} />
              </motion.button>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      marginBottom: 16, padding: "10px 12px",
                      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                      borderRadius: 8, color: "#f87171", fontSize: 12,
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    <AlertCircle size={14} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {modalType === "rfq" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "rgba(14,165,233,0.15)", border: "1px solid rgba(14,165,233,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <FileText size={17} color="#38bdf8" />
                    </div>
                    <div>
                      <h2 style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 700, margin: 0 }}>发送正式采购请求 (RFQ)</h2>
                      <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{quote.factoryName}</div>
                    </div>
                  </div>
                  <FormInput
                    type="number"
                    label="采购数量"
                    placeholder="输入采购数量"
                    value={rfqQuantity || ""}
                    onChange={v => setRfqQuantity(v ? parseInt(v) : null)}
                    required
                  />
                  <FormInput
                    label="特殊需求"
                    placeholder="例如：特定颜色、包装要求、私标需求等"
                    value={rfqNotes}
                    onChange={setRfqNotes}
                    minHeight={80}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleRFQSubmit}
                    disabled={actionState === "loading"}
                    style={{
                      width: "100%", padding: "11px",
                      background: actionState === "loading" ? "rgba(14,165,233,0.3)" : "linear-gradient(135deg, #0ea5e9, #0284c7)",
                      border: "none", borderRadius: 10,
                      color: "#fff", fontSize: 13, fontWeight: 700,
                      cursor: actionState === "loading" ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {actionState === "loading" ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> 发送中...</> : <><FileText size={14} /> 发送 RFQ</>}
                  </motion.button>
                </div>
              )}

              {modalType === "meeting" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Video size={17} color="#a78bfa" />
                    </div>
                    <div>
                      <h2 style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 700, margin: 0 }}>预约视频会议</h2>
                      <div style={{ color: "#475569", fontSize: 11, marginTop: 2 }}>{quote.factoryName}</div>
                    </div>
                  </div>
                  <FormInput
                    type="datetime-local"
                    label="偏好时间"
                    value={meetingTime}
                    onChange={setMeetingTime}
                    required
                  />
                  <FormInput
                    label="会议议题"
                    placeholder="例如：产品工艺、质量控制、交期、私标可行性等"
                    value={meetingTopic}
                    onChange={setMeetingTopic}
                    minHeight={80}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleMeetingSubmit}
                    disabled={actionState === "loading"}
                    style={{
                      width: "100%", padding: "11px",
                      background: actionState === "loading" ? "rgba(124,58,237,0.3)" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                      border: "none", borderRadius: 10,
                      color: "#fff", fontSize: 13, fontWeight: 700,
                      cursor: actionState === "loading" ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {actionState === "loading" ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> 预约中...</> : <><Video size={14} /> 确认预约</>}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
