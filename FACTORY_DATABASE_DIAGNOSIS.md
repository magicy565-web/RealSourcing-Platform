# Factory 模块数据库连接诊断报告

## 📊 总体评估

**连接稳定性**: ✅ **良好** (8/10)  
**潜在 Bug 风险**: ⚠️ **中等** (需要修复 3 个问题)  
**3.1 升级兼容性**: ⚠️ **部分兼容** (新增字段需要持久化方案)

---

## 🔍 详细诊断结果

### 1. 数据库连接池配置 (Connection Pooling)

**现状**：
```typescript
// server/db.ts
let pool: mysql.Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

async function initDb() {
  if (!pool) {
    pool = mysql.createPool(process.env.DATABASE_URL!);
    db = drizzle(pool, { schema, mode: "default" }) as any;
  }
  return db;
}
```

**评估**：
- ✅ 使用了连接池（`mysql.createPool`），避免频繁创建连接。
- ✅ 单例模式初始化，确保全局只有一个连接池。
- ⚠️ **问题 1**: 没有配置连接池的最大连接数和超时时间。

**建议修复**：
```typescript
async function initDb() {
  if (!pool) {
    pool = mysql.createPool({
      ...mysql.parseUrl(process.env.DATABASE_URL!),
      waitForConnections: true,
      connectionLimit: 10, // 最多 10 个并发连接
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0,
    });
    db = drizzle(pool, { schema, mode: "default" }) as any;
  }
  return db;
}
```

---

### 2. Factory 表结构与查询逻辑一致性

**表结构** (drizzle/schema.ts):
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

**查询函数** (server/db.ts):
```typescript
export async function getAllFactories() {
  const database = await dbPromise;
  return await database.select().from(schema.factories).orderBy(desc(schema.factories.createdAt));
}

export async function getFactoryById(id: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.factories).where(eq(schema.factories.id, id));
  return rows[0];
}
```

**评估**：
- ✅ 表结构清晰，字段定义完整。
- ✅ 查询逻辑正确，使用了 Drizzle ORM 的类型安全查询。
- ✅ 有 `getFactoryDetails()` 函数用于获取关联的详情表。

---

### 3. tRPC 数据转换与 UI 兼容性

**tRPC 路由** (server/routers.ts, 第 234-267 行):
```typescript
list: publicProcedure.query(async () => {
  return await getAllFactories();
}),

byId: publicProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ input, ctx }) => {
    const factory = await getFactoryById(input.id);
    if (!factory) throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
    
    const details = await getFactoryDetails(input.id);
    const products = await getProductsByFactoryId(input.id);
    const reviews = await getFactoryReviews(input.id);
    
    let isFavorited = false;
    if (ctx.user) {
      const fav = await checkUserFavorite(ctx.user.id, "factory", input.id);
      isFavorited = !!fav;
    }
    
    return {
      ...factory,
      details: details || null,
      products,
      reviews,
      isFavorited,
    };
  }),
```

**评估**：
- ✅ 数据聚合完整，包含工厂基本信息、详情、产品、评价和收藏状态。
- ⚠️ **问题 2**: `getAllFactories()` 返回的数据不包含 `details` 和 `reviews`，但前端可能期望这些字段。

**潜在 Bug**：
```typescript
// 前端代码可能期望这样的结构：
const factory = await trpc.factories.list.useQuery();
// 但实际返回的是：
[
  { id: 1, name: "...", category: "...", ... },
  // 缺少 details, reviews, isFavorited 等字段
]
```

**建议修复**：
```typescript
list: publicProcedure.query(async ({ ctx }) => {
  const factories = await getAllFactories();
  
  // 为每个工厂补充详情信息
  return await Promise.all(factories.map(async (factory) => {
    const details = await getFactoryDetails(factory.id);
    const reviews = await getFactoryReviews(factory.id);
    
    let isFavorited = false;
    if (ctx.user) {
      const fav = await checkUserFavorite(ctx.user.id, "factory", factory.id);
      isFavorited = !!fav;
    }
    
    return {
      ...factory,
      details: details || null,
      reviews: reviews || [],
      isFavorited,
    };
  }));
}),
```

---

### 4. Factory 3.1 升级中新增字段的持久化问题

**3.1 升级新增的字段**：
- `matchScore`: { score: number, reason: string, tags: string[] }
- `onlineStatus`: { isOnline: boolean, availableForCall: boolean }
- `reel`: { videoUrl, duration, thumbnailUrl }
- `trustBadges`: Badge[]

**当前状态**：
- ❌ **这些字段在数据库中不存在**，目前仅在前端通过模拟逻辑生成。
- ⚠️ **问题 3**: 当用户刷新页面时，这些数据会丢失（因为没有持久化）。

