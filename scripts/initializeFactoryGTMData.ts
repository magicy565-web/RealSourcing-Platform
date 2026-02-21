/**
 * Factory Module GTM 3.1 Data Initialization Script
 * 为现有工厂数据生成 AI 验厂评分、运营指标、Reel 视频和可连线时间
 */

import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { eq } from "drizzle-orm";

// 加载环境变量
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ 错误: DATABASE_URL 环境变量未设置");
  process.exit(1);
}

// AI 推荐理由库
const aiRecommendationReasons = [
  "擅长小批量定制",
  "交期极短（7天内）",
  "拥有国际认证",
  "历史交易无纠纷",
  "客户满意度高",
  "支持多语言沟通",
  "生产工艺先进",
  "质量管理严格",
  "响应速度快",
  "价格竞争力强",
];

// 模拟的 Reel 视频数据
const mockReels = [
  {
    title: "生产线全景展示",
    description: "工厂现代化生产线的完整展示，展现先进的生产工艺",
    duration: 45,
    keyframes: [
      { time: 0, label: "生产线入口" },
      { time: 15, label: "自动化设备" },
      { time: 30, label: "质检环节" },
      { time: 45, label: "成品库" },
    ],
  },
  {
    title: "实验室检测过程",
    description: "展示工厂的质量检测和认证流程",
    duration: 30,
    keyframes: [
      { time: 0, label: "实验室入口" },
      { time: 10, label: "检测设备" },
      { time: 20, label: "数据分析" },
      { time: 30, label: "认证证书" },
    ],
  },
  {
    title: "产品细节展示",
    description: "高清展示产品细节和包装工艺",
    duration: 25,
    keyframes: [
      { time: 0, label: "产品展示" },
      { time: 8, label: "细节特写" },
      { time: 16, label: "包装工艺" },
      { time: 25, label: "成品检查" },
    ],
  },
];

// 信任徽章库
const trustBadges = [
  "AI验厂通过",
  "高评分工厂",
  "已认证",
  "快速响应",
  "无纠纷记录",
];

async function initializeFactoryGTMData() {
  console.log(`📡 连接数据库: ${DATABASE_URL?.substring(0, 30)}...\n`);
  const pool = mysql.createPool(DATABASE_URL!);
  const db = drizzle(pool, { schema, mode: "default" }) as any;

  try {
    console.log("🚀 开始初始化 Factory GTM 3.1 数据...\n");

    // 1. 获取所有工厂
    const factories = await db.select().from(schema.factories);
    console.log(`📦 找到 ${factories.length} 个工厂，开始生成数据...\n`);

    for (const factory of factories) {
      console.log(`⚙️  处理工厂: ${factory.name} (ID: ${factory.id})`);

      // 2. 生成 AI 验厂数据
      const aiScore = Math.floor(Math.random() * 40) + 60; // 60-100
      const complianceScore = Math.floor(Math.random() * 30) + 70; // 70-100
      const selectedReasons = aiRecommendationReasons
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 2);
      const selectedBadges = trustBadges
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 2);

      await db
        .insert(schema.factoryVerifications)
        .values({
          factoryId: factory.id,
          aiVerificationScore: aiScore,
          aiVerificationReason: selectedReasons,
          complianceScore: complianceScore,
          trustBadges: selectedBadges,
          lastVerificationAt: new Date(),
          verificationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
        } as any)
        .catch(() => {
          // 如果已存在，则忽略
        });

      // 3. 生成运营指标
      const totalMeetings = Math.floor(Math.random() * 100) + 10;
      const totalSampleRequests = Math.floor(Math.random() * 50) + 5;
      const sampleConversionRate = (Math.random() * 40 + 20).toFixed(2); // 20-60%
      const totalOrders = Math.floor(Math.random() * 200) + 20;
      const totalOrderValue = (Math.random() * 500000 + 50000).toFixed(2);
      const disputeRate = (Math.random() * 5).toFixed(2); // 0-5%

      await db
        .insert(schema.factoryMetrics)
        .values({
          factoryId: factory.id,
          totalMeetings,
          totalSampleRequests,
          sampleConversionRate: parseFloat(sampleConversionRate as string),
          totalOrders,
          totalOrderValue: parseFloat(totalOrderValue as string),
          disputeRate: parseFloat(disputeRate as string),
          reelCount: 3,
          reelViewCount: Math.floor(Math.random() * 5000) + 500,
        } as any)
        .catch(() => {
          // 如果已存在，则忽略
        });

      // 4. 生成 Reel 视频数据
      for (let i = 0; i < mockReels.length; i++) {
        const reel = mockReels[i];
        await db
          .insert(schema.factoryReels)
          .values({
            factoryId: factory.id,
            title: reel.title,
            description: reel.description,
            videoUrl: `https://example.com/videos/factory-${factory.id}-reel-${i + 1}.mp4`,
            thumbnailUrl: `https://example.com/thumbnails/factory-${factory.id}-reel-${i + 1}.jpg`,
            duration: reel.duration,
            keyframes: reel.keyframes,
            viewCount: Math.floor(Math.random() * 2000) + 100,
            status: "published",
          } as any)
          .catch(() => {
            // 如果已存在，则忽略
          });
      }

      // 5. 生成可连线时间段（周一到周五，9:00-18:00）
      const availabilities = [];
      for (let day = 1; day <= 5; day++) {
        // 1=Monday, 5=Friday
        availabilities.push({
          factoryId: factory.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "18:00",
          timezone: "Asia/Shanghai",
        });
      }

      for (const availability of availabilities) {
        await db
          .insert(schema.factoryAvailabilities)
          .values(availability as any)
          .catch(() => {
            // 如果已存在，则忽略
          });
      }

      // 6. 更新工厂表的新字段
      await db
        .update(schema.factories)
        .set({
          isOnline: Math.random() > 0.3 ? 1 : 0, // 70% 概率在线
          lastOnlineAt: new Date(),
          availableForCall: Math.random() > 0.4 ? 1 : 0, // 60% 概率可连线
          averageResponseTime: Math.floor(Math.random() * 120) + 30, // 30-150分钟
          hasReel: 1,
          certificationStatus: "verified",
          certificationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          viewCount: Math.floor(Math.random() * 10000) + 1000,
          favoriteCount: Math.floor(Math.random() * 500) + 50,
          responseRate: (Math.random() * 30 + 70).toFixed(2), // 70-100%
          languagesSpoken: ["English", "Chinese", "Spanish"].slice(
            0,
            Math.floor(Math.random() * 3) + 1
          ),
          isFeatured: Math.random() > 0.7 ? 1 : 0, // 30% 概率精选
          featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后过期
        } as any)
        .where(eq(schema.factories.id, factory.id));

      console.log(`   ✅ 已生成数据: AI验厂(${aiScore}分), 运营指标, 3个Reel视频, 可连线时间\n`);
    }

    console.log("✨ 所有工厂数据初始化完成！\n");
    console.log("📊 初始化统计:");
    console.log(`   - 工厂总数: ${factories.length}`);
    console.log(`   - 生成的 AI 验厂记录: ${factories.length}`);
    console.log(`   - 生成的运营指标记录: ${factories.length}`);
    console.log(`   - 生成的 Reel 视频: ${factories.length * 3}`);
    console.log(`   - 生成的可连线时间段: ${factories.length * 5}`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ 初始化失败:", error);
    await pool.end();
    process.exit(1);
  }
}

initializeFactoryGTMData();
