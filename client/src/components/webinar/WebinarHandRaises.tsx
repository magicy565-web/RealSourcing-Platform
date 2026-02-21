import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Mic, MicOff } from 'lucide-react';
import { toast } from 'sonner';

export interface HandRaiseRequest {
  userId: number;
  userName: string;
  avatar: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected';
  isSpeaking?: boolean;
}

interface WebinarHandRaisesProps {
  handRaises: HandRaiseRequest[];
  onAccept: (userId: number) => void;
  onReject: (userId: number) => void;
  onToggleSpeaking?: (userId: number, isSpeaking: boolean) => void;
}

/**
 * WebinarHandRaises - Host view for managing hand raise requests
 * 
 * Features:
 * - Real-time display of pending hand raises
 * - Accept/Reject actions with immediate feedback
 * - Track accepted speakers
 * - Visual indicators for speaking status
 */
export function WebinarHandRaises({
  handRaises,
  onAccept,
  onReject,
  onToggleSpeaking,
}: WebinarHandRaisesProps) {
  const [localHandRaises, setLocalHandRaises] = useState<HandRaiseRequest[]>(handRaises);
  const [speakingUsers, setSpeakingUsers] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLocalHandRaises(handRaises);
  }, [handRaises]);

  const pendingRequests = localHandRaises.filter((hr) => hr.status === 'pending');
  const acceptedRequests = localHandRaises.filter((hr) => hr.status === 'accepted');
  const rejectedRequests = localHandRaises.filter((hr) => hr.status === 'rejected');

  const handleAccept = (userId: number) => {
    setLocalHandRaises((prev) =>
      prev.map((hr) =>
        hr.userId === userId ? { ...hr, status: 'accepted' as const } : hr
      )
    );
    onAccept(userId);
    toast.success('Hand raise accepted');
  };

  const handleReject = (userId: number) => {
    setLocalHandRaises((prev) =>
      prev.map((hr) =>
        hr.userId === userId ? { ...hr, status: 'rejected' as const } : hr
      )
    );
    onReject(userId);
    toast.info('Hand raise rejected');
  };

  const handleToggleSpeaking = (userId: number) => {
    const isSpeaking = speakingUsers.has(userId);
    if (isSpeaking) {
      speakingUsers.delete(userId);
    } else {
      speakingUsers.add(userId);
    }
    setSpeakingUsers(new Set(speakingUsers));
    onToggleSpeaking?.(userId, !isSpeaking);
  };

  if (localHandRaises.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p className="text-sm">No hand raises yet</p>
          <p className="text-xs text-gray-500 mt-1">Audience members will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Pending hand raises */}
      {pendingRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-orange-500/20 text-orange-400 text-xs">
              PENDING ({pendingRequests.length})
            </Badge>
          </div>
          <div className="space-y-2">
            {pendingRequests.map((hr) => (
              <div
                key={hr.userId}
                className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/20 hover:border-orange-500/40 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/30 flex items-center justify-center text-xs font-bold text-orange-400">
                    {hr.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{hr.userName}</p>
                    <p className="text-gray-400 text-xs">
                      {new Date(hr.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 h-8"
                    onClick={() => handleAccept(hr.userId)}
                  >
                    <Check className="w-3 h-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 h-8"
                    onClick={() => handleReject(hr.userId)}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted speakers */}
      {acceptedRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-green-500/20 text-green-400 text-xs">
              SPEAKING ({acceptedRequests.length})
            </Badge>
          </div>
          <div className="space-y-2">
            {acceptedRequests.map((hr) => {
              const isSpeaking = speakingUsers.has(hr.userId);
              return (
                <div
                  key={hr.userId}
                  className={`rounded-lg p-3 border transition-colors ${
                    isSpeaking
                      ? 'bg-green-500/20 border-green-500/40'
                      : 'bg-green-500/10 border-green-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center text-xs font-bold text-green-400">
                      {hr.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{hr.userName}</p>
                      <p className="text-gray-400 text-xs">
                        {isSpeaking ? 'Speaking now' : 'Ready to speak'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className={`h-8 w-8 p-0 ${
                        isSpeaking
                          ? 'text-green-400 bg-green-500/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                      onClick={() => handleToggleSpeaking(hr.userId)}
                    >
                      {isSpeaking ? (
                        <Mic className="w-4 h-4" />
                      ) : (
                        <MicOff className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rejected requests (collapsed) */}
      {rejectedRequests.length > 0 && (
        <div>
          <details className="group">
            <summary className="cursor-pointer flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300">
              <span>▶</span>
              <Badge className="bg-gray-500/20 text-gray-400 text-xs">
                REJECTED ({rejectedRequests.length})
              </Badge>
            </summary>
            <div className="mt-2 space-y-2 pl-4">
              {rejectedRequests.map((hr) => (
                <div
                  key={hr.userId}
                  className="bg-gray-500/10 rounded-lg p-2 border border-gray-500/20"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-500/30 flex items-center justify-center text-xs font-bold text-gray-400">
                      {hr.avatar}
                    </div>
                    <p className="text-gray-400 text-xs">{hr.userName}</p>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
