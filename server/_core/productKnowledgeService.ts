/**
 * productKnowledgeService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * 产品类目知识库服务
 *
 * 功能：
 *  1. 关键词检索：根据产品名/类目快速查找相关知识条目
 *  2. 向量语义检索：基于 Embedding 的相似度搜索（Phase B 已启用）
 *  3. 知识注入：将检索结果格式化为 LLM 可用的上下文字符串
 *  4. 知识写入：支持新增/更新知识条目（自动生成向量）
 *  5. 引用日志：记录 AI 使用了哪些知识，用于长期优化
 *  6. 批量向量化：为现有知识条目批量生成向量
 *
 * 长期路线：
 *  Phase A（已完成）：关键词 + 规则检索，知识由人工维护
 *  Phase B（当前）：向量语义检索，知识半自动从采购对话中沉淀
 *  Phase C（6个月）：知识自动从 TikTok/Amazon/1688 爬取并验证
 *  Phase D（1年）：知识图谱，产品-工厂-认证-市场多维关联
 *
 * Bug 修复记录（Phase B）：
 *  - 修复 generateAndSaveEmbedding 中 result.embedding → result.vector
 *  - 修复 semanticSearchKnowledge 中 embResult.embedding → embResult.vector
 *  - 修复 db.query() → db.execute()（drizzle-orm mysql2 正确 API）
 *  - 修复 createKnowledgeEntry 中 db.query()[0].insertId → db.execute() 返回值解析
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { dbPromise } from "../db";
import { sql, eq } from "drizzle-orm";
import { productKnowledge, productCategories, knowledgeUsageLog } from "../../drizzle/schema";
import { generateEmbedding, cosineSimilarity, isEmbeddingError } from "./vectorSearchService";

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
// Phase A 核心：通过关键词快速定位知识库
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

  // 智能家居
  "智能": ["smart-home"],
  "smart home": ["smart-home"],

  // 户外装备
  "户外": ["outdoor-gear"],
  "outdoor": ["outdoor-gear"],
  "露营": ["outdoor-gear"],

  // 汽车配件
  "汽车": ["automotive-parts"],
  "car": ["automotive-parts"],
  "automotive": ["automotive-parts"],

  // 医疗器械
  "医疗": ["medical-devices"],
  "medical": ["medical-devices"],

  // 玩具游戏
  "玩具": ["toys-games"],
  "toy": ["toys-games"],
  "游戏": ["toys-games"],

  // 珠宝配饰
  "珠宝": ["jewelry-accessories"],
  "jewelry": ["jewelry-accessories"],
  "首饰": ["jewelry-accessories"],
};

// ─── 主检索函数 ────────────────────────────────────────────────────────────────

/**
 * 根据产品描述检索相关知识条目
 * Phase B 策略：关键词匹配 → 全文模糊搜索 → 向量语义搜索（三层递进）
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
    useSemanticSearch?: boolean;  // Phase B: 是否启用向量语义搜索
  } = {}
): Promise<KnowledgeContext> {
  const {
    maxItems = 8,
    knowledgeTypes,
    targetMarket,
    usedInContext,
    demandId,
    userId,
    useSemanticSearch = true,  // Phase B 默认启用
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

  // Step 2: 从数据库检索匹配类目的知识条目（关键词匹配）
  if (matchedSlugs.size > 0) {
    try {
      const slugList = Array.from(matchedSlugs).map((s) => `'${s}'`).join(",");
      const typeFilter = knowledgeTypes
        ? `AND knowledgeType IN (${knowledgeTypes.map((t) => `'${t}'`).join(",")})`
        : "";
      const marketFilter = targetMarket
        ? `AND (targetMarkets IS NULL OR JSON_CONTAINS(targetMarkets, '"${targetMarket}"'))`
        : "";

      const rows = await db.execute<any[]>(
        sql.raw(
          `SELECT id, categorySlug, knowledgeType, title, content, structuredData,
                  targetMarkets, confidence, source, viewCount
           FROM product_knowledge
           WHERE categorySlug IN (${slugList})
             AND isActive = 1
             ${typeFilter}
             ${marketFilter}
           ORDER BY confidence DESC, viewCount DESC
           LIMIT ${maxItems * 2}`
        )
      ) as unknown as any[];

      const rowData = Array.isArray(rows[0]) ? rows[0] : rows;
      results = rowData.map((row: any) => ({
        ...row,
        structuredData: row.structuredData
          ? (typeof row.structuredData === "string" ? JSON.parse(row.structuredData) : row.structuredData)
          : null,
        targetMarkets: row.targetMarkets
          ? (typeof row.targetMarkets === "string" ? JSON.parse(row.targetMarkets) : row.targetMarkets)
          : null,
        relevanceScore: 0.9,
        matchReason: `关键词匹配：${Array.from(matchedSlugs).join(", ")}`,
      }));
    } catch (err) {
      console.warn("⚠️ [Knowledge] 关键词检索失败:", err);
    }
  }

  // Step 3: 如果关键词匹配结果不足，尝试全文模糊搜索
  if (results.length < 3) {
    try {
      const keywords = query.split(/[\s,，、]+/).filter((w) => w.length > 1).slice(0, 3);
      if (keywords.length > 0) {
        const likeConditions = keywords
          .map((k) => `(title LIKE '%${k.replace(/'/g, "\\'")}%' OR content LIKE '%${k.replace(/'/g, "\\'")}%')`)
          .join(" OR ");

        const fuzzyRows = await db.execute<any[]>(
          sql.raw(
            `SELECT id, categorySlug, knowledgeType, title, content, structuredData,
                    targetMarkets, confidence, source, viewCount
             FROM product_knowledge
             WHERE isActive = 1 AND (${likeConditions})
             ORDER BY confidence DESC
             LIMIT ${maxItems}`
          )
        ) as unknown as any[];

        const fuzzyData = Array.isArray(fuzzyRows[0]) ? fuzzyRows[0] : fuzzyRows;
        const existingIds = new Set(results.map((r) => r.id));
        for (const row of fuzzyData as any[]) {
          if (!existingIds.has(row.id)) {
            results.push({
              ...row,
              structuredData: row.structuredData
                ? (typeof row.structuredData === "string" ? JSON.parse(row.structuredData) : row.structuredData)
                : null,
              targetMarkets: row.targetMarkets
                ? (typeof row.targetMarkets === "string" ? JSON.parse(row.targetMarkets) : row.targetMarkets)
                : null,
              relevanceScore: 0.6,
              matchReason: "模糊文本匹配",
            });
          }
        }
      }
    } catch (err) {
      console.warn("⚠️ [Knowledge] 模糊检索失败:", err);
    }
  }

  // Step 4: Phase B - 向量语义搜索补充（当关键词匹配不足时）
  if (useSemanticSearch && results.length < maxItems) {
    try {
      const semanticResults = await semanticSearchKnowledge(query, maxItems - results.length);
      const existingIds = new Set(results.map((r) => r.id));
      for (const item of semanticResults) {
        if (!existingIds.has(item.id)) {
          results.push(item);
          existingIds.add(item.id);
        }
      }
      if (semanticResults.length > 0) {
        console.log(`🧠 [Knowledge RAG] 向量语义搜索补充了 ${semanticResults.length} 条结果`);
      }
    } catch (err) {
      console.warn("⚠️ [Knowledge] 向量语义搜索失败（不影响主流程）:", err);
    }
  }

  // Step 5: 截取最相关的 maxItems 条（按 relevanceScore 排序）
  const topResults = results
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxItems);

  // Step 6: 记录引用日志（异步，不阻塞）
  if (topResults.length > 0 && usedInContext) {
    logKnowledgeUsage(topResults, usedInContext, demandId, userId).catch(() => {});
  }

  // Step 7: 格式化为 LLM 可用的上下文字符串
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
      await db.insert(knowledgeUsageLog).values({
        knowledgeId: item.id,
        usedInContext: context,
        demandId: demandId ?? null,
        userId: userId ?? null,
        relevanceScore: String(item.relevanceScore) as any,
      });
      // 更新引用计数
      await db.update(productKnowledge)
        .set({ viewCount: sql`viewCount + 1` })
        .where(eq(productKnowledge.id, item.id));
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
  const result = await db.insert(productKnowledge).values({
    categorySlug: input.categorySlug,
    knowledgeType: input.knowledgeType,
    title: input.title,
    content: input.content,
    structuredData: input.structuredData ? JSON.stringify(input.structuredData) as any : null,
    targetMarkets: input.targetMarkets ? JSON.stringify(input.targetMarkets) as any : null,
    confidence: input.confidence ?? 80,
    source: input.source ?? null,
    isActive: 1,
    viewCount: 0,
  });

  const insertId = (result as any)[0]?.insertId ?? 0;

  // 异步生成向量（Phase B 核心：新增条目自动向量化）
  if (insertId > 0) {
    generateAndSaveEmbedding(insertId, input.title + " " + input.content).catch(() => {});
  }

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
  // 使用原始SQL插入（因为需要 INSERT IGNORE）
  const slugEsc = input.slug.replace(/'/g, "\\'");
  const nameEsc = input.name.replace(/'/g, "\\'");
  const nameEnEsc = input.nameEn.replace(/'/g, "\\'");
  const parentEsc = input.parentSlug ? `'${input.parentSlug.replace(/'/g, "\\'")}'` : "NULL";
  const descEsc = input.description ? `'${input.description.replace(/'/g, "\\'")}'` : "NULL";
  
  await db.execute(
    sql.raw(
      `INSERT IGNORE INTO product_categories (slug, name, nameEn, parentSlug, level, description)
       VALUES ('${slugEsc}', '${nameEsc}', '${nameEnEsc}', ${parentEsc}, ${input.level ?? 1}, ${descEsc})`
    )
  );
}

// ─── 向量生成并保存（Phase B 核心）──────────────────────────────────────────────

/**
 * 为单条知识条目生成向量并写入数据库
 * 使用阿里云百炼 text-embedding-v3（1536维）
 */
