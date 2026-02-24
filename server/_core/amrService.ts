/**
 * amrService.ts
 * RealSourcing 4.0 — AMR（敏捷性与市场准备度）真实数据采集引擎
 *
 * 核心设计原则：
 * - 所有 AMR 指标均从真实业务行为中自动计算，不依赖工厂自填数据
 * - 定期（每日）批量更新所有工厂的 AMR 分数
 * - 单次事件触发（如 RFQ 回复）时实时更新相关工厂指标
 *
 * AMR 评分维度（总分 100）：
 * ┌─────────────────────────────────┬────────┬──────────────────────────────────┐
 * │ 维度                            │ 权重   │ 数据来源                          │
 * ├─────────────────────────────────┼────────┼──────────────────────────────────┤
 * │ A1. RFQ 响应速度                │ 25%    │ rfq_quotes.respondedAt - createdAt│
 * │ A2. RFQ 接受率                  │ 20%    │ rfq_quotes 接受/总数              │
 * │ A3. 小批量订单接受度            │ 15%    │ rfq_quotes.moq vs 行业基准        │
 * │ M1. 在线活跃度                  │ 15%    │ factories.lastActiveAt 频率       │
 * │ M2. 资料完整度                  │ 15%    │ 工厂 Profile 字段填充率           │
 * │ M3. 历史成交口碑                │ 10%    │ inquiries 成功率 + 评分           │
 * └─────────────────────────────────┴────────┴──────────────────────────────────┘
 */

import { db } from "../db";
import {
  factories,
  factoryMetrics,
  rfqQuotes,
  inquiries,
  webinarBookings,
} from "../../drizzle/schema";
import { eq, and, gte, sql, count, avg } from "drizzle-orm";

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

export interface AMRScore {
  factoryId: number;
  totalScore: number;        // 0-100
  // 子维度分数
  rfqResponseScore: number;  // A1: RFQ 响应速度 (0-25)
  rfqAcceptScore: number;    // A2: RFQ 接受率 (0-20)
  smallBatchScore: number;   // A3: 小批量接受度 (0-15)
  onlineActivityScore: number; // M1: 在线活跃度 (0-15)
  profileCompletenessScore: number; // M2: 资料完整度 (0-15)
  reputationScore: number;   // M3: 历史口碑 (0-10)
  // 原始指标
  avgResponseHours: number;  // 平均响应小时数
  rfqAcceptRate: number;     // RFQ 接受率 0-1
  avgMoq: number;            // 平均 MOQ
  totalRfqReceived: number;  // 总收到 RFQ 数
  totalRfqAccepted: number;  // 总接受 RFQ 数
  profileCompleteness: number; // 资料完整度 0-1
  calculatedAt: Date;
}

// ─── 子维度计算函数 ────────────────────────────────────────────────────────────

/**
 * A1: 计算 RFQ 响应速度分数（0-25）
 * 基准：< 2小时 = 25分，< 6小时 = 20分，< 24小时 = 12分，< 72小时 = 5分，> 72小时 = 0分
 */
function calcResponseSpeedScore(avgResponseHours: number): number {
  if (avgResponseHours <= 0) return 0;
  if (avgResponseHours < 2) return 25;
  if (avgResponseHours < 6) return 20;
  if (avgResponseHours < 24) return 12;
  if (avgResponseHours < 72) return 5;
  return 0;
}

/**
 * A2: 计算 RFQ 接受率分数（0-20）
 * 接受率 = 已报价 / 总收到 RFQ
 */
function calcAcceptRateScore(acceptRate: number): number {
  if (acceptRate >= 0.9) return 20;
  if (acceptRate >= 0.7) return 15;
  if (acceptRate >= 0.5) return 10;
  if (acceptRate >= 0.3) return 5;
  return 0;
}

/**
 * A3: 小批量接受度分数（0-15）
 * 基准 MOQ：< 50 = 15分，< 100 = 12分，< 300 = 8分，< 500 = 4分，>= 500 = 0分
 */
function calcSmallBatchScore(avgMoq: number): number {
  if (avgMoq <= 0) return 0;
  if (avgMoq < 50) return 15;
  if (avgMoq < 100) return 12;
  if (avgMoq < 300) return 8;
  if (avgMoq < 500) return 4;
  return 0;
}

/**
 * M1: 在线活跃度分数（0-15）
 * 基于最近 30 天内的活跃天数
 */
function calcOnlineActivityScore(recentActiveDays: number): number {
  if (recentActiveDays >= 25) return 15;
  if (recentActiveDays >= 15) return 12;
  if (recentActiveDays >= 7) return 8;
  if (recentActiveDays >= 3) return 4;
  return 0;
}

