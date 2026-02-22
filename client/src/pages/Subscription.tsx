import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Check, Sparkles, Zap, Crown, Building2, MessageSquare, Eye,
  Video, Cpu, ArrowRight, Star, Shield, Globe, RefreshCw
} from "lucide-react";

type BillingCycle = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  icon: React.ReactNode;
  price: { monthly: number; yearly: number };
  description: string;
  color: string;
  badge?: string;
  features: string[];
  quotas: { label: string; value: string }[];
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    icon: <Zap className="w-5 h-5" />,
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for exploring RealSourcing",
    color: "border-white/20",
    features: [
      "Browse factory listings",
      "Watch public webinars",
      "5 inquiries per month",
      "Basic search filters",
      "Email support",
    ],
    quotas: [
      { label: "Inquiries", value: "5/mo" },
      { label: "Webinars", value: "3/mo" },
      { label: "AI Credits", value: "10/mo" },
      { label: "Meetings", value: "2/mo" },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    icon: <Star className="w-5 h-5" />,
    price: { monthly: 99, yearly: 79 },
    description: "For serious sourcing professionals",
    color: "border-purple-500",
    badge: "Most Popular",
    features: [
      "Everything in Starter",
      "Unlimited inquiries",
      "Priority factory matching",
      "AI sourcing assistant",
      "HD video meetings",
      "Advanced analytics",
      "AI Reel generation",
      "Priority support",
    ],
    quotas: [
      { label: "Inquiries", value: "Unlimited" },
      { label: "Webinars", value: "Unlimited" },
      { label: "AI Credits", value: "500/mo" },
      { label: "Meetings", value: "30/mo" },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: <Crown className="w-5 h-5" />,
    price: { monthly: 299, yearly: 239 },
    description: "For large teams and enterprises",
    color: "border-yellow-500/50",
    badge: "Best Value",
    features: [
      "Everything in Professional",
      "Team workspace (10 seats)",
      "Custom AI model training",
      "White-label reports",
      "Dedicated account manager",
      "Custom integrations (API)",
      "SLA guarantee",
      "24/7 phone support",
    ],
    quotas: [
      { label: "Inquiries", value: "Unlimited" },
      { label: "Webinars", value: "Unlimited" },
      { label: "AI Credits", value: "5,000/mo" },
      { label: "Meetings", value: "Unlimited" },
    ],
  },
];

const QUOTA_ITEMS = [
  { label: "Inquiries", used: 3, total: 5, icon: MessageSquare, color: "bg-purple-500" },
  { label: "Webinars", used: 2, total: 3, icon: Eye, color: "bg-blue-500" },
  { label: "AI Credits", used: 7, total: 10, icon: Cpu, color: "bg-green-500" },
  { label: "Meetings", used: 1, total: 2, icon: Video, color: "bg-yellow-500" },
];

