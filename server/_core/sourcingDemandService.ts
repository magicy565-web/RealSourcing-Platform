/**
 * RealSourcing - Sourcing Demand Service
 * 采购需求建模服务
 *
 * 职责：
 * 1. 接收 IngestedContent，调用 LLM 提取结构化采购需求
 * 2. 将结构化需求写入 sourcing_demands 表
 * 3. 触发下游的参数转化流程
 *
 * 核心数据结构：SourcingDemand
 * {
 *   productName, productDescription, keyFeatures,
 *   targetAudience, visualReferences,
 *   estimatedQuantity, targetPrice, customizationNotes,
 *   productCategory (透传给 extractedData，供 manufacturingParamsService 使用)
 * }
 *
 * Fix (2026-02-26):
 *   - 强化提取 Prompt，要求 productName 和 productCategory 必填
 *   - 将 productCategory 从 extractedData 透传到顶层字段，避免匹配时丢失
 *   - 增加 JSON 修复逻辑，处理 LLM 输出非标准 JSON 的情况
 */

import { ENV } from './env';
import { type IngestedContent, isIngestionError } from './multimodalIngestionService';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface SourcingDemand {
  productName: string;
  productDescription: string;
  keyFeatures: string[];
  targetAudience: string;
  visualReferences: string[];
  estimatedQuantity: string;
  targetPrice: string;
  customizationNotes: string;
  /** 产品类别（透传给 extractedData，供 manufacturingParamsService 使用） */
  productCategory: string;
  /** 原始提取数据（完整 LLM 输出） */
  extractedData: Record<string, unknown>;
}

export interface ExtractionError {
  error: string;
  code: string;
  details?: string;
}

// ── 系统提示词（强化版） ────────────────────────────────────────────────────────

const EXTRACTION_SYSTEM_PROMPT = `你是一位专业的跨境贸易采购分析师，擅长从各类内容（网页、视频描述、PDF 文档、纯文本）中识别和提取产品采购需求。

你的任务是分析用户提供的内容，提取其中的产品信息，并以严格的 JSON 格式返回结构化的采购需求。

**重要规则**：
1. 必须返回有效的 JSON，不要包含任何 Markdown 代码块标记（如 \`\`\`json）
2. productName 和 productCategory 是必填字段，即使内容模糊也必须给出最佳猜测，不能为空
3. 产品描述要详细，包含材质、功能、外观等关键信息（至少 50 字）
4. keyFeatures 至少提取 3 条，每条不超过 30 字
5. 数量和价格保留原始表述，不要换算
6. productCategory 必须从以下标准品类中选择最匹配的一个：
   智能家居 | 运动装备 | 美妆个护 | 礼品工艺 | 精密模具 | 穿戴科技 | 消费电子 | 家居用品 | 服装配饰 | 食品饮料 | 医疗器械 | 汽车配件 | 工业设备 | 其他

**返回格式**（所有字段均为必填，无法提取时使用合理默认值）：
{
  "productName": "产品名称（中英文均可，必填）",
  "productDescription": "详细产品描述，至少 50 字",
  "keyFeatures": ["特性1", "特性2", "特性3"],
  "targetAudience": "目标用户群体描述",
  "visualReferences": [],
  "estimatedQuantity": "预估采购量（如 '5000-10000件/月'，未知填 '待确认'）",
  "targetPrice": "目标价格（如 '$2.5-3.0/件 FOB'，未知填 '待议'）",
  "customizationNotes": "定制化需求（颜色、logo、包装等，无则填 '标准款'）",
  "productCategory": "从标准品类中选择（必填）",
  "urgencyLevel": "紧迫程度（high/medium/low）",
  "additionalNotes": "其他补充信息"
}`;

// ── JSON 修复工具 ──────────────────────────────────────────────────────────────

/**
 * 尝试从 LLM 输出中提取有效 JSON
 * 处理常见问题：Markdown 代码块包裹、前后多余文字
 */
function extractJsonFromLLMOutput(raw: string): Record<string, unknown> | null {
  // 1. 尝试直接解析
  try {
    return JSON.parse(raw);
  } catch {}

  // 2. 去除 Markdown 代码块
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {}

  // 3. 提取第一个 { ... } 块
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }

  return null;
}

// ── LLM 调用 ───────────────────────────────────────────────────────────────────

