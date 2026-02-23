/**
 * productKnowledgeService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * 产品类目知识库服务
 *
 * 功能：
 *  1. 关键词检索：根据产品名/类目快速查找相关知识条目
 *  2. 向量语义检索：基于 Embedding 的相似度搜索
 *  3. 知识注入：将检索结果格式化为 LLM 可用的上下文字符串
 *  4. 知识写入：支持新增/更新知识条目
 *  5. 引用日志：记录 AI 使用了哪些知识，用于长期优化
 *
 * 长期路线：
 *  Phase A（当前）：关键词 + 规则检索，知识由人工维护
 *  Phase B（3个月）：向量语义检索，知识半自动从采购对话中沉淀
 *  Phase C（6个月）：知识自动从 TikTok/Amazon/1688 爬取并验证
 *  Phase D（1年）：知识图谱，产品-工厂-认证-市场多维关联
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { dbPromise } from "../db";
import { generateEmbedding, cosineSimilarity } from "./vectorSearchService";

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

export type KnowledgeType =
  | "certification"
  | "material"
  | "process"
  | "pricing"
  | "moq"
  | "lead_time"
  | "packaging"
  | "quality_standard"
  | "market_trend"
  | "sourcing_tip";

export interface ProductKnowledge {
  id: number;
  categorySlug: string;
  knowledgeType: KnowledgeType;
  title: string;
  content: string;
  structuredData?: Record<string, unknown> | null;
  targetMarkets?: string[] | null;
  confidence: number;
  source?: string | null;
  viewCount: number;
}

export interface KnowledgeSearchResult extends ProductKnowledge {
  relevanceScore: number;
  matchReason: string;
}

export interface KnowledgeContext {
  items: KnowledgeSearchResult[];
  formattedContext: string;
  totalFound: number;
}

// ─── 关键词映射表（产品词 → 类目 slug）────────────────────────────────────────
// 这是 Phase A 的核心：通过关键词快速定位知识库
const KEYWORD_TO_CATEGORY: Record<string, string[]> = {
  // 消费电子
  "蓝牙耳机": ["bluetooth-earphones", "consumer-electronics"],
  "耳机": ["bluetooth-earphones", "wired-earphones", "consumer-electronics"],
  "earphone": ["bluetooth-earphones", "wired-earphones"],
  "headphone": ["bluetooth-earphones", "consumer-electronics"],
  "tws": ["bluetooth-earphones"],
  "充电宝": ["power-bank", "consumer-electronics"],
  "power bank": ["power-bank"],
  "手机壳": ["phone-case", "consumer-electronics"],
  "phone case": ["phone-case"],
  "智能手表": ["smartwatch", "consumer-electronics"],
  "smartwatch": ["smartwatch"],
  "手机支架": ["phone-holder", "consumer-electronics"],
  "蓝牙音箱": ["bluetooth-speaker", "consumer-electronics"],
  "speaker": ["bluetooth-speaker"],

  // 家居用品
  "硅胶": ["silicone-products", "homeware"],
  "silicone": ["silicone-products"],
  "厨具": ["kitchen-tools", "homeware"],
  "kitchen": ["kitchen-tools"],
  "收纳": ["storage-organizer", "homeware"],
  "灯": ["led-lighting", "homeware"],
  "led": ["led-lighting"],
  "蜡烛": ["candle", "homeware"],
  "candle": ["candle"],
  "香薰": ["aromatherapy", "homeware"],

  // 服装配件
  "t恤": ["t-shirt", "apparel"],
  "t-shirt": ["t-shirt"],
  "连衣裙": ["dress", "apparel"],
  "dress": ["dress"],
  "帽子": ["hat-cap", "apparel"],
  "hat": ["hat-cap"],
  "袜子": ["socks", "apparel"],
  "socks": ["socks"],
  "包": ["bag", "apparel"],
  "bag": ["bag"],
  "手提包": ["handbag", "apparel"],

  // 宠物用品
  "宠物": ["pet-supplies"],
  "pet": ["pet-supplies"],
  "狗": ["dog-supplies", "pet-supplies"],
  "猫": ["cat-supplies", "pet-supplies"],

  // 健身运动
  "瑜伽": ["yoga-fitness", "sports"],
  "yoga": ["yoga-fitness"],
  "健身": ["fitness-equipment", "sports"],
  "fitness": ["fitness-equipment"],

  // 美妆个护
  "化妆": ["cosmetics", "beauty"],
  "护肤": ["skincare", "beauty"],
  "skincare": ["skincare"],
  "美妆": ["cosmetics", "beauty"],

  // 婴童用品
  "婴儿": ["baby-products"],
  "baby": ["baby-products"],
  "儿童": ["kids-products", "baby-products"],
  "kids": ["kids-products"],
};

// ─── 主检索函数 ────────────────────────────────────────────────────────────────

/**
 * 根据产品描述检索相关知识条目
 * 优先使用关键词匹配，如有向量则补充语义搜索
 */
