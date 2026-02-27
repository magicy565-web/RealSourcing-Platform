import React, { useState, useRef } from "react";

/**
 * 关键帧数据接口
 */
export interface Keyframe {
  timestamp: number; // 秒
  label: string; // 标签，如"生产线"、"实验室"
  icon?: string; // 可选的 emoji 或 icon
  color?: "purple" | "indigo" | "blue" | "emerald" | "amber";
}

interface ReelTimelineProps {
  duration: number; // 视频总时长（秒）
  currentTime: number; // 当前播放时间
  keyframes?: Keyframe[]; // 关键帧列表
  onSeek?: (time: number) => void; // 跳转到指定时间
  className?: string;
}

/**
 * ReelTimeline 组件
 * 
 * 特性：
 * - 智能进度条，支持拖拽跳转
 * - 关键帧锚点标注
 * - 悬停预览时间
 * - 黑紫色霓虹效果
 * - 响应式设计
 */
export function ReelTimeline({
  duration,
  currentTime,
  keyframes = [],
  onSeek,
  className = "",
}: ReelTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ── 格式化时间 ────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ── 处理进度条点击和拖拽 ──────────────────────────────────────────────────
  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = percent * duration;

    setHoveredTime(time);

    if (isDragging) {
      onSeek?.(time);
    }
  };

  const handleMouseLeave = () => {
    setHoveredTime(null);
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    onSeek?.(percent * duration);
  };

  // ── 计算关键帧位置 ────────────────────────────────────────────────────────
  const keyframePositions = keyframes.map((kf) => ({
    ...kf,
    percent: (kf.timestamp / duration) * 100,
  }));

  const progressPercent = (currentTime / duration) * 100;
  const hoverPercent = hoveredTime !== null ? (hoveredTime / duration) * 100 : null;

  // ── 颜色映射 ──────────────────────────────────────────────────────────────
  const colorMap = {
    purple: "bg-purple-500",
    indigo: "bg-indigo-500",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
  };

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {/* 进度条 */}
      <div
        ref={containerRef}
        className="relative h-8 bg-white/10 rounded-lg overflow-hidden group cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* 背景轨道 */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5" />

        {/* 关键帧标记 */}
        {keyframePositions.map((kf, idx) => (
          <div
            key={idx}
            className="absolute top-0 bottom-0 flex flex-col items-center justify-center group/keyframe"
            style={{ left: `${kf.percent}%` }}
          >
            {/* 竖线 */}
            <div
              className={`w-0.5 h-full transition-all group-hover/keyframe:h-full ${
                colorMap[kf.color || "purple"]
              } opacity-60 group-hover/keyframe:opacity-100`}
            />

            {/* 悬停时显示标签 */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/keyframe:opacity-100 transition-opacity">
              <div className="px-2 py-1 rounded bg-black/80 backdrop-blur-sm border border-white/20 text-xs text-white whitespace-nowrap">
                {kf.icon && <span className="mr-1">{kf.icon}</span>}
                {kf.label}
              </div>
            </div>
          </div>
        ))}

        {/* 进度填充 */}
        <div
          className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />

        {/* 悬停预览线 */}
        {hoverPercent !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/50 pointer-events-none"
            style={{ left: `${hoverPercent}%` }}
          />
        )}

        {/* 进度指示点 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg shadow-purple-500/50 transition-all"
          style={{
            left: `${progressPercent}%`,
            opacity: isDragging ? 1 : 0.7,
            transform: `translate(-50%, -50%) scale(${isDragging ? 1.2 : 1})`,
          }}
        />
      </div>

      {/* 时间标签 */}
      <div className="flex items-center justify-between text-xs text-white/60 px-1">
        <span>{formatTime(currentTime)}</span>
        {hoveredTime !== null && (
          <span className="text-purple-400 font-medium">{formatTime(hoveredTime)}</span>
        )}
        <span>{formatTime(duration)}</span>
      </div>

      {/* 关键帧标签行 */}
      {keyframePositions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 text-xs">
          {keyframePositions.map((kf, idx) => (
            <button
              key={idx}
              onClick={() => onSeek?.(kf.timestamp)}
              className={`px-2.5 py-1 rounded-full border transition-all hover:scale-105 ${
                colorMap[kf.color || "purple"]
              } bg-opacity-20 border-opacity-50 text-white/80 hover:text-white hover:bg-opacity-30`}
              title={`跳转到 ${formatTime(kf.timestamp)}`}
            >
              {kf.icon && <span className="mr-1">{kf.icon}</span>}
              {kf.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReelTimeline;

