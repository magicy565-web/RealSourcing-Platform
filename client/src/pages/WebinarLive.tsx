import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { WebinarProvider } from '@/contexts/WebinarContext';
import { WebinarChat } from '@/components/webinar/WebinarChat';
import { WebinarProducts } from '@/components/webinar/WebinarProducts';
import { WebinarHandRaises, type HandRaiseRequest } from '@/components/webinar/WebinarHandRaises';
import { AgoraVideoCall } from '@/components/AgoraVideoCall';
import { AgoraTranscription } from '@/components/AgoraTranscription';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  Radio, Users, Heart, ArrowLeft, Volume2, VolumeX,
  Square, Loader2, Package, MessageSquare,
  Hand, Sparkles, Bell, Target, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  draft:     { label: '草稿',   color: 'bg-gray-500/20 text-gray-400',  dot: 'bg-gray-400' },
  scheduled: { label: '待开播', color: 'bg-blue-500/20 text-blue-400',  dot: 'bg-blue-400' },
  live:      { label: '直播中', color: 'bg-red-500/20 text-red-400',    dot: 'bg-red-400 animate-pulse' },
  ended:     { label: '已结束', color: 'bg-gray-500/20 text-gray-400',  dot: 'bg-gray-400' },
};

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number | string; color: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border', color)}>
      <div className="opacity-70">{icon}</div>
      <div>
        <p className="text-xl font-black text-white">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}

const LEAD_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:       { label: '新线索', color: 'bg-orange-500/20 text-orange-400' },
  contacted: { label: '已联系', color: 'bg-blue-500/20 text-blue-400' },
  qualified: { label: '已确认', color: 'bg-purple-500/20 text-purple-400' },
  converted: { label: '已成交', color: 'bg-green-500/20 text-green-400' },
  lost:      { label: '已流失', color: 'bg-gray-500/20 text-gray-400' },
};

