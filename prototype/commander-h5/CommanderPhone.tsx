/* ============================================================
   DESIGN: Night Commander — Mobile H5 Commander Interface
   Layout: Fixed bottom tab nav + scrollable content area
   Colors: Dark navy bg (#0e1117), orange (#f97316) for actions,
           teal (#10b981) for success, blue (#3b82f6) for data
   Typography: Space Grotesk (headings) + Roboto Mono (numbers)
   Philosophy: 老板的"外贸指挥台"——傻瓜式操作，专业级结果
   ============================================================ */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft, Bell, Zap, Target, Database, LayoutDashboard,
  TrendingUp, Globe, MessageSquare, ChevronRight, Clock,
  CheckCircle2, Loader2, Plus, Coins, Building2,
  FileText, Users, BarChart3, RefreshCw, Star,
  Send, Linkedin, Facebook, Smartphone, Shield,
  Activity, Link2, ChevronDown, X, Check, AlertCircle
} from "lucide-react";
import { toast } from "sonner";

type Tab = "dashboard" | "commands" | "tasks" | "accounts" | "assets";

// ─── Mock 数据 ────────────────────────────────────────────────

const mockLeads = [
  { id: "1", platform: "Alibaba RFQ", company: "SunPower Solutions", country: "越南", flag: "🇻🇳", product: "太阳能板 5000件", value: "询盘金额 $120K", time: "3分钟前", type: "rfq", status: "new", contact: "Nguyen Van A", email: "nguyen@sunpower.vn" },
  { id: "2", platform: "Perplexity AI", company: "EcoHome Trading", country: "德国", flag: "🇩🇪", product: "户外家具套装", value: "AI 搜索引流", time: "18分钟前", type: "geo", status: "new", contact: "Klaus Weber", email: "k.weber@ecohome.de" },
  { id: "3", platform: "Global Sources", company: "Pacific Imports LLC", country: "美国", flag: "🇺🇸", product: "LED 灯具 OEM", value: "询盘金额 $45K", time: "1小时前", type: "rfq", status: "viewed", contact: "Mike Johnson", email: "mike@pacificimports.com" },
  { id: "4", platform: "ChatGPT 搜索", company: "Nordik Furniture AB", country: "瑞典", flag: "🇸🇪", product: "实木家具供应商", value: "AI 搜索引流", time: "2小时前", type: "geo", status: "viewed", contact: "Erik Lindqvist", email: "erik@nordik.se" },
  { id: "5", platform: "Thomasnet", company: "BuildRight Corp", country: "加拿大", flag: "🇨🇦", product: "建材配件 MOQ 100", value: "询盘金额 $28K", time: "3小时前", type: "rfq", status: "viewed", contact: "Sarah Chen", email: "s.chen@buildright.ca" },
];

const mockTasks = [
  { id: "1", title: "开发越南太阳能板市场", market: "越南", agent: "猎手 + 侦察 + 内容 Agent", status: "running", progress: 65, leads: 32, startTime: "今天 09:30", creditsUsed: 180,
    steps: [
      { label: "猎手 Agent：已找到 50 家越南企业", done: true },
      { label: "侦察 Agent：筛出 32 家高意向买家", done: true },
      { label: "内容 Agent：正在生成个性化开发信...", done: false },
    ]
  },
  { id: "2", title: "德国家具买家 GEO 优化", market: "德国", agent: "GEO 建造者 Agent", status: "done", progress: 100, leads: 8, startTime: "昨天 14:00", creditsUsed: 120,
    steps: [
      { label: "数字工厂孪生页面已创建", done: true },
      { label: "已同步至 8 个商业目录", done: true },
      { label: "Schema 结构化数据已部署", done: true },
    ]
  },
  { id: "3", title: "美国 LED 市场情报扫描", market: "美国", agent: "情报 Agent", status: "queued", progress: 0, leads: 0, startTime: "等待执行", creditsUsed: 0,
    steps: []
  },
];

