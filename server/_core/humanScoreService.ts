/**
 * RealSourcing 人工评分服务 (Human Scoring Service)
 *
 * 完整流水线：
 *   买家交易评价 + Webinar 社区投票 + 专家评审 → 加权计算 → 人工总分 × 0.4 → FTGI 贡献值
 *
 * 三个子模块及权重：
 *   模块一：买家交易后评分   50% (占人工分)
 *   模块二：社区 Webinar 投票 30% (占人工分)
 *   模块三：专家评审团打分   20% (占人工分)
 *
 * 最终公式：
 *   Human Score = (交易评分 × 0.5) + (Webinar 投票分 × 0.3) + (专家评审分 × 0.2)
 *   FTGI 贡献  = Human Score × 0.4
 */

import { eq, desc, sql as drizzleSql } from "drizzle-orm";
import {
  factoryReviewsV2,
  webinarPolls,
  webinarPollVotes,
  expertReviews,
  factoryHumanScores,
  webinarParticipants,
} from "../../drizzle/schema";

// ── 常量 ──────────────────────────────────────────────────────────────────────
export const HUMAN_COEFFICIENT = 0.4; // 人工评分对 FTGI 的贡献系数

const MODULE_WEIGHTS = {
  reviews:  0.50, // 买家交易后评分
  webinars: 0.30, // 社区 Webinar 投票
  experts:  0.20, // 专家评审团打分
} as const;

// 时间衰减参数：90 天内的评价权重最高，超过 365 天权重减半
const DECAY_HALF_LIFE_DAYS = 180;

// ── 工具函数 ──────────────────────────────────────────────────────────────────
function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/** 计算时间衰减权重：越近的评价权重越高 */
function timeDecayWeight(createdAt: Date): number {
  const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageInDays / DECAY_HALF_LIFE_DAYS);
}

/** 获取数据库连接 */
async function getDb() {
  const { db, dbPromise } = await import("../db");
  if (db) return db;
  return await dbPromise;
}

// ── 模块一：买家交易后评分 ────────────────────────────────────────────────────
/**
 * 计算买家交易评分（满分 100）
 *
 * 算法：
 * 1. 获取工厂所有 v2 评价
 * 2. 对每条评价计算五维度平均分（1-5星）并转化为百分制
 * 3. 按时间衰减加权平均
 * 4. 置信度修正：评价数量 < 5 时适当降低分数
 */
async function calculateReviewScore(factoryId: number): Promise<{
  score: number;
  count: number;
  breakdown: { communication: number; quality: number; leadTime: number; service: number };
}> {
  const database = await getDb();
  const reviews = await database
    .select()
    .from(factoryReviewsV2)
    .where(eq(factoryReviewsV2.factoryId, factoryId))
    .orderBy(desc(factoryReviewsV2.createdAt));

  if (reviews.length === 0) {
    return { score: 0, count: 0, breakdown: { communication: 0, quality: 0, leadTime: 0, service: 0 } };
  }

  let totalWeight = 0;
  let weightedScore = 0;
  let sumCommunication = 0;
  let sumQuality = 0;
  let sumLeadTime = 0;
  let sumService = 0;

  for (const review of reviews) {
    // 五维平均分（1-5星）
    const avgRating = (
      review.ratingOverall * 2 +       // 总体评价权重 ×2
      review.ratingCommunication +
      review.ratingQuality +
      review.ratingLeadTime +
      review.ratingService
    ) / 6;

    // 转为百分制 (1-5 → 0-100)
    const score100 = ((avgRating - 1) / 4) * 100;

    // 已验证购买的评价权重加倍
    const verifiedBonus = review.isVerifiedPurchase ? 2.0 : 1.0;
    const weight = timeDecayWeight(review.createdAt) * verifiedBonus;

    weightedScore += score100 * weight;
    totalWeight += weight;

    sumCommunication += review.ratingCommunication;
    sumQuality += review.ratingQuality;
    sumLeadTime += review.ratingLeadTime;
    sumService += review.ratingService;
  }

  const rawScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  // 置信度修正：评价数量不足时适当降低（最少 5 条才达到满置信度）
  const confidenceFactor = Math.min(reviews.length / 5, 1.0);
  const finalScore = clamp(rawScore * (0.6 + 0.4 * confidenceFactor));

  const n = reviews.length;
  return {
    score: finalScore,
    count: n,
    breakdown: {
      communication: clamp(((sumCommunication / n) - 1) / 4 * 100),
      quality:       clamp(((sumQuality / n) - 1) / 4 * 100),
      leadTime:      clamp(((sumLeadTime / n) - 1) / 4 * 100),
      service:       clamp(((sumService / n) - 1) / 4 * 100),
    },
  };
}

