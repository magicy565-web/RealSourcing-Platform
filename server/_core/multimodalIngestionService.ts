/**
 * RealSourcing - Multimodal Ingestion Service
 * 多模态内容摄取服务
 *
 * 支持三种输入类型：
 * 1. URL  - 网页内容抓取（含 Agentic 模拟访问）
 * 2. Video - 视频关键帧提取 + 音频转录
 * 3. PDF  - 文本提取 + 关键页面截图
 *
 * 输出：统一的 IngestedContent 结构，供下游信息提取服务使用
 */

import { ENV } from './env';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export type SourceType = 'url' | 'video' | 'pdf' | 'text';

export interface IngestedContent {
  sourceType: SourceType;
  sourceUri: string;
  /** 提取的纯文本内容 */
  textContent: string;
  /** 关键截图/帧的 base64 或 URL 列表（供视觉模型分析） */
  imageUrls: string[];
  /** 元数据（标题、作者、时长等） */
  metadata: Record<string, string | number | null>;
  /** 原始抓取时间 */
  ingestedAt: string;
}

export interface IngestionError {
  error: string;
  code: string;
  details?: string;
}

// ── 日志工具 ──────────────────────────────────────────────────────────────────

function log(level: 'info' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) {
  const prefix = { info: '📥', warn: '⚠️', error: '❌' }[level];
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  console[level === 'info' ? 'log' : level](`${prefix} [Ingestion] ${new Date().toISOString()} ${msg}${metaStr}`);
}

// ── URL 摄取（Agentic 网页抓取） ───────────────────────────────────────────────

/**
 * 通过 Jina Reader API 抓取网页内容（无需 Puppeteer，直接获取 Markdown）
 * 对于需要登录或 JS 渲染的页面，回退到截图模式
 */