const commandTemplates = [
  { id: "1", icon: "🌏", title: "开发新市场", desc: "指定国家 + 品类，猎手 Agent 全面扫描", credits: 200, popular: true },
  { id: "2", icon: "🔍", title: "竞争对手分析", desc: "分析指定竞争对手的客户和策略", credits: 150, popular: false },
  { id: "3", icon: "📈", title: "GEO 曝光加速", desc: "提升工厂在 AI 搜索中的可见度", credits: 120, popular: true },
  { id: "4", icon: "✉️", title: "开发信批量生成", desc: "基于已有线索，生成个性化开发信", credits: 80, popular: false },
  { id: "5", icon: "🎯", title: "精准买家画像", desc: "深度分析 10 家目标买家的详细背景", credits: 160, popular: false },
  { id: "6", icon: "📊", title: "市场趋势报告", desc: "生成指定品类的海外市场趋势分析", credits: 100, popular: false },
];

const mockAccounts = [
  {
    id: "1", platform: "LinkedIn", icon: Linkedin, color: "#0077B5",
    name: "李总 · 广州明辉照明", handle: "@guangzhou-minghui-lighting",
    status: "active", connections: 1247, lastActive: "5分钟前",
    todayActions: 12, weeklyGrowth: "+23",
    pendingMessages: 3,
    recentMessages: [
      { from: "Nguyen Van A", company: "SunPower Solutions 🇻🇳", preview: "Hi, I'm interested in your solar panel products...", time: "3分钟前", unread: true },
      { from: "Klaus Weber", company: "EcoHome Trading 🇩🇪", preview: "We are looking for outdoor furniture suppliers...", time: "1小时前", unread: true },
      { from: "Mike Johnson", company: "Pacific Imports 🇺🇸", preview: "Can you provide a quote for LED lights?", time: "3小时前", unread: false },
    ]
  },
  {
    id: "2", platform: "Facebook", icon: Facebook, color: "#1877F2",
    name: "明辉照明官方主页", handle: "@minghui-lighting-official",
    status: "active", connections: 892, lastActive: "12分钟前",
    todayActions: 8, weeklyGrowth: "+15",
    pendingMessages: 1,
    recentMessages: [
      { from: "Erik Lindqvist", company: "Nordik Furniture 🇸🇪", preview: "Hello, we saw your products and would like to...", time: "2小时前", unread: true },
    ]
  },
];

// ─── 子组件 ───────────────────────────────────────────────────

function StatusBar() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const timeStr = time.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1">
      <span className="text-xs font-medium text-white/70" style={{ fontFamily: "'Roboto Mono', monospace" }}>{timeStr}</span>
      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5 items-end">
          {[1,2,3,4].map(i => (
            <div key={i} className={`w-1 rounded-sm ${i <= 3 ? 'bg-white' : 'bg-white/30'}`} style={{ height: `${3 + i * 2}px` }} />
          ))}
        </div>
        <span className="text-xs text-white/70">5G</span>
        <div className="w-6 h-3 rounded-sm border border-white/50 flex items-center px-0.5">
          <div className="h-1.5 bg-teal-400 rounded-xs" style={{ width: "75%" }} />
        </div>
      </div>
    </div>
  );
}

function Header({ title, credits = 2840, onBack }: { title: string; credits?: number; onBack?: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      {onBack ? (
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Commander</span>
        </div>
      )}
      <h1 className="text-base font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h1>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "oklch(0.22 0.04 40 / 60%)" }}>
          <Coins className="w-3 h-3 text-orange-400" />
          <span className="text-xs font-mono text-orange-300">{credits.toLocaleString()}</span>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 relative">
          <Bell className="w-4 h-4 text-white" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
        </button>
      </div>
    </div>
  );
}

// ─── 询盘回复弹窗 ─────────────────────────────────────────────

