import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Video,
  Building2,
  Bell,
  FileText,
  CreditCard,
  Settings,
  Sparkles,
  MessageSquare,
  BarChart3,
  Search,
  LogOut,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  userRole?: "buyer" | "factory" | "user" | "admin";
}

// 不得修改：菜单路由配置
const MENU_GROUPS = [
  {
    label: "主菜单",
    items: [
      { icon: LayoutDashboard, label: "控制台", href: "/dashboard" },
      { icon: Video, label: "在线研讨会", href: "/webinars" },
      { icon: Building2, label: "工厂", href: "/factories" },
      { icon: MessageSquare, label: "询价记录", href: "/inquiries" },
    ],
  },
  {
    label: "AI 工具",
    items: [
      { icon: Sparkles, label: "AI 采购助理", href: "/ai-assistant", badge: "NEW" },
    ],
  },
  {
    label: "数据分析",
    items: [
      { icon: BarChart3, label: "报表", href: "/reports" },
      { icon: Bell, label: "通知", href: "/notifications", badgeKey: "notifications" },
    ],
  },
  {
    label: "账号管理",
    items: [
      { icon: CreditCard, label: "订阅计划", href: "/subscription" },
      { icon: Settings, label: "设置", href: "/settings" },
    ],
  },
];

export default function BuyerSidebar({ userRole = "buyer" }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // 不得修改：tRPC 通知数量查询
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const getBadge = (badgeKey?: string, badge?: string) => {
    if (badge) return badge;
    if (badgeKey === "notifications" && unreadCount > 0) return unreadCount;
    return null;
  };

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";
  const initials = displayName.slice(0, 2).toUpperCase();

  const getRoleLabel = (role: string) => {
    if (role === "buyer") return "采购商";
    if (role === "factory") return "工厂";
    if (role === "admin") return "管理员";
    return role;
  };

  return (
    <div className="w-64 h-screen flex flex-col bg-[#111827] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <Link href="/dashboard">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-all group-hover:bg-primary/80">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white">RealSourcing</span>
              <p className="text-[10px] text-slate-400 capitalize">{getRoleLabel(userRole)} 门户</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索..."
            className="w-full pl-9 pr-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-4 scrollbar-hide">
        {MENU_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                // 不得修改：路由匹配逻辑
                const isActive = location === item.href || location.startsWith(item.href + "/");
                const Icon = item.icon;
                const badge = getBadge((item as any).badgeKey, (item as any).badge);

                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group",
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/20"
                          : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200 border border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={cn(
                            "w-4 h-4 flex-shrink-0",
                            isActive ? "text-primary" : "text-slate-500 group-hover:text-slate-300"
                          )}
                        />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {badge && (
                          <span
                            className={cn(
                              "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                              typeof badge === "number"
                                ? "bg-red-500 text-white min-w-[18px] text-center"
                                : "bg-primary/20 text-primary"
                            )}
                          >
                            {badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary" />}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Upgrade Banner */}
      <div className="px-4 py-3">
        <div className="bg-gradient-to-br from-primary/15 to-violet-700/10 border border-primary/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">基础版</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">升级解锁无限询价和 AI 功能</p>
          <Link href="/subscription">
            <button className="w-full py-1.5 bg-primary hover:bg-primary/80 text-white text-xs font-semibold rounded-lg transition-all shadow-sm shadow-primary/30">
              立即升级
            </button>
          </Link>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.05] cursor-pointer transition-all group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-[11px] text-slate-400 truncate">{displayEmail}</p>
          </div>
          <button
            onClick={() => logout?.()}
            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
            title="退出登录"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
