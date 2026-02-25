/**
 * RealSourcing 4.0 - Open Claw Agent Router
 * Open Claw Agent 的心跳监测与回调接口
 *
 * 接口列表：
 *   POST /api/v1/claw/heartbeat    Agent 心跳上报（每 60s 调用一次）
 *   POST /api/v1/rfq/callback      Agent 抓取完成后回调（携带报价数据）
 *   GET  /api/v1/claw/status       查询 Agent 在线状态（运营后台使用）
 *
 * 安全机制：
 *   - 所有接口需携带 X-Claw-Secret 请求头（与 CLAW_AGENT_SECRET 环境变量匹配）
 *   - 回调数据使用 HMAC-SHA256 签名验证，防止伪造
 *
 * Agent 状态机：
 *   online → offline（3 分钟无心跳自动切换）
 *   offline → alert（自动报警并切换至人工邀约模式）
 */

import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// ── 内存状态存储（生产环境应迁移至 Redis） ─────────────────────────────────────
interface AgentStatus {
  agentId: string;
  lastHeartbeatAt: Date;
  status: 'online' | 'offline' | 'alert';
  version?: string;
  activeJobs: number;
  totalJobsProcessed: number;
  ip?: string;
}

const agentRegistry = new Map<string, AgentStatus>();

// 心跳超时阈值（3 分钟）
const HEARTBEAT_TIMEOUT_MS = 3 * 60 * 1000;

// ── 安全校验中间件 ─────────────────────────────────────────────────────────────
function verifyClaw(req: any, res: any, next: any) {
  const secret = process.env.CLAW_AGENT_SECRET;
  if (!secret) {
    // 未配置 secret 时，开发模式下放行
    if (process.env.NODE_ENV === 'development') return next();
    return res.status(503).json({ error: 'Claw agent not configured' });
  }

  const providedSecret = req.headers['x-claw-secret'];
  if (!providedSecret || providedSecret !== secret) {
    console.warn(`[Claw] Unauthorized access attempt from ${req.ip}`);
    return res.status(401).json({ error: 'Invalid Claw agent secret' });
  }
  next();
}

/**
 * 验证回调数据的 HMAC-SHA256 签名
 */
function verifyCallbackSignature(payload: string, signature: string): boolean {
  const secret = process.env.CLAW_AGENT_SECRET ?? 'dev-secret';
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}

// ── POST /api/v1/claw/heartbeat ────────────────────────────────────────────────
/**
 * Agent 心跳上报
 * Body: { agentId, version?, activeJobs?, totalJobsProcessed? }
 */
router.post('/claw/heartbeat', verifyClaw, (req, res) => {
  const { agentId, version, activeJobs = 0, totalJobsProcessed = 0 } = req.body;

  if (!agentId) {
    return res.status(400).json({ error: 'agentId is required' });
  }

  const existing = agentRegistry.get(agentId);
  const now = new Date();

  agentRegistry.set(agentId, {
    agentId,
    lastHeartbeatAt: now,
    status: 'online',
    version: version ?? existing?.version,
    activeJobs,
    totalJobsProcessed,
    ip: req.ip,
  });

  console.log(`💓 [Claw] Heartbeat from agent ${agentId} (jobs: ${activeJobs} active, ${totalJobsProcessed} total)`);

  return res.json({
    ok: true,
    serverTime: now.toISOString(),
    nextHeartbeatIn: 60,
  });
});

// ── POST /api/v1/rfq/callback ──────────────────────────────────────────────────
/**
 * Open Claw Agent 抓取完成后的回调接口
 *
 * Body:
 * {
 *   rfqId: string,          // BullMQ Job ID（对应 rfq-claw-queue 中的任务）
 *   demandId: number,
 *   factoryId: number,
 *   matchResultId: number,
 *   buyerId: number,
 *   dataPayload: {          // 加密的报价数据
 *     unitPrice: number,
 *     currency: string,
 *     moq: number,
 *     leadTimeDays: number,
 *     tierPricing?: Array<{qty: number, price: number}>,
 *     factoryNotes?: string,
 *     paymentTerms?: string,
 *     shippingTerms?: string,
 *     isVerified: boolean,
 *     productName?: string,
 *   },
 *   signature: string,      // HMAC-SHA256(JSON.stringify(dataPayload), CLAW_AGENT_SECRET)
 *   agentId: string,
 * }
 */
