-- ============================================================
-- RealSourcing Platform - 数据库索引优化脚本
-- 优先级2：添加数据库索引提升查询性能
-- ============================================================

-- ── factories 表索引 ──────────────────────────────────────────
ALTER TABLE factories ADD INDEX IF NOT EXISTS idx_category (category);
ALTER TABLE factories ADD INDEX IF NOT EXISTS idx_rating (overallScore);
ALTER TABLE factories ADD INDEX IF NOT EXISTS idx_country (country);
ALTER TABLE factories ADD INDEX IF NOT EXISTS idx_city (city);

-- ── products 表索引 ───────────────────────────────────────────
ALTER TABLE products ADD INDEX IF NOT EXISTS idx_factoryId (factoryId);
ALTER TABLE products ADD INDEX IF NOT EXISTS idx_category (category);
ALTER TABLE products ADD INDEX IF NOT EXISTS idx_rating (rating);

-- ── inquiries 表索引 ──────────────────────────────────────────
ALTER TABLE inquiries ADD INDEX IF NOT EXISTS idx_buyerId (buyerId);
ALTER TABLE inquiries ADD INDEX IF NOT EXISTS idx_factoryId (factoryId);
ALTER TABLE inquiries ADD INDEX IF NOT EXISTS idx_status (status);
ALTER TABLE inquiries ADD INDEX IF NOT EXISTS idx_createdAt (createdAt);

-- ── meetings 表索引 ───────────────────────────────────────────
ALTER TABLE meetings ADD INDEX IF NOT EXISTS idx_buyerId (buyerId);
ALTER TABLE meetings ADD INDEX IF NOT EXISTS idx_factoryId (factoryId);
ALTER TABLE meetings ADD INDEX IF NOT EXISTS idx_status (status);
ALTER TABLE meetings ADD INDEX IF NOT EXISTS idx_scheduledAt (scheduledAt);

-- ── webinars 表索引 ───────────────────────────────────────────
ALTER TABLE webinars ADD INDEX IF NOT EXISTS idx_hostId (hostId);
ALTER TABLE webinars ADD INDEX IF NOT EXISTS idx_status (status);
ALTER TABLE webinars ADD INDEX IF NOT EXISTS idx_scheduledAt (scheduledAt);

-- ── notifications 表索引 ──────────────────────────────────────
ALTER TABLE notifications ADD INDEX IF NOT EXISTS idx_userId (userId);
ALTER TABLE notifications ADD INDEX IF NOT EXISTS idx_isRead (isRead);

-- ── user_favorites 表索引 ─────────────────────────────────────
ALTER TABLE user_favorites ADD INDEX IF NOT EXISTS idx_userId_targetType (userId, targetType);
ALTER TABLE user_favorites ADD INDEX IF NOT EXISTS idx_targetType_targetId (targetType, targetId);

-- ── messages 表索引 ───────────────────────────────────────────
ALTER TABLE messages ADD INDEX IF NOT EXISTS idx_webinarId (webinarId);
ALTER TABLE messages ADD INDEX IF NOT EXISTS idx_senderId (senderId);
ALTER TABLE messages ADD INDEX IF NOT EXISTS idx_type (type);

-- ── webinar_participants 表索引 ───────────────────────────────
ALTER TABLE webinar_participants ADD INDEX IF NOT EXISTS idx_webinarId (webinarId);
ALTER TABLE webinar_participants ADD INDEX IF NOT EXISTS idx_userId (userId);

-- ── factory_reviews 表索引 ────────────────────────────────────
ALTER TABLE factory_reviews ADD INDEX IF NOT EXISTS idx_factoryId (factoryId);
ALTER TABLE factory_reviews ADD INDEX IF NOT EXISTS idx_userId (userId);

-- ── product_reviews 表索引 ────────────────────────────────────
ALTER TABLE product_reviews ADD INDEX IF NOT EXISTS idx_productId (productId);
ALTER TABLE product_reviews ADD INDEX IF NOT EXISTS idx_userId (userId);
