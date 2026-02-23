import { motion } from "framer-motion";
import { Bell, User, Globe } from "lucide-react";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

import { useFactories } from "@/hooks/useFactories";
import { FactoryStats } from "@/components/factories/FactoryStats";
import { FactoryFilters } from "@/components/factories/FactoryFilters";
import { FactoryGrid } from "@/components/factories/FactoryGrid";
import { FactoryLoading } from "@/components/factories/FactoryLoading";
import { BlurFade } from "@/components/magicui/blur-fade";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.03) 1px, transparent 1px)
`;

export default function Factories() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

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
    handleStartVideoCall,
    handleScheduleMeeting,
    handleRequestSample,
    calculateMatchScore,
    getFactoryOnlineStatus,
  } = useFactories();

  const handleViewDetails = (factoryId: string) => setLocation(`/factory/${factoryId}`);
  const handleAIRecommend = () => console.log("AI 推荐功能待实现");

  const enrichedFactoriesWithData = enrichedFactories.map(factory => ({
    ...factory,
    matchScore: calculateMatchScore(factory.id),
    onlineStatus: getFactoryOnlineStatus(factory.id),
  }));

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)" }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "40px 40px" }} />

      <BuyerSidebar userRole={user?.role || "buyer"} />

      <div className="flex-1 overflow-auto relative z-10">
        {/* Top Bar */}
        <div className="h-16 flex items-center justify-between px-8"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(5,3,16,0.80)",
            backdropFilter: "blur(20px)",
          }}>
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-400" />
              <h1 className="text-lg font-bold text-white">工厂大厅</h1>
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>AI 驱动的全球工厂精准匹配平台</p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              onClick={() => setLocation("/notifications")}
            >
              <Bell className="w-4 h-4" style={{ color: "rgba(255,255,255,0.60)" }} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: "#ef4444" }} />
              )}
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              onClick={() => setLocation("/settings")}
            >
              <User className="w-4 h-4 text-white" />
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-w-7xl mx-auto">
          <BlurFade delay={0.05} inView>
            <FactoryStats
              totalFactories={enrichedFactoriesWithData.length}
              totalCategories={categories.length}
              filteredCount={enrichedFactoriesWithData.length}
              avgScore={avgScore}
              isLoading={isLoading}
            />
          </BlurFade>
          <BlurFade delay={0.1} inView>
            <FactoryFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              categories={categories}
              onAIRecommend={handleAIRecommend}
            />
          </BlurFade>
          <BlurFade delay={0.15} inView>
            {isLoading ? (
              <FactoryLoading />
            ) : (
              <FactoryGrid
                factories={enrichedFactoriesWithData}
                onViewDetails={handleViewDetails}
                onToggleFavorite={handleToggleFavorite}
                isFavoritePending={isFavoritePending}
                onVideoCall={handleStartVideoCall}
                onScheduleMeeting={handleScheduleMeeting}
                onRequestSample={handleRequestSample}
                favoritedFactoryIds={[]}
              />
            )}
          </BlurFade>
        </div>
      </div>
    </div>
  );
}