// ── 模块二：社区 Webinar 投票分 ───────────────────────────────────────────────
/**
 * 计算 Webinar 社区投票分（满分 100）
 *
 * 算法：
 * 1. 获取工厂所有 Webinar 的投票记录
 * 2. 统计每个投票的"正面选项"比例（选项索引 0 = 最正面）
 * 3. 按投票人数加权平均
 * 4. 参与人数越多，分数越可信
 */
async function calculateWebinarScore(factoryId: number): Promise<{
  score: number;
  totalVotes: number;
  pollCount: number;
}> {
  const database = await getDb();

  // 获取工厂相关的所有已关闭投票
  const polls = await database
    .select()
    .from(webinarPolls)
    .where(eq(webinarPolls.factoryId, factoryId));

  if (polls.length === 0) {
    return { score: 0, totalVotes: 0, pollCount: 0 };
  }

  let totalWeightedScore = 0;
  let totalVoteWeight = 0;
  let totalVotes = 0;

  for (const poll of polls) {
    const votes = await database
      .select()
      .from(webinarPollVotes)
      .where(eq(webinarPollVotes.pollId, poll.id));

    if (votes.length === 0) continue;

    const options = poll.options as string[];
    const optionCount = options.length;

    // 统计各选项票数
    const tally = new Array(optionCount).fill(0);
    for (const vote of votes) {
      if (vote.selectedOption >= 0 && vote.selectedOption < optionCount) {
        tally[vote.selectedOption]++;
      }
    }

    // 计算加权正面率：选项索引越小 = 越正面，给予更高分
    let pollScore = 0;
    for (let i = 0; i < optionCount; i++) {
      const optionWeight = (optionCount - i) / optionCount; // 第一个选项权重最高
      pollScore += (tally[i] / votes.length) * optionWeight * 100;
    }

    // 按投票人数加权（人数越多，可信度越高）
    const voteWeight = Math.log2(votes.length + 1); // 对数加权，避免大投票主导
    totalWeightedScore += pollScore * voteWeight;
    totalVoteWeight += voteWeight;
    totalVotes += votes.length;
  }

  const rawScore = totalVoteWeight > 0 ? totalWeightedScore / totalVoteWeight : 0;

  // 置信度修正：投票总数 < 20 时适当降低
  const confidenceFactor = Math.min(totalVotes / 20, 1.0);
  const finalScore = clamp(rawScore * (0.5 + 0.5 * confidenceFactor));

  return {
    score: finalScore,
    totalVotes,
    pollCount: polls.length,
  };
}

// ── 模块三：专家评审分 ────────────────────────────────────────────────────────
/**
 * 计算专家评审分（满分 100）
 *
 * 算法：
 * 1. 获取工厂所有已发布的专家评审
 * 2. 三个维度（创新、管理、潜力）等权平均
 * 3. 多位专家取平均分
 */
async function calculateExpertScore(factoryId: number): Promise<{
  score: number;
  count: number;
  breakdown: { innovation: number; management: number; potential: number };
}> {
  const database = await getDb();
  const reviews = await database
    .select()
    .from(expertReviews)
    .where(eq(expertReviews.factoryId, factoryId));

  const published = reviews.filter(r => r.isPublished === 1);

  if (published.length === 0) {
    return { score: 0, count: 0, breakdown: { innovation: 0, management: 0, potential: 0 } };
  }

  const avgInnovation = published.reduce((s, r) => s + r.scoreInnovation, 0) / published.length;
  const avgManagement = published.reduce((s, r) => s + r.scoreManagement, 0) / published.length;
  const avgPotential  = published.reduce((s, r) => s + r.scorePotential,  0) / published.length;

  const finalScore = clamp((avgInnovation + avgManagement + avgPotential) / 3);

  return {
    score: finalScore,
    count: published.length,
    breakdown: {
      innovation: clamp(avgInnovation),
      management: clamp(avgManagement),
      potential:  clamp(avgPotential),
    },
  };
}