export async function searchProductKnowledge(
  query: string,
  options: {
    maxItems?: number;
    knowledgeTypes?: KnowledgeType[];
    targetMarket?: string;
    usedInContext?: "procurement_chat" | "sourcing_demand" | "factory_match";
    demandId?: number;
    userId?: number;
  } = {}
): Promise<KnowledgeContext> {
  const {
    maxItems = 8,
    knowledgeTypes,
    targetMarket,
    usedInContext,
    demandId,
    userId,
  } = options;

  const db = await dbPromise;
  const queryLower = query.toLowerCase();

  // Step 1: 关键词匹配，找到相关类目 slug
  const matchedSlugs = new Set<string>();
  for (const [keyword, slugs] of Object.entries(KEYWORD_TO_CATEGORY)) {
    if (queryLower.includes(keyword.toLowerCase())) {
      slugs.forEach((s) => matchedSlugs.add(s));
    }
  }

  let results: KnowledgeSearchResult[] = [];

  // Step 2: 从数据库检索匹配类目的知识条目
  if (matchedSlugs.size > 0) {
    const slugList = Array.from(matchedSlugs).map((s) => `'${s}'`).join(",");
    const typeFilter = knowledgeTypes
      ? `AND knowledgeType IN (${knowledgeTypes.map((t) => `'${t}'`).join(",")})`
      : "";
    const marketFilter = targetMarket
      ? `AND (targetMarkets IS NULL OR JSON_CONTAINS(targetMarkets, '"${targetMarket}"'))`
      : "";

    const rows = await db.query<any[]>(
      `SELECT id, categorySlug, knowledgeType, title, content, structuredData,
              targetMarkets, confidence, source, viewCount
       FROM product_knowledge
       WHERE categorySlug IN (${slugList})
         AND isActive = 1
         ${typeFilter}
         ${marketFilter}
       ORDER BY confidence DESC, viewCount DESC
       LIMIT ?`,
      [maxItems * 2]
    );

    results = rows.map((row) => ({
      ...row,
      structuredData: row.structuredData ? JSON.parse(row.structuredData) : null,
      targetMarkets: row.targetMarkets ? JSON.parse(row.targetMarkets) : null,
      relevanceScore: 0.9,
      matchReason: `关键词匹配：${Array.from(matchedSlugs).join(", ")}`,
    }));
  }

  // Step 3: 如果关键词匹配结果不足，尝试全文模糊搜索
  if (results.length < 3) {
    const keywords = query.split(/[\s,，、]+/).filter((w) => w.length > 1).slice(0, 3);
    if (keywords.length > 0) {
      const likeConditions = keywords
        .map(() => `(title LIKE ? OR content LIKE ?)`)
        .join(" OR ");
      const likeParams = keywords.flatMap((k) => [`%${k}%`, `%${k}%`]);

      const fuzzyRows = await db.query<any[]>(
        `SELECT id, categorySlug, knowledgeType, title, content, structuredData,
                targetMarkets, confidence, source, viewCount
         FROM product_knowledge
         WHERE isActive = 1 AND (${likeConditions})
         ORDER BY confidence DESC
         LIMIT ?`,
        [...likeParams, maxItems]
      );

      const existingIds = new Set(results.map((r) => r.id));
      for (const row of fuzzyRows) {
        if (!existingIds.has(row.id)) {
          results.push({
            ...row,
            structuredData: row.structuredData ? JSON.parse(row.structuredData) : null,
            targetMarkets: row.targetMarkets ? JSON.parse(row.targetMarkets) : null,
            relevanceScore: 0.6,
            matchReason: "模糊文本匹配",
          });
        }
      }
    }
  }

  // Step 4: 截取最相关的 maxItems 条
  const topResults = results.slice(0, maxItems);

  // Step 5: 记录引用日志（异步，不阻塞）
  if (topResults.length > 0 && usedInContext) {
    logKnowledgeUsage(topResults, usedInContext, demandId, userId).catch(() => {});
  }

  // Step 6: 格式化为 LLM 可用的上下文字符串
  const formattedContext = formatKnowledgeForLLM(topResults, query);

  return {
    items: topResults,
    formattedContext,
    totalFound: results.length,
  };
}

