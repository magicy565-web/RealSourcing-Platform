import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";

let pool: mysql.Pool;
let db: ReturnType<typeof drizzle<typeof schema>>;

async function initDb() {
  if (!pool) {
    pool = mysql.createPool(process.env.DATABASE_URL!);
    db = drizzle(pool, { schema, mode: "default" }) as any;
  }
  return db;
}

const dbPromise = initDb();
export { db };

// ─── User Operations ──────────────────────────────────────────────────────────

export async function getUserByEmail(email: string) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.users).where(eq(schema.users.email, email));
  return rows[0];
}

export async function getUserById(id: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.users).where(eq(schema.users.id, id));
  return rows[0];
}

export async function getUserByOpenId(openId: string) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.users).where(eq(schema.users.openId, openId));
  return rows[0];
}

export async function upsertUser(data: Partial<typeof schema.users.$inferInsert> & { openId: string }) {
  const database = await dbPromise;
  const existing = await getUserByOpenId(data.openId);
  if (existing) {
    await database.update(schema.users).set(data as any).where(eq(schema.users.openId, data.openId));
    return await getUserByOpenId(data.openId);
  } else {
    await database.insert(schema.users).values(data as any);
    return await getUserByOpenId(data.openId);
  }
}

export async function createUser(data: typeof schema.users.$inferInsert) {
  const database = await dbPromise;
  return await database.insert(schema.users).values(data);
}

// ─── Webinar Operations ───────────────────────────────────────────────────────

export async function getAllWebinars() {
  const database = await dbPromise;
  return await database.select().from(schema.webinars).orderBy(desc(schema.webinars.createdAt));
}

export async function getWebinarById(id: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.webinars).where(eq(schema.webinars.id, id));
  return rows[0];
}

export async function getWebinarsByHostId(hostId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.webinars).where(eq(schema.webinars.hostId, hostId));
}

export async function createWebinar(data: typeof schema.webinars.$inferInsert) {
  const database = await dbPromise;
  return await database.insert(schema.webinars).values(data);
}

export async function updateWebinar(id: number, data: Partial<typeof schema.webinars.$inferInsert>) {
  const database = await dbPromise;
  return await database.update(schema.webinars).set(data).where(eq(schema.webinars.id, id));
}

export async function getWebinarParticipants(webinarId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.webinarParticipants)
    .where(eq(schema.webinarParticipants.webinarId, webinarId));
}

export async function registerForWebinar(webinarId: number, userId: number) {
  const database = await dbPromise;
  // Check if already registered
  const existing = await database.select().from(schema.webinarRegistrations)
    .where(and(
      eq(schema.webinarRegistrations.webinarId, webinarId),
      eq(schema.webinarRegistrations.userId, userId)
    ));
  if (existing.length > 0) return existing[0];
  await database.insert(schema.webinarRegistrations).values({ webinarId, userId, status: "registered" });
  return { webinarId, userId, status: "registered" };
}

export async function getWebinarRegistration(webinarId: number, userId: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.webinarRegistrations)
    .where(and(
      eq(schema.webinarRegistrations.webinarId, webinarId),
      eq(schema.webinarRegistrations.userId, userId)
    ));
  return rows[0];
}

// ─── Factory Operations ───────────────────────────────────────────────────────

export async function getAllFactories() {
  const database = await dbPromise;
  return await database.select().from(schema.factories).orderBy(desc(schema.factories.createdAt));
}

export async function getFactoryById(id: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.factories).where(eq(schema.factories.id, id));
  return rows[0];
}

export async function getFactoryByUserId(userId: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.factories).where(eq(schema.factories.userId, userId));
  return rows[0];
}

export async function getFactoryDetails(factoryId: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.factoryDetails)
    .where(eq(schema.factoryDetails.factoryId, factoryId));
  return rows[0];
}

export async function searchFactories(query: string) {
  const database = await dbPromise;
  return await database.select().from(schema.factories).where(
    or(
      like(schema.factories.name, `%${query}%`),
      like(schema.factories.category, `%${query}%`),
      like(schema.factories.city, `%${query}%`)
    )
  );
}

export async function createFactory(data: typeof schema.factories.$inferInsert) {
  const database = await dbPromise;
  return await database.insert(schema.factories).values(data);
}

