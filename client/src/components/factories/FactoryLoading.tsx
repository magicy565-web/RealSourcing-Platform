import { Loader2 } from "lucide-react";

/**
 * FactoryLoading 组件
 * 
 * 职责：
 * - 展示加载中状态
 * - 应用黑紫霓虹风格
 */
export function FactoryLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-4">
          <Loader2 className="w-10 h-10 text-violet-500 animate-spin absolute inset-1" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500/50 border-r-violet-500/50 animate-pulse" />
        </div>
        <p className="text-muted-foreground text-sm">加载工厂数据中...</p>
      </div>
    </div>
  );
}