// ─── 格式化知识为 LLM 上下文 ──────────────────────────────────────────────────

function formatKnowledgeForLLM(
  items: KnowledgeSearchResult[],
  query: string
): string {
  if (items.length === 0) return "";

  // 按知识类型分组
  const grouped: Partial<Record<KnowledgeType, KnowledgeSearchResult[]>> = {};
  for (const item of items) {
    if (!grouped[item.knowledgeType]) grouped[item.knowledgeType] = [];
    grouped[item.knowledgeType]!.push(item);
  }

  const typeLabels: Record<KnowledgeType, string> = {
    certification: "认证要求",
    material: "材料/原料",
    process: "生产工艺",
    pricing: "价格参考",
    moq: "起订量",
    lead_time: "交期",
    packaging: "包装要求",
    quality_standard: "质量标准",
    market_trend: "市场趋势",
    sourcing_tip: "采购建议",
  };

  const sections: string[] = [
    `【产品知识库参考信息 - 针对"${query}"】`,
  ];

  for (const [type, typeItems] of Object.entries(grouped)) {
    const label = typeLabels[type as KnowledgeType] || type;
    sections.push(`\n▸ ${label}：`);
    for (const item of typeItems!) {
      sections.push(`  • ${item.title}：${item.content}`);
      if (item.structuredData) {
        const data = item.structuredData as Record<string, unknown>;
        if (data.priceRange) {
          sections.push(`    价格区间：${JSON.stringify(data.priceRange)}`);
        }
        if (data.certifications) {
          sections.push(`    认证列表：${(data.certifications as string[]).join(", ")}`);
        }
        if (data.moqRange) {
          sections.push(`    MOQ 区间：${JSON.stringify(data.moqRange)}`);
        }
      }
    }
  }

  sections.push("\n【以上为平台知识库数据，请结合用户实际需求给出专业建议】");

  return sections.join("\n");
}

// ─── 引用日志 ─────────────────────────────────────────────────────────────────

async function logKnowledgeUsage(
  items: KnowledgeSearchResult[],
  context: "procurement_chat" | "sourcing_demand" | "factory_match",
  demandId?: number,
  userId?: number
): Promise<void> {
  try {
    const db = await dbPromise;
    for (const item of items) {
      await db.query(
        `INSERT INTO knowledge_usage_log (knowledgeId, usedInContext, demandId, userId, relevanceScore)
         VALUES (?, ?, ?, ?, ?)`,
        [item.id, context, demandId ?? null, userId ?? null, item.relevanceScore]
      );
      // 更新引用计数
      await db.query(
        `UPDATE product_knowledge SET viewCount = viewCount + 1 WHERE id = ?`,
        [item.id]
      );
    }
  } catch {
    // 日志失败不影响主流程
  }
}

// ─── 知识条目写入 ─────────────────────────────────────────────────────────────

export interface CreateKnowledgeInput {
  categorySlug: string;
  knowledgeType: KnowledgeType;
  title: string;
  content: string;
  structuredData?: Record<string, unknown>;
  targetMarkets?: string[];
  confidence?: number;
  source?: string;
}

