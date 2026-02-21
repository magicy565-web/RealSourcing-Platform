import { Building2, TrendingUp, Users, Star } from "lucide-react";

interface FactoryStatsProps {
  totalFactories: number;
  totalCategories: number;
  filteredCount: number;
  avgScore: string;
  isLoading: boolean;
}

/**
 * FactoryStats 组件
 * 
 * 职责：
 * - 展示工厂统计数据（总数、类别、筛选结果、平均评分）
 * - 应用黑紫霓虹风格
 * 
 * 设计特点：
 * - 玻璃拟态卡片
 * - 紫色系图标背景
 * - 加载骨架屏
 */
export function FactoryStats({
  totalFactories,
  totalCategories,
  filteredCount,
  avgScore,
  isLoading,
}: FactoryStatsProps) {
  const stats = [
    {
      icon: Building2,
      color: "from-violet-600/20 to-violet-500/10 text-violet-400",
      value: isLoading ? null : totalFactories,
      label: "认证工厂",
    },
    {
      icon: TrendingUp,
      color: "from-purple-600/20 to-purple-500/10 text-purple-400",
      value: isLoading ? null : totalCategories,
      label: "产品类别",
    },
    {
      icon: Users,
      color: "from-emerald-600/20 to-emerald-500/10 text-emerald-400",
      value: isLoading ? null : filteredCount,
      label: "筛选结果",
    },
    {
      icon: Star,
      color: "from-amber-600/20 to-amber-500/10 text-amber-400",
      value: isLoading ? null : avgScore,
      label: "平均评分",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={i}
            className="bg-gradient-to-br from-slate-900/40 to-slate-950/60 backdrop-blur-md rounded-xl border border-violet-500/20 p-4 flex items-center gap-3 hover:border-violet-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${stat.color}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {stat.value === null ? (
                  <span className="w-8 h-5 block bg-violet-500/20 rounded animate-pulse" />
                ) : (
                  stat.value
                )}
              </div>
              <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
