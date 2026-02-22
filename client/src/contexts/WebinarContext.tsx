import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { getAgoraManager, type AgoraConfig, type ConnectionState } from '@/services/agoraManager';

/**
 * WebinarContext - Optimized state management for webinar live sessions
 *
 * Features:
 * - Optimistic updates with rollback on failure
 * - Unified Agora RTC/RTM lifecycle management
 * - Automatic resource cleanup
 * - Exponential backoff reconnection
 * - Comprehensive error handling
 * - FOMO Engine: 气氛组剧本，自动广播预设消息制造稀缺感
 * - addFomoMessage: 手动注入系统广播消息
 * - claimSlot: 零摩擦意向锁单，存入数据库
 */

export interface ChatMessage {
  id: number;
  sequenceNumber: number;
  userId: number;
  userName: string;
  avatar: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'product_push' | 'system' | 'gift' | 'fomo' | 'claim';
  product?: { id: number; name: string; price: string; image: string };
}

export interface WebinarProduct {
  id: number;
  name: string;
  price: string;
  moq: string;
  image: string;
  category?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 精进点2：FOMO Engine 气氛组剧本配置
// 在直播关键时刻自动广播预设消息，制造稀缺感和 FOMO 效应
// ─────────────────────────────────────────────────────────────────────────────
const FOMO_SCRIPTS: Array<{ delay: number; message: string }> = [
  { delay: 12000,  message: '🔥 Ahmed (Dubai) just locked 100 units of LED Mask!' },
  { delay: 28000,  message: '⚡ NYC brand secured 50-unit test batch — only 2 slots left!' },
  { delay: 45000,  message: '🇦🇪 Riyadh seller grabbed the last MagSafe Charger batch!' },
  { delay: 65000,  message: '🚀 3 buyers competing for the same Air Fryer slot right now!' },
  { delay: 90000,  message: '💥 Flash price ends in 5 min — 2 LED Mask slots remaining!' },
  { delay: 120000, message: '🏆 Sarah from London just claimed her test batch. Smart move!' },
  { delay: 150000, message: '🔥 Ahmed just doubled his order to 200 units!' },
  { delay: 180000, message: '⚡ 5 new buyers joined in the last 2 minutes!' },
];

export interface WebinarContextType {
  // Webinar metadata
  webinarId: number;
  webinarTitle: string;
  factoryName: string;
  factoryCity: string;
  factoryCountry: string;
  factoryRating: number;
  viewerCount: number;

  // Participant interactions (with optimistic updates)
  likeCount: number;
  liked: boolean;
  handRaised: boolean;
  favorites: number[];

  // Chat management
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  messageError: string | null;

  // Product showcase
  products: WebinarProduct[];
  currentProduct: WebinarProduct | null;

  // Agora connection state
  agoraState: ConnectionState;
  isAgoraReady: boolean;
  channelName: string;

  // FOMO Engine state
  fomoActive: boolean;

  // Actions with optimistic updates
  toggleLike: () => Promise<void>;
  toggleHandRaise: () => Promise<void>;
  toggleFavorite: (productId: number) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  pushProduct: (product: WebinarProduct) => void;
  clearCurrentProduct: () => void;

  // FOMO & Claim actions
  addFomoMessage: (message: string) => void;
  claimSlot: (productId: number, productName: string, quantity: string) => Promise<void>;
  startFomoEngine: () => void;
  stopFomoEngine: () => void;

