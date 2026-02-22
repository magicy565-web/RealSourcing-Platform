/**
 * FactoryGrid — AMR v2.0 版本
 * 使用 FactoryAMRCard 替代旧的 FactoryCard，体现社区驱动的评估哲学。
 *
 * v2.1 更新：
 * - 添加 coverImage 字段支持
 * - 为 6 家演示工厂注入差异化 AMR 维度权重，使雷达图形状各具特色
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
  coverImage?: string;
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
 * 工厂差异化 AMR 维度权重配置
 * 每家工厂的核心竞争优势维度被调高，形成独特的雷达图形状。
 * acumen=市场洞察, channel=渠道交付, velocity=响应速度, global=全球化
 */
const FACTORY_AMR_PROFILES: Record<string, {
  acumen: number;
  channel: number;
  velocity: number;
  global: number;
  channels: string[];
  vibeTags: string[];
}> = {
  // 鸿毅实业（ID:1）- 品质认证型：D1信任极高（GMP），D3市场洞察强（美妆ODM）
  "1": {
    acumen: 0.90, channel: 0.80, velocity: 0.96, global: 0.85,
    channels: ["amazon_fba", "dropshipping", "trade_show"],
    vibeTags: ["GMP+FDA认证", "无尘灌装车间", "快速打样"],
  },
  // 极联智能（ID:2）- 渠道生态型：D4生态系统极强（北美欧洲），D2敏捷交付（FBA）
  "2": {
    acumen: 0.78, channel: 0.94, velocity: 0.93, global: 0.99,
    channels: ["amazon_fba", "small_moq", "trade_show"],
    vibeTags: ["Alexa/Google认证", "生态集成强", "英文沟通流畅"],
  },
  // 极联智能（ID:10）- 生态协作型：全球化强，渠道广（D4 生态协作）
  "10": {
    acumen: 0.82, channel: 1.00, velocity: 0.90, global: 0.98,
    channels: ["amazon_fba", "dropshipping", "small_moq"],
    vibeTags: ["Alexa/Google认证", "生态集成强", "英文沟通流畅"],
  },
  // 立秀运动（ID:11）- 市场洞察型：市场敏锐，Shopify友好（D3 市场洞察）
  "11": {
    acumen: 0.98, channel: 0.88, velocity: 0.92, global: 0.80,
    channels: ["shopify", "blind_ship", "small_moq"],
    vibeTags: ["女性运动专家", "ODM能力强", "快速跟款"],
  },
  // 鸿毅实业（ID:12）- 全能高分型：各维度均衡且高分（D1 基础信任）
  "12": {
    acumen: 0.92, channel: 0.98, velocity: 0.99, global: 0.94,
    channels: ["amazon_fba", "dropshipping", "trade_show"],
    vibeTags: ["GMP+FDA认证", "响应极速", "小单可接"],
  },
  // 源杰工艺（ID:13）- 社区口碑型：全球化弱，但口碑传播强（D5 社区验证）
  "13": {
    acumen: 0.78, channel: 0.85, velocity: 0.80, global: 0.62,
    channels: ["trade_show", "small_moq"],
    vibeTags: ["品牌定制专家", "珐琅工艺精湛", "价格有竞争力"],
  },
  // PM模具（ID:14）- 敏捷交付型：渠道交付最强，打样极速（D2 敏捷交付）
  "14": {
    acumen: 0.72, channel: 1.02, velocity: 0.98, global: 0.86,
    channels: ["dropshipping", "small_moq"],
    vibeTags: ["精密模具专家", "快速打样", "IATF16949认证"],
  },
  // 灵伴科技（ID:15）- 均衡成长型：各维度均衡，科技感强（五维均衡）
  "15": {
    acumen: 0.88, channel: 0.82, velocity: 0.78, global: 0.84,
    channels: ["amazon_fba", "dropshipping", "small_moq"],
    vibeTags: ["AR眼镜前沿", "AI集成能力", "新兴品牌潜力"],
  },
};

/**
 * 将后端工厂数据映射为 AMR 卡片所需的数据结构。
 * 优先使用工厂专属差异化配置，确保雷达图形状各具特色。
 */
function mapToAMRData(factory: Factory): FactoryAMRData {
  // overallScore 从数据库返回可能是字符串（Decimal 类型），需要强制转换为数字
  const base = factory.overallScore != null ? Number(factory.overallScore) : 3.5;
  const toAMR = (offset: number) => Math.min(100, Math.round((base / 5) * 100 * offset));

  // 优先使用工厂专属差异化配置
  const profile = FACTORY_AMR_PROFILES[factory.id];

  const amrScore    = toAMR(0.92);
  const amrAcumen   = toAMR(profile?.acumen   ?? 0.88);
  const amrChannel  = toAMR(profile?.channel  ?? 0.95);
  const amrVelocity = toAMR(profile?.velocity ?? 0.90);
  const amrGlobal   = toAMR(profile?.global   ?? 0.82);

  // 优先使用工厂专属渠道配置，否则根据类别推断
  let channels: string[];
  if (profile?.channels) {
    channels = profile.channels;
  } else {
    const categoryLower = (factory.category || "").toLowerCase();
    channels = ["small_moq"];
    if (categoryLower.includes("electron") || categoryLower.includes("audio")) {
      channels.push("amazon_fba", "dropshipping");
    } else if (categoryLower.includes("apparel") || categoryLower.includes("fashion")) {
      channels.push("shopify", "blind_ship");
    } else {
      channels.push("dropshipping", "trade_show");
    }
  }

  // 优先使用工厂专属体感标签，否则根据评分区间生成
  let vibeTags: string[];
  if (profile?.vibeTags) {
    vibeTags = profile.vibeTags;
  } else if (base >= 4.5) {
    vibeTags = ["英文沟通流畅", "快速打样", "小单可接"];
  } else if (base >= 4.0) {
    vibeTags = ["响应及时", "包装质感好"];
  } else {
    vibeTags = ["价格有竞争力"];
  }

  const activeGlobalBuyers = Math.round(base * 18);
  const avgShipHours = base >= 4.5 ? 24 : base >= 4.0 ? 36 : 48;

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
