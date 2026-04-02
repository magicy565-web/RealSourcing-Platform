/**
 * Daily Automation Pipeline
 *
 * Triggered via internal HTTP endpoint (localhost only).
 * Detects new/unprocessed data and runs:
 *   1. Opportunity Radar AI analysis for unanalyzed products
 *   2. Factory capability embedding (vectorization)
 *   3. Knowledge base vectorization
 *   4. FTGI score calculation for unscored factories
 */
import type { Router } from 'express';
import express from 'express';

// ── Localhost-only guard ──────────────────────────────────────────────────────
function isLocalRequest(req: express.Request): boolean {
  const ip = req.ip || req.socket.remoteAddress || '';
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === 'localhost';
}

// ── Automation tasks ──────────────────────────────────────────────────────────

async function runOpportunityRadarAnalysis(log: (msg: string) => void): Promise<{ analyzed: number; failed: number }> {
  const { getPool } = await import('../db');
  const pool = await getPool();
  const aiServiceModule = await import('./aiService');
  const aiService = aiServiceModule.aiService;

  const batchId = `auto-${new Date().toISOString().slice(0, 10)}`;
  const niches = ['electronics', 'furniture', 'textiles', 'home', 'beauty', 'pet_supplies', 'sports', 'fashion', 'kitchen', 'toys'];

  let totalAnalyzed = 0;
  let totalFailed = 0;

  for (const niche of niches) {
    // Find unanalyzed active products
    const [rows] = await pool.execute(`
      SELECT p.id, p.name, p.category, p.description,
             pd."priceMin", pd."priceMax", pd.moq, pd.material, pd.features, pd."leadTimeDays",
             f.name as "factoryName", f.country as "factoryCountry",
             f."overallScore" as "factoryScore", f."certificationStatus"
      FROM products p
      LEFT JOIN product_details pd ON pd."productId" = p.id
      LEFT JOIN factories f ON f.id = p."factoryId"
      LEFT JOIN product_opportunity_analysis poa ON poa."productId" = p.id AND poa.niche = ?
      WHERE p.status = 'active' AND poa.id IS NULL
      LIMIT 20
    `, [niche]) as any[];

    if ((rows as any[]).length === 0) continue;
    log(`[Radar] Niche "${niche}": ${(rows as any[]).length} products to analyze`);

    for (const product of rows as any[]) {
      try {
        const prompt = `You are an expert e-commerce product analyst specializing in ${niche} products.
Analyze this product and return JSON:
PRODUCT: ${product.name} | ${product.category || niche} | $${product.priceMin || '?'}-$${product.priceMax || '?'} | MOQ ${product.moq || 1} | ${product.material || 'N/A'}
SUPPLIER: ${product.factoryName || 'Unknown'} | ${product.factoryCountry || 'China'} | Score ${product.factoryScore || 'N/A'}
Return: { "opportunityScore": <0-100>, "trendScore": <0-100>, "marginScore": <0-100>, "competitionScore": <0-100>, "demandScore": <0-100>, "headline": "<80 chars>", "whyNow": "<2 sentences>", "targetAudience": "<string>", "suggestedPlatforms": ["shopify","amazon"], "actionSteps": ["step1","step2","step3","step4"], "risks": "<string>", "estimatedMargin": "<e.g. 40-60%>", "suggestedRetailPrice": "<string>", "keywords": ["k1","k2","k3"], "tags": ["t1","t2"] }`;

        const messages: any[] = [{ role: 'user', content: prompt }];
        const content = await aiService.callAI(messages, { temperature: 0.3, preferJson: true });
        const analysis = JSON.parse(content);

        await pool.execute(`
          INSERT INTO product_opportunity_analysis
            ("productId", niche, "opportunityScore", "trendScore", "marginScore",
             "competitionScore", "demandScore", headline, "whyNow", "targetAudience",
             "suggestedPlatforms", "actionSteps", risks, "estimatedMargin",
             "suggestedRetailPrice", keywords, tags, "batchId", "isActive", "createdAt", "updatedAt")
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
          ON CONFLICT ("productId") DO UPDATE SET
            "opportunityScore" = EXCLUDED."opportunityScore", "trendScore" = EXCLUDED."trendScore",
            "marginScore" = EXCLUDED."marginScore", "competitionScore" = EXCLUDED."competitionScore",
            "demandScore" = EXCLUDED."demandScore", headline = EXCLUDED.headline,
            "whyNow" = EXCLUDED."whyNow", "targetAudience" = EXCLUDED."targetAudience",
            "suggestedPlatforms" = EXCLUDED."suggestedPlatforms", "actionSteps" = EXCLUDED."actionSteps",
            risks = EXCLUDED.risks, "estimatedMargin" = EXCLUDED."estimatedMargin",
            "suggestedRetailPrice" = EXCLUDED."suggestedRetailPrice",
            keywords = EXCLUDED.keywords, tags = EXCLUDED.tags,
            "batchId" = EXCLUDED."batchId", "updatedAt" = NOW()
        `, [
          product.id, niche,
          analysis.opportunityScore ?? 50, analysis.trendScore ?? 50, analysis.marginScore ?? 50,
          analysis.competitionScore ?? 50, analysis.demandScore ?? 50,
          analysis.headline || '', analysis.whyNow || '', analysis.targetAudience || '',
          JSON.stringify(analysis.suggestedPlatforms || []),
          JSON.stringify(analysis.actionSteps || []),
          analysis.risks || '', analysis.estimatedMargin || '',
          analysis.suggestedRetailPrice || '',
          JSON.stringify(analysis.keywords || []),
          JSON.stringify(analysis.tags || []),
          batchId,
        ]);

        totalAnalyzed++;
        log(`  [OK] Product #${product.id} "${product.name}" → score ${analysis.opportunityScore}`);
      } catch (err) {
        totalFailed++;
        log(`  [FAIL] Product #${product.id}: ${(err as Error).message?.slice(0, 100)}`);
      }
    }

    // Upsert radar_batches
    if (totalAnalyzed > 0) {
      await pool.execute(`
        INSERT INTO radar_batches (id, niche, "productCount", "isPublished", "publishedAt", "createdAt")
        VALUES (?, ?, ?, 1, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET "productCount" = radar_batches."productCount" + ?
      `, [batchId, niche, totalAnalyzed, totalAnalyzed]);
    }
  }

  return { analyzed: totalAnalyzed, failed: totalFailed };
}