export default function Subscription() {
  const [billing, setBilling] = useState<BillingCycle>("yearly");
  const [currentPlan] = useState("starter");
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;
    setIsUpgrading(planId);
    await new Promise((r) => setTimeout(r, 1500));
    setIsUpgrading(null);
    toast.success(`Upgraded to ${PLANS.find((p) => p.id === planId)?.name} plan!`);
  };

  const yearlyDiscount = 20;

  return (
    <div className="min-h-screen bg-transparent p-6 max-w-6xl mx-auto space-y-8" style={{background:"linear-gradient(160deg,#050310 0%,#080820 50%,#050310 100%)"}}>
      {/* 页面头部 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground">Unlock the full power of RealSourcing</p>
      </div>

      {/* 当前配额使用情况 */}
      <div className="bg-transparent/50 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold">Current Usage</h3>
            <p className="text-sm text-muted-foreground">
              You're on the <span className="text-white font-semibold capitalize">{currentPlan}</span> plan
              · Resets in <span className="text-purple-400 font-semibold">8 days</span>
            </p>
          </div>
          <Button variant="outline" size="sm" className="border-white/20 hover:bg-white/10 gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {QUOTA_ITEMS.map((quota) => {
            const pct = (quota.used / quota.total) * 100;
            const isLow = pct >= 80;
            return (
              <div key={quota.label} className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <quota.icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{quota.label}</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={cn("text-2xl font-bold", isLow ? "text-red-400" : "text-white")}>
                    {quota.used}
                  </span>
                  <span className="text-sm text-muted-foreground">/ {quota.total}</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", isLow ? "bg-red-500" : quota.color)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {isLow && (
                  <p className="text-[10px] text-red-400 mt-1.5">Running low — upgrade to continue</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 计费周期切换 */}
      <div className="flex justify-center">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-1.5">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all",
              billing === "monthly" ? "bg-white text-black" : "text-muted-foreground hover:text-white"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
              billing === "yearly" ? "bg-white text-black" : "text-muted-foreground hover:text-white"
            )}
          >
            Yearly
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full font-bold",
              billing === "yearly" ? "bg-green-500 text-white" : "bg-green-500/20 text-green-400"
            )}>
              -{yearlyDiscount}%
            </span>
          </button>
        </div>
      </div>

      {/* 套餐卡片 */}
      <div className="grid grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const price = billing === "yearly" ? plan.price.yearly : plan.price.monthly;
          const isCurrent = plan.id === currentPlan;
          const isPopular = plan.badge === "Most Popular";

          return (
            <div
              key={plan.id}
              className={cn(
                "relative bg-transparent/50 border-2 rounded-2xl p-6 flex flex-col transition-all hover:shadow-lg",
                plan.color,
                isPopular && "shadow-lg shadow-purple-600/20",
                isCurrent && "opacity-80"
              )}
            >
              {/* 徽章 */}
              {plan.badge && (
                <div className={cn(
                  "absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold",
                  isPopular ? "bg-purple-600 text-white" : "bg-yellow-500 text-black"
                )}>
                  {plan.badge}
                </div>
              )}

              {/* 套餐头部 */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  isPopular ? "bg-purple-600 text-white" : "bg-white/10 text-white"
                )}>
                  {plan.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
              </div>

              {/* 价格 */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold">
                    {price === 0 ? "Free" : `$${price}`}
                  </span>
                  {price > 0 && (
                    <span className="text-muted-foreground text-sm mb-1">/mo</span>
                  )}
                </div>
                {billing === "yearly" && price > 0 && (
                  <p className="text-xs text-green-400 mt-1">
                    Billed ${price * 12}/year · Save ${(plan.price.monthly - price) * 12}/year
                  </p>
                )}
              </div>

              {/* 配额 */}
              <div className="grid grid-cols-2 gap-2 mb-5 p-3 bg-white/5 rounded-xl">
                {plan.quotas.map((q) => (
                  <div key={q.label} className="text-center">
                    <div className="text-sm font-bold text-white">{q.value}</div>
                    <div className="text-[10px] text-muted-foreground">{q.label}</div>
                  </div>
                ))}
              </div>

              {/* 功能列表 */}
              <div className="flex-1 space-y-2 mb-6">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm">
                    <Check className={cn("w-4 h-4 flex-shrink-0", isPopular ? "text-purple-400" : "text-green-400")} />
                    <span className="text-white/80">{feature}</span>
                  </div>
                ))}
              </div>

              {/* 按钮 */}
              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || isUpgrading === plan.id}
                className={cn(
                  "w-full gap-2",
                  isCurrent
                    ? "bg-white/10 text-white/50 cursor-not-allowed"
                    : isPopular
                    ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-600/30"
                    : "bg-white/10 hover:bg-white/20 text-white"
                )}
              >
                {isUpgrading === plan.id ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
                ) : isCurrent ? (
                  <><Check className="w-4 h-4" />Current Plan</>
                ) : (
                  <>Upgrade to {plan.name}<ArrowRight className="w-4 h-4" /></>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* 底部保障 */}
      <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground py-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-400" />
          <span>30-day money-back guarantee</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <span>Cancel anytime</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Instant activation</span>
        </div>
      </div>
    </div>
  );
}
