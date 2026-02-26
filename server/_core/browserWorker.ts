/**
 * RealSourcing - Browser Worker
 * 云端 AI 浏览器 Worker
 *
 * 职责：
 * 1. 接收任务队列中的需求处理任务
 * 2. 使用 Playwright 模拟真实用户浏览器访问目标 URL
 * 3. 对 TikTok 等特殊平台使用专用 API 提取元数据
 * 4. 截图 + 文本提取后交给 GPT-4o Vision 分析
 * 5. 将结构化结果回写数据库
 *
 * 设计原则：
 * - 用户完全无感：提交后立即返回，结果异步回写
 * - 多层次降级：专用 API → Playwright 截图 → 纯文本提取
 * - 完整错误处理：任何步骤失败都会记录到数据库
 */

import { chromium, type Browser, type Page } from 'playwright-core';
import { ENV } from './env';
import { updateSourcingDemand, upsertManufacturingParameters } from '../db';
import { registerTaskHandler, type DemandTask } from './taskQueue';
import { transformToManufacturingParams, isTransformationError } from './manufacturingParamsService';
import { generateEmbedding, buildEmbeddingText, isEmbeddingError } from './vectorSearchService';
import { ossUploadFromUrl } from './ossStorageService';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

interface ExtractedContent {
  title: string;
  description: string;
  keyFeatures: string[];
  targetAudience: string;
  visualReferences: string[];
  estimatedQuantity: string;
  targetPrice: string;
  customizationNotes: string;
  productCategory: string;
  platform: string;
  /** 原始平台数据（播放量、点赞等） */
  platformStats?: Record<string, number | string>;
  extractedData: Record<string, unknown>;
}

// ── 日志工具 ──────────────────────────────────────────────────────────────────

function log(level: 'info' | 'warn' | 'error', demandId: number, msg: string, meta?: Record<string, unknown>) {
  const prefix = { info: '🤖', warn: '⚠️', error: '❌' }[level];
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  console[level === 'info' ? 'log' : level](
    `${prefix} [BrowserWorker] #${demandId} ${new Date().toISOString()} ${msg}${metaStr}`
  );
}

// ── Playwright 浏览器管理 ─────────────────────────────────────────────────────

let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser;

  log('info', 0, 'Launching Playwright browser...');
  _browser = await chromium.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled', // 隐藏自动化特征
      '--disable-infobars',
      '--window-size=1920,1080',
    ],
    headless: true,
  });

  _browser.on('disconnected', () => {
    log('warn', 0, 'Browser disconnected, will relaunch on next task');
    _browser = null;
  });

  log('info', 0, 'Browser launched successfully');
  return _browser;
}

async function createStealthPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    // 模拟真实用户的 HTTP 头
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  });

  const page = await context.newPage();

  // 注入反检测脚本
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    (window as unknown as Record<string, unknown>).chrome = { runtime: {} };
  });

  return page;
}

// ── TikTok 专用提取器 ─────────────────────────────────────────────────────────

interface TikWmResponse {
  code: number;
  msg: string;
  data?: {
    id: string;
    title: string;
    cover: string;
    origin_cover: string;
    duration: number;
    play: string;
    play_count: number;
    digg_count: number;
    comment_count: number;
    share_count: number;
    author: {
      nickname: string;
      unique_id: string;
      avatar: string;
    };
    hashtags?: Array<{ name: string }>;
  };
}

