import { useState } from 'react';
import { useRoute } from 'wouter';
import { WebinarProvider } from '@/contexts/WebinarContext';
import { WebinarHeader } from '@/components/webinar/WebinarHeader';
import { WebinarChat } from '@/components/webinar/WebinarChat';
import { WebinarProducts } from '@/components/webinar/WebinarProducts';
import { WebinarActions } from '@/components/webinar/WebinarActions';
import { AgoraVideoCall } from '@/components/AgoraVideoCall';
import { AgoraTranscription } from '@/components/AgoraTranscription';
import { WebinarHandRaises, type HandRaiseRequest } from '@/components/webinar/WebinarHandRaises';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  Hand, Send, Users, Loader2, ArrowLeft, Eye, Wifi, Volume2, VolumeX,
  Settings, Maximize2, ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * WebinarLive - Host view of live webinar
 * 
 * Architecture:
 * - WebinarProvider manages all state (likes, chat, products, hand raises, etc.)
 * - Modular components (Header, Chat, Products, Actions) consume context
 * - Host-specific features: push products, manage hand raises
 * - Agora lifecycle managed by AgoraManager (via WebinarContext)
 */

interface WebinarLiveContentProps {
  webinarId?: number;
}



function WebinarLiveContent({ webinarId = 1 }: WebinarLiveContentProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'products' | 'hands'>('chat');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [handRaises, setHandRaises] = useState<HandRaiseRequest[]>([
    { userId: 1, userName: 'Alice Wang', avatar: 'AW', timestamp: new Date(Date.now() - 60000), status: 'pending' },
    { userId: 2, userName: 'Bob Smith', avatar: 'BS', timestamp: new Date(Date.now() - 30000), status: 'pending' },
  ]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [showPushModal, setShowPushModal] = useState(false);

  const { data: webinar, isLoading } = trpc.webinars.byId.useQuery({ id: webinarId });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E] flex items-center justify-center">
        <p className="text-white">Please log in</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading live session...</p>
        </div>
      </div>
    );
  }

  const handlePushProduct = (productId: number) => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }
    // TODO: Send RTM message to all subscribers to show product modal
    toast.success(`Product pushed to all viewers!`);
    setShowPushModal(false);
  };

  const handleHandRaise = (userId: number, action: 'accept' | 'reject') => {
    setHandRaises((prev) =>
      prev.map((hr) =>
        hr.userId === userId ? { ...hr, status: action === 'accept' ? 'accepted' : 'rejected' } : hr
      )
    );
  };

  const pendingHandRaises = handRaises.filter((hr) => hr.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]">
      {/* Header */}
      <WebinarHeader showNotifications showSettings />

      <div className="pt-16 flex h-screen">
        {/* Left: Video area */}
        <div className="flex-1 p-6">
          <div className="h-full flex flex-col gap-4">
            {/* Video player */}
            <AgoraVideoCall
              channelName={`webinar-${webinarId}`}
              userId={user.id}
              role="publisher"
            />

            {/* Factory info card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">深</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Shenzhen Tech Factory</h3>
                  <p className="text-gray-400 text-sm">CEO Zhang Wei · 10 years experience</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-400 text-sm">⭐ 4.9</span>
                    <span className="text-gray-400 text-sm">|</span>
                    <span className="text-gray-400 text-sm">500+ clients</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5"
                  onClick={() => setIsMuted(!isMuted)}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
                  {isMuted ? 'Muted' : 'Unmuted'}
                </Button>
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                  End Stream 🛑
                </Button>
              </div>
            </div>

            {/* Host controls */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Host Controls</h3>
                <Badge className="bg-green-500/20 text-green-400">STREAMING</Badge>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5"
                  onClick={() => setShowPushModal(true)}
                >
                  📦 Push Product
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5"
                >
                  🎁 Send Gift
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5"
                >
                  📢 Announcement
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/5"
                >
                  ⚙️ Settings
                </Button>
              </div>
            </div>

            {/* Real-time transcription */}
            <AgoraTranscription
              channelName={`webinar-${webinarId}`}
              userId={user.id}
              isActive={isTranscribing}
              onToggle={setIsTranscribing}
            />
          </div>
        </div>

        {/* Right: Chat, products, and hand raises sidebar */}
        <div className="w-96 bg-[#0F0F23]/80 backdrop-blur-xl border-l border-purple-500/20 flex flex-col">
          {/* Tabs */}
          <div className="flex items-center border-b border-white/10">
            {(['chat', 'products', 'hands'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-center font-medium transition-colors capitalize relative ${
                  activeTab === tab
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'chat' && '💬 Chat'}
                {tab === 'products' && '📦 Products'}
                {tab === 'hands' && (
                  <>
                    🖐️ Hands
                    {pendingHandRaises.length > 0 && (
                      <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                        {pendingHandRaises.length}
                      </span>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'chat' && <WebinarChat />}
            {activeTab === 'products' && <WebinarProducts />}
            {activeTab === 'hands' && (
              <WebinarHandRaises
                handRaises={handRaises}
                onAccept={(userId) => handleHandRaise(userId, 'accept')}
                onReject={(userId) => handleHandRaise(userId, 'reject')}
              />
            )}
          </div>
        </div>
      </div>

      {/* Push product modal */}
      {showPushModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0F0F23] rounded-xl border border-purple-500/20 p-6 max-w-md w-full mx-4">
            <h2 className="text-white font-semibold text-lg mb-4">Push Product to Viewers</h2>
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm font-medium mb-2 block">Select Product</label>
                <select
                  value={selectedProduct || ''}
                  onChange={(e) => setSelectedProduct(parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Choose a product...</option>
                  {webinar?.products?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/5"
                  onClick={() => setShowPushModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  onClick={() => handlePushProduct(selectedProduct || 0)}
                >
                  Push to All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * WebinarLive page with Context provider
 */
export default function WebinarLive() {
  const [match, params] = useRoute('/webinars/:id/live');
  const webinarId = params?.id ? parseInt(params.id) : 1;
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E] flex items-center justify-center">
        <p className="text-white">Please log in</p>
      </div>
    );
  }

  return (
    <WebinarProvider
      webinarId={webinarId}
      userId={user.id}
      role="host"
      initialData={{
        title: '2024 Spring Product Launch',
        factory: {
          name: 'Shenzhen Tech Factory',
          city: 'Shenzhen',
          country: 'China',
          rating: 4.9,
        },
        participantCount: 1234,
      }}
    >
      <WebinarLiveContent webinarId={webinarId} />
    </WebinarProvider>
  );
}
