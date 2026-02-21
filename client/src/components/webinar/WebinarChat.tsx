import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWebinar } from '@/contexts/WebinarContext';
import { useState, useEffect, useRef } from 'react';

export function WebinarChat() {
  const { messages, sendMessage } = useWebinar();
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
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
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.type === 'gift' ? (
              <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-lg p-3 border border-orange-500/30">
                <p className="text-orange-400 text-sm font-medium">
                  🎁 {msg.userName} {msg.message}
                </p>
              </div>
            ) : msg.type === 'system' ? (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-gray-400 text-sm text-center">{msg.message}</p>
              </div>
            ) : msg.type === 'product_push' ? (
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-3 border border-purple-500/30">
                <p className="text-purple-400 text-sm font-medium">
                  📦 {msg.message}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {msg.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-sm font-medium truncate">{msg.userName}</span>
                    <span className="text-gray-500 text-xs whitespace-nowrap">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm break-words">{msg.message}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="flex items-end gap-2">
          <Input
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something..."
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
        <p className="text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}
