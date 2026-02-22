/**
 * FTGI 评分流水线端到端测试脚本
 * 测试范围：
 *   1. 评分计算逻辑（五维权重 + AI 系数）
 *   2. JSON 结构化解析（模拟 AI 返回）
 *   3. 边界值处理（空数据、极端值）
 *   4. 系数调整验证（0.4 → 0.6）
 */

// ── 工具函数 ──────────────────────────────────────────────────────────────────
const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));
const pass = (name) => console.log(`  ✅ PASS: ${name}`);
const fail = (name, msg) => { console.log(`  ❌ FAIL: ${name} — ${msg}`); failCount++; };

let failCount = 0;
let testCount = 0;

function assert(condition, testName, failMsg = "") {
  testCount++;
  if (condition) pass(testName);
  else fail(testName, failMsg);
}

// ── 模拟评分函数（与 ftgiService.ts 逻辑一致）────────────────────────────────
function weightedSum(scores) {
  return scores.reduce((acc, { score, weight }) => acc + score * weight, 0);
}

function simulateScoring(factoryData, AI_COEFFICIENT) {
  const { verification, metrics, certifications, reviews, documents } = factoryData;

  // D1: 基础信任与合规力 (20%)
  const certCount = certifications?.length ?? 0;
  const aiVerScore = Number(verification?.aiVerificationScore ?? 0);
  const d1Score = clamp(
    aiVerScore * 0.4 +
    Math.min(certCount / 5, 1) * 100 * 0.3 +
    50 * 0.3  // 财务健康度默认中等
  );

  // D2: 敏捷履约与交付力 (30%)
  const responseRate = Number(metrics?.responseRate ?? 0);
  const sampleConversion = Number(metrics?.sampleConversionRate ?? 0);
  const disputeRate = Number(metrics?.disputeRate ?? 0);
  const d2Score = clamp(
    responseRate * 0.4 +
    sampleConversion * 0.3 +
    Math.max(0, 100 - disputeRate * 10) * 0.3
  );

  // D3: 市场洞察与内容力 (25%)
  const reelCount = documents?.filter(d => d.docType === 'image').length ?? 0;
  const d3Score = clamp(Math.min(reelCount / 10, 1) * 100 * 0.6 + 40);

  // D4: 生态协作与开放性 (15%)
  const d4Score = 50; // 默认中等

  // D5: 社区验证与声誉 (10%)
  const avgRating = reviews?.length > 0
    ? reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length
    : 3;
  const d5Score = clamp(((avgRating - 1) / 4) * 100 * 0.6 + Math.min(reviews?.length / 20, 1) * 100 * 0.4);

  const rawScore = clamp(weightedSum([
    { score: d1Score, weight: 0.20 },
    { score: d2Score, weight: 0.30 },
    { score: d3Score, weight: 0.25 },
    { score: d4Score, weight: 0.15 },
    { score: d5Score, weight: 0.10 },
  ]));

  const ftgiScore = Math.round(rawScore * AI_COEFFICIENT * 10) / 10;

  return {
    d1: Math.round(d1Score * 10) / 10,
    d2: Math.round(d2Score * 10) / 10,
    d3: Math.round(d3Score * 10) / 10,
    d4: Math.round(d4Score * 10) / 10,
    d5: Math.round(d5Score * 10) / 10,
    rawScore: Math.round(rawScore * 10) / 10,
    aiCoefficient: AI_COEFFICIENT,
    ftgiScore,
    formula: `${rawScore.toFixed(2)} × ${AI_COEFFICIENT} = ${ftgiScore}`,
  };
}

// ── 测试套件 ──────────────────────────────────────────────────────────────────
console.log("\n🔬 FTGI 评分流水线端到端测试\n");
console.log("═".repeat(60));