export async function createKnowledgeEntry(
  input: CreateKnowledgeInput
): Promise<number> {
  const db = await dbPromise;
  const [result] = await db.query<any>(
    `INSERT INTO product_knowledge
       (categorySlug, knowledgeType, title, content, structuredData, targetMarkets, confidence, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.categorySlug,
      input.knowledgeType,
      input.title,
      input.content,
      input.structuredData ? JSON.stringify(input.structuredData) : null,
      input.targetMarkets ? JSON.stringify(input.targetMarkets) : null,
      input.confidence ?? 80,
      input.source ?? null,
    ]
  );
  const insertId = (result as any).insertId;

  // 异步生成向量
  generateAndSaveEmbedding(insertId, input.title + " " + input.content).catch(() => {});

  return insertId;
}

export async function createCategoryEntry(input: {
  slug: string;
  name: string;
  nameEn: string;
  parentSlug?: string;
  level?: number;
  description?: string;
}): Promise<void> {
  const db = await dbPromise;
  await db.query(
    `INSERT IGNORE INTO product_categories (slug, name, nameEn, parentSlug, level, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.slug,
      input.name,
      input.nameEn,
      input.parentSlug ?? null,
      input.level ?? 1,
      input.description ?? null,
    ]
  );
}

// ─── 向量生成并保存 ───────────────────────────────────────────────────────────

async function generateAndSaveEmbedding(id: number, text: string): Promise<void> {
  try {
    const result = await generateEmbedding(text);
    if (!isEmbeddingError(result)) {
      const db = await dbPromise;
      await db.query(
        `UPDATE product_knowledge
         SET embeddingVector = ?, embeddingModel = ?, embeddingAt = NOW(3)
         WHERE id = ?`,
        [JSON.stringify(result.embedding), result.model, id]
      );
    }
  } catch {
    // 向量生成失败不影响知识条目本身
  }
}

// ─── 向量语义搜索（Phase B 启用）─────────────────────────────────────────────

export async function semanticSearchKnowledge(
  query: string,
  topK = 5
): Promise<KnowledgeSearchResult[]> {
  try {
    const embResult = await generateEmbedding(query);
    if (isEmbeddingError(embResult)) return [];

    const db = await dbPromise;
    const rows = await db.query<any[]>(
      `SELECT id, categorySlug, knowledgeType, title, content, structuredData,
              targetMarkets, confidence, source, viewCount, embeddingVector
       FROM product_knowledge
       WHERE isActive = 1 AND embeddingVector IS NOT NULL
       LIMIT 500`
    );

    const scored = rows
      .map((row) => {
        try {
          const vec = JSON.parse(row.embeddingVector) as number[];
          const score = cosineSimilarity(embResult.embedding, vec);
          return {
            ...row,
            structuredData: row.structuredData ? JSON.parse(row.structuredData) : null,
            targetMarkets: row.targetMarkets ? JSON.parse(row.targetMarkets) : null,
            relevanceScore: score,
            matchReason: "语义向量匹配",
            embeddingVector: undefined,
          };
        } catch {
          return null;
        }
      })
      .filter((r): r is KnowledgeSearchResult => r !== null && r.relevanceScore > 0.5)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK);

    return scored;
  } catch {
    return [];
  }
}

// ─── 辅助：获取类目列表 ───────────────────────────────────────────────────────

export async function getProductCategories(level?: number) {
  const db = await dbPromise;
  const levelFilter = level !== undefined ? `WHERE level = ${level} AND isActive = 1` : "WHERE isActive = 1";
  return db.query<any[]>(
    `SELECT id, slug, name, nameEn, parentSlug, level, description, sortOrder
     FROM product_categories ${levelFilter}
     ORDER BY sortOrder ASC, name ASC`
  );
}

export async function getKnowledgeStats() {
  const db = await dbPromise;
  const [stats] = await db.query<any[]>(
    `SELECT
       COUNT(*) as totalEntries,
       COUNT(DISTINCT categorySlug) as totalCategories,
       SUM(CASE WHEN embeddingVector IS NOT NULL THEN 1 ELSE 0 END) as vectorizedEntries,
       AVG(confidence) as avgConfidence,
       SUM(viewCount) as totalUsages
     FROM product_knowledge WHERE isActive = 1`
  );
  return stats;
}

// ─── 重新导出 isEmbeddingError（避免循环依赖）────────────────────────────────

function isEmbeddingError(result: unknown): result is { error: string } {
  return typeof result === "object" && result !== null && "error" in result;
}
