-- ============================================================
-- RealSourcing FTGI 五维评分差异化微调脚本
-- 版本: v1.0
-- 日期: 2026-02-22
-- 描述: 根据各工厂的核心竞争优势，手动微调 factory_ftgi_scores
--       表中的五维原始分（D1-D5），使雷达图形状各具特色，
--       体现差异化的工厂画像。
--
-- 五维定义：
--   D1 (d1_trust)       - 基础信任：AI验厂分、合规认证、经营年限
--   D2 (d2_fulfillment) - 敏捷交付：响应率、样品转化、纠纷率
--   D3 (d3_market)      - 市场洞察：产品视频、内容营销、市场覆盖
--   D4 (d4_ecosystem)   - 生态协作：电商平台集成、数字化程度
--   D5 (d5_community)   - 社区验证：买家评价数量、好评率
-- ============================================================

-- ── 1. 广州极联智能科技有限公司 (ID: 10) ─────────────────────
--    核心优势：生态协作（D4）— 深度集成 Alexa/Google/HomeKit 三大平台
--    调整策略：调高 D4（生态协作）至 92，体现智能家居生态整合能力
UPDATE `factory_ftgi_scores`
SET
  `d1_trust`       = 88.00,   -- 基础信任：保持（12年经验，ISO9001）
  `d2_fulfillment` = 86.00,   -- 敏捷交付：小幅提升（响应率96.5%）
  `d3_market`      = 80.00,   -- 市场洞察：小幅提升（8条产品视频）
  `d4_ecosystem`   = 92.00,   -- 生态协作：★ 调高（三协议智能家居生态）
  `d5_community`   = 82.00,   -- 社区验证：保持（89条好评）
  `raw_score`      = ROUND((88.00 + 86.00 + 80.00 + 92.00 + 82.00) / 5, 2),
  `ftgi_score`     = ROUND(((88.00 + 86.00 + 80.00 + 92.00 + 82.00) / 5) * 0.60, 2),
  `scoreDetails`   = JSON_SET(
    COALESCE(`scoreDetails`, '{}'),
    '$.d1_detail', 'AI验厂分88，合规分85，12年出口经验',
    '$.d2_detail', '响应率96.5%，样品转化率67.4%，纠纷率0.85%',
    '$.d3_detail', '8条产品视频，市场内容丰富',
    '$.d4_detail', '★ 核心优势：集成Alexa/Google Home/Apple HomeKit三大生态，支持128设备',
    '$.d5_detail', '89条买家评价，好评率96%',
    '$.tune_note', '2026-02-22 差异化微调：调高D4生态协作至92'
  ),
  `updatedAt`      = NOW()
WHERE `factoryId` = 10;

-- ── 2. 深圳立秀运动科技有限公司 (ID: 11) ─────────────────────
--    核心优势：市场洞察（D3）— 专注女性运动市场，精准品类定位
--    调整策略：调高 D3（市场洞察）至 88，体现运动服装市场敏锐度
UPDATE `factory_ftgi_scores`
SET
  `d1_trust`       = 82.00,   -- 基础信任：保持（15年经验，ISO9001）
  `d2_fulfillment` = 85.00,   -- 敏捷交付：保持（响应率94.2%）
  `d3_market`      = 88.00,   -- 市场洞察：★ 调高（女性运动市场深度洞察）
  `d4_ecosystem`   = 68.00,   -- 生态协作：小幅提升（ERP已接入）
  `d5_community`   = 76.00,   -- 社区验证：保持（67条买家评价）
  `raw_score`      = ROUND((82.00 + 85.00 + 88.00 + 68.00 + 76.00) / 5, 2),
  `ftgi_score`     = ROUND(((82.00 + 85.00 + 88.00 + 68.00 + 76.00) / 5) * 0.60, 2),
  `scoreDetails`   = JSON_SET(
    COALESCE(`scoreDetails`, '{}'),
    '$.d1_detail', 'AI验厂分82，合规分80，15年制造经验',
    '$.d2_detail', '响应率94.2%，样品转化率58.9%',
    '$.d3_detail', '★ 核心优势：专注女性瑜伽/运动服市场，ODM能力强，快速跟进流行趋势',
    '$.d4_detail', 'ERP系统已接入，数字化程度中等',
    '$.d5_detail', '67条买家评价，好评率91%',
    '$.tune_note', '2026-02-22 差异化微调：调高D3市场洞察至88'
  ),
  `updatedAt`      = NOW()
WHERE `factoryId` = 11;

