import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Building2, MapPin, Star, CheckCircle2,
  Handshake, FileText, Video, ArrowRight, X, Loader, AlertCircle
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
}

type FlowStep = "idle" | "inquiry_sent" | "rfq_sent" | "meeting_booked";
type ActionState = "idle" | "loading" | "completed" | "error";

interface QuoteCardRedesignedProps {
  quote: QuoteCard;
  onAction?: (action: "inquiry" | "rfq" | "meeting") => void;
  demandId?: number;
  matchResultId?: number;
}

export default function QuoteCardRedesigned({ quote, onAction, demandId = 1, matchResultId = 1 }: QuoteCardRedesignedProps) {
  const [flowStep, setFlowStep] = useState<FlowStep>("idle");
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"rfq" | "meeting" | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Form state for RFQ and Meeting
  const [rfqQuantity, setRfqQuantity] = useState<number | null>(null);
  const [rfqNotes, setRfqNotes] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingTopic, setMeetingTopic] = useState("");

  // tRPC mutations
  const sendInquiryMutation = trpc.inquiry.send.useMutation();
  const sendRfqMutation = trpc.rfq.send.useMutation();
  const bookMeetingMutation = trpc.meetings.book.useMutation();

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
      // 发送真实询盘
      setActionState("loading");
      setError(null);
      setProgress(0);
      
      try {
        // 调用真实 API
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
      } catch (err) {
        console.error("Failed to send inquiry:", err);
        setError("发送询盘失败，请重试");
        setActionState("error");
        setTimeout(() => setActionState("idle"), 2000);
      }
    } else if (flowStep === "inquiry_sent") {
      // 打开 RFQ 模态框
      setModalType("rfq");
      setShowModal(true);
      setError(null);
    } else if (flowStep === "rfq_sent") {
      // 打开会议预约模态框
      setModalType("meeting");
      setShowModal(true);
      setError(null);
    }
  };

  const handleRFQSubmit = async () => {
    if (!rfqQuantity) {
      setError("请输入采购数量");
      return;
    }

    setActionState("loading");
    setError(null);
    setProgress(0);

    try {
      await sendRfqMutation.mutateAsync({
        factoryId: quote.factoryId || 0,
        demandId,
        matchResultId,
        quantity: rfqQuantity,
        notes: rfqNotes,
      });

      simulateProgress(2000, () => {
        setFlowStep("rfq_sent");
        setActionState("completed");
        setShowModal(false);
        setRfqQuantity(null);
        setRfqNotes("");
        onAction?.("rfq");
        setTimeout(() => setActionState("idle"), 2000);
      });
    } catch (err) {
      console.error("Failed to send RFQ:", err);
      setError("发送 RFQ 失败，请重试");
      setActionState("error");
      setTimeout(() => setActionState("idle"), 2000);
    }
  };

  const handleMeetingSubmit = async () => {
    if (!meetingTime) {
      setError("请选择会议时间");
      return;
    }

    setActionState("loading");
    setError(null);
    setProgress(0);

    try {
      await bookMeetingMutation.mutateAsync({
        factoryId: quote.factoryId || 0,
        demandId,
        scheduledAt: meetingTime,
        topic: meetingTopic,
      });

      simulateProgress(2000, () => {
        setFlowStep("meeting_booked");
        setActionState("completed");
        setShowModal(false);
        setMeetingTime("");
        setMeetingTopic("");
        onAction?.("meeting");
        setTimeout(() => setActionState("idle"), 2000);
      });
    } catch (err) {
      console.error("Failed to book meeting:", err);
      setError("预约会议失败，请重试");
      setActionState("error");
      setTimeout(() => setActionState("idle"), 2000);
    }
  };

  const getActionButton = () => {
    switch (flowStep) {
      case "idle":
        return { label: "发送询盘", icon: <Handshake size={14} />, color: "#10b981" };
      case "inquiry_sent":
        return { label: "发送正式 RFQ", icon: <FileText size={14} />, color: "#0ea5e9" };
      case "rfq_sent":
        return { label: "预约视频会议", icon: <Video size={14} />, color: "#7c3aed" };
      case "meeting_booked":
        return null;
    }
  };

  const action = getActionButton();

  return (
    <>
      <div style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 12,
        padding: "16px",
        marginBottom: 12,
        transition: "all 0.2s ease"
      }}>
        {/* Top: Basic Info */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: "rgba(124, 58, 237, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={16} color="#a78bfa" />
            </div>
            <div>
              <div style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                {quote.factoryName}
                {quote.isVerified && <CheckCircle2 size={12} color="#10b981" />}
              </div>
              <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                {quote.location || "中国"} · {quote.factoryScore.toFixed(1)} 评分
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 18 }}>{quote.matchScore}%</div>
            <div style={{ color: "#475569", fontSize: 9, fontWeight: 600, textTransform: "uppercase" }}>Match</div>
          </div>
        </div>

        {/* Middle: Key Specs */}
        <div style={{ display: "flex", gap: 20, marginBottom: 16, padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.03)" }}>
          {quote.unitPrice && (
            <div>
              <div style={{ color: "#475569", fontSize: 9, marginBottom: 2 }}>PRICE</div>
              <div style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600 }}>${quote.unitPrice.toFixed(2)}</div>
            </div>
          )}
          {quote.moq && (
            <div>
              <div style={{ color: "#475569", fontSize: 9, marginBottom: 2 }}>MOQ</div>
              <div style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600 }}>{quote.moq}</div>
            </div>
          )}
          {quote.leadTimeDays && (
            <div>
              <div style={{ color: "#475569", fontSize: 9, marginBottom: 2 }}>LEAD TIME</div>
              <div style={{ color: "#cbd5e1", fontSize: 13, fontWeight: 600 }}>{quote.leadTimeDays}d</div>
            </div>
          )}
        </div>

        {/* Bottom: Action Button or Progress */}
        {actionState === "loading" ? (
          <div style={{
            width: "100%",
            padding: "10px",
            background: "rgba(124, 58, 237, 0.1)",
            border: "1px solid rgba(124, 58, 237, 0.2)",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            gap: 8
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#a78bfa", fontSize: 12, fontWeight: 600 }}>
              <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
              正在处理中...
            </div>
            <div style={{
              width: "100%",
              height: 4,
              background: "rgba(124, 58, 237, 0.1)",
              borderRadius: 2,
              overflow: "hidden"
            }}>
              <div style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                transition: "width 0.1s linear"
              }} />
            </div>
          </div>
        ) : actionState === "error" ? (
          <div style={{
            width: "100%",
            padding: "10px",
            background: "rgba(239, 68, 68, 0.05)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 8,
            color: "#ef4444",
            fontSize: 12,
            fontWeight: 600,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}>
            <AlertCircle size={14} />
            {error || "操作失败"}
          </div>
        ) : actionState === "completed" ? (
          <div style={{
            width: "100%",
            padding: "10px",
            background: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: 8,
            color: "#10b981",
            fontSize: 12,
            fontWeight: 600,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}>
            <CheckCircle2 size={14} />
            已完成！
          </div>
        ) : action ? (
          <button
            onClick={handleAction}
            style={{
              width: "100%",
              padding: "10px",
              background: `${action.color}15`,
              border: `1px solid ${action.color}30`,
              borderRadius: 8,
              color: action.color,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = `${action.color}25`}
            onMouseOut={(e) => e.currentTarget.style.background = `${action.color}15`}
          >
            {action.icon}
            {action.label}
            <ArrowRight size={14} />
          </button>
        ) : (
          <div style={{
            width: "100%",
            padding: "10px",
            background: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: 8,
            color: "#10b981",
            fontSize: 12,
            fontWeight: 600,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6
          }}>
            <CheckCircle2 size={14} />
            流程已完成，等待工厂确认
          </div>
        )}
      </div>

      {/* Modal for RFQ and Meeting */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: 16,
            padding: "24px",
            maxWidth: 500,
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            position: "relative"
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: 0
              }}
            >
              <X size={20} />
            </button>

            {error && (
              <div style={{
                marginBottom: 16,
                padding: "10px 12px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 6,
                color: "#ef4444",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 8
              }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {modalType === "rfq" && (
              <div>
                <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                  发送正式采购请求 (RFQ)
                </h2>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    采购数量 *
                  </label>
                  <input
                    type="number"
                    placeholder="输入采购数量"
                    value={rfqQuantity || ""}
                    onChange={(e) => setRfqQuantity(e.target.value ? parseInt(e.target.value) : null)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 6,
                      color: "#f1f5f9",
                      fontSize: 13,
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    特殊需求
                  </label>
                  <textarea
                    placeholder="例如：特定颜色、包装要求等"
                    value={rfqNotes}
                    onChange={(e) => setRfqNotes(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 6,
                      color: "#f1f5f9",
                      fontSize: 13,
                      minHeight: 80,
                      fontFamily: "inherit",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <button
                  onClick={handleRFQSubmit}
                  disabled={actionState === "loading"}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: actionState === "loading" ? "not-allowed" : "pointer",
                    opacity: actionState === "loading" ? 0.6 : 1
                  }}
                >
                  {actionState === "loading" ? "发送中..." : "发送 RFQ"}
                </button>
              </div>
            )}

            {modalType === "meeting" && (
              <div>
                <h2 style={{ color: "#f1f5f9", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
                  预约视频会议
                </h2>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    偏好时间 *
                  </label>
                  <input
                    type="datetime-local"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 6,
                      color: "#f1f5f9",
                      fontSize: 13,
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    会议议题
                  </label>
                  <textarea
                    placeholder="例如：产品工艺、质量控制、交期等"
                    value={meetingTopic}
                    onChange={(e) => setMeetingTopic(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 6,
                      color: "#f1f5f9",
                      fontSize: 13,
                      minHeight: 80,
                      fontFamily: "inherit",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <button
                  onClick={handleMeetingSubmit}
                  disabled={actionState === "loading"}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: actionState === "loading" ? "not-allowed" : "pointer",
                    opacity: actionState === "loading" ? 0.6 : 1
                  }}
                >
                  {actionState === "loading" ? "预约中..." : "确认预约"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