function LeadsPanel({ leads, onUpdateStatus, onRefresh }: {
  leads: any[];
  onUpdateStatus: (id: number, status: string) => void;
  onRefresh: () => void;
}) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
        <Target className="w-10 h-10 text-gray-600" />
        <p className="text-gray-500 text-sm text-center">暂无意向线索</p>
        <p className="text-gray-600 text-xs text-center">买家点击抢单按钮后，线索将实时出现在这里</p>
        <Button variant="ghost" size="sm" onClick={onRefresh} className="text-gray-500 hover:text-white">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
        <span className="text-gray-400 text-sm font-medium">{leads.length} 条线索</span>
        <Button variant="ghost" size="sm" onClick={onRefresh} className="text-gray-500 hover:text-white h-7 px-2">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {leads.map((lead: any) => {
          const statusCfg = LEAD_STATUS_LABELS[lead.status] || LEAD_STATUS_LABELS.new;
          return (
            <div key={lead.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-white text-sm font-medium">{lead.buyerName || '匿名买家'}</p>
                  <p className="text-gray-500 text-xs">{lead.buyerEmail || '—'}</p>
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full flex-shrink-0', statusCfg.color)}>
                  {statusCfg.label}
                </span>
              </div>
              <div className="text-gray-400 text-xs mb-3">
                <span className="font-medium text-gray-300">{lead.productName}</span>
                {lead.quantity && <span> · {lead.quantity}</span>}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {lead.status === 'new' && (
                  <button onClick={() => onUpdateStatus(lead.id, 'contacted')}
                    className="text-[10px] px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                    标记已联系
                  </button>
                )}
                {(lead.status === 'new' || lead.status === 'contacted') && (
                  <button onClick={() => onUpdateStatus(lead.id, 'qualified')}
                    className="text-[10px] px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                    确认意向
                  </button>
                )}
                {lead.status !== 'converted' && lead.status !== 'lost' && (
                  <button onClick={() => onUpdateStatus(lead.id, 'converted')}
                    className="text-[10px] px-2 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                    ✓ 已成交
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WebinarLiveContent({ webinarId = 1 }: { webinarId?: number }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'chat' | 'products' | 'hands' | 'leads'>('chat');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [handRaises, setHandRaises] = useState<HandRaiseRequest[]>([]);

  const { data: webinar, isLoading, refetch } = trpc.webinars.byId.useQuery({ id: webinarId });
  const { data: leadCount, refetch: refetchLeadCount } = trpc.webinars.leadCount.useQuery({ webinarId });
  const { data: leads = [], refetch: refetchLeads } = trpc.webinarLive.getLeads.useQuery(
    { webinarId },
    { enabled: activeTab === 'leads' }
  );

  const updateStatusMutation = trpc.webinars.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      refetch();
      if (vars.status === 'live') toast.success('🔴 直播已开始！买家端已显示 LIVE 标识');
      else if (vars.status === 'ended') toast.success('直播已结束，线索已保存');
    },
    onError: (err) => toast.error(err.message),
  });

  const updateLeadStatusMutation = trpc.webinarLive.updateLeadStatus.useMutation({
    onSuccess: () => { refetchLeads(); refetchLeadCount(); toast.success('线索状态已更新'); },
  });

  useEffect(() => {
    const timer = setInterval(() => refetchLeadCount(), 15000);
    return () => clearInterval(timer);
  }, []);

  const currentStatus = webinar?.status || 'draft';
  const isLive = currentStatus === 'live';
  const statusCfg = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  const pendingHandRaises = handRaises.filter((hr) => hr.status === 'pending');

  const handleHandRaise = (userId: number, action: 'accept' | 'reject') => {
    setHandRaises((prev) => prev.map((hr) =>
      hr.userId === userId ? { ...hr, status: action === 'accept' ? 'accepted' : 'rejected' } : hr
    ));
  };

  if (!user) return <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center"><p className="text-white">请先登录</p></div>;
  if (isLoading) return <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center"><Loader2 className="w-10 h-10 text-purple-400 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0F0F23] flex flex-col">
      {/* 顶部控制栏 */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/factory-dashboard')} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-white font-bold text-sm truncate max-w-[280px]">{webinar?.title || '直播间'}</h1>
              <span className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full', statusCfg.color)}>
                <span className={cn('w-1.5 h-1.5 rounded-full', statusCfg.dot)} />
                {statusCfg.label}
              </span>
            </div>
            <p className="text-gray-500 text-xs">主播控制台</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatCard icon={<Users className="w-4 h-4 text-blue-400" />} label="在线" value={webinar?.participantCount || 0} color="bg-blue-500/10 border-blue-500/20" />
          <StatCard icon={<Heart className="w-4 h-4 text-red-400" />} label="点赞" value={0} color="bg-red-500/10 border-red-500/20" />
          <StatCard icon={<Target className="w-4 h-4 text-orange-400" />} label="意向线索" value={(leadCount as any)?.count || 0} color="bg-orange-500/10 border-orange-500/20" />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setIsMuted(!isMuted)} className="border-white/20 text-gray-400 hover:text-white">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          {!isLive && currentStatus !== 'ended' ? (
            <Button onClick={() => updateStatusMutation.mutate({ id: webinarId, status: 'live' })} disabled={updateStatusMutation.isPending}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold px-6">
              {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Radio className="w-4 h-4 mr-2" />}
              开始直播
            </Button>
          ) : isLive ? (
            <Button onClick={() => { if (confirm('确认结束直播？')) updateStatusMutation.mutate({ id: webinarId, status: 'ended' }); }}
              disabled={updateStatusMutation.isPending} variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold px-6">
              {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Square className="w-4 h-4 mr-2" />}
              结束直播
            </Button>
          ) : (
            <Badge className="bg-gray-500/20 text-gray-400 px-4 py-2">直播已结束</Badge>
          )}
        </div>
      </div>

      {/* 主体区域 */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto">
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative">
            <AgoraVideoCall channelName={`webinar-${webinarId}`} userId={user.id} role="publisher" />
            {isLive && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />LIVE
              </div>
            )}
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{webinar?.factory?.name?.charAt(0) || 'F'}</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{webinar?.factory?.name || '工厂'}</p>
                  <p className="text-gray-500 text-xs">{webinar?.factory?.city}, {webinar?.factory?.country}</p>
                </div>
              </div>
              <Badge className={cn('text-xs', isLive ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400')}>
                {isLive ? '直播中' : '未开播'}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPushModal(true)} className="border-white/15 text-gray-300 hover:text-white hover:bg-white/10 text-xs">
                <Package className="w-3.5 h-3.5 mr-1.5" />推送产品
              </Button>
              <Button variant="outline" size="sm" className="border-white/15 text-gray-300 hover:text-white hover:bg-white/10 text-xs">
                <Bell className="w-3.5 h-3.5 mr-1.5" />全员广播
              </Button>
              <Button variant="outline" size="sm" className="border-white/15 text-gray-300 hover:text-white hover:bg-white/10 text-xs">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />AI 摘要
              </Button>
            </div>
          </div>
          <AgoraTranscription channelName={`webinar-${webinarId}`} userId={user.id} isActive={isTranscribing} onToggle={setIsTranscribing} />
        </div>

        <div className="w-96 border-l border-white/10 flex flex-col bg-[#0A0A1A]">
          <div className="flex border-b border-white/10 flex-shrink-0">
            {([
              { key: 'chat', label: '聊天', icon: <MessageSquare className="w-3.5 h-3.5" /> },
              { key: 'products', label: '产品', icon: <Package className="w-3.5 h-3.5" /> },
              { key: 'hands', label: '举手', icon: <Hand className="w-3.5 h-3.5" />, badge: pendingHandRaises.length },
              { key: 'leads', label: '线索', icon: <Target className="w-3.5 h-3.5" />, badge: (leadCount as any)?.count },
            ] as const).map(({ key, label, icon, badge }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={cn('flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-all relative',
                  activeTab === key ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300')}>
                {icon}{label}
                {badge != null && badge > 0 && (
                  <span className="absolute top-1.5 right-2 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">{badge}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'chat' && <WebinarChat />}
            {activeTab === 'products' && <WebinarProducts />}
            {activeTab === 'hands' && <WebinarHandRaises handRaises={handRaises} onAccept={(uid) => handleHandRaise(uid, 'accept')} onReject={(uid) => handleHandRaise(uid, 'reject')} />}
            {activeTab === 'leads' && <LeadsPanel leads={leads as any[]} onUpdateStatus={(id, status) => updateLeadStatusMutation.mutate({ id, status: status as any })} onRefresh={() => refetchLeads()} />}
          </div>
        </div>
      </div>

      {showPushModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0F0F23] rounded-2xl border border-purple-500/20 p-6 max-w-md w-full mx-4">
            <h2 className="text-white font-bold text-lg mb-4">推送产品给所有观众</h2>
            <select value={selectedProduct || ''} onChange={(e) => setSelectedProduct(parseInt(e.target.value))}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500/50 mb-4">
              <option value="">请选择产品...</option>
              {webinar?.products?.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-white/20 text-gray-400 hover:text-white" onClick={() => setShowPushModal(false)}>取消</Button>
              <Button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white" onClick={() => { toast.success('产品已推送给所有观众！'); setShowPushModal(false); }}>推送给所有人</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WebinarLive() {
  const [, paramsHost] = useRoute('/webinar-live/host/:id');
  const [, paramsLegacy] = useRoute('/webinars/:id/live');
  const { user } = useAuth();
  const rawId = paramsHost?.id || paramsLegacy?.id;
  const webinarId = rawId ? parseInt(rawId) : 1;
  if (!user) return <div className="min-h-screen bg-[#0F0F23] flex items-center justify-center"><p className="text-white">请先登录</p></div>;
  return (
    <WebinarProvider webinarId={webinarId} userId={user.id} role="host"
      initialData={{ title: '直播间', factory: { name: '', city: '', country: 'China', rating: 0 }, participantCount: 0 }}>
      <WebinarLiveContent webinarId={webinarId} />
    </WebinarProvider>
  );
}
