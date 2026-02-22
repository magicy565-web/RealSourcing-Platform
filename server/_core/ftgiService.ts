/**
 * RealSourcing FTGI 评分服务
 *
 * 完整流水线：
 *   上传材料 → JSON 结构化 → AI 权重评分 → × AI系数(0.6) → 最终 FTGI 得分
 *
 * 五个维度及权重：
 *   D1 基础信任与合规力  20%
 *   D2 敏捷履约与交付力  30%
 *   D3 市场洞察与内容力  25%
 *   D4 生态协作与开放性  15%
 *   D5 社区验证与声誉    10%
 */

import { eq, desc } from "drizzle-orm";
import { dbPromise } from "../db";
import * as schema from "../../drizzle/schema";
import { aiService } from "./aiService";

// 使用 dbPromise 确保 db 已完全初始化
async function getDb() {
  return dbPromise;
}

// ── 常量 ──────────────────────────────────────────────────────────────────────
export const AI_COEFFICIENT = 0.6; // AI 评分系数，最终得分 = rawScore × 0.6（人工评分权重 0.4）

const DIMENSION_WEIGHTS = {
  d1Trust:       0.20,
  d2Fulfillment: 0.30,
  d3Market:      0.25,
  d4Ecosystem:   0.15,
  d5Community:   0.10,
} as const;

// ── 类型定义 ──────────────────────────────────────────────────────────────────
export interface DimensionScore {
  score: number;        // 0-100
  reasoning: string;   // AI 推理说明
  subScores: Record<string, number>; // 子指标得分
  dataPoints: string[]; // 使用的数据点描述
}

export interface FtgiScoreResult {
  factoryId: number;
  d1Trust:       DimensionScore;
  d2Fulfillment: DimensionScore;
  d3Market:      DimensionScore;
  d4Ecosystem:   DimensionScore;
  d5Community:   DimensionScore;
  rawScore:      number;  // 加权综合原始分 0-100
  aiCoefficient: number;  // 0.6（AI权重60%，人工权重40%）
  ftgiScore:     number;  // 最终得分 = rawScore × aiCoefficient
}

// ── 工具函数 ──────────────────────────────────────────────────────────────────
function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

function weightedSum(scores: Record<keyof typeof DIMENSION_WEIGHTS, number>): number {
  return Object.entries(DIMENSION_WEIGHTS).reduce((sum, [key, weight]) => {
    return sum + (scores[key as keyof typeof DIMENSION_WEIGHTS] ?? 0) * weight;
  }, 0);
}

// ── 数据聚合：从数据库收集工厂所有相关数据 ────────────────────────────────────
async function collectFactoryData(factoryId: number) {
  const database = await getDb();
  const [factories, verifications, metricsArr, detailsArr, certifications, reviews, documents] =
    await Promise.all([
      database.select().from(schema.factories).where(eq(schema.factories.id, factoryId)),
      database.select().from(schema.factoryVerifications).where(eq(schema.factoryVerifications.factoryId, factoryId)),
      database.select().from(schema.factoryMetrics).where(eq(schema.factoryMetrics.factoryId, factoryId)),
      database.select().from(schema.factoryDetails).where(eq(schema.factoryDetails.factoryId, factoryId)),
      database.select().from(schema.factoryCertifications).where(eq(schema.factoryCertifications.factoryId, factoryId)),
      database.select().from(schema.factoryReviews).where(eq(schema.factoryReviews.factoryId, factoryId)),
      database.select().from(schema.factoryFtgiDocuments)
        .where(eq(schema.factoryFtgiDocuments.factoryId, factoryId))
        .orderBy(desc(schema.factoryFtgiDocuments.createdAt)),
    ]);
  return {
    factory:      factories[0]      ?? null,
    verification: verifications[0]  ?? null,
    metrics:      metricsArr[0]     ?? null,
    details:      detailsArr[0]     ?? null,
    certifications,
    reviews,
    documents,
  };
}

