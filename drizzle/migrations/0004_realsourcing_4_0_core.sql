-- ============================================================
-- RealSourcing 4.0 Core Migration
-- Generated: 2026-02-24
-- Description: 新增工厂能力向量表、需求匹配结果表、RFQ报价表、Webinar预约表
-- ============================================================

-- ─── 1. 工厂能力向量表 (factory_capability_embeddings) ────────────────────────
-- 存储每家工厂的 AI 能力描述向量，用于语义匹配
CREATE TABLE IF NOT EXISTS `factory_capability_embeddings` (
  `id`                  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `factoryId`           INT NOT NULL,
  `primaryCategory`     VARCHAR(100) NOT NULL COMMENT '主品类，用于预过滤',
  `capabilityText`      TEXT NOT NULL COMMENT '工厂能力的自然语言描述（用于生成向量）',
  `embeddingVector`     MEDIUMTEXT COMMENT '1536维向量，JSON数组格式',
  `embeddingModel`      VARCHAR(100) DEFAULT 'text-embedding-3-small',
  `lastUpdatedAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY `uq_factory_embedding` (`factoryId`),
  INDEX `idx_factory_capability_category` (`primaryCategory`),
  INDEX `idx_factory_capability_updated` (`lastUpdatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='工厂能力向量表 - 4.0 核心匹配引擎数据源';

-- ─── 2. 需求匹配结果表 (demand_match_results) ─────────────────────────────────
-- 存储每次 AI 匹配的结果，支持前端轮询和历史查看
CREATE TABLE IF NOT EXISTS `demand_match_results` (
  `id`                  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `demandId`            INT NOT NULL,
  `factoryId`           INT NOT NULL,
  `matchScore`          DECIMAL(5,2) NOT NULL DEFAULT '0.00' COMMENT '综合匹配分 0-100',
  `semanticScore`       DECIMAL(5,4) DEFAULT '0.0000' COMMENT '语义相似度 0-1',
  `responsivenessScore` DECIMAL(5,2) DEFAULT '0.00' COMMENT '响应速度分',
  `trustScore`          DECIMAL(5,2) DEFAULT '0.00' COMMENT '可信度分',
  `matchReason`         TEXT COMMENT 'AI 生成的匹配理由',
  `factoryOnlineAt`     TINYINT(1) NOT NULL DEFAULT 0 COMMENT '匹配时工厂在线状态快照',
  `status`              VARCHAR(30) NOT NULL DEFAULT 'pending' COMMENT 'pending|viewed|rfq_sent|webinar_scheduled|closed',
  `viewedAt`            DATETIME(3),
  `rfqSentAt`           DATETIME(3),
  `createdAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_match_demand` (`demandId`),
  INDEX `idx_match_factory` (`factoryId`),
  INDEX `idx_match_score` (`matchScore` DESC),
  INDEX `idx_match_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='需求匹配结果表 - 4.0 15分钟快速匹配核心';

-- ─── 3. RFQ 报价表 (rfq_quotes) ───────────────────────────────────────────────
-- 工厂针对买家 RFQ 提交的正式报价单，支持阶梯报价
CREATE TABLE IF NOT EXISTS `rfq_quotes` (
  `id`                  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `inquiryId`           INT NOT NULL,
  `demandId`            INT,
  `factoryId`           INT NOT NULL,
  `buyerId`             INT NOT NULL,
  `status`              VARCHAR(30) NOT NULL DEFAULT 'pending' COMMENT 'pending|submitted|accepted|rejected|expired',
  `unitPrice`           DECIMAL(10,2) COMMENT '单价（基础报价）',
  `currency`            VARCHAR(10) DEFAULT 'USD',
  `moq`                 INT COMMENT '最小起订量',
  `leadTimeDays`        INT COMMENT '生产周期（天）',
  `validUntil`          DATETIME(3) COMMENT '报价有效期',
  `tierPricing`         JSON COMMENT '阶梯报价：[{qty:100,unitPrice:25.00},{qty:500,unitPrice:22.00}]',
  `factoryNotes`        TEXT COMMENT '工厂备注',
  `paymentTerms`        VARCHAR(255) COMMENT '付款条件，如 30% deposit, 70% before shipment',
  `shippingTerms`       VARCHAR(100) COMMENT '贸易条款，如 FOB Shenzhen',
  `sampleAvailable`     TINYINT(1) DEFAULT 0 COMMENT '是否提供样品',
  `samplePrice`         DECIMAL(10,2) COMMENT '样品价格',
  `sampleLeadDays`      INT COMMENT '样品交期（天）',
  `buyerFeedback`       TEXT COMMENT '买家反馈',
  `respondedAt`         DATETIME(3) COMMENT '工厂首次响应时间',
  `submittedAt`         DATETIME(3) COMMENT '工厂提交报价时间',
  `createdAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_rfq_inquiry` (`inquiryId`),
  INDEX `idx_rfq_factory` (`factoryId`),
  INDEX `idx_rfq_buyer` (`buyerId`),
  INDEX `idx_rfq_status` (`status`),
  INDEX `idx_rfq_demand` (`demandId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='RFQ报价表 - 4.0 30分钟获得报价核心';

-- ─── 4. Webinar 预约表 (webinar_bookings) ─────────────────────────────────────
-- 买家与工厂预约视频会议的记录
CREATE TABLE IF NOT EXISTS `webinar_bookings` (
  `id`                  INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `buyerId`             INT NOT NULL,
  `factoryId`           INT NOT NULL,
  `demandId`            INT,
  `inquiryId`           INT,
  `scheduledAt`         DATETIME(3) NOT NULL COMMENT '预约时间',
  `durationMinutes`     INT DEFAULT 30 COMMENT '会议时长（分钟）',
  `timezone`            VARCHAR(50) DEFAULT 'UTC',
  `meetingType`         VARCHAR(20) DEFAULT 'agora' COMMENT 'agora|zoom|teams',
  `meetingUrl`          VARCHAR(500) COMMENT '会议链接（声网频道名或外部链接）',
  `agoraMeetingId`      INT COMMENT '关联的 meetings 表 ID',
  `status`              VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending|confirmed|completed|cancelled|no_show',
  `buyerAgenda`         TEXT COMMENT '买家议程',
  `factoryNotes`        TEXT COMMENT '工厂备注',
  `confirmedAt`         DATETIME(3) COMMENT '工厂确认时间',
  `reminderSentAt`      DATETIME(3) COMMENT '提醒发送时间',
  `createdAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_booking_buyer` (`buyerId`),
  INDEX `idx_booking_factory` (`factoryId`),
  INDEX `idx_booking_scheduled` (`scheduledAt`),
  INDEX `idx_booking_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Webinar预约表 - 4.0 工厂实时对话核心';

-- ─── 5. AMR 指标字段扩展（factory_metrics 表）────────────────────────────────
-- 为现有 factory_metrics 表补充 AMR 真实行为数据字段
ALTER TABLE `factory_metrics`
  ADD COLUMN IF NOT EXISTS `averageResponseTimeHours` DECIMAL(6,2) DEFAULT NULL COMMENT '平均首次响应时间（小时）',
  ADD COLUMN IF NOT EXISTS `rfqResponseRate`          DECIMAL(5,2) DEFAULT NULL COMMENT 'RFQ 响应率（%）',
  ADD COLUMN IF NOT EXISTS `rfqAcceptanceRate`        DECIMAL(5,2) DEFAULT NULL COMMENT 'RFQ 接受率（%）',
  ADD COLUMN IF NOT EXISTS `smallBatchAcceptRate`     DECIMAL(5,2) DEFAULT NULL COMMENT '小批量订单接受率（%）',
  ADD COLUMN IF NOT EXISTS `sampleSuccessRate`        DECIMAL(5,2) DEFAULT NULL COMMENT '打样成功率（%）',
  ADD COLUMN IF NOT EXISTS `webinarCompletionRate`    DECIMAL(5,2) DEFAULT NULL COMMENT 'Webinar 完成率（%）',
  ADD COLUMN IF NOT EXISTS `amrScore`                 DECIMAL(5,2) DEFAULT NULL COMMENT 'AMR 综合评分（0-100）',
  ADD COLUMN IF NOT EXISTS `amrLastCalculatedAt`      DATETIME(3) DEFAULT NULL COMMENT 'AMR 最后计算时间',
  ADD COLUMN IF NOT EXISTS `totalRfqReceived`         INT DEFAULT 0 COMMENT '累计收到 RFQ 数',
  ADD COLUMN IF NOT EXISTS `totalRfqResponded`        INT DEFAULT 0 COMMENT '累计响应 RFQ 数',
  ADD COLUMN IF NOT EXISTS `totalWebinarCompleted`    INT DEFAULT 0 COMMENT '累计完成 Webinar 数';

-- ─── 6. 为 sourcing_demands 表补充匹配状态字段 ────────────────────────────────
ALTER TABLE `sourcing_demands`
  ADD COLUMN IF NOT EXISTS `matchStatus`    VARCHAR(30) DEFAULT 'idle' COMMENT 'idle|queued|processing|completed|failed',
  ADD COLUMN IF NOT EXISTS `matchJobId`     VARCHAR(100) DEFAULT NULL COMMENT 'BullMQ Job ID',
  ADD COLUMN IF NOT EXISTS `matchedAt`      DATETIME(3) DEFAULT NULL COMMENT '匹配完成时间',
  ADD COLUMN IF NOT EXISTS `matchCount`     INT DEFAULT 0 COMMENT '匹配到的工厂数量';

-- ─── 完成 ──────────────────────────────────────────────────────────────────────
-- 执行完毕后，请运行以下命令验证：
-- SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'realsourcing' AND TABLE_NAME IN ('factory_capability_embeddings', 'demand_match_results', 'rfq_quotes', 'webinar_bookings');
