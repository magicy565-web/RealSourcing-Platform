import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { Building2, Calendar, Package, User, Bell, MessageSquare, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const [location] = useLocation();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  const navItems = [
    { href: "/", label: "首页", icon: null },
    { href: "/webinars", label: "在线研讨会", icon: Calendar },
    { href: "/factories", label: "工厂", icon: Building2 },
    { href: "/products", label: "产品", icon: Package },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <a className="flex items-center space-x-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity">
              <Building2 className="h-6 w-6" />
              <span>RealSourcing</span>
            </a>
          </Link>

          {/* 主导航 */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* 右侧用户区域 */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : isAuthenticated && user ? (
              <>
                {/* 消息通知 */}
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/notifications">
                    <a className="relative">
                      <Bell className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                        3
                      </Badge>
                    </a>
                  </Link>
                </Button>

                {/* 站内消息 */}
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/messages">
                    <a className="relative">
                      <MessageSquare className="h-5 w-5" />
                    </a>
                  </Link>
                </Button>

                {/* 用户菜单 */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name || "用户"}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        <p className="text-xs leading-none text-muted-foreground mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {user.role === "buyer" ? "买家" : user.role === "factory" ? "工厂" : user.role === "admin" ? "管理员" : "用户"}
                          </Badge>
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <a className="flex items-center w-full">
                          <User className="mr-2 h-4 w-4" />
                          <span>个人资料</span>
                        </a>
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "factory" && (
                      <DropdownMenuItem asChild>
                        <Link href="/my-factory">
                          <a className="flex items-center w-full">
                            <Building2 className="mr-2 h-4 w-4" />
                            <span>我的工厂</span>
                          </a>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>退出登录</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <a href={getLoginUrl()}>登录</a>
                </Button>
                <Button asChild>
                  <Link href="/register">
                    <a>注册</a>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="flex-1">{children}</main>

      {/* 页脚 */}
      <footer className="border-t bg-muted/50">
        <div className="container py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">关于我们</h3>
              <p className="text-sm text-muted-foreground">
                RealSourcing 是一个连接买家和工厂的 B2B 采购协作平台，提供在线研讨会和实时视频会议功能。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">快速链接</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/webinars">
                    <a className="text-muted-foreground hover:text-primary">在线研讨会</a>
                  </Link>
                </li>
                <li>
                  <Link href="/factories">
                    <a className="text-muted-foreground hover:text-primary">工厂列表</a>
                  </Link>
                </li>
                <li>
                  <Link href="/products">
                    <a className="text-muted-foreground hover:text-primary">产品列表</a>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">联系我们</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>邮箱: contact@realsourcing.com</li>
                <li>电话: +86 400-123-4567</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">关注我们</h3>
              <p className="text-sm text-muted-foreground">获取最新的行业资讯和平台动态</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2026 RealSourcing. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
