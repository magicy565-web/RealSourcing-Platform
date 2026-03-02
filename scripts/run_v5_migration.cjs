const mysql = require('mysql2/promise');

async function run() {
  const connectionString = 'mysql://magicyang:Wysk1214@rm-bp1h4o9up7249uep3to.mysql.rds.aliyuncs.com:3306/realsourcing';
  const c = await mysql.createConnection({
    uri: connectionString,
    multipleStatements: true
  });
  
  const sql = `
CREATE TABLE IF NOT EXISTS user_business_profiles (
  id                INT NOT NULL AUTO_INCREMENT,
  userId            INT NOT NULL,
  businessStage     VARCHAR(50) NOT NULL DEFAULT 'exploration',
  ambition          VARCHAR(50) NOT NULL DEFAULT 'learn',
  interestedNiches  JSON,
  targetMarkets     JSON,
  shopifyStoreUrl   VARCHAR(500),
  shopifyConnected  TINYINT NOT NULL DEFAULT 0,
  tiktokAccount     VARCHAR(100),
  monthlyRevenue    DECIMAL(15, 2) DEFAULT 0.00,
  totalOrders       INT DEFAULT 0,
  activeProductCount INT DEFAULT 0,
  aiSummary         TEXT,
  lastInteractedAt  DATETIME(3),
  onboardingCompletedAt DATETIME(3),
  createdAt         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY user_business_profiles_userId_unique (userId),
  KEY idx_ubp_userId (userId),
  KEY idx_ubp_stage (businessStage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roadmap_tasks (
  id              INT NOT NULL AUTO_INCREMENT,
  userId          INT NOT NULL,
  category        VARCHAR(50) NOT NULL,
  title           VARCHAR(200) NOT NULL,
  titleZh         VARCHAR(200),
  description     TEXT,
  descriptionZh   TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'todo',
  linkedFeature   VARCHAR(100),
  aiContextHint   TEXT,
  priority        INT DEFAULT 0,
  displayOrder    INT DEFAULT 0,
  startedAt       DATETIME(3),
  completedAt     DATETIME(3),
  createdAt       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_urt_userId (userId),
  KEY idx_urt_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
    
  console.log(`Executing migration...`);
  
  try {
    await c.query(sql);
    console.log('✅ Migration executed successfully');
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
  }
  
  await c.end();
}

run().catch(console.error);
