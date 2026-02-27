/**
 * alertService.ts
 * 4.1 异常告警与自动降级服务
 *
 * 功能：
 *   1. 超时检测：定时扫描超过 30 分钟未完成的任务，标记为 timeout
 *   2. 失败自动重试：失败次数 < 3 次时自动重试
 *   3. 自动降级：Agent 连续失败 → 降级为人工处理（飞书告警卡片）
 *   4. 飞书告警：超时/失败/降级时推送飞书消息给运营
 *   5. WebSocket 推送：实时通知运营后台
 */

import { dbPromise } from '../db';
import * as schema from '../../drizzle/schema';
import { eq, lt, and, or, inArray, isNull, sql } from 'drizzle-orm';

// ─── 配置常量 ────────────────────────────────────────────────────────────────
const TIMEOUT_MINUTES = 30;           // 任务超时阈值（分钟）
const MAX_AUTO_RETRY = 3;             // 最大自动重试次数
const SCAN_INTERVAL_MS = 5 * 60 * 1000; // 每 5 分钟扫描一次
const DEGRADATION_THRESHOLD = 3;     // 连续失败 N 次触发降级告警

// ─── 类型定义 ────────────────────────────────────────────────────────────────
export interface AlertEvent {
  type: 'timeout' | 'failed' | 'degraded' | 'recovered';
  jobId: string;
  factoryId: number;
  buyerId: number;
  demandId: number;
  agentId?: string;
  message: string;
  timestamp: Date;
  autoRetried?: boolean;
  retryCount?: number;
}

// ─── 飞书告警卡片 ─────────────────────────────────────────────────────────────
async function sendAlertToFeishu(event: AlertEvent): Promise<void> {
  const chatId = process.env.FEISHU_OPS_CHAT_ID;
  if (!chatId) return;

  const colorMap = {
    timeout: 'orange',
    failed: 'red',
    degraded: 'red',
    recovered: 'green',
  };

  const emojiMap = {
    timeout: '⏰',
    failed: '❌',
    degraded: '🚨',
    recovered: '✅',
  };

  const titleMap = {
    timeout: 'Agent 任务超时告警',
    failed: 'Agent 任务失败告警',
    degraded: '⚠️ Agent 系统降级告警',
    recovered: 'Agent 任务已恢复',
  };

  const card = {
    msg_type: 'interactive',
    card: {
      config: { wide_screen_mode: true },
      header: {
        title: { tag: 'plain_text', content: `${emojiMap[event.type]} ${titleMap[event.type]}` },
        template: colorMap[event.type],
      },
      elements: [
        {
          tag: 'div',
          fields: [
            { is_short: true, text: { tag: 'lark_md', content: `**任务 ID**\n${event.jobId}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**时间**\n${event.timestamp.toLocaleString('zh-CN')}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**工厂 ID**\n${event.factoryId}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**买家 ID**\n${event.buyerId}` } },
          ],
        },
        {
          tag: 'div',
          text: { tag: 'lark_md', content: `**详情**\n${event.message}` },
        },
        ...(event.autoRetried ? [{
          tag: 'div',
          text: { tag: 'lark_md', content: `**自动处理**\n已自动重试（第 ${event.retryCount} 次）` },
        }] : []),
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: { tag: 'plain_text', content: '查看运营后台' },
              type: 'primary',
              url: `${process.env.VITE_APP_URL ?? 'https://app.realsourcing.com'}/ops`,
            },
          ],
        },
      ],
    },
  };

  try {
    const { getFeishuToken } = await import('./feishuService');
    const token = await getFeishuToken();
    await fetch('https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receive_id: chatId,
        ...card,
      }),
    });
  } catch (e) {
    console.error('[alertService] Failed to send Feishu alert:', e);
  }
}

// ─── WebSocket 推送告警 ───────────────────────────────────────────────────────
async function pushAlertToOps(event: AlertEvent): Promise<void> {
  try {
    const { getIo } = await import('./socketService');
    const io = getIo();
    if (io) {
      io.to('ops_room').emit('agent_alert', event);
    }
  } catch (e) {
    // socketService 可能未初始化，忽略
  }
}

