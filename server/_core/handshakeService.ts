/**
 * RealSourcing 4.0 - Handshake Service
 * 15分钟实时匹配工厂核心服务
 *
 * 功能：
 * 1. 买家向匹配工厂发起"请求对话"握手
 * 2. 工厂接受/拒绝握手请求
 * 3. 握手成功后自动创建"需求沟通室"
 * 4. AI 自动发送智能开场白，帮助双方破冰
 * 5. 超时自动标记为 expired
 */

import { dbPromise } from '../db';
import * as schema from '../../drizzle/schema';
import { eq, and, lt, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getIO } from './socketService';
import { ENV } from './env';

// ── 常量 ──────────────────────────────────────────────────────────────────────

/** 握手请求超时时间（分钟） */
const HANDSHAKE_TIMEOUT_MINUTES = 15;

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface CreateHandshakeInput {
  demandId: number;
  factoryId: number;
  buyerId: number;
  matchResultId?: number;
  buyerMessage?: string;
}

export interface HandshakeResult {
  success: boolean;
  handshakeId?: number;
  roomSlug?: string;
  error?: string;
}

// ── 核心函数 ──────────────────────────────────────────────────────────────────

/**
 * 买家发起握手请求
 * 向工厂推送实时通知，等待工厂响应
 */
export async function createHandshakeRequest(
  input: CreateHandshakeInput
): Promise<HandshakeResult> {
  const db = await dbPromise;

  // 1. 检查是否已有 pending 的握手请求
  const existing = await db.query.handshakeRequests.findFirst({
    where: and(
      eq(schema.handshakeRequests.demandId, input.demandId),
      eq(schema.handshakeRequests.factoryId, input.factoryId),
      eq(schema.handshakeRequests.status, 'pending'),
    ),
  });

  if (existing) {
    return {
      success: true,
      handshakeId: existing.id,
      error: 'already_pending',
    };
  }

  // 2. 获取需求和工厂信息（用于通知内容）
  const [demand, factory] = await Promise.all([
    db.query.sourcingDemands.findFirst({
      where: eq(schema.sourcingDemands.id, input.demandId),
    }),
    db.query.factories.findFirst({
      where: eq(schema.factories.id, input.factoryId),
    }),
  ]);

  if (!demand || !factory) {
    return { success: false, error: 'demand_or_factory_not_found' };
  }

  // 3. 创建握手请求记录
  const expiresAt = new Date(Date.now() + HANDSHAKE_TIMEOUT_MINUTES * 60 * 1000);

  const [result] = await db.insert(schema.handshakeRequests).values({
    demandId: input.demandId,
    factoryId: input.factoryId,
    buyerId: input.buyerId,
    matchResultId: input.matchResultId,
    buyerMessage: input.buyerMessage,
    status: 'pending',
    expiresAt,
  });

  const handshakeId = (result as any).insertId as number;

  // 4. 通过 WebSocket 向工厂推送实时通知
  const io = getIO();
  if (io) {
    // 找到工厂用户的 socket 连接
    const sockets = Array.from(io.sockets.sockets.values());
    const factorySockets = sockets.filter(
      (s: any) => s.factoryId === input.factoryId
    );

    const notificationPayload = {
      type: 'handshake_request',
      handshakeId,
      demandId: input.demandId,
      buyerId: input.buyerId,
      productName: demand.productName ?? '未命名产品',
      productDescription: (demand.productDescription ?? '').slice(0, 200),
      estimatedQuantity: demand.estimatedQuantity,
      targetPrice: demand.targetPrice,
      visualReferences: Array.isArray(demand.visualReferences)
        ? (demand.visualReferences as string[]).slice(0, 1)
        : [],
      buyerMessage: input.buyerMessage,
      expiresAt: expiresAt.toISOString(),
      expiresInSeconds: HANDSHAKE_TIMEOUT_MINUTES * 60,
    };

    factorySockets.forEach((s: any) => {
      s.emit('handshake_request', notificationPayload);
    });

    console.log(
      `🤝 [Handshake] Request #${handshakeId} sent to factory ${factory.name} (${factorySockets.length} socket(s))`
    );
  }

  // 5. 设置超时自动过期（后台任务）
  setTimeout(async () => {
    try {
      await expireHandshakeRequest(handshakeId);
    } catch (err) {
      console.error(`❌ [Handshake] Auto-expire failed for #${handshakeId}:`, err);
    }
  }, HANDSHAKE_TIMEOUT_MINUTES * 60 * 1000);

  return { success: true, handshakeId };
}

