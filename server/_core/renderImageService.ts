/**
 * RealSourcing - Render Image Service
 * 产品渲染图生成服务
 *
 * 使用阿里云百炼 Stable Diffusion 3.5 Large Turbo 模型
 * 基于采购需求的产品描述、材料、颜色等参数生成产品渲染图
 *
 * 流程：
 * 1. 构建专业的英文 Prompt（基于产品参数）
 * 2. 异步提交 SD 3.5 Turbo 任务
 * 3. 轮询任务状态直到完成
 * 4. 下载生成图片并上传到 OSS（demand-os-discord bucket）
 * 5. 更新 manufacturing_parameters.renderImageUrl
 *
 * API 文档：阿里云百炼 DashScope - StableDiffusion 文生图
 * 端点：POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis
 */

import { ENV } from './env';
import { ossUploadFromUrl, isOSSError } from './ossStorageService';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface RenderImageInput {
  productName: string;
  productDescription: string;
  materials?: Array<{ name: string; specification?: string }>;
  colorRequirements?: Array<{ name: string; hex?: string }>;
  dimensions?: string;
  productionCategory?: string;
  customizationNotes?: string;
}

export interface RenderImageResult {
  ossUrl: string;
  originalUrl: string;
  taskId: string;
  prompt: string;
}

export interface RenderImageError {
  error: string;
  code: string;
  details?: string;
}

// ── DashScope API 类型 ─────────────────────────────────────────────────────────

interface DashScopeTaskResponse {
  request_id: string;
  output: {
    task_id: string;
    task_status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELED' | 'SUSPENDED';
    results?: Array<{ url: string }>;
    task_metrics?: { TOTAL: number; SUCCEEDED: number; FAILED: number };
  };
  code?: string;
  message?: string;
}

// ── Prompt 构建 ────────────────────────────────────────────────────────────────

/**
 * 将中文产品参数转化为专业的 SD 英文 Prompt
 * 遵循 SD 3.5 最佳实践：具体、简洁、不超过 75 词
 */
function buildSDPrompt(input: RenderImageInput): { prompt: string; negativePrompt: string } {
  const parts: string[] = [];

  // 产品核心描述（最重要）
  parts.push(`professional product photo of ${input.productName}`);

  // 材料
  if (input.materials && input.materials.length > 0) {
    const matNames = input.materials.slice(0, 3).map(m => m.name).join(', ');
    parts.push(`made of ${matNames}`);
  }

  // 颜色
  if (input.colorRequirements && input.colorRequirements.length > 0) {
    const colors = input.colorRequirements.slice(0, 2).map(c => c.name).join(' and ');
    parts.push(`in ${colors} color`);
  }

  // 产品类别风格
  if (input.productionCategory) {
    const cat = input.productionCategory.toLowerCase();
    if (cat.includes('电子') || cat.includes('electronic')) {
      parts.push('sleek modern design, tech product photography');
    } else if (cat.includes('家居') || cat.includes('home')) {
      parts.push('lifestyle home product photography, warm lighting');
    } else if (cat.includes('服装') || cat.includes('apparel') || cat.includes('fashion')) {
      parts.push('fashion product photography, clean background');
    } else {
      parts.push('commercial product photography');
    }
  } else {
    parts.push('commercial product photography');
  }

  // 通用高质量修饰词
  parts.push(
    'studio lighting',
    'white background',
    'high resolution',
    '8k quality',
    'photorealistic',
    'sharp focus',
    'professional commercial shot'
  );

  const prompt = parts.join(', ');

  const negativePrompt = [
    'blurry', 'low quality', 'distorted', 'deformed',
    'text', 'watermark', 'logo', 'signature',
    'cartoon', 'anime', 'illustration', 'painting',
    'dark background', 'shadow', 'noise', 'grain',
    'overexposed', 'underexposed'
  ].join(', ');

  return { prompt: prompt.slice(0, 400), negativePrompt };
}

// ── DashScope API 调用 ─────────────────────────────────────────────────────────

const DASHSCOPE_API_BASE = 'https://dashscope.aliyuncs.com/api/v1';

/**
 * 提交异步图片生成任务
 */
