/**
 * RealSourcing 4.0 - WebSocket Service
 * 基于 Socket.IO 的实时通信服务
 *
 * 支持的事件：
 * - authenticate: 通过 token 鉴权，注册工厂在线状态
 * - register_user: 快速注册用户 ID（无需 token，用于买家端）
 * - join_demand_room: 加入需求房间（demandId），接收实时匹配推送
 * - leave_demand_room: 离开需求房间
 * - disconnect: 断开连接，更新工厂离线状态
 *
 * 服务端推送事件：
 * - match_complete: 匹配完成，推送 Top 5 工厂结果
 * - match_expired: 15分钟窗口关闭，推送过期通知
 * - handshake_request: 工厂收到握手请求
 * - handshake_response: 买家收到工厂握手响应（accept/reject）
 * - factory_status_change: 工厂在线状态变更
 * - notification: 通用通知
 */
import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { dbPromise } from '../db';
import * as schema from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sdk } from './sdk';

let io: SocketIOServer | null = null;

/**
 * 初始化 WebSocket 服务
 */
export function initSocketService(server: HttpServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // 开发环境允许所有来源，生产环境应限制
      methods: ['GET', 'POST'],
    },
    path: '/api/socket.io',
  });

  io.on('connection', async (socket) => {
    console.log(`🔌 [Socket] New connection: ${socket.id}`);

    // ── 1. 鉴权：通过 token 注册工厂在线状态 ──────────────────────────────────
    socket.on('authenticate', async (data: { token?: string }) => {
      try {
        const mockReq = { headers: { cookie: `token=${data.token}` } } as any;
        const user = await sdk.authenticateRequest(mockReq);
        if (!user) {
          socket.emit('error', { message: 'Authentication failed' });
          return;
        }

        (socket as any).userId = user.id;
        (socket as any).userRole = user.role;

        // 工厂用户：更新在线状态
        if (user.role === 'factory') {
          const db = await dbPromise;
          const factory = await db.query.factories.findFirst({
            where: eq(schema.factories.userId, user.id),
          });
          if (factory) {
            (socket as any).factoryId = factory.id;
            await db.update(schema.factories)
              .set({ isOnline: 1 } as any)
              .where(eq(schema.factories.id, factory.id));

            console.log(`🏭 [Socket] Factory ${factory.name} (ID: ${factory.id}) is now ONLINE`);
            io?.emit('factory_status_change', { factoryId: factory.id, isOnline: 1 });
          }
        }

        socket.emit('authenticated', { status: 'ok' });
      } catch (err) {
        console.error('❌ [Socket] Auth error:', err);
      }
    });

    // ── 2. 快速注册用户 ID（买家端使用，无需 token） ───────────────────────────
    socket.on('register_user', (data: { userId: number }) => {
      if (data.userId) {
        (socket as any).userId = data.userId;
        console.log(`👤 [Socket] User ${data.userId} registered on socket ${socket.id}`);
      }
    });

    // ── 3. 加入需求房间（买家进入等候室时调用） ────────────────────────────────
    // 房间名格式：demand:{demandId}
    // 用于接收 match_complete 和 match_expired 推送
    socket.on('join_demand_room', (data: { demandId: number }) => {
      if (!data.demandId) return;
      const roomName = `demand:${data.demandId}`;
      socket.join(roomName);
      console.log(`📋 [Socket] Socket ${socket.id} joined room ${roomName}`);
      socket.emit('joined_demand_room', { demandId: data.demandId, room: roomName });
    });

    // ── 4. 离开需求房间 ────────────────────────────────────────────────────────
    socket.on('leave_demand_room', (data: { demandId: number }) => {
      if (!data.demandId) return;
      const roomName = `demand:${data.demandId}`;
      socket.leave(roomName);
      console.log(`📋 [Socket] Socket ${socket.id} left room ${roomName}`);
    });

    // ── 5. 断开连接处理 ────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const factoryId = (socket as any).factoryId;
      if (factoryId) {
        try {
          const db = await dbPromise;
          await db.update(schema.factories)
            .set({ isOnline: 0 } as any)
            .where(eq(schema.factories.id, factoryId));

          console.log(`🔌 [Socket] Factory ID ${factoryId} is now OFFLINE`);
          io?.emit('factory_status_change', { factoryId, isOnline: 0 });
        } catch (err) {
          console.error('❌ [Socket] Disconnect update failed:', err);
        }
      }
      console.log(`🔌 [Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * 获取 SocketIO 实例
 */
export function getIO() {
  return io;
}

/**
 * 向特定用户发送实时通知
 */
export function sendLiveNotification(userId: number, data: any) {
  if (!io) return;
  const sockets = Array.from(io.sockets.sockets.values());
  const userSockets = sockets.filter(s => (s as any).userId === userId);
  userSockets.forEach(s => {
    s.emit('notification', data);
  });
}

/**
 * 向特定工厂发送握手请求通知
 */
export function sendHandshakeRequestToFactory(factoryId: number, data: any) {
  if (!io) return;
  const sockets = Array.from(io.sockets.sockets.values());
  const factorySockets = sockets.filter(s => (s as any).factoryId === factoryId);
  factorySockets.forEach(s => {
    s.emit('handshake_request', data);
  });
  console.log(`📡 [Socket] Sent handshake_request to factory ${factoryId} (${factorySockets.length} sockets)`);
}

/**
 * 向买家发送握手响应通知（工厂 accept/reject 后调用）
 */
export function sendHandshakeResponseToBuyer(buyerUserId: number, data: any) {
  if (!io) return;
  const sockets = Array.from(io.sockets.sockets.values());
  const buyerSockets = sockets.filter(s => (s as any).userId === buyerUserId);
  buyerSockets.forEach(s => {
    s.emit('handshake_response', data);
  });
  console.log(`📡 [Socket] Sent handshake_response to buyer ${buyerUserId} (${buyerSockets.length} sockets)`);
}
