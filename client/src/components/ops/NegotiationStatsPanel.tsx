/**
 * NegotiationStatsPanel - 运营后台 4.4 议价统计面板
 * 功能：议价成功率、AI 置信度趋势、工厂评分排行、历史成交数据学习效果
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  TrendingUp, TrendingDown, BarChart3, Star,
  MessageSquare, CheckCircle, XCircle, RefreshCw,
  Award, Zap, Target, DollarSign
} from "lucide-react";

export default function NegotiationStatsPanel() {
  const [selectedFactoryId, setSelectedFactoryId] = useState<number | null>(null);

  const { data: stats, isLoading } = trpc.negotiation.getStats.useQuery(undefined, {
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        <span className="ml-2 text-gray-500 text-sm">加载议价统计数据...</span>
      </div>
    );
  }

  const sessions = stats?.sessions;
  const transactions = stats?.transactions;

  return (
    <div className="space-y-6">
      {/* 顶部 KPI 卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 议价成功率 */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full font-medium">
              {sessions?.total ?? 0} 次
            </span>
          </div>
          <p className="text-3xl font-bold text-green-700">{sessions?.successRate ?? 0}%</p>
          <p className="text-sm text-green-600 mt-1">议价成功率</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-green-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              接受 {sessions?.accepted ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              拒绝 {sessions?.rejected ?? 0}
            </span>
          </div>
        </div>

        {/* AI 置信度 */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full font-medium">
              AI 分析
            </span>
          </div>
          <p className="text-3xl font-bold text-indigo-700">
            {Math.round(sessions?.avgAiConfidence ?? 0)}%
          </p>
          <p className="text-sm text-indigo-600 mt-1">平均 AI 置信度</p>
          <div className="mt-2 w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${sessions?.avgAiConfidence ?? 0}%` }}
            />
          </div>
        </div>

        {/* 平均议价轮次 */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
              轮次
            </span>
          </div>
          <p className="text-3xl font-bold text-amber-700">
            {(sessions?.avgRounds ?? 0).toFixed(1)}
          </p>
          <p className="text-sm text-amber-600 mt-1">平均谈判轮次</p>
          <p className="text-xs text-amber-500 mt-1">轮次越少，效率越高</p>
        </div>

        {/* 成交议价率 */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full font-medium">
              {transactions?.total ?? 0} 笔
            </span>
          </div>
          <p className="text-3xl font-bold text-blue-700">
            {transactions?.negotiationRate ?? 0}%
          </p>
          <p className="text-sm text-blue-600 mt-1">成交含议价比例</p>
          <p className="text-xs text-blue-500 mt-1">
            平均降价 {(transactions?.avgPriceDiscount ?? 0).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* 议价流程分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 议价状态分布 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">议价状态分布</h3>
          </div>
          <div className="space-y-3">
            {[
              {
                label: "议价成功",
                value: sessions?.accepted ?? 0,
                total: sessions?.total ?? 1,
                color: "bg-green-500",
                textColor: "text-green-700",
              },
              {
                label: "议价拒绝",
                value: sessions?.rejected ?? 0,
                total: sessions?.total ?? 1,
                color: "bg-red-400",
                textColor: "text-red-600",
              },
              {
                label: "进行中",
                value: Math.max(0, (sessions?.total ?? 0) - (sessions?.accepted ?? 0) - (sessions?.rejected ?? 0)),
                total: sessions?.total ?? 1,
                color: "bg-amber-400",
                textColor: "text-amber-600",
              },
            ].map(({ label, value, total, color, textColor }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">{label}</span>
                  <span className={`text-xs font-semibold ${textColor}`}>
                    {value} ({total > 0 ? Math.round(value / total * 100) : 0}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${total > 0 ? (value / total * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI 学习效果 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-700">AI 学习效果</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-indigo-700">数据飞轮状态</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-indigo-700">{transactions?.total ?? 0}</p>
                  <p className="text-xs text-indigo-500">历史成交样本</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700">{sessions?.total ?? 0}</p>
                  <p className="text-xs text-purple-500">议价训练样本</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">AI 能力成熟度</p>
              {[
                {
                  label: "价格弹性预测",
                  maturity: Math.min(100, (transactions?.total ?? 0) * 5),
                  description: `基于 ${transactions?.total ?? 0} 笔成交数据`,
                },
                {
                  label: "谈判风格识别",
                  maturity: Math.min(100, (sessions?.total ?? 0) * 8),
                  description: `基于 ${sessions?.total ?? 0} 次议价记录`,
                },
                {
                  label: "反提案质量",
                  maturity: Math.min(100, Math.round(sessions?.avgAiConfidence ?? 0)),
                  description: `当前置信度 ${Math.round(sessions?.avgAiConfidence ?? 0)}%`,
                },
              ].map(({ label, maturity, description }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-24 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-700"
                      style={{ width: `${maturity}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-28 shrink-0 text-right">{description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 说明提示 */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-800 mb-1">4.4 数据飞轮说明</p>
            <p className="text-xs text-indigo-600 leading-relaxed">
              每次成交后，系统自动将成交数据写入 <code className="bg-indigo-100 px-1 rounded">transaction_history</code>，
              并触发工厂评分重新计算（<code className="bg-indigo-100 px-1 rounded">factory_scores</code>）。
              AI 在下次议价时会优先参考该工厂的历史价格弹性和谈判风格，使反提案越来越精准。
              随着样本积累，AI 置信度将持续提升。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