export async function updateFactory(id: number, data: Partial<typeof schema.factories.$inferInsert>) {
  const database = await dbPromise;
  return await database.update(schema.factories).set(data).where(eq(schema.factories.id, id));
}

// ─── Factory Verifications (GTM 3.1) ──────────────────────────────────────────
export async function getFactoryVerification(factoryId: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.factoryVerifications)
    .where(eq(schema.factoryVerifications.factoryId, factoryId));
  return rows[0];
}

export async function upsertFactoryVerification(factoryId: number, data: Partial<typeof schema.factoryVerifications.$inferInsert>) {
  const database = await dbPromise;
  const existing = await getFactoryVerification(factoryId);
  if (existing) {
    return await database.update(schema.factoryVerifications)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.factoryVerifications.factoryId, factoryId));
  } else {
    return await database.insert(schema.factoryVerifications)
      .values({ factoryId, ...data } as any);
  }
}

// ─── Factory Metrics (GTM 3.1) ────────────────────────────────────────────────
export async function getFactoryMetrics(factoryId: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.factoryMetrics)
    .where(eq(schema.factoryMetrics.factoryId, factoryId));
  return rows[0];
}

export async function upsertFactoryMetrics(factoryId: number, data: Partial<typeof schema.factoryMetrics.$inferInsert>) {
  const database = await dbPromise;
  const existing = await getFactoryMetrics(factoryId);
  if (existing) {
    return await database.update(schema.factoryMetrics)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.factoryMetrics.factoryId, factoryId));
  } else {
    return await database.insert(schema.factoryMetrics)
      .values({ factoryId, ...data } as any);
  }
}

// ─── Factory Reels (GTM 3.1) ──────────────────────────────────────────────────
export async function getFactoryReels(factoryId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.factoryReels)
    .where(eq(schema.factoryReels.factoryId, factoryId))
    .orderBy(desc(schema.factoryReels.createdAt));
}

export async function createFactoryReel(data: typeof schema.factoryReels.$inferInsert) {
  const database = await dbPromise;
  return await database.insert(schema.factoryReels).values(data);
}

// ─── Factory Availabilities (GTM 3.1) ─────────────────────────────────────────
export async function getFactoryAvailabilities(factoryId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.factoryAvailabilities)
    .where(eq(schema.factoryAvailabilities.factoryId, factoryId))
    .orderBy(schema.factoryAvailabilities.dayOfWeek);
}

export async function setFactoryAvailabilities(factoryId: number, availabilities: typeof schema.factoryAvailabilities.$inferInsert[]) {
  const database = await dbPromise;
  // 删除现有的可用时间段
  await database.delete(schema.factoryAvailabilities)
    .where(eq(schema.factoryAvailabilities.factoryId, factoryId));
  // 插入新的可用时间段
  if (availabilities.length > 0) {
    return await database.insert(schema.factoryAvailabilities).values(availabilities);
  }
}

// ─── Product Operations ───────────────────────────────────────────────────────

export async function getAllProducts() {
  const database = await dbPromise;
  return await database.select().from(schema.products)
    .orderBy(desc(schema.products.createdAt));
}

export async function getProductById(id: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.products).where(eq(schema.products.id, id));
  return rows[0];
}

export async function getProductDetails(productId: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.productDetails)
    .where(eq(schema.productDetails.productId, productId));
  return rows[0];
}

export async function getProductsByFactoryId(factoryId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.products)
    .where(eq(schema.products.factoryId, factoryId))
    .orderBy(desc(schema.products.createdAt));
}

export async function createProduct(data: typeof schema.products.$inferInsert) {
  const database = await dbPromise;
  return await database.insert(schema.products).values(data);
}

export async function updateProduct(id: number, factoryId: number, data: Partial<typeof schema.products.$inferInsert>) {
  const database = await dbPromise;
  return await database.update(schema.products).set(data).where(
    and(eq(schema.products.id, id), eq(schema.products.factoryId, factoryId))
  );
}

// ─── Factory Review Operations ────────────────────────────────────────────────

export async function getFactoryReviews(factoryId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.factoryReviews)
    .where(eq(schema.factoryReviews.factoryId, factoryId))
    .orderBy(desc(schema.factoryReviews.createdAt));
}

export async function createFactoryReview(data: typeof schema.factoryReviews.$inferInsert) {
  const database = await dbPromise;
  return await database.insert(schema.factoryReviews).values(data);
}

