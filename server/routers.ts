import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import {
  createUser, getUserByEmail, getUserById, getUserByOpenId,
  getUserNotifications, getUnreadNotificationsCount,
  markNotificationAsRead, markAllNotificationsAsRead, createNotification,
  // Webinar
  getAllWebinars, getWebinarById, getWebinarsByHostId, createWebinar, updateWebinar,
  getWebinarParticipants, registerForWebinar, getWebinarRegistration,
  // Factory
  getAllFactories, getFactoryById, getFactoryByUserId, getFactoryDetails,
  searchFactories, createFactory, updateFactory,
  getFactoryReviews, createFactoryReview,
  // Product
  getAllProducts, getProductById, getProductDetails, getProductsByFactoryId,
  createProduct, updateProduct,
  getProductReviews, createProductReview,
  // Meeting
  getMeetingById, getMeetingsByBuyerId, getMeetingsByFactoryId,
  getMeetingTranscripts, createMeeting, updateMeeting,
  // Inquiry
  getInquiryById, getInquiriesByBuyerId, getInquiriesByFactoryId,
  createInquiry, updateInquiry,
  // Inquiry Messages
  getInquiryMessages, createInquiryMessage,
  // Favorites
  getUserFavorites, addUserFavorite, removeUserFavorite, checkUserFavorite,
  // Factory Follow
  followFactory, unfollowFactory, checkFactoryFollow, getFollowedFactories,
  // Search
  searchAll,
  // User Profile
  getUserProfile, upsertUserProfile,
  // Webinar Likes
  likeWebinar, unlikeWebinar, checkWebinarLike, getWebinarLikeCount,
  raiseHand,
  // Webinar Reels
  createWebinarReel, getWebinarReelById, updateWebinarReel, getWebinarReelsByWebinar,
  // Factory Follows (dedicated)
  followFactoryDedicated, unfollowFactoryDedicated, checkFactoryFollowDedicated, getFollowedFactoriesDedicated,
  // Onboarding
  saveUserOnboardingPreferences, completeUserOnboarding,
  // Factory Start Meeting
  startMeetingWithFactory,
} from "./db";
import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";

