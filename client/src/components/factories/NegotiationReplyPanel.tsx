/**
 * NegotiationReplyPanel - 工厂侧议价回应组件
 * 功能：查看买家议价请求、查看 AI 反提案、接受/拒绝/提出替代方案
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "../../utils/trpc";
import {
  MessageSquare, DollarSign, Package, Clock,
  CheckCircle, XCircle, Edit3, Sparkles,
  AlertCircle, TrendingDown, BarChart3, User
} from "lucide-react";

interface NegotiationSession {
  id: number;
  buyerRequest: string;
  targetPrice?: string | null;
  targetMoq?: number | null;
  targetLeadTime?: number | null;
  originalPrice?: string | null;
  originalMoq?: number | null;
  originalLeadTime?: number | null;
  originalCurrency?: string | null;
  aiAnalysis?: Record<string, unknown> | null;
  aiConfidence?: string | null;
  status: string;
  roundCount: number;
  createdAt: Date;
}

interface NegotiationReplyPanelProps {
  session: NegotiationSession;
  onClose?: () => void;
  onReplied?: () => void;
}

type ReplyMode = "view" | "counter";

export default function NegotiationReplyPanel({
  session,
  onClose,
  onReplied,
}: NegotiationReplyPanelProps) {
  const [mode, setMode] = useState<ReplyMode>("view");
  const [counterPrice, setCounterPrice] = useState<string>("");
  const [counterMoq, setCounterMoq] = useState<string>("");
  const [counterLeadTime, setCounterLeadTime] = useState<string>("");
  const [responseMessage, setResponseMessage] = useState<string>("");
  const [replied, setReplied] = useState(false);

  const factoryRespondMutation = trpc.negotiation.factoryRespond.useMutation({
    onSuccess: () => {
      setReplied(true);
      onReplied?.();
    },
  });

  const aiAnalysis = session.aiAnalysis as {
    strategy?: string;
    proposedPrice?: number;
    proposedMoq?: number;
    proposedLeadTime?: number;
    proposedTerms?: string;
    reasoning?: string;
    confidence?: number;
    discountPct?: number;
  } | null;

  const originalPrice = parseFloat(session.originalPrice ?? "0");
  const originalMoq = session.originalMoq ?? 0;
  const originalLeadTime = session.originalLeadTime ?? 0;
  const currency = session.originalCurrency ?? "USD";
  const targetPrice = session.targetPrice ? parseFloat(session.targetPrice) : null;

  const handleRespond = (action: "accepted" | "rejected" | "counter") => {
    const message = action === "accepted"
      ? (responseMessage || "感谢您的议价请求，我们接受此方案。")
      : action === "rejected"
        ? (responseMessage || "抱歉，此议价条件超出我们的底线，无法接受。")
        : responseMessage;

    if (!message.trim() && action === "counter") return;

    factoryRespondMutation.mutate({
      sessionId: session.id,
      action,
      responseMessage: message,
      counterPrice: action === "counter" && counterPrice ? parseFloat(counterPrice) : undefined,
      counterMoq: action === "counter" && counterMoq ? parseInt(counterMoq) : undefined,
      counterLeadTime: action === "counter" && counterLeadTime ? parseInt(counterLeadTime) : undefined,
    });
  };

  const getStrategyColor = (strategy?: string) => {
    switch (strategy) {
      case "accept": return "text-green-600 bg-green-50 border-green-200";
      case "counter": return "text-amber-600 bg-amber-50 border-amber-200";
      case "reject": return "text-red-600 bg-red-50 border-red-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStrategyLabel = (strategy?: string) => {
    switch (strategy) {
      case "accept": return "AI 建议：可以接受";
      case "counter": return "AI 建议：提出折中方案";
      case "reject": return "AI 建议：超出底线";
      default: return "AI 分析中";
    }
  };

  if (replied) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-xl">
        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="text-gray-800 font-semibold text-lg mb-2">回应已发送</h4>
          <p className="text-gray-500 text-sm mb-6">买家将收到您的回应通知。</p>
          {onClose && (
            <button onClick={onClose} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
              关闭
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full max-w-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">买家议价请求</h3>
              <p className="text-slate-300 text-xs">第 {session.roundCount} 轮 · {new Date(session.createdAt).toLocaleDateString("zh-CN")}</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors text-xl leading-none">×</button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* 买家请求 */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">买家请求</span>
          </div>
          <p className="text-sm text-blue-800 leading-relaxed">{session.buyerRequest}</p>
          {targetPrice && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600">
              <TrendingDown className="w-3.5 h-3.5" />
              目标单价：{targetPrice} {currency}
              （降价 {((originalPrice - targetPrice) / originalPrice * 100).toFixed(1)}%）
            </div>
          )}
        </div>

        {/* 原始报价 vs 买家目标 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "原始单价", value: `${originalPrice} ${currency}`, sub: "当前报价" },
            { label: "原始 MOQ", value: `${originalMoq} 件`, sub: "当前 MOQ" },
            { label: "原始交期", value: `${originalLeadTime} 天`, sub: "当前交期" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xs text-gray-400 mb-1">{sub}</p>
              <p className="text-gray-800 font-semibold text-sm">{value}</p>
            </div>
          ))}
        </div>

        {/* AI 建议 */}
        {aiAnalysis && (
          <div className={`rounded-xl p-4 border ${getStrategyColor(aiAnalysis.strategy)}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">{getStrategyLabel(aiAnalysis.strategy)}</span>
              </div>
              {aiAnalysis.confidence && (
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 opacity-60" />
                  <span className="text-xs opacity-70">置信度 {aiAnalysis.confidence}%</span>
                </div>
              )}
            </div>
            {aiAnalysis.proposedTerms && (
              <p className="text-sm leading-relaxed mb-2">{aiAnalysis.proposedTerms}</p>
            )}
            {aiAnalysis.reasoning && (
              <div className="mt-2 pt-2 border-t border-current/10">
                <div className="flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3 h-3 opacity-50" />
                  <span className="text-xs opacity-60">推理依据</span>
                </div>
                <p className="text-xs opacity-70 leading-relaxed">{aiAnalysis.reasoning}</p>
              </div>
            )}
          </div>
        )}

        {/* 操作区 */}
        <AnimatePresence mode="wait">
          {mode === "view" ? (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">回应备注（可选）</label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="可以补充说明接受/拒绝的原因..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleRespond("rejected")}
                  disabled={factoryRespondMutation.isPending}
                  className="flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  <XCircle className="w-4 h-4" />
                  拒绝
                </button>
                <button
                  onClick={() => setMode("counter")}
                  className="flex items-center justify-center gap-1.5 border border-amber-200 text-amber-600 hover:bg-amber-50 font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  反提案
                </button>
                <button
                  onClick={() => handleRespond("accepted")}
                  disabled={factoryRespondMutation.isPending}
                  className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  接受
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="counter"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">提出替代方案</h4>
                <button onClick={() => setMode("view")} className="text-xs text-gray-400 hover:text-gray-600">← 返回</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">反提单价</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(e.target.value)}
                      placeholder={String(originalPrice)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">{currency}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">反提 MOQ</label>
                  <input
                    type="number"
                    value={counterMoq}
                    onChange={(e) => setCounterMoq(e.target.value)}
                    placeholder={String(originalMoq)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">反提交期</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={counterLeadTime}
                      onChange={(e) => setCounterLeadTime(e.target.value)}
                      placeholder={String(originalLeadTime)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-7 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">天</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">说明理由 <span className="text-red-500">*</span></label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="请说明您的替代方案理由，例如：我们可以在 MOQ 提升至 500 件的条件下，将单价降至 3.2 USD..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                  rows={3}
                />
              </div>
              <button
                onClick={() => handleRespond("counter")}
                disabled={!responseMessage.trim() || factoryRespondMutation.isPending}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                发送替代方案
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
