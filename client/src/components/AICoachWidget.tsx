/**
 * AICoachWidget — Global Floating AI Coach
 * Upgraded: proactive new-batch notification + in-chat opportunity cards
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  X, Send, ThumbsUp, ThumbsDown,
  Sparkles, ChevronDown, RotateCcw, Settings, Check,
  Loader2, Bot, User, Radar, TrendingUp, DollarSign,
  ArrowUpRight, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { getPersonalizedWidgetGreeting } from "@/lib/aiPersonalization";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OpportunityCard {
  id: number;
  name: string;
  factoryName?: string;
  opportunityScore: number;
  estimatedMargin?: string;
  priceMin?: number;
  priceMax?: number;
  moq?: number;
  headline?: string;
  coverImage?: string;
  tags?: string[];
}

interface CoachMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  feedback?: "up" | "down";
  opportunityCards?: OpportunityCard[];
}

// ─── Mini Opportunity Card (in-chat) ─────────────────────────────────────────

function MiniOpportunityCard({ card, onNavigate }: { card: OpportunityCard; onNavigate: () => void }) {
  const scoreColor =
    card.opportunityScore >= 75 ? "text-purple-400" :
    card.opportunityScore >= 55 ? "text-amber-400" : "text-slate-400";

  return (
    <div
      className="bg-slate-700/50 border border-slate-600 rounded-xl overflow-hidden mt-2 hover:border-purple-500/50 transition-all cursor-pointer group"
      onClick={onNavigate}
    >
      {/* Cover */}
      <div className="h-20 bg-gradient-to-br from-purple-900/30 to-slate-800 relative overflow-hidden">
        {card.coverImage ? (
          <img
            src={card.coverImage}
            alt={card.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-7 h-7 text-slate-600" />
          </div>
        )}
        <div className={cn(
          "absolute top-2 right-2 px-1.5 py-0.5 bg-slate-900/80 rounded-full text-[10px] font-bold",
          scoreColor
        )}>
          {card.opportunityScore}pt
        </div>
      </div>
      {/* Info */}
      <div className="p-2.5">
        <p className="text-xs font-semibold text-white line-clamp-1 mb-0.5">{card.name}</p>
        {card.factoryName && (
          <p className="text-[10px] text-slate-400 mb-1.5">{card.factoryName}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            {card.priceMin != null && (
              <span className="flex items-center gap-0.5">
                <DollarSign className="w-2.5 h-2.5" />
                ${card.priceMin}{card.priceMax ? `–$${card.priceMax}` : ""}
              </span>
            )}
            {card.estimatedMargin && (
              <span className="flex items-center gap-0.5 text-emerald-400">
                <TrendingUp className="w-2.5 h-2.5" />
                {card.estimatedMargin}
              </span>
            )}
          </div>
          <ArrowUpRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        {card.tags && card.tags.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {card.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1 py-0.5 bg-purple-600/20 text-purple-400 text-[9px] rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message, index, sessionId, coachName, onFeedback, onNavigateRadar,
}: {
  message: CoachMessage;
  index: number;
  sessionId: number | null;
  coachName: string;
  onFeedback: (idx: number, feedback: "up" | "down") => void;
  onNavigateRadar: () => void;
}) {
  const isAssistant = message.role === "assistant";

  return (
    <div className={cn("flex gap-2 mb-4", isAssistant ? "flex-row" : "flex-row-reverse")}>
      <div className={cn(
        "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
        isAssistant
          ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
          : "bg-slate-600 text-slate-200"
      )}>
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-3.5 h-3.5" />}
      </div>

      <div className={cn("flex flex-col gap-1 max-w-[85%]", isAssistant ? "items-start" : "items-end")}>
        <div className={cn(
          "rounded-2xl px-3 py-2 text-sm leading-relaxed",
          isAssistant
            ? "bg-slate-800 text-slate-100 rounded-tl-sm"
            : "bg-violet-600 text-white rounded-tr-sm"
        )}>
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        </div>

        {/* Opportunity Cards */}
        {isAssistant && message.opportunityCards && message.opportunityCards.length > 0 && (
          <div className="w-full space-y-1">
            {message.opportunityCards.map(card => (
              <MiniOpportunityCard key={card.id} card={card} onNavigate={onNavigateRadar} />
            ))}
            <p className="text-[10px] text-slate-500 px-1">
              Tap a card to explore on Opportunity Radar →
            </p>
          </div>
        )}

        {/* Feedback */}
        {isAssistant && sessionId && (
          <div className="flex items-center gap-1 px-1">
            <button
              onClick={() => onFeedback(index, "up")}
              className={cn(
                "p-1 rounded transition-colors",
                message.feedback === "up" ? "text-green-400" : "text-slate-500 hover:text-slate-300"
              )}
              title="Helpful"
            >
              <ThumbsUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => onFeedback(index, "down")}
              className={cn(
                "p-1 rounded transition-colors",
                message.feedback === "down" ? "text-red-400" : "text-slate-500 hover:text-slate-300"
              )}
              title="Not helpful"
            >
              <ThumbsDown className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-slate-600 ml-1">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── New Batch Notification Bubble ───────────────────────────────────────────

function NewBatchNotification({ count, onView, onDismiss }: {
  count: number;
  onView: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-24 right-6 z-50 w-72 bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-900/30 overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600/30 to-violet-600/20 px-4 py-3 flex items-center justify-between border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-600/30 flex items-center justify-center">
            <Radar className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">New Opportunities!</p>
            <p className="text-[10px] text-purple-300">Fresh batch analyzed</p>
          </div>
        </div>
        <button onClick={onDismiss} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <p className="text-sm text-slate-200">
            <span className="font-semibold text-purple-300">{count} new products</span> analyzed for your niche
          </p>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          AI has identified high-potential opportunities in furniture & home living. Check them out before your competitors do.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <Radar className="w-3.5 h-3.5" />
            View Radar
          </button>
          <button
            onClick={onDismiss}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-400 text-xs rounded-xl transition-all"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Coach Name Settings ──────────────────────────────────────────────────────

function CoachNameSettings({ currentName, onSave, onClose }: {
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
        <Button size="sm" className="h-8 px-2 bg-violet-600 hover:bg-violet-700"
          onClick={() => name.trim() && onSave(name.trim())}>
          <Check className="w-3.5 h-3.5" />
        </Button>
        <Button size="sm" variant="ghost" className="h-8 px-2 text-slate-400 hover:text-white"
          onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export function AICoachWidget() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // UI State
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  const [showBatchNotif, setShowBatchNotif] = useState(false);
  const [notifDismissed, setNotifDismissed] = useState(false);

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

  const batchQuery = trpc.opportunityRadar.getLatestBatch.useQuery(
    { niche: "furniture" },
    {
      enabled: isAuthenticated,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60_000,
    }
  );

  // Business profile for personalized greeting
  const { data: businessProfile } = trpc.businessProfile.get.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const chatMutation = trpc.coach.chat.useMutation();
  const feedbackMutation = trpc.coach.submitFeedback.useMutation();
  const updateSettingsMutation = trpc.coach.updateSettings.useMutation();
  const clearSessionMutation = trpc.coach.clearSession.useMutation();
  const markBatchSeenMutation = trpc.opportunityRadar.markBatchSeen.useMutation();

  // Sync session data
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

  // Show new batch notification (2s delay after login)
  useEffect(() => {
    if (batchQuery.data?.hasNewOpportunities && !notifDismissed && !isOpen) {
      const timer = setTimeout(() => setShowBatchNotif(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [batchQuery.data?.hasNewOpportunities, notifDismissed, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const handleSend = useCallback(async (overrideText?: string) => {
    const text = overrideText || inputValue.trim();
    if (!text || isSending) return;
    setInputValue("");
    setIsSending(true);

    const userMsg: CoachMessage = { role: "user", content: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const result = await chatMutation.mutateAsync({ sessionId, message: text });
      setSessionId(result.sessionId);
      const assistantMsg: CoachMessage = {
        role: "assistant",
        content: result.reply,
        timestamp: new Date().toISOString(),
        opportunityCards: result.opportunityCards as OpportunityCard[] | undefined,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      toast.error("Failed to send message. Please try again.");
      setMessages(prev => prev.slice(0, -1));
      setInputValue(text);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [inputValue, isSending, sessionId, chatMutation]);

  const handleFeedback = useCallback(async (messageIdx: number, feedback: "up" | "down") => {
    if (!sessionId) return;
    setMessages(prev => prev.map((m, i) => i === messageIdx ? { ...m, feedback } : m));
    try {
      await feedbackMutation.mutateAsync({ sessionId, messageIdx, feedback });
    } catch { /* silent */ }
  }, [sessionId, feedbackMutation]);

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

  const handleViewRadar = useCallback(() => {
    setShowBatchNotif(false);
    setNotifDismissed(true);
    const batchId = batchQuery.data?.batch?.id;
    if (batchId) markBatchSeenMutation.mutate({ batchId });
    setLocation("/opportunity-radar");
  }, [batchQuery.data, markBatchSeenMutation, setLocation]);

  const handleDismissNotif = useCallback(() => {
    setShowBatchNotif(false);
    setNotifDismissed(true);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsFirstOpen(false);
    setShowBatchNotif(false);
  }, []);

  if (!isAuthenticated) return null;

  const newBatchCount = batchQuery.data?.newCount || 0;
  const hasNewOpps = batchQuery.data?.hasNewOpportunities && !notifDismissed;

  // Personalized greeting based on business profile
  const personalizedGreeting = getPersonalizedWidgetGreeting(
    coachName,
    businessProfile ? {
      ambition: businessProfile.ambition,
      businessStage: businessProfile.businessStage,
      budget: businessProfile.budget,
      mainChallenge: businessProfile.mainChallenge,
      targetPlatforms: businessProfile.targetPlatforms,
      interestedNiches: businessProfile.interestedNiches,
    } : null,
    nicheLabel,
  );
  const welcomeMessage = personalizedGreeting.message;
  const personalizedSuggestedPrompts = personalizedGreeting.suggestedPrompts;

  return (
    <>
      {/* New Batch Notification */}
      {showBatchNotif && !isOpen && (
        <NewBatchNotification
          count={newBatchCount}
          onView={handleViewRadar}
          onDismiss={handleDismissNotif}
        />
      )}

      {/* Floating Button */}
      {!isOpen && (
        <button onClick={handleOpen} className="fixed bottom-6 right-6 z-50 group" aria-label="Open AI Coach">
          <div className="relative">
            {isFirstOpen && (
              <span className="absolute inset-0 rounded-full bg-violet-500 animate-ping opacity-40" />
            )}
            {/* New batch badge */}
            {hasNewOpps && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-purple-500 border-2 border-slate-950 flex items-center justify-center z-10">
                <span className="text-[9px] text-white font-bold">{Math.min(newBatchCount, 9)}+</span>
              </span>
            )}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-500/30 flex items-center justify-center transition-transform group-hover:scale-110">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
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
              <Badge variant="outline" className="text-[10px] border-violet-400/50 text-violet-200 px-1.5 py-0">AI</Badge>
              {hasNewOpps && (
                <button
                  onClick={handleViewRadar}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/30 hover:bg-purple-500/50 transition-colors text-purple-200 text-[10px] font-medium"
                >
                  <Radar className="w-3 h-3" />
                  {newBatchCount} new
                </button>
              )}
              <button onClick={() => setShowSettings(s => !s)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white">
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleClearSession} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white" title="Clear conversation">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Coach Name Settings */}
          {showSettings && (
            <CoachNameSettings currentName={coachName} onSave={handleSaveCoachName} onClose={() => setShowSettings(false)} />
          )}

          {/* New batch banner inside chat */}
          {hasNewOpps && (
            <div className="px-3 py-2 bg-purple-900/30 border-b border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[11px] text-purple-300">
                  <span className="font-semibold">{newBatchCount} new opportunities</span> in your niche
                </span>
              </div>
              <button onClick={handleViewRadar} className="text-[10px] text-purple-400 hover:text-purple-300 underline transition-colors">
                View Radar →
              </button>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 h-[360px] px-4 py-3" ref={scrollAreaRef}>
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
                onNavigateRadar={handleViewRadar}
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

          {/* Personalized Suggested Prompts */}
          {messages.length === 0 && !isSending && (
            <div className="px-4 pb-3">
              <p className="text-[10px] text-slate-500 mb-1.5 font-medium uppercase tracking-wider">Try asking:</p>
              <div className="flex flex-col gap-1.5">
                {personalizedSuggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt)}
                    className="text-left text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl px-3 py-2 transition-all border border-slate-700 hover:border-violet-500/40 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500/60 group-hover:bg-violet-400 flex-shrink-0 transition-colors" />
                    {prompt}
                  </button>
                ))}
              </div>
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
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isSending}
                size="sm"
                className="h-9 w-9 p-0 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 flex-shrink-0"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