export const appRouter = router({
  system: systemRouter,

  // ── Auth ─────────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "姓名不能为空"),
        email: z.string().email("邮箱格式不正确"),
        password: z.string().min(6, "密码至少 6 位"),
        role: z.enum(["buyer", "factory", "user"]).default("user"),
      }))
      .mutation(async ({ input }) => {
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "该邮箱已被注册" });
        }
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const openId = `email_${nanoid()}`;
        await createUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash: hashedPassword,
          role: input.role,
        });
        return { success: true, message: "注册成功" };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email("邮箱格式不正确"),
        password: z.string().min(1, "密码不能为空"),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (!user || !user.passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "邮箱或密码错误" });
        }
        const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isPasswordValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "邮箱或密码错误" });
        }
        const secretKey = new TextEncoder().encode(ENV.cookieSecret);
        const token = await new SignJWT({
          openId: user.openId,
          appId: ENV.appId || "realsourcing",
          name: user.name || user.email || "User",
        })
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setExpirationTime("365d")
          .sign(secretKey);
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      }),
  }),

  // ── Profile ───────────────────────────────────────────────────────────────────
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      const profile = await getUserProfile(ctx.user.id);
      return { ...user, profile: profile || null };
    }),
    update: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        avatar: z.string().optional(),
        company: z.string().optional(),
        country: z.string().optional(),
        bio: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { name, avatar, ...profileData } = input;
        // 更新 users 表
        if (name || avatar) {
          const updateData: Record<string, string> = {};
          if (name) updateData.name = name;
          if (avatar) updateData.avatar = avatar;
          // Direct update via db
          const { db } = await import("./db");
          const schema = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          if (db) {
            await (db as any).update(schema.users)
              .set(updateData)
              .where(eq(schema.users.id, ctx.user.id));
          }
        }
        // 更新 user_profiles 表
        if (Object.keys(profileData).length > 0) {
          await upsertUserProfile(ctx.user.id, profileData);
        }
        return { success: true };
      }),
  }),

  // ── Search ────────────────────────────────────────────────────────────────────
  search: router({
    all: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        return await searchAll(input.query);
      }),
  }),

  // ── Webinars ──────────────────────────────────────────────────────────────────
  webinars: router({
    list: publicProcedure.query(async () => {
      return await getAllWebinars();
    }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
          const webinar = await getWebinarById(input.id);
        if (!webinar) throw new TRPCError({ code: "NOT_FOUND", message: "Webinar 不存在" });
        // 获取主持人信息
        const host = await getUserById(webinar.hostId);
        // 获取主持人关联的工厂信息和产品列表
        const factory = host ? await getFactoryByUserId(host.id) : null;
        const factoryProducts = factory ? await getProductsByFactoryId(factory.id) : [];
        // 获取参会者数量
        const participants = await getWebinarParticipants(webinar.id);
        // 检查当前用户是否已报名
        let isRegistered = false;
        if (ctx.user) {
          const reg = await getWebinarRegistration(webinar.id, ctx.user.id);
          isRegistered = !!reg;
        }
        return {
          ...webinar,
          host: host ? { id: host.id, name: host.name, avatar: host.avatar } : null,
          factory: factory ? { id: factory.id, name: factory.name, logo: factory.logo, city: factory.city, country: factory.country } : null,
          products: factoryProducts,
          participantCount: participants.length,
          participants: participants.slice(0, 50), // 最多返回50个参会者
          isRegistered,
        };
      }),

    register: protectedProcedure
      .input(z.object({ webinarId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await registerForWebinar(input.webinarId, ctx.user.id);
        return { success: true };
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        scheduledAt: z.string(),
        duration: z.number().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        await createWebinar({
          ...input,
          hostId: ctx.user.id,
          scheduledAt: new Date(input.scheduledAt),
          status: "scheduled",
        });
        return { success: true };
      }),
  }),

  // ── Factories ─────────────────────────────────────────────────────────────────
  factories: router({
    list: publicProcedure.query(async () => {
      return await getAllFactories();
    }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const factory = await getFactoryById(input.id);
        if (!factory) throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });

        // 获取工厂详情（新表）
        const details = await getFactoryDetails(input.id);

        // 获取工厂产品
        const products = await getProductsByFactoryId(input.id);

        // 获取工厂评价
        const reviews = await getFactoryReviews(input.id);

        // 检查收藏状态
        let isFavorited = false;
        if (ctx.user) {
          const fav = await checkUserFavorite(ctx.user.id, "factory", input.id);
          isFavorited = !!fav;
        }

        return {
          ...factory,
          details: details || null,
          products,
          reviews,
          isFavorited,
        };
      }),

    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await searchFactories(input.query);
      }),

    reviews: publicProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        return await getFactoryReviews(input.factoryId);
      }),

    addReview: protectedProcedure
      .input(z.object({
        factoryId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await createFactoryReview({ ...input, userId: ctx.user.id });
        return { success: true };
      }),

    // ── 关注功能（提示词优先级3要求）──────────────────────────────────────────
    follow: protectedProcedure
      .input(z.object({ factoryId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await followFactory(input.factoryId, ctx.user.id);
      }),

    unfollow: protectedProcedure
      .input(z.object({ factoryId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await unfollowFactory(input.factoryId, ctx.user.id);
      }),

    checkFollow: protectedProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await checkFactoryFollow(input.factoryId, ctx.user.id);
      }),

    myFollowed: protectedProcedure.query(async ({ ctx }) => {
      return await getFollowedFactories(ctx.user.id);
    }),
  }),

  // ── Products ──────────────────────────────────────────────────────────────────
  products: router({
    list: publicProcedure.query(async () => {
      return await getAllProducts();
    }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const product = await getProductById(input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "产品不存在" });

        // 获取产品详情（新表）
        const details = await getProductDetails(input.id);

        // 获取所属工厂
        const factory = await getFactoryById(product.factoryId);

        // 获取产品评价
        const reviews = await getProductReviews(input.id);

        // 检查收藏状态
        let isFavorited = false;
        if (ctx.user) {
          const fav = await checkUserFavorite(ctx.user.id, "product", input.id);
          isFavorited = !!fav;
        }

        return {
          ...product,
          details: details || null,
          factory: factory ? {
            id: factory.id,
            name: factory.name,
            city: factory.city,
            country: factory.country,
            logo: factory.logo,
            overallScore: factory.overallScore,
          } : null,
          reviews,
          isFavorited,
        };
      }),

    byFactory: publicProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        return await getProductsByFactoryId(input.factoryId);
      }),

    reviews: publicProcedure
      .input(z.object({ productId: z.number() }))
      .query(async ({ input }) => {
        return await getProductReviews(input.productId);
      }),

    addReview: protectedProcedure
      .input(z.object({
        productId: z.number(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await createProductReview({ ...input, userId: ctx.user.id });
        return { success: true };
      }),
  }),

  // ── Meetings ──────────────────────────────────────────────────────────────────
  meetings: router({
    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const meeting = await getMeetingById(input.id);
        if (!meeting) throw new TRPCError({ code: "NOT_FOUND", message: "会议不存在" });

          // 获取工厂信息
        const factory = await getFactoryById(meeting.factoryId);
        const factoryDetails = await getFactoryDetails(meeting.factoryId);
        // 获取工厂产品列表（供选品会使用）
        const factoryProducts = await getProductsByFactoryId(meeting.factoryId);
        // 获取买家信息
        const buyer = await getUserById(meeting.buyerId);
        // 获取会议字幕
        const transcripts = await getMeetingTranscripts(meeting.id);
        // 获取关联询价
        const inquiries = await getInquiriesByBuyerId(meeting.buyerId);
        const meetingInquiries = inquiries.filter(i => i.meetingId === meeting.id);
        return {
          ...meeting,
          factory: factory ? {
            id: factory.id,
            name: factory.name,
            logo: factory.logo,
            city: factory.city,
            country: factory.country,
            details: factoryDetails || null,
          } : null,
          factoryProducts,
          buyer: buyer ? { id: buyer.id, name: buyer.name, avatar: buyer.avatar } : null,
          transcripts,
          inquiries: meetingInquiries,
        };
      }),

    myMeetings: protectedProcedure.query(async ({ ctx }) => {
      const meetings = await getMeetingsByBuyerId(ctx.user.id);
      // 为每个会议附加工厂信息
      const enriched = await Promise.all(meetings.map(async (m) => {
        const factory = await getFactoryById(m.factoryId);
        return { ...m, factory: factory ? { id: factory.id, name: factory.name, logo: factory.logo } : null };
      }));
      return enriched;
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        factoryId: z.number(),
        scheduledAt: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await createMeeting({
          ...input,
          buyerId: ctx.user.id,
          scheduledAt: new Date(input.scheduledAt),
          status: "scheduled",
        });
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
      }))
      .mutation(async ({ input }) => {
        await updateMeeting(input.id, { status: input.status });
        return { success: true };
      }),
  }),

  // ── Inquiries ─────────────────────────────────────────────────────────────────
  inquiries: router({
    myInquiries: protectedProcedure.query(async ({ ctx }) => {
      const inquiries = await getInquiriesByBuyerId(ctx.user.id);
      // 附加产品和工厂信息
      const enriched = await Promise.all(inquiries.map(async (inq) => {
        const product = inq.productId ? await getProductById(inq.productId) : null;
        const factory = await getFactoryById(inq.factoryId);
        return {
          ...inq,
          product: product ? { id: product.id, name: product.name } : null,
          factory: factory ? { id: factory.id, name: factory.name, logo: factory.logo } : null,
        };
      }));
      return enriched;
    }),

    create: protectedProcedure
      .input(z.object({
        productId: z.number().optional(),
        factoryId: z.number(),
        meetingId: z.number().optional(),
        quantity: z.number().min(1),
        destination: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await createInquiry({ ...input, buyerId: ctx.user.id, status: "pending" });
        return { success: true };
      }),

    reply: protectedProcedure
      .input(z.object({
        id: z.number(),
        replyContent: z.string(),
        quotedPrice: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await updateInquiry(input.id, {
          replyContent: input.replyContent,
          status: "replied",
          repliedAt: new Date(),
          quotedPrice: input.quotedPrice?.toString(),
        });
        return { success: true };
      }),

    // ── 消息子路由（提示词优先级1第3条要求）──────────────────────────────────
    messages: protectedProcedure
      .input(z.object({ inquiryId: z.number() }))
      .query(async ({ input, ctx }) => {
        // 权限检查：只有询价相关方才能查看消息
        const inquiry = await getInquiryById(input.inquiryId);
        if (!inquiry) throw new TRPCError({ code: "NOT_FOUND", message: "询价不存在" });
        if (inquiry.buyerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权查看此询价消息" });
        }
        return await getInquiryMessages(input.inquiryId);
      }),

    sendMessage: protectedProcedure
      .input(z.object({
        inquiryId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        // 权限检查：只有询价相关方才能发送消息
        const inquiry = await getInquiryById(input.inquiryId);
        if (!inquiry) throw new TRPCError({ code: "NOT_FOUND", message: "询价不存在" });
        if (inquiry.buyerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权发送此询价消息" });
        }
        return await createInquiryMessage({
          inquiryId: input.inquiryId,
          senderId: ctx.user.id,
          content: input.content,
        });
      }),
  }),

  // ── Favorites ─────────────────────────────────────────────────────────────────
  favorites: router({
    list: protectedProcedure
      .input(z.object({ targetType: z.enum(["factory", "product", "webinar"]).optional() }))
      .query(async ({ input, ctx }) => {
        return await getUserFavorites(ctx.user.id, input.targetType);
      }),

    toggle: protectedProcedure
      .input(z.object({
        targetType: z.enum(["factory", "product", "webinar"]),
        targetId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await checkUserFavorite(ctx.user.id, input.targetType, input.targetId);
        if (existing) {
          await removeUserFavorite(ctx.user.id, input.targetType, input.targetId);
          return { favorited: false };
        } else {
          await addUserFavorite(ctx.user.id, input.targetType, input.targetId);
          return { favorited: true };
        }
      }),

    check: protectedProcedure
      .input(z.object({
        targetType: z.enum(["factory", "product", "webinar"]),
        targetId: z.number(),
      }))
      .query(async ({ input, ctx }) => {
        const fav = await checkUserFavorite(ctx.user.id, input.targetType, input.targetId);
        return !!fav;
      }),
  }),

  // ── Onboarding ──────────────────────────────────────────────────────────────
  onboarding: router({
    savePreferences: protectedProcedure
      .input(z.object({
        interestedCategories: z.array(z.string()).optional(),
        orderScale: z.string().optional(),
        targetMarkets: z.array(z.string()).optional(),
        certifications: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await saveUserOnboardingPreferences(ctx.user.id, input);
      }),
    complete: protectedProcedure.mutation(async ({ ctx }) => {
      return await completeUserOnboarding(ctx.user.id);
    }),
  }),

  // ── Reel ──────────────────────────────────────────────────────────────────────
  reel: router({
    generateClips: protectedProcedure
      .input(z.object({ webinarId: z.number() }))
      .mutation(async ({ input }) => {
        // AI 生成片段（模拟，实际可接入 AI 服务）
        const clips = [
          { id: 1, start: 300, end: 323, label: "产品首次展示", icon: "🎯", selected: true },
          { id: 2, start: 765, end: 785, label: "价格谈判关键点", icon: "💰", selected: true },
          { id: 3, start: 1110, end: 1130, label: "工厂实力展示", icon: "🏭", selected: false },
          { id: 4, start: 1560, end: 1580, label: "客户提问精彩回答", icon: "💬", selected: false },
        ];
        return { webinarId: input.webinarId, clips };
      }),
    generateMeetingClips: protectedProcedure
      .input(z.object({
        meetingId: z.number(),
        template: z.string().optional(),
        duration: z.string().optional(),
        format: z.string().optional(),
        subtitle: z.string().optional(),
        watermark: z.boolean().optional(),
        bgm: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // AI 生成会议 Reel 片段（模拟，实际可接入 AI 服务）
        const clips = [
          { id: 1, start: 300, end: 323, label: "Product first shown", icon: "🎯", selected: true },
          { id: 2, start: 765, end: 785, label: "Price negotiation", icon: "💰", selected: true },
          { id: 3, start: 1110, end: 1130, label: "Factory tour", icon: "🏭", selected: false },
          { id: 4, start: 1560, end: 1580, label: "Key Q&A moment", icon: "💬", selected: false },
        ];
        return { meetingId: input.meetingId, clips, template: input.template, format: input.format };
      }),
    generateCopy: protectedProcedure
      .input(z.object({
        webinarId: z.number(),
        platform: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const copy = `🚀 深圳科技工厂最新智能硬件产品发布！\n\n✅ 智能手表 Pro | MOQ 500件 | $89起\n✅ 无线耳机 | MOQ 1000件 | $45起\n✅ 移动电源 | MOQ 2000件 | $25起\n\n💡 工厂直供，品质保证，支持定制\n📩 私信询价，48小时内回复`;
        const hashtags = ["#深圳工厂", "#智能硬件", "#跨境电商", "#工厂直供", "#RealSourcing"];
        return { copy, hashtags };
      }),
    saveDraft: protectedProcedure
      .input(z.object({
        webinarId: z.number(),
        clips: z.any().optional(),
        bgm: z.string().optional(),
        subtitlesEnabled: z.boolean().optional(),
        aiCopy: z.string().optional(),
        hashtags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await createWebinarReel({
          webinarId: input.webinarId,
          userId: ctx.user.id,
          clips: input.clips,
          bgm: input.bgm,
          subtitlesEnabled: input.subtitlesEnabled ? 1 : 0,
          aiCopy: input.aiCopy,
          hashtags: input.hashtags,
          status: "draft",
        });
        return result;
      }),
    publish: protectedProcedure
      .input(z.object({
        reelId: z.number(),
        platforms: z.array(z.string()),
      }))
      .mutation(async ({ input, ctx }) => {
        const reel = await getWebinarReelById(input.reelId);
        if (!reel) throw new TRPCError({ code: "NOT_FOUND", message: "Reel 不存在" });
        if (reel.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN", message: "无权操作" });
        await updateWebinarReel(input.reelId, {
          status: "published",
          publishedPlatforms: input.platforms,
        });
        return { success: true, platforms: input.platforms };
      }),
    byWebinar: protectedProcedure
      .input(z.object({ webinarId: z.number() }))
      .query(async ({ input }) => {
        return await getWebinarReelsByWebinar(input.webinarId);
      }),
  }),

  // ── Webinar Live ──────────────────────────────────────────────────────────────
  webinarLive: router({
    like: protectedProcedure
      .input(z.object({ webinarId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await likeWebinar(input.webinarId, ctx.user.id);
      }),
    unlike: protectedProcedure
      .input(z.object({ webinarId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await unlikeWebinar(input.webinarId, ctx.user.id);
      }),
    checkLike: protectedProcedure
      .input(z.object({ webinarId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await checkWebinarLike(input.webinarId, ctx.user.id);
      }),
    likeCount: publicProcedure
      .input(z.object({ webinarId: z.number() }))
      .query(async ({ input }) => {
        return await getWebinarLikeCount(input.webinarId);
      }),
    raiseHand: protectedProcedure
      .input(z.object({ webinarId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await raiseHand(input.webinarId, ctx.user.id);
      }),
    startMeeting: protectedProcedure
      .input(z.object({ factoryId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await startMeetingWithFactory(ctx.user.id, input.factoryId);
      }),
  }),

  // ── Notifications ─────────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserNotifications(ctx.user.id);
    }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await getUnreadNotificationsCount(ctx.user.id);
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

    create: protectedProcedure
      .input(z.object({
        userId: z.number(),
        type: z.string(),
        title: z.string(),
        content: z.string().optional(),
        link: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createNotification(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
