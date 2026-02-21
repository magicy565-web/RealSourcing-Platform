/**
 * Agora Interactive Whiteboard Component
 * 声网互动白板组件 - 用于选品会中的产品展示和标注
 */

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Undo2, RotateCcw, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AgoraWhiteboardProps {
  whiteboardId?: string;
  onClose?: () => void;
  title?: string;
}

export function AgoraWhiteboard({ whiteboardId, onClose, title = 'Interactive Whiteboard' }: AgoraWhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [drawColor, setDrawColor] = useState('#FFFFFF');
  const [drawSize, setDrawSize] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 初始化画布
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置画布大小
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // 填充黑色背景
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setIsLoading(false);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 保存历史记录
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([...history, imageData]);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 保存历史记录
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([...history, imageData]);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const undo = () => {
    if (history.length === 0) {
      toast.error('No more actions to undo');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = history[history.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(history.slice(0, -1));
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `whiteboard-${Date.now()}.png`;
    link.click();
    toast.success('Whiteboard downloaded');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-black rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Initializing whiteboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 bg-black/50 rounded-lg p-4 border border-purple-500/20">
      {/* 标题和控制栏 */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          {/* 颜色选择 */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Color:</label>
            <input
              type="color"
              value={drawColor}
              onChange={(e) => setDrawColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>

          {/* 笔刷大小 */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={drawSize}
              onChange={(e) => setDrawSize(parseInt(e.target.value))}
              className="w-20"
            />
          </div>

          {/* 控制按钮 */}
          <Button
            size="sm"
            variant="outline"
            onClick={undo}
            title="Undo"
            className="gap-1"
          >
            <Undo2 className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={clearCanvas}
            title="Clear"
            className="gap-1"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={downloadWhiteboard}
            title="Download"
            className="gap-1"
          >
            <Download className="w-4 h-4" />
          </Button>

          {onClose && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {/* 画布 */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="w-full h-96 bg-black rounded-lg cursor-crosshair border border-purple-500/20 hover:border-purple-500/40 transition-colors"
      />
    </div>
  );
}
