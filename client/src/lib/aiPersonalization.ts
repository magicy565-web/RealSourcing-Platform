/**
 * AI Personalization Utilities
 * Generates context-aware content based on user's onboarding profile.
 * Used by AICoachBanner, AIAssistant, and AICoachWidget.
 */

// ─── Profile Types ────────────────────────────────────────────────────────────

export interface UserProfile {
  ambition?: string | null;
  businessStage?: string | null;
  budget?: string | null;
  mainChallenge?: string | null;
  targetPlatforms?: string[] | string | null;
  interestedNiches?: string[] | string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJsonArray(val: string[] | string | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

const NICHE_LABELS: Record<string, string> = {
  home_goods: "Home & Living",
  beauty: "Beauty & Skincare",
  pet_supplies: "Pet Supplies",
  sports_fitness: "Sports & Fitness",
  baby_kids: "Baby & Kids",
  gadgets: "Gadgets & Tech",
  fashion: "Apparel & Fashion",
  outdoor: "Outdoor & Garden",
  kitchen: "Kitchen & Dining",
  health_wellness: "Health & Wellness",
  toys_games: "Toys & Games",
  automotive: "Automotive",
};

const NICHE_EMOJIS: Record<string, string> = {
  home_goods: "🏠", beauty: "💄", pet_supplies: "🐾",
  sports_fitness: "💪", baby_kids: "👶", gadgets: "⚡",
  fashion: "👗", outdoor: "🌿", kitchen: "🍳",
  health_wellness: "💊", toys_games: "🎁", automotive: "🚗",
};

// ─── Personalized First Action (for AICoachBanner) ────────────────────────────

export interface FirstAction {
  headline: string;
  subtext: string;
  prompt: string;         // Pre-filled prompt for AI Assistant
  icon: string;           // Solar icon name
  ctaLabel: string;
  href: string;
}

export function getPersonalizedFirstAction(profile: UserProfile): FirstAction {
  const stage = profile.businessStage || "newbie";
  const challenge = profile.mainChallenge || "finding_products";
  const niches = parseJsonArray(profile.interestedNiches);
  const primaryNiche = niches[0] || "home_goods";
  const nicheLabel = NICHE_LABELS[primaryNiche] || "your niche";
  const nicheEmoji = NICHE_EMOJIS[primaryNiche] || "📦";
  const ambition = profile.ambition || "side_income";
  const budget = profile.budget || "under_500";

  // Stage × Challenge matrix for personalized actions
  if (stage === "newbie" || stage === "has_idea") {
    if (challenge === "finding_products") {
      return {
        headline: `Find your first winning ${nicheLabel} product`,
        subtext: `AI will analyze trending ${nicheLabel} products and identify low-competition opportunities for beginners.`,
        prompt: `I'm new to dropshipping and want to find a winning ${nicheLabel} product. My budget is ${budget}. What are the top 3 trending ${nicheLabel} products right now with good profit margins and low competition?`,
        icon: "solar:target-bold-duotone",
        ctaLabel: "Ask AI to find products",
        href: "/ai-assistant",
      };
    }
    if (challenge === "finding_suppliers") {
      return {
        headline: `Find verified ${nicheLabel} suppliers`,
        subtext: `AI will match you with certified Chinese manufacturers in the ${nicheLabel} category, with real export records.`,
        prompt: `I'm looking for reliable ${nicheLabel} suppliers in China. I'm a beginner with a budget of ${budget}. Can you recommend 3 verified factories with good track records and reasonable MOQ?`,
        icon: "solar:factory-bold-duotone",
        ctaLabel: "Find suppliers with AI",
        href: "/ai-assistant",
      };
    }
    if (challenge === "knowledge") {
      return {
        headline: `Your ${nicheLabel} dropshipping roadmap`,
        subtext: `Get a step-by-step action plan tailored to your current stage and goals.`,
        prompt: `I'm completely new to dropshipping and want to start with ${nicheLabel} products. Can you give me a step-by-step roadmap for my first 30 days, including how to find suppliers and set up my store?`,
        icon: "solar:map-bold-duotone",
        ctaLabel: "Get my roadmap",
        href: "/ai-assistant",
      };
    }
    if (challenge === "capital") {
      return {
        headline: `Start ${nicheLabel} dropshipping on a tight budget`,
        subtext: `Discover low-MOQ suppliers and lean strategies that work with ${budget === "under_500" ? "under $500" : "your budget"}.`,
        prompt: `I have a limited budget (${budget}) and want to start dropshipping ${nicheLabel} products. What are the most cost-effective ways to source products and which suppliers offer the lowest MOQ?`,
        icon: "solar:wallet-bold-duotone",
        ctaLabel: "Explore budget strategies",
        href: "/ai-assistant",
      };
    }
  }

  if (stage === "has_store") {
    if (challenge === "finding_products") {
      return {
        headline: `${nicheEmoji} Upgrade your ${nicheLabel} product catalog`,
        subtext: `AI will analyze your niche and suggest high-margin products that complement your existing store.`,
        prompt: `I have an existing ${nicheLabel} dropshipping store and want to add new winning products. What are the highest-margin ${nicheLabel} products I should add to my catalog right now?`,
        icon: "solar:add-square-bold-duotone",
        ctaLabel: "Discover new products",
        href: "/ai-assistant",
      };
    }
    if (challenge === "finding_suppliers") {
      return {
        headline: `Compare ${nicheLabel} suppliers side by side`,
        subtext: `Use AI to analyze multiple suppliers and find the best fit for your store's quality and price requirements.`,
        prompt: `I have a store selling ${nicheLabel} products and need to compare suppliers. Can you help me evaluate 3 factories and tell me which offers the best quality-to-price ratio?`,
        icon: "solar:chart-2-bold-duotone",
        ctaLabel: "Compare suppliers",
        href: "/ai-assistant",
      };
    }
    if (challenge === "marketing") {
      return {
        headline: `Boost your ${nicheLabel} store's conversion`,
        subtext: `Get AI-powered product positioning advice and supplier tips to improve your store's performance.`,
        prompt: `I'm struggling to get sales for my ${nicheLabel} store. Can you help me identify which products have the best viral potential and what makes a ${nicheLabel} product listing convert well?`,
        icon: "solar:graph-up-bold-duotone",
        ctaLabel: "Improve my store",
        href: "/ai-assistant",
      };
    }
    return {
      headline: `Optimize your ${nicheLabel} supply chain`,
      subtext: `AI will review your sourcing setup and suggest improvements to reduce costs and improve delivery times.`,
      prompt: `I have a ${nicheLabel} dropshipping store and want to optimize my supply chain. What are the key metrics I should track, and how can I reduce my average lead time?`,
      icon: "solar:settings-bold-duotone",
      ctaLabel: "Optimize supply chain",
      href: "/ai-assistant",
    };
  }

  if (stage === "already_selling") {
    if (ambition === "dtc_brand") {
      return {
        headline: `Build your own ${nicheLabel} private label brand`,
        subtext: `AI will guide you through the private label process — from factory selection to branding requirements.`,
        prompt: `I'm already selling ${nicheLabel} products and want to launch my own private label brand. What factories offer OEM/ODM services for ${nicheLabel}? What are the typical MOQs and lead times for custom branding?`,
        icon: "solar:crown-bold-duotone",
        ctaLabel: "Start private label",
        href: "/ai-assistant",
      };
    }
    return {
      headline: `Scale your ${nicheLabel} business to the next level`,
      subtext: `Get AI-powered supplier negotiation tips and bulk pricing strategies to maximize your margins.`,
      prompt: `I'm already generating revenue with ${nicheLabel} products and want to scale. How can I negotiate better pricing with my suppliers, and what volume thresholds typically unlock significant discounts?`,
      icon: "solar:rocket-bold-duotone",
      ctaLabel: "Scale with AI",
      href: "/ai-assistant",
    };
  }

  // Default fallback
  return {
    headline: `${nicheEmoji} Start your ${nicheLabel} sourcing journey`,
    subtext: `Tell AI what you need and get matched with verified Chinese manufacturers in seconds.`,
    prompt: `I want to start sourcing ${nicheLabel} products from China. Can you help me understand the process and recommend where to start?`,
    icon: "solar:magic-stick-2-bold-duotone",
    ctaLabel: "Ask AI Coach",
    href: "/ai-assistant",
  };
}

// ─── Personalized Quick Prompts (for AIAssistant welcome screen) ──────────────

export interface QuickPrompt {
  label: string;
  icon: string;
  prompt: string;
  color: string;
}

export function getPersonalizedQuickPrompts(profile: UserProfile | null): QuickPrompt[] {
  if (!profile) {
    // Generic prompts for users without a profile
    return [
      { label: "Find Bluetooth earphones", icon: "🎧", prompt: "I need 5000 Bluetooth earphones, budget $8/unit, CE certified. Find me the best suppliers.", color: "#7c3aed" },
      { label: "Yoga wear ODM small batch", icon: "🧘", prompt: "Looking for ODM yoga wear manufacturer, minimum order 200 pieces, need custom label.", color: "#0ea5e9" },
      { label: "USB-C charger FCC certified", icon: "⚡", prompt: "Need USB-C fast chargers with FCC certification, 10,000 units, what factories do you recommend?", color: "#10b981" },
      { label: "Pet products Amazon FBA", icon: "🐾", prompt: "I want to source pet accessories for Amazon FBA. What are the top trending pet products from China right now?", color: "#f59e0b" },
    ];
  }

  const stage = profile.businessStage || "newbie";
  const challenge = profile.mainChallenge || "finding_products";
  const niches = parseJsonArray(profile.interestedNiches);
  const primaryNiche = niches[0] || "home_goods";
  const nicheLabel = NICHE_LABELS[primaryNiche] || "products";
  const nicheEmoji = NICHE_EMOJIS[primaryNiche] || "📦";
  const budget = profile.budget || "under_500";
  const platforms = parseJsonArray(profile.targetPlatforms);
  const primaryPlatform = platforms[0] || "shopify";

  const platformLabel = {
    shopify: "Shopify store", tiktok: "TikTok Shop", amazon: "Amazon FBA",
    etsy: "Etsy shop", woocommerce: "WooCommerce store", not_sure: "online store",
  }[primaryPlatform] || "online store";

  const prompts: QuickPrompt[] = [];

  // Prompt 1: Based on challenge
  if (challenge === "finding_products") {
    prompts.push({
      label: `Top ${nicheLabel} products right now`,
      icon: nicheEmoji,
      prompt: `What are the top 5 trending ${nicheLabel} products with the best profit margins for ${platformLabel}? I'm at the ${stage} stage with a budget of ${budget}.`,
      color: "#7c3aed",
    });
  } else if (challenge === "finding_suppliers") {
    prompts.push({
      label: `Find ${nicheLabel} suppliers`,
      icon: "🏭",
      prompt: `Find me 3 verified ${nicheLabel} manufacturers in China. I need factories with good export records, reasonable MOQ, and experience with ${platformLabel} sellers.`,
      color: "#7c3aed",
    });
  } else if (challenge === "marketing") {
    prompts.push({
      label: `Best-selling ${nicheLabel} for ${primaryPlatform}`,
      icon: "📈",
      prompt: `Which ${nicheLabel} products are currently selling best on ${platformLabel}? What makes them successful and where can I source them?`,
      color: "#7c3aed",
    });
  } else {
    prompts.push({
      label: `${nicheEmoji} ${nicheLabel} sourcing guide`,
      icon: nicheEmoji,
      prompt: `Give me a complete sourcing guide for ${nicheLabel} products. What should I look for in a supplier, what certifications matter, and what are typical MOQs?`,
      color: "#7c3aed",
    });
  }

  // Prompt 2: Based on stage
  if (stage === "newbie" || stage === "has_idea") {
    prompts.push({
      label: "Calculate my profit margins",
      icon: "💰",
      prompt: `I want to sell ${nicheLabel} products with a selling price around $${budget === "under_500" ? "25-40" : budget === "500_2000" ? "30-60" : "50-100"}. Help me calculate realistic profit margins including all costs.`,
      color: "#10b981",
    });
  } else if (stage === "has_store") {
    prompts.push({
      label: "Compare 3 suppliers",
      icon: "⚖️",
      prompt: `I need to compare ${nicheLabel} suppliers. What are the key criteria I should evaluate, and can you help me create a comparison framework for quality, price, and reliability?`,
      color: "#10b981",
    });
  } else {
    prompts.push({
      label: "Negotiate bulk pricing",
      icon: "🤝",
      prompt: `I'm scaling my ${nicheLabel} business and want to negotiate better pricing with my suppliers. What volume thresholds unlock discounts, and what negotiation tactics work best with Chinese manufacturers?`,
      color: "#10b981",
    });
  }

  // Prompt 3: Platform-specific
  if (primaryPlatform === "amazon") {
    prompts.push({
      label: "Amazon FBA requirements",
      icon: "📦",
      prompt: `What do I need to know about sourcing ${nicheLabel} products for Amazon FBA? What are the packaging requirements, labeling rules, and which certifications does Amazon require?`,
      color: "#f59e0b",
    });
  } else if (primaryPlatform === "tiktok") {
    prompts.push({
      label: "TikTok viral products",
      icon: "🎵",
      prompt: `What ${nicheLabel} products have the highest viral potential on TikTok Shop? What visual characteristics make a product go viral, and which Chinese factories specialize in these items?`,
      color: "#f59e0b",
    });
  } else {
    prompts.push({
      label: "Private label options",
      icon: "🏷️",
      prompt: `Which ${nicheLabel} factories offer private label / OEM services? What are the typical minimum orders for custom branding, and what's the process?`,
      color: "#f59e0b",
    });
  }

  // Prompt 4: Always useful
  prompts.push({
    label: "Verify supplier quality",
    icon: "✅",
    prompt: `How do I verify a ${nicheLabel} supplier's quality and legitimacy before placing a large order? What certifications should I check, and what are red flags to watch out for?`,
    color: "#0ea5e9",
  });

  return prompts;
}

// ─── Personalized Widget Greeting (for AICoachWidget) ─────────────────────────

export interface WidgetGreeting {
  message: string;
  suggestedPrompts: string[];
}

export function getPersonalizedWidgetGreeting(
  coachName: string,
  profile: UserProfile | null,
  nicheLabel: string,
): WidgetGreeting {
  if (!profile) {
    return {
      message: `Hi! I'm ${coachName}, your AI sourcing coach. Complete your business profile so I can give you personalized advice for your niche!`,
      suggestedPrompts: [
        "Show me new opportunities",
        "How do I find suppliers?",
        "What's a good profit margin?",
      ],
    };
  }

  const stage = profile.businessStage || "newbie";
  const challenge = profile.mainChallenge || "finding_products";
  const niches = parseJsonArray(profile.interestedNiches);
  const primaryNiche = niches[0] || "home_goods";
  const nicheEmoji = NICHE_EMOJIS[primaryNiche] || "📦";
  const ambition = profile.ambition || "side_income";

  const ambitionPhrases: Record<string, string> = {
    side_income: "build a side income",
    full_time: "go full-time with your business",
    dtc_brand: "build your own brand",
    learn: "learn the ropes of dropshipping",
  };

  const stagePhrases: Record<string, string> = {
    newbie: "just starting out",
    has_idea: "ready to turn your idea into reality",
    has_store: "growing your store",
    already_selling: "scaling your business",
  };

  const challengeActions: Record<string, string> = {
    finding_products: `finding winning ${nicheLabel} products`,
    finding_suppliers: `finding reliable ${nicheLabel} suppliers`,
    marketing: "getting more traffic and sales",
    operations: "streamlining your operations",
    capital: "making the most of your budget",
    knowledge: "learning the key strategies",
  };

  const greeting = `Hi! I'm ${coachName} ${nicheEmoji} — I know you're ${stagePhrases[stage] || "building your business"} and want to ${ambitionPhrases[ambition] || "grow"}. I'm here to help you with ${challengeActions[challenge] || "your sourcing journey"}. What can I help you with today?`;

  // Stage-specific suggested prompts
  const promptsByStage: Record<string, string[]> = {
    newbie: [
      `Show me trending ${nicheLabel} products`,
      "How do I evaluate a supplier?",
      "What's the minimum budget to start?",
    ],
    has_idea: [
      `Find ${nicheLabel} suppliers for my idea`,
      "How do I get samples first?",
      "What MOQ should I expect?",
    ],
    has_store: [
      `Best new ${nicheLabel} products to add`,
      "How to negotiate better pricing?",
      "Show me new opportunities",
    ],
    already_selling: [
      "How to scale with private label?",
      "Negotiate bulk discounts",
      `New ${nicheLabel} opportunities`,
    ],
  };

  return {
    message: greeting,
    suggestedPrompts: promptsByStage[stage] || promptsByStage.newbie,
  };
}
