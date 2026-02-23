/**
 * AI 服务模块 - 工厂推荐
 *
 * 使用 aiService 统一调用 LLM，为工厂生成智能推荐理由和分析。
 * 支持多模型路由（Qwen-Plus → DeepSeek → Gemini 降级链）。
 * 当 LLM 调用失败时，自动降级为基于规则的推荐，确保服务可用性。
 */

import { aiService } from "./_core/aiService";

// ── 类型定义 ──────────────────────────────────────────────────────────────────

/**
 * 工厂数据接口（用于 AI 分析）
 */
interface FactoryDataForAI {
  id: string;
  name: string;
  category?: string;
  country?: string;
  city?: string;
  overallScore?: number;
  certificationStatus?: string;
  responseRate?: number;
  viewCount?: number;
  favoriteCount?: number;
  aiVerificationScore?: number;
  totalOrders?: number;
  sampleConversionRate?: number;
  disputeRate?: number;
  reelCount?: number;
  languagesSpoken?: string[];
  establishedYear?: number;
  employeeCount?: number;
}

export interface FactoryRecommendationResult {
  mainReason: string;       // 主要推荐理由（一句话）
  detailedReasons: string[]; // 详细推荐理由（3-5 条）
  trustIndicators: string[]; // 信任指标（3-4 条）
  generatedByAI: boolean;   // 是否由 LLM 生成（用于前端展示）
}

// ── Prompt 构建 ───────────────────────────────────────────────────────────────

function buildFactoryRecommendationPrompt(
  factory: FactoryDataForAI,
  buyerContext?: {
    preferredCategories?: string[];
    preferredCountries?: string[];
    minQualityScore?: number;
  }
): string {
  const factoryInfo = `
工厂名称: ${factory.name}
所在地: ${factory.city || "未知"}, ${factory.country || "未知"}
主营类别: ${factory.category || "多类别"}
整体评分: ${factory.overallScore != null ? factory.overallScore.toFixed(1) : "暂无"}
AI 验厂评分: ${factory.aiVerificationScore ?? 0}
认证状态: ${factory.certificationStatus === "verified" ? "已认证" : "未认证"}
响应率: ${factory.responseRate != null ? factory.responseRate.toFixed(1) + "%" : "暂无"}
浏览次数: ${factory.viewCount ?? 0}
收藏次数: ${factory.favoriteCount ?? 0}
历史交易数: ${factory.totalOrders ?? 0}
样品转化率: ${factory.sampleConversionRate != null ? factory.sampleConversionRate.toFixed(1) + "%" : "暂无"}
纠纷率: ${factory.disputeRate != null ? factory.disputeRate.toFixed(2) + "%" : "暂无"}
视频展示数: ${factory.reelCount ?? 0}
支持语言: ${factory.languagesSpoken?.join("、") || "暂无"}
成立年份: ${factory.establishedYear || "暂无"}
员工数: ${factory.employeeCount || "暂无"}
  `.trim();

  const buyerContextStr = buyerContext
    ? `
采购商偏好:
- 偏好类别: ${buyerContext.preferredCategories?.join("、") || "不限"}
- 偏好国家: ${buyerContext.preferredCountries?.join("、") || "不限"}
- 最低质量要求: ${buyerContext.minQualityScore ?? 3.5} 分
    `.trim()
    : "";

  return `请根据以下工厂数据，生成专业的推荐理由，帮助国际采购商快速判断该工厂的合作价值。

${factoryInfo}
${buyerContextStr ? "\n" + buyerContextStr : ""}

请严格按以下 JSON 格式返回，不要包含任何其他文字：
{
  "mainReason": "一句话主要推荐理由（最多 20 个字，简洁有力）",
  "detailedReasons": [
    "理由 1（必须引用具体数据，如评分/响应率/交易数）",
    "理由 2（基于具体数据）",
    "理由 3（基于具体数据）"
  ],
  "trustIndicators": [
    "信任指标 1（如：整体评分 4.7/5.0）",
    "信任指标 2",
    "信任指标 3"
  ]
}

要求：
1. mainReason 必须简洁有力，能在 5 秒内让采购商了解核心价值
2. detailedReasons 必须基于具体的数据指标，而非泛泛而谈
3. trustIndicators 应强调工厂的可靠性和专业性
4. 所有内容必须客观、专业，避免过度承诺
5. 如果某个数据缺失，请跳过该指标，不要编造数据
6. 只返回 JSON，不要任何 markdown 代码块或额外说明`;
}

// ── 响应解析 ──────────────────────────────────────────────────────────────────

function parseAIResponse(content: string): FactoryRecommendationResult | null {
  try {
    // 移除可能的 markdown 代码块包裹
    const cleaned = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.mainReason) return null;

    return {
      mainReason: String(parsed.mainReason).slice(0, 30),
      detailedReasons: Array.isArray(parsed.detailedReasons)
        ? parsed.detailedReasons.slice(0, 5).map(String)
        : [],
      trustIndicators: Array.isArray(parsed.trustIndicators)
        ? parsed.trustIndicators.slice(0, 4).map(String)
        : [],
      generatedByAI: true,
    };
  } catch (error) {
    console.error("❌ AI 推荐理由 JSON 解析失败:", error);
    return null;
  }
}