async function callExtractionLLM(
  ingestedContent: IngestedContent
): Promise<SourcingDemand | ExtractionError> {
  const baseUrl = (ENV.openaiBaseUrl || 'https://once.novai.su/v1').replace(/\/$/, '');
  const model = 'gpt-4.1-mini'; // 信息提取用轻量模型，降低成本

  // 构建用户消息
  const userMessage: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: 'text',
      text: `请从以下内容中提取采购需求信息。注意：productName 和 productCategory 是必填字段，即使内容不够清晰也必须给出最佳猜测。

**来源类型**: ${ingestedContent.sourceType}
**来源 URI**: ${ingestedContent.sourceUri}

**内容文本**:
${ingestedContent.textContent.slice(0, 8000)}

${ingestedContent.imageUrls.length > 0 ? `**参考图片**: ${ingestedContent.imageUrls.slice(0, 3).join(', ')}` : ''}

请严格按照 JSON 格式返回结构化的采购需求，确保 productName 和 productCategory 不为空。`,
    },
  ];

  // 如果有图片，附加图片内容（视觉理解）
  for (const imgUrl of ingestedContent.imageUrls.slice(0, 3)) {
    if (imgUrl.startsWith('http')) {
      userMessage.push({
        type: 'image_url',
        image_url: { url: imgUrl },
      });
    }
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ENV.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 2000,
        temperature: 0.1, // 极低温度，保证输出稳定性和字段完整性
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        error: 'LLM extraction call failed',
        code: 'LLM_CALL_FAILED',
        details: `HTTP ${response.status}: ${errText}`,
      };
    }

    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const rawContent = result.choices?.[0]?.message?.content ?? '';

    const parsed = extractJsonFromLLMOutput(rawContent);
    if (!parsed) {
      return {
        error: 'Failed to parse LLM JSON output',
        code: 'JSON_PARSE_ERROR',
        details: rawContent.slice(0, 500),
      };
    }

    // 提取 productCategory，确保不为空
    const productCategory = String(parsed.productCategory ?? parsed.productionCategory ?? '');

    // 如果 productName 为空，尝试从 URI 或描述中推断
    let productName = String(parsed.productName ?? '');
    if (!productName && ingestedContent.sourceUri) {
      // 从 URL 中提取最后一段作为产品名称备用
      const urlParts = ingestedContent.sourceUri.split('/').filter(Boolean);
      productName = urlParts[urlParts.length - 1]?.replace(/[-_]/g, ' ') ?? '未知产品';
    }
    if (!productName) productName = '未知产品';

    return {
      productName,
      productDescription: String(parsed.productDescription ?? ''),
      keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures.map(String) : [],
      targetAudience: String(parsed.targetAudience ?? ''),
      visualReferences: [
        ...ingestedContent.imageUrls,
        ...(Array.isArray(parsed.visualReferences) ? parsed.visualReferences.map(String) : []),
      ].filter(u => u.startsWith('http')).slice(0, 10),
      estimatedQuantity: String(parsed.estimatedQuantity ?? '待确认'),
      targetPrice: String(parsed.targetPrice ?? '待议'),
      customizationNotes: String(parsed.customizationNotes ?? ''),
      productCategory,
      extractedData: {
        ...parsed,
        // 确保 productCategory 在 extractedData 中也存在（供下游服务读取）
        productCategory,
      },
    };
  } catch (err) {
    return {
      error: 'Extraction service error',
      code: 'SERVICE_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── 主入口 ────────────────────────────────────────────────────────────────────

/**
 * 从摄取内容中提取结构化采购需求
 */
export async function extractSourcingDemand(
  ingestedContent: IngestedContent
): Promise<SourcingDemand | ExtractionError> {
  console.log(`🔍 [SourcingDemand] Extracting from ${ingestedContent.sourceType}: ${ingestedContent.sourceUri}`);
  const result = await callExtractionLLM(ingestedContent);
  if ('error' in result) {
    console.error(`❌ [SourcingDemand] Extraction failed:`, result);
  } else {
    console.log(`✅ [SourcingDemand] Extracted: "${result.productName}" | Category: "${result.productCategory}" | Features: ${result.keyFeatures.length}`);
  }
  return result;
}

export function isExtractionError(result: SourcingDemand | ExtractionError): result is ExtractionError {
  return 'error' in result;
}
