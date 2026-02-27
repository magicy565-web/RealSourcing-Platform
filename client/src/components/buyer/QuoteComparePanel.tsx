/**
 * QuoteComparePanel - 买家报价对比面板
 *
 * 功能：
 * 1. 同时展示多个工厂的报价，支持横向对比
 * 2. 自动标注"最低价"、"最快交期"、"最低 MOQ"
 * 3. 支持快速接受/拒绝报价
 * 4. 显示报价有效期倒计时
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Clock, Package, DollarSign, CheckCircle,
  XCircle, ChevronDown, ChevronUp, Star, Zap, TrendingDown
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

interface TierPrice {
  qty: number;
  price: number;
}

interface QuoteItem {
  inquiryId: number;
  factoryId: number;
  factoryName: string;
  factoryRating?: number;
  unitPrice: number;
  currency: string;
  moq: number;
  leadTimeDays: number;
  tierPricing?: TierPrice[];
  validUntil?: string;
  factoryNotes?: string;
  status: "pending" | "submitted" | "accepted" | "rejected";
  submittedAt?: string;
}

interface QuoteComparePanelProps {
  quotes: QuoteItem[];
  onQuoteAccepted?: (inquiryId: number) => void;
  onQuoteRejected?: (inquiryId: number) => void;
}

function getBadges(quotes: QuoteItem[]): Record<number, string[]> {
  const result: Record<number, string[]> = {};
  const submitted = quotes.filter((q) => q.status === "submitted");
  if (submitted.length === 0) return result;

  const lowestPrice = Math.min(...submitted.map((q) => q.unitPrice));
  const fastestLead = Math.min(...submitted.map((q) => q.leadTimeDays));
  const lowestMoq = Math.min(...submitted.map((q) => q.moq));

  submitted.forEach((q) => {
    const badges: string[] = [];
    if (q.unitPrice === lowestPrice) badges.push("最低价");
    if (q.leadTimeDays === fastestLead) badges.push("最快交期");
    if (q.moq === lowestMoq) badges.push("最低 MOQ");
    if (badges.length > 0) result[q.inquiryId] = badges;
  });

  return result;
}

function getRemainingTime(validUntil?: string): string {
  if (!validUntil) return "";
  const diff = new Date(validUntil).getTime() - Date.now();
  if (diff <= 0) return "已过期";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)} 天后过期`;
  if (hours > 0) return `${hours}h ${minutes}m 后过期`;
  return `${minutes} 分钟后过期`;
}

function QuoteCard({
  quote,
  badges,
  onAccept,
  onReject,
}: {
  quote: QuoteItem;
  badges: string[];
  onAccept: () => void;
  onReject: () => void;
}) {
  const [showTiers, setShowTiers] = useState(false);
  const remainingTime = getRemainingTime(quote.validUntil);
  const isExpired = remainingTime === "已过期";
  const hasTiers = quote.tierPricing && quote.tierPricing.length > 1;

  const isAccepted = quote.status === "accepted";
  const isRejected = quote.status === "rejected";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-xl border overflow-hidden transition-all ${
        isAccepted
          ? "border-green-500/40 bg-green-500/5"
          : isRejected
          ? "border-white/5 bg-white/2 opacity-50"
          : badges.length > 0
          ? "border-blue-500/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90"
          : "border-white/8 bg-[#1a1a2e]/60"
      }`}
    >
      {/* 徽章 */}
      {badges.length > 0 && !isRejected && (
        <div className="absolute top-0 left-0 right-0 flex gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-blue-500/20">
          {badges.map((badge) => (
            <span
              key={badge}
              className="flex items-center gap-1 text-[10px] font-medium text-blue-300"
            >
              {badge === "最低价" && <TrendingDown className="w-2.5 h-2.5" />}
              {badge === "最快交期" && <Zap className="w-2.5 h-2.5" />}
              {badge === "最低 MOQ" && <Package className="w-2.5 h-2.5" />}
              {badge}
            </span>
          ))}
        </div>
      )}

      <div className={`p-4 ${badges.length > 0 && !isRejected ? "pt-8" : ""}`}>
        {/* 工厂名称 */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-white">{quote.factoryName}</p>
            {quote.factoryRating && (
              <div className="flex items-center gap-0.5 mt-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-2.5 h-2.5 ${
                      i < Math.floor(quote.factoryRating!) ? "text-yellow-400 fill-yellow-400" : "text-gray-600"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          {/* 状态标签 */}
          {isAccepted && (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" />
              已接受
            </span>
          )}
          {isRejected && (
            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">已拒绝</span>
          )}
        </div>

        {/* 核心数据 */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-2 rounded-lg bg-white/3">
            <p className="text-xs text-gray-500 mb-0.5">单价</p>
            <p className="text-base font-bold text-white">
              {quote.currency} {quote.unitPrice.toFixed(2)}
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/3">
            <p className="text-xs text-gray-500 mb-0.5">MOQ</p>
            <p className="text-base font-bold text-white">{quote.moq.toLocaleString()}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/3">
            <p className="text-xs text-gray-500 mb-0.5">交期</p>
            <p className="text-base font-bold text-white">{quote.leadTimeDays}天</p>
          </div>
        </div>

        {/* 阶梯报价 */}
        {hasTiers && (
          <div className="mb-3">
            <button
              onClick={() => setShowTiers(!showTiers)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showTiers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              查看阶梯报价 ({quote.tierPricing!.length} 档)
            </button>
            <AnimatePresence>
              {showTiers && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-1"
                >
                  {quote.tierPricing!.map((tier, idx) => (
                    <div key={idx} className="flex justify-between px-2 py-1 rounded bg-white/3 text-xs">
                      <span className="text-gray-400">≥ {tier.qty.toLocaleString()} 件</span>
                      <span className="text-white font-medium">
                        {quote.currency} {tier.price.toFixed(2)}
                        {idx > 0 && (
                          <span className="text-green-400 ml-1.5">
                            -{Math.round((1 - tier.price / quote.tierPricing![0].price) * 100)}%
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 备注 */}
        {quote.factoryNotes && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{quote.factoryNotes}</p>
        )}

        {/* 有效期 */}
        {remainingTime && (
          <div className={`flex items-center gap-1 text-xs mb-3 ${
            isExpired ? "text-red-400" : "text-gray-500"
          }`}>
            <Clock className="w-3 h-3" />
            <span>{remainingTime}</span>
          </div>
        )}

        {/* 操作按钮 */}
        {quote.status === "submitted" && !isExpired && (
          <div className="flex gap-2">
            <button
              onClick={onReject}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              拒绝
            </button>
            <button
              onClick={onAccept}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-medium transition-all"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              接受报价
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function QuoteComparePanel({
  quotes,
  onQuoteAccepted,
  onQuoteRejected,
}: QuoteComparePanelProps) {
  const { toast } = useToast();
  const badges = useMemo(() => getBadges(quotes), [quotes]);

  const acceptMutation = trpc.rfq.acceptQuote.useMutation({
    onSuccess: (_, vars) => {
      toast({
        title: "✅ 报价已接受",
        description: "已通知工厂，可以开始安排生产。",
      });
      onQuoteAccepted?.(vars.inquiryId);
    },
    onError: (err) => {
      toast({ title: "操作失败", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = trpc.rfq.rejectQuote.useMutation({
    onSuccess: (_, vars) => {
      toast({ title: "报价已拒绝", description: "已通知工厂。" });
      onQuoteRejected?.(vars.inquiryId);
    },
    onError: (err) => {
      toast({ title: "操作失败", description: err.message, variant: "destructive" });
    },
  });

  const submittedQuotes = quotes.filter((q) => q.status === "submitted");
  const pendingCount = quotes.filter((q) => q.status === "pending").length;

  if (quotes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="w-12 h-12 text-gray-700 mb-3" />
        <p className="text-gray-500 text-sm">暂无报价</p>
        <p className="text-gray-600 text-xs mt-1">等待工厂提交报价中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 汇总标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">
            报价对比 ({submittedQuotes.length} 个报价)
          </h3>
        </div>
        {pendingCount > 0 && (
          <span className="text-xs text-gray-500">
            还有 {pendingCount} 个工厂未回复
          </span>
        )}
      </div>

      {/* 报价卡片网格 */}
      <div className={`grid gap-3 ${
        submittedQuotes.length === 1 ? "grid-cols-1" :
        submittedQuotes.length === 2 ? "grid-cols-2" :
        "grid-cols-2 lg:grid-cols-3"
      }`}>
        {quotes.map((quote) => (
          <QuoteCard
            key={quote.inquiryId}
            quote={quote}
            badges={badges[quote.inquiryId] ?? []}
            onAccept={() => acceptMutation.mutate({ inquiryId: quote.inquiryId })}
            onReject={() => rejectMutation.mutate({ inquiryId: quote.inquiryId })}
          />
        ))}
      </div>

      {/* 对比提示 */}
      {submittedQuotes.length >= 2 && (
        <div className="p-3 rounded-lg bg-white/3 border border-white/5">
          <p className="text-xs text-gray-500 text-center">
            💡 接受一个报价后，其他报价将自动失效。建议综合考虑价格、交期和 MOQ 做出决策。
          </p>
        </div>
      )}
    </div>
  );
}