async function generateAndSaveEmbedding(id: number, text: string): Promise<void> {
  try {
    const result = await generateEmbedding(text);
    if (!isEmbeddingError(result)) {
      const db = await dbPromise;
      // ✅ 修复：使用 result.vector（而非错误的 result.embedding）
      await db.update(productKnowledge)
        .set({
          embeddingVector: JSON.stringify(result.vector) as any,
          embeddingModel: result.model as any,
          embeddingAt: new Date() as any,
        })
        .where(eq(productKnowledge.id, id));
      console.log(`✅ [Knowledge Vector] 条目 #${id} 向量化完成 (${result.model}, ${result.vector.length}d)`);
    }
  } catch (err) {
    console.warn(`⚠️ [Knowledge Vector] 条目 #${id} 向量化失败:`, err);
  }
}

// ─── 批量向量化（Phase B 启动任务）──────────────────────────────────────────────

/**
 * 为所有尚未向量化的知识条目批量生成向量
 * 支持限速（避免 API 限流）
 * @param batchSize 每批处理数量
 * @param delayMs 每条之间的延迟（毫秒），避免 API 限流
 */
export async function batchVectorizeKnowledge(
  batchSize = 50,
  delayMs = 200
): Promise<{ success: number; failed: number; skipped: number }> {
  const db = await dbPromise;
  let success = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // 查询所有未向量化的活跃条目
    const rows = await db.execute(
      sql.raw(
        `SELECT id, title, content
         FROM product_knowledge
         WHERE isActive = 1 AND embeddingVector IS NULL
         ORDER BY id ASC
         LIMIT ${batchSize}`
      )
    ) as unknown as any[];

    const rowData: any[] = Array.isArray(rows[0]) ? rows[0] : rows;

    if (rowData.length === 0) {
      console.log("✅ [Knowledge Vector] 所有条目已向量化，无需处理");
      return { success: 0, failed: 0, skipped: 0 };
    }

    console.log(`🚀 [Knowledge Vector] 开始批量向量化 ${rowData.length} 条知识条目...`);

    for (const row of rowData) {
      try {
        const text = `${row.title} ${row.content}`.slice(0, 2000);
        const result = await generateEmbedding(text);

        if (isEmbeddingError(result)) {
          console.warn(`⚠️ [Knowledge Vector] 条目 #${row.id} 向量生成失败: ${result.error}`);
          failed++;
        } else {
          // ✅ 修复：使用 result.vector（而非错误的 result.embedding）
          await db.update(productKnowledge)
            .set({
              embeddingVector: JSON.stringify(result.vector) as any,
              embeddingModel: result.model as any,
              embeddingAt: new Date() as any,
            })
            .where(eq(productKnowledge.id, row.id));
          success++;
          console.log(`  ✓ #${row.id} "${row.title.slice(0, 30)}" → ${result.model} (${result.vector.length}d)`);
        }
      } catch (err) {
        console.warn(`⚠️ [Knowledge Vector] 条目 #${row.id} 处理异常:`, err);
        failed++;
      }

      // 限速：避免 API 限流
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.log(`\n📊 [Knowledge Vector] 批量向量化完成：成功 ${success}，失败 ${failed}，跳过 ${skipped}`);
  } catch (err) {
    console.error("❌ [Knowledge Vector] 批量向量化异常:", err);
  }

  return { success, failed, skipped };
}

