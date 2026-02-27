/**
 * RealSourcing 4.0 - 飞书集成服务 (FeishuClient)
 *
 * 功能：
 *   1. Bitable 多维表格搜索 — 从"全球工厂报价库"检索匹配报价
 *   2. 消息卡片发送 — 向运营群/买家发送结构化报价卡片
 *   3. Token 管理 — 自动刷新 tenant_access_token（2 小时有效期）
 *
 * 环境变量（需在 .env 中配置）：
 *   FEISHU_APP_ID        飞书应用 App ID
 *   FEISHU_APP_SECRET    飞书应用 App Secret
 *   FEISHU_BITABLE_APP_TOKEN  多维表格 App Token
 *   FEISHU_BITABLE_TABLE_ID   报价库 Table ID
 *   FEISHU_CHAT_ID       运营群 Chat ID（用于推送卡片）
 */

import axios from 'axios';

// ── 类型定义 ───────────────────────────────────────────────────────────────────

export interface FeishuQuoteRecord {
  recordId: string;
  factoryId: number;
  category: string;
  productName: string;
  unitPrice: number;
  moq: number;
  tierPricing: Array<{ qty: number; price: number }> | null;
  leadTimeDays: number;
  isVerified: boolean;
  lastUpdated: string;
}

export interface BitableSearchOptions {
  factoryId?: number;
  category?: string;
  maxResults?: number;
}

export interface SendCardOptions {
  chatId?: string;
  receiveId?: string;
  receiveIdType?: 'open_id' | 'user_id' | 'email' | 'chat_id';
  isVerified: boolean;
  factoryName: string;
  productName: string;
  unitPrice: number;
  currency?: string;
  moq: number;
  leadTimeDays: number;
  demandId: number;
  inquiryId?: number;
  rfqId?: number;
}

// ── Token 缓存 ─────────────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

// ── 飞书 API 基础配置 ──────────────────────────────────────────────────────────
const FEISHU_BASE_URL = 'https://open.feishu.cn/open-apis';

function getFeishuConfig() {
  return {
    appId: process.env.FEISHU_APP_ID ?? '',
    appSecret: process.env.FEISHU_APP_SECRET ?? '',
    bitableAppToken: process.env.FEISHU_BITABLE_APP_TOKEN ?? '',
    bitableTableId: process.env.FEISHU_BITABLE_TABLE_ID ?? '',
    chatId: process.env.FEISHU_CHAT_ID ?? '',
  };
}

// ── Token 管理 ─────────────────────────────────────────────────────────────────

/**
 * 获取 tenant_access_token（带缓存，自动刷新）
 */
