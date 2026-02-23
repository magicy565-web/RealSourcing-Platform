/**
 * RealSourcing - Vector Search Service
 * 向量嵌入与相似度搜索服务
 *
 * 核心能力：
 * 1. 为采购需求生成语义向量（Embedding）
 * 2. 存储向量到 MySQL JSON 列（无需独立向量数据库）
 * 3. 余弦相似度计算（纯 JS 实现，无外部依赖）
 * 4. 供应商 AI Agent 通过语义查询发现匹配需求
 *
 * 架构决策：
 * - 使用 text-embedding-v3（阿里云百炼 DashScope）生成 1536 维向量
 * - 向量存储在 sourcing_demands.embeddingVector JSON 列
 * - 相似度计算在应用层完成（适合中小规模，<10万条需求）
 * - 大规模场景可迁移到 Milvus / pgvector
 *
 * 嵌入内容：
 * productName + productDescription + keyFeatures + productionCategory
 * → 语义丰富的复合文本 → 1536 维向量
 */

import { ENV } from './env';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export type EmbeddingVector = number[];

export interface EmbeddingResult {
  vector: EmbeddingVector;
  model: string;
  tokenCount: number;
}

export interface EmbeddingError {
  error: string;
  code: string;
  details?: string;
}

export interface SimilarDemand {
  demandId: number;
  productName: string;
  productDescription: string | null;
  keyFeatures: unknown;
  estimatedQuantity: string | null;
  targetPrice: string | null;
  visualReferences: unknown;
  similarity: number;  // 0-1，越高越相似
}

// ── 向量数学工具 ───────────────────────────────────────────────────────────────

/**
 * 余弦相似度计算
 * cos(θ) = (A · B) / (|A| × |B|)
 */
export function cosineSimilarity(vecA: EmbeddingVector, vecB: EmbeddingVector): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/**
 * 对向量进行 L2 归一化（单位向量）
 * 归一化后余弦相似度 = 点积，计算更快
 */
export function normalizeVector(vec: EmbeddingVector): EmbeddingVector {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return vec;
  return vec.map(v => v / norm);
}

// ── Embedding 生成 ─────────────────────────────────────────────────────────────

/**
 * 构建用于嵌入的复合文本
 * 将多个字段拼接为语义丰富的单一文本
 */
export function buildEmbeddingText(data: {
  productName: string;
  productDescription?: string | null;
  keyFeatures?: unknown;
  productionCategory?: string | null;
  customizationNotes?: string | null;
  estimatedQuantity?: string | null;
  targetPrice?: string | null;
}): string {
  const parts: string[] = [];

  if (data.productName) parts.push(`产品: ${data.productName}`);
  if (data.productDescription) parts.push(`描述: ${data.productDescription.slice(0, 500)}`);

  if (Array.isArray(data.keyFeatures) && data.keyFeatures.length > 0) {
    parts.push(`特性: ${(data.keyFeatures as string[]).join('; ')}`);
  }

  if (data.productionCategory) parts.push(`类别: ${data.productionCategory}`);
  if (data.customizationNotes) parts.push(`定制: ${data.customizationNotes.slice(0, 200)}`);
  if (data.estimatedQuantity) parts.push(`数量: ${data.estimatedQuantity}`);
  if (data.targetPrice) parts.push(`价格: ${data.targetPrice}`);

  return parts.join(' | ');
}

/**
 * 调用 DashScope text-embedding-v3 生成向量
 * 维度：1536（text-embedding-v3 默认）
 */