// ─── Product Review Operations ────────────────────────────────────────────────

export async function getProductReviews(productId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.productReviews)
    .where(eq(schema.productReviews.productId, productId))
    .orderBy(desc(schema.productReviews.createdAt));
}

export async function createProductReview(data: typeof schema.productReviews.$inferInsert) {
  const database = await dbPromise;
  return await database.insert(schema.productReviews).values(data);
}

// ─── Meeting Operations ───────────────────────────────────────────────────────

export async function getMeetingById(id: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.meetings).where(eq(schema.meetings.id, id));
  return rows[0];
}

export async function getMeetingsByBuyerId(buyerId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.meetings)
    .where(eq(schema.meetings.buyerId, buyerId))
    .orderBy(desc(schema.meetings.scheduledAt));
}

export async function getMeetingsByFactoryId(factoryId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.meetings)
    .where(eq(schema.meetings.factoryId, factoryId))
    .orderBy(desc(schema.meetings.scheduledAt));
}

export async function getMeetingTranscripts(meetingId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.meetingTranscripts)
    .where(eq(schema.meetingTranscripts.meetingId, meetingId))
    .orderBy(schema.meetingTranscripts.createdAt);
}

export async function createMeeting(data: typeof schema.meetings.$inferInsert) {
  const database = await dbPromise;
  return await database.insert(schema.meetings).values(data);
}

export async function updateMeeting(id: number, data: Partial<typeof schema.meetings.$inferInsert>) {
  const database = await dbPromise;
  return await database.update(schema.meetings).set(data).where(eq(schema.meetings.id, id));
}

// ─── Inquiry Operations ───────────────────────────────────────────────────────

export async function getInquiryById(id: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.inquiries).where(eq(schema.inquiries.id, id));
  return rows[0];
}

export async function getInquiriesByBuyerId(buyerId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.inquiries)
    .where(eq(schema.inquiries.buyerId, buyerId))
    .orderBy(desc(schema.inquiries.createdAt));
}

export async function getInquiriesByFactoryId(factoryId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.inquiries)
    .where(eq(schema.inquiries.factoryId, factoryId))
    .orderBy(desc(schema.inquiries.createdAt));
}

export async function createInquiry(data: typeof schema.inquiries.$inferInsert) {
  const database = await dbPromise;
  return await database.insert(schema.inquiries).values(data);
}

export async function updateInquiry(id: number, data: Partial<typeof schema.inquiries.$inferInsert>) {
  const database = await dbPromise;
  return await database.update(schema.inquiries).set(data).where(eq(schema.inquiries.id, id));
}

// ─── User Favorites Operations ────────────────────────────────────────────────

export async function getUserFavorites(userId: number, targetType?: string) {
  const database = await dbPromise;
  if (targetType) {
    return await database.select().from(schema.userFavorites).where(
      and(eq(schema.userFavorites.userId, userId), eq(schema.userFavorites.targetType, targetType))
    );
  }
  return await database.select().from(schema.userFavorites)
    .where(eq(schema.userFavorites.userId, userId));
}

export async function addUserFavorite(userId: number, targetType: string, targetId: number) {
  const database = await dbPromise;
  const existing = await checkUserFavorite(userId, targetType, targetId);
  if (existing) return existing;
  await database.insert(schema.userFavorites).values({ userId, targetType, targetId });
  return { userId, targetType, targetId };
}

export async function removeUserFavorite(userId: number, targetType: string, targetId: number) {
  const database = await dbPromise;
  return await database.delete(schema.userFavorites).where(
    and(
      eq(schema.userFavorites.userId, userId),
      eq(schema.userFavorites.targetType, targetType),
      eq(schema.userFavorites.targetId, targetId)
    )
  );
}

export async function checkUserFavorite(userId: number, targetType: string, targetId: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.userFavorites).where(
    and(
      eq(schema.userFavorites.userId, userId),
      eq(schema.userFavorites.targetType, targetType),
      eq(schema.userFavorites.targetId, targetId)
    )
  );
  return rows[0] || null;
}

// ─── Notification Operations ──────────────────────────────────────────────────

export async function getUserNotifications(userId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.notifications)
    .where(eq(schema.notifications.userId, userId))
    .orderBy(desc(schema.notifications.createdAt));
}

