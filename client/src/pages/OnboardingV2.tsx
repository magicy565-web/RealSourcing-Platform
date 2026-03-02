import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

// ─── 步骤定义 ─────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, key: "ambition",   label: "Your Goal",       icon: "solar:target-bold-duotone" },
  { id: 2, key: "stage",      label: "Your Stage",      icon: "solar:chart-2-bold-duotone" },
  { id: 3, key: "platform",   label: "Sales Platform",  icon: "solar:shop-bold-duotone" },
  { id: 4, key: "budget",     label: "Budget",          icon: "solar:wallet-money-bold-duotone" },
  { id: 5, key: "niches",     label: "Product Niche",   icon: "solar:tag-bold-duotone" },
  { id: 6, key: "challenge",  label: "Main Challenge",  icon: "solar:shield-warning-bold-duotone" },
  { id: 7, key: "complete",   label: "Profile Ready",   icon: "solar:verified-check-bold-duotone" },
];

// ─── 选项数据 ─────────────────────────────────────────────────────────────────
const AMBITION_OPTIONS = [
  {
    value: "side_income",
    label: "Earn Side Income",
    sublabel: "$500–$2,000 / month alongside my job",
    icon: "solar:money-bag-bold-duotone",
    color: "from-emerald-600/20 to-emerald-500/10 border-emerald-500/40",
    activeColor: "from-emerald-600/40 to-emerald-500/20 border-emerald-400",
  },
  {
    value: "full_time",
    label: "Go Full-Time",
    sublabel: "$5,000–$20,000 / month as my primary income",
    icon: "solar:rocket-bold-duotone",
    color: "from-purple-600/20 to-purple-500/10 border-purple-500/40",
    activeColor: "from-purple-600/40 to-purple-500/20 border-purple-400",
  },
  {
    value: "dtc_brand",
    label: "Build a DTC Brand",
    sublabel: "Create a long-term brand with loyal customers",
    icon: "solar:crown-bold-duotone",
    color: "from-amber-600/20 to-amber-500/10 border-amber-500/40",
    activeColor: "from-amber-600/40 to-amber-500/20 border-amber-400",
  },
  {
    value: "learn",
    label: "Explore & Learn",
    sublabel: "Understand how Dropshipping works first",
    icon: "solar:book-2-bold-duotone",
    color: "from-blue-600/20 to-blue-500/10 border-blue-500/40",
    activeColor: "from-blue-600/40 to-blue-500/20 border-blue-400",
  },
];

const STAGE_OPTIONS = [
  {
    value: "newbie",
    label: "Complete Beginner",
    sublabel: "Never sold anything online before",
    icon: "solar:seedling-bold-duotone",
  },
  {
    value: "has_idea",
    label: "Have an Idea",
    sublabel: "Know what I want to sell, no store yet",
    icon: "solar:lightbulb-bold-duotone",
  },
  {
    value: "has_store",
    label: "Have a Store",
    sublabel: "Store is live, need better products or suppliers",
    icon: "solar:shop-2-bold-duotone",
  },
  {
    value: "already_selling",
    label: "Already Selling",
    sublabel: "Generating revenue, want to scale up",
    icon: "solar:graph-up-bold-duotone",
  },
];

const PLATFORM_OPTIONS = [
  { value: "shopify",  label: "Shopify",          icon: "logos:shopify" },
  { value: "tiktok",   label: "TikTok Shop",       icon: "logos:tiktok-icon" },
  { value: "amazon",   label: "Amazon",            icon: "logos:amazon" },
  { value: "etsy",     label: "Etsy",              icon: "simple-icons:etsy" },
  { value: "woocommerce", label: "WooCommerce",    icon: "logos:woocommerce" },
  { value: "not_sure", label: "Not Decided Yet",   icon: "solar:question-circle-bold-duotone" },
];

