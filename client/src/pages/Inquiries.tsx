import { useState } from "react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search, Filter, Plus, MessageSquare, Clock, CheckCircle2, XCircle,
  ChevronRight, Package, Building2, Calendar, DollarSign, FileText,
  Send, Paperclip, Star, MoreHorizontal, Download, Eye
} from "lucide-react";

type InquiryStatus = "pending" | "replied" | "negotiating" | "closed" | "rejected";

interface Inquiry {
  id: number;
  productName: string;
  productImage: string;
  factoryName: string;
  factoryCountry: string;
  quantity: number;
  unit: string;
  targetPrice: string;
  status: InquiryStatus;
  createdAt: string;
  lastReply: string;
  unread: number;
  messages: Message[];
}

interface Message {
  id: number;
  sender: "buyer" | "factory";
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}

const STATUS_CONFIG: Record<InquiryStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
  replied: { label: "Replied", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: <MessageSquare className="w-3 h-3" /> },
  negotiating: { label: "Negotiating", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: <DollarSign className="w-3 h-3" /> },
  closed: { label: "Closed", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
};

const MOCK_INQUIRIES: Inquiry[] = [
  {
    id: 1, productName: "ANC 3.0 Headphones", productImage: "🎧", factoryName: "SZ Electronics Co., Ltd",
    factoryCountry: "🇨🇳", quantity: 500, unit: "units", targetPrice: "$40/unit",
    status: "negotiating", createdAt: "2026-02-15", lastReply: "2 hours ago", unread: 2,
    messages: [
      { id: 1, sender: "buyer", senderName: "You", content: "Hi, we're interested in ordering 500 units of ANC 3.0 Headphones. Can you offer a better price for this quantity?", timestamp: "Feb 15, 10:00 AM" },
      { id: 2, sender: "factory", senderName: "SZ Electronics", content: "Hello! Thank you for your interest. For 500 units, we can offer $42/unit with CE and FCC certifications included. Delivery time is 30 days.", timestamp: "Feb 15, 2:00 PM" },
      { id: 3, sender: "buyer", senderName: "You", content: "That's a bit high. We were hoping for $40/unit. Can you meet that price?", timestamp: "Feb 16, 9:00 AM" },
      { id: 4, sender: "factory", senderName: "SZ Electronics", content: "We can do $41/unit for 500 units, and $40/unit if you order 1000+ units. We can also provide free samples for quality check.", timestamp: "Feb 18, 11:00 AM" },
    ]
  },
  {
    id: 2, productName: "TWS Earbuds Pro", productImage: "🎵", factoryName: "Guangzhou Audio Tech",
    factoryCountry: "🇨🇳", quantity: 1000, unit: "units", targetPrice: "$25/unit",
    status: "replied", createdAt: "2026-02-14", lastReply: "1 day ago", unread: 1,
    messages: [
      { id: 1, sender: "buyer", senderName: "You", content: "We need 1000 units of TWS Earbuds Pro. What's your best price?", timestamp: "Feb 14, 3:00 PM" },
      { id: 2, sender: "factory", senderName: "GZ Audio Tech", content: "For 1000 units, our price is $26/unit. Includes 1-year warranty and custom packaging.", timestamp: "Feb 17, 10:00 AM" },
    ]
  },
  {
    id: 3, productName: "Wireless Charging Pad", productImage: "⚡", factoryName: "Shenzhen Power Tech",
    factoryCountry: "🇨🇳", quantity: 2000, unit: "units", targetPrice: "$8/unit",
    status: "pending", createdAt: "2026-02-18", lastReply: "Just now", unread: 0,
    messages: [
      { id: 1, sender: "buyer", senderName: "You", content: "Interested in 2000 units. Please provide your best price and lead time.", timestamp: "Feb 18, 4:00 PM" },
    ]
  },
  {
    id: 4, productName: "Smart Watch Band", productImage: "⌚", factoryName: "Dongguan Accessories",
    factoryCountry: "🇨🇳", quantity: 3000, unit: "units", targetPrice: "$3/unit",
    status: "closed", createdAt: "2026-02-01", lastReply: "2 weeks ago", unread: 0,
    messages: []
  },
];

