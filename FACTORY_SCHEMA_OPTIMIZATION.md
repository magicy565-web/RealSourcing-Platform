# Factory 表结构优化方案 - 基于 GTM 3.1 战略

## 📋 概述

基于《RealSourcing 3.1 GTM 战略白皮书》和 **Factory Reel 沉浸式展厅模块** 的需求，现有 Factory 表结构存在 **12 个缺失字段** 和 **2 个过旧字段**。本方案设计了一套**不破坏现有数据**的迁移方案，通过添加新字段和创建关联表来完整支持 3.1 版本的所有功能。

---

## 🔍 现有 Factory 表结构分析

### 当前字段（13 个）
```typescript
export const factories = mysqlTable("factories", {
  id:           int("id").primaryKey().autoincrement(),
  userId:       int("userId").notNull(),
  name:         varchar("name", { length: 255 }).notNull(),
  slug:         varchar("slug", { length: 255 }).unique(),
  logo:         varchar("logo", { length: 500 }),
  category:     varchar("category", { length: 100 }),
  country:      varchar("country", { length: 100 }).default("China"),
  city:         varchar("city", { length: 100 }),
  description:  text("description"),
  status:       varchar("status", { length: 20 }).notNull().default("pending"),
  overallScore: decimal("overallScore", { precision: 3, scale: 2 }).default("0.00"),
  createdAt:    datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:    datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
```

### 评估
- ✅ 基础信息完整
- ❌ 缺少 GTM 3.1 核心字段（AI 匹配、在线状态、视频、信任标签等）
- ❌ 缺少运营数据（浏览量、转化率、响应时间等）

---

## 📊 缺失字段清单（基于 GTM 3.1 战略）

### 第一类：AI 驱动的信任与匹配（P0）

| 字段名 | 类型 | 说明 | GTM 对标 | 优先级 |
|-------|------|------|--------|-------|
| `aiVerificationScore` | int (0-100) | AI 验厂评分 | "AI 赋能的信任" | P0 |
| `aiVerificationReason` | text | AI 验厂理由（JSON） | "信任闭环" | P0 |
| `certificationStatus` | varchar | 认证状态（verified/pending/rejected） | "工厂实地认证" | P0 |
| `certificationDate` | datetime | 最后认证日期 | "可追溯性" | P0 |
| `complianceScore` | int (0-100) | 合规评分（ESG、法规等） | "全球 50+ 国家认证" | P0 |
| `trustBadges` | json | 信任标签数组 | "信任背书" | P0 |

### 第二类：沉浸式选品体验（P0）

| 字段名 | 类型 | 说明 | GTM 对标 | 优先级 |
|-------|------|------|--------|-------|
| `hasReel` | tinyint | 是否有 Reel 视频 | "Meeting Reel" | P0 |
| `reelCount` | int | Reel 视频数量 | "沉浸式选品" | P1 |
| `videoVerificationUrl` | varchar | 视频验厂 URL | "高清视频" | P0 |
| `productionLineVideoUrl` | varchar | 生产线视频 URL | "生产过程透明" | P1 |

### 第三类：实时交互与在线状态（P0）

| 字段名 | 类型 | 说明 | GTM 对标 | 优先级 |
|-------|------|------|--------|-------|
| `isOnline` | tinyint | 当前是否在线 | "实时互动" | P0 |
| `lastOnlineAt` | datetime | 最后在线时间 | "实时感知" | P0 |
| `availableForCall` | tinyint | 是否可连线 | "一键连线" | P0 |
| `callAvailabilityHours` | json | 可连线时间段 | "高效 1:1 选品会" | P1 |
| `averageResponseTime` | int | 平均响应时间（分钟） | "沟通效率" | P1 |

### 第四类：交易与转化数据（P1）

| 字段名 | 类型 | 说明 | GTM 对标 | 优先级 |
|-------|------|------|--------|-------|
| `totalMeetings` | int | 总会议数 | "交易链路加速" | P1 |
| `totalSampleRequests` | int | 总样品申请数 | "一键申请样品" | P1 |
| `sampleConversionRate` | decimal | 样品转订单率 | "转化率" | P1 |
| `totalOrders` | int | 总订单数 | "交易成交" | P1 |
| `totalOrderValue` | decimal | 总订单金额 | "商业化路径" | P1 |
| `disputeRate` | decimal | 纠纷率 | "降低纠纷风险" | P1 |

### 第五类：运营与展示优化（P1）