export async function generateEmbedding(
  text: string
): Promise<EmbeddingResult | EmbeddingError> {
  const apiKey = ENV.dashscopeApiKey;

  // 如果没有 DashScope Key，回退到 OpenAI Embedding
  if (!apiKey) {
    return generateEmbeddingOpenAI(text);
  }

  try {
    const response = await fetch(
      'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-v3',
          input: { texts: [text.slice(0, 2000)] },  // 最大 2000 字符
          parameters: { dimension: 1536 },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      // 回退到 OpenAI
      console.warn(`⚠️ [Vector] DashScope embedding failed (${response.status}), falling back to OpenAI`);
      return generateEmbeddingOpenAI(text);
    }

    const data = await response.json() as {
      output?: { embeddings?: Array<{ embedding: number[] }> };
      usage?: { total_tokens: number };
      code?: string;
      message?: string;
    };

    if (data.code) {
      console.warn(`⚠️ [Vector] DashScope error: ${data.message}, falling back to OpenAI`);
      return generateEmbeddingOpenAI(text);
    }

    const vector = data.output?.embeddings?.[0]?.embedding;
    if (!vector || vector.length === 0) {
      return generateEmbeddingOpenAI(text);
    }

    return {
      vector: normalizeVector(vector),
      model: 'text-embedding-v3',
      tokenCount: data.usage?.total_tokens ?? 0,
    };
  } catch (err) {
    console.warn(`⚠️ [Vector] DashScope exception, falling back to OpenAI:`, err);
    return generateEmbeddingOpenAI(text);
  }
}

/**
 * 回退方案：使用 OpenAI text-embedding-3-small
 * 维度：1536
 */
async function generateEmbeddingOpenAI(
  text: string
): Promise<EmbeddingResult | EmbeddingError> {
  const baseUrl = (ENV.openaiBaseUrl || 'https://once.novai.su/v1').replace(/\/$/, '');

  try {
    const response = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000),
        dimensions: 1536,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return {
        error: 'Embedding API failed',
        code: 'EMBEDDING_FAILED',
        details: `HTTP ${response.status}`,
      };
    }

    const data = await response.json() as {
      data?: Array<{ embedding: number[] }>;
      usage?: { total_tokens: number };
    };

    const vector = data.data?.[0]?.embedding;
    if (!vector) {
      return { error: 'No embedding in response', code: 'NO_EMBEDDING' };
    }

    return {
      vector: normalizeVector(vector),
      model: 'text-embedding-3-small',
      tokenCount: data.usage?.total_tokens ?? 0,
    };
  } catch (err) {
    return {
      error: 'Embedding service error',
      code: 'SERVICE_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── 相似度搜索 ─────────────────────────────────────────────────────────────────

/**
 * 从候选需求列表中找出与查询向量最相似的需求
 *
 * @param queryVector 查询向量（已归一化）
 * @param candidates 候选需求列表（含 embeddingVector 字段）
 * @param topK 返回前 K 个结果
 * @param minSimilarity 最低相似度阈值（0-1）
 */
export function findSimilarDemands(
  queryVector: EmbeddingVector,
  candidates: Array<{
    id: number;
    productName: string | null;
    productDescription: string | null;
    keyFeatures: unknown;
    estimatedQuantity: string | null;
    targetPrice: string | null;
    visualReferences: unknown;
    embeddingVector: unknown;  // JSON 存储的向量
  }>,
  topK = 10,
  minSimilarity = 0.5
): SimilarDemand[] {
  const results: SimilarDemand[] = [];

  for (const candidate of candidates) {
    // 解析存储的向量
    let storedVector: EmbeddingVector | null = null;
    try {
      if (Array.isArray(candidate.embeddingVector)) {
        storedVector = candidate.embeddingVector as EmbeddingVector;
      } else if (typeof candidate.embeddingVector === 'string') {
        storedVector = JSON.parse(candidate.embeddingVector) as EmbeddingVector;
      }
    } catch {
      continue;  // 跳过无效向量
    }

    if (!storedVector || storedVector.length === 0) continue;

    const similarity = cosineSimilarity(queryVector, storedVector);

    if (similarity >= minSimilarity) {
      results.push({
        demandId: candidate.id,
        productName: candidate.productName ?? '',
        productDescription: candidate.productDescription,
        keyFeatures: candidate.keyFeatures,
        estimatedQuantity: candidate.estimatedQuantity,
        targetPrice: candidate.targetPrice,
        visualReferences: candidate.visualReferences,
        similarity: Math.round(similarity * 1000) / 1000,  // 保留 3 位小数
      });
    }
  }

  // 按相似度降序排列，取前 K 个
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

export function isEmbeddingError(
  result: EmbeddingResult | EmbeddingError
): result is EmbeddingError {
  return 'error' in result;
}
