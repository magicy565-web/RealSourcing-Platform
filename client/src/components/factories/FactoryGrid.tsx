import { FactoryCard } from "./FactoryCard";
import { Search } from "lucide-react";

interface Factory {
  id: string;
  name: string;
  city?: string;
  country?: string;
  category?: string;
  logo?: string;
  status?: string;
  overallScore?: number;
}

interface FactoryGridProps {
  factories: Factory[];
  onViewDetails: (factoryId: string) => void;
  onToggleFavorite: (factoryId: string) => void;
  isFavoritePending?: boolean;
}

/**
 * FactoryGrid 组件
 * 
 * 职责：
 * - 展示工厂卡片网格
 * - 处理空状态
 * - 应用响应式布局
 */
export function FactoryGrid({
  factories,
  onViewDetails,
  onToggleFavorite,
  isFavoritePending = false,
}: FactoryGridProps) {
  if (factories.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4 border border-violet-500/30">
          <Search className="w-8 h-8 text-violet-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">未找到匹配的工厂</h3>
        <p className="text-muted-foreground text-sm">尝试调整搜索条件或筛选器</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {factories.map((factory) => (
        <FactoryCard
          key={factory.id}
          factory={factory}
          onViewDetails={onViewDetails}
          onToggleFavorite={onToggleFavorite}
          isFavoritePending={isFavoritePending}
        />
      ))}
    </div>
  );
}