export async function createNotification(data: typeof schema.notifications.$inferInsert) {
  const database = await dbPromise;
  return await database.insert(schema.notifications).values(data);
}

export async function markNotificationAsRead(id: number) {
  const database = await dbPromise;
  return await database.update(schema.notifications).set({ isRead: 1 }).where(eq(schema.notifications.id, id));
}

export async function markAllNotificationsAsRead(userId: number) {
  const database = await dbPromise;
  return await database.update(schema.notifications).set({ isRead: 1 })
    .where(eq(schema.notifications.userId, userId));
}

export async function getUnreadNotificationsCount(userId: number) {
  const database = await dbPromise;
  const rows = await database
    .select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, 0)));
  return rows[0]?.count || 0;
}

// ─── Inquiry Messages (using messages table with inquiryId stored in webinarId field) ──
// Note: messages table has webinarId field; we repurpose it as contextId for inquiry messages
// by storing inquiryId as a negative number to distinguish from webinar messages.
// A cleaner approach: filter by type='inquiry' and match senderId/content patterns.
// For now we use a dedicated approach: store inquiryId in webinarId as negative value.

export async function getInquiryMessages(inquiryId: number) {
  const database = await dbPromise;
  // Use webinarId = -inquiryId as a convention to store inquiry messages
  const rows = await database.select().from(schema.messages)
    .where(and(
      eq(schema.messages.webinarId, -inquiryId),
      eq(schema.messages.type, "inquiry")
    ))
    .orderBy(schema.messages.createdAt);
  return rows;
}

export async function createInquiryMessage(data: {
  inquiryId: number;
  senderId: number;
  content: string;
}) {
  const database = await dbPromise;
  await database.insert(schema.messages).values({
    webinarId: -data.inquiryId,
    senderId: data.senderId,
    content: data.content,
    type: "inquiry",
  });
  return { success: true };
}

// ─── Factory Follows (using user_favorites with targetType='factory_follow') ──

export async function followFactory(factoryId: number, userId: number) {
  const database = await dbPromise;
  const existing = await database.select().from(schema.userFavorites)
    .where(and(
      eq(schema.userFavorites.userId, userId),
      eq(schema.userFavorites.targetType, "factory_follow"),
      eq(schema.userFavorites.targetId, factoryId)
    ));
  if (existing.length === 0) {
    await database.insert(schema.userFavorites).values({
      userId,
      targetType: "factory_follow",
      targetId: factoryId,
    });
  }
  return { following: true };
}

export async function unfollowFactory(factoryId: number, userId: number) {
  const database = await dbPromise;
  await database.delete(schema.userFavorites)
    .where(and(
      eq(schema.userFavorites.userId, userId),
      eq(schema.userFavorites.targetType, "factory_follow"),
      eq(schema.userFavorites.targetId, factoryId)
    ));
  return { following: false };
}

export async function checkFactoryFollow(factoryId: number, userId: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.userFavorites)
    .where(and(
      eq(schema.userFavorites.userId, userId),
      eq(schema.userFavorites.targetType, "factory_follow"),
      eq(schema.userFavorites.targetId, factoryId)
    ));
  return rows.length > 0;
}

export async function getFollowedFactories(userId: number) {
  const database = await dbPromise;
  const follows = await database.select().from(schema.userFavorites)
    .where(and(
      eq(schema.userFavorites.userId, userId),
      eq(schema.userFavorites.targetType, "factory_follow")
    ));
  if (follows.length === 0) return [];
  const factoryIds = follows.map(f => f.targetId);
  const factories = await database.select().from(schema.factories);
  return factories.filter(f => factoryIds.includes(f.id));
}

// ─── Full-text Search ─────────────────────────────────────────────────────────

export async function searchAll(query: string) {
  const database = await dbPromise;
  const pattern = `%${query}%`;
  const [factories, products, webinars] = await Promise.all([
    database.select().from(schema.factories)
      .where(or(
        like(schema.factories.name, pattern),
        like(schema.factories.description, pattern),
        like(schema.factories.category, pattern)
      ))
      .limit(10),
    database.select().from(schema.products)
      .where(or(
        like(schema.products.name, pattern),
        like(schema.products.description, pattern),
        like(schema.products.category, pattern)
      ))
      .limit(10),
    database.select().from(schema.webinars)
      .where(or(
        like(schema.webinars.title, pattern),
        like(schema.webinars.description, pattern)
      ))
      .limit(10),
  ]);
  return { factories, products, webinars };
}

