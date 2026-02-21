import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * AI 匹配度数据接口
 */
interface MatchScoreData {
  score: number; // 0-100
  reason: string; // 推荐理由
  tags: string[]; // 特点标签
}

/**
 * 工厂在线状态接口
 */
interface FactoryOnlineStatus {
  isOnline: boolean;
  lastSeen?: string;
  availableForCall: boolean;
}

/**
 * useFactoriesV2 Hook (GTM 3.1 版本 - 增强版)
 * 
 * 职责：
 * - 管理工厂数据获取（tRPC）
 * - 管理搜索和过滤状态
 * - 管理收藏操作（Mutation）
 * - 计算统计数据（平均评分、类别等）
 * - AI 匹配度计算（基于数据库 AI 验厂评分）
 * - 在线状态管理（基于数据库实时状态）
 * - 样品申请逻辑
 * - 集成 GTM 3.1 新字段（AI 验厂、运营指标、Reel 视频）
 */
export function useFactoriesV2() {
  // ── 状态管理 ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedFactoryForSample, setSelectedFactoryForSample] = useState<string | null>(null);

  // ── tRPC Queries ──────────────────────────────────────────────────────
  const { data: factories = [], isLoading } = trpc.factories.list.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();
  const { data: userProfile } = trpc.auth.me.useQuery();

  // ── tRPC Mutations ────────────────────────────────────────────────────
  const favoriteMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.favorited ? "已收藏" : "已取消收藏");
    },
    onError: () => {
      toast.error("操作失败，请重试");
    },
  });

  // ── 样品申请 Mutation ────────────────────────────────────────────────
  const sampleRequestMutation = trpc.samples?.request?.useMutation?.({
    onSuccess: () => {
      toast.success("样品申请已发送，工厂将在 24 小时内回复");
      setSelectedFactoryForSample(null);
    },
    onError: () => {
      toast.error("样品申请失败，请重试");
    },
  }) || { mutate: () => {}, isPending: false };

  // ── 计算派生数据 ──────────────────────────────────────────────────────
  const categories = useMemo(
    () => Array.from(new Set(factories.map((f) => f.category).filter(Boolean))),
    [factories]
  );

  const filteredFactories = useMemo(() => {
    return factories.filter((factory) => {
      const name = factory.name || "";
      const city = factory.city || "";
      const country = factory.country || "";
      const category = factory.category || "";

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "all" || category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [factories, searchQuery, categoryFilter]);

  const avgScore = useMemo(() => {
    if (factories.length === 0) return "0.0";
    const sum = factories.reduce((acc, f) => acc + Number(f.overallScore || 0), 0);
    return (sum / factories.length).toFixed(1);
  }, [factories]);

  // ── AI 匹配度计算（基于数据库数据）──────────────────────────────────
  /**
   * 优化的 AI 匹配度计算
   * 根据数据库中的 AI 验厂评分、运营指标等数据计算
   */
  const calculateMatchScore = (factory: any): MatchScoreData => {
    if (!factory) {
      return { score: 0, reason: "工厂不存在", tags: [] };
    }

    let score = 50; // 基础分
    const tags: string[] = [];
    let reason = "";

    // 根据数据库中的 AI 验厂评分
    const aiScore = factory.verification?.aiVerificationScore || 0;
    if (aiScore >= 80) {
      score += 35;
      tags.push("AI验厂优秀");
    } else if (aiScore >= 70) {
      score += 25;
      tags.push("AI验厂不错");
    } else if (aiScore > 0) {
      score += 10;
      tags.push("已通过验厂");
    }

    // 根据认证状态
    if (factory.certificationStatus === "verified") {
      score += 15;
      tags.push("已认证");
    }

    // 根据整体评分
    const factoryScore = Number(factory.overallScore || 0);
    if (factoryScore >= 4.5) {
      score += 20;
      tags.push("高评分");
    } else if (factoryScore >= 4.0) {
      score += 10;
      tags.push("优质工厂");
    }

    // 根据实时在线状态
    if (factory.isOnline === 1) {
      score += 10;
      tags.push("实时在线");
    }

    // 根据是否有 Reel 视频
    if (factory.hasReel === 1) {
      score += 5;
      tags.push("有视频展示");
    }

    // 确保分数在 0-100 之间
    score = Math.min(100, Math.max(0, score));

    // 生成推荐理由（优先使用数据库中的理由）
    if (factory.verification?.aiVerificationReason?.length > 0) {
      reason = factory.verification.aiVerificationReason.slice(0, 2).join("、");
    } else if (score >= 90) {
      reason = "完美匹配，强烈推荐";
    } else if (score >= 75) {
      reason = "高度匹配，值得考虑";
    } else if (score >= 60) {
      reason = "基本匹配";
    } else {
      reason = "可选择";
    }

    return { score, reason, tags };
  };

  // ── 在线状态管理（基于数据库）──────────────────────────────────────
  /**
   * 获取工厂在线状态
   * 直接从数据库中读取实时状态
   */
  const getFactoryOnlineStatus = (factory: any): FactoryOnlineStatus => {
    return {
      isOnline: factory.isOnline === 1,
      lastSeen: factory.lastOnlineAt,
      availableForCall: factory.availableForCall === 1,
    };
  };

  // ── 为每个工厂预计算匹配度和在线状态 ────────────────────────────────
  const enrichedFactories = useMemo(() => {
    return filteredFactories.map((factory) => ({
      ...factory,
      matchScore: calculateMatchScore(factory),
      onlineStatus: getFactoryOnlineStatus(factory),
      // 添加 GTM 3.1 新字段
      aiVerificationScore: factory.verification?.aiVerificationScore || 0,
      trustBadges: factory.verification?.trustBadges || [],
      operatingMetrics: factory.metrics || null,
      videoReels: factory.reels || [],
      availableTimeSlots: factory.availabilities || [],
    }));
  }, [filteredFactories]);

  // ── 操作方法 ──────────────────────────────────────────────────────────
  const handleToggleFavorite = (factoryId: string) => {
    favoriteMutation.mutate({ targetType: "factory", targetId: factoryId });
  };

  // ── 申请样品 ──────────────────────────────────────────────────────────
  const handleRequestSample = (factoryId: string, productName: string = "") => {
    sampleRequestMutation.mutate({
      factoryId,
      productName: productName || "未指定产品",
      quantity: 1,
      notes: "通过 RealSourcing 平台申请样品",
    });
  };

  // ── 启动视频连线 ──────────────────────────────────────────────────────
  const handleStartVideoCall = (factoryId: string) => {
    toast.info("正在连接工厂，请稍候...");
    console.log(`Starting video call with factory ${factoryId}`);
  };

  // ── 预约 1:1 选品会 ────────────────────────────────────────────────────
  const handleScheduleMeeting = (factoryId: string) => {
    toast.info("正在打开会议预约页面...");
    console.log(`Scheduling meeting with factory ${factoryId}`);
  };

  // ── 返回值 ────────────────────────────────────────────────────────────
  return {
    // 原有数据
    factories,
    filteredFactories,
    categories,
    isLoading,
    unreadCount,
    avgScore,

    // 增强数据
    enrichedFactories,
    userProfile,

    // 原有状态
    searchQuery,
    categoryFilter,

    // 原有状态更新方法
    setSearchQuery,
    setCategoryFilter,

    // 原有操作方法
    handleToggleFavorite,
    isFavoritePending: favoriteMutation.isPending,

    // AI 匹配度方法
    calculateMatchScore,

    // 在线状态方法
    getFactoryOnlineStatus,

    // 高转化操作方法
    handleRequestSample,
    handleStartVideoCall,
    handleScheduleMeeting,
    isSampleRequestPending: sampleRequestMutation.isPending,
  };
}
