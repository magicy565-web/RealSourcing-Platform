import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { agoraTokenService } from "./_core/agora";
import { agoraTranslationService } from "./_core/agoraTranslation";
import { agoraRecordingService } from "./_core/agoraRecording";
import { aiService } from "./_core/aiService";
import { z } from "zod";
import { generateFactoryRecommendation } from "./ai";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import {
  createUser, getUserByEmail, getUserById, getUserByOpenId,
  getUserNotifications, getUnreadNotificationsCount,
  markNotificationAsRead, markAllNotificationsAsRead, createNotification, deleteNotification,
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
  getMeetingReelsWithThumbnail,
  // Inquiry
  getInquiryById, getInquiriesByBuyerId, getInquiriesByFactoryId,
  createInquiry, updateInquiry,
  // Inquiry Messages
  getInquiryMessages, createInquiryMessage,
  markInquiryMessagesRead, getUnreadInquiryMessageCount,
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
  // GTM 3.1 Factory Extensions
  getFactoryVerification, upsertFactoryVerification,
  getFactoryMetrics, upsertFactoryMetrics,
  getFactoryReels, createFactoryReel, deleteFactoryReel,
  getFactoryAvailabilities, upsertFactoryAvailability,
  // Sample Orders
  createSampleOrder, getSampleOrderById, getSampleOrdersByBuyer, getSampleOrdersByFactory, updateSampleOrder,
  // Factory Certifications
  getFactoryCertifications, createFactoryCertification, deleteFactoryCertification,
  // Meeting Availability
  getMeetingAvailability, upsertMeetingAvailability,
  // Factory Profile Update
  updateFactoryProfile, upsertFactoryDetails,
  // Product CRUD
  deleteProduct, upsertProductDetails,
  // Webinar Leads
  createWebinarLead, getWebinarLeadsByWebinarId, getWebinarLeadsByHostId,
  updateWebinarLeadStatus, getWebinarLeadCountByWebinarId,
  // AI Recommendation Feedback
  createAIRecommendationFeedback, getAIRecommendationFeedbackStats,
  // Phase 3: Sourcing Demands & Manufacturing Parameters
  createSourcingDemand, updateSourcingDemand, getSourcingDemandById,
  getSourcingDemandsByUser, getPublishedSourcingDemands,
  upsertManufacturingParameters, getManufacturingParametersByDemandId,
  getDemandWithParameters,
  // 5.0 Commander
  createCommanderTask, getCommanderTaskById, getCommanderTasksByFactory, updateCommanderTask,
  createInboundLead, getInboundLeadById, getInboundLeadsByFactory, updateInboundLead, getInboundLeadStats,
  createLeadReply, getLeadRepliesByLead, updateLeadReply,
  getFactoryCredit, ensureFactoryCredit, deductFactoryCredit, rechargeFactoryCredit, getCreditLedger,
  getDigitalAsset, upsertDigitalAsset,
  getCommanderPhoneByFactory, createCommanderPhone, updateCommanderPhone,
} from "./db";
import { TRPCError } from "@trpc/server";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";
import { ingestContent, isIngestionError } from "./_core/multimodalIngestionService";
import { extractSourcingDemand, isExtractionError } from "./_core/sourcingDemandService";
import { transformToManufacturingParams, isTransformationError } from "./_core/manufacturingParamsService";
import { ossUploadFromUrl, ossHealthCheck } from "./_core/ossStorageService";
import { generateRenderImage, isRenderImageError } from "./_core/renderImageService";
import { searchProductKnowledge } from "./_core/productKnowledgeService";
import {
  generateEmbedding, buildEmbeddingText, findSimilarDemands, isEmbeddingError
} from "./_core/vectorSearchService";

