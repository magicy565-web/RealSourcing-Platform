import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, X } from "lucide-react";

/**
 * Factory Reel 数据接口
 */
export interface FactoryReel {
  id: string;
  factoryId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  title: string;
  duration: number; // 秒
  keyframes?: Array<{
    timestamp: number;
    label: string;
    icon?: string;
  }>;
  viewCount?: number;
  createdAt?: string;
}

interface FactoryReelPlayerProps {
  reel: FactoryReel;
  autoPlay?: boolean;
  muted?: boolean;
  onFullscreenToggle?: (isFullscreen: boolean) => void;
  className?: string;
  isCompact?: boolean; // 卡片内的紧凑模式
}

/**
 * FactoryReelPlayer 组件
 * 
 * 特性：
 * - 支持自动播放和静音预览
 * - 平滑的全屏过渡动画
 * - 黑紫色霓虹光晕效果
 * - 响应式设计
 * - 性能优化（懒加载、视频预加载）
 */
export function FactoryReelPlayer({
  reel,
  autoPlay = false,
  muted = true,
  onFullscreenToggle,
  className = "",
  isCompact = false,
}: FactoryReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(!isCompact);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // ── 播放控制 ──────────────────────────────────────────────────────────────
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);
        onFullscreenToggle?.(true);
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
        onFullscreenToggle?.(false);
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  // ── 时间更新 ──────────────────────────────────────────────────────────────
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // ── 控制条自动隐藏（仅在全屏模式） ────────────────────────────────────────
  const handleMouseMove = () => {
    if (isFullscreen) {
      setShowControls(true);
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    }
  };

  // ── 初始化 ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (autoPlay) {
        videoRef.current.play().catch(() => {
          // 浏览器可能阻止自动播放
          setIsPlaying(false);
        });
      }
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // ── 格式化时间 ────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = (currentTime / reel.duration) * 100;

  // ── 渲染 ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden transition-all duration-300 ${
        isCompact ? "aspect-video rounded-lg" : isFullscreen ? "fixed inset-0 z-50" : "aspect-video rounded-xl"
      } ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* 背景光晕效果（黑紫色霓虹） */}
      {!isCompact && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-indigo-900/20 pointer-events-none" />
      )}

      {/* 视频元素 */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        poster={reel.thumbnailUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setIsLoading(false)}
        onEnded={() => setIsPlaying(false)}
        className="w-full h-full object-cover"
      />

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      )}

      {/* 控制条容器 */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* 进度条 */}
        <div className="mb-3 group cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = (e.clientX - rect.left) / rect.width;
          handleSeek(percent * reel.duration);
        }}>
          <div className="h-1 bg-white/20 rounded-full overflow-hidden hover:h-2 transition-all">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* 播放/暂停 */}
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title={isPlaying ? "暂停" : "播放"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>

            {/* 音量 */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
              title={isMuted ? "取消静音" : "静音"}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* 时间显示 */}
            <span className="text-xs text-white/70 ml-2">
              {formatTime(currentTime)} / {formatTime(reel.duration)}
            </span>
          </div>

          {/* 全屏按钮 */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
            title={isFullscreen ? "退出全屏" : "全屏"}
          >
            {isFullscreen ? (
              <X className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 中央播放按钮（暂停时显示） */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center group"
        >
          <div className="w-16 h-16 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-400/50 flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </button>
      )}

      {/* 霓虹边框效果 */}
      {!isCompact && (
        <div className="absolute inset-0 rounded-xl pointer-events-none border border-purple-500/20 shadow-lg shadow-purple-500/10" />
      )}
    </div>
  );
}

export default FactoryReelPlayer;