**诊断**：
```typescript
// useFactories.ts 中的模拟逻辑
const mockMatchScore = useMemo(() => ({
  score: Math.floor(Math.random() * 40) + 60, // 60-100
  reason: "擅长小批量定制，交期极短",
  tags: ["小批量", "快速交期", "高质量"],
}), []);

const mockOnlineStatus = useMemo(() => ({
  isOnline: Math.random() > 0.3, // 70% 在线
  availableForCall: Math.random() > 0.2, // 80% 可连线
}), []);
```

**长期风险**：
- 如果后续要求这些数据持久化，需要修改数据库表结构。
- 如果多个用户同时访问，会看到不同的 `matchScore` 和 `onlineStatus`（因为是随机生成）。

**建议方案**：

**方案 A**：添加新的数据库表（推荐）
```typescript
// drizzle/schema.ts
export const factoryAIMetrics = mysqlTable("factory_ai_metrics", {
  id:            int("id").primaryKey().autoincrement(),
  factoryId:     int("factoryId").notNull().unique(),
  aiMatchScore:  int("aiMatchScore").notNull().default(0), // 0-100
  matchReason:   text("matchReason"),
  matchTags:     json("matchTags"), // ["小批量", "快速交期"]
  isOnline:      tinyint("isOnline").notNull().default(0),
  availableForCall: tinyint("availableForCall").notNull().default(0),
  lastOnlineAt:  datetime("lastOnlineAt"),
  createdAt:     datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:     datetime("updatedAt").notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export const factoryReels = mysqlTable("factory_reels", {
  id:            int("id").primaryKey().autoincrement(),
  factoryId:     int("factoryId").notNull(),
  videoUrl:      varchar("videoUrl", { length: 500 }).notNull(),
  thumbnailUrl:  varchar("thumbnailUrl", { length: 500 }),
  duration:      int("duration").notNull(), // 秒
  title:         varchar("title", { length: 255 }),
  keyframes:     json("keyframes"), // [{timestamp, label, icon, color}]
  viewCount:     int("viewCount").default(0),
  createdAt:     datetime("createdAt").notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:     datetime("updatedAt").notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
```

**方案 B**：扩展现有 `factoryDetails` 表
```typescript
// 在 factoryDetails 中添加新字段
export const factoryDetails = mysqlTable("factory_details", {
  // ... 现有字段 ...
  aiMatchScore:  int("aiMatchScore").default(0),
  matchReason:   text("matchReason"),
  matchTags:     json("matchTags"),
  isOnline:      tinyint("isOnline").default(0),
  reelVideoUrl:  varchar("reelVideoUrl", { length: 500 }),
  reelDuration:  int("reelDuration"),
});
```

---

## 🛠️ 修复优先级

| 优先级 | 问题 | 影响范围 | 修复工作量 |
|-------|------|--------|----------|
| **P0** | 问题 2: `getAllFactories()` 缺少详情字段 | 工厂列表页面崩溃 | 中等 |
| **P1** | 问题 3: 新增字段无持久化方案 | 3.1 功能无法保存 | 高 |
| **P2** | 问题 1: 连接池配置不完善 | 高并发下可能连接泄漏 | 低 |

---

## 📋 修复清单

### 修复 1: 完善连接池配置
**文件**: `server/db.ts`  
**变更**: 添加连接池参数配置  
**预期效果**: 支持高并发（10+ 并发连接）

### 修复 2: 补充 getAllFactories() 的详情数据
**文件**: `server/routers.ts` (第 234-236 行)  
**变更**: 为每个工厂补充 `details`, `reviews`, `isFavorited`  
**预期效果**: 工厂列表页面不会因缺少字段而崩溃

### 修复 3: 为新增字段设计持久化方案
**文件**: `drizzle/schema.ts` + `server/db.ts` + `server/routers.ts`  
**变更**: 创建 `factoryAIMetrics` 和 `factoryReels` 表  
**预期效果**: 3.1 新增功能可以持久化保存

---

## ✅ 验证清单

- [ ] 修复连接池配置，测试 20+ 并发请求
- [ ] 修复 `getAllFactories()` 返回数据结构，确保前端不会因缺少字段而崩溃
- [ ] 设计并实现新增字段的持久化方案
- [ ] 执行数据库迁移（如果使用 Drizzle migrations）
- [ ] 在生产环境中测试工厂列表和详情页面

---

## 📝 总结

Factory 模块与 RDS 数据库的连接**总体是稳健的**，但存在 3 个需要修复的问题：

1. **连接池配置不完善** → 高并发下可能出现连接泄漏
2. **列表接口缺少详情数据** → 前端可能因字段缺失而崩溃
3. **新增字段无持久化方案** → 3.1 功能无法保存

建议按照优先级依次修复，确保平台的稳定性和功能完整性。