const BUDGET_OPTIONS = [
  {
    value: "under_500",
    label: "Under $500",
    sublabel: "Starting lean, testing the waters",
    icon: "solar:dollar-minimalistic-bold-duotone",
  },
  {
    value: "500_2000",
    label: "$500 – $2,000",
    sublabel: "Serious starter budget",
    icon: "solar:dollar-minimalistic-bold-duotone",
  },
  {
    value: "2000_10000",
    label: "$2,000 – $10,000",
    sublabel: "Ready to invest and scale",
    icon: "solar:dollar-minimalistic-bold-duotone",
  },
  {
    value: "over_10000",
    label: "$10,000+",
    sublabel: "Professional-level investment",
    icon: "solar:dollar-minimalistic-bold-duotone",
  },
];

const NICHE_OPTIONS = [
  { value: "home_goods",       label: "Home & Living",       icon: "solar:home-bold-duotone" },
  { value: "beauty",           label: "Beauty & Skincare",   icon: "solar:star-shine-bold-duotone" },
  { value: "pet_supplies",     label: "Pet Supplies",        icon: "solar:cat-bold-duotone" },
  { value: "sports_fitness",   label: "Sports & Fitness",    icon: "solar:running-bold-duotone" },
  { value: "baby_kids",        label: "Baby & Kids",         icon: "solar:baby-bold-duotone" },
  { value: "gadgets",          label: "Gadgets & Tech",      icon: "solar:cpu-bold-duotone" },
  { value: "fashion",          label: "Apparel & Fashion",   icon: "solar:t-shirt-bold-duotone" },
  { value: "outdoor",          label: "Outdoor & Garden",    icon: "solar:tree-bold-duotone" },
  { value: "kitchen",          label: "Kitchen & Dining",    icon: "solar:chef-hat-bold-duotone" },
  { value: "health_wellness",  label: "Health & Wellness",   icon: "solar:heart-pulse-bold-duotone" },
  { value: "toys_games",       label: "Toys & Games",        icon: "solar:gamepad-bold-duotone" },
  { value: "automotive",       label: "Automotive",          icon: "solar:car-bold-duotone" },
];

