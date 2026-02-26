-- ─── Migration 0006: 为 sourcing_demands 表添加 productionCategory 字段 ────────
-- 
-- 背景：
--   factoryMatchingService 从 sourcingDemands 读取 demand.productionCategory 进行品类过滤，
--   但该字段此前只存在于 manufacturingParameters 表，导致 demandCategory 始终为 undefined，
--   品类过滤失效，匹配结果为 0。
--
-- 修复：
--   在 sourcing_demands 表添加 productionCategory 字段，
--   routers.ts Step 8 在保存 manufacturingParameters 后同步写入此字段。

ALTER TABLE `sourcing_demands`
  ADD COLUMN IF NOT EXISTS `productionCategory` VARCHAR(100) DEFAULT NULL
    COMMENT 'AI 提取的生产品类，与 factory_capability_embeddings.primaryCategory 对齐，用于匹配过滤';

-- 同步历史数据：从 manufacturing_parameters 表回填已有需求的品类
UPDATE `sourcing_demands` sd
  INNER JOIN `manufacturing_parameters` mp ON mp.demandId = sd.id
SET sd.productionCategory = mp.productionCategory
WHERE sd.productionCategory IS NULL
  AND mp.productionCategory IS NOT NULL
  AND mp.productionCategory != '';

-- 验证
-- SELECT id, productName, productionCategory FROM sourcing_demands WHERE productionCategory IS NOT NULL LIMIT 10;
