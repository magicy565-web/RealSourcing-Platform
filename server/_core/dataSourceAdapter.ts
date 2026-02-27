/**
 * RealSourcing 4.1 - Data Source Adapter Architecture
 *
 * OpenClaw Agent 数据源适配器抽象层
 *
 * 设计原则：
 *   - 每个工厂可配置多个数据源（飞书、ERP、邮件、网站等）
 *   - 适配器统一返回 QuoteData 格式，屏蔽底层差异
 *   - 支持优先级排序：飞书 > ERP > 邮件 > 网站
 *   - 失败时自动 fallback 到下一个适配器
 *
 * 扩展方式：
 *   1. 实现 IDataSourceAdapter 接口
 *   2. 在 adapterRegistry 中注册
 *   3. OpenClaw Agent 注册时声明支持的适配器类型
 */

// ── 核心类型定义 ──────────────────────────────────────────────────────────────

/** 标准化报价数据（所有适配器的统一输出格式） */
export interface QuoteData {
  unitPrice: number;
  currency: string;
  moq: number;
  leadTimeDays: number;
  tierPricing?: Array<{ qty: number; price: number }>;
  paymentTerms?: string;
  shippingTerms?: string;
  factoryNotes?: string;
  productName?: string;
  isVerified: boolean;
  dataSource: DataSourceType;
  confidence: number; // 0-1，数据可信度评分
  rawData?: Record<string, unknown>; // 原始数据（用于调试）
}

/** 数据源类型枚举 */
export type DataSourceType =
  | 'feishu_bitable'   // 飞书多维表格（优先级最高）
  | 'feishu_doc'       // 飞书文档
  | 'erp_api'          // ERP 系统 API
  | 'email_parser'     // 邮件解析
  | 'website_scraper'  // 网站爬取
  | 'manual_input';    // 人工录入

/** 数据源能力声明（Agent 注册时上报） */
export interface DataSourceCapability {
  type: DataSourceType;
  isConfigured: boolean;
  priority: number; // 1=最高优先级
  config?: {
    bitableAppToken?: string;   // 飞书 Bitable App Token
    bitableTableId?: string;    // 飞书 Bitable Table ID
    erpEndpoint?: string;       // ERP API 端点
    emailAddress?: string;      // 邮件地址（用于解析）
    websiteUrl?: string;        // 网站 URL
  };
  lastSyncAt?: string;          // 最后同步时间
  recordCount?: number;         // 数据记录数量
}

/** 适配器查询参数 */
export interface AdapterQueryParams {
  factoryId: number;
  category: string;
  productName: string;
  quantity?: number;
  targetPrice?: number;
  buyerCountry?: string;
  demandId: number;
}

/** 适配器查询结果 */
export interface AdapterResult {
  success: boolean;
  data?: QuoteData;
  error?: string;
  source: DataSourceType;
  latencyMs: number;
}

// ── 适配器接口 ────────────────────────────────────────────────────────────────

/**
 * 数据源适配器接口
 * 所有具体适配器必须实现此接口
 */
export interface IDataSourceAdapter {
  readonly type: DataSourceType;
  readonly priority: number;

  /**
   * 检查适配器是否可用（配置完整且连接正常）
   */
  isAvailable(): Promise<boolean>;

  /**
   * 从数据源查询报价
   * @returns AdapterResult 包含标准化报价数据或错误信息
   */
  fetchQuote(params: AdapterQueryParams): Promise<AdapterResult>;

  /**
   * 将报价写回数据源（可选，支持双向同步）
   */
  writeQuote?(data: QuoteData, params: AdapterQueryParams): Promise<boolean>;
}

// ── 飞书 Bitable 适配器 ───────────────────────────────────────────────────────

/**
 * FeishuBitableAdapter
 * 从飞书多维表格读取工厂报价数据
 *
 * 字段映射（与实际 Bitable 表格对齐）：
 *   产品名称 → productName
 *   品类     → category
 *   单价     → unitPrice
 *   最小起订量 → moq
 *   交货期（天）→ leadTimeDays
 *   货币     → currency
 *   付款方式 → paymentTerms
 *   运输条款 → shippingTerms
 *   阶梯报价 → tierPricing (JSON)
 *   验证状态 → isVerified
 *   更新时间 → lastUpdated
 */
export class FeishuBitableAdapter implements IDataSourceAdapter {
  readonly type: DataSourceType = 'feishu_bitable';
  readonly priority = 1;

