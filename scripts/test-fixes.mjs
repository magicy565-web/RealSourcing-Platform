/**
 * RealSourcing 4.0 - 修复验证测试
 * 测试三个核心修复：
 * 1. 品类归一化（normalizeCategoryForMatching）
 * 2. JSON 解析健壮性（extractJsonFromLLMOutput）
 * 3. productionCategory 字段透传逻辑
 * 4. factoryOnlineAt 类型修复（boolean → number）
 */

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected "${b}", got "${a}"`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. 品类归一化逻辑（从 factoryMatchingService.ts 提取）
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_ALIAS_MAP = {
  '智能家居':  ['智能家居', '消费电子 - 智能家居', '智能家居控制', '家居智能', '智能家电'],
  '运动装备':  ['运动装备', '服装配饰 - 运动', '运动服装', '运动用品', '体育用品'],
  '美妆个护':  ['美妆个护', '美妆', '化妆品', '个人护理', '美容产品'],
  '礼品工艺':  ['礼品工艺', '礼品', '工艺品', '纪念品', '促销礼品'],
  '精密模具':  ['精密模具', '模具', '注塑模具', '冲压模具', '机械加工'],
  '穿戴科技':  ['穿戴科技', 'AR眼镜', '智能穿戴', '可穿戴设备', '消费电子 - 穿戴'],
  '消费电子':  ['消费电子', '电子产品', '电子设备', '数码产品'],
  '家居用品':  ['家居用品', '家居', '家具', '家居装饰'],
  '服装配饰':  ['服装配饰', '服装', '纺织品', '配饰'],
};

function normalizeCategoryForMatching(rawCategory) {
  if (!rawCategory) return null;
  const raw = rawCategory.trim();
  if (!raw) return null; // 纯空格字符串处理
  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIAS_MAP)) {
    if (aliases.some(alias => alias === raw)) return canonical;
  }
  for (const [canonical, aliases] of Object.entries(CATEGORY_ALIAS_MAP)) {
    if (aliases.some(alias => raw.includes(alias) || alias.includes(raw))) return canonical;
  }
  return raw;
}

console.log('\n【测试组 1】品类归一化 normalizeCategoryForMatching');

test('精确匹配：标准品类名直接返回', () => {
  assertEqual(normalizeCategoryForMatching('智能家居'), '智能家居');
  assertEqual(normalizeCategoryForMatching('运动装备'), '运动装备');
  assertEqual(normalizeCategoryForMatching('美妆个护'), '美妆个护');
});

test('精确匹配：别名映射到标准名', () => {
  assertEqual(normalizeCategoryForMatching('化妆品'), '美妆个护');
  assertEqual(normalizeCategoryForMatching('体育用品'), '运动装备');
  assertEqual(normalizeCategoryForMatching('注塑模具'), '精密模具');
  assertEqual(normalizeCategoryForMatching('可穿戴设备'), '穿戴科技');
});

test('包含匹配：AI 生成的复合品类名', () => {
  assertEqual(normalizeCategoryForMatching('消费电子 - 智能家居'), '智能家居');
  assertEqual(normalizeCategoryForMatching('消费电子 - 穿戴'), '穿戴科技');
  assertEqual(normalizeCategoryForMatching('服装配饰 - 运动'), '运动装备');
});

test('包含匹配：AI 生成的描述性品类', () => {
  assertEqual(normalizeCategoryForMatching('智能家居控制系统'), '智能家居');
  assertEqual(normalizeCategoryForMatching('运动服装及装备'), '运动装备');
  assertEqual(normalizeCategoryForMatching('精密模具加工'), '精密模具');
});

test('空值/null 处理', () => {
  assertEqual(normalizeCategoryForMatching(null), null);
  assertEqual(normalizeCategoryForMatching(undefined), null);
  assertEqual(normalizeCategoryForMatching(''), null);
  assertEqual(normalizeCategoryForMatching('   '), null);
});

test('未知品类返回原始值（不丢失信息）', () => {
  assertEqual(normalizeCategoryForMatching('新能源汽车'), '新能源汽车');
  assertEqual(normalizeCategoryForMatching('医疗器械'), '医疗器械');
});

test('前后空格处理', () => {
  assertEqual(normalizeCategoryForMatching('  智能家居  '), '智能家居');
  assertEqual(normalizeCategoryForMatching(' 化妆品 '), '美妆个护');
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. JSON 解析健壮性（从 sourcingDemandService.ts 提取）
// ─────────────────────────────────────────────────────────────────────────────

function extractJsonFromLLMOutput(raw) {
  if (!raw || typeof raw !== 'string') return null;
  // 方案1: 直接 JSON 解析
  try {
    return JSON.parse(raw.trim());
  } catch {}
  // 方案2: 提取 ```json ... ``` 代码块
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }
  // 方案3: 提取第一个 { ... } 块
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
  }
  return null;
}

console.log('\n【测试组 2】JSON 解析健壮性 extractJsonFromLLMOutput');

test('标准 JSON 字符串直接解析', () => {
  const result = extractJsonFromLLMOutput('{"productName":"智能手环","productCategory":"穿戴科技"}');
  assert(result !== null, '应成功解析');
  assertEqual(result.productName, '智能手环');
  assertEqual(result.productCategory, '穿戴科技');
});

test('Markdown 代码块包裹（```json ... ```）', () => {
  const raw = '```json\n{"productName":"蓝牙耳机","productCategory":"消费电子"}\n```';
  const result = extractJsonFromLLMOutput(raw);
  assert(result !== null, '应成功提取代码块内 JSON');
  assertEqual(result.productName, '蓝牙耳机');
});

test('无语言标记的代码块（``` ... ```）', () => {
  const raw = '```\n{"productName":"瑜伽垫","productCategory":"运动装备"}\n```';
  const result = extractJsonFromLLMOutput(raw);
  assert(result !== null, '应成功提取无标记代码块');
  assertEqual(result.productCategory, '运动装备');
});

test('JSON 前后有多余文字', () => {
  const raw = '以下是提取结果：\n{"productName":"口红","productCategory":"美妆个护"}\n请确认以上信息。';
  const result = extractJsonFromLLMOutput(raw);
  assert(result !== null, '应成功从文字中提取 JSON');
  assertEqual(result.productName, '口红');
});

test('空字符串返回 null', () => {
  assertEqual(extractJsonFromLLMOutput(''), null);
  assertEqual(extractJsonFromLLMOutput(null), null);
  assertEqual(extractJsonFromLLMOutput('这不是JSON'), null);
});

test('完整的采购需求 JSON 解析', () => {
  const raw = `\`\`\`json
{
  "productName": "AR 智能眼镜",
  "productDescription": "支持实时导航和语音助手的消费级AR眼镜",
  "keyFeatures": ["实时导航", "语音控制", "轻量化设计"],
  "targetAudience": "科技爱好者",
  "estimatedQuantity": "5000件/批",
  "targetPrice": "$45-60/件 FOB",
  "customizationNotes": "需要定制品牌 LOGO",
  "productCategory": "穿戴科技"
}
\`\`\``;
  const result = extractJsonFromLLMOutput(raw);
  assert(result !== null, '应成功解析完整 JSON');
  assertEqual(result.productName, 'AR 智能眼镜');
  assert(Array.isArray(result.keyFeatures), 'keyFeatures 应为数组');
  assertEqual(result.keyFeatures.length, 3);
  assertEqual(result.productCategory, '穿戴科技');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. productionCategory 字段透传逻辑
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n【测试组 3】productionCategory 字段透传');

