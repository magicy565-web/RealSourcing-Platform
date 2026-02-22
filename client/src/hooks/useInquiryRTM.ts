/**
 * useInquiryRTM - 询价实时消息 Hook
 *
 * 封装 Agora RTM v2.x 的登录、频道订阅、消息收发及连接状态管理。
 * 支持买家与工厂之间的双向实时通信。
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type RTMConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "error";

export interface RTMMessage {
  id: number;
  inquiryId: number;
  senderId: number;
  senderRole: "buyer" | "factory";
  content: string;
  isRead: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UseInquiryRTMOptions {
  inquiryId: number | null;
  currentUserId: number | null;
  enabled?: boolean;
}

export interface UseInquiryRTMReturn {
  messages: RTMMessage[];
  connectionState: RTMConnectionState;
  isConnected: boolean;
  sendMessage: (content: string) => Promise<void>;
  isSending: boolean;
  refetchMessages: () => void;
}

export function useInquiryRTM({
  inquiryId,
  currentUserId,
  enabled = true,
}: UseInquiryRTMOptions): UseInquiryRTMReturn {
  const [messages, setMessages] = useState<RTMMessage[]>([]);
  const [connectionState, setConnectionState] = useState<RTMConnectionState>("idle");
  const [isSending, setIsSending] = useState(false);

  // RTM 客户端引用（懒加载）
  const rtmClientRef = useRef<any>(null);
  const channelRef = useRef<string | null>(null);
  const isLoggedInRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // tRPC 查询：获取历史消息
  const { data: historyMessages, refetch: refetchMessages } = trpc.inquiries.messages.useQuery(
    { inquiryId: inquiryId! },
    {
      enabled: !!inquiryId && !!currentUserId && enabled,
      refetchInterval: false,
      staleTime: 0,
    }
  );

  // tRPC 查询：获取 RTM Token
  const { data: rtmTokenData } = trpc.inquiries.getRtmToken.useQuery(
    { inquiryId: inquiryId! },
    {
      enabled: !!inquiryId && !!currentUserId && enabled,
      staleTime: 30 * 60 * 1000, // 30分钟缓存
    }
  );

  // tRPC Mutation：发送消息（持久化到数据库）
  const sendMessageMutation = trpc.inquiries.sendMessage.useMutation();

  // tRPC Mutation：标记已读
  const markReadMutation = trpc.inquiries.markRead.useMutation();

  // 同步历史消息到本地状态
  useEffect(() => {
    if (historyMessages) {
      setMessages(historyMessages as RTMMessage[]);
    }
  }, [historyMessages]);

  // 标记消息已读（进入对话框时触发）
  useEffect(() => {
    if (inquiryId && currentUserId && enabled && historyMessages && historyMessages.length > 0) {
      markReadMutation.mutate({ inquiryId });
    }
  }, [inquiryId, currentUserId, enabled, historyMessages?.length]);

  // 初始化 RTM 连接
  useEffect(() => {
    if (!inquiryId || !currentUserId || !enabled || !rtmTokenData) return;

    let cancelled = false;

    async function initRTM() {
      try {
        setConnectionState("connecting");

        // 动态加载 Agora RTM SDK（避免 SSR 问题）
        const AgoraRTM = (await import("agora-rtm-sdk")).default;

        if (cancelled) return;

        const { appId, rtmToken, channelName, uid } = rtmTokenData!;

        // 创建 RTM 客户端
        const client = new AgoraRTM.RTM(appId, uid, { token: rtmToken });
        rtmClientRef.current = client;
        channelRef.current = channelName;

        // 监听连接状态变化
        client.addEventListener("status", (evt: any) => {
          const stateMap: Record<string, RTMConnectionState> = {
            CONNECTED: "connected",
            CONNECTING: "connecting",
            RECONNECTING: "reconnecting",
            DISCONNECTED: "disconnected",
          };
          const newState = stateMap[evt.state] || "idle";
          setConnectionState(newState);

          // 断线重连逻辑
          if (evt.state === "DISCONNECTED" && !cancelled) {
            scheduleReconnect();
          }
        });

        // 监听实时消息
        client.addEventListener("message", (evt: any) => {
          try {
            const payload = JSON.parse(evt.message.text || evt.message);
            if (payload.type === "inquiry_message" && payload.inquiryId === inquiryId) {
              const newMsg: RTMMessage = {
                id: payload.id || Date.now(),
                inquiryId: payload.inquiryId,
                senderId: payload.senderId,
                senderRole: payload.senderRole,
                content: payload.content,
                isRead: 0,
                createdAt: new Date(payload.createdAt || Date.now()),
                updatedAt: new Date(payload.updatedAt || Date.now()),
              };
              setMessages((prev) => {
                // 去重：避免重复添加
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              // 自动标记已读（收到消息时）
              if (inquiryId) {
                markReadMutation.mutate({ inquiryId });
              }
            }
          } catch {
            // 非 JSON 消息，忽略
          }
        });

        // 登录
        await client.login();
        isLoggedInRef.current = true;

        // 订阅频道
        await client.subscribe(channelName, { withMessage: true });

        if (!cancelled) {
          setConnectionState("connected");
          console.log(`[RTM] Connected to channel: ${channelName}`);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[RTM] Connection failed:", err);
          setConnectionState("error");
          // 5秒后重试
          scheduleReconnect(5000);
        }
      }
    }

    function scheduleReconnect(delay = 3000) {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (!cancelled) {
          setConnectionState("reconnecting");
          cleanupRTM().then(() => initRTM());
        }
      }, delay);
    }

    async function cleanupRTM() {
      try {
        if (rtmClientRef.current && isLoggedInRef.current) {
          if (channelRef.current) {
            await rtmClientRef.current.unsubscribe(channelRef.current).catch(() => {});
          }
          await rtmClientRef.current.logout().catch(() => {});
          isLoggedInRef.current = false;
        }
      } catch {
        // 清理失败不影响主流程
      }
      rtmClientRef.current = null;
    }

    initRTM();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      cleanupRTM();
      setConnectionState("idle");
    };
  }, [inquiryId, currentUserId, enabled, rtmTokenData?.rtmToken]);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !inquiryId || !currentUserId) return;

      setIsSending(true);
      try {
        // 1. 先持久化到数据库
        const savedMsg = await sendMessageMutation.mutateAsync({
          inquiryId,
          content: content.trim(),
        });

        // 2. 乐观更新本地消息列表
        const optimisticMsg: RTMMessage = {
          id: (savedMsg as any)?.id || Date.now(),
          inquiryId,
          senderId: currentUserId,
          senderRole: (savedMsg as any)?.senderRole || "buyer",
          content: content.trim(),
          isRead: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setMessages((prev) => {
          if (prev.some((m) => m.id === optimisticMsg.id)) return prev;
          return [...prev, optimisticMsg];
        });

        // 3. 通过 RTM 实时推送给对方
        if (rtmClientRef.current && channelRef.current && isLoggedInRef.current) {
          try {
            const payload = JSON.stringify({
              type: "inquiry_message",
              inquiryId,
              id: optimisticMsg.id,
              senderId: currentUserId,
              senderRole: optimisticMsg.senderRole,
              content: content.trim(),
              createdAt: optimisticMsg.createdAt.toISOString(),
              updatedAt: optimisticMsg.updatedAt.toISOString(),
            });
            await rtmClientRef.current.publish(channelRef.current, payload);
          } catch (rtmErr) {
            // RTM 发送失败不影响数据库持久化，仅记录日志
            console.warn("[RTM] Failed to publish message via RTM:", rtmErr);
          }
        }
      } catch (err) {
        console.error("[RTM] Failed to send message:", err);
        toast.error("消息发送失败，请重试");
      } finally {
        setIsSending(false);
      }
    },
    [inquiryId, currentUserId, sendMessageMutation]
  );

  return {
    messages,
    connectionState,
    isConnected: connectionState === "connected",
    sendMessage,
    isSending,
    refetchMessages,
  };
}
