CREATE TABLE "ai_coach_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" integer NOT NULL,
	"userId" integer NOT NULL,
	"messageIdx" integer NOT NULL,
	"feedback" varchar(10) NOT NULL,
	"comment" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_coach_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"niche" varchar(50),
	"coachName" varchar(50),
	"messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"profileSnapshot" jsonb,
	"thumbsUpCount" integer DEFAULT 0 NOT NULL,
	"thumbsDownCount" integer DEFAULT 0 NOT NULL,
	"topicsDiscussed" jsonb,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_coach_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"coachName" varchar(50) DEFAULT 'Alex' NOT NULL,
	"isEnabled" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "ai_coach_settings_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "ai_recommendation_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"factoryId" integer NOT NULL,
	"isHelpful" smallint NOT NULL,
	"feedbackText" varchar(500),
	"recommendationMainReason" varchar(500),
	"model" varchar(100) DEFAULT 'gpt-4.1-mini' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "claw_agent_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"agentId" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'offline' NOT NULL,
	"version" varchar(50),
	"deployEnv" varchar(50) DEFAULT 'aliyun_wuying',
	"deployEnvDetail" varchar(255),
	"ipAddress" varchar(50),
	"lastHeartbeatAt" timestamp (3),
	"factoryId" integer,
	"factoryName" varchar(255),
	"capabilities" jsonb,
	"activeJobs" integer DEFAULT 0 NOT NULL,
	"totalJobsProcessed" integer DEFAULT 0 NOT NULL,
	"totalJobsFailed" integer DEFAULT 0 NOT NULL,
	"lastSuccessJobId" varchar(100),
	"lastFailureReason" text,
	"isEnabled" smallint DEFAULT 1 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "claw_agent_status_agentId_unique" UNIQUE("agentId")
);
--> statement-breakpoint
CREATE TABLE "commander_phones" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"userId" integer NOT NULL,
	"deviceName" varchar(100),
	"activationCode" varchar(32) NOT NULL,
	"isActivated" smallint DEFAULT 0 NOT NULL,
	"activatedAt" timestamp (3),
	"wechatOpenId" varchar(64),
	"wechatNickname" varchar(100),
	"wechatBoundAt" timestamp (3),
	"deviceModel" varchar(100),
	"lastActiveAt" timestamp (3),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "commander_phones_activationCode_unique" UNIQUE("activationCode")
);
--> statement-breakpoint
CREATE TABLE "commander_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"userId" integer NOT NULL,
	"instanceId" integer,
	"taskType" varchar(50) NOT NULL,
	"taskTitle" varchar(200) NOT NULL,
	"taskParams" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"progressMessage" varchar(500),
	"creditCost" integer DEFAULT 0 NOT NULL,
	"creditRefunded" smallint DEFAULT 0 NOT NULL,
	"resultSummary" text,
	"resultData" jsonb,
	"errorMessage" text,
	"startedAt" timestamp (3),
	"completedAt" timestamp (3),
	"bullJobId" varchar(100),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"userId" integer NOT NULL,
	"txType" varchar(30) NOT NULL,
	"amount" integer NOT NULL,
	"balanceAfter" integer NOT NULL,
	"description" varchar(500),
	"relatedTaskId" integer,
	"relatedOrderId" varchar(100),
	"paymentMethod" varchar(30),
	"paymentAmount" numeric(10, 2),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "demand_match_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"demandId" integer NOT NULL,
	"factoryId" integer NOT NULL,
	"matchScore" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"semanticScore" numeric(5, 4) DEFAULT '0.0000',
	"responsivenessScore" numeric(5, 2) DEFAULT '0.00',
	"trustScore" numeric(5, 2) DEFAULT '0.00',
	"matchReason" text,
	"factoryOnlineAt" smallint DEFAULT 0 NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"viewedAt" timestamp (3),
	"rfqSentAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digital_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"geoScore" integer DEFAULT 0 NOT NULL,
	"geoScoreHistory" jsonb,
	"lastGeoScanAt" timestamp (3),
	"alibabaProfileUrl" varchar(500),
	"linkedinProfileUrl" varchar(500),
	"websiteUrl" varchar(500),
	"thomasnetUrl" varchar(500),
	"totalContentPieces" integer DEFAULT 0 NOT NULL,
	"totalDirectoryListings" integer DEFAULT 0 NOT NULL,
	"totalAiCitations" integer DEFAULT 0 NOT NULL,
	"schemaOrgData" jsonb,
	"schemaLastUpdatedAt" timestamp (3),
	"lastMonthlyReportAt" timestamp (3),
	"monthlyReportUrl" varchar(500),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "digital_assets_factoryId_unique" UNIQUE("factoryId")
);
--> statement-breakpoint
CREATE TABLE "factories" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"logo" varchar(500),
	"category" varchar(100),
	"country" varchar(100) DEFAULT 'China',
	"city" varchar(100),
	"description" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"overallScore" numeric(3, 2) DEFAULT '0.00',
	"isOnline" smallint DEFAULT 0 NOT NULL,
	"lastOnlineAt" timestamp (3),
	"availableForCall" smallint DEFAULT 0 NOT NULL,
	"averageResponseTime" integer DEFAULT 0,
	"hasReel" smallint DEFAULT 0 NOT NULL,
	"videoVerificationUrl" varchar(500),
	"certificationStatus" varchar(20) DEFAULT 'pending',
	"certificationDate" timestamp (3),
	"viewCount" integer DEFAULT 0 NOT NULL,
	"favoriteCount" integer DEFAULT 0 NOT NULL,
	"responseRate" numeric(5, 2) DEFAULT '0.00',
	"languagesSpoken" jsonb,
	"isFeatured" smallint DEFAULT 0 NOT NULL,
	"featuredUntil" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "factories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "factory_availabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"dayOfWeek" integer NOT NULL,
	"startTime" varchar(5) NOT NULL,
	"endTime" varchar(5) NOT NULL,
	"timezone" varchar(50) DEFAULT 'Asia/Shanghai',
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factory_capability_embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"capabilityText" text NOT NULL,
	"embeddingVector" text,
	"embeddingModel" varchar(100),
	"embeddingAt" timestamp (3),
	"primaryCategory" varchar(100),
	"moqMin" integer DEFAULT 1,
	"leadTimeDaysMin" integer DEFAULT 7,
	"isActive" smallint DEFAULT 1 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factory_certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"issuer" varchar(200),
	"issuedAt" varchar(20),
	"expiresAt" varchar(20),
	"fileUrl" varchar(500),
	"verified" smallint DEFAULT 0,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factory_credits" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"totalRecharged" integer DEFAULT 0 NOT NULL,
	"totalConsumed" integer DEFAULT 0 NOT NULL,
	"lastRechargeAt" timestamp (3),
	"lowBalanceAlerted" smallint DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "factory_credits_factoryId_unique" UNIQUE("factoryId")
);
--> statement-breakpoint
CREATE TABLE "factory_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"established" integer,
	"employeeCount" varchar(50),
	"annualRevenue" varchar(100),
	"certifications" jsonb,
	"productionCapacity" jsonb,
	"phone" varchar(30),
	"email" varchar(255),
	"website" varchar(500),
	"avgResponseTime" varchar(20),
	"rating" numeric(3, 2) DEFAULT '0.00',
	"reviewCount" integer DEFAULT 0,
	"coverImage" varchar(500),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "factory_details_factoryId_unique" UNIQUE("factoryId")
);
--> statement-breakpoint
CREATE TABLE "factory_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factory_ftgi_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"docType" varchar(50) NOT NULL,
	"fileName" varchar(500) NOT NULL,
	"fileUrl" varchar(1000) NOT NULL,
	"fileSize" integer,
	"mimeType" varchar(100),
	"parseStatus" varchar(20) DEFAULT 'pending' NOT NULL,
	"parsedJson" jsonb,
	"parseError" text,
	"uploadedBy" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factory_ftgi_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"d1Trust" varchar(20),
	"d2Fulfillment" varchar(20),
	"d3Market" varchar(20),
	"d4Ecosystem" varchar(20),
	"d5Community" varchar(20),
	"rawScore" varchar(20),
	"aiCoefficient" varchar(20),
	"ftgiScore" varchar(20),
	"scoreDetails" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"errorMessage" text,
	"calculatedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "factory_ftgi_scores_factoryId_unique" UNIQUE("factoryId")
);
--> statement-breakpoint
CREATE TABLE "factory_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"totalMeetings" integer DEFAULT 0 NOT NULL,
	"totalSampleRequests" integer DEFAULT 0 NOT NULL,
	"sampleConversionRate" numeric(5, 2) DEFAULT '0.00',
	"totalOrders" integer DEFAULT 0 NOT NULL,
	"totalOrderValue" numeric(15, 2) DEFAULT '0.00',
	"disputeRate" numeric(5, 2) DEFAULT '0.00',
	"reelCount" integer DEFAULT 0 NOT NULL,
	"reelViewCount" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "factory_metrics_factoryId_unique" UNIQUE("factoryId")
);
--> statement-breakpoint
CREATE TABLE "factory_reels" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"videoUrl" varchar(500) NOT NULL,
	"thumbnailUrl" varchar(500),
	"duration" integer NOT NULL,
	"keyframes" jsonb,
	"viewCount" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'published',
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factory_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"userId" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "factory_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"overallScore" numeric(4, 2) DEFAULT '0.00',
	"qualityScore" numeric(4, 2) DEFAULT '0.00',
	"serviceScore" numeric(4, 2) DEFAULT '0.00',
	"deliveryScore" numeric(4, 2) DEFAULT '0.00',
	"priceCompetitiveness" numeric(5, 2) DEFAULT '0.00',
	"avgNegotiationRounds" numeric(4, 2) DEFAULT '0.00',
	"avgPriceFlexibility" numeric(5, 2) DEFAULT '0.00',
	"negotiationSuccessRate" numeric(5, 2) DEFAULT '0.00',
	"onTimeDeliveryRate" numeric(5, 2) DEFAULT '0.00',
	"avgLeadTimeVariance" numeric(5, 2) DEFAULT '0.00',
	"totalTransactions" integer DEFAULT 0 NOT NULL,
	"totalReviews" integer DEFAULT 0 NOT NULL,
	"negotiationStyle" jsonb,
	"lastCalculatedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "factory_scores_factoryId_unique" UNIQUE("factoryId")
);
--> statement-breakpoint
CREATE TABLE "factory_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"aiVerificationScore" integer DEFAULT 0 NOT NULL,
	"aiVerificationReason" jsonb,
	"complianceScore" integer DEFAULT 0 NOT NULL,
	"trustBadges" jsonb,
	"lastVerificationAt" timestamp (3),
	"verificationExpiresAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "factory_verifications_factoryId_unique" UNIQUE("factoryId")
);
--> statement-breakpoint
CREATE TABLE "feishu_quote_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"bitableRecordId" varchar(100),
	"factoryId" integer NOT NULL,
	"category" varchar(100),
	"productName" varchar(255),
	"unitPrice" numeric(10, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"moq" integer NOT NULL,
	"leadTimeDays" integer NOT NULL,
	"tierPricing" jsonb,
	"paymentTerms" varchar(255),
	"shippingTerms" varchar(100),
	"isVerified" smallint DEFAULT 0 NOT NULL,
	"dataSource" varchar(30) DEFAULT 'feishu_api' NOT NULL,
	"quoteUpdatedAt" timestamp (3),
	"isExpired" smallint DEFAULT 0 NOT NULL,
	"cacheExpiresAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "handshake_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"demandId" integer NOT NULL,
	"factoryId" integer NOT NULL,
	"buyerId" integer NOT NULL,
	"matchResultId" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"buyerMessage" text,
	"factoryRejectReason" varchar(500),
	"expiresAt" timestamp (3) NOT NULL,
	"respondedAt" timestamp (3),
	"roomSlug" varchar(100),
	"rfqTriggeredAt" timestamp (3),
	"rfqMode" varchar(30),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbound_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"commanderTaskId" integer,
	"source" varchar(50) NOT NULL,
	"platform" varchar(50),
	"externalId" varchar(200),
	"buyerName" varchar(200),
	"buyerCompany" varchar(200),
	"buyerCountry" varchar(100),
	"buyerEmail" varchar(320),
	"buyerPhone" varchar(50),
	"buyerLinkedin" varchar(500),
	"productCategory" varchar(100),
	"originalContent" text,
	"aiSummary" text,
	"qualityScore" integer DEFAULT 0 NOT NULL,
	"intentScore" integer DEFAULT 0 NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"isRead" smallint DEFAULT 0 NOT NULL,
	"readAt" timestamp (3),
	"inquiryTime" timestamp (3),
	"wechatNotified" smallint DEFAULT 0 NOT NULL,
	"notifiedAt" timestamp (3),
	"feishuArchived" smallint DEFAULT 0 NOT NULL,
	"feishuRecordId" varchar(100),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyerId" integer NOT NULL,
	"factoryId" integer NOT NULL,
	"productId" integer,
	"meetingId" integer,
	"quantity" integer,
	"destination" varchar(255),
	"notes" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"replyContent" text,
	"repliedAt" timestamp (3),
	"quotedPrice" numeric(10, 2),
	"currency" varchar(10) DEFAULT 'USD',
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiry_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"inquiryId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"senderRole" varchar(20) DEFAULT 'buyer' NOT NULL,
	"content" text NOT NULL,
	"isRead" smallint DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_usage_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"knowledgeId" integer NOT NULL,
	"usedInContext" varchar(50),
	"demandId" integer,
	"userId" integer,
	"relevanceScore" numeric(5, 4),
	"createdAt" timestamp (3) DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "lead_replies" (
	"id" serial PRIMARY KEY NOT NULL,
	"leadId" integer NOT NULL,
	"factoryId" integer NOT NULL,
	"userId" integer NOT NULL,
	"chineseContent" text NOT NULL,
	"englishContent" text,
	"translationStatus" varchar(20) DEFAULT 'pending' NOT NULL,
	"sendStatus" varchar(20) DEFAULT 'draft' NOT NULL,
	"sentAt" timestamp (3),
	"sendError" text,
	"clawJobId" varchar(100),
	"isApproved" smallint DEFAULT 0 NOT NULL,
	"approvedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "manufacturing_parameters" (
	"id" serial PRIMARY KEY NOT NULL,
	"demandId" integer NOT NULL,
	"moq" integer,
	"materials" jsonb,
	"dimensions" varchar(255),
	"weight" varchar(50),
	"colorRequirements" jsonb,
	"packagingRequirements" text,
	"certificationsRequired" jsonb,
	"estimatedUnitCost" numeric(10, 4),
	"toolingCost" numeric(12, 2),
	"leadTimeDays" integer,
	"renderImageUrl" varchar(1024),
	"technicalDrawingUrl" varchar(1024),
	"productionCategory" varchar(100),
	"suggestedFactoryTypes" jsonb,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "manufacturing_parameters_demandId_unique" UNIQUE("demandId")
);
--> statement-breakpoint
CREATE TABLE "meeting_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"dayOfWeek" integer,
	"specificDate" varchar(20),
	"startTime" varchar(8) NOT NULL,
	"endTime" varchar(8) NOT NULL,
	"timezone" varchar(50) DEFAULT 'Asia/Shanghai',
	"isActive" smallint DEFAULT 1,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_transcripts" (
	"id" serial PRIMARY KEY NOT NULL,
	"meetingId" integer NOT NULL,
	"speakerId" integer,
	"speakerName" varchar(100),
	"content" text NOT NULL,
	"timestamp" varchar(10),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyerId" integer NOT NULL,
	"factoryId" integer NOT NULL,
	"factoryUserId" integer,
	"title" varchar(255) NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"scheduledAt" timestamp (3),
	"startedAt" timestamp (3),
	"endedAt" timestamp (3),
	"durationMinutes" integer,
	"recordingUrl" varchar(500),
	"recordingThumbnail" varchar(500),
	"transcript" jsonb,
	"aiSummary" jsonb,
	"aiReelUrl" varchar(500),
	"aiReelThumbnail" varchar(500),
	"productsShownCount" integer DEFAULT 0,
	"productsLikedCount" integer DEFAULT 0,
	"inquiriesMadeCount" integer DEFAULT 0,
	"agoraChannelName" varchar(64),
	"followUpActions" jsonb,
	"notes" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"webinarId" integer,
	"senderId" integer NOT NULL,
	"content" text NOT NULL,
	"type" varchar(20) DEFAULT 'text' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "negotiation_rounds" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" integer NOT NULL,
	"roundNumber" integer DEFAULT 1 NOT NULL,
	"initiatedBy" varchar(20) DEFAULT 'buyer' NOT NULL,
	"proposedPrice" numeric(10, 2),
	"proposedMoq" integer,
	"proposedLeadTime" integer,
	"proposedTerms" text,
	"isAiGenerated" smallint DEFAULT 0 NOT NULL,
	"aiReasoning" text,
	"responseBy" varchar(20),
	"responseAction" varchar(20),
	"responseMessage" text,
	"respondedAt" timestamp (3),
	"feishuMsgId" varchar(100),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "negotiation_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfqQuoteId" integer NOT NULL,
	"buyerId" integer NOT NULL,
	"factoryId" integer NOT NULL,
	"demandId" integer,
	"inquiryId" integer,
	"buyerRequest" text NOT NULL,
	"targetPrice" numeric(10, 2),
	"targetMoq" integer,
	"targetLeadTime" integer,
	"originalPrice" numeric(10, 2),
	"originalMoq" integer,
	"originalLeadTime" integer,
	"originalCurrency" varchar(10) DEFAULT 'USD',
	"aiAnalysis" jsonb,
	"aiConfidence" numeric(5, 2),
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"finalPrice" numeric(10, 2),
	"finalMoq" integer,
	"finalLeadTime" integer,
	"roundCount" integer DEFAULT 0 NOT NULL,
	"resolvedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"type" varchar(30) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"link" varchar(500),
	"isRead" smallint DEFAULT 0,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "openclaw_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"instanceId" integer,
	"platform" varchar(50) NOT NULL,
	"accountUsername" varchar(200) NOT NULL,
	"encryptedSession" text,
	"sessionExpiresAt" timestamp (3),
	"healthStatus" varchar(20) DEFAULT 'unknown' NOT NULL,
	"lastCheckedAt" timestamp (3),
	"lastSuccessAt" timestamp (3),
	"errorMessage" text,
	"isActive" smallint DEFAULT 1 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "openclaw_instances" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer,
	"instanceType" varchar(20) DEFAULT 'standard' NOT NULL,
	"instanceName" varchar(100),
	"region" varchar(50) DEFAULT 'cn-hangzhou',
	"status" varchar(20) DEFAULT 'offline' NOT NULL,
	"agentId" varchar(64),
	"cpuUsage" numeric(5, 2) DEFAULT '0.00',
	"memoryUsage" numeric(5, 2) DEFAULT '0.00',
	"activeTaskCount" integer DEFAULT 0 NOT NULL,
	"totalTaskCount" integer DEFAULT 0 NOT NULL,
	"lastHeartbeatAt" timestamp (3),
	"provisionedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "openclaw_instances_agentId_unique" UNIQUE("agentId")
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"nameEn" varchar(100) NOT NULL,
	"parentSlug" varchar(100),
	"level" integer DEFAULT 1,
	"description" text,
	"iconUrl" varchar(500),
	"isActive" smallint DEFAULT 1,
	"createdAt" timestamp (3) DEFAULT NOW(),
	CONSTRAINT "product_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"priceMin" numeric(10, 2),
	"priceMax" numeric(10, 2),
	"currency" varchar(10) DEFAULT 'USD',
	"moq" integer DEFAULT 1,
	"stock" integer DEFAULT 0,
	"unit" varchar(20) DEFAULT '件',
	"model" varchar(100),
	"brand" varchar(100),
	"size" varchar(100),
	"weight" varchar(50),
	"material" varchar(200),
	"features" text,
	"rating" numeric(3, 2) DEFAULT '0.00',
	"reviewCount" integer DEFAULT 0,
	"leadTimeDays" integer,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "product_details_productId_unique" UNIQUE("productId")
);
--> statement-breakpoint
CREATE TABLE "product_knowledge" (
	"id" serial PRIMARY KEY NOT NULL,
	"categorySlug" varchar(100) NOT NULL,
	"knowledgeType" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"structuredData" jsonb,
	"targetMarkets" jsonb,
	"confidence" integer DEFAULT 80,
	"source" varchar(200),
	"embeddingVector" text,
	"embeddingModel" varchar(100),
	"embeddingAt" timestamp (3),
	"viewCount" integer DEFAULT 0,
	"isActive" smallint DEFAULT 1,
	"createdAt" timestamp (3) DEFAULT NOW(),
	"updatedAt" timestamp (3) DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" integer NOT NULL,
	"userId" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"factoryId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255),
	"category" varchar(100),
	"description" text,
	"coverImage" varchar(1024),
	"images" jsonb,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"poNumber" varchar(50) NOT NULL,
	"buyerId" integer NOT NULL,
	"factoryId" integer NOT NULL,
	"inquiryId" integer,
	"rfqQuoteId" integer,
	"demandId" integer,
	"productName" varchar(255),
	"quantity" integer,
	"unitPrice" numeric(10, 2),
	"totalAmount" numeric(15, 2),
	"currency" varchar(10) DEFAULT 'USD',
	"leadTimeDays" integer,
	"expectedDelivery" timestamp (3),
	"paymentTerms" varchar(255),
	"shippingTerms" varchar(100),
	"tierPricing" jsonb,
	"status" varchar(30) DEFAULT 'draft' NOT NULL,
	"buyerNotes" text,
	"factoryNotes" text,
	"confirmedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "purchase_orders_poNumber_unique" UNIQUE("poNumber")
);
--> statement-breakpoint
CREATE TABLE "rfq_claw_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"jobId" varchar(100) NOT NULL,
	"demandId" integer NOT NULL,
	"factoryId" integer NOT NULL,
	"buyerId" integer NOT NULL,
	"matchResultId" integer,
	"category" varchar(100),
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"assignedAgentId" varchar(100),
	"enqueuedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"startedAt" timestamp (3),
	"completedAt" timestamp (3),
	"failureReason" text,
	"retryCount" integer DEFAULT 0 NOT NULL,
	"timeoutAlertSent" smallint DEFAULT 0 NOT NULL,
	"taskId" varchar(150),
	"agentPushed" smallint DEFAULT 0 NOT NULL,
	"agentId" varchar(100),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "rfq_claw_jobs_jobId_unique" UNIQUE("jobId")
);
--> statement-breakpoint
CREATE TABLE "rfq_quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"inquiryId" integer NOT NULL,
	"demandId" integer,
	"factoryId" integer NOT NULL,
	"buyerId" integer NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"unitPrice" numeric(10, 2),
	"currency" varchar(10) DEFAULT 'USD',
	"moq" integer,
	"leadTimeDays" integer,
	"validUntil" timestamp (3),
	"tierPricing" jsonb,
	"factoryNotes" text,
	"paymentTerms" varchar(255),
	"shippingTerms" varchar(100),
	"sampleAvailable" smallint DEFAULT 0,
	"samplePrice" numeric(10, 2),
	"sampleLeadDays" integer,
	"buyerFeedback" text,
	"respondedAt" timestamp (3),
	"submittedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sample_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyerId" integer NOT NULL,
	"factoryId" integer NOT NULL,
	"productId" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unitPrice" numeric(10, 2),
	"totalAmount" numeric(10, 2),
	"currency" varchar(10) DEFAULT 'USD',
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"shippingName" varchar(100),
	"shippingAddress" text,
	"shippingCountry" varchar(100),
	"shippingPhone" varchar(30),
	"trackingNumber" varchar(100),
	"notes" text,
	"paymentStatus" varchar(20) DEFAULT 'unpaid',
	"paymentRef" varchar(255),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sourcing_demands" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"sourceType" varchar(20) DEFAULT 'text' NOT NULL,
	"sourceUri" varchar(1024),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"productName" varchar(255),
	"productDescription" text,
	"keyFeatures" jsonb,
	"targetAudience" varchar(255),
	"visualReferences" jsonb,
	"estimatedQuantity" varchar(100),
	"targetPrice" varchar(100),
	"customizationNotes" text,
	"extractedData" jsonb,
	"processingError" text,
	"isPublished" smallint DEFAULT 0 NOT NULL,
	"productionCategory" varchar(100),
	"embeddingVector" text,
	"embeddingModel" varchar(100),
	"embeddingAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sourcing_room_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"handshakeId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"senderRole" varchar(20) DEFAULT 'buyer' NOT NULL,
	"content" text NOT NULL,
	"messageType" varchar(20) DEFAULT 'text' NOT NULL,
	"isRead" smallint DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"planId" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"startedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expiresAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchaseOrderId" integer NOT NULL,
	"buyerId" integer NOT NULL,
	"factoryId" integer NOT NULL,
	"rfqQuoteId" integer,
	"negotiationSessionId" integer,
	"quotedPrice" numeric(10, 2),
	"finalPrice" numeric(10, 2),
	"priceDiscountPct" numeric(5, 2),
	"quotedLeadDays" integer,
	"actualLeadDays" integer,
	"leadTimeVarianceDays" integer,
	"quantity" integer,
	"totalAmount" numeric(15, 2),
	"currency" varchar(10) DEFAULT 'USD',
	"productCategory" varchar(100),
	"qualityScore" numeric(3, 1),
	"serviceScore" numeric(3, 1),
	"deliveryScore" numeric(3, 1),
	"overallScore" numeric(3, 1),
	"buyerReview" text,
	"reviewedAt" timestamp (3),
	"negotiationRounds" integer DEFAULT 0,
	"wasNegotiated" smallint DEFAULT 0 NOT NULL,
	"completedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"targetType" varchar(20) NOT NULL,
	"targetId" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"company" varchar(255),
	"country" varchar(100),
	"bio" text,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "user_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"email" varchar(320),
	"passwordHash" varchar(255),
	"name" varchar(100),
	"avatar" varchar(500),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"lastLoginAt" timestamp (3),
	"loginMethod" varchar(50),
	"platform" varchar(50),
	"interestedCategories" jsonb,
	"orderScale" varchar(50),
	"targetMarkets" jsonb,
	"certifications" jsonb,
	"onboardingCompleted" smallint DEFAULT 0,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webinar_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyerId" integer NOT NULL,
	"factoryId" integer NOT NULL,
	"demandId" integer,
	"inquiryId" integer,
	"scheduledAt" timestamp (3) NOT NULL,
	"durationMinutes" integer DEFAULT 30,
	"timezone" varchar(50) DEFAULT 'UTC',
	"meetingType" varchar(20) DEFAULT 'agora',
	"meetingUrl" varchar(500),
	"agoraMeetingId" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"buyerAgenda" text,
	"factoryNotes" text,
	"confirmedAt" timestamp (3),
	"reminderSentAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webinar_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"webinarId" integer NOT NULL,
	"userId" integer,
	"productId" integer,
	"productName" varchar(255),
	"quantity" varchar(50),
	"buyerName" varchar(100),
	"buyerEmail" varchar(320),
	"status" varchar(30) DEFAULT 'new' NOT NULL,
	"notes" text,
	"source" varchar(50) DEFAULT 'webinar_live',
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webinar_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"webinarId" integer NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webinar_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"webinarId" integer NOT NULL,
	"userId" integer,
	"factoryId" integer,
	"role" varchar(20) DEFAULT 'attendee' NOT NULL,
	"status" varchar(20) DEFAULT 'invited' NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webinar_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"webinarId" integer NOT NULL,
	"productId" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webinar_reels" (
	"id" serial PRIMARY KEY NOT NULL,
	"webinarId" integer NOT NULL,
	"userId" integer NOT NULL,
	"clips" jsonb,
	"bgm" varchar(255),
	"subtitlesEnabled" smallint DEFAULT 1,
	"aiCopy" text,
	"hashtags" jsonb,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"publishedPlatforms" jsonb,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webinar_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"webinarId" integer NOT NULL,
	"userId" integer NOT NULL,
	"status" varchar(20) DEFAULT 'registered' NOT NULL,
	"registeredAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webinars" (
	"id" serial PRIMARY KEY NOT NULL,
	"hostId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255),
	"description" text,
	"coverImage" varchar(500),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"scheduledAt" timestamp (3),
	"duration" integer DEFAULT 60 NOT NULL,
	"createdAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp (3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "webinars_slug_unique" UNIQUE("slug")
);
