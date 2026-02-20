import { ArrowLeft, Play, Sparkles, Clock, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function MeetingReelGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState("launch");
  const [duration, setDuration] = useState("30s");
  const [format, setFormat] = useState("9:16");
  const [subtitle, setSubtitle] = useState("dual");
  const [watermark, setWatermark] = useState(true);
  const [bgm, setBgm] = useState("tech");

  const templates = [
    { id: "launch", name: "新品发布风", icon: "🚀", color: "from-purple-500 to-blue-500" },
    { id: "strength", name: "工厂实力秀", icon: "🏭", color: "from-orange-500 to-yellow-500" },
    { id: "qa", name: "核心问答集锦", icon: "💬", color: "from-green-500 to-cyan-500" },
    { id: "data", name: "数据说话型", icon: "📊", color: "from-pink-500 to-rose-500" },
  ];

  const highlights = [
    { time: "00:05:23", label: "产品首次展示", icon: "🎯" },
    { time: "00:12:45", label: "价格谈判关键点", icon: "💰" },
    { time: "00:18:30", label: "工厂实力展示", icon: "🏭" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]">
      {/* 顶部栏 */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-[#0F0F23]/80 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-white font-semibold">AI Meeting Reel 生成器</h1>
            <p className="text-sm text-gray-400">一键将会议剪辑为高光短视频</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <span className="text-purple-400 font-semibold">AI 自动剪辑</span>
        </div>
      </div>

      <div className="pt-16 flex h-screen">
        {/* 左侧：会议素材预览 */}
        <div className="flex-1 p-6">
          <div className="h-full flex flex-col gap-4">
            {/* 视频预览 */}
            <div className="flex-1 bg-black/50 rounded-xl overflow-hidden relative border border-purple-500/20">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                    <Play className="w-16 h-16 text-white" />
                  </div>
                  <p className="text-white text-lg font-semibold mb-2">会议录制素材</p>
                  <p className="text-gray-400 text-sm">深圳科技工厂 × Alice Wang</p>
                </div>
              </div>

              {/* 时长标签 */}
              <div className="absolute top-4 left-4 px-4 py-2 bg-black/70 backdrop-blur-xl rounded-lg border border-white/20">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="text-white font-mono">00:45:23</span>
                </div>
              </div>
            </div>

            {/* 音频波形可视化 */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
              <h3 className="text-white font-semibold mb-3">音频波形</h3>
              <div className="h-24 bg-black/30 rounded-lg flex items-end justify-around px-2 gap-1">
                {Array.from({ length: 50 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                    style={{ height: `${Math.random() * 100}%` }}
                  ></div>
                ))}
              </div>
            </div>

            {/* AI 自动标记高光时刻 */}
            <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">AI 自动标记高光时刻</h3>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {highlights.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-3 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-purple-400 text-xs font-mono">{item.time}</span>
                    </div>
                    <p className="text-white text-sm font-medium">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：生成设置 */}
        <div className="w-[400px] bg-[#0F0F23]/80 backdrop-blur-xl border-l border-purple-500/20 flex flex-col">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-white font-semibold text-lg mb-1">生成设置</h2>
            <p className="text-gray-400 text-sm">自定义您的 Meeting Reel</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* 选择模板 */}
            <div>
              <h3 className="text-white font-semibold mb-3">选择模板</h3>
              <div className="grid grid-cols-2 gap-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-4 rounded-lg border transition-all ${
                      selectedTemplate === template.id
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-white/10 bg-white/5 hover:border-purple-500/30"
                    }`}
                  >
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl`}>
                      {template.icon}
                    </div>
                    <p className="text-white text-sm font-medium text-center">{template.name}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 视频时长 */}
            <div>
              <h3 className="text-white font-semibold mb-3">视频时长</h3>
              <div className="flex gap-2">
                {["15s", "30s", "60s"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-3 rounded-lg border transition-all ${
                      duration === d
                        ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-purple-500/30"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* 输出格式 */}
            <div>
              <h3 className="text-white font-semibold mb-3">输出格式</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat("9:16")}
                  className={`flex-1 py-3 rounded-lg border transition-all ${
                    format === "9:16"
                      ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                      : "border-white/10 bg-white/5 text-gray-400 hover:border-purple-500/30"
                  }`}
                >
                  9:16 竖屏
                </button>
                <button
                  onClick={() => setFormat("16:9")}
                  className={`flex-1 py-3 rounded-lg border transition-all ${
                    format === "16:9"
                      ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                      : "border-white/10 bg-white/5 text-gray-400 hover:border-purple-500/30"
                  }`}
                >
                  16:9 横屏
                </button>
              </div>
            </div>

            {/* 字幕语言 */}
            <div>
              <h3 className="text-white font-semibold mb-3">字幕语言</h3>
              <div className="flex gap-2">
                {[
                  { id: "zh", label: "中文" },
                  { id: "en", label: "英文" },
                  { id: "dual", label: "双语" },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setSubtitle(lang.id)}
                    className={`flex-1 py-3 rounded-lg border transition-all ${
                      subtitle === lang.id
                        ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-purple-500/30"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 品牌水印 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">品牌水印</h3>
                <button
                  onClick={() => setWatermark(!watermark)}
                  className={`w-12 h-6 rounded-full transition-all ${
                    watermark ? "bg-purple-500" : "bg-white/20"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      watermark ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  ></div>
                </button>
              </div>
            </div>

            {/* BGM 风格 */}
            <div>
              <h3 className="text-white font-semibold mb-3">BGM 风格</h3>
              <div className="space-y-2">
                {[
                  { id: "tech", label: "科技感", icon: "🎵" },
                  { id: "light", label: "轻快", icon: "🎶" },
                  { id: "business", label: "商务", icon: "🎼" },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setBgm(style.id)}
                    className={`w-full py-3 px-4 rounded-lg border transition-all flex items-center gap-3 ${
                      bgm === style.id
                        ? "border-purple-500/50 bg-purple-500/10"
                        : "border-white/10 bg-white/5 hover:border-purple-500/30"
                    }`}
                  >
                    <span className="text-2xl">{style.icon}</span>
                    <span className={bgm === style.id ? "text-purple-400" : "text-gray-400"}>
                      {style.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 预览效果 */}
            <div>
              <h3 className="text-white font-semibold mb-3">预览效果</h3>
              <div className="bg-black/50 rounded-xl p-4 border border-purple-500/20">
                <div className="w-32 mx-auto aspect-[9/16] bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-12 h-12 text-purple-400" />
                </div>
                <p className="text-center text-gray-400 text-sm mt-3">手机竖屏预览</p>
              </div>
            </div>
          </div>

          {/* 底部生成按钮 */}
          <div className="p-6 border-t border-white/10 space-y-3">
            <Button className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white py-6 text-lg font-semibold">
              <Sparkles className="w-5 h-5 mr-2" />
              一键生成 Meeting Reel
            </Button>
            <p className="text-center text-gray-400 text-sm">
              <Clock className="w-4 h-4 inline mr-1" />
              预计生成时间：约 2 分钟
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