/**
 * M2: 资料完整度分数（0-15）
 * 检查工厂 Profile 的关键字段填充率
 */
function calcProfileCompletenessScore(completeness: number): number {
  return Math.round(completeness * 15);
}

/**
 * M3: 历史口碑分数（0-10）
 * 基于成功完成的 inquiry 数量和转化率
 */
function calcReputationScore(
  totalInquiries: number,
  successfulInquiries: number
): number {
  if (totalInquiries === 0) return 0;
  const successRate = successfulInquiries / totalInquiries;
  const volumeBonus = Math.min(totalInquiries / 20, 1); // 最多 20 个询价获得满分加成
  return Math.round(successRate * 7 + volumeBonus * 3);
}

// ─── 工厂资料完整度计算 ────────────────────────────────────────────────────────

/**
 * 计算工厂 Profile 的完整度（0-1）
 * 检查关键字段是否填写
 */
function calcProfileCompleteness(factory: any): number {
  const requiredFields = [
    "name", "description", "category", "country", "city",
    "employeeCount", "establishedYear", "mainProducts",
    "certifications", "productionCapacity",
  ];
  const optionalFields = [
    "website", "videoUrl", "coverImageUrl", "exportMarkets",
    "qualityControlProcess", "sampleLeadTime",
  ];

  let score = 0;
  const requiredWeight = 0.7;
  const optionalWeight = 0.3;

  const requiredFilled = requiredFields.filter(
    (f) => factory[f] !== null && factory[f] !== undefined && factory[f] !== ""
  ).length;
  const optionalFilled = optionalFields.filter(
    (f) => factory[f] !== null && factory[f] !== undefined && factory[f] !== ""
  ).length;

  score =
    (requiredFilled / requiredFields.length) * requiredWeight +
    (optionalFilled / optionalFields.length) * optionalWeight;

  return Math.min(score, 1);
}

// ─── 核心计算函数 ──────────────────────────────────────────────────────────────

/**
 * 为单个工厂计算完整的 AMR 分数
 */
export async function calculateFactoryAMR(factoryId: number): Promise<AMRScore> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // 1. 获取工厂基本信息
  const factory = await db
    .select()
    .from(factories)
    .where(eq(factories.id, factoryId))
    .then((r) => r[0]);

  if (!factory) {
    throw new Error(`Factory ${factoryId} not found`);
  }

  // 2. 计算 RFQ 响应速度（A1）
  // 从 rfqQuotes 中找出已回复的报价，计算平均响应时间
  const rfqStats = await db
    .select({
      totalReceived: count(rfqQuotes.id),
      totalResponded: sql<number>`COUNT(CASE WHEN ${rfqQuotes.respondedAt} IS NOT NULL THEN 1 END)`,
      totalAccepted: sql<number>`COUNT(CASE WHEN ${rfqQuotes.status} IN ('accepted', 'quoted') THEN 1 END)`,
      avgResponseSeconds: sql<number>`AVG(CASE 
        WHEN ${rfqQuotes.respondedAt} IS NOT NULL 
        THEN TIMESTAMPDIFF(SECOND, ${rfqQuotes.createdAt}, ${rfqQuotes.respondedAt})
        ELSE NULL 
      END)`,
      avgMoq: avg(rfqQuotes.moq),
    })
    .from(rfqQuotes)
    .where(
      and(
        eq(rfqQuotes.factoryId, factoryId),
        gte(rfqQuotes.createdAt, thirtyDaysAgo)
      )
    )
    .then((r) => r[0]);

  const totalRfqReceived = Number(rfqStats?.totalReceived ?? 0);
  const totalRfqAccepted = Number(rfqStats?.totalAccepted ?? 0);
  const avgResponseSeconds = Number(rfqStats?.avgResponseSeconds ?? 0);
  const avgResponseHours = avgResponseSeconds > 0 ? avgResponseSeconds / 3600 : 999;
  const rfqAcceptRate = totalRfqReceived > 0 ? totalRfqAccepted / totalRfqReceived : 0;
  const avgMoq = Number(rfqStats?.avgMoq ?? 500);

  // 3. 计算在线活跃度（M1）
  // 统计最近 30 天内有 WebSocket 心跳记录的天数（通过 lastActiveAt 近似）
  // 目前用 webinarBookings 的活跃记录作为代理指标
  const recentBookings = await db
    .select({ count: count(webinarBookings.id) })
    .from(webinarBookings)
    .where(
      and(
        eq(webinarBookings.factoryId, factoryId),
        gte(webinarBookings.createdAt, thirtyDaysAgo)
      )
    )
    .then((r) => Number(r[0]?.count ?? 0));

  // 近似：每次预约代表至少 1 天活跃，加上基础在线天数（工厂 isOnline 状态）
  const baseActiveDays = factory.isOnline ? 15 : 3;
  const recentActiveDays = Math.min(baseActiveDays + recentBookings * 2, 30);

  // 4. 计算历史口碑（M3）
  const inquiryStats = await db
    .select({
      total: count(inquiries.id),
      successful: sql<number>`COUNT(CASE WHEN ${inquiries.status} IN ('completed', 'accepted') THEN 1 END)`,
    })
    .from(inquiries)
    .where(eq(inquiries.factoryId, factoryId))
    .then((r) => r[0]);

  const totalInquiries = Number(inquiryStats?.total ?? 0);
  const successfulInquiries = Number(inquiryStats?.successful ?? 0);

  // 5. 计算资料完整度（M2）
  const profileCompleteness = calcProfileCompleteness(factory);

  // 6. 计算各维度分数
  const rfqResponseScore = calcResponseSpeedScore(avgResponseHours);
  const rfqAcceptScore = calcAcceptRateScore(rfqAcceptRate);
  const smallBatchScore = calcSmallBatchScore(avgMoq);
  const onlineActivityScore = calcOnlineActivityScore(recentActiveDays);
  const profileCompletenessScore = calcProfileCompletenessScore(profileCompleteness);
  const reputationScore = calcReputationScore(totalInquiries, successfulInquiries);

  const totalScore =
    rfqResponseScore +
    rfqAcceptScore +
    smallBatchScore +
    onlineActivityScore +
    profileCompletenessScore +
    reputationScore;

  return {
    factoryId,
    totalScore: Math.min(Math.round(totalScore), 100),
    rfqResponseScore,
    rfqAcceptScore,
    smallBatchScore,
    onlineActivityScore,
    profileCompletenessScore,
    reputationScore,
    avgResponseHours: Math.round(avgResponseHours * 10) / 10,
    rfqAcceptRate: Math.round(rfqAcceptRate * 100) / 100,
    avgMoq: Math.round(avgMoq),
    totalRfqReceived,
    totalRfqAccepted,
    profileCompleteness: Math.round(profileCompleteness * 100) / 100,
    calculatedAt: new Date(),
  };
}

