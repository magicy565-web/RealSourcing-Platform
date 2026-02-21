import { Sparkles } from "lucide-react";

interface FactoryMatchScoreProps {
  score: number; // 0-100
  reason: string;
  tags?: string[];
  compact?: boolean;
}

/**
 * FactoryMatchScore 组件
 * 
 * 职责：
 * - 展示 AI 匹配度评分（0-100）
 * - 显示推荐理由和特点标签
 * - 应用黑紫色霓虹风格
 * - 支持紧凑模式
 */
export function FactoryMatchScore({
  score,
  reason,
  tags = [],
  compact = false,
}: FactoryMatchScoreProps) {
  // 根据分数确定颜色
  const getScoreColor = () => {
    if (score >= 90) return "from-violet-500 to-purple-600";
    if (score >= 75) return "from-blue-500 to-cyan-600";
    if (score >= 60) return "from-emerald-500 to-teal-600";
    return "from-slate-500 to-slate-600";
  };

  const getScoreLabel = () => {
    if (score >= 90) return "完美匹配";
    if (score >= 75) return "高度匹配";
    if (score >= 60) return "基本匹配";
    return "可选择";
  };

  // 圆形进度条的周长
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative w-12 h-12">
          {/* 背景圆 */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(148, 163, 184, 0.2)"
              strokeWidth="4"
            />
            {/* 进度圆 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={score >= 90 ? "#a855f7" : score >= 75 ? "#3b82f6" : "#10b981"} />
                <stop offset="100%" stopColor={score >= 90 ? "#7c3aed" : score >= 75 ? "#06b6d4" : "#14b8a6"} />
              </linearGradient>
            </defs>
          </svg>
          {/* 中心文字 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-violet-300">{score}</span>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-violet-300">{getScoreLabel()}</p>
          <p className="text-xs text-slate-400">{reason}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 标题和图标 */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
        <span className="text-sm font-semibold text-foreground">AI 匹配度</span>
      </div>

      {/* 圆形进度条 */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20">
          {/* 背景圆 */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(148, 163, 184, 0.1)"
              strokeWidth="3"
            />
            {/* 进度圆 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#scoreGradientLarge)"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 drop-shadow-lg"
              style={{
                filter: `drop-shadow(0 0 8px ${
                  score >= 90 ? "rgba(168, 85, 247, 0.5)" : 
                  score >= 75 ? "rgba(59, 130, 246, 0.5)" : 
                  "rgba(16, 185, 129, 0.5)"
                })`,
              }}
            />
            <defs>
              <linearGradient id="scoreGradientLarge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={score >= 90 ? "#a855f7" : score >= 75 ? "#3b82f6" : "#10b981"} />
                <stop offset="100%" stopColor={score >= 90 ? "#7c3aed" : score >= 75 ? "#06b6d4" : "#14b8a6"} />
              </linearGradient>
            </defs>
          </svg>
          {/* 中心文字 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-violet-300">{score}</span>
            <span className="text-xs text-slate-400">分</span>
          </div>
        </div>

        {/* 信息文本 */}
        <div className="flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-foreground">{getScoreLabel()}</p>
            <p className="text-xs text-muted-foreground">{reason}</p>
          </div>

          {/* 特点标签 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-xs rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 进度条提示 */}
      <div className="text-xs text-slate-400 text-center">
        {score >= 90 && "✨ 这是一个完美匹配的工厂，强烈推荐！"}
        {score >= 75 && score < 90 && "👍 这是一个优质工厂，值得深入了解。"}
        {score >= 60 && score < 75 && "📌 这个工厂可能符合您的需求。"}
        {score < 60 && "ℹ️ 这个工厂可能不是最佳选择。"}
      </div>
    </div>
  );
}
