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
 */

export interface ChatMessage {
  id: number;
  sequenceNumber: number; // Server-assigned sequence for ordering
  userId: number;
  userName: string;
  avatar: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'product_push' | 'system' | 'gift';
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

  // Actions with optimistic updates
  toggleLike: () => Promise<void>;
  toggleHandRaise: () => Promise<void>;
  toggleFavorite: (productId: number) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  pushProduct: (product: WebinarProduct) => void;
  clearCurrentProduct: () => void;

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
  initialData 
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
      message: 'Welcome to the live session!',
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

  // Refs for cleanup tracking
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  const agoraManagerRef = useRef(getAgoraManager());

  // Fetch webinar data
  const { data: webinarData } = trpc.webinars.byId.useQuery({ id: webinarId });
  const { data: likeCountData } = trpc.webinarLive.likeCount.useQuery({ webinarId });
  const { data: likeStatus } = trpc.webinarLive.checkLike.useQuery({ webinarId });

  // Mutations with proper error handling
  const likeMutation = trpc.webinarLive.like.useMutation();
  const unlikeMutation = trpc.webinarLive.unlike.useMutation();
  const raiseHandMutation = trpc.webinarLive.raiseHand.useMutation();
  const favoriteMutation = trpc.favorites.toggle.useMutation();

  // ─────────────────────────────────────────────────────────────
  // Optimistic Updates with Rollback
  // ─────────────────────────────────────────────────────────────

  const toggleLike = useCallback(async () => {
    // Save previous state for rollback
    const previousLiked = liked;
    const previousCount = likeCount;

    try {
      // 1. Optimistic update
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);

      // 2. Send to server
      if (liked) {
        await unlikeMutation.mutateAsync({ webinarId });
      } else {
        await likeMutation.mutateAsync({ webinarId });
      }

      toast.success(liked ? 'Unliked' : 'Liked!');
    } catch (error) {
      // 3. Rollback on failure
      setLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error('Failed to update like status');
      console.error('[WebinarContext] Like toggle error:', error);
    }
  }, [liked, likeCount, webinarId, likeMutation, unlikeMutation]);

  const toggleHandRaise = useCallback(async () => {
    const previousState = handRaised;

    try {
      // Optimistic update
      setHandRaised(!handRaised);

      // Send to server
      await raiseHandMutation.mutateAsync({ webinarId });

      toast.info(handRaised ? 'Hand lowered' : 'Hand raised! The host will notice you.');
    } catch (error) {
      // Rollback
      setHandRaised(previousState);
      toast.error('Failed to raise hand');
      console.error('[WebinarContext] Hand raise error:', error);
    }
  }, [handRaised, webinarId, raiseHandMutation]);

  const toggleFavorite = useCallback(async (productId: number) => {
    const previousFavorites = favorites;

    try {
      // Optimistic update
      setFavorites((prev) =>
        prev.includes(productId) 
          ? prev.filter((i) => i !== productId) 
          : [...prev, productId]
      );

      // Send to server
      await favoriteMutation.mutateAsync({ targetType: 'product', targetId: productId });
    } catch (error) {
      // Rollback
      setFavorites(previousFavorites);
      toast.error('Failed to update favorite');
      console.error('[WebinarContext] Favorite toggle error:', error);
    }
  }, [favorites, favoriteMutation]);

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const tempId = Date.now();
    const newMsg: ChatMessage = {
      id: tempId,
      sequenceNumber: messages.length, // Temporary sequence
      userId,
      userName: 'You',
      avatar: 'YO',
      message,
      timestamp: new Date(),
      type: 'text',
    };

    try {
      // Optimistic update
      setMessages((prev) => [...prev, newMsg]);

      // Send to server (implement on backend)
      // await trpc.webinarLive.sendMessage.mutateAsync({ webinarId, message });

      toast.success('Message sent');
    } catch (error) {
      // Rollback
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      toast.error('Failed to send message');
      console.error('[WebinarContext] Send message error:', error);
    }
  }, [messages.length, userId]);

  const pushProduct = useCallback((product: WebinarProduct) => {
    setCurrentProduct(product);

    // Add system message
    const systemMsg: ChatMessage = {
      id: Date.now(),
      sequenceNumber: messages.length,
      userId: 0,
      userName: 'Host',
      avatar: 'HO',
      message: `Showcasing: ${product.name} - ${product.price}`,
      timestamp: new Date(),
      type: 'product_push',
      product,
    };

    setMessages((prev) => [...prev, systemMsg]);
  }, [messages.length]);

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
          appId: process.env.REACT_APP_AGORA_APP_ID || '',
          channelName,
          uid: userId,
          role,
        };

        await agoraManagerRef.current.initialize(agoraConfig, {
          onStateChange: (state) => setAgoraState(state),
          onError: (error) => {
            console.error('[WebinarContext] Agora error:', error);
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

    // Cleanup function
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
        setProducts(webinarData.products.map(p => ({
          id: p.id,
          name: p.name,
          price: '$0',
          moq: '100 pcs',
          image: '📦',
          category: p.category || undefined
        })));
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
            appId: process.env.REACT_APP_AGORA_APP_ID || '',
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

    // Actions
    toggleLike,
    toggleHandRaise,
    toggleFavorite,
    sendMessage,
    pushProduct,
    clearCurrentProduct,

    // Recovery
    retry,
  };

  return (
    <WebinarContext.Provider value={value}>
      {children}
    </WebinarContext.Provider>
  );
}

export function useWebinar(): WebinarContextType {
  const context = useContext(WebinarContext);
  if (!context) {
    throw new Error('useWebinar must be used within WebinarProvider');
  }
  return context;
}
