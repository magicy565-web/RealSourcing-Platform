import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { createUser, getUserByEmail, getUserById, getUserNotifications, getUnreadNotificationsCount, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, createNotification } from "./db";
import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(1, "姓名不能为空"),
          email: z.string().email("邮箱格式不正确"),
          password: z.string().min(6, "密码至少 6 位"),
          role: z.enum(["buyer", "factory", "user"]).default("user"),
          company: z.string().optional(),
          phone: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // 检查邮箱是否已存在
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "该邮箱已被注册",
          });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(input.password, 10);

        // 创建用户
        const openId = `email_${nanoid()}`;
        await createUser({
          openId,
          name: input.name,
          email: input.email,
          password: hashedPassword,
          role: input.role,
          company: input.company || null,
          phone: input.phone || null,
          loginMethod: "email",
        });

        return {
          success: true,
          message: "注册成功",
        };
      }),

    login: publicProcedure
      .input(
        z.object({
          email: z.string().email("邮箱格式不正确"),
          password: z.string().min(1, "密码不能为空"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 查找用户
        const user = await getUserByEmail(input.email);
        if (!user || !user.password) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "邮箱或密码错误",
          });
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(input.password, user.password);
        if (!isPasswordValid) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "邮箱或密码错误",
          });
        }

        // 生成 JWT token
        const secretKey = new TextEncoder().encode(ENV.cookieSecret);
        const token = await new SignJWT({ openId: user.openId })
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setExpirationTime("365d")
          .sign(secretKey);

        // 设置 cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        };
      }),
  }),

  // 用户资料相关
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "用户不存在",
        });
      }
      return user;
    }),

    update: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          company: z.string().optional(),
          position: z.string().optional(),
          bio: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // TODO: 实现用户资料更新
        return {
          success: true,
        };
      }),
  }),

  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const notifications = await getUserNotifications(ctx.user.id);
      return notifications;
    }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const count = await getUnreadNotificationsCount(ctx.user.id);
      return count;
    }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationAsRead(input.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteNotification(input.id, ctx.user.id);
        return { success: true };
      }),

    create: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          type: z.enum(["system", "webinar", "message", "review"]),
          title: z.string(),
          content: z.string(),
          link: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createNotification(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
