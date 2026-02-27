/**
 * NegotiationPanel - 买家侧动态议价组件
 * 功能：发起议价请求、查看 AI 反提案、接受/拒绝工厂反提案
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "../../utils/trpc";
import {
  MessageSquare, TrendingDown, Clock, Package,
  CheckCircle, XCircle, ChevronRight, Sparkles,
  AlertCircle, RefreshCw, DollarSign, BarChart3
} from "lucide-react";

interface NegotiationPanelProps {
  rfqQuoteId: number;
  factoryId: number;
  factoryName: string;
  originalPrice: number;
  originalMoq: number;
  originalLeadTime: number;
  currency?: string;
  demandId?: number;
  onClose?: () => void;
  onNegotiationComplete?: (result: "accepted" | "rejected") => void;
}

type Step = "request" | "ai_analyzing" | "counter_proposal" | "factory_response" | "completed";

export default function NegotiationPanel({
  rfqQuoteId,
  factoryId,
  factoryName,
  originalPrice,
  originalMoq,
  originalLeadTime,
  currency = "USD",
  demandId,
  onClose,
  onNegotiationComplete,
}: NegotiationPanelProps) {
  const [step, setStep] = useState<Step>("request");
  const [buyerRequest, setBuyerRequest] = useState("");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [targetMoq, setTargetMoq] = useState<string>("");
  const [targetLeadTime, setTargetLeadTime] = useState<string>("");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [counterProposal, setCounterProposal] = useState<{
    canNegotiate: boolean;
    confidence: number;
    strategy: "accept" | "counter" | "reject";
    proposedPrice?: number;
    proposedMoq?: number;
    proposedLeadTime?: number;
    proposedTerms: string;
    reasoning: string;
    discountPct?: number;
  } | null>(null);

  const createMutation = trpc.negotiation.create.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setCounterProposal(data.counterProposal as typeof counterProposal);
      setStep("counter_proposal");
    },
    onError: (err) => {
      console.error("议价创建失败:", err);
      setStep("request");
    },
  });

  const buyerRespondMutation = trpc.negotiation.buyerRespond.useMutation({
    onSuccess: (_, vars) => {
      setStep("completed");
      onNegotiationComplete?.(vars.action);
    },
  });

  const handleSubmitRequest = () => {
    if (!buyerRequest.trim()) return;
    setStep("ai_analyzing");
    createMutation.mutate({
      rfqQuoteId,
      factoryId,
      demandId,
      buyerRequest,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      targetMoq: targetMoq ? parseInt(targetMoq) : undefined,
      targetLeadTime: targetLeadTime ? parseInt(targetLeadTime) : undefined,
    });
  };

  const handleBuyerRespond = (action: "accepted" | "rejected") => {
    if (!sessionId) return;
    buyerRespondMutation.mutate({ sessionId, action });
  };

  const getStrategyBadge = (strategy: "accept" | "counter" | "reject") => {
    switch (strategy) {
      case "accept":
        return <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">AI 建议接受</span>;
      case "counter":
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">AI 提出折中方案</span>;
      case "reject":
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">超出底线</span>;
    }
  };

  const priceChange = counterProposal?.proposedPrice
    ? ((originalPrice - counterProposal.proposedPrice) / originalPrice * 100).toFixed(1)
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">AI 智能议价</h3>
              <p className="text-indigo-200 text-xs">{factoryName}</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors text-xl leading-none">×</button>
          )}
        </div>

        {/* 原始报价快照 */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { icon: DollarSign, label: "原始单价", value: `${originalPrice} ${currency}` },
            { icon: Package, label: "MOQ", value: `${originalMoq} 件` },
            { icon: Clock, label: "交期", value: `${originalLeadTime} 天` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/10 rounded-lg px-3 py-2 text-center">
              <p className="text-indigo-200 text-xs">{label}</p>
              <p className="text-white font-semibold text-sm mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Step 1: 填写议价请求 */}
          {step === "request" && (
            <motion.div
              key="request"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  告诉我们您的议价需求 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={buyerRequest}
                  onChange={(e) => setBuyerRequest(e.target.value)}
                  placeholder="例如：我们是长期客户，能否将单价降低 10%？或者增加 MOQ 换取更低单价？"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">目标单价（可选）</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder={String(originalPrice)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{currency}</span>
                  </div>
                  {targetPrice && parseFloat(targetPrice) < originalPrice && (
                    <p className="text-xs text-green-600 mt-0.5">
                      降价 {((originalPrice - parseFloat(targetPrice)) / originalPrice * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">目标 MOQ（可选）</label>
                  <input
                    type="number"
                    value={targetMoq}
                    onChange={(e) => setTargetMoq(e.target.value)}
                    placeholder={String(originalMoq)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">目标交期（可选）</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={targetLeadTime}
                      onChange={(e) => setTargetLeadTime(e.target.value)}
                      placeholder={String(originalLeadTime)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">天</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSubmitRequest}
                disabled={!buyerRequest.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI 分析议价可行性
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 2: AI 分析中 */}
          {step === "ai_analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
              <h4 className="text-gray-800 font-semibold text-base mb-2">AI 正在分析议价可行性</h4>
              <p className="text-gray-500 text-sm">正在查询工厂历史成交数据，生成最优反提案...</p>
              <div className="mt-4 flex justify-center gap-2">
                {["查询历史数据", "分析价格弹性", "生成反提案"].map((label, i) => (
                  <motion.span
                    key={label}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.8 }}
                    className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full"
                  >
                    {label}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: AI 反提案 */}
          {step === "counter_proposal" && counterProposal && (
            <motion.div
              key="counter"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* AI 置信度 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium text-gray-700">AI 分析结果</span>
                  {getStrategyBadge(counterProposal.strategy)}
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500">置信度 {counterProposal.confidence}%</span>
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${counterProposal.confidence}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 反提案内容 */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <p className="text-sm text-indigo-800 font-medium mb-3">AI 建议方案</p>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {counterProposal.proposedPrice && (
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">建议单价</p>
                      <p className="text-indigo-700 font-bold text-lg">
                        {counterProposal.proposedPrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-400">{currency}</p>
                      {priceChange && parseFloat(priceChange) > 0 && (
                        <p className="text-xs text-green-600 mt-1 font-medium">↓ {priceChange}%</p>
                      )}
                    </div>
                  )}
                  {counterProposal.proposedMoq && (
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">建议 MOQ</p>
                      <p className="text-indigo-700 font-bold text-lg">{counterProposal.proposedMoq}</p>
                      <p className="text-xs text-gray-400">件</p>
                      {counterProposal.proposedMoq > originalMoq && (
                        <p className="text-xs text-amber-600 mt-1 font-medium">
                          ↑ {Math.round((counterProposal.proposedMoq - originalMoq) / originalMoq * 100)}%
                        </p>
                      )}
                    </div>
                  )}
                  {counterProposal.proposedLeadTime && (
                    <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">建议交期</p>
                      <p className="text-indigo-700 font-bold text-lg">{counterProposal.proposedLeadTime}</p>
                      <p className="text-xs text-gray-400">天</p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-indigo-700 leading-relaxed">{counterProposal.proposedTerms}</p>
              </div>

              {/* AI 推理过程 */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">AI 推理依据</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{counterProposal.reasoning}</p>
              </div>

              {/* 操作按钮 */}
              {counterProposal.strategy !== "reject" ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBuyerRespond("rejected")}
                    disabled={buyerRespondMutation.isPending}
                    className="flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    拒绝此方案
                  </button>
                  <button
                    onClick={() => handleBuyerRespond("accepted")}
                    disabled={buyerRespondMutation.isPending}
                    className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    接受此方案
                  </button>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-sm text-gray-500 mb-3">此议价请求超出工厂底线，建议调整目标价格后重试。</p>
                  <button
                    onClick={() => setStep("request")}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    重新发起议价
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* Step 4: 完成 */}
          {step === "completed" && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 text-center"
            >
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-gray-800 font-semibold text-lg mb-2">议价完成</h4>
              <p className="text-gray-500 text-sm mb-6">
                {counterProposal?.strategy === "accept"
                  ? "工厂已接受您的议价请求，采购单将自动生成。"
                  : "议价结果已记录，工厂将收到通知。"}
              </p>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  关闭
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