// ── 主函数：计算并存储人工总分 ────────────────────────────────────────────────
/**
 * 计算工厂的人工评分总分并存入数据库
 *
 * Human Score = (交易评分 × 0.5) + (Webinar 投票分 × 0.3) + (专家评审分 × 0.2)
 * FTGI 贡献  = Human Score × 0.4
 */
export async function calculateHumanScore(factoryId: number): Promise<{
  humanScore: number;
  ftgiContribution: number;
  scoreFromReviews: number;
  scoreFromWebinars: number;
  scoreFromExperts: number;
  reviewCount: number;
  webinarVoteCount: number;
  expertReviewCount: number;
}> {
  const database = await getDb();

  // 并行计算三个子模块
  const [reviewResult, webinarResult, expertResult] = await Promise.all([
    calculateReviewScore(factoryId),
    calculateWebinarScore(factoryId),
    calculateExpertScore(factoryId),
  ]);

  // 加权计算人工总分
  const humanScore = clamp(
    reviewResult.score  * MODULE_WEIGHTS.reviews +
    webinarResult.score * MODULE_WEIGHTS.webinars +
    expertResult.score  * MODULE_WEIGHTS.experts
  );

  // 对 FTGI 的贡献值 (0-40)
  const ftgiContribution = humanScore * HUMAN_COEFFICIENT;

  const result = {
    humanScore,
    ftgiContribution,
    scoreFromReviews:  reviewResult.score,
    scoreFromWebinars: webinarResult.score,
    scoreFromExperts:  expertResult.score,
    reviewCount:       reviewResult.count,
    webinarVoteCount:  webinarResult.totalVotes,
    expertReviewCount: expertResult.count,
  };

  // 存入数据库（upsert）
  const existing = await database
    .select({ id: factoryHumanScores.id })
    .from(factoryHumanScores)
    .where(eq(factoryHumanScores.factoryId, factoryId));

  const now = new Date();

  if (existing.length > 0) {
    await database
      .update(factoryHumanScores)
      .set({
        scoreFromReviews:  String(result.scoreFromReviews.toFixed(2)),
        scoreFromWebinars: String(result.scoreFromWebinars.toFixed(2)),
        scoreFromExperts:  String(result.scoreFromExperts.toFixed(2)),
        reviewCount:       result.reviewCount,
        webinarVoteCount:  result.webinarVoteCount,
        expertReviewCount: result.expertReviewCount,
        humanScore:        String(result.humanScore.toFixed(2)),
        ftgiContribution:  String(result.ftgiContribution.toFixed(2)),
        lastCalculatedAt:  now,
        updatedAt:         now,
      })
      .where(eq(factoryHumanScores.factoryId, factoryId));
  } else {
    await database
      .insert(factoryHumanScores)
      .values({
        factoryId,
        scoreFromReviews:  String(result.scoreFromReviews.toFixed(2)),
        scoreFromWebinars: String(result.scoreFromWebinars.toFixed(2)),
        scoreFromExperts:  String(result.scoreFromExperts.toFixed(2)),
        reviewCount:       result.reviewCount,
        webinarVoteCount:  result.webinarVoteCount,
        expertReviewCount: result.expertReviewCount,
        humanScore:        String(result.humanScore.toFixed(2)),
        ftgiContribution:  String(result.ftgiContribution.toFixed(2)),
        lastCalculatedAt:  now,
      });
  }

  return result;
}

// ── 查询函数 ──────────────────────────────────────────────────────────────────
export async function getHumanScore(factoryId: number) {
  const database = await getDb();
  const rows = await database
    .select()
    .from(factoryHumanScores)
    .where(eq(factoryHumanScores.factoryId, factoryId));
  return rows[0] ?? null;
}