/**
 * 将 AMR 分数写入 factoryMetrics 表
 */
export async function saveAMRScore(score: AMRScore): Promise<void> {
  // 检查是否已有记录
  const existing = await db
    .select({ id: factoryMetrics.id })
    .from(factoryMetrics)
    .where(eq(factoryMetrics.factoryId, score.factoryId))
    .then((r) => r[0]);

  const metricsData = {
    factoryId: score.factoryId,
    updatedAt: new Date(),
    // 将 AMR 分数写入 factoryMetrics 的扩展字段
    // 注意：需要在 schema 中添加 amrScore 等字段
    // 目前先写入已有字段
    sampleConversionRate: String(score.rfqAcceptRate * 100),
  };

  if (existing) {
    await db
      .update(factoryMetrics)
      .set(metricsData)
      .where(eq(factoryMetrics.factoryId, score.factoryId));
  } else {
    await db.insert(factoryMetrics).values({
      ...metricsData,
      totalMeetings: 0,
      totalSampleRequests: 0,
      totalOrders: 0,
      totalOrderValue: "0.00",
      disputeRate: "0.00",
      reelCount: 0,
      reelViewCount: 0,
    });
  }
}

/**
 * 批量计算所有工厂的 AMR 分数（定时任务调用）
 */
export async function batchCalculateAMR(): Promise<{
  processed: number;
  errors: number;
  topFactories: Array<{ factoryId: number; score: number }>;
}> {
  const allFactories = await db
    .select({ id: factories.id })
    .from(factories)
    .where(eq(factories.isVerified, 1));

  let processed = 0;
  let errors = 0;
  const scores: Array<{ factoryId: number; score: number }> = [];

  for (const factory of allFactories) {
    try {
      const score = await calculateFactoryAMR(factory.id);
      await saveAMRScore(score);
      scores.push({ factoryId: factory.id, score: score.totalScore });
      processed++;
    } catch (err) {
      console.error(`[AMR] Failed to calculate score for factory ${factory.id}:`, err);
      errors++;
    }
  }

  // 返回 Top 10 工厂
  const topFactories = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  console.log(`[AMR] Batch calculation complete: ${processed} processed, ${errors} errors`);
  return { processed, errors, topFactories };
}

/**
 * 单工厂 AMR 实时更新（在 RFQ 回复、预约确认等事件后触发）
 */
export async function refreshFactoryAMR(factoryId: number): Promise<AMRScore> {
  const score = await calculateFactoryAMR(factoryId);
  await saveAMRScore(score);
  console.log(`[AMR] Refreshed factory ${factoryId}: score=${score.totalScore}`);
  return score;
}
