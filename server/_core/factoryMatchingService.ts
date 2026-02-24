/**
 * RealSourcing 4.0 - Factory Matching Engine
 * 核心能力：
 * 1. 自动为工厂生成能力向量（Capability Embedding）
 * 2. 需求触发后，实时计算需求向量与工厂能力向量的余弦相似度
 * 3. 结合工厂实时状态（isOnline）与运营指标（AMR）进行加权排序
 * 4. 15分钟内输出 Top 5 匹配结果并存入 demandMatchResults 表
 */
import { dbPromise } from '../db';
import * as schema from '../../drizzle/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { 
  generateEmbedding, 
  cosineSimilarity, 
  buildEmbeddingText,
  isEmbeddingError 
} from './vectorSearchService';

// ── 匹配权重配置 ───────────────────────────────────────────────────────────────
const WEIGHTS = {
  SEMANTIC: 0.60,      // 语义相似度（核心）
  RESPONSIVENESS: 0.25, // 响应速度（30分钟对话的关键）
  TRUST: 0.15          // 工厂可信度（认证与评分）
};

/**
 * 为工厂生成或更新能力向量
 */
export async function updateFactoryCapabilityEmbedding(factoryId: number) {
  const db = await dbPromise;
  
  // 1. 获取工厂及其详细数据
  const factory = await db.query.factories.findFirst({
    where: eq(schema.factories.id, factoryId),
  });
  
  if (!factory) return null;

  // 2. 构建描述文本
  const capabilityText = `工厂: ${factory.name} | 品类: ${factory.category} | 城市: ${factory.city} | 描述: ${factory.description || ''}`;
  
  // 3. 生成向量
  const result = await generateEmbedding(capabilityText);
  if (isEmbeddingError(result)) return null;

  // 4. 存入数据库
  await db.insert(schema.factoryCapabilityEmbeddings).values({
    factoryId,
    capabilityText,
    embeddingVector: JSON.stringify(result.vector),
    embeddingModel: result.model,
    primaryCategory: factory.category,
    embeddingAt: new Date(),
  }).onDuplicateKeyUpdate({
    set: {
      capabilityText,
      embeddingVector: JSON.stringify(result.vector),
      embeddingAt: new Date(),
      updatedAt: new Date(),
    }
  });

  return result.vector;
}

/**
 * 核心匹配逻辑：需求 -> 工厂
 */
export async function matchFactoriesForDemand(demandId: number) {
  const db = await dbPromise;

  // 1. 获取需求数据及其向量
  const demand = await db.query.sourcingDemands.findFirst({
    where: eq(schema.sourcingDemands.id, demandId),
  });

  if (!demand || !demand.embeddingVector) return [];

  const demandVector = JSON.parse(demand.embeddingVector as string);

  // 2. 获取候选工厂能力向量（Category 预过滤）
  // 策略：先按品类精确匹配，如果结果 < 10 条则扩展到全表，确保结果覆盖度
  const demandCategory = demand.productionCategory;
  let candidates = [];

  if (demandCategory) {
    // 第一步：同品类工厂（精确匹配）
    candidates = await db.query.factoryCapabilityEmbeddings.findMany({
      where: and(
        eq(schema.factoryCapabilityEmbeddings.isActive, 1),
        eq(schema.factoryCapabilityEmbeddings.primaryCategory, demandCategory)
      ),
    });

    // 第二步：如果同品类工厂 < 10 家，扩展到全表（确保新平台初期工厂数量少时不失效）
    if (candidates.length < 10) {
      candidates = await db.query.factoryCapabilityEmbeddings.findMany({
        where: eq(schema.factoryCapabilityEmbeddings.isActive, 1),
      });
    }
  } else {
    // 无品类信息，全表扫描
    candidates = await db.query.factoryCapabilityEmbeddings.findMany({
      where: eq(schema.factoryCapabilityEmbeddings.isActive, 1),
    });
  }

  // 3. 获取工厂实时状态和指标
  const factoryIds = candidates.map(c => c.factoryId);
  if (factoryIds.length === 0) return [];

  const factoryData = await db.query.factories.findMany({
    where: inArray(schema.factories.id, factoryIds),
  });

  const metricsData = await db.query.factoryMetrics.findMany({
    where: inArray(schema.factoryMetrics.factoryId, factoryIds),
  });

  // 4. 计算综合得分
  const matchResults = candidates.map(candidate => {
    const factory = factoryData.find(f => f.id === candidate.factoryId);
    const metrics = metricsData.find(m => m.factoryId === candidate.factoryId);
    
    if (!factory) return null;

    // A. 语义分 (0-1)
    const storedVector = JSON.parse(candidate.embeddingVector as string);
    const semanticScore = cosineSimilarity(demandVector, storedVector);

    // B. 响应分 (0-1)
    // 权重：isOnline(0.5) + responseRate(0.5)
    const onlineBonus = factory.isOnline ? 1 : 0;
    const responseRate = parseFloat(factory.responseRate?.toString() || '0') / 100;
    const responsivenessScore = (onlineBonus * 0.7) + (responseRate * 0.3);

    // C. 可信度分 (0-1)
    // 权重：AMR 综合分 (0.6) + 认证状态 (0.4)
    const amrBaseScore = metrics?.amrTotalScore ? parseFloat(metrics.amrTotalScore.toString()) / 100 : 0.6;
    const certBonus = factory.certificationStatus === 'verified' ? 1.0 : 0.5;
    const trustScore = (amrBaseScore * 0.6) + (certBonus * 0.4);

    // 综合加权计算 (0-100)
    const finalScore = (
      (semanticScore * WEIGHTS.SEMANTIC) +
      (responsivenessScore * WEIGHTS.RESPONSIVENESS) +
      (trustScore * WEIGHTS.TRUST)
    ) * 100;

    return {
      demandId,
      factoryId: factory.id,
      matchScore: finalScore.toFixed(2),
      semanticScore: semanticScore.toFixed(4),
      responsivenessScore: (responsivenessScore * 100).toFixed(2),
      trustScore: (trustScore * 100).toFixed(2),
      factoryOnlineAt: factory.isOnline,
      matchReason: `基于语义匹配度(${Math.round(semanticScore * 100)}%)与工厂实时在线状态推荐。`,
    };
  }).filter(r => r !== null) as any[];

  // 5. 排序并持久化 Top 5
  const topMatches = matchResults
    .sort((a, b) => parseFloat(b.matchScore) - parseFloat(a.matchScore))
    .slice(0, 5);

  if (topMatches.length > 0) {
    // 清除旧的匹配结果
    await db.delete(schema.demandMatchResults).where(eq(schema.demandMatchResults.demandId, demandId));
    // 插入新结果
    await db.insert(schema.demandMatchResults).values(topMatches);
  }

  return topMatches;
}
