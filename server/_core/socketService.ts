import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { dbPromise } from '../db';
import * as schema from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { authenticateUser } from './sdk';

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

    // 1. 鉴权：连接后必须发送身份信息
    socket.on('authenticate', async (data: { token?: string }) => {
      try {
        // 模拟请求对象用于 sdk 鉴权
        const mockReq = { headers: { cookie: `token=${data.token}` } } as any;
        const user = await authenticateUser(mockReq);

        if (!user) {
          socket.emit('error', { message: 'Authentication failed' });
          return;
        }

        (socket as any).userId = user.id;
        (socket as any).userRole = user.role;

        // 2. 如果是工厂用户，更新在线状态
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
            
            // 广播在线状态变更（可选，用于前端实时更新）
            io?.emit('factory_status_change', { factoryId: factory.id, isOnline: 1 });
          }
        }

        socket.emit('authenticated', { status: 'ok' });
      } catch (err) {
        console.error('❌ [Socket] Auth error:', err);
      }
    });

    // 3. 断开连接处理
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
  // 查找该用户的所有连接
  const sockets = Array.from(io.sockets.sockets.values());
  const userSockets = sockets.filter(s => (s as any).userId === userId);
  
  userSockets.forEach(s => {
    s.emit('notification', data);
  });
}