export default function Inquiries() {
  const [, setLocation] = useLocation();
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(MOCK_INQUIRIES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | "all">("all");
  const [replyText, setReplyText] = useState("");

  const filteredInquiries = MOCK_INQUIRIES.filter((inq) => {
    const matchesSearch = inq.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.factoryName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    setReplyText("");
    // In production, this would call trpc.inquiry.sendMessage
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* 左侧列表 */}
      <div className="w-80 flex flex-col border-r border-white/10 bg-card/30">
        {/* 头部 */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Inquiries</h2>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-500 h-8 gap-1.5">
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
          {filteredInquiries.map((inq) => (
            <div
              key={inq.id}
              onClick={() => setSelectedInquiry(inq)}
              className={cn(
                "p-4 border-b border-white/5 cursor-pointer transition-all hover:bg-white/5",
                selectedInquiry?.id === inq.id && "bg-purple-600/10 border-l-2 border-l-purple-500"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                  {inq.productImage}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm truncate">{inq.productName}</span>
                    {inq.unread > 0 && (
                      <span className="w-5 h-5 bg-purple-600 rounded-full text-[10px] text-white flex items-center justify-center flex-shrink-0">
                        {inq.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{inq.factoryCountry} {inq.factoryName}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                      STATUS_CONFIG[inq.status].color
                    )}>
                      {STATUS_CONFIG[inq.status].icon}
                      {STATUS_CONFIG[inq.status].label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{inq.lastReply}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧详情 */}
      {selectedInquiry ? (
        <div className="flex-1 flex flex-col">
          {/* 详情头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-card/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl">
                {selectedInquiry.productImage}
              </div>
              <div>
                <h3 className="font-bold text-lg">{selectedInquiry.productName}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {selectedInquiry.factoryCountry} {selectedInquiry.factoryName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Package className="w-3.5 h-3.5" />
                    {selectedInquiry.quantity.toLocaleString()} {selectedInquiry.unit}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Target: {selectedInquiry.targetPrice}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border",
                STATUS_CONFIG[selectedInquiry.status].color
              )}>
                {STATUS_CONFIG[selectedInquiry.status].icon}
                {STATUS_CONFIG[selectedInquiry.status].label}
              </span>
              <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10 gap-1.5">
                <Eye className="w-4 h-4" />
                View Product
              </Button>
              <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-white rounded-lg hover:bg-white/10 transition-all">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* 询价摘要卡片 */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-6">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Quantity</div>
                <div className="font-bold text-white">{selectedInquiry.quantity.toLocaleString()} {selectedInquiry.unit}</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Target Price</div>
                <div className="font-bold text-purple-400">{selectedInquiry.targetPrice}</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Created</div>
                <div className="font-bold text-white">{selectedInquiry.createdAt}</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Messages</div>
                <div className="font-bold text-white">{selectedInquiry.messages.length}</div>
              </div>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10 gap-1.5 text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  Schedule Meeting
                </Button>
                <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10 gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  Generate PO
                </Button>
              </div>
            </div>

            {/* 消息 */}
            {selectedInquiry.messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3", msg.sender === "buyer" && "flex-row-reverse")}>
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                  msg.sender === "factory" ? "bg-purple-600 text-white" : "bg-blue-600 text-white"
                )}>
                  {msg.senderName.slice(0, 2).toUpperCase()}
                </div>
                <div className={cn("max-w-[70%]", msg.sender === "buyer" && "items-end flex flex-col")}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-white">{msg.senderName}</span>
                    <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <div className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.sender === "factory" ? "bg-white/10 text-white rounded-tl-sm" : "bg-purple-600 text-white rounded-tr-sm"
                  )}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 回复框 */}
          <div className="px-6 py-4 border-t border-white/10 bg-card/20">
            <div className="flex items-end gap-3">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-purple-500 transition-all">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your message..."
                  rows={2}
                  className="w-full bg-transparent text-sm text-white resize-none focus:outline-none placeholder:text-muted-foreground"
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSendReply())}
                />
                <div className="flex items-center justify-between mt-2">
                  <button className="text-muted-foreground hover:text-white transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted-foreground">Press Enter to send</span>
                </div>
              </div>
              <Button
                onClick={handleSendReply}
                className="bg-purple-600 hover:bg-purple-500 h-12 w-12 p-0 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Select an inquiry to view details</p>
          </div>
        </div>
      )}
    </div>
  );
}