// ── 降级方案：基于规则的推荐 ──────────────────────────────────────────────────

function generateFallbackRecommendation(
  factory: FactoryDataForAI
): FactoryRecommendationResult {
  const reasons: string[] = [];
  const indicators: string[] = [];

  if (factory.overallScore && factory.overallScore >= 4.5) {
    reasons.push(`整体评分 ${factory.overallScore.toFixed(1)} 分，客户满意度优秀`);
    indicators.push(`整体评分 ${factory.overallScore.toFixed(1)}/5.0`);
  }
  if (factory.aiVerificationScore && factory.aiVerificationScore >= 80) {
    reasons.push(`AI 验厂评分 ${factory.aiVerificationScore} 分，生产工艺先进`);
    indicators.push(`AI 验厂评分 ${factory.aiVerificationScore}/100`);
  }
  if (factory.responseRate && factory.responseRate >= 80) {
    reasons.push(`响应率 ${factory.responseRate.toFixed(0)}%，沟通高效及时`);
    indicators.push(`响应率 ${factory.responseRate.toFixed(0)}%`);
  }
  if (factory.totalOrders && factory.totalOrders >= 50) {
    reasons.push(`历史交易 ${factory.totalOrders} 笔，经验丰富可靠`);
    indicators.push(`历史交易 ${factory.totalOrders}+ 笔`);
  }
  if (factory.sampleConversionRate && factory.sampleConversionRate >= 30) {
    reasons.push(`样品转化率 ${factory.sampleConversionRate.toFixed(0)}%，产品竞争力强`);
    indicators.push(`样品转化率 ${factory.sampleConversionRate.toFixed(0)}%`);
  }
  if (factory.disputeRate != null && factory.disputeRate < 2) {
    indicators.push(`纠纷率低至 ${factory.disputeRate.toFixed(1)}%`);
  }
  if (factory.certificationStatus === "verified") {
    indicators.push("已通过国际认证");
  }
  if (factory.reelCount && factory.reelCount > 0) {
    indicators.push(`${factory.reelCount} 个工厂视频展示`);
  }
  if (factory.languagesSpoken && factory.languagesSpoken.length > 1) {
    indicators.push(`支持 ${factory.languagesSpoken.length} 种语言沟通`);
  }

  if (reasons.length === 0) {
    reasons.push("专业工厂，欢迎洽谈合作");
  }

  return {
    mainReason: reasons[0],
    detailedReasons: reasons.slice(0, 3),
    trustIndicators: indicators.slice(0, 4),
    generatedByAI: false,
  };
}

// ── 核心导出函数 ──────────────────────────────────────────────────────────────

/**
 * 生成工厂推荐理由
 *
 * 优先使用 LLM 生成自然语言推荐，失败时自动降级为规则引擎。
 */
export async function generateFactoryRecommendation(
  factory: FactoryDataForAI,
  buyerContext?: {
    preferredCategories?: string[];
    preferredCountries?: string[];
    minQualityScore?: number;
  }
): Promise<FactoryRecommendationResult> {
  try {
    const userPrompt = buildFactoryRecommendationPrompt(factory, buyerContext);

    const rawResponse = await aiService.callAI(
      [
        {
          role: "system",
          content:
            "你是一个专业的 B2B 采购顾问，拥有 20 年的全球供应链经验。你的任务是根据工厂的客观数据，生成简洁、有说服力的推荐理由，帮助国际采购商快速评估供应商价值。请确保理由基于数据、客观、专业，避免过度承诺。只返回 JSON，不要任何额外文字。",
        },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 600, temperature: 0.6 }
    );

    const parsed = parseAIResponse(rawResponse);
    if (parsed) {
      console.log(`✅ [AI 推荐] 工厂 "${factory.name}" 推荐理由由 LLM 生成`);
      return parsed;
    }

    // JSON 解析失败，降级
    console.warn(`⚠️ [AI 推荐] 工厂 "${factory.name}" LLM 响应解析失败，降级为规则引擎`);
    return generateFallbackRecommendation(factory);
  } catch (error) {
    console.error(`❌ [AI 推荐] 工厂 "${factory.name}" LLM 调用失败，降级为规则引擎:`, error);
    return generateFallbackRecommendation(factory);
  }
}

/**
 * 批量生成工厂推荐理由
 * 用于初始化或定期更新工厂推荐数据
 */
export async function generateBatchFactoryRecommendations(
  factories: FactoryDataForAI[]
): Promise<Map<string, FactoryRecommendationResult>> {
  const results = new Map<string, FactoryRecommendationResult>();

  for (const factory of factories) {
    try {
      const recommendation = await generateFactoryRecommendation(factory);
      results.set(factory.id, recommendation);
      // 避免 API 限流，批量调用时增加间隔
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`❌ 生成工厂 ${factory.id} 推荐失败:`, error);
      results.set(factory.id, generateFallbackRecommendation(factory));
    }
  }

  return results;
}
