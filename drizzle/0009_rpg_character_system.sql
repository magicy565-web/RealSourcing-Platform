-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 0009_rpg_character_system.sql
-- Description: RealSourcing 5.0 RPG 角色系统 - Dropshipping 生涯地图
-- Tables: dropshipper_characters, character_milestones, character_quests
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── dropshipper_characters ──────────────────────────────────────────────────
-- 每个 Dropshipper 用户的 RPG 角色档案（核心属性面板）
CREATE TABLE IF NOT EXISTS `dropshipper_characters` (
  `id`                INT NOT NULL AUTO_INCREMENT,
  `userId`            INT NOT NULL,

  -- 角色基础信息
  `characterName`     VARCHAR(100),                          -- 角色名称（默认用用户名）
  `avatarStyle`       VARCHAR(50) DEFAULT 'entrepreneur',    -- 角色外观风格

  -- 生涯目标（Onboarding Step 1）
  `ambition`          VARCHAR(50) NOT NULL DEFAULT 'explore',
  -- 可选值: 'side_income' | 'full_time' | 'dtc_brand' | 'explore'

  -- 起点状态（Onboarding Step 2）
  `origin`            VARCHAR(50) NOT NULL DEFAULT 'newbie',
  -- 可选值: 'newbie' | 'has_idea' | 'has_store' | 'already_selling'

  -- 兴趣品类（Onboarding Step 3，JSON 数组）
  `niches`            JSON,
  -- 例如: ["home_goods", "beauty", "pet_supplies"]

  -- 等级与经验值系统
  `level`             INT NOT NULL DEFAULT 1,
  `xp`                INT NOT NULL DEFAULT 0,
  `xpToNextLevel`     INT NOT NULL DEFAULT 100,

  -- 核心属性点（影响 AI Coach 建议质量）
  `statProduct`       INT NOT NULL DEFAULT 0,   -- 选品能力
  `statMarketing`     INT NOT NULL DEFAULT 0,   -- 营销能力
  `statSupplyChain`   INT NOT NULL DEFAULT 0,   -- 供应链能力
  `statOperation`     INT NOT NULL DEFAULT 0,   -- 运营能力

  -- 当前所在阶段
  `currentStage`      VARCHAR(50) NOT NULL DEFAULT 'exploration',
  -- 可选值: 'exploration' | 'startup' | 'growth' | 'brand'

  -- 当前激活的任务 ID
  `activeQuestId`     INT,

  -- Shopify 店铺连接（可选）
  `shopifyStoreUrl`   VARCHAR(500),
  `shopifyConnected`  TINYINT NOT NULL DEFAULT 0,

  -- 统计数据
  `totalQuotesReceived`  INT NOT NULL DEFAULT 0,
  `totalSamplesOrdered`  INT NOT NULL DEFAULT 0,
  `totalSalesCompleted`  INT NOT NULL DEFAULT 0,

  -- 时间戳
  `onboardingCompletedAt` DATETIME(3),
  `createdAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `dropshipper_characters_userId_unique` (`userId`),
  KEY `idx_dc_userId` (`userId`),
  KEY `idx_dc_level` (`level`),
  KEY `idx_dc_stage` (`currentStage`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── character_milestones ────────────────────────────────────────────────────
-- 里程碑定义表（静态配置，定义整个生涯地图的节点）
CREATE TABLE IF NOT EXISTS `character_milestones` (
  `id`              INT NOT NULL AUTO_INCREMENT,
  `stage`           VARCHAR(50) NOT NULL,         -- 所属阶段
  `stageOrder`      INT NOT NULL DEFAULT 0,        -- 在阶段内的顺序
  `globalOrder`     INT NOT NULL DEFAULT 0,        -- 全局顺序（用于地图渲染）
  `title`           VARCHAR(200) NOT NULL,          -- 里程碑标题
  `titleZh`         VARCHAR(200),                  -- 中文标题
  `description`     TEXT,                          -- 描述
  `descriptionZh`   TEXT,                          -- 中文描述
  `icon`            VARCHAR(100),                  -- 图标标识符
  `xpReward`        INT NOT NULL DEFAULT 50,        -- 完成奖励 XP
  `statRewards`     JSON,                          -- 属性奖励 {"product": 5, "marketing": 0}
  `requiredAmbitions` JSON,                        -- 哪些 ambition 需要此里程碑（null=全部）
  `isOptional`      TINYINT NOT NULL DEFAULT 0,    -- 是否为可选里程碑
  `linkedFeature`   VARCHAR(100),                  -- 关联的平台功能（用于点击跳转）
  `aiPromptHint`    TEXT,                          -- AI Coach 在此节点的提示词片段
  `createdAt`       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  KEY `idx_cm_stage` (`stage`),
  KEY `idx_cm_globalOrder` (`globalOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── character_quests ────────────────────────────────────────────────────────
-- 用户任务进度表（记录每个用户每个里程碑的完成状态）
CREATE TABLE IF NOT EXISTS `character_quests` (
  `id`            INT NOT NULL AUTO_INCREMENT,
  `userId`        INT NOT NULL,
  `milestoneId`   INT NOT NULL,
  `status`        VARCHAR(20) NOT NULL DEFAULT 'locked',
  -- 可选值: 'locked' | 'available' | 'in_progress' | 'completed'
  `startedAt`     DATETIME(3),
  `completedAt`   DATETIME(3),
  `notes`         TEXT,                            -- 用户或 AI 的备注
  `createdAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `character_quests_user_milestone_unique` (`userId`, `milestoneId`),
  KEY `idx_cq_userId` (`userId`),
  KEY `idx_cq_milestoneId` (`milestoneId`),
  KEY `idx_cq_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 初始里程碑数据（生涯地图节点定义）─────────────────────────────────────

INSERT IGNORE INTO `character_milestones`
  (`id`, `stage`, `stageOrder`, `globalOrder`, `title`, `titleZh`, `description`, `descriptionZh`, `icon`, `xpReward`, `statRewards`, `linkedFeature`, `aiPromptHint`)
VALUES
-- 阶段 1: 探索期 (Exploration)
(1,  'exploration', 1, 1,  'Complete Character Setup',   '完成角色创建',     'Fill in your profile and define your business ambition', '填写档案，定义你的创业目标', 'character', 50,  '{"operation":2}',            'onboarding',        'The user has just created their character. Welcome them warmly and explain their personalized roadmap.'),
(2,  'exploration', 2, 2,  'Find Your First Product Idea','找到第一个产品想法','Use AI to research a product niche that excites you',    '用 AI 研究一个让你感兴趣的产品方向', 'search', 80,  '{"product":5}',              'ai_assistant',      'Help the user brainstorm product ideas based on their chosen niche. Ask about their target market.'),
(3,  'exploration', 3, 3,  'Analyze Product Profit',     '分析产品利润',     'Run a profit analysis on your chosen product',           '对你选定的产品进行利润分析', 'calculator', 60, '{"product":3,"operation":2}','profit_analyzer',   'Guide the user through the profit analysis tool. Help them understand margins and pricing.'),
(4,  'exploration', 4, 4,  'Research Your Competition',  '研究竞争对手',     'Understand who else is selling your product',            '了解市场上的竞争情况', 'spy',        50,  '{"marketing":3}',            'ai_assistant',      'Help the user research competitors. Suggest looking at pricing, reviews, and unique selling points.'),

-- 阶段 2: 起步期 (Startup)
(5,  'startup', 1, 5,  'Contact Your First Supplier',  '联系第一家供应商',  'Reach out to a factory and request a quote',             '向工厂发送询价请求', 'factory',    100, '{"supply_chain":5}',         'factories',         'The user is ready to contact suppliers. Help them craft a professional inquiry message.'),
(6,  'startup', 2, 6,  'Get 3 Competitive Quotes',     '获得3份竞争报价',   'Compare pricing from at least 3 different suppliers',    '比较至少3家供应商的报价', 'quotes',    120, '{"supply_chain":5,"operation":3}', 'inquiries', 'The user has received quotes. Help them compare and evaluate suppliers based on price, MOQ, and quality.'),
(7,  'startup', 3, 7,  'Order Your First Sample',      '订购第一个样品',    'Request a product sample to verify quality',             '申请样品，验证产品质量', 'sample',    150, '{"supply_chain":8}',         'sample_orders',     'The user is ordering a sample. Remind them what to check: packaging, quality, dimensions, defect rate.'),
(8,  'startup', 4, 8,  'Complete Your First Sale',     '完成第一笔销售',    'Make your first Dropshipping sale!',                     '完成你的第一笔 Dropshipping 销售！', 'sale', 300, '{"marketing":10,"operation":5}', 'ai_assistant', 'HUGE milestone! The user made their first sale. Celebrate enthusiastically and help them analyze what worked.'),

-- 阶段 3: 成长期 (Growth)
(9,  'growth', 1, 9,  'Reach $1,000 in Monthly Sales', '月销售额达到$1,000', 'Scale your store to $1,000 per month',                  '将店铺月销售额扩展到$1,000', 'revenue',  200, '{"marketing":8,"operation":5}', 'ai_assistant',   'Help the user develop a scaling strategy. Discuss ad budgets, product expansion, and automation.'),
(10, 'growth', 2, 10, 'Optimize Your Supply Chain',    '优化供应链',         'Negotiate better pricing and faster shipping',           '谈判更好的价格和更快的物流', 'optimize', 180, '{"supply_chain":10}',        'factories',         'Guide the user to renegotiate with suppliers. Help them understand volume discounts and shipping terms.'),
(11, 'growth', 3, 11, 'Launch a Second Product',       '推出第二款产品',     'Diversify your store with a second winning product',     '用第二款爆款产品多元化你的店铺', 'launch',  200, '{"product":8,"marketing":5}','ai_assistant',      'Help the user identify a complementary product that fits their existing customer base.'),
(12, 'growth', 4, 12, 'Reach $5,000 in Monthly Sales', '月销售额达到$5,000', 'Scale your business to $5,000 per month',               '将业务月销售额扩展到$5,000', 'milestone',250, '{"marketing":10,"operation":8}','ai_assistant',   'Major milestone! Help the user plan their next growth phase: hiring, automation, or brand building.'),

-- 阶段 4: 品牌期 (Brand)
(13, 'brand', 1, 13, 'Create Your Brand Identity',    '创建品牌形象',       'Design a logo, brand name, and visual identity',         '设计 Logo、品牌名称和视觉形象', 'brand',   200, '{"marketing":10}',           'ai_assistant',      'Help the user develop their brand story, target audience, and visual identity guidelines.'),
(14, 'brand', 2, 14, 'Launch Your Own Website',       '建立独立站',         'Move beyond marketplaces with your own branded store',   '超越平台，建立自己的品牌独立站', 'website', 250, '{"operation":10,"marketing":5}','ai_assistant',   'Guide the user through setting up a Shopify store with their brand identity.'),
(15, 'brand', 3, 15, 'Reach $10,000 in Monthly Sales','月销售额达到$10,000','The full-time seller milestone!',                        '全职卖家里程碑！', 'trophy',   500, '{"product":5,"marketing":10,"supply_chain":5,"operation":10}', 'ai_assistant', 'LEGENDARY milestone! The user has become a full-time seller. Celebrate massively and discuss long-term brand strategy.');