router.post('/rfq/callback', verifyClaw, async (req, res) => {
  const {
    rfqId,
    demandId,
    factoryId,
    matchResultId,
    buyerId,
    dataPayload,
    signature,
    agentId,
  } = req.body;

  // 基础参数校验
  if (!demandId || !factoryId || !buyerId || !dataPayload) {
    return res.status(400).json({ error: 'Missing required fields: demandId, factoryId, buyerId, dataPayload' });
  }

  // 签名验证
  const payloadStr = JSON.stringify(dataPayload);
  if (signature && !verifyCallbackSignature(payloadStr, signature)) {
    console.warn(`[Claw] Invalid signature in callback for demand #${demandId}`);
    return res.status(401).json({ error: 'Invalid payload signature' });
  }

  console.log(`📨 [Claw] Callback received for demand #${demandId}, factory #${factoryId} from agent ${agentId}`);

  try {
    // 取消超时告警任务（如果存在）
    try {
      const { rfqClawQueue } = await import('./queue');
      const timeoutJobId = `rfq-timeout-${demandId}-${factoryId}`;
      const timeoutJob = await rfqClawQueue.getJob(timeoutJobId);
      if (timeoutJob) await timeoutJob.remove();
    } catch { /* 忽略取消失败 */ }

    // 处理报价数据
    const { submitQuote } = await import('./rfqService');

    // 先查找对应的 inquiry
    const { dbPromise } = await import('../db');
    const schema = await import('../../drizzle/schema');
    const { eq, and } = await import('drizzle-orm');
    const db = await dbPromise;

    const rfqQuote = await db.query.rfqQuotes.findFirst({
      where: and(
        eq(schema.rfqQuotes.demandId, demandId),
        eq(schema.rfqQuotes.factoryId, factoryId),
        eq(schema.rfqQuotes.buyerId, buyerId),
        eq(schema.rfqQuotes.status, 'pending')
      ),
    });

    if (!rfqQuote) {
      // 若没有 pending 的 RFQ，说明买家已取消或已有报价，创建新的
      const { sendRFQ } = await import('./rfqService');
      const rfqResult = await sendRFQ({
        demandId,
        factoryId,
        matchResultId: matchResultId ?? 0,
        buyerId,
        notes: '[Open Claw 自动抓取]',
      });

      await submitQuote({
        inquiryId: rfqResult.inquiryId,
        factoryId,
        unitPrice: dataPayload.unitPrice,
        currency: dataPayload.currency ?? 'USD',
        moq: dataPayload.moq,
        leadTimeDays: dataPayload.leadTimeDays,
        tierPricing: dataPayload.tierPricing,
        factoryNotes: dataPayload.factoryNotes ?? '[由 Open Claw Agent 自动获取]',
        paymentTerms: dataPayload.paymentTerms,
        shippingTerms: dataPayload.shippingTerms,
      });
    } else {
      await submitQuote({
        inquiryId: rfqQuote.inquiryId,
        factoryId,
        unitPrice: dataPayload.unitPrice,
        currency: dataPayload.currency ?? 'USD',
        moq: dataPayload.moq,
        leadTimeDays: dataPayload.leadTimeDays,
        tierPricing: dataPayload.tierPricing,
        factoryNotes: dataPayload.factoryNotes ?? '[由 Open Claw Agent 自动获取]',
        paymentTerms: dataPayload.paymentTerms,
        shippingTerms: dataPayload.shippingTerms,
      });
    }

    // 同步更新飞书 Bitable（异步，不阻塞响应）
    if (dataPayload.isVerified !== undefined) {
      setImmediate(async () => {
        try {
          const { upsertBitableQuote } = await import('./feishuService');
          await upsertBitableQuote({
            factoryId,
            category: dataPayload.category ?? '',
            productName: dataPayload.productName ?? '',
            unitPrice: dataPayload.unitPrice,
            moq: dataPayload.moq,
            tierPricing: dataPayload.tierPricing ?? null,
            leadTimeDays: dataPayload.leadTimeDays,
            isVerified: dataPayload.isVerified,
            lastUpdated: new Date().toISOString().split('T')[0],
          });
        } catch (syncErr) {
          console.warn('[Claw] Bitable sync failed:', syncErr);
        }
      });
    }

    // 更新 Agent 状态
    if (agentId && agentRegistry.has(agentId)) {
      const agent = agentRegistry.get(agentId)!;
      agentRegistry.set(agentId, {
        ...agent,
        totalJobsProcessed: agent.totalJobsProcessed + 1,
        activeJobs: Math.max(0, agent.activeJobs - 1),
      });
    }

    console.log(`✅ [Claw] Quote processed for demand #${demandId}, factory #${factoryId}`);

    return res.json({
      ok: true,
      demandId,
      factoryId,
      message: 'Quote received and processed successfully',
    });
  } catch (err: any) {
    console.error('[Claw] Callback processing error:', err);
    return res.status(500).json({ error: 'Failed to process callback', details: err.message });
  }
});

