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
  Calendar,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  userRole?: "buyer" | "factory" | "user" | "admin";
}

const MENU_GROUPS = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { icon: Video, label: "Webinars", href: "/webinars" },
      { icon: Building2, label: "Factories", href: "/factories" },
      { icon: MessageSquare, label: "Inquiries", href: "/inquiries" },
      { icon: Calendar, label: "Meetings", href: "/meetings" },
      { icon: Package, label: "Sample Orders", href: "/sample-orders" },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { icon: Sparkles, label: "AI Assistant", href: "/ai-assistant", badge: "NEW" },
      { icon: Zap, label: "Sourcing Intelligence", href: "/sourcing-demands", badge: "AI" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { icon: BarChart3, label: "Reports", href: "/reports" },
      { icon: Bell, label: "Notifications", href: "/notifications", badgeKey: "notifications" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: CreditCard, label: "Subscription", href: "/subscription" },
      { icon: Settings, label: "Settings", href: "/settings" },
    ],
  },
];

export default function BuyerSidebar({ userRole = "buyer" }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
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

  return (
    <div className="w-64 h-screen flex flex-col bg-[#0f0f14] border-r border-white/8">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <Link href="/dashboard">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:shadow-purple-600/50 transition-all">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white">RealSourcing</span>
              <p className="text-[10px] text-muted-foreground capitalize">{userRole} Portal</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50 transition-all"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-4 scrollbar-hide">
        {MENU_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                const Icon = item.icon;
                const badge = getBadge((item as any).badgeKey, (item as any).badge);

                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group",
                        isActive
                          ? "bg-purple-600/20 text-purple-300"
                          : "text-muted-foreground hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn("w-4.5 h-4.5 flex-shrink-0", isActive ? "text-purple-400" : "")} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {badge && (
                          <span className={cn(
                            "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                            typeof badge === "number"
                              ? "bg-red-500 text-white min-w-[18px] text-center"
                              : "bg-purple-600/40 text-purple-300"
                          )}>
                            {badge}
                          </span>
                        )}
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-purple-400" />}
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
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-semibold text-purple-300">Starter Plan</span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-2">Upgrade for unlimited inquiries & AI features</p>
          <Link href="/subscription">
            <button className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-all">
              Upgrade Now
            </button>
          </Link>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-3 py-3 border-t border-white/8">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{displayName}</p>
            <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
          </div>
          <button
            onClick={() => logout?.()}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