// ─── 向量语义搜索（Phase B 核心功能）────────────────────────────────────────────

/**
 * 基于向量语义搜索知识条目
 * 使用余弦相似度在应用层计算（适合 <10万条目规模）
 *
 * @param query 查询文本
 * @param topK 返回前 K 个结果
 * @param minSimilarity 最低相似度阈值（0-1）
 */
export async function semanticSearchKnowledge(
  query: string,
  topK = 5,
  minSimilarity = 0.45
): Promise<KnowledgeSearchResult[]> {
  try {
    // Step 1: 生成查询向量
    const embResult = await generateEmbedding(query);
    if (isEmbeddingError(embResult)) {
      console.warn("⚠️ [Knowledge Semantic] 查询向量生成失败:", embResult.error);
      return [];
    }

    // Step 2: 获取所有已向量化的知识条目
    const db = await dbPromise;
    const rows = await db.execute(
      sql.raw(
        `SELECT id, categorySlug, knowledgeType, title, content, structuredData,
                targetMarkets, confidence, source, viewCount, embeddingVector
         FROM product_knowledge
         WHERE isActive = 1 AND embeddingVector IS NOT NULL
         LIMIT 1000`
      )
    ) as unknown as any[];

    const rowData: any[] = Array.isArray(rows[0]) ? rows[0] : rows;

    if (rowData.length === 0) {
      console.log("ℹ️ [Knowledge Semantic] 暂无已向量化的知识条目，请先运行批量向量化");
      return [];
    }

    // Step 3: 计算余弦相似度并排序
    const scored = rowData
      .map((row: any) => {
        try {
          const vec = typeof row.embeddingVector === "string"
            ? JSON.parse(row.embeddingVector) as number[]
            : row.embeddingVector as number[];

          if (!Array.isArray(vec) || vec.length === 0) return null;

          // ✅ 修复：使用 embResult.vector（而非错误的 embResult.embedding）
          const score = cosineSimilarity(embResult.vector, vec);

          return {
            id: row.id,
            categorySlug: row.categorySlug,
            knowledgeType: row.knowledgeType as KnowledgeType,
            title: row.title,
            content: row.content,
            structuredData: row.structuredData
              ? (typeof row.structuredData === "string" ? JSON.parse(row.structuredData) : row.structuredData)
              : null,
            targetMarkets: row.targetMarkets
              ? (typeof row.targetMarkets === "string" ? JSON.parse(row.targetMarkets) : row.targetMarkets)
              : null,
            confidence: row.confidence,
            source: row.source,
            viewCount: row.viewCount,
            relevanceScore: Math.round(score * 1000) / 1000,
            matchReason: `语义向量匹配 (相似度: ${(score * 100).toFixed(1)}%)`,
          } as KnowledgeSearchResult;
        } catch {
          return null;
        }
      })
      .filter((r): r is KnowledgeSearchResult => r !== null && r.relevanceScore >= minSimilarity)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK);

    return scored;
  } catch (err) {
    console.warn("⚠️ [Knowledge Semantic] 语义搜索异常:", err);
    return [];
  }
}

// ─── 辅助：获取类目列表 ───────────────────────────────────────────────────────

export async function getProductCategories(level?: number) {
  const db = await dbPromise;
  const rows = await db.execute(
    sql.raw(
      `SELECT id, slug, name, nameEn, parentSlug, level, description, sortOrder
       FROM product_categories WHERE isActive = 1 ${level !== undefined ? `AND level = ${level}` : ""}
       ORDER BY name ASC`
    )
  ) as unknown as any[];
  return Array.isArray(rows[0]) ? rows[0] : rows;
}

export async function getKnowledgeStats() {
  const db = await dbPromise;
  const rows = await db.execute(
    sql.raw(
      `SELECT
         COUNT(*) as totalEntries,
         COUNT(DISTINCT categorySlug) as totalCategories,
         SUM(CASE WHEN embeddingVector IS NOT NULL THEN 1 ELSE 0 END) as vectorizedEntries,
         AVG(confidence) as avgConfidence,
         SUM(viewCount) as totalUsages
       FROM product_knowledge WHERE isActive = 1`
    )
  ) as unknown as any[];
  const rowData = Array.isArray(rows[0]) ? rows[0] : rows;
  return rowData[0];
}
