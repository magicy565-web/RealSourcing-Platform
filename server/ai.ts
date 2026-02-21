/**
 * AI 服务模块
 * 集成 OpenAI API，为 Factory 模块生成智能推荐理由和分析
 */

import OpenAI from "openai";
import { ENV } from "./_core/env";

const openai = new OpenAI({
  apiKey: ENV.openaiApiKey,
  baseURL: ENV.openaiBaseUrl,
});

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

/**
 * 生成工厂推荐理由
 * 
 * 根据工厂的真实数据，使用 OpenAI 生成专业、有说服力的推荐理由
 * 这些理由将帮助买家快速理解为什么该工厂适合他们
 */
export async function generateFactoryRecommendation(
  factory: FactoryDataForAI,
  buyerContext?: {
    preferredCategories?: string[];
    preferredCountries?: string[];
    minQualityScore?: number;
  }
): Promise<{
  mainReason: string; // 主要推荐理由（一句话）
  detailedReasons: string[]; // 详细推荐理由（3-5 条）
  trustIndicators: string[]; // 信任指标（3-4 条）
}> {
  // 【临时方案】直接使用降级推荐，绕过 OpenAI API 问题
  // TODO: 后续恢复 OpenAI API 调用
  console.log("📌 使用本地规则生成推荐理由（降级方案）");
  return generateFallbackRecommendation(factory);

  // 原始实现（已注释，待恢复）
  /*
  try {
    // 构建 Prompt
    const prompt = buildFactoryRecommendationPrompt(factory, buyerContext);

    // 调用 OpenAI API
    const response = await openai.chat.completions.create({
      model: ENV.openaiModel,
      messages: [
        {
          role: "system",
          content: `你是一个专业的 B2B 采购顾问，拥有 20 年的全球供应链经验。
你的任务是根据工厂的客观数据，生成简洁、有说服力的推荐理由。
这些理由将帮助采购商快速了解为什么这个工厂值得合作。
请确保理由基于数据、客观、专业，避免过度承诺。`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.9,
    });

    // 解析响应
    const content = response.choices[0]?.message?.content || "";
    const parsed = parseAIResponse(content);

    return parsed;
  } catch (error) {
    console.error("❌ AI 推荐理由生成失败:", error);
    // 降级处理：返回基于规则的推荐
    return generateFallbackRecommendation(factory);
  }
  */
}

/**
 * 构建 Prompt
 */
function buildFactoryRecommendationPrompt(
  factory: FactoryDataForAI,
  buyerContext?: any
): string {
  const factoryInfo = `
工厂名称: ${factory.name}
所在地: ${factory.city || "未知"}, ${factory.country || "未知"}
主营类别: ${factory.category || "多类别"}
整体评分: ${factory.overallScore ? factory.overallScore.toFixed(1) : "暂无"}
AI 验厂评分: ${factory.aiVerificationScore || 0}
认证状态: ${factory.certificationStatus === "verified" ? "已认证" : "未认证"}
响应率: ${factory.responseRate ? factory.responseRate.toFixed(1) : "暂无"}%
浏览次数: ${factory.viewCount || 0}
收藏次数: ${factory.favoriteCount || 0}
历史交易数: ${factory.totalOrders || 0}
样品转化率: ${factory.sampleConversionRate ? factory.sampleConversionRate.toFixed(1) : "暂无"}%
纠纷率: ${factory.disputeRate ? factory.disputeRate.toFixed(2) : "暂无"}%
视频展示数: ${factory.reelCount || 0}
支持语言: ${factory.languagesSpoken?.join("、") || "暂无"}
成立年份: ${factory.establishedYear || "暂无"}
员工数: ${factory.employeeCount || "暂无"}
  `;

  const buyerContextStr = buyerContext
    ? `
采购商偏好:
- 偏好类别: ${buyerContext.preferredCategories?.join("、") || "不限"}
- 偏好国家: ${buyerContext.preferredCountries?.join("、") || "不限"}
- 最低质量要求: ${buyerContext.minQualityScore || "3.5"}分
    `
    : "";

  return `
请根据以下工厂数据，生成推荐理由。

${factoryInfo}
${buyerContextStr}

请按以下 JSON 格式返回：
{
  "mainReason": "一句话主要推荐理由（最多 15 个字）",
  "detailedReasons": [
    "理由 1（基于具体数据）",
    "理由 2（基于具体数据）",
    "理由 3（基于具体数据）"
  ],
  "trustIndicators": [
    "信任指标 1",
    "信任指标 2",
    "信任指标 3"
  ]
}

要求：
1. mainReason 必须简洁有力，能在 5 秒内让采购商了解核心价值
2. detailedReasons 必须基于具体的数据指标，而不是泛泛而谈
3. trustIndicators 应该强调工厂的可靠性和专业性
4. 所有内容必须客观、专业，避免过度承诺
5. 如果某个数据缺失，请跳过该指标，不要编造数据
  `;
}