// ─── 超时检测与自动降级 ────────────────────────────────────────────────────────
export async function scanAndHandleTimeouts(): Promise<void> {
  const db = await dbPromise;
  const timeoutThreshold = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);

  // 查找超时任务（状态为 processing/queued，且入队时间超过阈值）
  const timedOutJobs = await db
    .select()
    .from(schema.rfqClawJobs)
    .where(
      and(
        inArray(schema.rfqClawJobs.status, ['processing', 'queued']),
        lt(schema.rfqClawJobs.enqueuedAt, timeoutThreshold),
      )
    )
    .limit(50);

  for (const job of timedOutJobs) {
    console.log(`[alertService] Timeout detected: jobId=${job.jobId}, status=${job.status}`);

    // 标记为超时
    await db
      .update(schema.rfqClawJobs)
      .set({
        status: 'timeout',
        failureReason: `超过 ${TIMEOUT_MINUTES} 分钟未完成`,
        completedAt: new Date(),
        updatedAt: new Date(),
        timeoutAlertSent: true,
      } as any)
      .where(eq(schema.rfqClawJobs.jobId, job.jobId));

    // 自动重试（如果重试次数 < MAX_AUTO_RETRY）
    let autoRetried = false;
    if ((job.retryCount ?? 0) < MAX_AUTO_RETRY) {
      try {
        await db
          .update(schema.rfqClawJobs)
          .set({
            status: 'queued',
            retryCount: (job.retryCount ?? 0) + 1,
            failureReason: null,
            startedAt: null,
            completedAt: null,
            updatedAt: new Date(),
          } as any)
          .where(eq(schema.rfqClawJobs.jobId, job.jobId));

        setImmediate(async () => {
          try {
            const { autoSendRfq } = await import('./rfqService');
            await autoSendRfq({
              demandId: job.demandId,
              factoryId: job.factoryId,
              matchResultId: job.matchResultId ?? 0,
              buyerId: job.buyerId,
            });
          } catch (e) {
            console.error('[alertService] Auto-retry failed:', e);
          }
        });
        autoRetried = true;
      } catch (e) {
        console.error('[alertService] Failed to auto-retry job:', e);
      }
    }

    // 发送告警
    const event: AlertEvent = {
      type: 'timeout',
      jobId: job.jobId,
      factoryId: job.factoryId,
      buyerId: job.buyerId,
      demandId: job.demandId,
      agentId: job.agentId ?? undefined,
      message: `任务 ${job.jobId} 超过 ${TIMEOUT_MINUTES} 分钟未完成。${autoRetried ? `已自动重试（第 ${(job.retryCount ?? 0) + 1} 次）。` : '已达最大重试次数，需人工介入。'}`,
      timestamp: new Date(),
      autoRetried,
      retryCount: (job.retryCount ?? 0) + 1,
    };

    await Promise.all([
      sendAlertToFeishu(event),
      pushAlertToOps(event),
    ]);
  }
}

// ─── 失败任务处理 ──────────────────────────────────────────────────────────────
export async function handleJobFailure(
  jobId: string,
  reason: string,
): Promise<void> {
  const db = await dbPromise;
  const [job] = await db
    .select()
    .from(schema.rfqClawJobs)
    .where(eq(schema.rfqClawJobs.jobId, jobId))
    .limit(1);

  if (!job) return;

  const retryCount = (job.retryCount ?? 0) + 1;
  let autoRetried = false;

  if (retryCount <= MAX_AUTO_RETRY) {
    // 自动重试
    await db
      .update(schema.rfqClawJobs)
      .set({
        status: 'queued',
        retryCount,
        failureReason: null,
        startedAt: null,
        completedAt: null,
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.rfqClawJobs.jobId, jobId));

    setImmediate(async () => {
      try {
        const { autoSendRfq } = await import('./rfqService');
        await autoSendRfq({
          demandId: job.demandId,
          factoryId: job.factoryId,
          matchResultId: job.matchResultId ?? 0,
          buyerId: job.buyerId,
        });
      } catch (e) {
        console.error('[alertService] Auto-retry on failure failed:', e);
      }
    });
    autoRetried = true;
  } else {
    // 超过最大重试次数，标记为 failed 并触发降级
    await db
      .update(schema.rfqClawJobs)
      .set({
        status: 'failed',
        failureReason: reason,
        completedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.rfqClawJobs.jobId, jobId));

    // 检查是否需要触发 Agent 降级告警
    const recentFailures = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.rfqClawJobs)
      .where(
        and(
          eq(schema.rfqClawJobs.agentId, job.agentId ?? ''),
          eq(schema.rfqClawJobs.status, 'failed'),
          lt(schema.rfqClawJobs.updatedAt, new Date(Date.now() - 60 * 60 * 1000)), // 最近 1 小时
        )
      );

    const failureCount = Number(recentFailures[0]?.count ?? 0);
    if (failureCount >= DEGRADATION_THRESHOLD) {
      const degradeEvent: AlertEvent = {
        type: 'degraded',
        jobId,
        factoryId: job.factoryId,
        buyerId: job.buyerId,
        demandId: job.demandId,
        agentId: job.agentId ?? undefined,
        message: `Agent ${job.agentId ?? 'unknown'} 在最近 1 小时内连续失败 ${failureCount} 次，已触发降级告警。建议检查 Agent 状态或切换为人工处理。`,
        timestamp: new Date(),
      };
      await Promise.all([
        sendAlertToFeishu(degradeEvent),
        pushAlertToOps(degradeEvent),
      ]);
    }
  }

  // 发送失败告警
  const event: AlertEvent = {
    type: 'failed',
    jobId,
    factoryId: job.factoryId,
    buyerId: job.buyerId,
    demandId: job.demandId,
    agentId: job.agentId ?? undefined,
    message: `任务失败原因：${reason}。${autoRetried ? `已自动重试（第 ${retryCount} 次）。` : '已达最大重试次数，需人工介入。'}`,
    timestamp: new Date(),
    autoRetried,
    retryCount,
  };

  await Promise.all([
    sendAlertToFeishu(event),
    pushAlertToOps(event),
  ]);
}

// ─── 启动定时扫描 ──────────────────────────────────────────────────────────────
let scanTimer: ReturnType<typeof setInterval> | null = null;

export function startAlertScanner(): void {
  if (scanTimer) return; // 防止重复启动
  console.log(`[alertService] Starting alert scanner (interval: ${SCAN_INTERVAL_MS / 1000}s)`);
  scanTimer = setInterval(async () => {
    try {
      await scanAndHandleTimeouts();
    } catch (e) {
      console.error('[alertService] Scan error:', e);
    }
  }, SCAN_INTERVAL_MS);

  // 立即执行一次
  scanAndHandleTimeouts().catch(e => console.error('[alertService] Initial scan error:', e));
}

export function stopAlertScanner(): void {
  if (scanTimer) {
    clearInterval(scanTimer);
    scanTimer = null;
    console.log('[alertService] Alert scanner stopped');
  }
}
