/**
 * Agora Real-time Transcription Component
 * 声网实时转录组件 - 用于会议中的 AI 实时转录和字幕
 */

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Loader2, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

interface TranscriptionSegment {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

interface AgoraTranscriptionProps {
  channelName: string;
  isActive?: boolean;
  onToggle?: (active: boolean) => void;
}

export function AgoraTranscription({ channelName, isActive = false, onToggle }: AgoraTranscriptionProps) {
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(isActive);
  const [isMuted, setIsMuted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新转录
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [segments]);

  // 模拟实时转录数据（实际应该从 Agora 服务接收）
  useEffect(() => {
    if (!isTranscribing) return;

    // 这是一个演示实现，实际应该通过 WebSocket 或其他方式接收真实转录数据
    const mockTranscriptions = [
      { speaker: 'Factory', text: 'This is our new product line...' },
      { speaker: 'Buyer', text: 'What is the MOQ?' },
      { speaker: 'Factory', text: 'The minimum order quantity is 1000 units' },
      { speaker: 'Buyer', text: 'Can you provide samples?' },
      { speaker: 'Factory', text: 'Yes, we can send samples within 2 days' },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < mockTranscriptions.length) {
        const mock = mockTranscriptions[index];
        setSegments((prev) => [
          ...prev,
          {
            id: `seg-${Date.now()}-${index}`,
            speaker: mock.speaker,
            text: mock.text,
            timestamp: Date.now(),
            isFinal: true,
          },
        ]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isTranscribing]);

  const toggleTranscription = () => {
    const newState = !isTranscribing;
    setIsTranscribing(newState);
    onToggle?.(newState);
    toast.success(newState ? 'Transcription started' : 'Transcription stopped');
  };

  const copyTranscript = () => {
    const fullText = segments.map((s) => `${s.speaker}: ${s.text}`).join('\n');
    navigator.clipboard.writeText(fullText);
    toast.success('Transcript copied to clipboard');
  };

  const downloadTranscript = () => {
    const fullText = segments.map((s) => `[${new Date(s.timestamp).toLocaleTimeString()}] ${s.speaker}: ${s.text}`).join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(fullText)}`);
    element.setAttribute('download', `transcript-${channelName}-${Date.now()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Transcript downloaded');
  };

  const clearTranscript = () => {
    setSegments([]);
    toast.success('Transcript cleared');
  };

  return (
    <div className="flex flex-col gap-4 bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
      {/* 标题和控制栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          <h3 className="text-white font-semibold text-sm">AI Real-time Transcription</h3>
          {isTranscribing && (
            <span className="text-xs text-purple-400 ml-2">Recording...</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isTranscribing ? 'default' : 'outline'}
            onClick={toggleTranscription}
            className="gap-1"
          >
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Stop
              </>
            ) : (
              'Start'
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="gap-1"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={copyTranscript}
            disabled={segments.length === 0}
            title="Copy"
            className="gap-1"
          >
            <Copy className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={downloadTranscript}
            disabled={segments.length === 0}
            title="Download"
            className="gap-1"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 转录内容 */}
      <div className="flex-1 max-h-64 overflow-y-auto bg-black/30 rounded-lg p-4 space-y-3">
        {segments.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p className="text-sm">No transcription yet. Click "Start" to begin recording.</p>
          </div>
        ) : (
          segments.map((segment) => (
            <div
              key={segment.id}
              className={`p-3 rounded-lg border ${
                segment.speaker === 'Factory'
                  ? 'bg-orange-500/10 border-orange-500/20'
                  : 'bg-purple-500/10 border-purple-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                    segment.speaker === 'Factory' ? 'bg-orange-400' : 'bg-purple-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        segment.speaker === 'Factory' ? 'text-orange-400' : 'text-purple-400'
                      }`}
                    >
                      {segment.speaker}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(segment.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 break-words">{segment.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* 底部操作 */}
      {segments.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-purple-500/20">
          <span className="text-xs text-gray-400">{segments.length} segments</span>
          <Button
            size="sm"
            variant="outline"
            onClick={clearTranscript}
            className="text-xs"
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
