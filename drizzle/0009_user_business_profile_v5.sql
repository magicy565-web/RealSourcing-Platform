-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0009_user_business_profile_v5.sql
-- Description: RealSourcing 5.0 专业版用户商业画像与任务系统
-- Tables: user_business_profiles, user_roadmap_tasks
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── user_business_profiles ──────────────────────────────────────────────────
-- 用户商业画像（AI Coach 的核心记忆来源）
CREATE TABLE IF NOT EXISTS `user_business_profiles` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `userId`            INT NOT NULL,

  -- 核心商业维度
  `businessStage`     VARCHAR(50) NOT NULL DEFAULT 'exploration',
  -- 'exploration' (新手) | 'startup' (起步) | 'growth' (成长) | 'brand' (品牌)
  
  `ambition`          VARCHAR(50) NOT NULL DEFAULT 'learn',
  -- 'side_income' | 'full_time' | 'dtc_brand' | 'learn'

  `interestedNiches`  JSON,  -- 品类偏好
  `targetMarkets`     JSON,  -- 目标市场

  -- 资产连接
  `shopifyStoreUrl`   VARCHAR(500),
  `shopifyConnected`  TINYINT NOT NULL DEFAULT 0,
  `tiktokAccount`     VARCHAR(100),

  -- 业务数据统计（用于 AI 评估）
  `monthlyRevenue`    DECIMAL(15, 2) DEFAULT 0.00,
  `totalOrders`       INT DEFAULT 0,
  `activeProductCount` INT DEFAULT 0,

  -- AI Coach 记忆
  `aiSummary`         TEXT,  -- AI 对该用户的商业画像总结
  `lastInteractedAt`  DATETIME(3),

  -- 时间戳
  `onboardingCompletedAt` DATETIME(3),
  `createdAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `user_business_profiles_userId_unique` (`userId`),
  KEY `idx_ubp_userId` (`userId`),
  KEY `idx_ubp_stage` (`businessStage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── user_roadmap_tasks ──────────────────────────────────────────────────────
-- 用户路线图任务（替代 RPG 地图的任务驱动系统）
CREATE TABLE IF NOT EXISTS `user_roadmap_tasks` (
  `id`              INT NOT NULL AUTO_INCREMENT,
  `userId`          INT NOT NULL,
  
  -- 任务元数据
  `category`        VARCHAR(50) NOT NULL, -- 'product' | 'sourcing' | 'marketing' | 'ops'
  `title`           VARCHAR(200) NOT NULL,
  `titleZh`         VARCHAR(200),
  `description`     TEXT,
  `descriptionZh`   TEXT,
  
  -- 任务状态
  `status`          VARCHAR(20) NOT NULL DEFAULT 'todo',
  -- 'todo' | 'in_progress' | 'completed' | 'skipped'
  
  -- 关联功能与 AI 提示
  `linkedFeature`   VARCHAR(100), -- 对应平台功能路由
  `aiContextHint`   TEXT,         -- 当用户进行此任务时给 AI Coach 的提示
  
  -- 排序与优先级
  `priority`        INT DEFAULT 0,
  `displayOrder`    INT DEFAULT 0,

  -- 时间戳
  `startedAt`       DATETIME(3),
  `completedAt`     DATETIME(3),
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `idx_urt_userId` (`userId`),
  KEY `idx_urt_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 预置任务数据（初始化路线图用） ───────────────────────────────────────────
-- 这些将作为默认任务，在用户完成 Onboarding 后自动生成
-- 暂时不在此 SQL 插入，改为在后端逻辑中根据 Profile 动态生成