async function extractTikTok(url: string, demandId: number): Promise<{
  content: string;
  imageUrls: string[];
  stats: Record<string, number | string>;
} | null> {
  log('info', demandId, 'Trying TikTok extraction via tikwm API', { url });

  try {
    // 方案 1：tikwm API（非官方，返回完整元数据）
    const formData = new URLSearchParams({ url, hd: '1' });
    const res = await fetch('https://www.tikwm.com/api/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const json = await res.json() as TikWmResponse;
      if (json.code === 0 && json.data) {
        const d = json.data;
        const hashtags = (d.hashtags ?? []).map((h) => `#${h.name}`).join(' ');
        const content = `
TikTok 视频内容分析：
标题/描述：${d.title}
作者：${d.author?.nickname} (@${d.author?.unique_id})
标签：${hashtags}
视频时长：${d.duration} 秒
播放量：${d.play_count?.toLocaleString()}
点赞数：${d.digg_count?.toLocaleString()}
评论数：${d.comment_count?.toLocaleString()}
分享数：${d.share_count?.toLocaleString()}
        `.trim();

        const imageUrls = [d.origin_cover, d.cover].filter(Boolean);

        log('info', demandId, 'TikTok extracted via tikwm', {
          title: d.title.slice(0, 50),
          plays: d.play_count,
        });

        return {
          content,
          imageUrls,
          stats: {
            play_count: d.play_count,
            digg_count: d.digg_count,
            comment_count: d.comment_count,
            share_count: d.share_count,
            duration: d.duration,
          },
        };
      }
    }
  } catch (err) {
    log('warn', demandId, 'tikwm API failed, trying oEmbed fallback', { error: String(err) });
  }

  // 方案 2：TikTok 官方 oEmbed（免费，无需 key）
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(10000) });

    if (res.ok) {
      const json = await res.json() as {
        title?: string;
        author_name?: string;
        thumbnail_url?: string;
        html?: string;
      };

      if (json.title) {
        // 从 HTML embed 中提取描述文字
        const descMatch = json.html?.match(/<p>(.*?)<\/p>/s);
        const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : json.title;

        const content = `
TikTok 视频内容（oEmbed）：
标题：${json.title}
作者：${json.author_name}
描述：${description}
        `.trim();

        log('info', demandId, 'TikTok extracted via oEmbed', { title: json.title.slice(0, 50) });

        return {
          content,
          imageUrls: json.thumbnail_url ? [json.thumbnail_url] : [],
          stats: {},
        };
      }
    }
  } catch (err) {
    log('warn', demandId, 'oEmbed fallback also failed', { error: String(err) });
  }

  return null;
}

// ── 通用 URL 提取器（Playwright） ─────────────────────────────────────────────

async function extractWithBrowser(url: string, demandId: number): Promise<{
  content: string;
  imageUrls: string[];
  screenshotBase64: string;
}> {
  log('info', demandId, 'Extracting with Playwright browser', { url });

  const browser = await getBrowser();
  const page = await createStealthPage(browser);

  try {
    // 导航到目标页面
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 等待内容加载
    await page.waitForTimeout(2000);

    // 截图（用于 GPT-4o Vision 分析）
    const screenshotBuffer = await page.screenshot({
      fullPage: false,
      type: 'jpeg',
      quality: 85,
    });
    const screenshotBase64 = screenshotBuffer.toString('base64');

    // 提取页面文本内容
    const textContent = await page.evaluate(() => {
      // 移除脚本和样式标签
      const scripts = document.querySelectorAll('script, style, nav, footer, header');
      scripts.forEach((el) => el.remove());

      // 获取主要内容
      const main = document.querySelector('main, article, [role="main"]');
      const body = main ?? document.body;

      return body.innerText
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 5000); // 限制长度
    });

    // 提取页面中的产品图片
    const imageUrls = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img[src]'));
      return imgs
        .map((img) => (img as HTMLImageElement).src)
        .filter((src) => src.startsWith('http') && !src.includes('icon') && !src.includes('logo'))
        .slice(0, 5);
    });

    // 获取页面标题和 meta 描述
    const title = await page.title();
    const metaDescription = await page.$eval(
      'meta[name="description"]',
      (el) => el.getAttribute('content') ?? ''
    ).catch(() => '');

    const content = `
页面标题：${title}
页面描述：${metaDescription}
页面内容：${textContent}
    `.trim();

    log('info', demandId, 'Browser extraction complete', {
      contentLength: content.length,
      imageCount: imageUrls.length,
    });

    return { content, imageUrls, screenshotBase64 };
  } finally {
    await page.context().close().catch(() => {});
  }
}

// ── LLM 分析器 ────────────────────────────────────────────────────────────────

