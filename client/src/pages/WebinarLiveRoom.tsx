import { ArrowLeft, Users, Bell, MoreVertical, Heart, Bookmark, Gift, Share2, Send, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useLocation } from "wouter";
import { AgoraVideoCall } from "@/components/AgoraVideoCall";
import { AgoraTranscription } from "@/components/AgoraTranscription";

export default function WebinarLiveRoom() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"chat" | "products" | "factory">("chat");
  const [message, setMessage] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const webinarId = 1; // 从路由参数获取
  const userId = 1; // 从认证上下文获取

  const chatMessages = [
    { id: 1, user: "Alice Wang", avatar: "A", message: "这个产品看起来很不错！", time: "14:32", color: "bg-purple-500" },
    { id: 2, user: "Bob Smith", avatar: "B", message: "MOQ 是多少？", time: "14:33", color: "bg-blue-500" },
    { id: 3, user: "Carol Liu", avatar: "C", message: "支持定制吗？", time: "14:34", color: "bg-green-500" },
    { id: 4, type: "gift", user: "David Chen", message: "送出了 🎁 火箭", time: "14:35" },
  ];

  const products = [
    { id: 1, name: "智能手表 Pro", price: "$89", moq: "500 pcs", image: "📱" },
    { id: 2, name: "无线耳机", price: "$45", moq: "1000 pcs", image: "🎧" },
    { id: 3, name: "移动电源", price: "$25", moq: "2000 pcs", image: "🔋" },
    { id: 4, name: "蓝牙音箱", price: "$55", moq: "800 pcs", image: "🔊" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]">
      {/* 顶部控制栏 */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#0F0F23]/80 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation("/webinars")}
            className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-semibold">2024 春季新品发布会</h1>
            <p className="text-sm text-gray-400">深圳科技工厂</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-full border border-red-500/30">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400 font-semibold text-sm">LIVE</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-white font-semibold">1,234</span>
          </div>
          <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <Bell className="w-5 h-5 text-white" />
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
            {/* 视频播放器 */}
            {/* 使用 Agora 真实直播视频 */}
            <AgoraVideoCall
              channelName={`webinar-${webinarId}`}
              userId={userId}
              role="subscriber"
            />

            {/* 工厂信息卡片 */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">深</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">深圳科技工厂</h3>
                  <p className="text-gray-400 text-sm">CEO 张伟 · 10 年行业经验</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-yellow-400 text-sm">⭐ 4.9</span>
                    <span className="text-gray-400 text-sm">|</span>
                    <span className="text-gray-400 text-sm">已合作 500+ 客户</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/5">
                  查看工厂主页
                </Button>
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                  发起 1:1 会议 📹
                </Button>
              </div>
            </div>

            {/* 互动按钮 */}
            <div className="flex items-center justify-center gap-6">
              <button className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group-hover:scale-110">
                  <Heart className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-white text-sm font-medium">1.2k</span>
              </button>
              <button className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group-hover:scale-110">
                  <Bookmark className="w-6 h-6 text-purple-400" />
                </div>
                <span className="text-white text-sm font-medium">856</span>
              </button>
              <button className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group-hover:scale-110">
                  <Gift className="w-6 h-6 text-yellow-400" />
                </div>
                <span className="text-white text-sm font-medium">送礼物</span>
              </button>
              <button className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group-hover:scale-110">
                  <Share2 className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-white text-sm font-medium">分享</span>
              </button>
            </div>
          </div>
            {/* 实时转录 */}
            <AgoraTranscription
              channelName={`webinar-${webinarId}`}
              isActive={isTranscribing}
              onToggle={setIsTranscribing}
            />
        </div>

        {/* 右侧：聊天和产品展示 */}
        <div className="w-96 bg-[#0F0F23]/80 backdrop-blur-xl border-l border-purple-500/20 flex flex-col">
          {/* 标签页 */}
          <div className="flex items-center border-b border-white/10">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === "chat"
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              聊天 💬
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === "products"
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              产品 📦
            </button>
            <button
              onClick={() => setActiveTab("factory")}
              className={`flex-1 py-4 text-center font-medium transition-colors ${
                activeTab === "factory"
                  ? "text-purple-400 border-b-2 border-purple-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              工厂 🏭
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "chat" && (
              <div className="space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id}>
                    {msg.type === "gift" ? (
                      <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-lg p-3 border border-orange-500/30">
                        <p className="text-orange-400 text-sm font-medium">
                          🎁 {msg.user} {msg.message}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full ${msg.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                          {msg.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white text-sm font-medium">{msg.user}</span>
                            <span className="text-gray-500 text-xs">{msg.time}</span>
                          </div>
                          <p className="text-gray-300 text-sm">{msg.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-3xl">
                        {product.image}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{product.name}</h4>
                        <p className="text-purple-400 font-bold">{product.price}</p>
                        <p className="text-gray-400 text-xs">MOQ: {product.moq}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 border-white/20 text-white hover:bg-white/5">
                        收藏
                      </Button>
                      <Button size="sm" className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                        询价
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "factory" && (
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-semibold mb-3">工厂信息</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">成立时间</span>
                      <span className="text-white">2014 年</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">员工人数</span>
                      <span className="text-white">200-500 人</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">工厂面积</span>
                      <span className="text-white">10,000 m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">主营产品</span>
                      <span className="text-white">消费电子</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-white font-semibold mb-3">认证资质</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs border border-green-500/30">
                      ISO 9001
                    </span>
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs border border-blue-500/30">
                      CE 认证
                    </span>
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs border border-purple-500/30">
                      FCC
                    </span>
                    <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs border border-orange-500/30">
                      RoHS
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 底部输入框 */}
          {activeTab === "chat" && (
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="输入消息..."
                  className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
                <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
