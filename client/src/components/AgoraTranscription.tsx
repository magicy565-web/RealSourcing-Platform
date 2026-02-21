/**
 * Agora Real-time Transcription & Translation Component
 * 声网实时转录与翻译组件 - 深度集成版 (PRD 3.1 P0)
 *
 * 核心改动（v2.0）：
 * 1. 通过 tRPC 调用后端 agora.startTranslation / stopTranslation 真实启动/停止 STT 任务
 * 2. 通过 Agora RTM SDK 订阅频道消息，接收声网 STT 服务推送的实时字幕
 * 3. 支持双语字幕（原文 + 翻译）显示
 * 4. 支持将转录文本保存到会议记录（meetingId 可选）
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Loader2, Volume2, VolumeX, Languages, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

interface TranscriptionSegment {
  id: string;
  speakerUid: string;
  speakerLabel: string; // 'Factory' | 'Buyer' | 'You' | UID
  originalText: string;
  translatedText?: string;
  language?: string;
  translatedLanguage?: string;
  timestamp: number;
  isFinal: boolean;
}

interface AgoraTranscriptionProps {
  channelName: string;
  userId: string | number;
  meetingId?: number;
  /** 本地用户角色，用于区分字幕颜色 */
  userRole?: 'buyer' | 'factory';
  isActive?: boolean;
  onToggle?: (active: boolean) => void;
  /** 字幕语言：识别语言 */
  sourceLanguage?: string;
  /** 翻译目标语言 */
  targetLanguage?: string;
  /** 是否显示翻译 */
  showTranslation?: boolean;
}

// ── 语言选项 ──────────────────────────────────────────────────────────────────

const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: 'English' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'ko-KR', label: '한국어' },
  { value: 'es-ES', label: 'Español' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'fr-FR', label: 'Français' },
];

// ── 主组件 ────────────────────────────────────────────────────────────────────

