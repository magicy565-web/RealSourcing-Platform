/**
 * 执行数据库索引优化脚本（兼容 MySQL 5.7+）
 * 运行: npx tsx scripts/run-indexes.ts
 */
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import * as path from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 需要添加的索引列表: [table, indexName, columns]
const INDEXES: [string, string, string][] = [
  // factories
  ["factories", "idx_category", "category"],
  ["factories", "idx_rating", "overallScore"],
  ["factories", "idx_country", "country"],
  ["factories", "idx_city", "city"],
  // products
  ["products", "idx_factoryId", "factoryId"],
  ["products", "idx_category", "category"],
  ["products", "idx_rating", "rating"],
  // inquiries
  ["inquiries", "idx_buyerId", "buyerId"],
  ["inquiries", "idx_factoryId", "factoryId"],
  ["inquiries", "idx_status", "status"],
  ["inquiries", "idx_createdAt", "createdAt"],
  // meetings
  ["meetings", "idx_buyerId", "buyerId"],
  ["meetings", "idx_factoryId", "factoryId"],
  ["meetings", "idx_status", "status"],
  ["meetings", "idx_scheduledAt", "scheduledAt"],
  // webinars
  ["webinars", "idx_hostId", "hostId"],
  ["webinars", "idx_status", "status"],
  ["webinars", "idx_scheduledAt", "scheduledAt"],
  // notifications
  ["notifications", "idx_userId", "userId"],
  ["notifications", "idx_isRead", "isRead"],
  // user_favorites
  ["user_favorites", "idx_userId_targetType", "userId, targetType"],
  ["user_favorites", "idx_targetType_targetId", "targetType, targetId"],
  // messages
  ["messages", "idx_webinarId", "webinarId"],
  ["messages", "idx_senderId", "senderId"],
  ["messages", "idx_type", "type"],
  // webinar_participants
  ["webinar_participants", "idx_webinarId", "webinarId"],
  ["webinar_participants", "idx_userId", "userId"],
  // factory_reviews
  ["factory_reviews", "idx_factoryId", "factoryId"],
  ["factory_reviews", "idx_userId", "userId"],
  // product_reviews
  ["product_reviews", "idx_productId", "productId"],
  ["product_reviews", "idx_userId", "userId"],
];

async function indexExists(conn: mysql.Connection, table: string, indexName: string): Promise<boolean> {
  const [rows] = await conn.execute(
    `SELECT COUNT(*) as cnt FROM information_schema.statistics 
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, indexName]
  ) as any[];
  return rows[0].cnt > 0;
}

async function runIndexes() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  console.log("✅ 数据库连接成功\n");

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const [table, indexName, columns] of INDEXES) {
    try {
      const exists = await indexExists(connection, table, indexName);
      if (exists) {
        console.log(`⏭️  已存在，跳过: ${table}.${indexName}`);
        skipped++;
        continue;
      }
      await connection.execute(`ALTER TABLE \`${table}\` ADD INDEX \`${indexName}\` (${columns})`);
      console.log(`✅ 已添加: ${table}.${indexName} (${columns})`);
      added++;
    } catch (err: any) {
      console.error(`❌ 失败: ${table}.${indexName} — ${err.message}`);
      failed++;
    }
  }

  await connection.end();
  console.log(`\n🎉 完成! 新增: ${added}, 跳过: ${skipped}, 失败: ${failed}`);
}

runIndexes().catch(console.error);
