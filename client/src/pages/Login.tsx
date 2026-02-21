import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, Zap, Star, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, setLocation] = useLocation();

  // 获取返回路径 - 不得修改
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const utils = trpc.useUtils();

  // 不得修改：tRPC 登录调用
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast.success("登录成功！");
      await utils.auth.me.invalidate();
      setLocation(returnTo);
    },
    onError: (error: any) => {
      toast.error(error.message || "登录失败，请检查邮箱和密码");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: formData.email, password: formData.password });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── 左侧品牌区（40%） ── */}
      <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden">
        {/* 深黑紫渐变背景 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f0c1a] via-[#1a1030] to-[#0f0c1a]" />
        {/* 光晕装饰 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-0 w-[250px] h-[250px] bg-violet-700/15 rounded-full blur-[80px]" />
        {/* 网格纹理 */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between px-12 py-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">RealSourcing</span>
          </div>

          {/* 主文案 */}
          <div>
            <h2 className="text-4xl font-bold text-foreground mb-4 leading-tight">
              连接真实工厂
              <br />
              <span className="text-gradient-purple">开启高效采购新时代</span>
            </h2>
            <ul className="space-y-3 mb-10">
              {[
                "AI 智能匹配，精准推荐优质工厂",
                "1:1 私密视频选品会议",
                "真实工厂直连，杜绝中间商",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {/* 用户评价 */}
            <div className="glass-card p-5 rounded-xl">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                "RealSourcing 让我的采购效率提升了 3 倍，AI 匹配功能非常精准。"
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-300">
                  AW
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Alice Wang</p>
                  <p className="text-xs text-muted-foreground">TikTok 采购总监</p>
                </div>
              </div>
            </div>
          </div>

          {/* 底部数据 */}
          <div className="flex items-center gap-8">
            {[
              { value: "500+", label: "认证工厂" },
              { value: "2000+", label: "采购商" },
              { value: "98%", label: "满意度" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-gradient-purple">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 右侧表单区（60%） ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* 移动端 Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-foreground">RealSourcing</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">欢迎回来</h1>
            <p className="text-muted-foreground">登录您的 RealSourcing 账号</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="邮箱地址"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 记住我 & 忘记密码 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">记住我</Label>
              </div>
              <a href="#" className="text-sm text-primary hover:text-primary/80 transition-colors">忘记密码？</a>
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              className="w-full h-11 btn-gradient-purple shadow-lg shadow-primary/25 font-semibold"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "登录中..." : (
                <>登录 <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </form>

          {/* 分隔线 */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-xs text-muted-foreground">或使用以下方式登录</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* 社交登录 */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-11 border-border/60 bg-card hover:bg-accent/50">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </Button>
            <Button variant="outline" className="h-11 border-border/60 bg-card hover:bg-accent/50">
              <svg className="w-4 h-4 mr-2 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            还没有账号？{" "}
            <Link href="/register">
              <span className="text-primary hover:text-primary/80 font-semibold cursor-pointer transition-colors">
                立即注册 →
              </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
