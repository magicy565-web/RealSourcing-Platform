import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/**
 * AI 推荐理由数据接口
 */
interface AIRecommendation {
  mainReason: string; // 主要推荐理由（一句话）
  detailedReasons: string[]; // 详细推荐理由（3-5 条）
  trustIndicators: string[]; // 信任指标（3-4 条）
}

/**
 * useFactoryAIRecommendation Hook
 * 
 * 职责：
 * - 调用 tRPC 端点获取 AI 生成的推荐理由
 * - 管理加载状态和错误处理
 * - 缓存推荐理由避免重复调用
 * - 支持买家偏好参数化
 */
export function useFactoryAIRecommendation(
  factoryId: number,
  buyerPreferences?: {
    preferredCategories?: string[];
    preferredCountries?: string[];
    minQualityScore?: number;
  }
) {
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);

  // tRPC 查询
  const { data, isLoading: isTRPCLoading, error: tRPCError } = trpc.factories.getAIRecommendation.useQuery(
    {
      factoryId,
      buyerPreferences,
    },
    {
      enabled: hasRequested, // 只在用户明确请求时才调用
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 分钟缓存
    }
  );

  // 监听 tRPC 数据变化
  useEffect(() => {
    if (data?.success && data.data) {
      setRecommendation(data.data);
      setError(null);
    }
  }, [data]);

  // 监听 tRPC 错误
  useEffect(() => {
    if (tRPCError) {
      setError("生成推荐理由失败，请稍后重试");
      console.error("❌ AI 推荐理由获取失败:", tRPCError);
    }
  }, [tRPCError]);

  // 手动请求推荐理由
  const requestRecommendation = () => {
    if (!hasRequested) {
      setHasRequested(true);
      setIsLoading(true);
    }
  };

  // 监听加载状态
  useEffect(() => {
    setIsLoading(isTRPCLoading);
  }, [isTRPCLoading]);

  return {
    recommendation,
    isLoading,
    error,
    requestRecommendation,
    hasRequested,
  };
}