// ─── User Profile Operations ──────────────────────────────────────────────────

export async function getUserProfile(userId: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.userProfiles)
    .where(eq(schema.userProfiles.userId, userId));
  return rows[0] || null;
}

export async function upsertUserProfile(userId: number, data: Partial<typeof schema.userProfiles.$inferInsert>) {
  const database = await dbPromise;
  const existing = await getUserProfile(userId);
  if (existing) {
    await database.update(schema.userProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.userProfiles.userId, userId));
  } else {
    await database.insert(schema.userProfiles).values({ userId, ...data });
  }
  return { success: true };
}

// ─── Webinar Likes Operations ─────────────────────────────────────────────────
export async function likeWebinar(webinarId: number, userId: number) {
  const database = await dbPromise;
  try {
    await database.insert(schema.webinarLikes).values({ webinarId, userId });
  } catch {
    // duplicate key — already liked
  }
  const rows = await database.select({ count: sql<number>`COUNT(*)` })
    .from(schema.webinarLikes)
    .where(eq(schema.webinarLikes.webinarId, webinarId));
  return { likeCount: Number(rows[0]?.count ?? 0) };
}

export async function unlikeWebinar(webinarId: number, userId: number) {
  const database = await dbPromise;
  await database.delete(schema.webinarLikes)
    .where(and(
      eq(schema.webinarLikes.webinarId, webinarId),
      eq(schema.webinarLikes.userId, userId)
    ));
  const rows = await database.select({ count: sql<number>`COUNT(*)` })
    .from(schema.webinarLikes)
    .where(eq(schema.webinarLikes.webinarId, webinarId));
  return { likeCount: Number(rows[0]?.count ?? 0) };
}

export async function checkWebinarLike(webinarId: number, userId: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.webinarLikes)
    .where(and(
      eq(schema.webinarLikes.webinarId, webinarId),
      eq(schema.webinarLikes.userId, userId)
    ));
  return rows.length > 0;
}

export async function getWebinarLikeCount(webinarId: number) {
  const database = await dbPromise;
  const rows = await database.select({ count: sql<number>`COUNT(*)` })
    .from(schema.webinarLikes)
    .where(eq(schema.webinarLikes.webinarId, webinarId));
  return Number(rows[0]?.count ?? 0);
}

// ─── Webinar Raise Hand Operations ────────────────────────────────────────────
export async function raiseHand(webinarId: number, userId: number) {
  const database = await dbPromise;
  await database.update(schema.webinarParticipants)
    .set({ raisedHand: true } as any)
    .where(and(
      eq(schema.webinarParticipants.webinarId, webinarId),
      eq(schema.webinarParticipants.userId, userId)
    ));
  return { success: true };
}

// ─── Webinar Reels Operations ─────────────────────────────────────────────────
export async function createWebinarReel(data: typeof schema.webinarReels.$inferInsert) {
  const database = await dbPromise;
  const result = await database.insert(schema.webinarReels).values(data);
  const id = (result as any)[0]?.insertId ?? 0;
  return { id };
}

export async function getWebinarReelById(id: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.webinarReels)
    .where(eq(schema.webinarReels.id, id));
  return rows[0] || null;
}

export async function updateWebinarReel(id: number, data: Partial<typeof schema.webinarReels.$inferInsert>) {
  const database = await dbPromise;
  await database.update(schema.webinarReels)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.webinarReels.id, id));
  return { success: true };
}

export async function getWebinarReelsByWebinar(webinarId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.webinarReels)
    .where(eq(schema.webinarReels.webinarId, webinarId))
    .orderBy(desc(schema.webinarReels.createdAt));
}

// ─── Factory Follows (dedicated table) ────────────────────────────────────────
export async function followFactoryDedicated(factoryId: number, userId: number) {
  const database = await dbPromise;
  try {
    await database.insert(schema.factoryFollows).values({ factoryId, userId });
  } catch {
    // duplicate key
  }
  return { success: true };
}

