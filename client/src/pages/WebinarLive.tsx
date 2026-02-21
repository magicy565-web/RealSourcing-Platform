import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import {
  Heart, Share2, Hand, Sparkles, Send, Users, MessageSquare, Package,
  Volume2, VolumeX, Maximize2, Settings, ChevronRight, Star, ShoppingCart,
  ExternalLink, Wifi, ArrowLeft, Eye, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

type TabType = "chat" | "products" | "participants";

interface ChatMessage {
  id: number;
  userId: number;
  userName: string;
  avatar: string;
  message: string;
  timestamp: Date;
  type: "text" | "product_push" | "system";
  product?: { id: number; name: string; price: string; image: string };
}

export default function WebinarLive() {
  const { id } = useParams<{ id: string }>();
  const webinarId = parseInt(id || "1", 10);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1, userId: 0, userName: "System", avatar: "SY",
      message: "Welcome to the live session! Ask your questions below.",
      timestamp: new Date(Date.now() - 60000), type: "system"
    },
  ]);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: webinar, isLoading } = trpc.webinars.byId.useQuery({ id: webinarId });
  const { data: likeCountData } = trpc.webinarLive.likeCount.useQuery({ webinarId });
  const { data: likeStatus } = trpc.webinarLive.checkLike.useQuery({ webinarId });

  const likeMutation = trpc.webinarLive.like.useMutation({
    onSuccess: () => { setLiked(true); setLikeCount((c) => c + 1); toast.success("Liked!"); },
    onError: () => toast.error("Failed to like"),
  });
  const unlikeMutation = trpc.webinarLive.unlike.useMutation({
    onSuccess: () => { setLiked(false); setLikeCount((c) => Math.max(0, c - 1)); },
    onError: () => toast.error("Failed to unlike"),
  });
  const raiseHandMutation = trpc.webinarLive.raiseHand.useMutation({
    onSuccess: () => toast.info(handRaised ? "Hand lowered" : "Hand raised! The host will notice you."),
    onError: () => toast.error("Failed to raise hand"),
  });
  const favoriteMutation = trpc.favorites.toggle.useMutation();

  useEffect(() => {
    if (likeCountData !== undefined) setLikeCount(likeCountData);
  }, [likeCountData]);
  useEffect(() => {
    if (likeStatus !== undefined) setLiked(likeStatus);
  }, [likeStatus]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now(),
      userId: user?.id || 0,
      userName: user?.name || "You",
      avatar: (user?.name || "Y").slice(0, 2).toUpperCase(),
      message: chatInput,
      timestamp: new Date(),
      type: "text",
    };
    setMessages((prev) => [...prev, newMsg]);
    setChatInput("");
  };

  const handleLike = () => {
    if (liked) {
      unlikeMutation.mutate({ webinarId });
    } else {
      likeMutation.mutate({ webinarId });
    }
  };

  const handleRaiseHand = () => {
    setHandRaised(!handRaised);
    raiseHandMutation.mutate({ webinarId });
  };

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((i) => i !== productId) : [...prev, productId]
    );
    favoriteMutation.mutate({ targetType: "product", targetId: productId });
  };

  const products = webinar?.products ?? [];
  const participants = webinar?.participants ?? [];
  const viewerCount = webinar?.participantCount ?? 0;
  const factoryName = webinar?.factory?.name ?? webinar?.host?.name ?? "Factory Host";
  const factoryCity = webinar?.factory?.city ?? "Shenzhen";
  const factoryCountry = webinar?.factory?.country ?? "China";
  const factoryInitials = factoryName.slice(0, 2).toUpperCase();
  const factoryId = webinar?.factory?.id;

  const tabCounts = {
    chat: messages.length,
    products: products.length,
    participants: participants.length || viewerCount,
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading live session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2.5 bg-black/60 backdrop-blur border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setLocation("/webinars")} className="text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-white">RS</span>
            </div>
            <span className="font-semibold text-sm hidden sm:block">RealSourcing</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 animate-pulse">LIVE</Badge>
            <span className="text-sm font-medium truncate max-w-48">
              {webinar?.title ?? "Live Factory Showcase"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span>{viewerCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Wifi className="w-3.5 h-3.5" />
            <span>HD</span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col relative bg-black">
          <div className="flex-1 relative bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
            <div className="text-center z-10">
              <div className="w-24 h-24 bg-purple-600/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500/50">
                <span className="text-3xl">🏭</span>
              </div>
              <p className="text-white/60 text-sm">Live stream from factory floor</p>
              <p className="text-white/40 text-xs mt-1">{factoryCity}, {factoryCountry}</p>
            </div>

            <div className="absolute top-4 left-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {factoryInitials}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{factoryName}</p>
                <p className="text-white/60 text-xs">{factoryCity}, {factoryCountry}</p>
              </div>
            </div>

            <div className="absolute bottom-16 left-0 right-0 flex justify-center px-8">
              <div className="bg-black/70 backdrop-blur rounded-lg px-4 py-2 max-w-xl text-center">
                <p className="text-white text-sm">
                  {webinar?.description
                    ? webinar.description.slice(0, 100) + (webinar.description.length > 100 ? "..." : "")
                    : "Welcome to our live factory showcase!"}
                </p>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-9 h-9 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button className="w-9 h-9 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <button className="w-9 h-9 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 bg-black/80 backdrop-blur border-t border-white/10">
            <div className="flex-1 flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Say something..."
                className="border-0 bg-transparent text-white placeholder:text-white/40 text-sm p-0 h-auto focus-visible:ring-0"
              />
              <button onClick={handleSendMessage} className="text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0">
                <Send className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleLike}
              disabled={likeMutation.isPending || unlikeMutation.isPending}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium",
                liked ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/70 hover:bg-white/20"
              )}
            >
              <Heart className={cn("w-4 h-4", liked && "fill-current")} />
              <span>{likeCount}</span>
            </button>

            <button
              onClick={handleRaiseHand}
              disabled={raiseHandMutation.isPending}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium",
                handRaised ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 text-white/70 hover:bg-white/20"
              )}
            >
              <Hand className="w-4 h-4" />
              <span className="hidden sm:inline">{handRaised ? "Lower Hand" : "Raise Hand"}</span>
            </button>

            <button
              onClick={() => setLocation(`/ai-reel-editor/${id}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg shadow-purple-600/30"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Generate Reel</span>
            </button>

            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        <div className="w-80 flex flex-col bg-[#0f0f1a] border-l border-white/10">
          <div className="flex border-b border-white/10">
            {(["chat", "products", "participants"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-wider transition-all",
                  activeTab === tab
                    ? "text-purple-400 border-b-2 border-purple-500"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                {tab === "chat" && <MessageSquare className="w-3.5 h-3.5" />}
                {tab === "products" && <Package className="w-3.5 h-3.5" />}
                {tab === "participants" && <Users className="w-3.5 h-3.5" />}
                <span>{tab}</span>
                <span className="bg-white/10 text-white/60 rounded-full px-1.5 py-0.5 text-[10px]">
                  {tabCounts[tab]}
                </span>
              </button>
            ))}
          </div>

          {activeTab === "chat" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.type === "system" && (
                    <div className="text-center text-xs text-muted-foreground py-1 bg-white/5 rounded-lg px-2">
                      {msg.message}
                    </div>
                  )}
                  {msg.type === "product_push" && msg.product && (
                    <div className="bg-gradient-to-r from-purple-900/40 to-purple-800/20 border border-purple-500/30 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs text-white font-bold">
                          {msg.avatar}
                        </div>
                        <span className="text-xs font-semibold text-purple-300">{msg.userName}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-black/30 rounded-lg p-2">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-xl">📦</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{msg.product.name}</p>
                          <p className="text-purple-400 text-sm font-bold">{msg.product.price}</p>
                        </div>
                        <Link href={`/product/${msg.product.id}`}>
                          <Button size="sm" className="text-xs bg-purple-600 hover:bg-purple-500 h-7 px-2">
                            View <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                  {msg.type === "text" && (
                    <div className={cn("flex gap-2", msg.userId === (user?.id || 0) && "flex-row-reverse")}>
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        msg.userId === (user?.id || 0) ? "bg-purple-600 text-white" : "bg-white/20 text-white"
                      )}>
                        {msg.avatar}
                      </div>
                      <div className={cn(
                        "max-w-[200px] flex flex-col gap-0.5",
                        msg.userId === (user?.id || 0) ? "items-end" : "items-start"
                      )}>
                        <span className="text-[10px] text-muted-foreground px-1">{msg.userName}</span>
                        <div className={cn(
                          "px-3 py-1.5 rounded-2xl text-sm",
                          msg.userId === (user?.id || 0) ? "bg-purple-600 text-white" : "bg-white/10 text-white"
                        )}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}

          {activeTab === "products" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{products.length} products showcased</span>
                {factoryId && (
                  <Link href={`/factory/${factoryId}`}>
                    <span className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer flex items-center gap-1">
                      View All <ChevronRight className="w-3 h-3" />
                    </span>
                  </Link>
                )}
              </div>
              {products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No products listed yet</p>
                </div>
              ) : (
                products.map((product: any) => (
                  <div key={product.id} className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl p-3 transition-all">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                        📦
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category ?? "General"}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-yellow-400">4.8</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2.5">
                      <div>
                        <span className="text-purple-400 font-bold text-sm">Inquire for price</span>
                        <p className="text-xs text-muted-foreground">MOQ: 100+ units</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => toggleFavorite(product.id)}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            favorites.includes(product.id) ? "bg-red-500/20 text-red-400" : "bg-white/10 text-muted-foreground hover:bg-white/20"
                          )}
                        >
                          <Heart className={cn("w-4 h-4", favorites.includes(product.id) && "fill-current")} />
                        </button>
                        <Link href={`/product/${product.id}`}>
                          <button className="w-8 h-8 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-lg flex items-center justify-center transition-all">
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "participants" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="text-xs text-muted-foreground mb-3">
                {viewerCount} participants online
              </div>
              <div className="flex items-center gap-3 py-2 px-2 rounded-lg bg-purple-600/10 border border-purple-500/20">
                <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0 text-white">
                  {factoryInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate">{factoryName}</span>
                    <Badge className="bg-purple-600/20 text-purple-300 text-[10px] px-1.5 py-0">Host</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{factoryCity}, {factoryCountry}</p>
                </div>
              </div>
              {participants.length > 0 ? (
                participants.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-all">
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0 text-white">
                      {(p.user?.name ?? "U").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white truncate block">
                        {p.user?.name ?? "Participant"}
                      </span>
                      <p className="text-xs text-muted-foreground">Registered</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground text-xs">
                  {viewerCount > 0 ? `${viewerCount} viewers watching` : "No participants yet"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
