import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Users, Video, TrendingUp, Package, Calendar, Settings,
  Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle,
  Award, Globe, Phone, Mail, Building2, Star, Eye,
  BarChart3, MessageSquare, ShoppingBag, Loader2, X, Upload,
  Play, Sparkles, ChevronRight, Save, RefreshCw,
  Send, Search, Circle, WifiOff, Handshake, CheckCircle2, XCircle, ExternalLink
} from "lucide-react";
import { useInquiryRTM } from "@/hooks/useInquiryRTM";
import { useSocket } from "@/hooks/useSocket";

// ── MeetingsTab Component ─────────────────────────────────────────────────────
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_NAMES_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

interface AvailabilitySlot {
  dayOfWeek?: number;
  startTime: string;
  endTime: string;
  timezone?: string;
}

interface MeetingsTabProps {
  meetings: any[];
  availability: AvailabilitySlot[];
  onNavigate: (path: string) => void;
  onSaveAvailability: (slots: AvailabilitySlot[]) => void;
  isSavingAvailability: boolean;
}

function MeetingsTab({ meetings, availability, onNavigate, onSaveAvailability, isSavingAvailability }: MeetingsTabProps) {
  const [meetingView, setMeetingView] = useState<'list' | 'availability'>('list');
  const [slots, setSlots] = useState<AvailabilitySlot[]>(
    availability.length > 0 ? availability : [
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', timezone: 'Asia/Shanghai' },
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', timezone: 'Asia/Shanghai' },
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', timezone: 'Asia/Shanghai' },
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', timezone: 'Asia/Shanghai' },
      { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', timezone: 'Asia/Shanghai' },
    ]
  );
  const [meetingFilter, setMeetingFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  const filteredMeetings = meetings.filter(m => {
    if (meetingFilter === 'all') return true;
    if (meetingFilter === 'scheduled') return m.status === 'scheduled' || m.status === 'in_progress';
    if (meetingFilter === 'completed') return m.status === 'completed';
    return true;
  });

  const addSlot = () => {
    setSlots(prev => [...prev, { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', timezone: 'Asia/Shanghai' }]);
  };

  const removeSlot = (index: number) => {
    setSlots(prev => prev.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: string | number) => {
    setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const stats = {
    total: meetings.length,
    upcoming: meetings.filter(m => m.status === 'scheduled').length,
    inProgress: meetings.filter(m => m.status === 'in_progress').length,
    completed: meetings.filter(m => m.status === 'completed').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">会议管理</h1>
          <p className="text-gray-400 text-sm mt-1">管理买家预约的选品会议</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMeetingView('list')}
            className={cn('px-4 py-2 rounded-lg text-sm transition-all', meetingView === 'list' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10')}
          >
            <Calendar className="w-4 h-4 inline mr-1.5" />会议列表
          </button>
          <button
            onClick={() => setMeetingView('availability')}
            className={cn('px-4 py-2 rounded-lg text-sm transition-all', meetingView === 'availability' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10')}
          >
            <Clock className="w-4 h-4 inline mr-1.5" />可用时间
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: '总会议数', value: stats.total, color: 'text-white' },
          { label: '即将开始', value: stats.upcoming, color: 'text-green-400' },
          { label: '进行中', value: stats.inProgress, color: 'text-blue-400' },
          { label: '已完成', value: stats.completed, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-gray-500 text-xs mb-1">{s.label}</p>
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Meeting List View */}
      {meetingView === 'list' && (
        <div>
          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            {(['all', 'scheduled', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setMeetingFilter(f)}
                className={cn('px-3 py-1.5 rounded-lg text-xs transition-all',
                  meetingFilter === f ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'bg-white/5 text-gray-500 hover:bg-white/10'
                )}
              >
                {f === 'all' ? '全部' : f === 'scheduled' ? '即将开始' : '已完成'}
                <span className="ml-1.5 text-[10px]">
                  {f === 'all' ? stats.total : f === 'scheduled' ? stats.upcoming + stats.inProgress : stats.completed}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredMeetings.length > 0 ? filteredMeetings.map((m: any) => (
              <div
                key={m.id}
                className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer group"
                onClick={() => onNavigate(`/meeting-detail/${m.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      m.status === 'scheduled' ? 'bg-green-500/20' :
                      m.status === 'in_progress' ? 'bg-blue-500/20' :
                      m.status === 'completed' ? 'bg-purple-500/20' : 'bg-gray-500/20'
                    )}>
                      <Calendar className={cn('w-5 h-5',
                        m.status === 'scheduled' ? 'text-green-400' :
                        m.status === 'in_progress' ? 'text-blue-400' :
                        m.status === 'completed' ? 'text-purple-400' : 'text-gray-400'
                      )} />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{m.title}</h3>
                      <p className="text-gray-400 text-sm">
                        {m.scheduledAt ? new Date(m.scheduledAt).toLocaleString('zh-CN') : 'TBD'}
                        {m.durationMinutes ? ` · ${m.durationMinutes}分钟` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('text-xs px-3 py-1 rounded-full border',
                      m.status === 'scheduled' ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                      m.status === 'in_progress' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                      m.status === 'completed' ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' :
                      'bg-gray-500/20 border-gray-500/30 text-gray-400'
                    )}>
                      {m.status === 'scheduled' ? '已确认' : m.status === 'in_progress' ? '进行中' : m.status === 'completed' ? '已完成' : '已取消'}
                    </span>
                    {m.status === 'scheduled' && (
                      <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onNavigate(`/meeting/${m.id}`); }}
                        className="bg-purple-600 hover:bg-purple-500 text-xs h-7 px-3"
                      >
                        <Play className="w-3 h-3 mr-1" />进入会议
                      </Button>
                    )}
                    {m.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); onNavigate(`/meeting-reel-generator/${m.id}`); }}
                        className="border-purple-500/40 text-purple-300 text-xs h-7 px-3"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />AI Reel
                      </Button>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">{meetingFilter === 'all' ? '暂无会议安排' : '暂无符合条件的会议'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Availability Settings View */}
      {meetingView === 'availability' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-semibold">可用时间设置</h3>
              <p className="text-gray-400 text-sm mt-1">设定每周可接受买家预约的时间段</p>
            </div>
            <Button onClick={addSlot} variant="outline" className="border-white/20 text-gray-300 gap-1.5">
              <Plus className="w-4 h-4" />添加时间段
            </Button>
          </div>

          <div className="space-y-3 mb-6">
            {slots.map((slot, index) => (
              <div key={index} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                <select
                  value={slot.dayOfWeek ?? 1}
                  onChange={e => updateSlot(index, 'dayOfWeek', parseInt(e.target.value))}
                  className="bg-[#1a1a2e] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 w-24"
                >
                  {DAY_NAMES.map((day, i) => (
                    <option key={i} value={i}>{DAY_NAMES_CN[i]}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={slot.startTime}
                    onChange={e => updateSlot(index, 'startTime', e.target.value)}
                    className="bg-[#1a1a2e] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    onChange={e => updateSlot(index, 'endTime', e.target.value)}
                    className="bg-[#1a1a2e] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <select
                  value={slot.timezone || 'Asia/Shanghai'}
                  onChange={e => updateSlot(index, 'timezone', e.target.value)}
                  className="bg-[#1a1a2e] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Asia/Shanghai">UTC+8 上海</option>
                  <option value="America/New_York">UTC-5 纽约</option>
                  <option value="Europe/London">UTC+0 伦敦</option>
                  <option value="Europe/Berlin">UTC+1 柏林</option>
                  <option value="Asia/Tokyo">UTC+9 东京</option>
                </select>
                <button
                  onClick={() => removeSlot(index)}
                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => onSaveAvailability(slots)}
              disabled={isSavingAvailability}
              className="bg-purple-600 hover:bg-purple-500 gap-2"
            >
              {isSavingAvailability ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              保存设置
            </Button>
            <p className="text-gray-500 text-sm">买家预约时可看到这些时间段</p>
          </div>
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────────

type Tab = "overview" | "products" | "webinars" | "meetings" | "inquiries" | "certifications" | "profile" | "orders" | "handshakes";

export default function FactoryDashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showCreateWebinar, setShowCreateWebinar] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddCert, setShowAddCert] = useState(false);
  // 样品订单操作状态
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered'>('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [shippingOrderId, setShippingOrderId] = useState<number | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [trackingCarrier, setTrackingCarrier] = useState("");
  // 询价聊天状态
  const [selectedInquiryId, setSelectedInquiryId] = useState<number | null>(null);
  const [inquirySearchQuery, setInquirySearchQuery] = useState("");
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<string>("all");
  const [chatInput, setChatInput] = useState("");
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // ── tRPC Queries ──────────────────────────────────────────────────────────────
  const { data: factoryData, isLoading, refetch } = trpc.factoryDashboard.myFactory.useQuery(undefined, {
    enabled: !!user,
  });
  const { data: stats } = trpc.factoryDashboard.stats.useQuery(undefined, { enabled: !!user });
  // 握手请求列表（15分钟匹配功能）
  const { data: pendingHandshakes = [], refetch: refetchHandshakes } = trpc.knowledge.getFactoryPendingHandshakes.useQuery(
    { factoryId: factoryData?.id ?? 0 },
    { enabled: !!factoryData?.id, refetchInterval: 15000 }
  );
  const { data: sampleOrders, refetch: refetchOrders } = trpc.sampleOrders.factorySampleOrders.useQuery(undefined, { enabled: !!user });
  // 工厂端询价列表（附带未读数）
  const { data: factoryInquiries = [], refetch: refetchFactoryInquiries } = trpc.inquiries.factoryInquiries.useQuery(undefined, {
    enabled: !!user && activeTab === "inquiries",
    refetchInterval: 30000, // 每30秒自动刷新
  });

  // 询价聊天 RTM Hook
  const selectedInquiry = selectedInquiryId
    ? factoryInquiries.find((i: any) => i.id === selectedInquiryId) || null
    : null;
  const {
    messages: chatMessages,
    connectionState: chatConnectionState,
    isConnected: chatIsConnected,
    sendMessage: sendChatMessage,
    isSending: isChatSending,
  } = useInquiryRTM({
    inquiryId: selectedInquiry?.id ?? null,
    currentUserId: user?.id ?? null,
    enabled: !!selectedInquiry && activeTab === "inquiries",
  });

  // 消息自动滚动
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // ── WebSocket：接收握手请求实时通知 ──────────────────────────────────────────
  const socket = useSocket();
  useEffect(() => {
    if (!socket || !factoryData?.id) return;
    socket.on('handshake_request', (data: any) => {
      refetchHandshakes();
      toast.info(`📩 New sourcing request from a buyer!`, {
        description: data.demandTitle ?? 'A buyer wants to connect with you.',
        action: {
          label: 'View',
          onClick: () => setActiveTab('handshakes'),
        },
        duration: 10000,
      });
    });
    return () => { socket.off('handshake_request'); };
  }, [socket, factoryData?.id]);

  // ── tRPC Mutations ────────────────────────────────────────────────────────────
  const updateProfile = trpc.factoryDashboard.updateProfile.useMutation({
    onSuccess: () => { refetch(); setShowEditProfile(false); },
  });
  const createProduct = trpc.factoryDashboard.createProduct.useMutation({
    onSuccess: () => { refetch(); setShowAddProduct(false); setNewProduct({ name: "", category: "", description: "", priceMin: "", priceMax: "", moq: 1 }); },
  });
  const deleteProduct = trpc.factoryDashboard.deleteProduct.useMutation({
    onSuccess: () => refetch(),
  });
  const createWebinar = trpc.factoryDashboard.createWebinar.useMutation({
    onSuccess: () => { refetch(); setShowCreateWebinar(false); setNewWebinar({ title: "", description: "", scheduledAt: "", duration: 60 }); },
  });
  const addCert = trpc.factoryDashboard.addCertification.useMutation({
    onSuccess: () => { refetch(); setShowAddCert(false); setNewCert({ name: "", issuer: "", issuedAt: "" }); },
  });
  const deleteCert = trpc.factoryDashboard.deleteCertification.useMutation({
    onSuccess: () => refetch(),
  });
  const updateOrderStatus = trpc.sampleOrders.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      refetchOrders();
      setShowShipModal(false);
      setTrackingInput("");
      setTrackingCarrier("");
      setShippingOrderId(null);
      const statusLabels: Record<string, string> = {
        confirmed: '订单已确认！',
        shipped: '已标记发货，运单号已发送给买家',
        delivered: '订单已标记完成',
        cancelled: '订单已取消',
      };
      toast.success(statusLabels[vars.status] || '状态已更新');
    },
    onError: () => toast.error('操作失败，请重试'),
  });
  const acceptHandshakeMutation = trpc.knowledge.acceptHandshake.useMutation({
    onSuccess: (result: any) => {
      refetchHandshakes();
      if (result?.roomSlug) {
        toast.success('✅ Accepted! Sourcing room is ready.', {
          action: { label: 'Enter Room', onClick: () => setLocation(`/sourcing-room/${result.roomSlug}`) },
          duration: 10000,
        });
      }
    },
    onError: (err: any) => toast.error('Failed to accept: ' + err.message),
  });
  const rejectHandshakeMutation = trpc.knowledge.rejectHandshake.useMutation({
    onSuccess: () => { refetchHandshakes(); toast.success('Request declined.'); },
    onError: (err: any) => toast.error('Failed to reject: ' + err.message),
  });
  const setAvailabilityMutation = trpc.factoryDashboard.setAvailability.useMutation({
    onSuccess: () => { refetch(); toast.success('可用时间已保存'); },
    onError: () => toast.error('保存失败，请重试'),
  });

  // ── Form States ───────────────────────────────────────────────────────────────
  const [newProduct, setNewProduct] = useState({ name: "", category: "", description: "", priceMin: "", priceMax: "", moq: 1 });
  const [newWebinar, setNewWebinar] = useState({ title: "", description: "", scheduledAt: "", duration: 60 });
  const [newCert, setNewCert] = useState({ name: "", issuer: "", issuedAt: "" });
  const [editProfile, setEditProfile] = useState({
    name: factoryData?.name || "",
    description: factoryData?.description || "",
    category: factoryData?.category || "",
    city: factoryData?.city || "",
    country: factoryData?.country || "",
    phone: factoryData?.details?.phone || "",
    email: factoryData?.details?.email || "",
    website: factoryData?.details?.website || "",
    employeeCount: factoryData?.details?.employeeCount || "",
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">请先登录</p>
          <Button onClick={() => setLocation("/login")} className="bg-purple-600 hover:bg-purple-700">登录</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!factoryData) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Building2 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h2 className="text-white text-2xl font-bold mb-2">尚未创建工厂主页</h2>
          <p className="text-gray-400 mb-6">您的账号还没有关联工厂信息。请联系平台管理员开通工厂账号。</p>
          <Button onClick={() => setLocation("/")} variant="outline" className="border-purple-500/50 text-purple-400">返回首页</Button>
        </div>
      </div>
    );
  }

  const navItems: { id: Tab; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: "overview", icon: <BarChart3 className="w-4 h-4" />, label: "概览" },
    { id: "products", icon: <Package className="w-4 h-4" />, label: "产品管理", badge: factoryData.products?.length },
    { id: "webinars", icon: <Video className="w-4 h-4" />, label: "Webinar", badge: factoryData.webinars?.length },
    { id: "meetings", icon: <Calendar className="w-4 h-4" />, label: "会议管理", badge: stats?.upcomingMeetings },
    { id: "inquiries", icon: <MessageSquare className="w-4 h-4" />, label: "询价管理", badge: stats?.pendingInquiries },
    { id: "orders", icon: <ShoppingBag className="w-4 h-4" />, label: "样品订单" },
    { id: "handshakes", icon: <Handshake className="w-4 h-4" />, label: "握手请求", badge: (pendingHandshakes as any[]).length || undefined },
    { id: "certifications", icon: <Award className="w-4 h-4" />, label: "资质认证", badge: factoryData.certifications?.length },
    { id: "profile", icon: <Settings className="w-4 h-4" />, label: "工厂设置" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E] flex">
      {/* ── 侧边栏 ── */}
      <div className="fixed left-0 top-0 h-full w-64 bg-[#0F0F23]/90 backdrop-blur-xl border-r border-purple-500/20 p-6 flex flex-col z-10">
        <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => setLocation("/")}>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">RS</span>
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">RealSourcing</h2>
            <span className="text-xs text-purple-400">Factory Portal</span>
          </div>
        </div>

        {/* 工厂信息 */}
        <div className="mb-6 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-1">
            {factoryData.logo ? (
              <img src={factoryData.logo} alt="logo" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                {factoryData.name?.[0] || "F"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{factoryData.name}</p>
              <p className="text-gray-400 text-xs truncate">{factoryData.city}, {factoryData.country}</p>
            </div>
          </div>
          {factoryData.overallScore && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 text-xs">{factoryData.overallScore}</span>
            </div>
          )}
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeTab === item.id
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-xs bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-4 pt-4 border-t border-purple-500/20">
          <button onClick={() => setLocation("/")} className="w-full flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
            <Globe className="w-4 h-4" />
            <span>查看公开主页</span>
          </button>
        </div>
      </div>

      {/* ── 主内容区 ── */}
      <div className="ml-64 flex-1 p-8">

        {/* ── 概览 Tab ── */}
        {activeTab === "overview" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-1">工厂仪表盘</h1>
              <p className="text-gray-400">欢迎回来，{factoryData.name}</p>
            </div>

            {/* KPI 卡片 */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { icon: <MessageSquare className="w-5 h-5" />, label: "询价总数", value: stats?.inquiries || 0, sub: `${stats?.pendingInquiries || 0} 待处理`, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
                { icon: <Calendar className="w-5 h-5" />, label: "会议总数", value: stats?.meetings || 0, sub: `${stats?.upcomingMeetings || 0} 即将开始`, color: "from-purple-500/20 to-purple-600/10 border-purple-500/30" },
                { icon: <Package className="w-5 h-5" />, label: "展示产品", value: stats?.products || 0, sub: "已上架", color: "from-green-500/20 to-green-600/10 border-green-500/30" },
                { icon: <Video className="w-5 h-5" />, label: "Webinar", value: stats?.webinars || 0, sub: `${stats?.sampleOrders || 0} 样品订单`, color: "from-orange-500/20 to-orange-600/10 border-orange-500/30" },
              ].map((kpi, i) => (
                <div key={i} className={`p-5 rounded-xl bg-gradient-to-br ${kpi.color} border`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-gray-400">{kpi.icon}</div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{kpi.value}</div>
                  <div className="text-sm text-gray-400">{kpi.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* 快速操作 */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  即将到来的会议
                </h3>
                {factoryData.meetings && factoryData.meetings.length > 0 ? (
                  <div className="space-y-3">
                    {factoryData.meetings.slice(0, 3).map((m: any) => (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <div className={`w-2 h-2 rounded-full ${m.status === 'scheduled' ? 'bg-green-400' : m.status === 'in_progress' ? 'bg-blue-400' : 'bg-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{m.title}</p>
                          <p className="text-gray-400 text-xs">{new Date(m.scheduledAt).toLocaleString('zh-CN')}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${m.status === 'scheduled' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {m.status === 'scheduled' ? '已确认' : m.status === 'in_progress' ? '进行中' : '已完成'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">暂无会议安排</p>
                )}
              </div>

              <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  最新询价
                </h3>
                {factoryData.inquiries && factoryData.inquiries.length > 0 ? (
                  <div className="space-y-3">
                    {factoryData.inquiries.slice(0, 3).map((inq: any) => (
                      <div key={inq.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <div className={`w-2 h-2 rounded-full ${inq.status === 'pending' ? 'bg-yellow-400' : inq.status === 'replied' ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{inq.subject || "询价"}</p>
                          <p className="text-gray-400 text-xs">{new Date(inq.createdAt).toLocaleDateString('zh-CN')}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${inq.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                          {inq.status === 'pending' ? '待回复' : '已回复'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">暂无询价记录</p>
                )}
              </div>
            </div>

            {/* 信任档案完整度 */}
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                信任档案完整度
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "基本信息", done: !!(factoryData.name && factoryData.description), action: () => setActiveTab("profile") },
                  { label: "产品展示", done: (factoryData.products?.length || 0) > 0, action: () => setActiveTab("products") },
                  { label: "资质认证", done: (factoryData.certifications?.length || 0) > 0, action: () => setActiveTab("certifications") },
                  { label: "Webinar", done: (factoryData.webinars?.length || 0) > 0, action: () => setActiveTab("webinars") },
                ].map((item, i) => (
                  <button key={i} onClick={item.action} className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all text-left">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${item.done ? 'bg-green-500/20' : 'bg-gray-500/20'}`}>
                      {item.done ? <CheckCircle className="w-4 h-4 text-green-400" /> : <AlertCircle className="w-4 h-4 text-gray-400" />}
                    </div>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                    <p className={`text-xs mt-1 ${item.done ? 'text-green-400' : 'text-gray-500'}`}>{item.done ? '已完成' : '待完善'}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 产品管理 Tab ── */}
        {activeTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">产品管理</h1>
                <p className="text-gray-400 text-sm mt-1">管理您的产品展示，吸引海外买家</p>
              </div>
              <Button onClick={() => setShowAddProduct(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />添加产品
              </Button>
            </div>

            {showAddProduct && (
              <div className="mb-6 p-6 rounded-xl bg-white/5 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">添加新产品</h3>
                  <button onClick={() => setShowAddProduct(false)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">产品名称 *</label>
                    <Input value={newProduct.name} onChange={e => setNewProduct(p => ({...p, name: e.target.value}))} placeholder="e.g. TWS Earbuds Pro" className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">产品类别</label>
                    <Input value={newProduct.category} onChange={e => setNewProduct(p => ({...p, category: e.target.value}))} placeholder="e.g. Electronics" className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-400 text-sm mb-1 block">产品描述</label>
                    <Textarea value={newProduct.description} onChange={e => setNewProduct(p => ({...p, description: e.target.value}))} placeholder="描述产品特点、规格、应用场景..." className="bg-white/5 border-white/20 text-white" rows={3} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">最低价格 (USD)</label>
                    <Input value={newProduct.priceMin} onChange={e => setNewProduct(p => ({...p, priceMin: e.target.value}))} placeholder="e.g. 5.00" className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">最高价格 (USD)</label>
                    <Input value={newProduct.priceMax} onChange={e => setNewProduct(p => ({...p, priceMax: e.target.value}))} placeholder="e.g. 15.00" className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">最小起订量 (MOQ)</label>
                    <Input type="number" value={newProduct.moq} onChange={e => setNewProduct(p => ({...p, moq: parseInt(e.target.value) || 1}))} className="bg-white/5 border-white/20 text-white" />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={() => createProduct.mutate({ ...newProduct, moq: newProduct.moq })}
                    disabled={!newProduct.name || createProduct.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {createProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    保存产品
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddProduct(false)} className="border-white/20 text-gray-400">取消</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {factoryData.products && factoryData.products.length > 0 ? factoryData.products.map((product: any) => (
                <div key={product.id} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                      <Package className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProduct.mutate({ id: product.id })}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-white font-medium mb-1 truncate">{product.name}</h3>
                  <p className="text-gray-400 text-xs mb-2 truncate">{product.category}</p>
                  {product.description && <p className="text-gray-500 text-xs line-clamp-2 mb-3">{product.description}</p>}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${product.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {product.status === 'active' ? '已上架' : '已下架'}
                    </span>
                    <button onClick={() => setLocation(`/product/${product.id}`)} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                      <Eye className="w-3 h-3" />查看
                    </button>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center py-12">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">还没有产品，点击"添加产品"开始展示您的产品</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Webinar Tab ── */}
        {activeTab === "webinars" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">Webinar 管理</h1>
                <p className="text-gray-400 text-sm mt-1">举办线上产品发布会，触达全球买家</p>
              </div>
              <Button onClick={() => setShowCreateWebinar(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />创建 Webinar
              </Button>
            </div>

            {showCreateWebinar && (
              <div className="mb-6 p-6 rounded-xl bg-white/5 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">创建新 Webinar</h3>
                  <button onClick={() => setShowCreateWebinar(false)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-gray-400 text-sm mb-1 block">Webinar 标题 *</label>
                    <Input value={newWebinar.title} onChange={e => setNewWebinar(w => ({...w, title: e.target.value}))} placeholder="e.g. 2025新款蓝牙耳机产品发布会" className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-400 text-sm mb-1 block">描述</label>
                    <Textarea value={newWebinar.description} onChange={e => setNewWebinar(w => ({...w, description: e.target.value}))} placeholder="介绍本次Webinar的主题、亮点产品..." className="bg-white/5 border-white/20 text-white" rows={3} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">开始时间 *</label>
                    <Input type="datetime-local" value={newWebinar.scheduledAt} onChange={e => setNewWebinar(w => ({...w, scheduledAt: e.target.value}))} className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">时长（分钟）</label>
                    <Input type="number" value={newWebinar.duration} onChange={e => setNewWebinar(w => ({...w, duration: parseInt(e.target.value) || 60}))} className="bg-white/5 border-white/20 text-white" />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={() => createWebinar.mutate(newWebinar)}
                    disabled={!newWebinar.title || !newWebinar.scheduledAt || createWebinar.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {createWebinar.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    创建 Webinar
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateWebinar(false)} className="border-white/20 text-gray-400">取消</Button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {factoryData.webinars && factoryData.webinars.length > 0 ? factoryData.webinars.map((w: any) => (
                <div key={w.id} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                        <Video className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-medium">{w.title}</h3>
                        <p className="text-gray-400 text-sm">{new Date(w.scheduledAt).toLocaleString('zh-CN')} · {w.duration || 60} 分钟</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        w.status === 'live' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        w.status === 'scheduled' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {w.status === 'live' ? '🔴 直播中' : w.status === 'scheduled' ? '已安排' : '已结束'}
                      </span>
                      {/* 主播控制台入口（所有状态均可进入） */}
                      <Button
                        size="sm"
                        onClick={() => setLocation(`/webinar-live/host/${w.id}`)}
                        className={w.status === 'live'
                          ? 'bg-red-600 hover:bg-red-700 text-xs'
                          : 'bg-purple-600 hover:bg-purple-700 text-xs'
                        }
                      >
                        {w.status === 'live' ? '🔴 进入直播' : '🎙️ 主播控制台'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setLocation(`/webinar/${w.id}`)} className="border-white/20 text-gray-400 text-xs">
                        详情
                      </Button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">还没有 Webinar，举办一场产品发布会吸引海外买家</p>
                  <Button onClick={() => setShowCreateWebinar(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />创建第一个 Webinar
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 会议管理 Tab ── */}
        {activeTab === "meetings" && (
          <MeetingsTab
            meetings={factoryData.meetings || []}
            availability={(factoryData.availability || []).map((s: any) => ({ ...s, dayOfWeek: s.dayOfWeek ?? undefined, timezone: s.timezone ?? undefined }))}
            onNavigate={setLocation}
            onSaveAvailability={(slots) => {
              setAvailabilityMutation.mutate({ slots });
            }}
            isSavingAvailability={setAvailabilityMutation.isPending}
          />
        )}

        {/* ── 询价管理 Tab ── */}
        {activeTab === "inquiries" && (
          <div className="flex h-[calc(100vh-120px)] -mx-8 -mt-6 overflow-hidden">
            {/* 左侧询价列表 */}
            <div className="w-80 flex flex-col border-r border-white/10 bg-white/[0.02] flex-shrink-0">
              {/* 头部 */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-white">询价管理</h2>
                  <button onClick={() => refetchFactoryInquiries()}
                    className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />刷新
                  </button>
                </div>
                {/* 搜索 */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={inquirySearchQuery}
                    onChange={(e) => setInquirySearchQuery(e.target.value)}
                    placeholder="搜索询价..."
                    className="w-full pl-9 pr-4 h-9 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none focus:border-purple-500/50"
                  />
                </div>
                {/* 状态筛选 */}
                <div className="flex gap-1.5 flex-wrap">
                  {(["all", "pending", "replied"] as const).map((s) => (
                    <button key={s}
                      onClick={() => setInquiryStatusFilter(s)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                        inquiryStatusFilter === s
                          ? "bg-purple-600 text-white"
                          : "bg-white/5 text-gray-400 border border-white/10 hover:border-white/20"
                      }`}>
                      {s === "all" ? "全部" : s === "pending" ? "待回复" : "已回复"}
                    </button>
                  ))}
                </div>
              </div>
              {/* 询价列表 */}
              <div className="flex-1 overflow-y-auto">
                {factoryInquiries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <MessageSquare className="w-12 h-12 text-gray-700 mb-3" />
                    <p className="text-gray-500 text-sm">暂无询价记录</p>
                  </div>
                ) : (
                  factoryInquiries
                    .filter((inq: any) => {
                      const productName = inq.product?.name || "";
                      const buyerName = inq.buyer?.name || inq.buyer?.email || "";
                      const matchSearch = productName.toLowerCase().includes(inquirySearchQuery.toLowerCase()) ||
                        buyerName.toLowerCase().includes(inquirySearchQuery.toLowerCase());
                      const matchStatus = inquiryStatusFilter === "all" || inq.status === inquiryStatusFilter;
                      return matchSearch && matchStatus;
                    })
                    .map((inq: any) => {
                      const isSelected = selectedInquiryId === inq.id;
                      return (
                        <div key={inq.id}
                          onClick={() => setSelectedInquiryId(inq.id)}
                          className={`p-4 cursor-pointer transition-all border-b border-white/5 ${
                            isSelected ? "bg-purple-500/10 border-l-2 border-l-purple-500" : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
                          }`}>
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                              <Package className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-medium text-sm text-white truncate">
                                  {inq.product?.name || `询价 #${inq.id}`}
                                </span>
                                {inq.unreadCount > 0 && (
                                  <span className="ml-2 w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                    {inq.unreadCount > 9 ? "9+" : inq.unreadCount}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {inq.buyer?.name || inq.buyer?.email || "未知买家"}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                  inq.status === "pending" ? "bg-yellow-500/15 text-yellow-400" :
                                  inq.status === "replied" ? "bg-blue-500/15 text-blue-400" :
                                  "bg-gray-500/15 text-gray-400"
                                }`}>
                                  {inq.status === "pending" ? "待回复" : inq.status === "replied" ? "已回复" : inq.status}
                                </span>
                                <span className="text-[10px] text-gray-600">
                                  {new Date(inq.createdAt).toLocaleDateString("zh-CN")}
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

            {/* 右侧聊天面板 */}
            {selectedInquiry ? (
              <div className="flex-1 flex flex-col min-w-0">
                {/* 聊天头部 */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02] flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">
                        {selectedInquiry.product?.name || `询价 #${selectedInquiry.id}`}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {selectedInquiry.buyer?.name || selectedInquiry.buyer?.email || "未知买家"}
                        {selectedInquiry.quantity && ` · ${selectedInquiry.quantity.toLocaleString()} 件`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* 连接状态 */}
                    {chatConnectionState === "connected" ? (
                      <div className="flex items-center gap-1.5 text-xs text-green-400">
                        <Circle className="w-2 h-2 fill-current" />实时
                      </div>
                    ) : chatConnectionState === "connecting" || chatConnectionState === "reconnecting" ? (
                      <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                        <Loader2 className="w-3 h-3 animate-spin" />连接中...
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <WifiOff className="w-3 h-3" />离线
                      </div>
                    )}
                    <span className={`text-xs px-3 py-1.5 rounded-full ${
                      selectedInquiry.status === "pending" ? "bg-yellow-500/15 text-yellow-400" :
                      selectedInquiry.status === "replied" ? "bg-blue-500/15 text-blue-400" :
                      "bg-gray-500/15 text-gray-400"
                    }`}>
                      {selectedInquiry.status === "pending" ? "待回复" : selectedInquiry.status === "replied" ? "已回复" : selectedInquiry.status}
                    </span>
                  </div>
                </div>

                {/* 询价信息卡片 */}
                <div className="px-6 pt-4 flex-shrink-0">
                  <div className="rounded-xl p-4 bg-white/[0.03] border border-white/8 flex items-center gap-5 flex-wrap">
                    {selectedInquiry.quantity && (
                      <>
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">订购数量</div>
                          <div className="font-bold text-white">{selectedInquiry.quantity.toLocaleString()} 件</div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                      </>
                    )}
                    {selectedInquiry.destination && (
                      <>
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">目的地</div>
                          <div className="font-bold text-white">{selectedInquiry.destination}</div>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                      </>
                    )}
                    <div>
                      <div className="text-xs text-gray-500 mb-0.5">询价时间</div>
                      <div className="font-bold text-white">{new Date(selectedInquiry.createdAt).toLocaleDateString("zh-CN")}</div>
                    </div>
                    {selectedInquiry.notes && (
                      <>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-500 mb-0.5">备注</div>
                          <div className="text-sm text-gray-300 truncate">{selectedInquiry.notes}</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-700 mb-3" />
                      <p className="text-gray-500 text-sm">暂无消息</p>
                      <p className="text-gray-600 text-xs mt-1">回复买家的询价开始对话</p>
                    </div>
                  ) : (
                    chatMessages.map((msg: any, idx: number) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[70%]">
                            {!isMine && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                                  <span className="text-[10px] text-blue-400">买</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {selectedInquiry.buyer?.name || "买家"}
                                </span>
                              </div>
                            )}
                            <div className={`rounded-2xl px-4 py-2.5 ${
                              isMine
                                ? "rounded-tr-sm bg-purple-600/25 border border-purple-500/30"
                                : "rounded-tl-sm bg-white/5 border border-white/10"
                            }`}>
                              <p className="text-sm text-white leading-relaxed">{msg.content}</p>
                            </div>
                            <p className={`text-[10px] mt-1 text-gray-600 ${isMine ? "text-right" : "text-left"}`}>
                              {new Date(msg.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                              {isMine && <span className="ml-1.5" style={{ color: msg.isRead ? "#4ade80" : undefined }}>{msg.isRead ? "✓✓" : "✓"}</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* 输入框 */}
                <div className="p-4 border-t border-white/10 bg-white/[0.02] flex-shrink-0">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (chatInput.trim() && !isChatSending) {
                            sendChatMessage(chatInput.trim());
                            setChatInput("");
                          }
                        }
                      }}
                      placeholder="回复买家的询价... (Enter 发送)"
                      rows={2}
                      className="flex-1 px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none resize-none"
                    />
                    <button
                      disabled={!chatInput.trim() || isChatSending}
                      onClick={() => {
                        if (chatInput.trim() && !isChatSending) {
                          sendChatMessage(chatInput.trim());
                          setChatInput("");
                        }
                      }}
                      className="h-10 w-10 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 flex items-center justify-center flex-shrink-0 transition-colors"
                    >
                      {isChatSending
                        ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                        : <Send className="w-4 h-4 text-white" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-white mb-2">选择一个询价</h3>
                  <p className="text-gray-500 text-sm">点击左侧询价开始对话</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 样品订单 Tab ── */}
        {activeTab === "orders" && (
          <div>
            {/* 标题行 */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">样品订单管理</h1>
                <p className="text-gray-400 text-sm mt-1">管理所有买家的样品申请，确认、发货、填写运单号</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchOrders()} className="border-white/20 text-gray-400 hover:text-white">
                <RefreshCw className="w-4 h-4 mr-1.5" />刷新
              </Button>
            </div>

            {/* 统计卡片 */}
            {sampleOrders && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                {[
                  { label: '全部订单', value: sampleOrders.length, color: 'text-white', bg: 'bg-white/5', filter: 'all' as const },
                  { label: '待确认', value: sampleOrders.filter((o: any) => o.status === 'pending').length, color: 'text-yellow-400', bg: 'bg-yellow-500/10', filter: 'pending' as const },
                  { label: '已发货', value: sampleOrders.filter((o: any) => o.status === 'shipped').length, color: 'text-purple-400', bg: 'bg-purple-500/10', filter: 'shipped' as const },
                  { label: '已完成', value: sampleOrders.filter((o: any) => o.status === 'delivered' || o.status === 'completed').length, color: 'text-green-400', bg: 'bg-green-500/10', filter: 'delivered' as const },
                ].map((stat) => (
                  <button key={stat.filter} onClick={() => setOrderFilter(stat.filter)}
                    className={cn('p-4 rounded-xl border text-left transition-all', stat.bg,
                      orderFilter === stat.filter ? 'border-purple-500/50 ring-1 ring-purple-500/30' : 'border-white/10 hover:border-white/20'
                    )}>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{stat.label}</p>
                  </button>
                ))}
              </div>
            )}

            {/* 订单列表 */}
            <div className="space-y-3">
              {(() => {
                const filtered = (sampleOrders || []).filter((o: any) => {
                  if (orderFilter === 'all') return true;
                  if (orderFilter === 'delivered') return o.status === 'delivered' || o.status === 'completed';
                  return o.status === orderFilter;
                });

                if (filtered.length === 0) return (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">暂无{orderFilter === 'all' ? '' : { pending: '待确认', confirmed: '已确认', shipped: '已发货', delivered: '已完成' }[orderFilter]}订单</p>
                  </div>
                );

                return filtered.map((order: any) => (
                  <div key={order.id}
                    className={cn(
                      'p-5 rounded-xl border transition-all cursor-pointer',
                      selectedOrder?.id === order.id
                        ? 'bg-purple-600/10 border-purple-500/40'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    )}
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* 左侧信息 */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag className="w-6 h-6 text-orange-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white font-semibold">{order.product?.name || '产品'}</h3>
                            <span className="text-gray-500 text-xs">订单 #{order.id}</span>
                          </div>
                          <p className="text-gray-400 text-sm mt-0.5">
                            买家: <span className="text-gray-300">{order.buyer?.name || '未知'}</span>
                            <span className="mx-2 text-gray-600">·</span>
                            数量: <span className="text-gray-300">{order.quantity} 件</span>
                            {order.unitPrice && <><span className="mx-2 text-gray-600">·</span>单价: <span className="text-gray-300">${order.unitPrice}</span></>}
                          </p>
                          {order.shippingAddress && (
                            <p className="text-gray-500 text-xs mt-1 truncate">
                              收货: {order.shippingName} · {order.shippingAddress}
                            </p>
                          )}
                          {order.trackingNumber && (
                            <p className="text-purple-400 text-xs mt-1">
                              运单号: {order.trackingNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 右侧状态 + 操作按钮 */}
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={cn('text-xs px-3 py-1 rounded-full font-medium',
                          order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          order.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                          order.status === 'shipped' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                          order.status === 'delivered' || order.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        )}>
                          {order.status === 'pending' ? '待确认' : order.status === 'confirmed' ? '已确认' : order.status === 'shipped' ? '已发货' : order.status === 'delivered' || order.status === 'completed' ? '已完成' : order.status}
                        </span>
                        <p className="text-gray-600 text-xs">{new Date(order.createdAt).toLocaleDateString('zh-CN')}</p>
                      </div>
                    </div>

                    {/* 展开操作区 */}
                    {selectedOrder?.id === order.id && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex flex-wrap items-center gap-3">
                          {/* 确认订单 */}
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); updateOrderStatus.mutate({ id: order.id, status: 'confirmed' }); }}
                              disabled={updateOrderStatus.isPending}
                              className="bg-blue-600 hover:bg-blue-500 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1.5" />
                              确认接单
                            </Button>
                          )}

                          {/* 填写运单号并发货 */}
                          {order.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShippingOrderId(order.id);
                                setTrackingInput(order.trackingNumber || '');
                                setShowShipModal(true);
                              }}
                              className="bg-purple-600 hover:bg-purple-500 text-white"
                            >
                              <Package className="w-4 h-4 mr-1.5" />
                              填写运单号并发货
                            </Button>
                          )}

                          {/* 确认签收 */}
                          {order.status === 'shipped' && (
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); updateOrderStatus.mutate({ id: order.id, status: 'delivered' }); }}
                              disabled={updateOrderStatus.isPending}
                              className="bg-green-600 hover:bg-green-500 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1.5" />
                              标记已签收
                            </Button>
                          )}

                          {/* 取消订单 */}
                          {(order.status === 'pending' || order.status === 'confirmed') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); if (confirm('确认取消该订单？')) updateOrderStatus.mutate({ id: order.id, status: 'cancelled' }); }}
                              disabled={updateOrderStatus.isPending}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              <X className="w-4 h-4 mr-1.5" />
                              取消订单
                            </Button>
                          )}

                          {/* 订单详情 */}
                          <div className="ml-auto text-xs text-gray-500 space-y-0.5">
                            {order.notes && <p>备注: {order.notes}</p>}
                            {order.totalAmount && <p>订单金额: <span className="text-amber-400 font-medium">${order.totalAmount} {order.currency || 'USD'}</span></p>}
                            {order.shippingPhone && <p>联系电话: {order.shippingPhone}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>

            {/* 发货弹窗 - 填写运单号 */}
            {showShipModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowShipModal(false)}>
                <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-white font-bold text-lg">填写发货信息</h3>
                      <p className="text-gray-400 text-sm mt-0.5">运单号将自动通知买家</p>
                    </div>
                    <button onClick={() => setShowShipModal(false)} className="text-gray-500 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-1.5 block">
                        运单号 <span className="text-red-400">*</span>
                      </label>
                      <Input
                        value={trackingInput}
                        onChange={e => setTrackingInput(e.target.value)}
                        placeholder="输入运单号，如 SF1234567890"
                        className="bg-white/5 border-white/20 text-white placeholder:text-gray-600 focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm font-medium mb-1.5 block">快递公司（可选）</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['顺丰速运', 'DHL', 'FedEx', 'UPS', 'EMS', '其他'].map(carrier => (
                          <button
                            key={carrier}
                            onClick={() => setTrackingCarrier(carrier)}
                            className={cn(
                              'py-2 px-3 rounded-lg text-sm border transition-all',
                              trackingCarrier === carrier
                                ? 'bg-purple-600/30 border-purple-500/50 text-purple-300'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                            )}
                          >
                            {carrier}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button
                      variant="outline"
                      className="flex-1 border-white/20 text-gray-400"
                      onClick={() => setShowShipModal(false)}
                    >
                      取消
                    </Button>
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-500 text-white"
                      disabled={!trackingInput.trim() || updateOrderStatus.isPending}
                      onClick={() => {
                        if (!shippingOrderId || !trackingInput.trim()) return;
                        const fullTracking = trackingCarrier ? `[${trackingCarrier}] ${trackingInput.trim()}` : trackingInput.trim();
                        updateOrderStatus.mutate({
                          id: shippingOrderId,
                          status: 'shipped',
                          trackingNumber: fullTracking,
                        });
                      }}
                    >
                      {updateOrderStatus.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />提交中...</>
                      ) : (
                        <><Package className="w-4 h-4 mr-2" />确认发货</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 资质认证 Tab ── */}
        {activeTab === "certifications" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">资质认证</h1>
                <p className="text-gray-400 text-sm mt-1">上传认证文件，建立买家信任</p>
              </div>
              <Button onClick={() => setShowAddCert(true)} className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />添加认证
              </Button>
            </div>

            {showAddCert && (
              <div className="mb-6 p-6 rounded-xl bg-white/5 border border-purple-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">添加资质认证</h3>
                  <button onClick={() => setShowAddCert(false)}><X className="w-4 h-4 text-gray-400" /></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">认证名称 *</label>
                    <Input value={newCert.name} onChange={e => setNewCert(c => ({...c, name: e.target.value}))} placeholder="e.g. ISO 9001, CE, RoHS" className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">颁发机构</label>
                    <Input value={newCert.issuer} onChange={e => setNewCert(c => ({...c, issuer: e.target.value}))} placeholder="e.g. TÜV Rheinland" className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">颁发日期</label>
                    <Input type="date" value={newCert.issuedAt} onChange={e => setNewCert(c => ({...c, issuedAt: e.target.value}))} className="bg-white/5 border-white/20 text-white" />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={() => addCert.mutate(newCert)}
                    disabled={!newCert.name || addCert.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {addCert.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    保存认证
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddCert(false)} className="border-white/20 text-gray-400">取消</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {factoryData.certifications && factoryData.certifications.length > 0 ? factoryData.certifications.map((cert: any) => (
                <div key={cert.id} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-green-500/30 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Award className="w-5 h-5 text-green-400" />
                    </div>
                    <button
                      onClick={() => deleteCert.mutate({ id: cert.id })}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="text-white font-medium mb-1">{cert.name}</h3>
                  {cert.issuer && <p className="text-gray-400 text-xs mb-1">颁发机构: {cert.issuer}</p>}
                  {cert.issuedAt && <p className="text-gray-500 text-xs">颁发日期: {new Date(cert.issuedAt).toLocaleDateString('zh-CN')}</p>}
                  <div className="mt-3 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400 text-xs">已验证</span>
                  </div>
                </div>
              )) : (
                <div className="col-span-3 text-center py-12">
                  <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">添加资质认证可以大幅提升买家信任度</p>
                  <p className="text-gray-500 text-sm">推荐添加：ISO 9001、CE、RoHS、FDA 等国际认证</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 工厂设置 Tab ── */}
        {/* ── 握手请求 Tab ──────────────────────────────────────────────────── */}
        {activeTab === "handshakes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-white text-xl font-bold">握手请求</h2>
              <button onClick={() => refetchHandshakes()} className="text-gray-400 hover:text-white transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            {(pendingHandshakes as any[]).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Handshake className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-400 font-medium">暂无待处理的握手请求</p>
                <p className="text-gray-600 text-sm mt-1">当买家向您发起对话请求时，会在这里显示</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(pendingHandshakes as any[]).map((h: any) => {
                  const expiresAt = h.expiresAt ? new Date(h.expiresAt) : null;
                  const now = new Date();
                  const minutesLeft = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 60000)) : null;
                  const isExpiringSoon = minutesLeft !== null && minutesLeft < 3;
                  return (
                    <div key={h.id} className={`p-4 rounded-xl border transition-all ${isExpiringSoon ? 'border-red-500/40 bg-red-500/5' : 'border-white/10 bg-white/3'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-semibold text-sm">Demand #{h.demandId}</span>
                            {minutesLeft !== null && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isExpiringSoon ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/15 text-amber-300'}`}>
                                ⏰ {minutesLeft}分钟后过期
                              </span>
                            )}
                          </div>
                          {h.buyerMessage && (
                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">"{h.buyerMessage}"</p>
                          )}
                          <p className="text-gray-600 text-xs mt-1">
                            收到时间：{new Date(h.createdAt).toLocaleString('zh-CN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            onClick={() => acceptHandshakeMutation.mutate({ handshakeId: h.id })}
                            disabled={acceptHandshakeMutation.isPending || rejectHandshakeMutation.isPending}
                            className="h-8 bg-green-600 hover:bg-green-500 text-white text-xs"
                          >
                            {acceptHandshakeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                            接受
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectHandshakeMutation.mutate({ handshakeId: h.id })}
                            disabled={acceptHandshakeMutation.isPending || rejectHandshakeMutation.isPending}
                            className="h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                          >
                            {rejectHandshakeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                            拒绝
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">工厂设置</h1>
                <p className="text-gray-400 text-sm mt-1">完善工厂信息，提升搜索曝光和买家信任</p>
              </div>
              {!showEditProfile && (
                <Button onClick={() => { setEditProfile({ name: factoryData.name || "", description: factoryData.description || "", category: factoryData.category || "", city: factoryData.city || "", country: factoryData.country || "", phone: factoryData.details?.phone || "", email: factoryData.details?.email || "", website: factoryData.details?.website || "", employeeCount: factoryData.details?.employeeCount || "" }); setShowEditProfile(true); }} className="bg-purple-600 hover:bg-purple-700">
                  <Edit className="w-4 h-4 mr-2" />编辑信息
                </Button>
              )}
            </div>

            {showEditProfile ? (
              <div className="p-6 rounded-xl bg-white/5 border border-purple-500/30">
                <h3 className="text-white font-semibold mb-4">编辑工厂信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">工厂名称</label>
                    <Input value={editProfile.name} onChange={e => setEditProfile(p => ({...p, name: e.target.value}))} className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">产品类别</label>
                    <Input value={editProfile.category} onChange={e => setEditProfile(p => ({...p, category: e.target.value}))} placeholder="e.g. Electronics" className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-gray-400 text-sm mb-1 block">工厂简介</label>
                    <Textarea value={editProfile.description} onChange={e => setEditProfile(p => ({...p, description: e.target.value}))} placeholder="介绍工厂的主营产品、生产能力、优势..." className="bg-white/5 border-white/20 text-white" rows={4} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">城市</label>
                    <Input value={editProfile.city} onChange={e => setEditProfile(p => ({...p, city: e.target.value}))} className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">国家</label>
                    <Input value={editProfile.country} onChange={e => setEditProfile(p => ({...p, country: e.target.value}))} className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">联系电话</label>
                    <Input value={editProfile.phone} onChange={e => setEditProfile(p => ({...p, phone: e.target.value}))} className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">联系邮箱</label>
                    <Input value={editProfile.email} onChange={e => setEditProfile(p => ({...p, email: e.target.value}))} className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">官网</label>
                    <Input value={editProfile.website} onChange={e => setEditProfile(p => ({...p, website: e.target.value}))} placeholder="https://..." className="bg-white/5 border-white/20 text-white" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1 block">员工人数</label>
                    <Input value={editProfile.employeeCount} onChange={e => setEditProfile(p => ({...p, employeeCount: e.target.value}))} placeholder="e.g. 100-500" className="bg-white/5 border-white/20 text-white" />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => updateProfile.mutate(editProfile)}
                    disabled={updateProfile.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    保存更改
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditProfile(false)} className="border-white/20 text-gray-400">取消</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">基本信息</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm w-20">工厂名称</span>
                      <span className="text-white text-sm">{factoryData.name || "未填写"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm w-20">所在地</span>
                      <span className="text-white text-sm">{factoryData.city}, {factoryData.country}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400 text-sm w-20">主营类别</span>
                      <span className="text-white text-sm">{factoryData.category || "未填写"}</span>
                    </div>
                    {factoryData.details?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm w-20">联系电话</span>
                        <span className="text-white text-sm">{factoryData.details.phone}</span>
                      </div>
                    )}
                    {factoryData.details?.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm w-20">联系邮箱</span>
                        <span className="text-white text-sm">{factoryData.details.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="text-white font-semibold mb-4">工厂简介</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{factoryData.description || "暂无简介，点击编辑添加工厂介绍"}</p>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
