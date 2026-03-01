import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/useDebounce";

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
 * useFactories Hook (GTM 3.1 版本)
 * 
 * 职责：
 * - 管理工厂数据获取（tRPC）
 * - 管理搜索和过滤状态
 * - 管理收藏操作（Mutation）
 * - 计算统计数据（平均评分、类别等）
 * - 【新增】AI 匹配度计算
 * - 【新增】在线状态管理
 * - 【新增】样品申请逻辑
 * 
 * 返回值：所有必要的数据和操作方法，UI 层只需调用
 */
export function useFactories() {
  // ── 状态管理 ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  // 搜索防抖：300ms 后才触发过滤，避免每次按键都重新计算
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedFactoryForSample, setSelectedFactoryForSample] = useState<string | null>(null);

  // ── tRPC Queries（不得修改）──────────────────────────────────────────
  const { data: factories = [], isLoading } = trpc.factories.list.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();
  const { data: userProfile } = trpc.auth.me.useQuery();

  // ── tRPC Mutations（不得修改）────────────────────────────────────────
  const favoriteMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.favorited ? "已收藏" : "已取消收藏");
    },
    onError: () => {
      toast.error("操作失败，请重试");
    },
  });

  // ── 【新增】样品申请 Mutation ────────────────────────────────────────
  const sampleRequestMutation = trpc.samples?.request?.useMutation?.({
    onSuccess: () => {
      toast.success("样品申请已发送，工厂将在 24 小时内回复");
      setSelectedFactoryForSample(null);
    },
    onError: () => {
      toast.error("样品申请失败，请重试");
    },
  }) || { mutate: () => {}, isPending: false };

  // ── 计算派生数据（使用 useMemo 优化性能）──────────────────────────────
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
        name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        city.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        country.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "all" || category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [factories, debouncedSearchQuery, categoryFilter]);

  const avgScore = useMemo(() => {
    if (factories.length === 0) return "0.0";
    const sum = factories.reduce((acc, f) => acc + Number(f.overallScore || 0), 0);
    return (sum / factories.length).toFixed(1);
  }, [factories]);

  // ── 【新增】AI 匹配度计算 ──────────────────────────────────────────────
  /**
   * 模拟 AI 匹配度计算
   * 实际应用中应调用后端 AI 服务
   */
  const calculateMatchScore = (factoryId: string): MatchScoreData => {
    const factory = factories.find(f => f.id === factoryId);
    if (!factory) {
      return { score: 0, reason: "工厂不存在", tags: [] };
    }

    // 模拟匹配逻辑
    let score = 50; // 基础分
    const tags: string[] = [];
    let reason = "";

    // 根据评分提升匹配度
    const factoryScore = Number(factory.overallScore || 0);
    if (factoryScore >= 4.5) {
      score += 30;
      tags.push("高评分");
    } else if (factoryScore >= 4.0) {
      score += 20;
      tags.push("优质工厂");
    }

    // 根据类别匹配
    if (factory.category === categoryFilter && categoryFilter !== "all") {
      score += 15;
      tags.push("专业类目");
    }

    // 根据认证状态
    if (factory.status === "verified") {
      score += 10;
      tags.push("已认证");
    }

    // 根据地理位置（模拟）
    if (factory.country === "China") {
      score += 5;
      tags.push("快速交期");
    }

    // 确保分数在 0-100 之间
    score = Math.min(100, Math.max(0, score));

    // 生成推荐理由
    if (score >= 90) {
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

  // ── 【新增】在线状态模拟 ──────────────────────────────────────────────
  /**
   * 模拟工厂在线状态
   * 实际应用中应通过 WebSocket 或轮询获取实时状态
   */
  const getFactoryOnlineStatus = (factoryId: string): FactoryOnlineStatus => {
    // 模拟：30% 的工厂在线
    const isOnline = Math.random() > 0.7;
    return {
      isOnline,
      lastSeen: isOnline ? undefined : new Date(Date.now() - Math.random() * 3600000).toISOString(),
      availableForCall: isOnline,
    };
  };

  // ── 【新增】为每个工厂预计算匹配度和在线状态 ────────────────────────
  const enrichedFactories = useMemo(() => {
    return filteredFactories.map(factory => ({
      ...factory,
      matchScore: calculateMatchScore(factory.id),
      onlineStatus: getFactoryOnlineStatus(factory.id),
    }));
  }, [filteredFactories, categoryFilter]);

  // ── 操作方法 ──────────────────────────────────────────────────────────
  const handleToggleFavorite = (factoryId: string) => {
    favoriteMutation.mutate({ targetType: "factory", targetId: factoryId });
  };

  // ── 【新增】申请样品 ──────────────────────────────────────────────────
  const handleRequestSample = (factoryId: string, productName: string = "") => {
    sampleRequestMutation.mutate({
      factoryId,
      productName: productName || "未指定产品",
      quantity: 1,
      notes: "通过 RealSourcing 平台申请样品",
    });
  };

  // ── 【新增】启动视频连线 ──────────────────────────────────────────────
  const handleStartVideoCall = (factoryId: string) => {
    // 实际应用中应跳转到视频通话页面或打开视频通话模态框
    toast.info("正在连接工厂，请稍候...");
    // 模拟跳转逻辑
    console.log(`Starting video call with factory ${factoryId}`);
  };

  // ── 【新增】预约 1:1 选品会 ────────────────────────────────────────────
  const handleScheduleMeeting = (factoryId: string) => {
    toast.info("正在打开会议预约页面...");
    // 实际应用中应跳转到会议预约页面
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

    // 【新增】增强数据
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

    // 【新增】AI 匹配度方法
    calculateMatchScore,

    // 【新增】在线状态方法
    getFactoryOnlineStatus,

    // 【新增】高转化操作方法
    handleRequestSample,
    handleStartVideoCall,
    handleScheduleMeeting,
    isSampleRequestPending: sampleRequestMutation.isPending,
    selectedFactoryForSample,
    setSelectedFactoryForSample,
  };
}