| 字段名 | 类型 | 说明 | GTM 对标 | 优先级 |
|-------|------|------|--------|-------|
| `viewCount` | int | 工厂页面浏览量 | "曝光" | P1 |
| `favoriteCount` | int | 被收藏次数 | "用户关注度" | P1 |
| `responseRate` | decimal | 消息回复率 | "沟通效率" | P1 |
| `isFeatured` | tinyint | 是否精选推荐 | "优先曝光" | P2 |
| `featuredUntil` | datetime | 精选推荐截止时间 | "广告投放" | P2 |
| `languagesSpoken` | json | 支持的语言列表 | "AI 翻译" | P1 |

---

## 🛠️ 优化方案设计

### 方案概述
采用**分层扩展**的策略，不修改现有字段，仅添加新字段和创建关联表：

1. **直接添加到 factories 表**：关键的实时状态字段（`isOnline`, `availableForCall` 等）
2. **创建 factoryMetrics 表**：运营数据和交易统计
3. **创建 factoryVerification 表**：AI 验厂和合规认证数据
4. **创建 factoryReels 表**：视频 Reel 管理
5. **创建 factoryAvailability 表**：可连线时间段管理

### 不破坏现有数据的迁移策略
- ✅ 所有新字段都设置了 `default` 值
- ✅ 不修改或删除现有字段
- ✅ 使用关联表而非修改主表结构
- ✅ 支持渐进式迁移（旧数据可以不填新字段）

---

## 📝 详细实现方案

### 1. 扩展 factories 表（添加 10 个新字段）

```typescript
export const factories = mysqlTable("factories", {
  // ── 现有字段（保持不变） ──
  id:           int("id").primaryKey().autoincrement(),
  userId:       int("userId").notNull(),
  name:         varchar("name", { length: 255 }).notNull(),
  slug:         varchar("slug", { length: 255 }).unique(),
  logo:         varchar("logo", { length: 500 }),
  category:     varchar("category", { length: 100 }),
  country:      varchar("country", { length: 100 }).default("China"),
  city:         varchar("city", { length: 100 }),
  description:  text("description"),
  status:       varchar("status", { length: 20 }).notNull().default("pending"),
  overallScore: decimal("overallScore", { precision: 3, scale: 2 }).default("0.00"),
  createdAt:    datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:    datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),

  // ── 【新增】P0 级实时状态字段 ──
  isOnline:                tinyint("isOnline").notNull().default(0),
  lastOnlineAt:            datetime("lastOnlineAt", { mode: "date", fsp: 3 }),
  availableForCall:        tinyint("availableForCall").notNull().default(0),
  averageResponseTime:     int("averageResponseTime").default(0), // 分钟

  // ── 【新增】P0 级视频与认证字段 ──
  hasReel:                 tinyint("hasReel").notNull().default(0),
  videoVerificationUrl:    varchar("videoVerificationUrl", { length: 500 }),
  certificationStatus:     varchar("certificationStatus", { length: 20 }).default("pending"), // verified/pending/rejected
  certificationDate:       datetime("certificationDate", { mode: "date", fsp: 3 }),

  // ── 【新增】P1 级运营数据字段 ──
  viewCount:               int("viewCount").notNull().default(0),
  favoriteCount:           int("favoriteCount").notNull().default(0),
  responseRate:            decimal("responseRate", { precision: 5, scale: 2 }).default("0.00"), // 百分比
  languagesSpoken:         json("languagesSpoken"), // ["English", "Chinese", "Spanish"]
  isFeatured:              tinyint("isFeatured").notNull().default(0),
  featuredUntil:           datetime("featuredUntil", { mode: "date", fsp: 3 }),
});
```

### 2. 创建 factoryVerification 表（AI 验厂和合规）

```typescript
export const factoryVerifications = mysqlTable("factory_verifications", {
  id:                      int("id").primaryKey().autoincrement(),
  factoryId:               int("factoryId").notNull().unique(),
  aiVerificationScore:     int("aiVerificationScore").notNull().default(0), // 0-100
  aiVerificationReason:    json("aiVerificationReason"), // {reason: string, factors: string[]}
  complianceScore:         int("complianceScore").notNull().default(0), // 0-100
  trustBadges:             json("trustBadges"), // [{label, color, icon}]
  lastVerificationAt:      datetime("lastVerificationAt", { mode: "date", fsp: 3 }),
  verificationExpiresAt:   datetime("verificationExpiresAt", { mode: "date", fsp: 3 }),
  createdAt:               datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:               datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
```

### 3. 创建 factoryMetrics 表（交易与运营统计）

