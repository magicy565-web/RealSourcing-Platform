/**
 * RealSourcing 4.0 - RFQ Service
 * 处理"30分钟获得报价"的核心业务逻辑
 *
 * 流程：
 * 1. 买家从匹配结果中选择工厂 → sendRFQ（创建标准化询价单）
 * 2. 工厂收到通知 → 查看 RFQ → submitQuote（提交阶梯报价）
 * 3. 买家收到通知 → 查看报价 → acceptQuote / rejectQuote
 * 4. 接受报价后 → 可选预约 Webinar 深入沟通
 */
import { dbPromise } from '../db';
import * as schema from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

// ── RFQ 发送 ───────────────────────────────────────────────────────────────────

export interface SendRFQInput {
  demandId: number;
  factoryId: number;
  matchResultId: number;
  buyerId: number;
  // 从需求中自动填充，买家可覆盖
  quantity?: number;
  destination?: string;
  notes?: string;
  // 期望的报价截止时间（小时数，默认 24 小时）
  quoteDeadlineHours?: number;
}

export async function sendRFQ(input: SendRFQInput) {
  const db = await dbPromise;

  return await db.transaction(async (tx) => {
    // 1. 创建标准化询价单
    const [inquiry] = await tx.insert(schema.inquiries).values({
      buyerId: input.buyerId,
      factoryId: input.factoryId,
      quantity: input.quantity ?? 100,
      destination: input.destination,
      notes: input.notes,
      status: 'pending',
    });

    const inquiryId = (inquiry as any).insertId;

    // 2. 创建 RFQ 报价单（等待工厂填写）
    await tx.insert(schema.rfqQuotes).values({
      inquiryId,
      demandId: input.demandId,
      factoryId: input.factoryId,
      buyerId: input.buyerId,
      status: 'pending',
      // 报价有效期：默认 7 天
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // 3. 更新匹配结果状态为 rfq_sent
    await tx.update(schema.demandMatchResults)
      .set({
        status: 'rfq_sent',
        rfqSentAt: new Date(),
      } as any)
      .where(eq(schema.demandMatchResults.id, input.matchResultId));

    // 4. 创建工厂侧通知
    await tx.insert(schema.notifications).values({
      userId: 0, // 将在路由层替换为工厂 userId
      factoryId: input.factoryId,
      type: 'rfq_received',
      title: 'New RFQ Received',
      message: `A buyer has sent you a Request for Quotation. Please review and submit your quote within 24 hours.`,
      data: JSON.stringify({ inquiryId, demandId: input.demandId }),
      isRead: 0,
    } as any);

    return { inquiryId, success: true };
  });
}

// ── 工厂提交报价 ───────────────────────────────────────────────────────────────

export interface SubmitQuoteInput {
  inquiryId: number;
  factoryId: number;
  unitPrice: number;
  currency?: string;
  moq: number;
  leadTimeDays: number;
  tierPricing?: Array<{ qty: number; unitPrice: number }>;
  factoryNotes?: string;
  paymentTerms?: string;
  shippingTerms?: string;
  sampleAvailable?: boolean;
  samplePrice?: number;
  sampleLeadDays?: number;
}

export async function submitQuote(input: SubmitQuoteInput) {
  const db = await dbPromise;

  return await db.transaction(async (tx) => {
    // 1. 更新 RFQ 报价单
    await tx.update(schema.rfqQuotes)
      .set({
        status: 'submitted',
        unitPrice: input.unitPrice.toFixed(2),
        currency: input.currency ?? 'USD',
        moq: input.moq,
        leadTimeDays: input.leadTimeDays,
        tierPricing: input.tierPricing ?? null,
        factoryNotes: input.factoryNotes,
        paymentTerms: input.paymentTerms,
        shippingTerms: input.shippingTerms,
        sampleAvailable: input.sampleAvailable ? 1 : 0,
        samplePrice: input.samplePrice?.toFixed(2),
        sampleLeadDays: input.sampleLeadDays,
        submittedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(
        and(
          eq(schema.rfqQuotes.inquiryId, input.inquiryId),
          eq(schema.rfqQuotes.factoryId, input.factoryId)
        )
      );

    // 2. 更新询价状态为 replied
    await tx.update(schema.inquiries)
      .set({
        status: 'replied',
        replyContent: input.factoryNotes,
        quotedPrice: input.unitPrice.toFixed(2),
        currency: input.currency ?? 'USD',
        repliedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.inquiries.id, input.inquiryId));

    // 3. 获取询价信息，用于通知买家
    const inquiry = await tx.query.inquiries.findFirst({
      where: eq(schema.inquiries.id, input.inquiryId),
    });

    if (inquiry) {
      // 4. 通知买家报价已提交
      await tx.insert(schema.notifications).values({
        userId: inquiry.buyerId,
        type: 'quote_received',
        title: 'Quote Received! 🎉',
        message: `A factory has submitted their quote. Unit price: ${input.currency ?? 'USD'} ${input.unitPrice}, MOQ: ${input.moq} units, Lead time: ${input.leadTimeDays} days.`,
        data: JSON.stringify({ inquiryId: input.inquiryId }),
        isRead: 0,
      } as any);
    }

    return { success: true };
  });
}

// ── 买家接受报价 ───────────────────────────────────────────────────────────────

export async function acceptQuote(inquiryId: number, buyerId: number, feedback?: string) {
  const db = await dbPromise;

  return await db.transaction(async (tx) => {
    // 验证所有权
    const quote = await tx.query.rfqQuotes.findFirst({
      where: and(
        eq(schema.rfqQuotes.inquiryId, inquiryId),
        eq(schema.rfqQuotes.buyerId, buyerId)
      ),
    });

    if (!quote) throw new Error('Quote not found or unauthorized');

    // 更新报价状态
    await tx.update(schema.rfqQuotes)
      .set({
        status: 'accepted',
        buyerFeedback: feedback,
        respondedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(schema.rfqQuotes.id, quote.id));

    // 更新询价状态
    await tx.update(schema.inquiries)
      .set({ status: 'accepted', updatedAt: new Date() } as any)
      .where(eq(schema.inquiries.id, inquiryId));

    // 通知工厂
    await tx.insert(schema.notifications).values({
      userId: 0, // 路由层填充工厂 userId
      factoryId: quote.factoryId,
      type: 'quote_accepted',
      title: 'Quote Accepted! 🎊',
      message: `The buyer has accepted your quote. Consider scheduling a Webinar to discuss next steps.`,
      data: JSON.stringify({ inquiryId }),
      isRead: 0,
    } as any);

    return { success: true, nextStep: 'schedule_webinar' };
  });
}

// ── 买家拒绝报价 ───────────────────────────────────────────────────────────────

export async function rejectQuote(inquiryId: number, buyerId: number, reason?: string) {
  const db = await dbPromise;

  const quote = await db.query.rfqQuotes.findFirst({
    where: and(
      eq(schema.rfqQuotes.inquiryId, inquiryId),
      eq(schema.rfqQuotes.buyerId, buyerId)
    ),
  });

  if (!quote) throw new Error('Quote not found or unauthorized');

  await db.update(schema.rfqQuotes)
    .set({
      status: 'rejected',
      buyerFeedback: reason,
      respondedAt: new Date(),
      updatedAt: new Date(),
    } as any)
    .where(eq(schema.rfqQuotes.id, quote.id));

  await db.update(schema.inquiries)
    .set({ status: 'closed', updatedAt: new Date() } as any)
    .where(eq(schema.inquiries.id, inquiryId));

  return { success: true };
}

// ── 获取报价详情 ───────────────────────────────────────────────────────────────

export async function getQuoteByInquiryId(inquiryId: number) {
  const db = await dbPromise;
  return await db.query.rfqQuotes.findFirst({
    where: eq(schema.rfqQuotes.inquiryId, inquiryId),
  });
}

// ── 获取工厂待处理的 RFQ 列表 ─────────────────────────────────────────────────

export async function getFactoryPendingRFQs(factoryId: number) {
  const db = await dbPromise;
  return await db.query.rfqQuotes.findMany({
    where: and(
      eq(schema.rfqQuotes.factoryId, factoryId),
      eq(schema.rfqQuotes.status, 'pending')
    ),
    orderBy: [desc(schema.rfqQuotes.createdAt)],
  });
}

// ── autoSendRfq：飞书优先 + BullMQ 降级 ───────────────────────────────────────
/**
 * 自动发送 RFQ 的核心调度逻辑（T1.2 任务）
 *
 * 执行流程：
 *   1. 从飞书 Bitable 报价库中搜索匹配记录
 *   2. 若找到有效报价 → 直接创建 RFQ + 发送飞书卡片（2 分钟极速报价）
 *   3. 若未找到 → 将任务入队 BullMQ rfq-claw-queue，由 Open Claw Agent 处理
 *   4. 若品类完全空缺 → 发送运营告警卡片
 */
export interface AutoSendRfqInput {
  demandId: number;
  factoryId: number;
  matchResultId: number;
  buyerId: number;
  category?: string;
  productName?: string;
  quantity?: number;
  destination?: string;
  notes?: string;
}

export interface AutoSendRfqResult {
  mode: 'feishu_instant' | 'claw_queued' | 'manual_fallback';
  inquiryId?: number;
  jobId?: string;
  feishuRecordId?: string;
  messageId?: string;
  message: string;
}

export async function autoSendRfq(input: AutoSendRfqInput): Promise<AutoSendRfqResult> {
  const db = await dbPromise;

  // ── Step 1: 查询飞书 Bitable 报价库 ──────────────────────────────────────────
  let feishuQuotes: any[] = [];
  try {
    const { searchBitableQuotes } = await import('./feishuService');
    feishuQuotes = await searchBitableQuotes({
      factoryId: input.factoryId,
      category: input.category,
      maxResults: 5,
    });
  } catch (feishuErr) {
    console.warn('[autoSendRfq] Feishu search failed, falling back to Claw queue:', feishuErr);
  }

  // ── Step 2: 飞书有数据 → 极速报价路径 ────────────────────────────────────────
  if (feishuQuotes.length > 0) {
    const bestQuote = feishuQuotes[0];

    // 检查报价是否过期（超过 90 天）
    const isExpired = bestQuote.lastUpdated
      ? (Date.now() - new Date(bestQuote.lastUpdated).getTime()) > 90 * 24 * 60 * 60 * 1000
      : false;

    // 创建标准 RFQ
    const rfqResult = await sendRFQ({
      demandId: input.demandId,
      factoryId: input.factoryId,
      matchResultId: input.matchResultId,
      buyerId: input.buyerId,
      quantity: input.quantity,
      destination: input.destination,
      notes: isExpired
        ? `${input.notes ?? ''} [价格仅供参考，报价已超过 90 天，正在核实中]`.trim()
        : input.notes,
    });

    // 自动提交飞书报价到 rfq_quotes 表
    await db.update(schema.rfqQuotes)
      .set({
        status: 'submitted',
        unitPrice: bestQuote.unitPrice.toFixed(2),
        moq: bestQuote.moq,
        leadTimeDays: bestQuote.leadTimeDays,
        tierPricing: bestQuote.tierPricing,
        factoryNotes: isExpired ? '价格仅供参考，报价已超过 90 天' : '来自飞书报价库（自动匹配）',
        submittedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(
        and(
          eq(schema.rfqQuotes.inquiryId, rfqResult.inquiryId),
          eq(schema.rfqQuotes.factoryId, input.factoryId)
        )
      );

    // 获取工厂名称
    let factoryName = `Factory #${input.factoryId}`;
    try {
      const factory = await (db as any).query?.factories?.findFirst?.({
        where: (f: any, { eq: eqFn }: any) => eqFn(f.id, input.factoryId),
      });
      if (factory) factoryName = factory.name ?? factoryName;
    } catch { /* 工厂查询失败不影响主流程 */ }

    // 发送飞书报价卡片
    let messageId: string | undefined;
    try {
      const { sendQuoteCard } = await import('./feishuService');
      const cardResult = await sendQuoteCard({
        isVerified: bestQuote.isVerified,
        factoryName,
        productName: bestQuote.productName || input.productName || 'Product',
        unitPrice: bestQuote.unitPrice,
        moq: bestQuote.moq,
        leadTimeDays: bestQuote.leadTimeDays,
        demandId: input.demandId,
        inquiryId: rfqResult.inquiryId,
      });
      messageId = cardResult?.messageId;
    } catch (cardErr) {
      console.warn('[autoSendRfq] Failed to send Feishu card:', cardErr);
    }

    console.log(`✅ [autoSendRfq] Instant quote via Feishu for demand #${input.demandId}, inquiry #${rfqResult.inquiryId}`);

    return {
      mode: 'feishu_instant',
      inquiryId: rfqResult.inquiryId,
      feishuRecordId: bestQuote.recordId,
      messageId,
      message: isExpired
        ? '已从飞书报价库获取历史报价（价格仅供参考，正在核实中）'
        : '已从飞书报价库获取最新报价，2 分钟内完成匹配',
    };
  }

  // ── Step 3: 飞书无数据 → 优先推送给在线 Agent，同时入队 BullMQ ───────────────
  try {
    const now = new Date();
    const taskId = `rfq-claw-${input.demandId}-${input.factoryId}-${now.getTime()}`;
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    // Step 3a: 检查工厂是否有在线 Agent，优先推送任务
    let agentPushed = false;
    try {
      const { pushTaskToAgent, isAgentOnlineForFactory } = await import('./clawAgentRouter');
      if (isAgentOnlineForFactory(input.factoryId)) {
        const rfqTask = {
          taskId,
          taskType: 'fetch_quote' as const,
          priority: 'normal' as const,
          demandId: input.demandId,
          factoryId: input.factoryId,
          buyerId: input.buyerId,
          matchResultId: input.matchResultId,
          productName: input.productName ?? '',
          category: input.category ?? '',
          quantity: input.quantity,
          enqueuedAt: now.toISOString(),
          expiresAt,
          retryCount: 0,
          maxRetries: 3,
        };
        agentPushed = pushTaskToAgent(input.factoryId, rfqTask);
        if (agentPushed) {
          console.log(`🤖 [autoSendRfq] Task pushed to online agent for factory #${input.factoryId}`);
        }
      }
    } catch (agentErr) {
      console.warn('[autoSendRfq] Agent push failed (non-critical):', agentErr);
    }

    // Step 3b: 同时入队 BullMQ（作为保底机制）
    const { rfqClawQueue } = await import('./queue');
    const jobId = `rfq-claw-${input.demandId}-${input.factoryId}`;

    const job = await rfqClawQueue.add(
      'fetch-quote',
      {
        taskId,
        demandId: input.demandId,
        factoryId: input.factoryId,
        matchResultId: input.matchResultId,
        buyerId: input.buyerId,
        category: input.category,
        productName: input.productName,
        enqueuedAt: now.toISOString(),
        agentPushed,
      },
      {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }
    );

    // 30 分钟超时告警（延迟任务）
    await rfqClawQueue.add(
      'timeout-alert',
      {
        demandId: input.demandId,
        factoryId: input.factoryId,
        elapsedMinutes: 30,
      },
      {
        delay: 30 * 60 * 1000,
        jobId: `rfq-timeout-${input.demandId}-${input.factoryId}`,
        attempts: 1,
      }
    );

    // 若品类完全空缺，发送运营告警
    try {
      const { sendEmptyCategoryAlert } = await import('./feishuService');
      await sendEmptyCategoryAlert({
        category: input.category ?? 'Unknown',
        demandId: input.demandId,
      });
    } catch { /* 告警失败不影响主流程 */ }

    console.log(`📥 [autoSendRfq] Queued to rfq-claw-queue for demand #${input.demandId}, jobId: ${job.id}, agentPushed: ${agentPushed}`);

    return {
      mode: 'claw_queued',
      jobId: job.id ?? jobId,
      message: agentPushed
        ? '已推送给工厂 AI 助手，预计 30 分钟内获得报价'
        : 'AI 正在联络工厂，预计 30 分钟内获得报价',
    };
  } catch (queueErr) {
    console.error('[autoSendRfq] Queue failed, falling back to manual:', queueErr);

    // ── Step 4: 队列不可用 → 人工兜底 ──────────────────────────────────────────
    const rfqResult = await sendRFQ({
      demandId: input.demandId,
      factoryId: input.factoryId,
      matchResultId: input.matchResultId,
      buyerId: input.buyerId,
      quantity: input.quantity,
      destination: input.destination,
      notes: input.notes,
    });

    return {
      mode: 'manual_fallback',
      inquiryId: rfqResult.inquiryId,
      message: '已创建询价单，等待工厂手动填写报价（队列服务暂不可用）',
    };
  }
}

// ── 获取买家的 RFQ 列表 ────────────────────────────────────────────────────────
export async function getBuyerRFQs(buyerId: number) {
  const db = await dbPromise;
  return await db.query.rfqQuotes.findMany({
    where: eq(schema.rfqQuotes.buyerId, buyerId),
    orderBy: [desc(schema.rfqQuotes.createdAt)],
  });
}

// ── 获取需求关联的所有 RFQ ─────────────────────────────────────────────────────
export async function getRFQsByDemand(demandId: number) {
  const db = await dbPromise;
  return await db.query.rfqQuotes.findMany({
    where: eq(schema.rfqQuotes.demandId, demandId),
    orderBy: [desc(schema.rfqQuotes.createdAt)],
  });
}
