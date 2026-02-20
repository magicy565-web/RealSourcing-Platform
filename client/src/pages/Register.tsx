import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Building2, Mail, Lock, User, Briefcase, Phone, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Register() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer" as "buyer" | "factory" | "user",
    company: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("注册成功！请登录");
      setLocation("/login");
    },
    onError: (error: any) => {
      toast.error(error.message || "注册失败，请重试");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(formData);
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
            加入 RealSourcing
            <br />
            <span className="text-gradient-purple">开启全球采购新篇章</span>
          </h1>

          {/* 特性列表 */}
          <div className="space-y-6 mb-12">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">连接 500+ 认证工厂</h3>
                <p className="text-muted-foreground">所有工厂经过严格认证，确保真实可靠</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">AI 智能推荐</h3>
                <p className="text-muted-foreground">基于需求智能匹配最合适的供应商</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1">1:1 视频会议</h3>
                <p className="text-muted-foreground">实时查看产品和生产线，快速建立信任</p>
              </div>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-3 gap-6">
            <div className="glass-card p-4 text-center">
              <div className="text-3xl font-bold text-gradient-purple mb-1">500+</div>
              <div className="text-sm text-muted-foreground">认证工厂</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-3xl font-bold text-gradient-purple mb-1">2000+</div>
              <div className="text-sm text-muted-foreground">全球采购商</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-3xl font-bold text-gradient-purple mb-1">98%</div>
              <div className="text-sm text-muted-foreground">满意度</div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧 - 注册表单 */}
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
              <h2 className="text-3xl font-bold mb-2">创建账号</h2>
              <p className="text-muted-foreground">开始您的 B2B 采购之旅</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 姓名 */}
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="您的姓名"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 bg-background/50 border-purple-500/30 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

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
                    placeholder="至少 6 位密码"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 bg-background/50 border-purple-500/30 focus:border-purple-500"
                    required
                    minLength={6}
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

              {/* 角色 */}
              <div className="space-y-2">
                <Label htmlFor="role">我是</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "buyer" | "factory" | "user") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="bg-background/50 border-purple-500/30 focus:border-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">采购商 (Buyer)</SelectItem>
                    <SelectItem value="factory">工厂 (Factory)</SelectItem>
                    <SelectItem value="user">普通用户</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 公司 */}
              <div className="space-y-2">
                <Label htmlFor="company">公司名称（选填）</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="company"
                    type="text"
                    placeholder="您的公司名称"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="pl-10 bg-background/50 border-purple-500/30 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* 电话 */}
              <div className="space-y-2">
                <Label htmlFor="phone">电话（选填）</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="联系电话"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 bg-background/50 border-purple-500/30 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* 注册按钮 */}
              <Button
                type="submit"
                className="w-full btn-gradient-purple h-12 text-base"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "注册中..." : "免费注册"}
              </Button>

              {/* 服务条款 */}
              <p className="text-xs text-center text-muted-foreground">
                注册即表示您同意我们的{" "}
                <span className="text-purple-400 hover:text-purple-300 cursor-pointer">服务条款</span> 和{" "}
                <span className="text-purple-400 hover:text-purple-300 cursor-pointer">隐私政策</span>
              </p>

              {/* 登录链接 */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">已有账号？</span>{" "}
                <Link href="/login">
                  <span className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer">
                    立即登录 →
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
