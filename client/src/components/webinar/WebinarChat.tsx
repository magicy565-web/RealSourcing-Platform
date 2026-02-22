import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWebinar } from '@/contexts/WebinarContext';
import { useState, useEffect, useRef } from 'react';

/**
 * WebinarChat - TikTok 弹幕风格聊天组件
 *
 * 升级内容：
 * - 支持 fomo 消息类型（橙色高亮，FOMO Engine 广播）
 * - 支持 claim 消息类型（绿色高亮，抢单成功广播）
 * - 支持 system / product_push / gift / text 原有类型
 * - 弹幕流自动滚动到最新消息
 * - 移动端友好的输入区域
 */

export function WebinarChat() {
  const { messages, sendMessage } = useWebinar();
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到最新消息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    setIsSending(true);
    try {
      await sendMessage(chatInput);
      setChatInput('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0F0F23]/80 rounded-xl border border-purple-500/20">
      {/* 消息流区域 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          // ── FOMO 消息（气氛组广播）──
          if (msg.type === 'fomo') {
            return (
              <div
                key={msg.id}
                className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl p-3 border border-orange-500/40 animate-in slide-in-from-bottom-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    LIVE
                  </span>
                  <span className="text-orange-300 text-xs font-semibold">实时动态</span>
                </div>
                <p className="text-yellow-300 text-sm font-medium">{msg.message}</p>
              </div>
            );
          }

          // ── 抢单成功消息 ──
          if (msg.type === 'claim') {
            return (
              <div
                key={msg.id}
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-3 border border-green-500/40 animate-in slide-in-from-bottom-2"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-400 text-xs font-semibold">✅ 锁单成功</span>
                </div>
                <p className="text-green-300 text-sm">{msg.message}</p>
              </div>
            );
          }

          // ── 礼物消息 ──
          if (msg.type === 'gift') {
            return (
              <div
                key={msg.id}
                className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-lg p-3 border border-orange-500/30"
              >
                <p className="text-orange-400 text-sm font-medium">
                  🎁 {msg.userName} {msg.message}
                </p>
              </div>
            );
          }

          // ── 系统消息 ──
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-gray-400 text-sm text-center">{msg.message}</p>
              </div>
            );
          }

          // ── 产品推送消息 ──
          if (msg.type === 'product_push') {
            return (
              <div
                key={msg.id}
                className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-3 border border-purple-500/30"
              >
                <p className="text-purple-400 text-sm font-medium">📦 {msg.message}</p>
              </div>
            );
          }

          // ── 普通文字消息 ──
          return (
            <div key={msg.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {msg.avatar?.slice(0, 1) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white text-sm font-medium truncate">{msg.userName}</span>
                  <span className="text-gray-500 text-xs whitespace-nowrap">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-gray-300 text-sm break-words leading-relaxed">{msg.message}</p>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-end gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说点什么..."
            disabled={isSending}
            className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-gray-600 focus:border-purple-500/50"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !chatInput.trim()}
            size="icon"
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500">按 Enter 发送</p>
      </div>
    </div>
  );
}