function ReplyModal({ lead, onClose }: { lead: typeof mockLeads[0]; onClose: () => void }) {
  const [reply, setReply] = useState("");
  const [stage, setStage] = useState<"input" | "translating" | "preview" | "sent">("input");
  const [translated, setTranslated] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mockTranslations: Record<string, string> = {
    default: `Dear ${lead.contact},\n\nThank you for your inquiry about our ${lead.product}. We are pleased to offer you our best competitive pricing.\n\nPlease find our quotation attached. We look forward to establishing a long-term business relationship with your company.\n\nBest regards,\nMing Hui Lighting`
  };

  const handleTranslate = () => {
    if (!reply.trim()) { toast.error("请输入回复内容"); return; }
    setStage("translating");
    setTimeout(() => {
      setTranslated(mockTranslations.default);
      setStage("preview");
    }, 1800);
  };

  const handleSend = () => {
    setStage("sent");
    setTimeout(() => {
      toast.success(`已通过 OpenClaw 发送至 ${lead.contact}`, { description: "对话记录已同步至飞书" });
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: "oklch(0 0 0 / 70%)" }} onClick={onClose}>
      <div className="w-full rounded-t-3xl overflow-hidden" style={{ background: "oklch(0.16 0.02 250)", border: "1px solid oklch(1 0 0 / 10%)" }}
        onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="px-5 pb-6">
          {/* Lead Info */}
          <div className="flex items-center gap-3 py-3 mb-4 border-b border-white/8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
              {lead.contact.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{lead.contact}</p>
              <p className="text-xs text-slate-500">{lead.company} · {lead.flag} {lead.country}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-orange-400 font-medium">{lead.platform}</p>
              <p className="text-xs text-slate-500">{lead.value}</p>
            </div>
          </div>

          {/* Buyer's Message */}
          <div className="rounded-xl p-3 mb-4" style={{ background: "oklch(0.20 0.02 250)" }}>
            <p className="text-xs text-slate-500 mb-1">买家询盘原文</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              "Hi, I'm interested in your {lead.product}. Could you please provide a quotation for a sample order? We are looking for a long-term supplier."
            </p>
          </div>

          {stage === "input" && (
            <>
              <label className="text-xs text-slate-400 mb-2 block">用中文回复（OpenClaw 自动翻译发出）</label>
              <textarea ref={textareaRef} value={reply} onChange={e => setReply(e.target.value)}
                placeholder="例：您好，感谢询盘！我们可以提供样品，最小起订量 100 件，价格 $8.5/件，含运费到越南..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none resize-none"
                style={{ background: "oklch(0.22 0.02 250)", border: "1px solid oklch(1 0 0 / 12%)" }} />
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Shield className="w-3 h-3 text-teal-400" />
                  <span>OpenClaw 翻译 · 以您的账号发出</span>
                </div>
                <button onClick={handleTranslate}
                  className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white active:scale-95 transition-transform"
                  style={{ background: "linear-gradient(135deg, oklch(0.70 0.18 40) 0%, oklch(0.63 0.20 35) 100%)" }}>
                  <Zap className="w-3.5 h-3.5" />翻译预览
                </button>
              </div>
            </>
          )}

          {stage === "translating" && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-10 h-10 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin" />
              <p className="text-sm text-slate-400">OpenClaw 正在翻译...</p>
              <p className="text-xs text-slate-600">AI 翻译 + 商务语气优化</p>
            </div>
          )}

          {stage === "preview" && (
            <>
              <div className="rounded-xl p-3 mb-4" style={{ background: "oklch(0.20 0.04 160 / 40%)", border: "1px solid oklch(0.60 0.12 160 / 30%)" }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Check className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-xs text-teal-400 font-medium">翻译完成 · 商务语气已优化</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{translated}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStage("input")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-white/10 active:scale-95 transition-transform">
                  重新编辑
                </button>
                <button onClick={handleSend}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  style={{ background: "linear-gradient(135deg, oklch(0.70 0.18 40) 0%, oklch(0.63 0.20 35) 100%)" }}>
                  <Send className="w-3.5 h-3.5" />确认发送
                </button>
              </div>
            </>
          )}

          {stage === "sent" && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-teal-400" />
              </div>
              <p className="text-sm font-semibold text-white">发送成功</p>
              <p className="text-xs text-slate-500">OpenClaw 已代您发出，对话同步至飞书</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 页面 ─────────────────────────────────────────────────

function DashboardTab({ onReply }: { onReply: (lead: typeof mockLeads[0]) => void }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 150); return () => clearTimeout(t); }, []);

  return (
    <div className="px-4 pb-24 space-y-4">
      {/* Credits Hero */}
      <div className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.25 0.06 40) 0%, oklch(0.20 0.04 38) 100%)", border: "1px solid oklch(0.70 0.18 40 / 30%)" }}>
        <div className="absolute top-0 right-0 w-36 h-36 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, oklch(0.70 0.18 40) 0%, transparent 70%)", transform: "translate(30%,-30%)" }} />
        <p className="text-xs text-orange-300/70 uppercase tracking-wider mb-1">可用积分</p>
        <div className={`text-4xl font-bold text-white mb-0.5 transition-all duration-500 ${ready ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          style={{ fontFamily: "'Roboto Mono', monospace" }}>2,840</div>
        <p className="text-xs text-orange-300/60">≈ 可执行 14 次市场开发任务</p>
        <div className="flex items-center gap-2 mt-3">
          <button onClick={() => toast.success("积分充值功能即将上线")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold active:scale-95 transition-transform">
            <Plus className="w-3 h-3" />充值积分
          </button>
          <div className="flex items-center gap-1.5 text-xs text-orange-300/60">
            <Activity className="w-3 h-3" />
            <span>2 个 OpenClaw 运行中</span>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "本月询盘", value: "23", color: "text-orange-400", icon: <MessageSquare className="w-4 h-4" /> },
          { label: "AI 引流", value: "8", color: "text-teal-400", icon: <Globe className="w-4 h-4" /> },
          { label: "执行中", value: "1", color: "text-blue-400", icon: <Loader2 className="w-4 h-4 animate-spin" /> },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "oklch(0.19 0.02 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
            <div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div>
            <div className={`text-xl font-bold ${s.color} transition-all duration-500 ${ready ? 'opacity-100' : 'opacity-0'}`}
              style={{ fontFamily: "'Roboto Mono', monospace" }}>{s.value}</div>
            <div className="text-xs text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* OpenClaw Status */}
      <div className="rounded-xl p-4" style={{ background: "oklch(0.19 0.02 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>OpenClaw 状态</span>
          </div>
          <span className="text-xs text-teal-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />在线
          </span>
        </div>
        <div className="space-y-2">
          {[
            { name: "LinkedIn 账号", platform: "独立版", status: "active", msgs: 3 },
            { name: "Facebook 主页", platform: "独立版", status: "active", msgs: 1 },
          ].map((acc) => (
            <div key={acc.name} className="flex items-center justify-between py-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span className="text-xs text-slate-300">{acc.name}</span>
                <span className="px-1.5 py-0.5 rounded text-xs bg-blue-500/15 text-blue-400">{acc.platform}</span>
              </div>
              {acc.msgs > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-orange-500 text-white font-bold">{acc.msgs}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Latest Leads */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>最新询盘机会</h3>
          <span className="text-xs text-orange-400">查看全部 →</span>
        </div>
        <div className="space-y-2">
          {mockLeads.slice(0, 4).map((lead, i) => (
            <div key={lead.id} className="rounded-xl p-3.5 transition-all duration-300"
              style={{
                background: "oklch(0.19 0.02 250)",
                border: `1px solid ${lead.status === 'new' ? 'oklch(0.70 0.18 40 / 25%)' : 'oklch(1 0 0 / 8%)'}`,
                opacity: ready ? 1 : 0,
                transform: ready ? 'translateY(0)' : 'translateY(12px)',
                transitionDelay: `${i * 80}ms`
              }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {lead.status === 'new' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0 animate-pulse" />}
                    <span className="text-xs text-slate-500">{lead.flag} {lead.country} · {lead.platform}</span>
                  </div>
                  <p className="text-sm font-semibold text-white truncate">{lead.company}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{lead.product}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-xs font-medium ${lead.type === 'rfq' ? 'text-orange-400' : 'text-teal-400'}`}>
                    {lead.type === 'rfq' ? '📋 RFQ' : '🤖 AI引流'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{lead.time}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <span className="text-xs text-slate-400">{lead.value}</span>
                <button onClick={() => onReply(lead)}
                  className="text-xs text-orange-400 flex items-center gap-0.5 active:opacity-70 font-medium">
                  <MessageSquare className="w-3 h-3" />回复询盘
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommandsTab() {
  const [selected, setSelected] = useState<string | null>(null);
  const [market, setMarket] = useState("");
  const [product, setProduct] = useState("");
  const [launching, setLaunching] = useState(false);

  const handleLaunch = (credits: number, title: string) => {
    if (!market || !product) { toast.error("请填写目标市场和产品类别"); return; }
    setLaunching(true);
    setTimeout(() => {
      setLaunching(false);
      setSelected(null);
      setMarket("");
      setProduct("");
      toast.success(`指令已发起！`, {
        description: `${title} · ${market} ${product} · 消耗 ${credits} 积分`,
      });
    }, 1500);
  };

  return (
    <div className="px-4 pb-24">
      <p className="text-sm text-slate-400 mb-3">选择指令模板，消耗积分驱动 AI Agent 执行</p>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 mb-4">
        <Coins className="w-4 h-4 text-orange-400 flex-shrink-0" />
        <span className="text-xs text-orange-300">当前积分：<strong className="font-mono">2,840</strong>，可执行约 14 次任务</span>
      </div>
      <div className="space-y-2.5">
        {commandTemplates.map((cmd) => (
          <div key={cmd.id}>
            <button onClick={() => setSelected(selected === cmd.id ? null : cmd.id)}
              className="w-full rounded-xl p-4 text-left transition-all duration-200 active:scale-98"
              style={{
                background: selected === cmd.id ? "oklch(0.22 0.04 40)" : "oklch(0.19 0.02 250)",
                border: `1px solid ${selected === cmd.id ? 'oklch(0.70 0.18 40 / 40%)' : 'oklch(1 0 0 / 8%)'}`,
              }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">{cmd.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{cmd.title}</span>
                    {cmd.popular && <span className="px-1.5 py-0.5 rounded text-xs bg-orange-500/20 text-orange-400 font-medium">热门</span>}
                  </div>
                  <p className="text-xs text-slate-400">{cmd.desc}</p>
                </div>
                <div className="flex items-center gap-1 text-orange-400 text-xs font-mono flex-shrink-0">
                  <Coins className="w-3 h-3" />{cmd.credits}
                </div>
              </div>
            </button>
            {selected === cmd.id && (
              <div className="mt-1.5 rounded-xl p-4 space-y-3"
                style={{ background: "oklch(0.16 0.02 250)", border: "1px solid oklch(0.70 0.18 40 / 20%)" }}>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">目标市场（国家/地区）</label>
                  <input value={market} onChange={e => setMarket(e.target.value)}
                    placeholder="例：越南、德国、美国德州..."
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-slate-600 outline-none"
                    style={{ background: "oklch(0.22 0.02 250)", border: "1px solid oklch(1 0 0 / 12%)" }} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">产品类别</label>
                  <input value={product} onChange={e => setProduct(e.target.value)}
                    placeholder="例：太阳能板、户外家具、LED 灯具..."
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-slate-600 outline-none"
                    style={{ background: "oklch(0.22 0.02 250)", border: "1px solid oklch(1 0 0 / 12%)" }} />
                </div>
                <button onClick={() => handleLaunch(cmd.credits, cmd.title)} disabled={launching}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
                  style={{ background: "linear-gradient(135deg, oklch(0.70 0.18 40) 0%, oklch(0.63 0.20 35) 100%)" }}>
                  {launching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {launching ? "指令发送中..." : `发起指令（消耗 ${cmd.credits} 积分）`}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TasksTab() {
  const cfg = {
    running: { label: "执行中", color: "text-orange-400", bg: "bg-orange-500/15", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    done: { label: "已完成", color: "text-teal-400", bg: "bg-teal-500/15", icon: <CheckCircle2 className="w-3 h-3" /> },
    queued: { label: "等待中", color: "text-slate-400", bg: "bg-slate-500/15", icon: <Clock className="w-3 h-3" /> },
  };
  return (
    <div className="px-4 pb-24 space-y-3">
      <p className="text-sm text-slate-400 mb-1">AI Agent 正在为您执行的任务</p>
      {mockTasks.map((task, i) => {
        const s = cfg[task.status as keyof typeof cfg];
        return (
          <div key={task.id} className="rounded-xl p-4"
            style={{ background: "oklch(0.19 0.02 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-0.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{task.title}</h3>
                <p className="text-xs text-slate-500">{task.agent}</p>
              </div>
              <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${s.color} ${s.bg}`}>
                {s.icon}{s.label}
              </span>
            </div>
            {task.status === 'running' && (
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                  <span>执行进度</span><span className="font-mono">{task.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-1000" style={{ width: `${task.progress}%` }} />
                </div>
                <div className="mt-2 space-y-1.5">
                  {task.steps.map((step, j) => (
                    <div key={j} className="flex items-center gap-2">
                      {step.done
                        ? <CheckCircle2 className="w-3 h-3 text-teal-400 flex-shrink-0" />
                        : <Loader2 className="w-3 h-3 text-orange-400 animate-spin flex-shrink-0" />}
                      <p className={`text-xs ${step.done ? 'text-slate-400' : 'text-orange-300'}`}>{step.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
              <div className="text-center">
                <div className="text-sm font-bold text-white font-mono">{task.leads || "—"}</div>
                <div className="text-xs text-slate-500">发现线索</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-medium text-slate-400 leading-tight">{task.startTime}</div>
                <div className="text-xs text-slate-500">开始时间</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-orange-400 font-mono">{task.creditsUsed || "—"}</div>
                <div className="text-xs text-slate-500">已耗积分</div>
              </div>
            </div>
            {task.status === 'done' && (
              <button onClick={() => toast.success("战报已发送到飞书数字资产库")}
                className="mt-3 w-full py-2 rounded-lg text-xs font-medium text-teal-400 border border-teal-500/30 bg-teal-500/10 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                <FileText className="w-3.5 h-3.5" />查看完整战报 · 已归档飞书
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AccountsTab({ onReply }: { onReply: (lead: typeof mockLeads[0]) => void }) {
  const [expanded, setExpanded] = useState<string | null>("1");

  return (
    <div className="px-4 pb-24 space-y-4">
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "oklch(0.19 0.02 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
        <Shield className="w-4 h-4 text-teal-400 flex-shrink-0" />
        <div>
          <p className="text-xs font-medium text-white">账号由 OpenClaw 安全托管</p>
          <p className="text-xs text-slate-500">Session 加密存储，不保存明文密码</p>
        </div>
        <span className="ml-auto flex items-center gap-1 text-xs text-teal-400">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />在线
        </span>
      </div>

      {mockAccounts.map((acc) => {
        const Icon = acc.icon;
        const isExpanded = expanded === acc.id;
        return (
          <div key={acc.id} className="rounded-xl overflow-hidden" style={{ background: "oklch(0.19 0.02 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
            {/* Account Header */}
            <button className="w-full p-4 text-left" onClick={() => setExpanded(isExpanded ? null : acc.id)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: acc.color + "20" }}>
                  <Icon className="w-5 h-5" style={{ color: acc.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{acc.name}</p>
                    {acc.pendingMessages > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-xs bg-orange-500 text-white font-bold">{acc.pendingMessages}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{acc.handle}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { label: "连接数", value: acc.connections.toLocaleString(), color: "text-blue-400" },
                  { label: "今日操作", value: acc.todayActions.toString(), color: "text-orange-400" },
                  { label: "本周增长", value: acc.weeklyGrowth, color: "text-teal-400" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center py-2 rounded-lg" style={{ background: "oklch(0.16 0.02 250)" }}>
                    <div className={`text-sm font-bold font-mono ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-slate-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </button>

            {/* Messages */}
            {isExpanded && (
              <div className="border-t border-white/8">
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">待处理消息</span>
                  <span className="text-xs text-orange-400">{acc.pendingMessages} 条未读</span>
                </div>
                {acc.recentMessages.map((msg, j) => (
                  <div key={j} className="px-4 py-3 border-t border-white/5"
                    style={{ background: msg.unread ? "oklch(0.17 0.03 40 / 30%)" : "transparent" }}>
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {msg.from.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-xs font-semibold text-white">{msg.from}</p>
                          <span className="text-xs text-slate-600">{msg.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{msg.company}</p>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{msg.preview}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onReply(mockLeads.find(l => l.contact === msg.from) || mockLeads[0])}
                      className="mt-2 w-full py-2 rounded-lg text-xs font-medium text-orange-400 border border-orange-500/20 bg-orange-500/8 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                      <MessageSquare className="w-3 h-3" />用中文回复（OpenClaw 翻译发出）
                    </button>
                  </div>
                ))}
                <div className="px-4 py-3 border-t border-white/5">
                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Activity className="w-3 h-3" />
                    OpenClaw 上次活跃：{acc.lastActive}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button onClick={() => toast.info("账号绑定功能即将上线")}
        className="w-full py-3 rounded-xl text-sm font-medium text-slate-400 border border-white/10 flex items-center justify-center gap-2 active:scale-95 transition-transform">
        <Link2 className="w-4 h-4" />绑定新账号
      </button>
    </div>
  );
}

function AssetsTab() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  const assets = [
    { icon: <Users className="w-4 h-4" />, label: "客户联系人", value: "247", unit: "个", color: "text-blue-400", trend: "+12 本月" },
    { icon: <MessageSquare className="w-4 h-4" />, label: "沟通记录", value: "1,832", unit: "条", color: "text-purple-400", trend: "已同步飞书" },
    { icon: <Building2 className="w-4 h-4" />, label: "产品档案", value: "68", unit: "款", color: "text-orange-400", trend: "AI 已结构化" },
    { icon: <Globe className="w-4 h-4" />, label: "市场情报", value: "34", unit: "份", color: "text-teal-400", trend: "本季度新增" },
    { icon: <BarChart3 className="w-4 h-4" />, label: "交易历史", value: "156", unit: "笔", color: "text-yellow-400", trend: "总金额 $2.4M" },
    { icon: <Star className="w-4 h-4" />, label: "买家评价", value: "89", unit: "条", color: "text-pink-400", trend: "平均 4.7 分" },
  ];

  return (
    <div className="px-4 pb-24">
      <p className="text-sm text-slate-400 mb-3">企业核心数字资产，已自动归集至飞书数字资产库</p>
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
        style={{ background: "oklch(0.19 0.02 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-white">飞书数字资产库</p>
          <p className="text-xs text-slate-500">上次同步：3分钟前 · 全部数据已加密存储</p>
        </div>
        <span className="flex items-center gap-1 text-xs text-teal-400 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />同步中
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {assets.map((a, i) => (
          <div key={a.label} className="rounded-xl p-4 transition-all duration-500"
            style={{
              background: "oklch(0.19 0.02 250)", border: "1px solid oklch(1 0 0 / 8%)",
              opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(10px)',
              transitionDelay: `${i * 60}ms`
            }}>
            <div className={`mb-2 ${a.color}`}>{a.icon}</div>
            <div className="flex items-end gap-1 mb-0.5">
              <span className={`text-2xl font-bold ${a.color}`} style={{ fontFamily: "'Roboto Mono', monospace" }}>{a.value}</span>
              <span className="text-xs text-slate-500 mb-0.5">{a.unit}</span>
            </div>
            <p className="text-xs font-medium text-white mb-0.5">{a.label}</p>
            <p className="text-xs text-slate-500">{a.trend}</p>
          </div>
        ))}
      </div>
      <button onClick={() => toast.info("正在跳转至飞书数字资产库...")}
        className="mt-4 w-full py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 border border-blue-500/30 bg-blue-500/10 active:scale-95 transition-transform">
        <Database className="w-4 h-4 text-blue-400" />在飞书中查看完整资产库
        <ChevronRight className="w-4 h-4 text-blue-400" />
      </button>
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────

export default function CommanderPhone() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [replyLead, setReplyLead] = useState<typeof mockLeads[0] | null>(null);
  const [, navigate] = useLocation();

  const tabs = [
    { id: "dashboard" as Tab, icon: <LayoutDashboard className="w-5 h-5" />, label: "战报" },
    { id: "commands" as Tab, icon: <Zap className="w-5 h-5" />, label: "指令" },
    { id: "tasks" as Tab, icon: <Target className="w-5 h-5" />, label: "任务" },
    { id: "accounts" as Tab, icon: <Smartphone className="w-5 h-5" />, label: "账号" },
    { id: "assets" as Tab, icon: <Database className="w-5 h-5" />, label: "资产" },
  ];

  const titles: Record<Tab, string> = {
    dashboard: "今日战报",
    commands: "发起指令",
    tasks: "任务中心",
    accounts: "账号托管",
    assets: "数字资产",
  };

  return (
    <div className="min-h-screen flex items-start justify-center sm:py-8" style={{ background: "oklch(0.10 0.02 250)" }}>
      <div className="phone-frame w-full sm:rounded-3xl sm:overflow-hidden sm:shadow-2xl relative"
        style={{ background: "oklch(0.14 0.02 250)", border: "1px solid oklch(1 0 0 / 10%)", maxWidth: "390px" }}>
        <StatusBar />
        <Header title={titles[activeTab]} onBack={() => navigate("/")} />
        <div className="overflow-y-auto" style={{ height: "calc(100dvh - 130px)", scrollbarWidth: "none" }}>
          {activeTab === "dashboard" && <DashboardTab onReply={setReplyLead} />}
          {activeTab === "commands" && <CommandsTab />}
          {activeTab === "tasks" && <TasksTab />}
          {activeTab === "accounts" && <AccountsTab onReply={setReplyLead} />}
          {activeTab === "assets" && <AssetsTab />}
        </div>
        {/* Bottom Tab Bar */}
        <div className="absolute bottom-0 left-0 right-0" style={{ background: "oklch(0.16 0.02 250)", borderTop: "1px solid oklch(1 0 0 / 8%)" }}>
          <div className="flex items-center justify-around px-1 py-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${activeTab === tab.id ? "text-orange-400" : "text-slate-500"}`}>
                <div className={`transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : ''}`}>{tab.icon}</div>
                <span className="text-xs font-medium">{tab.label}</span>
                {activeTab === tab.id && <div className="w-1 h-1 rounded-full bg-orange-500" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 询盘回复弹窗 */}
      {replyLead && <ReplyModal lead={replyLead} onClose={() => setReplyLead(null)} />}
    </div>
  );
}
