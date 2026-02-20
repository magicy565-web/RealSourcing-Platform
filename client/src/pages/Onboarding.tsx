import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Building2, Check, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Consumer Electronics", "Textiles", "Toys", "Home & Garden",
  "Sports & Outdoors", "Health & Beauty", "Automotive", "Industrial",
  "Food & Beverage", "Furniture", "Packaging", "Machinery",
];

const ORDER_SCALES = [
  { value: "small", label: "Small", sub: "< 1,000 units", icon: "📦" },
  { value: "medium", label: "Medium", sub: "1,000 – 10,000 units", icon: "🏗️" },
  { value: "large", label: "Large", sub: "> 10,000 units", icon: "🏭" },
];

const TARGET_MARKETS = [
  "North America", "Europe", "Asia Pacific", "Middle East",
  "Latin America", "Africa", "Southeast Asia", "Australia",
];

const CERTIFICATIONS = [
  "CE", "ISO 9001", "FCC", "RoHS", "OEKO-TEX", "GOTS",
  "BSCI", "FDA", "UL", "GMP", "REACH", "SA8000",
];

const STEPS = [
  { id: 1, label: "Basic Info", icon: "👤" },
  { id: 2, label: "Preferences", icon: "🎯" },
  { id: 3, label: "Finish", icon: "🎉" },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [orderScale, setOrderScale] = useState<string>("");
  const [targetMarkets, setTargetMarkets] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);

  const utils = trpc.useUtils();

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const handleNext = () => {
    if (step === 1 && categories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }
    if (step === 2 && !orderScale) {
      toast.error("Please select your order scale");
      return;
    }
    setStep((s) => s + 1);
  };

  const handleComplete = async () => {
    await utils.auth.me.invalidate();
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold">RealSourcing</span>
        </div>

        {/* 步骤指示器 */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                    step > s.id
                      ? "bg-green-500 text-white"
                      : step === s.id
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40"
                      : "bg-white/10 text-muted-foreground"
                  )}
                >
                  {step > s.id ? <Check className="w-5 h-5" /> : s.id}
                </div>
                <span
                  className={cn(
                    "text-xs mt-1.5 font-medium",
                    step === s.id ? "text-purple-400" : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-24 h-0.5 mx-2 mb-5 transition-all duration-300",
                    step > s.id ? "bg-green-500" : "bg-white/10"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* 进度条 */}
        <div className="w-full h-1.5 bg-white/10 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
            style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {/* 卡片 */}
        <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Step 1: 分类选择 */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">What are you sourcing?</h2>
                <p className="text-muted-foreground">Select the product categories you're interested in</p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggle(categories, setCategories, cat)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150",
                      categories.includes(cat)
                        ? "bg-purple-600/20 border-purple-500 text-purple-300 shadow-sm shadow-purple-600/20"
                        : "border-white/15 text-muted-foreground hover:border-purple-500/50 hover:text-white"
                    )}
                  >
                    {categories.includes(cat) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                    {cat}
                  </button>
                ))}
              </div>
              {categories.length > 0 && (
                <p className="text-sm text-purple-400 mt-4">{categories.length} categories selected</p>
              )}
            </div>
          )}

          {/* Step 2: 采购偏好 */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-2">Tell us your sourcing needs</h2>
                <p className="text-muted-foreground">Help us personalize your experience</p>
              </div>

              {/* 订单规模 */}
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
                  1. Order Scale
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {ORDER_SCALES.map((scale) => (
                    <button
                      key={scale.value}
                      onClick={() => setOrderScale(scale.value)}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all duration-200",
                        orderScale === scale.value
                          ? "bg-purple-600/20 border-purple-500 shadow-sm shadow-purple-600/20"
                          : "border-white/15 hover:border-purple-500/50"
                      )}
                    >
                      <div className="text-2xl mb-2">{scale.icon}</div>
                      <div className="font-semibold text-sm">{scale.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{scale.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 目标市场 */}
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
                  2. Target Market
                </h3>
                <div className="flex flex-wrap gap-2">
                  {TARGET_MARKETS.map((market) => (
                    <button
                      key={market}
                      onClick={() => toggle(targetMarkets, setTargetMarkets, market)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
                        targetMarkets.includes(market)
                          ? "bg-purple-600/20 border-purple-500 text-purple-300"
                          : "border-white/15 text-muted-foreground hover:border-purple-500/50 hover:text-white"
                      )}
                    >
                      {targetMarkets.includes(market) && <Check className="w-3 h-3 inline mr-1" />}
                      {market}
                    </button>
                  ))}
                </div>
              </div>

              {/* 认证要求 */}
              <div>
                <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
                  3. Required Certifications
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CERTIFICATIONS.map((cert) => (
                    <button
                      key={cert}
                      onClick={() => toggle(certifications, setCertifications, cert)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150",
                        certifications.includes(cert)
                          ? "bg-blue-600/20 border-blue-500 text-blue-300"
                          : "border-white/15 text-muted-foreground hover:border-blue-500/50 hover:text-white"
                      )}
                    >
                      {certifications.includes(cert) && <Check className="w-3 h-3 inline mr-1" />}
                      {cert}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: 完成 */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-600/30">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-3">You're all set! 🎉</h2>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Your profile is ready. We've personalized your dashboard based on your preferences.
                Start exploring factories and webinars now!
              </p>

              {/* 偏好摘要 */}
              <div className="bg-white/5 rounded-xl p-5 text-left mb-8 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 font-semibold text-sm w-28 flex-shrink-0">Categories:</span>
                  <span className="text-sm text-muted-foreground">
                    {categories.length > 0 ? categories.slice(0, 3).join(", ") + (categories.length > 3 ? ` +${categories.length - 3}` : "") : "Not specified"}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 font-semibold text-sm w-28 flex-shrink-0">Order Scale:</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {ORDER_SCALES.find((s) => s.value === orderScale)?.label || "Not specified"}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 font-semibold text-sm w-28 flex-shrink-0">Markets:</span>
                  <span className="text-sm text-muted-foreground">
                    {targetMarkets.length > 0 ? targetMarkets.slice(0, 3).join(", ") : "Not specified"}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleComplete}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-600/30"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Explore RealSourcing
              </Button>
            </div>
          )}

          {/* 导航按钮 */}
          {step < 3 && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => step > 1 ? setStep(s => s - 1) : setLocation("/register")}
                className="text-muted-foreground hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {step === 1 ? "Back to Register" : "Back"}
              </Button>
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 px-8"
              >
                {step === 2 ? "Finish Setup" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* 跳过 */}
        {step < 3 && (
          <div className="text-center mt-4">
            <button
              onClick={() => setLocation("/dashboard")}
              className="text-sm text-muted-foreground hover:text-white transition-colors"
            >
              Skip for now →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
