/**
 * QuoteSuccessStatsPanel
 * 运营后台 — 报价成功率统计面板
 * 展示核心业务指标：总报价数、接受率、转化率、工厂排行
 */
import { motion } from 'framer-motion';
import { trpc } from '../../utils/trpc';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple';
  delay?: number;
}

function StatCard({ label, value, sub, color = 'blue', delay = 0 }: StatCardProps) {
  const colorMap = {
    green:  'bg-green-50 border-green-200 text-green-700',
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red:    'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`rounded-xl border p-4 ${colorMap[color]}`}
    >
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </motion.div>
  );
}

interface RateBarProps {
  label: string;
  rate: number;
  color?: string;
}

function RateBar({ label, rate, color = 'bg-blue-500' }: RateBarProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span className="font-semibold">{rate}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${rate}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-2 rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export default function QuoteSuccessStatsPanel() {
  const { data: stats, isLoading: statsLoading } = trpc.ops.getQuoteSuccessStats.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const { data: factoryStats, isLoading: factoryLoading } = trpc.ops.getQuoteStatsByFactory.useQuery(
    { limit: 8 },
    { refetchInterval: 60_000 }
  );

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        加载报价统计数据中...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 核心指标卡片 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">核心业务指标</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="总报价数"
            value={stats?.totalQuotes ?? 0}
            sub={`近 7 天 +${stats?.quotesLast7d ?? 0}`}
            color="blue"
            delay={0}
          />
          <StatCard
            label="买家接受率"
            value={`${stats?.buyerAcceptRate ?? 0}%`}
            sub={`${stats?.acceptedQuotes ?? 0} 份已接受`}
            color="green"
            delay={0.05}
          />
          <StatCard
            label="报价响应率"
            value={`${stats?.responseRate ?? 0}%`}
            sub={`${stats?.pendingQuotes ?? 0} 份待回复`}
            color="yellow"
            delay={0.1}
          />
          <StatCard
            label="采购单转化率"
            value={`${stats?.conversionRate ?? 0}%`}
            sub={`共 ${stats?.totalPurchaseOrders ?? 0} 份采购单`}
            color="purple"
            delay={0.15}
          />
        </div>
      </div>

      {/* 报价状态分布 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">报价状态分布</h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats?.pendingQuotes ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">待回复</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats?.acceptedQuotes ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">已接受</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{stats?.rejectedQuotes ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">已拒绝</p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="space-y-2">
          <RateBar
            label="买家接受率"
            rate={stats?.buyerAcceptRate ?? 0}
            color="bg-green-500"
          />
          <RateBar
            label="报价响应率（已回复 / 总报价）"
            rate={stats?.responseRate ?? 0}
            color="bg-blue-500"
          />
          <RateBar
            label="采购单转化率（PO / 总报价）"
            rate={stats?.conversionRate ?? 0}
            color="bg-purple-500"
          />
        </div>
      </div>

      {/* 近期活跃度 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">近期活跃度</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
              {stats?.quotesLast7d ?? 0}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">近 7 天报价</p>
              <p className="text-xs text-gray-500">新增报价数量</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg">
              {stats?.quotesLast30d ?? 0}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">近 30 天报价</p>
              <p className="text-xs text-gray-500">新增报价数量</p>
            </div>
          </div>
        </div>
      </div>

      {/* 工厂报价排行 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">工厂报价排行（按总量）</h3>
        {factoryLoading ? (
          <p className="text-xs text-gray-400">加载中...</p>
        ) : factoryStats && factoryStats.length > 0 ? (
          <div className="space-y-2">
            {factoryStats.map((f, i) => (
              <motion.div
                key={f.factoryId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
              >
                {/* 排名 */}
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-400'}`}>
                  {i + 1}
                </span>
                {/* 工厂名 */}
                <span className="flex-1 text-sm text-gray-800 truncate">{f.factoryName}</span>
                {/* 统计 */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">{f.total} 份</span>
                  <span className="text-green-600 font-medium">{f.acceptRate}% 接受</span>
                  {/* 迷你进度条 */}
                  <div className="w-16 bg-gray-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-green-400"
                      style={{ width: `${f.acceptRate}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-4">暂无报价数据</p>
        )}
      </div>
    </div>
  );
}
