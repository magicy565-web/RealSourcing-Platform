import { ArrowLeft, Users, Bell, MoreVertical, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebinar } from '@/contexts/WebinarContext';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

interface WebinarHeaderProps {
  onBackClick?: () => void;
  showNotifications?: boolean;
  showSettings?: boolean;
}

export function WebinarHeader({
  onBackClick,
  showNotifications = true,
  showSettings = true,
}: WebinarHeaderProps) {
  const [, setLocation] = useLocation();
  const { webinarTitle, factoryName, viewerCount, agoraState } = useWebinar();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      setLocation('/webinars');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-[#0F0F23]/80 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between px-6 z-50">
      {/* Left: Back button and title */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          title="Back to webinars"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-white font-semibold truncate max-w-xs">{webinarTitle}</h1>
          <p className="text-sm text-gray-400">{factoryName}</p>
        </div>
      </div>

      {/* Right: Status and controls */}
      <div className="flex items-center gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-full border border-red-500/30">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-400 font-semibold text-sm">LIVE</span>
        </div>

        {/* Viewer count */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-white font-semibold text-sm">{viewerCount.toLocaleString()}</span>
        </div>

        {/* Connection status */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium',
            agoraState === 'connected'
              ? 'bg-green-500/20 text-green-400'
              : agoraState === 'connecting'
              ? 'bg-yellow-500/20 text-yellow-400'
              : agoraState === 'error'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-gray-500/20 text-gray-400'
          )}
          title={`Connection: ${agoraState}`}
        >
          <Wifi className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{agoraState === 'connected' ? 'HD' : agoraState}</span>
        </div>

        {/* Notification button */}
        {showNotifications && (
          <button
            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-white" />
          </button>
        )}

        {/* Settings button */}
        {showSettings && (
          <button
            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            title="Settings"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