  async isAvailable(): Promise<boolean> {
    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;
    const bitableAppToken = process.env.FEISHU_BITABLE_APP_TOKEN;
    const bitableTableId = process.env.FEISHU_BITABLE_TABLE_ID;
    return !!(appId && appSecret && bitableAppToken && bitableTableId);
  }

  async fetchQuote(params: AdapterQueryParams): Promise<AdapterResult> {
    const startTime = Date.now();
    try {
      const { searchBitableQuotes } = await import('./feishuService');
      const quotes = await searchBitableQuotes({
        factoryId: params.factoryId,
        category: params.category,
        maxResults: 5,
      });

      if (!quotes || quotes.length === 0) {
        return {
          success: false,
          error: `No quotes found in Feishu Bitable for factory #${params.factoryId}, category: ${params.category}`,
          source: this.type,
          latencyMs: Date.now() - startTime,
        };
      }

      // 选择最匹配的报价（优先选择已验证的、最新的）
      const best = quotes
        .filter(q => !q.isExpired)
        .sort((a, b) => {
          // 优先已验证
          if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
          // 其次按更新时间排序
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        })[0];

      if (!best) {
        return {
          success: false,
          error: 'All quotes are expired',
          source: this.type,
          latencyMs: Date.now() - startTime,
        };
      }

      const isExpired = this._isQuoteExpired(best.lastUpdated);
      const confidence = this._calculateConfidence(best, isExpired);

      return {
        success: true,
        data: {
          unitPrice: best.unitPrice,
          currency: 'USD',
          moq: best.moq,
          leadTimeDays: best.leadTimeDays,
          tierPricing: best.tierPricing ?? undefined,
          productName: best.productName,
          isVerified: best.isVerified,
          dataSource: this.type,
          confidence,
          rawData: { recordId: best.recordId, lastUpdated: best.lastUpdated },
        },
        source: this.type,
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        source: this.type,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  async writeQuote(data: QuoteData, params: AdapterQueryParams): Promise<boolean> {
    try {
      const { upsertBitableQuote } = await import('./feishuService');
      await upsertBitableQuote({
        factoryId: params.factoryId,
        category: params.category,
        productName: data.productName ?? params.productName,
        unitPrice: data.unitPrice,
        moq: data.moq,
        tierPricing: data.tierPricing ?? null,
        leadTimeDays: data.leadTimeDays,
        isVerified: data.isVerified,
        lastUpdated: new Date().toISOString().split('T')[0],
      });
      return true;
    } catch {
      return false;
    }
  }

  private _isQuoteExpired(lastUpdated: string): boolean {
    const EXPIRY_DAYS = 90;
    const updatedAt = new Date(lastUpdated).getTime();
    const now = Date.now();
    return (now - updatedAt) > EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  }

  private _calculateConfidence(
    quote: { isVerified: boolean; lastUpdated: string },
    isExpired: boolean
  ): number {
    let score = 0.5;
    if (quote.isVerified) score += 0.3;
    if (!isExpired) score += 0.2;
    return Math.min(1, score);
  }
}

// ── ERP API 适配器（预留扩展） ────────────────────────────────────────────────

/**
 * ErpApiAdapter
 * 通过工厂 ERP 系统 API 获取实时报价
 * 目前为占位实现，待工厂提供 API 文档后完善
 */
export class ErpApiAdapter implements IDataSourceAdapter {
  readonly type: DataSourceType = 'erp_api';
  readonly priority = 2;

  private readonly endpoint: string;
  private readonly apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  async isAvailable(): Promise<boolean> {
    return !!(this.endpoint && this.apiKey);
  }

  async fetchQuote(params: AdapterQueryParams): Promise<AdapterResult> {
    const startTime = Date.now();
    // TODO: 实现 ERP API 调用
    // 每个工厂的 ERP 接口不同，需要工厂提供文档后定制化实现
    return {
      success: false,
      error: 'ERP adapter not yet implemented for this factory',
      source: this.type,
      latencyMs: Date.now() - startTime,
    };
  }
}

// ── 邮件解析适配器（预留扩展） ────────────────────────────────────────────────

/**
 * EmailParserAdapter
 * 解析工厂邮件中的报价信息（使用 AI 提取）
 * 适用于没有 API 的传统工厂
 */
export class EmailParserAdapter implements IDataSourceAdapter {
  readonly type: DataSourceType = 'email_parser';
  readonly priority = 3;

  async isAvailable(): Promise<boolean> {
    // TODO: 检查邮件服务配置
    return false;
  }

  async fetchQuote(params: AdapterQueryParams): Promise<AdapterResult> {
    const startTime = Date.now();
    // TODO: 实现邮件解析逻辑
    // 1. 连接 IMAP/Gmail API
    // 2. 搜索来自工厂的最新报价邮件
    // 3. 使用 AI 提取结构化报价数据
    return {
      success: false,
      error: 'Email parser adapter not yet implemented',
      source: this.type,
      latencyMs: Date.now() - startTime,
    };
  }
}

// ── 适配器注册表 ──────────────────────────────────────────────────────────────

/**
 * DataSourceAdapterRegistry
 * 管理所有已注册的数据源适配器
 * 支持按优先级排序和 fallback 链
 */
export class DataSourceAdapterRegistry {
  private adapters: Map<DataSourceType, IDataSourceAdapter> = new Map();

  register(adapter: IDataSourceAdapter): void {
    this.adapters.set(adapter.type, adapter);
    console.log(`[AdapterRegistry] Registered adapter: ${adapter.type} (priority: ${adapter.priority})`);
  }

  getAdapter(type: DataSourceType): IDataSourceAdapter | undefined {
    return this.adapters.get(type);
  }

  /**
   * 按优先级排序获取所有可用适配器
   */
  async getAvailableAdapters(): Promise<IDataSourceAdapter[]> {
    const available: IDataSourceAdapter[] = [];
    for (const adapter of this.adapters.values()) {
      if (await adapter.isAvailable()) {
        available.push(adapter);
      }
    }
    return available.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 按优先级顺序尝试所有适配器，返回第一个成功的结果
   * 这是 OpenClaw Agent 的核心 fallback 机制
   */
  async fetchWithFallback(params: AdapterQueryParams): Promise<AdapterResult> {
    const available = await this.getAvailableAdapters();

    if (available.length === 0) {
      return {
        success: false,
        error: 'No data source adapters available',
        source: 'feishu_bitable',
        latencyMs: 0,
      };
    }

    let lastError = '';
    for (const adapter of available) {
      console.log(`[AdapterRegistry] Trying adapter: ${adapter.type}`);
      const result = await adapter.fetchQuote(params);
      if (result.success) {
        console.log(`[AdapterRegistry] ✅ Got quote from ${adapter.type} (confidence: ${result.data?.confidence})`);
        return result;
      }
      lastError = result.error ?? 'Unknown error';
      console.warn(`[AdapterRegistry] ⚠️ Adapter ${adapter.type} failed: ${lastError}`);
    }

    return {
      success: false,
      error: `All adapters failed. Last error: ${lastError}`,
      source: available[available.length - 1]?.type ?? 'feishu_bitable',
      latencyMs: 0,
    };
  }
}

// ── 全局默认注册表（单例） ────────────────────────────────────────────────────

let _defaultRegistry: DataSourceAdapterRegistry | null = null;

export function getDefaultAdapterRegistry(): DataSourceAdapterRegistry {
  if (!_defaultRegistry) {
    _defaultRegistry = new DataSourceAdapterRegistry();
    // 注册默认适配器
    _defaultRegistry.register(new FeishuBitableAdapter());
    // ERP 和邮件适配器在工厂配置后动态注册
  }
  return _defaultRegistry;
}

/**
 * 为特定工厂创建定制化注册表
 * 根据工厂的 OpenClaw Agent 能力声明动态配置
 */
export function createFactoryAdapterRegistry(
  capabilities: DataSourceCapability[]
): DataSourceAdapterRegistry {
  const registry = new DataSourceAdapterRegistry();

  for (const cap of capabilities) {
    if (!cap.isConfigured) continue;

    switch (cap.type) {
      case 'feishu_bitable':
        registry.register(new FeishuBitableAdapter());
        break;
      case 'erp_api':
        if (cap.config?.erpEndpoint) {
          registry.register(new ErpApiAdapter(
            cap.config.erpEndpoint,
            process.env.CLAW_AGENT_SECRET ?? ''
          ));
        }
        break;
      case 'email_parser':
        registry.register(new EmailParserAdapter());
        break;
      default:
        console.warn(`[AdapterRegistry] Unknown adapter type: ${cap.type}`);
    }
  }

  return registry;
}
