import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Package, ChevronRight, Loader2, CheckCircle, Clock,
  Truck, Star, Building2, ShoppingBag, ArrowLeft,
  MapPin, Phone, FileText, AlertCircle, RefreshCw,
  Copy, ExternalLink, Calendar
} from "lucide-react";
import { toast } from "sonner";

// ── Order Status Steps ────────────────────────────────────────────────────────
const ORDER_STEPS = [
  { key: "pending", label: "待确认", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30" },
  { key: "confirmed", label: "已确认", icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30" },
  { key: "shipped", label: "已发货", icon: Truck, color: "text-purple-400", bg: "bg-purple-500/20", border: "border-purple-500/30" },
  { key: "delivered", label: "已签收", icon: Package, color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30" },
];

function getStepIndex(status: string) {
  const idx = ORDER_STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
}

function StatusBadge({ status }: { status: string }) {
  const step = ORDER_STEPS.find(s => s.key === status);
  if (!step) return <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-400">{status}</span>;
  return (
    <span className={cn("text-xs px-3 py-1 rounded-full border", step.bg, step.border, step.color)}>
      {step.label}
    </span>
  );
}

// ── Order Progress Bar ────────────────────────────────────────────────────────
function OrderProgress({ status }: { status: string }) {
  const currentIdx = getStepIndex(status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 py-3">
        <AlertCircle className="w-4 h-4 text-red-400" />
        <span className="text-red-400 text-sm">订单已取消</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 w-full">
      {ORDER_STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                isCompleted ? `${step.bg} ${step.border}` : "bg-white/5 border-white/10"
              )}>
                <Icon className={cn("w-4 h-4", isCompleted ? step.color : "text-gray-600")} />
              </div>
              <span className={cn("text-xs mt-1 whitespace-nowrap", isCompleted ? step.color : "text-gray-600")}>
                {step.label}
              </span>
            </div>
            {idx < ORDER_STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-1 mb-4 transition-all",
                idx < currentIdx ? "bg-purple-500/50" : "bg-white/10"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order, onSelect }: { order: any; onSelect: (id: number) => void }) {
  const images: string[] = Array.isArray(order.product?.images)
    ? order.product.images
    : (typeof order.product?.images === "string" ? JSON.parse(order.product.images || "[]") : []);
  const productImage = images[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop";

  return (
    <div
      className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer group"
      onClick={() => onSelect(order.id)}
    >
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <img src={productImage} alt={order.product?.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />

        {/* Order Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-white font-medium truncate">{order.product?.name || "产品"}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3 h-3 text-gray-500" />
                <span className="text-gray-400 text-xs">{order.factory?.name || "工厂"}</span>
              </div>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Progress */}
          <div className="mt-3">
            <OrderProgress status={order.status} />
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>数量: {order.quantity}</span>
            {order.totalAmount && <span>总价: ${order.totalAmount}</span>}
            {order.trackingNumber && (
              <span className="flex items-center gap-1 text-purple-400">
                <Truck className="w-3 h-3" />
                {order.trackingNumber}
              </span>
            )}
            <span className="ml-auto">{order.createdAt ? new Date(order.createdAt).toLocaleDateString("zh-CN") : ""}</span>
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 flex-shrink-0 mt-1 transition-colors" />
      </div>
    </div>
  );
}

// ── Order Detail Panel ────────────────────────────────────────────────────────
function OrderDetailPanel({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const { data: order, isLoading } = trpc.sampleOrders.byId.useQuery({ id: orderId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const images: string[] = Array.isArray(order.product?.images)
    ? (order.product.images as string[])
    : (typeof order.product?.images === "string" ? JSON.parse(order.product.images || "[]") : []);
  const productImage = images[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-white font-semibold">订单详情</h2>
          <p className="text-gray-500 text-xs">订单 #{order.id}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {/* Product Card */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <img src={productImage} alt={order.product?.name} className="w-14 h-14 rounded-lg object-cover" />
            <div>
              <h3 className="text-white font-medium">{order.product?.name}</h3>
              <p className="text-gray-400 text-sm">{order.factory?.name}</p>
              <p className="text-gray-500 text-xs mt-0.5">数量: {order.quantity} 件</p>
            </div>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-gray-300 text-sm font-medium mb-4">物流进度</h4>
          <OrderProgress status={order.status} />
          {order.trackingNumber && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Truck className="w-4 h-4 text-purple-400" />
              <div className="flex-1">
                <p className="text-gray-400 text-xs">运单号</p>
                <p className="text-white text-sm font-mono">{order.trackingNumber}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(order.trackingNumber!); toast.success("运单号已复制"); }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Price Info */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-gray-300 text-sm font-medium mb-3">价格明细</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">单价</span>
              <span className="text-white">{order.unitPrice ? `$${order.unitPrice}` : "待确认"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">数量</span>
              <span className="text-white">{order.quantity} 件</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/10 pt-2 mt-2">
              <span className="text-gray-300 font-medium">总计</span>
              <span className="text-white font-semibold">{order.totalAmount ? `$${order.totalAmount}` : "待确认"}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-gray-300 text-sm font-medium mb-3">收货信息</h4>
            <div className="space-y-2 text-sm">
              {order.shippingName && (
                <div className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-gray-300">{order.shippingName}</span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5" />
                <span className="text-gray-300">{order.shippingAddress}{order.shippingCountry ? `, ${order.shippingCountry}` : ""}</span>
              </div>
              {order.shippingPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-gray-300">{order.shippingPhone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="text-gray-300 text-sm font-medium mb-2">备注</h4>
            <p className="text-gray-400 text-sm">{order.notes}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <h4 className="text-gray-300 text-sm font-medium mb-3">时间记录</h4>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>创建时间: {order.createdAt ? new Date(order.createdAt).toLocaleString("zh-CN") : "—"}</span>
            </div>
            {order.updatedAt && (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>更新时间: {new Date(order.updatedAt).toLocaleString("zh-CN")}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SampleOrderTracker() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: orders = [], isLoading, refetch } = trpc.sampleOrders.mySampleOrders.useQuery(undefined, {
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center" style={{background:"linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)"}}>
        <div className="text-center">
          <p className="text-white text-xl mb-4">请先登录</p>
          <Button onClick={() => setLocation("/login")} className="bg-purple-600 hover:bg-purple-700">前往登录</Button>
        </div>
      </div>
    );
  }

  const filteredOrders = filterStatus === "all"
    ? orders
    : orders.filter((o: any) => o.status === filterStatus);

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === "pending").length,
    inTransit: orders.filter((o: any) => o.status === "shipped").length,
    delivered: orders.filter((o: any) => o.status === "delivered" || o.status === "completed").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]" style={{background:"linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)"}}>
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0F0F23]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => setLocation("/dashboard")} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg">样品订单追踪</h1>
            <p className="text-gray-400 text-xs">实时追踪您的样品订单状态</p>
          </div>
          <button onClick={() => refetch()} className="ml-auto p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "全部订单", value: stats.total, icon: ShoppingBag, color: "text-white", bg: "bg-white/10" },
            { label: "待确认", value: stats.pending, icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
            { label: "运输中", value: stats.inTransit, icon: Truck, color: "text-purple-400", bg: "bg-purple-500/10" },
            { label: "已签收", value: stats.delivered, icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={cn("p-5 rounded-2xl border border-white/10", s.bg)}>
                <div className="flex items-center justify-between mb-3">
                  <Icon className={cn("w-5 h-5", s.color)} />
                </div>
                <p className={cn("text-3xl font-bold mb-1", s.color)}>{s.value}</p>
                <p className="text-gray-500 text-sm">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="flex gap-6">
          {/* Order List */}
          <div className={cn("transition-all", selectedOrderId ? "w-1/2" : "w-full")}>
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { key: "all", label: "全部" },
                { key: "pending", label: "待确认" },
                { key: "confirmed", label: "已确认" },
                { key: "shipped", label: "运输中" },
                { key: "delivered", label: "已签收" },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs transition-all",
                    filterStatus === f.key
                      ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                      : "bg-white/5 text-gray-500 hover:bg-white/10"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="w-14 h-14 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">暂无样品订单</p>
                <p className="text-gray-600 text-sm mb-6">在工厂详情页或会议室中申请样品</p>
                <Button onClick={() => setLocation("/factories")} className="bg-purple-600 hover:bg-purple-500">
                  浏览工厂
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order: any) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onSelect={(id) => setSelectedOrderId(selectedOrderId === id ? null : id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedOrderId && (
            <div className="w-1/2 bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-24 h-fit max-h-[calc(100vh-120px)] overflow-y-auto">
              <OrderDetailPanel
                orderId={selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
