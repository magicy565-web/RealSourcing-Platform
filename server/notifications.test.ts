import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { users, notifications } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Notifications API", () => {
  let testUserId: number;
  let testNotificationId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    // 初始化数据库连接
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);
    db = drizzle(connection, { schema, mode: "default" });
    
    // 创建测试用户
    const hashedPassword = await bcrypt.hash("test123", 10);
    const result = await db
      .insert(users)
      .values({
        openId: `test-openid-${Date.now()}`,
        name: "Test User",
        email: `test-notifications-${Date.now()}@example.com`,
        password: hashedPassword,
        role: "buyer",
      });
    testUserId = Number(result[0].insertId);

    // 创建 caller 并模拟用户登录
    const user: AuthenticatedUser = {
      id: testUserId,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "buyer",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const ctx = createAuthContext(user);
    caller = appRouter.createCaller(ctx);

    // 创建测试通知
    const notificationResult = await db.insert(notifications).values({
      userId: testUserId,
      type: "system",
      title: "测试通知",
      content: "这是一条测试通知",
      isRead: false,
    });
    testNotificationId = Number(notificationResult[0].insertId);
  });

  afterAll(async () => {
    // 清理测试数据
    if (testUserId) {
      const connection = await mysql.createConnection(process.env.DATABASE_URL!);
      const db = drizzle(connection, { schema, mode: "default" });
      await db.delete(schema.notifications).where(eq(schema.notifications.userId, testUserId));
      await db.delete(schema.users).where(eq(schema.users.id, testUserId));
      await connection.end();
    }
  });

  it("应该能获取通知列表", async () => {
    const result = await caller.notifications.list();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("应该能获取未读通知数量", async () => {
    const count = await caller.notifications.unreadCount();
    expect(count).toBeGreaterThanOrEqual(0);
    expect(typeof count).toBe("number");
  });

  it("应该能标记通知为已读", async () => {
    const result = await caller.notifications.markAsRead({ id: testNotificationId });
    expect(result.success).toBe(true);

    // 验证通知已被标记为已读
    const updatedNotifications = await caller.notifications.list();
    const notification = updatedNotifications.find((n: any) => n.id === testNotificationId);
    expect(notification?.isRead).toBeTruthy();
  });

  it("应该能标记所有通知为已读", async () => {
    // 创建另一条未读通知
    await db.insert(notifications).values({
      userId: testUserId,
      type: "message",
      title: "另一条测试通知",
      content: "测试全部标记为已读",
      isRead: false,
    });

    const result = await caller.notifications.markAllAsRead();
    expect(result.success).toBe(true);

    // 验证所有通知都已被标记为已读
    const unreadCount = await caller.notifications.unreadCount();
    expect(unreadCount).toBe(0);
  });

  it("应该能删除通知", async () => {
    const result = await caller.notifications.delete({ id: testNotificationId });
    expect(result.success).toBe(true);

    // 验证通知已被删除
    const allNotifications = await caller.notifications.list();
    const deletedNotification = allNotifications.find((n: any) => n.id === testNotificationId);
    expect(deletedNotification).toBeUndefined();
  });

  it("应该能创建新通知", async () => {
    const result = await caller.notifications.create({
      userId: testUserId,
      type: "webinar",
      title: "Webinar 提醒",
      content: "您预约的 Webinar 即将开始",
      link: "/webinar-live/1",
    });
    expect(result.success).toBe(true);

    // 验证通知已被创建
    const allNotifications = await caller.notifications.list();
    const newNotification = allNotifications.find((n: any) => n.title === "Webinar 提醒");
    expect(newNotification).toBeDefined();
    expect(newNotification?.type).toBe("webinar");
  });

  it('should delete a notification', async () => {
    const notifs = await caller.notifications.list();
    const notifId = notifs[0].id;
    
    await caller.notifications.delete({ id: notifId });
    
    const updatedNotifs = await caller.notifications.list();
    expect(updatedNotifs.find(n => n.id === notifId)).toBeUndefined();
  });
});