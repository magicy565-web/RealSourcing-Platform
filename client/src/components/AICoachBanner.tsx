import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { getPersonalizedFirstAction } from "@/lib/aiPersonalization";

// ─── 标签映射 ─────────────────────────────────────────────────────────────────
const AMBITION_LABELS: Record<string, string> = {
  side_income: "Earn Side Income",
  full_time: "Go Full-Time",
  dtc_brand: "Build a DTC Brand",
  learn: "Explore & Learn",
};
const STAGE_LABELS: Record<string, string> = {
  newbie: "Complete Beginner",
  has_idea: "Have an Idea",
  has_store: "Have a Store",
  already_selling: "Already Selling",
};
const CHALLENGE_LABELS: Record<string, string> = {
  finding_products: "Finding Winning Products",
  finding_suppliers: "Finding Reliable Suppliers",
  marketing: "Marketing & Traffic",
  operations: "Managing Operations",
  capital: "Limited Budget",
  knowledge: "Lack of Knowledge",
};

interface Task {
  id: string;
  title: string;
  description: string;
  action: string;
  actionLabel: string;
  icon: string;
  done: boolean;
}

// ─── 任务清单（基于用户阶段 + 真实数据）─────────────────────────────────────
function buildTasks(
  stage: string,
  niches: string[],
  realData: {
    hasInquiries: boolean;
    hasMeetings: boolean;
    hasSampleOrders: boolean;
    hasWebinarAttended: boolean;

  }
): Task[] {
  const nicheText = niches.length > 0 ? niches[0].replace(/_/g, " ") : "your niche";

  const taskMap: Record<string, Task[]> = {
    newbie: [
      {
        id: "t1",
        title: "Complete your business profile",
        description: "Tell us more about your goals",
        action: "/onboarding",
        actionLabel: "View Profile",
        icon: "solar:user-circle-bold-duotone",
        done: true, // always done if we have a profile
      },
      {
        id: "t2",
        title: "Attend your first Webinar",
        description: "Watch a live factory tour or product showcase",
        action: "/webinars",
        actionLabel: "View Webinars",
        icon: "solar:videocamera-bold-duotone",
        done: realData.hasWebinarAttended,
      },
      {
        id: "t3",
        title: "Browse the Factory Library",
        description: "Explore 500+ verified Chinese manufacturers",
        action: "/factories",
        actionLabel: "Browse Factories",
        icon: "solar:buildings-2-bold-duotone",
        done: realData.hasInquiries, // proxy: if they've sent an inquiry, they've browsed
      },
      {
        id: "t4",
        title: "Send your first inquiry",
        description: "Contact a supplier about a product you like",
        action: "/inquiries",
        actionLabel: "My Inquiries",
        icon: "solar:send-square-bold-duotone",
        done: realData.hasInquiries,
      },
    ],
    has_idea: [
      {
        id: "t1",
        title: "Complete your business profile",
        description: "Your profile is set up",
        action: "/settings",
        actionLabel: "Edit Profile",
        icon: "solar:user-circle-bold-duotone",
        done: true,
      },
      {
        id: "t2",
        title: `Find suppliers for ${nicheText}`,
        description: "Search factories matching your product idea",
        action: "/factories",
        actionLabel: "Search Factories",
        icon: "solar:magnifer-bold-duotone",
        done: realData.hasInquiries,
      },
      {
        id: "t3",
        title: "Request 3 supplier quotes",
        description: "Compare pricing and MOQ from multiple sources",
        action: "/inquiries",
        actionLabel: "My Inquiries",
        icon: "solar:document-text-bold-duotone",
        done: realData.hasInquiries,
      },
      {
        id: "t4",
        title: "Book a video call with a factory",
        description: "Verify the supplier face-to-face",
        action: "/meetings",
        actionLabel: "Book a Meeting",
        icon: "solar:calendar-bold-duotone",
        done: realData.hasMeetings,
      },
    ],
    has_store: [
      {
        id: "t1",
        title: "Complete your business profile",
        description: "Your profile is set up",
        action: "/settings",
        actionLabel: "Edit Profile",
        icon: "solar:user-circle-bold-duotone",
        done: true,
      },
      {
        id: "t2",
        title: "Request product samples",
        description: "Verify quality before listing products",
        action: "/sample-orders",
        actionLabel: "Sample Orders",
        icon: "solar:box-bold-duotone",
        done: realData.hasSampleOrders,
      },
      {
        id: "t3",
        title: "Compare suppliers with AI",
        description: "Use AI to analyze your options",
        action: "/ai-assistant",
        actionLabel: "Ask AI Coach",
        icon: "solar:magic-stick-2-bold-duotone",
        done: false,
      },
      {
        id: "t4",
        title: "Explore Opportunity Radar",
        description: "Find high-potential products for your store",
        action: "/opportunity-radar",
        actionLabel: "Open Radar",
        icon: "solar:radar-bold-duotone",
        done: false,
      },
    ],
    already_selling: [
      {
        id: "t1",
        title: "Complete your business profile",
        description: "Your profile is set up",
        action: "/settings",
        actionLabel: "Edit Profile",
        icon: "solar:user-circle-bold-duotone",
        done: true,
      },
      {
        id: "t2",
        title: "Audit your current suppliers",
        description: "Are there better options available?",
        action: "/factories",
        actionLabel: "Browse Factories",
        icon: "solar:chart-2-bold-duotone",
        done: realData.hasInquiries,
      },
      {
        id: "t3",
        title: "Analyze your profit margins",
        description: "Use the Dropshipping Profit Analyzer",
        action: "/profit-analyzer",
        actionLabel: "Open Analyzer",
        icon: "solar:graph-up-bold-duotone",
        done: false,
      },
      {
        id: "t4",
        title: "Explore Opportunity Radar",
        description: "Find high-potential products for your store",
        action: "/opportunity-radar",
        actionLabel: "Open Radar",
        icon: "solar:radar-bold-duotone",
        done: false,
      },
    ],
  };

  return taskMap[stage] || taskMap.newbie;
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export default function AICoachBanner() {
  const [, setLocation] = useLocation();
  const [expanded, setExpanded] = useState(true);

  const { data: profile, isLoading } = trpc.businessProfile.get.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  // 真实数据查询（用于任务完成状态）
  const { data: inquiries = [] } = trpc.inquiries.myInquiries.useQuery(undefined, {
    enabled: !!profile,
    staleTime: 2 * 60 * 1000,
  });
  const { data: meetings = [] } = trpc.meetings.myMeetings.useQuery(undefined, {
    enabled: !!profile,
    staleTime: 2 * 60 * 1000,
  });
  const { data: sampleOrders = [] } = trpc.sampleOrders.mySampleOrders.useQuery(undefined, {
    enabled: !!profile,
    staleTime: 2 * 60 * 1000,
  });

  const { data: webinars = [] } = trpc.webinars.list.useQuery(undefined, {
    enabled: !!profile,
    staleTime: 5 * 60 * 1000,
  });

  // 如果没有画像数据，显示引导完善画像的提示
  if (isLoading) return null;

  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 rounded-2xl p-4 flex items-center gap-4 cursor-pointer"
        style={{
          background: "rgba(124,58,237,0.08)",
          border: "1px solid rgba(124,58,237,0.20)",
        }}
        onClick={() => setLocation("/onboarding")}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(124,58,237,0.15)" }}>
          <Icon icon="solar:magic-stick-2-bold-duotone" className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Set up your AI Coach</p>
          <p className="text-xs text-white/40 mt-0.5">Complete your business profile to get personalized guidance — takes 2 minutes</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-300"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)" }}>
          Get Started
          <Icon icon="solar:arrow-right-bold" className="w-3.5 h-3.5" />
        </div>
      </motion.div>
    );
  }

  const niches: string[] = (() => {
    try {
      const raw = profile.interestedNiches;
      if (Array.isArray(raw)) return raw;
      if (typeof raw === "string") return JSON.parse(raw);
      return [];
    } catch { return []; }
  })();

  // 构建真实数据状态
  const realData = {
    hasInquiries: Array.isArray(inquiries) && inquiries.length > 0,
    hasMeetings: Array.isArray(meetings) && meetings.length > 0,
    hasSampleOrders: Array.isArray(sampleOrders) && sampleOrders.length > 0,
    hasWebinarAttended: Array.isArray(webinars) && webinars.some((w: any) => w.status === "ended"),

  };

  const tasks = buildTasks(profile.businessStage || "newbie", niches, realData);
  const completedCount = tasks.filter((t) => t.done).length;
  const progressPct = (completedCount / tasks.length) * 100;

  const ambitionLabel = AMBITION_LABELS[profile.ambition || ""] || profile.ambition || "—";
  const stageLabel = STAGE_LABELS[profile.businessStage || ""] || profile.businessStage || "—";
  const challengeLabel = CHALLENGE_LABELS[profile.mainChallenge || ""] || profile.mainChallenge || "—";

  // ── 个性化首论推荐 ──────────────────────────────────────────────────────────
  const firstAction = getPersonalizedFirstAction({
    ambition: profile.ambition,
    businessStage: profile.businessStage,
    budget: profile.budget,
    mainChallenge: profile.mainChallenge,
    targetPlatforms: profile.targetPlatforms,
    interestedNiches: profile.interestedNiches,
  });

  const handleFirstAction = () => {
    // Navigate to AI Assistant with pre-filled prompt via URL param
    const encodedPrompt = encodeURIComponent(firstAction.prompt);
    setLocation(`${firstAction.href}?q=${encodedPrompt}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* ── 顶部标题栏 ── */}
      <div
        className="flex items-center justify-between px-5 py-3.5 cursor-pointer"
        style={{ borderBottom: expanded ? "1px solid rgba(255,255,255,0.05)" : "none" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(124,58,237,0.15)" }}>
            <Icon icon="solar:magic-stick-2-bold-duotone" className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-white">AI Coach</span>
            <span className="text-xs text-white/30 ml-2">
              {completedCount}/{tasks.length} tasks complete
            </span>
          </div>
          {/* 进度条 */}
          <div className="hidden sm:flex items-center gap-2 ml-2">
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, #7c3aed, #a78bfa)" }}
              />
            </div>
            <span className="text-xs text-white/25">{Math.round(progressPct)}%</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* 画像标签 */}
          <div className="hidden md:flex items-center gap-2">
            <ProfileTag icon="solar:target-bold-duotone" label={ambitionLabel} />
            <ProfileTag icon="solar:chart-2-bold-duotone" label={stageLabel} />
            {challengeLabel && <ProfileTag icon="solar:shield-warning-bold-duotone" label={challengeLabel} />}
          </div>
          <Icon
            icon={expanded ? "solar:alt-arrow-up-bold" : "solar:alt-arrow-down-bold"}
            className="w-4 h-4 text-white/30"
          />
        </div>
      </div>

      {/* ── 展开内容 ── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4">

              {/* ── 个性化首论推荐卡片（NEW）── */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mb-4 rounded-xl overflow-hidden cursor-pointer group"
                style={{
                  background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(79,70,229,0.08) 100%)",
                  border: "1px solid rgba(124,58,237,0.25)",
                }}
                onClick={handleFirstAction}
              >
                <div className="px-4 py-3 flex items-center gap-3">
                  {/* AI 推荐标签 */}
                  <div className="flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(124,58,237,0.25)" }}>
                      <Icon icon={firstAction.icon} className="w-4.5 h-4.5 text-purple-300" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                        AI Recommended Next Step
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-tight truncate">
                      {firstAction.headline}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5 leading-relaxed line-clamp-1">
                      {firstAction.subtext}
                    </p>
                  </div>
                  <div
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 group-hover:bg-purple-500/30"
                    style={{
                      background: "rgba(124,58,237,0.20)",
                      border: "1px solid rgba(124,58,237,0.35)",
                      color: "#c4b5fd",
                    }}
                  >
                    {firstAction.ctaLabel}
                    <Icon icon="solar:arrow-right-bold" className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>

              {/* AI Coach 上下文提示 */}
              <div className="flex items-start gap-3 mb-4 p-3 rounded-xl"
                style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.12)" }}>
                <Icon icon="solar:chat-round-dots-bold-duotone" className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-white/50 leading-relaxed">
                  <span className="text-purple-300 font-medium">AI Coach knows your profile.</span>{" "}
                  Your goal is to <span className="text-white/70">{ambitionLabel.toLowerCase()}</span>,
                  you're currently at the <span className="text-white/70">{stageLabel.toLowerCase()}</span> stage,
                  and your main challenge is <span className="text-white/70">{challengeLabel.toLowerCase()}</span>.
                  Every recommendation is tailored to this context.
                </p>
              </div>

              {/* 任务清单 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {tasks.map((task, idx) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    index={idx}
                    onAction={() => setLocation(task.action)}
                  />
                ))}
              </div>

              {/* 底部链接 */}
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={() => setLocation("/ai-assistant")}
                  className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Icon icon="solar:magic-stick-2-bold-duotone" className="w-3.5 h-3.5" />
                  Ask AI Coach anything
                </button>
                <button
                  onClick={() => setLocation("/settings?tab=business_profile")}
                  className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors"
                >
                  <Icon icon="solar:settings-bold-duotone" className="w-3.5 h-3.5" />
                  Edit profile
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── 子组件：画像标签 ─────────────────────────────────────────────────────────
function ProfileTag({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-white/40"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <Icon icon={icon} className="w-3 h-3 text-purple-400/70" />
      <span className="max-w-[100px] truncate">{label}</span>
    </div>
  );
}

// ─── 子组件：任务卡片 ─────────────────────────────────────────────────────────
function TaskCard({ task, index, onAction }: { task: Task; index: number; onAction: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "relative flex flex-col gap-2.5 p-3.5 rounded-xl transition-all duration-200",
        task.done
          ? "opacity-60"
          : "hover:border-purple-500/30 cursor-pointer"
      )}
      style={{
        background: task.done ? "rgba(74,222,128,0.04)" : "rgba(255,255,255,0.03)",
        border: task.done
          ? "1px solid rgba(74,222,128,0.15)"
          : "1px solid rgba(255,255,255,0.07)",
      }}
      onClick={!task.done ? onAction : undefined}
    >
      {/* 步骤序号 */}
      <div className="flex items-center justify-between">
        <div className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center",
          task.done ? "bg-emerald-500/15" : "bg-white/5"
        )}>
          {task.done ? (
            <Icon icon="solar:check-circle-bold-duotone" className="w-4 h-4 text-emerald-400" />
          ) : (
            <Icon icon={task.icon} className="w-4 h-4 text-purple-400/70" />
          )}
        </div>
        {!task.done && (
          <span className="text-xs text-white/20">Step {index + 1}</span>
        )}
        {task.done && (
          <span className="text-xs text-emerald-400/60 font-medium">Done</span>
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1">
        <p className={cn("text-xs font-semibold leading-tight mb-0.5", task.done ? "text-white/40 line-through" : "text-white/80")}>
          {task.title}
        </p>
        <p className="text-xs text-white/25 leading-tight">{task.description}</p>
      </div>

      {/* 行动按钮 */}
      {!task.done && (
        <div className="flex items-center gap-1 text-xs text-purple-400 font-medium">
          {task.actionLabel}
          <Icon icon="solar:arrow-right-bold" className="w-3 h-3" />
        </div>
      )}
    </motion.div>
  );
}
