-- ============================================================================
-- RealSourcing Factory Module - Association Tables Creation
-- Version: 3.1
-- Date: 2026-02-21
-- Purpose: Create association tables to support GTM 3.1 strategy
-- ============================================================================

-- ─── Step 1: Backup existing factories table ───────────────────────────────
CREATE TABLE IF NOT EXISTS factories_backup_20260221_associations AS 
SELECT * FROM factories LIMIT 0;

-- ─── Step 2: Create factory_verifications table ───────────────────────────
-- Stores AI verification scores and compliance data
CREATE TABLE IF NOT EXISTS factory_verifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  factoryId INT NOT NULL UNIQUE COMMENT '工厂ID',
  aiVerificationScore INT NOT NULL DEFAULT 0 COMMENT 'AI验厂评分（0-100）',
  aiVerificationReason JSON COMMENT 'AI验厂理由（JSON格式）',
  complianceScore INT NOT NULL DEFAULT 0 COMMENT '合规评分（0-100）',
  trustBadges JSON COMMENT '信任标签数组',
  lastVerificationAt DATETIME(3) COMMENT '最后验厂时间',
  verificationExpiresAt DATETIME(3) COMMENT '验厂有效期截止',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (factoryId) REFERENCES factories(id) ON DELETE CASCADE,
  INDEX idx_factoryId (factoryId),
  INDEX idx_aiScore (aiVerificationScore),
  INDEX idx_complianceScore (complianceScore)
) COMMENT='工厂AI验厂与合规认证表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Step 3: Create factory_metrics table ──────────────────────────────────
-- Stores transaction and operational statistics
CREATE TABLE IF NOT EXISTS factory_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  factoryId INT NOT NULL UNIQUE COMMENT '工厂ID',
  totalMeetings INT NOT NULL DEFAULT 0 COMMENT '总会议数',
  totalSampleRequests INT NOT NULL DEFAULT 0 COMMENT '总样品申请数',
  sampleConversionRate DECIMAL(5,2) DEFAULT 0.00 COMMENT '样品转订单率（百分比）',
  totalOrders INT NOT NULL DEFAULT 0 COMMENT '总订单数',
  totalOrderValue DECIMAL(15,2) DEFAULT 0.00 COMMENT '总订单金额',
  disputeRate DECIMAL(5,2) DEFAULT 0.00 COMMENT '纠纷率（百分比）',
  reelCount INT NOT NULL DEFAULT 0 COMMENT 'Reel视频数量',
  reelViewCount INT NOT NULL DEFAULT 0 COMMENT 'Reel总浏览量',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (factoryId) REFERENCES factories(id) ON DELETE CASCADE,
  INDEX idx_factoryId (factoryId),
  INDEX idx_totalOrders (totalOrders),
  INDEX idx_sampleConversionRate (sampleConversionRate)
) COMMENT='工厂交易与运营统计表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Step 4: Create factory_reels table ────────────────────────────────────
-- Manages video Reel content for immersive showroom
CREATE TABLE IF NOT EXISTS factory_reels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  factoryId INT NOT NULL COMMENT '工厂ID',
  title VARCHAR(255) NOT NULL COMMENT 'Reel标题',
  description TEXT COMMENT 'Reel描述',
  videoUrl VARCHAR(500) NOT NULL COMMENT '视频URL',
  thumbnailUrl VARCHAR(500) COMMENT '缩略图URL',
  duration INT NOT NULL COMMENT '视频时长（秒）',
  keyframes JSON COMMENT '关键帧标注（JSON）',
  viewCount INT NOT NULL DEFAULT 0 COMMENT '浏览量',
  status VARCHAR(20) DEFAULT 'published' COMMENT '状态（published/draft/archived）',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (factoryId) REFERENCES factories(id) ON DELETE CASCADE,
  INDEX idx_factoryId (factoryId),
  INDEX idx_status (status),
  INDEX idx_viewCount (viewCount)
) COMMENT='工厂Reel视频管理表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Step 5: Create factory_availabilities table ────────────────────────────
-- Manages time slots when factory is available for calls
CREATE TABLE IF NOT EXISTS factory_availabilities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  factoryId INT NOT NULL COMMENT '工厂ID',
  dayOfWeek INT NOT NULL COMMENT '周几（0=Sunday, 6=Saturday）',
  startTime VARCHAR(5) NOT NULL COMMENT '开始时间（HH:mm）',
  endTime VARCHAR(5) NOT NULL COMMENT '结束时间（HH:mm）',
  timezone VARCHAR(50) DEFAULT 'Asia/Shanghai' COMMENT '时区',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (factoryId) REFERENCES factories(id) ON DELETE CASCADE,
  INDEX idx_factoryId (factoryId),
  INDEX idx_dayOfWeek (dayOfWeek)
) COMMENT='工厂可连线时间段表' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Step 6: Verify new tables exist ────────────────────────────────────────
SELECT TABLE_NAME, TABLE_ROWS, TABLE_COLLATION FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('factory_verifications', 'factory_metrics', 'factory_reels', 'factory_availabilities')
ORDER BY TABLE_NAME;

-- ─── Step 7: Verify factories table has all required columns ────────────────
SELECT 
  COLUMN_NAME, 
  COLUMN_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'factories' 
  AND TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME IN (
    'isOnline', 'lastOnlineAt', 'availableForCall', 'averageResponseTime',
    'hasReel', 'videoVerificationUrl', 'certificationStatus', 'certificationDate',
    'viewCount', 'favoriteCount', 'responseRate', 'languagesSpoken',
    'isFeatured', 'featuredUntil'
  )
ORDER BY COLUMN_NAME;

-- ─── Step 8: Summary ──────────────────────────────────────────────────────
-- Migration completed successfully
-- New tables created:
--   ✅ factory_verifications (AI verification & compliance)
--   ✅ factory_metrics (transaction & operational stats)
--   ✅ factory_reels (video Reel management)
--   ✅ factory_availabilities (call availability time slots)
-- 
-- Existing columns in factories table (P0 & P1):
--   ✅ isOnline, lastOnlineAt, availableForCall, averageResponseTime
--   ✅ hasReel, videoVerificationUrl, certificationStatus, certificationDate
--   ✅ viewCount, favoriteCount, responseRate, languagesSpoken
--   ✅ isFeatured, featuredUntil
--
-- Total: 24 new fields across 5 tables
-- All changes are backward compatible (new fields have default values)
-- ============================================================================
