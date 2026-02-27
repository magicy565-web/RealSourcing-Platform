/**
 * QuoteReviewPanel - 工厂端报价审核确认 UI
 *
 * 功能：
 * 1. 展示 AI 从飞书/ERP 自动生成的报价草稿
 * 2. 工厂可一键确认或微调（单价支持直接输入/±5%快捷按鈕，交期支持直接输入/±3天快捷按鈕）
 * 3. 显示数据来源（飞书/AI生成/手动）和置信度
 * 4. 确认后自动推送给买家
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, XCircle, Edit3, Zap, Bot, Database,
  ChevronUp, ChevronDown, Clock, Package, DollarSign,
  AlertTriangle, Sparkles, Send
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

interface TierPrice {
  qty: number;
  price: number;
}

interface DraftQuote {
  unitPrice: number;
  currency: string;
  moq: number;
  leadTimeDays: number;
  tierPricing?: TierPrice[];
  notes?: string;
}

interface QuoteReviewPanelProps {
  inquiryId: number;
  factoryId: number;
  buyerName?: string;
  productName?: string;
  quantity?: number;
  draftQuote: DraftQuote;
  source: "feishu" | "ai_generated" | "manual";
  confidence?: number;
  onConfirmed?: () => void;
  onDismiss?: () => void;
}

const SOURCE_CONFIG = {
  feishu: {
    label: "飞书报价库",
    icon: Database,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    desc: "数据来自飞书多维表格报价库",
  },
  ai_generated: {
    label: "AI 生成",
    icon: Bot,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
    desc: "AI 根据历史数据自动生成的报价草稿",
  },
  manual: {
    label: "手动填写",
    icon: Edit3,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
    desc: "手动填写的报价",
  },
};

export function QuoteReviewPanel({
  inquiryId,
  factoryId,
  buyerName,
  productName,
  quantity,
  draftQuote,
  source,
  confidence = 85,
  onConfirmed,
  onDismiss,
}: QuoteReviewPanelProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuote, setEditedQuote] = useState<DraftQuote>({ ...draftQuote });
  const [isConfirming, setIsConfirming] = useState(false);

  const submitQuoteMutation = trpc.rfq.submitQuote.useMutation({
    onSuccess: () => {
      toast({
        title: "✅ 报价已确认并发送",
        description: `报价已成功推送给买家${buyerName ? ` ${buyerName}` : ""}，对方将在几秒内收到通知。`,
      });
      onConfirmed?.();
    },
    onError: (err) => {
      toast({
        title: "提交失败",
        description: err.message,
        variant: "destructive",
      });
      setIsConfirming(false);
    },
  });

  const sourceConfig = SOURCE_CONFIG[source];
  const SourceIcon = sourceConfig.icon;

  const adjustPrice = (delta: number) => {
    const newPrice = Math.max(0.01, editedQuote.unitPrice * (1 + delta));
    setEditedQuote((prev) => ({
      ...prev,
      unitPrice: Math.round(newPrice * 100) / 100,
      tierPricing: prev.tierPricing?.map((t) => ({
        ...t,
        price: Math.round(t.price * (1 + delta) * 100) / 100,
      })),
    }));
  };

  const adjustLeadTime = (delta: number) => {
    setEditedQuote((prev) => ({
      ...prev,
      leadTimeDays: Math.max(1, prev.leadTimeDays + delta),
    }));
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    submitQuoteMutation.mutate({
      inquiryId,
      factoryId,
      unitPrice: editedQuote.unitPrice.toFixed(2),
      currency: editedQuote.currency,
      moq: editedQuote.moq,
      leadTimeDays: editedQuote.leadTimeDays,
      tierPricing: editedQuote.tierPricing ?? [],
      factoryNotes: editedQuote.notes ?? `来自${sourceConfig.label}（${source === "feishu" ? "自动匹配" : "AI 生成"}）`,
    });
  };

  const confidenceColor =
    confidence >= 90 ? "text-green-400" :
    confidence >= 70 ? "text-yellow-400" :
    "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI 报价草稿已就绪</h3>
            <p className="text-xs text-gray-500">请确认或微调后发送给买家</p>
          </div>
        </div>
        {/* 数据来源标签 */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${sourceConfig.bg} ${sourceConfig.color}`}>
          <SourceIcon className="w-3 h-3" />
          <span>{sourceConfig.label}</span>
        </div>
      </div>

      {/* 询价摘要 */}
      {(productName || buyerName || quantity) && (
        <div className="px-5 py-3 bg-white/3 border-b border-white/5">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {productName && (
              <span className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {productName}
              </span>
            )}
            {quantity && (
              <span className="flex items-center gap-1">
                <span className="text-gray-500">数量:</span>
                <span className="text-white">{quantity.toLocaleString()} 件</span>
              </span>
            )}
            {buyerName && (
              <span className="flex items-center gap-1">
                <span className="text-gray-500">买家:</span>
                <span className="text-white">{buyerName}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* 报价核心数据 */}
      <div className="px-5 py-4 space-y-4">
        {/* 单价 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <DollarSign className="w-4 h-4" />
            <span>单价</span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => adjustPrice(-0.05)}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs font-medium"
                  title="-5%"
                >
                  -5%
                </button>
                <button
                  onClick={() => adjustPrice(0.05)}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs font-medium"
                  title="+5%"
                >
                  +5%
                </button>
              </div>
            )}
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-gray-400">{editedQuote.currency}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editedQuote.unitPrice}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val) && val > 0) {
                      const ratio = val / editedQuote.unitPrice;
                      setEditedQuote((prev) => ({
                        ...prev,
                        unitPrice: Math.round(val * 100) / 100,
                        tierPricing: prev.tierPricing?.map((t) => ({
                          ...t,
                          price: Math.round(t.price * ratio * 100) / 100,
                        })),
                      }));
                    }
                  }}
                  className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-base font-bold text-white text-right focus:outline-none focus:border-blue-500/50"
                />
              </div>
            ) : (
              <span className="text-lg font-bold text-white">
                {editedQuote.currency} {editedQuote.unitPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* MOQ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Package className="w-4 h-4" />
            <span>最小订单量</span>
          </div>
          {isEditing ? (
            <input
              type="number"
              value={editedQuote.moq}
              onChange={(e) => setEditedQuote((p) => ({ ...p, moq: Number(e.target.value) }))}
              className="w-24 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white text-right focus:outline-none focus:border-blue-500/50"
            />
          ) : (
            <span className="text-sm font-medium text-white">{editedQuote.moq.toLocaleString()} 件</span>
          )}
        </div>

        {/* 交期 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>交期</span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => adjustLeadTime(-3)}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs font-medium"
                  title="-3天"
                >
                  -3
                </button>
                <button
                  onClick={() => adjustLeadTime(-1)}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs font-medium"
                  title="-1天"
                >
                  -1
                </button>
                <button
                  onClick={() => adjustLeadTime(1)}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs font-medium"
                  title="+1天"
                >
                  +1
                </button>
                <button
                  onClick={() => adjustLeadTime(3)}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors text-xs font-medium"
                  title="+3天"
                >
                  +3
                </button>
              </div>
            )}
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  value={editedQuote.leadTimeDays}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 1) {
                      setEditedQuote((prev) => ({ ...prev, leadTimeDays: val }));
                    }
                  }}
                  className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm font-medium text-white text-right focus:outline-none focus:border-blue-500/50"
                />
                <span className="text-sm text-gray-400">天</span>
              </div>
            ) : (
              <span className="text-sm font-medium text-white">{editedQuote.leadTimeDays} 天</span>
            )}
          </div>
        </div>

        {/* 阶梯报价 */}
        {editedQuote.tierPricing && editedQuote.tierPricing.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 mb-2">阶梯报价</p>
            <div className="space-y-1.5">
              {editedQuote.tierPricing.map((tier, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/3">
                  <span className="text-xs text-gray-400">≥ {tier.qty.toLocaleString()} 件</span>
                  <span className="text-xs font-medium text-white">
                    {editedQuote.currency} {tier.price.toFixed(2)}
                    {idx > 0 && (
                      <span className="text-green-400 ml-1.5">
                        -{Math.round((1 - tier.price / editedQuote.tierPricing![0].price) * 100)}%
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 备注 */}
        {isEditing && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5">备注</p>
            <textarea
              value={editedQuote.notes ?? ""}
              onChange={(e) => setEditedQuote((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="添加备注（可选）"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>
        )}

        {/* AI 置信度 */}
        {source !== "manual" && (
          <div className="flex items-center justify-between pt-1 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              {confidence < 80 && <AlertTriangle className="w-3 h-3 text-yellow-400" />}
              <span>AI 置信度</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    confidence >= 90 ? "bg-green-500" :
                    confidence >= 70 ? "bg-yellow-500" :
                    "bg-red-500"
                  }`}
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${confidenceColor}`}>{confidence}%</span>
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="px-5 py-4 border-t border-white/5 flex items-center gap-3">
        {/* 编辑/取消编辑 */}
        <button
          onClick={() => {
            if (isEditing) {
              setEditedQuote({ ...draftQuote }); // 取消时恢复原始数据
            }
            setIsEditing(!isEditing);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? "取消修改" : "微调"}</span>
        </button>

        {/* 拒绝/跳过 */}
        <button
          onClick={onDismiss}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm transition-colors"
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>不使用</span>
        </button>

        {/* 确认发送 */}
        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConfirming ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>发送中...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>确认并发送给买家</span>
            </>
          )}
        </button>
      </div>

      {/* 低置信度警告 */}
      <AnimatePresence>
        {confidence < 70 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-3 bg-yellow-500/5 border-t border-yellow-500/20"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-400/80">
                AI 置信度较低，建议在发送前仔细核实报价数据的准确性。
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
