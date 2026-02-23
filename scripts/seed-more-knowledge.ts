import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // 优先加载 .env.local
dotenv.config({ path: '.env' }); // 然后加载 .env

import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "../drizzle/schema";
import { productCategories, productKnowledge } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// --- 类型定义 ---
export type KnowledgeType =
  | "certification"
  | "material"
  | "process"
  | "pricing"
  | "moq"
  | "lead_time"
  | "packaging"
  | "quality_standard"
  | "market_trend"
  | "sourcing_tip";

interface CreateKnowledgeInput {
  categorySlug: string;
  knowledgeType: KnowledgeType;
  title: string;
  content: string;
  structuredData?: Record<string, unknown> | null;
  targetMarkets?: string[] | null;
  confidence: number;
  source?: string | null;
}

async function createKnowledgeEntry(db: ReturnType<typeof drizzle<typeof schema>>, input: CreateKnowledgeInput) {
  const { categorySlug, knowledgeType, title, content, structuredData, targetMarkets, confidence, source } = input;
  await db.insert(productKnowledge).values({
    categorySlug,
    knowledgeType,
    title,
    content,
    structuredData: structuredData ? JSON.stringify(structuredData) : null,
    targetMarkets: targetMarkets ? JSON.stringify(targetMarkets) : null,
    confidence,
    source,
    isActive: 1,
    viewCount: 0,
  });
}

async function seedMoreKnowledge() {
  console.log("🚀 Starting to seed more product knowledge...");

  // Create a dedicated DB connection for the script
  const pool = mysql.createPool(process.env.DATABASE_URL!);
  const db = drizzle(pool, { schema, mode: "default" }) as any;

  try {
    // Fetch existing categories to link knowledge to them
    let existingCategories = await db.select().from(productCategories).where(eq(productCategories.isActive, 1));
    if (existingCategories.length === 0) {
      console.error("No active product categories found. Please seed initial categories first.");
      return;
    }

    const newKnowledgeEntries = [];

    // --- Add more diverse categories if needed (example) ---
    const additionalCategories = [
      { slug: "pet-supplies", name: "宠物用品", nameEn: "Pet Supplies", level: 1 },
      { slug: "outdoor-gear", name: "户外装备", nameEn: "Outdoor Gear", level: 1 },
      { slug: "baby-products", name: "母婴用品", nameEn: "Baby Products", level: 1 },
      { slug: "office-stationery", name: "办公文具", nameEn: "Office Stationery", level: 1 },
      { slug: "smart-home", name: "智能家居", nameEn: "Smart Home", level: 1 },
      { slug: "jewelry-accessories", name: "珠宝配饰", nameEn: "Jewelry & Accessories", level: 1 },
      { slug: "health-wellness", name: "健康养生", nameEn: "Health & Wellness", level: 1 },
      { slug: "automotive-parts", name: "汽车配件", nameEn: "Automotive Parts", level: 1 },
      { slug: "consumer-electronics", name: "消费电子", nameEn: "Consumer Electronics", level: 1 },
      { slug: "homeware", name: "家居用品", nameEn: "Homeware", level: 1 },
      { slug: "apparel", name: "服装", nameEn: "Apparel", level: 1 },
      { slug: "beauty", name: "美妆个护", nameEn: "Beauty & Personal Care", level: 1 },
      { slug: "sports", name: "运动健身", nameEn: "Sports & Fitness", level: 1 },
      { slug: "food-beverage", name: "食品饮料", nameEn: "Food & Beverage", level: 1 },
      { slug: "industrial-supplies", name: "工业用品", nameEn: "Industrial Supplies", level: 1 },
      { slug: "packaging-materials", name: "包装材料", nameEn: "Packaging Materials", level: 1 },
      { slug: "toys-games", name: "玩具游戏", nameEn: "Toys & Games", level: 1 },
      { slug: "garden-tools", name: "园艺工具", nameEn: "Garden Tools", level: 1 },
      { slug: "construction-materials", name: "建筑材料", nameEn: "Construction Materials", level: 1 },
      { slug: "medical-devices", name: "医疗器械", nameEn: "Medical Devices", level: 1 },
    ];

    for (const cat of additionalCategories) {
      const existing = await db.select().from(productCategories).where(eq(productCategories.slug, cat.slug));
      if (existing.length === 0) {
        await db.insert(productCategories).values({ slug: cat.slug, name: cat.name, nameEn: cat.nameEn, level: cat.level });
        console.log(`Added new category: ${cat.name}`);
        existingCategories.push({ ...cat, id: 0, description: null, iconUrl: null, isActive: 1, createdAt: new Date() }); // Add to list for knowledge seeding
      }
    }

    const knowledgeTypes: KnowledgeType[] = [
      "certification", "material", "process", "pricing", "moq", "lead_time", "packaging", "quality_standard", "market_trend", "sourcing_tip"
    ];

    // Generate 200+ knowledge entries
    let entryCount = 0;
    for (const category of existingCategories) {
      for (const type of knowledgeTypes) {
        // Generate 2-3 entries per type per category to reach 200+
        for (let i = 0; i < Math.floor(Math.random() * 2) + 2; i++) { // Randomly 2 or 3 entries
          const title = `关于${category.name}的${type}知识 #${entryCount + 1}`;
          const content = `这是关于${category.name}在${type}方面的详细专业知识，包括行业标准、最佳实践和常见问题。此条目旨在帮助采购商更好地理解和决策。例如，在${type}方面，需要注意...`;
          const confidence = Math.floor(Math.random() * 30) + 70; // 70-99
          const targetMarkets = ["global", "cn", "us", "eu"][Math.floor(Math.random() * 4)];

          newKnowledgeEntries.push({
            categorySlug: category.slug,
            knowledgeType: type,
            title: title,
            content: content,
            structuredData: { example: "data" },
            targetMarkets: [targetMarkets],
            confidence: confidence,
            source: "Manus AI Research",
          });
          entryCount++;
        }
      }
    }

    console.log(`Generated ${newKnowledgeEntries.length} new knowledge entries.`);

    // Insert new knowledge entries
    for (const entry of newKnowledgeEntries) {
      await createKnowledgeEntry(db, entry);
    }

    console.log(`Successfully seeded ${entryCount} new knowledge entries.`);

    // Verify total count
    const totalKnowledge = await db.select({ count: productKnowledge.id }).from(productKnowledge).where(eq(productKnowledge.isActive, 1));
    console.log(`Total active knowledge entries in DB: ${totalKnowledge.length}`);

  } catch (error) {
    console.error("Error seeding more knowledge:", error);
  } finally {
    await pool.end(); // Close the pool after script finishes
  }
}

seedMoreKnowledge();
