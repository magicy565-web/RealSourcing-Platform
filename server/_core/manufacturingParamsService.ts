/**
 * RealSourcing - Manufacturing Parameters Service
 * 采购需求 → 工厂生产参数转化引擎
 *
 * 职责：
 * 将结构化的 SourcingDemand 转化为工厂可以直接理解和响应的生产参数，包括：
 * - MOQ（最小起订量）
 * - 材料清单（BOM）
 * - 尺寸/重量规格
 * - 颜色要求（Pantone 色号）
 * - 包装要求
 * - 认证要求（CE/FCC/RoHS 等）
 * - 预估单位制造成本
 * - 模具/工装成本
 * - 生产周期
 * - 建议工厂类型
 */

import { ENV } from './env';
import { type SourcingDemand } from './sourcingDemandService';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface ManufacturingParameters {
  moq: number | null;
  materials: Array<{ name: string; percentage?: number; specification?: string }>;
  dimensions: string;
  weight: string;
  colorRequirements: Array<{ name: string; pantone?: string; hex?: string }>;
  packagingRequirements: string;
  certificationsRequired: string[];
  estimatedUnitCost: number | null;
  toolingCost: number | null;
  leadTimeDays: number | null;
  productionCategory: string;
  suggestedFactoryTypes: string[];
  renderImageUrl: string | null;
  technicalDrawingUrl: string | null;
  /** 完整的 LLM 推理输出 */
  rawParameters: Record<string, unknown>;
}

export interface TransformationError {
  error: string;
  code: string;
  details?: string;
}

// ── 系统提示词 ─────────────────────────────────────────────────────────────────

const TRANSFORMATION_SYSTEM_PROMPT = `你是一位资深的制造业工程师和供应链专家，拥有 20 年跨境制造经验。

你的任务是将采购商的产品需求转化为工厂可以直接理解的生产技术参数。

**转化原则**：
1. 基于产品描述和特性，合理推断材料、工艺和成本
2. MOQ 要符合行业惯例（消费电子通常 500-5000，服装通常 100-500）
3. 成本估算要基于中国制造的实际水平（FOB 价格）
4. 认证要求要符合目标市场（欧美市场通常需要 CE/FCC/RoHS）
5. 工厂类型要具体（如"注塑成型工厂"而非"制造工厂"）

**必须返回有效的 JSON，格式如下**：
{
  "moq": 1000,
  "materials": [
    {"name": "ABS 工程塑料", "percentage": 70, "specification": "食品级，硬度 Shore D 70"},
    {"name": "不锈钢 304", "percentage": 20, "specification": "厚度 0.5mm"},
    {"name": "硅胶密封圈", "percentage": 10, "specification": "FDA 认证"}
  ],
  "dimensions": "15cm × 10cm × 5cm (±2mm)",
  "weight": "250g (±10g)",
  "colorRequirements": [
    {"name": "哑光黑", "pantone": "Pantone Black 6 C", "hex": "#2B2B2B"},
    {"name": "珍珠白", "pantone": "Pantone 11-0601 TCX", "hex": "#F5F5F0"}
  ],
  "packagingRequirements": "彩盒包装，每盒1件，外箱12件，纸箱尺寸 40×30×25cm",
  "certificationsRequired": ["CE", "FCC", "RoHS", "REACH"],
  "estimatedUnitCost": 3.50,
  "toolingCost": 8000,
  "leadTimeDays": 45,
  "productionCategory": "消费电子 - 智能家居",
  "suggestedFactoryTypes": ["注塑成型工厂", "电子组装工厂", "表面处理工厂"],
  "costBreakdown": {
    "rawMaterials": 1.80,
    "labor": 0.60,
    "overhead": 0.40,
    "packaging": 0.30,
    "profit": 0.40
  },
  "qualityControlPoints": ["来料检验", "半成品检验", "成品全检", "跌落测试"],
  "productionProcess": ["注塑成型", "超声波焊接", "丝印/移印", "组装测试", "包装"],
  "additionalNotes": "建议工厂具备 ISO 9001 认证"
}`;

// ── LLM 调用 ───────────────────────────────────────────────────────────────────

