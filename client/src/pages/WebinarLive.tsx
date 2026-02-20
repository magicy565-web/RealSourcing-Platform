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
  ExternalLink, Wifi, WifiOff, ArrowLeft, Eye
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
  product?: {
    id: number;
    name: string;
    price: string;
    image: string;
  };
}

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: 1, userId: 2, userName: "Sarah M.", avatar: "SM", message: "What's the MOQ for the headphones?",
    timestamp: new Date(Date.now() - 120000), type: "text"
  },
  {
    id: 2, userId: 3, userName: "Factory Host", avatar: "FH",
    message: "Minimum order is 100 units for standard colors, 500 units for custom colors.",
    timestamp: new Date(Date.now() - 90000), type: "text"
  },
  {
    id: 3, userId: 0, userName: "System", avatar: "SY",
    message: "🎉 Factory just pushed a featured product!",
    timestamp: new Date(Date.now() - 60000), type: "system"
  },
  {
    id: 4, userId: 3, userName: "Factory Host", avatar: "FH",
    message: "Check out our best seller 👇",
    timestamp: new Date(Date.now() - 55000), type: "product_push",
    product: { id: 1, name: "ANC 3.0 Headphones", price: "$45/unit", image: "" }
  },
  {
    id: 5, userId: 4, userName: "James K.", avatar: "JK",
    message: "Do you have CE and FCC certifications?",
    timestamp: new Date(Date.now() - 30000), type: "text"
  },
  {
    id: 6, userId: 3, userName: "Factory Host", avatar: "FH",
    message: "Yes! We have CE, FCC, RoHS and ISO9001. Certificates available on request.",
    timestamp: new Date(Date.now() - 15000), type: "text"
  },
];

const MOCK_PRODUCTS = [
  { id: 1, name: "ANC 3.0 Headphones", color: "Midnight Black", price: "$45", moq: "100 units", rating: 4.8, image: "" },
  { id: 2, name: "TWS Earbuds Pro", color: "Pearl White", price: "$28", moq: "200 units", rating: 4.6, image: "" },
  { id: 3, name: "Gaming Headset X1", color: "RGB Black", price: "$62", moq: "50 units", rating: 4.9, image: "" },
  { id: 4, name: "Wireless Speaker", color: "Ocean Blue", price: "$38", moq: "150 units", rating: 4.5, image: "" },
];

const MOCK_PARTICIPANTS = [
  { id: 1, name: "Sarah Mitchell", company: "TechBuy Inc.", country: "🇺🇸", role: "buyer" },
  { id: 2, name: "James Kim", company: "K-Trade Co.", country: "🇰🇷", role: "buyer" },
  { id: 3, name: "Emma Wilson", company: "EW Sourcing", country: "🇬🇧", role: "buyer" },
  { id: 4, name: "Carlos Rivera", company: "MX Imports", country: "🇲🇽", role: "buyer" },
  { id: 5, name: "Priya Sharma", company: "IndiaSource", country: "🇮🇳", role: "buyer" },
  { id: 6, name: "Liu Wei", company: "SZ Electronics", country: "🇨🇳", role: "factory" },
];