export async function getFactoryReviewsV2(factoryId: number) {
  const database = await getDb();
  return database
    .select()
    .from(factoryReviewsV2)
    .where(eq(factoryReviewsV2.factoryId, factoryId))
    .orderBy(desc(factoryReviewsV2.createdAt));
}

export async function createFactoryReviewV2(data: {
  factoryId: number;
  userId: number;
  orderId?: number;
  ratingOverall: number;
  ratingCommunication: number;
  ratingQuality: number;
  ratingLeadTime: number;
  ratingService: number;
  comment?: string;
  isVerifiedPurchase?: boolean;
}) {
  const database = await getDb();
  const result = await database.insert(factoryReviewsV2).values({
    ...data,
    isVerifiedPurchase: data.isVerifiedPurchase ? 1 : 0,
  });
  // 异步触发重新计算
  calculateHumanScore(data.factoryId).catch(e =>
    console.error("[HSS] Async human score recalculation failed:", e)
  );
  return result;
}

export async function getWebinarPolls(webinarId: number) {
  const database = await getDb();
  return database
    .select()
    .from(webinarPolls)
    .where(eq(webinarPolls.webinarId, webinarId));
}

export async function createWebinarPoll(data: {
  webinarId: number;
  factoryId?: number;
  question: string;
  options: string[];
  pollType?: string;
}) {
  const database = await getDb();
  return database.insert(webinarPolls).values({
    webinarId:  data.webinarId,
    factoryId:  data.factoryId,
    question:   data.question,
    options:    data.options,
    pollType:   data.pollType ?? "satisfaction",
    status:     "active",
  });
}

export async function submitPollVote(data: {
  pollId: number;
  userId: number;
  selectedOption: number;
}) {
  const database = await getDb();
  // 检查是否已投票
  const existing = await database
    .select({ id: webinarPollVotes.id })
    .from(webinarPollVotes)
    .where(eq(webinarPollVotes.pollId, data.pollId));
  const alreadyVoted = existing.some(v => (v as any).userId === data.userId);
  if (alreadyVoted) throw new Error("您已经投过票了");

  return database.insert(webinarPollVotes).values(data);
}

export async function getPollResults(pollId: number) {
  const database = await getDb();
  const poll = await database
    .select()
    .from(webinarPolls)
    .where(eq(webinarPolls.id, pollId));
  if (!poll[0]) throw new Error("投票不存在");

  const votes = await database
    .select()
    .from(webinarPollVotes)
    .where(eq(webinarPollVotes.pollId, pollId));

  const options = poll[0].options as string[];
  const tally = new Array(options.length).fill(0);
  for (const vote of votes) {
    if (vote.selectedOption >= 0 && vote.selectedOption < options.length) {
      tally[vote.selectedOption]++;
    }
  }

  return {
    poll: poll[0],
    totalVotes: votes.length,
    results: options.map((opt, i) => ({
      option: opt,
      votes: tally[i],
      percentage: votes.length > 0 ? Math.round((tally[i] / votes.length) * 100) : 0,
    })),
  };
}

export async function closePoll(pollId: number) {
  const database = await getDb();
  return database
    .update(webinarPolls)
    .set({ status: "closed", closedAt: new Date() })
    .where(eq(webinarPolls.id, pollId));
}

export async function createExpertReview(data: {
  factoryId: number;
  expertId: number;
  scoreInnovation: number;
  scoreManagement: number;
  scorePotential: number;
  summary: string;
}) {
  const database = await getDb();
  const result = await database.insert(expertReviews).values({
    ...data,
    isPublished: 1,
  });
  // 异步触发重新计算
  calculateHumanScore(data.factoryId).catch(e =>
    console.error("[HSS] Async expert score recalculation failed:", e)
  );
  return result;
}

export async function getExpertReviews(factoryId: number) {
  const database = await getDb();
  return database
    .select()
    .from(expertReviews)
    .where(eq(expertReviews.factoryId, factoryId))
    .orderBy(desc(expertReviews.createdAt));
}