/**
 * 解析 AI 响应
 */
function parseAIResponse(content: string): {
  mainReason: string;
  detailedReasons: string[];
  trustIndicators: string[];
} {
  try {
    // 尝试提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        mainReason: parsed.mainReason || "优质工厂",
        detailedReasons: Array.isArray(parsed.detailedReasons)
          ? parsed.detailedReasons.slice(0, 3)
          : [],
        trustIndicators: Array.isArray(parsed.trustIndicators)
          ? parsed.trustIndicators.slice(0, 3)
          : [],
      };
    }
  } catch (error) {
    console.error("❌ JSON 解析失败:", error);
  }

  // 降级处理
  return {
    mainReason: "优质工厂",
    detailedReasons: [],
    trustIndicators: [],
  };
}

/**
 * 降级处理：基于规则的推荐
 */
function generateFallbackRecommendation(
  factory: FactoryDataForAI
): {
  mainReason: string;
  detailedReasons: string[];
  trustIndicators: string[];
} {
  const reasons: string[] = [];
  const indicators: string[] = [];

  // 基于评分
  if (factory.overallScore && factory.overallScore >= 4.5) {
    reasons.push("高评分工厂，客户满意度优秀");
    indicators.push("整体评分 4.5+");
  }

  // 基于 AI 验厂评分
  if (factory.aiVerificationScore && factory.aiVerificationScore >= 80) {
    reasons.push("通过 AI 验厂，生产工艺先进");
    indicators.push("AI 验厂评分 80+");
  }

  // 基于响应率
  if (factory.responseRate && factory.responseRate >= 80) {
    reasons.push("响应速度快，沟通高效");
    indicators.push("响应率 80%+");
  }

  // 基于交易记录
  if (factory.totalOrders && factory.totalOrders >= 50) {
    reasons.push("交易记录丰富，经验充足");
    indicators.push("历史交易 50+ 笔");
  }

  // 基于样品转化率
  if (factory.sampleConversionRate && factory.sampleConversionRate >= 30) {
    reasons.push("样品转化率高，产品竞争力强");
    indicators.push("样品转化率 30%+");
  }

  // 基于纠纷率
  if (factory.disputeRate && factory.disputeRate < 2) {
    indicators.push("纠纷率低于 2%");
  }

  // 基于认证状态
  if (factory.certificationStatus === "verified") {
    indicators.push("已通过国际认证");
  }

  // 基于视频展示
  if (factory.reelCount && factory.reelCount > 0) {
    indicators.push(`有 ${factory.reelCount} 个视频展示`);
  }

  // 默认推荐理由
  if (reasons.length === 0) {
    reasons.push("专业工厂，值得合作");
  }

  return {
    mainReason: reasons[0] || "优质工厂",
    detailedReasons: reasons.slice(0, 3),
    trustIndicators: indicators.slice(0, 3),
  };
}

/**
 * 批量生成工厂推荐理由
 * 用于初始化或定期更新工厂推荐数据
 */
export async function generateBatchFactoryRecommendations(
  factories: FactoryDataForAI[]
): Promise<Map<string, any>> {
  const results = new Map();

  for (const factory of factories) {
    try {
      const recommendation = await generateFactoryRecommendation(factory);
      results.set(factory.id, recommendation);
      // 避免 API 限流
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ 生成工厂 ${factory.id} 推荐失败:`, error);
      results.set(factory.id, generateFallbackRecommendation(factory));
    }
  }

  return results;
}
