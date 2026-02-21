/**
 * RealSourcing Platform - Drizzle ORM Schema
 * 与阿里云 RDS MySQL 数据库完全对齐
 * 数据库: realsourcing @ rm-bp1h4o9up7249uep3to.mysql.rds.aliyuncs.com
 */
import {
  mysqlTable, int, varchar, text, json, decimal,
  datetime, tinyint, boolean,
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

export type Factory = typeof factories.$inferSelect;
export type InsertFactory = typeof factories.$inferInsert;

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