-- ── 3. 上海鸿毅实业有限公司 (ID: 12) ──────────────────────────
--    核心优势：基础信任（D1）— GMP认证、FDA注册、19年经验
--    调整策略：调高 D1（基础信任）至 97，体现美妆行业最高合规标准
UPDATE `factory_ftgi_scores`
SET
  `d1_trust`       = 97.00,   -- 基础信任：★ 调高（GMP+FDA+ISO22716三重认证）
  `d2_fulfillment` = 96.00,   -- 敏捷交付：保持（响应率98.1%）
  `d3_market`      = 88.00,   -- 市场洞察：保持（12条专业产品视频）
  `d4_ecosystem`   = 85.00,   -- 生态协作：保持（完整数字化供应链）
  `d5_community`   = 92.00,   -- 社区验证：保持（134条好评）
  `raw_score`      = ROUND((97.00 + 96.00 + 88.00 + 85.00 + 92.00) / 5, 2),
  `ftgi_score`     = ROUND(((97.00 + 96.00 + 88.00 + 85.00 + 92.00) / 5) * 0.60, 2),
  `scoreDetails`   = JSON_SET(
    COALESCE(`scoreDetails`, '{}'),
    '$.d1_detail', '★ 核心优势：GMP认证+FDA注册+ISO22716三重认证，合规分93，19年经验',
    '$.d2_detail', '响应率98.1%，样品转化率78.7%，纠纷率0.34%',
    '$.d3_detail', '12条产品视频，内容专业',
    '$.d4_detail', '完整数字化供应链',
    '$.d5_detail', '134条买家评价，好评率98%',
    '$.tune_note', '2026-02-22 差异化微调：调高D1基础信任至97'
  ),
  `updatedAt`      = NOW()
WHERE `factoryId` = 12;

-- ── 4. 东莞市源杰工艺礼品有限公司 (ID: 13) ────────────────────
--    核心优势：社区验证（D5）— 全球品牌定制礼品，口碑传播强
--    调整策略：调高 D5（社区验证）至 82，体现礼品行业口碑效应
UPDATE `factory_ftgi_scores`
SET
  `d1_trust`       = 72.00,   -- 基础信任：保持（9年经验，ISO9001）
  `d2_fulfillment` = 76.00,   -- 敏捷交付：小幅提升（响应率91.8%）
  `d3_market`      = 65.00,   -- 市场洞察：小幅提升（礼品定制内容）
  `d4_ecosystem`   = 58.00,   -- 生态协作：保持（数字化程度较低）
  `d5_community`   = 82.00,   -- 社区验证：★ 调高（全球品牌口碑传播）
  `raw_score`      = ROUND((72.00 + 76.00 + 65.00 + 58.00 + 82.00) / 5, 2),
  `ftgi_score`     = ROUND(((72.00 + 76.00 + 65.00 + 58.00 + 82.00) / 5) * 0.60, 2),
  `scoreDetails`   = JSON_SET(
    COALESCE(`scoreDetails`, '{}'),
    '$.d1_detail', 'AI验厂分72，合规分70，9年经验',
    '$.d2_detail', '响应率91.8%，样品转化率44.4%',
    '$.d3_detail', '礼品定制内容营销，3条产品视频',
    '$.d4_detail', '数字化程度较低，正在升级',
    '$.d5_detail', '★ 核心优势：服务全球知名品牌，口碑传播强，45条买家评价好评率93%',
    '$.tune_note', '2026-02-22 差异化微调：调高D5社区验证至82'
  ),
  `updatedAt`      = NOW()
WHERE `factoryId` = 13;

-- ── 5. 宁波PM模具有限公司 (ID: 14) ────────────────────────────
--    核心优势：敏捷交付（D2）— 精密模具快速打样，交期精准
--    调整策略：调高 D2（敏捷交付）至 95，体现精密制造的高效交付
UPDATE `factory_ftgi_scores`
SET
  `d1_trust`       = 90.00,   -- 基础信任：保持（IATF16949，21年经验）
  `d2_fulfillment` = 95.00,   -- 敏捷交付：★ 调高（精密模具快速打样，纠纷率0.56%）
  `d3_market`      = 68.00,   -- 市场洞察：保持（2条产品视频）
  `d4_ecosystem`   = 80.00,   -- 生态协作：小幅提升（精密制造数字化）
  `d5_community`   = 80.00,   -- 社区验证：保持（28条专业买家评价）
  `raw_score`      = ROUND((90.00 + 95.00 + 68.00 + 80.00 + 80.00) / 5, 2),
  `ftgi_score`     = ROUND(((90.00 + 95.00 + 68.00 + 80.00 + 80.00) / 5) * 0.60, 2),
  `scoreDetails`   = JSON_SET(
    COALESCE(`scoreDetails`, '{}'),
    '$.d1_detail', 'AI验厂分90，IATF16949认证，21年经验',
    '$.d2_detail', '★ 核心优势：精密模具快速打样，响应率97.3%，样品转化率82.4%，纠纷率0.56%',
    '$.d3_detail', '2条产品视频，内容待丰富',
    '$.d4_detail', '精密制造数字化程度高，ERP+CAD/CAM集成',
    '$.d5_detail', '28条专业买家评价，好评率96%',
    '$.tune_note', '2026-02-22 差异化微调：调高D2敏捷交付至95'
  ),
  `updatedAt`      = NOW()
