/**
 * RealSourcing 4.4 - Negotiation Service
 * AI 动态议价服务：分析议价可行性、生成反提案、学习谈判风格
 */
import { db } from "./index";
import {
  negotiationSessions, negotiationRounds,
  transactionHistory, factoryScores,
  rfqQuotes, factories, factoryDetails,
  InsertNegotiationSession, InsertNegotiationRound,
} from "../../drizzle/schema";
import { eq, and, desc, avg, count, sql } from "drizzle-orm";
import { ENV } from "./env";

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface NegotiationRequest {
  rfqQuoteId: number;
  buyerId: number;
  factoryId: number;
  demandId?: number;
  buyerRequest: string;       // 自然语言请求，如"能否降价10%？"
  targetPrice?: number;
  targetMoq?: number;
  targetLeadTime?: number;
}

export interface AiCounterProposal {
  canNegotiate: boolean;
  confidence: number;           // 0-100
  proposedPrice?: number;
  proposedMoq?: number;
  proposedLeadTime?: number;
  proposedTerms: string;        // 自然语言描述的反提案
  reasoning: string;            // AI 推理过程
  strategy: "accept" | "counter" | "reject";
  discountPct?: number;         // 相对原价的折扣幅度
  moqIncreasePct?: number;      // MOQ 提升幅度
}

export interface FactoryNegotiationProfile {
  avgPriceFlexibility: number;  // 平均可降价幅度 %
  negotiationSuccessRate: number;
  avgRounds: number;
  style: string[];              // ["price_flexible", "moq_firm", "fast_response"]
  totalTransactions: number;
}

// ── AI 调用 ───────────────────────────────────────────────────────────────────

async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  // 优先使用阿里云百炼 DashScope
  const useDashScope = !!ENV.dashscopeApiKey;
  const baseUrl = useDashScope
    ? 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    : (ENV.openaiBaseUrl || 'https://once.novai.su/v1').replace(/\/$/, '');
  const apiKey = useDashScope ? ENV.dashscopeApiKey : (ENV.openaiApiKey || process.env.OPENAI_API_KEY || '');
  const model = useDashScope ? (ENV.dashscopeModel || 'qwen-plus') : 'gpt-4.1-mini';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Negotiation AI call failed: ${response.status}`);
  }

  const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return result.choices?.[0]?.message?.content ?? '{}';
}

// ── 获取工厂谈判画像 ──────────────────────────────────────────────────────────

export async function getFactoryNegotiationProfile(factoryId: number): Promise<FactoryNegotiationProfile> {
  const [score] = await db
    .select()
    .from(factoryScores)
    .where(eq(factoryScores.factoryId, factoryId))
    .limit(1);

  if (!score) {
    return {
      avgPriceFlexibility: 5,   // 默认 5% 弹性
      negotiationSuccessRate: 50,
      avgRounds: 1.5,
      style: ["unknown"],
      totalTransactions: 0,
    };
  }

  return {
    avgPriceFlexibility: Number(score.avgPriceFlexibility) || 5,
    negotiationSuccessRate: Number(score.negotiationSuccessRate) || 50,
    avgRounds: Number(score.avgNegotiationRounds) || 1.5,
    style: (score.negotiationStyle as string[]) || ["unknown"],
    totalTransactions: score.totalTransactions,
  };
}

// ── AI 生成反提案 ─────────────────────────────────────────────────────────────

export async function generateAiCounterProposal(
  originalPrice: number,
  originalMoq: number,
  originalLeadTime: number,
  currency: string,
  buyerRequest: string,
  targetPrice: number | undefined,
  targetMoq: number | undefined,
  profile: FactoryNegotiationProfile,
  recentTransactions: Array<{ finalPrice: number; quotedPrice: number; quantity: number }>
): Promise<AiCounterProposal> {
  const systemPrompt = `你是 RealSourcing 平台的 AI 议价助手。