export async function getFeishuToken(): Promise<string> {
  const now = Date.now();
  // 提前 5 分钟刷新
  if (cachedToken && now < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const { appId, appSecret } = getFeishuConfig();
  if (!appId || !appSecret) {
    throw new Error('[Feishu] FEISHU_APP_ID and FEISHU_APP_SECRET are required');
  }

  const response = await axios.post(
    `${FEISHU_BASE_URL}/auth/v3/tenant_access_token/internal`,
    { app_id: appId, app_secret: appSecret },
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (response.data.code !== 0) {
    throw new Error(`[Feishu] Token request failed: ${response.data.msg}`);
  }

  cachedToken = response.data.tenant_access_token;
  // 飞书 token 有效期约 7200 秒（2 小时）
  tokenExpiresAt = now + (response.data.expire ?? 7200) * 1000;

  console.log('[Feishu] Token refreshed, expires in', response.data.expire, 'seconds');
  return cachedToken!;
}

// ── Bitable 搜索 ───────────────────────────────────────────────────────────────

/**
 * 在飞书多维表格"全球工厂报价库"中搜索匹配报价
 *
 * 搜索策略：
 *   - 优先按 factoryId + category 精确匹配
 *   - 仅返回 is_verified=true 或 is_verified=false 的记录（不过滤，由调用方决定）
 *   - 按 last_updated 降序排列，返回最新报价
 */
export async function searchBitableQuotes(
  options: BitableSearchOptions
): Promise<FeishuQuoteRecord[]> {
  const { bitableAppToken, bitableTableId } = getFeishuConfig();
  if (!bitableAppToken || !bitableTableId) {
    console.warn('[Feishu] Bitable not configured, skipping search');
    return [];
  }

  const token = await getFeishuToken();

  // 构建过滤条件
  const filterConditions: any[] = [];
  if (options.factoryId) {
    filterConditions.push({
      field_name: 'factory_id',
      operator: 'is',
      value: [String(options.factoryId)],
    });
  }
  if (options.category) {
    filterConditions.push({
      field_name: 'category',
      operator: 'is',
      value: [options.category],
    });
  }

  const requestBody: any = {
    page_size: options.maxResults ?? 20,
    sort: [{ field_name: 'last_updated', desc: true }],
  };

  if (filterConditions.length > 0) {
    requestBody.filter = {
      conjunction: 'and',
      conditions: filterConditions,
    };
  }

  try {
    const response = await axios.post(
      `${FEISHU_BASE_URL}/bitable/v1/apps/${bitableAppToken}/tables/${bitableTableId}/records/search`,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.code !== 0) {
      console.error('[Feishu] Bitable search failed:', response.data.msg);
      return [];
    }

    const items: any[] = response.data.data?.items ?? [];
    return items.map(parseFeishuRecord).filter(Boolean) as FeishuQuoteRecord[];
  } catch (err: any) {
    console.error('[Feishu] Bitable search error:', err.message);
    return [];
  }
}

/**
 * 将飞书多维表格记录解析为标准格式
 */
function parseFeishuRecord(item: any): FeishuQuoteRecord | null {
  try {
    const fields = item.fields ?? {};
    const factoryId = Number(fields.factory_id?.value ?? fields.factory_id ?? 0);
    if (!factoryId) return null;

    let tierPricing: Array<{ qty: number; price: number }> | null = null;
    if (fields.tier_pricing) {
      try {
        tierPricing = JSON.parse(
          typeof fields.tier_pricing === 'string'
            ? fields.tier_pricing
            : JSON.stringify(fields.tier_pricing)
        );
      } catch {
        tierPricing = null;
      }
    }

    return {
      recordId: item.record_id,
      factoryId,
      category: String(fields.category?.value?.[0]?.text ?? fields.category ?? ''),
      productName: String(fields.product_name?.value ?? fields.product_name ?? ''),
      unitPrice: Number(fields.unit_price?.value ?? fields.unit_price ?? 0),
      moq: Number(fields.moq?.value ?? fields.moq ?? 0),
      tierPricing,
      leadTimeDays: Number(fields.lead_time?.value ?? fields.lead_time ?? 0),
      isVerified: Boolean(fields.is_verified?.value ?? fields.is_verified ?? false),
      lastUpdated: String(fields.last_updated?.value ?? fields.last_updated ?? ''),
    };
  } catch {
    return null;
  }
}

// ── 消息卡片发送 ───────────────────────────────────────────────────────────────

/**
 * 向飞书群/用户发送结构化报价卡片
 *
 * 卡片设计：
 *   - 认证工厂：绿色标题背景 + "✅ 认证工厂"标签
 *   - 非认证工厂：橙色标题背景 + "⚠️ 潜在供应商"标签
 *   - 交互按钮：接受报价（accept_quote）/ 微调需求（adjust_demand）
 */
export async function sendQuoteCard(options: SendCardOptions): Promise<{ messageId: string } | null> {
  const { chatId } = getFeishuConfig();
  const targetChatId = options.chatId ?? chatId;
  const receiveId = options.receiveId ?? targetChatId;
  const receiveIdType = options.receiveIdType ?? 'chat_id';

  if (!receiveId) {
    console.warn('[Feishu] No chat_id configured, skipping card send');
    return null;
  }

  const token = await getFeishuToken();

  const headerColor = options.isVerified ? 'green' : 'orange';
  const verifyBadge = options.isVerified ? '✅ 认证工厂' : '⚠️ 潜在供应商';
  const priceDisplay = `${options.currency ?? 'USD'} ${options.unitPrice.toFixed(2)}/unit`;

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: {
        tag: 'plain_text',
        content: `${verifyBadge} — ${options.factoryName}`,
      },
      template: headerColor,
    },
    elements: [
      {
        tag: 'div',
        fields: [
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**产品**\n${options.productName}` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**单价**\n${priceDisplay}` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**MOQ**\n${options.moq} units` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**交期**\n${options.leadTimeDays} 天` },
          },
        ],
      },
      { tag: 'hr' },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '✅ 接受报价' },
            type: 'primary',
            value: {
              action: 'accept_quote',
              demandId: options.demandId,
              inquiryId: options.inquiryId ?? null,
              rfqId: options.rfqId ?? null,
            },
          },
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '✏️ 微调需求' },
            type: 'default',
            url: `${process.env.VITE_APP_URL ?? 'https://realsourcing.com'}/sourcing-room/${options.demandId}`,
          },
        ],
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `需求 ID: ${options.demandId} | 由 RealSourcing AI 自动匹配`,
          },
        ],
      },
    ],
  };

  try {
    const response = await axios.post(
      `${FEISHU_BASE_URL}/im/v1/messages?receive_id_type=${receiveIdType}`,
      {
        receive_id: receiveId,
        msg_type: 'interactive',
        content: JSON.stringify(card),
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.code !== 0) {
      console.error('[Feishu] Send card failed:', response.data.msg);
      return null;
    }

    const messageId = response.data.data?.message_id;
    console.log(`✅ [Feishu] Quote card sent to ${receiveId}, messageId: ${messageId}`);
    return { messageId };
  } catch (err: any) {
    console.error('[Feishu] Send card error:', err.message);
    return null;
  }
}

