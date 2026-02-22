import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getAgoraManager, type AgoraConfig, type ConnectionState } from '@/services/agoraManager';

/**
 * WebinarContext - Optimized state management for webinar live sessions
 * (Demo Mode: Backend decoupled for stability)
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

const FOMO_SCRIPTS: Array<{ delay: number; message: string }> = [
  { delay: 8000,   message: '🔥 Ahmed (Dubai) just locked 100 units of LED Mask!' },
  { delay: 18000,  message: '⚡ Saudi retail chain secured 500-unit test batch — only 3 slots left!' },
  { delay: 35000,  message: '🇦🇪 Riyadh seller grabbed the last MagSafe Charger batch!' },
  { delay: 50000,  message: '🚀 5 buyers from Kuwait competing for the same Air Fryer slot!' },
  { delay: 75000,  message: '💥 Flash price ends in 5 min — 2 LED Mask slots remaining!' },
  { delay: 100000, message: '🏆 Omar from Abu Dhabi just claimed his test batch. Smart move!' },
  { delay: 130000, message: '🔥 Ahmed just doubled his order to 200 units!' },
  { delay: 160000, message: '⚡ 12 new buyers joined in the last 3 minutes!' },
];

export interface WebinarContextType {
  webinarId: number;
  webinarTitle: string;
  factoryName: string;
  factoryCity: string;
  factoryCountry: string;
  factoryRating: number;
  viewerCount: number;
  likeCount: number;
  liked: boolean;
  handRaised: boolean;
  favorites: number[];
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  messageError: string | null;
  products: WebinarProduct[];
  currentProduct: WebinarProduct | null;
  agoraState: ConnectionState;
  isAgoraReady: boolean;
  channelName: string;
  fomoActive: boolean;
  toggleLike: () => Promise<void>;
  toggleHandRaise: () => Promise<void>;
  toggleFavorite: (productId: number) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  pushProduct: (product: WebinarProduct) => void;
  clearCurrentProduct: () => void;
  addFomoMessage: (message: string) => void;
  claimSlot: (productId: number, productName: string, quantity: string) => Promise<void>;
  startFomoEngine: () => void;
  stopFomoEngine: () => void;
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
  const [webinarTitle, setWebinarTitle] = useState(initialData?.title || 'Live Webinar');
  const [factoryName, setFactoryName] = useState(initialData?.factory?.name || 'Factory');
  const [factoryCity, setFactoryCity] = useState(initialData?.factory?.city || 'Shenzhen');
  const [factoryCountry, setFactoryCountry] = useState(initialData?.factory?.country || 'China');
  const [factoryRating, setFactoryRating] = useState(initialData?.factory?.rating || 4.5);
  const [viewerCount, setViewerCount] = useState(initialData?.participantCount || 1247);

  const [likeCount, setLikeCount] = useState(856);
  const [liked, setLiked] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);

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
  const [isLoadingMessages] = useState(false);
  const [messageError] = useState<string | null>(null);

  const [products, setProducts] = useState<WebinarProduct[]>(initialData?.products || []);
  const [currentProduct, setCurrentProduct] = useState<WebinarProduct | null>(null);

  const [agoraState, setAgoraState] = useState<ConnectionState>('idle');
  const channelName = `webinar-${webinarId}`;

  const [fomoActive, setFomoActive] = useState(false);
  const fomoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const messageSeqRef = useRef(1);
  const agoraManagerRef = useRef(getAgoraManager());

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

  const startFomoEngine = useCallback(() => {
    if (fomoActive) return;
    setFomoActive(true);
    fomoTimersRef.current.forEach(clearTimeout);
    fomoTimersRef.current = [];
    FOMO_SCRIPTS.forEach(({ delay, message }) => {
      const timer = setTimeout(() => {
        addFomoMessage(message);
      }, delay);
      fomoTimersRef.current.push(timer);
    });
  }, [fomoActive, addFomoMessage]);

  const stopFomoEngine = useCallback(() => {
    fomoTimersRef.current.forEach(clearTimeout);
    fomoTimersRef.current = [];
    setFomoActive(false);
  }, []);

  useEffect(() => {
    if (role === 'subscriber') {
      const initTimer = setTimeout(() => startFomoEngine(), 3000);
      return () => {
        clearTimeout(initTimer);
        stopFomoEngine();
      };
    }
  }, [role, startFomoEngine, stopFomoEngine]);

  const claimSlot = useCallback(
    async (productId: number, productName: string, quantity: string) => {
      console.log('[Demo Mode] claimSlot simulated:', { webinarId, productId, productName, quantity, userId });
      const claimMsg: ChatMessage = {
        id: Date.now(),
        sequenceNumber: messageSeqRef.current++,
        userId,
        userName: 'You',
        avatar: 'YO',
        message: `🎉 已锁定 ${quantity} 件 ${productName}！供应链管家将通过 WhatsApp 联系您。`,
        timestamp: new Date(),
        type: 'claim',
      };
      setMessages((prev) => [...prev, claimMsg]);
    },
    [webinarId, userId]
  );

  const toggleLike = useCallback(async () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    toast.success(liked ? 'Unliked' : 'Liked!');
  }, [liked]);

  const toggleHandRaise = useCallback(async () => {
    setHandRaised(!handRaised);
    toast.info(handRaised ? 'Hand lowered' : 'Hand raised! The host will notice you.');
  }, [handRaised]);

  const toggleFavorite = useCallback(
    async (productId: number) => {
      setFavorites((prev) =>
        prev.includes(productId) ? prev.filter((i) => i !== productId) : [...prev, productId]
      );
    },
    []
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;
      const newMsg: ChatMessage = {
        id: Date.now(),
        sequenceNumber: messageSeqRef.current++,
        userId,
        userName: 'You',
        avatar: 'YO',
        message,
        timestamp: new Date(),
        type: 'text',
      };
      setMessages((prev) => [...prev, newMsg]);
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
    },
    []
  );

  const clearCurrentProduct = useCallback(() => {
    setCurrentProduct(null);
  }, []);

  useEffect(() => {
    const initializeAgora = async () => {
      try {
        const agoraConfig: AgoraConfig = {
          appId: '', // Demo mode: no real agora token needed
          channelName,
          uid: userId,
          role,
        };
        // Skip real initialization in demo mode to avoid crashes
        setAgoraState('connected');
      } catch (error) {
        console.error('[WebinarContext] Agora initialization failed:', error);
      }
    };
    initializeAgora();
  }, [channelName, userId, role]);

  const retry = useCallback(async () => {
    setAgoraState('connected');
    toast.success('Reconnected successfully');
  }, []);

  const value: WebinarContextType = {
    webinarId, webinarTitle, factoryName, factoryCity, factoryCountry, factoryRating, viewerCount,
    likeCount, liked, handRaised, favorites, messages, isLoadingMessages, messageError,
    products, currentProduct, agoraState, isAgoraReady: true, channelName, fomoActive,
    toggleLike, toggleHandRaise, toggleFavorite, sendMessage, pushProduct, clearCurrentProduct,
    addFomoMessage, claimSlot, startFomoEngine, stopFomoEngine, retry,
  };

  return <WebinarContext.Provider value={value}>{children}</WebinarContext.Provider>;
}

export function useWebinar(): WebinarContextType {
  const context = useContext(WebinarContext);
  if (!context) throw new Error('useWebinar must be used within WebinarProvider');
  return context;
}