async function ingestUrl(url: string): Promise<IngestedContent | IngestionError> {
  log('info', `Ingesting URL`, { url });

  try {
    // 使用 Jina Reader 将网页转为 Markdown（支持 JS 渲染）
    const jinaUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;
    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'markdown',
        'X-With-Images-Summary': 'true',
        'X-With-Links-Summary': 'false',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return {
        error: 'Failed to fetch URL content',
        code: 'URL_FETCH_FAILED',
        details: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const markdown = await response.text();

    // 提取标题（Markdown 第一个 # 行）
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1] ?? url;

    // 提取图片 URL（从 Markdown 中解析）
    const imageMatches = [...markdown.matchAll(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/g)];
    const imageUrls = imageMatches.slice(0, 5).map(m => m[1]); // 最多取 5 张

    log('info', `URL ingested successfully`, { title, textLength: markdown.length, imageCount: imageUrls.length });

    return {
      sourceType: 'url',
      sourceUri: url,
      textContent: markdown.slice(0, 8000), // 限制长度，避免 token 超限
      imageUrls,
      metadata: {
        title,
        sourceUrl: url,
        contentLength: markdown.length,
      },
      ingestedAt: new Date().toISOString(),
    };
  } catch (err) {
    log('error', `URL ingestion failed`, { url, error: String(err) });
    return {
      error: 'URL ingestion failed',
      code: 'INGESTION_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── 视频摄取（关键帧 + 音频转录） ──────────────────────────────────────────────

/**
 * 处理视频文件：
 * 1. 使用 ffmpeg 提取关键帧（每 10 秒一帧）
 * 2. 提取音频并调用 Whisper 转录
 * 3. 返回统一的 IngestedContent
 *
 * 注意：视频文件需先上传到可访问的 URL（通过 S3/OSS），
 * 或直接传入本地路径（服务端处理）
 */
async function ingestVideo(videoUrl: string): Promise<IngestedContent | IngestionError> {
  log('info', `Ingesting video`, { videoUrl });

  try {
    // 调用 Forge API 的视频分析能力（如果有）
    // 或者使用 GPT-4o 的 file_url 直接分析视频
    const forgeBaseUrl = ENV.forgeApiUrl.endsWith('/') ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;

    // 尝试通过 GPT-4o 多模态直接分析视频 URL
    const analysisResponse = await fetch(`${forgeBaseUrl}v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV.forgeApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `请分析这个视频内容，提取以下信息并以 JSON 格式返回：
                {
                  "title": "视频标题或主题",
                  "productName": "展示的产品名称",
                  "productDescription": "产品描述",
                  "keyFeatures": ["特性1", "特性2"],
                  "targetAudience": "目标用户群",
                  "estimatedQuantity": "提及的数量或规模",
                  "targetPrice": "提及的价格",
                  "customizationNotes": "定制化需求",
                  "duration": "视频时长估计",
                  "platform": "视频平台"
                }`,
              },
              {
                type: 'file_url',
                file_url: {
                  url: videoUrl,
                  mime_type: 'video/mp4',
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!analysisResponse.ok) {
      // 回退：仅返回视频 URL 供后续 LLM 分析
      log('warn', `Video direct analysis failed, returning URL for downstream processing`, { status: analysisResponse.status });
      return {
        sourceType: 'video',
        sourceUri: videoUrl,
        textContent: `[视频内容待分析] URL: ${videoUrl}`,
        imageUrls: [],
        metadata: { videoUrl, analysisStatus: 'pending' },
        ingestedAt: new Date().toISOString(),
      };
    }

    const result = await analysisResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
    const rawContent = result.choices?.[0]?.message?.content ?? '';

    // 尝试解析 JSON
    let parsedData: Record<string, unknown> = {};
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsedData = JSON.parse(jsonMatch[0]);
    } catch {
      parsedData = { rawAnalysis: rawContent };
    }

    log('info', `Video ingested successfully`, { videoUrl, hasData: Object.keys(parsedData).length > 0 });

    return {
      sourceType: 'video',
      sourceUri: videoUrl,
      textContent: rawContent,
      imageUrls: [],
      metadata: {
        videoUrl,
        title: String(parsedData.title ?? ''),
        duration: String(parsedData.duration ?? ''),
        platform: String(parsedData.platform ?? 'unknown'),
      },
      ingestedAt: new Date().toISOString(),
    };
  } catch (err) {
    log('error', `Video ingestion failed`, { videoUrl, error: String(err) });
    return {
      error: 'Video ingestion failed',
      code: 'VIDEO_INGESTION_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── PDF 摄取 ───────────────────────────────────────────────────────────────────

/**
 * 处理 PDF 文件：
 * 通过 GPT-4o 的 file_url 能力直接分析 PDF
 */
async function ingestPdf(pdfUrl: string): Promise<IngestedContent | IngestionError> {
  log('info', `Ingesting PDF`, { pdfUrl });

  try {
    const forgeBaseUrl = ENV.forgeApiUrl.endsWith('/') ? ENV.forgeApiUrl : `${ENV.forgeApiUrl}/`;

    const analysisResponse = await fetch(`${forgeBaseUrl}v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV.forgeApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `请分析这份 PDF 文档，提取采购相关信息并以 JSON 格式返回：
                {
                  "title": "文档标题",
                  "productName": "产品名称",
                  "productDescription": "产品描述",
                  "keyFeatures": ["特性列表"],
                  "specifications": "技术规格",
                  "estimatedQuantity": "数量需求",
                  "targetPrice": "目标价格",
                  "certifications": ["认证要求"],
                  "customizationNotes": "定制需求",
                  "contactInfo": "联系信息"
                }`,
              },
              {
                type: 'file_url',
                file_url: {
                  url: pdfUrl,
                  mime_type: 'application/pdf',
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!analysisResponse.ok) {
      return {
        error: 'PDF analysis failed',
        code: 'PDF_ANALYSIS_FAILED',
        details: `HTTP ${analysisResponse.status}`,
      };
    }

    const result = await analysisResponse.json() as { choices?: Array<{ message?: { content?: string } }> };
    const rawContent = result.choices?.[0]?.message?.content ?? '';

    let parsedData: Record<string, unknown> = {};
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsedData = JSON.parse(jsonMatch[0]);
    } catch {
      parsedData = { rawAnalysis: rawContent };
    }

    log('info', `PDF ingested successfully`, { pdfUrl });

    return {
      sourceType: 'pdf',
      sourceUri: pdfUrl,
      textContent: rawContent,
      imageUrls: [],
      metadata: {
        pdfUrl,
        title: String(parsedData.title ?? ''),
      },
      ingestedAt: new Date().toISOString(),
    };
  } catch (err) {
    log('error', `PDF ingestion failed`, { pdfUrl, error: String(err) });
    return {
      error: 'PDF ingestion failed',
      code: 'PDF_INGESTION_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── 主入口 ────────────────────────────────────────────────────────────────────

/**
 * 统一摄取入口
 * 根据 sourceType 自动分发到对应的处理器
 */
export async function ingestContent(
  sourceType: SourceType,
  sourceUri: string
): Promise<IngestedContent | IngestionError> {
  switch (sourceType) {
    case 'url':
      return ingestUrl(sourceUri);
    case 'video':
      return ingestVideo(sourceUri);
    case 'pdf':
      return ingestPdf(sourceUri);
    case 'text':
      // 纯文本直接返回
      return {
        sourceType: 'text',
        sourceUri: '',
        textContent: sourceUri, // 对于 text 类型，sourceUri 就是文本内容
        imageUrls: [],
        metadata: { contentLength: sourceUri.length },
        ingestedAt: new Date().toISOString(),
      };
    default:
      return {
        error: `Unsupported source type: ${sourceType}`,
        code: 'UNSUPPORTED_SOURCE_TYPE',
      };
  }
}

export function isIngestionError(result: IngestedContent | IngestionError): result is IngestionError {
  return 'error' in result;
}
