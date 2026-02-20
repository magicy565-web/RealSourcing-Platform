import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * 用户表 - 支持买家、工厂、普通用户三种角色
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: varchar("password", { length: 255 }), // 加密后的密码
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "buyer", "factory", "admin"]).default("user").notNull(),
  avatar: text("avatar"), // 用户头像 URL
  phone: varchar("phone", { length: 20 }),
  company: text("company"), // 公司名称
  position: text("position"), // 职位
  bio: text("bio"), // 个人简介
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Webinar 在线研讨会表
 */
export const webinars = mysqlTable("webinars", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  coverImage: text("coverImage"), // 封面图片 URL
  hostId: int("hostId").notNull(), // 主持人用户 ID
  scheduledAt: timestamp("scheduledAt").notNull(), // 预定时间
  duration: int("duration").notNull(), // 持续时间（分钟）
  status: mysqlEnum("status", ["draft", "scheduled", "live", "completed", "cancelled"]).default("draft").notNull(),
  maxParticipants: int("maxParticipants").default(100), // 最大参会人数
  agoraChannelName: varchar("agoraChannelName", { length: 64 }), // Agora 频道名称
  agoraToken: text("agoraToken"), // Agora Token
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Webinar 参会者表
 */
export const webinarParticipants = mysqlTable("webinarParticipants", {
  id: int("id").autoincrement().primaryKey(),
  webinarId: int("webinarId").notNull(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["registered", "attended", "cancelled"]).default("registered").notNull(),
  joinedAt: timestamp("joinedAt"),
  leftAt: timestamp("leftAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * 工厂表
 */
export const factories = mysqlTable("factories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logo: text("logo"), // 工厂 Logo URL
  coverImage: text("coverImage"), // 封面图片 URL
  ownerId: int("ownerId").notNull(), // 工厂所有者用户 ID
  address: text("address"),
  country: varchar("country", { length: 100 }),
  city: varchar("city", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  website: text("website"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"), // 评分 0-5
  reviewCount: int("reviewCount").default(0), // 评价数量
  certifications: text("certifications"), // 认证信息（JSON 格式）
  established: int("established"), // 成立年份
  employeeCount: int("employeeCount"), // 员工数量
  verified: boolean("verified").default(false), // 是否认证
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 产品表
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  coverImage: text("coverImage"), // 封面图片 URL
  images: text("images"), // 产品图片列表（JSON 格式）
  factoryId: int("factoryId").notNull(), // 所属工厂 ID
  category: varchar("category", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }), // 价格
  currency: varchar("currency", { length: 10 }).default("USD"),
  moq: int("moq"), // 最小起订量（Minimum Order Quantity）
  leadTime: int("leadTime"), // 交货时间（天）
  specifications: text("specifications"), // 规格参数（JSON 格式）
  tags: text("tags"), // 标签（JSON 格式）
  status: mysqlEnum("status", ["draft", "active", "inactive"]).default("draft").notNull(),
  viewCount: int("viewCount").default(0), // 浏览次数
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Webinar 与产品关联表
 */
export const webinarProducts = mysqlTable("webinarProducts", {
  id: int("id").autoincrement().primaryKey(),
  webinarId: int("webinarId").notNull(),
  productId: int("productId").notNull(),
  displayOrder: int("displayOrder").default(0), // 展示顺序
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * 工厂评价表
 */
export const factoryReviews = mysqlTable("factoryReviews", {
  id: int("id").autoincrement().primaryKey(),
  factoryId: int("factoryId").notNull(),
  userId: int("userId").notNull(),
  rating: int("rating").notNull(), // 评分 1-5
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * 消息通知表
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // 接收者用户 ID
  type: mysqlEnum("type", ["system", "webinar", "message", "review"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  link: text("link"), // 相关链接
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * 站内消息表
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(), // 发送者用户 ID
  receiverId: int("receiverId").notNull(), // 接收者用户 ID
  subject: varchar("subject", { length: 255 }),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// 类型导出
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Webinar = typeof webinars.$inferSelect;
export type InsertWebinar = typeof webinars.$inferInsert;

export type WebinarParticipant = typeof webinarParticipants.$inferSelect;
export type InsertWebinarParticipant = typeof webinarParticipants.$inferInsert;

export type Factory = typeof factories.$inferSelect;
export type InsertFactory = typeof factories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

export type WebinarProduct = typeof webinarProducts.$inferSelect;
export type InsertWebinarProduct = typeof webinarProducts.$inferInsert;

export type FactoryReview = typeof factoryReviews.$inferSelect;
export type InsertFactoryReview = typeof factoryReviews.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