// ── AI 评分核心：将结构化数据发送给 AI 进行五维评分 ────────────────────────────
async function callAiForScoring(factoryData: Awaited<ReturnType<typeof collectFactoryData>>): Promise<{
  d1Trust: DimensionScore;
  d2Fulfillment: DimensionScore;
  d3Market: DimensionScore;
  d4Ecosystem: DimensionScore;
  d5Community: DimensionScore;
}> {
  const { factory, verification, metrics, details, certifications, reviews, documents } = factoryData;

  // 整理已解析的文档 JSON 数据
  const parsedDocs = documents
    .filter(d => d.parseStatus === "done" && d.parsedJson)
    .map(d => ({
      type: d.docType,
      fileName: d.fileName,
      data: d.parsedJson,
    }));

  // 构建发送给 AI 的结构化数据包
  const dataPackage = {
    factory: {
      name: factory?.name,
      category: factory?.category,
      country: factory?.country,
      certificationStatus: factory?.certificationStatus,
      responseRate: factory?.responseRate,
      averageResponseTime: factory?.averageResponseTime,
    },
    verification: {
      aiVerificationScore: verification?.aiVerificationScore,
      complianceScore: verification?.complianceScore,
      trustBadges: verification?.trustBadges,
    },
    metrics: {
      totalOrders: metrics?.totalOrders,
      totalOrderValue: metrics?.totalOrderValue,
      sampleConversionRate: metrics?.sampleConversionRate,
      disputeRate: metrics?.disputeRate,
      reelCount: metrics?.reelCount,
      reelViewCount: metrics?.reelViewCount,
    },
    details: {
      established: details?.established,
      employeeCount: details?.employeeCount,
      annualRevenue: details?.annualRevenue,
    },
    certifications: certifications.map(c => ({
      name: c.name,
      issuer: c.issuer,
      verified: c.verified,
      expiresAt: c.expiresAt,
    })),
    reviews: {
      count: reviews.length,
      avgRating: reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : null,
    },
    uploadedDocuments: parsedDocs,
  };

  const systemPrompt = `你是 RealSourcing 平台的专业供应商评估 AI，拥有丰富的全球供应链和 B2B 采购经验。
你的任务是根据工厂提交的结构化数据，对工厂进行五维 FTGI 评分，每个维度 0-100 分。

评分维度与权重：
- D1 基础信任与合规力 (20%)：认证资质、AI验厂分、合规记录、财务健康度
- D2 敏捷履约与交付力 (30%)：响应速度、样品转化率、订单完成率、纠纷率
- D3 市场洞察与内容力 (25%)：内容数量与质量、市场敏锐度、营销能力
- D4 生态协作与开放性 (15%)：数字化工具使用、API集成能力、跨境电商渠道
- D5 社区验证与声誉   (10%)：买家评分、评价数量、口碑质量

评分原则：
1. 基于数据客观评分，数据充分时给出精确分数，数据不足时给出保守中性分（50-60分）
2. 上传的文件数据（海关数据、交易记录等）应给予较高权重，因为这是工厂主动提供的证明材料
3. 每个维度必须提供清晰的推理说明和子指标分解

请严格按照以下 JSON 格式返回，不要有任何额外文字：
{
  "d1Trust": {
    "score": 数字,
    "reasoning": "评分理由",
    "subScores": { "certifications": 数字, "aiVerification": 数字, "compliance": 数字, "financialHealth": 数字 },
    "dataPoints": ["使用的数据点1", "使用的数据点2"]
  },
  "d2Fulfillment": {
    "score": 数字,
    "reasoning": "评分理由",
    "subScores": { "responseSpeed": 数字, "sampleConversion": 数字, "orderCompletion": 数字, "disputeRate": 数字 },
    "dataPoints": ["使用的数据点1"]
  },
  "d3Market": {
    "score": 数字,
    "reasoning": "评分理由",
    "subScores": { "contentVolume": 数字, "contentQuality": 数字, "marketAcumen": 数字 },
    "dataPoints": ["使用的数据点1"]
  },
  "d4Ecosystem": {
    "score": 数字,
    "reasoning": "评分理由",
    "subScores": { "digitalTools": 数字, "channelDiversity": 数字, "apiReadiness": 数字 },
    "dataPoints": ["使用的数据点1"]
  },
  "d5Community": {
    "score": 数字,
    "reasoning": "评分理由",
    "subScores": { "avgRating": 数字, "reviewVolume": 数字, "sentimentScore": 数字 },
    "dataPoints": ["使用的数据点1"]
  }
}`;

  const userPrompt = `请对以下工厂数据进行 FTGI 五维评分：\n\n${JSON.stringify(dataPackage, null, 2)}`;

  try {
    const rawResponse = await aiService.callAI([
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ], { preferJson: true, maxTokens: 2000, temperature: 0.2 });

    const parsed = JSON.parse(rawResponse);

    // 验证并规范化返回数据
    const normalize = (dim: any): DimensionScore => ({
      score: clamp(Number(dim?.score ?? 50)),
      reasoning: String(dim?.reasoning ?? ""),
      subScores: dim?.subScores ?? {},
      dataPoints: Array.isArray(dim?.dataPoints) ? dim.dataPoints : [],
    });

    return {
      d1Trust:       normalize(parsed.d1Trust),
      d2Fulfillment: normalize(parsed.d2Fulfillment),
      d3Market:      normalize(parsed.d3Market),
      d4Ecosystem:   normalize(parsed.d4Ecosystem),
      d5Community:   normalize(parsed.d5Community),
    };
  } catch (err) {
    console.error("[FTGI] AI scoring failed, using fallback:", err);
    return generateFallbackScores(factoryData);
  }
}

