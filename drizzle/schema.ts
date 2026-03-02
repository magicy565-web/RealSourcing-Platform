/**
 * RealSourcing Platform - Drizzle ORM Schema
 * 与阿里云 RDS MySQL 数据库完全对齐
 * 数据库: realsourcing @ rm-bp1h4o9up7249uep3to.mysql.rds.aliyuncs.com
 */
import {
  mysqlTable, int, varchar, text, json, decimal,
  datetime, tinyint, boolean, longtext,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ─── Users ────────────────────────────────────────────────────────────────────
// 实际表名: users
export const users = mysqlTable("users", {
  id:           int("id").primaryKey().autoincrement(),
  openId:       varchar("openId", { length: 64 }).notNull().unique(),
  email:        varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name:         varchar("name", { length: 100 }),
  avatar:       varchar("avatar", { length: 500 }),
  role:         varchar("role", { length: 20 }).notNull().default("user"),
  status:       varchar("status", { length: 20 }).notNull().default("active"),
  createdAt:    datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:    datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  lastSignedIn:          datetime("lastLoginAt", { mode: "date", fsp: 3 }),
  loginMethod:           varchar("loginMethod", { length: 50 }),
  platform:              varchar("platform", { length: 50 }),
  interestedCategories:  json("interestedCategories"),
  orderScale:            varchar("orderScale", { length: 50 }),
  targetMarkets:         json("targetMarkets"),
  certifications:        json("certifications"),
  onboardingCompleted:   tinyint("onboardingCompleted").default(0),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── User Profiles ────────────────────────────────────────────────────────────
// 实际表名: user_profiles
export const userProfiles = mysqlTable("user_profiles", {
  id:        int("id").primaryKey().autoincrement(),
  userId:    int("userId").notNull().unique(),
  company:   varchar("company", { length: 255 }),
  country:   varchar("country", { length: 100 }),
  bio:       text("bio"),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

// ─── Factories ────────────────────────────────────────────────────────────────
// 实际表名: factories
// GTM 3.1 升级：包含 AI 验厂、沉浸式体验、实时交互等新字段
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
  
  // P0: Real-time status fields (实时状态)
  isOnline:           tinyint("isOnline").notNull().default(0),
  lastOnlineAt:       datetime("lastOnlineAt", { mode: "date", fsp: 3 }),
  availableForCall:   tinyint("availableForCall").notNull().default(0),
  averageResponseTime: int("averageResponseTime").default(0),
  
  // P0: Video & Certification fields (视频与认证)
  hasReel:            tinyint("hasReel").notNull().default(0),
  videoVerificationUrl: varchar("videoVerificationUrl", { length: 500 }),
  certificationStatus: varchar("certificationStatus", { length: 20 }).default("pending"),
  certificationDate:  datetime("certificationDate", { mode: "date", fsp: 3 }),
  
  // P1: Operational data fields (运营数据)
  viewCount:          int("viewCount").notNull().default(0),
  favoriteCount:      int("favoriteCount").notNull().default(0),
  responseRate:       decimal("responseRate", { precision: 5, scale: 2 }).default("0.00"),
  languagesSpoken:    json("languagesSpoken"),
  isFeatured:         tinyint("isFeatured").notNull().default(0),
  featuredUntil:      datetime("featuredUntil", { mode: "date", fsp: 3 }),
  
  createdAt:    datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:    datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type Factory = typeof factories.$inferSelect;
export type InsertFactory = typeof factories.$inferInsert;

// ─── Factory Verifications ────────────────────────────────────────────────────
// 存储 AI 验厂评分和合规数据
export const factoryVerifications = mysqlTable("factory_verifications", {
  id:                    int("id").primaryKey().autoincrement(),
  factoryId:             int("factoryId").notNull().unique(),
  aiVerificationScore:   int("aiVerificationScore").notNull().default(0),
  aiVerificationReason:  json("aiVerificationReason"),
  complianceScore:       int("complianceScore").notNull().default(0),
  trustBadges:           json("trustBadges"),
  lastVerificationAt:    datetime("lastVerificationAt", { mode: "date", fsp: 3 }),
  verificationExpiresAt: datetime("verificationExpiresAt", { mode: "date", fsp: 3 }),
  createdAt:             datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:             datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type FactoryVerification = typeof factoryVerifications.$inferSelect;

// ─── Factory Metrics ──────────────────────────────────────────────────────────
// 存储交易和运营统计
export const factoryMetrics = mysqlTable("factory_metrics", {
  id:                   int("id").primaryKey().autoincrement(),
  factoryId:            int("factoryId").notNull().unique(),
  totalMeetings:        int("totalMeetings").notNull().default(0),
  totalSampleRequests:  int("totalSampleRequests").notNull().default(0),
  sampleConversionRate: decimal("sampleConversionRate", { precision: 5, scale: 2 }).default("0.00"),
  totalOrders:          int("totalOrders").notNull().default(0),
  totalOrderValue:      decimal("totalOrderValue", { precision: 15, scale: 2 }).default("0.00"),
  disputeRate:          decimal("disputeRate", { precision: 5, scale: 2 }).default("0.00"),
  reelCount:            int("reelCount").notNull().default(0),
  reelViewCount:        int("reelViewCount").notNull().default(0),
  createdAt:            datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:            datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type FactoryMetrics = typeof factoryMetrics.$inferSelect;

// ─── Factory Reels ────────────────────────────────────────────────────────────
// 管理沉浸式展厅的视频 Reel 内容
export const factoryReels = mysqlTable("factory_reels", {
  id:           int("id").primaryKey().autoincrement(),
  factoryId:    int("factoryId").notNull(),
  title:        varchar("title", { length: 255 }).notNull(),
  description:  text("description"),
  videoUrl:     varchar("videoUrl", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  duration:     int("duration").notNull(),
  keyframes:    json("keyframes"),
  viewCount:    int("viewCount").notNull().default(0),
  status:       varchar("status", { length: 20 }).default("published"),
  createdAt:    datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:    datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type FactoryReel = typeof factoryReels.$inferSelect;

// ─── Factory Availabilities ───────────────────────────────────────────────────
// 管理工厂的可连线时间段
export const factoryAvailabilities = mysqlTable("factory_availabilities", {
  id:        int("id").primaryKey().autoincrement(),
  factoryId: int("factoryId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime:   varchar("endTime", { length: 5 }).notNull(),
  timezone:  varchar("timezone", { length: 50 }).default("Asia/Shanghai"),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type FactoryAvailability = typeof factoryAvailabilities.$inferSelect;

// ─── Factory Details (新表) ───────────────────────────────────────────────────
export const factoryDetails = mysqlTable("factory_details", {
  id:                 int("id").primaryKey().autoincrement(),
  factoryId:          int("factoryId").notNull().unique(),
  established:        int("established"),
  employeeCount:      varchar("employeeCount", { length: 50 }),
  annualRevenue:      varchar("annualRevenue", { length: 100 }),
  certifications:     json("certifications"),
  productionCapacity: json("productionCapacity"),
  phone:              varchar("phone", { length: 30 }),
  email:              varchar("email", { length: 255 }),
  website:            varchar("website", { length: 500 }),
  avgResponseTime:    varchar("avgResponseTime", { length: 20 }),
  rating:             decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount:        int("reviewCount").default(0),
  coverImage:         varchar("coverImage", { length: 500 }),
  createdAt:          datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:          datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

// ─── Webinars ─────────────────────────────────────────────────────────────────
// 实际表名: webinars
export const webinars = mysqlTable("webinars", {
  id:          int("id").primaryKey().autoincrement(),
  hostId:      int("hostId").notNull(),
  title:       varchar("title", { length: 255 }).notNull(),
  slug:        varchar("slug", { length: 255 }).unique(),
  description: text("description"),
  coverImage:  varchar("coverImage", { length: 500 }),
  status:      varchar("status", { length: 20 }).notNull().default("draft"),
  scheduledAt: datetime("scheduledAt", { mode: "date", fsp: 3 }),
  duration:    int("duration").notNull().default(60),
  createdAt:   datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:   datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type Webinar = typeof webinars.$inferSelect;
export type InsertWebinar = typeof webinars.$inferInsert;

// ─── Webinar Participants ─────────────────────────────────────────────────────
// 实际表名: webinar_participants
export const webinarParticipants = mysqlTable("webinar_participants", {
  id:        int("id").primaryKey().autoincrement(),
  webinarId: int("webinarId").notNull(),
  userId:    int("userId"),
  factoryId: int("factoryId"),
  role:      varchar("role", { length: 20 }).notNull().default("attendee"),
  status:    varchar("status", { length: 20 }).notNull().default("invited"),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type WebinarParticipant = typeof webinarParticipants.$inferSelect;

// ─── Webinar Registrations (新表) ─────────────────────────────────────────────
export const webinarRegistrations = mysqlTable("webinar_registrations", {
  id:           int("id").primaryKey().autoincrement(),
  webinarId:    int("webinarId").notNull(),
  userId:       int("userId").notNull(),
  status:       varchar("status", { length: 20 }).notNull().default("registered"),
  registeredAt: datetime("registeredAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  createdAt:    datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

// ─── Products ─────────────────────────────────────────────────────────────────
// 实际表名: products
export const products = mysqlTable("products", {
  id:          int("id").primaryKey().autoincrement(),
  factoryId:   int("factoryId").notNull(),
  name:        varchar("name", { length: 255 }).notNull(),
  slug:        varchar("slug", { length: 255 }).unique(),
  category:    varchar("category", { length: 100 }),
  description: text("description"),
  coverImage:  varchar("coverImage", { length: 1024 }),
  images:      json("images"),
  status:      varchar("status", { length: 20 }).notNull().default("draft"),
  createdAt:   datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:   datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Product Details (新表) ───────────────────────────────────────────────────
export const productDetails = mysqlTable("product_details", {
  id:           int("id").primaryKey().autoincrement(),
  productId:    int("productId").notNull().unique(),
  priceMin:     decimal("priceMin", { precision: 10, scale: 2 }),
  priceMax:     decimal("priceMax", { precision: 10, scale: 2 }),
  currency:     varchar("currency", { length: 10 }).default("USD"),
  moq:          int("moq").default(1),
  stock:        int("stock").default(0),
  unit:         varchar("unit", { length: 20 }).default("件"),
  model:        varchar("model", { length: 100 }),
  brand:        varchar("brand", { length: 100 }),
  size:         varchar("size", { length: 100 }),
  weight:       varchar("weight", { length: 50 }),
  material:     varchar("material", { length: 200 }),
  features:     text("features"),
  rating:       decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount:  int("reviewCount").default(0),
  leadTimeDays: int("leadTimeDays"),
  createdAt:    datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:    datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

// ─── Webinar Products ─────────────────────────────────────────────────────────
// 实际表名: webinar_products
export const webinarProducts = mysqlTable("webinar_products", {
  id:        int("id").primaryKey().autoincrement(),
  webinarId: int("webinarId").notNull(),
  productId: int("productId").notNull(),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

// ─── Messages ─────────────────────────────────────────────────────────────────
// 实际表名: messages
export const messages = mysqlTable("messages", {
  id:        int("id").primaryKey().autoincrement(),
  webinarId: int("webinarId"),
  senderId:  int("senderId").notNull(),
  content:   text("content").notNull(),
  type:      varchar("type", { length: 20 }).notNull().default("text"),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

// ─── Subscriptions ────────────────────────────────────────────────────────────
// 实际表名: subscriptions
export const subscriptions = mysqlTable("subscriptions", {
  id:        int("id").primaryKey().autoincrement(),
  userId:    int("userId").notNull(),
  planId:    varchar("planId", { length: 50 }).notNull(),
  status:    varchar("status", { length: 20 }).notNull().default("active"),
  startedAt: datetime("startedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  expiresAt: datetime("expiresAt", { mode: "date", fsp: 3 }),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

// ─── Meetings (新表) ──────────────────────────────────────────────────────────
export const meetings = mysqlTable("meetings", {
  id:                  int("id").primaryKey().autoincrement(),
  buyerId:             int("buyerId").notNull(),
  factoryId:           int("factoryId").notNull(),
  factoryUserId:       int("factoryUserId"),
  title:               varchar("title", { length: 255 }).notNull(),
  status:              varchar("status", { length: 20 }).notNull().default("scheduled"),
  scheduledAt:         datetime("scheduledAt", { mode: "date", fsp: 3 }),
  startedAt:           datetime("startedAt", { mode: "date", fsp: 3 }),
  endedAt:             datetime("endedAt", { mode: "date", fsp: 3 }),
  durationMinutes:     int("durationMinutes"),
  recordingUrl:        varchar("recordingUrl", { length: 500 }),
  recordingThumbnail:  varchar("recordingThumbnail", { length: 500 }),
  transcript:          json("transcript"),
  aiSummary:           json("aiSummary"),
  aiReelUrl:           varchar("aiReelUrl", { length: 500 }),
  aiReelThumbnail:     varchar("aiReelThumbnail", { length: 500 }),
  productsShownCount:  int("productsShownCount").default(0),
  productsLikedCount:  int("productsLikedCount").default(0),
  inquiriesMadeCount:  int("inquiriesMadeCount").default(0),
  agoraChannelName:    varchar("agoraChannelName", { length: 64 }),
  followUpActions:     json("followUpActions"),
  notes:               text("notes"),
  createdAt:           datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:           datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

// ─── Meeting Transcripts (新表) ───────────────────────────────────────────────
export const meetingTranscripts = mysqlTable("meeting_transcripts", {
  id:          int("id").primaryKey().autoincrement(),
  meetingId:   int("meetingId").notNull(),
  speakerId:   int("speakerId"),
  speakerName: varchar("speakerName", { length: 100 }),
  content:     text("content").notNull(),
  timestamp:   varchar("timestamp", { length: 10 }),
  createdAt:   datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

// ─── Inquiries (新表) ─────────────────────────────────────────────────────────
export const inquiries = mysqlTable("inquiries", {
  id:           int("id").primaryKey().autoincrement(),
  buyerId:      int("buyerId").notNull(),
  factoryId:    int("factoryId").notNull(),
  productId:    int("productId"),
  meetingId:    int("meetingId"),
  quantity:     int("quantity"),
  destination:  varchar("destination", { length: 255 }),
  notes:        text("notes"),
  status:       varchar("status", { length: 20 }).notNull().default("pending"),
  replyContent: text("replyContent"),
  repliedAt:    datetime("repliedAt", { mode: "date", fsp: 3 }),
  quotedPrice:  decimal("quotedPrice", { precision: 10, scale: 2 }),
  currency:     varchar("currency", { length: 10 }).default("USD"),
  createdAt:    datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:    datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

// ─── Factory Reviews (新表) ───────────────────────────────────────────────────
export const factoryReviews = mysqlTable("factory_reviews", {
  id:        int("id").primaryKey().autoincrement(),
  factoryId: int("factoryId").notNull(),
  userId:    int("userId").notNull(),
  rating:    int("rating").notNull(),
  comment:   text("comment"),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type FactoryReview = typeof factoryReviews.$inferSelect;

// ─── Product Reviews (新表) ───────────────────────────────────────────────────
export const productReviews = mysqlTable("product_reviews", {
  id:        int("id").primaryKey().autoincrement(),
  productId: int("productId").notNull(),
  userId:    int("userId").notNull(),
  rating:    int("rating").notNull(),
  comment:   text("comment"),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type ProductReview = typeof productReviews.$inferSelect;

// ─── User Favorites (新表) ────────────────────────────────────────────────────
export const userFavorites = mysqlTable("user_favorites", {
  id:         int("id").primaryKey().autoincrement(),
  userId:     int("userId").notNull(),
  targetType: varchar("targetType", { length: 20 }).notNull(),
  targetId:   int("targetId").notNull(),
  createdAt:  datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type UserFavorite = typeof userFavorites.$inferSelect;

// ─── Notifications (新表) ─────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id:        int("id").primaryKey().autoincrement(),
  userId:    int("userId").notNull(),
  type:      varchar("type", { length: 30 }).notNull(),
  title:     varchar("title", { length: 255 }).notNull(),
  content:   text("content"),
  link:      varchar("link", { length: 500 }),
  isRead:    tinyint("isRead").default(0),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Webinar Reels (新表) ─────────────────────────────────────────────────────
export const webinarReels = mysqlTable("webinar_reels", {
  id:                 int("id").primaryKey().autoincrement(),
  webinarId:          int("webinarId").notNull(),
  userId:             int("userId").notNull(),
  clips:              json("clips"),
  bgm:                varchar("bgm", { length: 255 }),
  subtitlesEnabled:   tinyint("subtitlesEnabled").default(1),
  aiCopy:             text("aiCopy"),
  hashtags:           json("hashtags"),
  status:             varchar("status", { length: 50 }).notNull().default("draft"),
  publishedPlatforms: json("publishedPlatforms"),
  createdAt:          datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:          datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type WebinarReel = typeof webinarReels.$inferSelect;
export type InsertWebinarReel = typeof webinarReels.$inferInsert;

// ─── Webinar Likes (新表) ─────────────────────────────────────────────────────
export const webinarLikes = mysqlTable("webinar_likes", {
  id:        int("id").primaryKey().autoincrement(),
  webinarId: int("webinarId").notNull(),
  userId:    int("userId").notNull(),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type WebinarLike = typeof webinarLikes.$inferSelect;

// ─── Factory Follows (新表) ───────────────────────────────────────────────────
export const factoryFollows = mysqlTable("factory_follows", {
  id:        int("id").primaryKey().autoincrement(),
  factoryId: int("factoryId").notNull(),
  userId:    int("userId").notNull(),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type FactoryFollow = typeof factoryFollows.$inferSelect;

// ─── Sample Orders (样品订单) ──────────────────────────────────────────────────
export const sampleOrders = mysqlTable("sample_orders", {
  id:              int("id").primaryKey().autoincrement(),
  buyerId:         int("buyerId").notNull(),
  factoryId:       int("factoryId").notNull(),
  productId:       int("productId").notNull(),
  quantity:        int("quantity").notNull().default(1),
  unitPrice:       decimal("unitPrice", { precision: 10, scale: 2 }),
  totalAmount:     decimal("totalAmount", { precision: 10, scale: 2 }),
  currency:        varchar("currency", { length: 10 }).default("USD"),
  status:          varchar("status", { length: 30 }).notNull().default("pending"),
  shippingName:    varchar("shippingName", { length: 100 }),
  shippingAddress: text("shippingAddress"),
  shippingCountry: varchar("shippingCountry", { length: 100 }),
  shippingPhone:   varchar("shippingPhone", { length: 30 }),
  trackingNumber:  varchar("trackingNumber", { length: 100 }),
  notes:           text("notes"),
  paymentStatus:   varchar("paymentStatus", { length: 20 }).default("unpaid"),
  paymentRef:      varchar("paymentRef", { length: 255 }),
  createdAt:       datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:       datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type SampleOrder = typeof sampleOrders.$inferSelect;
export type InsertSampleOrder = typeof sampleOrders.$inferInsert;

// ─── Factory Certifications (工厂认证) ────────────────────────────────────────
export const factoryCertifications = mysqlTable("factory_certifications", {
  id:          int("id").primaryKey().autoincrement(),
  factoryId:   int("factoryId").notNull(),
  name:        varchar("name", { length: 100 }).notNull(),
  issuer:      varchar("issuer", { length: 200 }),
  issuedAt:    varchar("issuedAt", { length: 20 }),
  expiresAt:   varchar("expiresAt", { length: 20 }),
  fileUrl:     varchar("fileUrl", { length: 500 }),
  verified:    tinyint("verified").default(0),
  createdAt:   datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type FactoryCertification = typeof factoryCertifications.$inferSelect;
export type InsertFactoryCertification = typeof factoryCertifications.$inferInsert;

// ─── Meeting Availability (会议可预约时间段) ────────────────────────────────────
export const meetingAvailability = mysqlTable("meeting_availability", {
  id:           int("id").primaryKey().autoincrement(),
  factoryId:    int("factoryId").notNull(),
  dayOfWeek:    int("dayOfWeek"),
  specificDate: varchar("specificDate", { length: 20 }),
  startTime:    varchar("startTime", { length: 8 }).notNull(),
  endTime:      varchar("endTime", { length: 8 }).notNull(),
  timezone:     varchar("timezone", { length: 50 }).default("Asia/Shanghai"),
  isActive:     tinyint("isActive").default(1),
  createdAt:    datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type MeetingAvailability = typeof meetingAvailability.$inferSelect;

// ─── Inquiry Messages (询价专用消息表) ───────────────────────────────────────────
// 独立的询价消息表，支持双向通信（买家/工厂）及未读状态管理
export const inquiryMessages = mysqlTable("inquiry_messages", {
  id:         int("id").primaryKey().autoincrement(),
  inquiryId:  int("inquiryId").notNull(),
  senderId:   int("senderId").notNull(),
  senderRole: varchar("senderRole", { length: 20 }).notNull().default("buyer"), // 'buyer' | 'factory'
  content:    text("content").notNull(),
  isRead:     tinyint("isRead").notNull().default(0),
  createdAt:  datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:  datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type InquiryMessage = typeof inquiryMessages.$inferSelect;
export type InsertInquiryMessage = typeof inquiryMessages.$inferInsert;

// ─── Webinar Leads (意向线索) ─────────────────────────────────────────────────
// 直播间抢单产生的高意向线索，供应链管家通过 WhatsApp 跟进
export const webinarLeads = mysqlTable("webinar_leads", {
  id:          int("id").primaryKey().autoincrement(),
  webinarId:   int("webinarId").notNull(),
  userId:      int("userId"),
  productId:   int("productId"),
  productName: varchar("productName", { length: 255 }),
  quantity:    varchar("quantity", { length: 50 }),
  // 买家联系信息（从 user 表冗余，方便管家直接查看）
  buyerName:   varchar("buyerName", { length: 100 }),
  buyerEmail:  varchar("buyerEmail", { length: 320 }),
  // 线索状态: new → contacted → qualified → converted → lost
  status:      varchar("status", { length: 30 }).notNull().default("new"),
  // 管家备注
  notes:       text("notes"),
  // 来源渠道
  source:      varchar("source", { length: 50 }).default("webinar_live"),
  createdAt:   datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:   datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type WebinarLead = typeof webinarLeads.$inferSelect;
export type InsertWebinarLead = typeof webinarLeads.$inferInsert;


// ─── AI Recommendation Feedback (AI 推荐反馈) ─────────────────────────────────
// 记录用户对 AI 工厂推荐的 👍/👎 反馈，用于持续优化推荐质量
export const aiRecommendationFeedback = mysqlTable("ai_recommendation_feedback", {
  id:                       int("id").primaryKey().autoincrement(),
  userId:                   int("userId").notNull(),
  factoryId:                int("factoryId").notNull(),
  isHelpful:                tinyint("isHelpful").notNull(),
  feedbackText:             varchar("feedbackText", { length: 500 }),
  recommendationMainReason: varchar("recommendationMainReason", { length: 500 }),
  model:                    varchar("model", { length: 100 }).notNull().default("gpt-4.1-mini"),
  createdAt:                datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type AIRecommendationFeedback = typeof aiRecommendationFeedback.$inferSelect;
export type InsertAIRecommendationFeedback = typeof aiRecommendationFeedback.$inferInsert;

// ─── Sourcing Demands (Phase 3: Agentic AI 多模态采购需求) ─────────────────────
// 存储从 URL/视频/PDF 中提取的结构化采购需求
export const sourcingDemands = mysqlTable("sourcing_demands", {
  id:                  int("id").primaryKey().autoincrement(),
  userId:              int("userId").notNull(),
  sourceType:          varchar("sourceType", { length: 20 }).notNull().default("text"),
  sourceUri:           varchar("sourceUri", { length: 1024 }),
  status:              varchar("status", { length: 20 }).notNull().default("pending"),
  productName:         varchar("productName", { length: 255 }),
  productDescription:  text("productDescription"),
  keyFeatures:         json("keyFeatures"),
  targetAudience:      varchar("targetAudience", { length: 255 }),
  visualReferences:    json("visualReferences"),
  estimatedQuantity:   varchar("estimatedQuantity", { length: 100 }),
  targetPrice:         varchar("targetPrice", { length: 100 }),
  customizationNotes:  text("customizationNotes"),
  extractedData:       json("extractedData"),
  processingError:     text("processingError"),
  isPublished:         tinyint("isPublished").notNull().default(0),
  // 品类字段：由 AI 从 manufacturingParams 提取后同步写入，供匹配服务直接读取（避免 JOIN）
  productionCategory:  varchar("productionCategory", { length: 100 }),
  // 语义向量（1536 维，JSON 格式存储）
  embeddingVector:     longtext("embeddingVector"),
  embeddingModel:      varchar("embeddingModel", { length: 100 }),
  embeddingAt:         datetime("embeddingAt", { mode: "date", fsp: 3 }),
  createdAt:           datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:           datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type SourcingDemand = typeof sourcingDemands.$inferSelect;
export type InsertSourcingDemand = typeof sourcingDemands.$inferInsert;

// ─── Manufacturing Parameters (Phase 3: 工厂生产参数) ─────────────────────────
// 由 AI 从采购需求转化的工厂可读生产技术参数
export const manufacturingParameters = mysqlTable("manufacturing_parameters", {
  id:                      int("id").primaryKey().autoincrement(),
  demandId:                int("demandId").notNull().unique(),
  moq:                     int("moq"),
  materials:               json("materials"),
  dimensions:              varchar("dimensions", { length: 255 }),
  weight:                  varchar("weight", { length: 50 }),
  colorRequirements:       json("colorRequirements"),
  packagingRequirements:   text("packagingRequirements"),
  certificationsRequired:  json("certificationsRequired"),
  estimatedUnitCost:       decimal("estimatedUnitCost", { precision: 10, scale: 4 }),
  toolingCost:             decimal("toolingCost", { precision: 12, scale: 2 }),
  leadTimeDays:            int("leadTimeDays"),
  renderImageUrl:          varchar("renderImageUrl", { length: 1024 }),
  technicalDrawingUrl:     varchar("technicalDrawingUrl", { length: 1024 }),
  productionCategory:      varchar("productionCategory", { length: 100 }),
  suggestedFactoryTypes:   json("suggestedFactoryTypes"),
  createdAt:               datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:               datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type ManufacturingParameters = typeof manufacturingParameters.$inferSelect;
export type InsertManufacturingParameters = typeof manufacturingParameters.$inferInsert;

// ─── Product Knowledge Base ────────────────────────────────────────────────────

export const productCategories = mysqlTable("product_categories", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("nameEn", { length: 100 }).notNull(),
  parentSlug: varchar("parentSlug", { length: 100 }),
  level: int("level").default(1),
  description: text("description"),
  iconUrl: varchar("iconUrl", { length: 500 }),
  isActive: tinyint("isActive").default(1),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).default(sql`NOW(3)`),
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;

export const productKnowledge = mysqlTable("product_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  categorySlug: varchar("categorySlug", { length: 100 }).notNull(),
  knowledgeType: varchar("knowledgeType", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  structuredData: json("structuredData"),
  targetMarkets: json("targetMarkets"),
  confidence: int("confidence").default(80),
  source: varchar("source", { length: 200 }),
  embeddingVector: longtext("embeddingVector"),
  embeddingModel: varchar("embeddingModel", { length: 100 }),
  embeddingAt: datetime("embeddingAt", { mode: "date", fsp: 3 }),
  viewCount: int("viewCount").default(0),
  isActive: tinyint("isActive").default(1),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).default(sql`NOW(3)`),
  updatedAt: datetime("updatedAt", { mode: "date", fsp: 3 }).default(sql`NOW(3)`),
});

export type ProductKnowledgeRow = typeof productKnowledge.$inferSelect;
export type NewProductKnowledge = typeof productKnowledge.$inferInsert;

export const knowledgeUsageLog = mysqlTable("knowledge_usage_log", {
  id: int("id").autoincrement().primaryKey(),
  knowledgeId: int("knowledgeId").notNull(),
  usedInContext: varchar("usedInContext", { length: 50 }),
  demandId: int("demandId"),
  userId: int("userId"),
  relevanceScore: decimal("relevanceScore", { precision: 5, scale: 4 }),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).default(sql`NOW(3)`),
});

// ─── Factory Capability Embeddings (4.0: 15-min Matching) ────────────────────
// 存储工厂能力的语义向量，用于与采购需求进行快速语义匹配
// 每家工厂可有多条记录（按产品类别分别建立向量）
export const factoryCapabilityEmbeddings = mysqlTable("factory_capability_embeddings", {
  id:               int("id").primaryKey().autoincrement(),
  factoryId:        int("factoryId").notNull(),
  // 能力描述文本（工厂名 + 品类 + 描述 + 主要产品 + 认证 + MOQ 等）
  capabilityText:   text("capabilityText").notNull(),
  // 语义向量（1536 维，JSON 格式，与 sourcingDemands.embeddingVector 同维度）
  embeddingVector:  longtext("embeddingVector"),
  embeddingModel:   varchar("embeddingModel", { length: 100 }),
  embeddingAt:      datetime("embeddingAt", { mode: "date", fsp: 3 }),
  // 快速过滤字段（避免全表向量计算）
  primaryCategory:  varchar("primaryCategory", { length: 100 }),
  moqMin:           int("moqMin").default(1),
  leadTimeDaysMin:  int("leadTimeDaysMin").default(7),
  isActive:         tinyint("isActive").notNull().default(1),
  createdAt:        datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:        datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type FactoryCapabilityEmbedding = typeof factoryCapabilityEmbeddings.$inferSelect;
export type InsertFactoryCapabilityEmbedding = typeof factoryCapabilityEmbeddings.$inferInsert;

// ─── Demand Match Results (4.0: 15-min Matching) ─────────────────────────────
// 存储每次匹配的结果快照，避免重复计算，支持用户查看历史匹配
export const demandMatchResults = mysqlTable("demand_match_results", {
  id:               int("id").primaryKey().autoincrement(),
  demandId:         int("demandId").notNull(),
  factoryId:        int("factoryId").notNull(),
  // 综合匹配分（0-100），由语义相似度 + AMR 指标加权计算
  matchScore:       decimal("matchScore", { precision: 5, scale: 2 }).notNull().default("0.00"),
  // 语义相似度分（0-1）
  semanticScore:    decimal("semanticScore", { precision: 5, scale: 4 }).default("0.0000"),
  // 工厂响应速度分（基于 averageResponseTime 和 responseRate）
  responsivenessScore: decimal("responsivenessScore", { precision: 5, scale: 2 }).default("0.00"),
  // 工厂可信度分（基于 aiVerificationScore 和 certificationStatus）
  trustScore:       decimal("trustScore", { precision: 5, scale: 2 }).default("0.00"),
  // AI 生成的匹配理由（为什么推荐这家工厂）
  matchReason:      text("matchReason"),
  // 工厂当前在线状态快照（匹配时的实时状态）
  factoryOnlineAt:  tinyint("factoryOnlineAt").notNull().default(0),
  // 用户操作状态
  status:           varchar("status", { length: 30 }).notNull().default("pending"),
  // pending → viewed → rfq_sent → webinar_scheduled → closed
  viewedAt:         datetime("viewedAt", { mode: "date", fsp: 3 }),
  rfqSentAt:        datetime("rfqSentAt", { mode: "date", fsp: 3 }),
  createdAt:        datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:        datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type DemandMatchResult = typeof demandMatchResults.$inferSelect;
export type InsertDemandMatchResult = typeof demandMatchResults.$inferInsert;

// ─── RFQ Quotes (4.0: 30-min Quote Flow) ─────────────────────────────────────
// 工厂针对 RFQ 提交的正式报价单，支持阶梯报价
// 状态流转：pending → submitted → accepted / rejected / expired
export const rfqQuotes = mysqlTable("rfq_quotes", {
  id:               int("id").primaryKey().autoincrement(),
  inquiryId:        int("inquiryId").notNull(),
  demandId:         int("demandId"),
  factoryId:        int("factoryId").notNull(),
  buyerId:          int("buyerId").notNull(),
  status:           varchar("status", { length: 30 }).notNull().default("pending"),
  unitPrice:        decimal("unitPrice", { precision: 10, scale: 2 }),
  currency:         varchar("currency", { length: 10 }).default("USD"),
  moq:              int("moq"),
  leadTimeDays:     int("leadTimeDays"),
  validUntil:       datetime("validUntil", { mode: "date", fsp: 3 }),
  // 阶梯报价 JSON: [{ qty: 100, unitPrice: 25.00 }, { qty: 500, unitPrice: 22.00 }]
  tierPricing:      json("tierPricing"),
  factoryNotes:     text("factoryNotes"),
  paymentTerms:     varchar("paymentTerms", { length: 255 }),
  shippingTerms:    varchar("shippingTerms", { length: 100 }),
  sampleAvailable:  tinyint("sampleAvailable").default(0),
  samplePrice:      decimal("samplePrice", { precision: 10, scale: 2 }),
  sampleLeadDays:   int("sampleLeadDays"),
  buyerFeedback:    text("buyerFeedback"),
  respondedAt:      datetime("respondedAt", { mode: "date", fsp: 3 }),
  submittedAt:      datetime("submittedAt", { mode: "date", fsp: 3 }),
  createdAt:        datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:        datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type RfqQuote = typeof rfqQuotes.$inferSelect;
export type InsertRfqQuote = typeof rfqQuotes.$inferInsert;

// ─── Webinar Bookings (4.0: Factory Webinar Scheduling) ──────────────────────
// 买家与工厂预约 Webinar 的记录
// 状态流转：pending → confirmed → completed / cancelled / no_show
export const webinarBookings = mysqlTable("webinar_bookings", {
  id:               int("id").primaryKey().autoincrement(),
  buyerId:          int("buyerId").notNull(),
  factoryId:        int("factoryId").notNull(),
  demandId:         int("demandId"),
  inquiryId:        int("inquiryId"),
  scheduledAt:      datetime("scheduledAt", { mode: "date", fsp: 3 }).notNull(),
  durationMinutes:  int("durationMinutes").default(30),
  timezone:         varchar("timezone", { length: 50 }).default("UTC"),
  meetingType:      varchar("meetingType", { length: 20 }).default("agora"),
  meetingUrl:       varchar("meetingUrl", { length: 500 }),
  agoraMeetingId:   int("agoraMeetingId"),
  status:           varchar("status", { length: 20 }).notNull().default("pending"),
  buyerAgenda:      text("buyerAgenda"),
  factoryNotes:     text("factoryNotes"),
  confirmedAt:      datetime("confirmedAt", { mode: "date", fsp: 3 }),
  reminderSentAt:   datetime("reminderSentAt", { mode: "date", fsp: 3 }),
  createdAt:        datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:        datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type WebinarBooking = typeof webinarBookings.$inferSelect;
export type InsertWebinarBooking = typeof webinarBookings.$inferInsert;

// ─── Feishu Quote Cache (4.0: 飞书报价缓存) ───────────────────────────────────
// 缓存从飞书 Bitable 获取的报价数据，避免重复调用飞书 API
// 同时作为 Open Claw 回调数据的本地镜像
export const feishuQuoteCache = mysqlTable("feishu_quote_cache", {
  id:               int("id").primaryKey().autoincrement(),
  // 飞书 Bitable 记录 ID（用于更新时定位）
  bitableRecordId:  varchar("bitableRecordId", { length: 100 }),
  factoryId:        int("factoryId").notNull(),
  category:         varchar("category", { length: 100 }),
  productName:      varchar("productName", { length: 255 }),
  unitPrice:        decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  currency:         varchar("currency", { length: 10 }).default("USD"),
  moq:              int("moq").notNull(),
  leadTimeDays:     int("leadTimeDays").notNull(),
  // 阶梯报价 JSON: [{ qty: 100, price: 25.00 }, { qty: 500, price: 22.00 }]
  tierPricing:      json("tierPricing"),
  paymentTerms:     varchar("paymentTerms", { length: 255 }),
  shippingTerms:    varchar("shippingTerms", { length: 100 }),
  isVerified:       tinyint("isVerified").notNull().default(0),
  // 数据来源：feishu_api（飞书 API 直接获取）| claw_agent（Open Claw 抓取）| manual（人工录入）
  dataSource:       varchar("dataSource", { length: 30 }).notNull().default("feishu_api"),
  // 报价最后更新时间（来自飞书 last_updated 字段）
  quoteUpdatedAt:   datetime("quoteUpdatedAt", { mode: "date", fsp: 3 }),
  // 是否过期（超过 90 天自动标记）
  isExpired:        tinyint("isExpired").notNull().default(0),
  // 缓存过期时间（默认 24 小时刷新）
  cacheExpiresAt:   datetime("cacheExpiresAt", { mode: "date", fsp: 3 }),
  createdAt:        datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:        datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type FeishuQuoteCache = typeof feishuQuoteCache.$inferSelect;
export type InsertFeishuQuoteCache = typeof feishuQuoteCache.$inferInsert;

// ─── Claw Agent Status (4.0: Open Claw Agent 状态持久化) ──────────────────────
// 持久化 Open Claw Agent 的心跳状态，支持多实例监控
export const clawAgentStatus = mysqlTable("claw_agent_status", {
  id:                   int("id").primaryKey().autoincrement(),
  agentId:              varchar("agentId", { length: 100 }).notNull().unique(),
  // 当前状态：online | offline | alert | maintenance
  status:               varchar("status", { length: 20 }).notNull().default("offline"),
  version:              varchar("version", { length: 50 }),
  // 部署环境：aliyun_wuying（阿里云无影）| local | docker
  deployEnv:            varchar("deployEnv", { length: 50 }).default("aliyun_wuying"),
  deployEnvDetail:      varchar("deployEnvDetail", { length: 255 }),
  ipAddress:            varchar("ipAddress", { length: 50 }),
  lastHeartbeatAt:      datetime("lastHeartbeatAt", { mode: "date", fsp: 3 }),
  // 关联工厂（4.1 新增）
  factoryId:            int("factoryId"),
  factoryName:          varchar("factoryName", { length: 255 }),
  // Agent 能力声明（4.1 新增）：[{type, isConfigured, priority, config}]
  capabilities:         json("capabilities"),
  // 当前正在处理的任务数
  activeJobs:           int("activeJobs").notNull().default(0),
  // 累计处理任务总数
  totalJobsProcessed:   int("totalJobsProcessed").notNull().default(0),
  // 累计失败任务数
  totalJobsFailed:      int("totalJobsFailed").notNull().default(0),
  // 最后一次成功处理的任务 ID
  lastSuccessJobId:     varchar("lastSuccessJobId", { length: 100 }),
  // 最后一次失败原因
  lastFailureReason:    text("lastFailureReason"),
  // 是否启用（可手动禁用某个 Agent）
  isEnabled:            tinyint("isEnabled").notNull().default(1),
  createdAt:            datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:            datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type ClawAgentStatus = typeof clawAgentStatus.$inferSelect;
export type InsertClawAgentStatus = typeof clawAgentStatus.$inferInsert;

// ─── RFQ Claw Jobs (4.0: Open Claw 任务追踪) ─────────────────────────────────
// 追踪每个 rfq-claw-queue 任务的执行状态，支持超时告警和重试
export const rfqClawJobs = mysqlTable("rfq_claw_jobs", {
  id:               int("id").primaryKey().autoincrement(),
  // BullMQ Job ID
  jobId:            varchar("jobId", { length: 100 }).notNull().unique(),
  demandId:         int("demandId").notNull(),
  factoryId:        int("factoryId").notNull(),
  buyerId:          int("buyerId").notNull(),
  matchResultId:    int("matchResultId"),
  category:         varchar("category", { length: 100 }),
  // 任务状态：queued | active | completed | failed | timeout | cancelled
  status:           varchar("status", { length: 20 }).notNull().default("queued"),
  // 处理该任务的 Agent ID
  assignedAgentId:  varchar("assignedAgentId", { length: 100 }),
  // 任务入队时间
  enqueuedAt:       datetime("enqueuedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  // 任务开始处理时间
  startedAt:        datetime("startedAt", { mode: "date", fsp: 3 }),
  // 任务完成时间
  completedAt:      datetime("completedAt", { mode: "date", fsp: 3 }),
  // 失败原因
  failureReason:    text("failureReason"),
  // 重试次数
  retryCount:       int("retryCount").notNull().default(0),
  // 是否已发送超时告警
  timeoutAlertSent: tinyint("timeoutAlertSent").notNull().default(0),
  // 4.1 新增：标准化任务 ID 和 Agent 推送标记
  taskId:           varchar("taskId", { length: 150 }),
  agentPushed:      tinyint("agentPushed").notNull().default(0),
  agentId:          varchar("agentId", { length: 100 }),
  createdAt:        datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:        datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type RfqClawJob = typeof rfqClawJobs.$inferSelect;
export type InsertRfqClawJob = typeof rfqClawJobs.$inferInsert;

// ─── Handshake Requests (4.0: 15-min Real-time Matching) ─────────────────────
// 买家向匹配工厂发起"请求对话"时创建记录
// 状态流转：pending → accepted → rejected / expired
export const handshakeRequests = mysqlTable("handshake_requests", {
  id:                   int("id").primaryKey().autoincrement(),
  demandId:             int("demandId").notNull(),
  factoryId:            int("factoryId").notNull(),
  buyerId:              int("buyerId").notNull(),
  matchResultId:        int("matchResultId"),
  // pending | accepted | rejected | expired
  status:               varchar("status", { length: 20 }).notNull().default("pending"),
  buyerMessage:         text("buyerMessage"),
  factoryRejectReason:  varchar("factoryRejectReason", { length: 500 }),
  // 请求超时时间（默认 15 分钟后过期）
  expiresAt:            datetime("expiresAt", { mode: "date", fsp: 3 }).notNull(),
  respondedAt:          datetime("respondedAt", { mode: "date", fsp: 3 }),
  // 接受后创建的沟通室 URL slug
  roomSlug:             varchar("roomSlug", { length: 100 }),
  // RFQ 触发时间和模式（4.1 新增）
  rfqTriggeredAt:       datetime("rfqTriggeredAt", { mode: "date", fsp: 3 }),
  rfqMode:              varchar("rfqMode", { length: 30 }),
  createdAt:            datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:            datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type HandshakeRequest = typeof handshakeRequests.$inferSelect;
export type InsertHandshakeRequest = typeof handshakeRequests.$inferInsert;

// ─── Sourcing Room Messages (4.0: 30-min First Conversation) ─────────────────
// 买家与工厂在需求沟通室中的实时对话记录
export const sourcingRoomMessages = mysqlTable("sourcing_room_messages", {
  id:           int("id").primaryKey().autoincrement(),
  handshakeId:  int("handshakeId").notNull(),
  senderId:     int("senderId").notNull(),
  senderRole:   varchar("senderRole", { length: 20 }).notNull().default("buyer"), // buyer | factory | ai
  content:      text("content").notNull(),
  messageType:  varchar("messageType", { length: 20 }).notNull().default("text"), // text | system | ai_intro
  isRead:       tinyint("isRead").notNull().default(0),
  createdAt:    datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type SourcingRoomMessage = typeof sourcingRoomMessages.$inferSelect;
export type InsertSourcingRoomMessage = typeof sourcingRoomMessages.$inferInsert;

// ─── Purchase Orders (采购单) ─────────────────────────────────────────────────
// 买家接受报价后自动生成的采购单
// 状态流转：draft → confirmed → in_production → shipped → completed / cancelled
export const purchaseOrders = mysqlTable("purchase_orders", {
  id:              int("id").primaryKey().autoincrement(),
  poNumber:        varchar("poNumber", { length: 50 }).notNull().unique(),  // PO-20260227-001
  buyerId:         int("buyerId").notNull(),
  factoryId:       int("factoryId").notNull(),
  inquiryId:       int("inquiryId"),
  rfqQuoteId:      int("rfqQuoteId"),
  demandId:        int("demandId"),
  // 产品信息
  productName:     varchar("productName", { length: 255 }),
  quantity:        int("quantity"),
  unitPrice:       decimal("unitPrice", { precision: 10, scale: 2 }),
  totalAmount:     decimal("totalAmount", { precision: 15, scale: 2 }),
  currency:        varchar("currency", { length: 10 }).default("USD"),
  // 交期与条款
  leadTimeDays:    int("leadTimeDays"),
  expectedDelivery: datetime("expectedDelivery", { mode: "date", fsp: 3 }),
  paymentTerms:    varchar("paymentTerms", { length: 255 }),
  shippingTerms:   varchar("shippingTerms", { length: 100 }),
  // 阶梯报价快照（JSON）
  tierPricing:     json("tierPricing"),
  // 状态
  status:          varchar("status", { length: 30 }).notNull().default("draft"),
  // 备注
  buyerNotes:      text("buyerNotes"),
  factoryNotes:    text("factoryNotes"),
  // 时间戳
  confirmedAt:     datetime("confirmedAt", { mode: "date", fsp: 3 }),
  createdAt:       datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:       datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

// ─── Negotiation Sessions (4.4: 动态议价) ────────────────────────────────────
// 买家发起议价请求后创建的议价会话
// 状态: pending → ai_generating → factory_reviewing → accepted / rejected / counter_proposed → closed
export const negotiationSessions = mysqlTable("negotiation_sessions", {
  id:               int("id").primaryKey().autoincrement(),
  rfqQuoteId:       int("rfqQuoteId").notNull(),
  buyerId:          int("buyerId").notNull(),
  factoryId:        int("factoryId").notNull(),
  demandId:         int("demandId"),
  inquiryId:        int("inquiryId"),
  buyerRequest:     text("buyerRequest").notNull(),
  targetPrice:      decimal("targetPrice", { precision: 10, scale: 2 }),
  targetMoq:        int("targetMoq"),
  targetLeadTime:   int("targetLeadTime"),
  originalPrice:    decimal("originalPrice", { precision: 10, scale: 2 }),
  originalMoq:      int("originalMoq"),
  originalLeadTime: int("originalLeadTime"),
  originalCurrency: varchar("originalCurrency", { length: 10 }).default("USD"),
  aiAnalysis:       json("aiAnalysis"),
  aiConfidence:     decimal("aiConfidence", { precision: 5, scale: 2 }),
  status:           varchar("status", { length: 30 }).notNull().default("pending"),
  finalPrice:       decimal("finalPrice", { precision: 10, scale: 2 }),
  finalMoq:         int("finalMoq"),
  finalLeadTime:    int("finalLeadTime"),
  roundCount:       int("roundCount").notNull().default(0),
  resolvedAt:       datetime("resolvedAt", { mode: "date", fsp: 3 }),
  createdAt:        datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:        datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type NegotiationSession = typeof negotiationSessions.$inferSelect;
export type InsertNegotiationSession = typeof negotiationSessions.$inferInsert;

// ─── Negotiation Rounds (4.4: 议价轮次记录) ──────────────────────────────────
export const negotiationRounds = mysqlTable("negotiation_rounds", {
  id:               int("id").primaryKey().autoincrement(),
  sessionId:        int("sessionId").notNull(),
  roundNumber:      int("roundNumber").notNull().default(1),
  initiatedBy:      varchar("initiatedBy", { length: 20 }).notNull().default("buyer"),
  proposedPrice:    decimal("proposedPrice", { precision: 10, scale: 2 }),
  proposedMoq:      int("proposedMoq"),
  proposedLeadTime: int("proposedLeadTime"),
  proposedTerms:    text("proposedTerms"),
  isAiGenerated:    tinyint("isAiGenerated").notNull().default(0),
  aiReasoning:      text("aiReasoning"),
  responseBy:       varchar("responseBy", { length: 20 }),
  responseAction:   varchar("responseAction", { length: 20 }),
  responseMessage:  text("responseMessage"),
  respondedAt:      datetime("respondedAt", { mode: "date", fsp: 3 }),
  feishuMsgId:      varchar("feishuMsgId", { length: 100 }),
  createdAt:        datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type NegotiationRound = typeof negotiationRounds.$inferSelect;
export type InsertNegotiationRound = typeof negotiationRounds.$inferInsert;

// ─── Transaction History (4.4: 历史成交数据) ─────────────────────────────────
export const transactionHistory = mysqlTable("transaction_history", {
  id:                   int("id").primaryKey().autoincrement(),
  purchaseOrderId:      int("purchaseOrderId").notNull(),
  buyerId:              int("buyerId").notNull(),
  factoryId:            int("factoryId").notNull(),
  rfqQuoteId:           int("rfqQuoteId"),
  negotiationSessionId: int("negotiationSessionId"),
  quotedPrice:          decimal("quotedPrice", { precision: 10, scale: 2 }),
  finalPrice:           decimal("finalPrice", { precision: 10, scale: 2 }),
  priceDiscountPct:     decimal("priceDiscountPct", { precision: 5, scale: 2 }),
  quotedLeadDays:       int("quotedLeadDays"),
  actualLeadDays:       int("actualLeadDays"),
  leadTimeVarianceDays: int("leadTimeVarianceDays"),
  quantity:             int("quantity"),
  totalAmount:          decimal("totalAmount", { precision: 15, scale: 2 }),
  currency:             varchar("currency", { length: 10 }).default("USD"),
  productCategory:      varchar("productCategory", { length: 100 }),
  qualityScore:         decimal("qualityScore", { precision: 3, scale: 1 }),
  serviceScore:         decimal("serviceScore", { precision: 3, scale: 1 }),
  deliveryScore:        decimal("deliveryScore", { precision: 3, scale: 1 }),
  overallScore:         decimal("overallScore", { precision: 3, scale: 1 }),
  buyerReview:          text("buyerReview"),
  reviewedAt:           datetime("reviewedAt", { mode: "date", fsp: 3 }),
  negotiationRounds:    int("negotiationRounds").default(0),
  wasNegotiated:        tinyint("wasNegotiated").notNull().default(0),
  completedAt:          datetime("completedAt", { mode: "date", fsp: 3 }),
  createdAt:            datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type TransactionHistory = typeof transactionHistory.$inferSelect;
export type InsertTransactionHistory = typeof transactionHistory.$inferInsert;

// ─── Factory Scores (4.4: 工厂动态评分) ──────────────────────────────────────
export const factoryScores = mysqlTable("factory_scores", {
  id:                     int("id").primaryKey().autoincrement(),
  factoryId:              int("factoryId").notNull().unique(),
  overallScore:           decimal("overallScore", { precision: 4, scale: 2 }).default("0.00"),
  qualityScore:           decimal("qualityScore", { precision: 4, scale: 2 }).default("0.00"),
  serviceScore:           decimal("serviceScore", { precision: 4, scale: 2 }).default("0.00"),
  deliveryScore:          decimal("deliveryScore", { precision: 4, scale: 2 }).default("0.00"),
  priceCompetitiveness:   decimal("priceCompetitiveness", { precision: 5, scale: 2 }).default("0.00"),
  avgNegotiationRounds:   decimal("avgNegotiationRounds", { precision: 4, scale: 2 }).default("0.00"),
  avgPriceFlexibility:    decimal("avgPriceFlexibility", { precision: 5, scale: 2 }).default("0.00"),
  negotiationSuccessRate: decimal("negotiationSuccessRate", { precision: 5, scale: 2 }).default("0.00"),
  onTimeDeliveryRate:     decimal("onTimeDeliveryRate", { precision: 5, scale: 2 }).default("0.00"),
  avgLeadTimeVariance:    decimal("avgLeadTimeVariance", { precision: 5, scale: 2 }).default("0.00"),
  totalTransactions:      int("totalTransactions").notNull().default(0),
  totalReviews:           int("totalReviews").notNull().default(0),
  negotiationStyle:       json("negotiationStyle"),
  lastCalculatedAt:       datetime("lastCalculatedAt", { mode: "date", fsp: 3 }),
  createdAt:              datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:              datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type FactoryScore = typeof factoryScores.$inferSelect;
export type InsertFactoryScore = typeof factoryScores.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ─── 5.0 Commander Core Tables ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Commander Phones (5.0: 指挥官手机设备注册) ───────────────────────────────
export const commanderPhones = mysqlTable("commander_phones", {
  id:             int("id").primaryKey().autoincrement(),
  factoryId:      int("factoryId").notNull(),
  userId:         int("userId").notNull(),
  deviceName:     varchar("deviceName", { length: 100 }),
  activationCode: varchar("activationCode", { length: 32 }).notNull().unique(),
  isActivated:    tinyint("isActivated").notNull().default(0),
  activatedAt:    datetime("activatedAt", { mode: "date", fsp: 3 }),
  wechatOpenId:   varchar("wechatOpenId", { length: 64 }),
  wechatNickname: varchar("wechatNickname", { length: 100 }),
  wechatBoundAt:  datetime("wechatBoundAt", { mode: "date", fsp: 3 }),
  deviceModel:    varchar("deviceModel", { length: 100 }),
  lastActiveAt:   datetime("lastActiveAt", { mode: "date", fsp: 3 }),
  status:         varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt:      datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:      datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type CommanderPhone = typeof commanderPhones.$inferSelect;
export type InsertCommanderPhone = typeof commanderPhones.$inferInsert;

// ─── OpenClaw Instances (5.0: 云端数字员工实例) ───────────────────────────────
export const openclawInstances = mysqlTable("openclaw_instances", {
  id:              int("id").primaryKey().autoincrement(),
  factoryId:       int("factoryId"),
  instanceType:    varchar("instanceType", { length: 20 }).notNull().default("standard"),
  instanceName:    varchar("instanceName", { length: 100 }),
  region:          varchar("region", { length: 50 }).default("cn-hangzhou"),
  status:          varchar("status", { length: 20 }).notNull().default("offline"),
  agentId:         varchar("agentId", { length: 64 }).unique(),
  cpuUsage:        decimal("cpuUsage", { precision: 5, scale: 2 }).default("0.00"),
  memoryUsage:     decimal("memoryUsage", { precision: 5, scale: 2 }).default("0.00"),
  activeTaskCount: int("activeTaskCount").notNull().default(0),
  totalTaskCount:  int("totalTaskCount").notNull().default(0),
  lastHeartbeatAt: datetime("lastHeartbeatAt", { mode: "date", fsp: 3 }),
  provisionedAt:   datetime("provisionedAt", { mode: "date", fsp: 3 }),
  createdAt:       datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:       datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type OpenclawInstance = typeof openclawInstances.$inferSelect;
export type InsertOpenclawInstance = typeof openclawInstances.$inferInsert;

// ─── OpenClaw Accounts (5.0: 托管账号管理) ───────────────────────────────────
export const openclawAccounts = mysqlTable("openclaw_accounts", {
  id:               int("id").primaryKey().autoincrement(),
  factoryId:        int("factoryId").notNull(),
  instanceId:       int("instanceId"),
  platform:         varchar("platform", { length: 50 }).notNull(),
  accountUsername:  varchar("accountUsername", { length: 200 }).notNull(),
  encryptedSession: text("encryptedSession"),
  sessionExpiresAt: datetime("sessionExpiresAt", { mode: "date", fsp: 3 }),
  healthStatus:     varchar("healthStatus", { length: 20 }).notNull().default("unknown"),
  lastCheckedAt:    datetime("lastCheckedAt", { mode: "date", fsp: 3 }),
  lastSuccessAt:    datetime("lastSuccessAt", { mode: "date", fsp: 3 }),
  errorMessage:     text("errorMessage"),
  isActive:         tinyint("isActive").notNull().default(1),
  createdAt:        datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:        datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type OpenclawAccount = typeof openclawAccounts.$inferSelect;
export type InsertOpenclawAccount = typeof openclawAccounts.$inferInsert;

// ─── Commander Tasks (5.0: 指挥台任务中心) ───────────────────────────────────
export const commanderTasks = mysqlTable("commander_tasks", {
  id:              int("id").primaryKey().autoincrement(),
  factoryId:       int("factoryId").notNull(),
  userId:          int("userId").notNull(),
  instanceId:      int("instanceId"),
  taskType:        varchar("taskType", { length: 50 }).notNull(),
  taskTitle:       varchar("taskTitle", { length: 200 }).notNull(),
  taskParams:      json("taskParams"),
  status:          varchar("status", { length: 20 }).notNull().default("pending"),
  progress:        int("progress").notNull().default(0),
  progressMessage: varchar("progressMessage", { length: 500 }),
  creditCost:      int("creditCost").notNull().default(0),
  creditRefunded:  tinyint("creditRefunded").notNull().default(0),
  resultSummary:   text("resultSummary"),
  resultData:      json("resultData"),
  errorMessage:    text("errorMessage"),
  startedAt:       datetime("startedAt", { mode: "date", fsp: 3 }),
  completedAt:     datetime("completedAt", { mode: "date", fsp: 3 }),
  bullJobId:       varchar("bullJobId", { length: 100 }),
  createdAt:       datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:       datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type CommanderTask = typeof commanderTasks.$inferSelect;
export type InsertCommanderTask = typeof commanderTasks.$inferInsert;

// ─── Inbound Leads (5.0: 入站询盘/线索) ──────────────────────────────────────
export const inboundLeads = mysqlTable("inbound_leads", {
  id:              int("id").primaryKey().autoincrement(),
  factoryId:       int("factoryId").notNull(),
  commanderTaskId: int("commanderTaskId"),
  source:          varchar("source", { length: 50 }).notNull(),
  platform:        varchar("platform", { length: 50 }),
  externalId:      varchar("externalId", { length: 200 }),
  buyerName:       varchar("buyerName", { length: 200 }),
  buyerCompany:    varchar("buyerCompany", { length: 200 }),
  buyerCountry:    varchar("buyerCountry", { length: 100 }),
  buyerEmail:      varchar("buyerEmail", { length: 320 }),
  buyerPhone:      varchar("buyerPhone", { length: 50 }),
  buyerLinkedin:   varchar("buyerLinkedin", { length: 500 }),
  productCategory: varchar("productCategory", { length: 100 }),
  originalContent: text("originalContent"),
  aiSummary:       text("aiSummary"),
  qualityScore:    int("qualityScore").notNull().default(0),
  intentScore:     int("intentScore").notNull().default(0),
  status:          varchar("status", { length: 20 }).notNull().default("new"),
  isRead:          tinyint("isRead").notNull().default(0),
  readAt:          datetime("readAt", { mode: "date", fsp: 3 }),
  inquiryTime:     datetime("inquiryTime", { mode: "date", fsp: 3 }),
  wechatNotified:  tinyint("wechatNotified").notNull().default(0),
  notifiedAt:      datetime("notifiedAt", { mode: "date", fsp: 3 }),
  feishuArchived:  tinyint("feishuArchived").notNull().default(0),
  feishuRecordId:  varchar("feishuRecordId", { length: 100 }),
  createdAt:       datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:       datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type InboundLead = typeof inboundLeads.$inferSelect;
export type InsertInboundLead = typeof inboundLeads.$inferInsert;

// ─── Lead Replies (5.0: 询盘回复记录) ────────────────────────────────────────
export const leadReplies = mysqlTable("lead_replies", {
  id:                int("id").primaryKey().autoincrement(),
  leadId:            int("leadId").notNull(),
  factoryId:         int("factoryId").notNull(),
  userId:            int("userId").notNull(),
  chineseContent:    text("chineseContent").notNull(),
  englishContent:    text("englishContent"),
  translationStatus: varchar("translationStatus", { length: 20 }).notNull().default("pending"),
  sendStatus:        varchar("sendStatus", { length: 20 }).notNull().default("draft"),
  sentAt:            datetime("sentAt", { mode: "date", fsp: 3 }),
  sendError:         text("sendError"),
  clawJobId:         varchar("clawJobId", { length: 100 }),
  isApproved:        tinyint("isApproved").notNull().default(0),
  approvedAt:        datetime("approvedAt", { mode: "date", fsp: 3 }),
  createdAt:         datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:         datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type LeadReply = typeof leadReplies.$inferSelect;
export type InsertLeadReply = typeof leadReplies.$inferInsert;

// ─── Credit Ledger (5.0: 积分流水账本) ───────────────────────────────────────
export const creditLedger = mysqlTable("credit_ledger", {
  id:             int("id").primaryKey().autoincrement(),
  factoryId:      int("factoryId").notNull(),
  userId:         int("userId").notNull(),
  txType:         varchar("txType", { length: 30 }).notNull(),
  amount:         int("amount").notNull(),
  balanceAfter:   int("balanceAfter").notNull(),
  description:    varchar("description", { length: 500 }),
  relatedTaskId:  int("relatedTaskId"),
  relatedOrderId: varchar("relatedOrderId", { length: 100 }),
  paymentMethod:  varchar("paymentMethod", { length: 30 }),
  paymentAmount:  decimal("paymentAmount", { precision: 10, scale: 2 }),
  createdAt:      datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type InsertCreditLedgerEntry = typeof creditLedger.$inferInsert;

// ─── Digital Assets (5.0: 工厂数字资产快照) ──────────────────────────────────
export const digitalAssets = mysqlTable("digital_assets", {
  id:                      int("id").primaryKey().autoincrement(),
  factoryId:               int("factoryId").notNull().unique(),
  geoScore:                int("geoScore").notNull().default(0),
  geoScoreHistory:         json("geoScoreHistory"),
  lastGeoScanAt:           datetime("lastGeoScanAt", { mode: "date", fsp: 3 }),
  alibabaProfileUrl:       varchar("alibabaProfileUrl", { length: 500 }),
  linkedinProfileUrl:      varchar("linkedinProfileUrl", { length: 500 }),
  websiteUrl:              varchar("websiteUrl", { length: 500 }),
  thomasnetUrl:            varchar("thomasnetUrl", { length: 500 }),
  totalContentPieces:      int("totalContentPieces").notNull().default(0),
  totalDirectoryListings:  int("totalDirectoryListings").notNull().default(0),
  totalAiCitations:        int("totalAiCitations").notNull().default(0),
  schemaOrgData:           json("schemaOrgData"),
  schemaLastUpdatedAt:     datetime("schemaLastUpdatedAt", { mode: "date", fsp: 3 }),
  lastMonthlyReportAt:     datetime("lastMonthlyReportAt", { mode: "date", fsp: 3 }),
  monthlyReportUrl:        varchar("monthlyReportUrl", { length: 500 }),
  createdAt:               datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:               datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type DigitalAsset = typeof digitalAssets.$inferSelect;
export type InsertDigitalAsset = typeof digitalAssets.$inferInsert;

// ─── Factory Credits (5.0: 工厂积分余额) ─────────────────────────────────────
export const factoryCredits = mysqlTable("factory_credits", {
  id:                int("id").primaryKey().autoincrement(),
  factoryId:         int("factoryId").notNull().unique(),
  balance:           int("balance").notNull().default(0),
  totalRecharged:    int("totalRecharged").notNull().default(0),
  totalConsumed:     int("totalConsumed").notNull().default(0),
  lastRechargeAt:    datetime("lastRechargeAt", { mode: "date", fsp: 3 }),
  lowBalanceAlerted: tinyint("lowBalanceAlerted").notNull().default(0),
  createdAt:         datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:         datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type FactoryCredit = typeof factoryCredits.$inferSelect;
export type InsertFactoryCredit = typeof factoryCredits.$inferInsert;

// ─── Factory FTGI Documents (FTGI验厂文档) ────────────────────────────────────
export const factoryFtgiDocuments = mysqlTable("factory_ftgi_documents", {
  id:          int("id").primaryKey().autoincrement(),
  factoryId:   int("factoryId").notNull(),
  docType:     varchar("docType", { length: 50 }).notNull(), // image|certification|transaction|customs|other
  fileName:    varchar("fileName", { length: 500 }).notNull(),
  fileUrl:     varchar("fileUrl", { length: 1000 }).notNull(),
  fileSize:    int("fileSize"),
  mimeType:    varchar("mimeType", { length: 100 }),
  parseStatus: varchar("parseStatus", { length: 20 }).notNull().default("pending"), // pending|processing|done|failed
  parsedJson:  json("parsedJson"),
  parseError:  text("parseError"),
  uploadedBy:  int("uploadedBy").notNull(),
  createdAt:   datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:   datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type FactoryFtgiDocument = typeof factoryFtgiDocuments.$inferSelect;
export type InsertFactoryFtgiDocument = typeof factoryFtgiDocuments.$inferInsert;

// ─── Factory FTGI Scores (FTGI综合评分) ───────────────────────────────────────
export const factoryFtgiScores = mysqlTable("factory_ftgi_scores", {
  id:            int("id").primaryKey().autoincrement(),
  factoryId:     int("factoryId").notNull().unique(),
  d1Trust:       varchar("d1Trust", { length: 20 }),       // 信任维度
  d2Fulfillment: varchar("d2Fulfillment", { length: 20 }), // 履约维度
  d3Market:      varchar("d3Market", { length: 20 }),      // 市场维度
  d4Ecosystem:   varchar("d4Ecosystem", { length: 20 }),   // 生态维度
  d5Community:   varchar("d5Community", { length: 20 }),   // 社区维度
  rawScore:      varchar("rawScore", { length: 20 }),
  aiCoefficient: varchar("aiCoefficient", { length: 20 }),
  ftgiScore:     varchar("ftgiScore", { length: 20 }),
  scoreDetails:  json("scoreDetails"),
  status:        varchar("status", { length: 20 }).notNull().default("pending"), // pending|calculating|done|failed
  errorMessage:  text("errorMessage"),
  calculatedAt:  datetime("calculatedAt", { mode: "date", fsp: 3 }),
  createdAt:     datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:     datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type FactoryFtgiScore = typeof factoryFtgiScores.$inferSelect;
export type InsertFactoryFtgiScore = typeof factoryFtgiScores.$inferInsert;

// ─── AI Coach Sessions (AI Coach 对话会话) ────────────────────────────────────
export const aiCoachSessions = mysqlTable("ai_coach_sessions", {
  id:              int("id").primaryKey().autoincrement(),
  userId:          int("userId").notNull(),
  niche:           varchar("niche", { length: 50 }),
  coachName:       varchar("coachName", { length: 50 }),
  messages:        json("messages").notNull().default([]),
  profileSnapshot: json("profileSnapshot"),
  thumbsUpCount:   int("thumbsUpCount").notNull().default(0),
  thumbsDownCount: int("thumbsDownCount").notNull().default(0),
  topicsDiscussed: json("topicsDiscussed"),
  createdAt:       datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt:       datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type AiCoachSession = typeof aiCoachSessions.$inferSelect;
export type InsertAiCoachSession = typeof aiCoachSessions.$inferInsert;

// ─── AI Coach Message Feedback (消息级别反馈) ─────────────────────────────────
export const aiCoachFeedback = mysqlTable("ai_coach_feedback", {
  id:         int("id").primaryKey().autoincrement(),
  sessionId:  int("sessionId").notNull(),
  userId:     int("userId").notNull(),
  messageIdx: int("messageIdx").notNull(),
  feedback:   varchar("feedback", { length: 10 }).notNull(),
  comment:    text("comment"),
  createdAt:  datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type AiCoachFeedback = typeof aiCoachFeedback.$inferSelect;
export type InsertAiCoachFeedback = typeof aiCoachFeedback.$inferInsert;

// ─── AI Coach Settings (用户 Coach 配置) ──────────────────────────────────────
export const aiCoachSettings = mysqlTable("ai_coach_settings", {
  id:        int("id").primaryKey().autoincrement(),
  userId:    int("userId").notNull().unique(),
  coachName: varchar("coachName", { length: 50 }).notNull().default("Alex"),
  isEnabled: int("isEnabled").notNull().default(1),
  createdAt: datetime("createdAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime("updatedAt", { mode: "date", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});
export type AiCoachSettings = typeof aiCoachSettings.$inferSelect;
export type InsertAiCoachSettings = typeof aiCoachSettings.$inferInsert;
