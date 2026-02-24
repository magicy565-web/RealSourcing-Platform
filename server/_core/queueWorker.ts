/**
 * RealSourcing 4.0 - Queue Worker
 * BullMQ Worker 处理器，运行在独立进程中（或主进程中注册）
 *
 * 处理两类任务：
 * 1. factory-matching：触发工厂匹配计算，结果写入 demandMatchResults
 * 2. factory-embedding：为工厂生成能力向量，写入 factoryCapabilityEmbeddings
 */
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ENV } from './env';
import { matchFactoriesForDemand, updateFactoryCapabilityEmbedding } from './factoryMatchingService';
import { FactoryMatchingJobData, FactoryEmbeddingJobData } from './queue';
import { dbPromise } from '../db';
import * as schema from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

const workerConnection = new IORedis(ENV.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// ── Worker 1：工厂匹配 ─────────────────────────────────────────────────────────
export const factoryMatchingWorker = new Worker<FactoryMatchingJobData>(
  'factory-matching',
  async (job: Job<FactoryMatchingJobData>) => {
    const { demandId } = job.data;
    console.log(`[Worker] Starting factory matching for demand #${demandId}`);

    await job.updateProgress(10);

    // 执行核心匹配逻辑
    const results = await matchFactoriesForDemand(demandId);

    await job.updateProgress(90);

    // 更新需求状态，通知前端匹配完成
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
    concurrency: 5, // 同时处理 5 个匹配任务
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

console.log('[Worker] Factory matching and embedding workers started');