WHERE `factoryId` = 14;

-- ── 6. 杭州灵伴科技有限公司 (ID: 15) ──────────────────────────
--    核心优势：五维均衡型 — 新兴科技公司，各维度均衡发展
--    调整策略：全面提升各维度至均衡水平（72-78），体现科技创新潜力
UPDATE `factory_ftgi_scores`
SET
  `d1_trust`       = 72.00,   -- 基础信任：小幅提升（CE认证，成长中）
  `d2_fulfillment` = 74.00,   -- 敏捷交付：小幅提升（响应率88.5%）
  `d3_market`      = 78.00,   -- 市场洞察：★ 提升（AR眼镜市场前沿洞察）
  `d4_ecosystem`   = 76.00,   -- 生态协作：★ 提升（AI+AR技术生态整合）
  `d5_community`   = 70.00,   -- 社区验证：小幅提升（12条评价，成长中）
  `raw_score`      = ROUND((72.00 + 74.00 + 78.00 + 76.00 + 70.00) / 5, 2),
  `ftgi_score`     = ROUND(((72.00 + 74.00 + 78.00 + 76.00 + 70.00) / 5) * 0.60, 2),
  `scoreDetails`   = JSON_SET(
    COALESCE(`scoreDetails`, '{}'),
    '$.d1_detail', 'AI验厂分65→72，CE认证，6年经验，快速成长中',
    '$.d2_detail', '响应率88.5%，样品转化率38.9%，持续改善中',
    '$.d3_detail', '★ AR眼镜市场前沿洞察，4条创意产品视频，科技媒体曝光度高',
    '$.d4_detail', '★ AI+AR技术生态整合能力强，与主流AI平台深度合作',
    '$.d5_detail', '12条买家评价，好评率83%，新兴品牌成长中',
    '$.tune_note', '2026-02-22 差异化微调：五维均衡型，调高D3/D4体现科技潜力'
  ),
  `updatedAt`      = NOW()
WHERE `factoryId` = 15;

-- ── 同步更新工厂综合评分（overallScore）────────────────────────
-- 基于新的 FTGI 分数重新计算 overallScore（满分5分制）
UPDATE `factories` f
JOIN `factory_ftgi_scores` fs ON f.id = fs.factoryId
JOIN `factory_human_scores` hs ON f.id = hs.factoryId
SET f.overallScore = ROUND((fs.ftgi_score + hs.ftgi_contribution) / 100 * 5, 2)
WHERE f.id IN (10, 11, 12, 13, 14, 15);

-- ── 验证更新结果 ──────────────────────────────────────────────
SELECT '=== FTGI 差异化评分验证 ===' AS info;

SELECT
  f.id,
  f.name                            AS factory_name,
  fs.d1_trust                       AS D1_基础信任,
  fs.d2_fulfillment                 AS D2_敏捷交付,
  fs.d3_market                      AS D3_市场洞察,
  fs.d4_ecosystem                   AS D4_生态协作,
  fs.d5_community                   AS D5_社区验证,
  fs.raw_score                      AS 原始均分,
  fs.ftgi_score                     AS FTGI贡献分,
  hs.ftgi_contribution              AS 人工贡献分,
  ROUND(fs.ftgi_score + hs.ftgi_contribution, 2) AS 总FTGI分,
  f.overallScore                    AS 综合评分_5分制
FROM `factories` f
JOIN `factory_ftgi_scores` fs ON f.id = fs.factoryId
JOIN `factory_human_scores` hs ON f.id = hs.factoryId
WHERE f.id IN (10, 11, 12, 13, 14, 15)
ORDER BY f.id;
