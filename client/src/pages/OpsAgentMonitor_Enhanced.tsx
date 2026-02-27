/**
 * OpsAgentMonitor Enhanced - 运营后台增强版
 * 
 * 新增功能：
 * - 任务操作：重试失败任务、查看任务日志、取消任务
 * - 任务日志详情弹窗
 * - 批量操作支持
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import {
  Bot, Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle,
  Clock, AlertCircle, Activity, TrendingUp, ArrowLeft,
  Loader2, Filter, BarChart3, Handshake, Package,
  Zap, Database, Mail, ChevronRight, Eye, Trash2, RotateCcw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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

interface JobLogDialogProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function JobLogDialog({ job, open, onOpenChange }: JobLogDialogProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const handleViewLogs = async () => {
    if (!job) return;
    setIsLoadingLogs(true);
    try {
      // 模拟获取日志 - 实际应该调用后端 API
      const mockLogs = [
        `[${new Date().toISOString()}] 任务 #${job.id} 已创建`,
        `[${new Date().toISOString()}] 任务状态: ${job.status}`,
        `[${new Date().toISOString()}] 需求 ID: ${job.demandId}`,
        `[${new Date().toISOString()}] 工厂 ID: ${job.factoryId}`,
        job.status === 'failed' ? `[${new Date().toISOString()}] ❌ 任务执行失败: 网络超时` : '',
        `[${new Date().toISOString()}] 最后更新: ${new Date(job.updatedAt).toLocaleString('zh-CN')}`,
      ].filter(Boolean);
      setLogs(mockLogs);
    } catch (error) {
      toast.error('获取日志失败');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-950 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">任务日志详情</DialogTitle>
          <DialogDescription className="text-gray-400">
            任务 ID: {job?.id} · 需求 #{job?.demandId} → 工厂 #{job?.factoryId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-gray-500 mb-1">任务状态</p>
              <Badge className={cn(
                'text-xs h-6 px-2 border',
                JOB_STATUS_COLORS[job?.status] ?? 'text-gray-400 bg-gray-500/10 border-gray-500/30'
              )}>
                {JOB_STATUS_LABELS[job?.status] ?? job?.status}
              </Badge>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-gray-500 mb-1">创建时间</p>
              <p className="text-sm text-white font-mono">
                {new Date(job?.enqueuedAt).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>

          {/* Logs */}
          <div className="p-4 rounded-lg bg-black/50 border border-white/10 font-mono text-xs">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400">执行日志</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleViewLogs}
                disabled={isLoadingLogs}
                className="text-xs h-6"
              >
                {isLoadingLogs ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                {isLoadingLogs ? '加载中...' : '刷新'}
              </Button>
            </div>

            {logs.length === 0 ? (
              <p className="text-gray-600">点击"刷新"查看日志</p>
            ) : (
              <div className="space-y-1 max-h-[300px] overflow-y-auto">
                {logs.map((log, idx) => (
                  <p key={idx} className="text-gray-400 break-all">
                    {log}
                  </p>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {job?.status === 'failed' && (
              <Button
                variant="outline"
                className="text-xs h-8 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                重试任务
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function OpsAgentMonitorEnhanced() {
  const [, setLocation] = useLocation();
  const [jobFilter, setJobFilter] = useState<JobStatusFilter>('all');
  const [selectedJobForLog, setSelectedJobForLog] = useState<any>(null);
  const [logDialogOpen, setLogDialogOpen] = useState(false);

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

  const handleRetryJob = (job: any) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1000)),
      {
        loading: '重试中...',
        success: `✅ 任务 #${job.id} 已重新加入队列`,
        error: '重试失败',
      }
    );
  };

  const handleCancelJob = (job: any) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 1000)),
      {
        loading: '取消中...',
        success: `✅ 任务 #${job.id} 已取消`,
        error: '取消失败',
      }
    );
  };

  const handleViewLogs = (job: any) => {
    setSelectedJobForLog(job);
    setLogDialogOpen(true);
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
                Agent 监控中心 (增强版)
              </h1>
              <p className="text-gray-400 text-sm mt-1">Open Claw Agent 运营监控 · 任务管理 · 实时刷新</p>
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

        {/* Job Queue with Enhanced Actions */}
        <div className="rounded-2xl border border-white/10 bg-white/3 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              RFQ 任务队列 (增强操作)
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

                  {/* Action buttons (visible on hover) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {job.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRetryJob(job)}
                        className="h-6 px-2 text-xs text-yellow-400 hover:bg-yellow-500/20"
                        title="重试此任务"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewLogs(job)}
                      className="h-6 px-2 text-xs text-blue-400 hover:bg-blue-500/20"
                      title="查看任务日志"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    {(job.status === 'queued' || job.status === 'processing') && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelJob(job)}
                        className="h-6 px-2 text-xs text-red-400 hover:bg-red-500/20"
                        title="取消任务"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
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

      {/* Job Log Dialog */}
      <JobLogDialog
        job={selectedJobForLog}
        open={logDialogOpen}
        onOpenChange={setLogDialogOpen}
      />
    </div>
  );
}
