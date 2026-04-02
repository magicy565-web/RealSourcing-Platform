/**
 * RealSourcing 4.0 - Factory Matching Service
 * 工厂匹配核心服务
 *
 * 功能：
 * 1. 为采购需求生成语义向量（Embedding）
 * 2. 从 factoryCapabilityEmbeddings 表中检索候选工厂
 * 3. 使用余弦相似度 + 响应速度 + 可信度三维度加权计算匹配得分
 * 4. 调用 AI 为每个高分工厂生成个性化匹配理由（generateMatchReason）
 * 5. 持久化 Top 5 匹配结果到 demandMatchResults 表
 * 6. 通过 WebSocket 实时推送匹配结果给买家
 * 7. 为工厂生成/更新能力向量，存入 factoryCapabilityEmbeddings 表
 *
 * 匹配权重：
 * - 语义相似度（Semantic）：60%
 * - 响应速度（Responsiveness）：25%
 * - 可信度（Trust）：15%
 */
import { dbPromise } from '../db';
import * as schema from '../../drizzle/schema';
import { eq, and, inArray } from 'drizzle-orm';
import {
  generateEmbedding,
  cosineSimilarity,
  isEmbeddingError
} from './vectorSearchService';
import { aiService } from './aiService';
import { getIO } from './socketService';

// ── 品类归一化映射 ─────────────────────────────────────────────────────────────
// 解决 AI 生成的 productionCategory 与工厂 factory.category 命名不一致问题
// 例：AI 生成 "消费电子 - 智能家居" → 工厂数据库中为 "智能家居"
const CATEGORY_ALIAS_MAP: Record<string, string[]> = {
  '智能家居':  ['智能家居', '消费电子 - 智能家居', '智能家居控制', '家居智能', '智能家电'],
  '运动装备':  ['运动装备', '服装配饰 - 运动', '运动服装', '运动用品', '体育用品'],
  '美妆个护':  ['美妆个护', '美妆', '化妆品', '个人护理', '美容产品'],
  '礼品工艺':  ['礼品工艺', '礼品', '工艺品', '纪念品', '促销礼品'],
  '精密模具':  ['精密模具', '模具', '注塑模具', '冲压模具', '机械加工'],
  '穿戴科技':  ['穿戴科技', 'AR眼镜', '智能穿戴', '可穿戴设备', '消费电子 - 穿戴'],
  '消费电子':  ['消费电子', '电子产品', '电子设备', '数码产品'],
  '家居用品':  ['家居用品', '家居', '家具', '家居装饰'],
  '服装配饰':  ['服装配饰', '服装', '纺织品', '配饰'],
};

/**
 * 将 AI 生成的 productionCategory 归一化为工厂数据库中使用的标准品类名
 * 支持模糊匹配（包含关系），确保品类过滤不因命名差异而失效
 */
export function normalizeCategoryForMatching(rawCategory: string | null | undefined): string | null {
  if (!rawCategory) return null;
  const raw = rawCategory.trim();
  if (!raw) return null; // 纯空格字符串处理
  // 1. 精确匹配
  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIAS_MAP)) {
    if (aliases.some(alias => alias === raw)) return canonical;
  }
  // 2. 包含匹配（AI 生成的品类通常包含标准品类名）
  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIAS_MAP)) {
    if (aliases.some(alias => raw.includes(alias) || alias.includes(raw))) return canonical;
  }
  // 3. 无法归一化，返回原始值（让调用方决定是否扩展到全表）
  return raw;
}

// ── 匹配权重配置 ───────────────────────────────────────────────────────────────
const WEIGHTS = {
  SEMANTIC: 0.60,       // 语义相似度（核心）
  RESPONSIVENESS: 0.25, // 响应速度（30分钟对话的关键）
  TRUST: 0.15           // 工厂可信度（认证与评分）
};

// ── AI 匹配理由生成 ────────────────────────────────────────────────────────────