async function runFactoryEmbeddings(log: (msg: string) => void): Promise<{ embedded: number; failed: number }> {
  const { getPool } = await import('../db');
  const pool = await getPool();

  // Find factories without embeddings
  const [rows] = await pool.execute(`
    SELECT f.id, f.name, f.category, f.city, f.country, f.description
    FROM factories f
    LEFT JOIN factory_capability_embeddings fce ON fce."factoryId" = f.id
    WHERE fce.id IS NULL
    LIMIT 50
  `) as any[];

  const factories = rows as any[];
  if (factories.length === 0) {
    log('[Embedding] No new factories to embed');
    return { embedded: 0, failed: 0 };
  }

  log(`[Embedding] ${factories.length} factories to embed`);
  let embedded = 0;
  let failed = 0;

  const { generateEmbedding } = await import('./vectorSearchService');

  for (const factory of factories) {
    try {
      const capabilityText = [
        factory.name,
        factory.category,
        factory.city,
        factory.country,
        factory.description,
      ].filter(Boolean).join(' | ');

      const result = await generateEmbedding(capabilityText);
      if ('error' in result) {
        log(`  [FAIL] Factory #${factory.id} "${factory.name}": ${result.error}`);
        failed++;
        continue;
      }

      await pool.execute(`
        INSERT INTO factory_capability_embeddings
          ("factoryId", "capabilityText", "embeddingVector", "embeddingModel", "primaryCategory", "isActive", "embeddingAt", "createdAt", "updatedAt")
        VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW(), NOW())
        ON CONFLICT ("factoryId") DO UPDATE SET
          "capabilityText" = EXCLUDED."capabilityText",
          "embeddingVector" = EXCLUDED."embeddingVector",
          "embeddingModel" = EXCLUDED."embeddingModel",
          "embeddingAt" = NOW(), "updatedAt" = NOW()
      `, [factory.id, capabilityText, JSON.stringify(result.vector), result.model, factory.category]);

      embedded++;
      log(`  [OK] Factory #${factory.id} "${factory.name}" (${result.model}, ${result.vector.length}d)`);
    } catch (err) {
      failed++;
      log(`  [FAIL] Factory #${factory.id}: ${(err as Error).message?.slice(0, 100)}`);
    }
  }

  return { embedded, failed };
}

async function runKnowledgeVectorization(log: (msg: string) => void): Promise<{ vectorized: number; failed: number }> {
  const { getPool } = await import('../db');
  const pool = await getPool();

  const [rows] = await pool.execute(`
    SELECT id, title, content FROM product_knowledge
    WHERE "isActive" = 1 AND "embeddingVector" IS NULL
    LIMIT 100
  `) as any[];

  const entries = rows as any[];
  if (entries.length === 0) {
    log('[Knowledge] No entries to vectorize');
    return { vectorized: 0, failed: 0 };
  }

  log(`[Knowledge] ${entries.length} entries to vectorize`);
  let vectorized = 0;
  let failed = 0;

  const { generateEmbedding } = await import('./vectorSearchService');

  for (const entry of entries) {
    try {
      const text = `${entry.title} ${entry.content}`.slice(0, 2000);
      const result = await generateEmbedding(text);
      if ('error' in result) { failed++; continue; }

      await pool.execute(`
        UPDATE product_knowledge
        SET "embeddingVector" = ?, "embeddingModel" = ?, "embeddingAt" = NOW()
        WHERE id = ?
      `, [JSON.stringify(result.vector), result.model, entry.id]);

      vectorized++;
    } catch {
      failed++;
    }
  }

  log(`[Knowledge] Vectorized ${vectorized}, failed ${failed}`);
  return { vectorized, failed };
}

