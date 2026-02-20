import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Video, 
  Building2, 
  MessageSquare, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Settings, 
  HelpCircle,
  ChevronLeft,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole?: "buyer" | "factory" | "user" | "admin";
}

export default function BuyerSidebar({ userRole = "buyer" }: SidebarProps) {
  const [location] = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", badge: null },
    { icon: Video, label: "Webinars", href: "/webinars", badge: null },
    { icon: Building2, label: "Factories", href: "/factories", badge: null },
    { icon: MessageSquare, label: "Messages", href: "/messages", badge: 3 },
    { icon: FileText, label: "Reports", href: "/reports", badge: null },
    { icon: CreditCard, label: "Subscription", href: "/subscription", badge: null },
    { icon: BarChart3, label: "Quota", href: "/quota", badge: null },
    { icon: Settings, label: "Settings", href: "/settings", badge: null },
    { icon: HelpCircle, label: "Help", href: "/help", badge: null },
  ];

  return (
    <div className="w-64 h-screen glass-card border-r border-border/50 flex flex-col">
      {/* Logo & Header */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xl font-bold">RealSourcing</span>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search webinars, factories, products..."
            className="w-full px-4 py-2 bg-background/50 border border-purple-500/30 rounded-lg text-sm focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-all",
                    isActive
                      ? "bg-purple-600/20 text-purple-400"
                      : "text-muted-foreground hover:bg-purple-600/10 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-purple-600/10 cursor-pointer transition-all">
          <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Magic User</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