const CHALLENGE_OPTIONS = [
  {
    value: "finding_products",
    label: "Finding Winning Products",
    sublabel: "Don't know what will actually sell",
    icon: "solar:magnifer-bold-duotone",
  },
  {
    value: "finding_suppliers",
    label: "Finding Reliable Suppliers",
    sublabel: "Worried about quality, scams, or long shipping",
    icon: "solar:factory-bold-duotone",
  },
  {
    value: "marketing",
    label: "Marketing & Getting Traffic",
    sublabel: "Don't know how to run ads or get customers",
    icon: "solar:megaphone-bold-duotone",
  },
  {
    value: "operations",
    label: "Managing Operations",
    sublabel: "Orders, returns, customer service feels overwhelming",
    icon: "solar:settings-bold-duotone",
  },
  {
    value: "capital",
    label: "Limited Budget / Capital",
    sublabel: "Not sure if I can afford to start",
    icon: "solar:wallet-bold-duotone",
  },
  {
    value: "knowledge",
    label: "Lack of Knowledge",
    sublabel: "Don't know where to start or what to learn first",
    icon: "solar:book-bold-duotone",
  },
];

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export default function OnboardingV2() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  // 表单状态
  const [ambition, setAmbition] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [budget, setBudget] = useState<string>("");
  const [niches, setNiches] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<string>("");

  const utils = trpc.useUtils();

  // tRPC mutations
  const saveProfileMutation = trpc.businessProfile.saveOnboarding.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
    onError: (err) => {
      console.error("Failed to save profile:", err);
    },
  });

  const completeOnboardingMutation = trpc.onboarding.complete.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });

  const totalSteps = STEPS.length - 1; // 不含完成页

  const canProceed = () => {
    switch (step) {
      case 1: return ambition !== "";
      case 2: return stage !== "";
      case 3: return platforms.length > 0;
      case 4: return budget !== "";
      case 5: return niches.length >= 1;
      case 6: return challenge !== "";
      default: return true;
    }
  };

  const handleNext = async () => {
    if (!canProceed()) {
      toast.error("Please make a selection to continue");
      return;
    }
    if (step === 6) {
      // 最后一步：保存数据并跳转到完成页
      try {
        await saveProfileMutation.mutateAsync({
          ambition,
          businessStage: stage,
          targetPlatforms: platforms,
          budget,
          interestedNiches: niches,
          mainChallenge: challenge,
        });
        await completeOnboardingMutation.mutateAsync();
        setStep(7);
      } catch {
        toast.error("Failed to save your profile. Please try again.");
      }
      return;
    }
    setIsAnimating(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setIsAnimating(false);
    }, 100);
  };

  const handleBack = () => {
    if (step > 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep((s) => s - 1);
        setIsAnimating(false);
      }, 100);
    }
  };

  const handleComplete = () => {
    setLocation("/dashboard");
  };

  const toggleNiche = (val: string) => {
    setNiches((prev) =>
      prev.includes(val) ? prev.filter((n) => n !== val) : [...prev, val]
    );
  };

  const togglePlatform = (val: string) => {
    setPlatforms((prev) =>
      prev.includes(val) ? prev.filter((p) => p !== val) : [...prev, val]
    );
  };

  const progressPct = ((step - 1) / totalSteps) * 100;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)" }}
    >
      {/* 背景光晕 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)" }} />
      </div>

      {/* 顶部 Logo + 进度 */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Icon icon="solar:buildings-bold-duotone" className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">RealSourcing</span>
        </div>
        {step < 7 && (
          <div className="flex items-center gap-3 text-sm text-white/40">
            <span>Step {step} of {totalSteps}</span>
            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* ── Step 1: 目标 ── */}
              {step === 1 && (
                <StepWrapper
                  icon="solar:target-bold-duotone"
                  title="What's your goal with Dropshipping?"
                  subtitle="This shapes your entire journey on RealSourcing. Be honest — there's no wrong answer."
                >
                  <div className="grid grid-cols-1 gap-3">
                    {AMBITION_OPTIONS.map((opt) => (
                      <OptionCard
                        key={opt.value}
                        selected={ambition === opt.value}
                        onClick={() => setAmbition(opt.value)}
                        icon={opt.icon}
                        label={opt.label}
                        sublabel={opt.sublabel}
                        colorClass={opt.color}
                        activeColorClass={opt.activeColor}
                      />
                    ))}
                  </div>
                </StepWrapper>
              )}

              {/* ── Step 2: 阶段 ── */}
              {step === 2 && (
                <StepWrapper
                  icon="solar:chart-2-bold-duotone"
                  title="Where are you right now?"
                  subtitle="Your current stage determines your starting point on the roadmap."
                >
                  <div className="grid grid-cols-1 gap-3">
                    {STAGE_OPTIONS.map((opt) => (
                      <OptionCard
                        key={opt.value}
                        selected={stage === opt.value}
                        onClick={() => setStage(opt.value)}
                        icon={opt.icon}
                        label={opt.label}
                        sublabel={opt.sublabel}
                      />
                    ))}
                  </div>
                </StepWrapper>
              )}

              {/* ── Step 3: 平台 ── */}
              {step === 3 && (
                <StepWrapper
                  icon="solar:shop-bold-duotone"
                  title="Where do you plan to sell?"
                  subtitle="Select all that apply. This helps us tailor supplier and product recommendations."
                >
                  <div className="grid grid-cols-3 gap-3">
                    {PLATFORM_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => togglePlatform(opt.value)}
                        className={cn(
                          "flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all duration-200",
                          platforms.includes(opt.value)
                            ? "bg-purple-600/20 border-purple-400 text-white"
                            : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/25 hover:text-white/80"
                        )}
                      >
                        <Icon icon={opt.icon} className="w-8 h-8" />
                        <span className="text-sm font-medium text-center leading-tight">{opt.label}</span>
                        {platforms.includes(opt.value) && (
                          <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                            <Icon icon="solar:check-read-bold" className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </StepWrapper>
              )}

              {/* ── Step 4: 预算 ── */}
              {step === 4 && (
                <StepWrapper
                  icon="solar:wallet-money-bold-duotone"
                  title="What's your starting budget?"
                  subtitle="Be realistic. Your AI Coach will build a strategy that fits your actual resources."
                >
                  <div className="grid grid-cols-1 gap-3">
                    {BUDGET_OPTIONS.map((opt) => (
                      <OptionCard
                        key={opt.value}
                        selected={budget === opt.value}
                        onClick={() => setBudget(opt.value)}
                        icon={opt.icon}
                        label={opt.label}
                        sublabel={opt.sublabel}
                      />
                    ))}
                  </div>
                </StepWrapper>
              )}

              {/* ── Step 5: 品类 ── */}
              {step === 5 && (
                <StepWrapper
                  icon="solar:tag-bold-duotone"
                  title="Which product niches interest you?"
                  subtitle="Select 1–3 niches. Focus beats breadth, especially when starting out."
                >
                  <div className="grid grid-cols-3 gap-2.5">
                    {NICHE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => toggleNiche(opt.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3.5 rounded-xl border transition-all duration-200 text-center",
                          niches.includes(opt.value)
                            ? "bg-purple-600/20 border-purple-400 text-white"
                            : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/25 hover:text-white/80"
                        )}
                      >
                        <Icon icon={opt.icon} className="w-6 h-6" />
                        <span className="text-xs font-medium leading-tight">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                  {niches.length > 0 && (
                    <p className="text-xs text-purple-400 mt-3 text-center">
                      {niches.length} selected — {niches.length > 3 ? "Consider focusing on fewer niches for better results" : "Great choice!"}
                    </p>
                  )}
                </StepWrapper>
              )}

              {/* ── Step 6: 挑战 ── */}
              {step === 6 && (
                <StepWrapper
                  icon="solar:shield-warning-bold-duotone"
                  title="What's your biggest challenge right now?"
                  subtitle="Your AI Coach will address this first. Honesty leads to better guidance."
                >
                  <div className="grid grid-cols-1 gap-3">
                    {CHALLENGE_OPTIONS.map((opt) => (
                      <OptionCard
                        key={opt.value}
                        selected={challenge === opt.value}
                        onClick={() => setChallenge(opt.value)}
                        icon={opt.icon}
                        label={opt.label}
                        sublabel={opt.sublabel}
                      />
                    ))}
                  </div>
                </StepWrapper>
              )}

              {/* ── Step 7: 完成 ── */}
              {step === 7 && (
                <CompletionScreen
                  ambition={ambition}
                  stage={stage}
                  niches={niches}
                  challenge={challenge}
                  onComplete={handleComplete}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* 导航按钮 */}
          {step < 7 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between mt-8"
            >
              <button
                onClick={handleBack}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                  step === 1
                    ? "text-white/20 cursor-not-allowed"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                )}
                disabled={step === 1}
              >
                <Icon icon="solar:arrow-left-bold" className="w-4 h-4" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={!canProceed() || saveProfileMutation.isPending}
                className={cn(
                  "flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                  canProceed()
                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30"
                    : "bg-white/5 text-white/25 cursor-not-allowed"
                )}
              >
                {saveProfileMutation.isPending ? (
                  <>
                    <Icon icon="solar:refresh-bold" className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : step === 6 ? (
                  <>
                    Build My Profile
                    <Icon icon="solar:magic-stick-2-bold-duotone" className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* 跳过 */}
          {step < 7 && (
            <div className="text-center mt-4">
              <button
                onClick={() => setLocation("/dashboard")}
                className="text-xs text-white/20 hover:text-white/40 transition-colors"
              >
                Skip for now — I'll complete this later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 子组件：步骤容器 ─────────────────────────────────────────────────────────
function StepWrapper({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <Icon icon={icon} className="w-5 h-5 text-purple-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 leading-tight">{title}</h1>
        <p className="text-white/45 text-sm leading-relaxed">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

// ─── 子组件：选项卡片 ─────────────────────────────────────────────────────────
function OptionCard({
  selected,
  onClick,
  icon,
  label,
  sublabel,
  colorClass,
  activeColorClass,
}: {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  sublabel?: string;
  colorClass?: string;
  activeColorClass?: string;
}) {
  const defaultColor = "from-white/[0.03] to-white/[0.01] border-white/10";
  const defaultActive = "from-purple-600/20 to-purple-500/10 border-purple-400";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-r transition-all duration-200 text-left",
        selected
          ? (activeColorClass || defaultActive)
          : (colorClass || defaultColor) + " hover:border-white/20"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
        selected ? "bg-purple-600/30" : "bg-white/5"
      )}>
        <Icon icon={icon} className={cn("w-5 h-5", selected ? "text-purple-300" : "text-white/40")} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("font-semibold text-sm", selected ? "text-white" : "text-white/70")}>
          {label}
        </div>
        {sublabel && (
          <div className={cn("text-xs mt-0.5", selected ? "text-white/50" : "text-white/30")}>
            {sublabel}
          </div>
        )}
      </div>
      <div className={cn(
        "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
        selected ? "border-purple-400 bg-purple-500" : "border-white/20"
      )}>
        {selected && <Icon icon="solar:check-read-bold" className="w-3 h-3 text-white" />}
      </div>
    </button>
  );
}

// ─── 子组件：完成屏幕 ─────────────────────────────────────────────────────────
function CompletionScreen({
  ambition,
  stage,
  niches,
  challenge,
  onComplete,
}: {
  ambition: string;
  stage: string;
  niches: string[];
  challenge: string;
  onComplete: () => void;
}) {
  const ambitionLabel = AMBITION_OPTIONS.find((o) => o.value === ambition)?.label || ambition;
  const stageLabel = STAGE_OPTIONS.find((o) => o.value === stage)?.label || stage;
  const challengeLabel = CHALLENGE_OPTIONS.find((o) => o.value === challenge)?.label || challenge;
  const nicheLabels = niches.map((n) => NICHE_OPTIONS.find((o) => o.value === n)?.label || n);

  return (
    <div className="text-center">
      {/* 成功动画图标 */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-2xl shadow-purple-600/40"
      >
        <Icon icon="solar:verified-check-bold-duotone" className="w-10 h-10 text-white" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-3xl font-bold text-white mb-2">Your Profile is Ready</h1>
        <p className="text-white/45 text-sm mb-8 max-w-md mx-auto">
          Your AI Coach has been briefed. Every recommendation from here on is tailored specifically to your goals and situation.
        </p>
      </motion.div>

      {/* 画像摘要卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white/[0.04] border border-white/10 rounded-2xl p-6 text-left mb-8 space-y-4"
      >
        <h3 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Your Business Profile</h3>
        <ProfileRow icon="solar:target-bold-duotone" label="Goal" value={ambitionLabel} />
        <ProfileRow icon="solar:chart-2-bold-duotone" label="Current Stage" value={stageLabel} />
        <ProfileRow
          icon="solar:tag-bold-duotone"
          label="Niches"
          value={nicheLabels.length > 0 ? nicheLabels.join(", ") : "Not specified"}
        />
        <ProfileRow icon="solar:shield-warning-bold-duotone" label="Main Challenge" value={challengeLabel} />
      </motion.div>

      {/* AI Coach 预告 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-purple-600/10 border border-purple-500/20 rounded-xl p-4 text-left mb-8"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Icon icon="solar:magic-stick-2-bold-duotone" className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-300 mb-1">Your AI Coach is ready</p>
            <p className="text-xs text-white/40 leading-relaxed">
              Based on your profile, your first recommended action has been added to your dashboard. Your AI Coach knows your goals and will guide you step by step.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={onComplete}
        className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
      >
        <Icon icon="solar:rocket-bold-duotone" className="w-4 h-4" />
        Go to My Dashboard
      </motion.button>
    </div>
  );
}

function ProfileRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon icon={icon} className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 flex items-start justify-between gap-4">
        <span className="text-xs text-white/30 font-medium w-28 flex-shrink-0">{label}</span>
        <span className="text-xs text-white/70 text-right">{value}</span>
      </div>
    </div>
  );
}
