-- ============================================================
-- Migration: FTGI + Human Scoring System Tables
-- Version: 0002
-- Description: Add all tables required for the FTGI certification
--              scoring pipeline (AI scoring + human scoring)
-- ============================================================

-- ── FTGI 文档上传记录 ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `factory_ftgi_documents` (
  `id`          INT AUTO_INCREMENT NOT NULL,
  `factoryId`   INT NOT NULL,
  `docType`     VARCHAR(30) NOT NULL DEFAULT 'other',
  `fileName`    VARCHAR(255) NOT NULL,
  `fileUrl`     TEXT NOT NULL,
  `fileMime`    VARCHAR(100),
  `fileSize`    INT,
  `parsedJson`  JSON,
  `parseStatus` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `parseError`  TEXT,
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `factory_ftgi_documents_id` PRIMARY KEY (`id`)
);

-- ── FTGI AI 五维评分结果 ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `factory_ftgi_scores` (
  `id`             INT AUTO_INCREMENT NOT NULL,
  `factoryId`      INT NOT NULL,
  `d1_trust`       DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `d2_fulfillment` DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `d3_market`      DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `d4_ecosystem`   DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `d5_community`   DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `raw_score`      DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `ai_coefficient` DECIMAL(3,2) NOT NULL DEFAULT '0.60',
  `ftgi_score`     DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `scoreDetails`   JSON,
  `status`         VARCHAR(20) NOT NULL DEFAULT 'pending',
  `errorMessage`   TEXT,
  `calculatedAt`   DATETIME(3),
  `createdAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `factory_ftgi_scores_id` PRIMARY KEY (`id`),
  CONSTRAINT `factory_ftgi_scores_factoryId_unique` UNIQUE (`factoryId`)
);

-- ── 买家多维度评价 V2 ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `factory_reviews_v2` (
  `id`                   INT AUTO_INCREMENT NOT NULL,
  `factoryId`            INT NOT NULL,
  `userId`               INT NOT NULL,
  `orderId`              INT,
  `rating_overall`       INT NOT NULL,
  `rating_communication` INT NOT NULL,
  `rating_quality`       INT NOT NULL,
  `rating_lead_time`     INT NOT NULL,
  `rating_service`       INT NOT NULL,
  `comment`              TEXT,
  `is_verified_purchase` TINYINT NOT NULL DEFAULT 0,
  `helpful_count`        INT NOT NULL DEFAULT 0,
  `createdAt`            DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `factory_reviews_v2_id` PRIMARY KEY (`id`)
);

-- ── Webinar 投票题目 ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `webinar_polls` (
  `id`        INT AUTO_INCREMENT NOT NULL,
  `webinarId` INT NOT NULL,
  `factoryId` INT,
  `question`  VARCHAR(255) NOT NULL,
  `options`   JSON NOT NULL,
  `poll_type` VARCHAR(30) NOT NULL DEFAULT 'satisfaction',
  `status`    VARCHAR(20) NOT NULL DEFAULT 'pending',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `closedAt`  DATETIME(3),
  CONSTRAINT `webinar_polls_id` PRIMARY KEY (`id`)
);

-- ── Webinar 投票记录 ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `webinar_poll_votes` (
  `id`              INT AUTO_INCREMENT NOT NULL,
  `pollId`          INT NOT NULL,
  `userId`          INT NOT NULL,
  `selected_option` INT NOT NULL,
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `webinar_poll_votes_id` PRIMARY KEY (`id`)
);

-- ── 专家评审 ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `expert_reviews` (
  `id`               INT AUTO_INCREMENT NOT NULL,
  `factoryId`        INT NOT NULL,
  `expertId`         INT NOT NULL,
  `score_innovation` INT NOT NULL,
  `score_management` INT NOT NULL,
  `score_potential`  INT NOT NULL,
  `summary`          TEXT NOT NULL,
  `is_published`     TINYINT NOT NULL DEFAULT 0,
  `createdAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`        DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `expert_reviews_id` PRIMARY KEY (`id`)
);

-- ── 人工评分汇总缓存 ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `factory_human_scores` (
  `id`                  INT AUTO_INCREMENT NOT NULL,
  `factoryId`           INT NOT NULL,
  `score_from_reviews`  DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `score_from_webinars` DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `score_from_experts`  DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `review_count`        INT NOT NULL DEFAULT 0,
  `webinar_vote_count`  INT NOT NULL DEFAULT 0,
  `expert_review_count` INT NOT NULL DEFAULT 0,
  `human_score`         DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `ftgi_contribution`   DECIMAL(5,2) NOT NULL DEFAULT '0.00',
  `last_calculated_at`  DATETIME(3),
  `createdAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `factory_human_scores_id` PRIMARY KEY (`id`),
  CONSTRAINT `factory_human_scores_factoryId_unique` UNIQUE (`factoryId`)
);

-- ── 索引 ──────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS `idx_ftgi_docs_factory`    ON `factory_ftgi_documents` (`factoryId`);
CREATE INDEX IF NOT EXISTS `idx_ftgi_docs_status`     ON `factory_ftgi_documents` (`parseStatus`);
CREATE INDEX IF NOT EXISTS `idx_reviews_v2_factory`   ON `factory_reviews_v2` (`factoryId`);
CREATE INDEX IF NOT EXISTS `idx_reviews_v2_user`      ON `factory_reviews_v2` (`userId`);
CREATE INDEX IF NOT EXISTS `idx_webinar_polls_webinar` ON `webinar_polls` (`webinarId`);
CREATE INDEX IF NOT EXISTS `idx_poll_votes_poll`      ON `webinar_poll_votes` (`pollId`);
CREATE INDEX IF NOT EXISTS `idx_expert_reviews_factory` ON `expert_reviews` (`factoryId`);
