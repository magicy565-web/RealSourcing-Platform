-- ─────────────────────────────────────────────────────────────────────────────
-- RealSourcing 4.0 Migration: sourcing_demands 匹配状态字段
-- 解决问题：matchStatus 字段在 Drizzle Schema 中缺失
-- 执行时机：部署 4.0 版本前在 RDS 上执行一次
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. 为 sourcing_demands 表添加 4 个匹配状态字段
--    idle: 未触发匹配 | queued: 已入队 | processing: 匹配中 | completed: 完成 | failed: 失败
ALTER TABLE `sourcing_demands`
  ADD COLUMN IF NOT EXISTS `matchStatus`  VARCHAR(30)  NOT NULL DEFAULT 'idle'
    COMMENT 'idle|queued|processing|completed|failed'
    AFTER `embeddingAt`,
  ADD COLUMN IF NOT EXISTS `matchJobId`   VARCHAR(100) NULL
    COMMENT 'BullMQ job ID，用于轮询进度'
    AFTER `matchStatus`,
  ADD COLUMN IF NOT EXISTS `matchedAt`    DATETIME(3)  NULL
    COMMENT '最近一次匹配完成时间'
    AFTER `matchJobId`,
  ADD COLUMN IF NOT EXISTS `matchCount`   INT          NOT NULL DEFAULT 0
    COMMENT '累计触发匹配次数'
    AFTER `matchedAt`;

-- 2. 为高频查询字段添加索引
--    前端轮询 matchStatus，工厂端按 matchedAt 排序
CREATE INDEX IF NOT EXISTS `idx_sourcing_demands_matchStatus`
  ON `sourcing_demands` (`matchStatus`);

CREATE INDEX IF NOT EXISTS `idx_sourcing_demands_matchedAt`
  ON `sourcing_demands` (`matchedAt`);

-- ─────────────────────────────────────────────────────────────────────────────
-- RealSourcing 4.0 Migration: factory_metrics AMR 分数字段
-- 解决问题：amrService.saveAMRScore 写入目标字段在表中缺失
-- ─────────────────────────────────────────────────────────────────────────────

-- 3. 为 factory_metrics 表添加 AMR 分数字段
ALTER TABLE `factory_metrics`
  ADD COLUMN IF NOT EXISTS `amrTotalScore`       DECIMAL(5,2)  NULL DEFAULT 0.00
    COMMENT 'AMR 综合分数 (0-100)'
    AFTER `reelViewCount`,
  ADD COLUMN IF NOT EXISTS `amrRfqResponseScore`  DECIMAL(5,2)  NULL DEFAULT 0.00
    COMMENT 'RFQ 响应速度分'
    AFTER `amrTotalScore`,
  ADD COLUMN IF NOT EXISTS `amrRfqAcceptScore`    DECIMAL(5,2)  NULL DEFAULT 0.00
    COMMENT 'RFQ 接受率分'
    AFTER `amrRfqResponseScore`,
  ADD COLUMN IF NOT EXISTS `amrSmallBatchScore`   DECIMAL(5,2)  NULL DEFAULT 0.00
    COMMENT '小批量能力分'
    AFTER `amrRfqAcceptScore`,
  ADD COLUMN IF NOT EXISTS `amrOnlineScore`       DECIMAL(5,2)  NULL DEFAULT 0.00
    COMMENT '在线活跃度分'
    AFTER `amrSmallBatchScore`,
  ADD COLUMN IF NOT EXISTS `amrProfileScore`      DECIMAL(5,2)  NULL DEFAULT 0.00
    COMMENT '资料完整度分'
    AFTER `amrOnlineScore`,
  ADD COLUMN IF NOT EXISTS `amrReputationScore`   DECIMAL(5,2)  NULL DEFAULT 0.00
    COMMENT '声誉评分'
    AFTER `amrProfileScore`,
  ADD COLUMN IF NOT EXISTS `avgResponseHours`     DECIMAL(8,2)  NULL DEFAULT 0.00
    COMMENT '平均 RFQ 响应时间（小时）'
    AFTER `amrReputationScore`,
  ADD COLUMN IF NOT EXISTS `rfqAcceptRate`        DECIMAL(5,4)  NULL DEFAULT 0.0000
    COMMENT 'RFQ 接受率（0.0000-1.0000）'
    AFTER `avgResponseHours`,
  ADD COLUMN IF NOT EXISTS `amrCalculatedAt`      DATETIME(3)   NULL
    COMMENT '最近一次 AMR 计算时间'
    AFTER `rfqAcceptRate`;

-- 4. 为 AMR 分数添加索引（供工厂匹配排序使用）
CREATE INDEX IF NOT EXISTS `idx_factory_metrics_amrTotalScore`
  ON `factory_metrics` (`amrTotalScore`);

-- ─────────────────────────────────────────────────────────────────────────────
-- RealSourcing 4.0 Migration: sourcing_demands 新增 queued 状态
-- 解决问题：submitAndProcess 改为异步后需要 queued 初始状态
-- ─────────────────────────────────────────────────────────────────────────────

-- 5. sourcing_demands.status 枚举值已在应用层处理，数据库层无需 DDL 变更
--    （MySQL VARCHAR 字段，应用层 Zod 枚举控制合法值）
--    此注释仅作文档用途，记录 queued 为 4.0 新增合法状态值。
