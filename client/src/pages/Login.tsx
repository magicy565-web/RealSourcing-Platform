import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, CheckCircle2, Zap, Star, ArrowRight, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const BG = "linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)";
const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.04) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.04) 1px, transparent 1px)
`;

export default function Login() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const utils = trpc.useUtils();

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
    <div className="min-h-screen flex" style={{ background: BG }}>
      {/* 全局背景网格 */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "40px 40px" }} />

      {/* ── 左侧品牌区 ── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden">
        {/* 光晕 */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)" }} />

        {/* 右侧分隔线 */}
        <div className="absolute right-0 top-0 bottom-0 w-px"
          style={{ background: "linear-gradient(180deg, transparent, rgba(124,58,237,0.3), transparent)" }} />

        <div className="relative z-10 flex flex-col justify-between px-14 py-14 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <span className="text-white font-black text-sm">RS</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">RealSourcing</span>
          </div>

          {/* 主文案 */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span className="text-violet-300 text-xs font-semibold">AI-Powered B2B Sourcing</span>
              </div>
              <h2 className="text-4xl font-black text-white mb-3 leading-tight">
                连接真实工厂<br />
                <span style={{
                  background: "linear-gradient(135deg, #a78bfa, #818cf8)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  开启高效采购新时代
                </span>
              </h2>
              <ul className="space-y-3 mb-10">
                {[
                  "AI 智能匹配，精准推荐优质工厂",
                  "1:1 私密视频选品会议",
                  "真实工厂直连，杜绝中间商",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.50)" }}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* 用户评价 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-5 rounded-2xl"
              style={{
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.50)" }}>
                "RealSourcing 让我的采购效率提升了 3 倍，AI 匹配功能非常精准。"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                  AW
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Alice Wang</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>TikTok 采购总监</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 底部数据 */}
          <div className="flex items-center gap-8">
            {[
              { value: "500+", label: "认证工厂", accent: "#a78bfa" },
              { value: "2000+", label: "采购商", accent: "#67e8f9" },
              { value: "98%", label: "满意度", accent: "#4ade80" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-black mb-0.5"
                  style={{ color: stat.accent }}>{stat.value}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 右侧表单区 ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* 移动端 Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <span className="text-white font-black text-xs">RS</span>
            </div>
            <span className="font-bold text-white">RealSourcing</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">欢迎回来</h1>
            <p style={{ color: "rgba(255,255,255,0.40)" }}>登录您的 RealSourcing 账号</p>
          </div>

          {/* 表单卡片 */}
          <div className="rounded-2xl p-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            }}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white/70">邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.30)" }} />
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 h-11 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.60)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.10)"}
                    required
                  />
                </div>
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white/70">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.30)" }} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-10 h-11 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.60)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.10)"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: "rgba(255,255,255,0.30)" }}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 记住我 & 忘记密码 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" className="border-white/20" />
                  <Label htmlFor="remember" className="text-sm cursor-pointer" style={{ color: "rgba(255,255,255,0.40)" }}>记住我</Label>
                </div>
                <a href="#" className="text-sm font-medium transition-colors"
                  style={{ color: "#a78bfa" }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.color = "#c4b5fd"}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.color = "#a78bfa"}>
                  忘记密码？
                </a>
              </div>

              {/* 登录按钮 */}
              <motion.button
                type="submit"
                disabled={loginMutation.isPending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full h-11 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                  opacity: loginMutation.isPending ? 0.7 : 1,
                }}
              >
                {loginMutation.isPending ? "登录中..." : (
                  <><span>登录</span> <ArrowRight className="w-4 h-4" /></>
                )}
              </motion.button>
            </form>

            {/* 分隔线 */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>或使用以下方式登录</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            </div>

            {/* 社交登录 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Google",
                  icon: (
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )
                },
                {
                  label: "LinkedIn",
                  icon: (
                    <svg className="w-4 h-4 mr-2 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  )
                }
              ].map((social) => (
                <motion.button
                  key={social.label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="h-11 rounded-xl flex items-center justify-center text-sm font-medium transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  {social.icon}
                  {social.label}
                </motion.button>
              ))}
            </div>
          </div>

          <p className="text-center text-sm mt-6" style={{ color: "rgba(255,255,255,0.35)" }}>
            还没有账号？{" "}
            <Link href="/register">
              <span className="font-semibold cursor-pointer transition-colors"
                style={{ color: "#a78bfa" }}>
                立即注册 →
              </span>
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
