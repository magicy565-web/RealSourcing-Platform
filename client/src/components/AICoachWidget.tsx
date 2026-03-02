/**
 * AICoachWidget — Global Floating AI Coach
 * A persistent floating chat widget available on all authenticated pages.
 * Features: niche-specialized AI, session memory, user-defined coach name, message feedback.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, X, Send, ThumbsUp, ThumbsDown,
  Sparkles, ChevronDown, RotateCcw, Settings, Check,
  Loader2, Bot, User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CoachMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  feedback?: "up" | "down";
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message,
  index,
  sessionId,
  coachName,
  onFeedback,
}: {
  message: CoachMessage;
  index: number;
  sessionId: number | null;
  coachName: string;
  onFeedback: (idx: number, feedback: "up" | "down") => void;
}) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex gap-2 mb-4", isAssistant ? "flex-row" : "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
        isAssistant
          ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
          : "bg-slate-600 text-slate-200"
      )}>
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-3.5 h-3.5" />}
      </div>

      <div className={cn("flex flex-col gap-1 max-w-[85%]", isAssistant ? "items-start" : "items-end")}>
        {/* Bubble */}
        <div className={cn(
          "rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isAssistant
            ? "bg-slate-800 text-slate-100 rounded-tl-sm"
            : "bg-violet-600 text-white rounded-tr-sm"
        )}>
          {/* Render markdown-like content */}
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>

        {/* Feedback buttons for assistant messages */}
        {isAssistant && sessionId && (
          <div className="flex items-center gap-1 px-1">
            <button
              onClick={() => onFeedback(index, "up")}
              className={cn(
                "p-1 rounded transition-colors",
                message.feedback === "up"
                  ? "text-green-400"
                  : "text-slate-500 hover:text-slate-300"
              )}
              title="Helpful"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => onFeedback(index, "down")}
              className={cn(
                "p-1 rounded transition-colors",
                message.feedback === "down"
                  ? "text-red-400"
                  : "text-slate-500 hover:text-slate-300"
              )}
              title="Not helpful"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Coach Name Settings Panel ────────────────────────────────────────────────

function CoachNameSettings({
  currentName,
  onSave,
  onClose,
}: {
  currentName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName);

  return (
    <div className="p-4 border-b border-slate-700 bg-slate-800/80">
      <p className="text-xs text-slate-400 mb-2">Give your AI Coach a name</p>
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Alex, Aria, Max..."
          maxLength={30}
          className="h-8 text-sm bg-slate-700 border-slate-600 text-white"
          onKeyDown={e => e.key === "Enter" && name.trim() && onSave(name.trim())}
        />
        <Button
          size="sm"
          className="h-8 px-2 bg-violet-600 hover:bg-violet-700"
          onClick={() => name.trim() && onSave(name.trim())}
        >
          <Check className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-slate-400 hover:text-white"
          onClick={onClose}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function AICoachWidget() {
  const { isAuthenticated } = useAuth();

  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFirstOpen, setIsFirstOpen] = useState(true);

  // Session State
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [coachName, setCoachName] = useState("Alex");
  const [nicheLabel, setNicheLabel] = useState("Home & Living");
  const [hasProfile, setHasProfile] = useState(false);

  // Refs
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // tRPC
  const sessionQuery = trpc.coach.getSession.useQuery(undefined, {
    enabled: isAuthenticated && isOpen,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const chatMutation = trpc.coach.chat.useMutation();
  const feedbackMutation = trpc.coach.submitFeedback.useMutation();
  const updateSettingsMutation = trpc.coach.updateSettings.useMutation();
  const clearSessionMutation = trpc.coach.clearSession.useMutation();

  // Sync session data from query
  useEffect(() => {
    if (sessionQuery.data) {
      const data = sessionQuery.data;
      setCoachName(data.coachName);
      setNicheLabel(data.nicheLabel);
      setHasProfile(data.hasProfile);
      if (data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
        setMessages(data.messages as CoachMessage[]);
      }
    }
  }, [sessionQuery.data]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Send message
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isSending) return;

    setInputValue("");
    setIsSending(true);

    // Optimistically add user message
    const userMsg: CoachMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const result = await chatMutation.mutateAsync({
        sessionId,
        message: text,
      });

      setSessionId(result.sessionId);

      const assistantMsg: CoachMessage = {
        role: "assistant",
        content: result.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      toast.error("Failed to send message. Please try again in a moment.");
      // Remove the optimistic message on error
      setMessages(prev => prev.slice(0, -1));
      setInputValue(text);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [inputValue, isSending, sessionId, chatMutation, toast]);

  // Handle feedback
  const handleFeedback = useCallback(async (messageIdx: number, feedback: "up" | "down") => {
    if (!sessionId) return;
    setMessages(prev => prev.map((m, i) =>
      i === messageIdx ? { ...m, feedback } : m
    ));
    try {
      await feedbackMutation.mutateAsync({ sessionId, messageIdx, feedback });
    } catch {
      // Silent fail for feedback
    }
  }, [sessionId, feedbackMutation]);

  // Handle coach name save
  const handleSaveCoachName = useCallback(async (name: string) => {
    try {
      await updateSettingsMutation.mutateAsync({ coachName: name });
      setCoachName(name);
      setShowSettings(false);
      toast.success(`Coach renamed to "${name}"`);
    } catch {
      toast.error("Failed to update name");
    }
  }, [updateSettingsMutation]);

  // Handle clear session
  const handleClearSession = useCallback(async () => {
    try {
      await clearSessionMutation.mutateAsync();
      setSessionId(null);
      setMessages([]);
      toast.success("Conversation cleared");
    } catch {
      toast.error("Failed to clear conversation");
    }
  }, [clearSessionMutation]);

  // Handle open
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsFirstOpen(false);
  }, []);

  if (!isAuthenticated) return null;

  // Welcome message for empty sessions
  const welcomeMessage = hasProfile
    ? `Hi! I'm ${coachName}, your ${nicheLabel} sourcing coach. Ask me anything about finding suppliers, dropshipping strategy, or using RealSourcing — I'm here to help you grow.`
    : `Hi! I'm ${coachName}, your AI sourcing coach. Complete your business profile first so I can give you personalized advice for your niche!`;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open AI Coach"
        >
          <div className="relative">
            {/* Pulse ring for first-time users */}
            {isFirstOpen && (
              <span className="absolute inset-0 rounded-full bg-violet-500 animate-ping opacity-40" />
            )}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-500/30 flex items-center justify-center transition-transform group-hover:scale-110">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            {/* Coach name tooltip */}
            <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-slate-800 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                Chat with {coachName}
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl shadow-2xl shadow-black/40 overflow-hidden border border-slate-700 bg-slate-900">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-sm leading-tight">{coachName}</div>
                <div className="text-violet-200 text-xs leading-tight">{nicheLabel} Coach</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px] border-violet-400/50 text-violet-200 px-1.5 py-0">
                AI
              </Badge>
              <button
                onClick={() => setShowSettings(s => !s)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                title="Rename coach"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClearSession}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                title="Clear conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Coach Name Settings */}
          {showSettings && (
            <CoachNameSettings
              currentName={coachName}
              onSave={handleSaveCoachName}
              onClose={() => setShowSettings(false)}
            />
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 h-[380px] px-4 py-3" ref={scrollAreaRef}>
            {/* Welcome message */}
            <div className="flex gap-2 mb-4">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-800 text-slate-100 rounded-2xl rounded-tl-sm px-3 py-2 text-sm leading-relaxed max-w-[85%]">
                {welcomeMessage}
              </div>
            </div>

            {/* Conversation messages */}
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg}
                index={idx}
                sessionId={sessionId}
                coachName={coachName}
                onFeedback={handleFeedback}
              />
            ))}

            {/* Typing indicator */}
            {isSending && (
              <div className="flex gap-2 mb-4">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-3 py-2">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Suggested prompts (shown when no messages) */}
          {messages.length === 0 && !isSending && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {[
                "How do I find furniture suppliers?",
                "What's a good profit margin?",
                "How does RealSourcing work?",
              ].map(prompt => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInputValue(prompt);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full px-2.5 py-1 transition-colors border border-slate-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="px-3 py-3 border-t border-slate-700 bg-slate-900">
            <div className="flex gap-2 items-end">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Ask ${coachName} anything...`}
                className="flex-1 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 text-sm rounded-xl focus:ring-violet-500 focus:border-violet-500"
                disabled={isSending}
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                size="sm"
                className="h-9 w-9 p-0 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 flex-shrink-0"
              >
                {isSending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </Button>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 text-center">
              Specialized in {nicheLabel} sourcing & dropshipping
            </p>
          </div>
        </div>
      )}
    </>
  );
}
