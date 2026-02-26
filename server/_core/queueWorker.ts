/**
 * RealSourcing 4.0 - Queue Worker
 * BullMQ Worker 处理器，运行在主进程中注册
 *
 * 处理三类任务：
 * 1. factory-matching：触发工厂匹配计算，结果写入 demandMatchResults，并通过 WebSocket 推送
 * 2. factory-embedding：为工厂生成能力向量，写入 factoryCapabilityEmbeddings
 * 3. match-expiry：15分钟后自动将 pending 状态的握手请求标记为 expired
 */
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ENV } from './env';
import { matchFactoriesForDemand, updateFactoryCapabilityEmbedding } from './factoryMatchingService';
import { FactoryMatchingJobData, FactoryEmbeddingJobData, MatchExpiryJobData } from './queue';
import { dbPromise } from '../db';
import * as schema from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getIO } from './socketService';

const workerConnection = new IORedis(ENV.redisUrl || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// ── Worker 1：工厂匹配 ─────────────────────────────────────────────────────────
export const factoryMatchingWorker = new Worker<FactoryMatchingJobData>(
  'factory-matching',
  async (job: Job<FactoryMatchingJobData>) => {
    const { demandId, userId } = job.data;
    console.log(`[Worker] Starting factory matching for demand #${demandId}`);
    await job.updateProgress(10);

    // 执行核心匹配逻辑（内部已包含 AI 理由生成 + WebSocket 推送）
    const results = await matchFactoriesForDemand(demandId);
    await job.updateProgress(90);

    // 更新需求状态为 matched
    const db = await dbPromise;
    await db.update(schema.sourcingDemands)
      .set({ status: 'matched' } as any)
      .where(eq(schema.sourcingDemands.id, demandId));

    await job.updateProgress(100);
    console.log(`[Worker] Matching complete for demand #${demandId}, found ${results.length} matches`);
    return { demandId, matchCount: results.length };
  },
  {
    connection: workerConnection,
    concurrency: 5,
  }
);

// ── Worker 2：工厂 Embedding 生成 ──────────────────────────────────────────────
export const factoryEmbeddingWorker = new Worker<FactoryEmbeddingJobData>(
  'factory-embedding',
  async (job: Job<FactoryEmbeddingJobData>) => {
    const { factoryId, reason } = job.data;
    console.log(`[Worker] Generating embedding for factory #${factoryId} (reason: ${reason})`);

    const result = await updateFactoryCapabilityEmbedding(factoryId);
    if (!result) {
      throw new Error(`Failed to generate embedding for factory #${factoryId}`);
    }

    console.log(`[Worker] Embedding generated for factory #${factoryId}`);
    return { factoryId, success: true };
  },
  {
    connection: workerConnection,
    concurrency: 3,
  }
);

// ── Worker 3：匹配过期处理 ─────────────────────────────────────────────────────
// 15分钟延迟任务：将 pending 状态的握手请求标记为 expired，并通知买家
export const matchExpiryWorker = new Worker<MatchExpiryJobData>(
  'match-expiry',
  async (job: Job<MatchExpiryJobData>) => {
    const { demandId, userId } = job.data;
    console.log(`[ExpiryWorker] Processing expiry for demand #${demandId}`);

    const db = await dbPromise;

    // 1. 查找该需求所有 pending 状态的握手请求
    const expiredHandshakes = await db.query.handshakeRequests.findMany({
      where: and(
        eq(schema.handshakeRequests.demandId, demandId),
        eq(schema.handshakeRequests.status, 'pending')
      ),
    });

    if (expiredHandshakes.length > 0) {
      // 2. 批量标记为 expired
      await db.update(schema.handshakeRequests)
        .set({ status: 'expired', updatedAt: new Date() } as any)
        .where(
          and(
            eq(schema.handshakeRequests.demandId, demandId),
            eq(schema.handshakeRequests.status, 'pending')
          )
        );

      console.log(`[ExpiryWorker] Expired ${expiredHandshakes.length} pending handshakes for demand #${demandId}`);

      // 3. 通过 WebSocket 通知买家：匹配窗口已关闭
      const io = getIO();
      if (io) {
        const sockets = Array.from(io.sockets.sockets.values());
        const buyerSockets = sockets.filter((s: any) => s.userId === userId);

        const expiryPayload = {
          type: 'match_expired',
          demandId,
          expiredHandshakeIds: expiredHandshakes.map((h: any) => h.id),
          message: '15分钟匹配窗口已关闭，未响应的握手请求已自动过期。',
        };

        buyerSockets.forEach((s: any) => {
          s.emit('match_expired', expiryPayload);
        });

        // 同时向 demand 房间广播
        io.to(`demand:${demandId}`).emit('match_expired', expiryPayload);

        console.log(`📡 [ExpiryWorker] Notified ${buyerSockets.length} buyer socket(s) of expiry`);
      }
    } else {
      console.log(`[ExpiryWorker] No pending handshakes found for demand #${demandId}`);
    }

    return { demandId, expiredCount: expiredHandshakes.length };
  },
  {
    connection: workerConnection,
    concurrency: 10,
  }
);

// ── 事件监听（日志） ────────────────────────────────────────────────────────────
factoryMatchingWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed:`, job.returnvalue);
});

factoryMatchingWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

factoryEmbeddingWorker.on('failed', (job, err) => {
  console.error(`[EmbedWorker] Job ${job?.id} failed:`, err.message);
});

matchExpiryWorker.on('completed', (job) => {
  console.log(`[ExpiryWorker] Job ${job.id} completed:`, job.returnvalue);
});

matchExpiryWorker.on('failed', (job, err) => {
  console.error(`[ExpiryWorker] Job ${job?.id} failed:`, err.message);
});

console.log('[Worker] Factory matching, embedding, and expiry workers started');
