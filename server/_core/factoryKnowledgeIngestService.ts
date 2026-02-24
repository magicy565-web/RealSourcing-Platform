/**
 * factoryKnowledgeIngestService.ts
 * RealSourcing 4.0 — 工厂知识库上传解析与 RAG 向量化引擎
 *
 * 核心能力：
 * 1. 接受工厂上传的 PDF（产品目录）、Excel（报价表）、Word（FAQ）
 * 2. 通过 multimodalIngestionService 提取文本内容
 * 3. 自动分块（Chunking）并生成 Embedding 向量
 * 4. 写入 productKnowledge 表，供 AI 导师的 RAG 检索使用
 * 5. 同时更新 factoryCapabilityEmbeddings，优化工厂匹配精度
 *
 * 支持的文件类型：
 * - PDF：产品目录、认证文件、工厂介绍
 * - Excel/CSV：阶梯报价表、MOQ 表、交期表
 * - Word/TXT：FAQ、工厂简介、工艺说明
 * - 图片（JPG/PNG）：产品图、工厂照片（提取视觉描述）
 */

import { db } from "../db";
import { productKnowledge, factoryCapabilityEmbeddings, factories } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { generateEmbedding } from "./vectorSearchService";

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

export type KnowledgeFileType = "product_catalog" | "pricing_sheet" | "faq" | "certification" | "factory_intro" | "other";

export interface IngestFileInput {
  factoryId: number;
  fileUrl: string;           // OSS URL
  fileName: string;
  fileType: KnowledgeFileType;
  mimeType: string;
}

export interface IngestResult {
  factoryId: number;
  fileName: string;
  chunksCreated: number;
  vectorsGenerated: number;
  knowledgeIds: number[];
  capabilityEmbeddingUpdated: boolean;
  processingTimeMs: number;
}

// ─── 文本分块工具 ──────────────────────────────────────────────────────────────

/**
 * 将长文本分割为适合 Embedding 的块
 * 策略：按段落分块，每块不超过 800 字符，相邻块有 100 字符重叠
 */
function chunkText(
  text: string,
  maxChunkSize: number = 800,
  overlap: number = 100
): string[] {
  if (text.length <= maxChunkSize) return [text.trim()];

  const chunks: string[] = [];
  // 先按段落分割
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 20);

  let currentChunk = "";
  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        // 保留最后 overlap 个字符作为上下文
        currentChunk = currentChunk.slice(-overlap) + "\n\n" + para;
      } else {
        // 单段落超长，强制分割
        let start = 0;
        while (start < para.length) {
          chunks.push(para.slice(start, start + maxChunkSize).trim());
          start += maxChunkSize - overlap;
        }
        currentChunk = "";
      }
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.length > 30);
}

/**
 * 根据文件类型和内容推断知识类型
 */
function inferKnowledgeType(
  fileType: KnowledgeFileType,
  content: string
): string {
  const contentLower = content.toLowerCase();

  if (fileType === "pricing_sheet" || contentLower.includes("price") || contentLower.includes("moq")) {
    return "pricing";
  }
  if (fileType === "certification" || contentLower.includes("certif") || contentLower.includes("iso")) {
    return "certification";
  }
  if (contentLower.includes("material") || contentLower.includes("fabric") || contentLower.includes("材料")) {
    return "material";
  }
  if (contentLower.includes("process") || contentLower.includes("工艺") || contentLower.includes("production")) {
    return "process";
  }
  if (contentLower.includes("lead time") || contentLower.includes("delivery") || contentLower.includes("交期")) {
    return "lead_time";
  }
  if (contentLower.includes("packaging") || contentLower.includes("包装")) {
    return "packaging";
  }
  if (fileType === "faq") {
    return "sourcing_tip";
  }
  return "sourcing_tip";
}

// ─── 文件内容提取 ──────────────────────────────────────────────────────────────

/**
 * 从 OSS URL 下载并提取文件文本内容
 * 复用 multimodalIngestionService 的能力
 */
async function extractFileContent(
  fileUrl: string,
  mimeType: string,
  fileName: string
): Promise<string> {
  try {
    const { analyzeDocument } = await import("./multimodalIngestionService");

    // 构造一个临时的 sourcingDemand 格式来复用现有解析能力
    const result = await analyzeDocument({
      fileUrl,
      mimeType,
      fileName,
      extractionMode: "knowledge_base", // 知识库模式：提取所有文本，不做需求解析
    });

    return result.rawText ?? result.summary ?? "";
  } catch (err) {
    console.error(`[KnowledgeIngest] Failed to extract content from ${fileName}:`, err);
    // 降级：尝试直接下载文本文件
    try {
      const response = await fetch(fileUrl);
      if (response.ok) {
        const text = await response.text();
        return text.slice(0, 50000); // 最多 50KB 文本
      }
    } catch {
      // 忽略
    }
    return "";
  }
}

// ─── 核心摄入函数 ──────────────────────────────────────────────────────────────

/**
 * 主入口：处理工厂上传的知识库文件
 */
