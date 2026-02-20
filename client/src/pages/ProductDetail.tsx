import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Star, Bookmark, Share2, MoreHorizontal, ShoppingCart,
  MessageSquare, MapPin, ChevronLeft, ChevronRight, Cpu, Ruler,
  Weight, Tag, Layers, Zap, Check, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_PRODUCT = {
  id: 1,
  name: "ANC 3.0 降噪耳机",
  price: 45,
  currency: "¥",
  unit: "件",
  moq: 500,
  stock: 50000,
  rating: 4.8,
  reviewCount: 156,
  images: [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1545127398-14699f92334b?w=600&h=600&fit=crop",
  ],
  specifications: [
    { icon: Cpu, label: "Model", value: "ANC-3.0-PRO" },
    { icon: Tag, label: "Brand", value: "White" },
    { icon: Ruler, label: "Size", value: "18 x 5 x 3 cm" },
    { icon: Layers, label: "Material", value: "ABS + Silicone" },
    { icon: Weight, label: "Weight", value: "45g" },
    { icon: Zap, label: "Features", value: "Active Noise Cancellation, Bluetooth 5.3" },
  ],
  description:
    "The ANC 3.0 Noise Cancelling Headphones feature the latest active noise cancellation technology, delivering immersive sound and crystal-clear calls. Designed for comfort with soft ear cushions and a lightweight frame, they offer long-lasting battery life for all-day use.",
  factory: {
    id: 1,
    name: "Shenzhen Tech Factory",
    location: "Shenzhen",
    rating: 4.9,
    logo: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=80&h=80&fit=crop",
  },
  relatedProducts: [
    { id: 2, name: "Wireless Earbuds X1", price: 35, unit: "件", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop" },
    { id: 3, name: "Sport Headphones S2", price: 25, unit: "件", image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=300&h=300&fit=crop" },
    { id: 4, name: "Charging Case C3", price: 15, unit: "件", image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=300&fit=crop" },
    { id: 5, name: "Audio Cable A4", price: 8, unit: "件", image: "https://images.unsplash.com/photo-1545127398-14699f92334b?w=300&h=300&fit=crop" },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [inquiryQty, setInquiryQty] = useState("");
  const [inquiryLocation, setInquiryLocation] = useState("");
  const [inquiryNotes, setInquiryNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const product = MOCK_PRODUCT;

  const handlePrevImage = () =>
    setActiveImage((i) => (i - 1 + product.images.length) % product.images.length);
  const handleNextImage = () =>
    setActiveImage((i) => (i + 1) % product.images.length);

  const handleSubmitInquiry = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white">
      {/* ── Top Navigation ── */}
      <div className="sticky top-0 z-50 h-14 bg-[#0D0F1A]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
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
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={cn(
              "transition-colors",
              isBookmarked ? "text-amber-400" : "text-gray-400 hover:text-white"
            )}
          >
            <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-amber-400")} />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Hero: Image Gallery + Price Info ── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Image Gallery */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#141628] border border-white/10 mb-4 group">
              <img
                src={product.images[activeImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {/* Navigation Arrows */}
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
              {/* Counter */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-xs text-gray-300">
                {activeImage + 1} / {product.images.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    "w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all",
                    activeImage === i
                      ? "border-purple-500 shadow-lg shadow-purple-500/30"
                      : "border-white/10 hover:border-white/30"
                  )}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-white mb-4">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-5xl font-bold text-amber-400">
                {product.currency}{product.price}
              </span>
              <span className="text-xl text-gray-400">/ {product.unit}</span>
            </div>

            {/* MOQ + Stock */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm text-gray-400">
                MOQ: <span className="text-white font-medium">{product.moq.toLocaleString()} {product.unit}</span>
              </span>
              <Badge className="bg-green-500/20 border border-green-500/40 text-green-400 text-xs px-2.5 py-1">
                库存: {product.stock.toLocaleString()} {product.unit}
              </Badge>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-8">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-amber-400 font-semibold">{product.rating}</span>
              <span className="text-gray-400">/ 5.0</span>
              <span className="text-gray-500">({product.reviewCount} 条评论)</span>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl h-13 text-base shadow-lg shadow-purple-500/30"
                onClick={() => {}}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                加入购物车
              </Button>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl h-13 text-base shadow-lg shadow-amber-500/30"
                onClick={() => {
                  document.getElementById("quick-inquiry")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                立即询价
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Specs + Description + Related */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Specifications */}
          <div className="bg-[#141628] border border-purple-500/30 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-5 text-white">Product Specifications</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {product.specifications.map((spec) => {
                const Icon = spec.icon;
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

          {/* Description + Factory Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Product Description */}
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-3 text-white">Product Description</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{product.description}</p>
            </div>

            {/* Factory Info */}
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-purple-900/20 border border-purple-500/20 shrink-0">
                  <img
                    src={product.factory.logo}
                    alt={product.factory.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold text-white">{product.factory.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    <span>{product.factory.location}</span>
                    <span className="text-gray-600">·</span>
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-amber-400 font-medium">{product.factory.rating}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="link"
                className="text-purple-400 hover:text-purple-300 p-0 h-auto text-sm justify-start"
                onClick={() => setLocation(`/factory/${product.factory.id}`)}
              >
                Visit Factory Page →
              </Button>
            </div>
          </div>

          {/* Related Products */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-5 text-white">Related Products</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {product.relatedProducts.map((rp) => (
                <button
                  key={rp.id}
                  onClick={() => setLocation(`/product/${rp.id}`)}
                  className="group text-left"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-800 mb-2 border border-white/10 group-hover:border-purple-500/40 transition-colors">
                    <img
                      src={rp.image}
                      alt={rp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                    {rp.name}
                  </p>
                  <p className="text-sm text-amber-400 font-semibold mt-0.5">
                    ¥{rp.price}/{rp.unit}
                  </p>
                </button>
              ))}
            </div>
          </div>
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
                  className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">Location</label>
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
              >
                {submitted ? (
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
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
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