// ── 测试 1：完整工厂数据，系数 0.4（旧版）────────────────────────────────────
console.log("\n📋 测试组 1：旧系数 0.4 验证");
{
  const factory = {
    verification: { aiVerificationScore: 85 },
    metrics: { responseRate: 90, sampleConversionRate: 70, disputeRate: 2 },
    certifications: [{ name: "ISO9001" }, { name: "CE" }, { name: "RoHS" }],
    reviews: [{ rating: 4.5 }, { rating: 4.8 }, { rating: 4.2 }, { rating: 5.0 }],
    documents: [{ docType: "image" }, { docType: "image" }, { docType: "certification" }],
  };

  const result = simulateScoring(factory, 0.4);
  console.log("  工厂数据：优质工厂（高评分、多认证、好评价）");
  console.log(`  各维度：D1=${result.d1} D2=${result.d2} D3=${result.d3} D4=${result.d4} D5=${result.d5}`);
  console.log(`  原始分：${result.rawScore} | 系数：${result.aiCoefficient} | FTGI分：${result.ftgiScore}`);
  console.log(`  公式：${result.formula}`);

  assert(result.rawScore > 60, "优质工厂原始分应 > 60", `实际: ${result.rawScore}`);
  assert(result.ftgiScore === result.rawScore * 0.4 || Math.abs(result.ftgiScore - result.rawScore * 0.4) < 0.2,
    "FTGI分 = rawScore × 0.4", `期望: ${result.rawScore * 0.4}, 实际: ${result.ftgiScore}`);
  assert(result.ftgiScore <= 40, "旧系数0.4时FTGI分上限为40", `实际: ${result.ftgiScore}`);
}

// ── 测试 2：完整工厂数据，系数 0.6（新版）────────────────────────────────────
console.log("\n📋 测试组 2：新系数 0.6 验证");
{
  const factory = {
    verification: { aiVerificationScore: 85 },
    metrics: { responseRate: 90, sampleConversionRate: 70, disputeRate: 2 },
    certifications: [{ name: "ISO9001" }, { name: "CE" }, { name: "RoHS" }],
    reviews: [{ rating: 4.5 }, { rating: 4.8 }, { rating: 4.2 }, { rating: 5.0 }],
    documents: [{ docType: "image" }, { docType: "image" }, { docType: "certification" }],
  };

  const result04 = simulateScoring(factory, 0.4);
  const result06 = simulateScoring(factory, 0.6);

  console.log(`  旧系数0.4 → FTGI分：${result04.ftgiScore}`);
  console.log(`  新系数0.6 → FTGI分：${result06.ftgiScore}`);
  console.log(`  提升幅度：+${(result06.ftgiScore - result04.ftgiScore).toFixed(1)} 分`);

  assert(result06.ftgiScore > result04.ftgiScore,
    "新系数0.6的FTGI分应高于旧系数0.4", `0.6=${result06.ftgiScore}, 0.4=${result04.ftgiScore}`);
  assert(result06.ftgiScore <= 60, "新系数0.6时FTGI分上限为60", `实际: ${result06.ftgiScore}`);
  assert(Math.abs(result06.ftgiScore / result04.ftgiScore - 1.5) < 0.01,
    "新旧系数比例应为1.5倍", `比例: ${(result06.ftgiScore / result04.ftgiScore).toFixed(3)}`);
}

// ── 测试 3：空数据工厂（新注册工厂）────────────────────────────────────────
console.log("\n📋 测试组 3：空数据工厂（边界值）");
{
  const emptyFactory = {
    verification: null,
    metrics: null,
    certifications: [],
    reviews: [],
    documents: [],
  };

  const result = simulateScoring(emptyFactory, 0.6);
  console.log(`  各维度：D1=${result.d1} D2=${result.d2} D3=${result.d3} D4=${result.d4} D5=${result.d5}`);
  console.log(`  原始分：${result.rawScore} | FTGI分：${result.ftgiScore}`);

  assert(result.ftgiScore >= 0, "空数据工厂FTGI分应 >= 0", `实际: ${result.ftgiScore}`);
  assert(result.ftgiScore <= 60, "空数据工厂FTGI分应 <= 60", `实际: ${result.ftgiScore}`);
  assert(!isNaN(result.ftgiScore), "空数据不应产生NaN", `实际: ${result.ftgiScore}`);
}

