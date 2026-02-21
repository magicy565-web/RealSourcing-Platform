import { Bell, User } from "lucide-react";
import BuyerSidebar from "@/components/BuyerSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

// ── 模块化组件和 Hooks ────────────────────────────────────────────────────
import { useFactories } from "@/hooks/useFactories";
import { FactoryStats } from "@/components/factories/FactoryStats";
import { FactoryFilters } from "@/components/factories/FactoryFilters";
import { FactoryGrid } from "@/components/factories/FactoryGrid";
import { FactoryLoading } from "@/components/factories/FactoryLoading";

/**
 * Factories 页面（GTM 3.1 版本）
 * 
 * 架构设计：
 * - 使用 useFactories Hook 管理所有业务逻辑（包括 AI 匹配、在线状态）
 * - 将 UI 拆分为独立的模块化组件
 * - 页面只负责组合组件和处理路由
 * - 所有数据流向清晰，易于维护和扩展
 * 
 * GTM 3.1 核心功能：
 * - AI 匹配度可视化
 * - 实时在线状态感知
 * - 一键视频连线、预约会议、申请样品
 * - 动态信任背书
 * 
 * 组件结构：
 * ├── Sidebar（侧边栏）
 * ├── TopBar（顶部栏 + 黑紫霓虹动态光效）
 * └── MainContent
 *     ├── FactoryStats（统计数据）
 *     ├── FactoryFilters（搜索和筛选）
 *     └── FactoryGrid 或 FactoryLoading
 *         ├── FactoryCard（工厂卡片 + AI 匹配度 + 快速操作）
 *         └── EmptyState（空状态）
 */
export default function Factories() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // ── 使用 useFactories Hook 获取所有数据和方法 ──────────────────────────
  const {
    enrichedFactories,
    filteredFactories,
    categories,
    isLoading,
    unreadCount,
    avgScore,
    searchQuery,
    categoryFilter,
    setSearchQuery,
    setCategoryFilter,
    handleToggleFavorite,
    isFavoritePending,
    // 【新增】GTM 3.1 方法
    handleStartVideoCall,
    handleScheduleMeeting,
    handleRequestSample,
    calculateMatchScore,
    getFactoryOnlineStatus,
  } = useFactories();

  // ── 事件处理 ──────────────────────────────────────────────────────────
  const handleViewDetails = (factoryId: string) => {
    setLocation(`/factory/${factoryId}`);
  };

  const handleAIRecommend = () => {
    // TODO: 实现 AI 推荐逻辑
    console.log("AI 推荐功能待实现");
  };

  // 【新增】为 enrichedFactories 添加必要的数据
  const enrichedFactoriesWithData = enrichedFactories.map(factory => ({
    ...factory,
    matchScore: calculateMatchScore(factory.id),
    onlineStatus: getFactoryOnlineStatus(factory.id),
  }));

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── 侧边栏 ────────────────────────────────────────────────────────── */}
      <BuyerSidebar userRole={user?.role || "buyer"} />

      {/* ── 主内容区 ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        {/* ── 顶部栏（GTM 3.1 黑紫霓虹动态光效）──────────────────────────── */}
        <div className="relative h-16 bg-gradient-to-r from-slate-900/80 to-slate-950/80 backdrop-blur-md border-b border-violet-500/20 flex items-center justify-between px-8 overflow-hidden">
          {/* 【新增】背景动态光晕 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-br from-violet-600/10 to-purple-600/10 blur-3xl animate-pulse" />
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-tl from-blue-600/10 to-indigo-600/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          </div>

          {/* 内容 */}
          <div className="relative z-10">
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-300 to-purple-300 bg-clip-text text-transparent">
              工厂大厅
            </h1>
            <p className="text-xs text-muted-foreground">AI 驱动的全球工厂精准匹配平台</p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-full hover:bg-violet-500/10 transition-colors"
              onClick={() => setLocation("/notifications")}
            >
              <Bell className="w-4.5 h-4.5 text-violet-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-background animate-pulse" />
              )}
            </Button>
            <div
              className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center cursor-pointer hover:border-violet-500/60 hover:bg-violet-500/20 transition-all duration-300"
              onClick={() => setLocation("/settings")}
            >
              <User className="w-4.5 h-4.5 text-violet-400" />
            </div>
          </div>
        </div>

        {/* ── 内容区域 ──────────────────────────────────────────────────── */}
        <div className="p-8 max-w-7xl mx-auto">
          {/* 统计数据行 */}
          <FactoryStats
            totalFactories={enrichedFactoriesWithData.length}
            totalCategories={categories.length}
            filteredCount={enrichedFactoriesWithData.length}
            avgScore={avgScore}
            isLoading={isLoading}
          />

          {/* 搜索和筛选栏 */}
          <FactoryFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categories={categories}
            onAIRecommend={handleAIRecommend}
          />

          {/* 工厂网格或加载状态 */}
          {isLoading ? (
            <FactoryLoading />
          ) : (
            <FactoryGrid
              factories={enrichedFactoriesWithData}
              onViewDetails={handleViewDetails}
              onToggleFavorite={handleToggleFavorite}
              isFavoritePending={isFavoritePending}
              // 【新增】GTM 3.1 回调
              onVideoCall={handleStartVideoCall}
              onScheduleMeeting={handleScheduleMeeting}
              onRequestSample={handleRequestSample}
              favoritedFactoryIds={[]} // TODO: 从用户状态获取
            />
          )}
        </div>
      </div>
    </div>
  );
}
