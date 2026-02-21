/**
 * Agora RTC Video Call Component
 * 实时音视频通话组件 - 用于 1:1 选品会
 */

import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from 'lucide-react';
import AgoraRTC, {
  AgoraRTCProvider,
  useRTCClient,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
} from 'agora-rtc-react';

interface AgoraVideoCallProps {
  channelName: string;
  userId: string | number;
  onCallEnd?: () => void;
  role?: 'publisher' | 'subscriber';
}

/**
 * 视频通话内容组件
 */
function VideoCallContent({ channelName, userId, onCallEnd, role = 'publisher' }: AgoraVideoCallProps) {
  const client = useRTCClient();
  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  const { localCameraTrack } = useLocalCameraTrack();
  const remoteUsers = useRemoteUsers();

  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 获取 RTC Token
  const { data: tokenData, isLoading: tokenLoading } = trpc.agora.getDualTokens.useQuery({
    channel: channelName,
    uid: userId,
    role: role,
  });

  // 发布本地音视频
  usePublish([localMicrophoneTrack, localCameraTrack] as any);

  // 加入频道
  useEffect(() => {
    if (!client || !tokenData?.rtcToken || tokenLoading) return;

    const joinChannel = async () => {
      try {
        setIsLoading(true);
        await (client as any).join({
          appid: tokenData.appId,
          channel: channelName,
          token: tokenData.rtcToken,
          uid: typeof userId === 'number' ? userId : parseInt(userId),
        });
        setIsJoined(true);
        console.log('✅ Joined Agora channel:', channelName);
      } catch (error) {
        console.error('❌ Failed to join channel:', error);
      } finally {
        setIsLoading(false);
      }
    };

    joinChannel();

    return () => {
      (client as any).leave();
      setIsJoined(false);
    };
  }, [client, tokenData, channelName, userId, tokenLoading]);

  // 切换麦克风
  const toggleAudio = async () => {
    if (!localMicrophoneTrack) return;
    await (localMicrophoneTrack as any).setEnabled(!isAudioOn);
    setIsAudioOn(!isAudioOn);
  };

  // 切换摄像头
  const toggleVideo = async () => {
    if (!localCameraTrack) return;
    await (localCameraTrack as any).setEnabled(!isVideoOn);
    setIsVideoOn(!isVideoOn);
  };

  // 挂断电话
  const handleHangUp = async () => {
    try {
      if (localMicrophoneTrack) (localMicrophoneTrack as any).close();
      if (localCameraTrack) (localCameraTrack as any).close();
      await client.leave();
      setIsJoined(false);
      onCallEnd?.();
    } catch (error) {
      console.error('Error hanging up:', error);
    }
  };

  if (isLoading || tokenLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-black rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">正在加入视频通话...</p>
        </div>
      </div>
    );
  }

  if (!isJoined || !tokenData) {
    return (
      <div className="flex items-center justify-center h-96 bg-black rounded-lg">
        <p className="text-gray-400">连接中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 远程用户视频 */}
      <div className="grid grid-cols-1 gap-4 h-96">
        {remoteUsers.length > 0 ? (
          remoteUsers.map(user => (
            <RemoteUserVideo key={user.uid} user={user} />
          ))
        ) : (
          <div className="bg-gray-900 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">等待对方加入...</p>
          </div>
        )}
      </div>

      {/* 本地用户视频 */}
      <div className="h-48 bg-gray-900 rounded-lg overflow-hidden">
        <LocalUserVideo />
      </div>

      {/* 控制按钮 */}
      <div className="flex justify-center gap-4">
        <Button
          variant={isAudioOn ? 'default' : 'destructive'}
          size="lg"
          onClick={toggleAudio}
          className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
          title={isAudioOn ? '关闭麦克风' : '打开麦克风'}
        >
          {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </Button>

        <Button
          variant={isVideoOn ? 'default' : 'destructive'}
          size="lg"
          onClick={toggleVideo}
          className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
          title={isVideoOn ? '关闭摄像头' : '打开摄像头'}
        >
          {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={handleHangUp}
          className="rounded-full w-12 h-12 p-0 flex items-center justify-center"
          title="挂断"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}

/**
 * 本地用户视频
 */
function LocalUserVideo() {
  const videoRef = useRef<HTMLDivElement>(null);
  const { localCameraTrack } = useLocalCameraTrack();

  useEffect(() => {
    if (videoRef.current && localCameraTrack) {
      (localCameraTrack as any).play(videoRef.current);
      return () => {
        (localCameraTrack as any).stop();
      };
    }
  }, [localCameraTrack]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <div ref={videoRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
        你
      </div>
    </div>
  );
}

/**
 * 远程用户视频
 */
function RemoteUserVideo({ user }: { user: any }) {
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && user?.videoTrack) {
      (user.videoTrack as any).play(videoRef.current);
      return () => {
        (user.videoTrack as any).stop();
      };
    }
  }, [user]);

  return (
    <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
      <div ref={videoRef} className="w-full h-full" />
      <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
        {user?.uid}
      </div>
    </div>
  );
}

/**
 * Agora 视频通话组件包装器
 */
export function AgoraVideoCall(props: AgoraVideoCallProps) {
  // 创建 Agora RTC 客户端
  const client = AgoraRTC.createClient({
    mode: 'rtc',
    codec: 'vp8',
  });

  return (
    <AgoraRTCProvider client={client}>
      <VideoCallContent {...props} />
    </AgoraRTCProvider>
  );
}