// ── 降级评分：当 AI 不可用时基于规则计算 ──────────────────────────────────────
function generateFallbackScores(factoryData: Awaited<ReturnType<typeof collectFactoryData>>) {
  const { verification, metrics, certifications, reviews } = factoryData;

  const d1Score = clamp(
    (Number(verification?.aiVerificationScore ?? 0) * 0.4) +
    (Number(verification?.complianceScore ?? 0) * 0.3) +
    (Math.min(certifications.filter(c => c.verified).length, 5) / 5 * 100 * 0.3)
  );

  const disputeRate = Number(metrics?.disputeRate ?? 0);
  const responseRate = Number(metrics ? 0 : 0);
  const d2Score = clamp(
    (Math.max(0, 100 - disputeRate * 10) * 0.4) +
    (Number(metrics?.sampleConversionRate ?? 50) * 0.3) +
    (responseRate * 0.3)
  );

  const reelCount = metrics?.reelCount ?? 0;
  const d3Score = clamp(Math.min(reelCount / 10, 1) * 100 * 0.6 + 40);

  const d4Score = 50; // 无数字化工具数据时给中性分

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 3;
  const d5Score = clamp(((avgRating - 1) / 4) * 100 * 0.6 + Math.min(reviews.length / 20, 1) * 100 * 0.4);

  const makeScore = (score: number, label: string): DimensionScore => ({
    score,
    reasoning: `基于规则计算（AI 服务暂时不可用）`,
    subScores: {},
    dataPoints: [label],
  });

  return {
    d1Trust:       makeScore(d1Score,  "AI验厂分、合规分、认证数量"),
    d2Fulfillment: makeScore(d2Score,  "纠纷率、样品转化率"),
    d3Market:      makeScore(d3Score,  "Reel 内容数量"),
    d4Ecosystem:   makeScore(d4Score,  "中性基础分"),
    d5Community:   makeScore(d5Score,  "买家评分、评价数量"),
  };
}

