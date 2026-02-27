/**
 * RfqProgressTracker - 买家端 RFQ 实时进度追踪
 *
 * 功能：
 * 1. 实时显示 RFQ 处理进度（AI 联络中 → 数据提取 → 报价生成 → 工厂确认 → 已发送）
 * 2. 显示"预计还需 X 分钟"倒计时
 * 3. 超时后自动提示"工厂未及时回复"
 * 4. 报价到达后自动展示 QuoteCard
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Database, CheckCircle, Clock, AlertTriangle,
  Zap, Package, ChevronRight, RefreshCw
} from "lucide-react";
import { useSocket } from "@/hooks/useSocket";

type RfqStage =
  | "rfq_processing_started"
  | "rfq_data_found"
  | "rfq_generated"
  | "rfq_confirmed"
  | "rfq_sent_to_buyer"
  | "rfq_timeout"
  | "rfq_failed"
  | "idle";

interface RfqProgressPayload {
  stage: RfqStage;
  demandId: number;
  factoryId: number;
  inquiryId?: number;
  message: string;
  estimatedMinutes?: number;
  quoteData?: {
    unitPrice: number;
    currency: string;
    moq: number;
    leadTimeDays: number;
  };
  timestamp: string;
}

interface RfqProgressTrackerProps {
  demandId: number;
  factoryId: number;
  factoryName: string;
  productName?: string;
  onQuoteReceived?: (inquiryId: number) => void;
}

const STAGE_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  description: string;
}> = {
  rfq_processing_started: {
    label: "AI 正在联络工厂",
    icon: Bot,
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    description: "AI 助手正在检索工厂报价库...",
  },
  rfq_data_found: {
    label: "已找到报价数据",
    icon: Database,
    color: "text-purple-400",
    bg: "bg-purple-500/20",
    description: "已从工厂报价库提取匹配数据",
  },
  rfq_generated: {
    label: "报价已生成",
    icon: Zap,
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    description: "等待工厂确认报价...",
  },
  rfq_confirmed: {
    label: "工厂已确认",
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/20",
    description: "报价已确认，正在发送给您...",
  },
  rfq_sent_to_buyer: {
    label: "报价已到达",
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-500/20",
    description: "报价已成功发送，请查看详情",
  },
  rfq_timeout: {
    label: "工厂未及时回复",
    icon: AlertTriangle,
    color: "text-orange-400",
    bg: "bg-orange-500/20",
    description: "工厂未在 30 分钟内回复，已发送提醒",
  },
  rfq_failed: {
    label: "报价生成失败",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-500/20",
    description: "报价生成遇到问题，请联系运营",
  },
};

const STAGE_ORDER: RfqStage[] = [
  "rfq_processing_started",
  "rfq_data_found",
  "rfq_generated",
  "rfq_confirmed",
  "rfq_sent_to_buyer",
];

function getStageIndex(stage: RfqStage): number {
  return STAGE_ORDER.indexOf(stage);
}

export function RfqProgressTracker({
  demandId,
  factoryId,
  factoryName,
  productName,
  onQuoteReceived,
}: RfqProgressTrackerProps) {
  const { socket } = useSocket();
  const [currentStage, setCurrentStage] = useState<RfqStage>("rfq_processing_started");
  const [currentMessage, setCurrentMessage] = useState("AI 助手正在联络工厂，请稍候...");
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(15);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [inquiryId, setInquiryId] = useState<number | undefined>();
  const [quoteData, setQuoteData] = useState<RfqProgressPayload["quoteData"]>();

  // 倒计时
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const remainingMinutes = Math.max(0, estimatedMinutes - elapsedMinutes);

  // 监听 WebSocket 进度事件
  useEffect(() => {
    if (!socket) return;

    const handleProgress = (payload: RfqProgressPayload) => {
      if (payload.demandId !== demandId || payload.factoryId !== factoryId) return;

      setCurrentStage(payload.stage);
      setCurrentMessage(payload.message);
      if (payload.estimatedMinutes !== undefined) {
        setEstimatedMinutes(payload.estimatedMinutes);
      }
      if (payload.inquiryId) {
        setInquiryId(payload.inquiryId);
      }
      if (payload.quoteData) {
        setQuoteData(payload.quoteData);
      }
      if (payload.stage === "rfq_sent_to_buyer" && payload.inquiryId) {
        onQuoteReceived?.(payload.inquiryId);
      }
    };

    socket.on("rfq_progress", handleProgress);
    return () => {
      socket.off("rfq_progress", handleProgress);
    };
  }, [socket, demandId, factoryId, onQuoteReceived]);

  const isCompleted = currentStage === "rfq_sent_to_buyer";
  const isError = currentStage === "rfq_timeout" || currentStage === "rfq_failed";
  const currentStageIndex = getStageIndex(currentStage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-gradient-to-br from-[#0f0f1a]/90 to-[#1a1a2e]/90 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isCompleted ? "bg-green-500/20" :
              isError ? "bg-orange-500/20" :
              "bg-blue-500/20"
            }`}>
              {isCompleted ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : isError ? (
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                </motion.div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {factoryName} 报价进度
              </p>
              {productName && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {productName}
                </p>
              )}
            </div>
          </div>

          {/* 倒计时 */}
          {!isCompleted && !isError && (
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3 h-3" />
                <span>预计还需</span>
              </div>
              <p className="text-lg font-bold text-white">
                {remainingMinutes}<span className="text-xs text-gray-400 ml-0.5">分钟</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 进度步骤 */}
      <div className="px-5 py-4">
        <div className="space-y-3">
          {STAGE_ORDER.map((stage, idx) => {
            const config = STAGE_CONFIG[stage];
            const StageIcon = config.icon;
            const isActive = stage === currentStage && !isError;
            const isDone = currentStageIndex > idx || isCompleted;
            const isPending = currentStageIndex < idx && !isCompleted;

            return (
              <div key={stage} className="flex items-start gap-3">
                {/* 图标 */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  isDone ? "bg-green-500/20" :
                  isActive ? config.bg :
                  "bg-white/5"
                }`}>
                  {isDone ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <StageIcon className={`w-3.5 h-3.5 ${config.color}`} />
                    </motion.div>
                  ) : (
                    <StageIcon className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </div>

                {/* 文字 */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium transition-colors ${
                    isDone ? "text-green-400" :
                    isActive ? "text-white" :
                    "text-gray-600"
                  }`}>
                    {config.label}
                  </p>
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-gray-400 mt-0.5"
                    >
                      {currentMessage}
                    </motion.p>
                  )}
                </div>

                {/* 连接线 */}
                {idx < STAGE_ORDER.length - 1 && (
                  <div className="absolute left-[1.75rem] mt-8 w-0.5 h-3 bg-white/5" />
                )}
              </div>
            );
          })}

          {/* 超时/失败状态 */}
          {isError && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3"
            >
              <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-400">
                  {STAGE_CONFIG[currentStage]?.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{currentMessage}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 报价预览（报价生成后显示） */}
      <AnimatePresence>
        {quoteData && (currentStage === "rfq_generated" || currentStage === "rfq_confirmed" || currentStage === "rfq_sent_to_buyer") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/5"
          >
            <div className="px-5 py-3 bg-white/2">
              <p className="text-xs text-gray-500 mb-2">报价预览</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500">单价</p>
                  <p className="text-sm font-bold text-white">
                    {quoteData.currency} {quoteData.unitPrice.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">MOQ</p>
                  <p className="text-sm font-bold text-white">{quoteData.moq.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">交期</p>
                  <p className="text-sm font-bold text-white">{quoteData.leadTimeDays} 天</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 底部提示 */}
      <div className="px-5 py-3 border-t border-white/5 bg-white/2">
        <p className="text-xs text-gray-600 text-center">
          {isCompleted
            ? "✅ 报价已到达，请在上方查看详情"
            : isError
            ? "⚠️ 已通知工厂负责人，请稍后再查看"
            : "⏳ 报价生成中，您可以继续浏览其他工厂"}
        </p>
      </div>
    </motion.div>
  );
}
