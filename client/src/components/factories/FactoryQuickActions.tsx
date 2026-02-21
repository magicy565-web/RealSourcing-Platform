import { Phone, Calendar, Package, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FactoryQuickActionsProps {
  factoryId: string;
  factoryName: string;
  isOnline?: boolean;
  isFavorited?: boolean;
  onVideoCall?: () => void;
  onScheduleMeeting?: () => void;
  onRequestSample?: () => void;
  onToggleFavorite?: () => void;
  isLoading?: boolean;
}

/**
 * FactoryQuickActions 组件
 * 
 * 职责：
 * - 提供"一键连线"、"预约会议"、"申请样品"等快捷操作
 * - 应用黑紫色霓虹风格
 * - 支持加载状态和禁用状态
 * - 对标 GTM 中的"交易链路加速"
 */
export function FactoryQuickActions({
  factoryId,
  factoryName,
  isOnline = false,
  isFavorited = false,
  onVideoCall,
  onScheduleMeeting,
  onRequestSample,
  onToggleFavorite,
  isLoading = false,
}: FactoryQuickActionsProps) {
  return (
    <div className="space-y-2">
      {/* 主操作按钮 */}
      <div className="grid grid-cols-2 gap-2">
        {/* 视频连线按钮 */}
        <Button
          onClick={onVideoCall}
          disabled={!isOnline || isLoading}
          className={`
            w-full h-10 rounded-lg font-medium text-sm
            transition-all duration-300
            ${isOnline
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20"
              : "bg-slate-700/50 text-slate-400 cursor-not-allowed"
            }
          `}
          title={isOnline ? "工厂在线，点击立即连线" : "工厂离线，无法连线"}
        >
          <Phone className="w-4 h-4 mr-1.5" />
          {isOnline ? "立即连线" : "离线"}
        </Button>

        {/* 预约会议按钮 */}
        <Button
          onClick={onScheduleMeeting}
          disabled={isLoading}
          className="
            w-full h-10 rounded-lg font-medium text-sm
            bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500
            text-white shadow-lg shadow-blue-500/20
            transition-all duration-300
          "
        >
          <Calendar className="w-4 h-4 mr-1.5" />
          预约会议
        </Button>
      </div>

      {/* 次操作按钮 */}
      <div className="grid grid-cols-2 gap-2">
        {/* 申请样品按钮 */}
        <Button
          onClick={onRequestSample}
          disabled={isLoading}
          variant="outline"
          className="
            w-full h-10 rounded-lg font-medium text-sm
            border border-violet-500/40 bg-violet-500/5 hover:bg-violet-500/10
            text-violet-300 hover:text-violet-200
            transition-all duration-300
          "
        >
          <Package className="w-4 h-4 mr-1.5" />
          申请样品
        </Button>

        {/* 收藏按钮 */}
        <Button
          onClick={onToggleFavorite}
          disabled={isLoading}
          variant="outline"
          className={`
            w-full h-10 rounded-lg font-medium text-sm
            border transition-all duration-300
            ${isFavorited
              ? "border-red-500/40 bg-red-500/10 text-red-300 hover:text-red-200 hover:bg-red-500/20"
              : "border-slate-600/40 bg-slate-700/20 text-slate-300 hover:text-slate-200 hover:bg-slate-700/40"
            }
          `}
        >
          <Heart className={`w-4 h-4 mr-1.5 ${isFavorited ? "fill-current" : ""}`} />
          {isFavorited ? "已收藏" : "收藏"}
        </Button>
      </div>

      {/* 在线状态提示 */}
      {isOnline && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-300">工厂在线，可立即连线</span>
        </div>
      )}
    </div>
  );
}