export function AgoraTranscription({
  channelName,
  userId,
  meetingId,
  userRole = 'buyer',
  isActive = false,
  onToggle,
  sourceLanguage: initialSourceLang = 'zh-CN',
  targetLanguage: initialTargetLang = 'en-US',
  showTranslation: initialShowTranslation = true,
}: AgoraTranscriptionProps) {
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(isActive);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState(initialSourceLang);
  const [targetLanguage, setTargetLanguage] = useState(initialTargetLang);
  const [showTranslation, setShowTranslation] = useState(initialShowTranslation);
  const [showSettings, setShowSettings] = useState(false);
  const [rtmConnected, setRtmConnected] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const rtmClientRef = useRef<any>(null);
  const rtmChannelRef = useRef<any>(null);

  // ── tRPC Mutations ──────────────────────────────────────────────────────────

  const startTranslationMutation = trpc.agora.startTranslation.useMutation({
    onSuccess: (data) => {
      if (data.status === 'started' && data.taskId) {
        setActiveTaskId(data.taskId);
        toast.success('实时翻译已启动');
        console.log('✅ STT task started:', data.taskId);
      } else {
        toast.error('启动翻译失败：' + (data.message || '未知错误'));
        setIsTranscribing(false);
      }
    },
    onError: (error) => {
      toast.error('启动翻译失败：' + error.message);
      setIsTranscribing(false);
    },
  });

  const stopTranslationMutation = trpc.agora.stopTranslation.useMutation({
    onSuccess: () => {
      setActiveTaskId(null);
      toast.success('实时翻译已停止');
    },
    onError: (error) => {
      console.error('Stop translation error:', error);
      setActiveTaskId(null);
    },
  });

  // ── RTM 连接管理 ────────────────────────────────────────────────────────────

  /**
   * 初始化 Agora RTM 客户端并订阅频道消息
   * 声网 STT 服务会将转录结果通过 RTM 消息推送到同名频道
   */
  const initRtmConnection = useCallback(async () => {
    try {
      // 动态导入 Agora RTM SDK（避免 SSR 问题）
      const AgoraRTM = (await import('agora-rtm-sdk')).default;
      const appId = (window as any).__AGORA_APP_ID__ || import.meta.env.VITE_AGORA_APP_ID;

      if (!appId) {
        console.warn('⚠️ VITE_AGORA_APP_ID not set, RTM subtitle push unavailable');
        return;
      }

      // 创建 RTM 客户端（兼容 RTM SDK v1 和 v2）
      const rtmClient = AgoraRTM.RTM
        ? new AgoraRTM.RTM(appId, `stt_${userId}_${Date.now()}`)
        : (AgoraRTM as any).createInstance
          ? (AgoraRTM as any).createInstance(appId)
          : new (AgoraRTM as any)(appId);
      rtmClientRef.current = rtmClient;

      // 登录 RTM（使用用户 ID 作为 UID）
      const rtmUid = `stt_sub_${userId}_${Date.now()}`;
      await rtmClient.login({ uid: rtmUid });

      // 订阅 STT 结果频道（声网 STT 推送到 `{channelName}_stt` 频道）
      const sttChannel = rtmClient.createChannel(`${channelName}_stt`);
      rtmChannelRef.current = sttChannel;

      sttChannel.on('ChannelMessage', (message: any) => {
        try {
          const payload = JSON.parse(message.text || '{}');
          handleSttMessage(payload);
        } catch (e) {
          // 可能是纯文本消息，直接作为字幕处理
          if (message.text) {
            handleRawSubtitle(message.text, String(message.memberId || 'unknown'));
          }
        }
      });

      await sttChannel.join();
      setRtmConnected(true);
      console.log('✅ RTM connected for STT subtitles:', channelName);
    } catch (error) {
      console.warn('⚠️ RTM connection failed (subtitle push unavailable):', error);
      // RTM 连接失败不阻断主流程，只是字幕无法实时推送
    }
  }, [channelName, userId]);

  /**
   * 处理声网 STT 推送的结构化消息
   */
  const handleSttMessage = useCallback((payload: any) => {
    if (!payload || isMuted) return;

    const segment: TranscriptionSegment = {
      id: `seg-${Date.now()}-${Math.random()}`,
      speakerUid: String(payload.uid || payload.speakerId || 'unknown'),
      speakerLabel: getSpeakerLabel(String(payload.uid || payload.speakerId || 'unknown')),
      originalText: payload.text || payload.words?.map((w: any) => w.text).join('') || '',
      translatedText: payload.trans?.text || payload.translatedText,
      language: payload.lang || sourceLanguage,
      translatedLanguage: payload.trans?.lang || targetLanguage,
      timestamp: payload.time || Date.now(),
      isFinal: payload.isFinal !== false,
    };

    if (!segment.originalText.trim()) return;

    setSegments((prev) => {
      // 如果是非最终结果，替换最后一条同 speaker 的非最终记录
      if (!segment.isFinal) {
        const lastIdx = [...prev].reverse().findIndex(
          (s) => s.speakerUid === segment.speakerUid && !s.isFinal
        );
        if (lastIdx !== -1) {
          const realIdx = prev.length - 1 - lastIdx;
          const updated = [...prev];
          updated[realIdx] = segment;
          return updated;
        }
      }
      return [...prev, segment];
    });
  }, [isMuted, sourceLanguage, targetLanguage]);

  /**
   * 处理纯文本字幕（兼容非结构化消息）
   */
  const handleRawSubtitle = useCallback((text: string, uid: string) => {
    if (isMuted || !text.trim()) return;
    const segment: TranscriptionSegment = {
      id: `seg-${Date.now()}-${Math.random()}`,
      speakerUid: uid,
      speakerLabel: getSpeakerLabel(uid),
      originalText: text,
      timestamp: Date.now(),
      isFinal: true,
    };
    setSegments((prev) => [...prev, segment]);
  }, [isMuted]);

  /**
   * 根据 UID 推断发言人标签
   */
  const getSpeakerLabel = (uid: string): string => {
    if (uid === String(userId)) return userRole === 'buyer' ? 'You (Buyer)' : 'You (Factory)';
    return userRole === 'buyer' ? 'Factory' : 'Buyer';
  };

  // ── 清理 RTM 连接 ────────────────────────────────────────────────────────────

  const cleanupRtm = useCallback(async () => {
    try {
      if (rtmChannelRef.current) {
        await rtmChannelRef.current.leave();
        rtmChannelRef.current = null;
      }
      if (rtmClientRef.current) {
        await rtmClientRef.current.logout();
        rtmClientRef.current = null;
      }
      setRtmConnected(false);
    } catch (e) {
      console.warn('RTM cleanup error:', e);
    }
  }, []);

  // ── 自动滚动 ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments]);

  // ── 组件卸载清理 ─────────────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      cleanupRtm();
      if (activeTaskId) {
        stopTranslationMutation.mutate({ taskId: activeTaskId });
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 开始/停止转录 ─────────────────────────────────────────────────────────────

  const toggleTranscription = async () => {
    if (isTranscribing) {
      // 停止转录
      setIsTranscribing(false);
      onToggle?.(false);
      if (activeTaskId) {
        stopTranslationMutation.mutate({ taskId: activeTaskId });
      }
      await cleanupRtm();
    } else {
      // 启动转录
      setIsTranscribing(true);
      onToggle?.(true);

      // 1. 先建立 RTM 连接以接收字幕推送
      await initRtmConnection();

      // 2. 调用后端启动 STT 任务
      startTranslationMutation.mutate({
        channelName,
        uid: userId,
        language: sourceLanguage,
        translateLanguage: targetLanguage,
      });
    }
  };

  // ── 工具函数 ──────────────────────────────────────────────────────────────────

  const copyTranscript = () => {
    const fullText = segments
      .map((s) => {
        const line = `${s.speakerLabel}: ${s.originalText}`;
        return showTranslation && s.translatedText ? `${line}\n  → ${s.translatedText}` : line;
      })
      .join('\n');
    navigator.clipboard.writeText(fullText);
    toast.success('转录内容已复制到剪贴板');
  };

  const downloadTranscript = () => {
    const lines = segments.map((s) => {
      const time = new Date(s.timestamp).toLocaleTimeString('zh-CN');
      const line = `[${time}] ${s.speakerLabel}: ${s.originalText}`;
      return showTranslation && s.translatedText ? `${line}\n  [译] ${s.translatedText}` : line;
    });
    const content = lines.join('\n\n');
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
    element.setAttribute('download', `transcript-${channelName}-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('转录文件已下载');
  };

  const clearTranscript = () => {
    setSegments([]);
    toast.success('转录内容已清空');
  };

  const getSpeakerColor = (speakerLabel: string) => {
    if (speakerLabel.startsWith('You')) return { dot: 'bg-purple-400', text: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' };
    if (speakerLabel === 'Factory') return { dot: 'bg-orange-400', text: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' };
    return { dot: 'bg-blue-400', text: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' };
  };

  const isLoading = startTranslationMutation.isPending;

  // ── 渲染 ──────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
      {/* ── 标题栏 ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTranscribing ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
          <h3 className="text-white font-semibold text-sm">AI 实时翻译字幕</h3>
          {isTranscribing && (
            <span className="text-xs text-green-400 ml-1">
              {rtmConnected ? '● 实时推送中' : '● 连接中...'}
            </span>
          )}
          {activeTaskId && (
            <span className="text-xs text-gray-500 font-mono ml-1">
              #{activeTaskId.slice(-6)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* 设置按钮 */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className="h-7 w-7 p-0 text-gray-400 hover:text-white"
            title="语言设置"
          >
            <Languages className="w-3.5 h-3.5" />
          </Button>

          {/* 静音按钮 */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
            className="h-7 w-7 p-0 text-gray-400 hover:text-white"
            title={isMuted ? '取消静音' : '静音字幕'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </Button>

          {/* 复制 */}
          <Button
            size="sm"
            variant="ghost"
            onClick={copyTranscript}
            disabled={segments.length === 0}
            className="h-7 w-7 p-0 text-gray-400 hover:text-white"
            title="复制转录"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>

          {/* 下载 */}
          <Button
            size="sm"
            variant="ghost"
            onClick={downloadTranscript}
            disabled={segments.length === 0}
            className="h-7 w-7 p-0 text-gray-400 hover:text-white"
            title="下载转录"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>

          {/* 开始/停止 */}
          <Button
            size="sm"
            variant={isTranscribing ? 'destructive' : 'default'}
            onClick={toggleTranscription}
            disabled={isLoading}
            className="h-7 px-3 text-xs gap-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                启动中...
              </>
            ) : isTranscribing ? (
              '停止'
            ) : (
              '开启字幕'
            )}
          </Button>

          {/* 折叠 */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 p-0 text-gray-400 hover:text-white"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* ── 语言设置面板 ── */}
      {showSettings && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">识别语言：</span>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-gray-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">翻译为：</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-xs"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-gray-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showTranslation}
              onChange={(e) => setShowTranslation(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-400">显示翻译</span>
          </label>
          <p className="text-gray-500 text-xs w-full">
            ⚠️ 更改语言设置后，请重新启动字幕以生效
          </p>
        </div>
      )}

      {/* ── 转录内容 ── */}
      {isExpanded && (
        <div className="max-h-56 overflow-y-auto bg-black/30 rounded-lg p-3 space-y-2">
          {segments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-gray-500 gap-2">
              {isTranscribing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  <p className="text-xs">等待发言...</p>
                </>
              ) : (
                <>
                  <Languages className="w-5 h-5 text-gray-600" />
                  <p className="text-xs">点击"开启字幕"开始实时翻译</p>
                </>
              )}
            </div>
          ) : (
            segments.map((segment) => {
              const colors = getSpeakerColor(segment.speakerLabel);
              return (
                <div
                  key={segment.id}
                  className={`p-2.5 rounded-lg border ${colors.bg} ${!segment.isFinal ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${colors.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold ${colors.text}`}>
                          {segment.speakerLabel}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(segment.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        {!segment.isFinal && (
                          <span className="text-xs text-gray-600 italic">识别中...</span>
                        )}
                      </div>
                      {/* 原文 */}
                      <p className="text-sm text-gray-200 break-words leading-relaxed">
                        {segment.originalText}
                      </p>
                      {/* 翻译 */}
                      {showTranslation && segment.translatedText && (
                        <p className="text-xs text-gray-400 mt-1 break-words leading-relaxed border-t border-white/10 pt-1">
                          🌐 {segment.translatedText}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>
      )}

      {/* ── 底部状态栏 ── */}
      {segments.length > 0 && isExpanded && (
        <div className="flex items-center justify-between pt-1 border-t border-purple-500/20">
          <span className="text-xs text-gray-500">{segments.length} 条字幕</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={clearTranscript}
            className="text-xs text-gray-500 hover:text-white h-6 px-2"
          >
            清空
          </Button>
        </div>
      )}
    </div>
  );
}
