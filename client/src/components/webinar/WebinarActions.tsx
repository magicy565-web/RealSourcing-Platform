import { Button } from '@/components/ui/button';
import { useWebinar } from '@/contexts/WebinarContext';
import { Heart, Hand, Share2, Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface WebinarActionsProps {
  showShare?: boolean;
  showDownload?: boolean;
}

export function WebinarActions({ showShare = true, showDownload = true }: WebinarActionsProps) {
  const { liked, likeCount, handRaised, toggleLike, toggleHandRaise } = useWebinar();
  const [isLiking, setIsLiking] = useState(false);
  const [isRaisingHand, setIsRaisingHand] = useState(false);

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await toggleLike();
    } finally {
      setIsLiking(false);
    }
  };

  const handleRaiseHand = async () => {
    setIsRaisingHand(true);
    try {
      await toggleHandRaise();
    } finally {
      setIsRaisingHand(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join the live session',
        text: 'Check out this amazing webinar!',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleDownload = () => {
    toast.info('Download feature coming soon');
  };

  return (
    <div className="flex flex-col gap-3 bg-[#0F0F23]/80 rounded-xl border border-purple-500/20 p-4">
      <p className="text-xs text-gray-400 font-semibold uppercase">Interactions</p>

      {/* Like button */}
      <Button
        onClick={handleLike}
        disabled={isLiking}
        variant="outline"
        className={`w-full justify-center border-white/20 text-white hover:bg-white/5 transition-all ${
          liked ? 'bg-red-500/20 border-red-500/30 text-red-400' : ''
        }`}
      >
        <Heart className={`w-5 h-5 mr-2 ${liked ? 'fill-current' : ''}`} />
        <span>{liked ? 'Liked' : 'Like'}</span>
        <span className="ml-auto text-sm font-semibold">{likeCount.toLocaleString()}</span>
      </Button>

      {/* Raise hand button */}
      <Button
        onClick={handleRaiseHand}
        disabled={isRaisingHand}
        variant="outline"
        className={`w-full justify-center border-white/20 text-white hover:bg-white/5 transition-all ${
          handRaised ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' : ''
        }`}
      >
        <Hand className={`w-5 h-5 mr-2 ${handRaised ? 'fill-current' : ''}`} />
        <span>{handRaised ? 'Hand Raised' : 'Raise Hand'}</span>
      </Button>

      {/* Share button */}
      {showShare && (
        <Button
          onClick={handleShare}
          variant="outline"
          className="w-full justify-center border-white/20 text-white hover:bg-white/5"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share
        </Button>
      )}

      {/* Download button */}
      {showDownload && (
        <Button
          onClick={handleDownload}
          variant="outline"
          className="w-full justify-center border-white/20 text-white hover:bg-white/5"
        >
          <Download className="w-5 h-5 mr-2" />
          Download
        </Button>
      )}
    </div>
  );
}
