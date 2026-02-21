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

export async function updateProduct(id: number, data: Partial<typeof schema.products.$inferInsert>) {
  const database = await dbPromise;
  return await database.update(schema.products).set(data).where(eq(schema.products.id, id));
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