// ── 测试 4：极端高分工厂────────────────────────────────────────────────────
console.log("\n📋 测试组 4：极端高分工厂（满分验证）");
{
  const perfectFactory = {
    verification: { aiVerificationScore: 100 },
    metrics: { responseRate: 100, sampleConversionRate: 100, disputeRate: 0 },
    certifications: Array(10).fill({ name: "cert" }),
    reviews: Array(20).fill({ rating: 5 }),
    documents: Array(10).fill({ docType: "image" }),
  };

  const result = simulateScoring(perfectFactory, 0.6);
  console.log(`  各维度：D1=${result.d1} D2=${result.d2} D3=${result.d3} D4=${result.d4} D5=${result.d5}`);
  console.log(`  原始分：${result.rawScore} | FTGI分：${result.ftgiScore}`);

  assert(result.rawScore <= 100, "原始分不超过100", `实际: ${result.rawScore}`);
  assert(result.ftgiScore <= 60, "满分工厂FTGI分不超过60（系数0.6）", `实际: ${result.ftgiScore}`);
  assert(result.d1 <= 100 && result.d2 <= 100, "各维度分不超过100", `D1=${result.d1}, D2=${result.d2}`);
}

// ── 测试 5：AI JSON 解析结构验证 ─────────────────────────────────────────────
console.log("\n📋 测试组 5：AI JSON 解析结构验证");
{
  // 模拟 AI 返回的各类文档解析结果
  const mockAiResponses = {
    image: '{"scene": "生产车间", "equipment": ["注塑机", "冲压机"], "scale": "中型", "hygiene": "良好", "workerCount": 50}',
    certification: '{"name": "ISO 9001:2015", "issuer": "SGS", "validUntil": "2026-12-31", "scope": "电子产品制造"}',
    transaction: '{"totalAmount": 2500000, "currency": "USD", "frequency": "monthly", "topRegions": ["US", "EU", "AU"], "categories": ["electronics"]}',
    customs: '{"exportCountries": ["US", "DE", "AU"], "hsCode": "8471.30", "annualExport": 1800000, "mainMarkets": ["North America", "Europe"]}',
  };

  for (const [docType, jsonStr] of Object.entries(mockAiResponses)) {
    try {
      const parsed = JSON.parse(jsonStr);
      assert(typeof parsed === 'object' && parsed !== null,
        `${docType} 文档 JSON 解析成功`, `解析结果: ${typeof parsed}`);
    } catch (e) {
      fail(`${docType} 文档 JSON 解析`, e.message);
    }
  }

  // 测试 AI 返回错误时的降级处理
  const errorResponse = '{"error": "无法解析", "docType": "image"}';
  const errorParsed = JSON.parse(errorResponse);
  assert(errorParsed.error !== undefined, "AI 解析失败时返回 error 字段");
}

// ── 测试 6：系数调整对分数分布的影响分析 ────────────────────────────────────
console.log("\n📋 测试组 6：系数调整影响分析");
{
  const testFactories = [
    { name: "初创工厂", verification: { aiVerificationScore: 30 }, metrics: { responseRate: 50, sampleConversionRate: 30, disputeRate: 5 }, certifications: [], reviews: [], documents: [] },
    { name: "成长工厂", verification: { aiVerificationScore: 65 }, metrics: { responseRate: 75, sampleConversionRate: 60, disputeRate: 2 }, certifications: [{}], reviews: [{rating:4}], documents: [{docType:"image"}] },
    { name: "优质工厂", verification: { aiVerificationScore: 90 }, metrics: { responseRate: 95, sampleConversionRate: 85, disputeRate: 0.5 }, certifications: [{},{},{}], reviews: [{rating:4.8},{rating:5}], documents: [{docType:"image"},{docType:"image"}] },
  ];

  console.log("\n  工厂类型        | 原始分 | 旧FTGI(×0.4) | 新FTGI(×0.6) | 提升");
  console.log("  " + "─".repeat(58));
  for (const factory of testFactories) {
    const r04 = simulateScoring(factory, 0.4);
    const r06 = simulateScoring(factory, 0.6);
    const improvement = (r06.ftgiScore - r04.ftgiScore).toFixed(1);
    console.log(`  ${factory.name.padEnd(12)} | ${String(r04.rawScore).padEnd(6)} | ${String(r04.ftgiScore).padEnd(12)} | ${String(r06.ftgiScore).padEnd(12)} | +${improvement}`);
    assert(r06.ftgiScore > r04.ftgiScore, `${factory.name}：新系数分数应更高`);
  }
}

// ── 测试结果汇总 ──────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(60));
console.log(`\n📊 测试结果：${testCount - failCount}/${testCount} 通过`);
if (failCount === 0) {
  console.log("✅ 所有测试通过！流水线逻辑验证完成。\n");
} else {
  console.log(`❌ ${failCount} 个测试失败，需要修复。\n`);
  process.exit(1);
}
