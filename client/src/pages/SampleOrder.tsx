import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Package, ChevronLeft, CheckCircle, Loader2, Star, Globe,
  ShieldCheck, Truck, CreditCard, AlertCircle, Plus, Minus
} from "lucide-react";

export default function SampleOrder() {
  const params = useParams<{ productId: string }>();
  const productId = parseInt(params.productId || "0");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [orderId, setOrderId] = useState<number | null>(null);

  // ── tRPC Queries ──────────────────────────────────────────────────────────
  const { data: product, isLoading } = trpc.products.byId.useQuery(
    { id: productId },
    { enabled: !!productId }
  );

  // ── tRPC Mutations ────────────────────────────────────────────────────────
  const createOrder = trpc.sampleOrders.create.useMutation({
    onSuccess: (data: any) => {
      setOrderId(data.id);
      setStep("success");
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center" style={{background:"linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)"}}>
        <div className="text-center">
          <p className="text-white text-xl mb-4">请先登录后再下样品单</p>
          <Button onClick={() => setLocation("/login")} className="bg-purple-600 hover:bg-purple-700">前往登录</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center" style={{background:"linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)"}}>
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center" style={{background:"linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)"}}>
        <div className="text-center">
          <p className="text-white text-xl mb-4">产品不存在</p>
          <Button onClick={() => setLocation("/factories")} variant="outline" className="border-white/20 text-gray-400">返回工厂列表</Button>
        </div>
      </div>
    );
  }

  const details = (product as any).details;
  const images: string[] = Array.isArray(product.images) ? product.images as string[] : [];
  const productImage = images[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop";
  const priceMin = details?.priceMin ? Number(details.priceMin) : null;
  const samplePrice = priceMin ? (priceMin * 2).toFixed(2) : "询价";
  const totalPrice = priceMin ? (priceMin * 2 * quantity).toFixed(2) : null;
  const productRating = (product as any)?.rating;

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E] flex items-center justify-center" style={{background:"linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)"}}>
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">样品单提交成功！</h2>
          <p className="text-gray-400 mb-2">
            您的样品订单 <span className="text-purple-400 font-mono">#{orderId}</span> 已提交给工厂
          </p>
          <p className="text-gray-500 text-sm mb-8">工厂将在 24 小时内确认并提供付款方式</p>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-8 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">产品</span>
              <span className="text-white">{product.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">数量</span>
              <span className="text-white">{quantity} 件</span>
            </div>
            {totalPrice && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">样品单价</span>
                <span className="text-white">${samplePrice} / 件</span>
              </div>
            )}
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="text-gray-300 font-medium">预估总价</span>
              <span className="text-purple-400 font-bold">{totalPrice ? `$${totalPrice}` : "待工厂确认"}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button onClick={() => setLocation("/inquiries")} className="bg-purple-600 hover:bg-purple-700">
              查看订单状态
            </Button>
            <Button variant="outline" onClick={() => setLocation(`/product/${productId}`)} className="border-white/20 text-gray-400">
              返回产品页
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]" style={{background:"linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)"}}>
      {/* 顶部导航 */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => setLocation(`/product/${productId}`)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">返回产品页</span>
          </button>
          <div className="h-4 w-px bg-white/20" />
          <h1 className="text-white font-semibold">申请样品</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-5 gap-8">

          {/* ── 左侧：产品信息 ── */}
          <div className="col-span-2">
            <div className="p-5 rounded-xl bg-white/5 border border-white/10 sticky top-8">
              <img src={productImage} alt={product.name} className="w-full aspect-square object-cover rounded-lg mb-4" />
              <h2 className="text-white font-semibold mb-1">{product.name}</h2>
              {product.category && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-sm">{product.category}</span>
                </div>
              )}
              {productRating && (
                <div className="flex items-center gap-1.5 mb-3">
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 text-sm font-medium">{Number(productRating).toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">评分</span>
                </div>
              )}
              {priceMin && (
                <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-4">
                  <p className="text-gray-400 text-xs mb-1">样品单价（含打样费）</p>
                  <p className="text-purple-400 text-xl font-bold">${samplePrice}</p>
                  <p className="text-gray-500 text-xs mt-1">批量采购价：${priceMin}+/件</p>
                </div>
              )}

              {/* 信任保障 */}
              <div className="space-y-2 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                  <span>平台担保交易</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span>全球快递配送</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                  <span>PayPal / 信用卡 / 电汇</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 右侧：表单 ── */}
          <div className="col-span-3">
            {step === "form" && (
              <div>
                <h2 className="text-xl font-bold text-white mb-6">填写样品申请信息</h2>

                {/* 数量选择 */}
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 mb-5">
                  <h3 className="text-white font-medium mb-4">样品数量</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-2xl font-bold text-white w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(q => Math.min(10, q + 1))}
                      className="w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-gray-400 text-sm">件（最多10件）</span>
                  </div>
                  {totalPrice && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between">
                      <span className="text-gray-400">预估总价</span>
                      <span className="text-purple-400 font-bold text-lg">${totalPrice}</span>
                    </div>
                  )}
                </div>

                {/* 收货地址 */}
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 mb-5">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    收货地址
                  </h3>
                  <Textarea
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="请填写完整收货地址，包括：姓名、电话、国家、城市、详细地址、邮编"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                    rows={4}
                  />
                </div>

                {/* 备注 */}
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 mb-5">
                  <h3 className="text-white font-medium mb-4">特殊要求（可选）</h3>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="如：颜色要求、包装要求、定制Logo、测试标准等..."
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500"
                    rows={3}
                  />
                </div>

                {/* 须知 */}
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6 flex gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-300/80 space-y-1">
                    <p>样品费用包含产品成本和打样费，不含国际运费。</p>
                    <p>工厂确认后将提供付款链接，付款后 7-15 个工作日发货。</p>
                    <p>样品费用可在后续批量采购中抵扣（部分工厂）。</p>
                  </div>
                </div>

                <Button
                  onClick={() => setStep("confirm")}
                  disabled={!shippingAddress}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-3 text-base"
                >
                  下一步：确认订单
                </Button>
              </div>
            )}

            {step === "confirm" && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep("form")} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-xl font-bold text-white">确认样品订单</h2>
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10 mb-5 space-y-4">
                  <h3 className="text-white font-medium">订单详情</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">产品</span>
                      <span className="text-white">{product.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">数量</span>
                      <span className="text-white">{quantity} 件</span>
                    </div>
                    {totalPrice && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">样品单价</span>
                          <span className="text-white">${samplePrice}</span>
                        </div>
                        <div className="border-t border-white/10 pt-3 flex justify-between font-medium">
                          <span className="text-gray-300">预估总价（不含运费）</span>
                          <span className="text-purple-400 text-lg">${totalPrice}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-white/5 border border-white/10 mb-5">
                  <h3 className="text-white font-medium mb-2">收货地址</h3>
                  <p className="text-gray-400 text-sm whitespace-pre-wrap">{shippingAddress}</p>
                </div>

                {notes && (
                  <div className="p-5 rounded-xl bg-white/5 border border-white/10 mb-5">
                    <h3 className="text-white font-medium mb-2">特殊要求</h3>
                    <p className="text-gray-400 text-sm">{notes}</p>
                  </div>
                )}

                <Button
                  onClick={() => createOrder.mutate({
                    productId,
                    factoryId: (product as any)?.factory?.id || 1,
                    quantity,
                    shippingAddress,
                    notes: notes || undefined,
                  })}
                  disabled={createOrder.isPending}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-3 text-base"
                >
                  {createOrder.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />提交中...</>
                  ) : (
                    "提交样品申请"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