你的任务是：分析买家的议价请求，基于工厂历史数据，生成一个合理的反提案。
反提案需要平衡买家利益和工厂利益，找到双方都能接受的方案。
输出必须是 JSON 格式。`;

  const recentPriceData = recentTransactions.length > 0
    ? recentTransactions.map(t => `报价 ${t.quotedPrice} ${currency} → 成交 ${t.finalPrice} ${currency}（数量 ${t.quantity}）`).join("\n")
    : "暂无历史成交数据";

  const prompt = `
## 议价场景

**原始报价：**
- 单价：${originalPrice} ${currency}
- MOQ：${originalMoq} 件
- 交期：${originalLeadTime} 天

**买家请求：**
${buyerRequest}
${targetPrice ? `- 目标单价：${targetPrice} ${currency}` : ""}
${targetMoq ? `- 目标 MOQ：${targetMoq} 件` : ""}

**工厂历史谈判数据：**
- 平均可降价幅度：${profile.avgPriceFlexibility}%
- 议价成功率：${profile.negotiationSuccessRate}%
- 平均谈判轮次：${profile.avgRounds}
- 谈判风格标签：${profile.style.join(", ")}
- 历史成交记录：
${recentPriceData}

## 任务

请分析买家的议价请求是否合理，并生成一个反提案。

**策略选择：**
- "accept"：买家要求合理，直接接受
- "counter"：买家要求过高，提出折中方案（如：降价但提高 MOQ）
- "reject"：买家要求超出工厂底线，礼貌拒绝

