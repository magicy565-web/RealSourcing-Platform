/**
 * vectorize-knowledge.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase B: 批量向量化脚本
 * 为 product_knowledge 表中所有尚未向量化的条目生成向量
 *
 * 使用方式：
 *   npx tsx scripts/vectorize-knowledge.ts
 *   npx tsx scripts/vectorize-knowledge.ts --batch=100 --delay=300
 *
 * 环境变量：
 *   DATABASE_URL      - MySQL 连接字符串
 *   DASHSCOPE_API_KEY - 阿里云百炼 API Key（优先使用 text-embedding-v3）
 *   OPENAI_API_KEY    - OpenAI API Key（备用）
 *   OPENAI_BASE_URL   - OpenAI 兼容接口地址（可选）
 * ─────────────────────────────────────────────────────────────────────────────
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import mysql from 'mysql2/promise';

// ── 解析命令行参数 ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const batchSize = parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] ?? '50');
const delayMs = parseInt(args.find(a => a.startsWith('--delay='))?.split('=')[1] ?? '200');
const dryRun = args.includes('--dry-run');

console.log(`⚙️  配置: batch=${batchSize}, delay=${delayMs}ms, dryRun=${dryRun}`);

// ── 向量生成函数（支持阿里云百炼 + OpenAI 备用）─────────────────────────────────

async function generateEmbedding(text: string): Promise<{ vector: number[]; model: string } | null> {
  const dashscopeKey = process.env.DASHSCOPE_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const openaiBase = (process.env.OPENAI_BASE_URL || 'https://once.novai.su/v1').replace(/\/$/, '');

  // 优先使用阿里云百炼 text-embedding-v3（1536维）
  if (dashscopeKey) {
    try {
      const resp = await fetch(
        'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${dashscopeKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-v3',
            input: { texts: [text.slice(0, 2000)] },
            parameters: { dimension: 1536 },
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (resp.ok) {
        const data = await resp.json() as any;
        if (!data.code && data.output?.embeddings?.[0]?.embedding) {
          const vec = data.output.embeddings[0].embedding as number[];
          // L2 归一化（单位向量，余弦相似度 = 点积）
          const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
          const normalized = norm > 0 ? vec.map(v => v / norm) : vec;
          return { vector: normalized, model: 'text-embedding-v3' };
        }
        console.warn(`  ⚠️ DashScope 返回错误: ${data.message || data.code}`);
      } else {
        const errText = await resp.text();
        console.warn(`  ⚠️ DashScope HTTP ${resp.status}: ${errText.slice(0, 100)}`);
      }
    } catch (err) {
      console.warn(`  ⚠️ DashScope 请求失败: ${(err as Error).message}`);
    }
  }

  // 备用：OpenAI text-embedding-3-small（1536维）
  if (openaiKey) {
    try {
      const resp = await fetch(`${openaiBase}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.slice(0, 8000),
          dimensions: 1536,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (resp.ok) {
        const data = await resp.json() as any;
        const vec = data.data?.[0]?.embedding as number[];
        if (vec) {
          const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
          const normalized = norm > 0 ? vec.map(v => v / norm) : vec;
          return { vector: normalized, model: 'text-embedding-3-small' };
        }
      } else {
        const errText = await resp.text();
        console.warn(`  ⚠️ OpenAI HTTP ${resp.status}: ${errText.slice(0, 100)}`);
      }
    } catch (err) {
      console.warn(`  ⚠️ OpenAI 请求失败: ${(err as Error).message}`);
    }
  }

  return null;
}

// ── 主函数 ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ 缺少 DATABASE_URL 环境变量');
    process.exit(1);
  }

  if (!process.env.DASHSCOPE_API_KEY && !process.env.OPENAI_API_KEY) {
    console.error('❌ 缺少 DASHSCOPE_API_KEY 或 OPENAI_API_KEY 环境变量');
    process.exit(1);
  }

  const apiType = process.env.DASHSCOPE_API_KEY ? '阿里云百炼 text-embedding-v3' : 'OpenAI text-embedding-3-small';
  console.log(`🔌 使用向量模型: ${apiType}`);

  const pool = mysql.createPool(process.env.DATABASE_URL);

  try {
    // 统计待向量化数量
    const [countRows] = await pool.execute<any[]>(
      'SELECT COUNT(*) as cnt FROM product_knowledge WHERE isActive=1 AND embeddingVector IS NULL'
    );
    const total = (countRows[0] as any).cnt;
    const [totalRows] = await pool.execute<any[]>(
      'SELECT COUNT(*) as cnt FROM product_knowledge WHERE isActive=1'
    );
    const totalAll = (totalRows[0] as any).cnt;

    console.log(`\n📊 知识库状态：`);
    console.log(`   总条目: ${totalAll} 条`);
    console.log(`   待向量化: ${total} 条`);
    console.log(`   已向量化: ${totalAll - total} 条`);

    if (total === 0) {
      console.log('\n✅ 所有条目已向量化，无需处理！');
      return;
    }

    if (dryRun) {
      console.log('\n🔍 Dry run 模式，不执行实际向量化');
      return;
    }

    let processed = 0;
    let success = 0;
    let failed = 0;
    const startTime = Date.now();

    console.log(`\n🚀 开始批量向量化 ${total} 条知识条目...`);
    console.log(`${'─'.repeat(60)}`);

    // 分批处理（避免一次性加载过多数据）
    while (true) {
      const [rows] = await pool.execute<any[]>(
        `SELECT id, title, content FROM product_knowledge
         WHERE isActive=1 AND embeddingVector IS NULL
         ORDER BY id ASC LIMIT ?`,
        [batchSize]
      );

      if ((rows as any[]).length === 0) break;

      for (const row of rows as any[]) {
        const text = `${row.title} ${row.content}`.slice(0, 2000);
        const result = await generateEmbedding(text);

        if (result) {
          await pool.execute(
            `UPDATE product_knowledge
             SET embeddingVector=?, embeddingModel=?, embeddingAt=NOW(3)
             WHERE id=?`,
            [JSON.stringify(result.vector), result.model, row.id]
          );
          success++;
          const progress = Math.round(((processed + 1) / total) * 100);
          process.stdout.write(`\r  进度: ${processed + 1}/${total} (${progress}%) | 成功: ${success} 失败: ${failed}`);
        } else {
          failed++;
          console.log(`\n  ✗ #${row.id} "${row.title.slice(0, 40)}" 向量化失败`);
        }

        processed++;

        // 限速：避免 API 限流
        if (delayMs > 0) {
          await new Promise(r => setTimeout(r, delayMs));
        }
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // 最终统计
    const [finalRows] = await pool.execute<any[]>(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN embeddingVector IS NOT NULL THEN 1 ELSE 0 END) as vectorized
       FROM product_knowledge WHERE isActive=1`
    );
    const stats = finalRows[0] as any;

    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`✅ 批量向量化完成！（耗时 ${elapsed}s）`);
    console.log(`   本次成功: ${success} 条`);
    console.log(`   本次失败: ${failed} 条`);
    console.log(`   数据库总计: ${stats.total} 条`);
    console.log(`   已向量化: ${stats.vectorized} 条`);
    console.log(`   向量化覆盖率: ${((stats.vectorized / stats.total) * 100).toFixed(1)}%`);
    console.log(`${'='.repeat(60)}\n`);

    if (failed > 0) {
      console.log(`⚠️  ${failed} 条向量化失败，可重新运行脚本处理剩余条目`);
    }

  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('\n❌ 脚本执行失败:', err);
  process.exit(1);
});