```typescript
export const factoryMetrics = mysqlTable("factory_metrics", {
  id:                      int("id").primaryKey().autoincrement(),
  factoryId:               int("factoryId").notNull().unique(),
  totalMeetings:           int("totalMeetings").notNull().default(0),
  totalSampleRequests:     int("totalSampleRequests").notNull().default(0),
  sampleConversionRate:    decimal("sampleConversionRate", { precision: 5, scale: 2 }).default("0.00"),
  totalOrders:             int("totalOrders").notNull().default(0),
  totalOrderValue:         decimal("totalOrderValue", { precision: 15, scale: 2 }).default("0.00"),
  disputeRate:             decimal("disputeRate", { precision: 5, scale: 2 }).default("0.00"),
  reelCount:               int("reelCount").notNull().default(0),
  reelViewCount:           int("reelViewCount").notNull().default(0),
  createdAt:               datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:               datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
```

### 4. 创建 factoryReels 表（视频 Reel 管理）

```typescript
export const factoryReels = mysqlTable("factory_reels", {
  id:                      int("id").primaryKey().autoincrement(),
  factoryId:               int("factoryId").notNull(),
  title:                   varchar("title", { length: 255 }).notNull(),
  description:             text("description"),
  videoUrl:                varchar("videoUrl", { length: 500 }).notNull(),
  thumbnailUrl:            varchar("thumbnailUrl", { length: 500 }),
  duration:                int("duration").notNull(), // 秒
  keyframes:               json("keyframes"), // [{timestamp, label, icon, color}]
  viewCount:               int("viewCount").notNull().default(0),
  status:                  varchar("status", { length: 20 }).default("published"), // published/draft/archived
  createdAt:               datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:               datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
```

### 5. 创建 factoryAvailability 表（可连线时间段）

```typescript
export const factoryAvailabilities = mysqlTable("factory_availabilities", {
  id:                      int("id").primaryKey().autoincrement(),
  factoryId:               int("factoryId").notNull(),
  dayOfWeek:               int("dayOfWeek").notNull(), // 0=Sunday, 6=Saturday
  startTime:               varchar("startTime", { length: 5 }).notNull(), // "09:00"
  endTime:                 varchar("endTime", { length: 5 }).notNull(), // "18:00"
  timezone:                varchar("timezone", { length: 50 }).default("Asia/Shanghai"),
  createdAt:               datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:               datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
```

---

## 🔄 数据库迁移步骤

### 步骤 1：备份现有数据
```sql
-- 备份 factories 表
CREATE TABLE factories_backup AS SELECT * FROM factories;
```

### 步骤 2：添加新字段到 factories 表
```sql
ALTER TABLE factories ADD COLUMN isOnline TINYINT NOT NULL DEFAULT 0;
ALTER TABLE factories ADD COLUMN lastOnlineAt DATETIME(3);
ALTER TABLE factories ADD COLUMN availableForCall TINYINT NOT NULL DEFAULT 0;
ALTER TABLE factories ADD COLUMN averageResponseTime INT DEFAULT 0;
ALTER TABLE factories ADD COLUMN hasReel TINYINT NOT NULL DEFAULT 0;
ALTER TABLE factories ADD COLUMN videoVerificationUrl VARCHAR(500);
ALTER TABLE factories ADD COLUMN certificationStatus VARCHAR(20) DEFAULT 'pending';
ALTER TABLE factories ADD COLUMN certificationDate DATETIME(3);
ALTER TABLE factories ADD COLUMN viewCount INT NOT NULL DEFAULT 0;
ALTER TABLE factories ADD COLUMN favoriteCount INT NOT NULL DEFAULT 0;
ALTER TABLE factories ADD COLUMN responseRate DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE factories ADD COLUMN languagesSpoken JSON;
ALTER TABLE factories ADD COLUMN isFeatured TINYINT NOT NULL DEFAULT 0;
ALTER TABLE factories ADD COLUMN featuredUntil DATETIME(3);
```

