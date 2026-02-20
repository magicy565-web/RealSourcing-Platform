import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getUserByEmail } from "./db";
import bcrypt from "bcryptjs";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(): { ctx: TrpcContext; cookies: Record<string, string> } {
  const cookies: Record<string, string> = {};

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string) => {
        cookies[name] = value;
      },
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx, cookies };
}

describe("auth.register", () => {
  it("should successfully register a new user", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testEmail = `test-${Date.now()}@example.com`;
    const result = await caller.auth.register({
      name: "Test User",
      email: testEmail,
      password: "password123",
      role: "buyer",
      company: "Test Company",
      phone: "1234567890",
    });

    expect(result.success).toBe(true);
    expect(result.message).toBe("注册成功");

    // 验证用户已创建
    const user = await getUserByEmail(testEmail);
    expect(user).toBeDefined();
    expect(user?.name).toBe("Test User");
    expect(user?.email).toBe(testEmail);
    expect(user?.role).toBe("buyer");
    expect(user?.company).toBe("Test Company");
    expect(user?.phone).toBe("1234567890");
    expect(user?.loginMethod).toBe("email");

    // 验证密码已加密
    if (user?.password) {
      const isPasswordHashed = await bcrypt.compare("password123", user.password);
      expect(isPasswordHashed).toBe(true);
    }
  });

  it("should fail when registering with existing email", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testEmail = `existing-${Date.now()}@example.com`;

    // 第一次注册
    await caller.auth.register({
      name: "First User",
      email: testEmail,
      password: "password123",
      role: "user",
    });

    // 第二次注册相同邮箱
    await expect(
      caller.auth.register({
        name: "Second User",
        email: testEmail,
        password: "password456",
        role: "user",
      })
    ).rejects.toThrow("该邮箱已被注册");
  });
});

describe("auth.login", () => {
  beforeAll(async () => {
    // 创建测试用户
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testEmail = "login-test@example.com";
    const existingUser = await getUserByEmail(testEmail);
    
    if (!existingUser) {
      await caller.auth.register({
        name: "Login Test User",
        email: testEmail,
        password: "testpassword",
        role: "buyer",
      });
    }
  });

  it("should successfully login with correct credentials", async () => {
    const { ctx, cookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({
      email: "login-test@example.com",
      password: "testpassword",
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("login-test@example.com");
    expect(result.user.name).toBe("Login Test User");
    expect(result.user.role).toBe("buyer");

    // 验证 cookie 已设置
    expect(Object.keys(cookies).length).toBeGreaterThan(0);
  });

  it("should fail with incorrect password", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "login-test@example.com",
        password: "wrongpassword",
      })
    ).rejects.toThrow("邮箱或密码错误");
  });

  it("should fail with non-existent email", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "nonexistent@example.com",
        password: "anypassword",
      })
    ).rejects.toThrow("邮箱或密码错误");
  });
});

describe("auth.logout", () => {
  it("should successfully logout", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result.success).toBe(true);
  });
});
