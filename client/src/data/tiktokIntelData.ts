/**
 * tiktokIntelData.ts
 *
 * 精进点4：TikTok 爆款情报数据配置
 *
 * 设计原则：
 * - 硬编码数据，不依赖第三方 API，保证跨国直播 100% 稳定
 * - 在前台展示时看起来像实时拉取的全息数据
 * - 迪拜专场前，将此文件中的数据替换为实际选品即可
 * - 视频文件存储在阿里云 OSS，不依赖 TikTok CDN
 *
 * 更新方式：
 * 1. 将 TikTok 爆款视频下载到本地
 * 2. 上传至阿里云 OSS bucket: demand-os-discord
 * 3. 更新 videoUrl 字段为 OSS 直链
 * 4. 同步更新 tiktokViews / tiktokLikes 等病毒指数
 */

export interface TikTokProduct {
  id: number;
  /** 产品中文名 */
  name: string;
  /** 产品英文名 */
  nameEn: string;
  /** 产品 Emoji 图标 */
  emoji: string;
  /** 产品分类 */
  category: string;
  /** TikTok 视频播放量（格式化字符串，如 "48.2M"） */
  tiktokViews: string;
  /** TikTok 点赞量 */
  tiktokLikes: string;
  /** TikTok 评论量 */
  tiktokComments: string;
  /** TikTok 分享量 */
  tiktokShares: string;
  /** 病毒指数（0-100） */
  viralScore: number;
  /** 点击转化率 */
  ctr: string;
  /** 周增长趋势 */
  trend: string;
  /** 工厂底价（含单位） */
  price: string;
  /** 最小起订量 */
  moq: string;
  /** 剩余测试批次名额 */
  slots: number;
  /** 总测试批次名额 */
  totalSlots: number;
  /**
   * 阿里云 OSS 存储的 TikTok 爆款视频 URL
   * 格式：https://demand-os-discord.oss-cn-hangzhou.aliyuncs.com/tiktok-intel/{filename}
   * 早期演示阶段使用缩略图占位，正式演示前替换为实际视频
   */
  videoUrl: string;
  /** 视频缩略图 URL（用于加载视频前的占位图） */
  videoThumb: string;
  /** 目标市场 */
  targetMarket: string[];
  /** 工厂认证 */
  certifications: string[];
  /** 发货周期 */
  leadTime: string;
  /** 定制支持 */
  customizable: boolean;
  /** 一件代发支持 */
  dropshipping: boolean;
}

/**
 * 迪拜专场三款爆款产品数据
 * 数据来源：TikTok 选品工具 + 工厂报价单（2026-02-22）
 */
export const DUBAI_SESSION_PRODUCTS: TikTokProduct[] = [
  {
    id: 1,
    name: 'LED美白面膜仪',
    nameEn: 'LED Glow Therapy Mask',
    emoji: '✨',
    category: '美妆仪器',
    tiktokViews: '48.2M',
    tiktokLikes: '3.1M',
    tiktokComments: '284K',
    tiktokShares: '1.2M',
    viralScore: 98,
    ctr: '12.4%',
    trend: '+340% this week',
    price: '$8.50',
    moq: '50 pcs',
    slots: 3,
    totalSlots: 10,
    // 替换为实际 OSS 视频链接：
    // videoUrl: 'https://demand-os-discord.oss-cn-hangzhou.aliyuncs.com/tiktok-intel/led-mask-viral.mp4',
    videoUrl: 'https://picsum.photos/seed/ledmask/400/700',
    videoThumb: 'https://picsum.photos/seed/ledmask/400/700',
    targetMarket: ['UAE', 'Saudi Arabia', 'Kuwait', 'Qatar'],
    certifications: ['CE', 'FDA', 'RoHS'],
    leadTime: '7-10 days',
    customizable: true,
    dropshipping: true,
  },
  {
    id: 2,
    name: '磁吸无线充电器',
    nameEn: 'MagSafe Wireless Charger Pro',
    emoji: '⚡',
    category: '数码配件',
    tiktokViews: '31.7M',
    tiktokLikes: '2.4M',
    tiktokComments: '198K',
    tiktokShares: '876K',
    viralScore: 94,
    ctr: '9.8%',
    trend: '+210% this week',
    price: '$6.20',
    moq: '100 pcs',
    slots: 5,
    totalSlots: 15,
    // videoUrl: 'https://demand-os-discord.oss-cn-hangzhou.aliyuncs.com/tiktok-intel/magsafe-charger-viral.mp4',
    videoUrl: 'https://picsum.photos/seed/charger/400/700',
    videoThumb: 'https://picsum.photos/seed/charger/400/700',
    targetMarket: ['UAE', 'UK', 'US', 'Australia'],
    certifications: ['CE', 'FCC', 'MFi'],
    leadTime: '5-7 days',
    customizable: true,
    dropshipping: true,
  },
  {
    id: 3,
    name: '迷你空气炸锅',
    nameEn: 'Compact Air Fryer 2.5L',
    emoji: '🍟',
    category: '小家电',
    tiktokViews: '22.9M',
    tiktokLikes: '1.8M',
    tiktokComments: '156K',
    tiktokShares: '623K',
    viralScore: 89,
    ctr: '8.1%',
    trend: '+180% this week',
    price: '$12.80',
    moq: '30 pcs',
    slots: 7,
    totalSlots: 20,
    // videoUrl: 'https://demand-os-discord.oss-cn-hangzhou.aliyuncs.com/tiktok-intel/mini-airfryer-viral.mp4',
    videoUrl: 'https://picsum.photos/seed/airfryer/400/700',
    videoThumb: 'https://picsum.photos/seed/airfryer/400/700',
    targetMarket: ['UAE', 'Saudi Arabia', 'Egypt', 'Jordan'],
    certifications: ['CE', 'GS', 'ETL'],
    leadTime: '10-14 days',
    customizable: false,
    dropshipping: true,
  },
];

/**
 * 根据 ID 获取产品数据
 */
export function getProductById(id: number): TikTokProduct | undefined {
  return DUBAI_SESSION_PRODUCTS.find((p) => p.id === id);
}

/**
 * 获取病毒指数颜色
 * 98-100: 红色（极度爆款）
 * 90-97: 橙色（高度爆款）
 * 80-89: 黄色（趋势爆款）
 * <80: 绿色（潜力爆款）
 */
export function getViralScoreColor(score: number): string {
  if (score >= 98) return 'text-red-400';
  if (score >= 90) return 'text-orange-400';
  if (score >= 80) return 'text-yellow-400';
  return 'text-green-400';
}

/**
 * 格式化播放量数字
 * 48200000 → "48.2M"
 */
export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`;
  return views.toString();
}