/**
 * 调用 AI 为买家生成个性化的工厂匹配理由
 *
 * @param demand 采购需求信息
 * @param factory 工厂信息
 * @param scores 各维度得分
 * @returns 1-2 句话的匹配理由文本
 */
export async function generateMatchReason(
  demand: {
    productName?: string | null;
    productDescription?: string | null;
    estimatedQuantity?: string | null;
    targetPrice?: string | null;
    productionCategory?: string | null;
  },
  factory: {
    name: string;
    category?: string | null;
    city?: string | null;
    description?: string | null;
    certificationStatus?: string | null;
    responseRate?: string | number | null;
    isOnline?: number | boolean | null;
  },
  scores: {
    semanticScore: number;      // 0-1
    responsivenessScore: number; // 0-1
    finalScore: number;         // 0-100
  }
): Promise<string> {
  const prompt = `你是 RealSourcing 平台的 AI 采购顾问。请为以下买家需求和工厂匹配生成一段简洁有力的匹配理由。

【买家需求】
- 产品：${demand.productName ?? '未指定'}
- 品类：${demand.productionCategory ?? '未指定'}
- 描述：${(demand.productDescription ?? '').slice(0, 200)}
- 数量：${demand.estimatedQuantity ?? '未指定'}
- 目标价：${demand.targetPrice ?? '未指定'}

【匹配工厂】
- 工厂名：${factory.name}
- 主营品类：${factory.category ?? '未指定'}
- 所在城市：${factory.city ?? '未知'}
- 工厂描述：${(factory.description ?? '').slice(0, 150)}
- 认证状态：${factory.certificationStatus === 'verified' ? '已认证' : '未认证'}
- 响应率：${factory.responseRate ?? 0}%
- 当前在线：${factory.isOnline ? '是' : '否'}

【匹配得分】
- 综合得分：${scores.finalScore.toFixed(1)}/100
- 语义匹配度：${(scores.semanticScore * 100).toFixed(0)}%
- 响应速度评分：${(scores.responsivenessScore * 100).toFixed(0)}%

要求：
1. 用中文撰写，1-2句话，不超过80字
2. 突出该工厂最核心的匹配优势
3. 语气专业、有说服力，让买家有信心联系
4. 不要重复工厂名称，不要使用"非常"、"超级"等夸张词
5. 直接输出理由文本，不要加任何前缀或标签`;

  try {
    const reason = await aiService.callAI(
      [{ role: 'user', content: prompt }],
      { maxTokens: 150, temperature: 0.7 }
    );
    // 清理输出：去除多余空白和换行
    return reason.trim().replace(/\n+/g, ' ').slice(0, 200);
  } catch (err) {
    console.warn(`⚠️ [Matching] AI reason generation failed for factory ${factory.name}:`, (err as Error).message);
    // 降级：生成结构化的静态理由
    const semanticPct = Math.round(scores.semanticScore * 100);
    const certBadge = factory.certificationStatus === 'verified' ? '已认证工厂，' : '';
    return `${certBadge}语义匹配度 ${semanticPct}%，主营 ${factory.category ?? '相关品类'}，位于 ${factory.city ?? '中国'}，综合评分 ${scores.finalScore.toFixed(1)} 分。`;
  }
}

// ── 工厂能力向量更新 ───────────────────────────────────────────────────────────

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

  // 2. 构建描述文本（品类 + 城市 + 描述，语义丰富）
  const capabilityText = [
    `工厂: ${factory.name}`,
    factory.category ? `品类: ${factory.category}` : null,
    factory.city ? `城市: ${factory.city}` : null,
    factory.description ? `描述: ${factory.description.slice(0, 300)}` : null,
  ].filter(Boolean).join(' | ');

  // 3. 生成向量
  const result = await generateEmbedding(capabilityText);
  if (isEmbeddingError(result)) return null;

  // 4. 存入数据库（upsert）
  await db.insert(schema.factoryCapabilityEmbeddings).values({
    factoryId,
    capabilityText,
    embeddingVector: JSON.stringify(result.vector),
    embeddingModel: result.model,
    primaryCategory: factory.category,
    embeddingAt: new Date(),
  }).onConflictDoUpdate({
    target: schema.factoryCapabilityEmbeddings.factoryId,
    set: {
      capabilityText,
      embeddingVector: JSON.stringify(result.vector),
      embeddingAt: new Date(),
      updatedAt: new Date(),
    }
  });

  return result.vector;
}

