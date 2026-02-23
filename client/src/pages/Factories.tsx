import type React from "react";
import { motion } from "framer-motion";
import { Icon as SolarIcon } from "@iconify/react";
import BuyerSidebar from "@/components/BuyerSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

import { useFactories } from "@/hooks/useFactories";
import { FactoryStats } from "@/components/factories/FactoryStats";
import { FactoryFilters } from "@/components/factories/FactoryFilters";
import { FactoryGrid } from "@/components/factories/FactoryGrid";
import { FactoryLoading } from "@/components/factories/FactoryLoading";
import { BlurFade } from "@/components/magicui/blur-fade";

// Solar Icons 封装
const SIcon = ({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) => (
  <SolarIcon icon={`solar:${name}`} className={className} style={style} />
);
const Globe = (p: any) => <SIcon name="globe-bold-duotone" {...p} />;
const Bell = (p: any) => <SIcon name="bell-bing-bold-duotone" {...p} />;
const User = (p: any) => <SIcon name="user-circle-bold-duotone" {...p} />;

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
    <div className="flex min-h-screen" style={{ background: "#09090b" }}>
      {/* 背景光晕 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #4f46e5 0%, transparent 70%)" }} />
      </div>

      <BuyerSidebar userRole={user?.role || "buyer"} />

      <div className="flex-1 overflow-auto relative z-10">
        {/* Top Bar */}
        <div className="h-14 flex items-center justify-between px-6 sticky top-0 z-20"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(9,9,11,0.85)", backdropFilter: "blur(20px)" }}>
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-400" />
              <h1 className="text-heading-3">工厂大厅</h1>
            </div>
            <p className="text-caption">AI 驱动的全球工厂精准匹配平台</p>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              onClick={() => setLocation("/notifications")}
            >
              <Bell className="w-4 h-4" style={{ color: "rgba(255,255,255,0.50)" }} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </motion.button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              onClick={() => setLocation("/settings")}
            >
              <User className="w-4 h-4 text-white" />
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-w-7xl mx-auto">
          <BlurFade delay={0.05} inView>
            <FactoryStats
              totalFactories={enrichedFactoriesWithData.length}
              totalCategories={categories.length}
              filteredCount={enrichedFactoriesWithData.length}
              avgScore={avgScore}
              isLoading={isLoading}
            />
          </BlurFade>
          <BlurFade delay={0.10} inView>
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
