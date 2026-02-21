import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, User, Check, Building2, Zap, ArrowRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Consumer Electronics",
  "Textiles",
  "Toys",
  "Home & Garden",
  "Sports & Outdoors",
  "Health & Beauty",
  "Automotive",
  "Industrial",
];

export default function Register() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"buyer" | "factory">("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({ email: "", password: "", company: "" });

  // 不得修改：tRPC 注册调用
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      toast.success("Account created! Welcome to RealSourcing");
      await utils.auth.me.invalidate();
      // 不得修改：注册成功后的路由跳转
      setLocation("/onboarding");
    },
    onError: (error: any) => {
      toast.error(error.message || "Registration failed, please try again");
    },
  });

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please agree to the Terms & Privacy Policy");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    registerMutation.mutate({
      name: formData.company || formData.email.split("@")[0],
      email: formData.email,
      password: formData.password,
      role,
    });
  };

  const displayedCategories = showMoreCategories ? CATEGORIES : CATEGORIES.slice(0, 4);

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── 左侧品牌区 ── */}
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
              加入 RealSourcing
              <br />
              <span className="text-gradient-purple">开启智能采购</span>
            </h2>
            <div className="space-y-4 mb-10">
              {[
                { icon: "🏭", text: "连接 500+ 认证工厂，严格审核，品质保障" },
                { icon: "🤖", text: "AI 智能匹配，精准推荐最适合的供应商" },
                { icon: "🎥", text: "1:1 视频会议，实时查看产品和生产线" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 底部数据 */}
          <div className="flex items-center gap-8">
            {[
              { value: "500+", label: "认证工厂" },
              { value: "2000+", label: "全球买家" },
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

      {/* ── 右侧表单区 ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-foreground">RealSourcing</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">创建账号</h1>
            <p className="text-muted-foreground">连接全球工厂，开启智能采购</p>
          </div>

          {/* 角色选择 */}
          <div className="mb-5">
            <Label className="text-sm font-medium text-foreground mb-2 block">我是...</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["buyer", "factory"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-semibold transition-all duration-200 text-sm",
                    role === r
                      ? "bg-primary/15 border-primary text-foreground shadow-lg shadow-primary/15"
                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground bg-card"
                  )}
                >
                  {role === r && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  )}
                  {r === "buyer" ? <User className={`w-4 h-4 ${role === r ? "text-primary" : ""}`} /> : <Building2 className={`w-4 h-4 ${role === r ? "text-primary" : ""}`} />}
                  {r === "buyer" ? "采购商" : "工厂"}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 企业邮箱 */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">企业邮箱</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            {/* 公司名称 */}
            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-sm font-medium text-foreground">公司名称</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="company"
                  type="text"
                  placeholder="Your Company Inc."
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>

            {/* 密码 */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">密码</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="至少 6 位字符"
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

            {/* 兴趣分类 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">感兴趣的品类</Label>
              <div className="flex flex-wrap gap-2">
                {displayedCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150",
                      selectedCategories.includes(cat)
                        ? "bg-primary/15 border-primary text-primary"
                        : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground bg-card"
                    )}
                  >
                    {selectedCategories.includes(cat) && <Check className="w-3 h-3 inline mr-1" />}
                    {cat}
                  </button>
                ))}
                {!showMoreCategories && (
                  <button
                    type="button"
                    onClick={() => setShowMoreCategories(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all bg-card"
                  >
                    + 更多
                  </button>
                )}
              </div>
            </div>

            {/* 同意条款 */}
            <div className="flex items-start gap-2 pt-1">
              <button
                type="button"
                onClick={() => setAgreed(!agreed)}
                className={cn(
                  "mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  agreed ? "bg-primary border-primary" : "border-border/60 bg-card"
                )}
              >
                {agreed && <Check className="w-2.5 h-2.5 text-white" />}
              </button>
              <span className="text-xs text-muted-foreground leading-relaxed">
                我同意{" "}
                <span className="text-primary cursor-pointer hover:underline">服务条款</span>
                {" 和 "}
                <span className="text-primary cursor-pointer hover:underline">隐私政策</span>
              </span>
            </div>

            {/* 注册按钮 */}
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold btn-gradient-purple shadow-lg shadow-primary/25 mt-2"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  创建中...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  免费创建账号
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>

            <div className="text-center text-sm pt-1">
              <span className="text-muted-foreground">已有账号？</span>{" "}
              <Link href="/login">
                <span className="text-primary hover:text-primary/80 font-semibold cursor-pointer">
                  立即登录
                </span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