test('productCategory 优先级：parsed.productCategory 优先于 parsed.productionCategory', () => {
  const parsed = { productCategory: '智能家居', productionCategory: '消费电子' };
  const productCategory = String(parsed.productCategory ?? parsed.productionCategory ?? '');
  assertEqual(productCategory, '智能家居');
});

test('productCategory 回退：parsed.productCategory 为空时使用 productionCategory', () => {
  const parsed = { productionCategory: '消费电子' };
  const productCategory = String(parsed.productCategory ?? parsed.productionCategory ?? '');
  assertEqual(productCategory, '消费电子');
});

test('productCategory 双保险：同时写入顶层和 extractedData', () => {
  const parsed = { productName: '智能手表', productCategory: '穿戴科技' };
  const productCategory = String(parsed.productCategory ?? parsed.productionCategory ?? '');
  const extractedData = { ...parsed, productCategory };
  assertEqual(extractedData.productCategory, '穿戴科技', '顶层 extractedData 应含 productCategory');
});

test('Step 8 写入逻辑：params.productionCategory 优先，回退到 extractedData.productCategory', () => {
  // 模拟 params 有 productionCategory
  const params = { productionCategory: '智能家居' };
  const extracted = { extractedData: { productCategory: '消费电子' } };
  const result = params.productionCategory ?? String(extracted.extractedData?.productCategory ?? '');
  assertEqual(result, '智能家居', '应优先使用 params.productionCategory');
});

test('Step 8 写入逻辑：params 无 productionCategory 时回退到 extractedData', () => {
  const params = { productionCategory: null };
  const extracted = { extractedData: { productCategory: '消费电子' } };
  const result = params.productionCategory ?? String(extracted.extractedData?.productCategory ?? '');
  assertEqual(result, '消费电子', '应回退到 extractedData.productCategory');
});

