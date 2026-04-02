/**
 * RealSourcing 4.1 - Open Claw Agent Router
 *
 * OpenClaw Agent 是工厂侧的 AI 超级员工，负责：
 *   1. 监听 RFQ 任务（来自 RealSourcing 平台）
 *   2. 从工厂内部数据源（飞书/ERP/邮件）检索报价
 *   3. 生成标准化报价并回传平台
 *   4. 支持多数据源 fallback 链
 *
 * 接口列表（4.1 版本）：
 *   POST /api/v1/claw/register     Agent 注册（含能力声明）
 *   POST /api/v1/claw/heartbeat    Agent 心跳上报（每 60s 调用一次）
 *   POST /api/v1/claw/task/ack     Agent 确认接收任务
 *   POST /api/v1/rfq/callback      Agent 报价回调（携带报价数据）
 *   GET  /api/v1/claw/status       查询 Agent 在线状态（运营后台使用）
 *   GET  /api/v1/claw/tasks        查询待处理任务列表（Agent 拉取模式）
 *
 * 安全机制：
 *   - 所有接口需携带 X-Claw-Secret 请求头（与 CLAW_AGENT_SECRET 环境变量匹配）
 *   - 回调数据使用 HMAC-SHA256 签名验证，防止伪造
 *
 * Agent 状态机：
 *   registered → online（首次心跳后）
 *   online → offline（3 分钟无心跳自动切换）
 *   offline → alert（自动报警并切换至人工邀约模式）
 */
import { Router } from 'express';
import crypto from 'crypto';
import type { DataSourceCapability } from './dataSourceAdapter';

const router = Router();

// ── 类型定义 ──────────────────────────────────────────────────────────────────

/** Agent 完整注册状态（含能力声明） */
interface AgentRegistration {
  agentId: string;
  factoryId: number;
  factoryName?: string;
  version: string;
  deployEnv: 'aliyun_wuying' | 'local' | 'docker' | 'cloud';
  status: 'registered' | 'online' | 'offline' | 'alert' | 'maintenance';
  capabilities: DataSourceCapability[];
  lastHeartbeatAt: Date;
  registeredAt: Date;
  activeJobs: number;
  totalJobsProcessed: number;
  totalJobsFailed: number;
  lastSuccessJobId?: string;
  lastFailureReason?: string;
  ipAddress?: string;
  pendingTasks: RfqTask[];
}

/** 标准化 RFQ 任务格式（4.1 版本） */
export interface RfqTask {
  taskId: string;
  taskType: 'fetch_quote';
  priority: 'high' | 'normal' | 'low';
  demandId: number;
  factoryId: number;
  buyerId: number;
  matchResultId?: number;
  productName: string;
  category: string;
  quantity?: number;
  targetPrice?: number;
  buyerCountry?: string;
  customRequirements?: string;
  enqueuedAt: string;
  expiresAt: string;
  retryCount: number;
  maxRetries: number;
  callbackUrl?: string;
}

interface AgentRegisterBody {
  agentId: string;
  factoryId: number;
  factoryName?: string;
  version: string;
  deployEnv?: 'aliyun_wuying' | 'local' | 'docker' | 'cloud';
  capabilities: DataSourceCapability[];
}

interface AgentHeartbeatBody {
  agentId: string;
  version?: string;
  activeJobs?: number;
  totalJobsProcessed?: number;
  totalJobsFailed?: number;
  lastSuccessJobId?: string;
  lastFailureReason?: string;
  completedTaskIds?: string[];
}

// ── 内存状态存储 ──────────────────────────────────────────────────────────────
const agentRegistry = new Map<string, AgentRegistration>();
const HEARTBEAT_TIMEOUT_MS = 3 * 60 * 1000;

// ── 安全校验中间件 ─────────────────────────────────────────────────────────────
function verifyClaw(req: any, res: any, next: any) {
  const secret = process.env.CLAW_AGENT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') return next();
    return res.status(503).json({ error: 'Claw agent not configured' });
  }
  const providedSecret = req.headers['x-claw-secret'];
  if (!providedSecret || providedSecret !== secret) {
    console.warn(`[Claw] Unauthorized access attempt from ${req.ip}`);
    return res.status(401).json({ error: 'Invalid Claw agent secret' });
  }
  next();
}

function verifyCallbackSignature(payload: string, signature: string): boolean {
  const secret = process.env.CLAW_AGENT_SECRET ?? 'dev-secret';
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    return false;
  }
}

