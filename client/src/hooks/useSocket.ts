/**
 * useSocket - Socket.IO 客户端连接 Hook
 *
 * 封装 Socket.IO 连接管理，供 MatchingDashboard 和 SourcingRoom 使用。
 * 支持自动重连、认证 Token 注入、连接状态管理。
 */

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type SocketConnectionState = "idle" | "connecting" | "connected" | "disconnected" | "error";

let globalSocket: any = null;
let globalSocketListeners = 0;

/**
 * useSocket
 * 返回 Socket.IO 客户端实例（全局单例，避免重复连接）
 */
export function useSocket() {
  const { user } = useAuth();
  const [socket, setSocket] = useState<any>(null);
  const [connectionState, setConnectionState] = useState<SocketConnectionState>("idle");

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function initSocket() {
      try {
        // 动态加载 socket.io-client（避免 SSR 问题）
        const { io } = await import("socket.io-client");

        if (cancelled) return;

        // 如果全局 socket 已存在且已连接，直接复用
        if (globalSocket && globalSocket.connected) {
          globalSocketListeners++;
          setSocket(globalSocket);
          setConnectionState("connected");
          return;
        }

        // 获取认证 token（从 localStorage 或 cookie）
        const token = localStorage.getItem("auth_token") || "";

        const serverUrl = window.location.origin;
        const newSocket = io(serverUrl, {
          auth: { token, userId: user.id },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
        });

        globalSocket = newSocket;
        globalSocketListeners++;

        newSocket.on("connect", () => {
          if (!cancelled) {
            setConnectionState("connected");
            // 注册用户 ID 到 socket（用于服务端路由消息）
            newSocket.emit("register_user", { userId: user.id });
          }
        });

        newSocket.on("disconnect", () => {
          if (!cancelled) setConnectionState("disconnected");
        });

        newSocket.on("connect_error", (err: Error) => {
          if (!cancelled) {
            console.warn("[Socket] Connection error:", err.message);
            setConnectionState("error");
          }
        });

        newSocket.on("reconnect", () => {
          if (!cancelled) {
            setConnectionState("connected");
            newSocket.emit("register_user", { userId: user.id });
          }
        });

        if (!cancelled) {
          setSocket(newSocket);
          setConnectionState("connecting");
        }
      } catch (err) {
        if (!cancelled) {
          console.error("[Socket] Failed to initialize:", err);
          setConnectionState("error");
        }
      }
    }

    initSocket();

    return () => {
      cancelled = true;
      globalSocketListeners--;

      // 只有最后一个使用者才断开连接
      if (globalSocketListeners <= 0 && globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        globalSocketListeners = 0;
      }
    };
  }, [user?.id]);

  return socket;
}

export function useSocketConnectionState() {
  const socket = useSocket();
  const [state, setState] = useState<SocketConnectionState>("idle");

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setState("connected");
    const onDisconnect = () => setState("disconnected");
    const onError = () => setState("error");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    if (socket.connected) setState("connected");

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
    };
  }, [socket]);

  return state;
}
