import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { X, Mic, MicOff, Video, VideoOff, Monitor, MoreVertical, Bookmark, MessageSquare, ShoppingCart, FileDown, Loader2, Heart, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface ChatMessage {
  id: number;
  userId: number;
  userName: string;
  message: string;
  timestamp: Date;
}

export default function PrivateMeetingRoom() {
  const { id } = useParams<{ id: string }>();
  const meetingId = parseInt(id || "1", 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, userId: 0, userName: "System", message: "Meeting started. Products on the right panel.", timestamp: new Date() }
  ]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // tRPC queries
  const { data: meeting, isLoading } = trpc.meetings.byId.useQuery({ id: meetingId });
  const utils = trpc.useUtils();

  // tRPC mutations
  const updateStatusMutation = trpc.meetings.updateStatus.useMutation();
  const createInquiryMutation = trpc.inquiries.create.useMutation({
    onSuccess: () => toast.success("Inquiry sent successfully!"),
    onError: () => toast.error("Failed to send inquiry"),
  });

  // Timer
  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const toggleProduct = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((pid) => pid !== productId) : [...prev, productId]
    );
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((prev) => [...prev, {
      id: Date.now(),
      userId: user?.id || 0,
      userName: user?.name || "You",
      message: chatInput,
      timestamp: new Date(),
    }]);
    setChatInput("");
  };

  const handleEndMeeting = async () => {
    await updateStatusMutation.mutateAsync({ id: meetingId, status: "completed" });
    utils.meetings.byId.invalidate({ id: meetingId });
    setLocation(`/meeting-detail/${meetingId}`);
  };

  const handleExportInquiry = () => {
    if (!meeting || selectedProducts.length === 0) {
      toast.error("Please select at least one product first");
      return;
    }
    const factoryId = meeting.factory?.id;
    if (!factoryId) { toast.error("Factory info not available"); return; }
    // Create inquiries for all selected products
    Promise.all(
      selectedProducts.map((productId) =>
        createInquiryMutation.mutateAsync({
          productId,
          factoryId,
          meetingId,
          quantity: 100,
          notes: `Inquired during meeting: ${meeting.title}`,
        })
      )
    ).then(() => {
      toast.success(`${selectedProducts.length} inquiries sent!`);
      setLocation("/inquiries");
    });
  };

  const handleGenerateReel = () => {
    setLocation(`/meeting-reel-generator/${meetingId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Joining meeting room...</p>
        </div>
      </div>
    );
  }

  const factoryName = meeting?.factory?.name ?? "Factory";
  const factoryInitials = factoryName.slice(0, 2).toUpperCase();
  const buyerName = meeting?.buyer?.name ?? user?.name ?? "Buyer";
  const buyerInitials = buyerName.slice(0, 1).toUpperCase();
  const products = meeting?.factory ? [] : []; // products come from factory via separate query
  // Use factory products from meeting data (populated via meetings.byId -> factory -> products)
  const factoryProducts: any[] = (meeting as any)?.factoryProducts ?? [];
  const aiHighlights = meeting?.transcripts?.slice(0, 3) ?? [
    { id: 1, content: "Meeting started", createdAt: new Date() },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]">
      {/* 顶部控制栏 */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#0F0F23]/80 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={handleEndMeeting}
            disabled={updateStatusMutation.isPending}
          >
            <X className="w-4 h-4 mr-2" />
            End Meeting
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white font-mono">{formatTime(elapsedSeconds)}</span>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-white font-semibold">{meeting?.title ?? "1:1 Private Meeting"}</h1>
          <p className="text-sm text-gray-400">{factoryName} x {buyerName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMicOn(!micOn)}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              micOn ? "bg-white/5 hover:bg-white/10" : "bg-red-500/20 hover:bg-red-500/30"
            )}
          >
            {micOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-red-400" />}
          </button>
          <button
            onClick={() => setVideoOn(!videoOn)}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
              videoOn ? "bg-white/5 hover:bg-white/10" : "bg-red-500/20 hover:bg-red-500/30"
            )}
          >
            {videoOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-red-400" />}
          </button>
          <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <Monitor className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="pt-16 flex h-screen">
        {/* 左侧：视频区域 + 聊天 */}
        <div className="flex-1 p-6 flex flex-col gap-4">
          {/* 视频区 */}
          <div className="flex-1 flex gap-4">
            {/* 主视频（工厂） */}
            <div className="flex-1 bg-black/50 rounded-xl overflow-hidden relative border border-purple-500/20">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">{factoryInitials}</span>
                  </div>
                  <p className="text-white text-lg font-semibold mb-2">{factoryName}</p>
                  <p className="text-gray-400 text-sm">
                    {meeting?.factory?.city ?? "Shenzhen"}, {meeting?.factory?.country ?? "China"}
                  </p>
                </div>
              </div>
              {/* 小窗口（买家视频） */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-black/70 rounded-lg border border-purple-500/30 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">{buyerInitials}</span>
                    </div>
                    <p className="text-white text-sm font-semibold">{buyerName}</p>
                  </div>
                </div>
              </div>
              {/* 会议状态标签 */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse mr-1.5" />
                  Live
                </Badge>
              </div>
            </div>
          </div>

          {/* AI 实时转录 */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <h3 className="text-white font-semibold text-sm">AI Live Transcript</h3>
              </div>
              <span className="text-purple-400 text-xs">Key moments</span>
            </div>
            <div className="flex gap-3">
              {aiHighlights.length > 0 ? aiHighlights.map((item: any, index: number) => (
                <div
                  key={item.id ?? index}
                  className="flex-1 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-3 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎯</span>
                    <span className="text-purple-400 text-xs font-mono">
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString() : formatTime(elapsedSeconds)}
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium">{item.content ?? "Meeting in progress..."}</p>
                </div>
              )) : (
                <div className="flex-1 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-3 border border-purple-500/20 text-center">
                  <p className="text-white/60 text-sm">AI transcript will appear here during the meeting</p>
                </div>
              )}
            </div>
          </div>

          {/* 底部操作按钮 */}
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              onClick={() => setLocation(`/meeting-detail/${meetingId}`)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              View Meeting Summary
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
              onClick={handleGenerateReel}
            >
              Generate Meeting Reel
            </Button>
          </div>
        </div>

        {/* 右侧：产品列表 */}
        <div className="w-96 bg-[#0F0F23]/80 backdrop-blur-xl border-l border-purple-500/20 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-white font-semibold text-lg mb-1">Product Showcase</h2>
            <p className="text-gray-400 text-sm">
              {factoryProducts.length > 0
                ? `${factoryProducts.length} products from ${factoryName}`
                : "Loading factory products..."}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {factoryProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-3">📦</div>
                <p className="text-sm">No products available</p>
                <p className="text-xs mt-1 text-gray-500">Factory products will appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {factoryProducts.map((product: any) => (
                  <div
                    key={product.id}
                    className={cn(
                      "bg-white/5 rounded-lg p-3 border transition-all cursor-pointer",
                      selectedProducts.includes(product.id)
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-white/10 hover:border-purple-500/30"
                    )}
                    onClick={() => toggleProduct(product.id)}
                  >
                    <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-4xl mb-2">
                      📦
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1 truncate">{product.name}</h4>
                    <p className="text-purple-400 font-bold text-sm">Contact for price</p>
                    <p className="text-gray-400 text-xs">{product.category ?? "General"}</p>
                    <div className="flex gap-1 mt-2">
                      <button
                        className={cn(
                          "flex-1 py-1 rounded text-xs transition-colors",
                          selectedProducts.includes(product.id)
                            ? "bg-purple-500 text-white"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        )}
                      >
                        <Bookmark className="w-3 h-3 inline mr-1" />
                        {selectedProducts.includes(product.id) ? "Selected" : "Select"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* 底部操作栏 */}
          <div className="p-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Selected products</span>
              <span className="text-purple-400 font-bold">{selectedProducts.length} items</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/5"
                onClick={() => setLocation(`/factory/${meeting?.factory?.id ?? ""}`)}
                disabled={!meeting?.factory?.id}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Factory
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                onClick={handleExportInquiry}
                disabled={selectedProducts.length === 0 || createInquiryMutation.isPending}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Send Inquiries
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
