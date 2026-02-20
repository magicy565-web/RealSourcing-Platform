import { X, Mic, MicOff, Video, VideoOff, Monitor, MoreVertical, Bookmark, MessageSquare, ShoppingCart, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function PrivateMeetingRoom() {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([1, 3, 5]);

  const products = [
    { id: 1, name: "智能手表 Pro", price: "$89", moq: "500 pcs", image: "📱" },
    { id: 2, name: "无线耳机", price: "$45", moq: "1000 pcs", image: "🎧" },
    { id: 3, name: "移动电源", price: "$25", moq: "2000 pcs", image: "🔋" },
    { id: 4, name: "蓝牙音箱", price: "$55", moq: "800 pcs", image: "🔊" },
    { id: 5, name: "智能手环", price: "$35", moq: "1500 pcs", image: "⌚" },
    { id: 6, name: "充电器", price: "$15", moq: "3000 pcs", image: "🔌" },
    { id: 7, name: "数据线", price: "$8", moq: "5000 pcs", image: "🔗" },
    { id: 8, name: "保护壳", price: "$5", moq: "10000 pcs", image: "📦" },
    { id: 9, name: "屏幕保护膜", price: "$3", moq: "15000 pcs", image: "🛡️" },
    { id: 10, name: "车载支架", price: "$12", moq: "2000 pcs", image: "🚗" },
    { id: 11, name: "自拍杆", price: "$18", moq: "1000 pcs", image: "📸" },
    { id: 12, name: "三脚架", price: "$28", moq: "500 pcs", image: "🎬" },
  ];

  const aiTranscripts = [
    { time: "00:05:23", type: "highlight", content: "产品首次展示", icon: "🎯" },
    { time: "00:12:45", type: "highlight", content: "价格谈判关键点", icon: "💰" },
    { time: "00:18:30", type: "highlight", content: "工厂实力展示", icon: "🏭" },
  ];

  const toggleProduct = (id: number) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]">
      {/* 顶部控制栏 */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#0F0F23]/80 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            <X className="w-4 h-4 mr-2" />
            结束会议
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white font-mono">00:45:23</span>
          </div>
        </div>

        <div>
          <h1 className="text-white font-semibold">1:1 私密选品会议</h1>
          <p className="text-sm text-gray-400">深圳科技工厂 × Alice Wang</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMicOn(!micOn)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              micOn ? "bg-white/5 hover:bg-white/10" : "bg-red-500/20 hover:bg-red-500/30"
            }`}
          >
            {micOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-red-400" />}
          </button>
          <button
            onClick={() => setVideoOn(!videoOn)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              videoOn ? "bg-white/5 hover:bg-white/10" : "bg-red-500/20 hover:bg-red-500/30"
            }`}
          >
            {videoOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-red-400" />}
          </button>
          <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <Monitor className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <MoreVertical className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="pt-16 flex h-screen">
        {/* 左侧：视频区域 */}
        <div className="flex-1 p-6">
          <div className="h-full flex flex-col gap-4">
            {/* 主视频（工厂 CEO） */}
            <div className="flex-1 bg-black/50 rounded-xl overflow-hidden relative border border-purple-500/20">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">张</span>
                  </div>
                  <p className="text-white text-lg font-semibold mb-2">张伟 - CEO</p>
                  <p className="text-gray-400 text-sm">深圳科技工厂</p>
                </div>
              </div>

              {/* 小窗口（买家视频） */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-black/70 rounded-lg border border-purple-500/30 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">A</span>
                    </div>
                    <p className="text-white text-sm font-semibold">Alice Wang</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI 实时转录 */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <h3 className="text-white font-semibold">AI 实时转录</h3>
                </div>
                <span className="text-purple-400 text-sm">关键时刻标记</span>
              </div>

              <div className="flex gap-3">
                {aiTranscripts.map((item, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-3 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-purple-400 text-xs font-mono">{item.time}</span>
                    </div>
                    <p className="text-white text-sm font-medium">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 底部操作按钮 */}
            <div className="flex gap-3">
              <Button className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                生成会议摘要
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white">
                🎬 生成 Meeting Reel
              </Button>
            </div>
          </div>
        </div>

        {/* 右侧：产品列表 */}
        <div className="w-96 bg-[#0F0F23]/80 backdrop-blur-xl border-l border-purple-500/20 flex flex-col">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-white font-semibold text-lg mb-1">展示产品列表</h2>
            <p className="text-gray-400 text-sm">共 {products.length} 款产品</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white/5 rounded-lg p-3 border transition-all cursor-pointer ${
                    selectedProducts.includes(product.id)
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-white/10 hover:border-purple-500/30"
                  }`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-4xl mb-2">
                    {product.image}
                  </div>
                  <h4 className="text-white font-semibold text-sm mb-1">{product.name}</h4>
                  <p className="text-purple-400 font-bold text-sm">{product.price}</p>
                  <p className="text-gray-400 text-xs">MOQ: {product.moq}</p>

                  <div className="flex gap-1 mt-2">
                    <button
                      className={`flex-1 py-1 rounded text-xs transition-colors ${
                        selectedProducts.includes(product.id)
                          ? "bg-purple-500 text-white"
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      <Bookmark className="w-3 h-3 inline mr-1" />
                      {selectedProducts.includes(product.id) ? "已收藏" : "收藏"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 底部操作栏 */}
          <div className="p-4 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">已收藏产品</span>
              <span className="text-purple-400 font-bold">{selectedProducts.length} 件</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/5">
                <ShoppingCart className="w-4 h-4 mr-2" />
                查看购物车单
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                <FileDown className="w-4 h-4 mr-2" />
                导出询价单
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
