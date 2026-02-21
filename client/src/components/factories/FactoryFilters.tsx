import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, TrendingUp } from "lucide-react";

interface FactoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  onAIRecommend?: () => void;
}

/**
 * FactoryFilters 组件
 * 
 * 职责：
 * - 提供搜索输入框
 * - 提供类别筛选下拉框
 * - 提供 AI 推荐按钮
 * - 应用黑紫霓虹风格
 * 
 * 设计特点：
 * - 玻璃拟态输入框
 * - 紫色霓虹边框和光晕
 * - 聚焦时发光效果
 */
export function FactoryFilters({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  onAIRecommend,
}: FactoryFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 mb-6">
      {/* 搜索框 */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400/50" />
        <Input
          placeholder="搜索工厂名称、地区、产品类别..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-10 bg-slate-900/40 backdrop-blur-md border-violet-500/30 text-foreground placeholder:text-slate-500 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all duration-300"
        />
      </div>

      {/* 类别筛选 */}
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-44 h-10 bg-slate-900/40 backdrop-blur-md border-violet-500/30 text-foreground hover:border-violet-500/60 transition-all duration-300">
          <Filter className="w-3.5 h-3.5 mr-2 text-violet-400/50" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-violet-500/30">
          <SelectItem value="all" className="text-foreground hover:bg-violet-500/20">
            全部类别
          </SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat} className="text-foreground hover:bg-violet-500/20">
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* AI 推荐按钮 */}
      <Button
        onClick={onAIRecommend}
        className="h-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 border border-violet-400/20 shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-violet-500/40"
      >
        <TrendingUp className="w-4 h-4 mr-2" />
        AI 推荐
      </Button>
    </div>
  );
}