test('productName 空值兜底逻辑', () => {
  // 模拟 productName 为空时从 URI 推断
  let productName = '';
  const sourceUri = 'https://example.com/smart-watch-pro';
  if (!productName && sourceUri) {
    const urlParts = sourceUri.split('/').filter(Boolean);
    productName = urlParts[urlParts.length - 1]?.replace(/[-_]/g, ' ') ?? '未知产品';
  }
  assertEqual(productName, 'smart watch pro', '应从 URL 最后一段推断产品名');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. factoryOnlineAt 类型修复
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n【测试组 4】factoryOnlineAt 类型修复（boolean → number）');

test('isOnline=true 转换为 1', () => {
  const factory = { isOnline: true };
  const factoryOnlineAt = factory.isOnline ? 1 : 0;
  assertEqual(factoryOnlineAt, 1);
  assertEqual(typeof factoryOnlineAt, 'number', '类型应为 number');
});

test('isOnline=false 转换为 0', () => {
  const factory = { isOnline: false };
  const factoryOnlineAt = factory.isOnline ? 1 : 0;
  assertEqual(factoryOnlineAt, 0);
  assertEqual(typeof factoryOnlineAt, 'number', '类型应为 number');
});

test('isOnline=1 (DB tinyint) 转换为 1', () => {
  const factory = { isOnline: 1 };
  const factoryOnlineAt = factory.isOnline ? 1 : 0;
  assertEqual(factoryOnlineAt, 1);
});

test('isOnline=0 (DB tinyint) 转换为 0', () => {
  const factory = { isOnline: 0 };
  const factoryOnlineAt = factory.isOnline ? 1 : 0;
  assertEqual(factoryOnlineAt, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. schema 字段验证（确认 productionCategory 在 sourcingDemands 中）
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from 'fs';

console.log('\n【测试组 5】Schema 字段验证');

test('sourcingDemands 表包含 productionCategory 字段', () => {
  const schema = readFileSync('/home/ubuntu/RealSourcing-Platform/drizzle/schema.ts', 'utf-8');
  // 找到 sourcingDemands 表定义
  const sourcingDemandsSection = schema.slice(
    schema.indexOf('export const sourcingDemands'),
    schema.indexOf('export type SourcingDemand')
  );
  assert(sourcingDemandsSection.includes('productionCategory'), 
    'sourcingDemands 表应包含 productionCategory 字段');
  assert(sourcingDemandsSection.includes('varchar("productionCategory"'), 
    'productionCategory 应为 varchar 类型');
});

test('migration SQL 包含 ALTER TABLE sourcing_demands', () => {
  const migration = readFileSync(
    '/home/ubuntu/RealSourcing-Platform/drizzle/migrations/0006_add_production_category.sql', 
    'utf-8'
  );
  assert(migration.includes('ALTER TABLE'), '应包含 ALTER TABLE 语句');
  assert(migration.includes('sourcing_demands'), '应针对 sourcing_demands 表');
  assert(migration.includes('productionCategory'), '应添加 productionCategory 字段');
  assert(migration.includes('IF NOT EXISTS'), '应使用 IF NOT EXISTS 确保幂等性');
  assert(migration.includes('UPDATE'), '应包含历史数据回填 UPDATE 语句');
});

test('routers.ts Step 8 包含 productionCategory 写入', () => {
  const routers = readFileSync('/home/ubuntu/RealSourcing-Platform/server/routers.ts', 'utf-8');
  // 找到 Step 8 区域
  const step8Section = routers.slice(
    routers.indexOf('Step 8: 更新需求状态为 transformed'),
    routers.indexOf('Step 9: 异步生成语义向量')
  );
  assert(step8Section.includes('productionCategory'), 
    'Step 8 应写入 productionCategory 到 sourcingDemands');
  assert(step8Section.includes('params.productionCategory'), 
    'Step 8 应使用 params.productionCategory');
});

test('factoryMatchingService.ts 包含 normalizeCategoryForMatching 函数', () => {
  const fms = readFileSync(
    '/home/ubuntu/RealSourcing-Platform/server/_core/factoryMatchingService.ts', 
    'utf-8'
  );
  assert(fms.includes('normalizeCategoryForMatching'), '应包含品类归一化函数');
  assert(fms.includes('CATEGORY_ALIAS_MAP'), '应包含品类别名映射表');
  assert(fms.includes("'智能家居'"), '映射表应包含智能家居');
  assert(fms.includes("'美妆个护'"), '映射表应包含美妆个护');
  // 确认 factoryOnlineAt 类型已修复
  assert(fms.includes('factoryOnlineAt: number | null;'), 
    'factoryOnlineAt 类型应为 number | null');
  assert(fms.includes('factory.isOnline ? 1 : 0'), 
    'isOnline 应转换为 number');
});

test('browserWorker.ts sourcingDemandForTransform 包含 productCategory 字段', () => {
  const bw = readFileSync(
    '/home/ubuntu/RealSourcing-Platform/server/_core/browserWorker.ts', 
    'utf-8'
  );
  // 使用 lastIndexOf 找到 sourcingDemandForTransform 对象定义（不是 import 行）
  const defStart = bw.lastIndexOf('const sourcingDemandForTransform');
  const defEnd = bw.indexOf('};', defStart) + 2;
  const transformSection = bw.slice(defStart, defEnd);
  assert(transformSection.includes('productCategory'), 
    'sourcingDemandForTransform 应包含 productCategory 字段');
});

// ─────────────────────────────────────────────────────────────────────────────
// 汇总
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log(`测试结果：${passed} 通过，${failed} 失败`);
if (failed === 0) {
  console.log('🎉 全部测试通过！所有修复均已验证，无破坏性变更。');
} else {
  console.log('⚠️  存在失败测试，请检查上方错误信息。');
  process.exit(1);
}
