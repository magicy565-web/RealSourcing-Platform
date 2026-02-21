import { useState } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search, Filter, Plus, MessageSquare, Clock, CheckCircle2, XCircle,
  ChevronRight, Package, Building2, Calendar, DollarSign, FileText,
  Send, Paperclip, Star, MoreHorizontal, Download, Eye, Loader2
} from "lucide-react";

type InquiryStatus = "pending" | "replied" | "negotiating" | "closed" | "rejected";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
  replied: { label: "Replied", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <MessageSquare className="w-3 h-3" /> },
  negotiating: { label: "Negotiating", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: <DollarSign className="w-3 h-3" /> },
  closed: { label: "Closed", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
};

export default function Inquiries() {
  const [, setLocation] = useLocation();
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyText, setReplyText] = useState("");

  // ── tRPC Queries ──────────────────────────────────────────────────────────
  const {
    data: inquiries = [],
    isLoading,
    refetch,
  } = trpc.inquiries.myInquiries.useQuery();

  const createInquiryMutation = trpc.inquiries.create.useMutation({
    onSuccess: () => {
      toast.success("询价已发送");
      refetch();
    },
    onError: (err) => {
      toast.error(`发送失败: ${err.message}`);
    },
  });

  // ── Filtering ─────────────────────────────────────────────────────────────
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
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* 左侧列表 */}
      <div className="w-80 flex flex-col border-r border-white/10 bg-card/30">
        {/* 头部 */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Inquiries</h2>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-500 h-8 gap-1.5"
              onClick={() => setLocation("/factories")}
            >
              <Plus className="w-3.5 h-3.5" />
              New
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search inquiries..."
              className="pl-9 bg-white/5 border-white/10 h-9 text-sm"
            />
          </div>
          {/* 状态筛选 */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {(["all", "pending", "replied", "negotiating", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-all capitalize",
                  statusFilter === s
                    ? "bg-purple-600 text-white"
                    : "bg-white/10 text-muted-foreground hover:bg-white/20"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredInquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No matching inquiries"
                  : "No inquiries yet"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button
                  size="sm"
                  variant="link"
                  className="text-purple-400 mt-2"
                  onClick={() => setLocation("/factories")}
                >
                  Browse factories to start
                </Button>
              )}
            </div>
          ) : (
            filteredInquiries.map((inq) => {
              const statusConfig = STATUS_CONFIG[inq.status] || STATUS_CONFIG["pending"];
              return (
                <div
                  key={inq.id}
                  onClick={() => setSelectedInquiryId(inq.id)}
                  className={cn(
                    "p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5",
                    selectedInquiry?.id === inq.id && "bg-purple-600/10 border-l-2 border-l-purple-500"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                      {inq.factory?.logo ? (
                        <img src={inq.factory.logo} alt={inq.factory.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Package className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-sm truncate">
                          {inq.product?.name || `Inquiry #${inq.id}`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {inq.factory?.name || "Unknown Factory"}
                      </p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                          statusConfig.color
                        )}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatRelativeTime(inq.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 右侧详情 */}
      {selectedInquiry ? (
        <div className="flex-1 flex flex-col">
          {/* 详情头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-card/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                {selectedInquiry.factory?.logo ? (
                  <img
                    src={selectedInquiry.factory.logo}
                    alt={selectedInquiry.factory.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Package className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">
                  {selectedInquiry.product?.name || `Inquiry #${selectedInquiry.id}`}
                </h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedInquiry.factory?.name || "Unknown Factory"}
                  </span>
                  {selectedInquiry.quantity && (
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" />
                      {selectedInquiry.quantity.toLocaleString()} units
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(selectedInquiry.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const statusConfig = STATUS_CONFIG[selectedInquiry.status] || STATUS_CONFIG["pending"];
                return (
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border",
                    statusConfig.color
                  )}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                );
              })()}
              {selectedInquiry.product && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 hover:bg-white/10 gap-1.5"
                  onClick={() => setLocation(`/product/${selectedInquiry.product!.id}`)}
                >
                  <Eye className="w-4 h-4" />
                  View Product
                </Button>
              )}
              <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-white rounded-lg hover:bg-white/10 transition-all">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* 询价摘要卡片 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-6 flex-wrap">
              {selectedInquiry.quantity && (
                <>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Quantity</div>
                    <div className="font-bold text-white">{selectedInquiry.quantity.toLocaleString()} units</div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                </>
              )}
              {selectedInquiry.destination && (
                <>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Destination</div>
                    <div className="font-bold text-white">{selectedInquiry.destination}</div>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                </>
              )}
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Created</div>
                <div className="font-bold text-white">{formatDate(selectedInquiry.createdAt)}</div>
              </div>
              {selectedInquiry.quotedPrice && (
                <>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">Quoted Price</div>
                    <div className="font-bold text-green-400">
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
                  <div className="bg-purple-600/20 border border-purple-500/30 rounded-2xl rounded-tr-sm px-4 py-3">
                    <p className="text-sm text-white">{selectedInquiry.notes}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
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
                    {selectedInquiry.factory?.logo ? (
                      <img
                        src={selectedInquiry.factory.logo}
                        alt={selectedInquiry.factory.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-blue-600/30 flex items-center justify-center">
                        <Building2 className="w-3 h-3 text-blue-400" />
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {selectedInquiry.factory?.name || "Factory"}
                    </span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm text-white">{selectedInquiry.replyContent}</p>
                    {selectedInquiry.quotedPrice && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <span className="text-xs text-muted-foreground">Quoted: </span>
                        <span className="text-sm font-semibold text-green-400">
                          {selectedInquiry.currency || "USD"} {selectedInquiry.quotedPrice}/unit
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedInquiry.repliedAt && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDate(selectedInquiry.repliedAt)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Empty state for no messages */}
            {!selectedInquiry.notes && !selectedInquiry.replyContent && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  The factory will reply to your inquiry soon
                </p>
              </div>
            )}
          </div>

          {/* 回复输入框 */}
          <div className="p-4 border-t border-white/10 bg-card/20">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a follow-up message..."
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white resize-none focus:outline-none focus:border-purple-500 placeholder:text-muted-foreground pr-12"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (replyText.trim()) {
                        toast.info("消息功能即将上线");
                        setReplyText("");
                      }
                    }
                  }}
                />
                <button className="absolute right-3 bottom-3 text-muted-foreground hover:text-white transition-colors">
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-500 h-10 px-4 flex-shrink-0"
                disabled={!replyText.trim()}
                onClick={() => {
                  if (replyText.trim()) {
                    toast.info("消息功能即将上线");
                    setReplyText("");
                  }
                }}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Inquiry Selected</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Select an inquiry from the list to view details
            </p>
            <Button
              className="bg-purple-600 hover:bg-purple-500"
              onClick={() => setLocation("/factories")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Start New Inquiry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
