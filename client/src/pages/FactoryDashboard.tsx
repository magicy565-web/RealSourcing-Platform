import { Users, Video, TrendingUp, Package, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FactoryDashboard() {
  // 模拟数据
  const stats = [
    { icon: Users, label: "位主动客户", value: "248", trend: "+12 本周", trendColor: "text-green-400" },
    { icon: Video, label: "场未来会议", value: "18", trend: "+33 vs 上月", trendColor: "text-green-400" },
    { icon: TrendingUp, label: "位高意向客户", value: "32", trend: "AI 评分 >80", trendColor: "text-purple-400" },
    { icon: Package, label: "款展示产品", value: "56", trend: "", trendColor: "" },
  ];

  const highIntentCustomers = [
    { id: 1, name: "Alice Wang", company: "TikTok 采购总监", score: 92, avatar: "A", color: "bg-purple-500" },
    { id: 2, name: "Bob Smith", company: "跨境电商采购", score: 87, avatar: "B", color: "bg-blue-500" },
    { id: 3, name: "Carol Liu", company: "亚马逊采购", score: 81, avatar: "C", color: "bg-green-500" },
  ];

  const upcomingMeetings = [
    { id: 1, time: "今天 14:00", title: "1:1 选品会 — Bob Smith", status: "进行中", statusColor: "bg-blue-500" },
    { id: 2, time: "明天 10:00", title: "公开 Webinar — 新品发布", status: "已确认", statusColor: "bg-green-500" },
    { id: 3, time: "后天 15:00", title: "1:1 选品会 — David Chen", status: "待确认", statusColor: "bg-gray-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]">
      {/* 侧边栏 */}
      <div className="fixed left-0 top-0 h-full w-64 bg-[#0F0F23]/80 backdrop-blur-xl border-r border-purple-500/20 p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold">R</span>
          </div>
          <div>
            <h2 className="text-white font-semibold">RealSourcing</h2>
            <span className="text-xs text-purple-400">Factory</span>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-sm text-gray-400 mb-3">深圳科技工厂</h3>
            <p className="text-xs text-gray-500">Inter 14px</p>
          </div>

          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <span>🏠</span>
              <span className="font-medium">仪表盘</span>
              <span className="ml-auto text-xs bg-purple-500/20 px-2 py-1 rounded">ACTIVE</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">
              <span>👥</span>
              <span>客户管理</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">
              <span>🎥</span>
              <span>会议管理</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">
              <span>📦</span>
              <span>产品管理</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">
              <span>🛠️</span>
              <span>营销工具</span>
              <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">NEW</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">
              <span>👥</span>
              <span>团队管理</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">
              <span>📊</span>
              <span>订阅与配额</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-white/5 transition-colors">
              <span>⚙️</span>
              <span>设置</span>
            </a>
          </nav>

          <div className="pt-8 border-t border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                <span className="text-white font-bold">深</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">深圳科技工厂</p>
                <p className="text-xs text-gray-400">Factory</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="ml-64 p-8">
        {/* 欢迎标语 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            下午好，深圳科技工厂 👋
          </h1>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-gray-400">Pro 计划 · 本月剩余 12 次会议</span>
            <div className="flex-1 max-w-md h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full w-[60%] bg-gradient-to-r from-purple-500 to-blue-500"></div>
            </div>
            <span className="text-purple-400 font-semibold">60%</span>
          </div>
        </div>

        {/* 数据卡片 */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-purple-400" />
                </div>
                {stat.trend && (
                  <span className={`text-xs ${stat.trendColor} font-medium`}>{stat.trend}</span>
                )}
              </div>
              <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* 高意向客户 */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">高意向客户（AI 推荐）</h2>
              </div>
              <span className="text-purple-400 text-sm cursor-pointer hover:underline">查看全部客户 →</span>
            </div>

            <div className="space-y-4">
              {highIntentCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-purple-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${customer.color} flex items-center justify-center text-white font-bold`}>
                      {customer.avatar}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{customer.name}</h3>
                      <p className="text-sm text-gray-400">{customer.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 font-bold text-lg">AI {customer.score}分</span>
                    <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm">
                      发起会议 📹
                    </Button>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 px-4 py-2 rounded-lg text-sm">
                      查看
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 近期会议日程 */}
          <div className="bg-white/5 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">近期会议日程</h2>
              </div>
            </div>

            <div className="space-y-4">
              {upcomingMeetings.map((meeting) => (
                <div key={meeting.id} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:border-purple-500/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{meeting.time}</span>
                    <span className={`text-xs px-3 py-1 rounded-full ${meeting.statusColor} text-white`}>
                      {meeting.status}
                    </span>
                  </div>
                  <h3 className="text-white font-semibold">{meeting.title}</h3>
                </div>
              ))}

              <button className="w-full p-4 border-2 border-dashed border-purple-500/30 rounded-lg text-purple-400 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all">
                + 创建新 Webinar
              </button>
            </div>
          </div>
        </div>

        {/* AI 营销工具 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">AI 营销工具</h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 backdrop-blur-xl rounded-xl p-6 border border-orange-500/20 hover:border-orange-500/40 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    🎬 AI Meeting Reel
                  </h3>
                  <p className="text-gray-300 text-sm">一键将选品会议剪辑为 TikTok 高光短视频</p>
                </div>
                <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-6 py-2 rounded-lg">
                  立即生成
                </Button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-xl p-6 border border-blue-500/20 hover:border-blue-500/40 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    ✨ AI 产品文案生成器
                  </h3>
                  <p className="text-gray-300 text-sm">多语言产品描述、SEO 优化、一键生成</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-2 rounded-lg">
                  立即生成
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