async function callTransformationLLM(
  demand: SourcingDemand
): Promise<ManufacturingParameters | TransformationError> {
  const baseUrl = (ENV.openaiBaseUrl || 'https://once.novai.su/v1').replace(/\/$/, '');

  const userPrompt = `请将以下采购需求转化为详细的工厂生产参数：

**产品名称**: ${demand.productName}
**产品描述**: ${demand.productDescription}
**关键特性**: ${demand.keyFeatures.join('; ')}
**目标用户**: ${demand.targetAudience}
**预估采购量**: ${demand.estimatedQuantity}
**目标价格**: ${demand.targetPrice}
**定制需求**: ${demand.customizationNotes}

${demand.visualReferences.length > 0 ? `**视觉参考图片**: ${demand.visualReferences.slice(0, 2).join(', ')}` : ''}

请基于以上信息，生成完整的工厂生产参数 JSON。`;

  // 构建消息（如果有视觉参考，附加图片）
  const userContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    { type: 'text', text: userPrompt },
  ];

  for (const imgUrl of demand.visualReferences.slice(0, 2)) {
    if (imgUrl.startsWith('http')) {
      userContent.push({ type: 'image_url', image_url: { url: imgUrl } });
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
        model: 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: TRANSFORMATION_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      return {
        error: 'Transformation LLM call failed',
        code: 'LLM_CALL_FAILED',
        details: `HTTP ${response.status}`,
      };
    }

    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const rawContent = result.choices?.[0]?.message?.content ?? '';

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return {
        error: 'Failed to parse transformation JSON output',
        code: 'JSON_PARSE_ERROR',
        details: rawContent.slice(0, 500),
      };
    }

    // 安全地提取字段
    return {
      moq: typeof parsed.moq === 'number' ? parsed.moq : null,
      materials: Array.isArray(parsed.materials)
        ? parsed.materials.map((m: unknown) => {
            const mat = m as Record<string, unknown>;
            return {
              name: String(mat.name ?? ''),
              percentage: typeof mat.percentage === 'number' ? mat.percentage : undefined,
              specification: mat.specification ? String(mat.specification) : undefined,
            };
          })
        : [],
      dimensions: String(parsed.dimensions ?? ''),
      weight: String(parsed.weight ?? ''),
      colorRequirements: Array.isArray(parsed.colorRequirements)
        ? parsed.colorRequirements.map((c: unknown) => {
            const col = c as Record<string, unknown>;
            return {
              name: String(col.name ?? ''),
              pantone: col.pantone ? String(col.pantone) : undefined,
              hex: col.hex ? String(col.hex) : undefined,
            };
          })
        : [],
      packagingRequirements: String(parsed.packagingRequirements ?? ''),
      certificationsRequired: Array.isArray(parsed.certificationsRequired)
        ? parsed.certificationsRequired.map(String)
        : [],
      estimatedUnitCost: typeof parsed.estimatedUnitCost === 'number' ? parsed.estimatedUnitCost : null,
      toolingCost: typeof parsed.toolingCost === 'number' ? parsed.toolingCost : null,
      leadTimeDays: typeof parsed.leadTimeDays === 'number' ? parsed.leadTimeDays : null,
      productionCategory: String(parsed.productionCategory ?? ''),
      suggestedFactoryTypes: Array.isArray(parsed.suggestedFactoryTypes)
        ? parsed.suggestedFactoryTypes.map(String)
        : [],
      renderImageUrl: null, // 后续可集成 DALL-E 生成渲染图
      technicalDrawingUrl: null,
      rawParameters: parsed,
    };
  } catch (err) {
    return {
      error: 'Transformation service error',
      code: 'SERVICE_ERROR',
      details: err instanceof Error ? err.message : String(err),
    };
  }
}

// ── 主入口 ────────────────────────────────────────────────────────────────────

/**
 * 将采购需求转化为工厂生产参数
 */
export async function transformToManufacturingParams(
  demand: SourcingDemand
): Promise<ManufacturingParameters | TransformationError> {
  console.log(`⚙️ [ManufacturingParams] Transforming demand: "${demand.productName}"`);
  const result = await callTransformationLLM(demand);
  if ('error' in result) {
    console.error(`❌ [ManufacturingParams] Transformation failed:`, result);
  } else {
    console.log(`✅ [ManufacturingParams] Generated | MOQ: ${result.moq} | Cost: $${result.estimatedUnitCost} | Lead: ${result.leadTimeDays}d`);
  }
  return result;
}

export function isTransformationError(
  result: ManufacturingParameters | TransformationError
): result is TransformationError {
  return 'error' in result;
}
