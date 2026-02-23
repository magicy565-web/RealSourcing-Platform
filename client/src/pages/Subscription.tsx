import { useState } from "react";
import type React from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Icon as SolarIcon } from "@iconify/react";
import { BorderBeam } from "@/components/magicui/border-beam";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BlurFade } from "@/components/magicui/blur-fade";

// Solar Icons 封装
const SIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => (
  <SolarIcon icon={`solar:${name}`} className={className} style={style} />
);
const Check = (p: any) => <SIcon name="check-circle-bold-duotone" {...p} />;
const Sparkles = (p: any) => <SIcon name="magic-stick-2-bold-duotone" {...p} />;
const Zap = (p: any) => <SIcon name="bolt-bold-duotone" {...p} />;
const Crown = (p: any) => <SIcon name="crown-bold-duotone" {...p} />;
const Building2 = (p: any) => <SIcon name="buildings-2-bold-duotone" {...p} />;
const MessageSquare = (p: any) => <SIcon name="chat-round-dots-bold-duotone" {...p} />;
const Eye = (p: any) => <SIcon name="eye-bold-duotone" {...p} />;
const Video = (p: any) => <SIcon name="videocamera-bold-duotone" {...p} />;
const Cpu = (p: any) => <SIcon name="cpu-bolt-bold-duotone" {...p} />;
const ArrowRight = (p: any) => <SIcon name="arrow-right-bold-duotone" {...p} />;
const Star = (p: any) => <SIcon name="star-bold-duotone" {...p} />;
const Shield = (p: any) => <SIcon name="shield-check-bold-duotone" {...p} />;
const Globe = (p: any) => <SIcon name="globe-bold-duotone" {...p} />;
const RefreshCw = (p: any) => <SIcon name="refresh-circle-bold-duotone" {...p} />;