export async function unfollowFactoryDedicated(factoryId: number, userId: number) {
  const database = await dbPromise;
  await database.delete(schema.factoryFollows)
    .where(and(
      eq(schema.factoryFollows.factoryId, factoryId),
      eq(schema.factoryFollows.userId, userId)
    ));
  return { success: true };
}

export async function checkFactoryFollowDedicated(factoryId: number, userId: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.factoryFollows)
    .where(and(
      eq(schema.factoryFollows.factoryId, factoryId),
      eq(schema.factoryFollows.userId, userId)
    ));
  return rows.length > 0;
}

export async function getFollowedFactoriesDedicated(userId: number) {
  const database = await dbPromise;
  const follows = await database.select().from(schema.factoryFollows)
    .where(eq(schema.factoryFollows.userId, userId));
  if (follows.length === 0) return [];
  const factoryIds = follows.map(f => f.factoryId);
  const allFactories = await database.select().from(schema.factories);
  return allFactories.filter(f => factoryIds.includes(f.id));
}

// ─── Onboarding Operations ────────────────────────────────────────────────────
export async function saveUserOnboardingPreferences(userId: number, prefs: {
  interestedCategories?: string[];
  orderScale?: string;
  targetMarkets?: string[];
  certifications?: string[];
}) {
  const database = await dbPromise;
  await database.update(schema.users)
    .set({
      interestedCategories: prefs.interestedCategories as any,
      orderScale: prefs.orderScale,
      targetMarkets: prefs.targetMarkets as any,
      certifications: prefs.certifications as any,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));
  return { success: true };
}

export async function completeUserOnboarding(userId: number) {
  const database = await dbPromise;
  await database.update(schema.users)
    .set({ onboardingCompleted: 1 as any, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));
  return { success: true };
}

// ─── Factory Start Meeting ─────────────────────────────────────────────────────
export async function startMeetingWithFactory(buyerId: number, factoryId: number) {
  const database = await dbPromise;
  const factory = await getFactoryById(factoryId);
  const title = factory ? `1:1 选品会 — ${factory.name}` : `Meeting with Factory #${factoryId}`;
  const result = await database.insert(schema.meetings).values({
    buyerId,
    factoryId,
    title,
    status: "scheduled",
    scheduledAt: new Date(),
  });
  const id = (result as any)[0]?.insertId ?? 0;
  return { meetingId: id };
}

// ─── Sample Orders ─────────────────────────────────────────────────────────────
export async function createSampleOrder(data: typeof schema.sampleOrders.$inferInsert) {
  const [result] = await db.insert(schema.sampleOrders).values(data);
  return result;
}

export async function getSampleOrderById(id: number) {
  return db.select().from(schema.sampleOrders).where(eq(schema.sampleOrders.id, id)).then(r => r[0]);
}

export async function getSampleOrdersByBuyer(buyerId: number) {
  return db.select().from(schema.sampleOrders).where(eq(schema.sampleOrders.buyerId, buyerId)).orderBy(desc(schema.sampleOrders.createdAt));
}

export async function getSampleOrdersByFactory(factoryId: number) {
  return db.select().from(schema.sampleOrders).where(eq(schema.sampleOrders.factoryId, factoryId)).orderBy(desc(schema.sampleOrders.createdAt));
}

export async function updateSampleOrder(id: number, data: Partial<typeof schema.sampleOrders.$inferInsert>) {
  await db.update(schema.sampleOrders).set({ ...data, updatedAt: new Date() }).where(eq(schema.sampleOrders.id, id));
}

// ─── Factory Certifications ────────────────────────────────────────────────────
export async function getFactoryCertifications(factoryId: number) {
  return db.select().from(schema.factoryCertifications).where(eq(schema.factoryCertifications.factoryId, factoryId));
}

export async function createFactoryCertification(data: typeof schema.factoryCertifications.$inferInsert) {
  const [result] = await db.insert(schema.factoryCertifications).values(data);
  return result;
}

export async function deleteFactoryCertification(id: number, factoryId: number) {
  await db.delete(schema.factoryCertifications).where(
    and(eq(schema.factoryCertifications.id, id), eq(schema.factoryCertifications.factoryId, factoryId))
  );
}

// ─── Meeting Availability ──────────────────────────────────────────────────────
export async function getMeetingAvailability(factoryId: number) {
  return db.select().from(schema.meetingAvailability)
    .where(and(eq(schema.meetingAvailability.factoryId, factoryId), eq(schema.meetingAvailability.isActive, 1)));
}

