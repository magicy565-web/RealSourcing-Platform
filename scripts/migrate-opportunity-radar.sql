-- Opportunity Radar Tables Migration
-- Run on: realsourcing @ rm-bp1h4o9up7249uep3to.mysql.rds.aliyuncs.com

-- ─── Product Opportunity Analysis ─────────────────────────────────────────────
-- Stores AI-generated opportunity analysis for each product
CREATE TABLE IF NOT EXISTS `product_opportunity_analysis` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `productId`         INT NOT NULL,
  `niche`             VARCHAR(50) NOT NULL DEFAULT 'furniture',
  -- AI-generated scores (0-100)
  `opportunityScore`  INT NOT NULL DEFAULT 0 COMMENT 'Overall opportunity score 0-100',
  `trendScore`        INT NOT NULL DEFAULT 0 COMMENT 'Market trend score',
  `marginScore`       INT NOT NULL DEFAULT 0 COMMENT 'Profit margin potential score',
  `competitionScore`  INT NOT NULL DEFAULT 0 COMMENT 'Competition level (higher = less competition)',
  `demandScore`       INT NOT NULL DEFAULT 0 COMMENT 'Demand signal score',
  -- AI analysis content
  `headline`          VARCHAR(255) COMMENT 'One-line opportunity summary',
  `whyNow`            TEXT COMMENT 'Why this is a good opportunity right now',
  `targetAudience`    TEXT COMMENT 'Who would buy this',
  `suggestedPlatforms` JSON COMMENT 'Best platforms to sell on',
  `actionSteps`       JSON COMMENT 'Recommended action steps array',
  `risks`             TEXT COMMENT 'Key risks to be aware of',
  `estimatedMargin`   VARCHAR(50) COMMENT 'e.g. "35-55%"',
  `suggestedRetailPrice` VARCHAR(50) COMMENT 'e.g. "$89-$149"',
  `keywords`          JSON COMMENT 'SEO/ad keywords to target',
  `tags`              JSON COMMENT 'Searchable tags',
  -- Metadata
  `batchId`           VARCHAR(50) COMMENT 'Upload batch identifier (e.g. 2026-03-01)',
  `isActive`          TINYINT NOT NULL DEFAULT 1,
  `analysisVersion`   INT NOT NULL DEFAULT 1,
  `createdAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_niche` (`productId`, `niche`),
  KEY `idx_opportunity_score` (`opportunityScore` DESC),
  KEY `idx_niche_active` (`niche`, `isActive`),
  KEY `idx_batch` (`batchId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── User Radar Preferences ───────────────────────────────────────────────────
-- Stores each user's filtering preferences for the opportunity radar
CREATE TABLE IF NOT EXISTS `user_radar_preferences` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `userId`            INT NOT NULL,
  -- Filters
  `priceRangeMin`     DECIMAL(10,2) DEFAULT NULL COMMENT 'Min factory price (USD)',
  `priceRangeMax`     DECIMAL(10,2) DEFAULT NULL COMMENT 'Max factory price (USD)',
  `minOpportunityScore` INT DEFAULT 60 COMMENT 'Minimum opportunity score threshold',
  `targetPlatforms`   JSON DEFAULT NULL COMMENT 'e.g. ["shopify","tiktok_shop"]',
  `preferredStyles`   JSON DEFAULT NULL COMMENT 'e.g. ["modern","minimalist","rustic"]',
  `preferredMaterials` JSON DEFAULT NULL COMMENT 'e.g. ["solid_wood","metal","rattan"]',
  `maxMoq`            INT DEFAULT NULL COMMENT 'Maximum MOQ willing to accept',
  `maxLeadTimeDays`   INT DEFAULT NULL COMMENT 'Maximum acceptable lead time',
  `showNewOnly`       TINYINT NOT NULL DEFAULT 0 COMMENT 'Only show products from latest batch',
  `sortBy`            VARCHAR(30) DEFAULT 'opportunity_score' COMMENT 'opportunity_score|margin|trend|newest',
  -- Notification
  `notifyOnNewBatch`  TINYINT NOT NULL DEFAULT 1 COMMENT 'Notify via Coach when new batch arrives',
  `lastSeenBatchId`   VARCHAR(50) DEFAULT NULL COMMENT 'Last batch the user has seen',
  `createdAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_radar` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Radar Batches ────────────────────────────────────────────────────────────
-- Tracks each 48-hour upload batch
CREATE TABLE IF NOT EXISTS `radar_batches` (
  `id`            VARCHAR(50) NOT NULL COMMENT 'e.g. 2026-03-01-AM',
  `niche`         VARCHAR(50) NOT NULL DEFAULT 'furniture',
  `productCount`  INT NOT NULL DEFAULT 0,
  `factoryCount`  INT NOT NULL DEFAULT 0,
  `summary`       TEXT COMMENT 'AI-generated batch summary',
  `isPublished`   TINYINT NOT NULL DEFAULT 1,
  `publishedAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── User Radar Interactions ──────────────────────────────────────────────────
-- Tracks which opportunities users have viewed/saved/dismissed
CREATE TABLE IF NOT EXISTS `user_radar_interactions` (
  `id`          INT NOT NULL AUTO_INCREMENT,
  `userId`      INT NOT NULL,
  `productId`   INT NOT NULL,
  `action`      VARCHAR(20) NOT NULL COMMENT 'viewed|saved|dismissed|inquired',
  `createdAt`   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_user_product` (`userId`, `productId`),
  KEY `idx_user_action` (`userId`, `action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