**输出 JSON 格式：**
{
  "canNegotiate": true/false,
  "confidence": 0-100,
  "strategy": "accept" | "counter" | "reject",
  "proposedPrice": 数字（如果 counter 或 accept），
  "proposedMoq": 数字（如果调整 MOQ），
  "proposedLeadTime": 数字（如果调整交期），
  "discountPct": 数字（相对原价的折扣幅度 %，正数=降价），
  "moqIncreasePct": 数字（MOQ 提升幅度 %，正数=提高 MOQ），
  "proposedTerms": "自然语言描述的反提案（中文，面向工厂展示）",
  "reasoning": "AI 推理过程（中文，面向运营展示）"
}`;

  try {
    const raw = await callAI(prompt, systemPrompt);
    const parsed = JSON.parse(raw) as AiCounterProposal;
    return parsed;
  } catch (e) {
    console.error("[NegotiationService] AI 反提案生成失败:", e);
    // 降级：基于规则生成
    const requestedDiscount = targetPrice
      ? ((originalPrice - targetPrice) / originalPrice) * 100
      : 10;
    const maxDiscount = profile.avgPriceFlexibility;

    if (requestedDiscount <= maxDiscount * 0.8) {
      return {
        canNegotiate: true,
        confidence: 75,
        strategy: "accept",
        proposedPrice: targetPrice || originalPrice * 0.95,
        proposedMoq: originalMoq,
        proposedLeadTime: originalLeadTime,
        proposedTerms: `我们可以接受您的报价请求，调整后单价为 ${(targetPrice || originalPrice * 0.95).toFixed(2)} ${currency}。`,
        reasoning: "买家要求的折扣在工厂历史弹性范围内，建议接受。",
        discountPct: requestedDiscount,
      };
    } else {
      const counterDiscount = maxDiscount * 0.7;
      const counterPrice = originalPrice * (1 - counterDiscount / 100);
      const counterMoq = Math.ceil(originalMoq * 1.3);
      return {
        canNegotiate: true,
        confidence: 60,
        strategy: "counter",
        proposedPrice: parseFloat(counterPrice.toFixed(2)),
        proposedMoq: counterMoq,
        proposedLeadTime: originalLeadTime,
        proposedTerms: `我们可以将单价降至 ${counterPrice.toFixed(2)} ${currency}，但需要将 MOQ 调整为 ${counterMoq} 件。`,
        reasoning: "买家要求的折扣超出历史弹性，提出折中方案：小幅降价 + 提高 MOQ。",
        discountPct: counterDiscount,
        moqIncreasePct: 30,
      };
    }
  }
}

// ── 创建议价会话 ──────────────────────────────────────────────────────────────

export async function createNegotiationSession(req: NegotiationRequest): Promise<{
  sessionId: number;
  counterProposal: AiCounterProposal;
}> {
  // 1. 获取原始报价
  const [quote] = await db
    .select()
    .from(rfqQuotes)
    .where(eq(rfqQuotes.id, req.rfqQuoteId))
    .limit(1);

  if (!quote) throw new Error(`RFQ Quote ${req.rfqQuoteId} not found`);

  const originalPrice = Number(quote.unitPrice) || 0;
  const originalMoq = quote.moq || 100;
  const originalLeadTime = quote.leadTimeDays || 30;
  const currency = quote.currency || "USD";

  // 2. 获取工厂谈判画像
  const profile = await getFactoryNegotiationProfile(req.factoryId);

  // 3. 获取近期成交记录（最多 10 条）
  const recentTx = await db
    .select({
      finalPrice: transactionHistory.finalPrice,
      quotedPrice: transactionHistory.quotedPrice,
      quantity: transactionHistory.quantity,
    })
    .from(transactionHistory)
    .where(eq(transactionHistory.factoryId, req.factoryId))
    .orderBy(desc(transactionHistory.createdAt))
    .limit(10);

  const recentTransactions = recentTx.map(t => ({
    finalPrice: Number(t.finalPrice) || 0,
    quotedPrice: Number(t.quotedPrice) || 0,
    quantity: t.quantity || 0,
  }));

  // 4. AI 生成反提案
  const counterProposal = await generateAiCounterProposal(
    originalPrice, originalMoq, originalLeadTime, currency,
    req.buyerRequest, req.targetPrice, req.targetMoq,
    profile, recentTransactions
  );

  // 5. 创建议价会话
  const [result] = await db.insert(negotiationSessions).values({
    rfqQuoteId: req.rfqQuoteId,
    buyerId: req.buyerId,
    factoryId: req.factoryId,
    demandId: req.demandId,
    buyerRequest: req.buyerRequest,
    targetPrice: req.targetPrice ? String(req.targetPrice) : undefined,
    targetMoq: req.targetMoq,
    targetLeadTime: req.targetLeadTime,
    originalPrice: String(originalPrice),
    originalMoq,
    originalLeadTime,
    originalCurrency: currency,
    aiAnalysis: counterProposal as unknown as Record<string, unknown>,
    aiConfidence: String(counterProposal.confidence),
    status: "factory_reviewing",
    roundCount: 1,
  } as InsertNegotiationSession);

  const sessionId = (result as unknown as { insertId: number }).insertId;

  // 6. 创建第一轮议价记录
  await db.insert(negotiationRounds).values({
    sessionId,
    roundNumber: 1,
    initiatedBy: "buyer",
    proposedPrice: req.targetPrice ? String(req.targetPrice) : undefined,
    proposedMoq: req.targetMoq,
    proposedLeadTime: req.targetLeadTime,
    proposedTerms: req.buyerRequest,
    isAiGenerated: 0,
  } as InsertNegotiationRound);

  // 7. 创建 AI 反提案轮次
  if (counterProposal.strategy !== "accept") {
    await db.insert(negotiationRounds).values({
      sessionId,
      roundNumber: 2,
      initiatedBy: "ai",
      proposedPrice: counterProposal.proposedPrice ? String(counterProposal.proposedPrice) : undefined,
      proposedMoq: counterProposal.proposedMoq,
      proposedLeadTime: counterProposal.proposedLeadTime,
      proposedTerms: counterProposal.proposedTerms,
      isAiGenerated: 1,
      aiReasoning: counterProposal.reasoning,
    } as InsertNegotiationRound);
  }

  return { sessionId, counterProposal };
}

// ── 工厂回应议价 ──────────────────────────────────────────────────────────────

export async function factoryRespondToNegotiation(
  sessionId: number,
  action: "accepted" | "rejected" | "counter",
  responseMessage: string,
  counterPrice?: number,
  counterMoq?: number,
  counterLeadTime?: number
): Promise<void> {
  const [session] = await db
    .select()
    .from(negotiationSessions)
    .where(eq(negotiationSessions.id, sessionId))
    .limit(1);

  if (!session) throw new Error(`Negotiation session ${sessionId} not found`);

  // 获取当前最新轮次
  const [latestRound] = await db
    .select()
    .from(negotiationRounds)
    .where(eq(negotiationRounds.sessionId, sessionId))
    .orderBy(desc(negotiationRounds.roundNumber))
    .limit(1);

  // 更新最新轮次的回应
  if (latestRound) {
    await db
      .update(negotiationRounds)
      .set({
        responseBy: "factory",
        responseAction: action,
        responseMessage,
        respondedAt: new Date(),
      })
      .where(eq(negotiationRounds.id, latestRound.id));
  }

  if (action === "accepted") {
    // 议价成功：更新会话状态
    await db
      .update(negotiationSessions)
      .set({
        status: "accepted",
        finalPrice: latestRound?.proposedPrice ?? session.originalPrice,
        finalMoq: latestRound?.proposedMoq ?? session.originalMoq,
        finalLeadTime: latestRound?.proposedLeadTime ?? session.originalLeadTime,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(negotiationSessions.id, sessionId));
  } else if (action === "rejected") {
    await db
      .update(negotiationSessions)
      .set({ status: "rejected", resolvedAt: new Date(), updatedAt: new Date() })
      .where(eq(negotiationSessions.id, sessionId));
  } else if (action === "counter") {
    // 工厂提出反提案：新增一轮
    const newRoundNumber = (latestRound?.roundNumber ?? 1) + 1;
    await db.insert(negotiationRounds).values({
      sessionId,
      roundNumber: newRoundNumber,
      initiatedBy: "factory",
      proposedPrice: counterPrice ? String(counterPrice) : undefined,
      proposedMoq: counterMoq,
      proposedLeadTime: counterLeadTime,
      proposedTerms: responseMessage,
      isAiGenerated: 0,
    } as InsertNegotiationRound);

    await db
      .update(negotiationSessions)
      .set({
        status: "counter_proposed",
        roundCount: newRoundNumber,
        updatedAt: new Date(),
      })
      .where(eq(negotiationSessions.id, sessionId));
  }
}

// ── 买家最终接受/拒绝工厂反提案 ──────────────────────────────────────────────

export async function buyerRespondToCounter(
  sessionId: number,
  action: "accepted" | "rejected",
  message?: string
): Promise<void> {
  const [session] = await db
    .select()
    .from(negotiationSessions)
    .where(eq(negotiationSessions.id, sessionId))
    .limit(1);

  if (!session) throw new Error(`Negotiation session ${sessionId} not found`);

  const [latestRound] = await db
    .select()
    .from(negotiationRounds)
    .where(eq(negotiationRounds.sessionId, sessionId))
    .orderBy(desc(negotiationRounds.roundNumber))
    .limit(1);

  await db
    .update(negotiationRounds)
    .set({
      responseBy: "buyer",
      responseAction: action,
      responseMessage: message,
      respondedAt: new Date(),
    })
    .where(eq(negotiationRounds.id, latestRound!.id));

  await db
    .update(negotiationSessions)
    .set({
      status: action === "accepted" ? "accepted" : "rejected",
      finalPrice: action === "accepted" ? (latestRound?.proposedPrice ?? session.originalPrice) : undefined,
      finalMoq: action === "accepted" ? (latestRound?.proposedMoq ?? session.originalMoq) : undefined,
      finalLeadTime: action === "accepted" ? (latestRound?.proposedLeadTime ?? session.originalLeadTime) : undefined,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(negotiationSessions.id, sessionId));
}

// ── 历史数据学习：更新工厂评分 ────────────────────────────────────────────────

export async function recalculateFactoryScore(factoryId: number): Promise<void> {
  // 1. 聚合历史成交数据
  const [stats] = await db
    .select({
      totalTx: count(transactionHistory.id),
      avgQuality: avg(transactionHistory.qualityScore),
      avgService: avg(transactionHistory.serviceScore),
      avgDelivery: avg(transactionHistory.deliveryScore),
      avgOverall: avg(transactionHistory.overallScore),
      avgPriceDiscount: avg(transactionHistory.priceDiscountPct),
      avgLeadVariance: avg(transactionHistory.leadTimeVarianceDays),
      avgNegRounds: avg(transactionHistory.negotiationRounds),
    })
    .from(transactionHistory)
    .where(eq(transactionHistory.factoryId, factoryId));

  // 2. 计算议价成功率
  const [negStats] = await db
    .select({
      total: count(negotiationSessions.id),
      accepted: sql<number>`SUM(CASE WHEN ${negotiationSessions.status} = 'accepted' THEN 1 ELSE 0 END)`,
    })
    .from(negotiationSessions)
    .where(eq(negotiationSessions.factoryId, factoryId));

  const totalNeg = Number(negStats?.total) || 0;
  const acceptedNeg = Number(negStats?.accepted) || 0;
  const negotiationSuccessRate = totalNeg > 0 ? (acceptedNeg / totalNeg) * 100 : 0;

  // 3. 计算准时交货率
  const [deliveryStats] = await db
    .select({
      total: count(transactionHistory.id),
      onTime: sql<number>`SUM(CASE WHEN ${transactionHistory.leadTimeVarianceDays} <= 0 THEN 1 ELSE 0 END)`,
    })
    .from(transactionHistory)
    .where(eq(transactionHistory.factoryId, factoryId));

  const totalDeliveries = Number(deliveryStats?.total) || 0;
  const onTimeDeliveries = Number(deliveryStats?.onTime) || 0;
  const onTimeDeliveryRate = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

  // 4. AI 推断谈判风格标签
  const avgFlex = Number(stats?.avgPriceDiscount) || 0;
  const avgRounds = Number(stats?.avgNegRounds) || 0;
  const style: string[] = [];
  if (avgFlex > 8) style.push("price_flexible");
  else if (avgFlex < 3) style.push("price_firm");
  if (avgRounds < 1.5) style.push("fast_decision");
  else if (avgRounds > 3) style.push("multi_round");
  if (onTimeDeliveryRate > 90) style.push("reliable_delivery");
  if (style.length === 0) style.push("standard");

  // 5. 综合评分（加权）
  const qualityScore = Number(stats?.avgQuality) || 0;
  const serviceScore = Number(stats?.avgService) || 0;
  const deliveryScore = Number(stats?.avgDelivery) || 0;
  const overallScore = qualityScore * 0.4 + serviceScore * 0.3 + deliveryScore * 0.3;

  // 6. 价格竞争力（基于降价幅度，越高越好）
  const priceCompetitiveness = Math.min(100, avgFlex * 5);

  // 7. Upsert factory_scores
  const existing = await db
    .select({ id: factoryScores.id })
    .from(factoryScores)
    .where(eq(factoryScores.factoryId, factoryId))
    .limit(1);

  const scoreData = {
    factoryId,
    overallScore: String(overallScore.toFixed(2)),
    qualityScore: String(qualityScore.toFixed(2)),
    serviceScore: String(serviceScore.toFixed(2)),
    deliveryScore: String(deliveryScore.toFixed(2)),
    priceCompetitiveness: String(priceCompetitiveness.toFixed(2)),
    avgNegotiationRounds: String((Number(stats?.avgNegRounds) || 0).toFixed(2)),
    avgPriceFlexibility: String(avgFlex.toFixed(2)),
    negotiationSuccessRate: String(negotiationSuccessRate.toFixed(2)),
    onTimeDeliveryRate: String(onTimeDeliveryRate.toFixed(2)),
    avgLeadTimeVariance: String((Number(stats?.avgLeadVariance) || 0).toFixed(2)),
    totalTransactions: Number(stats?.totalTx) || 0,
    negotiationStyle: style,
    lastCalculatedAt: new Date(),
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db.update(factoryScores).set(scoreData).where(eq(factoryScores.factoryId, factoryId));
  } else {
    await db.insert(factoryScores).values({ ...scoreData, totalReviews: 0 } as InsertFactoryScore);
  }

  console.log(`[NegotiationService] Factory ${factoryId} score recalculated:`, scoreData);
}

// ── 记录成交历史 ──────────────────────────────────────────────────────────────

export async function recordTransactionHistory(params: {
  purchaseOrderId: number;
  buyerId: number;
  factoryId: number;
  rfqQuoteId?: number;
  negotiationSessionId?: number;
  quotedPrice: number;
  finalPrice: number;
  quotedLeadDays: number;
  quantity: number;
  totalAmount: number;
  currency: string;
  productCategory?: string;
  wasNegotiated: boolean;
  negotiationRoundsCount: number;
}): Promise<void> {
  const priceDiscountPct = params.quotedPrice > 0
    ? ((params.quotedPrice - params.finalPrice) / params.quotedPrice) * 100
    : 0;

  await db.insert(transactionHistory).values({
    purchaseOrderId: params.purchaseOrderId,
    buyerId: params.buyerId,
    factoryId: params.factoryId,
    rfqQuoteId: params.rfqQuoteId,
    negotiationSessionId: params.negotiationSessionId,
    quotedPrice: String(params.quotedPrice),
    finalPrice: String(params.finalPrice),
    priceDiscountPct: String(priceDiscountPct.toFixed(2)),
    quotedLeadDays: params.quotedLeadDays,
    quantity: params.quantity,
    totalAmount: String(params.totalAmount),
    currency: params.currency,
    productCategory: params.productCategory,
    wasNegotiated: params.wasNegotiated ? 1 : 0,
    negotiationRounds: params.negotiationRoundsCount,
    completedAt: new Date(),
  });

  // 异步更新工厂评分
  setImmediate(() => recalculateFactoryScore(params.factoryId).catch(console.error));
}

// ── 买家提交评价 ──────────────────────────────────────────────────────────────

export async function submitBuyerReview(params: {
  transactionId: number;
  qualityScore: number;
  serviceScore: number;
  deliveryScore: number;
  review?: string;
  actualLeadDays?: number;
}): Promise<void> {
  const overallScore = params.qualityScore * 0.4 + params.serviceScore * 0.3 + params.deliveryScore * 0.3;

  await db
    .update(transactionHistory)
    .set({
      qualityScore: String(params.qualityScore),
      serviceScore: String(params.serviceScore),
      deliveryScore: String(params.deliveryScore),
      overallScore: String(overallScore.toFixed(1)),
      buyerReview: params.review,
      actualLeadDays: params.actualLeadDays,
      leadTimeVarianceDays: params.actualLeadDays
        ? undefined // 在查询时计算
        : undefined,
      reviewedAt: new Date(),
    })
    .where(eq(transactionHistory.id, params.transactionId));

  // 获取 factoryId 并重新计算评分
  const [tx] = await db
    .select({ factoryId: transactionHistory.factoryId })
    .from(transactionHistory)
    .where(eq(transactionHistory.id, params.transactionId))
    .limit(1);

  if (tx) {
    setImmediate(() => recalculateFactoryScore(tx.factoryId).catch(console.error));
  }
}
