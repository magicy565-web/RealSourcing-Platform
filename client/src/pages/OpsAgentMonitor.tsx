/**
 * OpsAgentMonitor
 * 运营后台 - Open Claw Agent 任务监控页面
 *
 * 功能：
 *   - 全局 Agent 在线状态概览
 *   - RFQ 任务队列实时监控
 *   - 握手请求统计
 *   - 任务状态分布图
 *   - 最近任务列表（支持状态过滤）
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import {
  Bot, Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle,
  Clock, AlertCircle, Activity, TrendingUp, ArrowLeft,
  Loader2, Filter, BarChart3, Handshake, Package,
  Zap, Database, Mail, ChevronRight
} from 'lucide-react';
import QuoteSuccessStatsPanel from '@/components/ops/QuoteSuccessStatsPanel';
import NegotiationStatsPanel from '@/components/ops/NegotiationStatsPanel';

const JOB_STATUS_LABELS: Record<string, string> = {
  queued:     '排队中',
  processing: '处理中',
  completed:  '已完成',
  failed:     '失败',
  timeout:    '超时',
};

const JOB_STATUS_COLORS: Record<string, string> = {
  queued:     'text-blue-400 bg-blue-500/10 border-blue-500/30',
  processing: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  completed:  'text-green-400 bg-green-500/10 border-green-500/30',
  failed:     'text-red-400 bg-red-500/10 border-red-500/30',
  timeout:    'text-orange-400 bg-orange-500/10 border-orange-500/30',
};

const AGENT_STATUS_COLORS: Record<string, string> = {
  online:       'text-green-400',
  offline:      'text-gray-500',
  alert:        'text-red-400',
  maintenance:  'text-yellow-400',
  registered:   'text-blue-400',
};

const CAPABILITY_ICONS: Record<string, React.ReactNode> = {
  feishu_bitable: <Database className="w-3 h-3 text-blue-400" />,
  erp_api:        <Zap className="w-3 h-3 text-yellow-400" />,
  email_parser:   <Mail className="w-3 h-3 text-purple-400" />,
  manual:         <Activity className="w-3 h-3 text-gray-400" />,
};

type JobStatusFilter = 'all' | 'queued' | 'processing' | 'completed' | 'failed' | 'timeout';
type ActiveTab = 'agents' | 'quotes' | 'negotiation';

export default function OpsAgentMonitor() {
  const [, setLocation] = useLocation();
  const [jobFilter, setJobFilter] = useState<JobStatusFilter>('all');
  const [activeTab, setActiveTab] = useState<ActiveTab>('agents');

  const statsQuery = trpc.ops.getRfqStats.useQuery(undefined, { refetchInterval: 15000 });
  const handshakeStatsQuery = trpc.ops.getHandshakeStats.useQuery(undefined, { refetchInterval: 30000 });
  const agentsQuery = trpc.ops.getAllAgents.useQuery(undefined, { refetchInterval: 15000 });
  const jobsQuery = trpc.ops.getRfqJobs.useQuery(
    { status: jobFilter === 'all' ? undefined : jobFilter as any, limit: 50 },
    { refetchInterval: 10000 }
  );

  const stats = statsQuery.data;
  const handshakeStats = handshakeStatsQuery.data;
  const agents: any[] = (agentsQuery.data as any[]) ?? [];
  const jobs: any[] = (jobsQuery.data as any[]) ?? [];

  const isLoading = statsQuery.isLoading;

  const refetchAll = () => {
    statsQuery.refetch();
    handshakeStatsQuery.refetch();
    agentsQuery.refetch();
    jobsQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E] p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/')}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-white text-2xl font-bold flex items-center gap-2">
                <Bot className="w-6 h-6 text-purple-400" />
                Agent 监控中心
              </h1>
              <p className="text-gray-400 text-sm mt-1">Open Claw Agent 运营监控 · 实时刷新</p>
            </div>
          </div>
          <Button
            onClick={refetchAll}
            variant="outline"
            size="sm"
            className="border-white/20 text-gray-300 hover:bg-white/10 gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />刷新
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'agents'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Bot className="w-3.5 h-3.5 inline mr-1.5" />
            Agent 监控
          </button>
          <button
            onClick={() => setActiveTab('quotes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'quotes'
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />
            报价成功率
          </button>
          <button
            onClick={() => setActiveTab('negotiation')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'negotiation'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 inline mr-1.5" />
            议价分析
          </button>
        </div>

        {/* Negotiation Stats Tab */}
        {activeTab === 'negotiation' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <NegotiationStatsPanel />
          </div>
        )}

        {/* Quote Success Stats Tab */}
        {activeTab === 'quotes' && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
            <QuoteSuccessStatsPanel />
          </div>
        )}

        {/* Agent Monitor Tab */}
        {activeTab === 'agents' && <>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Online Agents */}
          <div className="p-4 rounded-2xl border border-green-500/20 bg-green-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-xs">在线 Agent</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats?.onlineAgents ?? '—'}</p>
            <p className="text-gray-500 text-xs mt-1">共 {agents.length} 个已注册</p>
          </div>

          {/* Pending Jobs */}
          <div className="p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-400 text-xs">待处理任务</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats?.pendingJobs ?? '—'}</p>
            <p className="text-gray-500 text-xs mt-1">24h 新增 {stats?.jobsLast24h ?? 0} 条</p>
          </div>

          {/* Completed Jobs */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-gray-400 text-xs">已完成任务</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats?.completedJobs ?? '—'}</p>
            <p className="text-gray-500 text-xs mt-1">
              成功率 {stats?.totalJobs ? Math.round((stats.completedJobs / stats.totalJobs) * 100) : 0}%
            </p>
          </div>

          {/* Handshake Accept Rate */}
          <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5">
            <div className="flex items-center gap-2 mb-2">
              <Handshake className="w-4 h-4 text-purple-400" />
              <span className="text-gray-400 text-xs">握手接受率</span>
            </div>
            <p className="text-white text-3xl font-bold">{handshakeStats?.acceptRate ?? '—'}%</p>
            <p className="text-gray-500 text-xs mt-1">
              共 {handshakeStats?.total ?? 0} 次握手请求
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Agent 状态列表
              </h2>
              {agentsQuery.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                </div>
              ) : agents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <WifiOff className="w-10 h-10 text-gray-700 mb-3" />
                  <p className="text-gray-400 text-sm">暂无已注册 Agent</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {agents.map((agent: any) => (
                    <div key={agent.id} className="p-3 rounded-xl bg-white/5 border border-white/8">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'w-2 h-2 rounded-full flex-shrink-0',
                              agent.status === 'online' ? 'bg-green-400 animate-pulse' :
                              agent.status === 'alert' ? 'bg-red-400' :
                              'bg-gray-600'
                            )} />
                            <span className={cn('text-xs font-medium', AGENT_STATUS_COLORS[agent.status] ?? 'text-gray-400')}>
                              {agent.status === 'online' ? '在线' :
                               agent.status === 'offline' ? '离线' :
                               agent.status === 'alert' ? '告警' :
                               agent.status === 'registered' ? '已注册' : agent.status}
                            </span>
                            {agent.version && (
                              <span className="text-gray-600 text-[10px]">v{agent.version}</span>
                            )}
                          </div>
                          <p className="text-gray-500 text-[10px] mt-0.5 font-mono truncate">
                            {agent.agentId}
                          </p>
                          {agent.factoryName && (
                            <p className="text-gray-400 text-xs mt-0.5">{agent.factoryName}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-white text-xs font-semibold">{agent.activeJobs ?? 0}</p>
                          <p className="text-gray-600 text-[10px]">进行中</p>
                        </div>
                      </div>
                      {/* Capabilities */}
                      {agent.capabilities && (agent.capabilities as any[]).length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {(agent.capabilities as any[]).filter((c: any) => c.isConfigured).map((cap: any) => (
                            <div key={cap.type} className="flex items-center gap-0.5 bg-white/5 px-1.5 py-0.5 rounded-md">
                              {CAPABILITY_ICONS[cap.type]}
                            </div>
                          ))}
                        </div>
                      )}
                      {agent.lastHeartbeatAt && (
                        <p className="text-gray-700 text-[10px] mt-1.5">
                          心跳 {new Date(agent.lastHeartbeatAt).toLocaleTimeString('zh-CN')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Handshake Stats */}
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5 mt-4">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Handshake className="w-4 h-4 text-purple-400" />
                握手请求统计
              </h2>
              {handshakeStatsQuery.isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: '总请求数', value: handshakeStats?.total ?? 0, color: 'text-white' },
                    { label: '已接受', value: handshakeStats?.accepted ?? 0, color: 'text-green-400' },
                    { label: '待处理', value: handshakeStats?.pending ?? 0, color: 'text-yellow-400' },
                    { label: '已拒绝', value: handshakeStats?.rejected ?? 0, color: 'text-red-400' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">{item.label}</span>
                      <span className={cn('font-bold text-sm', item.color)}>{item.value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-white/8">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">接受率</span>
                      <span className="text-purple-400 font-bold text-sm">{handshakeStats?.acceptRate ?? 0}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${handshakeStats?.acceptRate ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Job Queue */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-400" />
                  RFQ 任务队列
                </h2>
                {/* Filter */}
                <div className="flex items-center gap-1">
                  <Filter className="w-3 h-3 text-gray-500" />
                  <div className="flex gap-1">
                    {(['all', 'queued', 'processing', 'completed', 'failed'] as JobStatusFilter[]).map(status => (
                      <button
                        key={status}
                        onClick={() => setJobFilter(status)}
                        className={cn(
                          'px-2 py-1 rounded-md text-xs transition-all',
                          jobFilter === status
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        )}
                      >
                        {status === 'all' ? '全部' : JOB_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {jobsQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                </div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="w-10 h-10 text-gray-700 mb-3" />
                  <p className="text-gray-400 text-sm">暂无任务记录</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {jobs.map((job: any) => (
                    <div key={job.id} className="p-3 rounded-xl bg-white/5 border border-white/8 flex items-center gap-3 group hover:bg-white/8 transition-all">
                      {/* Status indicator */}
                      <div className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        job.status === 'completed' ? 'bg-green-400' :
                        job.status === 'failed' ? 'bg-red-400' :
                        job.status === 'processing' ? 'bg-yellow-400 animate-pulse' :
                        job.status === 'timeout' ? 'bg-orange-400' :
                        'bg-blue-400'
                      )} />

                      {/* Job info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white text-xs font-medium">
                            Demand #{job.demandId}
                          </span>
                          <span className="text-gray-500 text-xs">→</span>
                          <span className="text-gray-300 text-xs">
                            Factory #{job.factoryId}
                          </span>
                          {job.category && (
                            <Badge variant="outline" className="text-[10px] h-4 border-white/20 text-gray-400 px-1.5">
                              {job.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-gray-600 text-[10px]">
                            {new Date(job.enqueuedAt).toLocaleString('zh-CN')}
                          </span>
                          {job.taskId && (
                            <span className="text-gray-700 text-[10px] font-mono truncate max-w-[200px]">
                              {job.taskId}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status badge */}
                      <Badge className={cn(
                        'text-[10px] h-5 px-2 border flex-shrink-0',
                        JOB_STATUS_COLORS[job.status] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/30'
                      )}>
                        {JOB_STATUS_LABELS[job.status] ?? job.status}
                      </Badge>

                      {/* Agent pushed indicator */}
                      {job.agentPushed === 1 && (
                        <Bot className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" title="已推送给 Agent" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Summary footer */}
              <div className="mt-4 pt-3 border-t border-white/8 flex items-center justify-between text-xs text-gray-500">
                <span>显示最近 {jobs.length} 条记录</span>
                <div className="flex items-center gap-3">
                  <span>总计 {stats?.totalJobs ?? 0} 条</span>
                  {stats?.failedJobs ? (
                    <span className="text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {stats.failedJobs} 条失败
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
        </> /* end agents tab */}
      </div>
    </div>
  );
}
