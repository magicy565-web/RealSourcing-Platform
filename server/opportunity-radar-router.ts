/**
 * Opportunity Radar Router
 * Powers the "Product Opportunity Radar" feature:
 * - Fetches products with AI-generated opportunity analysis
 * - Manages user radar preferences (filters)
 * - Triggers AI analysis for new product batches
 * - Provides Coach-ready opportunity summaries
 */
import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { aiService, type ChatMessage } from './_core/aiService';

// ─── Helper: get DB pool ──────────────────────────────────────────────────────
async function getDb() {
  const { getPool } = await import('./db');
  return getPool();
}

// ─── Helper: parse JSON safely ────────────────────────────────────────────────
function safeJson(val: any, fallback: any = null) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
}

// ─── AI Analysis Generator ────────────────────────────────────────────────────
async function generateOpportunityAnalysis(product: any, factory: any, niche: string): Promise<any> {
  const prompt = `You are an expert e-commerce product analyst specializing in ${niche} products for dropshipping and small business sourcing.

Analyze this product and generate a structured opportunity assessment:

PRODUCT:
- Name: ${product.name}
- Category: ${product.category || niche}
- Description: ${product.description || 'N/A'}
- Price Range: $${product.priceMin || '?'} - $${product.priceMax || '?'} USD
- MOQ: ${product.moq || 1} units
- Lead Time: ${product.leadTimeDays || '?'} days
- Material: ${product.material || 'N/A'}
- Features: ${product.features || 'N/A'}

SUPPLIER:
- Factory: ${factory?.name || 'Unknown'}
- Country: ${factory?.country || 'China'}
- Rating: ${factory?.overallScore || 'N/A'}/5
- Certification: ${factory?.certificationStatus || 'pending'}

Generate a JSON response with this exact structure:
{
  "opportunityScore": <0-100, overall score>,
  "trendScore": <0-100, how trendy/growing is this product category>,
  "marginScore": <0-100, profit margin potential>,
  "competitionScore": <0-100, higher means LESS competition>,
  "demandScore": <0-100, consumer demand signal>,
  "headline": "<one punchy sentence summarizing the opportunity, max 80 chars>",
  "whyNow": "<2-3 sentences explaining why this is a good opportunity RIGHT NOW>",
  "targetAudience": "<who would buy this, be specific>",
  "suggestedPlatforms": ["shopify", "tiktok_shop", "amazon", "etsy"],
  "actionSteps": [
    "<step 1: what to do first>",
    "<step 2: next action>",
    "<step 3: how to validate>",
    "<step 4: how to scale>"
  ],
  "risks": "<key risks in 1-2 sentences>",
  "estimatedMargin": "<e.g. 40-60%>",
  "suggestedRetailPrice": "<e.g. $89-$149>",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tags": ["tag1", "tag2", "tag3"]
}

Be specific, practical, and honest. Base scores on real market dynamics for ${niche} products in 2025-2026.`;

  try {
    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
    const content = await aiService.callAI(messages, {
      temperature: 0.3,
      preferJson: true,
    });
    return JSON.parse(content);
  } catch (err) {
    console.error('AI analysis failed:', err);
    // Return default scores if AI fails
    return {
      opportunityScore: 65,
      trendScore: 60,
      marginScore: 55,
      competitionScore: 50,
      demandScore: 60,
      headline: `${product.name} — Sourcing opportunity in ${niche}`,
      whyNow: 'This product shows potential in the current market.',
      targetAudience: 'Home decor enthusiasts and interior design shoppers.',
      suggestedPlatforms: ['shopify', 'etsy'],
      actionSteps: [
        'Request a sample to verify quality',
        'Research competitor pricing on Amazon and Etsy',
        'Set up a test listing with 5-10 units',
        'Run targeted social media ads to validate demand',
      ],
      risks: 'Shipping costs may impact margins. Verify quality before scaling.',
      estimatedMargin: '35-50%',
      suggestedRetailPrice: 'TBD based on product',
      keywords: [product.name, niche, 'home decor', 'furniture'],
      tags: [niche, product.category || 'furniture'],
    };
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const opportunityRadarRouter = router({

  // ── Get radar feed (main endpoint) ──────────────────────────────────────────
  getFeed: protectedProcedure
    .input(z.object({
      niche:              z.string().default('furniture'),
      priceMin:           z.number().optional(),
      priceMax:           z.number().optional(),
      minScore:           z.number().min(0).max(100).default(0),
      platforms:          z.array(z.string()).optional(),
      styles:             z.array(z.string()).optional(),
      materials:          z.array(z.string()).optional(),
      maxMoq:             z.number().optional(),
      showNewOnly:        z.boolean().default(false),
      sortBy:             z.enum(['opportunity_score', 'margin', 'trend', 'newest']).default('opportunity_score'),
      page:               z.number().min(1).default(1),
      pageSize:           z.number().min(1).max(50).default(12),
    }))
    .query(async ({ input, ctx }) => {
      const pool = await getDb();

      // Build WHERE clauses
      const conditions: string[] = [
        'poa.isActive = 1',
        'poa.niche = ?',
        'poa.opportunityScore >= ?',
        'p.status = "active"',
      ];
      const params: any[] = [input.niche, input.minScore];

      if (input.priceMin !== undefined) {
        conditions.push('pd.priceMin >= ?');
        params.push(input.priceMin);
      }
      if (input.priceMax !== undefined) {
        conditions.push('(pd.priceMax <= ? OR pd.priceMax IS NULL)');
        params.push(input.priceMax);
      }
      if (input.maxMoq !== undefined) {
        conditions.push('(pd.moq <= ? OR pd.moq IS NULL)');
        params.push(input.maxMoq);
      }
      if (input.showNewOnly) {
        // Get latest batch ID
        const [batches] = await pool.execute(
          'SELECT id FROM radar_batches WHERE niche = ? AND isPublished = 1 ORDER BY publishedAt DESC LIMIT 1',
          [input.niche]
        ) as any[];
        if (batches.length > 0) {
          conditions.push('poa.batchId = ?');
          params.push(batches[0].id);
        }
      }

      // Sort order
      const sortMap: Record<string, string> = {
        opportunity_score: 'poa.opportunityScore DESC',
        margin: 'poa.marginScore DESC',
        trend: 'poa.trendScore DESC',
        newest: 'poa.createdAt DESC',
      };
      const orderBy = sortMap[input.sortBy] || 'poa.opportunityScore DESC';

      const offset = (input.page - 1) * input.pageSize;
      const whereClause = conditions.join(' AND ');

      // Main query — use pool.query (not execute) because SQL contains dynamic fragments
      const mainSql = `
        SELECT
          p.id, p.name, p.category, p.description, p.coverImage, p.images, p.slug,
          pd.priceMin, pd.priceMax, pd.currency, pd.moq, pd.material, pd.features,
          pd.leadTimeDays, pd.rating, pd.reviewCount,
          f.id as factoryId, f.name as factoryName, f.logo as factoryLogo,
          f.country as factoryCountry, f.overallScore as factoryScore,
          f.certificationStatus, f.slug as factorySlug,
          poa.opportunityScore, poa.trendScore, poa.marginScore,
          poa.competitionScore, poa.demandScore,
          poa.headline, poa.whyNow, poa.targetAudience,
          poa.suggestedPlatforms, poa.actionSteps, poa.risks,
          poa.estimatedMargin, poa.suggestedRetailPrice,
          poa.keywords, poa.tags, poa.batchId, poa.createdAt as analysisDate,
          (SELECT action FROM user_radar_interactions
           WHERE userId = ? AND productId = p.id
           ORDER BY createdAt DESC LIMIT 1) as userAction
        FROM product_opportunity_analysis poa
        JOIN products p ON p.id = poa.productId
        LEFT JOIN product_details pd ON pd.productId = p.id
        LEFT JOIN factories f ON f.id = p.factoryId
        WHERE ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;
      const [rows] = await pool.query(mainSql, [ctx.user.id, ...params, input.pageSize, offset]) as any[];

      // Count total
      const countSql = `
        SELECT COUNT(*) as total
        FROM product_opportunity_analysis poa
        JOIN products p ON p.id = poa.productId
        LEFT JOIN product_details pd ON pd.productId = p.id
        WHERE ${whereClause}
      `;
      const [countRows] = await pool.query(countSql, params) as any[];

      const total = (countRows as any[])[0]?.total || 0;

      // Get latest batch info
      const [batchRows] = await pool.execute(
        'SELECT * FROM radar_batches WHERE niche = ? AND isPublished = 1 ORDER BY publishedAt DESC LIMIT 1',
        [input.niche]
      ) as any[];
      const latestBatch = (batchRows as any[])[0] || null;

      // Parse JSON fields
      const items = (rows as any[]).map(row => ({
        ...row,
        images: safeJson(row.images, []),
        suggestedPlatforms: safeJson(row.suggestedPlatforms, []),
        actionSteps: safeJson(row.actionSteps, []),
        keywords: safeJson(row.keywords, []),
        tags: safeJson(row.tags, []),
      }));

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
        latestBatch,
      };
    }),

  // ── Get user radar preferences ───────────────────────────────────────────────
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const pool = await getDb();
    const [rows] = await pool.execute(
      'SELECT * FROM user_radar_preferences WHERE userId = ? LIMIT 1',
      [ctx.user.id]
    ) as any[];
    const prefs = (rows as any[])[0];
    if (!prefs) return null;
    return {
      ...prefs,
      targetPlatforms: safeJson(prefs.targetPlatforms, []),
      preferredStyles: safeJson(prefs.preferredStyles, []),
      preferredMaterials: safeJson(prefs.preferredMaterials, []),
    };
  }),

  // ── Save user radar preferences ──────────────────────────────────────────────
  savePreferences: protectedProcedure
    .input(z.object({
      priceRangeMin:        z.number().optional().nullable(),
      priceRangeMax:        z.number().optional().nullable(),
      minOpportunityScore:  z.number().min(0).max(100).default(60),
      targetPlatforms:      z.array(z.string()).default([]),
      preferredStyles:      z.array(z.string()).default([]),
      preferredMaterials:   z.array(z.string()).default([]),
      maxMoq:               z.number().optional().nullable(),
      maxLeadTimeDays:      z.number().optional().nullable(),
      showNewOnly:          z.boolean().default(false),
      sortBy:               z.string().default('opportunity_score'),
      notifyOnNewBatch:     z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      const pool = await getDb();
      await pool.execute(`
        INSERT INTO user_radar_preferences
          (userId, priceRangeMin, priceRangeMax, minOpportunityScore,
           targetPlatforms, preferredStyles, preferredMaterials,
           maxMoq, maxLeadTimeDays, showNewOnly, sortBy, notifyOnNewBatch,
           createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))
        ON DUPLICATE KEY UPDATE
          priceRangeMin = VALUES(priceRangeMin),
          priceRangeMax = VALUES(priceRangeMax),
          minOpportunityScore = VALUES(minOpportunityScore),
          targetPlatforms = VALUES(targetPlatforms),
          preferredStyles = VALUES(preferredStyles),
          preferredMaterials = VALUES(preferredMaterials),
          maxMoq = VALUES(maxMoq),
          maxLeadTimeDays = VALUES(maxLeadTimeDays),
          showNewOnly = VALUES(showNewOnly),
          sortBy = VALUES(sortBy),
          notifyOnNewBatch = VALUES(notifyOnNewBatch),
          updatedAt = NOW(3)
      `, [
        ctx.user.id,
        input.priceRangeMin ?? null,
        input.priceRangeMax ?? null,
        input.minOpportunityScore,
        JSON.stringify(input.targetPlatforms),
        JSON.stringify(input.preferredStyles),
        JSON.stringify(input.preferredMaterials),
        input.maxMoq ?? null,
        input.maxLeadTimeDays ?? null,
        input.showNewOnly ? 1 : 0,
        input.sortBy,
        input.notifyOnNewBatch ? 1 : 0,
      ]);
      return { success: true };
    }),

  // ── Record user interaction with an opportunity ──────────────────────────────
  recordInteraction: protectedProcedure
    .input(z.object({
      productId: z.number().int().positive(),
      action:    z.enum(['viewed', 'saved', 'dismissed', 'inquired']),
    }))
    .mutation(async ({ input, ctx }) => {
      const pool = await getDb();
      await pool.execute(
        'INSERT INTO user_radar_interactions (userId, productId, action, createdAt) VALUES (?, ?, ?, NOW(3))',
        [ctx.user.id, input.productId, input.action]
      );
      return { success: true };
    }),

  // ── Trigger AI analysis for a product (admin/batch use) ─────────────────────
  analyzeProduct: protectedProcedure
    .input(z.object({
      productId: z.number().int().positive(),
      niche:     z.string().default('furniture'),
      batchId:   z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const pool = await getDb();

      // Fetch product + factory data
      const [productRows] = await pool.execute(`
        SELECT p.*, pd.priceMin, pd.priceMax, pd.moq, pd.material, pd.features, pd.leadTimeDays,
               f.name as factoryName, f.country as factoryCountry,
               f.overallScore as factoryScore, f.certificationStatus
        FROM products p
        LEFT JOIN product_details pd ON pd.productId = p.id
        LEFT JOIN factories f ON f.id = p.factoryId
        WHERE p.id = ?
      `, [input.productId]) as any[];

      const product = (productRows as any[])[0];
      if (!product) throw new TRPCError({ code: 'NOT_FOUND', message: 'Product not found' });

      // Generate AI analysis
      const analysis = await generateOpportunityAnalysis(product, {
        name: product.factoryName,
        country: product.factoryCountry,
        overallScore: product.factoryScore,
        certificationStatus: product.certificationStatus,
      }, input.niche);

      // Save to DB
      await pool.execute(`
        INSERT INTO product_opportunity_analysis
          (productId, niche, opportunityScore, trendScore, marginScore, competitionScore, demandScore,
           headline, whyNow, targetAudience, suggestedPlatforms, actionSteps, risks,
           estimatedMargin, suggestedRetailPrice, keywords, tags, batchId, isActive, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(3), NOW(3))
        ON DUPLICATE KEY UPDATE
          opportunityScore = VALUES(opportunityScore),
          trendScore = VALUES(trendScore),
          marginScore = VALUES(marginScore),
          competitionScore = VALUES(competitionScore),
          demandScore = VALUES(demandScore),
          headline = VALUES(headline),
          whyNow = VALUES(whyNow),
          targetAudience = VALUES(targetAudience),
          suggestedPlatforms = VALUES(suggestedPlatforms),
          actionSteps = VALUES(actionSteps),
          risks = VALUES(risks),
          estimatedMargin = VALUES(estimatedMargin),
          suggestedRetailPrice = VALUES(suggestedRetailPrice),
          keywords = VALUES(keywords),
          tags = VALUES(tags),
          batchId = VALUES(batchId),
          analysisVersion = analysisVersion + 1,
          updatedAt = NOW(3)
      `, [
        input.productId, input.niche,
        analysis.opportunityScore, analysis.trendScore, analysis.marginScore,
        analysis.competitionScore, analysis.demandScore,
        analysis.headline, analysis.whyNow, analysis.targetAudience,
        JSON.stringify(analysis.suggestedPlatforms),
        JSON.stringify(analysis.actionSteps),
        analysis.risks, analysis.estimatedMargin, analysis.suggestedRetailPrice,
        JSON.stringify(analysis.keywords),
        JSON.stringify(analysis.tags),
        input.batchId || null,
      ]);

      return { success: true, analysis };
    }),

  // ── Batch analyze all active products ────────────────────────────────────────
  analyzeBatch: protectedProcedure
    .input(z.object({
      niche:   z.string().default('furniture'),
      batchId: z.string(),
      limit:   z.number().min(1).max(100).default(20),
    }))
    .mutation(async ({ input }) => {
      const pool = await getDb();

      // Get products without analysis or with outdated analysis
      const [productRows] = await pool.execute(`
        SELECT p.id FROM products p
        LEFT JOIN product_opportunity_analysis poa ON poa.productId = p.id AND poa.niche = ?
        WHERE p.status = 'active'
          AND (poa.id IS NULL OR poa.batchId != ?)
        LIMIT ?
      `, [input.niche, input.batchId, input.limit]) as any[];

      const products = productRows as any[];
      let analyzed = 0;
      let failed = 0;

      for (const { id } of products) {
        try {
          // Fetch full product data
          const [rows] = await pool.execute(`
            SELECT p.*, pd.priceMin, pd.priceMax, pd.moq, pd.material, pd.features, pd.leadTimeDays,
                   f.name as factoryName, f.country as factoryCountry,
                   f.overallScore as factoryScore, f.certificationStatus
            FROM products p
            LEFT JOIN product_details pd ON pd.productId = p.id
            LEFT JOIN factories f ON f.id = p.factoryId
            WHERE p.id = ?
          `, [id]) as any[];

          const product = (rows as any[])[0];
          if (!product) continue;

          const analysis = await generateOpportunityAnalysis(product, {
            name: product.factoryName,
            country: product.factoryCountry,
            overallScore: product.factoryScore,
            certificationStatus: product.certificationStatus,
          }, input.niche);

          await pool.execute(`
            INSERT INTO product_opportunity_analysis
              (productId, niche, opportunityScore, trendScore, marginScore, competitionScore, demandScore,
               headline, whyNow, targetAudience, suggestedPlatforms, actionSteps, risks,
               estimatedMargin, suggestedRetailPrice, keywords, tags, batchId, isActive, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(3), NOW(3))
            ON DUPLICATE KEY UPDATE
              opportunityScore = VALUES(opportunityScore), trendScore = VALUES(trendScore),
              marginScore = VALUES(marginScore), competitionScore = VALUES(competitionScore),
              demandScore = VALUES(demandScore), headline = VALUES(headline),
              whyNow = VALUES(whyNow), targetAudience = VALUES(targetAudience),
              suggestedPlatforms = VALUES(suggestedPlatforms), actionSteps = VALUES(actionSteps),
              risks = VALUES(risks), estimatedMargin = VALUES(estimatedMargin),
              suggestedRetailPrice = VALUES(suggestedRetailPrice),
              keywords = VALUES(keywords), tags = VALUES(tags),
              batchId = VALUES(batchId), analysisVersion = analysisVersion + 1, updatedAt = NOW(3)
          `, [
            id, input.niche,
            analysis.opportunityScore, analysis.trendScore, analysis.marginScore,
            analysis.competitionScore, analysis.demandScore,
            analysis.headline, analysis.whyNow, analysis.targetAudience,
            JSON.stringify(analysis.suggestedPlatforms), JSON.stringify(analysis.actionSteps),
            analysis.risks, analysis.estimatedMargin, analysis.suggestedRetailPrice,
            JSON.stringify(analysis.keywords), JSON.stringify(analysis.tags),
            input.batchId,
          ]);
          analyzed++;
        } catch (err) {
          console.error(`Failed to analyze product ${id}:`, err);
          failed++;
        }
      }

      // Update/create batch record
      await pool.execute(`
        INSERT INTO radar_batches (id, niche, productCount, isPublished, publishedAt, createdAt)
        VALUES (?, ?, ?, 1, NOW(3), NOW(3))
        ON DUPLICATE KEY UPDATE productCount = productCount + ?, updatedAt = NOW(3)
      `, [input.batchId, input.niche, analyzed, analyzed]);

      return { success: true, analyzed, failed, total: products.length };
    }),

  // ── Get latest batch info ────────────────────────────────────────────────────
  getLatestBatch: protectedProcedure
    .input(z.object({ niche: z.string().default('furniture') }))
    .query(async ({ ctx, input }) => {
      const pool = await getDb();
      const [batchRows] = await pool.execute(
        'SELECT * FROM radar_batches WHERE niche = ? AND isPublished = 1 ORDER BY publishedAt DESC LIMIT 1',
        [input.niche]
      ) as any[];
      const batch = (batchRows as any[])[0] || null;

      // Check if user has seen this batch
      let hasNewOpportunities = false;
      if (batch) {
        const [prefRows] = await pool.execute(
          'SELECT lastSeenBatchId FROM user_radar_preferences WHERE userId = ?',
          [ctx.user.id]
        ) as any[];
        const lastSeen = (prefRows as any[])[0]?.lastSeenBatchId;
        hasNewOpportunities = lastSeen !== batch.id;
      }

      // Count new opportunities for user
      const [countRows] = await pool.execute(`
        SELECT COUNT(*) as count FROM product_opportunity_analysis poa
        JOIN products p ON p.id = poa.productId
        WHERE poa.niche = ? AND poa.isActive = 1 AND p.status = 'active'
          AND poa.batchId = ?
      `, [input.niche, batch?.id || '']) as any[];

      return {
        batch,
        hasNewOpportunities,
        newCount: (countRows as any[])[0]?.count || 0,
      };
    }),

  // ── Mark batch as seen ───────────────────────────────────────────────────────
  markBatchSeen: protectedProcedure
    .input(z.object({ batchId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const pool = await getDb();
      await pool.execute(`
        INSERT INTO user_radar_preferences (userId, lastSeenBatchId, createdAt, updatedAt)
        VALUES (?, ?, NOW(3), NOW(3))
        ON DUPLICATE KEY UPDATE lastSeenBatchId = VALUES(lastSeenBatchId), updatedAt = NOW(3)
      `, [ctx.user.id, input.batchId]);
      return { success: true };
    }),

  // ── Get top opportunities for Coach to recommend ─────────────────────────────
  getTopForCoach: protectedProcedure
    .input(z.object({
      niche:  z.string().default('furniture'),
      limit:  z.number().min(1).max(5).default(3),
    }))
    .query(async ({ ctx, input }) => {
      const pool = await getDb();

      // Get user preferences to personalize
      const [prefRows] = await pool.execute(
        'SELECT * FROM user_radar_preferences WHERE userId = ?',
        [ctx.user.id]
      ) as any[];
      const prefs = (prefRows as any[])[0];

      const minScore = prefs?.minOpportunityScore || 60;
      const priceMax = prefs?.priceRangeMax || null;

      let query = `
        SELECT p.id, p.name, p.coverImage, p.category,
               pd.priceMin, pd.priceMax, pd.moq,
               f.name as factoryName, f.country as factoryCountry,
               poa.opportunityScore, poa.headline, poa.whyNow,
               poa.estimatedMargin, poa.suggestedRetailPrice,
               poa.actionSteps, poa.tags, poa.batchId
        FROM product_opportunity_analysis poa
        JOIN products p ON p.id = poa.productId
        LEFT JOIN product_details pd ON pd.productId = p.id
        LEFT JOIN factories f ON f.id = p.factoryId
        WHERE poa.niche = ? AND poa.isActive = 1 AND p.status = 'active'
          AND poa.opportunityScore >= ?
          AND p.id NOT IN (
            SELECT productId FROM user_radar_interactions
            WHERE userId = ? AND action = 'dismissed'
          )
      `;
      const params: any[] = [input.niche, minScore, ctx.user.id];

      if (priceMax) {
        query += ' AND (pd.priceMax <= ? OR pd.priceMax IS NULL)';
        params.push(priceMax);
      }

      query += ' ORDER BY poa.opportunityScore DESC LIMIT ?';
      params.push(input.limit);

      const [rows] = await pool.execute(query, params) as any[];

      return (rows as any[]).map(row => ({
        ...row,
        actionSteps: safeJson(row.actionSteps, []),
        tags: safeJson(row.tags, []),
      }));
    }),
});
