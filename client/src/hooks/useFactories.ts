import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * useFactories Hook
 * 
 * 职责：
 * - 管理工厂数据获取（tRPC）
 * - 管理搜索和过滤状态
 * - 管理收藏操作（Mutation）
 * - 计算统计数据（平均评分、类别等）
 * 
 * 返回值：所有必要的数据和操作方法，UI 层只需调用
 */
export function useFactories() {
  // ── 状态管理 ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // ── tRPC Queries（不得修改）──────────────────────────────────────────
  const { data: factories = [], isLoading } = trpc.factories.list.useQuery();
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery();

  // ── tRPC Mutations（不得修改）────────────────────────────────────────
  const favoriteMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      toast.success(data.favorited ? "已收藏" : "已取消收藏");
    },
    onError: () => {
      toast.error("操作失败，请重试");
    },
  });

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

  // ── 操作方法 ──────────────────────────────────────────────────────────
  const handleToggleFavorite = (factoryId: string) => {
    favoriteMutation.mutate({ targetType: "factory", targetId: factoryId });
  };

  // ── 返回值 ────────────────────────────────────────────────────────────
  return {
    // 数据
    factories,
    filteredFactories,
    categories,
    isLoading,
    unreadCount,
    avgScore,

    // 状态
    searchQuery,
    categoryFilter,

    // 状态更新方法
    setSearchQuery,
    setCategoryFilter,

    // 操作方法
    handleToggleFavorite,
    isFavoritePending: favoriteMutation.isPending,
  };
}
