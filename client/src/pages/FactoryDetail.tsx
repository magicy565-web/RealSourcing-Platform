import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Heart, Share2, MoreHorizontal, MapPin, Star, Phone, Mail,
  Clock, MessageSquare, Package, Check, Play, ChevronRight, Building2, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const PRODUCT_TABS = [
  { key: "all", label: "All" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function FactoryDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const factoryId = parseInt(params.id || "1", 10);

  const [activeTab, setActiveTab] = useState("all");

  // ── tRPC Queries ──────────────────────────────────────────────────────────
  const { data: factory, isLoading, error } = trpc.factories.byId.useQuery({ id: factoryId });

  const favoriteMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.favorited ? "已收藏" : "已取消收藏");
    },
    onError: () => {
      toast.error("操作失败，请重试");
    },
  });

  const handleToggleFavorite = () => {
    favoriteMutation.mutate({ targetType: "factory", targetId: factoryId });
  };

  // ── Loading / Error States ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading factory...</p>
        </div>
      </div>
    );
  }

  if (error || !factory) {
    return (
      <div className="min-h-screen bg-[#0D0F1A] text-white flex items-center justify-center">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Factory Not Found</h2>
          <p className="text-gray-400 mb-4">{error?.message || "The factory you're looking for doesn't exist."}</p>
          <Button onClick={() => setLocation("/factories")} className="bg-purple-600 hover:bg-purple-500">
            Back to Factories
          </Button>
        </div>
      </div>
    );
  }

  // ── Derived Data ──────────────────────────────────────────────────────────
  const isFavorited = factory.isFavorited;
  const details = factory.details;
  const products = factory.products || [];
  const reviews = factory.reviews || [];

  const certifications: string[] = Array.isArray(details?.certifications)
    ? (details.certifications as string[])
    : [];

  const productionCapacity: { label: string }[] = Array.isArray(details?.productionCapacity)
    ? (details.productionCapacity as { label: string }[])
    : [];

  const filteredProducts =
    activeTab === "all"
      ? products
      : products.filter((p) => p.category === activeTab);

  // Derive unique categories for tabs
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const productTabs = [
    { key: "all", label: "All" },
    ...categories.map((c) => ({ key: c!, label: c! })),
  ];

  const coverImage =
    details?.coverImage ||
    "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=1400&h=500&fit=crop";

  const logoImage =
    factory.logo ||
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=120&h=120&fit=crop";

  return (
    <div className="min-h-screen bg-[#0D0F1A] text-white">
      {/* ── Top Navigation ── */}
      <div className="sticky top-0 z-50 h-14 bg-[#0D0F1A]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6">
        <button
          onClick={() => setLocation("/factories")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h1 className="text-sm font-semibold text-white">{factory.name}</h1>

        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleFavorite}
            disabled={favoriteMutation.isPending}
            className={cn(
              "flex items-center gap-1.5 transition-colors text-sm",
              isFavorited ? "text-red-400" : "text-gray-400 hover:text-white"
            )}
          >
            <Heart className={cn("w-4 h-4", isFavorited && "fill-red-400")} />
            <span>Favorite</span>
          </button>
          <button className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Hero Cover Image ── */}
      <div className="relative h-[360px] overflow-hidden">
        <img
          src={coverImage}
          alt={factory.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0F1A] via-[#0D0F1A]/20 to-transparent" />
      </div>

      {/* ── Factory Identity Bar ── */}
      <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10">
        <div className="flex items-end justify-between">
          <div className="flex items-end gap-6">
            {/* Logo */}
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-purple-500/60 bg-[#1A1C2E] shadow-2xl shadow-purple-500/20 shrink-0">
              <img
                src={logoImage}
                alt={factory.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="pb-2">
              <h1 className="text-3xl font-bold text-white">{factory.name}</h1>
              <div className="flex items-center gap-5 mt-1.5 text-sm text-gray-400">
                {(factory.city || factory.country) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    {[factory.city, factory.country].filter(Boolean).join(", ")}
                  </span>
                )}
                {factory.category && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    {factory.category}
                  </span>
                )}
                {factory.overallScore && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {Number(factory.overallScore).toFixed(1)}
                  </span>
                )}
              </div>
              {certifications.length > 0 && (
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-xs text-gray-500">Certifications</span>
                  {certifications.map((c) => (
                    <Badge
                      key={c}
                      className="bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs px-2 py-0.5"
                    >
                      {c}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 pb-2">
            <Button
              className="bg-purple-600 hover:bg-purple-500 text-white px-8 rounded-full font-semibold shadow-lg shadow-purple-500/30 h-11"
              onClick={() => setLocation(`/meeting/new?factoryId=${factory.id}`)}
            >
              Start 1:1 Meeting
            </Button>
            <Button
              variant="outline"
              className="border-white/30 text-gray-200 hover:bg-white/10 px-8 rounded-full h-11"
              onClick={() => setLocation("/webinars")}
            >
              Browse Webinars
            </Button>
          </div>
        </div>
      </div>

      {/* ── Three-column Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">

        {/* Left Column (25%) */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          {/* Rating Card */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              <span className="text-4xl font-bold text-amber-400">
                {details?.rating ? Number(details.rating).toFixed(1) : Number(factory.overallScore || 0).toFixed(1)}
              </span>
              <span className="text-gray-500 text-lg">/ 5.0</span>
            </div>
            <a href="#reviews" className="text-purple-400 text-sm hover:underline">
              {details?.reviewCount || reviews.length} Reviews
            </a>
            <div className="mt-4 space-y-1.5 text-sm text-gray-400">
              {details?.established && <p>Est. {details.established}</p>}
              {details?.employeeCount && <p>{details.employeeCount} Employees</p>}
            </div>
            {certifications.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                {certifications.slice(0, 3).map((c) => (
                  <Badge
                    key={c}
                    variant="outline"
                    className="border-white/20 text-gray-400 text-xs"
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            )}
            {details?.avgResponseTime && (
              <div className="flex items-center justify-center gap-1.5 mt-3 text-green-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>Avg {details.avgResponseTime}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold h-11"
              onClick={() => setLocation(`/meeting/new?factoryId=${factory.id}`)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Start Meeting
            </Button>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold h-11"
              onClick={() => setLocation(`/inquiry/new?factoryId=${factory.id}`)}
            >
              <Package className="w-4 h-4 mr-2" />
              Send Inquiry
            </Button>
            <Button
              variant="outline"
              className={cn(
                "w-full rounded-xl font-semibold h-11 transition-all",
                isFavorited
                  ? "bg-green-600/20 border-green-500/50 text-green-400 hover:bg-green-600/30"
                  : "border-white/20 text-gray-300 hover:bg-white/10"
              )}
              onClick={handleToggleFavorite}
              disabled={favoriteMutation.isPending}
            >
              {isFavorited ? (
                <><Check className="w-4 h-4 mr-2" />Favorited</>
              ) : (
                "Add to Favorites"
              )}
            </Button>
          </div>
        </div>

        {/* Center Column (50%) */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          {/* About Us */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-white">About Us</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              {factory.description || "No description available."}
            </p>
          </div>

          {/* Main Products */}
          {products.length > 0 && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Main Products</h3>

              {/* Tab Filter */}
              <div className="flex gap-1 mb-5 border-b border-white/10 pb-0">
                {productTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "text-sm px-4 py-2 transition-colors border-b-2 -mb-px",
                      activeTab === tab.key
                        ? "text-purple-400 border-purple-500 font-medium"
                        : "text-gray-500 border-transparent hover:text-gray-300"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {filteredProducts.map((product) => {
                  const images = Array.isArray(product.images) ? product.images as string[] : [];
                  const productImage = images[0] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop";
                  return (
                    <button
                      key={product.id}
                      onClick={() => setLocation(`/product/${product.id}`)}
                      className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 transition-all group text-left"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-800">
                        <img
                          src={productImage}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">
                          {product.name}
                        </p>
                        {product.category && (
                          <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
                        )}
                        <p className="text-xs text-purple-400/70 mt-0.5 hover:underline">
                          View Details
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Production Capacity */}
          {productionCapacity.length > 0 && (
            <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Production Capacity</h3>
              <div className="grid grid-cols-3 gap-3">
                {productionCapacity.map((cap) => (
                  <div
                    key={cap.label}
                    className="flex items-center justify-center gap-2 py-3 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 text-center"
                  >
                    <span>{cap.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div id="reviews" className="bg-[#141628] border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Reviews</h3>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review) => (
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

        {/* Right Column (25%) */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          {/* Contact Card */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-purple-900/20 border border-purple-500/20 mb-3">
                <img
                  src={logoImage}
                  alt={factory.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="font-semibold text-white">{factory.name}</p>
              {(factory.city || factory.country) && (
                <p className="text-sm text-gray-400 mt-0.5">
                  {[factory.city, factory.country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
            {(details?.phone || details?.email) && (
              <div className="space-y-3 text-sm">
                {details.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Phone: <span className="text-white font-medium">{details.phone}</span></span>
                  </div>
                )}
                {details.email && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Email: <span className="text-white font-medium truncate">{details.email}</span></span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Factory Stats */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
            <h3 className="text-base font-semibold mb-4 text-white">Factory Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Products</span>
                <span className="text-white font-medium">{products.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reviews</span>
                <span className="text-white font-medium">{reviews.length}</span>
              </div>
              {factory.status && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={cn(
                    "font-medium capitalize",
                    factory.status === "active" ? "text-green-400" : "text-yellow-400"
                  )}>
                    {factory.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Browse Webinars */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-purple-400 hover:text-purple-300 hover:bg-purple-600/10 text-xs border border-purple-500/20"
            onClick={() => setLocation("/webinars")}
          >
            Browse All Webinars
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