/**
 * 向运营群发送"空品类告警"卡片
 * 当买家搜索到无报价的品类时触发
 */
export async function sendEmptyCategoryAlert(options: {
  category: string;
  demandId: number;
  buyerName?: string;
}): Promise<void> {
  const { chatId } = getFeishuConfig();
  if (!chatId) return;

  const token = await getFeishuToken();

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '🔔 新品类采购需求 — 需要人工邀约' },
      template: 'yellow',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**品类**: ${options.category}\n**需求 ID**: ${options.demandId}\n**买家**: ${options.buyerName ?? '匿名用户'}\n\n当前报价库中暂无该品类工厂，请运营同学主动邀约！`,
        },
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '📋 查看需求详情' },
            type: 'primary',
            url: `${process.env.VITE_APP_URL ?? 'https://realsourcing.com'}/sourcing-room/${options.demandId}`,
          },
        ],
      },
    ],
  };

  try {
    await axios.post(
      `${FEISHU_BASE_URL}/im/v1/messages?receive_id_type=chat_id`,
      {
        receive_id: chatId,
        msg_type: 'interactive',
        content: JSON.stringify(card),
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    console.log(`✅ [Feishu] Empty category alert sent for demand ${options.demandId}`);
  } catch (err: any) {
    console.error('[Feishu] Empty category alert error:', err.message);
  }
}

/**
 * 向运营群发送"报价超时告警"卡片
 * 当 Open Claw 30 分钟未返回数据时触发
 */
export async function sendQuoteTimeoutAlert(options: {
  demandId: number;
  factoryId: number;
  factoryName?: string;
  elapsedMinutes: number;
}): Promise<void> {
  const { chatId } = getFeishuConfig();
  if (!chatId) return;

  const token = await getFeishuToken();

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '⏰ 报价超时告警 — AI 正在深度联络工厂' },
      template: 'red',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**需求 ID**: ${options.demandId}\n**工厂 ID**: ${options.factoryId}${options.factoryName ? ` (${options.factoryName})` : ''}\n**已等待**: ${options.elapsedMinutes} 分钟\n\nOpen Claw Agent 正在深度联络工厂，请稍等。若 60 分钟仍无响应，请人工介入。`,
        },
      },
    ],
  };

  try {
    await axios.post(
      `${FEISHU_BASE_URL}/im/v1/messages?receive_id_type=chat_id`,
      {
        receive_id: chatId,
        msg_type: 'interactive',
        content: JSON.stringify(card),
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    console.log(`✅ [Feishu] Quote timeout alert sent for demand ${options.demandId}`);
  } catch (err: any) {
    console.error('[Feishu] Quote timeout alert error:', err.message);
  }
}

/**
 * 向 Bitable 写入/更新报价记录（供 Open Claw 回调后同步）
 */
export async function upsertBitableQuote(record: Omit<FeishuQuoteRecord, 'recordId'> & { recordId?: string }): Promise<string | null> {
  const { bitableAppToken, bitableTableId } = getFeishuConfig();
  if (!bitableAppToken || !bitableTableId) return null;

  const token = await getFeishuToken();

  const fields = {
    factory_id: record.factoryId,
    category: record.category,
    product_name: record.productName,
    unit_price: record.unitPrice,
    moq: record.moq,
    tier_pricing: record.tierPricing ? JSON.stringify(record.tierPricing) : '',
    lead_time: record.leadTimeDays,
    is_verified: record.isVerified,
    last_updated: record.lastUpdated || new Date().toISOString().split('T')[0],
  };

  try {
    if (record.recordId) {
      // 更新现有记录
      await axios.put(
        `${FEISHU_BASE_URL}/bitable/v1/apps/${bitableAppToken}/tables/${bitableTableId}/records/${record.recordId}`,
        { fields },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      return record.recordId;
    } else {
      // 创建新记录
      const response = await axios.post(
        `${FEISHU_BASE_URL}/bitable/v1/apps/${bitableAppToken}/tables/${bitableTableId}/records`,
        { fields },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      return response.data.data?.record?.record_id ?? null;
    }
  } catch (err: any) {
    console.error('[Feishu] Upsert Bitable record error:', err.message);
    return null;
  }
}

/**
 * 向工厂发送"报价被拒绝"飞书卡片
 * 当买家拒绝报价时触发，告知工厂原因并引导重新报价
 */
export async function sendQuoteRejectedCard(options: {
  factoryId: number;
  factoryName: string;
  inquiryId: number;
  demandId: number;
  reason: string;
  unitPrice: number;
  currency: string;
}): Promise<void> {
  const { chatId } = getFeishuConfig();
  if (!chatId) {
    console.warn('[Feishu] No chat_id configured, skipping quote rejected card');
    return;
  }

  const token = await getFeishuToken();
  const appUrl = process.env.VITE_APP_URL ?? 'https://realsourcing.com';

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '❌ 报价未被接受 — 请调整后重新报价' },
      template: 'red',
    },
    elements: [
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: `**工厂**: ${options.factoryName}\n**询价 ID**: ${options.inquiryId}\n**您的报价**: ${options.currency} ${options.unitPrice.toFixed(2)}/unit\n\n**买家反馈**:\n> ${options.reason}`,
        },
      },
      { tag: 'hr' },
      {
        tag: 'div',
        text: {
          tag: 'lark_md',
          content: '💡 **建议**：您可以调整单价、MOQ 或交期后重新提交报价，或通过沟通室与买家直接沟通。',
        },
      },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '🔄 重新提交报价' },
            type: 'primary',
            url: `${appUrl}/factory/dashboard?tab=inquiries&inquiryId=${options.inquiryId}`,
          },
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '💬 联系买家' },
            type: 'default',
            url: `${appUrl}/sourcing-room/${options.demandId}`,
          },
        ],
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `需求 ID: ${options.demandId} | 询价 ID: ${options.inquiryId} | 由 RealSourcing 自动通知`,
          },
        ],
      },
    ],
  };

  try {
    await axios.post(
      `${FEISHU_BASE_URL}/im/v1/messages?receive_id_type=chat_id`,
      {
        receive_id: chatId,
        msg_type: 'interactive',
        content: JSON.stringify(card),
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    console.log(`✅ [Feishu] Quote rejected card sent for inquiry ${options.inquiryId}`);
  } catch (err: any) {
    console.error('[Feishu] Quote rejected card error:', err.message);
  }
}

/**
 * 向运营群发送"采购单已创建"飞书卡片
 * 当买家接受报价后自动生成采购单时触发
 */
export async function sendPurchaseOrderCreatedCard(options: {
  poNumber: string;
  buyerId: number;
  buyerName?: string;
  factoryId: number;
  factoryName?: string;
  productName?: string;
  quantity?: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  leadTimeDays: number;
  expectedDelivery: Date;
}): Promise<void> {
  const { chatId } = getFeishuConfig();
  if (!chatId) return;

  const token = await getFeishuToken();
  const appUrl = process.env.VITE_APP_URL ?? 'https://realsourcing.com';
  const deliveryStr = options.expectedDelivery.toISOString().split('T')[0];

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `🎉 新采购单已创建 — ${options.poNumber}` },
      template: 'green',
    },
    elements: [
      {
        tag: 'div',
        fields: [
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**买家**\n${options.buyerName ?? `ID: ${options.buyerId}`}` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**工厂**\n${options.factoryName ?? `ID: ${options.factoryId}`}` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**产品**\n${options.productName ?? '未指定'}` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**数量**\n${options.quantity ?? 1} 件` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**单价**\n${options.currency} ${options.unitPrice.toFixed(2)}` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**总金额**\n${options.currency} ${options.totalAmount.toFixed(2)}` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**交期**\n${options.leadTimeDays} 天` },
          },
          {
            is_short: true,
            text: { tag: 'lark_md', content: `**预计交货**\n${deliveryStr}` },
          },
        ],
      },
      { tag: 'hr' },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '📋 查看采购单详情' },
            type: 'primary',
            url: `${appUrl}/purchase-orders/${options.poNumber}`,
          },
        ],
      },
      {
        tag: 'note',
        elements: [
          {
            tag: 'plain_text',
            content: `采购单号: ${options.poNumber} | 由 RealSourcing 自动生成`,
          },
        ],
      },
    ],
  };

  try {
    await axios.post(
      `${FEISHU_BASE_URL}/im/v1/messages?receive_id_type=chat_id`,
      {
        receive_id: chatId,
        msg_type: 'interactive',
        content: JSON.stringify(card),
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    console.log(`✅ [Feishu] PO created card sent for ${options.poNumber}`);
  } catch (err: any) {
    console.error('[Feishu] PO created card error:', err.message);
  }
}


// ── 4.3 定制报价：发送定制询价通知给工厂 ──────────────────────────────────────
/**
 * sendCustomRfqToFactory
 * 当买家提交定制报价请求时，通过飞书卡片通知工厂
 */
export async function sendCustomRfqToFactory(params: {
  factoryName: string;
  productName: string;
  rfqId: number;
  description: string;
}): Promise<void> {
  const { chatId } = getFeishuConfig();
  if (!chatId) {
    console.warn('[Feishu] FEISHU_CHAT_ID not configured, skipping custom RFQ notification');
    return;
  }

  const token = await getFeishuToken();

  const card = {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '🎨 新定制询价请求' },
      template: 'purple',
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { tag: 'lark_md', content: `**工厂**\n${params.factoryName}` } },
          { is_short: true, text: { tag: 'lark_md', content: `**询价单号**\nRFQ-${params.rfqId}` } },
          { is_short: false, text: { tag: 'lark_md', content: `**产品**\n${params.productName}` } },
          { is_short: false, text: { tag: 'lark_md', content: `**需求描述**\n${params.description}` } },
        ],
      },
      { tag: 'hr' },
      {
        tag: 'note',
        elements: [
          { tag: 'plain_text', content: '⚡ 定制询价通常需要 1-3 个工作日报价，请尽快查看并回复' },
        ],
      },
    ],
  };

  try {
    await axios.post(
      `${FEISHU_BASE_URL}/im/v1/messages?receive_id_type=chat_id`,
      {
        receive_id: chatId,
        msg_type: 'interactive',
        content: JSON.stringify(card),
      },
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    console.log(`✅ [Feishu] Custom RFQ #${params.rfqId} notification sent to factory: ${params.factoryName}`);
  } catch (e: any) {
    console.warn('[Feishu] sendCustomRfqToFactory failed:', e.message);
  }
}