async function runFtgiScoring(log: (msg: string) => void): Promise<{ scored: number; failed: number }> {
  const { getPool } = await import('../db');
  const pool = await getPool();

  // Find factories without FTGI scores
  const [rows] = await pool.execute(`
    SELECT f.id, f.name FROM factories f
    LEFT JOIN factory_ftgi_scores ffs ON ffs."factoryId" = f.id
    WHERE ffs.id IS NULL
    LIMIT 20
  `) as any[];

  const factories = rows as any[];
  if (factories.length === 0) {
    log('[FTGI] No factories to score');
    return { scored: 0, failed: 0 };
  }

  log(`[FTGI] ${factories.length} factories to score`);
  let scored = 0;
  let failed = 0;

  const { calculateFtgiScore } = await import('./ftgiService');

  for (const factory of factories) {
    try {
      const result = await calculateFtgiScore(factory.id);
      scored++;
      log(`  [OK] Factory #${factory.id} "${factory.name}" → FTGI ${result.ftgiScore}`);
    } catch (err) {
      failed++;
      log(`  [FAIL] Factory #${factory.id}: ${(err as Error).message?.slice(0, 100)}`);
    }
  }

  return { scored, failed };
}

// ── Express Router ──────────────────────────────────────────────────────────

export function createAutomationRouter(): Router {
  const router = express.Router();

  // Guard: only allow from localhost
  router.use((req, res, next) => {
    if (!isLocalRequest(req)) {
      return res.status(403).json({ error: 'Forbidden: localhost only' });
    }
    next();
  });

  // GET /api/internal/status — check what needs processing
  router.get('/status', async (_req, res) => {
    try {
      const { getPool } = await import('../db');
      const pool = await getPool();

      const [r] = await pool.execute(`
        SELECT
          (SELECT COUNT(*) FROM products WHERE status='active') as "totalProducts",
          (SELECT COUNT(DISTINCT "productId") FROM product_opportunity_analysis) as "analyzedProducts",
          (SELECT COUNT(*) FROM factories) as "totalFactories",
          (SELECT COUNT(*) FROM factory_capability_embeddings) as "embeddedFactories",
          (SELECT COUNT(*) FROM factory_ftgi_scores) as "scoredFactories",
          (SELECT COUNT(*) FROM product_knowledge WHERE "isActive"=1 AND "embeddingVector" IS NULL) as "unvectorizedKnowledge",
          (SELECT COUNT(*) FROM product_knowledge WHERE "isActive"=1) as "totalKnowledge"
      `) as any[];

      res.json({ status: 'ok', data: (r as any[])[0] });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // POST /api/internal/run — execute full automation pipeline
  router.post('/run', async (req, res) => {
    const startTime = Date.now();
    const logs: string[] = [];
    const log = (msg: string) => {
      const ts = new Date().toISOString().slice(11, 19);
      const line = `[${ts}] ${msg}`;
      logs.push(line);
      console.log(`[Automation] ${line}`);
    };

    log('=== Daily Automation Pipeline Started ===');

    const results: Record<string, any> = {};

    try {
      // Step 1: Opportunity Radar
      log('Step 1/4: Opportunity Radar AI Analysis');
      results.radar = await runOpportunityRadarAnalysis(log);

      // Step 2: Factory Embeddings
      log('Step 2/4: Factory Capability Embeddings');
      results.embeddings = await runFactoryEmbeddings(log);

      // Step 3: Knowledge Vectorization
      log('Step 3/4: Knowledge Base Vectorization');
      results.knowledge = await runKnowledgeVectorization(log);

      // Step 4: FTGI Scoring
      log('Step 4/4: FTGI Score Calculation');
      results.ftgi = await runFtgiScoring(log);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`=== Pipeline Complete in ${duration}s ===`);

      res.json({ status: 'ok', duration: `${duration}s`, results, logs });
    } catch (err) {
      log(`FATAL: ${(err as Error).message}`);
      res.status(500).json({ status: 'error', error: (err as Error).message, results, logs });
    }
  });

  // POST /api/internal/run/radar — run only opportunity radar
  router.post('/run/radar', async (_req, res) => {
    const logs: string[] = [];
    const log = (msg: string) => { logs.push(msg); console.log(`[Automation] ${msg}`); };
    try {
      const result = await runOpportunityRadarAnalysis(log);
      res.json({ status: 'ok', result, logs });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message, logs });
    }
  });

  // POST /api/internal/run/embeddings — run only factory embeddings
  router.post('/run/embeddings', async (_req, res) => {
    const logs: string[] = [];
    const log = (msg: string) => { logs.push(msg); console.log(`[Automation] ${msg}`); };
    try {
      const result = await runFactoryEmbeddings(log);
      res.json({ status: 'ok', result, logs });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message, logs });
    }
  });

  // POST /api/internal/run/ftgi — run only FTGI scoring
  router.post('/run/ftgi', async (_req, res) => {
    const logs: string[] = [];
    const log = (msg: string) => { logs.push(msg); console.log(`[Automation] ${msg}`); };
    try {
      const result = await runFtgiScoring(log);
      res.json({ status: 'ok', result, logs });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message, logs });
    }
  });

  return router;
}
