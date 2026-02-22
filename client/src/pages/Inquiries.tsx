import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search, Plus, MessageSquare, Clock, CheckCircle2, XCircle,
  Package, Building2, Calendar, DollarSign, FileText,
  Send, Paperclip, MoreHorizontal, Eye, Loader2
} from "lucide-react";

type InquiryStatus = "pending" | "replied" | "negotiating" | "closed" | "rejected";

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  pending:     { label: "Pending",     bg: "rgba(234,179,8,0.12)",   color: "#facc15", icon: <Clock className="w-3 h-3" /> },
  replied:     { label: "Replied",     bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", icon: <MessageSquare className="w-3 h-3" /> },
  negotiating: { label: "Negotiating", bg: "rgba(124,58,237,0.12)",  color: "#c4b5fd", icon: <DollarSign className="w-3 h-3" /> },
  closed:      { label: "Closed",      bg: "rgba(74,222,128,0.12)",  color: "#4ade80", icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected:    { label: "Rejected",    bg: "rgba(239,68,68,0.12)",   color: "#f87171", icon: <XCircle className="w-3 h-3" /> },
};

const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px)
`;

export default function Inquiries() {
  const [, setLocation] = useLocation();
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyText, setReplyText] = useState("");

  const { data: inquiries = [], isLoading, refetch } = trpc.inquiries.myInquiries.useQuery();

  const filteredInquiries = inquiries.filter((inq) => {
    const productName = inq.product?.name || "";
    const factoryName = inq.factory?.name || "";
    const matchesSearch =
      productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      factoryName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedInquiry = selectedInquiryId
    ? inquiries.find((i) => i.id === selectedInquiryId) || null
    : filteredInquiries[0] || null;

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatRelativeTime = (date: Date | null | undefined) => {
    if (!date) return "N/A";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(date);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center"
        style={{ background: "linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)" }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: "#7c3aed" }} />
          <p style={{ color: "rgba(255,255,255,0.35)" }}>Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden"
      style={{ background: "linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)" }}>
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: GRID_BG, backgroundSize: "40px 40px" }} />

      {/* 左侧列表 */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-80 flex flex-col relative z-10"
        style={{ borderRight: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)" }}
      >
        {/* 头部 */}
        <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-lg text-white">Inquiries</h2>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setLocation("/factories")}
              className="h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white" }}
            >
              <Plus className="w-3.5 h-3.5" />New
            </motion.button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.25)" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inquiries..."
              className="w-full pl-9 pr-4 h-9 rounded-xl text-sm text-white outline-none"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
              onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.45)"}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
            />
          </div>

          {/* Status filters */}
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "pending", "replied", "negotiating", "closed"] as const).map((s) => (
              <motion.button
                key={s}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter(s)}
                className="px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all"
                style={{
                  background: statusFilter === s ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : "rgba(255,255,255,0.06)",
                  color: statusFilter === s ? "white" : "rgba(255,255,255,0.35)",
                  border: statusFilter === s ? "none" : "1px solid rgba(255,255,255,0.09)",
                }}
              >
                {s}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredInquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <FileText className="w-12 h-12 mb-3" style={{ color: "rgba(255,255,255,0.12)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                {searchQuery || statusFilter !== "all" ? "No matching inquiries" : "No inquiries yet"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <button className="text-sm mt-2 transition-colors" style={{ color: "#7c3aed" }}
                  onClick={() => setLocation("/factories")}>
                  Browse factories to start
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence>
              {filteredInquiries.map((inq, i) => {
                const sc = STATUS_CONFIG[inq.status] || STATUS_CONFIG["pending"];
                const isSelected = selectedInquiry?.id === inq.id;
                return (
                  <motion.div
                    key={inq.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedInquiryId(inq.id)}
                    className="p-4 cursor-pointer transition-all"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      borderLeft: isSelected ? "2px solid #7c3aed" : "2px solid transparent",
                      background: isSelected ? "rgba(124,58,237,0.08)" : "transparent",
                    }}
                    onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                    onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = "transparent")}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.06)" }}>
                        {inq.factory?.logo
                          ? <img src={inq.factory.logo} alt={inq.factory.name} className="w-full h-full object-cover rounded-xl" />
                          : <Package className="w-5 h-5" style={{ color: "rgba(255,255,255,0.25)" }} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-sm text-white truncate">
                            {inq.product?.name || `Inquiry #${inq.id}`}
                          </span>
                        </div>
                        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
                          {inq.factory?.name || "Unknown Factory"}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ background: sc.bg, color: sc.color }}>
                            {sc.icon}{sc.label}
                          </span>
                          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                            {formatRelativeTime(inq.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* 右侧详情 */}
      {selectedInquiry ? (
        <motion.div
          key={selectedInquiry.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 flex flex-col relative z-10"
        >
          {/* 详情头部 */}
          <div className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.06)" }}>
                {selectedInquiry.factory?.logo
                  ? <img src={selectedInquiry.factory.logo} alt={selectedInquiry.factory.name} className="w-full h-full object-cover rounded-xl" />
                  : <Package className="w-6 h-6" style={{ color: "rgba(255,255,255,0.25)" }} />
                }
              </div>
              <div>
                <h3 className="font-black text-lg text-white">
                  {selectedInquiry.product?.name || `Inquiry #${selectedInquiry.id}`}
                </h3>
                <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{selectedInquiry.factory?.name || "Unknown Factory"}</span>
                  {selectedInquiry.quantity && <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />{selectedInquiry.quantity.toLocaleString()} units</span>}
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(selectedInquiry.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const sc = STATUS_CONFIG[selectedInquiry.status] || STATUS_CONFIG["pending"];
                return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: sc.bg, color: sc.color }}>
                    {sc.icon}{sc.label}
                  </span>
                );
              })()}
              {selectedInquiry.product && (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="h-8 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.55)" }}
                  onClick={() => setLocation(`/product/${selectedInquiry.product!.id}`)}
                >
                  <Eye className="w-3.5 h-3.5" />View Product
                </motion.button>
              )}
              <button className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                style={{ color: "rgba(255,255,255,0.25)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "white", e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.25)", e.currentTarget.style.background = "transparent")}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* 询价摘要卡片 */}
            <div className="rounded-xl p-4 flex items-center gap-6 flex-wrap"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {selectedInquiry.quantity && (
                <>
                  <div className="text-center">
                    <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Quantity</div>
                    <div className="font-bold text-white">{selectedInquiry.quantity.toLocaleString()} units</div>
                  </div>
                  <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.08)" }} />
                </>
              )}
              {selectedInquiry.destination && (
                <>
                  <div className="text-center">
                    <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Destination</div>
                    <div className="font-bold text-white">{selectedInquiry.destination}</div>
                  </div>
                  <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.08)" }} />
                </>
              )}
              <div className="text-center">
                <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Created</div>
                <div className="font-bold text-white">{formatDate(selectedInquiry.createdAt)}</div>
              </div>
              {selectedInquiry.quotedPrice && (
                <>
                  <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <div className="text-center">
                    <div className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Quoted Price</div>
                    <div className="font-bold" style={{ color: "#4ade80" }}>
                      {selectedInquiry.currency || "USD"} {selectedInquiry.quotedPrice}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notes / Initial Message */}
            {selectedInquiry.notes && (
              <div className="flex justify-end">
                <div className="max-w-[70%]">
                  <div className="rounded-2xl rounded-tr-sm px-4 py-3"
                    style={{ background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.25)" }}>
                    <p className="text-sm text-white">{selectedInquiry.notes}</p>
                  </div>
                  <p className="text-[10px] mt-1 text-right" style={{ color: "rgba(255,255,255,0.25)" }}>
                    You · {formatDate(selectedInquiry.createdAt)}
                  </p>
                </div>
              </div>
            )}

            {/* Reply from factory */}
            {selectedInquiry.replyContent && (
              <div className="flex justify-start">
                <div className="max-w-[70%]">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(59,130,246,0.25)" }}>
                      <Building2 className="w-3 h-3" style={{ color: "#60a5fa" }} />
                    </div>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {selectedInquiry.factory?.name || "Factory"}
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-sm text-white">{selectedInquiry.replyContent}</p>
                    {selectedInquiry.quotedPrice && (
                      <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Quoted: </span>
                        <span className="text-xs font-bold" style={{ color: "#4ade80" }}>
                          {selectedInquiry.currency || "USD"} {selectedInquiry.quotedPrice}/unit
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedInquiry.repliedAt && (
                    <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {formatDate(selectedInquiry.repliedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!selectedInquiry.notes && !selectedInquiry.replyContent && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-12 h-12 mb-3" style={{ color: "rgba(255,255,255,0.10)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>No messages yet</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.20)" }}>
                  The factory will reply to your inquiry soon
                </p>
              </div>
            )}
          </div>

          {/* 回复输入框 */}
          <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a follow-up message..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white resize-none outline-none pr-12"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.45)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (replyText.trim()) { toast.info("消息功能即将上线"); setReplyText(""); }
                    }
                  }}
                />
                <button className="absolute right-3 bottom-3 transition-colors"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "white"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                disabled={!replyText.trim()}
                onClick={() => { if (replyText.trim()) { toast.info("消息功能即将上线"); setReplyText(""); } }}
              >
                <Send className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(124,58,237,0.10)", border: "1px solid rgba(124,58,237,0.20)" }}>
              <MessageSquare className="w-10 h-10" style={{ color: "rgba(124,58,237,0.50)" }} />
            </div>
            <h3 className="text-xl font-black text-white mb-2">No Inquiry Selected</h3>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
              Select an inquiry from the list to view details
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="h-10 px-5 rounded-xl text-sm font-semibold flex items-center gap-2 mx-auto"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "white" }}
              onClick={() => setLocation("/factories")}
            >
              <Plus className="w-4 h-4" />Start New Inquiry
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
