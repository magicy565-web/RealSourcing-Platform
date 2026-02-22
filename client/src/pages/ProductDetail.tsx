import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Star, Bookmark, Share2, MoreHorizontal, ShoppingCart,
  MessageSquare, MapPin, ChevronLeft, ChevronRight, Cpu, Ruler,
  Weight, Tag, Layers, Zap, Check, Send, Loader2, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const productId = parseInt(params.id || "1", 10);

  const [activeImage, setActiveImage] = useState(0);
  const [inquiryQty, setInquiryQty] = useState("");
  const [inquiryLocation, setInquiryLocation] = useState("");
  const [inquiryNotes, setInquiryNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // ── tRPC Queries ──────────────────────────────────────────────────────────
  const { data: product, isLoading, error } = trpc.products.byId.useQuery({ id: productId });

  const favoriteMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.favorited ? "已收藏" : "已取消收藏");
    },
    onError: () => {
      toast.error("操作失败，请重试");
    },
  });

  const createInquiryMutation = trpc.inquiries.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("询价已发送！");
      setTimeout(() => setSubmitted(false), 3000);
      setInquiryQty("");
      setInquiryLocation("");
      setInquiryNotes("");
    },
    onError: (err) => {
      toast.error(`发送失败: ${err.message}`);
    },
  });

  const handlePrevImage = () => {
    const imgs = Array.isArray((product as any)?.images) ? (product as any).images as string[] : [];
    setActiveImage((i) => (i - 1 + imgs.length) % imgs.length);
  };

  const handleNextImage = () => {
    const imgs = Array.isArray((product as any)?.images) ? (product as any).images as string[] : [];
    setActiveImage((i) => (i + 1) % imgs.length);
  };

  const handleSubmitInquiry = () => {
    if (!inquiryQty || !product) {
      toast.error("请填写询价数量");
      return;
    }
    createInquiryMutation.mutate({
      productId: product.id,
      factoryId: product.factory?.id || 1,
      quantity: parseInt(inquiryQty, 10),
      destination: inquiryLocation || undefined,
      notes: inquiryNotes || undefined,
    });
  };

  // ── Loading / Error States ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{background:'linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)'}}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{background:'linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)'}}>
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Product Not Found</h2>
          <p className="text-gray-400 mb-4">{error?.message || "The product you're looking for doesn't exist."}</p>
          <Button onClick={() => window.history.back()} className="bg-purple-600 hover:bg-purple-500">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // ── Derived Data ──────────────────────────────────────────────────────────
  const details = product.details;
  // images is on the product table itself (JSON field)
  const images: string[] = Array.isArray((product as any).images) ? ((product as any).images as string[]) : [];
  // Build specs from product_details fields
  const specs: { label: string; value: string }[] = details ? [
    details.model ? { label: "Model", value: details.model } : null,
    details.brand ? { label: "Brand", value: details.brand } : null,
    details.size ? { label: "Size", value: details.size } : null,
    details.material ? { label: "Material", value: details.material } : null,
    details.weight ? { label: "Weight", value: details.weight } : null,
    details.features ? { label: "Features", value: details.features } : null,
    details.leadTimeDays ? { label: "Lead Time", value: `${details.leadTimeDays} days` } : null,
  ].filter(Boolean) as { label: string; value: string }[] : [];
  const isFavorited = product.isFavorited;

  const SPEC_ICONS: Record<string, React.ElementType> = {
    Model: Cpu,
    Brand: Tag,
    Size: Ruler,
    Material: Layers,
    Weight: Weight,
    Features: Zap,
  };

  return (
    <div className="min-h-screen text-white" style={{background:'linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)'}}>
      {/* ── Top Navigation ── */}
      <div className="sticky top-0 z-50 h-14 backdrop-blur-xl flex items-center justify-between px-6" style={{background:'rgba(5,3,16,0.85)',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回</span>
        </button>

        <h1 className="text-sm font-semibold truncate max-w-sm text-white">
          {product.name}
        </h1>

        <div className="flex items-center gap-3">
          <button
            onClick={() => favoriteMutation.mutate({ targetType: "product", targetId: product.id })}
            disabled={favoriteMutation.isPending}
            className={cn(
              "transition-colors",
              isFavorited ? "text-amber-400" : "text-gray-400 hover:text-white"
            )}
          >
            <Bookmark className={cn("w-5 h-5", isFavorited && "fill-amber-400")} />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Hero Section ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)'}}>
              {images.length > 0 ? (
                <img
                  src={images[activeImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-600" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                      i === activeImage ? "border-purple-500" : "border-white/10 hover:border-white/30"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.category && (
                <Badge className="mb-3 bg-purple-600/20 border border-purple-500/40 text-purple-300">
                  {product.category}
                </Badge>
              )}
              <h1 className="text-3xl font-bold text-white mb-3">{product.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                {product.reviews.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-amber-400 font-medium">
                      {(product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length).toFixed(1)}
                    </span>
                    <span>({product.reviews.length} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            {(details?.priceMin || details?.moq) && (
              <div className="rounded-xl p-4" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
                <div className="flex items-baseline gap-2 mb-2">
                  {details?.priceMin && (
                    <span className="text-3xl font-bold text-amber-400">
                      {details.currency || "USD"} {details.priceMin}
                      {details.priceMax && details.priceMax !== details.priceMin ? ` - ${details.priceMax}` : ""}
                    </span>
                  )}
                  {details?.unit && (
                    <span className="text-gray-400">/{details.unit}</span>
                  )}
                </div>
                {details?.moq && (
                  <p className="text-sm text-gray-400">MOQ: {details.moq} units</p>
                )}
              </div>
            )}

            {/* Factory Info */}
            {product.factory && (
              <div
                className="flex items-center gap-3 p-4  rounded-xl cursor-pointer hover:border-purple-500/40 transition-all"
                onClick={() => setLocation(`/factory/${product.factory!.id}`)}
              >
                {product.factory.logo ? (
                  <img
                    src={product.factory.logo}
                    alt={product.factory.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">{product.factory.name}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    {(product.factory.city || product.factory.country) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {[product.factory.city, product.factory.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    {product.factory.overallScore && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {Number(product.factory.overallScore).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl h-12"
                onClick={() => {
                  document.getElementById("quick-inquiry")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                立即询价
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl h-12"
                onClick={() => setLocation(`/sample-order/${product.id}`)}
              >
                <Package className="w-4 h-4 mr-2" />
                申请样品
              </Button>
              <Button
                variant="outline"
                className="border-white/30 text-gray-200 hover:bg-white/10 rounded-xl h-12 px-4"
                onClick={() => favoriteMutation.mutate({ targetType: "product", targetId: product.id })}
                disabled={favoriteMutation.isPending}
              >
                <Bookmark className={cn("w-4 h-4", isFavorited && "fill-amber-400 text-amber-400")} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Specs + Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Specifications */}
          {specs.length > 0 && (
            <div className="bg-[#141628] border border-purple-500/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-5 text-white">Product Specifications</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {specs.map((spec) => {
                  const Icon = SPEC_ICONS[spec.label] || Cpu;
                  return (
                    <div key={spec.label} className="flex items-start gap-3">
                      <Icon className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-sm text-gray-500">{spec.label}</span>
                        <p className="text-sm text-white font-medium mt-0.5">{spec.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="rounded-2xl p-6" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
              <h3 className="text-lg font-semibold mb-3 text-white">Product Description</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Reviews */}
          {product.reviews.length > 0 && (
            <div className="rounded-2xl p-6" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
              <h3 className="text-lg font-semibold mb-4 text-white">Reviews ({product.reviews.length})</h3>
              <div className="space-y-4">
                {product.reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="border-b border-white/5 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "w-3.5 h-3.5",
                              i < review.rating ? "text-amber-400 fill-amber-400" : "text-gray-600"
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-400">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Inquiry + Share */}
        <div className="space-y-5">
          {/* Quick Inquiry Form */}
          <div
            id="quick-inquiry"
            className="bg-[#141628] border border-purple-500/40 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold mb-5 text-white">Quick Inquiry</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Quantity</label>
                <Input
                  placeholder="e.g., 500"
                  value={inquiryQty}
                  onChange={(e) => setInquiryQty(e.target.value)}
                  type="number"
                  min="1"
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Destination</label>
                <Input
                  placeholder="Select Country"
                  value={inquiryLocation}
                  onChange={(e) => setInquiryLocation(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Notes</label>
                <Textarea
                  placeholder="Enter your message..."
                  value={inquiryNotes}
                  onChange={(e) => setInquiryNotes(e.target.value)}
                  rows={4}
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500 resize-none"
                />
              </div>

              <Button
                className={cn(
                  "w-full font-semibold rounded-xl h-12 text-base transition-all",
                  submitted
                    ? "bg-green-600 text-white"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/30"
                )}
                onClick={handleSubmitInquiry}
                disabled={createInquiryMutation.isPending || submitted}
              >
                {createInquiryMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sending...</>
                ) : submitted ? (
                  <><Check className="w-5 h-5 mr-2" />Inquiry Sent!</>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Inquiry
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Response within 2 hours
              </p>
            </div>
          </div>

          {/* Share Card */}
          <div className="rounded-2xl p-6" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',backdropFilter:'blur(20px)'}}>
            <h3 className="text-base font-semibold mb-4 text-white">Share Card</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { bg: "bg-green-600/20 border-green-500/30", icon: "🟢", label: "WeChat" },
                { bg: "bg-blue-700/20 border-blue-600/30", icon: "💼", label: "LinkedIn" },
                { bg: "bg-blue-600/20 border-blue-500/30", icon: "📘", label: "Facebook" },
                { bg: "bg-sky-600/20 border-sky-500/30", icon: "🐦", label: "Twitter" },
              ].map((s) => (
                <button
                  key={s.label}
                  className={cn(
                    "aspect-square rounded-xl border flex items-center justify-center text-xl hover:scale-105 transition-transform",
                    s.bg
                  )}
                  title={s.label}
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
