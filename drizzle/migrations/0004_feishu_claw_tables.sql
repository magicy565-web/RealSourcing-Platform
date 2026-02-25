-- ─────────────────────────────────────────────────────────────────────────────
-- RealSourcing 4.0 数据库迁移
-- 迁移文件：0004_feishu_claw_tables.sql
-- 创建日期：2026-02-25
-- 说明：新增飞书报价缓存表、Claw Agent 状态表、RFQ Claw 任务追踪表
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 飞书报价缓存表 ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `feishu_quote_cache` (
  `id`               INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `bitableRecordId`  VARCHAR(100),
  `factoryId`        INT NOT NULL,
  `category`         VARCHAR(100),
  `productName`      VARCHAR(255),
  `unitPrice`        DECIMAL(10, 2) NOT NULL,
  `currency`         VARCHAR(10) DEFAULT 'USD',
  `moq`              INT NOT NULL,
  `leadTimeDays`     INT NOT NULL,
  `tierPricing`      JSON,
  `paymentTerms`     VARCHAR(255),
  `shippingTerms`    VARCHAR(100),
  `isVerified`       TINYINT NOT NULL DEFAULT 0,
  `dataSource`       VARCHAR(30) NOT NULL DEFAULT 'feishu_api',
  `quoteUpdatedAt`   DATETIME(3),
  `isExpired`        TINYINT NOT NULL DEFAULT 0,
  `cacheExpiresAt`   DATETIME(3),
  `createdAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_feishu_quote_factory` (`factoryId`),
  INDEX `idx_feishu_quote_category` (`category`),
  INDEX `idx_feishu_quote_expired` (`isExpired`, `cacheExpiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Claw Agent 状态持久化表 ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `claw_agent_status` (
  `id`                   INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `agentId`              VARCHAR(100) NOT NULL UNIQUE,
  `status`               VARCHAR(20) NOT NULL DEFAULT 'offline',
  `version`              VARCHAR(50),
  `deployEnv`            VARCHAR(50) DEFAULT 'aliyun_wuying',
  `ipAddress`            VARCHAR(50),
  `lastHeartbeatAt`      DATETIME(3),
  `activeJobs`           INT NOT NULL DEFAULT 0,
  `totalJobsProcessed`   INT NOT NULL DEFAULT 0,
  `totalJobsFailed`      INT NOT NULL DEFAULT 0,
  `lastSuccessJobId`     VARCHAR(100),
  `lastFailureReason`    TEXT,
  `isEnabled`            TINYINT NOT NULL DEFAULT 1,
  `createdAt`            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_claw_agent_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── RFQ Claw 任务追踪表 ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `rfq_claw_jobs` (
  `id`               INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `jobId`            VARCHAR(100) NOT NULL UNIQUE,
  `demandId`         INT NOT NULL,
  `factoryId`        INT NOT NULL,
  `buyerId`          INT NOT NULL,
  `matchResultId`    INT,
  `category`         VARCHAR(100),
  `status`           VARCHAR(20) NOT NULL DEFAULT 'queued',
  `assignedAgentId`  VARCHAR(100),
  `enqueuedAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `startedAt`        DATETIME(3),
  `completedAt`      DATETIME(3),
  `failureReason`    TEXT,
  `retryCount`       INT NOT NULL DEFAULT 0,
  `timeoutAlertSent` TINYINT NOT NULL DEFAULT 0,
  `createdAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_rfq_claw_demand` (`demandId`),
  INDEX `idx_rfq_claw_factory` (`factoryId`),
  INDEX `idx_rfq_claw_status` (`status`),
  INDEX `idx_rfq_claw_enqueued` (`enqueuedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 验证迁移结果 ───────────────────────────────────────────────────────────────
SELECT 'Migration 0004 completed successfully' AS migration_status;
