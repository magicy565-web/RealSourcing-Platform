/**
 * RealSourcing 4.0 - Queue Worker
 * BullMQ Worker 处理器，运行在独立进程中（或主进程中注册）
 *
 * 处理两类任务：
 * 1. factory-matching：触发工厂匹配计算，结果写入 demandMatchResults
 * 2. factory-embedding：为工厂生成能力向量，写入 factoryCapabilityEmbeddings
 */
import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { ENV } from './env';
import { matchFactoriesForDemand, updateFactoryCapabilityEmbedding } from './factoryMatchingService';
import { FactoryMatchingJobData, FactoryEmbeddingJobData, DemandProcessingJobData } from './queue';
import { dbPromise, updateSourcingDemand, upsertManufacturingParameters } from '../db';
import * as schema from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { ingestContent, isIngestionError } from './multimodalIngestionService';
import { extractSourcingDemand, isExtractionError } from './sourcingDemandService';
import { transformToManufacturingParams, isTransformationError } from './manufacturingParamsService';
import { generateEmbedding, buildEmbeddingText, isEmbeddingError } from './vectorSearchService';
import { ossUploadFromUrl } from './ossStorageService';

const workerConnection = new IORedis(ENV.redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// ── Worker 1：工厂匹配 ─────────────────────────────────────────────────────────
export const factoryMatchingWorker = new Worker<FactoryMatchingJobData>(
  'factory-matching',
  async (job: Job<FactoryMatchingJobData>) => {
    const { demandId } = job.data;
    console.log(`[Worker] Starting factory matching for demand #${demandId}`);

    await job.updateProgress(10);

    // 执行核心匹配逻辑
    const results = await matchFactoriesForDemand(demandId);

    await job.updateProgress(90);

    // 更新需求状态及匹配元数据，通知前端匹配完成
    const db = await dbPromise;
    await db.update(schema.sourcingDemands)
      .set({ 
        status: 'matched',
        matchStatus: 'completed',
        matchedAt: new Date(),
        matchCount: sql`matchCount + 1`
      } as any)
      .where(eq(schema.sourcingDemands.id, demandId));

    await job.updateProgress(100);

    console.log(`[Worker] Matching complete for demand #${demandId}, found ${results.length} matches`);
    return { demandId, matchCount: results.length };
  },
  {
    connection: workerConnection,
    concurrency: 5, // 同时处理 5 个匹配任务
  }
);

// ── Worker 2：工厂 Embedding 生成 ──────────────────────────────────────────────
export const factoryEmbeddingWorker = new Worker<FactoryEmbeddingJobData>(
  'factory-embedding',
  async (job: Job<FactoryEmbeddingJobData>) => {
    const { factoryId, reason } = job.data;
    console.log(`[Worker] Generating embedding for factory #${factoryId} (reason: ${reason})`);

    const result = await updateFactoryCapabilityEmbedding(factoryId);

    if (!result) {
      throw new Error(`Failed to generate embedding for factory #${factoryId}`);
    }

    console.log(`[Worker] Embedding generated for factory #${factoryId}`);
    return { factoryId, success: true };
  },
  {
    connection: workerConnection,
    concurrency: 3,
  }
);

// ── Worker 3：需求 AI 解析（submitAndProcess 异步化）─────────────────────────────
// 将原来在 HTTP 请求中同步执行的 AI 解析流程移至此处，避免超时
export const demandProcessingWorker = new Worker<DemandProcessingJobData>(
  'demand-processing',
  async (job: Job<DemandProcessingJobData>) => {
    const { demandId, sourceType, sourceUri } = job.data;
    console.log(`[DemandWorker] Processing demand #${demandId} | type: ${sourceType}`);

    try {
      await job.updateProgress(5);

      // Step 1: 内容摄取（URL/PDF/视频/文本 → 结构化文本）
      const ingested = await ingestContent(sourceType, sourceUri);
      if (isIngestionError(ingested)) {
        await updateSourcingDemand(demandId, { status: 'failed', processingError: ingested.error });
        throw new Error(`内容摄取失败: ${ingested.error}`);
      }
      await job.updateProgress(25);

      // Step 2: AI 信息提取（结构化文本 → SourcingDemand 字段）
      const extracted = await extractSourcingDemand(ingested);
      if (isExtractionError(extracted)) {
        await updateSourcingDemand(demandId, { status: 'failed', processingError: extracted.error });
        throw new Error(`信息提取失败: ${extracted.error}`);
      }
      await job.updateProgress(45);

      // Step 3: 转存视觉参考图片到 OSS
      const ossImageUrls: string[] = [];
      for (const imgUrl of (extracted.visualReferences ?? []).slice(0, 5)) {
        if (imgUrl.startsWith('http')) {
          const ossResult = await ossUploadFromUrl(imgUrl, 'references');
          if (!('error' in ossResult)) ossImageUrls.push(ossResult.url);
        }
      }
      await job.updateProgress(55);

      // Step 4: 更新需求记录（状态: extracted）
      await updateSourcingDemand(demandId, {
        status: 'extracted',
        productName: extracted.productName,
        productDescription: extracted.productDescription,
        keyFeatures: extracted.keyFeatures,
        targetAudience: extracted.targetAudience,
        visualReferences: ossImageUrls.length > 0 ? ossImageUrls : extracted.visualReferences,
        estimatedQuantity: extracted.estimatedQuantity,
        targetPrice: extracted.targetPrice,
        customizationNotes: extracted.customizationNotes,
        extractedData: extracted.extractedData,
      });
      await job.updateProgress(65);

      // Step 5: 转化为工厂生产参数
      const params = await transformToManufacturingParams(extracted);
      if (isTransformationError(params)) {
        await updateSourcingDemand(demandId, { status: 'failed', processingError: params.error });
        throw new Error(`参数转化失败: ${params.error}`);
      }
      await job.updateProgress(80);

      // Step 6: 存储生产参数
      await upsertManufacturingParameters(demandId, {
        moq: params.moq ?? undefined,
        materials: params.materials,
        dimensions: params.dimensions,
        weight: params.weight,
        colorRequirements: params.colorRequirements,
        packagingRequirements: params.packagingRequirements,
        certificationsRequired: params.certificationsRequired,
        estimatedUnitCost: params.estimatedUnitCost ? String(params.estimatedUnitCost) : undefined,
        toolingCost: params.toolingCost ? String(params.toolingCost) : undefined,
        leadTimeDays: params.leadTimeDays ?? undefined,
        productionCategory: params.productionCategory,
        suggestedFactoryTypes: params.suggestedFactoryTypes,
      });

      // Step 7: 更新状态为 transformed
      await updateSourcingDemand(demandId, {
        status: 'transformed',
        productionCategory: params.productionCategory,
      });
      await job.updateProgress(90);

      // Step 8: 后台生成语义向量（不阻塞 Worker 完成）
      setImmediate(async () => {
        try {
          const embText = buildEmbeddingText({
            productName: extracted.productName,
            productDescription: extracted.productDescription,
            keyFeatures: extracted.keyFeatures,
            productionCategory: String(extracted.extractedData?.productCategory ?? ''),
            customizationNotes: extracted.customizationNotes,
            estimatedQuantity: extracted.estimatedQuantity,
            targetPrice: extracted.targetPrice,
          });
          const embResult = await generateEmbedding(embText);
          if (!isEmbeddingError(embResult)) {
            await updateSourcingDemand(demandId, {
              embeddingVector: JSON.stringify(embResult.vector) as unknown as never,
              embeddingModel: embResult.model as unknown as never,
              embeddingAt: new Date() as unknown as never,
            });
            console.log(`[DemandWorker] Embedding generated for #${demandId}`);
          }
        } catch (embErr) {
          console.warn(`[DemandWorker] Background embedding failed for #${demandId}:`, embErr);
        }
      });

      await job.updateProgress(100);
      console.log(`[DemandWorker] Demand #${demandId} fully processed: "${extracted.productName}"`);
      return { demandId, status: 'transformed', productName: extracted.productName };

    } catch (err) {
      // 若非已处理的业务错误，标记为 failed
      const errMsg = err instanceof Error ? err.message : String(err);
      await updateSourcingDemand(demandId, { status: 'failed', processingError: errMsg }).catch(() => {});
      throw err; // 重新抛出，让 BullMQ 记录失败并触发 retry
    }
  },
  {
    connection: workerConnection,
    concurrency: 3, // 同时处理 3 个需求解析任务
  }
);

// ── 事件监听（日志） ────────────────────────────────────────────────────────────
factoryMatchingWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed:`, job.returnvalue);
});

factoryMatchingWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

factoryEmbeddingWorker.on('failed', (job, err) => {
  console.error(`[EmbedWorker] Job ${job?.id} failed:`, err.message);
});

demandProcessingWorker.on('completed', (job) => {
  console.log(`[DemandWorker] Job ${job.id} completed:`, job.returnvalue);
});

demandProcessingWorker.on('failed', (job, err) => {
  console.error(`[DemandWorker] Job ${job?.id} failed:`, err.message);
});

console.log('[Worker] Factory matching, embedding, and demand processing workers started');