async function submitImageTask(
  prompt: string,
  negativePrompt: string
): Promise<{ taskId: string } | RenderImageError> {
  const apiKey = ENV.dashscopeApiKey;
  if (!apiKey) {
    return { error: 'DashScope API key not configured', code: 'NO_API_KEY' };
  }

  try {
    const response = await fetch(`${DASHSCOPE_API_BASE}/services/aigc/text2image/image-synthesis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: 'stable-diffusion-3.5-large-turbo',
        input: {
          prompt,
          negative_prompt: negativePrompt,
        },
        parameters: {
          size: '1024*1024',
          n: 1,
          steps: 20,   // Turbo 版本推荐 20 步，速度更快
          cfg: 4.5,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    const data = await response.json() as DashScopeTaskResponse;

    if (!response.ok || data.code) {
      return {
        error: data.message ?? 'Task submission failed',
        code: data.code ?? 'SUBMISSION_FAILED',
        details: `HTTP ${response.status}`,
      };
    }

    const taskId = data.output?.task_id;
    if (!taskId) {
      return { error: 'No task_id returned', code: 'NO_TASK_ID' };
    }

    console.log(`🎨 [RenderImage] Task submitted: ${taskId}`);
    return { taskId };
  } catch (err) {
    return {
      error: 'Task submission error',
      code: 'SUBMIT_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * 轮询任务状态，直到完成或超时
 */
async function pollTaskResult(
  taskId: string,
  maxWaitMs = 300000,  // 最多等待 5 分钟
  intervalMs = 5000    // 每 5 秒轮询一次
): Promise<{ imageUrl: string } | RenderImageError> {
  const apiKey = ENV.dashscopeApiKey;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(resolve => setTimeout(resolve, intervalMs));

    try {
      const response = await fetch(
        `${DASHSCOPE_API_BASE}/tasks/${taskId}`,
        {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(15000),
        }
      );

      const data = await response.json() as DashScopeTaskResponse;
      const status = data.output?.task_status;

      console.log(`🔄 [RenderImage] Task ${taskId} status: ${status} (${Math.round((Date.now() - startTime) / 1000)}s)`);

      if (status === 'SUCCEEDED') {
        const imageUrl = data.output?.results?.[0]?.url;
        if (!imageUrl) {
          return { error: 'No image URL in result', code: 'NO_IMAGE_URL' };
        }
        return { imageUrl };
      }

      if (status === 'FAILED' || status === 'CANCELED') {
        return {
          error: `Task ${status.toLowerCase()}`,
          code: `TASK_${status}`,
          details: data.message,
        };
      }

      // PENDING / RUNNING / SUSPENDED → 继续等待
    } catch (err) {
      console.warn(`⚠️ [RenderImage] Poll error (will retry):`, err);
    }
  }

  return {
    error: 'Task timed out after 5 minutes',
    code: 'TASK_TIMEOUT',
  };
}

// ── 主入口 ────────────────────────────────────────────────────────────────────

/**
 * 为采购需求生成产品渲染图
 * 完整流程：构建 Prompt → 提交 SD 任务 → 轮询结果 → 上传 OSS → 返回 URL
 */
export async function generateRenderImage(
  input: RenderImageInput
): Promise<RenderImageResult | RenderImageError> {
  console.log(`🎨 [RenderImage] Generating render for: "${input.productName}"`);

  // Step 1: 构建 Prompt
  const { prompt, negativePrompt } = buildSDPrompt(input);
  console.log(`📝 [RenderImage] Prompt: "${prompt.slice(0, 100)}..."`);

  // Step 2: 提交任务
  const submitResult = await submitImageTask(prompt, negativePrompt);
  if ('error' in submitResult) {
    console.error(`❌ [RenderImage] Submit failed:`, submitResult);
    return submitResult;
  }

  // Step 3: 轮询结果
  const pollResult = await pollTaskResult(submitResult.taskId);
  if ('error' in pollResult) {
    console.error(`❌ [RenderImage] Poll failed:`, pollResult);
    return pollResult;
  }

  // Step 4: 上传到 OSS
  const ossResult = await ossUploadFromUrl(pollResult.imageUrl, 'renders', 20);
  if (isOSSError(ossResult)) {
    // OSS 上传失败时，仍然返回原始 URL（不阻断流程）
    console.warn(`⚠️ [RenderImage] OSS upload failed, using original URL:`, ossResult);
    return {
      ossUrl: pollResult.imageUrl,
      originalUrl: pollResult.imageUrl,
      taskId: submitResult.taskId,
      prompt,
    };
  }

  console.log(`✅ [RenderImage] Render complete: ${ossResult.url}`);

  return {
    ossUrl: ossResult.url,
    originalUrl: pollResult.imageUrl,
    taskId: submitResult.taskId,
    prompt,
  };
}

export function isRenderImageError(
  result: RenderImageResult | RenderImageError
): result is RenderImageError {
  return 'error' in result;
}