export async function upsertMeetingAvailability(factoryId: number, slots: Array<{ dayOfWeek?: number; startTime: string; endTime: string; timezone?: string }>) {
  // 先删除该工厂的所有时间段，再重新插入
  await db.delete(schema.meetingAvailability).where(eq(schema.meetingAvailability.factoryId, factoryId));
  if (slots.length > 0) {
    await db.insert(schema.meetingAvailability).values(
      slots.map(s => ({ factoryId, dayOfWeek: s.dayOfWeek ?? null, startTime: s.startTime, endTime: s.endTime, timezone: s.timezone ?? 'Asia/Shanghai', isActive: 1 }))
    );
  }
}

// ─── Factory Profile Update ────────────────────────────────────────────────────
export async function updateFactoryProfile(factoryId: number, data: Partial<typeof schema.factories.$inferInsert>) {
  await db.update(schema.factories).set({ ...data, updatedAt: new Date() }).where(eq(schema.factories.id, factoryId));
}

export async function upsertFactoryDetails(factoryId: number, data: Partial<typeof schema.factoryDetails.$inferInsert>) {
  const existing = await db.select().from(schema.factoryDetails).where(eq(schema.factoryDetails.factoryId, factoryId)).then(r => r[0]);
  if (existing) {
    await db.update(schema.factoryDetails).set({ ...data, updatedAt: new Date() }).where(eq(schema.factoryDetails.factoryId, factoryId));
  } else {
    await db.insert(schema.factoryDetails).values({ factoryId, ...data });
  }
}

// ─── Products CRUD (for factory dashboard) ────────────────────────────────────
export async function deleteProduct(id: number, factoryId: number) {
  const database = await dbPromise;
  await database.delete(schema.products).where(
    and(eq(schema.products.id, id), eq(schema.products.factoryId, factoryId))
  );
}
export async function upsertProductDetails(productId: number, data: Partial<typeof schema.productDetails.$inferInsert>) {
  const database = await dbPromise;
  const existing = await database.select().from(schema.productDetails).where(eq(schema.productDetails.productId, productId)).then(r => r[0]);
  if (existing) {
    await database.update(schema.productDetails).set({ ...data, updatedAt: new Date() }).where(eq(schema.productDetails.productId, productId));
  } else {
    await database.insert(schema.productDetails).values({ productId, ...data });
  }
}

// ─── Webinar Leads CRUD ───────────────────────────────────────────────────────
export async function createWebinarLead(data: typeof schema.webinarLeads.$inferInsert) {
  const database = await dbPromise;
  const result = await database.insert(schema.webinarLeads).values(data);
  const id = (result as any)[0]?.insertId ?? 0;
  return { id };
}

export async function getWebinarLeadsByWebinarId(webinarId: number) {
  const database = await dbPromise;
  return await database.select().from(schema.webinarLeads)
    .where(eq(schema.webinarLeads.webinarId, webinarId))
    .orderBy(schema.webinarLeads.createdAt);
}

export async function getWebinarLeadsByHostId(hostId: number) {
  const database = await dbPromise;
  // 通过 webinars 表关联，获取该主播所有 webinar 的线索
  const rows = await database
    .select({
      lead: schema.webinarLeads,
      webinarTitle: schema.webinars.title,
    })
    .from(schema.webinarLeads)
    .innerJoin(schema.webinars, eq(schema.webinarLeads.webinarId, schema.webinars.id))
    .where(eq(schema.webinars.hostId, hostId))
    .orderBy(schema.webinarLeads.createdAt);
  return rows.map(r => ({ ...r.lead, webinarTitle: r.webinarTitle }));
}

export async function updateWebinarLeadStatus(id: number, status: string, notes?: string) {
  const database = await dbPromise;
  await database.update(schema.webinarLeads)
    .set({ status, notes, updatedAt: new Date() } as any)
    .where(eq(schema.webinarLeads.id, id));
  return { success: true };
}

export async function getWebinarLeadCountByWebinarId(webinarId: number) {
  const database = await dbPromise;
  const rows = await database.select().from(schema.webinarLeads)
    .where(eq(schema.webinarLeads.webinarId, webinarId));
  return { count: rows.length };
}