export default function WebinarLive() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [likeCount, setLikeCount] = useState(234);
  const [liked, setLiked] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [viewerCount] = useState(127);
  const [favorites, setFavorites] = useState<number[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: webinar } = trpc.webinars.byId.useQuery({ id: parseInt(id || "1") });

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
    setLiked(!liked);
    setLikeCount((c) => liked ? c - 1 : c + 1);
    if (!liked) {
      // 飞心动画
      toast.success("❤️ Liked!");
    }
  };

  const handleRaiseHand = () => {
    setHandRaised(!handRaised);
    toast.info(handRaised ? "Hand lowered" : "✋ Hand raised! The host will notice you.");
  };

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const tabCounts = { chat: messages.length, products: MOCK_PRODUCTS.length, participants: MOCK_PARTICIPANTS.length };

  return (
    <div className="h-screen bg-[#0a0a0f] flex flex-col overflow-hidden">
      {/* 顶部导航栏 */}
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
            <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 animate-pulse">● LIVE</Badge>
            <span className="text-sm font-medium truncate max-w-48">
              {webinar?.title || "Shenzhen Electronics Factory Showcase"}
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

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 视频区 */}
        <div className="flex-1 flex flex-col relative bg-black">
          {/* 视频播放器 */}
          <div className="flex-1 relative bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
            {/* 模拟视频画面 */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-blue-900/20" />
            <div className="text-center z-10">
              <div className="w-24 h-24 bg-purple-600/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-500/50">
                <span className="text-3xl">🏭</span>
              </div>
              <p className="text-white/60 text-sm">Live stream from factory floor</p>
              <p className="text-white/40 text-xs mt-1">Shenzhen, China</p>
            </div>

            {/* 工厂信息叠加 */}
            <div className="absolute top-4 left-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                SZ
              </div>
              <div>
                <p className="text-white font-semibold text-sm">SZ Electronics Co., Ltd</p>
                <p className="text-white/60 text-xs">Shenzhen, Guangdong</p>
              </div>
            </div>

            {/* 字幕 */}
            <div className="absolute bottom-16 left-0 right-0 flex justify-center px-8">
              <div className="bg-black/70 backdrop-blur rounded-lg px-4 py-2 max-w-xl text-center">
                <p className="text-white text-sm">
                  "...and as you can see, our ANC 3.0 headphones feature the latest noise cancellation technology..."
                </p>
              </div>
            </div>

            {/* 视频控制栏 */}
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

          {/* 底部工具栏 */}
          <div className="flex items-center gap-2 px-4 py-3 bg-black/80 backdrop-blur border-t border-white/10">
            {/* 聊天输入框 */}
            <div className="flex-1 flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Say something..."
                className="border-0 bg-transparent text-white placeholder:text-white/40 text-sm p-0 h-auto focus-visible:ring-0"
              />
              <button
                onClick={handleSendMessage}
                className="text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* 点赞 */}
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium",
                liked ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/70 hover:bg-white/20"
              )}
            >
              <Heart className={cn("w-4 h-4", liked && "fill-current")} />
              <span>{likeCount}</span>
            </button>

            {/* 举手 */}
            <button
              onClick={handleRaiseHand}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium",
                handRaised ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 text-white/70 hover:bg-white/20"
              )}
            >
              <Hand className="w-4 h-4" />
              <span className="hidden sm:inline">Raise Hand</span>
            </button>

            {/* Generate Reel */}
            <button
              onClick={() => setLocation(`/ai-reel-editor/${id}`)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-500 text-white text-sm font-medium hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg shadow-purple-600/30"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Generate Reel</span>
            </button>

            {/* 分享 */}
            <button
              onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 transition-all text-sm font-medium"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* 右侧面板 */}
        <div className="w-80 flex flex-col bg-[#0f0f1a] border-l border-white/10">
          {/* Tab 切换 */}
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

          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.type === "system" && (
                    <div className="text-center text-xs text-muted-foreground py-1">
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
                        <span className="text-xs text-muted-foreground">{msg.message}</span>
                      </div>
                      <div className="flex items-center gap-3 bg-black/30 rounded-lg p-2">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-xl">🎧</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{msg.product.name}</p>
                          <p className="text-purple-400 text-sm font-bold">{msg.product.price}</p>
                        </div>
                        <Link href={`/product/${msg.product.id}`}>
                          <Button size="sm" className="text-xs bg-purple-600 hover:bg-purple-500 h-7 px-2">
                            View
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                  {msg.type === "text" && (
                    <div className={cn("flex gap-2", msg.userId === (user?.id || 0) && "flex-row-reverse")}>
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                        msg.userId === 3 ? "bg-purple-600 text-white" : "bg-white/20 text-white"
                      )}>
                        {msg.avatar}
                      </div>
                      <div className={cn("max-w-[75%]", msg.userId === (user?.id || 0) && "items-end flex flex-col")}>
                        <span className="text-[10px] text-muted-foreground mb-0.5 block">{msg.userName}</span>
                        <div className={cn(
                          "rounded-2xl px-3 py-2 text-sm",
                          msg.userId === 3 ? "bg-purple-900/50 text-white" :
                          msg.userId === (user?.id || 0) ? "bg-purple-600 text-white" :
                          "bg-white/10 text-white"
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

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{MOCK_PRODUCTS.length} products showcased</span>
                <Link href={`/factory/1`}>
                  <span className="text-xs text-purple-400 hover:text-purple-300 cursor-pointer flex items-center gap-1">
                    View All <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
              {MOCK_PRODUCTS.map((product) => (
                <div key={product.id} className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl p-3 transition-all">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                      🎧
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.color}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-yellow-400">{product.rating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <div>
                      <span className="text-purple-400 font-bold">{product.price}</span>
                      <span className="text-xs text-muted-foreground ml-1">/ unit</span>
                      <p className="text-xs text-muted-foreground">MOQ: {product.moq}</p>
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
              ))}
            </div>
          )}

          {/* Participants Tab */}
          {activeTab === "participants" && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <div className="text-xs text-muted-foreground mb-3">
                {MOCK_PARTICIPANTS.length} participants online
              </div>
              {MOCK_PARTICIPANTS.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/5 transition-all">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                    p.role === "factory" ? "bg-purple-600 text-white" : "bg-white/20 text-white"
                  )}>
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-white truncate">{p.name}</span>
                      {p.role === "factory" && (
                        <Badge className="bg-purple-600/20 text-purple-300 text-[10px] px-1.5 py-0">Host</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.country} {p.company}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
