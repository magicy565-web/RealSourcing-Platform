/**
 * RealSourcing - Global Task Queue
 * 全局任务队列（单例）
 *
 * 使用 p-queue 实现轻量级内存任务队列，无需 Redis。
 * 用于异步处理用户提交的采购需求（内容摄取、LLM 分析等耗时任务）。
 *
 * 并发控制：默认 2 个并发（防止 Playwright 占用过多资源）
 */

import PQueue from 'p-queue';

// ── 任务类型定义 ───────────────────────────────────────────────────────────────

export interface DemandTask {
  type: 'process_demand';
  demandId: number;
  sourceType: 'url' | 'video' | 'pdf' | 'text';
  sourceUri: string;
  userId: number;
  enqueuedAt: string;
}

export type WorkerTask = DemandTask;

// ── 队列实例（全局单例） ────────────────────────────────────────────────────────

/**
 * 主任务队列
 * - concurrency: 2 → 同时最多处理 2 个需求（防止 Playwright 占用过多内存）
 * - timeout: 5 分钟 → 超时自动失败
 * - throwOnTimeout: true → 超时抛出错误，触发失败回调
 */
export const demandQueue = new PQueue({
  concurrency: 2,
  timeout: 5 * 60 * 1000, // 5 minutes
  throwOnTimeout: true,
});

// ── 队列事件监听 ───────────────────────────────────────────────────────────────

demandQueue.on('active', () => {
  console.log(`⚙️  [TaskQueue] Worker active | Queue size: ${demandQueue.size} | Pending: ${demandQueue.pending}`);
});

demandQueue.on('idle', () => {
  console.log(`💤 [TaskQueue] Queue is idle`);
});

demandQueue.on('error', (error) => {
  console.error(`❌ [TaskQueue] Unhandled error:`, error);
});

// ── 队列状态查询 ───────────────────────────────────────────────────────────────

export function getQueueStatus() {
  return {
    size: demandQueue.size,       // 等待中的任务数
    pending: demandQueue.pending, // 正在执行的任务数
    isPaused: demandQueue.isPaused,
  };
}

// ── 任务处理器注册 ─────────────────────────────────────────────────────────────

type TaskHandler = (task: WorkerTask) => Promise<void>;
let _registeredHandler: TaskHandler | null = null;

export function registerTaskHandler(handler: TaskHandler) {
  _registeredHandler = handler;
  console.log(`✅ [TaskQueue] Task handler registered`);
}

/**
 * 将需求处理任务加入队列
 * 这是 tRPC 路由调用的入口
 */
export function enqueueDemandTask(task: DemandTask): void {
  if (!_registeredHandler) {
    console.error(`❌ [TaskQueue] No handler registered! Task for demand #${task.demandId} dropped.`);
    return;
  }

  const handler = _registeredHandler;

  demandQueue.add(
    async () => {
      console.log(`▶️  [TaskQueue] Starting task for demand #${task.demandId}`);
      await handler(task);
      console.log(`✅ [TaskQueue] Task completed for demand #${task.demandId}`);
    },
    { priority: 1 }
  ).catch((err) => {
    console.error(`❌ [TaskQueue] Task failed for demand #${task.demandId}:`, err);
  });

  console.log(`📬 [TaskQueue] Enqueued demand #${task.demandId} | Queue size: ${demandQueue.size + 1}`);
}