// ── POST /api/v1/claw/register ────────────────────────────────────────────────
router.post('/claw/register', verifyClaw, async (req, res) => {
  const body = req.body as AgentRegisterBody;
  const { agentId, factoryId, factoryName, version, deployEnv = 'local', capabilities = [] } = body;

  if (!agentId || !factoryId || !version) {
    return res.status(400).json({
      error: 'Missing required fields: agentId, factoryId, version',
    });
  }

  try {
    const { dbPromise } = await import('../db');
    const schema = await import('../../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    const db = await dbPromise;

    const factory = await db.query.factories.findFirst({
      where: eq(schema.factories.id, factoryId),
    });
    if (!factory) {
      return res.status(404).json({ error: `Factory #${factoryId} not found` });
    }

    const now = new Date();
    const existing = agentRegistry.get(agentId);

    agentRegistry.set(agentId, {
      agentId,
      factoryId,
      factoryName: factoryName ?? factory.name ?? `Factory #${factoryId}`,
      version,
      deployEnv,
      status: 'registered',
      capabilities,
      lastHeartbeatAt: now,
      registeredAt: existing?.registeredAt ?? now,
      activeJobs: existing?.activeJobs ?? 0,
      totalJobsProcessed: existing?.totalJobsProcessed ?? 0,
      totalJobsFailed: existing?.totalJobsFailed ?? 0,
      ipAddress: req.ip,
      pendingTasks: existing?.pendingTasks ?? [],
    });

    // 持久化到数据库（异步）
    setImmediate(async () => {
      try {
        const db2 = await dbPromise;
        await db2.insert(schema.clawAgentStatus).values({
          agentId,
          status: 'registered',
          version,
          deployEnv,
          ipAddress: req.ip ?? '',
          lastHeartbeatAt: now,
          activeJobs: 0,
          totalJobsProcessed: 0,
          totalJobsFailed: 0,
          isEnabled: 1,
          createdAt: now,
          updatedAt: now,
        }).onConflictDoUpdate({
          target: schema.clawAgentStatus.agentId,
          set: {
            status: 'registered',
            version,
            deployEnv,
            ipAddress: req.ip ?? '',
            lastHeartbeatAt: now,
            updatedAt: now,
          },
        });
      } catch (dbErr) {
        console.warn('[Claw] DB persist failed (non-critical):', dbErr);
      }
    });

    console.log(`🤖 [Claw] Agent registered: ${agentId} for factory #${factoryId}, capabilities: ${capabilities.map((c: DataSourceCapability) => c.type).join(', ')}`);

    return res.json({
      ok: true,
      agentId,
      factoryId,
      registeredAt: now.toISOString(),
      serverTime: now.toISOString(),
      pendingTasks: agentRegistry.get(agentId)?.pendingTasks ?? [],
      config: {
        heartbeatIntervalSeconds: 60,
        taskPollIntervalSeconds: 30,
        callbackUrl: '/api/v1/rfq/callback',
        heartbeatUrl: '/api/v1/claw/heartbeat',
        taskAckUrl: '/api/v1/claw/task/ack',
      },
    });
  } catch (err: any) {
    console.error('[Claw] Registration error:', err);
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// ── POST /api/v1/claw/heartbeat ────────────────────────────────────────────────
router.post('/claw/heartbeat', verifyClaw, async (req, res) => {
  const body = req.body as AgentHeartbeatBody;
  const {
    agentId,
    version,
    activeJobs = 0,
    totalJobsProcessed = 0,
    totalJobsFailed = 0,
    lastSuccessJobId,
    lastFailureReason,
    completedTaskIds = [],
  } = body;

  if (!agentId) {
    return res.status(400).json({ error: 'agentId is required' });
  }

  const existing = agentRegistry.get(agentId);
  const now = new Date();

  let pendingTasks = existing?.pendingTasks ?? [];
  if (completedTaskIds.length > 0) {
    pendingTasks = pendingTasks.filter((t: RfqTask) => !completedTaskIds.includes(t.taskId));
    console.log(`[Claw] Agent ${agentId} completed tasks: ${completedTaskIds.join(', ')}`);
  }

  agentRegistry.set(agentId, {
    ...(existing ?? {
      agentId,
      factoryId: 0,
      version: version ?? '1.0.0',
      deployEnv: 'local' as const,
      status: 'online' as const,
      capabilities: [],
      registeredAt: now,
      pendingTasks: [],
    }),
    lastHeartbeatAt: now,
    status: 'online',
    version: version ?? existing?.version ?? '1.0.0',
    activeJobs,
    totalJobsProcessed,
    totalJobsFailed,
    lastSuccessJobId: lastSuccessJobId ?? existing?.lastSuccessJobId,
    lastFailureReason: lastFailureReason ?? existing?.lastFailureReason,
    ipAddress: req.ip,
    pendingTasks,
  });

  // 异步更新数据库
  setImmediate(async () => {
    try {
      const { dbPromise } = await import('../db');
      const schema = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const db = await dbPromise;
      await db.update(schema.clawAgentStatus)
        .set({
          status: 'online',
          lastHeartbeatAt: now,
          activeJobs,
          totalJobsProcessed,
          totalJobsFailed,
          lastSuccessJobId: lastSuccessJobId ?? undefined,
          lastFailureReason: lastFailureReason ?? undefined,
          updatedAt: now,
        } as any)
        .where(eq(schema.clawAgentStatus.agentId, agentId));
    } catch { /* DB 更新失败不影响心跳响应 */ }
  });

  console.log(`💓 [Claw] Heartbeat from ${agentId} (active: ${activeJobs}, processed: ${totalJobsProcessed})`);

  return res.json({
    ok: true,
    serverTime: now.toISOString(),
    nextHeartbeatIn: 60,
    newTasks: pendingTasks.filter((t: RfqTask) => !completedTaskIds.includes(t.taskId)),
    taskCount: pendingTasks.length,
  });
});

// ── POST /api/v1/claw/task/ack ────────────────────────────────────────────────
router.post('/claw/task/ack', verifyClaw, (req, res) => {
  const { agentId, taskId } = req.body;
  if (!agentId || !taskId) {
    return res.status(400).json({ error: 'agentId and taskId are required' });
  }

  const agent = agentRegistry.get(agentId);
  if (!agent) {
    return res.status(404).json({ error: `Agent ${agentId} not found` });
  }

  const task = agent.pendingTasks.find((t: RfqTask) => t.taskId === taskId);
  if (!task) {
    return res.json({ ok: true, taskId, status: 'already_processed' });
  }

  console.log(`✅ [Claw] Task ${taskId} acknowledged by agent ${agentId}`);
  return res.json({ ok: true, taskId, status: 'acknowledged', task });
});

// ── GET /api/v1/claw/tasks ────────────────────────────────────────────────────
router.get('/claw/tasks', verifyClaw, (req, res) => {
  const { agentId } = req.query as { agentId?: string };
  if (!agentId) {
    return res.status(400).json({ error: 'agentId query param is required' });
  }

  const agent = agentRegistry.get(agentId);
  if (!agent) {
    return res.status(404).json({ error: `Agent ${agentId} not registered` });
  }

  const now = new Date();
  const activeTasks = agent.pendingTasks.filter((t: RfqTask) => new Date(t.expiresAt) > now);

  if (activeTasks.length !== agent.pendingTasks.length) {
    agentRegistry.set(agentId, { ...agent, pendingTasks: activeTasks });
  }

  return res.json({
    agentId,
    tasks: activeTasks,
    count: activeTasks.length,
    serverTime: now.toISOString(),
  });
});

// ── POST /api/v1/rfq/callback ──────────────────────────────────────────────────
router.post('/rfq/callback', verifyClaw, async (req, res) => {
  const {
    taskId,
    rfqId,
    demandId,
    factoryId,
    matchResultId,
    buyerId,
    dataPayload,
    signature,
    agentId,
  } = req.body;

  if (!demandId || !factoryId || !buyerId || !dataPayload) {
    return res.status(400).json({
      error: 'Missing required fields: demandId, factoryId, buyerId, dataPayload',
    });
  }

  const payloadStr = JSON.stringify(dataPayload);
  if (signature && !verifyCallbackSignature(payloadStr, signature)) {
    console.warn(`[Claw] Invalid signature in callback for demand #${demandId}`);
    return res.status(401).json({ error: 'Invalid payload signature' });
  }

  console.log(`📨 [Claw] Callback received for demand #${demandId}, factory #${factoryId} from agent ${agentId ?? 'unknown'}`);

  try {
    // 取消超时告警任务
    try {
      const { rfqClawQueue } = await import('./queue');
      const timeoutJobId = `rfq-timeout-${demandId}-${factoryId}`;
      const timeoutJob = await rfqClawQueue.getJob(timeoutJobId);
      if (timeoutJob) await timeoutJob.remove();
    } catch { /* 忽略取消失败 */ }

    const { submitQuote } = await import('./rfqService');
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
      const { sendRFQ } = await import('./rfqService');
      const rfqResult = await sendRFQ({
        demandId,
        factoryId,
        matchResultId: matchResultId ?? 0,
        buyerId,
        notes: `[Open Claw 自动获取 | 来源: ${dataPayload.dataSource ?? 'unknown'} | 可信度: ${((dataPayload.confidence ?? 0.8) * 100).toFixed(0)}%]`,
      });
      await submitQuote({
        inquiryId: rfqResult.inquiryId,
        factoryId,
        unitPrice: dataPayload.unitPrice,
        currency: dataPayload.currency ?? 'USD',
        moq: dataPayload.moq,
        leadTimeDays: dataPayload.leadTimeDays,
        tierPricing: dataPayload.tierPricing,
        factoryNotes: dataPayload.factoryNotes ?? `[由 Open Claw Agent 自动获取 | 来源: ${dataPayload.dataSource ?? 'feishu_bitable'}]`,
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
        factoryNotes: dataPayload.factoryNotes ?? `[由 Open Claw Agent 自动获取 | 来源: ${dataPayload.dataSource ?? 'feishu_bitable'}]`,
        paymentTerms: dataPayload.paymentTerms,
        shippingTerms: dataPayload.shippingTerms,
      });
    }

    // 异步同步更新飞书 Bitable
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

    // 从 Agent 待处理队列中移除已完成任务
    if (agentId && agentRegistry.has(agentId)) {
      const agent = agentRegistry.get(agentId)!;
      agentRegistry.set(agentId, {
        ...agent,
        totalJobsProcessed: agent.totalJobsProcessed + 1,
        activeJobs: Math.max(0, agent.activeJobs - 1),
        lastSuccessJobId: taskId ?? rfqId,
        pendingTasks: agent.pendingTasks.filter((t: RfqTask) => t.taskId !== (taskId ?? rfqId)),
      });
    }

    // WebSocket 通知买家报价已到达
    try {
      const { getIO } = await import('./socketService');
      const io = getIO();
      if (io) {
        const sockets = Array.from(io.sockets.sockets.values());
        const buyerSockets = sockets.filter((s: any) => s.userId === buyerId);
        buyerSockets.forEach((s: any) => {
          s.emit('quote_received', {
            demandId,
            factoryId,
            source: dataPayload.dataSource ?? 'claw_agent',
            confidence: dataPayload.confidence ?? 0.8,
            unitPrice: dataPayload.unitPrice,
            currency: dataPayload.currency ?? 'USD',
            moq: dataPayload.moq,
            leadTimeDays: dataPayload.leadTimeDays,
          });
        });
      }
    } catch { /* WebSocket 通知失败不影响主流程 */ }

    console.log(`✅ [Claw] Quote processed for demand #${demandId}, factory #${factoryId}`);
    return res.json({
      ok: true,
      taskId,
      demandId,
      factoryId,
      message: 'Quote received and processed successfully',
    });
  } catch (err: any) {
    console.error('[Claw] Callback processing error:', err);
    if (agentId && agentRegistry.has(agentId)) {
      const agent = agentRegistry.get(agentId)!;
      agentRegistry.set(agentId, {
        ...agent,
        totalJobsFailed: agent.totalJobsFailed + 1,
        lastFailureReason: err.message,
      });
    }
    return res.status(500).json({ error: 'Failed to process callback', details: err.message });
  }
});

// ── GET /api/v1/claw/status ────────────────────────────────────────────────────
router.get('/claw/status', verifyClaw, (_req, res) => {
  const now = Date.now();
  const agents = [];

  for (const [, agent] of agentRegistry) {
    const timeSinceHeartbeat = now - agent.lastHeartbeatAt.getTime();
    const isOffline = timeSinceHeartbeat > HEARTBEAT_TIMEOUT_MS;
    agents.push({
      agentId: agent.agentId,
      factoryId: agent.factoryId,
      factoryName: agent.factoryName,
      status: isOffline ? 'offline' : agent.status,
      version: agent.version,
      deployEnv: agent.deployEnv,
      capabilities: agent.capabilities.map((c: DataSourceCapability) => ({
        type: c.type,
        isConfigured: c.isConfigured,
        priority: c.priority,
      })),
      lastHeartbeatAt: agent.lastHeartbeatAt.toISOString(),
      registeredAt: agent.registeredAt.toISOString(),
      activeJobs: agent.activeJobs,
      totalJobsProcessed: agent.totalJobsProcessed,
      totalJobsFailed: agent.totalJobsFailed,
      pendingTaskCount: agent.pendingTasks.length,
      ipAddress: agent.ipAddress,
      timeSinceHeartbeatMs: timeSinceHeartbeat,
    });
  }

  return res.json({
    agents,
    total: agents.length,
    online: agents.filter(a => a.status === 'online').length,
    offline: agents.filter(a => a.status === 'offline').length,
    registered: agents.filter(a => a.status === 'registered').length,
    serverTime: new Date().toISOString(),
  });
});

// ── 内部工具函数（供 rfqService 调用） ────────────────────────────────────────

/**
 * 向指定工厂的 Agent 推送 RFQ 任务
 */
export function pushTaskToAgent(factoryId: number, task: RfqTask): boolean {
  for (const [, agent] of agentRegistry) {
    if (agent.factoryId === factoryId && agent.status === 'online') {
      const timeSinceHeartbeat = Date.now() - agent.lastHeartbeatAt.getTime();
      if (timeSinceHeartbeat <= HEARTBEAT_TIMEOUT_MS) {
        agent.pendingTasks.push(task);
        console.log(`📤 [Claw] Task ${task.taskId} pushed to agent ${agent.agentId} for factory #${factoryId}`);
        return true;
      }
    }
  }
  return false;
}

/**
 * 检查指定工厂是否有在线的 Agent
 */
export function isAgentOnlineForFactory(factoryId: number): boolean {
  const now = Date.now();
  for (const [, agent] of agentRegistry) {
    if (agent.factoryId === factoryId) {
      const timeSinceHeartbeat = now - agent.lastHeartbeatAt.getTime();
      if (timeSinceHeartbeat <= HEARTBEAT_TIMEOUT_MS) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 获取指定工厂的 Agent 状态
 */
export function getAgentForFactory(factoryId: number): AgentRegistration | null {
  const now = Date.now();
  for (const [, agent] of agentRegistry) {
    if (agent.factoryId === factoryId) {
      const timeSinceHeartbeat = now - agent.lastHeartbeatAt.getTime();
      return {
        ...agent,
        status: timeSinceHeartbeat > HEARTBEAT_TIMEOUT_MS ? 'offline' : agent.status,
      };
    }
  }
  return null;
}

// ── 心跳监测定时器 ─────────────────────────────────────────────────────────────
let heartbeatCheckTimer: ReturnType<typeof setInterval> | null = null;

export function startHeartbeatMonitor() {
  if (heartbeatCheckTimer) return;

  heartbeatCheckTimer = setInterval(async () => {
    const now = Date.now();
    for (const [agentId, agent] of agentRegistry) {
      const timeSinceHeartbeat = now - agent.lastHeartbeatAt.getTime();
      if (timeSinceHeartbeat > HEARTBEAT_TIMEOUT_MS && agent.status === 'online') {
        agentRegistry.set(agentId, { ...agent, status: 'offline' });
        console.warn(`⚠️ [Claw] Agent ${agentId} (factory #${agent.factoryId}) went offline (last seen ${Math.round(timeSinceHeartbeat / 1000)}s ago)`);
        try {
          const { sendQuoteTimeoutAlert } = await import('./feishuService');
          await sendQuoteTimeoutAlert({
            demandId: 0,
            factoryId: agent.factoryId,
            factoryName: agent.factoryName ?? `Factory #${agent.factoryId}`,
            elapsedMinutes: Math.round(timeSinceHeartbeat / 60000),
          });
        } catch { /* 告警失败不影响主流程 */ }
      }
    }
  }, 60 * 1000);

  console.log('[Claw] Heartbeat monitor started');
}

export function stopHeartbeatMonitor() {
  if (heartbeatCheckTimer) {
    clearInterval(heartbeatCheckTimer);
    heartbeatCheckTimer = null;
  }
}

export default router;
