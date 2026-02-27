-- ─────────────────────────────────────────────────────────────────────────────
-- RealSourcing 4.1 数据库迁移
-- 迁移文件：0007_claw_agent_capabilities.sql
-- 创建日期：2026-02-27
-- 说明：
--   1. 为 claw_agent_status 表添加能力声明字段（capabilities JSON）
--   2. 为 claw_agent_status 表添加工厂关联字段（factoryId）
--   3. 为 rfq_claw_jobs 表添加 taskId 和 agentPushed 字段
--   4. 为 handshake_requests 表添加 rfqTriggeredAt 字段（记录 autoSendRfq 触发时间）
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. claw_agent_status 表增强 ───────────────────────────────────────────────
ALTER TABLE `claw_agent_status`
  ADD COLUMN IF NOT EXISTS `factoryId` INT DEFAULT NULL
    COMMENT '关联的工厂 ID，一个工厂对应一个 Agent',
  ADD COLUMN IF NOT EXISTS `factoryName` VARCHAR(255) DEFAULT NULL
    COMMENT '工厂名称（冗余存储，避免 JOIN）',
  ADD COLUMN IF NOT EXISTS `capabilities` JSON DEFAULT NULL
    COMMENT 'Agent 能力声明，格式：[{type, isConfigured, priority, config}]',
  ADD COLUMN IF NOT EXISTS `deployEnvDetail` VARCHAR(255) DEFAULT NULL
    COMMENT '部署环境详细信息（如阿里云无影实例 ID）';

-- 为 factoryId 添加索引
ALTER TABLE `claw_agent_status`
  ADD INDEX IF NOT EXISTS `idx_claw_agent_factory` (`factoryId`);

-- ── 2. rfq_claw_jobs 表增强 ───────────────────────────────────────────────────
ALTER TABLE `rfq_claw_jobs`
  ADD COLUMN IF NOT EXISTS `taskId` VARCHAR(150) DEFAULT NULL
    COMMENT '标准化任务 ID（格式：rfq-claw-{demandId}-{factoryId}-{timestamp}）',
  ADD COLUMN IF NOT EXISTS `agentPushed` TINYINT NOT NULL DEFAULT 0
    COMMENT '是否已推送给在线 Agent（1=已推送，0=仅入队）',
  ADD COLUMN IF NOT EXISTS `agentId` VARCHAR(100) DEFAULT NULL
    COMMENT '处理该任务的 Agent ID';

-- ── 3. handshake_requests 表增强 ─────────────────────────────────────────────
ALTER TABLE `handshake_requests`
  ADD COLUMN IF NOT EXISTS `rfqTriggeredAt` DATETIME(3) DEFAULT NULL
    COMMENT 'autoSendRfq 触发时间（握手接受后自动触发）',
  ADD COLUMN IF NOT EXISTS `rfqMode` VARCHAR(30) DEFAULT NULL
    COMMENT 'RFQ 触发模式：feishu_instant | claw_queued | manual_fallback | skipped';

-- ── 4. 新增 agent_task_log 表（记录 Agent 任务执行历史） ──────────────────────
CREATE TABLE IF NOT EXISTS `agent_task_log` (
  `id`              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `taskId`          VARCHAR(150) NOT NULL UNIQUE,
  `agentId`         VARCHAR(100) NOT NULL,
  `factoryId`       INT NOT NULL,
  `demandId`        INT NOT NULL,
  `buyerId`         INT NOT NULL,
  `taskType`        VARCHAR(50) NOT NULL DEFAULT 'fetch_quote',
  `status`          VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- 任务执行结果
  `dataSource`      VARCHAR(50),
  `confidence`      DECIMAL(4, 3),
  `unitPrice`       DECIMAL(10, 2),
  `currency`        VARCHAR(10) DEFAULT 'USD',
  `moq`             INT,
  `leadTimeDays`    INT,
  -- 时间记录
  `enqueuedAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `startedAt`       DATETIME(3),
  `completedAt`     DATETIME(3),
  `failureReason`   TEXT,
  `retryCount`      INT NOT NULL DEFAULT 0,
  `latencyMs`       INT,
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_agent_task_agent` (`agentId`),
  INDEX `idx_agent_task_factory` (`factoryId`),
  INDEX `idx_agent_task_demand` (`demandId`),
  INDEX `idx_agent_task_status` (`status`),
  INDEX `idx_agent_task_enqueued` (`enqueuedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT 'Open Claw Agent 任务执行历史记录';

-- ── 验证迁移结果 ───────────────────────────────────────────────────────────────
SELECT 'Migration 0007 completed successfully' AS migration_status;
