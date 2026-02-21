/**
 * FactoryGrid — AMR v2.0 版本
 * 使用 FactoryAMRCard 替代旧的 FactoryCard，体现社区驱动的评估哲学。
 */

import { FactoryAMRCard, type FactoryAMRData } from "./FactoryAMRCard";
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
  matchScore?: { score: number; reason: string; tags: string[] };
  onlineStatus?: { isOnline: boolean; availableForCall: boolean };
}

interface FactoryGridProps {
  factories: Factory[];
  onViewDetails: (factoryId: string) => void;
  onToggleFavorite: (factoryId: string) => void;
  isFavoritePending?: boolean;
  onVideoCall?: (factoryId: string) => void;
  onScheduleMeeting?: (factoryId: string) => void;
  onRequestSample?: (factoryId: string) => void;
  favoritedFactoryIds?: string[];
}

/**
 * 将后端工厂数据映射为 AMR 卡片所需的数据结构。
 * 在真实数据接入前，使用基于 overallScore 的确定性算法生成 AMR 分数，
 * 确保同一工厂每次渲染结果一致。
 */
function mapToAMRData(factory: Factory): FactoryAMRData {
  const base = typeof factory.overallScore === "number" ? factory.overallScore : 3.5;
  // 将 0-5 的评分映射到 0-100 的 AMR 分数，加入各维度的差异化偏移
  const toAMR = (offset: number) => Math.min(100, Math.round((base / 5) * 100 * offset));

  const amrScore    = toAMR(0.92);
  const amrAcumen   = toAMR(0.88);
  const amrChannel  = toAMR(0.95);
  const amrVelocity = toAMR(0.90);
  const amrGlobal   = toAMR(0.82);

  // 根据工厂类别推断渠道能力
  const categoryLower = (factory.category || "").toLowerCase();
  const channels: string[] = ["small_moq"];
  if (categoryLower.includes("electron") || categoryLower.includes("audio")) {
    channels.push("amazon_fba", "dropshipping");
  } else if (categoryLower.includes("apparel") || categoryLower.includes("fashion")) {
    channels.push("shopify", "blind_ship");
  } else {
    channels.push("dropshipping", "trade_show");
  }

  // 体感标签（基于评分区间生成，实际应来自买家评价）
  const vibeTags: string[] = [];
  if (base >= 4.5) {
    vibeTags.push("英文沟通流畅", "快速打样", "小单可接");
  } else if (base >= 4.0) {
    vibeTags.push("响应及时", "包装质感好");
  } else {
    vibeTags.push("价格有竞争力");
  }

  // 模拟活跃买家数和发货时效（实际应来自平台交易数据）
  const activeGlobalBuyers = Math.round(base * 18);
  const avgShipHours = base >= 4.5 ? 24 : base >= 4.0 ? 36 : 48;

  // 高分工厂附加导师背书（实际应来自导师认证系统）
  const mentorEndorsement =
    base >= 4.8
      ? "适合小单快返，沟通极度丝滑，FBA 条码无缝贴合"
      : undefined;

  return {
    ...factory,
    amrScore,
    amrAcumen,
    amrChannel,
    amrVelocity,
    amrGlobal,
    channels,
    vibeTags,
    activeGlobalBuyers,
    avgShipHours,
    mentorEndorsement,
  };
}

export function FactoryGrid({
  factories,
  onViewDetails,
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
        <FactoryAMRCard
          key={factory.id}
          factory={mapToAMRData(factory)}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
