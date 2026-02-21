/**
 * Agora Audio & Video Enhancement Components
 * 声网音视频增强组件 - 包括美颜、降噪等功能
 */

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Volume2, VolumeX, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface AudioEnhancementProps {
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
}

interface VideoEnhancementProps {
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  beautyLevel?: number;
  onBeautyLevelChange?: (level: number) => void;
}

/**
 * 音频增强组件 - AI 降噪
 */
export function AudioEnhancement({ enabled = false, onToggle }: AudioEnhancementProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [noiseLevel, setNoiseLevel] = useState(50);

  const toggleEnhancement = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    onToggle?.(newState);
    toast.success(newState ? 'AI Noise Suppression enabled' : 'AI Noise Suppression disabled');
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-purple-500/20">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">AI Noise Suppression</span>
          {isEnabled && (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
              Active
            </span>
          )}
        </div>
        {isEnabled && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Intensity:</span>
            <Slider
              value={[noiseLevel]}
              onValueChange={(value) => setNoiseLevel(value[0])}
              min={0}
              max={100}
              step={10}
              className="flex-1"
            />
            <span className="text-xs text-gray-400 w-8 text-right">{noiseLevel}%</span>
          </div>
        )}
      </div>
      <Button
        size="sm"
        variant={isEnabled ? 'default' : 'outline'}
        onClick={toggleEnhancement}
        className="gap-1"
      >
        {isEnabled ? (
          <>
            <Volume2 className="w-4 h-4" />
            On
          </>
        ) : (
          <>
            <VolumeX className="w-4 h-4" />
            Off
          </>
        )}
      </Button>
    </div>
  );
}

/**
 * 视频增强组件 - 美颜特效
 */
export function VideoEnhancement({
  enabled = false,
  onToggle,
  beautyLevel = 50,
  onBeautyLevelChange,
}: VideoEnhancementProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [currentBeautyLevel, setCurrentBeautyLevel] = useState(beautyLevel);
  const [beautyOptions, setBeautyOptions] = useState({
    whitening: 30,
    smoothing: 40,
    ruddy: 20,
  });

  const toggleBeauty = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    onToggle?.(newState);
    toast.success(newState ? 'Beauty Effects enabled' : 'Beauty Effects disabled');
  };

  const handleBeautyLevelChange = (level: number) => {
    setCurrentBeautyLevel(level);
    onBeautyLevelChange?.(level);
  };

  const handleBeautyOptionChange = (option: keyof typeof beautyOptions, value: number) => {
    setBeautyOptions((prev) => ({
      ...prev,
      [option]: value,
    }));
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-white/5 rounded-lg border border-purple-500/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Beauty Effects</span>
          {isEnabled && (
            <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded">
              Active
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant={isEnabled ? 'default' : 'outline'}
          onClick={toggleBeauty}
          className="gap-1"
        >
          {isEnabled ? 'On' : 'Off'}
        </Button>
      </div>

      {isEnabled && (
        <div className="space-y-3">
          {/* 整体美颜等级 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Overall Level</span>
              <span className="text-xs text-purple-400">{currentBeautyLevel}%</span>
            </div>
            <Slider
              value={[currentBeautyLevel]}
              onValueChange={(value) => handleBeautyLevelChange(value[0])}
              min={0}
              max={100}
              step={10}
            />
          </div>

          {/* 美白 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Whitening</span>
              <span className="text-xs text-purple-400">{beautyOptions.whitening}%</span>
            </div>
            <Slider
              value={[beautyOptions.whitening]}
              onValueChange={(value) => handleBeautyOptionChange('whitening', value[0])}
              min={0}
              max={100}
              step={10}
            />
          </div>

          {/* 磨皮 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Smoothing</span>
              <span className="text-xs text-purple-400">{beautyOptions.smoothing}%</span>
            </div>
            <Slider
              value={[beautyOptions.smoothing]}
              onValueChange={(value) => handleBeautyOptionChange('smoothing', value[0])}
              min={0}
              max={100}
              step={10}
            />
          </div>

          {/* 红润 */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Ruddy</span>
              <span className="text-xs text-purple-400">{beautyOptions.ruddy}%</span>
            </div>
            <Slider
              value={[beautyOptions.ruddy]}
              onValueChange={(value) => handleBeautyOptionChange('ruddy', value[0])}
              min={0}
              max={100}
              step={10}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 完整的音视频增强面板
 */
export function EnhancementPanel() {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
      <h3 className="text-white font-semibold text-sm">Audio & Video Enhancements</h3>
      
      <AudioEnhancement
        enabled={audioEnabled}
        onToggle={setAudioEnabled}
      />
      
      <VideoEnhancement
        enabled={videoEnabled}
        onToggle={setVideoEnabled}
      />
    </div>
  );
}