export async function ingestFactoryKnowledge(
  input: IngestFileInput
): Promise<IngestResult> {
  const startTime = Date.now();
  const { factoryId, fileUrl, fileName, fileType, mimeType } = input;

  console.log(`[KnowledgeIngest] Starting ingestion: factory=${factoryId}, file=${fileName}`);

  // 1. 获取工厂信息（用于生成知识条目的上下文）
  const factory = await db
    .select({ id: factories.id, name: factories.name, category: factories.category })
    .from(factories)
    .where(eq(factories.id, factoryId))
    .then((r) => r[0]);

  if (!factory) {
    throw new Error(`Factory ${factoryId} not found`);
  }

  // 2. 提取文件内容
  const rawContent = await extractFileContent(fileUrl, mimeType, fileName);

  if (!rawContent || rawContent.trim().length < 50) {
    console.warn(`[KnowledgeIngest] Insufficient content extracted from ${fileName}`);
    return {
      factoryId,
      fileName,
      chunksCreated: 0,
      vectorsGenerated: 0,
      knowledgeIds: [],
      capabilityEmbeddingUpdated: false,
      processingTimeMs: Date.now() - startTime,
    };
  }

  // 3. 分块处理
  const chunks = chunkText(rawContent);
  console.log(`[KnowledgeIngest] Created ${chunks.length} chunks from ${fileName}`);

  // 4. 为每个块生成 Embedding 并写入 productKnowledge
  const knowledgeIds: number[] = [];
  let vectorsGenerated = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const knowledgeType = inferKnowledgeType(fileType, chunk);

    // 生成标题（取前 80 个字符）
    const title = `[${factory.name}] ${fileName} - Part ${i + 1}`;

    // 生成 Embedding
    let embeddingVector: string | null = null;
    try {
      const embedding = await generateEmbedding(chunk);
      embeddingVector = JSON.stringify(embedding);
      vectorsGenerated++;
    } catch (err) {
      console.warn(`[KnowledgeIngest] Failed to generate embedding for chunk ${i}:`, err);
    }

    // 写入数据库
    try {
      const insertResult = await db.insert(productKnowledge).values({
        categorySlug: factory.category ?? "general",
        knowledgeType: knowledgeType as any,
        title,
        content: chunk,
        structuredData: JSON.stringify({
          factoryId,
          factoryName: factory.name,
          sourceFile: fileName,
          fileType,
          chunkIndex: i,
          totalChunks: chunks.length,
        }),
        targetMarkets: JSON.stringify(["global"]),
        confidence: 75, // 工厂上传的资料置信度为 75（低于人工审核的 90）
        source: `factory_upload:${factoryId}:${fileName}`,
        embeddingVector,
        isActive: 1,
      });

      knowledgeIds.push(Number((insertResult as any).insertId));
    } catch (err) {
      console.error(`[KnowledgeIngest] Failed to insert knowledge chunk ${i}:`, err);
    }

    // 避免 API 速率限制
    if (i < chunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  // 5. 更新工厂能力 Embedding（用于匹配引擎）
  let capabilityEmbeddingUpdated = false;
  try {
    // 用整个文件的摘要（前 1500 字符）更新工厂能力向量
    const capabilitySummary = rawContent.slice(0, 1500);
    const capabilityEmbedding = await generateEmbedding(
      `Factory: ${factory.name}\nCategory: ${factory.category}\nCapabilities: ${capabilitySummary}`
    );

    // 检查是否已有能力向量
    const existing = await db
      .select({ id: factoryCapabilityEmbeddings.id })
      .from(factoryCapabilityEmbeddings)
      .where(eq(factoryCapabilityEmbeddings.factoryId, factoryId))
      .then((r) => r[0]);

    if (existing) {
      await db
        .update(factoryCapabilityEmbeddings)
        .set({
          embeddingVector: JSON.stringify(capabilityEmbedding),
          updatedAt: new Date(),
        })
        .where(eq(factoryCapabilityEmbeddings.factoryId, factoryId));
    } else {
      await db.insert(factoryCapabilityEmbeddings).values({
        factoryId,
        primaryCategory: factory.category ?? "general",
        capabilityText: capabilitySummary,
        embeddingVector: JSON.stringify(capabilityEmbedding),
        embeddingModel: "text-embedding-v3",
      });
    }

    capabilityEmbeddingUpdated = true;
    console.log(`[KnowledgeIngest] Updated capability embedding for factory ${factoryId}`);
  } catch (err) {
    console.error(`[KnowledgeIngest] Failed to update capability embedding:`, err);
  }

  const processingTimeMs = Date.now() - startTime;
  console.log(
    `[KnowledgeIngest] Completed: ${knowledgeIds.length} chunks, ${vectorsGenerated} vectors, ${processingTimeMs}ms`
  );

  return {
    factoryId,
    fileName,
    chunksCreated: chunks.length,
    vectorsGenerated,
    knowledgeIds,
    capabilityEmbeddingUpdated,
    processingTimeMs,
  };
}

/**
 * 批量重新向量化工厂的所有知识条目
 * 用于 Embedding 模型升级后的迁移
 */
export async function revectorizeFactoryKnowledge(
  factoryId: number
): Promise<{ updated: number; errors: number }> {
  const items = await db
    .select({ id: productKnowledge.id, content: productKnowledge.content })
    .from(productKnowledge)
    .where(
      eq(
        productKnowledge.source,
        `factory_upload:${factoryId}:%` as any
      )
    );

  let updated = 0;
  let errors = 0;

  for (const item of items) {
    try {
      const embedding = await generateEmbedding(item.content);
      await db
        .update(productKnowledge)
        .set({ embeddingVector: JSON.stringify(embedding) })
        .where(eq(productKnowledge.id, item.id));
      updated++;
      await new Promise((r) => setTimeout(r, 150));
    } catch {
      errors++;
    }
  }

  return { updated, errors };
}
