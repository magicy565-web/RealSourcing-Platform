/**
 * AI Coach Router
 * Handles niche-specialized AI coaching with session memory, knowledge base injection,
 * user-defined coach names, and message-level feedback.
 */
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getPool } from "./db";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Knowledge Base Loader ────────────────────────────────────────────────────

function loadKnowledgeDoc(filename: string): string {
  try {
    return readFileSync(join(__dirname, "coach-knowledge", filename), "utf-8");
  } catch {
    return "";
  }
}

// Niche → knowledge file mapping
const NICHE_KNOWLEDGE_MAP: Record<string, string> = {
  home_goods:      "niche-furniture.md",   // Home & Living uses furniture knowledge
  furniture:       "niche-furniture.md",
  beauty:          "niche-furniture.md",   // Placeholder — will be replaced with niche-specific docs
  pet_supplies:    "niche-furniture.md",
  sports_fitness:  "niche-furniture.md",
  baby_kids:       "niche-furniture.md",
  gadgets:         "niche-furniture.md",
  fashion:         "niche-furniture.md",
  outdoor:         "niche-furniture.md",
  kitchen:         "niche-furniture.md",
  health_wellness: "niche-furniture.md",
  toys_games:      "niche-furniture.md",
  automotive:      "niche-furniture.md",
};

// Cache loaded docs to avoid repeated file reads
const docCache: Record<string, string> = {};

function getKnowledgeBase(niche: string): string {
  const platformDoc = docCache["platform"] ??
    (docCache["platform"] = loadKnowledgeDoc("platform-guide.md"));
  const fundamentalsDoc = docCache["fundamentals"] ??
    (docCache["fundamentals"] = loadKnowledgeDoc("dropshipping-fundamentals.md"));

  const nicheFile = NICHE_KNOWLEDGE_MAP[niche] || "niche-furniture.md";
  const nicheDoc = docCache[nicheFile] ??
    (docCache[nicheFile] = loadKnowledgeDoc(nicheFile));

  return [platformDoc, fundamentalsDoc, nicheDoc].filter(Boolean).join("\n\n---\n\n");
}

// ─── Niche Display Names ──────────────────────────────────────────────────────

const NICHE_LABELS: Record<string, string> = {
  home_goods:      "Home & Living / Furniture",
  beauty:          "Beauty & Skincare",
  pet_supplies:    "Pet Supplies",
  sports_fitness:  "Sports & Fitness",
  baby_kids:       "Baby & Kids",
  gadgets:         "Gadgets & Tech",
  fashion:         "Apparel & Fashion",
  outdoor:         "Outdoor & Garden",
  kitchen:         "Kitchen & Dining",
  health_wellness: "Health & Wellness",
  toys_games:      "Toys & Games",
  automotive:      "Automotive",
};

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt(params: {
  coachName: string;
  niche: string;
  nicheLabel: string;
  knowledgeBase: string;
  userProfile: {
    ambition?: string;
    businessStage?: string;
    budget?: string;
    mainChallenge?: string;
    targetPlatforms?: string[];
    interestedNiches?: string[];
    aiSummary?: string;
  } | null;
}): string {
  const { coachName, niche, nicheLabel, knowledgeBase, userProfile } = params;

  const profileSection = userProfile ? `
=== YOUR USER'S BUSINESS PROFILE ===
Goal: ${userProfile.ambition || "not specified"}
Current Stage: ${userProfile.businessStage || "not specified"}
Starting Budget: ${userProfile.budget || "not specified"}
Main Challenge: ${userProfile.mainChallenge || "not specified"}
Target Platforms: ${(userProfile.targetPlatforms || []).join(", ") || "not specified"}
Interested Niches: ${(userProfile.interestedNiches || []).join(", ") || "not specified"}
${userProfile.aiSummary ? `AI Summary: ${userProfile.aiSummary}` : ""}
=====================================

IMPORTANT: Always personalize your advice based on this profile. Address their specific stage and challenge. 
If they are a beginner, explain concepts clearly. If they are already selling, focus on scaling and optimization.
` : "";

  return `You are ${coachName}, a specialized AI business coach on the RealSourcing platform. 
You are an expert in the **${nicheLabel}** niche for dropshipping and e-commerce sourcing from China.

${profileSection}

=== YOUR ROLE & BOUNDARIES ===
You are a focused business coach, NOT a general-purpose AI assistant.

WHAT YOU CAN HELP WITH:
- Dropshipping strategy, product selection, and market research in the ${nicheLabel} niche
- Sourcing from Chinese manufacturers: finding suppliers, negotiating, quality control
- E-commerce platform strategy (Shopify, TikTok Shop, Amazon, Etsy, etc.)
- Profit margin analysis and pricing strategy
- Using RealSourcing platform features effectively
- Supply chain logistics, shipping, and import/export basics
- Brand building and private label strategy

WHAT IS OUTSIDE YOUR SCOPE:
- General programming, coding, or technical development questions
- Medical, legal, or financial investment advice
- Topics unrelated to e-commerce, dropshipping, or product sourcing
- Marketing tactics beyond product/sourcing context (e.g., detailed ad copywriting)

When a user asks something outside your scope, respond with:
"That's outside my expertise as a sourcing and dropshipping coach. For [topic], I'd recommend [appropriate resource]. 
Is there anything about your ${nicheLabel} sourcing journey I can help you with?"

For complex sourcing tasks like finding specific factories or comparing multiple suppliers, 
suggest: "For this, you might want to use the AI Assistant (/ai-assistant) which can do deep supplier research and generate RFQs."

=== CONVERSATION STYLE ===
- Be direct, practical, and specific — avoid generic advice
- Use concrete numbers, examples, and actionable steps
- Ask clarifying questions when needed to give better advice
- Remember what was discussed earlier in this conversation
- Celebrate progress and milestones
- Be encouraging but honest about challenges
- Keep responses concise (2–4 paragraphs max) unless the user asks for detailed explanations
- Use markdown formatting for lists and key points

=== KNOWLEDGE BASE ===
The following is your authoritative knowledge base. Use it to answer questions accurately.
When you don't know something specific, say so honestly rather than guessing.

${knowledgeBase}

=== GROWTH TRACKING ===
As you coach this user, mentally note:
- What topics they've asked about (product selection, suppliers, shipping, etc.)
- What stage they seem to be at based on their questions
- What their biggest knowledge gaps appear to be
This helps you give increasingly personalized advice as the conversation progresses.`;
}

