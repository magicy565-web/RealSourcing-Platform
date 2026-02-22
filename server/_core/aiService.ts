/**
 * RealSourcing AI Service
 * 统一 AI 服务层，支持多模型路由
 *
 * 模型优先级：
 * 1. 阿里云百炼 qwen-plus（中英文采购场景优化，低成本）
 * 2. 逆次代理 [次]deepseek-chat（备用，OpenAI 兼容）
 * 3. Gemini 2.5 Flash（备用）
 */

import { ENV } from './env';

// ── 类型定义 ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MeetingSummary {
  keyPoints: string[];           // 核心要点（3-5 条）
  priceDiscussed: string | null; // 价格区间（如 "$5-8/pc"）
  moqDiscussed: string | null;   // MOQ（如 "500 pcs"）
  leadTime: string | null;       // 交期（如 "30 days"）
  productsDiscussed: string[];   // 讨论的产品名称列表
  followUpActions: string[];     // 跟进事项（3-5 条）
  buyerSentiment: 'positive' | 'neutral' | 'negative'; // 买家态度
  dealProbability: number;       // 成交概率 0-100
  nextStep: string;              // 建议下一步
  rawSummary: string;            // 完整摘要段落
}

export interface ProcurementChatResponse {
  content: string;
  suggestedActions?: string[];   // 建议操作（如"查看工厂"、"申请样品"）
  relatedProducts?: string[];    // 相关产品
}

// ── AI 客户端工厂 ─────────────────────────────────────────────────────────────

