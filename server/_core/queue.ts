/**
 * RealSourcing 4.0 - Task Queue
 * 基于 BullMQ + Redis 的异步任务队列
 *
 * 解决的核心问题：
 * - triggerMatch 是 CPU 密集型操作（向量计算），同步执行会导致 HTTP 超时
 * - 需求 AI 解析是 IO 密集型操作（LLM 调用），同步执行会阻塞主线程
 *
 * 队列设计：
 * - factory-matching: 工厂匹配任务（需求触发）
 * - factory-embedding: 工厂能力向量生成任务（工厂入驻/更新触发）
 * - demand-processing: 需求 AI 解析任务（文件上传触发）
 */
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { ENV } from './env';

// ── Redis 连接 ─────────────────────────────────────────────────────────────────
// 优先使用环境变量中的 Redis URL，本地开发回退到默认配置
const redisConnection = new IORedis(ENV.redisUrl || 'redis://localhost:6379', {
  maxRetriesPerRequest: null, // BullMQ 要求此配置
  enableReadyCheck: false,
});

redisConnection.on('connect', () => console.log('[Queue] Redis connected'));
redisConnection.on('error', (err) => console.error('[Queue] Redis error:', err.message));

// ── 队列定义 ───────────────────────────────────────────────────────────────────

/** 工厂匹配队列 */
export const factoryMatchingQueue = new Queue('factory-matching', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },  // 保留最近 100 条完成记录
    removeOnFail: { count: 50 },
  },
});

/** 工厂 Embedding 生成队列 */
export const factoryEmbeddingQueue = new Queue('factory-embedding', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 20 },
  },
});

/** 队列事件监听（用于前端轮询状态） */
export const matchingQueueEvents = new QueueEvents('factory-matching', {
  connection: new IORedis(ENV.redisUrl || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  }),
});

// ── 任务类型定义 ───────────────────────────────────────────────────────────────

export interface FactoryMatchingJobData {
  demandId: number;
  userId: number;
  triggeredAt: string;
}

export interface FactoryEmbeddingJobData {
  factoryId: number;
  reason: 'onboarding' | 'profile_update';
}

/** 匹配过期任务数据类型 */
export interface MatchExpiryJobData {
  demandId: number;
  userId: number;
  triggeredAt: string;
}

// ── 工具函数 ───────────────────────────────────────────────────────────────────

/**
 * 向匹配队列添加任务
 * 使用 demandId 作为 jobId，防止同一需求重复触发
 */
export async function enqueueFactoryMatching(data: FactoryMatchingJobData) {
  const jobId = `match-demand-${data.demandId}`;

  // 检查是否已有相同任务在队列中
  const existing = await factoryMatchingQueue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state === 'waiting' || state === 'active') {
      return { jobId, status: 'already_queued', state };
    }
  }

  const job = await factoryMatchingQueue.add('match', data, { jobId });
  return { jobId: job.id, status: 'queued' };
}

/**
 * 向 Embedding 队列添加任务
 */
export async function enqueueFactoryEmbedding(data: FactoryEmbeddingJobData) {
  const jobId = `embed-factory-${data.factoryId}`;
  const job = await factoryEmbeddingQueue.add('embed', data, {
    jobId,
    priority: data.reason === 'onboarding' ? 1 : 5, // 入驻任务优先级更高
  });
  return { jobId: job.id };
}

/**
 * 查询匹配任务状态
 */
export async function getMatchingJobStatus(demandId: number) {
  const jobId = `match-demand-${demandId}`;
  const job = await factoryMatchingQueue.getJob(jobId);
  if (!job) return { status: 'not_found' };

  const state = await job.getState();
  const progress = job.progress;

  return {
    jobId,
    status: state,
    progress: typeof progress === 'number' ? progress : 0,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
  };
}

/** 匹配过期队列（15分钟后自动过期未处理的匹配结果） */
export const matchExpiryQueue = new Queue('match-expiry', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 50 },
  },
});

/**
 * 向过期队列添加延迟任务
 * 15分钟后自动将该需求的所有 pending 匹配结果标记为 expired
 */
export async function enqueueMatchExpiry(data: MatchExpiryJobData) {
  const jobId = `expire-demand-${data.demandId}`;
  const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
  // 先移除旧任务（重新触发时刷新计时器）
  const existing = await matchExpiryQueue.getJob(jobId);
  if (existing) {
    const state = await existing.getState();
    if (state === 'delayed' || state === 'waiting') {
      await existing.remove();
    }
  }
  const job = await matchExpiryQueue.add('expire', data, {
    jobId,
    delay: FIFTEEN_MINUTES_MS,
  });
  return { jobId: job.id };
}

export { redisConnection };

// ── RFQ Claw 队列（Open Claw Agent 任务） ─────────────────────────────────────
/** Open Claw Agent 报价抓取队列 */
export const rfqClawQueue = new Queue('rfq-claw-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
});

/** RFQ Claw 任务数据类型 */
export interface RfqClawJobData {
  demandId: number;
  factoryId: number;
  matchResultId?: number;
  buyerId: number;
  category?: string;
  productName?: string;
  enqueuedAt: string;
}

/** RFQ 超时告警任务数据类型 */
export interface RfqTimeoutAlertJobData {
  demandId: number;
  factoryId: number;
  elapsedMinutes: number;
}

/**
 * 查询 RFQ Claw 任务状态
 */
export async function getRfqClawJobStatus(demandId: number, factoryId: number) {
  const jobId = `rfq-claw-${demandId}-${factoryId}`;
  const job = await rfqClawQueue.getJob(jobId);
  if (!job) return { status: 'not_found', jobId };
  const state = await job.getState();
  return {
    jobId,
    status: state,
    progress: typeof job.progress === 'number' ? job.progress : 0,
    failedReason: job.failedReason,
    finishedOn: job.finishedOn,
  };
}
