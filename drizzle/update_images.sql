-- ============================================================
-- RealSourcing 工厂封面图更新脚本
-- 版本: v1.1
-- 日期: 2026-02-22
-- 描述: 将 6 家演示工厂的封面图更新为差异化的行业匹配图片。
--       图片已规范化为 800x600 WebP 格式，按工厂 ID 命名。
--
-- 执行说明：
--   1. 如果 factories 表尚无 coverImage 字段，先执行 Step 1
--   2. 如果 factories 表已有 coverImage 字段，直接执行 Step 2
--   3. 同时更新 logo 字段作为备用封面图（前端回退机制）
-- ============================================================

-- ── Step 1: 确保 factories 表有 coverImage 字段（幂等操作）──────
-- 注意：如果字段已存在，此语句会报错，可安全忽略
ALTER TABLE `factories`
  ADD COLUMN IF NOT EXISTS `coverImage` VARCHAR(500) COMMENT '工厂封面图路径';

-- ── Step 2: 更新 6 家演示工厂的封面图 ──────────────────────────

-- 1. 广州极联智能科技有限公司 (ID: 10)
--    行业：智能家居 | 图片：Geeklink 智能中控产品特写
UPDATE `factories`
SET
  `coverImage` = '/images/factories/factory_10_cover.webp',
  `logo`       = '/images/factories/factory_10_cover.webp',
  `updatedAt`  = NOW()
WHERE `id` = 10;

-- 2. 深圳立秀运动科技有限公司 (ID: 11)
--    行业：运动装备 | 图片：现代化服装缝纫流水线
UPDATE `factories`
SET
  `coverImage` = '/images/factories/factory_11_cover.webp',
  `logo`       = '/images/factories/factory_11_cover.webp',
  `updatedAt`  = NOW()
WHERE `id` = 11;

-- 3. 上海鸿毅实业有限公司 (ID: 12)
--    行业：美妆个护 | 图片：无尘化妆品灌装车间
UPDATE `factories`
SET
  `coverImage` = '/images/factories/factory_12_cover.webp',
  `logo`       = '/images/factories/factory_12_cover.webp',
  `updatedAt`  = NOW()
WHERE `id` = 12;

-- 4. 东莞市源杰工艺礼品有限公司 (ID: 13)
--    行业：礼品工艺 | 图片：金属徽章珐琅上色工艺细节
UPDATE `factories`
SET
  `coverImage` = '/images/factories/factory_13_cover.webp',
  `logo`       = '/images/factories/factory_13_cover.webp',
  `updatedAt`  = NOW()
WHERE `id` = 13;

-- 5. 宁波PM模具有限公司 (ID: 14)
--    行业：精密模具 | 图片：高精度 CNC 加工中心实拍
UPDATE `factories`
SET
  `coverImage` = '/images/factories/factory_14_cover.webp',
  `logo`       = '/images/factories/factory_14_cover.webp',
  `updatedAt`  = NOW()
WHERE `id` = 14;

-- 6. 杭州灵伴科技有限公司 (ID: 15)
--    行业：穿戴科技 | 图片：Rokid AR 眼镜产品场景图
UPDATE `factories`
SET
  `coverImage` = '/images/factories/factory_15_cover.webp',
  `logo`       = '/images/factories/factory_15_cover.webp',
  `updatedAt`  = NOW()
WHERE `id` = 15;

-- ── 验证更新结果 ──────────────────────────────────────────────
SELECT id, name, city, category, coverImage, logo
FROM `factories`
WHERE id IN (10, 11, 12, 13, 14, 15)
ORDER BY id;
