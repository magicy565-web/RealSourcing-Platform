/**
 * OpenClawAgentStatus
 * 工厂仪表板中显示 Open Claw Agent 在线状态的组件
 *
 * 功能：
 *   - 实时显示 Agent 在线/离线状态
 *   - 显示 Agent 能力声明（飞书/ERP/邮件）
 *   - 显示当前活跃任务数和历史统计
 *   - 支持手动刷新
 */
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Bot, Zap, Database, Mail, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentCapability {
  type: 'feishu_bitable' | 'erp_api' | 'email_parser' | 'manual';
  isConfigured: boolean;
  priority: number;
}

interface AgentInfo {
  agentId: string;
  factoryId: number;
  factoryName?: string;
  status: 'registered' | 'online' | 'offline' | 'alert' | 'maintenance';
  version: string;
  deployEnv: string;
  capabilities: AgentCapability[];
  lastHeartbeatAt: string;
  registeredAt: string;
  activeJobs: number;
  totalJobsProcessed: number;
  totalJobsFailed: number;
  pendingTaskCount: number;
  timeSinceHeartbeatMs: number;
}

interface OpenClawAgentStatusProps {
  factoryId?: number;
  className?: string;
  compact?: boolean;
}

const CAPABILITY_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  feishu_bitable: {
    label: '飞书报价库',
    icon: <Database className="w-3 h-3" />,
    color: 'text-blue-400',
  },
  erp_api: {
    label: 'ERP 系统',
    icon: <Zap className="w-3 h-3" />,
    color: 'text-yellow-400',
  },
  email_parser: {
    label: '邮件解析',
    icon: <Mail className="w-3 h-3" />,
    color: 'text-purple-400',
  },
  manual: {
    label: '人工填写',
    icon: <Activity className="w-3 h-3" />,
    color: 'text-gray-400',
  },
};

export function OpenClawAgentStatus({ factoryId, className, compact = false }: OpenClawAgentStatusProps) {
  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchAgentStatus = async () => {
    setIsLoading(true);
    try {
      const clawSecret = (import.meta as any).env?.VITE_CLAW_AGENT_SECRET;
      const headers: Record<string, string> = {};
      if (clawSecret) headers['X-Claw-Secret'] = clawSecret;

      const response = await fetch('/api/v1/claw/status', { headers });
      if (!response.ok) throw new Error('Failed to fetch agent status');

      const data = await response.json();
      const agents: AgentInfo[] = data.agents ?? [];

      const targetAgent = factoryId
        ? agents.find(a => a.factoryId === factoryId)
        : agents[0];

      setAgentInfo(targetAgent ?? null);
      setLastRefreshed(new Date());
    } catch (err) {
      console.warn('[OpenClawAgentStatus] Failed to fetch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId]);

  const isOnline = agentInfo?.status === 'online';

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn(
          'w-2 h-2 rounded-full',
          isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
        )} />
        <span className={cn('text-xs', isOnline ? 'text-green-400' : 'text-gray-500')}>
          {isOnline ? 'AI 助手在线' : 'AI 助手离线'}
        </span>
        {isOnline && agentInfo && agentInfo.activeJobs > 0 && (
          <span className="text-xs text-blue-400">({agentInfo.activeJobs} 任务进行中)</span>
        )}
      </div>
    );
  }

  return (
    <div className={cn('bg-white/5 border border-white/10 rounded-xl p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-purple-400" />
          <span className="text-white text-sm font-medium">Open Claw Agent</span>
          {agentInfo?.version && (
            <span className="text-gray-600 text-xs">v{agentInfo.version}</span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={fetchAgentStatus}
          disabled={isLoading}
          className="h-6 w-6 p-0 text-gray-500 hover:text-white"
        >
          <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
        </Button>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-3">
        {isOnline ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-medium">在线</span>
            <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400 bg-green-500/10 h-4">
              {agentInfo?.deployEnv === 'aliyun_wuying' ? '阿里云无影' : agentInfo?.deployEnv ?? 'local'}
            </Badge>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-gray-600" />
            <span className="text-gray-500 text-sm">
              {!agentInfo ? '未部署' : '离线'}
            </span>
            {!agentInfo && (
              <span className="text-gray-600 text-xs">（部署后自动连接）</span>
            )}
          </>
        )}
      </div>

      {/* Capabilities */}
      {agentInfo?.capabilities && agentInfo.capabilities.length > 0 && (
        <div className="mb-3">
          <p className="text-gray-500 text-xs mb-1.5">数据源能力</p>
          <div className="flex flex-wrap gap-1.5">
            {agentInfo.capabilities.map((cap) => {
              const capInfo = CAPABILITY_LABELS[cap.type];
              return (
                <div
                  key={cap.type}
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border',
                    cap.isConfigured
                      ? 'border-white/20 bg-white/5'
                      : 'border-white/10 bg-white/3 opacity-50'
                  )}
                >
                  <span className={capInfo?.color ?? 'text-gray-400'}>
                    {capInfo?.icon}
                  </span>
                  <span className="text-gray-300">{capInfo?.label ?? cap.type}</span>
                  {!cap.isConfigured && <span className="text-gray-600">(未配置)</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      {agentInfo && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
          <div className="text-center">
            <p className="text-white text-sm font-semibold">{agentInfo.activeJobs}</p>
            <p className="text-gray-600 text-[10px]">进行中</p>
          </div>
          <div className="text-center">
            <p className="text-green-400 text-sm font-semibold">{agentInfo.totalJobsProcessed}</p>
            <p className="text-gray-600 text-[10px]">已完成</p>
          </div>
          <div className="text-center">
            <p className={cn('text-sm font-semibold', agentInfo.totalJobsFailed > 0 ? 'text-red-400' : 'text-gray-500')}>
              {agentInfo.totalJobsFailed}
            </p>
            <p className="text-gray-600 text-[10px]">失败</p>
          </div>
        </div>
      )}

      {/* Last heartbeat */}
      {agentInfo && lastRefreshed && (
        <p className="text-gray-700 text-[10px] mt-2 text-right">
          最后心跳：{new Date(agentInfo.lastHeartbeatAt).toLocaleTimeString('zh-CN')}
        </p>
      )}
    </div>
  );
}

export default OpenClawAgentStatus;