async function analyzeWithLLM(
  demandId: number,
  textContent: string,
  imageUrls: string[],
  screenshotBase64?: string
): Promise<ExtractedContent> {
  log('info', demandId, 'Analyzing with LLM', {
    hasImages: imageUrls.length > 0,
    hasScreenshot: !!screenshotBase64,
  });

  const baseUrl = (ENV.openaiBaseUrl || 'https://once.novai.su/v1').replace(/\/$/, '');

  // 构建多模态消息
  const userContent: Array<Record<string, unknown>> = [
    {
      type: 'text',
      text: `请从以下内容中提取采购需求信息，以严格的 JSON 格式返回：

${textContent}

返回格式：
{
  "productName": "产品名称",
  "productDescription": "详细产品描述（100-300字）",
  "keyFeatures": ["特性1", "特性2", "特性3"],
  "targetAudience": "目标用户群体",
  "visualReferences": [],
  "estimatedQuantity": "预估采购量",
  "targetPrice": "目标价格（如 '$2.5-3.0/件 FOB'）",
  "customizationNotes": "定制化需求",
  "productCategory": "产品类别",
  "urgencyLevel": "紧迫程度（high/medium/low）",
  "additionalNotes": "其他补充信息"
}`,
    },
  ];

  // 添加截图（如果有）
  if (screenshotBase64) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:image/jpeg;base64,${screenshotBase64}`, detail: 'high' },
    });
  }

  // 添加封面图（如果有）
  for (const imgUrl of imageUrls.slice(0, 2)) {
    userContent.push({
      type: 'image_url',
      image_url: { url: imgUrl, detail: 'high' },
    });
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ENV.openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的跨境贸易采购分析师。请从用户提供的内容（可能包含截图）中提取产品采购需求，以严格的 JSON 格式返回，不要包含任何 Markdown 代码块标记。',
        },
        { role: 'user', content: userContent },
      ],
      max_tokens: 2000,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const rawContent = result.choices?.[0]?.message?.content ?? '{}';

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    parsed = { productDescription: rawContent };
  }

  return {
    title: String(parsed.productName ?? ''),
    description: String(parsed.productDescription ?? ''),
    keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures as string[] : [],
    targetAudience: String(parsed.targetAudience ?? ''),
    visualReferences: imageUrls,
    estimatedQuantity: String(parsed.estimatedQuantity ?? ''),
    targetPrice: String(parsed.targetPrice ?? ''),
    customizationNotes: String(parsed.customizationNotes ?? ''),
    productCategory: String(parsed.productCategory ?? ''),
    platform: 'web',
    extractedData: parsed,
  };
}

// ── 核心任务处理函数 ──────────────────────────────────────────────────────────

async function processDemandTask(task: DemandTask): Promise<void> {
  const { demandId, sourceType, sourceUri } = task;

  log('info', demandId, `Processing task`, { sourceType, sourceUri: sourceUri.slice(0, 80) });

  try {
    // Step 1: 更新状态为 processing
    await updateSourcingDemand(demandId, { status: 'processing' });

    let textContent = '';
    let imageUrls: string[] = [];
    let screenshotBase64: string | undefined;
    let platformStats: Record<string, number | string> = {};

    // Step 2: 内容摄取（根据类型选择策略）
    if (sourceType === 'url' || sourceType === 'video') {
      const isTikTok = sourceUri.includes('tiktok.com') || sourceUri.includes('vm.tiktok.com');
      const isInstagram = sourceUri.includes('instagram.com');
      const isYouTube = sourceUri.includes('youtube.com') || sourceUri.includes('youtu.be');

      if (isTikTok) {
        // TikTok 专用提取器
        const tiktokResult = await extractTikTok(sourceUri, demandId);
        if (tiktokResult) {
          textContent = tiktokResult.content;
          imageUrls = tiktokResult.imageUrls;
          platformStats = tiktokResult.stats;
        } else {
          // 降级到 Playwright
          log('warn', demandId, 'TikTok API failed, falling back to Playwright');
          const browserResult = await extractWithBrowser(sourceUri, demandId);
          textContent = browserResult.content;
          imageUrls = browserResult.imageUrls;
          screenshotBase64 = browserResult.screenshotBase64;
        }
      } else if (isInstagram || isYouTube) {
        // 社交媒体：直接用 Playwright
        const browserResult = await extractWithBrowser(sourceUri, demandId);
        textContent = browserResult.content;
        imageUrls = browserResult.imageUrls;
        screenshotBase64 = browserResult.screenshotBase64;
      } else {
        // 普通网页：先尝试 Playwright，获取截图 + 文本
        const browserResult = await extractWithBrowser(sourceUri, demandId);
        textContent = browserResult.content;
        imageUrls = browserResult.imageUrls;
        screenshotBase64 = browserResult.screenshotBase64;
      }
    } else if (sourceType === 'pdf') {
      // PDF：直接传 URL 给 LLM 分析
      textContent = `[PDF 文档] URL: ${sourceUri}`;
    } else {
      // 纯文本
      textContent = sourceUri;
    }

    log('info', demandId, 'Content extracted', {
      textLength: textContent.length,
      imageCount: imageUrls.length,
      hasScreenshot: !!screenshotBase64,
    });

    // Step 3: LLM 分析
    const extracted = await analyzeWithLLM(demandId, textContent, imageUrls, screenshotBase64);

    // Step 4: 转存图片到 OSS
    const ossImageUrls: string[] = [];
    for (const imgUrl of extracted.visualReferences.slice(0, 5)) {
      if (imgUrl.startsWith('http')) {
        try {
          const ossResult = await ossUploadFromUrl(imgUrl, 'references');
          if (!('error' in ossResult)) ossImageUrls.push(ossResult.url);
        } catch {
          ossImageUrls.push(imgUrl); // 保留原始 URL
        }
      }
    }

    // Step 5: 更新需求记录（状态: extracted）
    await updateSourcingDemand(demandId, {
      status: 'extracted',
      productName: extracted.title,
      productDescription: extracted.description,
      keyFeatures: extracted.keyFeatures as unknown as never,
      targetAudience: extracted.targetAudience,
      visualReferences: (ossImageUrls.length > 0 ? ossImageUrls : extracted.visualReferences) as unknown as never,
      estimatedQuantity: extracted.estimatedQuantity,
      targetPrice: extracted.targetPrice,
      customizationNotes: extracted.customizationNotes,
      extractedData: {
        ...extracted.extractedData,
        platformStats,
        platform: extracted.platform,
        productCategory: extracted.productCategory,
      } as unknown as never,
    });

    log('info', demandId, 'Demand extracted', { productName: extracted.title });

    // Step 6: 转化为工厂生产参数
    const sourcingDemandForTransform = {
      productName: extracted.title,
      productDescription: extracted.description,
      keyFeatures: extracted.keyFeatures,
      targetAudience: extracted.targetAudience,
      visualReferences: ossImageUrls.length > 0 ? ossImageUrls : extracted.visualReferences,
      estimatedQuantity: extracted.estimatedQuantity,
      targetPrice: extracted.targetPrice,
      customizationNotes: extracted.customizationNotes,
      productCategory: extracted.productCategory ?? '',
      extractedData: extracted.extractedData,
    };

    const params = await transformToManufacturingParams(sourcingDemandForTransform);
    if (isTransformationError(params)) {
      log('warn', demandId, 'Manufacturing params transformation failed', { error: params.error });
      // 不致命，继续完成流程
    } else {
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

      log('info', demandId, 'Manufacturing params saved', {
        moq: params.moq,
        category: params.productionCategory,
      });
    }

    // Step 7: 更新状态为 transformed，同步写入 productionCategory（供匹配服务直接读取）
    await updateSourcingDemand(demandId, {
      status: 'transformed',
      productionCategory: (isTransformationError(params) ? undefined : params.productionCategory) ?? undefined,
    });

    // Step 8: 异步生成语义向量（不阻塞）
    setImmediate(async () => {
      try {
        const embText = buildEmbeddingText({
          productName: extracted.title,
          productDescription: extracted.description,
          keyFeatures: extracted.keyFeatures,
          productionCategory: extracted.productCategory,
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
          log('info', demandId, `Embedding generated (${embResult.model}, ${embResult.vector.length}d)`);
        }
      } catch (embErr) {
        log('warn', demandId, 'Background embedding failed', { error: String(embErr) });
      }
    });

    log('info', demandId, `✅ Task fully completed: "${extracted.title}"`);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log('error', demandId, 'Task failed', { error: errorMessage });
    await updateSourcingDemand(demandId, {
      status: 'failed',
      processingError: errorMessage,
    }).catch(() => {});
    throw err; // 重新抛出，让队列记录失败
  }
}

// ── 初始化：注册任务处理器 ─────────────────────────────────────────────────────

/**
 * 初始化 Browser Worker
 * 必须在服务器启动时调用一次
 */
export function initBrowserWorker(): void {
  registerTaskHandler(processDemandTask);
  console.log(`🚀 [BrowserWorker] Initialized and ready to process tasks`);
}

/**
 * 优雅关闭：关闭 Playwright 浏览器
 */
export async function shutdownBrowserWorker(): Promise<void> {
  if (_browser) {
    await _browser.close().catch(() => {});
    _browser = null;
    console.log(`🛑 [BrowserWorker] Browser closed`);
  }
}
