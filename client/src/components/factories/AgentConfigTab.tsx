/**
 * AgentConfigTab
 * 工厂仪表板 - AI 助手配置 Tab
 *
 * 功能：
 *   - 显示 Open Claw Agent 在线状态和版本信息
 *   - 显示 Agent 能力声明（飞书/ERP/邮件）
 *   - 提供部署指引（阿里云无影 / Docker / 本地）
 *   - 任务历史记录（最近 20 条）
 *   - 启用/禁用 Agent 开关
 */
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Bot, Wifi, WifiOff, RefreshCw, CheckCircle2, XCircle,
  Clock, AlertCircle, Database, Zap, Mail, Activity,
  Copy, ExternalLink, Terminal, Package,
  BarChart3, Loader2, ToggleLeft, ToggleRight
} from 'lucide-react';

const CAPABILITY_ICONS: Record<string, React.ReactNode> = {
  feishu_bitable: <Database className="w-4 h-4 text-blue-400" />,
  erp_api:        <Zap className="w-4 h-4 text-yellow-400" />,
  email_parser:   <Mail className="w-4 h-4 text-purple-400" />,
  manual:         <Activity className="w-4 h-4 text-gray-400" />,
};

const CAPABILITY_LABELS: Record<string, string> = {
  feishu_bitable: '飞书多维表格',
  erp_api:        'ERP 系统 API',
  email_parser:   '邮件报价解析',
  manual:         '人工填写兜底',
};

const CAPABILITY_DESCS: Record<string, string> = {
  feishu_bitable: '从飞书 Bitable 自动读取历史报价，实现秒级响应',
  erp_api:        '对接工厂 ERP 系统，实时获取库存和报价',
  email_parser:   '解析工厂邮件中的报价信息（开发中）',
  manual:         '当所有自动化方式失败时，由工厂人工填写报价',
};

const STATUS_COLORS: Record<string, string> = {
  online:       'text-green-400',
  offline:      'text-gray-500',
  alert:        'text-red-400',
  maintenance:  'text-yellow-400',
  registered:   'text-blue-400',
};

const STATUS_LABELS: Record<string, string> = {
  online:       '在线',
  offline:      '离线',
  alert:        '告警',
  maintenance:  '维护中',
  registered:   '已注册（待上线）',
};

const JOB_STATUS_COLORS: Record<string, string> = {
  queued:     'text-blue-400',
  processing: 'text-yellow-400',
  completed:  'text-green-400',
  failed:     'text-red-400',
  timeout:    'text-orange-400',
};

const DEPLOY_STEPS = [
  {
    step: 1,
    title: '下载 Open Claw Agent',
    desc: '从 GitHub 下载最新版本的 Open Claw Agent 安装包',
    code: 'gh release download --repo realsourcing/open-claw-agent --pattern "*.zip"',
  },
  {
    step: 2,
    title: '配置 Agent',
    desc: '编辑 config.json，填入平台密钥和工厂 ID',
    code: '{\n  "serverUrl": "https://app.realsourcing.com",\n  "agentSecret": "<YOUR_SECRET>",\n  "factoryId": <YOUR_FACTORY_ID>\n}',
  },
  {
    step: 3,
    title: '启动 Agent',
    desc: '在阿里云无影或本地环境启动 Agent',
    code: 'node agent.js start --env aliyun_wuying',
  },
];