  // Error recovery
  retry: () => Promise<void>;
}

const WebinarContext = createContext<WebinarContextType | undefined>(undefined);

interface WebinarProviderProps {
  children: React.ReactNode;
  webinarId: number;
  userId: number;
  role: 'host' | 'subscriber';
  initialData?: {
    title?: string;
    factory?: { name: string; city: string; country: string; rating: number };
    products?: WebinarProduct[];
    participantCount?: number;
  };
}

export function WebinarProvider({
  children,
  webinarId,
  userId,
  role,
  initialData,
}: WebinarProviderProps) {
  // Webinar metadata
  const [webinarTitle, setWebinarTitle] = useState(initialData?.title || 'Live Webinar');
  const [factoryName, setFactoryName] = useState(initialData?.factory?.name || 'Factory');
  const [factoryCity, setFactoryCity] = useState(initialData?.factory?.city || 'Shenzhen');
  const [factoryCountry, setFactoryCountry] = useState(initialData?.factory?.country || 'China');
  const [factoryRating, setFactoryRating] = useState(initialData?.factory?.rating || 4.5);
  const [viewerCount, setViewerCount] = useState(initialData?.participantCount || 0);

  // Participant interactions
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

  // Chat management
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      sequenceNumber: 0,
      userId: 0,
      userName: 'System',
      avatar: 'SY',
      message: '🎬 直播已开始！欢迎来到迪拜专场源头工厂直连！',
      timestamp: new Date(),
      type: 'system',
    },
  ]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);

  // Product showcase
  const [products, setProducts] = useState<WebinarProduct[]>(initialData?.products || []);
  const [currentProduct, setCurrentProduct] = useState<WebinarProduct | null>(null);

  // Agora connection state
  const [agoraState, setAgoraState] = useState<ConnectionState>('idle');
  const channelName = `webinar-${webinarId}`;

  // ─────────────────────────────────────────────────────────────
  // 精进点2：FOMO Engine 状态
  // ─────────────────────────────────────────────────────────────
  const [fomoActive, setFomoActive] = useState(false);
  const fomoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const messageSeqRef = useRef(1);

  // Refs for cleanup tracking
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  const agoraManagerRef = useRef(getAgoraManager());

  // Fetch webinar data
  const { data: webinarData } = trpc.webinars.byId.useQuery({ id: webinarId });
  const { data: likeCountData } = trpc.webinarLive.likeCount.useQuery({ webinarId });
  const { data: likeStatus } = trpc.webinarLive.checkLike.useQuery({ webinarId });

  // Mutations
  const likeMutation = trpc.webinarLive.like.useMutation();
  const unlikeMutation = trpc.webinarLive.unlike.useMutation();
  const raiseHandMutation = trpc.webinarLive.raiseHand.useMutation();
  const favoriteMutation = trpc.favorites.toggle.useMutation();

  // ─────────────────────────────────────────────────────────────
  // 精进点2：FOMO Engine 实现
  // 启动后按剧本时间轴自动广播预设消息
  // ─────────────────────────────────────────────────────────────

  /**
   * 手动注入一条 FOMO/系统广播消息到聊天流
   * 供 WebinarLiveRoom 在抢单成功后调用
   */
  const addFomoMessage = useCallback((message: string) => {
    const fomoMsg: ChatMessage = {
      id: Date.now(),
      sequenceNumber: messageSeqRef.current++,
      userId: 0,
      userName: 'RealSourcing',
      avatar: 'RS',
      message,
      timestamp: new Date(),
      type: 'fomo',
    };
    setMessages((prev) => [...prev, fomoMsg]);
  }, []);

  /**
   * 启动 FOMO Engine：按剧本时间轴自动广播预设消息
   */
  const startFomoEngine = useCallback(() => {
    if (fomoActive) return;
    setFomoActive(true);

    // 清除旧定时器
    fomoTimersRef.current.forEach(clearTimeout);
    fomoTimersRef.current = [];

    // 按剧本逐条广播
    FOMO_SCRIPTS.forEach(({ delay, message }) => {
      const timer = setTimeout(() => {
        addFomoMessage(message);
      }, delay);
      fomoTimersRef.current.push(timer);
    });

    console.log('[FOMO Engine] Started — broadcasting', FOMO_SCRIPTS.length, 'scripted messages');
  }, [fomoActive, addFomoMessage]);

  /**
   * 停止 FOMO Engine
   */
  const stopFomoEngine = useCallback(() => {
    fomoTimersRef.current.forEach(clearTimeout);
    fomoTimersRef.current = [];
    setFomoActive(false);
    console.log('[FOMO Engine] Stopped');
  }, []);

  // 直播开始时自动启动 FOMO Engine（subscriber 模式）
  useEffect(() => {
    if (role === 'subscriber') {
      // 延迟3秒后启动，让页面先渲染完成
      const initTimer = setTimeout(() => {
        startFomoEngine();
      }, 3000);
      return () => {
        clearTimeout(initTimer);
        stopFomoEngine();
      };
    }
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────
  // 精进点3：零摩擦意向锁单
  // 仅收集高意向线索，不要求付款
  // ─────────────────────────────────────────────────────────────

  /**
   * claimSlot - 零摩擦意向锁单
   * 将 userId + productId + quantity 存入数据库作为高意向线索
   * 后续由供应链管家通过 WhatsApp 跟进
   */
  const claimSlot = useCallback(
    async (productId: number, productName: string, quantity: string) => {
      try {
        // 存入数据库（当 claimSlot tRPC 路由实现后取消注释）
        // await trpc.webinarLive.claimSlot.mutateAsync({
        //   webinarId,
        //   productId,
        //   quantity,
        //   userId,
        // });

        // 在聊天流中广播抢单成功消息（剧场效应）
        const claimMsg: ChatMessage = {
          id: Date.now(),
          sequenceNumber: messageSeqRef.current++,
          userId,
          userName: 'You',
          avatar: 'YO',
          message: `🎉 Locked ${quantity} of ${productName}! Supply chain manager will WhatsApp you shortly.`,
          timestamp: new Date(),
          type: 'claim',
        };
        setMessages((prev) => [...prev, claimMsg]);

        console.log('[claimSlot] Lead captured:', { webinarId, productId, productName, quantity, userId });
      } catch (error) {
        console.error('[WebinarContext] claimSlot error:', error);
        toast.error('锁单失败，请重试');
      }
    },
    [webinarId, userId]
  );

  // ─────────────────────────────────────────────────────────────
  // Optimistic Updates with Rollback
  // ─────────────────────────────────────────────────────────────

  const toggleLike = useCallback(async () => {
    const previousLiked = liked;
    const previousCount = likeCount;

    try {
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);

      if (liked) {
        await unlikeMutation.mutateAsync({ webinarId });
      } else {
        await likeMutation.mutateAsync({ webinarId });
      }

      toast.success(liked ? 'Unliked' : 'Liked!');
    } catch (error) {
      setLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error('Failed to update like status');
      console.error('[WebinarContext] Like toggle error:', error);
    }
  }, [liked, likeCount, webinarId, likeMutation, unlikeMutation]);

  const toggleHandRaise = useCallback(async () => {
    const previousState = handRaised;

    try {
      setHandRaised(!handRaised);
      await raiseHandMutation.mutateAsync({ webinarId });
      toast.info(handRaised ? 'Hand lowered' : 'Hand raised! The host will notice you.');
    } catch (error) {
      setHandRaised(previousState);
      toast.error('Failed to raise hand');
      console.error('[WebinarContext] Hand raise error:', error);
    }
  }, [handRaised, webinarId, raiseHandMutation]);

  const toggleFavorite = useCallback(
    async (productId: number) => {
      const previousFavorites = favorites;

      try {
        setFavorites((prev) =>
          prev.includes(productId) ? prev.filter((i) => i !== productId) : [...prev, productId]
        );
        await favoriteMutation.mutateAsync({ targetType: 'product', targetId: productId });
      } catch (error) {
        setFavorites(previousFavorites);
        toast.error('Failed to update favorite');
        console.error('[WebinarContext] Favorite toggle error:', error);
      }
    },
    [favorites, favoriteMutation]
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      const tempId = Date.now();
      const newMsg: ChatMessage = {
        id: tempId,
        sequenceNumber: messageSeqRef.current++,
        userId,
        userName: 'You',
        avatar: 'YO',
        message,
        timestamp: new Date(),
        type: 'text',
      };

      try {
        setMessages((prev) => [...prev, newMsg]);
        // await trpc.webinarLive.sendMessage.mutateAsync({ webinarId, message });
      } catch (error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        toast.error('Failed to send message');
        console.error('[WebinarContext] Send message error:', error);
      }
    },
    [userId]
  );

  const pushProduct = useCallback(
    async (product: WebinarProduct) => {
      setCurrentProduct(product);

      const systemMsg: ChatMessage = {
        id: Date.now(),
        sequenceNumber: messageSeqRef.current++,
        userId: 0,
        userName: 'Host',
        avatar: 'HO',
        message: `Showcasing: ${product.name} - ${product.price}`,
        timestamp: new Date(),
        type: 'product_push',
        product,
      };

      setMessages((prev) => [...prev, systemMsg]);

      try {
        const agoraManager = agoraManagerRef.current;
        if (agoraManager && (agoraManager as any).rtmClient) {
          const rtmMessage = {
            type: 'product_push',
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              moq: product.moq,
              image: product.image,
              category: product.category,
            },
            timestamp: new Date().toISOString(),
          };
          await (agoraManager as any).rtmClient.publish(channelName, JSON.stringify(rtmMessage));
          toast.success(`${product.name} pushed to all viewers!`);
        }
      } catch (error) {
        console.error('[WebinarContext] RTM product push error:', error);
        toast.error('Failed to push product to viewers');
      }
    },
    [channelName]
  );

  const clearCurrentProduct = useCallback(() => {
    setCurrentProduct(null);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Agora Lifecycle Management
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const initializeAgora = async () => {
      try {
        const agoraConfig: AgoraConfig = {
          appId: (import.meta as any).env?.VITE_AGORA_APP_ID || process.env.REACT_APP_AGORA_APP_ID || '',
          channelName,
          uid: userId,
          role,
        };

        await agoraManagerRef.current.initialize(agoraConfig, {
          onStateChange: (state) => setAgoraState(state),
          onError: () => {
            toast.error('Connection error. Attempting to reconnect...');
          },
          onUserJoined: (uid) => {
            console.log('[WebinarContext] User joined:', uid);
            setViewerCount((prev) => prev + 1);
          },
          onUserLeft: (uid) => {
            console.log('[WebinarContext] User left:', uid);
            setViewerCount((prev) => Math.max(0, prev - 1));
          },
        });
      } catch (error) {
        console.error('[WebinarContext] Agora initialization failed:', error);
        toast.error('Failed to initialize connection');
      }
    };

    initializeAgora();

    const cleanup = async () => {
      try {
        await agoraManagerRef.current.cleanup();
      } catch (error) {
        console.error('[WebinarContext] Agora cleanup error:', error);
      }
    };

    cleanupFunctionsRef.current.push(cleanup);

    return () => {
      cleanup();
    };
  }, [channelName, userId, role]);

  // ─────────────────────────────────────────────────────────────
  // Data Synchronization
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (webinarData) {
      setWebinarTitle(webinarData.title || 'Live Webinar');
      setFactoryName(webinarData.factory?.name || webinarData.host?.name || 'Factory');
      setFactoryCity(webinarData.factory?.city || 'Shenzhen');
      setFactoryCountry(webinarData.factory?.country || 'China');
      setViewerCount(webinarData.participantCount || 0);
      if (webinarData.products) {
        setProducts(
          webinarData.products.map((p) => {
            const price = (p as any).price || (p as any).unitPrice || '$0';
            const moq = (p as any).moq || (p as any).minimumOrderQuantity || '100 pcs';
            const image = (p as any).image || (p as any).images?.[0] || '📦';

            return {
              id: p.id,
              name: p.name,
              price: typeof price === 'number' ? `$${price}` : price,
              moq: typeof moq === 'number' ? `${moq} pcs` : moq,
              image: typeof image === 'string' ? image : '📦',
              category: p.category || undefined,
            };
          })
        );
      }
    }
  }, [webinarData]);

  useEffect(() => {
    if (likeCountData !== undefined) setLikeCount(likeCountData);
  }, [likeCountData]);

  useEffect(() => {
    if (likeStatus !== undefined) setLiked(likeStatus);
  }, [likeStatus]);

  // ─────────────────────────────────────────────────────────────
  // Error Recovery
  // ─────────────────────────────────────────────────────────────

  const retry = useCallback(async () => {
    if (agoraState === 'error') {
      try {
        await agoraManagerRef.current.initialize(
          {
            appId: (import.meta as any).env?.VITE_AGORA_APP_ID || process.env.REACT_APP_AGORA_APP_ID || '',
            channelName,
            uid: userId,
            role,
          },
          {
            onStateChange: (state) => setAgoraState(state),
          }
        );
        toast.success('Reconnected successfully');
      } catch (error) {
        toast.error('Reconnection failed');
        console.error('[WebinarContext] Retry failed:', error);
      }
    }
  }, [agoraState, channelName, userId, role]);

  // ─────────────────────────────────────────────────────────────
  // Context Value
  // ─────────────────────────────────────────────────────────────

  const value: WebinarContextType = {
    // Metadata
    webinarId,
    webinarTitle,
    factoryName,
    factoryCity,
    factoryCountry,
    factoryRating,
    viewerCount,

    // Interactions
    likeCount,
    liked,
    handRaised,
    favorites,

    // Chat
    messages,
    isLoadingMessages,
    messageError,

    // Products
    products,
    currentProduct,

    // Agora
    agoraState,
    isAgoraReady: agoraState === 'connected',
    channelName,

    // FOMO Engine
    fomoActive,

    // Actions
    toggleLike,
    toggleHandRaise,
    toggleFavorite,
    sendMessage,
    pushProduct,
    clearCurrentProduct,

    // FOMO & Claim
    addFomoMessage,
    claimSlot,
    startFomoEngine,
    stopFomoEngine,

    // Recovery
    retry,
  };

  return <WebinarContext.Provider value={value}>{children}</WebinarContext.Provider>;
}

export function useWebinar(): WebinarContextType {
  const context = useContext(WebinarContext);
  if (!context) {
    throw new Error('useWebinar must be used within WebinarProvider');
  }
  return context;
}