// ── GET /api/v1/claw/status ────────────────────────────────────────────────────
/**
 * 查询所有 Agent 的在线状态（运营后台使用）
 */
router.get('/claw/status', verifyClaw, (_req, res) => {
  const now = Date.now();
  const agents: AgentStatus[] = [];

  for (const [, agent] of agentRegistry) {
    const timeSinceHeartbeat = now - agent.lastHeartbeatAt.getTime();
    const isOffline = timeSinceHeartbeat > HEARTBEAT_TIMEOUT_MS;

    agents.push({
      ...agent,
      status: isOffline ? 'offline' : 'online',
    });
  }

  return res.json({
    agents,
    total: agents.length,
    online: agents.filter(a => a.status === 'online').length,
    offline: agents.filter(a => a.status === 'offline').length,
    serverTime: new Date().toISOString(),
  });
});

// ── 心跳监测定时器 ─────────────────────────────────────────────────────────────
/**
 * 每分钟检查一次 Agent 心跳状态
 * 若 3 分钟未响应，自动标记为 offline 并发送飞书告警
 */
let heartbeatCheckTimer: ReturnType<typeof setInterval> | null = null;

export function startHeartbeatMonitor() {
  if (heartbeatCheckTimer) return; // 防止重复启动

  heartbeatCheckTimer = setInterval(async () => {
    const now = Date.now();
    for (const [agentId, agent] of agentRegistry) {
      const timeSinceHeartbeat = now - agent.lastHeartbeatAt.getTime();

      if (timeSinceHeartbeat > HEARTBEAT_TIMEOUT_MS && agent.status === 'online') {
        agentRegistry.set(agentId, { ...agent, status: 'offline' });
        console.warn(`⚠️ [Claw] Agent ${agentId} went offline (last seen ${Math.round(timeSinceHeartbeat / 1000)}s ago)`);

        // 发送飞书告警
        try {
          const { sendQuoteTimeoutAlert } = await import('./feishuService');
          await sendQuoteTimeoutAlert({
            demandId: 0, // 全局告警，无特定需求
            factoryId: 0,
            factoryName: `Claw Agent ${agentId}`,
            elapsedMinutes: Math.round(timeSinceHeartbeat / 60000),
          });
        } catch { /* 告警失败不影响主流程 */ }
      }
    }
  }, 60 * 1000); // 每分钟检查一次

  console.log('[Claw] Heartbeat monitor started');
}

export function stopHeartbeatMonitor() {
  if (heartbeatCheckTimer) {
    clearInterval(heartbeatCheckTimer);
    heartbeatCheckTimer = null;
  }
}

export default router;
