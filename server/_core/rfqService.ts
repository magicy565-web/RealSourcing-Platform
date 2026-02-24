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