// ── 核心匹配逻辑 ───────────────────────────────────────────────────────────────

/**
 * 核心匹配逻辑：需求 → 工厂
 *
 * 执行步骤：
 * 1. 获取需求向量
 * 2. 按品类预过滤候选工厂
 * 3. 计算三维度加权得分
 * 4. 并行调用 AI 生成匹配理由
 * 5. 持久化 Top 5 结果
 * 6. 通过 WebSocket 推送给买家
 */
export async function matchFactoriesForDemand(demandId: number) {
  const db = await dbPromise;

  // 1. 获取需求数据及其向量
  const demand = await db.query.sourcingDemands.findFirst({
    where: eq(schema.sourcingDemands.id, demandId),
  });

  if (!demand || !demand.embeddingVector) {
    console.warn(`⚠️ [Matching] Demand #${demandId} has no embedding vector, skipping`);
    return [];
  }

  const demandVector = JSON.parse(demand.embeddingVector as string);

  // 2. 获取候选工厂能力向量（Category 预过滤）
  // 策略：先按品类精确匹配，如果结果 < 10 条则扩展到全表
  // 品类归一化：将 AI 生成的 productionCategory 映射到工厂数据库的标准品类名
  const rawCategory = demand.productionCategory;
  const demandCategory = normalizeCategoryForMatching(rawCategory);
  console.log(`[Matching] Demand #${demandId} category: raw="${rawCategory}" → normalized="${demandCategory}"`);

  let candidates: any[] = [];

  if (demandCategory) {
    candidates = await db.query.factoryCapabilityEmbeddings.findMany({
      where: and(
        eq(schema.factoryCapabilityEmbeddings.isActive, 1),
        eq(schema.factoryCapabilityEmbeddings.primaryCategory, demandCategory)
      ),
    });
    console.log(`[Matching] Category filter "${demandCategory}" → ${candidates.length} candidates`);
    // 同品类工厂不足 10 家时，扩展到全表（确保新平台初期不失效）
    if (candidates.length < 10) {
      console.log(`[Matching] Too few category matches, expanding to full table`);
      candidates = await db.query.factoryCapabilityEmbeddings.findMany({
        where: eq(schema.factoryCapabilityEmbeddings.isActive, 1),
      });
    }
  } else {
    console.log(`[Matching] No category specified, using full table scan`);
    candidates = await db.query.factoryCapabilityEmbeddings.findMany({
      where: eq(schema.factoryCapabilityEmbeddings.isActive, 1),
    });
  }

  if (candidates.length === 0) {
    console.warn(`⚠️ [Matching] No factory candidates found for demand #${demandId}`);
    return [];
  }

  // 3. 获取工厂实时状态和指标
  const factoryIds = candidates.map((c: any) => c.factoryId);
  const [factoryData, metricsData] = await Promise.all([
    db.query.factories.findMany({
      where: inArray(schema.factories.id, factoryIds),
    }),
    db.query.factoryMetrics.findMany({
      where: inArray(schema.factoryMetrics.factoryId, factoryIds),
    }),
  ]);

  // 4. 计算综合得分（不含 AI 理由）
  type MatchCandidate = {
    demandId: number;
    factoryId: number;
    matchScore: string;
    semanticScore: string;
    responsivenessScore: string;
    trustScore: string;
    factoryOnlineAt: number | null;
    matchReason: string;
    _factory: any;
    _scores: { semanticScore: number; responsivenessScore: number; finalScore: number };
  };

  const matchCandidates: MatchCandidate[] = candidates.map((candidate: any) => {
    const factory = factoryData.find((f: any) => f.id === candidate.factoryId);
    if (!factory) return null;

    // A. 语义分 (0-1)
    const storedVector = JSON.parse(candidate.embeddingVector as string);
    const semanticScore = cosineSimilarity(demandVector, storedVector);

    // B. 响应分 (0-1)
    // 权重：isOnline(0.7) + responseRate(0.3)
    const onlineBonus = factory.isOnline ? 1 : 0;
    const responseRate = parseFloat(factory.responseRate?.toString() || '0') / 100;
    const responsivenessScore = (onlineBonus * 0.7) + (responseRate * 0.3);

    // C. 可信度分 (0-1)
    // 已认证工厂 +0.2，有评分工厂按评分计算
    const certBonus = factory.certificationStatus === 'verified' ? 0.2 : 0;
    const overallScore = parseFloat(factory.overallScore?.toString() || '0');
    const trustScore = Math.min(1.0, 0.8 + certBonus + (overallScore > 0 ? (overallScore / 5) * 0.1 : 0));

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
      factoryOnlineAt: factory.isOnline ? 1 : 0,
      matchReason: '', // 占位，下面异步填充
      _factory: factory,
      _scores: { semanticScore, responsivenessScore, finalScore },
    };
  }).filter((r: any): r is MatchCandidate => r !== null);

  // 5. 排序并取 Top 5
  const topMatches = matchCandidates
    .sort((a, b) => parseFloat(b.matchScore) - parseFloat(a.matchScore))
    .slice(0, 5);

  if (topMatches.length === 0) return [];

  // 6. 并行生成 AI 匹配理由（不阻塞主流程，失败降级为静态理由）
  await Promise.all(
    topMatches.map(async (match) => {
      match.matchReason = await generateMatchReason(
        {
          productName: demand.productName,
          productDescription: demand.productDescription,
          estimatedQuantity: demand.estimatedQuantity,
          targetPrice: demand.targetPrice,
          productionCategory: demand.productionCategory,
        },
        match._factory,
        match._scores
      );
    })
  );

  // 7. 清理临时字段，准备持久化
  const persistData = topMatches.map(({ _factory, _scores, ...rest }) => rest);

  // 8. 清除旧的匹配结果，插入新结果
  await db.delete(schema.demandMatchResults).where(eq(schema.demandMatchResults.demandId, demandId));
  await db.insert(schema.demandMatchResults).values(persistData);

  console.log(`✅ [Matching] Demand #${demandId}: ${topMatches.length} matches found and persisted`);

  // 9. 通过 WebSocket 推送匹配完成通知给买家
  const io = getIO();
  if (io) {
    // 获取买家的所有 socket 连接（通过 userId 路由）
    const sockets = Array.from(io.sockets.sockets.values());
    const buyerSockets = sockets.filter((s: any) => s.userId === demand.userId);

    // 构建推送 payload（包含工厂基本信息，避免前端再次查询）
    const matchPayload = {
      type: 'match_complete',
      demandId,
      matchCount: topMatches.length,
      matches: topMatches.map((m) => ({
        factoryId: m.factoryId,
        matchScore: parseFloat(m.matchScore),
        matchReason: m.matchReason,
        factoryName: m._factory.name,
        factoryCategory: m._factory.category,
        factoryCity: m._factory.city,
        isOnline: !!m._factory.isOnline,
        certificationStatus: m._factory.certificationStatus,
      })),
    };

    buyerSockets.forEach((s: any) => {
      s.emit('match_complete', matchPayload);
    });

    // 同时向 demand 房间广播（如果前端加入了房间）
    io.to(`demand:${demandId}`).emit('match_complete', matchPayload);

    console.log(
      `📡 [Matching] Pushed match_complete to ${buyerSockets.length} buyer socket(s) + demand:${demandId} room`
    );
  }

  return topMatches;
}
