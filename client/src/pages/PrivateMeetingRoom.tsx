/**
 * PrivateMeetingRoom.tsx - 1:1 私密选品会议室
 * PRD 3.1 P0 全量集成版本
 *
 * 新增功能（v2.0）：
 * 1. 会议开始自动触发云端录制，结束时自动停止并将 URL 写入数据库
 * 2. 实时翻译字幕深度集成（AgoraTranscription v2.0）
 * 3. 产品侧边栏"Request Sample"按钮 + 弹窗表单，一键创建 SampleOrder
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import {
  X, Mic, MicOff, Video, VideoOff, Monitor, MoreVertical,
  Bookmark, MessageSquare, ShoppingCart, FileDown, Loader2,
  Send, Package, Circle, ChevronRight, Sparkles, Radio,
  Plus, Minus, Globe, ShieldCheck, Truck, AlertCircle,
  CheckCircle, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AgoraVideoCall } from "@/components/AgoraVideoCall";
import { AgoraWhiteboard } from "@/components/AgoraWhiteboard";
import { AgoraTranscription } from "@/components/AgoraTranscription";

// ── 类型定义 ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: number;
  userId: number;
  userName: string;
  message: string;
  timestamp: Date;
}

interface RecordingState {
  isRecording: boolean;
  resourceId: string | null;
  sid: string | null;
  startedAt: Date | null;
  error: string | null;
}

interface SampleRequestState {
  isOpen: boolean;
  productId: number | null;
  productName: string;
  productImage: string;
  factoryId: number | null;
  priceMin: number | null;
}

// ── 样品申请弹窗组件 ───────────────────────────────────────────────────────────

interface SampleRequestModalProps {
  state: SampleRequestState;
  onClose: () => void;
  onSuccess: (orderId: number) => void;
  meetingId: number;
}

function SampleRequestModal({ state, onClose, onSuccess, meetingId }: SampleRequestModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"form" | "confirm">("form");

  const samplePrice = state.priceMin ? (state.priceMin * 2).toFixed(2) : null;
  const totalPrice = samplePrice ? (parseFloat(samplePrice) * quantity).toFixed(2) : null;

  const createOrder = trpc.sampleOrders.create.useMutation({
    onSuccess: (data: any) => {
      onSuccess(data.id || 0);
      toast.success("样品申请已提交！工厂将在 24 小时内确认。");
    },
    onError: (error) => {
      toast.error("申请失败：" + error.message);
    },
  });

  const handleSubmit = () => {
    if (!state.productId || !state.factoryId) return;
    createOrder.mutate({
      productId: state.productId,
      factoryId: state.factoryId,
      quantity,
      unitPrice: samplePrice || undefined,
      shippingAddress,
      notes: notes ? `[Meeting #${meetingId}] ${notes}` : `Requested during meeting #${meetingId}`,
    });
  };

  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-transparent border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-400" />
            <h3 className="text-white font-semibold">Request Sample</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 产品信息 */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-2xl flex-shrink-0">
              📦
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{state.productName}</p>
              {samplePrice && (
                <p className="text-purple-400 text-xs mt-0.5">
                  Sample price: ${samplePrice}/pc (incl. tooling fee)
                </p>
              )}
            </div>
          </div>

          {step === "form" && (
            <>
              {/* 数量 */}
              <div>
                <label className="text-gray-400 text-xs mb-2 block">Quantity (max 10 pcs)</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xl font-bold text-white w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(10, q + 1))}
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  {totalPrice && (
                    <span className="text-purple-400 font-bold ml-2">= ${totalPrice}</span>
                  )}
                </div>
              </div>

              {/* 收货地址 */}
              <div>
                <label className="text-gray-400 text-xs mb-2 block flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Shipping Address *
                </label>
                <Textarea
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  placeholder="Full name, phone, country, city, address, zip code..."
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 text-sm"
                  rows={3}
                />
              </div>

              {/* 备注 */}
              <div>
                <label className="text-gray-400 text-xs mb-2 block">Special Requirements (optional)</label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Color, packaging, custom logo, test standards..."
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 text-sm"
                  rows={2}
                />
              </div>

              {/* 须知 */}
              <div className="flex gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300/80">
                  Sample fee includes product cost + tooling fee, excludes international shipping.
                  Factory will confirm within 24 hours.
                </p>
              </div>

              {/* 信任标签 */}
              <div className="flex gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-green-400" />Escrow</span>
                <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-blue-400" />Global Shipping</span>
              </div>
            </>
          )}

          {step === "confirm" && (
            <div className="space-y-3">
              <h4 className="text-white font-medium text-sm">Confirm Order Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Product</span>
                  <span className="text-white truncate max-w-[180px]">{state.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Quantity</span>
                  <span className="text-white">{quantity} pcs</span>
                </div>
                {totalPrice && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated Total</span>
                    <span className="text-purple-400 font-bold">${totalPrice}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Ship To</span>
                  <span className="text-white text-right max-w-[180px] text-xs">{shippingAddress || "—"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-3 px-5 pb-5">
          {step === "form" ? (
            <>
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-gray-400"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                disabled={!shippingAddress.trim()}
                onClick={() => setStep("confirm")}
              >
                Review Order
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1 border-white/20 text-gray-400"
                onClick={() => setStep("form")}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                onClick={handleSubmit}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</>
                ) : (
                  <><CheckCircle className="w-4 h-4 mr-2" />Confirm Request</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

export default function PrivateMeetingRoom() {
  const { id } = useParams<{ id: string }>();
  const meetingId = parseInt(id || "1", 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // ── UI 状态 ──────────────────────────────────────────────────────────────────
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, userId: 0, userName: "System", message: "Meeting started. Products are shown on the right panel.", timestamp: new Date() }
  ]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "chat">("products");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── P0.2: 录制状态 ───────────────────────────────────────────────────────────
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    resourceId: null,
    sid: null,
    startedAt: null,
    error: null,
  });

  // ── P0.3: 样品申请弹窗状态 ───────────────────────────────────────────────────
  const [sampleRequest, setSampleRequest] = useState<SampleRequestState>({
    isOpen: false,
    productId: null,
    productName: "",
    productImage: "",
    factoryId: null,
    priceMin: null,
  });
  const [lastSampleOrderId, setLastSampleOrderId] = useState<number | null>(null);

  // ── tRPC Queries ─────────────────────────────────────────────────────────────
  const { data: meeting, isLoading } = trpc.meetings.byId.useQuery({ id: meetingId });
  const utils = trpc.useUtils();

  // ── tRPC Mutations ───────────────────────────────────────────────────────────
  const updateStatusMutation = trpc.meetings.updateStatus.useMutation();
  const createInquiryMutation = trpc.inquiries.create.useMutation({
    onSuccess: () => toast.success("Inquiry sent successfully!"),
    onError: () => toast.error("Failed to send inquiry"),
  });

  // P0.2: 录制相关 mutations
  const startRecordingMutation = trpc.agora.startRecording.useMutation({
    onSuccess: (data) => {
      if (data.status === 'started') {
        setRecording({
          isRecording: true,
          resourceId: data.resourceId,
          sid: data.sid,
          startedAt: new Date(),
          error: null,
        });
        setMessages(prev => [...prev, {
          id: Date.now(),
          userId: 0,
          userName: "System",
          message: "🔴 Cloud recording started automatically.",
          timestamp: new Date(),
        }]);
        console.log('✅ Recording started:', data.resourceId, data.sid);
      } else {
        console.warn('⚠️ Recording failed to start:', data.message);
        setRecording(prev => ({ ...prev, error: data.message || 'Failed to start recording' }));
      }
    },
    onError: (error) => {
      console.warn('⚠️ Recording start error (non-blocking):', error.message);
      setRecording(prev => ({ ...prev, error: error.message }));
    },
  });

  const stopRecordingMutation = trpc.agora.stopRecording.useMutation({
    onSuccess: (data) => {
      console.log('✅ Recording stopped:', data);
      setRecording(prev => ({ ...prev, isRecording: false }));
    },
    onError: (error) => {
      console.warn('⚠️ Recording stop error:', error.message);
    },
  });

  // ── 会议开始自动触发录制 ─────────────────────────────────────────────────────
  const recordingStartedRef = useRef(false);

  useEffect(() => {
    if (!meeting || recordingStartedRef.current) return;
    recordingStartedRef.current = true;

    // 延迟 2 秒后自动启动录制（等待 RTC 连接稳定）
    const timer = setTimeout(() => {
      const channelName = `meeting-${meetingId}`;
      console.log('🎬 Auto-starting cloud recording for channel:', channelName);
      startRecordingMutation.mutate({
        channelName,
        uid: user?.id || 0,
        recordingMode: 'composite',
        videoProfile: 'HD',
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [meeting]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 计时器 ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── 聊天自动滚动 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── 工具函数 ─────────────────────────────────────────────────────────────────

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

  // ── P0.2: 会议结束处理（停止录制 + 更新状态）────────────────────────────────

  const handleEndMeeting = useCallback(async () => {
    // 1. 停止云端录制（并将 URL 写入数据库）
    if (recording.isRecording && recording.resourceId && recording.sid) {
      try {
        const durationMinutes = recording.startedAt
          ? Math.round((Date.now() - recording.startedAt.getTime()) / 60000)
          : undefined;
        await stopRecordingMutation.mutateAsync({
          resourceId: recording.resourceId,
          sid: recording.sid,
          meetingId,
          durationMinutes,
        });
        console.log('✅ Recording stopped on meeting end, URL saved to DB');
      } catch (e) {
        console.warn('⚠️ Could not stop recording:', e);
      }
    }

    // 2. 更新会议状态为 completed
    await updateStatusMutation.mutateAsync({ id: meetingId, status: "completed" });
    utils.meetings.byId.invalidate({ id: meetingId });

    // 3. 跳转到会议详情页
    setLocation(`/meeting-detail/${meetingId}`);
  }, [recording, meetingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 批量发送询价 ─────────────────────────────────────────────────────────────

  const handleExportInquiry = () => {
    if (!meeting || selectedProducts.length === 0) {
      toast.error("Please select at least one product first");
      return;
    }
    const factoryId = meeting.factory?.id;
    if (!factoryId) { toast.error("Factory info not available"); return; }

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
    });
  };

  // ── P0.3: 打开样品申请弹窗 ───────────────────────────────────────────────────

  const handleRequestSample = (product: any) => {
    const images: string[] = Array.isArray(product.images) ? product.images : [];
    const priceMin = product.details?.priceMin ? Number(product.details.priceMin) : null;
    setSampleRequest({
      isOpen: true,
      productId: product.id,
      productName: product.name,
      productImage: images[0] || "",
      factoryId: meeting?.factory?.id || null,
      priceMin,
    });
  };

  const handleSampleSuccess = (orderId: number) => {
    setLastSampleOrderId(orderId);
    setSampleRequest(prev => ({ ...prev, isOpen: false }));
    setMessages(prev => [...prev, {
      id: Date.now(),
      userId: user?.id || 0,
      userName: "System",
      message: `📦 Sample request submitted for "${sampleRequest.productName}". Order #${orderId || "pending"} created.`,
      timestamp: new Date(),
    }]);
  };

  const handleGenerateReel = () => {
    setLocation(`/meeting-reel-generator/${meetingId}`);
  };

  // ── 加载状态 ─────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E] flex items-center justify-center" style={{background:"linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)"}}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Joining meeting room...</p>
        </div>
      </div>
    );
  }

  const factoryName = meeting?.factory?.name ?? "Factory";
  const buyerName = meeting?.buyer?.name ?? user?.name ?? "Buyer";
  const factoryProducts: any[] = (meeting as any)?.factoryProducts ?? [];
  const channelName = `meeting-${meetingId}`;

  // ── 渲染 ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]" style={{background:"linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)"}}>
      {/* ── 样品申请弹窗 ── */}
      <SampleRequestModal
        state={sampleRequest}
        onClose={() => setSampleRequest(prev => ({ ...prev, isOpen: false }))}
        onSuccess={handleSampleSuccess}
        meetingId={meetingId}
      />

      {/* ── 顶部控制栏 ── */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#0F0F23]/90 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-9"
            onClick={handleEndMeeting}
            disabled={updateStatusMutation.isPending}
          >
            <X className="w-4 h-4 mr-1.5" />
            End Meeting
          </Button>
          {/* 计时器 */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white font-mono text-sm">{formatTime(elapsedSeconds)}</span>
          </div>
          {/* 录制状态指示器 */}
          {recording.isRecording && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
              <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span className="text-red-400 text-xs font-medium">REC</span>
            </div>
          )}
          {recording.error && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-yellow-400 text-xs">Recording unavailable</span>
            </div>
          )}
        </div>

        {/* 标题 */}
        <div className="text-center">
          <h1 className="text-white font-semibold text-sm">{meeting?.title ?? "1:1 Private Meeting"}</h1>
          <p className="text-xs text-gray-400">{factoryName} × {buyerName}</p>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMicOn(!micOn)}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
              micOn ? "bg-white/5 hover:bg-white/10" : "bg-red-500/20 hover:bg-red-500/30"
            )}
            title={micOn ? "Mute" : "Unmute"}
          >
            {micOn ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-red-400" />}
          </button>
          <button
            onClick={() => setVideoOn(!videoOn)}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
              videoOn ? "bg-white/5 hover:bg-white/10" : "bg-red-500/20 hover:bg-red-500/30"
            )}
            title={videoOn ? "Stop Video" : "Start Video"}
          >
            {videoOn ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4 text-red-400" />}
          </button>
          <button
            onClick={() => setShowWhiteboard(!showWhiteboard)}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
              showWhiteboard ? "bg-purple-500/30 hover:bg-purple-500/40" : "bg-white/5 hover:bg-white/10"
            )}
            title="Toggle Whiteboard"
          >
            <Monitor className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={handleGenerateReel}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            title="Generate Meeting Reel"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      </div>

      {/* ── 主内容区 ── */}
      <div className="pt-16 flex h-screen overflow-hidden">
        {/* ── 左侧：视频 + 字幕 ── */}
        <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
          {/* 视频区 */}
          <div className="flex-1 min-h-0">
            <AgoraVideoCall
              channelName={channelName}
              userId={user?.id || 0}
              role="publisher"
              onCallEnd={handleEndMeeting}
            />
          </div>

          {/* P0.1: 实时翻译字幕组件 */}
          <AgoraTranscription
            channelName={channelName}
            userId={user?.id || 0}
            meetingId={meetingId}
            userRole="buyer"
            isActive={isTranscribing}
            onToggle={setIsTranscribing}
            sourceLanguage="zh-CN"
            targetLanguage="en-US"
            showTranslation={true}
          />

          {/* 互动白板 */}
          {showWhiteboard && (
            <AgoraWhiteboard
              whiteboardId={`whiteboard-${meetingId}`}
              title="Product Showcase Whiteboard"
              onClose={() => setShowWhiteboard(false)}
            />
          )}

          {/* 底部快捷操作 */}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-blue-500/80 to-cyan-500/80 hover:from-blue-500 hover:to-cyan-500 text-white h-9 text-xs"
              onClick={() => setLocation(`/meeting-detail/${meetingId}`)}
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
              Meeting Summary
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-orange-500/80 to-yellow-500/80 hover:from-orange-500 hover:to-yellow-500 text-white h-9 text-xs"
              onClick={handleGenerateReel}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Generate Reel
            </Button>
          </div>
        </div>

        {/* ── 右侧：产品 + 聊天侧边栏 ── */}
        <div className="w-[380px] flex-shrink-0 bg-[#0F0F23]/80 backdrop-blur-xl border-l border-purple-500/20 flex flex-col">
          {/* 标签切换 */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("products")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === "products"
                  ? "text-white border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Products ({factoryProducts.length})
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                activeTab === "chat"
                  ? "text-white border-b-2 border-purple-500"
                  : "text-gray-400 hover:text-white"
              )}
            >
              Chat ({messages.length})
            </button>
          </div>

          {/* ── 产品列表面板 ── */}
          {activeTab === "products" && (
            <>
              <div className="flex-1 overflow-y-auto p-3">
                {factoryProducts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-3">📦</div>
                    <p className="text-sm">No products available</p>
                    <p className="text-xs mt-1 text-gray-500">Factory products will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {factoryProducts.map((product: any) => {
                      const images: string[] = Array.isArray(product.images) ? product.images : [];
                      const productImage = images[0];
                      const priceMin = product.details?.priceMin ? Number(product.details.priceMin) : null;
                      const moq = product.details?.moq;
                      const isSelected = selectedProducts.includes(product.id);

                      return (
                        <div
                          key={product.id}
                          className={cn(
                            "bg-white/5 rounded-xl p-3 border transition-all",
                            isSelected
                              ? "border-purple-500/50 bg-purple-500/10"
                              : "border-white/10 hover:border-purple-500/30"
                          )}
                        >
                          <div className="flex gap-3">
                            {/* 产品图片 */}
                            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                              {productImage ? (
                                <img src={productImage} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                "📦"
                              )}
                            </div>

                            {/* 产品信息 */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium text-sm truncate">{product.name}</h4>
                              <p className="text-gray-400 text-xs">{product.category ?? "General"}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {priceMin ? (
                                  <span className="text-purple-400 text-xs font-bold">${priceMin}+</span>
                                ) : (
                                  <span className="text-gray-500 text-xs">Price on request</span>
                                )}
                                {moq && (
                                  <span className="text-gray-500 text-xs">MOQ: {moq}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex gap-1.5 mt-2.5">
                            {/* 选择/取消选择（用于批量询价） */}
                            <button
                              onClick={() => toggleProduct(product.id)}
                              className={cn(
                                "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1",
                                isSelected
                                  ? "bg-purple-500 text-white"
                                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <Bookmark className="w-3 h-3" />
                              {isSelected ? "Selected" : "Select"}
                            </button>

                            {/* P0.3: 一键申请样品 */}
                            <button
                              onClick={() => handleRequestSample(product)}
                              className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300 hover:from-amber-500/30 hover:to-orange-500/30 transition-all flex items-center justify-center gap-1"
                            >
                              <Package className="w-3 h-3" />
                              Sample
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 底部操作栏 */}
              <div className="p-3 border-t border-white/10 space-y-2">
                {lastSampleOrderId && (
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    <p className="text-xs text-green-300 flex-1">
                      Sample request submitted!
                    </p>
                    <button
                      onClick={() => setLocation("/inquiries")}
                      className="text-xs text-green-400 hover:text-green-300 flex items-center gap-0.5"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    {selectedProducts.length > 0 ? `${selectedProducts.length} selected for inquiry` : "Select products to inquire"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 border-white/20 text-gray-300 hover:bg-white/5 h-8 text-xs"
                    onClick={() => setLocation(`/factory/${meeting?.factory?.id ?? ""}`)}
                    disabled={!meeting?.factory?.id}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                    View Factory
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white h-8 text-xs"
                    onClick={handleExportInquiry}
                    disabled={selectedProducts.length === 0 || createInquiryMutation.isPending}
                  >
                    <FileDown className="w-3.5 h-3.5 mr-1" />
                    Send Inquiries
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* ── 聊天面板 ── */}
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((msg) => {
                  const isSystem = msg.userId === 0;
                  const isMe = msg.userId === user?.id;
                  return (
                    <div key={msg.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                      {!isSystem && (
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                          isMe ? "bg-purple-500/30 text-purple-300" : "bg-blue-500/30 text-blue-300"
                        )}>
                          {msg.userName.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[75%]",
                        isSystem && "w-full"
                      )}>
                        {!isSystem && (
                          <p className={cn("text-xs text-gray-500 mb-0.5", isMe ? "text-right" : "text-left")}>
                            {msg.userName}
                          </p>
                        )}
                        <div className={cn(
                          "rounded-xl px-3 py-2 text-sm",
                          isSystem
                            ? "bg-white/5 border border-white/10 text-gray-400 text-xs text-center w-full"
                            : isMe
                              ? "bg-purple-500/30 text-white"
                              : "bg-white/10 text-gray-200"
                        )}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-gray-500 h-9 text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim()}
                    className="bg-purple-500 hover:bg-purple-600 h-9 w-9 p-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
