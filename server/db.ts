import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

let connection: mysql.Connection;
let db: any;

async function initDb() {
  if (!connection) {
    connection = await mysql.createConnection(process.env.DATABASE_URL!);
    db = drizzle(connection, { schema, mode: "default" });
  }
  return db;
}

// Initialize immediately
const dbPromise = initDb();
export { db };

// ========== User Operations ==========

export async function getUserByEmail(email: string) {
  const database = await dbPromise;
  const users = await database.select().from(schema.users).where(eq(schema.users.email, email));
  return users[0];
}

export async function getUserById(id: number) {
  const database = await dbPromise;
  const users = await database.select().from(schema.users).where(eq(schema.users.id, id));
  return users[0];
}

export async function getUserByOpenId(openId: string) {
  const database = await dbPromise;
  const users = await database.select().from(schema.users).where(eq(schema.users.openId, openId));
  return users[0];
}

export async function upsertUser(data: typeof schema.users.$inferInsert) {
  const database = await dbPromise;
  const existing = await getUserByOpenId(data.openId);
  if (existing) {
    await database.update(schema.users).set(data).where(eq(schema.users.openId, data.openId));
    return await getUserByOpenId(data.openId);
  } else {
    await database.insert(schema.users).values(data);
    return await getUserByOpenId(data.openId);
  }
}

export async function createUser(data: typeof schema.users.$inferInsert) {
  const database = await dbPromise;
  const result = await database.insert(schema.users).values(data);
  return result;
}

// ========== Webinar Operations ==========

export async function getAllWebinars() {
  return await db.select().from(schema.webinars).orderBy(desc(schema.webinars.createdAt));
}

export async function getWebinarById(id: number) {
  const webinars = await db.select().from(schema.webinars).where(eq(schema.webinars.id, id));
  return webinars[0];
}

export async function getWebinarsByStatus(status: "draft" | "scheduled" | "live" | "completed" | "cancelled") {
  return await db.select().from(schema.webinars).where(eq(schema.webinars.status, status));
}

export async function getWebinarsByHostId(hostId: number) {
  return await db.select().from(schema.webinars).where(eq(schema.webinars.hostId, hostId));
}

export async function createWebinar(data: typeof schema.webinars.$inferInsert) {
  const result = await db.insert(schema.webinars).values(data);
  return result;
}

export async function updateWebinar(id: number, data: Partial<typeof schema.webinars.$inferInsert>) {
  const result = await db.update(schema.webinars).set(data).where(eq(schema.webinars.id, id));
  return result;
}

export async function deleteWebinar(id: number) {
  const result = await db.delete(schema.webinars).where(eq(schema.webinars.id, id));
  return result;
}

// ========== Factory Operations ==========

export async function getAllFactories() {
  return await db.select().from(schema.factories).orderBy(desc(schema.factories.createdAt));
}

export async function getFactoryById(id: number) {
  const factories = await db.select().from(schema.factories).where(eq(schema.factories.id, id));
  return factories[0];
}

export async function getFactoriesByOwnerId(ownerId: number) {
  return await db.select().from(schema.factories).where(eq(schema.factories.ownerId, ownerId));
}

export async function createFactory(data: typeof schema.factories.$inferInsert) {
  const result = await db.insert(schema.factories).values(data);
  return result;
}

export async function updateFactory(id: number, data: Partial<typeof schema.factories.$inferInsert>) {
  const result = await db.update(schema.factories).set(data).where(eq(schema.factories.id, id));
  return result;
}

export async function deleteFactory(id: number) {
  const result = await db.delete(schema.factories).where(eq(schema.factories.id, id));
  return result;
}

// ========== Product Operations ==========

export async function getProductsByFactoryId(factoryId: number) {
  return await db.select().from(schema.products).where(eq(schema.products.factoryId, factoryId));
}

export async function createProduct(data: typeof schema.products.$inferInsert) {
  const result = await db.insert(schema.products).values(data);
  return result;
}

// ========== Webinar Participant Operations ==========

export async function getWebinarParticipants(webinarId: number) {
  return await db.select().from(schema.webinarParticipants).where(eq(schema.webinarParticipants.webinarId, webinarId));
}

export async function addWebinarParticipant(data: typeof schema.webinarParticipants.$inferInsert) {
  const result = await db.insert(schema.webinarParticipants).values(data);
  return result;
}

export async function removeWebinarParticipant(webinarId: number, userId: number) {
  const result = await db.delete(schema.webinarParticipants).where(
    and(
      eq(schema.webinarParticipants.webinarId, webinarId),
      eq(schema.webinarParticipants.userId, userId)
    )
  );
  return result;
}

// ========== Factory Review Operations ==========

export async function getFactoryReviews(factoryId: number) {
  return await db.select().from(schema.factoryReviews).where(eq(schema.factoryReviews.factoryId, factoryId));
}

export async function createFactoryReview(data: typeof schema.factoryReviews.$inferInsert) {
  const result = await db.insert(schema.factoryReviews).values(data);
  return result;
}

// ========== Notification Operations ==========

export async function getUserNotifications(userId: number) {
  return await db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).orderBy(desc(schema.notifications.createdAt));
}

export async function createNotification(data: typeof schema.notifications.$inferInsert) {
  const result = await db.insert(schema.notifications).values(data);
  return result;
}

export async function markNotificationAsRead(id: number) {
  const result = await db.update(schema.notifications).set({ isRead: true }).where(eq(schema.notifications.id, id));
  return result;
}

export async function getUnreadNotificationsCount(userId: number) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, false)));
  return result[0]?.count || 0;
}

export async function markAllNotificationsAsRead(userId: number) {
  return db
    .update(schema.notifications)
    .set({ isRead: true })
    .where(eq(schema.notifications.userId, userId));
}

export async function deleteNotification(id: number, userId: number) {
  return db
    .delete(schema.notifications)
    .where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId)));
}