export function AgentConfigTab() {
  const [activeSection, setActiveSection] = useState<'status' | 'deploy' | 'history'>('status');
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const { data: agentConfig, isLoading, refetch } = trpc.factoryDashboard.getAgentConfig.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const { data: taskHistory = [], isLoading: isHistoryLoading } = trpc.factoryDashboard.getAgentTaskHistory.useQuery(undefined, {
    enabled: activeSection === 'history',
  });

  const toggleAgentMutation = trpc.factoryDashboard.toggleAgent.useMutation({
    onSuccess: (res) => {
      refetch();
      toast.success(res.isEnabled ? 'AI 助手已启用' : 'AI 助手已禁用');
    },
    onError: (err) => toast.error('操作失败: ' + err.message),
  });

  const isOnline = agentConfig?.agentStatus === 'online';
  const hasAgent = !!agentConfig?.agentId;

  const copyCode = (code: string, step: number) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedStep(step);
      setTimeout(() => setCopiedStep(null), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white text-xl font-bold flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            AI 助手配置
          </h2>
          <p className="text-gray-400 text-sm mt-1">Open Claw Agent 自动化报价系统</p>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => refetch()}
          className="text-gray-400 hover:text-white h-8"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />刷新
        </Button>
      </div>

      {/* Status Card */}
      <div className={cn(
        'rounded-2xl border p-5 transition-all',
        isOnline
          ? 'border-green-500/30 bg-green-500/5'
          : hasAgent
          ? 'border-yellow-500/20 bg-yellow-500/5'
          : 'border-white/10 bg-white/3'
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              isOnline ? 'bg-green-500/20' : 'bg-white/5'
            )}>
              {isOnline
                ? <Wifi className="w-5 h-5 text-green-400" />
                : <WifiOff className="w-5 h-5 text-gray-500" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={cn('font-semibold', STATUS_COLORS[agentConfig?.agentStatus ?? 'offline'])}>
                  {STATUS_LABELS[agentConfig?.agentStatus ?? 'offline']}
                </span>
                {isOnline && (
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                )}
                {agentConfig?.agentVersion && (
                  <Badge variant="outline" className="text-[10px] border-white/20 text-gray-400 h-4">
                    v{agentConfig.agentVersion}
                  </Badge>
                )}
              </div>
              {agentConfig?.agentId ? (
                <p className="text-gray-500 text-xs mt-0.5 font-mono">{agentConfig.agentId}</p>
              ) : (
                <p className="text-gray-500 text-xs mt-0.5">尚未部署 Agent</p>
              )}
            </div>
          </div>

          {/* Enable/Disable Toggle */}
          {hasAgent && (
            <button
              onClick={() => toggleAgentMutation.mutate({ isEnabled: !(agentConfig?.isEnabled) })}
              disabled={toggleAgentMutation.isPending}
              className="flex items-center gap-1.5 text-sm transition-colors"
            >
              {toggleAgentMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              ) : agentConfig?.isEnabled ? (
                <>
                  <ToggleRight className="w-6 h-6 text-green-400" />
                  <span className="text-green-400 text-xs">已启用</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-6 h-6 text-gray-500" />
                  <span className="text-gray-500 text-xs">已禁用</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Stats Row */}
        {hasAgent && (
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/5">
            <div className="text-center">
              <p className="text-white text-lg font-bold">{agentConfig?.activeJobs ?? 0}</p>
              <p className="text-gray-500 text-xs">进行中</p>
            </div>
            <div className="text-center">
              <p className="text-green-400 text-lg font-bold">{agentConfig?.totalJobsProcessed ?? 0}</p>
              <p className="text-gray-500 text-xs">已完成</p>
            </div>
            <div className="text-center">
              <p className={cn('text-lg font-bold', (agentConfig?.totalJobsFailed ?? 0) > 0 ? 'text-red-400' : 'text-gray-600')}>
                {agentConfig?.totalJobsFailed ?? 0}
              </p>
              <p className="text-gray-500 text-xs">失败</p>
            </div>
          </div>
        )}

        {agentConfig?.lastHeartbeatAt && (
          <p className="text-gray-700 text-xs mt-3 text-right">
            最后心跳：{new Date(agentConfig.lastHeartbeatAt).toLocaleString('zh-CN')}
          </p>
        )}
      </div>

      {/* Capabilities */}
      {hasAgent && agentConfig?.capabilities && (agentConfig.capabilities as any[]).length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-sm mb-3">数据源能力</h3>
          <div className="grid grid-cols-2 gap-3">
            {(agentConfig.capabilities as any[]).map((cap: any) => (
              <div
                key={cap.type}
                className={cn(
                  'p-4 rounded-xl border transition-all',
                  cap.isConfigured
                    ? 'border-white/15 bg-white/5'
                    : 'border-white/8 bg-white/2 opacity-60'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {CAPABILITY_ICONS[cap.type] ?? <Activity className="w-4 h-4 text-gray-400" />}
                  <span className="text-white text-sm font-medium">
                    {CAPABILITY_LABELS[cap.type] ?? cap.type}
                  </span>
                  {cap.isConfigured ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 ml-auto" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-gray-600 ml-auto" />
                  )}
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  {CAPABILITY_DESCS[cap.type] ?? ''}
                </p>
                {!cap.isConfigured && (
                  <span className="inline-block mt-2 text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                    未配置
                  </span>
                )}
                {cap.isConfigured && (
                  <span className="inline-block mt-2 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                    优先级 {cap.priority}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {[
          { id: 'status' as const, label: '状态概览', icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { id: 'deploy' as const, label: '部署指引', icon: <Terminal className="w-3.5 h-3.5" /> },
          { id: 'history' as const, label: '任务历史', icon: <Clock className="w-3.5 h-3.5" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm transition-all border-b-2 -mb-px',
              activeSection === tab.id
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            )}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Status Section */}
      {activeSection === 'status' && (
        <div className="space-y-4">
          {!hasAgent ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="w-14 h-14 text-gray-700 mb-4" />
              <h3 className="text-white font-semibold mb-2">尚未部署 AI 助手</h3>
              <p className="text-gray-500 text-sm max-w-sm">
                部署 Open Claw Agent 后，系统将自动从您的飞书报价库或 ERP 系统获取报价，
                买家接受握手后无需人工干预即可完成报价。
              </p>
              <Button
                onClick={() => setActiveSection('deploy')}
                className="mt-4 bg-purple-600 hover:bg-purple-500 gap-2"
              >
                <Terminal className="w-4 h-4" />查看部署指引
              </Button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <h4 className="text-white text-sm font-medium mb-3">Agent 工作原理</h4>
              <div className="space-y-3">
                {[
                  { step: '1', label: '买家发起握手请求', desc: '买家在匹配结果中点击"请求对话"' },
                  { step: '2', label: '工厂接受握手', desc: '您点击"接受"后，系统自动触发报价流程' },
                  { step: '3', label: 'Agent 获取报价', desc: '优先查询飞书 Bitable，未命中则调用 ERP API' },
                  { step: '4', label: '报价自动推送', desc: '买家在沟通室实时收到报价通知' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-purple-300 text-[10px] font-bold">{s.step}</span>
                    </div>
                    <div>
                      <p className="text-white text-xs font-medium">{s.label}</p>
                      <p className="text-gray-500 text-xs">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Deploy Guide Section */}
      {activeSection === 'deploy' && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            按照以下步骤在您的工厂电脑或阿里云无影实例上部署 Open Claw Agent：
          </p>
          {DEPLOY_STEPS.map(step => (
            <div key={step.step} className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-6 h-6 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-300 text-xs font-bold">{step.step}</span>
                </div>
                <div>
                  <h4 className="text-white text-sm font-medium">{step.title}</h4>
                  <p className="text-gray-500 text-xs mt-0.5">{step.desc}</p>
                </div>
              </div>
              <div className="relative">
                <pre className="bg-black/40 rounded-lg p-3 text-xs text-green-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {step.code}
                </pre>
                <button
                  onClick={() => copyCode(step.code, step.step)}
                  className="absolute top-2 right-2 p-1.5 rounded bg-white/10 hover:bg-white/20 transition-all"
                >
                  {copiedStep === step.step ? (
                    <CheckCircle2 className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          ))}

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 text-sm font-medium">需要帮助？</p>
                <p className="text-blue-400/70 text-xs mt-1">
                  查看完整文档或联系技术支持获取部署协助。
                  Agent 支持阿里云无影、Docker 和本地环境三种部署方式。
                </p>
                <a
                  href="https://docs.realsourcing.com/open-claw-agent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-blue-400 hover:text-blue-300 text-xs transition-colors"
                >
                  查看完整文档 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task History Section */}
      {activeSection === 'history' && (
        <div>
          {isHistoryLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            </div>
          ) : (taskHistory as any[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-10 h-10 text-gray-700 mb-3" />
              <p className="text-gray-400 text-sm">暂无任务历史</p>
              <p className="text-gray-600 text-xs mt-1">Agent 处理报价任务后，记录会在这里显示</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(taskHistory as any[]).map((job: any) => (
                <div key={job.id} className="p-3 rounded-xl bg-white/5 border border-white/8 flex items-center gap-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    job.status === 'completed' ? 'bg-green-400' :
                    job.status === 'failed' ? 'bg-red-400' :
                    job.status === 'processing' ? 'bg-yellow-400 animate-pulse' :
                    'bg-blue-400'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-xs font-medium">
                        Demand #{job.demandId}
                      </span>
                      <span className={cn('text-xs', JOB_STATUS_COLORS[job.status] ?? 'text-gray-400')}>
                        {job.status === 'completed' ? '已完成' :
                         job.status === 'failed' ? '失败' :
                         job.status === 'processing' ? '处理中' :
                         job.status === 'queued' ? '排队中' : job.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-[10px] mt-0.5">
                      {new Date(job.enqueuedAt).toLocaleString('zh-CN')}
                      {job.category && ` · ${job.category}`}
                    </p>
                  </div>
                  {job.status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  )}
                  {job.status === 'failed' && (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AgentConfigTab;