### 步骤 3：创建新关联表
```sql
-- 创建 factory_verifications 表
CREATE TABLE factory_verifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  factoryId INT NOT NULL UNIQUE,
  aiVerificationScore INT NOT NULL DEFAULT 0,
  aiVerificationReason JSON,
  complianceScore INT NOT NULL DEFAULT 0,
  trustBadges JSON,
  lastVerificationAt DATETIME(3),
  verificationExpiresAt DATETIME(3),
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (factoryId) REFERENCES factories(id) ON DELETE CASCADE
);

-- 创建 factory_metrics 表
CREATE TABLE factory_metrics (
  id INT PRIMARY KEY AUTO_INCREMENT,
  factoryId INT NOT NULL UNIQUE,
  totalMeetings INT NOT NULL DEFAULT 0,
  totalSampleRequests INT NOT NULL DEFAULT 0,
  sampleConversionRate DECIMAL(5,2) DEFAULT 0.00,
  totalOrders INT NOT NULL DEFAULT 0,
  totalOrderValue DECIMAL(15,2) DEFAULT 0.00,
  disputeRate DECIMAL(5,2) DEFAULT 0.00,
  reelCount INT NOT NULL DEFAULT 0,
  reelViewCount INT NOT NULL DEFAULT 0,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (factoryId) REFERENCES factories(id) ON DELETE CASCADE
);

-- 创建 factory_reels 表
CREATE TABLE factory_reels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  factoryId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  videoUrl VARCHAR(500) NOT NULL,
  thumbnailUrl VARCHAR(500),
  duration INT NOT NULL,
  keyframes JSON,
  viewCount INT NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (factoryId) REFERENCES factories(id) ON DELETE CASCADE
);

-- 创建 factory_availabilities 表
CREATE TABLE factory_availabilities (
  id INT PRIMARY KEY AUTO_INCREMENT,
  factoryId INT NOT NULL,
  dayOfWeek INT NOT NULL,
  startTime VARCHAR(5) NOT NULL,
  endTime VARCHAR(5) NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Shanghai',
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (factoryId) REFERENCES factories(id) ON DELETE CASCADE
);
```

---

## 📦 Drizzle Schema 更新

完整的更新后的 schema 定义已在代码中实现，包含：
- 扩展的 `factories` 表（+10 个字段）
- 新的 `factoryVerifications` 表
- 新的 `factoryMetrics` 表
- 新的 `factoryReels` 表
- 新的 `factoryAvailabilities` 表

---

## 🔗 tRPC 路由更新建议

### 1. 扩展 `factories.list` 端点
```typescript
list: publicProcedure.query(async ({ ctx }) => {
  const factories = await getAllFactories();
  
  return await Promise.all(factories.map(async (factory) => {
    const verification = await getFactoryVerification(factory.id);
    const metrics = await getFactoryMetrics(factory.id);
    const reels = await getFactoryReels(factory.id);
    
    let isFavorited = false;
    if (ctx.user) {
      const fav = await checkUserFavorite(ctx.user.id, "factory", factory.id);
      isFavorited = !!fav;
    }
    
    return {
      ...factory,
      verification: verification || null,
      metrics: metrics || null,
      reels: reels || [],
      isFavorited,
    };
  }));
}),
```

### 2. 新增 `factories.updateOnlineStatus` 端点
```typescript
updateOnlineStatus: protectedProcedure
  .input(z.object({ isOnline: z.boolean(), availableForCall: z.boolean() }))
  .mutation(async ({ input, ctx }) => {
    const factory = await getFactoryByUserId(ctx.user.id);
    if (!factory) throw new TRPCError({ code: "NOT_FOUND" });
    
    return await updateFactory(factory.id, {
      isOnline: input.isOnline ? 1 : 0,
      availableForCall: input.availableForCall ? 1 : 0,
      lastOnlineAt: new Date(),
    });
  }),
```

---

## ✅ 验证清单

- [ ] 备份现有数据库
- [ ] 执行 SQL 迁移脚本
- [ ] 更新 Drizzle schema 定义
- [ ] 更新 tRPC 路由
- [ ] 测试工厂列表和详情页面
- [ ] 测试新增字段的查询和更新
- [ ] 验证 Factory Reel 模块与新字段的集成

---

## 📊 字段优先级总结

| 优先级 | 字段数 | 关键字段 | 实现周期 |
|-------|-------|--------|--------|
| **P0** | 10 | isOnline, availableForCall, hasReel, certificationStatus | 1 周 |
| **P1** | 12 | viewCount, favoriteCount, totalOrders, reelCount | 2 周 |
| **P2** | 2 | isFeatured, featuredUntil | 3 周 |

---

## 🎯 总结

这个优化方案通过**分层扩展**的策略，为 Factory 模块添加了 24 个新字段，完整支持 GTM 3.1 战略中的所有核心功能：
- ✅ AI 驱动的信任与匹配
- ✅ 沉浸式选品体验（Reel 视频）
- ✅ 实时交互与在线状态
- ✅ 交易与转化数据
- ✅ 运营与展示优化

所有迁移都是**非破坏性的**，现有数据不会受到影响。