import { coachRouter } from './coach-router';
import { opportunityRadarRouter } from './opportunity-radar-router';
// ─── FTGI 路由 ────────────────────────────────────────────────────────────────
const ftgiRouter = router({
  // 获取工厂 FTGI 评分
  getScore: protectedProcedure
    .input(z.object({ factoryId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const { getFtgiScore } = await import('./_core/ftgiService');
      const factoryId = input.factoryId ?? (await (await import('./db')).getFactoryByUserId(ctx.user.id))?.id;
      if (!factoryId) return null;
      return getFtgiScore(factoryId);
    }),
  // 获取工厂上传的 FTGI 文档列表
  getDocuments: protectedProcedure
    .input(z.object({ factoryId: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const { getFtgiDocuments } = await import('./_core/ftgiService');
      const factoryId = input?.factoryId ?? (await (await import('./db')).getFactoryByUserId(ctx.user.id))?.id;
      if (!factoryId) return [];
      return getFtgiDocuments(factoryId);
    }),
  // 注册文档记录
  registerDocument: protectedProcedure
    .input(z.object({
      docType:  z.enum(['image', 'certification', 'transaction', 'customs', 'other']),
      fileName: z.string().min(1).max(500),
      fileUrl:  z.string().url(),
      fileMime: z.string().max(100).optional(),
      fileSize: z.number().int().positive().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { createFtgiDocument, parseDocumentToJson } = await import('./_core/ftgiService');
      const factory = await getFactoryByUserId(ctx.user.id);
      if (!factory) throw new TRPCError({ code: 'NOT_FOUND', message: '工厂不存在' });
      const result = await createFtgiDocument({
        factoryId:   factory.id,
        docType:     input.docType,
        fileName:    input.fileName,
        fileUrl:     input.fileUrl,
        mimeType:    input.fileMime,
        fileSize:    input.fileSize,
        uploadedBy:  ctx.user.id,
        parseStatus: 'pending',
      });
      const docId = (result as any).insertId as number;
      // 异步触发 AI 解析（非阻塞）
      setImmediate(() => parseDocumentToJson(docId, input.fileUrl, input.docType, input.fileName).catch(console.error));
      return { docId, success: true };
    }),
  // 删除文档
  deleteDocument: protectedProcedure
    .input(z.object({ docId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const { deleteFtgiDocument } = await import('./_core/ftgiService');
      const factory = await getFactoryByUserId(ctx.user.id);
      if (!factory) throw new TRPCError({ code: 'NOT_FOUND', message: '工厂不存在' });
      await deleteFtgiDocument(input.docId, factory.id);
      return { success: true };
    }),
  // 触发 FTGI 评分计算
  triggerCalculation: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { calculateFtgiScore } = await import('./_core/ftgiService');
      const factory = await getFactoryByUserId(ctx.user.id);
      if (!factory) throw new TRPCError({ code: 'NOT_FOUND', message: '工厂不存在' });
      // 异步计算（非阻塞）
      setImmediate(() => calculateFtgiScore(factory.id).catch(console.error));
      return { success: true, message: 'FTGI 评分计算已启动，预计 30-60 秒完成' };
    }),
  // FTGI 排行榜
  leaderboard: publicProcedure
    .input(z.object({
      limit:     z.number().min(1).max(200).default(50),
      certLevel: z.string().optional(),
      minScore:  z.number().optional(),
    }))
    .query(async ({ input }) => {
      const { getFtgiLeaderboard } = await import('./_core/ftgiService');
      return getFtgiLeaderboard({ limit: input.limit, certLevel: input.certLevel, minScore: input.minScore });
    }),
});

// ─── Human Scores 路由 ─────────────────────────────────────────────────────────

// ─── Human Scores 路由 ─────────────────────────────────────────────────────────
const humanScoresRouter = router({
  // 获取工厂综合人工评分
  getScore: publicProcedure
    .input(z.object({ factoryId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await (await import('./db')).dbPromise;
      const schema = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const score = await db.query.factoryScores.findFirst({
        where: eq(schema.factoryScores.factoryId, input.factoryId),
      });
      return score ? {
        humanScore:         parseFloat(score.overallScore ?? '0'),
        ftgiContribution:   parseFloat(score.qualityScore ?? '0'),
        scoreFromReviews:   parseFloat(score.serviceScore ?? '0'),
        scoreFromWebinars:  parseFloat(score.deliveryScore ?? '0'),
        scoreFromExperts:   parseFloat(score.priceCompetitiveness ?? '0'),
        reviewCount:        score.totalReviews,
        webinarVoteCount:   0,
        expertReviewCount:  0,
      } : null;
    }),
  // 兼容别名
  getHumanScore: publicProcedure
    .input(z.object({ factoryId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const db = await (await import('./db')).dbPromise;
      const schema = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      return db.query.factoryScores.findFirst({
        where: eq(schema.factoryScores.factoryId, input.factoryId),
      });
    }),
  // 获取工厂评价列表
  getReviews: publicProcedure
    .input(z.object({ factoryId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return getFactoryReviews(input.factoryId);
    }),
  // 添加工厂评价
  addReview: protectedProcedure
    .input(z.object({
      factoryId:          z.number().int().positive(),
      orderId:            z.number().int().positive().optional(),
      quality:            z.number().min(1).max(5),
      service:            z.number().min(1).max(5),
      delivery:           z.number().min(1).max(5),
      communication:      z.number().min(1).max(5),
      priceValue:         z.number().min(1).max(5),
      comment:            z.string().max(2000).optional(),
      isVerifiedPurchase: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const avgRating = Math.round((input.quality + input.service + input.delivery + input.communication + input.priceValue) / 5);
      await createFactoryReview({ factoryId: input.factoryId, userId: ctx.user.id, rating: avgRating, comment: input.comment });
      return { success: true };
    }),
  // 获取专家评审列表
  getExpertReviews: publicProcedure
    .input(z.object({ factoryId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return getFactoryReviews(input.factoryId);
    }),
  // 添加专家评审
  addExpertReview: protectedProcedure
    .input(z.object({
      factoryId:        z.number().int().positive(),
      scoreInnovation:  z.number().min(1).max(10),
      scoreManagement:  z.number().min(1).max(10),
      scorePotential:   z.number().min(1).max(10),
      summary:          z.string().min(20).max(5000),
    }))
    .mutation(async ({ input, ctx }) => {
      const avgRating = Math.round((input.scoreInnovation + input.scoreManagement + input.scorePotential) / 3 / 2);
      await createFactoryReview({ factoryId: input.factoryId, userId: ctx.user.id, rating: avgRating, comment: input.summary });
      return { success: true };
    }),
  // ── Webinar 投票功能 ──────────────────────────────────────────────────────
  createPoll: protectedProcedure
    .input(z.object({
      webinarId: z.number().int().positive(),
      factoryId: z.number().int().positive().optional(),
      question:  z.string().min(1).max(500),
      options:   z.array(z.string().min(1).max(200)).min(2).max(10),
      pollType:  z.string().max(50).optional(),
    }))
    .mutation(async () => {
      // TODO: 投票表尚未创建，先返回 mock 数据保持前端可用
      return { pollId: Date.now(), success: true };
    }),
  getPolls: publicProcedure
    .input(z.object({ webinarId: z.number().int().positive() }))
    .query(async () => [] as unknown[]),
  submitVote: protectedProcedure
    .input(z.object({
      pollId:         z.number().int().positive(),
      selectedOption: z.number().int().min(0),
    }))
    .mutation(async () => ({ success: true })),
  closePoll: protectedProcedure
    .input(z.object({ pollId: z.number().int().positive() }))
    .mutation(async () => ({ success: true })),
  getPollResults: publicProcedure
    .input(z.object({ pollId: z.number().int().positive() }))
    .query(async () => ({ options: [] as { label: string; count: number; percent: number }[] })),
});


export const appRouter = router({
  coach: coachRouter,
  opportunityRadar: opportunityRadarRouter,
  system: systemRouter,

  // ── Agora RTC/RTM Token Generation ──────────────────────────────────────────
  agora: router({
    getDualTokens: protectedProcedure
      .input(z.object({
        channel: z.string().min(1),
        uid: z.union([z.string(), z.number()]),
        role: z.enum(['publisher', 'subscriber']).default('publisher'),
      }))
      .query(({ input }) => {
        try {
          const tokens = agoraTokenService.generateDualTokens({
            channel: input.channel,
            uid: input.uid,
            role: input.role,
          });
          return tokens;
        } catch (error) {
          console.error('Failed to generate Agora tokens:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate Agora tokens',
          });
        }
      }),

    getRtcToken: protectedProcedure
      .input(z.object({
        channel: z.string().min(1),
        uid: z.union([z.string(), z.number()]),
        role: z.enum(['publisher', 'subscriber']).default('publisher'),
      }))
      .query(({ input }) => {
        try {
          const token = agoraTokenService.generateRtcToken({
            channel: input.channel,
            uid: input.uid,
            role: input.role,
          });
          return { rtcToken: token, appId: agoraTokenService.getAppId() };
        } catch (error) {
          console.error('Failed to generate RTC token:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate RTC token',
          });
        }
      }),

    startTranslation: protectedProcedure
      .input(z.object({
        channelName: z.string().min(1),
        uid: z.union([z.string(), z.number()]),
        subscribeUid: z.union([z.string(), z.number()]).optional(),
        language: z.string().default('en'),
        translateLanguage: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await agoraTranslationService.startSTT({
          channelName: input.channelName,
          uid: input.uid,
          subscribeUid: input.subscribeUid,
          language: input.language,
          translateLanguage: input.translateLanguage,
        });
        if (result.status === 'failed') {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.message || 'Failed to start translation',
          });
        }
        return result;
      }),

    stopTranslation: protectedProcedure
      .input(z.object({
        taskId: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const result = await agoraTranslationService.stopSTT(input.taskId);
        return result;
      }),

    startRecording: protectedProcedure
      .input(z.object({
        channelName: z.string().min(1),
        uid: z.union([z.string(), z.number()]),
        recordingMode: z.enum(['composite', 'individual']).default('composite'),
        videoProfile: z.enum(['HD', 'SD', 'FHD', '4K']).default('HD'),
      }))
      .mutation(async ({ input }) => {
        const result = await agoraRecordingService.startRecording({
          channelName: input.channelName,
          uid: input.uid,
          recordingMode: input.recordingMode,
          videoProfile: input.videoProfile,
        });
        if (result.status === 'failed') {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.message || 'Failed to start recording',
          });
        }
        return result;
      }),

    stopRecording: protectedProcedure
      .input(z.object({
        resourceId: z.string().min(1),
        sid: z.string().min(1),
        meetingId: z.number().optional(), // P0.2: 停止录制后将 URL 写入数据库
        durationMinutes: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await agoraRecordingService.stopRecording(input.resourceId, input.sid);

        // P0.2 + Webhook 增强：停止录制后立即更新会议状态
        // 真实 recordingUrl 将由 Agora Webhook 回调（/api/webhooks/agora-recording）在文件上传完成后写入
        // 此处仅更新会议状态和时长，recordingUrl 留空等待 Webhook 填充
        if (input.meetingId && result.status === 'stopped') {
          try {
            await updateMeeting(input.meetingId, {
              durationMinutes: input.durationMinutes,
              status: 'completed',
              endedAt: new Date(),
              // recordingUrl 由 Agora Webhook 在 S3 上传完成后自动写入
              // Webhook 端点：POST /api/webhooks/agora-recording
            });
            console.log(`✅ Meeting #${input.meetingId} status updated to completed, awaiting Webhook for recordingUrl`);
          } catch (dbError) {
            console.error('❌ Failed to update meeting status:', dbError);
          }
        }

        return result;
      }),

    getRecordingStatus: protectedProcedure
      .input(z.object({
        resourceId: z.string().min(1),
        sid: z.string().min(1),
      }))
      .query(async ({ input }) => {
        const result = await agoraRecordingService.getRecordingStatus(input.resourceId, input.sid);
        return result;
      }),

    getActiveRecordings: protectedProcedure
      .query(() => {
        return agoraRecordingService.getActiveRecordings();
      }),

    getActiveTasks: protectedProcedure
      .query(() => {
        return agoraTranslationService.getActiveTasks();
      }),
  }),

  // ── AI Services (P1) ──────────────────────────────────────────────────────────
  ai: router({
    // P1.1: 会议结束后生成 AI 摘要
    generateMeetingSummary: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const meeting = await getMeetingById(input.meetingId);
        if (!meeting) throw new TRPCError({ code: "NOT_FOUND", message: "会议不存在" });
        if (meeting.buyerId !== ctx.user.id && meeting.factoryUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权操作" });
        }

        const transcripts = await getMeetingTranscripts(input.meetingId);
        const factory = await getFactoryById(meeting.factoryId);
        const buyer = await getUserById(meeting.buyerId);

        const summary = await aiService.generateMeetingSummary(
          transcripts.map(t => ({ speakerName: t.speakerName, content: t.content, timestamp: t.timestamp })),
          {
            factoryName: factory?.name || 'Factory',
            buyerName: buyer?.name || 'Buyer',
            meetingTitle: meeting.title,
            durationMinutes: meeting.durationMinutes,
          }
        );

        // 将摘要写入数据库
        await updateMeeting(input.meetingId, {
          aiSummary: summary.keyPoints as any,
          followUpActions: summary.followUpActions as any,
        });

        return { success: true, summary };
      }),

    // P1.2: AI 采购助理多轮对话（RAG 增强版）
    procurementChat: protectedProcedure
      .input(z.object({
        messages: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        })),
        context: z.object({
          currentPage: z.string().optional(),
          recentMeetings: z.array(z.string()).optional(),
          interestedCategories: z.array(z.string()).optional(),
        }).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // ── RAG 增强：从平台数据库检索相关工厂和产品 ────────────────────────────
        let relevantFactories: Array<{ id: number; name: string; category: string; score: number }> = [];
        let relevantProducts: Array<{ id: number; name: string; factoryName: string; price?: string }> = [];

        try {
          // 从最新一条用户消息中提取关键词，用于检索
          const lastUserMessage = [...input.messages].reverse().find(m => m.role === 'user');
          const searchQuery = lastUserMessage?.content || '';

          // 检索相关工厂（使用关键词搜索，取评分最高的前 5 家）
          if (searchQuery.length > 2) {
            const allFactories = await getAllFactories();
            // 简单关键词匹配：名称、类别包含查询词
            const queryLower = searchQuery.toLowerCase();
            const matched = allFactories
              .filter((f: any) =>
                (f.name && f.name.toLowerCase().includes(queryLower)) ||
                (f.category && f.category.toLowerCase().includes(queryLower)) ||
                (input.context?.interestedCategories?.some((cat: string) =>
                  f.category?.toLowerCase().includes(cat.toLowerCase())
                ))
              )
              .sort((a: any, b: any) => (b.overallScore || 0) - (a.overallScore || 0))
              .slice(0, 5);

            relevantFactories = matched.map((f: any) => ({
              id: f.id,
              name: f.name,
              category: f.category || 'General',
              score: f.overallScore || 0,
            }));

            // 检索相关产品（取匹配工厂的产品，最多 5 个）
            if (matched.length > 0) {
              const topFactory = matched[0];
              const products = await getProductsByFactoryId(topFactory.id);
              relevantProducts = products.slice(0, 5).map((p: any) => ({
                id: p.id,
                name: p.name,
                factoryName: topFactory.name,
                price: p.details?.priceMin ? `$${p.details.priceMin}/pc` : undefined,
              }));
            }
          }
        } catch (ragError) {
          // RAG 检索失败不影响主流程
          console.warn('⚠️ [RAG] Context retrieval failed:', (ragError as Error).message);
        }

        // ── 知识库增强：检索产品类目专业知识 ──────────────────────────────────────
        let knowledgeContext = '';
        try {
          const lastUserMsg = [...input.messages].reverse().find(m => m.role === 'user');
          if (lastUserMsg && lastUserMsg.content.length > 2) {
            const knowledgeResult = await searchProductKnowledge(lastUserMsg.content, {
              maxItems: 6,
              usedInContext: 'procurement_chat',
              userId: ctx.user.id,
            });
            if (knowledgeResult.items.length > 0) {
              knowledgeContext = knowledgeResult.formattedContext;
              console.log(`✅ [Knowledge RAG] 检索到 ${knowledgeResult.items.length} 条知识条目`);
            }
          }
        } catch (knowledgeError) {
          console.warn('⚠️ [Knowledge RAG] 知识库检索失败:', (knowledgeError as Error).message);
        }

        const response = await aiService.chatWithProcurementAssistant(
          input.messages as any,
          {
            userRole: ctx.user.role || 'buyer',
            currentPage: input.context?.currentPage,
            recentMeetings: input.context?.recentMeetings,
            interestedCategories: input.context?.interestedCategories,
            relevantFactories,
            relevantProducts,
            knowledgeContext,
          }
        );
        return response;
      }),

    // P2.1: Agent 欢迎消息
    agentWelcome: protectedProcedure
      .mutation(async () => {
        return {
          content: "您好！我是您的 AI 采购顾问 🤖\n\n我将通过几个简单的问题，帮您在 **15 分钟内**精准匹配最优供应商。\n\n请告诉我：**您想采购什么产品？**（可以描述产品名称、用途或特征）",
          phase: "welcome" as const,
          progressPercent: 0,
          preferences: {},
          sessionState: {
            currentPhase: "welcome" as const,
            preferences: {} as Record<string, unknown>,
            conversationHistory: [] as Array<{ role: "user" | "assistant"; content: string }>,
          },
        };
      }),

    // P2.2: Agent 多轮对话核心接口
    agentChat: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        message: z.string().min(1).max(2000),
        sessionState: z.object({
          currentPhase: z.enum(["welcome", "price", "leadtime", "customization", "quantity", "qualification", "summary", "quotes", "followup"]),
          preferences: z.record(z.string(), z.any()),
          conversationHistory: z.array(z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
         const { invokeLLM } = await import('./_core/llm');
        const { getAllFactories } = await import('./db');
        const currentPhase = input.sessionState.currentPhase;
        const prefs = input.sessionState.preferences as Record<string, unknown>;
        const history = input.sessionState.conversationHistory;
        // 读取用户商业画像，注入 AI 上下文
        let userProfileContext = '';
        try {
          const mysql = require('mysql2/promise');
          const conn = await mysql.createConnection(process.env.DATABASE_URL);
          const [rows] = await conn.execute('SELECT * FROM user_business_profiles WHERE userId = ? LIMIT 1', [ctx.user.id]);
          await conn.end();
          const profile = (rows as any[])[0];
          if (profile) {
            const niches = (() => { try { return JSON.parse(profile.interestedNiches || '[]'); } catch { return []; } })();
            const platforms = (() => { try { return JSON.parse(profile.targetPlatforms || '[]'); } catch { return []; } })();
            const AMBITION_MAP: Record<string, string> = { side_income: 'earn side income ($500-$2k/month)', full_time: 'go full-time ($5k-$20k/month)', dtc_brand: 'build a DTC brand', learn: 'explore and learn dropshipping' };
            const STAGE_MAP: Record<string, string> = { newbie: 'complete beginner', has_idea: 'has product idea but no store yet', has_store: 'has a store, needs better products', already_selling: 'already selling and wants to scale' };
            const CHALLENGE_MAP: Record<string, string> = { finding_products: 'finding winning products', finding_suppliers: 'finding reliable suppliers', marketing: 'marketing and getting traffic', operations: 'managing operations', capital: 'limited budget', knowledge: 'lack of knowledge' };
            userProfileContext = `
=== USER BUSINESS PROFILE (CONFIDENTIAL CONTEXT) ===
Goal: ${AMBITION_MAP[profile.ambition] || profile.ambition || 'not specified'}
Current Stage: ${STAGE_MAP[profile.businessStage] || profile.businessStage || 'not specified'}
Budget: ${profile.budget || 'not specified'}
Interested Niches: ${niches.join(', ') || 'not specified'}
Target Sales Platforms: ${platforms.join(', ') || 'not specified'}
Main Challenge: ${CHALLENGE_MAP[profile.mainChallenge] || profile.mainChallenge || 'not specified'}
===================================================
IMPORTANT: Use this profile to personalize all responses. Address their specific challenge first. Recommend suppliers and products that match their niches and budget. Speak to their current stage.
`;
          }
        } catch (e) {
          // Profile fetch failed silently — proceed without context
        }
        const systemPrompt = `你是 RealSourcing 平台的 AI 采购顾问，专门帮助买家在中国找到最优质的供应商。${userProfileContext}。

你的任务是通过多轮对话，逐步收集买家的采购需求，包括：产品信息、价格预算、交期要求、定制需求、采购数量、工厂资质要求。

当前对话阶段：${currentPhase}
当前已收集的偏好：${JSON.stringify(prefs)}

阶段流程：welcome → price → leadtime → customization → quantity → qualification → summary → quotes

规则：
1. 每次只问一个问题，不要一次问多个
2. 根据用户回答提取关键信息，更新偏好
3. 当收集到足够信息（至少有产品名称和价格）时，进入 summary 阶段汇总需求
4. summary 阶段后进入 quotes 阶段返回报价
5. 回复要简洁友好，使用中文
6. 在回复末尾用 <!--STATE: {...} --> 格式返回状态更新

JSON 格式示例：
<!--STATE: {
  "nextPhase": "price",
  "progressPercent": 15,
  "extractedPrefs": {
    "productName": "口红管",
    "productCategory": "美妆个护"
  }
} -->`;

        const messages: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
          { role: "system", content: systemPrompt },
          ...history.slice(-10).map(h => ({ role: h.role as "user" | "assistant", content: h.content })),
          { role: "user", content: input.message },
        ];

        const llmResult = await invokeLLM({ messages, maxTokens: 800 });
        const rawContent = (llmResult.choices?.[0]?.message?.content as string) || "抱歉，我暂时无法处理您的请求，请稍后再试。";

        let nextPhase = currentPhase;
        let progressPercent = 10;
        let extractedPrefs: Record<string, unknown> = {};
        let quotes: unknown[] | undefined;

        const VALID_PHASES = ["welcome", "price", "leadtime", "customization", "quantity", "qualification", "summary", "quotes", "followup"] as const;
        const stateMatch = rawContent.match(/<!--STATE:\s*({[\s\S]*?})\s*-->/);
        if (stateMatch) {
          try {
            const stateData = JSON.parse(stateMatch[1]);
            const rawNextPhase = stateData.nextPhase || currentPhase;
            // 白名单过滤：防止 AI 返回非法 phase 值导致下一轮 zod 验证失败
            nextPhase = (VALID_PHASES as readonly string[]).includes(rawNextPhase) ? rawNextPhase : currentPhase;
            progressPercent = stateData.progressPercent || progressPercent;
            extractedPrefs = stateData.extractedPrefs || {};
          } catch (_) {}
        }

        const cleanContent = rawContent.replace(/<!--STATE:[\s\S]*?-->/g, "").trim();

        // 强制规则：当前阶段是 summary 时，自动进入 quotes（不依赖 AI 的 STATE 解析）
        if (currentPhase === "summary") {
          nextPhase = "quotes";
          progressPercent = 100;
        }

        if (nextPhase === "quotes") {
          try {
            const allFactories = await getAllFactories();
            const mergedPrefs = { ...prefs, ...extractedPrefs };
            const productName = ((mergedPrefs.productName || mergedPrefs.productCategory || input.message) as string);
            const queryLower = productName.toLowerCase();

            // 精确匹配：按产品名称或分类搜索
            let matched: any[] = allFactories
              .filter((f: any) =>
                f.name?.toLowerCase().includes(queryLower) ||
                f.category?.toLowerCase().includes(queryLower)
              )
              .slice(0, 5);

            // 精确匹配失败时，取评分最高的前 3 家工厂作为推荐
            if (matched.length === 0) {
              matched = [...allFactories]
                .sort((a: any, b: any) => parseFloat(b.overallScore || "0") - parseFloat(a.overallScore || "0"))
                .slice(0, 3);
            }
            // 按 id 去重，避免重复工厂
            const seenIds = new Set<number>();
            matched = matched.filter((f: any) => {
              if (seenIds.has(f.id)) return false;
              seenIds.add(f.id);
              return true;
            });

            // 基于用户预算生成合理单价
            const budgetStr = (mergedPrefs.budget || mergedPrefs.price || "") as string;
            const budgetNums = budgetStr.match(/(\d+(?:\.\d+)?)/g);
            const budgetMin = budgetNums ? parseFloat(budgetNums[0]) : null;
            const budgetMax = budgetNums && budgetNums[1] ? parseFloat(budgetNums[1]) : budgetMin;

            if (matched.length > 0) {
              quotes = matched.map((f: any, i: number) => {
                const score = parseFloat(f.overallScore || "4.5") || 4.5;
                // 在预算范围内生成单价
                let unitPrice: number | null = null;
                if (budgetMin !== null) {
                  const range = (budgetMax || budgetMin) - budgetMin;
                  unitPrice = parseFloat((budgetMin + range * (0.2 + i * 0.3)).toFixed(2));
                }
                return {
                  quoteId: `q-${f.id}-${Date.now()}-${i}`,
                  factoryId: f.id,
                  factoryName: f.name,
                  factoryScore: score,
                  isVerified: f.certificationStatus === "verified" || i === 0,
                  productName: productName,
                  productCategory: f.category || "制造业",
                  unitPrice,
                  currency: "USD",
                  moq: [500, 1000, 200][i] ?? 500,
                  leadTimeDays: [25, 30, 35][i] ?? 30,
                  matchScore: Math.max(75, 95 - i * 6),
                  matchReasons: [
                    f.certificationStatus === "verified" ? "已通过 AI 验厂" : "平台认证工厂",
                    `评分 ${score.toFixed(1)} 分`,
                    `专注 ${f.category || "制造业"}`,
                  ],
                  certifications: i === 0 ? ["CE", "ISO9001"] : ["CE"],
                  location: f.city ? `中国${f.city}` : "中国",
                };
              });
            } else {
              quotes = [
                {
                  quoteId: `q-demo-1-${Date.now()}`,
                  factoryName: "深圳鸿毅实业有限公司",
                  factoryScore: 4.9,
                  isVerified: true,
                  productName: productName,
                  productCategory: (mergedPrefs.productCategory as string) || "制造业",
                  unitPrice: 2.50,
                  currency: "USD",
                  moq: 1000,
                  leadTimeDays: 25,
                  matchScore: 94,
                  matchReasons: ["已通过 AI 验厂", "评分 4.9 分", "10年出口经验"],
                  certifications: ["CE", "ISO9001", "RoHS"],
                  location: "广东深圳",
                  qualityScore: 4.8, serviceScore: 4.9, deliveryScore: 4.7,
                  priceCompetitiveness: 78, onTimeDeliveryRate: 96,
                  totalTransactions: 312, totalReviews: 87, responseRate: 98,
                  foundedYear: 2008, employeeCount: "200-500人",
                  mainMarkets: ["欧洲", "北美", "澳洲"],
                  paymentTerms: "T/T 30% 定金",
                  privateLabelSupport: true, sampleAvailable: true,
                  exportExperience: "英语、粤语",
                  aiRecommendIndex: 91,
                  aiRecommendReason: "综合评分最高，认证最完整，交期最快，强烈推荐",
                },
                {
                  quoteId: `q-demo-2-${Date.now()}`,
                  factoryName: "义乌博远贸易有限公司",
                  factoryScore: 4.7,
                  isVerified: true,
                  productName: productName,
                  productCategory: (mergedPrefs.productCategory as string) || "制造业",
                  unitPrice: 1.80,
                  currency: "USD",
                  moq: 500,
                  leadTimeDays: 35,
                  matchScore: 87,
                  matchReasons: ["价格竞争力强", "MOQ 灵活", "快速响应"],
                  certifications: ["CE"],
                  location: "浙江义乌",
                  qualityScore: 4.5, serviceScore: 4.8, deliveryScore: 4.3,
                  priceCompetitiveness: 92, onTimeDeliveryRate: 88,
                  totalTransactions: 156, totalReviews: 43, responseRate: 95,
                  foundedYear: 2014, employeeCount: "50-200人",
                  mainMarkets: ["欧洲", "中东"],
                  paymentTerms: "T/T 50% 定金",
                  privateLabelSupport: true, sampleAvailable: true,
                  exportExperience: "英语",
                  aiRecommendIndex: 79,
                  aiRecommendReason: "价格最具竞争力，MOQ门槛低，适合小批量测款",
                },
                {
                  quoteId: `q-demo-3-${Date.now()}`,
                  factoryName: "东莞精锐制造有限公司",
                  factoryScore: 4.6,
                  isVerified: false,
                  productName: productName,
                  productCategory: (mergedPrefs.productCategory as string) || "制造业",
                  unitPrice: 3.10,
                  currency: "USD",
                  moq: 2000,
                  leadTimeDays: 20,
                  matchScore: 81,
                  matchReasons: ["交期最快", "大批量优势", "自动化生产线"],
                  certifications: ["CE", "ISO9001", "FCC"],
                  location: "广东东莞",
                  qualityScore: 4.7, serviceScore: 4.4, deliveryScore: 4.9,
                  priceCompetitiveness: 65, onTimeDeliveryRate: 98,
                  totalTransactions: 89, totalReviews: 28, responseRate: 88,
                  foundedYear: 2011, employeeCount: "500-1000人",
                  mainMarkets: ["北美", "日本", "韩国"],
                  paymentTerms: "L/C 或 T/T",
                  privateLabelSupport: false, sampleAvailable: true,
                  exportExperience: "英语、日语",
                  aiRecommendIndex: 74,
                  aiRecommendReason: "交期最快，适合大批量急单，价格偏高",
                },
              ];
            }
          } catch (_) {}
        }

        const mergedPreferences = { ...prefs, ...extractedPrefs };

        return {
          content: cleanContent,
          phase: nextPhase,
          progressPercent,
          preferences: mergedPreferences,
          quotes,
          sessionState: {
            currentPhase: nextPhase,
            preferences: mergedPreferences,
            conversationHistory: [
              ...history,
              { role: "user" as const, content: input.message },
              { role: "assistant" as const, content: cleanContent },
            ],
          },
        };
      }),

    // P2.3: Agent 直接检索报价
    agentQuotes: protectedProcedure
      .input(z.object({
        preferences: z.record(z.string(), z.any()),
        limit: z.number().min(1).max(10).default(5),
      }))
       .mutation(async ({ input }) => {
        const { getAllFactories } = await import('./db');
        const allFactories = await getAllFactories();
        // 规范 3.3: 数据去重——防止脚数据导致重复工厂卡片
        const uniqueFactories = Array.from(
          new Map(allFactories.map((f: any) => [f.id, f])).values()
        ) as typeof allFactories;
        const productName = ((input.preferences.productName || input.preferences.productCategory || "") as string);
        const queryLower = productName.toLowerCase();
        // 规范 3.3: 优雅降级——精确匹配失败时，取评分最高的工厂作为备选
        let matched: typeof allFactories = [];
        if (queryLower) {
          matched = uniqueFactories.filter((f: any) =>
            f.name?.toLowerCase().includes(queryLower) ||
            f.category?.toLowerCase().includes(queryLower)
          ).slice(0, input.limit);
        }
        if (matched.length === 0) {
          // 降级：返回综合评分最高的工厂
          matched = [...uniqueFactories]
            .sort((a: any, b: any) => (b.overallScore || b.score || 0) - (a.overallScore || a.score || 0))
            .slice(0, input.limit);
        }
        return matched.map((f: any, i: number) => ({
          quoteId: `q-${f.id}-${Date.now()}-${i}`,
          factoryId: f.id,
          factoryName: f.name,
          factoryScore: f.score || f.overallScore || 4.5,
          isVerified: f.isVerified || false,
          productName: productName || "产品",
          productCategory: f.category,
          unitPrice: f.minPrice || null,
          currency: "USD",
          moq: f.moq || 500,
          leadTimeDays: f.leadTime || 30,
          matchScore: Math.max(70, 95 - i * 5),
          matchReasons: ["平台认证工厂", `评分 ${(f.score || f.overallScore || 4.5).toFixed(1)} 分`],
          certifications: f.certifications || [],
          location: f.location || "中国",
        }));
      }),

    // P1.3: 识别 Meeting Reel 关键时刻
    identifyReelHighlights: protectedProcedure
      .input(z.object({
        meetingId: z.number(),
        targetDurationSeconds: z.number().optional().default(45),
      }))
      .mutation(async ({ input, ctx }) => {
        const meeting = await getMeetingById(input.meetingId);
        if (!meeting) throw new TRPCError({ code: "NOT_FOUND", message: "会议不存在" });
        if (meeting.buyerId !== ctx.user.id && meeting.factoryUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权操作" });
        }

        const transcripts = await getMeetingTranscripts(input.meetingId);
        const highlights = await aiService.identifyReelHighlights(
          transcripts.map(t => ({ speakerName: t.speakerName, content: t.content, timestamp: t.timestamp })),
          input.targetDurationSeconds
        );

        return { highlights };
      }),

    // P1.4: 生成 Reels 脚本（通过后端 AI 调用，避免前端直接暴露 API Key）
    generateReelScript: protectedProcedure
      .input(z.object({
        meetingId: z.number(),
        highlights: z.array(z.object({
          title: z.string(),
          startTime: z.string(),
          endTime: z.string(),
          description: z.string(),
          category: z.string().optional(),
          importance: z.string().optional(),
        })),
        style: z.string().optional().default('科技感'),
        duration: z.number().optional().default(30),
        orientation: z.string().optional().default('竖屏'),
        reelType: z.string().optional().default('产品发布'),
      }))
      .mutation(async ({ input, ctx }) => {
        const meeting = await getMeetingById(input.meetingId);
        if (!meeting) throw new TRPCError({ code: 'NOT_FOUND', message: '会议不存在' });
        if (meeting.buyerId !== ctx.user.id && meeting.factoryUserId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: '无权操作' });
        }
        const transcripts = await getMeetingTranscripts(input.meetingId);
        const factory = await getFactoryById(meeting.factoryId);
        const factoryName = factory?.name || meeting.title.split('·')[0].trim() || 'Wanhua Chemical';
        const highlightText = input.highlights.map((h, i) =>
          `片段${i + 1}: ${h.title}\n时间: ${h.startTime} → ${h.endTime}\n描述: ${h.description}`
        ).join('\n\n');
        const transcriptSample = transcripts.slice(0, 20).map(t =>
          `[${t.timestamp}] ${t.speakerName}: ${t.content}`
        ).join('\n');
        const systemPrompt = `你是一个专业的短视频 Reels 脚本生成专家，擅长为 B2B 工厂 Webinar 生成适合 TikTok/抖音/微信的高光短视频脚本。`;
        const userPrompt = `请为以下 Webinar 高光片段生成一个完整的 Reels 脚本。

会议标题: ${meeting.title}
工厂名称: ${factoryName}
Reels 类型: ${input.reelType}
视频时长: ${input.duration}秒
视频方向: ${input.orientation}
风格: ${input.style}

高光片段:
${highlightText}

转录样本:
${transcriptSample}

请生成一个 JSON 格式的脚本，包含以下字段:
{
  "hook": "开场钩子文案（3秒内抓住注意力）",
  "segments": [
    {
      "timeRange": "0-3s",
      "visual": "画面描述",
      "voiceover": "配音文案",
      "text": "字幕文字"
    }
  ],
  "cta": "行动号召文案",
  "hashtags": ["相关标签"]
}

要求:
1. 开场钩子必须在3秒内引起注意
2. 使用真实的产品数据和认证信息
3. 适合 ${input.orientation === '竖屏' ? 'TikTok/抖音' : 'YouTube/微信视频号'}
4. 风格要${input.style}，突出 ${factoryName} 的专业性
5. 只返回 JSON，不要其他文字`;
        const responseText = await aiService.callAI(
          [
            { role: 'system' as const, content: systemPrompt },
            { role: 'user' as const, content: userPrompt },
          ],
          { maxTokens: 1500, temperature: 0.7 }
        );
        let script;
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          script = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          script = null;
        }
        return { script, rawText: responseText };
      }),
  }),

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
        role: z.enum(["BUYER", "FACTORY_ADMIN", "buyer", "factory", "user"]).default("BUYER"),
      }))
      .mutation(async ({ input }) => {
        const existingUser = await getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "该邮箱已被注册" });
        }
        const hashedPassword = await bcrypt.hash(input.password, 10);
        const openId = `email_${nanoid()}`;
        
        // 映射角色到数据库 ENUM
        let dbRole = "BUYER";
        if (input.role === "factory" || input.role === "FACTORY_ADMIN") dbRole = "FACTORY_ADMIN";
        
        await createUser({
          openId,
          name: input.name,
          email: input.email,
          passwordHash: hashedPassword,
          role: dbRole,
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
    // 开始/结束直播：更新 webinar 状态
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["draft", "scheduled", "live", "ended"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const webinar = await getWebinarById(input.id);
        if (!webinar) throw new TRPCError({ code: "NOT_FOUND", message: "Webinar 不存在" });
        if (webinar.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "只有主播可以更改直播状态" });
        }
        await updateWebinar(input.id, { status: input.status });
        return { success: true };
      }),
    // 获取某个 webinar 的线索数量
    leadCount: protectedProcedure
      .input(z.object({ webinarId: z.number() }))
      .query(async ({ input }) => {
        return await getWebinarLeadCountByWebinarId(input.webinarId);
      }),
  }),
  // ── Factoriess ─────────────────────────────────────────────────────────────────
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

        // GTM 3.1: 获取AI验厂、运营指标、Reel视频、可连线时间
        const verification = await getFactoryVerification(input.id);
        const metrics = await getFactoryMetrics(input.id);
        const reels = await getFactoryReels(input.id);
        const availabilities = await getFactoryAvailabilities(input.id);

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
          verification: verification || null,
          metrics: metrics || null,
          reels: reels || [],
          availabilities: availabilities || [],
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

    // GTM 3.1 endpoints
    verification: publicProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        return await getFactoryVerification(input.factoryId);
      }),

    metrics: publicProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        return await getFactoryMetrics(input.factoryId);
      }),

    reels: publicProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        return await getFactoryReels(input.factoryId);
      }),

    availabilities: publicProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        return await getFactoryAvailabilities(input.factoryId);
      }),

    // AI 推荐理由生成端点
    getAIRecommendation: publicProcedure
      .input(z.object({ 
        factoryId: z.number(),
        buyerPreferences: z.object({
          preferredCategories: z.array(z.string()).optional(),
          preferredCountries: z.array(z.string()).optional(),
          minQualityScore: z.number().optional(),
        }).optional(),
      }))
      .query(async ({ input }) => {
        try {
          // 获取工厂完整数据
          const factory = await getFactoryById(input.factoryId);
          if (!factory) {
            throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
          }

          // 获取工厂的 GTM 3.1 数据
          const verification = await getFactoryVerification(input.factoryId);
          const metrics = await getFactoryMetrics(input.factoryId);
          const reels = await getFactoryReels(input.factoryId);

          // 构建 AI 分析用的数据
          const factoryDataForAI = {
            id: factory.id.toString(),
            name: factory.name,
            category: factory.category,
            country: factory.country,
            city: factory.city,
            overallScore: factory.overallScore,
            certificationStatus: factory.certificationStatus,
            responseRate: factory.responseRate,
            viewCount: factory.viewCount,
            favoriteCount: factory.favoriteCount,
            aiVerificationScore: verification?.aiVerificationScore,
            totalOrders: metrics?.totalOrders,
            sampleConversionRate: metrics?.sampleConversionRate,
            disputeRate: metrics?.disputeRate,
            reelCount: reels?.length || 0,
            languagesSpoken: (() => {
              if (!factory.languagesSpoken) return [];
              if (Array.isArray(factory.languagesSpoken)) return factory.languagesSpoken as string[];
              try { const p = JSON.parse(factory.languagesSpoken as unknown as string); return Array.isArray(p) ? p : []; } catch { return []; }
            })(),
            establishedYear: factory.establishedYear,
            employeeCount: factory.employeeCount,
          };

          // 调用 AI 服务生成推荐理由
          const recommendation = await generateFactoryRecommendation(
            factoryDataForAI,
            input.buyerPreferences
          );

          return {
            success: true,
            data: recommendation,
          };
        } catch (error) {
          console.error("❌ AI 推荐理由生成失败:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "生成推荐理由失败，请稍后重试",
          });
        }
      }),

    // P1-2: AI 推荐用户反馈（已对接真实数据库）
    submitAIRecommendationFeedback: protectedProcedure
      .input(z.object({
        factoryId: z.number(),
        isHelpful: z.boolean(),
        feedbackText: z.string().max(500).optional(),
        recommendationMainReason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // 写入数据库
        const result = await createAIRecommendationFeedback({
          userId: ctx.user.id,
          factoryId: input.factoryId,
          isHelpful: input.isHelpful,
          feedbackText: input.feedbackText,
          recommendationMainReason: input.recommendationMainReason,
        });

        console.log(`📊 [AI Feedback] Saved #${result.id} | User ${ctx.user.id} → Factory ${input.factoryId} | ${input.isHelpful ? '👍 Helpful' : '👎 Not helpful'}`);

        return { success: true, feedbackId: result.id, message: '感谢您的反馈！' };
      }),

    // P1-2: 获取工厂 AI 推荐反馈统计
    getAIRecommendationFeedbackStats: publicProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        return await getAIRecommendationFeedbackStats(input.factoryId);
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
  // ── 询盘、RFQ 和会议预约的真实业务流程 ──────────────────────────────────────────
  inquiry: router({
    send: protectedProcedure
      .input(z.object({
        factoryId: z.number(),
        demandId: z.number(),
        matchResultId: z.number().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { createHandshakeRequest } = await import('./_core/handshakeService');
          const result = await createHandshakeRequest({
            demandId: input.demandId,
            factoryId: input.factoryId,
            buyerId: ctx.user.id,
            matchResultId: input.matchResultId,
            buyerMessage: input.message,
          });
          return { success: result.success, handshakeId: result.handshakeId };
        } catch (error) {
          console.error('Failed to send inquiry:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '发送询盘失败' });
        }
      }),
  }),
  rfq: router({
    send: protectedProcedure
      .input(z.object({
        factoryId: z.number(),
        demandId: z.number(),
        matchResultId: z.number(),
        quantity: z.number().optional(),
        destination: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const { sendRFQ } = await import('./_core/rfqService');
          const result = await sendRFQ({
            demandId: input.demandId,
            factoryId: input.factoryId,
            matchResultId: input.matchResultId,
            buyerId: ctx.user.id,
            quantity: input.quantity,
            destination: input.destination,
            notes: input.notes,
          });
          return { success: result.success, inquiryId: result.inquiryId };
        } catch (error) {
          console.error('Failed to send RFQ:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '发送 RFQ 失败' });
        }
      }),
  }),

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

    // P0.2: 会议结束后将录制 URL 写入数据库
    updateRecording: protectedProcedure
      .input(z.object({
        id: z.number(),
        recordingUrl: z.string().optional(),
        recordingThumbnail: z.string().optional(),
        durationMinutes: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const meeting = await getMeetingById(input.id);
        if (!meeting) throw new TRPCError({ code: "NOT_FOUND", message: "会议不存在" });
        // 只允许会议参与者更新录制信息
        if (meeting.buyerId !== ctx.user.id && meeting.factoryUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权操作" });
        }
        const updateData: any = {};
        if (input.recordingUrl) updateData.recordingUrl = input.recordingUrl;
        if (input.recordingThumbnail) updateData.recordingThumbnail = input.recordingThumbnail;
        if (input.durationMinutes) updateData.durationMinutes = input.durationMinutes;
        if (Object.keys(updateData).length > 0) {
          await updateMeeting(input.id, updateData);
        }
        return { success: true };
      }),
  }),
  // ── Meeting Reels (预制视频缩略图识别) ─────────────────────────────────────────
  meetingReels: router({
    /**
     * 获取当前买家的所有会议录像，并自动解析缩略图：
     * - thumbnailSource === 'stored'     → resolvedThumbnail 直接可用
     * - thumbnailSource === 'first_frame' → videoUrlForFrame 供前端 <video> 提取第一帧
     * - thumbnailSource === 'none'        → 无视频，显示占位符
     */
    listWithThumbnail: protectedProcedure.query(async ({ ctx }) => {
      return await getMeetingReelsWithThumbnail(ctx.user.id);
    }),

    /**
     * 将前端提取到的第一帧 dataURL 作为 recordingThumbnail 持久化到数据库，
     * 避免下次重复提取帧。
     */
    saveThumbnail: protectedProcedure
      .input(z.object({
        meetingId: z.number(),
        thumbnailDataUrl: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const meeting = await getMeetingById(input.meetingId);
        if (!meeting) throw new TRPCError({ code: "NOT_FOUND", message: "会议不存在" });
        if (meeting.buyerId !== ctx.user.id && meeting.factoryUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权操作" });
        }
        await updateMeeting(input.meetingId, {
          recordingThumbnail: input.thumbnailDataUrl,
        });
        return { success: true };
      }),
    /**
     * 获取指定会议的转录文本（格式化为 [HH:MM:SS] 说话人: 内容）
     * 供前端 AI 分析高光片段使用
     */
    getTranscriptText: protectedProcedure
      .input(z.object({ meetingId: z.number() }))
      .query(async ({ input, ctx }) => {
        const meeting = await getMeetingById(input.meetingId);
        if (!meeting) throw new TRPCError({ code: "NOT_FOUND", message: "会议不存在" });
        if (meeting.buyerId !== ctx.user.id && meeting.factoryUserId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权操作" });
        }
        const transcripts = await getMeetingTranscripts(input.meetingId);
        if (transcripts.length === 0) return { text: null, count: 0 };
        // 格式化为 [HH:MM:SS] 说话人: 内容
        const text = transcripts
          .map(t => {
            const ts = t.timestamp ? `[${t.timestamp}]` : "";
            const speaker = t.speakerName ? `${t.speakerName}: ` : "";
            return `${ts} ${speaker}${t.content}`.trim();
          })
          .join("\n\n");
        return { text, count: transcripts.length };
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

      // ── 消息子路由（支持买家和工厂双向通信）────────────────────────────
    messages: protectedProcedure
      .input(z.object({ inquiryId: z.number() }))
      .query(async ({ input, ctx }) => {
        const inquiry = await getInquiryById(input.inquiryId);
        if (!inquiry) throw new TRPCError({ code: "NOT_FOUND", message: "询价不存在" });
        // 权限检查：买家或该工厂的工厂用户均可查看
        const factory = await getFactoryById(inquiry.factoryId);
        const isFactoryUser = factory?.userId === ctx.user.id;
        if (inquiry.buyerId !== ctx.user.id && !isFactoryUser) {
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
        const inquiry = await getInquiryById(input.inquiryId);
        if (!inquiry) throw new TRPCError({ code: "NOT_FOUND", message: "询价不存在" });
        // 权限检查：买家或该工厂的工厂用户均可发送
        const factory = await getFactoryById(inquiry.factoryId);
        const isFactoryUser = factory?.userId === ctx.user.id;
        if (inquiry.buyerId !== ctx.user.id && !isFactoryUser) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权发送此询价消息" });
        }
        const senderRole: 'buyer' | 'factory' = isFactoryUser ? 'factory' : 'buyer';
        const msg = await createInquiryMessage({
          inquiryId: input.inquiryId,
          senderId: ctx.user.id,
          senderRole,
          content: input.content,
        });
        // 如果是工厂回复，自动更新询价状态为 replied
        if (isFactoryUser && inquiry.status === 'pending') {
          await updateInquiry(input.inquiryId, { status: 'replied', repliedAt: new Date() });
        }
        return msg;
      }),

    // RTM Token 获取接口：为指定询价生成 RTM 鉴权 Token
    getRtmToken: protectedProcedure
      .input(z.object({ inquiryId: z.number() }))
      .query(async ({ input, ctx }) => {
        const inquiry = await getInquiryById(input.inquiryId);
        if (!inquiry) throw new TRPCError({ code: "NOT_FOUND", message: "询价不存在" });
        const factory = await getFactoryById(inquiry.factoryId);
        const isFactoryUser = factory?.userId === ctx.user.id;
        if (inquiry.buyerId !== ctx.user.id && !isFactoryUser) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权访问此询价频道" });
        }
        const channelName = `inquiry_${input.inquiryId}`;
        const uid = ctx.user.id.toString();
        try {
          const rtmToken = agoraTokenService.generateRtmToken(uid);
          return {
            rtmToken,
            appId: agoraTokenService.getAppId(),
            channelName,
            uid,
            role: isFactoryUser ? 'factory' : 'buyer',
          };
        } catch (e) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate RTM token' });
        }
      }),

    // 标记已读接口
    markRead: protectedProcedure
      .input(z.object({ inquiryId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const inquiry = await getInquiryById(input.inquiryId);
        if (!inquiry) throw new TRPCError({ code: "NOT_FOUND", message: "询价不存在" });
        const factory = await getFactoryById(inquiry.factoryId);
        const isFactoryUser = factory?.userId === ctx.user.id;
        if (inquiry.buyerId !== ctx.user.id && !isFactoryUser) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权操作" });
        }
        const readerRole: 'buyer' | 'factory' = isFactoryUser ? 'factory' : 'buyer';
        return await markInquiryMessagesRead(input.inquiryId, readerRole);
      }),

    // 获取未读消息数
    unreadCount: protectedProcedure
      .input(z.object({ inquiryId: z.number() }))
      .query(async ({ input, ctx }) => {
        const inquiry = await getInquiryById(input.inquiryId);
        if (!inquiry) throw new TRPCError({ code: "NOT_FOUND", message: "询价不存在" });
        const factory = await getFactoryById(inquiry.factoryId);
        const isFactoryUser = factory?.userId === ctx.user.id;
        if (inquiry.buyerId !== ctx.user.id && !isFactoryUser) {
          throw new TRPCError({ code: "FORBIDDEN", message: "无权操作" });
        }
        const readerRole: 'buyer' | 'factory' = isFactoryUser ? 'factory' : 'buyer';
        return { count: await getUnreadInquiryMessageCount(input.inquiryId, readerRole) };
      }),

    // 工厂端获取询价列表（附带未读数）
    factoryInquiries: protectedProcedure.query(async ({ ctx }) => {
      const factory = await getFactoryByUserId(ctx.user.id);
      if (!factory) throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
      const inquiries = await getInquiriesByFactoryId(factory.id);
      const enriched = await Promise.all(inquiries.map(async (inq) => {
        const product = inq.productId ? await getProductById(inq.productId) : null;
        const buyer = await getUserById(inq.buyerId);
        const unreadCount = await getUnreadInquiryMessageCount(inq.id, 'factory');
        return {
          ...inq,
          product: product ? { id: product.id, name: product.name } : null,
          buyer: buyer ? { id: buyer.id, name: buyer.name, avatar: buyer.avatar, email: buyer.email } : null,
          unreadCount,
        };
      }));
      return enriched;
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
      const result = await completeUserOnboarding(ctx.user.id);
      // 工厂入驻完成后，自动触发首次 Embedding 生成
      // 这是工厂进入匹配池的关键步骤
      try {
        const factory = await getFactoryByUserId(ctx.user.id);
        if (factory) {
          const { enqueueFactoryEmbedding } = await import('./_core/queue');
          await enqueueFactoryEmbedding({ factoryId: factory.id, reason: 'onboarding' });
        }
      } catch {
        // Redis 不可用时同步生成
        try {
          const factory = await getFactoryByUserId(ctx.user.id);
          if (factory) {
            const { updateFactoryCapabilityEmbedding } = await import('./_core/factoryMatchingService');
            updateFactoryCapabilityEmbedding(factory.id).catch(() => {});
          }
        } catch {}
      }
      return result;
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
        clips: z.array(z.object({
          startTime: z.number(),
          endTime: z.number(),
          title: z.string().optional(),
          importance: z.enum(["high", "medium", "low"]).optional(),
        })).optional(),
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
    // 精进点3：零摩擦意向锁单——将抢单意向存入数据库
    claimSlot: protectedProcedure
      .input(z.object({
        webinarId: z.number(),
        productId: z.number().optional(),
        productName: z.string(),
        quantity: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserById(ctx.user.id);
        const lead = await createWebinarLead({
          webinarId: input.webinarId,
          userId: ctx.user.id,
          productId: input.productId,
          productName: input.productName,
          quantity: input.quantity,
          buyerName: user?.name || undefined,
          buyerEmail: user?.email || undefined,
          status: "new",
          source: "webinar_live",
        });
        return { success: true, leadId: lead.id };
      }),
    // 获取某个 webinar 的所有线索（主播专用）
    getLeads: protectedProcedure
      .input(z.object({ webinarId: z.number() }))
      .query(async ({ input, ctx }) => {
        const webinar = await getWebinarById(input.webinarId);
        if (!webinar) throw new TRPCError({ code: "NOT_FOUND", message: "Webinar 不存在" });
        if (webinar.hostId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "只有主播可以查看线索" });
        }
        return await getWebinarLeadsByWebinarId(input.webinarId);
      }),
    // 获取主播所有 webinar 的线索（工厂仪表盘专用）
    myLeads: protectedProcedure.query(async ({ ctx }) => {
      return await getWebinarLeadsByHostId(ctx.user.id);
    }),
    // 更新线索状态（管家操作）
    updateLeadStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "qualified", "converted", "lost"]),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await updateWebinarLeadStatus(input.id, input.status, input.notes);
      }),
  }),
  // ── Notificationss ─────────────────────────────────────────────────────────────
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
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteNotification(input.id);
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

  // ── Sample Orders ─────────────────────────────────────────────────────────────
  sampleOrders: router({
    mySampleOrders: protectedProcedure.query(async ({ ctx }) => {
      const orders = await getSampleOrdersByBuyer(ctx.user.id);
      const enriched = await Promise.all(orders.map(async (o) => {
        const factory = await getFactoryById(o.factoryId);
        const product = await getProductById(o.productId);
        return { ...o, factory: factory ? { id: factory.id, name: factory.name, logo: factory.logo } : null, product: product ? { id: product.id, name: product.name, images: product.images } : null };
      }));
      return enriched;
    }),
    factorySampleOrders: protectedProcedure.query(async ({ ctx }) => {
      const factory = await getFactoryByUserId(ctx.user.id);
      if (!factory) throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
      const orders = await getSampleOrdersByFactory(factory.id);
      const enriched = await Promise.all(orders.map(async (o) => {
        const buyer = await getUserById(o.buyerId);
        const product = await getProductById(o.productId);
        return { ...o, buyer: buyer ? { id: buyer.id, name: buyer.name, avatar: buyer.avatar } : null, product: product ? { id: product.id, name: product.name, images: product.images } : null };
      }));
      return enriched;
    }),
    byId: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const order = await getSampleOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "订单不存在" });
        if (order.buyerId !== ctx.user.id) {
          const factory = await getFactoryByUserId(ctx.user.id);
          if (!factory || factory.id !== order.factoryId) throw new TRPCError({ code: "FORBIDDEN", message: "无权访问" });
        }
        const factory = await getFactoryById(order.factoryId);
        const product = await getProductById(order.productId);
        const buyer = await getUserById(order.buyerId);
        return { ...order, factory, product, buyer };
      }),
    create: protectedProcedure
      .input(z.object({
        factoryId: z.number(),
        productId: z.number(),
        quantity: z.number().min(1),
        unitPrice: z.string().optional(),
        currency: z.string().optional(),
        shippingName: z.string().optional(),
        shippingAddress: z.string().optional(),
        shippingCountry: z.string().optional(),
        shippingPhone: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const unitPrice = input.unitPrice ? parseFloat(input.unitPrice) : undefined;
        const totalAmount = unitPrice ? unitPrice * input.quantity : undefined;
        await createSampleOrder({
          ...input,
          buyerId: ctx.user.id,
          unitPrice: unitPrice?.toString(),
          totalAmount: totalAmount?.toString(),
        });
        return { success: true };
      }),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "confirmed", "shipped", "delivered", "completed", "cancelled"]),
        trackingNumber: z.string().optional(),
        carrier: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // 更新订单状态
        await updateSampleOrder(input.id, {
          status: input.status,
          trackingNumber: input.trackingNumber,
        });

        // 获取订单信息，发送通知给买家
        try {
          const order = await getSampleOrderById(input.id);
          if (order) {
            const notifMap: Record<string, { title: string; content: string }> = {
              confirmed: {
                title: '样品订单已确认',
                content: `工厂已确认您的样品订单 #${input.id}，正在准备发货`,
              },
              shipped: {
                title: '样品已发货',
                content: input.trackingNumber
                  ? `您的样品已发货！运单号: ${input.trackingNumber}`
                  : `您的样品订单 #${input.id} 已发货`,
              },
              delivered: {
                title: '样品已完成',
                content: `样品订单 #${input.id} 已标记完成，感谢您的支持`,
              },
              cancelled: {
                title: '样品订单已取消',
                content: `样品订单 #${input.id} 已被取消`,
              },
            };
            const notif = notifMap[input.status];
            if (notif) {
              await createNotification({
                userId: order.buyerId,
                type: 'sample_order',
                title: notif.title,
                content: notif.content,
                link: `/sample-orders`,
              });
            }
          }
        } catch (notifError) {
          // 通知失败不影响主流程
          console.warn('⚠️ Failed to send sample order notification:', notifError);
        }

        return { success: true };
      }),
  }),

  // ── Factory Dashboard (工厂管理) ───────────────────────────────────────────────
  factoryDashboard: router({
    myFactory: protectedProcedure.query(async ({ ctx }) => {
      const factory = await getFactoryByUserId(ctx.user.id);
      if (!factory) return null;
      const details = await getFactoryDetails(factory.id);
      const products = await getProductsByFactoryId(factory.id);
      const certifications = await getFactoryCertifications(factory.id);
      const availability = await getMeetingAvailability(factory.id);
      const meetings = await getMeetingsByFactoryId(factory.id);
      const inquiries = await getInquiriesByFactoryId(factory.id);
      const webinars = await getWebinarsByHostId(ctx.user.id);
      return { ...factory, details, products, certifications, availability, meetings, inquiries, webinars };
    }),
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        logo: z.string().optional(),
        category: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        // details
        established: z.number().optional(),
        employeeCount: z.string().optional(),
        annualRevenue: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        website: z.string().optional(),
        coverImage: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const factory = await getFactoryByUserId(ctx.user.id);
        if (!factory) throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
        const { established, employeeCount, annualRevenue, phone, email, website, coverImage, ...factoryData } = input;
        if (Object.keys(factoryData).length > 0) await updateFactoryProfile(factory.id, factoryData);
        const detailsData = { established, employeeCount, annualRevenue, phone, email, website, coverImage };
        const hasDetails = Object.values(detailsData).some(v => v !== undefined);
        if (hasDetails) await upsertFactoryDetails(factory.id, detailsData);
        // 工厂资料更新后，异步重新生成能力向量（不阻塞当前请求）
        try {
          const { enqueueFactoryEmbedding } = await import('./_core/queue');
          await enqueueFactoryEmbedding({ factoryId: factory.id, reason: 'profile_update' });
        } catch {
          // Redis 不可用时同步生成（开发环境建容）
          const { updateFactoryCapabilityEmbedding } = await import('./_core/factoryMatchingService');
          updateFactoryCapabilityEmbedding(factory.id).catch(() => {});
        }
        return { success: true };
      }),
    addCertification: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        issuer: z.string().optional(),
        issuedAt: z.string().optional(),
        expiresAt: z.string().optional(),
        fileUrl: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const factory = await getFactoryByUserId(ctx.user.id);
        if (!factory) throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
        await createFactoryCertification({ ...input, factoryId: factory.id });
        return { success: true };
      }),
    deleteCertification: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const factory = await getFactoryByUserId(ctx.user.id);
        if (!factory) throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
        await deleteFactoryCertification(input.id, factory.id);
        return { success: true };
      }),
    setAvailability: protectedProcedure
      .input(z.object({
        slots: z.array(z.object({
          dayOfWeek: z.number().min(0).max(6).optional(),
          startTime: z.string(),
          endTime: z.string(),
          timezone: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const factory = await getFactoryByUserId(ctx.user.id);
        if (!factory) throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
        await upsertMeetingAvailability(factory.id, input.slots);
        return { success: true };
      }),
    createProduct: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        category: z.string().optional(),
        description: z.string().optional(),
        images: z.array(z.string()).optional(),
        priceMin: z.string().optional(),
        priceMax: z.string().optional(),
        moq: z.number().optional(),
        currency: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const factory = await getFactoryByUserId(ctx.user.id);
        if (!factory) throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
        const { priceMin, priceMax, moq, currency, ...productData } = input;
        const result = await createProduct({ ...productData, factoryId: factory.id, images: input.images ? JSON.stringify(input.images) : null, status: "active" });
        const insertResult = result as unknown as { insertId?: number };
        if (insertResult.insertId && (priceMin || priceMax || moq)) {
          await upsertProductDetails(insertResult.insertId, { priceMin, priceMax, moq, currency });
        }
        return { success: true };
      }),
    updateProduct: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        category: z.string().optional(),
        description: z.string().optional(),
        images: z.array(z.string()).optional(),
        priceMin: z.string().optional(),
        priceMax: z.string().optional(),
        moq: z.number().optional(),
        currency: z.string().optional(),
        status: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const factory = await getFactoryByUserId(ctx.user.id);
        if (!factory) throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
        const { id, priceMin, priceMax, moq, currency, ...productData } = input;
        if (Object.keys(productData).length > 0) {
          const updateData: Record<string, unknown> = { ...productData };
          if (productData.images) updateData.images = JSON.stringify(productData.images);
          await updateProduct(id, factory.id, updateData);
        }
        if (priceMin !== undefined || priceMax !== undefined || moq !== undefined) {
          await upsertProductDetails(id, { priceMin, priceMax, moq, currency });
        }
        return { success: true };
      }),
    deleteProduct: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const factory = await getFactoryByUserId(ctx.user.id);
        if (!factory) throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
        await deleteProduct(input.id, factory.id);
        return { success: true };
      }),
    createWebinar: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        coverImage: z.string().optional(),
        scheduledAt: z.string(),
        duration: z.number().min(15).default(60),
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
    myWebinars: protectedProcedure.query(async ({ ctx }) => {
      return await getWebinarsByHostId(ctx.user.id);
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      const factory = await getFactoryByUserId(ctx.user.id);
      if (!factory) return { inquiries: 0, meetings: 0, products: 0, webinars: 0, sampleOrders: 0 };
      const [inquiries, meetings, products, webinars, sampleOrders] = await Promise.all([
        getInquiriesByFactoryId(factory.id),
        getMeetingsByFactoryId(factory.id),
        getProductsByFactoryId(factory.id),
        getWebinarsByHostId(ctx.user.id),
        getSampleOrdersByFactory(factory.id),
      ]);
      return {
        inquiries: inquiries.length,
        meetings: meetings.length,
        products: products.length,
        webinars: webinars.length,
        sampleOrders: sampleOrders.length,
        pendingInquiries: inquiries.filter(i => i.status === 'pending').length,
        upcomingMeetings: meetings.filter(m => m.status === 'scheduled').length,
      };
    }),
    /** 获取工厂 Agent 配置（飞书 Bitable 授权、ERP Key 等） */
    getAgentConfig: protectedProcedure
      .query(async ({ ctx }) => {
        const factory = await getFactoryByUserId(ctx.user.id);
        if (!factory) return null;
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await dbPromise;
        const agent = await db.query.clawAgentStatus.findFirst({
          where: eq(schema.clawAgentStatus.factoryId, factory.id),
        });
        return {
          factoryId: factory.id,
          agentId: agent?.agentId ?? null,
          agentStatus: agent?.status ?? 'offline',
          agentVersion: agent?.version ?? null,
          deployEnv: agent?.deployEnv ?? 'aliyun_wuying',
          capabilities: (agent?.capabilities as any[]) ?? [],
          lastHeartbeatAt: agent?.lastHeartbeatAt ?? null,
          activeJobs: agent?.activeJobs ?? 0,
          totalJobsProcessed: agent?.totalJobsProcessed ?? 0,
          totalJobsFailed: agent?.totalJobsFailed ?? 0,
          isEnabled: agent?.isEnabled ?? 1,
        };
      }),
    /** 启用/禁用工厂 Agent */
    toggleAgent: protectedProcedure
      .input(z.object({ isEnabled: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const factory = await getFactoryByUserId(ctx.user.id);
        if (!factory) throw new TRPCError({ code: 'NOT_FOUND', message: '工厂不存在' });
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await dbPromise;
        await db.update(schema.clawAgentStatus)
          .set({ isEnabled: input.isEnabled ? 1 : 0, updatedAt: new Date() })
          .where(eq(schema.clawAgentStatus.factoryId, factory.id));
        return { success: true, isEnabled: input.isEnabled };
      }),
    /** 获取工厂 Agent 的任务历史（最近 20 条） */
    getAgentTaskHistory: protectedProcedure
      .query(async ({ ctx }) => {
        const factory = await getFactoryByUserId(ctx.user.id);
        if (!factory) return [];
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        const db = await dbPromise;
        const jobs = await db.query.rfqClawJobs.findMany({
          where: eq(schema.rfqClawJobs.factoryId, factory.id),
          orderBy: [desc(schema.rfqClawJobs.enqueuedAt)],
          limit: 20,
        });
        return jobs;
      }),
  }),

  // ── Meeting Booking (买家自助预约) ─────────────────────────────────────────────
  meetingBooking: router({
    factoryAvailability: publicProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        return await getMeetingAvailability(input.factoryId);
      }),
    book: protectedProcedure
      .input(z.object({
        factoryId: z.number(),
        title: z.string().min(1),
        scheduledAt: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const factory = await getFactoryById(input.factoryId);
        if (!factory) throw new TRPCError({ code: "NOT_FOUND", message: "工厂不存在" });
        await createMeeting({
          title: input.title,
          buyerId: ctx.user.id,
          factoryId: input.factoryId,
          factoryUserId: factory.userId,
          scheduledAt: new Date(input.scheduledAt),
          status: "scheduled",
          notes: input.notes,
        });
        // 发送通知给工厂
        await createNotification({
          userId: factory.userId,
          type: "meeting_request",
          title: "新的会议预约请求",
          content: `买家 ${ctx.user.name || ctx.user.email} 请求预约选品会议：${input.title}`,
          link: `/factory-dashboard`,
        });
        return { success: true };
      }),
  }),

  // ── Phase 3: Agentic AI Sourcing Demands ─────────────────────────────────────
  demands: router({

    /**
     * 核心工作流：提交内容 → 摄取 → 提取 → 转化 → 存储
     * 支持 URL / 视频 / PDF / 纯文本
     */
    submitAndProcess: protectedProcedure
      .input(z.object({
        sourceType: z.enum(['url', 'video', 'pdf', 'text']),
        sourceUri: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        // Step 1: 创建需求记录（状态: processing）
        const { id: demandId } = await createSourcingDemand({
          userId: ctx.user.id,
          sourceType: input.sourceType,
          sourceUri: input.sourceUri,
          status: 'processing',
        });

        console.log(`🚀 [Demands] Processing demand #${demandId} | Type: ${input.sourceType} | User: ${ctx.user.id}`);

        try {
          // Step 2: 内容摄取
          const ingested = await ingestContent(input.sourceType, input.sourceUri);
          if (isIngestionError(ingested)) {
            await updateSourcingDemand(demandId, { status: 'failed', processingError: ingested.error });
            throw new TRPCError({ code: 'BAD_REQUEST', message: `内容摄取失败: ${ingested.error}` });
          }

          // Step 3: 信息提取 → SourcingDemand
          const extracted = await extractSourcingDemand(ingested);
          if (isExtractionError(extracted)) {
            await updateSourcingDemand(demandId, { status: 'failed', processingError: extracted.error });
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `信息提取失败: ${extracted.error}` });
          }

          // Step 4: 转存视觉参考图片到 OSS
          const ossImageUrls: string[] = [];
          for (const imgUrl of extracted.visualReferences.slice(0, 5)) {
            if (imgUrl.startsWith('http')) {
              const ossResult = await ossUploadFromUrl(imgUrl, 'references');
              if (!('error' in ossResult)) ossImageUrls.push(ossResult.url);
            }
          }

          // Step 5: 更新需求记录（状态: extracted）
          await updateSourcingDemand(demandId, {
            status: 'extracted',
            productName: extracted.productName,
            productDescription: extracted.productDescription,
            keyFeatures: extracted.keyFeatures,
            targetAudience: extracted.targetAudience,
            visualReferences: ossImageUrls.length > 0 ? ossImageUrls : extracted.visualReferences,
            estimatedQuantity: extracted.estimatedQuantity,
            targetPrice: extracted.targetPrice,
            customizationNotes: extracted.customizationNotes,
            extractedData: extracted.extractedData,
          });

          // Step 6: 转化为工厂生产参数
          const params = await transformToManufacturingParams(extracted);
          if (isTransformationError(params)) {
            await updateSourcingDemand(demandId, { status: 'failed', processingError: params.error });
            throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `参数转化失败: ${params.error}` });
          }

          // Step 7: 存储生产参数
          await upsertManufacturingParameters(demandId, {
            moq: params.moq ?? undefined,
            materials: params.materials,
            dimensions: params.dimensions,
            weight: params.weight,
            colorRequirements: params.colorRequirements,
            packagingRequirements: params.packagingRequirements,
            certificationsRequired: params.certificationsRequired,
            estimatedUnitCost: params.estimatedUnitCost ? String(params.estimatedUnitCost) : undefined,
            toolingCost: params.toolingCost ? String(params.toolingCost) : undefined,
            leadTimeDays: params.leadTimeDays ?? undefined,
            productionCategory: params.productionCategory,
            suggestedFactoryTypes: params.suggestedFactoryTypes,
          });

          // Step 8: 更新需求状态为 transformed
          await updateSourcingDemand(demandId, { status: 'transformed' });

          // Step 9: 异步生成语义向量（不阻塞响应）
          setImmediate(async () => {
            try {
              const embText = buildEmbeddingText({
                productName: extracted.productName,
                productDescription: extracted.productDescription,
                keyFeatures: extracted.keyFeatures,
                productionCategory: String(extracted.extractedData?.productCategory ?? ''),
                customizationNotes: extracted.customizationNotes,
                estimatedQuantity: extracted.estimatedQuantity,
                targetPrice: extracted.targetPrice,
              });
              const embResult = await generateEmbedding(embText);
              if (!isEmbeddingError(embResult)) {
                await updateSourcingDemand(demandId, {
                  embeddingVector: JSON.stringify(embResult.vector) as unknown as never,
                  embeddingModel: embResult.model as unknown as never,
                  embeddingAt: new Date() as unknown as never,
                });
                console.log(`🧠 [Demands] Embedding generated for #${demandId} (${embResult.model}, ${embResult.vector.length}d)`);
              }
            } catch (embErr) {
              console.warn(`⚠️ [Demands] Background embedding failed for #${demandId}:`, embErr);
            }
          });

          console.log(`✅ [Demands] Demand #${demandId} fully processed: "${extracted.productName}"`);

          return {
            demandId,
            status: 'transformed',
            productName: extracted.productName,
            moq: params.moq,
            estimatedUnitCost: params.estimatedUnitCost,
            leadTimeDays: params.leadTimeDays,
            productionCategory: params.productionCategory,
          };
        } catch (err) {
          if (err instanceof TRPCError) throw err;
          await updateSourcingDemand(demandId, { status: 'failed', processingError: String(err) });
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: '需求处理失败，请稍后重试' });
        }
      }),

    /** 发布需求到公开需求池（供供应商 AI 发现） */
    publish: protectedProcedure
      .input(z.object({ demandId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const demand = await getSourcingDemandById(input.demandId);
        if (!demand) throw new TRPCError({ code: 'NOT_FOUND', message: '需求不存在' });
        if (demand.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: '无权操作' });
        if (demand.status !== 'transformed') throw new TRPCError({ code: 'BAD_REQUEST', message: '需求尚未完成处理，无法发布' });
        await updateSourcingDemand(input.demandId, { status: 'published', isPublished: 1 });
        console.log(`📢 [Demands] Demand #${input.demandId} published by user ${ctx.user.id}`);
        return { success: true, demandId: input.demandId };
      }),

    /** 获取当前用户的所有需求 */
    myDemands: protectedProcedure
      .query(async ({ ctx }) => {
        return getSourcingDemandsByUser(ctx.user.id);
      }),

    /** 获取需求详情（含生产参数） */
    getById: protectedProcedure
      .input(z.object({ demandId: z.number() }))
      .query(async ({ input, ctx }) => {
        const result = await getDemandWithParameters(input.demandId);
        if (!result) throw new TRPCError({ code: 'NOT_FOUND', message: '需求不存在' });
        if (result.demand.userId !== ctx.user.id && !result.demand.isPublished) {
          throw new TRPCError({ code: 'FORBIDDEN', message: '无权查看此需求' });
        }
        return result;
      }),

    /** 触发工厂匹配（4.0 核心功能）
     * 异步入队模式：立即返回 jobId，前端通过 getMatchStatus 轮询进度
     * Redis 不可用时降级为同步模式（兼容开发环境）
     */
    triggerMatch: protectedProcedure
      .input(z.object({ demandId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const jobData = {
          demandId: input.demandId,
          userId: ctx.user.id,
          triggeredAt: new Date().toISOString(),
        };
        try {
          const { enqueueFactoryMatching, enqueueMatchExpiry } = await import('./_core/queue');
          const result = await enqueueFactoryMatching(jobData);
          // 同时入队 15 分钟过期任务（重新触发时会刷新计时器）
          await enqueueMatchExpiry(jobData).catch(err =>
            console.warn('[triggerMatch] enqueueMatchExpiry failed (non-critical):', err.message)
          );
          return { mode: 'async', jobId: result.jobId, status: result.status };
        } catch {
          // Redis 不可用，降级为同步模式
          const { matchFactoriesForDemand } = await import('./_core/factoryMatchingService');
          const results = await matchFactoriesForDemand(input.demandId);
          return { mode: 'sync', jobId: null, count: results.length, status: 'completed' };
        }
      }),

    /** 查询匹配任务状态（前端轮询用） */
    getMatchStatus: protectedProcedure
      .input(z.object({ demandId: z.number() }))
      .query(async ({ input }) => {
        try {
          const { getMatchingJobStatus } = await import('./_core/queue');
          return await getMatchingJobStatus(input.demandId);
        } catch {
          return { status: 'redis_unavailable' };
        }
      }),

    /** 获取匹配结果（4.0 核心功能） */
    getMatchResults: protectedProcedure
      .input(z.object({ demandId: z.number() }))
      .query(async ({ input }) => {
        const { dbPromise: _dbPromise } = await import('./db');
        const database = await _dbPromise;
        const schemaModule = await import('../drizzle/schema');
        const { eq, desc, leftJoin } = await import('drizzle-orm');
        const rows = await database.select({
          // Match result fields
          id:         schemaModule.demandMatchResults.id,
          matchScore: schemaModule.demandMatchResults.matchScore,
          matchReason: schemaModule.demandMatchResults.matchReason,
          factoryId:  schemaModule.demandMatchResults.factoryId,
          // Factory core fields
          factoryName:               schemaModule.factories.name,
          factoryLogo:               schemaModule.factories.logo,
          factoryCategory:           schemaModule.factories.category,
          factoryCountry:            schemaModule.factories.country,
          factoryCity:               schemaModule.factories.city,
          isOnline:                  schemaModule.factories.isOnline,
          averageResponseTime:       schemaModule.factories.averageResponseTime,
          certificationStatus:       schemaModule.factories.certificationStatus,
          responseRate:              schemaModule.factories.responseRate,
          overallScore:              schemaModule.factories.overallScore,
          hasReel:                   schemaModule.factories.hasReel,
          languagesSpoken:           schemaModule.factories.languagesSpoken,
          // Factory details (LEFT JOIN)
          certifications:            schemaModule.factoryDetails.certifications,
          productionCapacity:        schemaModule.factoryDetails.productionCapacity,
          employeeCount:             schemaModule.factoryDetails.employeeCount,
          coverImage:                schemaModule.factoryDetails.coverImage,
          detailRating:              schemaModule.factoryDetails.rating,
          reviewCount:               schemaModule.factoryDetails.reviewCount,
          // Factory verifications (LEFT JOIN)
          aiVerificationScore:       schemaModule.factoryVerifications.aiVerificationScore,
          complianceScore:           schemaModule.factoryVerifications.complianceScore,
          trustBadges:               schemaModule.factoryVerifications.trustBadges,
          // Factory metrics (LEFT JOIN)
          totalOrders:               schemaModule.factoryMetrics.totalOrders,
          disputeRate:               schemaModule.factoryMetrics.disputeRate,
          sampleConversionRate:      schemaModule.factoryMetrics.sampleConversionRate,
          reelCount:                 schemaModule.factoryMetrics.reelCount,
        })
        .from(schemaModule.demandMatchResults)
        .innerJoin(schemaModule.factories, eq(schemaModule.demandMatchResults.factoryId, schemaModule.factories.id))
        .leftJoin(schemaModule.factoryDetails, eq(schemaModule.factories.id, schemaModule.factoryDetails.factoryId))
        .leftJoin(schemaModule.factoryVerifications, eq(schemaModule.factories.id, schemaModule.factoryVerifications.factoryId))
        .leftJoin(schemaModule.factoryMetrics, eq(schemaModule.factories.id, schemaModule.factoryMetrics.factoryId))
        .where(eq(schemaModule.demandMatchResults.demandId, input.demandId))
        .orderBy(desc(schemaModule.demandMatchResults.matchScore));

        return {
          matches: rows.map(r => {
            const matchScore = parseFloat(r.matchScore ?? '0');
            const aiScore    = r.aiVerificationScore ?? 0;
            const compliance = r.complianceScore ?? 0;
            const respRate   = parseFloat(r.responseRate?.toString() ?? '0');
            const avgResp    = r.averageResponseTime ?? 0;
            const totalOrd   = r.totalOrders ?? 0;
            const dispRate   = parseFloat(r.disputeRate?.toString() ?? '0');

            // ── AMR 四维计算 ──────────────────────────────────────────────
            // Acumen (市场洞察): AI验厂分 + 合规分 综合
            const amrAcumen = Math.round(
              (aiScore * 0.6 + compliance * 0.4)
            );
            // Channel (渠道能力): 响应率 + hasReel + 语言数
            const langCount = Array.isArray(r.languagesSpoken) ? (r.languagesSpoken as string[]).length : 1;
            const amrChannel = Math.min(100, Math.round(
              respRate * 0.5 + (r.hasReel ? 20 : 0) + Math.min(30, langCount * 10)
            ));
            // Velocity (响应速度): 平均响应时间反算（越快越高）
            const amrVelocity = avgResp === 0 ? 50 : Math.min(100, Math.round(
              Math.max(0, 100 - (avgResp / 60) * 20)
            ));
            // Global (全球化): 总订单数 + 样品转化率
            const sampleConv = parseFloat(r.sampleConversionRate?.toString() ?? '0');
            const amrGlobal = Math.min(100, Math.round(
              Math.min(50, totalOrd * 0.5) + sampleConv * 0.5
            ));
            // AMR 综合分 (加权平均)
            const amrScore = Math.round(
              amrAcumen * 0.25 + amrChannel * 0.25 + amrVelocity * 0.25 + amrGlobal * 0.25
            );

            // ── 结构化推荐理由 ────────────────────────────────────────────
            const structuredReasons: Array<{ icon: string; label: string; value: string; highlight: boolean }> = [];

            // 1. 品类匹配
            if (r.factoryCategory) {
              structuredReasons.push({
                icon: 'category',
                label: 'Category Match',
                value: r.factoryCategory,
                highlight: matchScore >= 85,
              });
            }
            // 2. 认证
            const certs = Array.isArray(r.certifications) ? r.certifications as string[] : [];
            if (certs.length > 0) {
              structuredReasons.push({
                icon: 'cert',
                label: 'Certifications',
                value: certs.slice(0, 3).join(' · '),
                highlight: certs.length >= 2,
              });
            }
            // 3. 响应速度
            if (avgResp > 0) {
              structuredReasons.push({
                icon: 'speed',
                label: 'Avg Response',
                value: avgResp < 60 ? `${avgResp} min` : `${Math.round(avgResp / 60)}h`,
                highlight: avgResp <= 15,
              });
            }
            // 4. 交付记录
            if (totalOrd > 0) {
              structuredReasons.push({
                icon: 'track',
                label: 'Track Record',
                value: `${totalOrd} orders · ${dispRate.toFixed(1)}% dispute`,
                highlight: totalOrd >= 50 && dispRate < 2,
              });
            }

            return {
              id: r.id,
              matchScore,
              matchReason: r.matchReason,
              matchReasons: r.matchReason
                ? r.matchReason.split('。').filter(Boolean).map((s: string) => s.trim())
                : [],
              structuredReasons,
              factoryId: r.factoryId,
              // AMR data
              amrScore,
              amrAcumen,
              amrChannel,
              amrVelocity,
              amrGlobal,
              factory: {
                id:                  r.factoryId,
                name:                r.factoryName,
                logoUrl:             r.factoryLogo,
                coverImage:          r.coverImage ?? undefined,
                category:            r.factoryCategory,
                country:             r.factoryCountry,
                city:                r.factoryCity,
                isOnline:            r.isOnline === 1,
                location:            [r.factoryCity, r.factoryCountry].filter(Boolean).join(', '),
                rating:              parseFloat(r.detailRating?.toString() ?? r.overallScore?.toString() ?? '0'),
                reviewCount:         r.reviewCount ?? 0,
                certificationStatus: r.certificationStatus,
                certifications:      certs,
                responseRate:        respRate,
                averageResponseTime: avgResp,
                aiVerificationScore: aiScore,
                complianceScore:     compliance,
                trustBadges:         Array.isArray(r.trustBadges) ? r.trustBadges as string[] : [],
                totalOrders:         totalOrd,
                disputeRate:         dispRate,
                hasReel:             r.hasReel === 1,
                languagesSpoken:     Array.isArray(r.languagesSpoken) ? r.languagesSpoken as string[] : [],
              },
            };
          }),
        };
      }),

    /**
     * 自然语言微调匹配权重（4.0 核心功能）
     * 用户输入自然语言指令 → LLM 解析 → 重新加权排序现有候选池
     * 不重新做向量搜索，只是重新加权，响应极快
     */
    refineMatch: protectedProcedure
      .input(z.object({
        demandId: z.number(),
        instruction: z.string().min(1).max(500),
        currentMatchIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { callAI } = await import('./_core/aiService');

        // Step 1: LLM 解析自然语言指令为结构化权重调整参数
        const parsePrompt = `You are a factory matching assistant. The user wants to refine their factory search results.

User instruction: "${input.instruction}"

Parse this instruction into a JSON object with these optional fields:
- certRequired: string[] (e.g. ["BSCI", "ISO9001"] - certifications that must be present)
- categoryBoost: string (e.g. "sportswear" - boost factories in this category)
- responseTimeMax: number (max average response time in minutes)
- boostOnline: boolean (prefer online factories)
- boostHighOrders: boolean (prefer factories with more orders)
- boostLowDispute: boolean (prefer factories with low dispute rate)
- minAiScore: number (0-100, minimum AI verification score)
- summary: string (brief English summary of what was adjusted, max 20 words)

Return ONLY valid JSON, no explanation.`;

        let refinements: any = {};
        let summary = 'Refining match based on your preferences...';

        try {
          const aiResponse = await callAI([
            { role: 'user', content: parsePrompt }
          ], { temperature: 0.1 });

          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            refinements = JSON.parse(jsonMatch[0]);
            summary = refinements.summary ?? summary;
          }
        } catch (err) {
          console.warn('[refineMatch] LLM parse failed, using defaults:', err);
        }

        // Step 2: 获取当前匹配结果
        const { dbPromise: _refineDbPromise } = await import('./db');
        const database = await _refineDbPromise;
        const { eq, desc } = await import('drizzle-orm');
        const schemaModule = await import('../drizzle/schema');
        const rows = await database.select({
          id:                  schemaModule.demandMatchResults.id,
          matchScore:          schemaModule.demandMatchResults.matchScore,
          factoryId:           schemaModule.demandMatchResults.factoryId,
          factoryName:         schemaModule.factories.name,
          factoryCategory:     schemaModule.factories.category,
          isOnline:            schemaModule.factories.isOnline,
          averageResponseTime: schemaModule.factories.averageResponseTime,
          certifications:      schemaModule.factoryDetails.certifications,
          aiVerificationScore: schemaModule.factoryVerifications.aiVerificationScore,
          totalOrders:         schemaModule.factoryMetrics.totalOrders,
          disputeRate:         schemaModule.factoryMetrics.disputeRate,
        })
        .from(schemaModule.demandMatchResults)
        .innerJoin(schemaModule.factories, eq(schemaModule.demandMatchResults.factoryId, schemaModule.factories.id))
        .leftJoin(schemaModule.factoryDetails, eq(schemaModule.factories.id, schemaModule.factoryDetails.factoryId))
        .leftJoin(schemaModule.factoryVerifications, eq(schemaModule.factories.id, schemaModule.factoryVerifications.factoryId))
        .leftJoin(schemaModule.factoryMetrics, eq(schemaModule.factories.id, schemaModule.factoryMetrics.factoryId))
        .where(eq(schemaModule.demandMatchResults.demandId, input.demandId))
        .orderBy(desc(schemaModule.demandMatchResults.matchScore));

        // Step 3: 重新加权排序
        const scored = rows.map(r => {
          let score = parseFloat(r.matchScore ?? '0');
          const certs = Array.isArray(r.certifications) ? r.certifications as string[] : [];

          // 认证过滤/加权
          if (refinements.certRequired?.length > 0) {
            const hasCerts = refinements.certRequired.every((c: string) =>
              certs.some((fc: string) => fc.toLowerCase().includes(c.toLowerCase()))
            );
            if (!hasCerts) score -= 30;
            else score += 10;
          }
          // 在线优先
          if (refinements.boostOnline && r.isOnline === 1) score += 8;
          // 响应速度过滤
          if (refinements.responseTimeMax && r.averageResponseTime) {
            if (r.averageResponseTime > refinements.responseTimeMax) score -= 15;
            else score += 5;
          }
          // 高订单量加权
          if (refinements.boostHighOrders && (r.totalOrders ?? 0) > 50) score += 8;
          // 低争议率加权
          if (refinements.boostLowDispute) {
            const dr = parseFloat(r.disputeRate?.toString() ?? '0');
            if (dr < 2) score += 8;
          }
          // AI验厂分过滤
          if (refinements.minAiScore && (r.aiVerificationScore ?? 0) < refinements.minAiScore) score -= 20;

          return { id: r.id, factoryId: r.factoryId, factoryName: r.factoryName, newScore: Math.max(0, Math.min(100, score)) };
        });

        // 按新分数排序
        scored.sort((a, b) => b.newScore - a.newScore);

        return {
          refinements,
          summary,
          rankedFactoryIds: scored.map(s => s.factoryId),
          scores: Object.fromEntries(scored.map(s => [s.factoryId, s.newScore])),
        };
      }),
    /**
     * 公开需求池：供应商 AI Agent 发现需求
     * 这是 AI 可发现性的核心接口
     */
    discoverPublished: publicProcedure
      .input(z.object({
        productCategory: z.string().optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input }) => {
        const demands = await getPublishedSourcingDemands({
          productCategory: input.productCategory,
          limit: input.limit,
          offset: input.offset,
        });
        // 返回脱敏的公开信息（不暴露用户 ID 等敏感字段）
        return demands.map(d => ({
          id: d.id,
          productName: d.productName,
          productDescription: d.productDescription,
          keyFeatures: d.keyFeatures,
          estimatedQuantity: d.estimatedQuantity,
          targetPrice: d.targetPrice,
          customizationNotes: d.customizationNotes,
          visualReferences: d.visualReferences,
          createdAt: d.createdAt,
        }));
      }),    /** OSS 健康检查 */
    ossHealth: publicProcedure
      .query(async () => {
        return await ossHealthCheck();
      }),

    // ── 以下路由原属于第二个 demands 路由器，已合并到此 ──

    /**
     * 为已转化的需求生成 SD 3.5 Turbo 产品渲染图
     * 异步任务：提交 → 轮询 → OSS 存储 → 更新 renderImageUrl
     */
    generateRender: protectedProcedure
      .input(z.object({ demandId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const result = await getDemandWithParameters(input.demandId);
        if (!result) throw new TRPCError({ code: 'NOT_FOUND', message: '需求不存在' });
        if (result.demand.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: '无权操作' });
        if (!result.params) throw new TRPCError({ code: 'BAD_REQUEST', message: '生产参数尚未生成，请先完成需求处理' });

        const renderInput = {
          productName: result.demand.productName ?? '',
          productDescription: result.demand.productDescription ?? '',
          materials: Array.isArray(result.params.materials) ? result.params.materials as Array<{ name: string; specification?: string }> : [],
          colorRequirements: Array.isArray(result.params.colorRequirements) ? result.params.colorRequirements as Array<{ name: string; hex?: string }> : [],
          dimensions: result.params.dimensions ?? '',
          productionCategory: result.params.productionCategory ?? '',
          customizationNotes: result.demand.customizationNotes ?? '',
        };

        console.log(`🎨 [Route] Generating render for demand #${input.demandId}`);
        const renderResult = await generateRenderImage(renderInput);

        if (isRenderImageError(renderResult)) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `渲染图生成失败: ${renderResult.error}`,
          });
        }

        // 更新 manufacturing_parameters.renderImageUrl
        await upsertManufacturingParameters(input.demandId, {
          renderImageUrl: renderResult.ossUrl,
        });

        return {
          renderImageUrl: renderResult.ossUrl,
          taskId: renderResult.taskId,
          prompt: renderResult.prompt,
        };
      }),

    /**
     * 为需求生成语义向量并存储
     * 在 submitAndProcess 完成后自动调用，也可手动触发
     */
    embedDemand: protectedProcedure
      .input(z.object({ demandId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const demand = await getSourcingDemandById(input.demandId);
        if (!demand) throw new TRPCError({ code: 'NOT_FOUND', message: '需求不存在' });
        if (demand.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: '无权操作' });

        const embeddingText = buildEmbeddingText({
          productName: demand.productName ?? '',
          productDescription: demand.productDescription,
          keyFeatures: demand.keyFeatures,
          productionCategory: (demand.extractedData as Record<string, unknown>)?.productCategory as string ?? null,
          customizationNotes: demand.customizationNotes,
          estimatedQuantity: demand.estimatedQuantity,
          targetPrice: demand.targetPrice,
        });

        const embResult = await generateEmbedding(embeddingText);
        if (isEmbeddingError(embResult)) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `向量生成失败: ${embResult.error}`,
          });
        }

        // 将向量存入数据库
        await updateSourcingDemand(input.demandId, {
          embeddingVector: JSON.stringify(embResult.vector) as unknown as never,
          embeddingModel: embResult.model as unknown as never,
          embeddingAt: new Date() as unknown as never,
        });

        return {
          success: true,
          model: embResult.model,
          dimensions: embResult.vector.length,
          tokenCount: embResult.tokenCount,
        };
      }),

    /**
     * 语义相似度搜索：供应商 AI Agent 发现匹配需求
     */
    semanticSearch: publicProcedure
      .input(z.object({
        query: z.string().min(5).max(1000),
        topK: z.number().min(1).max(20).default(10),
        minSimilarity: z.number().min(0).max(1).default(0.5),
      }))
      .query(async ({ input }) => {
        // Step 1: 生成查询向量
        const queryEmbedding = await generateEmbedding(input.query);
        if (isEmbeddingError(queryEmbedding)) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `查询向量生成失败: ${queryEmbedding.error}`,
          });
        }

        // Step 2: 获取所有已发布且有向量的需求
        const publishedDemands = await getPublishedSourcingDemands({ limit: 500 });
        const demandsWithVectors = publishedDemands.filter(
          (d: { embeddingVector?: unknown }) => d.embeddingVector != null
        );

        if (demandsWithVectors.length === 0) {
          return { results: [], queryModel: queryEmbedding.model, totalSearched: 0 };
        }

        // Step 3: 计算余弦相似度
        const similar = findSimilarDemands(
          queryEmbedding.vector,
          demandsWithVectors as Parameters<typeof findSimilarDemands>[1],
          input.topK,
          input.minSimilarity
        );

        console.log(`🔍 [SemanticSearch] Query: "${input.query.slice(0, 50)}" | Found: ${similar.length}/${demandsWithVectors.length}`);

        return {
          results: similar,
          queryModel: queryEmbedding.model,
          totalSearched: demandsWithVectors.length,
        };
      }),
  }),

  /**
   * RFQ & 报价流程（4.0 核心功能）
   * 实现“30分钟获得报价”的业务闭环
   */
  rfq: router({
    /** 发送标准化 RFQ */
    send: protectedProcedure
      .input(z.object({
        demandId: z.number(),
        factoryId: z.number(),
        matchResultId: z.number(),
        quantity: z.number().optional(),
        destination: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { sendRFQ } = await import("./_core/rfqService");
        return await sendRFQ({ ...input, buyerId: ctx.user.id });
      }),

    /** 工厂提交报价 */
    submit: protectedProcedure
      .input(z.object({
        inquiryId: z.number(),
        factoryId: z.number(),
        unitPrice: z.number(),
        currency: z.string().optional(),
        moq: z.number(),
        leadTimeDays: z.number(),
        tierPricing: z.array(z.object({ qty: z.number(), unitPrice: z.number() })).optional(),
        factoryNotes: z.string().optional(),
        paymentTerms: z.string().optional(),
        shippingTerms: z.string().optional(),
        sampleAvailable: z.boolean().optional(),
        samplePrice: z.number().optional(),
        sampleLeadDays: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { submitQuote } = await import("./_core/rfqService");
        return await submitQuote(input);
      }),

    /** 买家接受报价 */
    accept: protectedProcedure
      .input(z.object({
        inquiryId: z.number(),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { acceptQuote } = await import("./_core/rfqService");
        return await acceptQuote(input.inquiryId, ctx.user.id, input.feedback);
      }),

    /** 买家拒绝报价 */
    reject: protectedProcedure
      .input(z.object({
        inquiryId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { rejectQuote } = await import("./_core/rfqService");
        return await rejectQuote(input.inquiryId, ctx.user.id, input.reason);
      }),

    /** 获取报价详情 */
    getQuote: protectedProcedure
      .input(z.object({ inquiryId: z.number() }))
      .query(async ({ input }) => {
        const { getQuoteByInquiryId } = await import("./_core/rfqService");
        return await getQuoteByInquiryId(input.inquiryId);
      }),

    /** 获取工厂待处理 RFQ 列表 */
    getPendingRFQs: protectedProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        const { getFactoryPendingRFQs } = await import("./_core/rfqService");
        return await getFactoryPendingRFQs(input.factoryId);
      }),

    /** 自动发送 RFQ（飞书优先 + BullMQ 降级）*/
    autoSend: protectedProcedure
      .input(z.object({
        demandId: z.number(),
        factoryId: z.number(),
        matchResultId: z.number(),
        category: z.string().optional(),
        productName: z.string().optional(),
        quantity: z.number().optional(),
        destination: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { autoSendRfq } = await import("./_core/rfqService");
        return await autoSendRfq({ ...input, buyerId: ctx.user.id });
      }),

    /** 获取买家的所有 RFQ 列表 */
    getBuyerRFQs: protectedProcedure
      .query(async ({ ctx }) => {
        const { getBuyerRFQs } = await import("./_core/rfqService");
        return await getBuyerRFQs(ctx.user.id);
      }),

    /** 获取需求关联的所有 RFQ */
    getRFQsByDemand: protectedProcedure
      .input(z.object({ demandId: z.number() }))
      .query(async ({ input }) => {
        const { getRFQsByDemand } = await import("./_core/rfqService");
        return await getRFQsByDemand(input.demandId);
      }),

    /** 查询 Open Claw 任务状态 */
    getClawJobStatus: protectedProcedure
      .input(z.object({ demandId: z.number(), factoryId: z.number() }))
      .query(async ({ input }) => {
        const { getRfqClawJobStatus } = await import("./_core/queue");
        return await getRfqClawJobStatus(input.demandId, input.factoryId);
      }),

    /**
     * 4.3 定制报价 — AI 解析设计稿
     * 接收上传的设计稿 URL，调用 GPT-4o Vision 提取产品规格
     */
    parseDesignFile: protectedProcedure
      .input(z.object({
        fileUrls: z.array(z.string().url()).min(1).max(5),
        fileTypes: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        // 优先使用阿里云百炼 DashScope
        const _useDashScope = !!process.env.DASHSCOPE_API_KEY;
        const _dsBaseUrl = _useDashScope
          ? 'https://dashscope.aliyuncs.com/compatible-mode/v1'
          : (process.env.OPENAI_BASE_URL || 'https://once.novai.su/v1').replace(/\/$/, '');
        const _dsApiKey = _useDashScope ? process.env.DASHSCOPE_API_KEY! : (process.env.OPENAI_API_KEY || '');
        const _dsModel = _useDashScope ? (process.env.DASHSCOPE_MODEL || 'qwen-vl-plus') : 'gpt-4.1-mini';

        // 构建 Vision 消息，支持多张图片
        const imageMessages: any[] = input.fileUrls
          .filter((_, i) => (input.fileTypes?.[i] ?? '').startsWith('image/'))
          .slice(0, 4)
          .map(url => ({
            type: 'image_url',
            image_url: { url, detail: 'high' },
          }));

        const systemPrompt = `You are a product specification expert for B2B manufacturing.
Analyze the provided design files/images and extract structured product specifications.
Return a JSON object with these fields:
- productName: string (concise product name in English)
- category: string (e.g. Apparel, Electronics, Furniture, Packaging, etc.)
- material: string | null
- dimensions: string | null (size/dimensions info)
- color: string | null
- quantity: number | null (if mentioned)
- specialRequirements: string | null (certifications, special processes, etc.)
- estimatedComplexity: 'simple' | 'medium' | 'complex'
- suggestedLeadTime: number | null (days)
- suggestedBudgetRange: { min: number, max: number, currency: 'USD' } | null
- confidence: number (0-100, your confidence in the extraction)
- rawNotes: string (brief notes about what you observed)
Respond ONLY with valid JSON, no markdown.`;

        const userContent: any[] = [
          { type: 'text', text: 'Please analyze these design files and extract product specifications.' },
          ...imageMessages,
        ];

        // 如果没有图片（PDF等），提供文本提示
        if (imageMessages.length === 0) {
          userContent[0] = {
            type: 'text',
            text: `The uploaded files are: ${input.fileUrls.join(', ')}. Please provide a best-effort specification based on the file names and context.`,
          };
        }

        try {
          const _dsResponse = await fetch(`${_dsBaseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${_dsApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: _dsModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
              ],
              max_tokens: 1000,
              temperature: 0.2,
            }),
            signal: AbortSignal.timeout(30000),
          });
          if (!_dsResponse.ok) throw new Error(`AI API error: ${_dsResponse.status}`);
          const _dsResult = await _dsResponse.json() as { choices?: Array<{ message?: { content?: string } }> };

          const raw = _dsResult.choices?.[0]?.message?.content ?? '{}';
          // 清理可能的 markdown 代码块
          const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          const parsed = JSON.parse(cleaned);

          return {
            productName: parsed.productName ?? 'Unknown Product',
            category: parsed.category ?? 'General',
            material: parsed.material ?? null,
            dimensions: parsed.dimensions ?? null,
            color: parsed.color ?? null,
            quantity: parsed.quantity ?? null,
            specialRequirements: parsed.specialRequirements ?? null,
            estimatedComplexity: parsed.estimatedComplexity ?? 'medium',
            suggestedLeadTime: parsed.suggestedLeadTime ?? null,
            suggestedBudgetRange: parsed.suggestedBudgetRange ?? null,
            confidence: Math.min(100, Math.max(0, parsed.confidence ?? 70)),
            rawNotes: parsed.rawNotes ?? '',
          };
        } catch (e: any) {
          console.error('[parseDesignFile] AI parse error:', e.message);
          // 返回默认值，让用户手动填写
          return {
            productName: '',
            category: 'General',
            material: null,
            dimensions: null,
            color: null,
            quantity: null,
            specialRequirements: null,
            estimatedComplexity: 'medium' as const,
            suggestedLeadTime: null,
            suggestedBudgetRange: null,
            confidence: 0,
            rawNotes: 'AI 解析失败，请手动填写规格信息。',
          };
        }
      }),

    /**
     * 4.3 定制报价 — 创建定制 RFQ
     * 基于 AI 解析的规格创建定制报价请求，并自动匹配工厂
     */
    createCustomRfq: protectedProcedure
      .input(z.object({
        demandId: z.number().optional(),
        productName: z.string().min(1),
        category: z.string(),
        material: z.string().optional(),
        dimensions: z.string().optional(),
        color: z.string().optional(),
        quantity: z.number().optional(),
        specialRequirements: z.string().optional(),
        estimatedComplexity: z.enum(['simple', 'medium', 'complex']).optional(),
        suggestedLeadTime: z.number().optional(),
        budgetMin: z.number().optional(),
        budgetMax: z.number().optional(),
        budgetCurrency: z.string().default('USD'),
        designFileUrls: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { db } = await import('./db');
        const schema = await import('../drizzle/schema');

        // 构建定制 RFQ 描述
        const description = [
          `产品：${input.productName}`,
          input.material ? `材质：${input.material}` : null,
          input.dimensions ? `尺寸：${input.dimensions}` : null,
          input.color ? `颜色：${input.color}` : null,
          input.quantity ? `数量：${input.quantity} 件` : null,
          input.suggestedLeadTime ? `期望交期：${input.suggestedLeadTime} 天` : null,
          input.budgetMin && input.budgetMax
            ? `预算：${input.budgetCurrency} ${input.budgetMin}–${input.budgetMax}/件`
            : null,
          input.specialRequirements ? `特殊要求：${input.specialRequirements}` : null,
          input.designFileUrls?.length
            ? `设计稿：${input.designFileUrls.length} 个文件`
            : null,
        ].filter(Boolean).join('\n');

        // 创建 RFQ 记录
        const [rfq] = await db.insert(schema.rfqs).values({
          demandId: input.demandId ?? null,
          buyerId: ctx.user.id,
          category: input.category,
          productName: input.productName,
          description,
          quantity: input.quantity ?? null,
          targetPrice: input.budgetMin ?? null,
          currency: input.budgetCurrency,
          leadTime: input.suggestedLeadTime ?? null,
          status: 'pending',
          isCustom: 1,
          customSpecJson: JSON.stringify({
            material: input.material,
            dimensions: input.dimensions,
            color: input.color,
            complexity: input.estimatedComplexity,
            budgetRange: input.budgetMin && input.budgetMax
              ? { min: input.budgetMin, max: input.budgetMax, currency: input.budgetCurrency }
              : null,
            designFileUrls: input.designFileUrls ?? [],
            specialRequirements: input.specialRequirements,
          }),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any).returning();

        console.log(`✅ [CustomRFQ] Created custom RFQ #${rfq.id} for user ${ctx.user.id}: ${input.productName}`);

        // 异步触发工厂匹配（不阻塞响应）
        setImmediate(async () => {
          try {
            const { autoMatchFactoriesForCustomRfq } = await import('./_core/rfqService');
            await autoMatchFactoriesForCustomRfq(rfq.id, input.category);
          } catch (e) {
            console.warn('[CustomRFQ] Auto-match failed:', e);
          }
        });

        return { rfqId: rfq.id, status: 'created' };
      }),
  }),

  // ─── Knowledge Base Management API ────────────────────────────────────────────
  knowledge: router({

    // 搜索知识库（公开，供 AI 助理调用）
    search: publicProcedure
      .input(z.object({
        query: z.string().min(1).max(200),
        maxItems: z.number().min(1).max(20).optional().default(8),
        knowledgeTypes: z.array(z.string()).optional(),
        targetMarket: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const result = await searchProductKnowledge(input.query, {
          maxItems: input.maxItems,
          knowledgeTypes: input.knowledgeTypes as any,
          targetMarket: input.targetMarket,
          usedInContext: 'procurement_chat',
        });
        return {
          items: result.items,
          totalFound: result.totalFound,
          formattedContext: result.formattedContext,
        };
      }),

    // 获取所有产品类目（公开）
    getCategories: publicProcedure
      .query(async () => {
        const { createConnection } = await import('mysql2/promise');
        if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database configuration missing. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME environment variables.' });
        }
        const conn = await createConnection({
          host: process.env.DB_HOST,
          port: 3306,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        });
        const [rows] = await conn.execute<any[]>(
          'SELECT slug, name, nameEn, parentSlug, level, description FROM product_categories WHERE isActive=1 ORDER BY level, name'
        );
        await conn.end();
        return rows;
      }),

    // 获取知识库统计（需登录）
    getStats: protectedProcedure
      .query(async () => {
        const { createConnection } = await import('mysql2/promise');
        if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database configuration missing.' });
        }
        const conn = await createConnection({
          host: process.env.DB_HOST,
          port: 3306,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        });
        const [rows] = await conn.execute<any[]>(
          `SELECT
             (SELECT COUNT(*) FROM product_categories WHERE isActive=1) as totalCategories,
             (SELECT COUNT(*) FROM product_knowledge WHERE isActive=1) as totalKnowledge,
             (SELECT COUNT(*) FROM product_knowledge WHERE isActive=1 AND embeddingVector IS NOT NULL) as vectorized,
             (SELECT COUNT(DISTINCT knowledgeType) FROM product_knowledge WHERE isActive=1) as knowledgeTypes,
             (SELECT COALESCE(SUM(viewCount),0) FROM product_knowledge) as totalViews`
        );
        await conn.end();
        return rows[0];
      }),

    // 新增知识条目（需登录，管理员功能）
    createEntry: protectedProcedure
      .input(z.object({
        categorySlug: z.string(),
        knowledgeType: z.enum(['certification','material','process','pricing','moq','lead_time','packaging','quality_standard','market_trend','sourcing_tip']),
        title: z.string().min(2).max(200),
        content: z.string().min(10).max(5000),
        structuredData: z.record(z.string(), z.any()).optional(),
        targetMarkets: z.array(z.string()).optional(),
        confidence: z.number().min(0).max(100).optional().default(80),
        source: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createKnowledgeEntry } = await import('./_core/productKnowledgeService');
        const id = await createKnowledgeEntry(input);
        return { id, success: true };
      }),

    // Phase B: 向量语义搜索（直接调用知识库语义检索）
    semanticSearch: publicProcedure
      .input(z.object({
        query: z.string().min(1).max(200),
        topK: z.number().min(1).max(20).optional().default(5),
        minSimilarity: z.number().min(0).max(1).optional().default(0.45),
      }))
      .query(async ({ input }) => {
        const { semanticSearchKnowledge } = await import('./_core/productKnowledgeService');
        const results = await semanticSearchKnowledge(input.query, input.topK, input.minSimilarity);
        return {
          results,
          totalFound: results.length,
          query: input.query,
        };
      }),

    // Phase B: 批量向量化（管理员触发，为现有条目生成向量）
    batchVectorize: protectedProcedure
      .input(z.object({
        batchSize: z.number().min(1).max(200).optional().default(50),
        delayMs: z.number().min(0).max(2000).optional().default(200),
      }))
      .mutation(async ({ input }) => {
        const { batchVectorizeKnowledge } = await import('./_core/productKnowledgeService');
        const result = await batchVectorizeKnowledge(input.batchSize, input.delayMs);
        return result;
      }),

     // 获取热门知识条目（按引用次数）
    getTopKnowledge: publicProcedure
      .input(z.object({
        limit: z.number().min(1).max(50).optional().default(10),
        categorySlug: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const { createConnection } = await import('mysql2/promise');
        if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database configuration missing.' });
        }
        const conn = await createConnection({
          host: process.env.DB_HOST,
          port: 3306,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        });
        const categoryFilter = input.categorySlug ? 'AND categorySlug = ?' : '';
        const params: any[] = input.categorySlug
          ? [input.categorySlug, input.limit]
          : [input.limit];
        const [rows] = await conn.execute<any[]>(
          `SELECT id, categorySlug, knowledgeType, title, content, confidence, viewCount
           FROM product_knowledge
           WHERE isActive=1 ${categoryFilter}
           ORDER BY viewCount DESC, confidence DESC
           LIMIT ?`,
          params
        );
        await conn.end();
        return rows;
      }),

    // ─── Webinar 预约路由 ─────────────────────────────────────────────────────
    createWebinarBooking: protectedProcedure
      .input(z.object({
        factoryId: z.number(),
        demandId: z.number().optional(),
        inquiryId: z.number().optional(),
        scheduledAt: z.string(),
        durationMinutes: z.number().min(15).max(120).optional().default(30),
        timezone: z.string().optional().default('UTC'),
        buyerAgenda: z.string().max(500).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createWebinarBooking } = await import('./_core/webinarBookingService');
        return createWebinarBooking({
          buyerId: ctx.user.id,
          factoryId: input.factoryId,
          demandId: input.demandId,
          inquiryId: input.inquiryId,
          slot: {
            scheduledAt: new Date(input.scheduledAt),
            durationMinutes: input.durationMinutes,
            timezone: input.timezone,
          },
          buyerAgenda: input.buyerAgenda,
        });
      }),
    getMyWebinarBookings: protectedProcedure
      .query(async ({ ctx }) => {
        const { getBuyerBookings } = await import('./_core/webinarBookingService');
        return getBuyerBookings(ctx.user.id);
      }),
    getFactoryWebinarBookings: protectedProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        const { getFactoryBookings } = await import('./_core/webinarBookingService');
        return getFactoryBookings(input.factoryId);
      }),
    confirmWebinarBooking: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        factoryNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { confirmBooking } = await import('./_core/webinarBookingService');
        await confirmBooking(input.bookingId, ctx.user.id, input.factoryNotes);
        return { success: true };
      }),
    rejectWebinarBooking: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { rejectBooking } = await import('./_core/webinarBookingService');
        await rejectBooking(input.bookingId, ctx.user.id, input.reason);
        return { success: true };
      }),
    cancelWebinarBooking: protectedProcedure
      .input(z.object({
        bookingId: z.number(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { cancelBooking } = await import('./_core/webinarBookingService');
        await cancelBooking(input.bookingId, ctx.user.id, input.reason);
        return { success: true };
      }),
    getFactoryAvailableSlots: publicProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        const { getFactoryAvailableSlots } = await import('./_core/webinarBookingService');
        return getFactoryAvailableSlots(input.factoryId);
      }),

    // ─── AMR 评分路由 ─────────────────────────────────────────────────────────
    getFactoryAMRScore: publicProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        const { calculateFactoryAMR } = await import('./_core/amrService');
        return calculateFactoryAMR(input.factoryId);
      }),
    refreshFactoryAMRScore: protectedProcedure
      .input(z.object({ factoryId: z.number() }))
      .mutation(async ({ input }) => {
        const { refreshFactoryAMR } = await import('./_core/amrService');
        return refreshFactoryAMR(input.factoryId);
      }),

    // ─── 握手请求路由 (4.0: 15-min Matching) ────────────────────────────────
    /** 买家发起握手请求 */
    createHandshake: protectedProcedure
      .input(z.object({
        demandId: z.number(),
        factoryId: z.number(),
        matchResultId: z.number().optional(),
        buyerMessage: z.string().max(500).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createHandshakeRequest } = await import('./_core/handshakeService');
        return createHandshakeRequest({ ...input, buyerId: ctx.user.id });
      }),

     /** 工厂接受握手请求 */
    acceptHandshake: protectedProcedure
      .input(z.object({ handshakeId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { acceptHandshakeRequest } = await import('./_core/handshakeService');
        const result = await acceptHandshakeRequest(input.handshakeId, ctx.user.id);
        // WebSocket 通知买家：工厂已接受握手
        try {
          const { sendHandshakeResponseToBuyer } = await import('./_core/socketService');
          if (result?.buyerUserId) {
            sendHandshakeResponseToBuyer(result.buyerUserId, {
              type: 'handshake_accepted',
              handshakeId: input.handshakeId,
              roomSlug: result.roomSlug,
              factoryId: result.factoryId,
              factoryName: result.factoryName,
            });
          }
        } catch (e) {
          console.warn('[acceptHandshake] WebSocket push failed (non-critical):', (e as Error).message);
        }
        return result;
      }),
    /** 工厂拒绝握手请求 */
    rejectHandshake: protectedProcedure
      .input(z.object({
        handshakeId: z.number(),
        reason: z.string().max(200).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { rejectHandshakeRequest } = await import('./_core/handshakeService');
        const result = await rejectHandshakeRequest(input.handshakeId, ctx.user.id, input.reason);
        // WebSocket 通知买家：工厂已拒绝握手
        try {
          const { sendHandshakeResponseToBuyer } = await import('./_core/socketService');
          if (result?.buyerUserId) {
            sendHandshakeResponseToBuyer(result.buyerUserId, {
              type: 'handshake_rejected',
              handshakeId: input.handshakeId,
              factoryId: result.factoryId,
              reason: input.reason,
            });
          }
        } catch (e) {
          console.warn('[rejectHandshake] WebSocket push failed (non-critical):', (e as Error).message);
        }
        return result;
      }),
    /**
     * 工厂响应模拟器（开发/测试用）
     * 允许通过 API 模拟工厂接受或拒绝握手，用于端到端测试
     */
    simulateFactoryResponse: protectedProcedure
      .input(z.object({
        handshakeId: z.number(),
        response: z.enum(['accept', 'reject']),
        reason: z.string().max(200).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await dbPromise;
        // 获取握手请求详情
        const handshake = await db.query.handshakeRequests.findFirst({
          where: eq(schema.handshakeRequests.id, input.handshakeId),
        });
        if (!handshake) throw new TRPCError({ code: 'NOT_FOUND', message: '握手请求不存在' });
        if (handshake.status !== 'pending') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: `握手请求已处于 ${handshake.status} 状态` });
        }
        // 获取工厂信息（用于找到工厂用户 ID）
        const factory = await db.query.factories.findFirst({
          where: eq(schema.factories.id, handshake.factoryId),
        });
        if (!factory) throw new TRPCError({ code: 'NOT_FOUND', message: '工厂不存在' });
        // 以工厂用户身份执行操作
        if (input.response === 'accept') {
          const { acceptHandshakeRequest } = await import('./_core/handshakeService');
          const result = await acceptHandshakeRequest(input.handshakeId, factory.userId);
          try {
            const { sendHandshakeResponseToBuyer } = await import('./_core/socketService');
            if (result?.buyerUserId) {
              sendHandshakeResponseToBuyer(result.buyerUserId, {
                type: 'handshake_accepted',
                handshakeId: input.handshakeId,
                roomSlug: result.roomSlug,
                factoryId: factory.id,
                factoryName: factory.name,
              });
            }
          } catch (e) { /* non-critical */ }
          return { ...result, simulated: true };
        } else {
          const { rejectHandshakeRequest } = await import('./_core/handshakeService');
          const result = await rejectHandshakeRequest(input.handshakeId, factory.userId, input.reason);
          try {
            const { sendHandshakeResponseToBuyer } = await import('./_core/socketService');
            if (result?.buyerUserId) {
              sendHandshakeResponseToBuyer(result.buyerUserId, {
                type: 'handshake_rejected',
                handshakeId: input.handshakeId,
                factoryId: factory.id,
                reason: input.reason,
              });
            }
          } catch (e) { /* non-critical */ }
          return { ...result, simulated: true };
        }
      }),

    /** 获取需求的所有握手请求 */
    getHandshakesByDemand: protectedProcedure
      .input(z.object({ demandId: z.number() }))
      .query(async ({ input }) => {
        const { getHandshakesByDemand } = await import('./_core/handshakeService');
        return getHandshakesByDemand(input.demandId);
      }),

    /** 获取工厂待处理握手请求 */
    getFactoryPendingHandshakes: protectedProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        const { getFactoryPendingHandshakes } = await import('./_core/handshakeService');
        return getFactoryPendingHandshakes(input.factoryId);
      }),

    /** 获取沟通室消息 */
    getSourcingRoomMessages: protectedProcedure
      .input(z.object({ handshakeId: z.number(), limit: z.number().optional().default(50) }))
      .query(async ({ input }) => {
        const { getSourcingRoomMessages } = await import('./_core/handshakeService');
        return getSourcingRoomMessages(input.handshakeId, input.limit);
      }),

    /** 发送沟通室消息 */
    sendSourcingRoomMessage: protectedProcedure
      .input(z.object({
        handshakeId: z.number(),
        content: z.string().min(1).max(2000),
        senderRole: z.enum(['buyer', 'factory']),
      }))
      .mutation(async ({ input, ctx }) => {
        const { sendSourcingRoomMessage } = await import('./_core/handshakeService');
        const messageId = await sendSourcingRoomMessage(
          input.handshakeId,
          ctx.user.id,
          input.senderRole,
          input.content
        );
        return { success: true, messageId };
      }),

    /** 通过 roomSlug 获取握手详情 */
    getHandshakeByRoomSlug: protectedProcedure
      .input(z.object({ roomSlug: z.string() }))
      .query(async ({ input }) => {
        const { getHandshakeByRoomSlug } = await import('./_core/handshakeService');
        return getHandshakeByRoomSlug(input.roomSlug);
      }),

    // ─── 工厂知识库摄入路由 ───────────────────────────────────────────────────
    ingestFactoryKnowledgeFile: protectedProcedure
      .input(z.object({
        factoryId: z.number(),
        fileUrl: z.string().url(),
        fileName: z.string(),
        fileType: z.enum(['product_catalog', 'pricing_sheet', 'faq', 'certification', 'factory_intro', 'other']),
        mimeType: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { ingestFactoryKnowledge } = await import('./_core/factoryKnowledgeIngestService');
        return ingestFactoryKnowledge(input);
      }),
  }),
  /**
   * ── Ops 运营监控 ─────────────────────────────────────────────────────────────
   * 运营人员查看 Agent 状态、任务队列、RFQ 统计
   */
  ops: router({
    /** 获取所有 Agent 状态列表 */
    getAllAgents: protectedProcedure
      .query(async () => {
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { desc } = await import('drizzle-orm');
        const db = await dbPromise;
        return await db.query.clawAgentStatus.findMany({
          orderBy: [desc(schema.clawAgentStatus.lastHeartbeatAt)],
          limit: 100,
        });
      }),
    /** 获取所有 RFQ Claw 任务列表（支持状态过滤） */
    getRfqJobs: protectedProcedure
      .input(z.object({
        status: z.enum(['queued', 'processing', 'completed', 'failed', 'timeout']).optional(),
        limit: z.number().min(1).max(200).default(50),
      }))
      .query(async ({ input }) => {
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { desc, eq } = await import('drizzle-orm');
        const db = await dbPromise;
        const where = input.status ? eq(schema.rfqClawJobs.status, input.status) : undefined;
        return await db.query.rfqClawJobs.findMany({
          where,
          orderBy: [desc(schema.rfqClawJobs.enqueuedAt)],
          limit: input.limit,
        });
      }),
    /** 获取 RFQ 统计数据 */
    getRfqStats: protectedProcedure
      .query(async () => {
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { count, eq, gte, sql } = await import('drizzle-orm');
        const db = await dbPromise;
        const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const [total, pending, completed, failed, recent] = await Promise.all([
          db.select({ count: count() }).from(schema.rfqClawJobs),
          db.select({ count: count() }).from(schema.rfqClawJobs).where(eq(schema.rfqClawJobs.status, 'queued')),
          db.select({ count: count() }).from(schema.rfqClawJobs).where(eq(schema.rfqClawJobs.status, 'completed')),
          db.select({ count: count() }).from(schema.rfqClawJobs).where(eq(schema.rfqClawJobs.status, 'failed')),
          db.select({ count: count() }).from(schema.rfqClawJobs).where(gte(schema.rfqClawJobs.enqueuedAt, since24h)),
        ]);
        const onlineAgents = await db.select({ count: count() }).from(schema.clawAgentStatus)
          .where(eq(schema.clawAgentStatus.status, 'online'));
        return {
          totalJobs: total[0]?.count ?? 0,
          pendingJobs: pending[0]?.count ?? 0,
          completedJobs: completed[0]?.count ?? 0,
          failedJobs: failed[0]?.count ?? 0,
          jobsLast24h: recent[0]?.count ?? 0,
          onlineAgents: onlineAgents[0]?.count ?? 0,
        };
      }),
    /** 获取握手请求统计（含 RFQ 触发模式分布） */
    getHandshakeStats: protectedProcedure
      .query(async () => {
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { count, eq } = await import('drizzle-orm');
        const db = await dbPromise;
        const [total, accepted, pending, rejected] = await Promise.all([
          db.select({ count: count() }).from(schema.handshakeRequests),
          db.select({ count: count() }).from(schema.handshakeRequests).where(eq(schema.handshakeRequests.status, 'accepted')),
          db.select({ count: count() }).from(schema.handshakeRequests).where(eq(schema.handshakeRequests.status, 'pending')),
          db.select({ count: count() }).from(schema.handshakeRequests).where(eq(schema.handshakeRequests.status, 'rejected')),
        ]);
        return {
          total: total[0]?.count ?? 0,
          accepted: accepted[0]?.count ?? 0,
          pending: pending[0]?.count ?? 0,
          rejected: rejected[0]?.count ?? 0,
          acceptRate: total[0]?.count ? Math.round((accepted[0]?.count ?? 0) / total[0].count * 100) : 0,
        };
      }),
    /** 获取报价成功率统计（运营后台核心指标） */
    getQuoteSuccessStats: protectedProcedure
      .query(async () => {
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { count, eq, gte, avg, sql } = await import('drizzle-orm');
        const db = await dbPromise;

        const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const [
          totalQuotes,
          pendingQuotes,
          acceptedQuotes,
          rejectedQuotes,
          quotesLast7d,
          quotesLast30d,
          totalPOs,
        ] = await Promise.all([
          db.select({ count: count() }).from(schema.rfqQuotes),
          db.select({ count: count() }).from(schema.rfqQuotes).where(eq(schema.rfqQuotes.status, 'pending')),
          db.select({ count: count() }).from(schema.rfqQuotes).where(eq(schema.rfqQuotes.status, 'accepted')),
          db.select({ count: count() }).from(schema.rfqQuotes).where(eq(schema.rfqQuotes.status, 'rejected')),
          db.select({ count: count() }).from(schema.rfqQuotes).where(gte(schema.rfqQuotes.createdAt, since7d)),
          db.select({ count: count() }).from(schema.rfqQuotes).where(gte(schema.rfqQuotes.createdAt, since30d)),
          db.select({ count: count() }).from(schema.purchaseOrders),
        ]);

        const total = totalQuotes[0]?.count ?? 0;
        const accepted = acceptedQuotes[0]?.count ?? 0;
        const rejected = rejectedQuotes[0]?.count ?? 0;
        const responded = accepted + rejected;

        return {
          // 总报价数
          totalQuotes: total,
          pendingQuotes: pendingQuotes[0]?.count ?? 0,
          acceptedQuotes: accepted,
          rejectedQuotes: rejected,
          // 成功率
          buyerAcceptRate: responded > 0 ? Math.round(accepted / responded * 100) : 0,
          responseRate: total > 0 ? Math.round(responded / total * 100) : 0,
          // 近期活跃度
          quotesLast7d: quotesLast7d[0]?.count ?? 0,
          quotesLast30d: quotesLast30d[0]?.count ?? 0,
          // 采购单数
          totalPurchaseOrders: totalPOs[0]?.count ?? 0,
          // 转化率（采购单 / 报价总数）
          conversionRate: total > 0 ? Math.round((totalPOs[0]?.count ?? 0) / total * 100) : 0,
        };
      }),
    /** 获取单个 Agent 任务的详细日志 */
    getJobDetail: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }) => {
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await dbPromise;
        const [job] = await db
          .select()
          .from(schema.rfqClawJobs)
          .where(eq(schema.rfqClawJobs.jobId, input.jobId))
          .limit(1);
        if (!job) throw new Error('Job not found');
        // 构建日志条目（基于任务状态和时间戳推算）
        const logs: { time: string; level: string; message: string }[] = [];
        if (job.enqueuedAt) logs.push({ time: job.enqueuedAt.toISOString(), level: 'info', message: `任务入队 [jobId=${job.jobId}]` });
        if (job.agentPushed) logs.push({ time: (job.startedAt ?? job.enqueuedAt).toISOString(), level: 'info', message: `已推送给 Agent [agentId=${job.agentId ?? 'unknown'}]` });
        if (job.startedAt) logs.push({ time: job.startedAt.toISOString(), level: 'info', message: `Agent ${job.assignedAgentId ?? job.agentId ?? 'unknown'} 开始处理` });
        if (job.status === 'completed' && job.completedAt) {
          const durationMs = job.completedAt.getTime() - (job.startedAt?.getTime() ?? job.enqueuedAt.getTime());
          logs.push({ time: job.completedAt.toISOString(), level: 'success', message: `任务完成，耗时 ${Math.round(durationMs / 1000)}s` });
        } else if (job.status === 'failed') {
          logs.push({ time: (job.completedAt ?? new Date()).toISOString(), level: 'error', message: `任务失败：${job.failureReason ?? '未知原因'}` });
          if (job.retryCount > 0) logs.push({ time: new Date().toISOString(), level: 'warn', message: `已重试 ${job.retryCount} 次` });
        } else if (job.status === 'timeout') {
          logs.push({ time: new Date().toISOString(), level: 'error', message: '任务超时（超过 30 分钟）' });
          if (job.timeoutAlertSent) logs.push({ time: new Date().toISOString(), level: 'warn', message: '超时告警已发送' });
        } else if (job.status === 'cancelled') {
          logs.push({ time: (job.completedAt ?? new Date()).toISOString(), level: 'warn', message: `任务已取消：${job.failureReason ?? '运营手动取消'}` });
        }
        return { job, logs };
      }),
    /** 手动重试失败的任务 */
    retryJob: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .mutation(async ({ input }) => {
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await dbPromise;
        const [job] = await db
          .select()
          .from(schema.rfqClawJobs)
          .where(eq(schema.rfqClawJobs.jobId, input.jobId))
          .limit(1);
        if (!job) throw new Error('Job not found');
        if (!['failed', 'timeout', 'cancelled'].includes(job.status)) {
          throw new Error(`无法重试状态为 ${job.status} 的任务`);
        }
        // 重置任务状态并重新入队
        await db
          .update(schema.rfqClawJobs)
          .set({
            status: 'queued',
            retryCount: job.retryCount + 1,
            failureReason: null,
            startedAt: null,
            completedAt: null,
            updatedAt: new Date(),
          } as any)
          .where(eq(schema.rfqClawJobs.jobId, input.jobId));
        // 重新触发 autoSendRfq
        setImmediate(async () => {
          try {
            const { autoSendRfq } = await import('./_core/rfqService');
            await autoSendRfq({
              demandId: job.demandId,
              factoryId: job.factoryId,
              matchResultId: job.matchResultId ?? 0,
              buyerId: job.buyerId,
            });
          } catch (e) {
            console.error('[retryJob] retry failed:', e);
          }
        });
        return { success: true, newRetryCount: job.retryCount + 1 };
      }),
    /** 取消排队中或处理中的任务 */
    cancelJob: protectedProcedure
      .input(z.object({ jobId: z.string(), reason: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const db = await dbPromise;
        await db
          .update(schema.rfqClawJobs)
          .set({
            status: 'cancelled',
            failureReason: input.reason ?? '运营手动取消',
            completedAt: new Date(),
            updatedAt: new Date(),
          } as any)
          .where(eq(schema.rfqClawJobs.jobId, input.jobId));
        return { success: true };
      }),
    /** 获取按工厂分组的报价统计 */
    getQuoteStatsByFactory: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
      .query(async ({ input }) => {
        const { dbPromise } = await import('./db');
        const schema = await import('../drizzle/schema');
        const { count, eq, desc, sql } = await import('drizzle-orm');
        const db = await dbPromise;

        // 按工厂分组统计报价数量和接受率
        const stats = await db
          .select({
            factoryId: schema.rfqQuotes.factoryId,
            total: count(),
            accepted: sql<number>`SUM(CASE WHEN ${schema.rfqQuotes.status} = 'accepted' THEN 1 ELSE 0 END)`,
            rejected: sql<number>`SUM(CASE WHEN ${schema.rfqQuotes.status} = 'rejected' THEN 1 ELSE 0 END)`,
            pending: sql<number>`SUM(CASE WHEN ${schema.rfqQuotes.status} = 'pending' THEN 1 ELSE 0 END)`,
          })
          .from(schema.rfqQuotes)
          .groupBy(schema.rfqQuotes.factoryId)
          .orderBy(desc(count()))
          .limit(input.limit);

        // 获取工厂名称
        const factoryIds = stats.map(s => s.factoryId);
        const factories = factoryIds.length > 0
          ? await db.query.factories.findMany({
              where: (f, { inArray }) => inArray(f.id, factoryIds),
            })
          : [];
        const factoryMap = new Map(factories.map(f => [f.id, f.name]));

        return stats.map(s => ({
          factoryId: s.factoryId,
          factoryName: factoryMap.get(s.factoryId) ?? `工厂 #${s.factoryId}`,
          total: Number(s.total),
          accepted: Number(s.accepted),
          rejected: Number(s.rejected),
          pending: Number(s.pending),
          acceptRate: Number(s.total) > 0
            ? Math.round(Number(s.accepted) / Number(s.total) * 100)
            : 0,
        }));
      }),
  }),

  // ─── Negotiation (4.4: 动态议价) ────────────────────────────────────────────
  negotiation: router({
    // 买家发起议价请求
    create: protectedProcedure
      .input(z.object({
        rfqQuoteId: z.number(),
        factoryId: z.number(),
        demandId: z.number().optional(),
        buyerRequest: z.string().min(1),
        targetPrice: z.number().optional(),
        targetMoq: z.number().optional(),
        targetLeadTime: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createNegotiationSession } = await import("./_core/negotiationService");
        const result = await createNegotiationSession({
          ...input,
          buyerId: ctx.user.id,
        });
        return result;
      }),

    // 获取议价会话详情（含所有轮次）
    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        const { negotiationSessions, negotiationRounds } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        const { db } = await import("./_core/index");
        const [session] = await db
          .select()
          .from(negotiationSessions)
          .where(eq(negotiationSessions.id, input.sessionId))
          .limit(1);
        if (!session) throw new Error("Session not found");
        const rounds = await db
          .select()
          .from(negotiationRounds)
          .where(eq(negotiationRounds.sessionId, input.sessionId))
          .orderBy(desc(negotiationRounds.roundNumber));
        return { session, rounds };
      }),

    // 获取买家所有议价会话
    getBuyerSessions: protectedProcedure
      .query(async ({ ctx }) => {
        const { negotiationSessions } = await import("../drizzle/schema");
        const { eq, desc } = await import("drizzle-orm");
        const { db } = await import("./_core/index");
        return db
          .select()
          .from(negotiationSessions)
          .where(eq(negotiationSessions.buyerId, ctx.user.id))
          .orderBy(desc(negotiationSessions.createdAt))
          .limit(50);
      }),

    // 获取工厂所有待处理议价
    getFactoryPendingSessions: protectedProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        const { negotiationSessions } = await import("../drizzle/schema");
        const { eq, and, inArray, desc } = await import("drizzle-orm");
        const { db } = await import("./_core/index");
        return db
          .select()
          .from(negotiationSessions)
          .where(and(
            eq(negotiationSessions.factoryId, input.factoryId),
            inArray(negotiationSessions.status, ["factory_reviewing", "counter_proposed"])
          ))
          .orderBy(desc(negotiationSessions.createdAt));
      }),

    // 工厂回应议价
    factoryRespond: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        action: z.enum(["accepted", "rejected", "counter"]),
        responseMessage: z.string(),
        counterPrice: z.number().optional(),
        counterMoq: z.number().optional(),
        counterLeadTime: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { factoryRespondToNegotiation } = await import("./_core/negotiationService");
        await factoryRespondToNegotiation(
          input.sessionId,
          input.action,
          input.responseMessage,
          input.counterPrice,
          input.counterMoq,
          input.counterLeadTime
        );
        return { success: true };
      }),

    // 买家回应工厂反提案
    buyerRespond: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        action: z.enum(["accepted", "rejected"]),
        message: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { buyerRespondToCounter } = await import("./_core/negotiationService");
        await buyerRespondToCounter(input.sessionId, input.action, input.message);
        return { success: true };
      }),

    // 提交买家评价
    submitReview: protectedProcedure
      .input(z.object({
        transactionId: z.number(),
        qualityScore: z.number().min(1).max(5),
        serviceScore: z.number().min(1).max(5),
        deliveryScore: z.number().min(1).max(5),
        review: z.string().optional(),
        actualLeadDays: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { submitBuyerReview } = await import("./_core/negotiationService");
        await submitBuyerReview(input);
        return { success: true };
      }),

    // 获取工厂评分
    getFactoryScore: publicProcedure
      .input(z.object({ factoryId: z.number() }))
      .query(async ({ input }) => {
        const { factoryScores } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { db } = await import("./_core/index");
        const [score] = await db
          .select()
          .from(factoryScores)
          .where(eq(factoryScores.factoryId, input.factoryId))
          .limit(1);
        return score ?? null;
      }),

    // 运营后台：议价统计
    getStats: protectedProcedure
      .query(async () => {
        const { negotiationSessions, transactionHistory } = await import("../drizzle/schema");
        const { count, avg, sql: drizzleSql } = await import("drizzle-orm");
        const { db } = await import("./_core/index");
        const [stats] = await db
          .select({
            total: count(negotiationSessions.id),
            accepted: drizzleSql<number>`SUM(CASE WHEN ${negotiationSessions.status} = 'accepted' THEN 1 ELSE 0 END)`,
            rejected: drizzleSql<number>`SUM(CASE WHEN ${negotiationSessions.status} = 'rejected' THEN 1 ELSE 0 END)`,
            avgRounds: avg(negotiationSessions.roundCount),
            avgConfidence: avg(negotiationSessions.aiConfidence),
          })
          .from(negotiationSessions);
        const [txStats] = await db
          .select({
            totalTx: count(transactionHistory.id),
            avgDiscount: avg(transactionHistory.priceDiscountPct),
            negotiatedTx: drizzleSql<number>`SUM(CASE WHEN ${transactionHistory.wasNegotiated} = 1 THEN 1 ELSE 0 END)`,
          })
          .from(transactionHistory);
        return {
          sessions: {
            total: Number(stats?.total) || 0,
            accepted: Number(stats?.accepted) || 0,
            rejected: Number(stats?.rejected) || 0,
            successRate: Number(stats?.total) > 0
              ? Math.round(Number(stats?.accepted) / Number(stats?.total) * 100)
              : 0,
            avgRounds: Number(stats?.avgRounds) || 0,
            avgAiConfidence: Number(stats?.avgConfidence) || 0,
          },
          transactions: {
            total: Number(txStats?.totalTx) || 0,
            negotiated: Number(txStats?.negotiatedTx) || 0,
            avgPriceDiscount: Number(txStats?.avgDiscount) || 0,
            negotiationRate: Number(txStats?.totalTx) > 0
              ? Math.round(Number(txStats?.negotiatedTx) / Number(txStats?.totalTx) * 100)
              : 0,
          },
        };
      }),
  }),
  // 补全缺失路由以修复前端 TS 错误
  ftgi: ftgiRouter,
  humanScores: humanScoresRouter,

  samples: router({
    request: protectedProcedure
      .input(z.object({
        factoryId: z.number(),
        productId: z.number().optional(),
        quantity: z.number().default(1),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return createSampleOrder({
          buyerId: ctx.user.id,
          factoryId: input.factoryId,
          productId: input.productId,
          quantity: input.quantity,
          buyerNotes: input.notes,
          status: 'pending',
        });
       }),
  }),
  // ── Business Profile (User Commercial Portrait) ───────────────────────────
  businessProfile: router({
    saveOnboarding: protectedProcedure
      .input(z.object({
        ambition: z.string(),
        businessStage: z.string(),
        targetPlatforms: z.array(z.string()),
        budget: z.string(),
        interestedNiches: z.array(z.string()),
        mainChallenge: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getPool } = await import('./db');
        const pool = await getPool();
        await pool.execute(
          `INSERT INTO user_business_profiles
            (userId, ambition, businessStage, targetPlatforms, interestedNiches, budget, mainChallenge, onboardingCompletedAt, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3), NOW(3))
           ON DUPLICATE KEY UPDATE
            ambition = VALUES(ambition),
            businessStage = VALUES(businessStage),
            targetPlatforms = VALUES(targetPlatforms),
            interestedNiches = VALUES(interestedNiches),
            budget = VALUES(budget),
            mainChallenge = VALUES(mainChallenge),
            onboardingCompletedAt = NOW(3),
            updatedAt = NOW(3)`,
          [
            ctx.user.id,
            input.ambition,
            input.businessStage,
            JSON.stringify(input.targetPlatforms),
            JSON.stringify(input.interestedNiches),
            input.budget,
            input.mainChallenge,
          ]
        );
        await saveUserOnboardingPreferences(ctx.user.id, {
          interestedCategories: input.interestedNiches,
          orderScale: input.budget,
        });
        return { success: true };
      }),
    get: protectedProcedure.query(async ({ ctx }) => {
      const { getPool } = await import('./db');
      const pool = await getPool();
      const [rows] = await pool.execute(
        'SELECT * FROM user_business_profiles WHERE userId = ? LIMIT 1',
        [ctx.user.id]
      );
      return (rows as any[])[0] || null;
    }),
    updateAiSummary: protectedProcedure
      .input(z.object({ aiSummary: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { getPool } = await import('./db');
        const pool = await getPool();
        await pool.execute(
          'UPDATE user_business_profiles SET aiSummary = ?, lastInteractedAt = NOW(3), updatedAt = NOW(3) WHERE userId = ?',
          [input.aiSummary, ctx.user.id]
        );
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
