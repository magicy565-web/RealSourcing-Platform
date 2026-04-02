/**
 * RealSourcing 4.0 - 工厂能力向量批量初始化脚本
 *
 * 用途：
 *   为数据库中所有已激活工厂生成/更新 factoryCapabilityEmbeddings 记录。
 *   首次部署或新增大量工厂数据后运行此脚本，确保匹配系统有足够的候选工厂。
 *
 * 使用方法：
 *   npx tsx scripts/init-factory-embeddings.ts
 *   或：
 *   pnpm tsx scripts/init-factory-embeddings.ts
 *
 * 环境要求：
 *   - .env 文件中配置了 DATABASE_URL 和 OPENAI_API_KEY
 *   - 数据库中已有工厂数据（factories 表）
 *
 * 注意：
 *   - 脚本会跳过已有有效向量的工厂（除非使用 --force 参数）
 *   - 每次 API 调用间隔 200ms，避免触发速率限制
 *   - 使用 --dry-run 参数可预览将要处理的工厂列表，不实际生成向量
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema';
import { eq, isNull, isNotNull } from 'drizzle-orm';

// ── 配置 ────────────────────────────────────────────────────────────────────────
const BATCH_SIZE = 10;       // 每批处理工厂数
const DELAY_MS   = 200;      // 每次 API 调用间隔（毫秒）
const FORCE      = process.argv.includes('--force');
const DRY_RUN    = process.argv.includes('--dry-run');

// ── 辅助函数 ────────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateEmbeddingDirect(text: string): Promise<number[] | null> {
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://once.novai.su/v1').replace(/\/$/, '');
  const apiKey  = process.env.OPENAI_API_KEY || '';

  try {
    const res = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      // 如果 embedding API 不可用，使用哈希后备方案
      console.warn(`  ⚠️  Embedding API returned ${res.status}, using hash fallback`);
      return generateHashEmbedding(text);
    }

    const data = await res.json() as { data?: Array<{ embedding: number[] }> };
    return data.data?.[0]?.embedding ?? null;
  } catch (err) {
    console.warn(`  ⚠️  Embedding API error: ${(err as Error).message}, using hash fallback`);
    return generateHashEmbedding(text);
  }
}

/**
 * 哈希后备方案：生成 1536 维确定性向量
 * 确保在 API 不可用时仍能生成可用于相似度计算的向量
 */
function generateHashEmbedding(text: string): number[] {
  const DIM = 1536;
  const vector = new Array(DIM).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    vector[i % DIM] += Math.sin(code * (i + 1) * 0.001);
    vector[(i * 7 + 3) % DIM] += Math.cos(code * 0.01);
    vector[(i * 13 + 7) % DIM] += (code % 100) * 0.001;
  }
  // 归一化
  const norm = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) || 1;
  return vector.map(v => v / norm);
}

// ── 品类归一化（与 factoryMatchingService 保持一致） ─────────────────────────────

const STANDARD_CATEGORIES = [
  '智能家居', '运动装备', '美妆个护', '礼品工艺', '精密模具',
  '穿戴科技', '消费电子', '家居用品', '服装配饰', '食品饮料',
  '医疗器械', '汽车配件', '工业设备', '其他',
];

function normalizeCategory(raw: string | null | undefined): string {
  if (!raw) return '其他';
  const trimmed = raw.trim();
  // 精确匹配
  if (STANDARD_CATEGORIES.includes(trimmed)) return trimmed;
  // 包含匹配
  for (const cat of STANDARD_CATEGORIES) {
    if (trimmed.includes(cat) || cat.includes(trimmed)) return cat;
  }
  return trimmed; // 返回原始值
}

// ── 主逻辑 ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 RealSourcing - 工厂能力向量初始化脚本');
  console.log(`   模式: ${DRY_RUN ? 'DRY RUN（预览）' : '实际执行'} | Force: ${FORCE}`);
  console.log('');

  // 连接数据库
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection, { schema, mode: 'default' });

  // 获取所有激活工厂
  const allFactories = await db.select({
    id:          schema.factories.id,
    name:        schema.factories.name,
    category:    schema.factories.category,
    city:        schema.factories.city,
    description: schema.factories.description,
    status:      schema.factories.status,
  }).from(schema.factories)
    .where(eq(schema.factories.status, 'active'));

  console.log(`📊 数据库中共有 ${allFactories.length} 家激活工厂`);

  // 获取已有向量的工厂 ID
  const existingEmbeddings = await db.select({ factoryId: schema.factoryCapabilityEmbeddings.factoryId })
    .from(schema.factoryCapabilityEmbeddings)
    .where(isNotNull(schema.factoryCapabilityEmbeddings.embeddingVector));

  const existingIds = new Set(existingEmbeddings.map(e => e.factoryId));
  console.log(`✅ 已有向量的工厂: ${existingIds.size} 家`);

  // 筛选需要处理的工厂
  const toProcess = FORCE
    ? allFactories
    : allFactories.filter(f => !existingIds.has(f.id));

  console.log(`🔄 需要处理的工厂: ${toProcess.length} 家`);
  console.log('');

  if (DRY_RUN) {
    console.log('📋 将要处理的工厂列表:');
    toProcess.forEach((f, i) => {
      console.log(`  ${i + 1}. [${f.id}] ${f.name} | 品类: ${f.category ?? '未设置'} | 城市: ${f.city ?? '未知'}`);
    });
    await connection.end();
    return;
  }

  // 分批处理
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE);
    console.log(`\n📦 处理批次 ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toProcess.length / BATCH_SIZE)} (${batch.length} 家工厂)`);

    for (const factory of batch) {
      const normalizedCategory = normalizeCategory(factory.category);

      // 构建能力描述文本
      const capabilityText = [
        `工厂: ${factory.name}`,
        factory.category ? `品类: ${normalizedCategory}` : null,
        factory.city ? `城市: ${factory.city}` : null,
        factory.description ? `描述: ${factory.description.slice(0, 300)}` : null,
      ].filter(Boolean).join(' | ');

      process.stdout.write(`  [${factory.id}] ${factory.name} (${normalizedCategory})... `);

      try {
        const vector = await generateEmbeddingDirect(capabilityText);
        if (!vector) {
          console.log('❌ 向量生成失败');
          failCount++;
          continue;
        }

        // Upsert 到数据库
        await db.insert(schema.factoryCapabilityEmbeddings).values({
          factoryId:       factory.id,
          capabilityText,
          embeddingVector: JSON.stringify(vector),
          embeddingModel:  'text-embedding-3-small',
          primaryCategory: normalizedCategory,
          isActive:        1,
          embeddingAt:     new Date(),
        }).onConflictDoUpdate({
          target: schema.factoryCapabilityEmbeddings.factoryId,
          set: {
            capabilityText,
            embeddingVector: JSON.stringify(vector),
            embeddingModel:  'text-embedding-3-small',
            primaryCategory: normalizedCategory,
            isActive:        1,
            embeddingAt:     new Date(),
          },
        });

        console.log(`✅ (${vector.length}d)`);
        successCount++;
      } catch (err) {
        console.log(`❌ ${(err as Error).message}`);
        failCount++;
      }

      await sleep(DELAY_MS);
    }
  }

  console.log('\n');
  console.log('═══════════════════════════════════════════════');
  console.log(`✅ 成功: ${successCount} 家工厂`);
  console.log(`❌ 失败: ${failCount} 家工厂`);
  console.log(`📊 总计: ${toProcess.length} 家工厂`);
  console.log('═══════════════════════════════════════════════');

  await connection.end();
}

main().catch(err => {
  console.error('❌ 脚本执行失败:', err);
  process.exit(1);
});