/**
 * 工厂接受握手请求
 * 自动创建需求沟通室，并发送 AI 智能开场白
 */
export async function acceptHandshakeRequest(
  handshakeId: number,
  factoryUserId: number
): Promise<HandshakeResult> {
  const db = await dbPromise;

  // 1. 获取握手请求
  const handshake = await db.query.handshakeRequests.findFirst({
    where: eq(schema.handshakeRequests.id, handshakeId),
  });

  if (!handshake) return { success: false, error: 'handshake_not_found' };
  if (handshake.status !== 'pending') {
    return { success: false, error: `handshake_already_${handshake.status}` };
  }
  if (new Date() > handshake.expiresAt) {
    await db.update(schema.handshakeRequests)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(schema.handshakeRequests.id, handshakeId));
    return { success: false, error: 'handshake_expired' };
  }

  // 2. 验证工厂权限
  const factory = await db.query.factories.findFirst({
    where: eq(schema.factories.id, handshake.factoryId),
  });
  if (!factory || factory.userId !== factoryUserId) {
    return { success: false, error: 'unauthorized' };
  }

  // 3. 生成沟通室 slug
  const roomSlug = `room-${handshakeId}-${nanoid(8)}`;

  // 4. 更新握手状态
  await db.update(schema.handshakeRequests)
    .set({
      status: 'accepted',
      respondedAt: new Date(),
      roomSlug,
      updatedAt: new Date(),
    })
    .where(eq(schema.handshakeRequests.id, handshakeId));

  // 5. 获取需求详情，生成 AI 智能开场白
  const demand = await db.query.sourcingDemands.findFirst({
    where: eq(schema.sourcingDemands.id, handshake.demandId),
  });

  if (demand) {
    // 5a. 发送 AI 系统消息（开场白）
    const aiIntroMessage = generateAIIntroMessage(demand, factory);
    await db.insert(schema.sourcingRoomMessages).values({
      handshakeId,
      senderId: 0, // 0 = AI 系统
      senderRole: 'ai',
      content: aiIntroMessage,
      messageType: 'ai_intro',
    });

    // 5b. 发送系统通知消息
    await db.insert(schema.sourcingRoomMessages).values({
      handshakeId,
      senderId: 0,
      senderRole: 'ai',
      content: `🎉 连接成功！${factory.name} 已接受对话请求。沟通室已就绪，请开始您的采购洽谈。`,
      messageType: 'system',
    });
  }

  // 6. 通过 WebSocket 通知买家
  const io = getIO();
  if (io) {
    const sockets = Array.from(io.sockets.sockets.values());
    const buyerSockets = sockets.filter((s: any) => s.userId === handshake.buyerId);

    buyerSockets.forEach((s: any) => {
      s.emit('handshake_accepted', {
        handshakeId,
        factoryId: handshake.factoryId,
        factoryName: factory.name,
        roomSlug,
        roomUrl: `/sourcing-room/${roomSlug}`,
      });
    });

    console.log(
      `✅ [Handshake] #${handshakeId} accepted by factory ${factory.name}, room: ${roomSlug}`
    );
  }

  return { success: true, handshakeId, roomSlug };
}

/**
 * 工厂拒绝握手请求
 */
