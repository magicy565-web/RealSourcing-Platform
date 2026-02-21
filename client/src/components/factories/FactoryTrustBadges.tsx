import { CheckCircle2, Shield, Zap, TrendingUp } from "lucide-react";

interface FactoryTrustBadgesProps {
  status?: string;
  overallScore?: number;
  isFavorited?: boolean;
  matchTags?: string[];
  isOnline?: boolean;
}

/**
 * FactoryTrustBadges 组件
 * 
 * 职责：
 * - 展示工厂的信任标签（已认证、高评分、在线等）
 * - 应用黑紫色霓虹风格
 * - 支持动态标签扩展
 */
export function FactoryTrustBadges({
  status = "unverified",
  overallScore = 0,
  isFavorited = false,
  matchTags = [],
  isOnline = false,
}: FactoryTrustBadgesProps) {
  const badges = [];

  // 在线状态徽章
  if (isOnline) {
    badges.push({
      id: "online",
      icon: Zap,
      label: "在线可连线",
      color: "from-emerald-500/20 to-emerald-600/20",
      border: "border-emerald-500/40",
      text: "text-emerald-300",
      pulse: true,
    });
  }

  // 认证状态徽章
  if (status === "verified") {
    badges.push({
      id: "verified",
      icon: CheckCircle2,
      label: "AI 验厂通过",
      color: "from-blue-500/20 to-blue-600/20",
      border: "border-blue-500/40",
      text: "text-blue-300",
      pulse: false,
    });
  }

  // 高评分徽章
  if (typeof overallScore === 'number' && overallScore >= 4.5) {
    badges.push({
      id: "highscore",
      icon: TrendingUp,
      label: `${Number(overallScore).toFixed(1)} 星`,
      color: "from-amber-500/20 to-amber-600/20",
      border: "border-amber-500/40",
      text: "text-amber-300",
      pulse: false,
    });
  }

  // 信任徽章
  if (status === "verified" && typeof overallScore === 'number' && overallScore >= 4.0) {
    badges.push({
      id: "trusted",
      icon: Shield,
      label: "高信任度",
      color: "from-violet-500/20 to-purple-600/20",
      border: "border-violet-500/40",
      text: "text-violet-300",
      pulse: false,
    });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <div
            key={badge.id}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-full
              bg-gradient-to-r ${badge.color}
              border ${badge.border}
              backdrop-blur-sm
              ${badge.pulse ? "animate-pulse" : ""}
            `}
          >
            <Icon className={`w-3.5 h-3.5 ${badge.text}`} />
            <span className={`text-xs font-medium ${badge.text}`}>
              {badge.label}
            </span>
          </div>
        );
      })}

      {/* 匹配标签 */}
      {matchTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {matchTags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-1 text-xs font-medium rounded-full bg-slate-700/40 border border-slate-600/40 text-slate-300"
            >
              {tag}
            </span>
          ))}
          {matchTags.length > 2 && (
            <span className="px-2 py-1 text-xs font-medium text-slate-400">
              +{matchTags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