// ─── Message Type ─────────────────────────────────────────────────────────────

interface CoachMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// ─── Coach Router ─────────────────────────────────────────────────────────────

export const coachRouter = router({

  // Get or create a coach session for the current user
  getSession: protectedProcedure.query(async ({ ctx }) => {
    const pool = await getPool();

    // Get coach settings
    const [settingsRows] = await pool.execute(
      "SELECT * FROM ai_coach_settings WHERE userId = ? LIMIT 1",
      [ctx.user.id]
    ) as any[];
    const settings = (settingsRows as any[])[0] || null;

    // Get latest session
    const [sessionRows] = await pool.execute(
      "SELECT * FROM ai_coach_sessions WHERE userId = ? ORDER BY updatedAt DESC LIMIT 1",
      [ctx.user.id]
    ) as any[];
    const session = (sessionRows as any[])[0] || null;

    // Get business profile for niche detection
    const [profileRows] = await pool.execute(
      "SELECT * FROM user_business_profiles WHERE userId = ? LIMIT 1",
      [ctx.user.id]
    ) as any[];
    const profile = (profileRows as any[])[0] || null;

    // Determine primary niche
    let primaryNiche = "home_goods";
    if (profile?.interestedNiches) {
      const niches = typeof profile.interestedNiches === "string"
        ? JSON.parse(profile.interestedNiches)
        : profile.interestedNiches;
      if (Array.isArray(niches) && niches.length > 0) {
        primaryNiche = niches[0];
      }
    }

    const coachName = settings?.coachName || "Alex";
    const nicheLabel = NICHE_LABELS[primaryNiche] || "Home & Living";

    return {
      sessionId: session?.id || null,
      coachName,
      niche: primaryNiche,
      nicheLabel,
      messages: session ? (
        typeof session.messages === "string"
          ? JSON.parse(session.messages)
          : session.messages
      ) as CoachMessage[] : [],
      hasProfile: !!profile,
    };
  }),

  // Send a message to the AI Coach
  chat: protectedProcedure
    .input(z.object({
      sessionId: z.number().nullable(),
      message: z.string().min(1).max(3000),
    }))
    .mutation(async ({ input, ctx }) => {
      const pool = await getPool();
      const { invokeLLM } = await import("./_core/llm");

      // Get coach settings
      const [settingsRows] = await pool.execute(
        "SELECT * FROM ai_coach_settings WHERE userId = ? LIMIT 1",
        [ctx.user.id]
      ) as any[];
      const settings = (settingsRows as any[])[0] || null;
      const coachName = settings?.coachName || "Alex";

      // Get business profile
      const [profileRows] = await pool.execute(
        "SELECT * FROM user_business_profiles WHERE userId = ? LIMIT 1",
        [ctx.user.id]
      ) as any[];
      const profile = (profileRows as any[])[0] || null;

      // Determine niche
      let primaryNiche = "home_goods";
      if (profile?.interestedNiches) {
        const niches = typeof profile.interestedNiches === "string"
          ? JSON.parse(profile.interestedNiches)
          : profile.interestedNiches;
        if (Array.isArray(niches) && niches.length > 0) {
          primaryNiche = niches[0];
        }
      }
      const nicheLabel = NICHE_LABELS[primaryNiche] || "Home & Living";

      // Load or create session
      let sessionId = input.sessionId;
      let existingMessages: CoachMessage[] = [];

      if (sessionId) {
        const [rows] = await pool.execute(
          "SELECT messages FROM ai_coach_sessions WHERE id = ? AND userId = ? LIMIT 1",
          [sessionId, ctx.user.id]
        ) as any[];
        const row = (rows as any[])[0];
        if (row) {
          existingMessages = typeof row.messages === "string"
            ? JSON.parse(row.messages)
            : (row.messages || []);
        }
      }

      // Build knowledge base and system prompt
      const knowledgeBase = getKnowledgeBase(primaryNiche);
      const systemPrompt = buildSystemPrompt({
        coachName,
        niche: primaryNiche,
        nicheLabel,
        knowledgeBase,
        userProfile: profile ? {
          ambition: profile.ambition,
          businessStage: profile.businessStage,
          budget: profile.budget,
          mainChallenge: profile.mainChallenge,
          targetPlatforms: typeof profile.targetPlatforms === "string"
            ? JSON.parse(profile.targetPlatforms)
            : profile.targetPlatforms,
          interestedNiches: typeof profile.interestedNiches === "string"
            ? JSON.parse(profile.interestedNiches)
            : profile.interestedNiches,
          aiSummary: profile.aiSummary,
        } : null,
      });

      // Keep last 10 messages for context window management
      const recentMessages = existingMessages.slice(-10);

      // Call LLM
      const llmMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: systemPrompt },
        ...recentMessages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: input.message },
      ];

      const llmResult = await invokeLLM({ messages: llmMessages, maxTokens: 1000 });
      const assistantContent = (llmResult.choices?.[0]?.message?.content as string)
        || "I'm having trouble responding right now. Please try again in a moment.";

      // Build updated messages array
      const newUserMsg: CoachMessage = {
        role: "user",
        content: input.message,
        timestamp: new Date().toISOString(),
      };
      const newAssistantMsg: CoachMessage = {
        role: "assistant",
        content: assistantContent,
        timestamp: new Date().toISOString(),
      };
      const updatedMessages = [...existingMessages, newUserMsg, newAssistantMsg];

      // Extract topics discussed (simple keyword detection)
      const topicKeywords: Record<string, string[]> = {
        "product_selection": ["product", "niche", "winning", "trending", "sell"],
        "supplier_sourcing": ["supplier", "factory", "manufacturer", "source", "find"],
        "pricing_margins": ["price", "margin", "profit", "cost", "markup"],
        "shipping_logistics": ["shipping", "freight", "logistics", "delivery", "import"],
        "quality_control": ["quality", "sample", "inspection", "defect", "test"],
        "platform_strategy": ["shopify", "amazon", "tiktok", "etsy", "platform"],
        "private_label": ["brand", "private label", "oem", "custom", "packaging"],
      };
      const allText = (input.message + " " + assistantContent).toLowerCase();
      const detectedTopics: string[] = [];
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(kw => allText.includes(kw))) {
          detectedTopics.push(topic);
        }
      }

      // Save or update session
      if (sessionId) {
        await pool.execute(
          `UPDATE ai_coach_sessions 
           SET messages = ?, topicsDiscussed = ?, updatedAt = NOW(3)
           WHERE id = ? AND userId = ?`,
          [
            JSON.stringify(updatedMessages),
            JSON.stringify(detectedTopics),
            sessionId,
            ctx.user.id,
          ]
        );
      } else {
        const [result] = await pool.execute(
          `INSERT INTO ai_coach_sessions 
           (userId, niche, coachName, messages, profileSnapshot, topicsDiscussed, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
          [
            ctx.user.id,
            primaryNiche,
            coachName,
            JSON.stringify(updatedMessages),
            JSON.stringify(profile),
            JSON.stringify(detectedTopics),
          ]
        ) as any[];
        sessionId = (result as any).insertId;
      }

       // ── Opportunity card injection ───────────────────────────────────────
      // Detect if user is asking about opportunities / new products
      const opportunityKeywords = [
        "show me opportunities", "new opportunities", "new products", "latest products",
        "what's new", "whats new", "trending products", "top products", "best products",
        "product opportunities", "show products", "find products", "recommend products",
        "show me deals", "new arrivals", "latest arrivals",
      ];
      const msgLower = input.message.toLowerCase();
      const isOpportunityQuery = opportunityKeywords.some(kw => msgLower.includes(kw));
      let opportunityCards: any[] = [];
      if (isOpportunityQuery) {
        try {
          const [oppRows] = await pool.execute(
            `SELECT oi.id, oi.name, oi.opportunityScore, oi.estimatedMargin,
                    oi.priceMin, oi.priceMax, oi.moq, oi.headline, oi.coverImage, oi.tags,
                    f.name as factoryName
             FROM opportunity_items oi
             LEFT JOIN opportunity_batches ob ON oi.batchId = ob.id
             LEFT JOIN factories f ON oi.factoryId = f.id
             WHERE ob.niche = ? AND oi.isActive = 1
             ORDER BY oi.opportunityScore DESC
             LIMIT 3`,
            [primaryNiche]
          ) as any[];
          opportunityCards = (oppRows as any[]).map((row: any) => ({
            id: row.id,
            name: row.name,
            factoryName: row.factoryName,
            opportunityScore: row.opportunityScore,
            estimatedMargin: row.estimatedMargin,
            priceMin: row.priceMin,
            priceMax: row.priceMax,
            moq: row.moq,
            headline: row.headline,
            coverImage: row.coverImage,
            tags: typeof row.tags === "string" ? JSON.parse(row.tags || "[]") : (row.tags || []),
          }));
        } catch {
          // Silent fail — cards are optional enhancement
        }
      }
      return {
        sessionId,
        reply: assistantContent,
        messageIndex: updatedMessages.length - 1,
        opportunityCards: opportunityCards.length > 0 ? opportunityCards : undefined,
      };
    }),
  // Submit feedback for a specific message
  submitFeedback: protectedProcedure
    .input(z.object({
      sessionId: z.number(),
      messageIdx: z.number(),
      feedback: z.enum(["up", "down"]),
      comment: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const pool = await getPool();

      // Update session thumbs count
      const countField = input.feedback === "up" ? "thumbsUpCount" : "thumbsDownCount";
      await pool.execute(
        `UPDATE ai_coach_sessions SET ${countField} = ${countField} + 1 WHERE id = ? AND userId = ?`,
        [input.sessionId, ctx.user.id]
      );

      // Insert feedback record
      await pool.execute(
        `INSERT INTO ai_coach_feedback (sessionId, userId, messageIdx, feedback, comment, createdAt)
         VALUES (?, ?, ?, ?, ?, NOW(3))`,
        [input.sessionId, ctx.user.id, input.messageIdx, input.feedback, input.comment || null]
      );

      return { success: true };
    }),

  // Get or update coach settings (name)
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const pool = await getPool();
    const [rows] = await pool.execute(
      "SELECT * FROM ai_coach_settings WHERE userId = ? LIMIT 1",
      [ctx.user.id]
    ) as any[];
    const settings = (rows as any[])[0];
    return {
      coachName: settings?.coachName || "Alex",
      isEnabled: settings?.isEnabled !== 0,
    };
  }),

  updateSettings: protectedProcedure
    .input(z.object({
      coachName: z.string().min(1).max(30),
    }))
    .mutation(async ({ input, ctx }) => {
      const pool = await getPool();
      await pool.execute(
        `INSERT INTO ai_coach_settings (userId, coachName, createdAt, updatedAt)
         VALUES (?, ?, NOW(3), NOW(3))
         ON DUPLICATE KEY UPDATE coachName = VALUES(coachName), updatedAt = NOW(3)`,
        [ctx.user.id, input.coachName]
      );
      return { success: true };
    }),

  // Clear session history (start fresh)
  clearSession: protectedProcedure.mutation(async ({ ctx }) => {
    const pool = await getPool();
    await pool.execute(
      "DELETE FROM ai_coach_sessions WHERE userId = ?",
      [ctx.user.id]
    );
    return { success: true };
  }),
});