export async function rejectHandshakeRequest(
  handshakeId: number,
  factoryUserId: number,
  reason?: string
): Promise<HandshakeResult> {
  const db = await dbPromise;

  const handshake = await db.query.handshakeRequests.findFirst({
    where: eq(schema.handshakeRequests.id, handshakeId),
  });

  if (!handshake) return { success: false, error: 'handshake_not_found' };
  if (handshake.status !== 'pending') {
    return { success: false, error: `handshake_already_${handshake.status}` };
  }

  const factory = await db.query.factories.findFirst({
    where: eq(schema.factories.id, handshake.factoryId),
  });
  if (!factory || factory.userId !== factoryUserId) {
    return { success: false, error: 'unauthorized' };
  }

  await db.update(schema.handshakeRequests)
    .set({
      status: 'rejected',
      respondedAt: new Date(),
      factoryRejectReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(schema.handshakeRequests.id, handshakeId));

  // 通知买家
  const io = getIO();
  if (io) {
    const sockets = Array.from(io.sockets.sockets.values());
    const buyerSockets = sockets.filter((s: any) => s.userId === handshake.buyerId);
    buyerSockets.forEach((s: any) => {
      s.emit('handshake_rejected', {
        handshakeId,
        factoryId: handshake.factoryId,
        factoryName: factory.name,
        reason,
      });
    });
  }

  return { success: true, handshakeId };
}

/**
 * 自动过期握手请求
 */
export async function expireHandshakeRequest(handshakeId: number) {
  const db = await dbPromise;

  const handshake = await db.query.handshakeRequests.findFirst({
    where: and(
      eq(schema.handshakeRequests.id, handshakeId),
      eq(schema.handshakeRequests.status, 'pending'),
    ),
  });

  if (!handshake) return;

  await db.update(schema.handshakeRequests)
    .set({ status: 'expired', updatedAt: new Date() })
    .where(eq(schema.handshakeRequests.id, handshakeId));

  // 通知买家请求已过期
  const io = getIO();
  if (io) {
    const sockets = Array.from(io.sockets.sockets.values());
    const buyerSockets = sockets.filter((s: any) => s.userId === handshake.buyerId);
    buyerSockets.forEach((s: any) => {
      s.emit('handshake_expired', { handshakeId });
    });
  }

  console.log(`⏰ [Handshake] Request #${handshakeId} expired`);
}

/**
 * 获取沟通室消息列表
 */
export async function getSourcingRoomMessages(handshakeId: number, limit = 50) {
  const db = await dbPromise;
  return db.query.sourcingRoomMessages.findMany({
    where: eq(schema.sourcingRoomMessages.handshakeId, handshakeId),
    orderBy: [schema.sourcingRoomMessages.createdAt],
    limit,
  });
}

/**
 * 发送沟通室消息
 */
export async function sendSourcingRoomMessage(
  handshakeId: number,
  senderId: number,
  senderRole: 'buyer' | 'factory',
  content: string
) {
  const db = await dbPromise;

  const [result] = await db.insert(schema.sourcingRoomMessages).values({
    handshakeId,
    senderId,
    senderRole,
    content,
    messageType: 'text',
  });

  const messageId = (result as any).insertId as number;

  // 通过 WebSocket 广播消息
  const io = getIO();
  if (io) {
    io.emit(`sourcing_room_${handshakeId}`, {
      id: messageId,
      handshakeId,
      senderId,
      senderRole,
      content,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    });
  }

  return messageId;
}

/**
 * 获取需求的握手请求列表
 */
export async function getHandshakesByDemand(demandId: number) {
  const db = await dbPromise;
  return db.query.handshakeRequests.findMany({
    where: eq(schema.handshakeRequests.demandId, demandId),
    orderBy: [desc(schema.handshakeRequests.createdAt)],
  });
}

/**
 * 获取工厂的待处理握手请求
 */
export async function getFactoryPendingHandshakes(factoryId: number) {
  const db = await dbPromise;
  return db.query.handshakeRequests.findMany({
    where: and(
      eq(schema.handshakeRequests.factoryId, factoryId),
      eq(schema.handshakeRequests.status, 'pending'),
    ),
    orderBy: [desc(schema.handshakeRequests.createdAt)],
  });
}

/**
 * 通过 roomSlug 获取握手请求详情
 */
export async function getHandshakeByRoomSlug(roomSlug: string) {
  const db = await dbPromise;
  return db.query.handshakeRequests.findFirst({
    where: eq(schema.handshakeRequests.roomSlug, roomSlug),
  });
}

// ── 工具函数 ──────────────────────────────────────────────────────────────────

/**
 * 生成 AI 智能开场白
 * 帮助买家和工厂快速进入正题
 */
function generateAIIntroMessage(demand: any, factory: any): string {
  const productName = demand.productName ?? '该产品';
  const factoryName = factory.name ?? '工厂';
  const quantity = demand.estimatedQuantity ? `，预计采购量 ${demand.estimatedQuantity}` : '';
  const price = demand.targetPrice ? `，目标价格 ${demand.targetPrice}` : '';

  const features = Array.isArray(demand.keyFeatures) && demand.keyFeatures.length > 0
    ? `\n\n**核心需求特性：**\n${(demand.keyFeatures as string[]).slice(0, 3).map((f: string) => `• ${f}`).join('\n')}`
    : '';

  return `👋 你好，**${factoryName}**！

买家正在寻找 **${productName}** 的供应商${quantity}${price}。

${demand.productDescription ? `**产品描述：** ${demand.productDescription.slice(0, 300)}` : ''}${features}

请您初步评估一下贵厂的生产能力，并告知：
1. 是否有相关产品的生产经验？
2. 能否满足上述数量和价格要求？
3. 大致的交货周期是多少？

期待您的专业回复！🏭`;
}