async function callOpenAICompatible(
  messages: ChatMessage[],
  options: {
    baseUrl?: string;
    apiKey: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
    responseFormat?: 'json' | 'text';
  }
): Promise<string> {
  const baseUrl = options.baseUrl || 'https://once.novai.su/v1';
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${options.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model,
      messages,
      max_tokens: options.maxTokens || 2000,
      temperature: options.temperature ?? 0.3,
      ...(options.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No content in AI response');
  }
  return content;
}

async function callDashScope(
  messages: ChatMessage[],
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<string> {
  return callOpenAICompatible(messages, {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: ENV.dashscopeApiKey,
    model: options.model || ENV.dashscopeModel || 'qwen-plus',
    maxTokens: options.maxTokens,
    temperature: options.temperature,
  });
}

async function callNovai(
  messages: ChatMessage[],
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    responseFormat?: 'json' | 'text';
  } = {}
): Promise<string> {
  return callOpenAICompatible(messages, {
    baseUrl: ENV.openaiBaseUrl || 'https://once.novai.su/v1',
    apiKey: ENV.openaiApiKey,
    model: options.model || '[次]deepseek-chat',
    maxTokens: options.maxTokens,
    temperature: options.temperature,
    responseFormat: options.responseFormat,
  });
}

/**
 * 智能路由：优先使用 ENV.openaiModel（默认 gpt-4.1-mini），失败时切换到阿里云百炼
 */
async function callAI(
  messages: ChatMessage[],
  options: {
    maxTokens?: number;
    temperature?: number;
    preferJson?: boolean;
  } = {}
): Promise<string> {
  const primaryModel = ENV.openaiModel || 'gpt-4.1-mini';
  // 优先：使用配置的 OpenAI 兼容模型
  if (ENV.openaiApiKey) {
    try {
      return await callNovai(messages, {
        model: primaryModel,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
      });
    } catch (e) {
      console.warn(`⚠️ ${primaryModel} failed, falling back to DashScope:`, (e as Error).message);
    }
  }

  // 备用：阿里云百炼（qwen-plus）
  if (ENV.dashscopeApiKey) {
    try {
      return await callDashScope(messages, {
        model: 'qwen-plus',
        maxTokens: options.maxTokens,
        temperature: options.temperature,
      });
    } catch (e) {
      console.warn('⚠️ DashScope failed, falling back to deepseek:', (e as Error).message);
    }
  }

  // 最终备用：逆次代理 deepseek-chat
  if (ENV.openaiApiKey) {
    return await callNovai(messages, {
      model: '[次]deepseek-chat',
      maxTokens: options.maxTokens,
      temperature: options.temperature,
    });
  }

  throw new Error('No AI API key configured');
}

// ── P1.1: 会议摘要生成 ────────────────────────────────────────────────────────

const MEETING_SUMMARY_SYSTEM_PROMPT = `You are an expert B2B procurement meeting analyst for RealSourcing platform.
Analyze the meeting transcript between a buyer and a factory, then extract structured business intelligence.

Output ONLY valid JSON matching this schema:
{
  "keyPoints": ["string", ...],       // 3-5 key discussion points
  "priceDiscussed": "string or null", // e.g. "$5-8/pc" or null
  "moqDiscussed": "string or null",   // e.g. "500 pcs" or null
  "leadTime": "string or null",       // e.g. "30 days" or null
  "productsDiscussed": ["string"],    // product names mentioned
  "followUpActions": ["string"],      // 3-5 concrete next steps
  "buyerSentiment": "positive|neutral|negative",
  "dealProbability": 0-100,           // integer
  "nextStep": "string",               // single most important next action
  "rawSummary": "string"              // 2-3 sentence executive summary
}`;

export async function generateMeetingSummary(
  transcripts: Array<{ speakerName?: string | null; content: string; timestamp?: string | null }>,
  context: {
    factoryName: string;
    buyerName: string;
    meetingTitle: string;
    durationMinutes?: number | null;
  }
): Promise<MeetingSummary> {
  if (!transcripts || transcripts.length === 0) {
    return getDefaultSummary(context);
  }

  const transcriptText = transcripts
    .map(t => `[${t.timestamp || ''}] ${t.speakerName || 'Speaker'}: ${t.content}`)
    .join('\n');

  const userPrompt = `Meeting: "${context.meetingTitle}"
Participants: ${context.buyerName} (Buyer) × ${context.factoryName} (Factory)
Duration: ${context.durationMinutes || 'unknown'} minutes

Transcript:
${transcriptText.slice(0, 8000)}

Analyze and return JSON.`;

  try {
    const rawResponse = await callAI(
      [
        { role: 'system', content: MEETING_SUMMARY_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 1500, temperature: 0.2 }
    );

    // 提取 JSON（处理 markdown 代码块包裹的情况）
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as MeetingSummary;

    // 数据验证和补全
    return {
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 5) : [],
      priceDiscussed: parsed.priceDiscussed || null,
      moqDiscussed: parsed.moqDiscussed || null,
      leadTime: parsed.leadTime || null,
      productsDiscussed: Array.isArray(parsed.productsDiscussed) ? parsed.productsDiscussed : [],
      followUpActions: Array.isArray(parsed.followUpActions) ? parsed.followUpActions.slice(0, 5) : [],
      buyerSentiment: ['positive', 'neutral', 'negative'].includes(parsed.buyerSentiment)
        ? parsed.buyerSentiment : 'neutral',
      dealProbability: Math.min(100, Math.max(0, Number(parsed.dealProbability) || 50)),
      nextStep: parsed.nextStep || 'Follow up with factory within 48 hours',
      rawSummary: parsed.rawSummary || '',
    };
  } catch (error) {
    console.error('❌ Failed to generate meeting summary:', error);
    return getDefaultSummary(context);
  }
}

function getDefaultSummary(context: { factoryName: string; buyerName: string; meetingTitle: string }): MeetingSummary {
  return {
    keyPoints: [
      `Meeting between ${context.buyerName} and ${context.factoryName}`,
      'Product showcase and initial discussion',
      'Pricing and MOQ to be confirmed',
    ],
    priceDiscussed: null,
    moqDiscussed: null,
    leadTime: null,
    productsDiscussed: [],
    followUpActions: [
      'Send formal inquiry with quantity requirements',
      'Request product samples',
      'Schedule follow-up meeting',
    ],
    buyerSentiment: 'neutral',
    dealProbability: 50,
    nextStep: 'Send formal inquiry to factory',
    rawSummary: `Initial sourcing meeting between ${context.buyerName} and ${context.factoryName}. Parties discussed product requirements and factory capabilities. Follow-up actions have been identified.`,
  };
}

// ── P1.2: AI 采购助理多轮对话 ─────────────────────────────────────────────────

const PROCUREMENT_ASSISTANT_SYSTEM_PROMPT = `You are RealSourcing's AI Procurement Assistant — an expert B2B sourcing advisor.
You help international buyers find the right Chinese manufacturers, evaluate factories, negotiate terms, and manage sample orders.

Your expertise:
- Product sourcing and supplier evaluation
- Price negotiation and MOQ optimization
- Quality control and certification requirements
- International shipping and logistics
- Sample order management
- Trade compliance and customs

Communication style: Professional, concise, actionable. Use bullet points for lists.
Language: Match the user's language (Chinese or English).

When relevant, suggest specific platform actions like:
- [VIEW_FACTORY:id] to view a factory profile
- [REQUEST_SAMPLE:productId] to request a sample
- [SEND_INQUIRY:factoryId] to send an inquiry
- [SCHEDULE_MEETING:factoryId] to schedule a meeting`;

export async function chatWithProcurementAssistant(
  messages: ChatMessage[],
  context?: {
    userRole?: string;
    currentPage?: string;
    recentMeetings?: string[];
    interestedCategories?: string[];
  }
): Promise<ProcurementChatResponse> {
  const systemMessage: ChatMessage = {
    role: 'system',
    content: PROCUREMENT_ASSISTANT_SYSTEM_PROMPT + (context ? `

User Context:
- Role: ${context.userRole || 'buyer'}
- Current page: ${context.currentPage || 'dashboard'}
- Recent meetings: ${context.recentMeetings?.join(', ') || 'none'}
- Interested categories: ${context.interestedCategories?.join(', ') || 'general'}` : ''),
  };

  const fullMessages: ChatMessage[] = [systemMessage, ...messages];

  try {
    const response = await callAI(fullMessages, {
      maxTokens: 800,
      temperature: 0.7,
    });

    // 提取建议操作
    const suggestedActions: string[] = [];
    const actionMatches = Array.from(response.matchAll(/\[(VIEW_FACTORY|REQUEST_SAMPLE|SEND_INQUIRY|SCHEDULE_MEETING):(\w+)\]/g));
    for (const match of actionMatches) {
      suggestedActions.push(`${match[1]}:${match[2]}`);
    }

    // 清理响应文本（移除 action 标记）
    const cleanContent = response.replace(/\[(VIEW_FACTORY|REQUEST_SAMPLE|SEND_INQUIRY|SCHEDULE_MEETING):\w+\]/g, '').trim();

    return {
      content: cleanContent,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
    };
  } catch (error) {
    console.error('❌ Procurement assistant error:', error);
    return {
      content: 'I apologize, I\'m having trouble connecting to the AI service right now. Please try again in a moment.',
    };
  }
}

// ── P1.3: Meeting Reel 关键时刻识别 ──────────────────────────────────────────

export interface ReelHighlight {
  startTime: string;   // "00:02:30"
  endTime: string;     // "00:03:15"
  title: string;       // "Price Negotiation Highlight"
  description: string; // 简短描述
  importance: 'high' | 'medium' | 'low';
  category: 'price' | 'product' | 'quality' | 'logistics' | 'general';
}

const REEL_HIGHLIGHT_SYSTEM_PROMPT = `You are an expert video editor for B2B procurement meetings.
Analyze the meeting transcript and identify the most compelling moments for a 30-60 second highlight reel.

Focus on:
- Price negotiations and agreements
- Product demonstrations and key features
- Quality standards and certifications
- Delivery terms and logistics
- Buyer's positive reactions

Output ONLY valid JSON array:
[{
  "startTime": "HH:MM:SS",
  "endTime": "HH:MM:SS",
  "title": "short title",
  "description": "1-2 sentence description",
  "importance": "high|medium|low",
  "category": "price|product|quality|logistics|general"
}]`;

export async function identifyReelHighlights(
  transcripts: Array<{ speakerName?: string | null; content: string; timestamp?: string | null }>,
  targetDurationSeconds: number = 45
): Promise<ReelHighlight[]> {
  if (!transcripts || transcripts.length < 3) {
    return [];
  }

  const transcriptText = transcripts
    .map(t => `[${t.timestamp || '00:00:00'}] ${t.speakerName || 'Speaker'}: ${t.content}`)
    .join('\n');

  const userPrompt = `Meeting transcript (${transcripts.length} segments):
${transcriptText.slice(0, 6000)}

Target reel duration: ~${targetDurationSeconds} seconds
Identify 3-5 highlight moments. Return JSON array.`;

  try {
    const response = await callAI(
      [
        { role: 'system', content: REEL_HIGHLIGHT_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 1000, temperature: 0.3 }
    );

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const highlights = JSON.parse(jsonMatch[0]) as ReelHighlight[];
    return highlights.filter(h => h.startTime && h.endTime && h.title).slice(0, 5);
  } catch (error) {
    console.error('❌ Failed to identify reel highlights:', error);
    return [];
  }
}

// ── 导出单例 ──────────────────────────────────────────────────────────────────

export const aiService = {
  generateMeetingSummary,
  chatWithProcurementAssistant,
  identifyReelHighlights,
  callAI,
};
