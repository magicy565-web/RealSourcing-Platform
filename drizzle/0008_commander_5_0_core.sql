-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0008_commander_5_0_core.sql
-- Description: RealSourcing 5.0 Commander 核心数据库表
-- Tables: commander_phones, openclaw_instances, openclaw_accounts,
--         commander_tasks, inbound_leads, lead_replies,
--         credit_ledger, digital_assets, factory_credits
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── commander_phones ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `commander_phones` (
  `id`             INT NOT NULL AUTO_INCREMENT,
  `factoryId`      INT NOT NULL,
  `userId`         INT NOT NULL,
  `deviceName`     VARCHAR(100),
  `activationCode` VARCHAR(32) NOT NULL,
  `isActivated`    TINYINT NOT NULL DEFAULT 0,
  `activatedAt`    DATETIME(3),
  `wechatOpenId`   VARCHAR(64),
  `wechatNickname` VARCHAR(100),
  `wechatBoundAt`  DATETIME(3),
  `deviceModel`    VARCHAR(100),
  `lastActiveAt`   DATETIME(3),
  `status`         VARCHAR(20) NOT NULL DEFAULT 'pending',
  `createdAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `commander_phones_activationCode_unique` (`activationCode`),
  KEY `idx_commander_phones_factoryId` (`factoryId`),
  KEY `idx_commander_phones_userId` (`userId`),
  KEY `idx_commander_phones_wechatOpenId` (`wechatOpenId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── openclaw_instances ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `openclaw_instances` (
  `id`              INT NOT NULL AUTO_INCREMENT,
  `factoryId`       INT,
  `instanceType`    VARCHAR(20) NOT NULL DEFAULT 'standard',
  `instanceName`    VARCHAR(100),
  `region`          VARCHAR(50) DEFAULT 'cn-hangzhou',
  `status`          VARCHAR(20) NOT NULL DEFAULT 'offline',
  `agentId`         VARCHAR(64),
  `cpuUsage`        DECIMAL(5,2) DEFAULT 0.00,
  `memoryUsage`     DECIMAL(5,2) DEFAULT 0.00,
  `activeTaskCount` INT NOT NULL DEFAULT 0,
  `totalTaskCount`  INT NOT NULL DEFAULT 0,
  `lastHeartbeatAt` DATETIME(3),
  `provisionedAt`   DATETIME(3),
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `openclaw_instances_agentId_unique` (`agentId`),
  KEY `idx_openclaw_instances_factoryId` (`factoryId`),
  KEY `idx_openclaw_instances_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── openclaw_accounts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `openclaw_accounts` (
  `id`               INT NOT NULL AUTO_INCREMENT,
  `factoryId`        INT NOT NULL,
  `instanceId`       INT,
  `platform`         VARCHAR(50) NOT NULL,
  `accountUsername`  VARCHAR(200) NOT NULL,
  `encryptedSession` TEXT,
  `sessionExpiresAt` DATETIME(3),
  `healthStatus`     VARCHAR(20) NOT NULL DEFAULT 'unknown',
  `lastCheckedAt`    DATETIME(3),
  `lastSuccessAt`    DATETIME(3),
  `errorMessage`     TEXT,
  `isActive`         TINYINT NOT NULL DEFAULT 1,
  `createdAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_openclaw_accounts_factoryId` (`factoryId`),
  KEY `idx_openclaw_accounts_platform` (`platform`),
  KEY `idx_openclaw_accounts_healthStatus` (`healthStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── commander_tasks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `commander_tasks` (
  `id`              INT NOT NULL AUTO_INCREMENT,
  `factoryId`       INT NOT NULL,
  `userId`          INT NOT NULL,
  `instanceId`      INT,
  `taskType`        VARCHAR(50) NOT NULL,
  `taskTitle`       VARCHAR(200) NOT NULL,
  `taskParams`      JSON,
  `status`          VARCHAR(20) NOT NULL DEFAULT 'pending',
  `progress`        INT NOT NULL DEFAULT 0,
  `progressMessage` VARCHAR(500),
  `creditCost`      INT NOT NULL DEFAULT 0,
  `creditRefunded`  TINYINT NOT NULL DEFAULT 0,
  `resultSummary`   TEXT,
  `resultData`      JSON,
  `errorMessage`    TEXT,
  `startedAt`       DATETIME(3),
  `completedAt`     DATETIME(3),
  `bullJobId`       VARCHAR(100),
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_commander_tasks_factoryId` (`factoryId`),
  KEY `idx_commander_tasks_userId` (`userId`),
  KEY `idx_commander_tasks_status` (`status`),
  KEY `idx_commander_tasks_taskType` (`taskType`),
  KEY `idx_commander_tasks_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── inbound_leads ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `inbound_leads` (
  `id`              INT NOT NULL AUTO_INCREMENT,
  `factoryId`       INT NOT NULL,
  `commanderTaskId` INT,
  `source`          VARCHAR(50) NOT NULL,
  `platform`        VARCHAR(50),
  `externalId`      VARCHAR(200),
  `buyerName`       VARCHAR(200),
  `buyerCompany`    VARCHAR(200),
  `buyerCountry`    VARCHAR(100),
  `buyerEmail`      VARCHAR(320),
  `buyerPhone`      VARCHAR(50),
  `buyerLinkedin`   VARCHAR(500),
  `productCategory` VARCHAR(100),
  `originalContent` TEXT,
  `aiSummary`       TEXT,
  `qualityScore`    INT NOT NULL DEFAULT 0,
  `intentScore`     INT NOT NULL DEFAULT 0,
  `status`          VARCHAR(20) NOT NULL DEFAULT 'new',
  `isRead`          TINYINT NOT NULL DEFAULT 0,
  `readAt`          DATETIME(3),
  `inquiryTime`     DATETIME(3),
  `wechatNotified`  TINYINT NOT NULL DEFAULT 0,
  `notifiedAt`      DATETIME(3),
  `feishuArchived`  TINYINT NOT NULL DEFAULT 0,
  `feishuRecordId`  VARCHAR(100),
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_inbound_leads_external` (`factoryId`, `platform`, `externalId`),
  KEY `idx_inbound_leads_factoryId` (`factoryId`),
  KEY `idx_inbound_leads_status` (`status`),
  KEY `idx_inbound_leads_qualityScore` (`qualityScore`),
  KEY `idx_inbound_leads_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── lead_replies ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lead_replies` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `leadId`            INT NOT NULL,
  `factoryId`         INT NOT NULL,
  `userId`            INT NOT NULL,
  `chineseContent`    TEXT NOT NULL,
  `englishContent`    TEXT,
  `translationStatus` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `sendStatus`        VARCHAR(20) NOT NULL DEFAULT 'draft',
  `sentAt`            DATETIME(3),
  `sendError`         TEXT,
  `clawJobId`         VARCHAR(100),
  `isApproved`        TINYINT NOT NULL DEFAULT 0,
  `approvedAt`        DATETIME(3),
  `createdAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_lead_replies_leadId` (`leadId`),
  KEY `idx_lead_replies_factoryId` (`factoryId`),
  KEY `idx_lead_replies_sendStatus` (`sendStatus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── credit_ledger ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `credit_ledger` (
  `id`             INT NOT NULL AUTO_INCREMENT,
  `factoryId`      INT NOT NULL,
  `userId`         INT NOT NULL,
  `txType`         VARCHAR(30) NOT NULL,
  `amount`         INT NOT NULL,
  `balanceAfter`   INT NOT NULL,
  `description`    VARCHAR(500),
  `relatedTaskId`  INT,
  `relatedOrderId` VARCHAR(100),
  `paymentMethod`  VARCHAR(30),
  `paymentAmount`  DECIMAL(10,2),
  `createdAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_credit_ledger_factoryId` (`factoryId`),
  KEY `idx_credit_ledger_userId` (`userId`),
  KEY `idx_credit_ledger_txType` (`txType`),
  KEY `idx_credit_ledger_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── digital_assets ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `digital_assets` (
  `id`                     INT NOT NULL AUTO_INCREMENT,
  `factoryId`              INT NOT NULL,
  `geoScore`               INT NOT NULL DEFAULT 0,
  `geoScoreHistory`        JSON,
  `lastGeoScanAt`          DATETIME(3),
  `alibabaProfileUrl`      VARCHAR(500),
  `linkedinProfileUrl`     VARCHAR(500),
  `websiteUrl`             VARCHAR(500),
  `thomasnetUrl`           VARCHAR(500),
  `totalContentPieces`     INT NOT NULL DEFAULT 0,
  `totalDirectoryListings` INT NOT NULL DEFAULT 0,
  `totalAiCitations`       INT NOT NULL DEFAULT 0,
  `schemaOrgData`          JSON,
  `schemaLastUpdatedAt`    DATETIME(3),
  `lastMonthlyReportAt`    DATETIME(3),
  `monthlyReportUrl`       VARCHAR(500),
  `createdAt`              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`              DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `digital_assets_factoryId_unique` (`factoryId`),
  KEY `idx_digital_assets_geoScore` (`geoScore`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── factory_credits ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `factory_credits` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `factoryId`         INT NOT NULL,
  `balance`           INT NOT NULL DEFAULT 0,
  `totalRecharged`    INT NOT NULL DEFAULT 0,
  `totalConsumed`     INT NOT NULL DEFAULT 0,
  `lastRechargeAt`    DATETIME(3),
  `lowBalanceAlerted` TINYINT NOT NULL DEFAULT 0,
  `createdAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `factory_credits_factoryId_unique` (`factoryId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