type BillingCycle = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  icon: React.ReactNode;
  price: { monthly: number; yearly: number };
  description: string;
  accentColor: string;
  badge?: string;
  features: string[];
  quotas: { label: string; value: string; numericValue?: number }[];
}

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    icon: <Zap className="w-5 h-5" />,
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for exploring RealSourcing",
    accentColor: "rgba(255,255,255,0.25)",
    features: [
      "Browse factory listings",
      "Watch public webinars",
      "5 inquiries per month",
      "Basic search filters",
      "Email support",
    ],
    quotas: [
      { label: "Inquiries", value: "5/mo", numericValue: 5 },
      { label: "Webinars", value: "3/mo", numericValue: 3 },
      { label: "AI Credits", value: "10/mo", numericValue: 10 },
      { label: "Meetings", value: "2/mo", numericValue: 2 },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    icon: <Star className="w-5 h-5" />,
    price: { monthly: 99, yearly: 79 },
    description: "For serious sourcing professionals",
    accentColor: "#7c3aed",
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
      { label: "AI Credits", value: "500/mo", numericValue: 500 },
      { label: "Meetings", value: "30/mo", numericValue: 30 },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: <Crown className="w-5 h-5" />,
    price: { monthly: 299, yearly: 239 },
    description: "For large teams and enterprises",
    accentColor: "#eab308",
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
      { label: "AI Credits", value: "5,000/mo", numericValue: 5000 },
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
    <div className="min-h-screen" style={{ background: "#09090b" }}>
      {/* 背景光晕 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse, #7c3aed 0%, transparent 70%)" }} />
      </div>

      <div className="relative z-10 p-6 max-w-6xl mx-auto space-y-7">
        {/* 页面头部 */}
        <BlurFade delay={0.05} inView>
          <div className="text-center pt-4">
            <h1 className="text-heading-1 mb-2">Choose Your Plan</h1>
            <p className="text-body">Unlock the full power of RealSourcing</p>
          </div>
        </BlurFade>

        {/* 当前配额使用情况 */}
        <BlurFade delay={0.10} inView>
          <div className="relative rounded-2xl p-6 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <BorderBeam size={120} duration={10} colorFrom="#7c3aed" colorTo="#a78bfa40" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-card-title mb-0.5">Current Usage</h3>
                <p className="text-card-desc">
                  You're on the <span className="text-primary font-semibold capitalize">{currentPlan}</span> plan
                  · Resets in <span style={{ color: "#a78bfa" }} className="font-semibold">8 days</span>
                </p>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-caption transition-all hover:text-primary"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {QUOTA_ITEMS.map((quota, idx) => {
                const pct = (quota.used / quota.total) * 100;
                const isLow = pct >= 80;
                return (
                  <BlurFade key={quota.label} delay={0.12 + idx * 0.04} inView>
                    <div className="rounded-xl p-4"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <quota.icon className="w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
                        <span className="text-card-desc font-medium">{quota.label}</span>
                      </div>
                      <div className="flex items-end justify-between mb-2">
                        <span className={cn("text-stat-number text-numeric", isLow ? "text-red-400" : "text-primary")}>
                          <NumberTicker value={quota.used} className={cn("text-stat-number text-numeric", isLow ? "text-red-400" : "")} />
                        </span>
                        <span className="text-caption">/ {quota.total}</span>
                      </div>
                      <div className="w-full h-1 rounded-full overflow-hidden"
                        style={{ background: "rgba(255,255,255,0.07)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: 0.3 + idx * 0.1, ease: "easeOut" }}
                          className={cn("h-full rounded-full", isLow ? "bg-red-500" : quota.color)}
                        />
                      </div>
                      {isLow && (
                        <p className="text-badge text-red-400 mt-1.5">Running low — upgrade to continue</p>
                      )}
                    </div>
                  </BlurFade>
                );
              })}
            </div>
          </div>
        </BlurFade>

        {/* 计费周期切换 */}
        <BlurFade delay={0.15} inView>
          <div className="flex justify-center">
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <button
                onClick={() => setBilling("monthly")}
                className={cn(
                  "px-5 py-2 rounded-lg text-btn font-semibold transition-all",
                  billing === "monthly" ? "bg-white text-black" : "text-secondary hover:text-primary"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={cn(
                  "px-5 py-2 rounded-lg text-btn font-semibold transition-all flex items-center gap-2",
                  billing === "yearly" ? "bg-white text-black" : "text-secondary hover:text-primary"
                )}
              >
                Yearly
                <span className={cn(
                  "text-badge px-1.5 py-0.5 rounded-full font-bold",
                  billing === "yearly" ? "bg-green-500 text-white" : "bg-green-500/20 text-green-400"
                )}>
                  -{yearlyDiscount}%
                </span>
              </button>
            </div>
          </div>
        </BlurFade>

        {/* 套餐卡片 */}
        <div className="grid grid-cols-3 gap-5">
          {PLANS.map((plan, idx) => {
            const price = billing === "yearly" ? plan.price.yearly : plan.price.monthly;
            const isCurrent = plan.id === currentPlan;
            const isPopular = plan.badge === "Most Popular";
            const isEnterprise = plan.badge === "Best Value";

            return (
              <BlurFade key={plan.id} delay={0.20 + idx * 0.07} inView>
                <div
                  className={cn(
                    "relative rounded-2xl p-6 flex flex-col overflow-hidden transition-all",
                    isPopular && "shadow-xl shadow-purple-600/15",
                    isCurrent && "opacity-70"
                  )}
                  style={{
                    background: isPopular
                      ? "linear-gradient(160deg, rgba(124,58,237,0.10) 0%, rgba(79,70,229,0.06) 100%)"
                      : "rgba(255,255,255,0.02)",
                    border: isPopular
                      ? "1px solid rgba(124,58,237,0.35)"
                      : isEnterprise
                      ? "1px solid rgba(234,179,8,0.25)"
                      : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {(isPopular || isEnterprise) && (
                    <BorderBeam
                      size={140}
                      duration={isPopular ? 7 : 9}
                      colorFrom={isPopular ? "#7c3aed" : "#eab308"}
                      colorTo={isPopular ? "#a78bfa40" : "#eab30840"}
                    />
                  )}

                  {/* 徽章 */}
                  {plan.badge && (
                    <div className={cn(
                      "absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-badge z-10",
                      isPopular ? "bg-purple-600 text-white" : "bg-yellow-500 text-black"
                    )}>
                      {plan.badge}
                    </div>
                  )}

                  {/* 套餐头部 */}
                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      isPopular ? "bg-purple-600 text-white" : "bg-white/8 text-white"
                    )}>
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="text-card-title">{plan.name}</h3>
                      <p className="text-card-desc">{plan.description}</p>
                    </div>
                  </div>

                  {/* 价格 */}
                  <div className="mb-5">
                    <div className="flex items-end gap-1">
                      <span className="text-stat-number text-numeric">
                        {price === 0 ? "Free" : (
                          <>$<NumberTicker value={price} className="text-stat-number text-numeric" /></>
                        )}
                      </span>
                      {price > 0 && (
                        <span className="text-caption mb-1">/mo</span>
                      )}
                    </div>
                    {billing === "yearly" && price > 0 && (
                      <p className="text-caption text-green-400 mt-1">
                        Billed ${price * 12}/year · Save ${(plan.price.monthly - price) * 12}/year
                      </p>
                    )}
                  </div>

                  {/* 配额 */}
                  <div className="grid grid-cols-2 gap-2 mb-5 p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)" }}>
                    {plan.quotas.map((q) => (
                      <div key={q.label} className="text-center">
                        <div className="text-card-title">
                          {q.numericValue ? (
                            <NumberTicker value={q.numericValue} className="text-card-title" />
                          ) : q.value}
                        </div>
                        <div className="text-card-desc">{q.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* 功能列表 */}
                  <div className="flex-1 space-y-2 mb-5">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <Check className={cn("w-4 h-4 flex-shrink-0", isPopular ? "text-violet-400" : "text-green-400")} />
                        <span className="text-body">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* 按钮 */}
                  {isPopular && !isCurrent ? (
                    <ShimmerButton
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isUpgrading === plan.id}
                      className="w-full justify-center text-btn font-semibold"
                      shimmerColor="#c4b5fd"
                      background="linear-gradient(135deg, #7c3aed, #4f46e5)"
                    >
                      {isUpgrading === plan.id ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Processing...</>
                      ) : (
                        <>Upgrade to {plan.name}<ArrowRight className="w-4 h-4 ml-2" /></>
                      )}
                    </ShimmerButton>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={isCurrent || isUpgrading === plan.id}
                      className={cn(
                        "w-full py-2.5 rounded-xl text-btn font-semibold flex items-center justify-center gap-2 transition-all",
                        isCurrent
                          ? "cursor-not-allowed text-muted"
                          : "hover:opacity-80"
                      )}
                      style={isCurrent ? {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.25)",
                      } : isEnterprise ? {
                        background: "linear-gradient(135deg, #d97706, #eab308)",
                        color: "#000",
                      } : {
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.10)",
                        color: "rgba(255,255,255,0.70)",
                      }}
                    >
                      {isUpgrading === plan.id ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
                      ) : isCurrent ? (
                        <><Check className="w-4 h-4" />Current Plan</>
                      ) : (
                        <>Upgrade to {plan.name}<ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              </BlurFade>
            );
          })}
        </div>

        {/* 底部保障 */}
        <BlurFade delay={0.40} inView>
          <div className="flex items-center justify-center gap-8 text-caption py-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Instant activation</span>
            </div>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}
