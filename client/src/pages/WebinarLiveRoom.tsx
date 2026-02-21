import { useState } from 'react';
import { useRoute } from 'wouter';
import { WebinarProvider } from '@/contexts/WebinarContext';
import { WebinarHeader } from '@/components/webinar/WebinarHeader';
import { WebinarChat } from '@/components/webinar/WebinarChat';
import { WebinarProducts } from '@/components/webinar/WebinarProducts';
import { WebinarActions } from '@/components/webinar/WebinarActions';
import { AgoraVideoCall } from '@/components/AgoraVideoCall';
import { AgoraTranscription } from '@/components/AgoraTranscription';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

/**
 * WebinarLiveRoom - Subscriber view of live webinar
 * 
 * Architecture:
 * - WebinarProvider manages all state (likes, chat, products, etc.)
 * - Modular components (Header, Chat, Products, Actions) consume context
 * - Agora lifecycle managed by AgoraManager (via WebinarContext)
 * - Clean separation of concerns
 */

interface WebinarLiveRoomProps {
  webinarId?: number;
}

function WebinarLiveRoomContent({ webinarId = 1 }: WebinarLiveRoomProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'products' | 'factory'>('chat');
  const [isTranscribing, setIsTranscribing] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E] flex items-center justify-center">
        <p className="text-white">Please log in to view the webinar</p>
      </div>
    );
  }

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
              role="subscriber"
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
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
                  Factory Profile
                </Button>
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                  1:1 Meeting 📹
                </Button>
              </div>
            </div>

            {/* Interaction buttons */}
            <WebinarActions showShare showDownload />

            {/* Real-time transcription */}
            <AgoraTranscription
              channelName={`webinar-${webinarId}`}
              userId={user.id}
              isActive={isTranscribing}
              onToggle={setIsTranscribing}
            />
          </div>
        </div>

        {/* Right: Chat and products sidebar */}
        <div className="w-96 bg-[#0F0F23]/80 backdrop-blur-xl border-l border-purple-500/20 flex flex-col">
          {/* Tabs */}
          <div className="flex items-center border-b border-white/10">
            {(['chat', 'products', 'factory'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-center font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'chat' && '💬 Chat'}
                {tab === 'products' && '📦 Products'}
                {tab === 'factory' && '🏭 Factory'}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'chat' && <WebinarChat />}
            {activeTab === 'products' && <WebinarProducts />}
            {activeTab === 'factory' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-semibold mb-3">Factory Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Founded</span>
                      <span className="text-white">2014</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Employees</span>
                      <span className="text-white">500+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Export Countries</span>
                      <span className="text-white">50+</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Certifications</span>
                      <span className="text-white">ISO 9001, CE</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-semibold mb-3">Main Products</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">• Smart Devices</p>
                    <p className="text-gray-300">• Consumer Electronics</p>
                    <p className="text-gray-300">• IoT Solutions</p>
                    <p className="text-gray-300">• Custom Manufacturing</p>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-semibold mb-3">Contact</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">📧 info@factory.com</p>
                    <p className="text-gray-300">📱 +86 755 1234 5678</p>
                    <p className="text-gray-300">📍 Shenzhen, China</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * WebinarLiveRoom page with Context provider
 */
export default function WebinarLiveRoom() {
  const [match, params] = useRoute('/webinars/:id');
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
      role="subscriber"
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
      <WebinarLiveRoomContent webinarId={webinarId} />
    </WebinarProvider>
  );
}
