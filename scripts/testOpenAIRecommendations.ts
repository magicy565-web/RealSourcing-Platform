import { OpenAI } from "openai";
import mysql from "mysql2/promise";

/**
 * OpenAI API 实测脚本
 * 
 * 目的：
 * - 验证 OpenAI API 生成的推荐理由质量
 * - 测试不同工厂数据的推荐效果
 * - 收集 Prompt 优化的反馈
 * - 评估生成速度和成本
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface FactoryTestData {
  id: number;
  name: string;
  category: string;
  country: string;
  city: string;
  overallScore: number;
  certificationStatus: string;
  responseRate: number;
  viewCount: number;
  favoriteCount: number;
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
 * 生成 AI 推荐理由（与 server/ai.ts 中的逻辑一致）
 */
async function generateRecommendation(factory: FactoryTestData) {
  const prompt = `你是一个专业的 B2B 采购顾问。基于以下工厂数据，为采购商生成一份简洁、专业的推荐理由。

工厂信息：
- 名称: ${factory.name}
- 类别: ${factory.category}
- 位置: ${factory.city}, ${factory.country}
- 整体评分: ${factory.overallScore}/5
- 认证状态: ${factory.certificationStatus}
- 响应率: ${factory.responseRate}%
- 浏览次数: ${factory.viewCount}
- 收藏次数: ${factory.favoriteCount}
- AI 验厂评分: ${factory.aiVerificationScore || "N/A"}
- 历史交易: ${factory.totalOrders || 0} 笔
- 样品转化率: ${factory.sampleConversionRate || 0}%
- 纠纷率: ${factory.disputeRate || 0}%
- 视频数: ${factory.reelCount || 0}
- 支持语言: ${factory.languagesSpoken?.join(", ") || "中文"}
- 成立年份: ${factory.establishedYear || "N/A"}
- 员工数: ${factory.employeeCount || "N/A"}

请生成一份包含以下三部分的推荐理由（用 JSON 格式返回）：
1. mainReason: 一句话推荐理由（15-25 字，高度概括该工厂的核心优势）
2. detailedReasons: 详细推荐理由数组（3-5 条，每条 15-30 字，基于具体数据）
3. trustIndicators: 信任指标数组（3-4 条，每条 15-30 字，强化买家信心）

返回格式必须是有效的 JSON，不要包含任何其他文本。`;

  try {
    const startTime = Date.now();
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const duration = Date.now() - startTime;
    const content = response.choices[0].message.content || "";

    // 解析 JSON 响应
    let recommendation;
    try {
      recommendation = JSON.parse(content);
    } catch (e) {
      // 如果 JSON 解析失败，尝试提取 JSON 部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recommendation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("无法解析 OpenAI 响应");
      }
    }

    return {
      success: true,
      factory: factory.name,
      recommendation,
      duration,
      tokensUsed: response.usage?.total_tokens || 0,
    };
  } catch (error) {
    return {
      success: false,
      factory: factory.name,
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

/**
 * 从数据库获取工厂测试数据
 */
async function getFactoriesFromDB(): Promise<FactoryTestData[]> {
  const connection = await mysql.createConnection({
    host: "rm-bp1h4o9up7249uep3to.mysql.rds.aliyuncs.com",
    user: "magicyang",
    password: "Wysk1214",
    database: "realsourcing",
  });

  try {
    const [rows] = await connection.execute(
      `SELECT 
        f.id, f.name, f.category, f.country, f.city, f.overallScore,
        f.certificationStatus, f.responseRate, f.viewCount, f.favoriteCount,
        f.establishedYear, f.employeeCount,
        fv.aiVerificationScore,
        fm.totalOrders, fm.sampleConversionRate, fm.disputeRate,
        COUNT(fr.id) as reelCount
      FROM factories f
      LEFT JOIN factory_verifications fv ON f.id = fv.factoryId
      LEFT JOIN factory_metrics fm ON f.id = fm.factoryId
      LEFT JOIN factory_reels fr ON f.id = fr.factoryId
      GROUP BY f.id
      LIMIT 5`
    );

    return rows as FactoryTestData[];
  } finally {
    await connection.end();
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log("🚀 开始 OpenAI API 实测...\n");

  try {
    // 获取测试数据
    console.log("📊 从数据库获取工厂数据...");
    const factories = await getFactoriesFromDB();
    console.log(`✅ 获取了 ${factories.length} 个工厂数据\n`);

    // 逐个测试
    const results = [];
    for (let i = 0; i < factories.length; i++) {
      const factory = factories[i];
      console.log(`[${i + 1}/${factories.length}] 正在生成 ${factory.name} 的推荐理由...`);

      const result = await generateRecommendation(factory);
      results.push(result);

      if (result.success) {
        console.log(`✅ 成功 (${result.duration}ms, ${result.tokensUsed} tokens)`);
        console.log(`   主要理由: ${result.recommendation.mainReason}`);
      } else {
        console.log(`❌ 失败: ${result.error}`);
      }
      console.log();

      // 避免 API 限流，每个请求间隔 1 秒
      if (i < factories.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // 生成报告
    console.log("\n📈 测试报告\n" + "=".repeat(60));
    const successCount = results.filter((r) => r.success).length;
    const totalTokens = results
      .filter((r) => r.success)
      .reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
    const avgDuration =
      results
        .filter((r) => r.success)
        .reduce((sum, r) => sum + (r.duration || 0), 0) / successCount;

    console.log(`✅ 成功率: ${successCount}/${results.length} (${((successCount / results.length) * 100).toFixed(1)}%)`);
    console.log(`⏱️  平均耗时: ${avgDuration.toFixed(0)}ms`);
    console.log(`🔤 总 Token 数: ${totalTokens}`);
    console.log(`💰 估计成本: $${(totalTokens * 0.00001).toFixed(4)} (按 gpt-4.1-mini 价格)`);

    // 输出详细结果
    console.log("\n📋 详细结果\n" + "=".repeat(60));
    results.forEach((result, idx) => {
      console.log(`\n[${idx + 1}] ${result.factory}`);
      if (result.success) {
        console.log(`   主要理由: ${result.recommendation.mainReason}`);
        console.log(`   详细理由:`);
        result.recommendation.detailedReasons.forEach((reason: string) => {
          console.log(`     • ${reason}`);
        });
        console.log(`   信任指标:`);
        result.recommendation.trustIndicators.forEach((indicator: string) => {
          console.log(`     • ${indicator}`);
        });
      } else {
        console.log(`   ❌ 错误: ${result.error}`);
      }
    });

    console.log("\n✨ 测试完成！");
  } catch (error) {
    console.error("❌ 测试失败:", error);
    process.exit(1);
  }
}

// 运行测试
runTests();