// ── 文档解析：将上传文件的内容结构化为 JSON ────────────────────────────────────
export async function parseDocumentToJson(
  docId: number,
  fileUrl: string,
  docType: string,
  fileName: string
): Promise<void> {
  // 更新状态为 processing
  const database = await getDb();
  await database.update(schema.factoryFtgiDocuments)
    .set({ parseStatus: "processing", updatedAt: new Date() })
    .where(eq(schema.factoryFtgiDocuments.id, docId));

  try {
    const systemPrompt = `你是一个专业的文档解析 AI，负责将工厂上传的各类材料提取为结构化 JSON 数据。
文件类型说明：
- image: 工厂图片（提取：场景描述、设备类型、规模估计、卫生状况）
- certification: 认证文件（提取：认证名称、颁发机构、有效期、认证范围）
- transaction: 交易记录（提取：交易金额、交易频率、主要客户地区、产品类别）
- customs: 海关数据（提取：出口国家、HS编码、出口金额、出口频率、主要市场）
- other: 其他材料（尽量提取关键信息）

请返回结构化 JSON，不要有任何额外文字。如果无法读取文件内容，返回 {"error": "无法解析", "docType": "${docType}"}`;

    const userPrompt = `请解析以下工厂材料：
文件名：${fileName}
文件类型：${docType}
文件URL：${fileUrl}

请提取该文件中的关键信息并返回结构化 JSON。`;

    const rawResponse = await aiService.callAI([
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ], { preferJson: true, maxTokens: 1000, temperature: 0.1 });

    const parsedJson = JSON.parse(rawResponse);

    const database = await getDb();
    await database.update(schema.factoryFtgiDocuments)
      .set({
        parsedJson,
        parseStatus: "done",
        updatedAt: new Date(),
      })
      .where(eq(schema.factoryFtgiDocuments.id, docId));

    console.log(`[FTGI] Document ${docId} parsed successfully`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const database = await getDb();
    await database.update(schema.factoryFtgiDocuments)
      .set({ parseStatus: "failed", parseError: errorMsg, updatedAt: new Date() })
      .where(eq(schema.factoryFtgiDocuments.id, docId));
    console.error(`[FTGI] Document ${docId} parse failed:`, err);
  }
}

// ── 主函数：计算工厂的完整 FTGI 评分 ─────────────────────────────────────────
export async function calculateFtgiScore(factoryId: number): Promise<FtgiScoreResult> {
  console.log(`[FTGI] Starting score calculation for factory ${factoryId}`);

  // 1. 设置状态为 calculating
  const database = await getDb();
  await database.insert(schema.factoryFtgiScores)
    .values({ factoryId, status: "calculating", updatedAt: new Date() })
    .onDuplicateKeyUpdate({ set: { status: "calculating", updatedAt: new Date() } });

  try {
    // 2. 收集工厂所有数据
    const factoryData = await collectFactoryData(factoryId);

    if (!factoryData.factory) {
      throw new Error(`Factory ${factoryId} not found`);
    }

    // 3. 调用 AI 进行五维评分
    const dimensionScores = await callAiForScoring(factoryData);

    // 4. 计算加权原始分
    const rawScore = clamp(weightedSum({
      d1Trust:       dimensionScores.d1Trust.score,
      d2Fulfillment: dimensionScores.d2Fulfillment.score,
      d3Market:      dimensionScores.d3Market.score,
      d4Ecosystem:   dimensionScores.d4Ecosystem.score,
      d5Community:   dimensionScores.d5Community.score,
    }));

    // 5. 乘以 AI 系数 0.4 得出最终分
    const ftgiScore = Math.round(rawScore * AI_COEFFICIENT * 10) / 10;

    const scoreDetails = {
      dimensions: dimensionScores,
      weights: DIMENSION_WEIGHTS,
      calculation: {
        rawScore,
        aiCoefficient: AI_COEFFICIENT,
        ftgiScore,
        formula: `${rawScore.toFixed(2)} × ${AI_COEFFICIENT} = ${ftgiScore}`,
      },
    };

    // 6. 写入数据库
    const database = await getDb();
    await database.insert(schema.factoryFtgiScores)
      .values({
        factoryId,
        d1Trust:       String(dimensionScores.d1Trust.score),
        d2Fulfillment: String(dimensionScores.d2Fulfillment.score),
        d3Market:      String(dimensionScores.d3Market.score),
        d4Ecosystem:   String(dimensionScores.d4Ecosystem.score),
        d5Community:   String(dimensionScores.d5Community.score),
        rawScore:      String(rawScore),
        aiCoefficient: String(AI_COEFFICIENT),
        ftgiScore:     String(ftgiScore),
        scoreDetails,
        status:        "done",
        calculatedAt:  new Date(),
        updatedAt:     new Date(),
      })
      .onDuplicateKeyUpdate({
        set: {
          d1Trust:       String(dimensionScores.d1Trust.score),
          d2Fulfillment: String(dimensionScores.d2Fulfillment.score),
          d3Market:      String(dimensionScores.d3Market.score),
          d4Ecosystem:   String(dimensionScores.d4Ecosystem.score),
          d5Community:   String(dimensionScores.d5Community.score),
          rawScore:      String(rawScore),
          aiCoefficient: String(AI_COEFFICIENT),
          ftgiScore:     String(ftgiScore),
          scoreDetails,
          status:        "done",
          calculatedAt:  new Date(),
          updatedAt:     new Date(),
        },
      });

    console.log(`[FTGI] Factory ${factoryId} scored: rawScore=${rawScore}, ftgiScore=${ftgiScore}`);

    return {
      factoryId,
      ...dimensionScores,
      rawScore,
      aiCoefficient: AI_COEFFICIENT,
      ftgiScore,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const database = await getDb();
    await database.insert(schema.factoryFtgiScores)
      .values({ factoryId, status: "failed", errorMessage: errorMsg, updatedAt: new Date() })
      .onDuplicateKeyUpdate({ set: { status: "failed", errorMessage: errorMsg, updatedAt: new Date() } });
    console.error(`[FTGI] Score calculation failed for factory ${factoryId}:`, err);
    throw err;
  }
}

// ── 查询工厂当前 FTGI 分数 ────────────────────────────────────────────────────
export async function getFtgiScore(factoryId: number) {
  const database = await getDb();
  const rows = await database.select().from(schema.factoryFtgiScores)
    .where(eq(schema.factoryFtgiScores.factoryId, factoryId));
  return rows[0] ?? null;
}

// ── 查询工厂上传的文档列表 ────────────────────────────────────────────────────
export async function getFtgiDocuments(factoryId: number) {
  const database = await getDb();
  return database.select()
    .from(schema.factoryFtgiDocuments)
    .where(eq(schema.factoryFtgiDocuments.factoryId, factoryId))
    .orderBy(desc(schema.factoryFtgiDocuments.createdAt));
}

// ── 创建文档记录 ──────────────────────────────────────────────────────────────
export async function createFtgiDocument(data: schema.InsertFactoryFtgiDocument) {
  const database = await getDb();
  const result = await database.insert(schema.factoryFtgiDocuments).values(data);
  return result;
}

// ── 删除文档记录 ──────────────────────────────────────────────────────────────
export async function deleteFtgiDocument(docId: number, factoryId: number) {
  const database = await getDb();
  return database.delete(schema.factoryFtgiDocuments)
    .where(
      eq(schema.factoryFtgiDocuments.id, docId)
    );
}

// ── FTGI 排行榜 ───────────────────────────────────────────────────────────────
export async function getFtgiLeaderboard(opts: {
  limit?: number;
  minScore?: number;
  certLevel?: "platinum" | "gold" | "silver" | "bronze" | "all";
}) {
  const database = await getDb();
  const limit = opts.limit ?? 50;

  // 获取所有有 FTGI 评分的工厂记录（按分数降序）
  const scores = await database
    .select()
    .from(schema.factoryFtgiScores)
    .where(eq(schema.factoryFtgiScores.status, "done"))
    .orderBy(desc(schema.factoryFtgiScores.ftgiScore))
    .limit(limit * 2);

  if (scores.length === 0) return [];

  // 批量获取工厂基本信息
  const factoryIds = scores.map(s => s.factoryId);
  const factories = await database
    .select()
    .from(schema.factories)
    .where(inArray(schema.factories.id, factoryIds));

  const factoryMap = new Map(factories.map(f => [f.id, f]));

  // 认证等级计算
  const getCertLevel = (score: number) => {
    if (score >= 85) return "platinum";
    if (score >= 70) return "gold";
    if (score >= 55) return "silver";
    if (score >= 40) return "bronze";
    return "pending";
  };

  // 合并、过滤、返回
  const results = scores
    .map((score) => {
      const factory = factoryMap.get(score.factoryId);
      if (!factory) return null;
      const total = Number(score.ftgiScore);
      const certLevel = getCertLevel(total);
      return {
        factoryId:       score.factoryId,
        factoryName:     factory.name,
        factoryLogo:     factory.logo,
        factoryCity:     factory.city,
        factoryCountry:  factory.country,
        factoryCategory: factory.category,
        ftgiScore:       total,
        aiScore:         Number(score.aiScore ?? 0),
        d1Trust:         Number(score.d1Trust),
        d2Fulfillment:   Number(score.d2Fulfillment),
        d3Market:        Number(score.d3Market),
        d4Ecosystem:     Number(score.d4Ecosystem),
        d5Community:     Number(score.d5Community),
        certLevel,
        calculatedAt:    score.calculatedAt,
      };
    })
    .filter((r): r is NonNullable<typeof r> => {
      if (!r) return false;
      if (opts.minScore !== undefined && r.ftgiScore < opts.minScore) return false;
      if (opts.certLevel && opts.certLevel !== "all" && r.certLevel !== opts.certLevel) return false;
      return true;
    })
    .slice(0, limit)
    .map((r, idx) => ({ ...r, rank: idx + 1 }));

  return results;
}
