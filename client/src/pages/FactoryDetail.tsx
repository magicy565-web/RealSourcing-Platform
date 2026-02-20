import { useState } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Heart, Share2, MoreHorizontal, MapPin, Star, Phone, Mail,
  Clock, MessageSquare, Package, Check, Play, ChevronRight, Building2, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_FACTORY = {
  id: 1,
  name: "Shenzhen Tech Factory",
  nameZh: "深圳科技工厂",
  location: "Guangdong Shenzhen",
  industry: "Consumer Electronics",
  rating: 4.9,
  reviewCount: 234,
  established: 2008,
  employeeCount: "500+",
  avgResponseTime: "2h",
  certifications: ["CE", "ISO9001", "FCC", "RoHS"],
  logo: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=120&h=120&fit=crop",
  coverImage: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=1400&h=500&fit=crop",
  description:
    "Shenzhen Tech Factory is a leading manufacturer specializing in high-quality consumer electronics, dedicated to innovation and reliability in every product we deliver. We combine advanced technology with precision engineering.",
  contact: {
    phone: "+86 123 456 7890",
    email: "contact@techfactory.com",
    city: "Shenzhen, CN",
  },
  productionCapacity: [
    { label: "5M Units/Year" },
    { label: "Injection Molding" },
    { label: "15-30 Days Lead Time" },
  ],
  products: [
    { id: 1, name: "ANC 3.0 Headphones", priceRange: "$40-50", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop", category: "Consumer Electronics" },
    { id: 2, name: "Smart Watch Series 5", priceRange: "$55-70", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop", category: "Consumer Electronics" },
    { id: 3, name: "True Wireless Earbuds", priceRange: "$30-45", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&h=200&fit=crop", category: "Consumer Electronics" },
    { id: 4, name: "Fast Wireless Charger", priceRange: "$20-35", image: "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=200&h=200&fit=crop", category: "Accessories" },
    { id: 5, name: "USB-C Hub Pro", priceRange: "$25-40", image: "https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=200&h=200&fit=crop", category: "Accessories" },
    { id: 6, name: "Portable Speaker X1", priceRange: "$35-55", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=200&h=200&fit=crop", category: "Consumer Electronics" },
  ],
  webinars: [
    {
      id: 1,
      title: "2025 Launch",
      scheduledAt: "Tomorrow 14:00",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop",
    },
    {
      id: 2,
      title: "New Features Demo",
      scheduledAt: "Friday 10:00",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80&h=80&fit=crop",
    },
  ],
};

const PRODUCT_TABS = [
  { key: "all", label: "All" },
  { key: "Consumer Electronics", label: "Consumer Electronics" },
  { key: "Accessories", label: "Accessories" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function FactoryDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const factory = MOCK_FACTORY;

  const filteredProducts =
    activeTab === "all"
      ? factory.products
      : factory.products.filter((p) => p.category === activeTab);

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
            onClick={() => setIsFavorited(!isFavorited)}
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
          src={factory.coverImage}
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
                src={factory.logo}
                alt={factory.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="pb-2">
              <h1 className="text-3xl font-bold text-white">{factory.name}</h1>
              <div className="flex items-center gap-5 mt-1.5 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  {factory.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  {factory.industry}
                </span>
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {factory.rating}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-xs text-gray-500">Certifications</span>
                {factory.certifications.map((c) => (
                  <Badge
                    key={c}
                    className="bg-purple-600/20 border border-purple-500/40 text-purple-300 text-xs px-2 py-0.5"
                  >
                    {c}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-3 pb-2">
            <Button
              className="bg-purple-600 hover:bg-purple-500 text-white px-8 rounded-full font-semibold shadow-lg shadow-purple-500/30 h-11"
              onClick={() => setLocation(`/meeting/new?factoryId=${factory.id}`)}
            >
              [Start 1:1 Meeting]
            </Button>
            <Button
              variant="outline"
              className="border-white/30 text-gray-200 hover:bg-white/10 px-8 rounded-full h-11"
              onClick={() => setLocation("/webinars")}
            >
              [Browse Webinars]
            </Button>
          </div>
        </div>
      </div>

      {/* ── Three-column Content ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-6">

        {/* Left Column (20%) */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          {/* Rating Card */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              <span className="text-4xl font-bold text-amber-400">{factory.rating}</span>
              <span className="text-gray-500 text-lg">/ 5.0</span>
            </div>
            <a href="#reviews" className="text-purple-400 text-sm hover:underline">
              {factory.reviewCount} Reviews
            </a>
            <div className="mt-4 space-y-1.5 text-sm text-gray-400">
              <p>Est. {factory.established}</p>
              <p>{factory.employeeCount} Employees</p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-3">
              {factory.certifications.slice(0, 3).map((c) => (
                <Badge
                  key={c}
                  variant="outline"
                  className="border-white/20 text-gray-400 text-xs"
                >
                  {c}
                </Badge>
              ))}
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-green-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>Avg {factory.avgResponseTime}</span>
            </div>
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
                isFollowing
                  ? "bg-green-600/20 border-green-500/50 text-green-400 hover:bg-green-600/30"
                  : "border-white/20 text-gray-300 hover:bg-white/10"
              )}
              onClick={() => setIsFollowing(!isFollowing)}
            >
              {isFollowing ? (
                <><Check className="w-4 h-4 mr-2" />Following</>
              ) : (
                "Follow"
              )}
            </Button>
          </div>
        </div>

        {/* Center Column (60%) */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          {/* About Us */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-white">About Us</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{factory.description}</p>
          </div>

          {/* Main Products */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Main Products</h3>

            {/* Tab Filter */}
            <div className="flex gap-1 mb-5 border-b border-white/10 pb-0">
              {PRODUCT_TABS.map((tab) => (
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
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setLocation(`/product/${product.id}`)}
                  className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/50 transition-all group text-left"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-800">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">
                      {product.name}
                    </p>
                    <p className="text-purple-400 text-sm font-semibold mt-0.5">
                      {product.priceRange}
                    </p>
                    <p className="text-xs text-purple-400/70 mt-0.5 hover:underline">
                      View Details
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Production Capacity */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-white">Production Capacity</h3>
            <div className="grid grid-cols-3 gap-3">
              {factory.productionCapacity.map((cap) => (
                <div
                  key={cap.label}
                  className="flex items-center justify-center gap-2 py-3 px-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 text-center"
                >
                  <span>{cap.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (20%) */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          {/* Contact Card */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-purple-900/20 border border-purple-500/20 mb-3">
                <img
                  src={factory.logo}
                  alt={factory.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="font-semibold text-white">{factory.name}</p>
              <p className="text-sm text-gray-400 mt-0.5">{factory.contact.city}</p>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <Phone className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Phone: <span className="text-white font-medium">{factory.contact.phone}</span></span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Mail className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Email: <span className="text-white font-medium truncate">{factory.contact.email}</span></span>
              </div>
            </div>
          </div>

          {/* Latest Webinars */}
          <div className="bg-[#141628] border border-white/10 rounded-2xl p-5">
            <h3 className="text-base font-semibold mb-4 text-white">Latest Webinar</h3>
            <div className="space-y-3">
              {factory.webinars.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setLocation(`/webinar/${w.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-500/30 transition-all group text-left"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative bg-gray-800">
                    <img
                      src={w.image}
                      alt={w.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors truncate">
                      {w.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{w.scheduledAt}</p>
                  </div>
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-purple-400 hover:text-purple-300 hover:bg-purple-600/10 text-xs"
              onClick={() => setLocation("/webinars")}
            >
              Browse All Webinars
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
