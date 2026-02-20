import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Building2, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [location, setLocation] = useLocation();
  
  // 获取返回路径
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast.success("登录成功！");
      // 强制刷新 auth.me，确保 ProtectedRoute 能识别登录状态
      await utils.auth.me.invalidate();
      setLocation(returnTo);
    },
    onError: (error: any) => {
      toast.error(error.message || "登录失败，请检查邮箱和密码");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧 - 品牌介绍 */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* 渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-purple-800/30 to-transparent" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <Building2 className="w-10 h-10 text-purple-400" />
            <span className="text-3xl font-bold">RealSourcing</span>
          </div>

          {/* 主标题 */}
          <h1 className="text-5xl font-bold mb-8 leading-tight">
            连接真实工厂
            <br />
            开启高效采购新时代
          </h1>

          {/* 特性列表 */}
          <div className="space-y-6 mb-12">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-lg">AI 智能匹配，精准推荐优质工厂</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-lg">1:1 私密视频选品会议</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-lg">真实工厂直连，杜绝中间商</p>
              </div>
            </div>
          </div>

          {/* 用户评价 */}
          <div className="glass-card p-6 max-w-md">
            <p className="text-lg italic mb-4">"RealSourcing 让我的采购效率提升了 3 倍"</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-600/30 flex items-center justify-center">
                <span className="text-lg font-semibold">A</span>
              </div>
              <div>
                <p className="font-semibold">Alice Wang</p>
                <p className="text-sm text-muted-foreground">TikTok 采购总监</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧 - 登录表单 */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <Building2 className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold">RealSourcing</span>
          </div>

          {/* 表单卡片 */}
          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">欢迎回来</h2>
              <p className="text-muted-foreground">登录您的 RealSourcing 账号</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="邮箱地址"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-background/50 border-purple-500/30 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="密码"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 bg-background/50 border-purple-500/30 focus:border-purple-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* 记住我 & 忘记密码 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    记住我
                  </Label>
                </div>
                <Link href="/forgot-password">
                  <span className="text-sm text-purple-400 hover:text-purple-300 cursor-pointer">
                    忘记密码？
                  </span>
                </Link>
              </div>

              {/* 登录按钮 */}
              <Button
                type="submit"
                className="w-full btn-gradient-purple h-12 text-base"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "登录中..." : "登录"}
              </Button>

              {/* 分隔线 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground">或</span>
                </div>
              </div>

              {/* 第三方登录 */}
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-purple-500/30 hover:bg-purple-500/10"
                  onClick={() => toast.info("Google 登录功能即将上线")}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-purple-500/30 hover:bg-purple-500/10"
                  onClick={() => toast.info("LinkedIn 登录功能即将上线")}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </Button>
              </div>

              {/* 注册链接 */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">还没有账号？</span>{" "}
                <Link href="/register">
                  <span className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer">
                    立即注册 →
                  </span>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
