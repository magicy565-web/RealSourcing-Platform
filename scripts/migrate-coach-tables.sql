-- AI Coach Tables Migration
-- Run this on the production database: realsourcing @ rm-bp1h4o9up7249uep3to.mysql.rds.aliyuncs.com

-- AI Coach Sessions
CREATE TABLE IF NOT EXISTS `ai_coach_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `niche` VARCHAR(50) DEFAULT NULL,
  `coachName` VARCHAR(50) DEFAULT NULL,
  `messages` JSON NOT NULL DEFAULT (JSON_ARRAY()),
  `profileSnapshot` JSON DEFAULT NULL,
  `thumbsUpCount` INT NOT NULL DEFAULT 0,
  `thumbsDownCount` INT NOT NULL DEFAULT 0,
  `topicsDiscussed` JSON DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_coach_sessions_userId` (`userId`),
  KEY `idx_coach_sessions_updatedAt` (`updatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Coach Message Feedback
CREATE TABLE IF NOT EXISTS `ai_coach_feedback` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `sessionId` INT NOT NULL,
  `userId` INT NOT NULL,
  `messageIdx` INT NOT NULL,
  `feedback` VARCHAR(10) NOT NULL,
  `comment` TEXT DEFAULT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `idx_coach_feedback_sessionId` (`sessionId`),
  KEY `idx_coach_feedback_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- AI Coach Settings
CREATE TABLE IF NOT EXISTS `ai_coach_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NOT NULL,
  `coachName` VARCHAR(50) NOT NULL DEFAULT 'Alex',
  `isEnabled` INT NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_coach_settings_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
