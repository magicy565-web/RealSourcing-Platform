-- ============================================================
-- RealSourcing 4.0 - Handshake Requests Migration
-- Generated: 2026-02-25
-- Description: 新增握手请求表，实现15分钟实时匹配工厂核心机制
-- ============================================================

-- ─── 1. 握手请求表 (handshake_requests) ──────────────────────────────────────
-- 买家向匹配工厂发起"请求对话"时创建记录
-- 状态流转：pending → accepted → rejected / expired
CREATE TABLE IF NOT EXISTS `handshake_requests` (
  `id`                  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `demandId`            INT NOT NULL COMMENT '关联的采购需求 ID',
  `factoryId`           INT NOT NULL COMMENT '目标工厂 ID',
  `buyerId`             INT NOT NULL COMMENT '发起请求的买家 ID',
  `matchResultId`       INT COMMENT '关联的匹配结果 ID',
  -- 状态：pending(等待工厂响应) | accepted(工厂接受) | rejected(工厂拒绝) | expired(超时未响应)
  `status`              VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- 买家附言（可选）
  `buyerMessage`        TEXT COMMENT '买家附言',
  -- 工厂拒绝原因（可选）
  `factoryRejectReason` VARCHAR(500) COMMENT '工厂拒绝原因',
  -- 请求超时时间（默认 15 分钟后过期）
  `expiresAt`           DATETIME(3) NOT NULL COMMENT '请求过期时间',
  -- 工厂响应时间
  `respondedAt`         DATETIME(3) COMMENT '工厂响应时间',
  -- 接受后创建的沟通室 URL slug
  `roomSlug`            VARCHAR(100) COMMENT '需求沟通室 URL slug',
  `createdAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_handshake_demand` (`demandId`),
  INDEX `idx_handshake_factory` (`factoryId`),
  INDEX `idx_handshake_buyer` (`buyerId`),
  INDEX `idx_handshake_status` (`status`),
  INDEX `idx_handshake_expires` (`expiresAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='握手请求表 - 15分钟实时匹配核心机制';

-- ─── 2. 需求沟通室消息表 (sourcing_room_messages) ────────────────────────────
-- 买家与工厂在需求沟通室中的实时对话记录
CREATE TABLE IF NOT EXISTS `sourcing_room_messages` (
  `id`                  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `handshakeId`         INT NOT NULL COMMENT '关联的握手请求 ID',
  `senderId`            INT NOT NULL COMMENT '发送者用户 ID',
  `senderRole`          VARCHAR(20) NOT NULL DEFAULT 'buyer' COMMENT 'buyer | factory | ai',
  `content`             TEXT NOT NULL COMMENT '消息内容',
  `messageType`         VARCHAR(20) NOT NULL DEFAULT 'text' COMMENT 'text | system | ai_intro',
  `isRead`              TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='需求沟通室消息表 - 30分钟首次对话核心';

-- ─── 3. 为 factories 表补充在线状态字段（如果不存在）────────────────────────
ALTER TABLE `factories`
  ADD COLUMN IF NOT EXISTS `isOnline`             TINYINT(1) NOT NULL DEFAULT 0 COMMENT '当前在线状态',
  ADD COLUMN IF NOT EXISTS `lastOnlineAt`         DATETIME(3) COMMENT '最后在线时间',
  ADD COLUMN IF NOT EXISTS `availableForCall`     TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否可立即通话',
  ADD COLUMN IF NOT EXISTS `averageResponseTime`  INT DEFAULT 0 COMMENT '平均响应时间（分钟）';

-- ─── 完成 ──────────────────────────────────────────────────────────────────────
-- 执行完毕后，请运行以下命令验证：
-- SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'realsourcing' AND TABLE_NAME IN ('handshake_requests', 'sourcing_room_messages');
