/**
 * RealSourcing Platform - Drizzle ORM Schema
 * 与 PostgreSQL 数据库完全对齐
 * 数据库: realsourcing (PostgreSQL)
 */
import {
  pgTable, serial, integer, varchar, text, jsonb, decimal,
  timestamp, smallint, boolean,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Users ────────────────────────────────────────────────────────────────────
// 实际表名: users
export const users = pgTable("users", {
  id:           serial("id").primaryKey(),
  openId:       varchar("openId", { length: 64 }).notNull().unique(),
  email:        varchar("email", { length: 320 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  name:         varchar("name", { length: 100 }),
  avatar:       varchar("avatar", { length: 500 }),
  role:         varchar("role", { length: 20 }).notNull().default("user"),
  status:       varchar("status", { length: 20 }).notNull().default("active"),
  createdAt:    timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:    timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSignedIn:          timestamp("lastLoginAt", { mode: "date", precision: 3 }),
  loginMethod:           varchar("loginMethod", { length: 50 }),
  platform:              varchar("platform", { length: 50 }),
  interestedCategories:  jsonb("interestedCategories"),
  orderScale:            varchar("orderScale", { length: 50 }),
  targetMarkets:         jsonb("targetMarkets"),
  certifications:        jsonb("certifications"),
  onboardingCompleted:   smallint("onboardingCompleted").default(0),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── User Profiles ────────────────────────────────────────────────────────────
// 实际表名: user_profiles
export const userProfiles = pgTable("user_profiles", {
  id:        serial("id").primaryKey(),
  userId:    integer("userId").notNull().unique(),
  company:   varchar("company", { length: 255 }),
  country:   varchar("country", { length: 100 }),
  bio:       text("bio"),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ─── Factories ────────────────────────────────────────────────────────────────
// 实际表名: factories
// GTM 3.1 升级：包含 AI 验厂、沉浸式体验、实时交互等新字段
export const factories = pgTable("factories", {
  id:           serial("id").primaryKey(),
  userId:       integer("userId").notNull(),
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
  isOnline:           smallint("isOnline").notNull().default(0),
  lastOnlineAt:       timestamp("lastOnlineAt", { mode: "date", precision: 3 }),
  availableForCall:   smallint("availableForCall").notNull().default(0),
  averageResponseTime: integer("averageResponseTime").default(0),
  
  // P0: Video & Certification fields (视频与认证)
  hasReel:            smallint("hasReel").notNull().default(0),
  videoVerificationUrl: varchar("videoVerificationUrl", { length: 500 }),
  certificationStatus: varchar("certificationStatus", { length: 20 }).default("pending"),
  certificationDate:  timestamp("certificationDate", { mode: "date", precision: 3 }),
  
  // P1: Operational data fields (运营数据)
  viewCount:          integer("viewCount").notNull().default(0),
  favoriteCount:      integer("favoriteCount").notNull().default(0),
  responseRate:       decimal("responseRate", { precision: 5, scale: 2 }).default("0.00"),
  languagesSpoken:    jsonb("languagesSpoken"),
  isFeatured:         smallint("isFeatured").notNull().default(0),
  featuredUntil:      timestamp("featuredUntil", { mode: "date", precision: 3 }),
  
  createdAt:    timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:    timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Factory = typeof factories.$inferSelect;
export type InsertFactory = typeof factories.$inferInsert;

// ─── Factory Verifications ────────────────────────────────────────────────────
// 存储 AI 验厂评分和合规数据
export const factoryVerifications = pgTable("factory_verifications", {
  id:                    serial("id").primaryKey(),
  factoryId:             integer("factoryId").notNull().unique(),
  aiVerificationScore:   integer("aiVerificationScore").notNull().default(0),
  aiVerificationReason:  jsonb("aiVerificationReason"),
  complianceScore:       integer("complianceScore").notNull().default(0),
  trustBadges:           jsonb("trustBadges"),
  lastVerificationAt:    timestamp("lastVerificationAt", { mode: "date", precision: 3 }),
  verificationExpiresAt: timestamp("verificationExpiresAt", { mode: "date", precision: 3 }),
  createdAt:             timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:             timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type FactoryVerification = typeof factoryVerifications.$inferSelect;

// ─── Factory Metrics ──────────────────────────────────────────────────────────
// 存储交易和运营统计
export const factoryMetrics = pgTable("factory_metrics", {
  id:                   serial("id").primaryKey(),
  factoryId:            integer("factoryId").notNull().unique(),
  totalMeetings:        integer("totalMeetings").notNull().default(0),
  totalSampleRequests:  integer("totalSampleRequests").notNull().default(0),
  sampleConversionRate: decimal("sampleConversionRate", { precision: 5, scale: 2 }).default("0.00"),
  totalOrders:          integer("totalOrders").notNull().default(0),
  totalOrderValue:      decimal("totalOrderValue", { precision: 15, scale: 2 }).default("0.00"),
  disputeRate:          decimal("disputeRate", { precision: 5, scale: 2 }).default("0.00"),
  reelCount:            integer("reelCount").notNull().default(0),
  reelViewCount:        integer("reelViewCount").notNull().default(0),
  createdAt:            timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:            timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type FactoryMetrics = typeof factoryMetrics.$inferSelect;

// ─── Factory Reels ────────────────────────────────────────────────────────────
// 管理沉浸式展厅的视频 Reel 内容
export const factoryReels = pgTable("factory_reels", {
  id:           serial("id").primaryKey(),
  factoryId:    integer("factoryId").notNull(),
  title:        varchar("title", { length: 255 }).notNull(),
  description:  text("description"),
  videoUrl:     varchar("videoUrl", { length: 500 }).notNull(),
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  duration:     integer("duration").notNull(),
  keyframes:    jsonb("keyframes"),
  viewCount:    integer("viewCount").notNull().default(0),
  status:       varchar("status", { length: 20 }).default("published"),
  createdAt:    timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:    timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type FactoryReel = typeof factoryReels.$inferSelect;

// ─── Factory Availabilities ───────────────────────────────────────────────────
// 管理工厂的可连线时间段
export const factoryAvailabilities = pgTable("factory_availabilities", {
  id:        serial("id").primaryKey(),
  factoryId: integer("factoryId").notNull(),
  dayOfWeek: integer("dayOfWeek").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime:   varchar("endTime", { length: 5 }).notNull(),
  timezone:  varchar("timezone", { length: 50 }).default("Asia/Shanghai"),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type FactoryAvailability = typeof factoryAvailabilities.$inferSelect;

// ─── Factory Details (新表) ───────────────────────────────────────────────────
export const factoryDetails = pgTable("factory_details", {
  id:                 serial("id").primaryKey(),
  factoryId:          integer("factoryId").notNull().unique(),
  established:        integer("established"),
  employeeCount:      varchar("employeeCount", { length: 50 }),
  annualRevenue:      varchar("annualRevenue", { length: 100 }),
  certifications:     jsonb("certifications"),
  productionCapacity: jsonb("productionCapacity"),
  phone:              varchar("phone", { length: 30 }),
  email:              varchar("email", { length: 255 }),
  website:            varchar("website", { length: 500 }),
  avgResponseTime:    varchar("avgResponseTime", { length: 20 }),
  rating:             decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount:        integer("reviewCount").default(0),
  coverImage:         varchar("coverImage", { length: 500 }),
  createdAt:          timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:          timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ─── Webinars ─────────────────────────────────────────────────────────────────
// 实际表名: webinars
export const webinars = pgTable("webinars", {
  id:          serial("id").primaryKey(),
  hostId:      integer("hostId").notNull(),
  title:       varchar("title", { length: 255 }).notNull(),
  slug:        varchar("slug", { length: 255 }).unique(),
  description: text("description"),
  coverImage:  varchar("coverImage", { length: 500 }),
  status:      varchar("status", { length: 20 }).notNull().default("draft"),
  scheduledAt: timestamp("scheduledAt", { mode: "date", precision: 3 }),
  duration:    integer("duration").notNull().default(60),
  createdAt:   timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Webinar = typeof webinars.$inferSelect;
export type InsertWebinar = typeof webinars.$inferInsert;

// ─── Webinar Participants ─────────────────────────────────────────────────────
// 实际表名: webinar_participants
export const webinarParticipants = pgTable("webinar_participants", {
  id:        serial("id").primaryKey(),
  webinarId: integer("webinarId").notNull(),
  userId:    integer("userId"),
  factoryId: integer("factoryId"),
  role:      varchar("role", { length: 20 }).notNull().default("attendee"),
  status:    varchar("status", { length: 20 }).notNull().default("invited"),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type WebinarParticipant = typeof webinarParticipants.$inferSelect;

// ─── Webinar Registrations (新表) ─────────────────────────────────────────────
export const webinarRegistrations = pgTable("webinar_registrations", {
  id:           serial("id").primaryKey(),
  webinarId:    integer("webinarId").notNull(),
  userId:       integer("userId").notNull(),
  status:       varchar("status", { length: 20 }).notNull().default("registered"),
  registeredAt: timestamp("registeredAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  createdAt:    timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ─── Products ─────────────────────────────────────────────────────────────────
// 实际表名: products
export const products = pgTable("products", {
  id:          serial("id").primaryKey(),
  factoryId:   integer("factoryId").notNull(),
  name:        varchar("name", { length: 255 }).notNull(),
  slug:        varchar("slug", { length: 255 }).unique(),
  category:    varchar("category", { length: 100 }),
  description: text("description"),
  coverImage:  varchar("coverImage", { length: 1024 }),
  images:      jsonb("images"),
  status:      varchar("status", { length: 20 }).notNull().default("draft"),
  createdAt:   timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Product Details (新表) ───────────────────────────────────────────────────
export const productDetails = pgTable("product_details", {
  id:           serial("id").primaryKey(),
  productId:    integer("productId").notNull().unique(),
  priceMin:     decimal("priceMin", { precision: 10, scale: 2 }),
  priceMax:     decimal("priceMax", { precision: 10, scale: 2 }),
  currency:     varchar("currency", { length: 10 }).default("USD"),
  moq:          integer("moq").default(1),
  stock:        integer("stock").default(0),
  unit:         varchar("unit", { length: 20 }).default("件"),
  model:        varchar("model", { length: 100 }),
  brand:        varchar("brand", { length: 100 }),
  size:         varchar("size", { length: 100 }),
  weight:       varchar("weight", { length: 50 }),
  material:     varchar("material", { length: 200 }),
  features:     text("features"),
  rating:       decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount:  integer("reviewCount").default(0),
  leadTimeDays: integer("leadTimeDays"),
  createdAt:    timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:    timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ─── Webinar Products ─────────────────────────────────────────────────────────
// 实际表名: webinar_products
export const webinarProducts = pgTable("webinar_products", {
  id:        serial("id").primaryKey(),
  webinarId: integer("webinarId").notNull(),
  productId: integer("productId").notNull(),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ─── Messages ─────────────────────────────────────────────────────────────────
// 实际表名: messages
export const messages = pgTable("messages", {
  id:        serial("id").primaryKey(),
  webinarId: integer("webinarId"),
  senderId:  integer("senderId").notNull(),
  content:   text("content").notNull(),
  type:      varchar("type", { length: 20 }).notNull().default("text"),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ─── Subscriptions ────────────────────────────────────────────────────────────
// 实际表名: subscriptions
export const subscriptions = pgTable("subscriptions", {
  id:        serial("id").primaryKey(),
  userId:    integer("userId").notNull(),
  planId:    varchar("planId", { length: 50 }).notNull(),
  status:    varchar("status", { length: 20 }).notNull().default("active"),
  startedAt: timestamp("startedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  expiresAt: timestamp("expiresAt", { mode: "date", precision: 3 }),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ─── Meetings (新表) ──────────────────────────────────────────────────────────
export const meetings = pgTable("meetings", {
  id:                  serial("id").primaryKey(),
  buyerId:             integer("buyerId").notNull(),
  factoryId:           integer("factoryId").notNull(),
  factoryUserId:       integer("factoryUserId"),
  title:               varchar("title", { length: 255 }).notNull(),
  status:              varchar("status", { length: 20 }).notNull().default("scheduled"),
  scheduledAt:         timestamp("scheduledAt", { mode: "date", precision: 3 }),
  startedAt:           timestamp("startedAt", { mode: "date", precision: 3 }),
  endedAt:             timestamp("endedAt", { mode: "date", precision: 3 }),
  durationMinutes:     integer("durationMinutes"),
  recordingUrl:        varchar("recordingUrl", { length: 500 }),
  recordingThumbnail:  varchar("recordingThumbnail", { length: 500 }),
  transcript:          jsonb("transcript"),
  aiSummary:           jsonb("aiSummary"),
  aiReelUrl:           varchar("aiReelUrl", { length: 500 }),
  aiReelThumbnail:     varchar("aiReelThumbnail", { length: 500 }),
  productsShownCount:  integer("productsShownCount").default(0),
  productsLikedCount:  integer("productsLikedCount").default(0),
  inquiriesMadeCount:  integer("inquiriesMadeCount").default(0),
  agoraChannelName:    varchar("agoraChannelName", { length: 64 }),
  followUpActions:     jsonb("followUpActions"),
  notes:               text("notes"),
  createdAt:           timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:           timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

// ─── Meeting Transcripts (新表) ───────────────────────────────────────────────
export const meetingTranscripts = pgTable("meeting_transcripts", {
  id:          serial("id").primaryKey(),
  meetingId:   integer("meetingId").notNull(),
  speakerId:   integer("speakerId"),
  speakerName: varchar("speakerName", { length: 100 }),
  content:     text("content").notNull(),
  timestamp:   varchar("timestamp", { length: 10 }),
  createdAt:   timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// ─── Inquiries (新表) ─────────────────────────────────────────────────────────
export const inquiries = pgTable("inquiries", {
  id:           serial("id").primaryKey(),
  buyerId:      integer("buyerId").notNull(),
  factoryId:    integer("factoryId").notNull(),
  productId:    integer("productId"),
  meetingId:    integer("meetingId"),
  quantity:     integer("quantity"),
  destination:  varchar("destination", { length: 255 }),
  notes:        text("notes"),
  status:       varchar("status", { length: 20 }).notNull().default("pending"),
  replyContent: text("replyContent"),
  repliedAt:    timestamp("repliedAt", { mode: "date", precision: 3 }),
  quotedPrice:  decimal("quotedPrice", { precision: 10, scale: 2 }),
  currency:     varchar("currency", { length: 10 }).default("USD"),
  createdAt:    timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:    timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;

// ─── Factory Reviews (新表) ───────────────────────────────────────────────────
export const factoryReviews = pgTable("factory_reviews", {
  id:        serial("id").primaryKey(),
  factoryId: integer("factoryId").notNull(),
  userId:    integer("userId").notNull(),
  rating:    integer("rating").notNull(),
  comment:   text("comment"),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type FactoryReview = typeof factoryReviews.$inferSelect;

// ─── Product Reviews (新表) ───────────────────────────────────────────────────
export const productReviews = pgTable("product_reviews", {
  id:        serial("id").primaryKey(),
  productId: integer("productId").notNull(),
  userId:    integer("userId").notNull(),
  rating:    integer("rating").notNull(),
  comment:   text("comment"),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type ProductReview = typeof productReviews.$inferSelect;

// ─── User Favorites (新表) ────────────────────────────────────────────────────
export const userFavorites = pgTable("user_favorites", {
  id:         serial("id").primaryKey(),
  userId:     integer("userId").notNull(),
  targetType: varchar("targetType", { length: 20 }).notNull(),
  targetId:   integer("targetId").notNull(),
  createdAt:  timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type UserFavorite = typeof userFavorites.$inferSelect;

// ─── Notifications (新表) ─────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id:        serial("id").primaryKey(),
  userId:    integer("userId").notNull(),
  type:      varchar("type", { length: 30 }).notNull(),
  title:     varchar("title", { length: 255 }).notNull(),
  content:   text("content"),
  link:      varchar("link", { length: 500 }),
  isRead:    smallint("isRead").default(0),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type Notification = typeof notifications.$inferSelect;

// ─── Webinar Reels (新表) ─────────────────────────────────────────────────────
export const webinarReels = pgTable("webinar_reels", {
  id:                 serial("id").primaryKey(),
  webinarId:          integer("webinarId").notNull(),
  userId:             integer("userId").notNull(),
  clips:              jsonb("clips"),
  bgm:                varchar("bgm", { length: 255 }),
  subtitlesEnabled:   smallint("subtitlesEnabled").default(1),
  aiCopy:             text("aiCopy"),
  hashtags:           jsonb("hashtags"),
  status:             varchar("status", { length: 50 }).notNull().default("draft"),
  publishedPlatforms: jsonb("publishedPlatforms"),
  createdAt:          timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:          timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type WebinarReel = typeof webinarReels.$inferSelect;
export type InsertWebinarReel = typeof webinarReels.$inferInsert;

// ─── Webinar Likes (新表) ─────────────────────────────────────────────────────
export const webinarLikes = pgTable("webinar_likes", {
  id:        serial("id").primaryKey(),
  webinarId: integer("webinarId").notNull(),
  userId:    integer("userId").notNull(),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type WebinarLike = typeof webinarLikes.$inferSelect;

// ─── Factory Follows (新表) ───────────────────────────────────────────────────
export const factoryFollows = pgTable("factory_follows", {
  id:        serial("id").primaryKey(),
  factoryId: integer("factoryId").notNull(),
  userId:    integer("userId").notNull(),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type FactoryFollow = typeof factoryFollows.$inferSelect;

// ─── Sample Orders (样品订单) ──────────────────────────────────────────────────
export const sampleOrders = pgTable("sample_orders", {
  id:              serial("id").primaryKey(),
  buyerId:         integer("buyerId").notNull(),
  factoryId:       integer("factoryId").notNull(),
  productId:       integer("productId").notNull(),
  quantity:        integer("quantity").notNull().default(1),
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
  createdAt:       timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type SampleOrder = typeof sampleOrders.$inferSelect;
export type InsertSampleOrder = typeof sampleOrders.$inferInsert;

// ─── Factory Certifications (工厂认证) ────────────────────────────────────────
export const factoryCertifications = pgTable("factory_certifications", {
  id:          serial("id").primaryKey(),
  factoryId:   integer("factoryId").notNull(),
  name:        varchar("name", { length: 100 }).notNull(),
  issuer:      varchar("issuer", { length: 200 }),
  issuedAt:    varchar("issuedAt", { length: 20 }),
  expiresAt:   varchar("expiresAt", { length: 20 }),
  fileUrl:     varchar("fileUrl", { length: 500 }),
  verified:    smallint("verified").default(0),
  createdAt:   timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type FactoryCertification = typeof factoryCertifications.$inferSelect;
export type InsertFactoryCertification = typeof factoryCertifications.$inferInsert;

// ─── Meeting Availability (会议可预约时间段) ────────────────────────────────────
export const meetingAvailability = pgTable("meeting_availability", {
  id:           serial("id").primaryKey(),
  factoryId:    integer("factoryId").notNull(),
  dayOfWeek:    integer("dayOfWeek"),
  specificDate: varchar("specificDate", { length: 20 }),
  startTime:    varchar("startTime", { length: 8 }).notNull(),
  endTime:      varchar("endTime", { length: 8 }).notNull(),
  timezone:     varchar("timezone", { length: 50 }).default("Asia/Shanghai"),
  isActive:     smallint("isActive").default(1),
  createdAt:    timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type MeetingAvailability = typeof meetingAvailability.$inferSelect;

// ─── Inquiry Messages (询价专用消息表) ───────────────────────────────────────────
// 独立的询价消息表，支持双向通信（买家/工厂）及未读状态管理
export const inquiryMessages = pgTable("inquiry_messages", {
  id:         serial("id").primaryKey(),
  inquiryId:  integer("inquiryId").notNull(),
  senderId:   integer("senderId").notNull(),
  senderRole: varchar("senderRole", { length: 20 }).notNull().default("buyer"), // 'buyer' | 'factory'
  content:    text("content").notNull(),
  isRead:     smallint("isRead").notNull().default(0),
  createdAt:  timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:  timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type InquiryMessage = typeof inquiryMessages.$inferSelect;
export type InsertInquiryMessage = typeof inquiryMessages.$inferInsert;

// ─── Webinar Leads (意向线索) ─────────────────────────────────────────────────
// 直播间抢单产生的高意向线索，供应链管家通过 WhatsApp 跟进
export const webinarLeads = pgTable("webinar_leads", {
  id:          serial("id").primaryKey(),
  webinarId:   integer("webinarId").notNull(),
  userId:      integer("userId"),
  productId:   integer("productId"),
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
  createdAt:   timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type WebinarLead = typeof webinarLeads.$inferSelect;
export type InsertWebinarLead = typeof webinarLeads.$inferInsert;


// ─── AI Recommendation Feedback (AI 推荐反馈) ─────────────────────────────────
// 记录用户对 AI 工厂推荐的 👍/👎 反馈，用于持续优化推荐质量
export const aiRecommendationFeedback = pgTable("ai_recommendation_feedback", {
  id:                       serial("id").primaryKey(),
  userId:                   integer("userId").notNull(),
  factoryId:                integer("factoryId").notNull(),
  isHelpful:                smallint("isHelpful").notNull(),
  feedbackText:             varchar("feedbackText", { length: 500 }),
  recommendationMainReason: varchar("recommendationMainReason", { length: 500 }),
  model:                    varchar("model", { length: 100 }).notNull().default("gpt-4.1-mini"),
  createdAt:                timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type AIRecommendationFeedback = typeof aiRecommendationFeedback.$inferSelect;
export type InsertAIRecommendationFeedback = typeof aiRecommendationFeedback.$inferInsert;

// ─── Sourcing Demands (Phase 3: Agentic AI 多模态采购需求) ─────────────────────
// 存储从 URL/视频/PDF 中提取的结构化采购需求
export const sourcingDemands = pgTable("sourcing_demands", {
  id:                  serial("id").primaryKey(),
  userId:              integer("userId").notNull(),
  sourceType:          varchar("sourceType", { length: 20 }).notNull().default("text"),
  sourceUri:           varchar("sourceUri", { length: 1024 }),
  status:              varchar("status", { length: 20 }).notNull().default("pending"),
  productName:         varchar("productName", { length: 255 }),
  productDescription:  text("productDescription"),
  keyFeatures:         jsonb("keyFeatures"),
  targetAudience:      varchar("targetAudience", { length: 255 }),
  visualReferences:    jsonb("visualReferences"),
  estimatedQuantity:   varchar("estimatedQuantity", { length: 100 }),
  targetPrice:         varchar("targetPrice", { length: 100 }),
  customizationNotes:  text("customizationNotes"),
  extractedData:       jsonb("extractedData"),
  processingError:     text("processingError"),
  isPublished:         smallint("isPublished").notNull().default(0),
  // 品类字段：由 AI 从 manufacturingParams 提取后同步写入，供匹配服务直接读取（避免 JOIN）
  productionCategory:  varchar("productionCategory", { length: 100 }),
  // 语义向量（1536 维，JSON 格式存储）
  embeddingVector:     text("embeddingVector"),
  embeddingModel:      varchar("embeddingModel", { length: 100 }),
  embeddingAt:         timestamp("embeddingAt", { mode: "date", precision: 3 }),
  createdAt:           timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:           timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type SourcingDemand = typeof sourcingDemands.$inferSelect;
export type InsertSourcingDemand = typeof sourcingDemands.$inferInsert;

// ─── Manufacturing Parameters (Phase 3: 工厂生产参数) ─────────────────────────
// 由 AI 从采购需求转化的工厂可读生产技术参数
export const manufacturingParameters = pgTable("manufacturing_parameters", {
  id:                      serial("id").primaryKey(),
  demandId:                integer("demandId").notNull().unique(),
  moq:                     integer("moq"),
  materials:               jsonb("materials"),
  dimensions:              varchar("dimensions", { length: 255 }),
  weight:                  varchar("weight", { length: 50 }),
  colorRequirements:       jsonb("colorRequirements"),
  packagingRequirements:   text("packagingRequirements"),
  certificationsRequired:  jsonb("certificationsRequired"),
  estimatedUnitCost:       decimal("estimatedUnitCost", { precision: 10, scale: 4 }),
  toolingCost:             decimal("toolingCost", { precision: 12, scale: 2 }),
  leadTimeDays:            integer("leadTimeDays"),
  renderImageUrl:          varchar("renderImageUrl", { length: 1024 }),
  technicalDrawingUrl:     varchar("technicalDrawingUrl", { length: 1024 }),
  productionCategory:      varchar("productionCategory", { length: 100 }),
  suggestedFactoryTypes:   jsonb("suggestedFactoryTypes"),
  createdAt:               timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:               timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type ManufacturingParameters = typeof manufacturingParameters.$inferSelect;
export type InsertManufacturingParameters = typeof manufacturingParameters.$inferInsert;

// ─── Product Knowledge Base ────────────────────────────────────────────────────

export const productCategories = pgTable("product_categories", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  nameEn: varchar("nameEn", { length: 100 }).notNull(),
  parentSlug: varchar("parentSlug", { length: 100 }),
  level: integer("level").default(1),
  description: text("description"),
  iconUrl: varchar("iconUrl", { length: 500 }),
  isActive: smallint("isActive").default(1),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).default(sql`NOW()`),
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;

export const productKnowledge = pgTable("product_knowledge", {
  id: serial("id").primaryKey(),
  categorySlug: varchar("categorySlug", { length: 100 }).notNull(),
  knowledgeType: varchar("knowledgeType", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  structuredData: jsonb("structuredData"),
  targetMarkets: jsonb("targetMarkets"),
  confidence: integer("confidence").default(80),
  source: varchar("source", { length: 200 }),
  embeddingVector: text("embeddingVector"),
  embeddingModel: varchar("embeddingModel", { length: 100 }),
  embeddingAt: timestamp("embeddingAt", { mode: "date", precision: 3 }),
  viewCount: integer("viewCount").default(0),
  isActive: smallint("isActive").default(1),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).default(sql`NOW()`),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).default(sql`NOW()`),
});

export type ProductKnowledgeRow = typeof productKnowledge.$inferSelect;
export type NewProductKnowledge = typeof productKnowledge.$inferInsert;

export const knowledgeUsageLog = pgTable("knowledge_usage_log", {
  id: serial("id").primaryKey(),
  knowledgeId: integer("knowledgeId").notNull(),
  usedInContext: varchar("usedInContext", { length: 50 }),
  demandId: integer("demandId"),
  userId: integer("userId"),
  relevanceScore: decimal("relevanceScore", { precision: 5, scale: 4 }),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).default(sql`NOW()`),
});

// ─── Factory Capability Embeddings (4.0: 15-min Matching) ────────────────────
// 存储工厂能力的语义向量，用于与采购需求进行快速语义匹配
// 每家工厂可有多条记录（按产品类别分别建立向量）
export const factoryCapabilityEmbeddings = pgTable("factory_capability_embeddings", {
  id:               serial("id").primaryKey(),
  factoryId:        integer("factoryId").notNull().unique(),
  // 能力描述文本（工厂名 + 品类 + 描述 + 主要产品 + 认证 + MOQ 等）
  capabilityText:   text("capabilityText").notNull(),
  // 语义向量（1536 维，JSON 格式，与 sourcingDemands.embeddingVector 同维度）
  embeddingVector:  text("embeddingVector"),
  embeddingModel:   varchar("embeddingModel", { length: 100 }),
  embeddingAt:      timestamp("embeddingAt", { mode: "date", precision: 3 }),
  // 快速过滤字段（避免全表向量计算）
  primaryCategory:  varchar("primaryCategory", { length: 100 }),
  moqMin:           integer("moqMin").default(1),
  leadTimeDaysMin:  integer("leadTimeDaysMin").default(7),
  isActive:         smallint("isActive").notNull().default(1),
  createdAt:        timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type FactoryCapabilityEmbedding = typeof factoryCapabilityEmbeddings.$inferSelect;
export type InsertFactoryCapabilityEmbedding = typeof factoryCapabilityEmbeddings.$inferInsert;

// ─── Demand Match Results (4.0: 15-min Matching) ─────────────────────────────
// 存储每次匹配的结果快照，避免重复计算，支持用户查看历史匹配
export const demandMatchResults = pgTable("demand_match_results", {
  id:               serial("id").primaryKey(),
  demandId:         integer("demandId").notNull(),
  factoryId:        integer("factoryId").notNull(),
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
  factoryOnlineAt:  smallint("factoryOnlineAt").notNull().default(0),
  // 用户操作状态
  status:           varchar("status", { length: 30 }).notNull().default("pending"),
  // pending → viewed → rfq_sent → webinar_scheduled → closed
  viewedAt:         timestamp("viewedAt", { mode: "date", precision: 3 }),
  rfqSentAt:        timestamp("rfqSentAt", { mode: "date", precision: 3 }),
  createdAt:        timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type DemandMatchResult = typeof demandMatchResults.$inferSelect;
export type InsertDemandMatchResult = typeof demandMatchResults.$inferInsert;

// ─── RFQ Quotes (4.0: 30-min Quote Flow) ─────────────────────────────────────
// 工厂针对 RFQ 提交的正式报价单，支持阶梯报价
// 状态流转：pending → submitted → accepted / rejected / expired
export const rfqQuotes = pgTable("rfq_quotes", {
  id:               serial("id").primaryKey(),
  inquiryId:        integer("inquiryId").notNull(),
  demandId:         integer("demandId"),
  factoryId:        integer("factoryId").notNull(),
  buyerId:          integer("buyerId").notNull(),
  status:           varchar("status", { length: 30 }).notNull().default("pending"),
  unitPrice:        decimal("unitPrice", { precision: 10, scale: 2 }),
  currency:         varchar("currency", { length: 10 }).default("USD"),
  moq:              integer("moq"),
  leadTimeDays:     integer("leadTimeDays"),
  validUntil:       timestamp("validUntil", { mode: "date", precision: 3 }),
  // 阶梯报价 JSON: [{ qty: 100, unitPrice: 25.00 }, { qty: 500, unitPrice: 22.00 }]
  tierPricing:      jsonb("tierPricing"),
  factoryNotes:     text("factoryNotes"),
  paymentTerms:     varchar("paymentTerms", { length: 255 }),
  shippingTerms:    varchar("shippingTerms", { length: 100 }),
  sampleAvailable:  smallint("sampleAvailable").default(0),
  samplePrice:      decimal("samplePrice", { precision: 10, scale: 2 }),
  sampleLeadDays:   integer("sampleLeadDays"),
  buyerFeedback:    text("buyerFeedback"),
  respondedAt:      timestamp("respondedAt", { mode: "date", precision: 3 }),
  submittedAt:      timestamp("submittedAt", { mode: "date", precision: 3 }),
  createdAt:        timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type RfqQuote = typeof rfqQuotes.$inferSelect;
export type InsertRfqQuote = typeof rfqQuotes.$inferInsert;

// ─── Webinar Bookings (4.0: Factory Webinar Scheduling) ──────────────────────
// 买家与工厂预约 Webinar 的记录
// 状态流转：pending → confirmed → completed / cancelled / no_show
export const webinarBookings = pgTable("webinar_bookings", {
  id:               serial("id").primaryKey(),
  buyerId:          integer("buyerId").notNull(),
  factoryId:        integer("factoryId").notNull(),
  demandId:         integer("demandId"),
  inquiryId:        integer("inquiryId"),
  scheduledAt:      timestamp("scheduledAt", { mode: "date", precision: 3 }).notNull(),
  durationMinutes:  integer("durationMinutes").default(30),
  timezone:         varchar("timezone", { length: 50 }).default("UTC"),
  meetingType:      varchar("meetingType", { length: 20 }).default("agora"),
  meetingUrl:       varchar("meetingUrl", { length: 500 }),
  agoraMeetingId:   integer("agoraMeetingId"),
  status:           varchar("status", { length: 20 }).notNull().default("pending"),
  buyerAgenda:      text("buyerAgenda"),
  factoryNotes:     text("factoryNotes"),
  confirmedAt:      timestamp("confirmedAt", { mode: "date", precision: 3 }),
  reminderSentAt:   timestamp("reminderSentAt", { mode: "date", precision: 3 }),
  createdAt:        timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type WebinarBooking = typeof webinarBookings.$inferSelect;
export type InsertWebinarBooking = typeof webinarBookings.$inferInsert;

// ─── Feishu Quote Cache (4.0: 飞书报价缓存) ───────────────────────────────────
// 缓存从飞书 Bitable 获取的报价数据，避免重复调用飞书 API
// 同时作为 Open Claw 回调数据的本地镜像
export const feishuQuoteCache = pgTable("feishu_quote_cache", {
  id:               serial("id").primaryKey(),
  // 飞书 Bitable 记录 ID（用于更新时定位）
  bitableRecordId:  varchar("bitableRecordId", { length: 100 }),
  factoryId:        integer("factoryId").notNull(),
  category:         varchar("category", { length: 100 }),
  productName:      varchar("productName", { length: 255 }),
  unitPrice:        decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  currency:         varchar("currency", { length: 10 }).default("USD"),
  moq:              integer("moq").notNull(),
  leadTimeDays:     integer("leadTimeDays").notNull(),
  // 阶梯报价 JSON: [{ qty: 100, price: 25.00 }, { qty: 500, price: 22.00 }]
  tierPricing:      jsonb("tierPricing"),
  paymentTerms:     varchar("paymentTerms", { length: 255 }),
  shippingTerms:    varchar("shippingTerms", { length: 100 }),
  isVerified:       smallint("isVerified").notNull().default(0),
  // 数据来源：feishu_api（飞书 API 直接获取）| claw_agent（Open Claw 抓取）| manual（人工录入）
  dataSource:       varchar("dataSource", { length: 30 }).notNull().default("feishu_api"),
  // 报价最后更新时间（来自飞书 last_updated 字段）
  quoteUpdatedAt:   timestamp("quoteUpdatedAt", { mode: "date", precision: 3 }),
  // 是否过期（超过 90 天自动标记）
  isExpired:        smallint("isExpired").notNull().default(0),
  // 缓存过期时间（默认 24 小时刷新）
  cacheExpiresAt:   timestamp("cacheExpiresAt", { mode: "date", precision: 3 }),
  createdAt:        timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type FeishuQuoteCache = typeof feishuQuoteCache.$inferSelect;
export type InsertFeishuQuoteCache = typeof feishuQuoteCache.$inferInsert;

// ─── Claw Agent Status (4.0: Open Claw Agent 状态持久化) ──────────────────────
// 持久化 Open Claw Agent 的心跳状态，支持多实例监控
export const clawAgentStatus = pgTable("claw_agent_status", {
  id:                   serial("id").primaryKey(),
  agentId:              varchar("agentId", { length: 100 }).notNull().unique(),
  // 当前状态：online | offline | alert | maintenance
  status:               varchar("status", { length: 20 }).notNull().default("offline"),
  version:              varchar("version", { length: 50 }),
  // 部署环境：aliyun_wuying（阿里云无影）| local | docker
  deployEnv:            varchar("deployEnv", { length: 50 }).default("aliyun_wuying"),
  deployEnvDetail:      varchar("deployEnvDetail", { length: 255 }),
  ipAddress:            varchar("ipAddress", { length: 50 }),
  lastHeartbeatAt:      timestamp("lastHeartbeatAt", { mode: "date", precision: 3 }),
  // 关联工厂（4.1 新增）
  factoryId:            integer("factoryId"),
  factoryName:          varchar("factoryName", { length: 255 }),
  // Agent 能力声明（4.1 新增）：[{type, isConfigured, priority, config}]
  capabilities:         jsonb("capabilities"),
  // 当前正在处理的任务数
  activeJobs:           integer("activeJobs").notNull().default(0),
  // 累计处理任务总数
  totalJobsProcessed:   integer("totalJobsProcessed").notNull().default(0),
  // 累计失败任务数
  totalJobsFailed:      integer("totalJobsFailed").notNull().default(0),
  // 最后一次成功处理的任务 ID
  lastSuccessJobId:     varchar("lastSuccessJobId", { length: 100 }),
  // 最后一次失败原因
  lastFailureReason:    text("lastFailureReason"),
  // 是否启用（可手动禁用某个 Agent）
  isEnabled:            smallint("isEnabled").notNull().default(1),
  createdAt:            timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:            timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type ClawAgentStatus = typeof clawAgentStatus.$inferSelect;
export type InsertClawAgentStatus = typeof clawAgentStatus.$inferInsert;

// ─── RFQ Claw Jobs (4.0: Open Claw 任务追踪) ─────────────────────────────────
// 追踪每个 rfq-claw-queue 任务的执行状态，支持超时告警和重试
export const rfqClawJobs = pgTable("rfq_claw_jobs", {
  id:               serial("id").primaryKey(),
  // BullMQ Job ID
  jobId:            varchar("jobId", { length: 100 }).notNull().unique(),
  demandId:         integer("demandId").notNull(),
  factoryId:        integer("factoryId").notNull(),
  buyerId:          integer("buyerId").notNull(),
  matchResultId:    integer("matchResultId"),
  category:         varchar("category", { length: 100 }),
  // 任务状态：queued | active | completed | failed | timeout | cancelled
  status:           varchar("status", { length: 20 }).notNull().default("queued"),
  // 处理该任务的 Agent ID
  assignedAgentId:  varchar("assignedAgentId", { length: 100 }),
  // 任务入队时间
  enqueuedAt:       timestamp("enqueuedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // 任务开始处理时间
  startedAt:        timestamp("startedAt", { mode: "date", precision: 3 }),
  // 任务完成时间
  completedAt:      timestamp("completedAt", { mode: "date", precision: 3 }),
  // 失败原因
  failureReason:    text("failureReason"),
  // 重试次数
  retryCount:       integer("retryCount").notNull().default(0),
  // 是否已发送超时告警
  timeoutAlertSent: smallint("timeoutAlertSent").notNull().default(0),
  // 4.1 新增：标准化任务 ID 和 Agent 推送标记
  taskId:           varchar("taskId", { length: 150 }),
  agentPushed:      smallint("agentPushed").notNull().default(0),
  agentId:          varchar("agentId", { length: 100 }),
  createdAt:        timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type RfqClawJob = typeof rfqClawJobs.$inferSelect;
export type InsertRfqClawJob = typeof rfqClawJobs.$inferInsert;

// ─── Handshake Requests (4.0: 15-min Real-time Matching) ─────────────────────
// 买家向匹配工厂发起"请求对话"时创建记录
// 状态流转：pending → accepted → rejected / expired
export const handshakeRequests = pgTable("handshake_requests", {
  id:                   serial("id").primaryKey(),
  demandId:             integer("demandId").notNull(),
  factoryId:            integer("factoryId").notNull(),
  buyerId:              integer("buyerId").notNull(),
  matchResultId:        integer("matchResultId"),
  // pending | accepted | rejected | expired
  status:               varchar("status", { length: 20 }).notNull().default("pending"),
  buyerMessage:         text("buyerMessage"),
  factoryRejectReason:  varchar("factoryRejectReason", { length: 500 }),
  // 请求超时时间（默认 15 分钟后过期）
  expiresAt:            timestamp("expiresAt", { mode: "date", precision: 3 }).notNull(),
  respondedAt:          timestamp("respondedAt", { mode: "date", precision: 3 }),
  // 接受后创建的沟通室 URL slug
  roomSlug:             varchar("roomSlug", { length: 100 }),
  // RFQ 触发时间和模式（4.1 新增）
  rfqTriggeredAt:       timestamp("rfqTriggeredAt", { mode: "date", precision: 3 }),
  rfqMode:              varchar("rfqMode", { length: 30 }),
  createdAt:            timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:            timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type HandshakeRequest = typeof handshakeRequests.$inferSelect;
export type InsertHandshakeRequest = typeof handshakeRequests.$inferInsert;

// ─── Sourcing Room Messages (4.0: 30-min First Conversation) ─────────────────
// 买家与工厂在需求沟通室中的实时对话记录
export const sourcingRoomMessages = pgTable("sourcing_room_messages", {
  id:           serial("id").primaryKey(),
  handshakeId:  integer("handshakeId").notNull(),
  senderId:     integer("senderId").notNull(),
  senderRole:   varchar("senderRole", { length: 20 }).notNull().default("buyer"), // buyer | factory | ai
  content:      text("content").notNull(),
  messageType:  varchar("messageType", { length: 20 }).notNull().default("text"), // text | system | ai_intro
  isRead:       smallint("isRead").notNull().default(0),
  createdAt:    timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type SourcingRoomMessage = typeof sourcingRoomMessages.$inferSelect;
export type InsertSourcingRoomMessage = typeof sourcingRoomMessages.$inferInsert;

// ─── Purchase Orders (采购单) ─────────────────────────────────────────────────
// 买家接受报价后自动生成的采购单
// 状态流转：draft → confirmed → in_production → shipped → completed / cancelled
export const purchaseOrders = pgTable("purchase_orders", {
  id:              serial("id").primaryKey(),
  poNumber:        varchar("poNumber", { length: 50 }).notNull().unique(),  // PO-20260227-001
  buyerId:         integer("buyerId").notNull(),
  factoryId:       integer("factoryId").notNull(),
  inquiryId:       integer("inquiryId"),
  rfqQuoteId:      integer("rfqQuoteId"),
  demandId:        integer("demandId"),
  // 产品信息
  productName:     varchar("productName", { length: 255 }),
  quantity:        integer("quantity"),
  unitPrice:       decimal("unitPrice", { precision: 10, scale: 2 }),
  totalAmount:     decimal("totalAmount", { precision: 15, scale: 2 }),
  currency:        varchar("currency", { length: 10 }).default("USD"),
  // 交期与条款
  leadTimeDays:    integer("leadTimeDays"),
  expectedDelivery: timestamp("expectedDelivery", { mode: "date", precision: 3 }),
  paymentTerms:    varchar("paymentTerms", { length: 255 }),
  shippingTerms:   varchar("shippingTerms", { length: 100 }),
  // 阶梯报价快照（JSON）
  tierPricing:     jsonb("tierPricing"),
  // 状态
  status:          varchar("status", { length: 30 }).notNull().default("draft"),
  // 备注
  buyerNotes:      text("buyerNotes"),
  factoryNotes:    text("factoryNotes"),
  // 时间戳
  confirmedAt:     timestamp("confirmedAt", { mode: "date", precision: 3 }),
  createdAt:       timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;

// ─── Negotiation Sessions (4.4: 动态议价) ────────────────────────────────────
// 买家发起议价请求后创建的议价会话
// 状态: pending → ai_generating → factory_reviewing → accepted / rejected / counter_proposed → closed
export const negotiationSessions = pgTable("negotiation_sessions", {
  id:               serial("id").primaryKey(),
  rfqQuoteId:       integer("rfqQuoteId").notNull(),
  buyerId:          integer("buyerId").notNull(),
  factoryId:        integer("factoryId").notNull(),
  demandId:         integer("demandId"),
  inquiryId:        integer("inquiryId"),
  buyerRequest:     text("buyerRequest").notNull(),
  targetPrice:      decimal("targetPrice", { precision: 10, scale: 2 }),
  targetMoq:        integer("targetMoq"),
  targetLeadTime:   integer("targetLeadTime"),
  originalPrice:    decimal("originalPrice", { precision: 10, scale: 2 }),
  originalMoq:      integer("originalMoq"),
  originalLeadTime: integer("originalLeadTime"),
  originalCurrency: varchar("originalCurrency", { length: 10 }).default("USD"),
  aiAnalysis:       jsonb("aiAnalysis"),
  aiConfidence:     decimal("aiConfidence", { precision: 5, scale: 2 }),
  status:           varchar("status", { length: 30 }).notNull().default("pending"),
  finalPrice:       decimal("finalPrice", { precision: 10, scale: 2 }),
  finalMoq:         integer("finalMoq"),
  finalLeadTime:    integer("finalLeadTime"),
  roundCount:       integer("roundCount").notNull().default(0),
  resolvedAt:       timestamp("resolvedAt", { mode: "date", precision: 3 }),
  createdAt:        timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type NegotiationSession = typeof negotiationSessions.$inferSelect;
export type InsertNegotiationSession = typeof negotiationSessions.$inferInsert;

// ─── Negotiation Rounds (4.4: 议价轮次记录) ──────────────────────────────────
export const negotiationRounds = pgTable("negotiation_rounds", {
  id:               serial("id").primaryKey(),
  sessionId:        integer("sessionId").notNull(),
  roundNumber:      integer("roundNumber").notNull().default(1),
  initiatedBy:      varchar("initiatedBy", { length: 20 }).notNull().default("buyer"),
  proposedPrice:    decimal("proposedPrice", { precision: 10, scale: 2 }),
  proposedMoq:      integer("proposedMoq"),
  proposedLeadTime: integer("proposedLeadTime"),
  proposedTerms:    text("proposedTerms"),
  isAiGenerated:    smallint("isAiGenerated").notNull().default(0),
  aiReasoning:      text("aiReasoning"),
  responseBy:       varchar("responseBy", { length: 20 }),
  responseAction:   varchar("responseAction", { length: 20 }),
  responseMessage:  text("responseMessage"),
  respondedAt:      timestamp("respondedAt", { mode: "date", precision: 3 }),
  feishuMsgId:      varchar("feishuMsgId", { length: 100 }),
  createdAt:        timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type NegotiationRound = typeof negotiationRounds.$inferSelect;
export type InsertNegotiationRound = typeof negotiationRounds.$inferInsert;

// ─── Transaction History (4.4: 历史成交数据) ─────────────────────────────────
export const transactionHistory = pgTable("transaction_history", {
  id:                   serial("id").primaryKey(),
  purchaseOrderId:      integer("purchaseOrderId").notNull(),
  buyerId:              integer("buyerId").notNull(),
  factoryId:            integer("factoryId").notNull(),
  rfqQuoteId:           integer("rfqQuoteId"),
  negotiationSessionId: integer("negotiationSessionId"),
  quotedPrice:          decimal("quotedPrice", { precision: 10, scale: 2 }),
  finalPrice:           decimal("finalPrice", { precision: 10, scale: 2 }),
  priceDiscountPct:     decimal("priceDiscountPct", { precision: 5, scale: 2 }),
  quotedLeadDays:       integer("quotedLeadDays"),
  actualLeadDays:       integer("actualLeadDays"),
  leadTimeVarianceDays: integer("leadTimeVarianceDays"),
  quantity:             integer("quantity"),
  totalAmount:          decimal("totalAmount", { precision: 15, scale: 2 }),
  currency:             varchar("currency", { length: 10 }).default("USD"),
  productCategory:      varchar("productCategory", { length: 100 }),
  qualityScore:         decimal("qualityScore", { precision: 3, scale: 1 }),
  serviceScore:         decimal("serviceScore", { precision: 3, scale: 1 }),
  deliveryScore:        decimal("deliveryScore", { precision: 3, scale: 1 }),
  overallScore:         decimal("overallScore", { precision: 3, scale: 1 }),
  buyerReview:          text("buyerReview"),
  reviewedAt:           timestamp("reviewedAt", { mode: "date", precision: 3 }),
  negotiationRounds:    integer("negotiationRounds").default(0),
  wasNegotiated:        smallint("wasNegotiated").notNull().default(0),
  completedAt:          timestamp("completedAt", { mode: "date", precision: 3 }),
  createdAt:            timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type TransactionHistory = typeof transactionHistory.$inferSelect;
export type InsertTransactionHistory = typeof transactionHistory.$inferInsert;

// ─── Factory Scores (4.4: 工厂动态评分) ──────────────────────────────────────
export const factoryScores = pgTable("factory_scores", {
  id:                     serial("id").primaryKey(),
  factoryId:              integer("factoryId").notNull().unique(),
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
  totalTransactions:      integer("totalTransactions").notNull().default(0),
  totalReviews:           integer("totalReviews").notNull().default(0),
  negotiationStyle:       jsonb("negotiationStyle"),
  lastCalculatedAt:       timestamp("lastCalculatedAt", { mode: "date", precision: 3 }),
  createdAt:              timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:              timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type FactoryScore = typeof factoryScores.$inferSelect;
export type InsertFactoryScore = typeof factoryScores.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// ─── 5.0 Commander Core Tables ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Commander Phones (5.0: 指挥官手机设备注册) ───────────────────────────────
export const commanderPhones = pgTable("commander_phones", {
  id:             serial("id").primaryKey(),
  factoryId:      integer("factoryId").notNull(),
  userId:         integer("userId").notNull(),
  deviceName:     varchar("deviceName", { length: 100 }),
  activationCode: varchar("activationCode", { length: 32 }).notNull().unique(),
  isActivated:    smallint("isActivated").notNull().default(0),
  activatedAt:    timestamp("activatedAt", { mode: "date", precision: 3 }),
  wechatOpenId:   varchar("wechatOpenId", { length: 64 }),
  wechatNickname: varchar("wechatNickname", { length: 100 }),
  wechatBoundAt:  timestamp("wechatBoundAt", { mode: "date", precision: 3 }),
  deviceModel:    varchar("deviceModel", { length: 100 }),
  lastActiveAt:   timestamp("lastActiveAt", { mode: "date", precision: 3 }),
  status:         varchar("status", { length: 20 }).notNull().default("pending"),
  createdAt:      timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:      timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type CommanderPhone = typeof commanderPhones.$inferSelect;
export type InsertCommanderPhone = typeof commanderPhones.$inferInsert;

// ─── OpenClaw Instances (5.0: 云端数字员工实例) ───────────────────────────────
export const openclawInstances = pgTable("openclaw_instances", {
  id:              serial("id").primaryKey(),
  factoryId:       integer("factoryId"),
  instanceType:    varchar("instanceType", { length: 20 }).notNull().default("standard"),
  instanceName:    varchar("instanceName", { length: 100 }),
  region:          varchar("region", { length: 50 }).default("cn-hangzhou"),
  status:          varchar("status", { length: 20 }).notNull().default("offline"),
  agentId:         varchar("agentId", { length: 64 }).unique(),
  cpuUsage:        decimal("cpuUsage", { precision: 5, scale: 2 }).default("0.00"),
  memoryUsage:     decimal("memoryUsage", { precision: 5, scale: 2 }).default("0.00"),
  activeTaskCount: integer("activeTaskCount").notNull().default(0),
  totalTaskCount:  integer("totalTaskCount").notNull().default(0),
  lastHeartbeatAt: timestamp("lastHeartbeatAt", { mode: "date", precision: 3 }),
  provisionedAt:   timestamp("provisionedAt", { mode: "date", precision: 3 }),
  createdAt:       timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type OpenclawInstance = typeof openclawInstances.$inferSelect;
export type InsertOpenclawInstance = typeof openclawInstances.$inferInsert;

// ─── OpenClaw Accounts (5.0: 托管账号管理) ───────────────────────────────────
export const openclawAccounts = pgTable("openclaw_accounts", {
  id:               serial("id").primaryKey(),
  factoryId:        integer("factoryId").notNull(),
  instanceId:       integer("instanceId"),
  platform:         varchar("platform", { length: 50 }).notNull(),
  accountUsername:  varchar("accountUsername", { length: 200 }).notNull(),
  encryptedSession: text("encryptedSession"),
  sessionExpiresAt: timestamp("sessionExpiresAt", { mode: "date", precision: 3 }),
  healthStatus:     varchar("healthStatus", { length: 20 }).notNull().default("unknown"),
  lastCheckedAt:    timestamp("lastCheckedAt", { mode: "date", precision: 3 }),
  lastSuccessAt:    timestamp("lastSuccessAt", { mode: "date", precision: 3 }),
  errorMessage:     text("errorMessage"),
  isActive:         smallint("isActive").notNull().default(1),
  createdAt:        timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type OpenclawAccount = typeof openclawAccounts.$inferSelect;
export type InsertOpenclawAccount = typeof openclawAccounts.$inferInsert;

// ─── Commander Tasks (5.0: 指挥台任务中心) ───────────────────────────────────
export const commanderTasks = pgTable("commander_tasks", {
  id:              serial("id").primaryKey(),
  factoryId:       integer("factoryId").notNull(),
  userId:          integer("userId").notNull(),
  instanceId:      integer("instanceId"),
  taskType:        varchar("taskType", { length: 50 }).notNull(),
  taskTitle:       varchar("taskTitle", { length: 200 }).notNull(),
  taskParams:      jsonb("taskParams"),
  status:          varchar("status", { length: 20 }).notNull().default("pending"),
  progress:        integer("progress").notNull().default(0),
  progressMessage: varchar("progressMessage", { length: 500 }),
  creditCost:      integer("creditCost").notNull().default(0),
  creditRefunded:  smallint("creditRefunded").notNull().default(0),
  resultSummary:   text("resultSummary"),
  resultData:      jsonb("resultData"),
  errorMessage:    text("errorMessage"),
  startedAt:       timestamp("startedAt", { mode: "date", precision: 3 }),
  completedAt:     timestamp("completedAt", { mode: "date", precision: 3 }),
  bullJobId:       varchar("bullJobId", { length: 100 }),
  createdAt:       timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type CommanderTask = typeof commanderTasks.$inferSelect;
export type InsertCommanderTask = typeof commanderTasks.$inferInsert;

// ─── Inbound Leads (5.0: 入站询盘/线索) ──────────────────────────────────────
export const inboundLeads = pgTable("inbound_leads", {
  id:              serial("id").primaryKey(),
  factoryId:       integer("factoryId").notNull(),
  commanderTaskId: integer("commanderTaskId"),
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
  qualityScore:    integer("qualityScore").notNull().default(0),
  intentScore:     integer("intentScore").notNull().default(0),
  status:          varchar("status", { length: 20 }).notNull().default("new"),
  isRead:          smallint("isRead").notNull().default(0),
  readAt:          timestamp("readAt", { mode: "date", precision: 3 }),
  inquiryTime:     timestamp("inquiryTime", { mode: "date", precision: 3 }),
  wechatNotified:  smallint("wechatNotified").notNull().default(0),
  notifiedAt:      timestamp("notifiedAt", { mode: "date", precision: 3 }),
  feishuArchived:  smallint("feishuArchived").notNull().default(0),
  feishuRecordId:  varchar("feishuRecordId", { length: 100 }),
  createdAt:       timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type InboundLead = typeof inboundLeads.$inferSelect;
export type InsertInboundLead = typeof inboundLeads.$inferInsert;

// ─── Lead Replies (5.0: 询盘回复记录) ────────────────────────────────────────
export const leadReplies = pgTable("lead_replies", {
  id:                serial("id").primaryKey(),
  leadId:            integer("leadId").notNull(),
  factoryId:         integer("factoryId").notNull(),
  userId:            integer("userId").notNull(),
  chineseContent:    text("chineseContent").notNull(),
  englishContent:    text("englishContent"),
  translationStatus: varchar("translationStatus", { length: 20 }).notNull().default("pending"),
  sendStatus:        varchar("sendStatus", { length: 20 }).notNull().default("draft"),
  sentAt:            timestamp("sentAt", { mode: "date", precision: 3 }),
  sendError:         text("sendError"),
  clawJobId:         varchar("clawJobId", { length: 100 }),
  isApproved:        smallint("isApproved").notNull().default(0),
  approvedAt:        timestamp("approvedAt", { mode: "date", precision: 3 }),
  createdAt:         timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:         timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type LeadReply = typeof leadReplies.$inferSelect;
export type InsertLeadReply = typeof leadReplies.$inferInsert;

// ─── Credit Ledger (5.0: 积分流水账本) ───────────────────────────────────────
export const creditLedger = pgTable("credit_ledger", {
  id:             serial("id").primaryKey(),
  factoryId:      integer("factoryId").notNull(),
  userId:         integer("userId").notNull(),
  txType:         varchar("txType", { length: 30 }).notNull(),
  amount:         integer("amount").notNull(),
  balanceAfter:   integer("balanceAfter").notNull(),
  description:    varchar("description", { length: 500 }),
  relatedTaskId:  integer("relatedTaskId"),
  relatedOrderId: varchar("relatedOrderId", { length: 100 }),
  paymentMethod:  varchar("paymentMethod", { length: 30 }),
  paymentAmount:  decimal("paymentAmount", { precision: 10, scale: 2 }),
  createdAt:      timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type CreditLedgerEntry = typeof creditLedger.$inferSelect;
export type InsertCreditLedgerEntry = typeof creditLedger.$inferInsert;

// ─── Digital Assets (5.0: 工厂数字资产快照) ──────────────────────────────────
export const digitalAssets = pgTable("digital_assets", {
  id:                      serial("id").primaryKey(),
  factoryId:               integer("factoryId").notNull().unique(),
  geoScore:                integer("geoScore").notNull().default(0),
  geoScoreHistory:         jsonb("geoScoreHistory"),
  lastGeoScanAt:           timestamp("lastGeoScanAt", { mode: "date", precision: 3 }),
  alibabaProfileUrl:       varchar("alibabaProfileUrl", { length: 500 }),
  linkedinProfileUrl:      varchar("linkedinProfileUrl", { length: 500 }),
  websiteUrl:              varchar("websiteUrl", { length: 500 }),
  thomasnetUrl:            varchar("thomasnetUrl", { length: 500 }),
  totalContentPieces:      integer("totalContentPieces").notNull().default(0),
  totalDirectoryListings:  integer("totalDirectoryListings").notNull().default(0),
  totalAiCitations:        integer("totalAiCitations").notNull().default(0),
  schemaOrgData:           jsonb("schemaOrgData"),
  schemaLastUpdatedAt:     timestamp("schemaLastUpdatedAt", { mode: "date", precision: 3 }),
  lastMonthlyReportAt:     timestamp("lastMonthlyReportAt", { mode: "date", precision: 3 }),
  monthlyReportUrl:        varchar("monthlyReportUrl", { length: 500 }),
  createdAt:               timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:               timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type DigitalAsset = typeof digitalAssets.$inferSelect;
export type InsertDigitalAsset = typeof digitalAssets.$inferInsert;

// ─── Factory Credits (5.0: 工厂积分余额) ─────────────────────────────────────
export const factoryCredits = pgTable("factory_credits", {
  id:                serial("id").primaryKey(),
  factoryId:         integer("factoryId").notNull().unique(),
  balance:           integer("balance").notNull().default(0),
  totalRecharged:    integer("totalRecharged").notNull().default(0),
  totalConsumed:     integer("totalConsumed").notNull().default(0),
  lastRechargeAt:    timestamp("lastRechargeAt", { mode: "date", precision: 3 }),
  lowBalanceAlerted: smallint("lowBalanceAlerted").notNull().default(0),
  createdAt:         timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:         timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type FactoryCredit = typeof factoryCredits.$inferSelect;
export type InsertFactoryCredit = typeof factoryCredits.$inferInsert;

// ─── Factory FTGI Documents (FTGI验厂文档) ────────────────────────────────────
export const factoryFtgiDocuments = pgTable("factory_ftgi_documents", {
  id:          serial("id").primaryKey(),
  factoryId:   integer("factoryId").notNull(),
  docType:     varchar("docType", { length: 50 }).notNull(), // image|certification|transaction|customs|other
  fileName:    varchar("fileName", { length: 500 }).notNull(),
  fileUrl:     varchar("fileUrl", { length: 1000 }).notNull(),
  fileSize:    integer("fileSize"),
  mimeType:    varchar("mimeType", { length: 100 }),
  parseStatus: varchar("parseStatus", { length: 20 }).notNull().default("pending"), // pending|processing|done|failed
  parsedJson:  jsonb("parsedJson"),
  parseError:  text("parseError"),
  uploadedBy:  integer("uploadedBy").notNull(),
  createdAt:   timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:   timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type FactoryFtgiDocument = typeof factoryFtgiDocuments.$inferSelect;
export type InsertFactoryFtgiDocument = typeof factoryFtgiDocuments.$inferInsert;

// ─── Factory FTGI Scores (FTGI综合评分) ───────────────────────────────────────
export const factoryFtgiScores = pgTable("factory_ftgi_scores", {
  id:            serial("id").primaryKey(),
  factoryId:     integer("factoryId").notNull().unique(),
  d1Trust:       varchar("d1Trust", { length: 20 }),       // 信任维度
  d2Fulfillment: varchar("d2Fulfillment", { length: 20 }), // 履约维度
  d3Market:      varchar("d3Market", { length: 20 }),      // 市场维度
  d4Ecosystem:   varchar("d4Ecosystem", { length: 20 }),   // 生态维度
  d5Community:   varchar("d5Community", { length: 20 }),   // 社区维度
  rawScore:      varchar("rawScore", { length: 20 }),
  aiCoefficient: varchar("aiCoefficient", { length: 20 }),
  ftgiScore:     varchar("ftgiScore", { length: 20 }),
  scoreDetails:  jsonb("scoreDetails"),
  status:        varchar("status", { length: 20 }).notNull().default("pending"), // pending|calculating|done|failed
  errorMessage:  text("errorMessage"),
  calculatedAt:  timestamp("calculatedAt", { mode: "date", precision: 3 }),
  createdAt:     timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:     timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type FactoryFtgiScore = typeof factoryFtgiScores.$inferSelect;
export type InsertFactoryFtgiScore = typeof factoryFtgiScores.$inferInsert;

// ─── AI Coach Sessions (AI Coach 对话会话) ────────────────────────────────────
export const aiCoachSessions = pgTable("ai_coach_sessions", {
  id:              serial("id").primaryKey(),
  userId:          integer("userId").notNull(),
  niche:           varchar("niche", { length: 50 }),
  coachName:       varchar("coachName", { length: 50 }),
  messages:        jsonb("messages").notNull().default([]),
  profileSnapshot: jsonb("profileSnapshot"),
  thumbsUpCount:   integer("thumbsUpCount").notNull().default(0),
  thumbsDownCount: integer("thumbsDownCount").notNull().default(0),
  topicsDiscussed: jsonb("topicsDiscussed"),
  createdAt:       timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type AiCoachSession = typeof aiCoachSessions.$inferSelect;
export type InsertAiCoachSession = typeof aiCoachSessions.$inferInsert;

// ─── AI Coach Message Feedback (消息级别反馈) ─────────────────────────────────
export const aiCoachFeedback = pgTable("ai_coach_feedback", {
  id:         serial("id").primaryKey(),
  sessionId:  integer("sessionId").notNull(),
  userId:     integer("userId").notNull(),
  messageIdx: integer("messageIdx").notNull(),
  feedback:   varchar("feedback", { length: 10 }).notNull(),
  comment:    text("comment"),
  createdAt:  timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type AiCoachFeedback = typeof aiCoachFeedback.$inferSelect;
export type InsertAiCoachFeedback = typeof aiCoachFeedback.$inferInsert;

// ─── AI Coach Settings (用户 Coach 配置) ──────────────────────────────────────
export const aiCoachSettings = pgTable("ai_coach_settings", {
  id:        serial("id").primaryKey(),
  userId:    integer("userId").notNull().unique(),
  coachName: varchar("coachName", { length: 50 }).notNull().default("Alex"),
  isEnabled: integer("isEnabled").notNull().default(1),
  createdAt: timestamp("createdAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt", { mode: "date", precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
});
export type AiCoachSettings = typeof aiCoachSettings.$inferSelect;
export type InsertAiCoachSettings = typeof aiCoachSettings.$inferInsert;
