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
 *   estimatedQuantity, targetPrice, customizationNotes
 * }
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
  /** 原始提取数据（完整 LLM 输出） */
  extractedData: Record<string, unknown>;
}

export interface ExtractionError {
  error: string;
  code: string;
  details?: string;
}

// ── 系统提示词 ─────────────────────────────────────────────────────────────────

const EXTRACTION_SYSTEM_PROMPT = `你是一位专业的跨境贸易采购分析师，擅长从各类内容（网页、视频描述、PDF 文档）中识别和提取产品采购需求。

你的任务是分析用户提供的内容，提取其中的产品信息，并以严格的 JSON 格式返回结构化的采购需求。

**重要规则**：
1. 必须返回有效的 JSON，不要包含任何 Markdown 代码块标记（如 \`\`\`json）
2. 如果某个字段无法从内容中提取，使用空字符串 "" 或空数组 []
3. 产品描述要详细，包含材质、功能、外观等关键信息
4. 关键特性要具体，每条不超过 30 字
5. 数量和价格保留原始表述，不要换算

**返回格式**：
{
  "productName": "产品名称（中英文均可）",
  "productDescription": "详细产品描述，100-300字",
  "keyFeatures": ["特性1", "特性2", "特性3"],
  "targetAudience": "目标用户群体描述",
  "visualReferences": ["图片URL1", "图片URL2"],
  "estimatedQuantity": "预估采购量（如 '5000-10000件/月'）",
  "targetPrice": "目标价格（如 '$2.5-3.0/件 FOB'）",
  "customizationNotes": "定制化需求（颜色、logo、包装等）",
  "productCategory": "产品类别（如 '消费电子', '家居用品', '服装配饰'）",
  "urgencyLevel": "紧迫程度（high/medium/low）",
  "additionalNotes": "其他补充信息"
}`;

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
      text: `请从以下内容中提取采购需求信息：

**来源类型**: ${ingestedContent.sourceType}
**来源 URI**: ${ingestedContent.sourceUri}

**内容文本**:
${ingestedContent.textContent}

${ingestedContent.imageUrls.length > 0 ? `**参考图片**: ${ingestedContent.imageUrls.slice(0, 3).join(', ')}` : ''}

请严格按照 JSON 格式返回结构化的采购需求。`,
    },
  ];

  // 如果有图片，附加图片内容（视觉理解）
  for (const imgUrl of ingestedContent.imageUrls.slice(0, 3)) {
    userMessage.push({
      type: 'image_url',
      image_url: { url: imgUrl },
    });
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
        max_tokens: 1500,
        temperature: 0.2, // 低温度，保证输出稳定性
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return {
        error: 'LLM extraction call failed',
        code: 'LLM_CALL_FAILED',
        details: `HTTP ${response.status}: ${await response.text()}`,
      };
    }

    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const rawContent = result.choices?.[0]?.message?.content ?? '';

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return {
        error: 'Failed to parse LLM JSON output',
        code: 'JSON_PARSE_ERROR',
        details: rawContent.slice(0, 500),
      };
    }

    return {
      productName: String(parsed.productName ?? ''),
      productDescription: String(parsed.productDescription ?? ''),
      keyFeatures: Array.isArray(parsed.keyFeatures) ? parsed.keyFeatures.map(String) : [],
      targetAudience: String(parsed.targetAudience ?? ''),
      visualReferences: [
        ...ingestedContent.imageUrls,
        ...(Array.isArray(parsed.visualReferences) ? parsed.visualReferences.map(String) : []),
      ].slice(0, 10),
      estimatedQuantity: String(parsed.estimatedQuantity ?? ''),
      targetPrice: String(parsed.targetPrice ?? ''),
      customizationNotes: String(parsed.customizationNotes ?? ''),
      extractedData: parsed,
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
    console.log(`✅ [SourcingDemand] Extracted: "${result.productName}" | Features: ${result.keyFeatures.length}`);
  }
  return result;
}

export function isExtractionError(result: SourcingDemand | ExtractionError): result is ExtractionError {
  return 'error' in result;
}
