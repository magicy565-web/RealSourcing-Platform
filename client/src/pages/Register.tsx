import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, User, Check, Building2, ArrowRight, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const BG = "linear-gradient(160deg, #050310 0%, #080820 50%, #050310 100%)";
const GRID_BG = `
  linear-gradient(rgba(124, 58, 237, 0.04) 1px, transparent 1px),
  linear-gradient(90deg, rgba(124, 58, 237, 0.04) 1px, transparent 1px)
`;

const CATEGORIES = [
  "Consumer Electronics", "Textiles", "Toys", "Home & Garden",
  "Sports & Outdoors", "Health & Beauty", "Automotive", "Industrial",
];

function InputField({
  icon: Icon, label, id, type = "text", placeholder, value, onChange, required, rightElement
}: {
  icon: any; label: string; id: string; type?: string; placeholder: string;
  value: string; onChange: (v: string) => void; required?: boolean; rightElement?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium block" style={{ color: "rgba(255,255,255,0.60)" }}>
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.25)" }} />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 h-11 rounded-xl text-sm text-white placeholder:text-white/20 outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.09)",
            paddingRight: rightElement ? "2.5rem" : undefined,
          }}
          onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.55)"}
          onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.09)"}
          required={required}
        />
        {rightElement && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </div>
  );
}

export default function Register() {
  const [, setLocation] = useLocation();
  const [role, setRole] = useState<"buyer" | "factory">("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const utils = trpc.useUtils();
  const [formData, setFormData] = useState({ email: "", password: "", company: "" });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      toast.success("Account created! Welcome to RealSourcing");
      await utils.auth.me.invalidate();
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
    if (!agreed) { toast.error("Please agree to the Terms & Privacy Policy"); return; }
    if (formData.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    registerMutation.mutate({
      name: formData.company || formData.email.split("@")[0],
      email: formData.email,
      password: formData.password,
      role,
    });
  };

  const displayedCategories = showMoreCategories ? CATEGORIES : CATEGORIES.slice(0, 4);

  return (
    <div className="min-h-screen flex" style={{ background: BG }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: GRID_BG, backgroundSize: "40px 40px" }} />

      {/* ── 左侧品牌区 ── */}
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 70%)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-px"
          style={{ background: "linear-gradient(180deg, transparent, rgba(124,58,237,0.25), transparent)" }} />

        <div className="relative z-10 flex flex-col justify-between px-14 py-14 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <span className="text-white font-black text-sm">RS</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">RealSourcing</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
              style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.25)" }}>
              <Sparkles className="w-3 h-3 text-violet-400" />
              <span className="text-violet-300 text-xs font-semibold">免费开始，无需信用卡</span>
            </div>
            <h2 className="text-4xl font-black text-white mb-4 leading-tight">
              加入 RealSourcing<br />
              <span style={{
                background: "linear-gradient(135deg, #a78bfa, #818cf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                开启智能采购
              </span>
            </h2>
            <div className="space-y-4 mb-10">
              {[
                { icon: "🏭", text: "连接 500+ 认证工厂，严格审核，品质保障" },
                { icon: "🤖", text: "AI 智能匹配，精准推荐最适合的供应商" },
                { icon: "🎥", text: "1:1 视频会议，实时查看产品和生产线" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="flex items-center gap-8">
            {[
              { value: "500+", label: "认证工厂", accent: "#a78bfa" },
              { value: "2000+", label: "全球买家", accent: "#67e8f9" },
              { value: "98%", label: "满意度", accent: "#4ade80" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-black mb-0.5" style={{ color: stat.accent }}>{stat.value}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 右侧表单区 ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <span className="text-white font-black text-xs">RS</span>
            </div>
            <span className="font-bold text-white">RealSourcing</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">创建账号</h1>
            <p style={{ color: "rgba(255,255,255,0.40)" }}>连接全球工厂，开启智能采购</p>
          </div>

          <div className="rounded-2xl p-8"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            }}
          >
            {/* 角色选择 */}
            <div className="mb-6">
              <label className="text-sm font-medium block mb-2" style={{ color: "rgba(255,255,255,0.60)" }}>我是...</label>
              <div className="grid grid-cols-2 gap-3">
                {(["buyer", "factory"] as const).map((r) => (
                  <motion.button
                    key={r}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setRole(r)}
                    className="relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all"
                    style={role === r ? {
                      background: "rgba(124,58,237,0.15)",
                      border: "1px solid rgba(124,58,237,0.50)",
                      color: "#c4b5fd",
                    } : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      color: "rgba(255,255,255,0.40)",
                    }}
                  >
                    {role === r && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: "#7c3aed" }}>
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                    {r === "buyer" ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    {r === "buyer" ? "采购商" : "工厂"}
                  </motion.button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                icon={Mail} label="企业邮箱" id="email" type="email"
                placeholder="your@company.com" value={formData.email}
                onChange={(v) => setFormData({ ...formData, email: v })} required
              />
              <InputField
                icon={Building2} label="公司名称" id="company" type="text"
                placeholder="Your Company Inc." value={formData.company}
                onChange={(v) => setFormData({ ...formData, company: v })} required
              />
              <InputField
                icon={Lock} label="密码" id="password"
                type={showPassword ? "text" : "password"}
                placeholder="至少 6 位字符" value={formData.password}
                onChange={(v) => setFormData({ ...formData, password: v })} required
                rightElement={
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ color: "rgba(255,255,255,0.30)" }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* 兴趣分类 */}
              <div className="space-y-2">
                <label className="text-sm font-medium block" style={{ color: "rgba(255,255,255,0.60)" }}>感兴趣的品类</label>
                <div className="flex flex-wrap gap-2">
                  {displayedCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={selectedCategories.includes(cat) ? {
                        background: "rgba(124,58,237,0.15)",
                        border: "1px solid rgba(124,58,237,0.45)",
                        color: "#c4b5fd",
                      } : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        color: "rgba(255,255,255,0.40)",
                      }}
                    >
                      {selectedCategories.includes(cat) && <Check className="w-3 h-3 inline mr-1" />}
                      {cat}
                    </button>
                  ))}
                  {!showMoreCategories && (
                    <button
                      type="button"
                      onClick={() => setShowMoreCategories(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        color: "rgba(255,255,255,0.30)",
                      }}
                    >
                      + 更多
                    </button>
                  )}
                </div>
              </div>

              {/* 同意条款 */}
              <div className="flex items-start gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAgreed(!agreed)}
                  className="mt-0.5 w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                  style={agreed ? {
                    background: "#7c3aed",
                    border: "1px solid #7c3aed",
                  } : {
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.20)",
                  }}
                >
                  {agreed && <Check className="w-2.5 h-2.5 text-white" />}
                </button>
                <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                  我同意{" "}
                  <span className="cursor-pointer" style={{ color: "#a78bfa" }}>服务条款</span>
                  {" 和 "}
                  <span className="cursor-pointer" style={{ color: "#a78bfa" }}>隐私政策</span>
                </span>
              </div>

              {/* 注册按钮 */}
              <motion.button
                type="submit"
                disabled={registerMutation.isPending}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full h-11 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 mt-2"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                  opacity: registerMutation.isPending ? 0.7 : 1,
                }}
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    创建中...
                  </span>
                ) : (
                  <><span>免费创建账号</span> <ArrowRight className="w-4 h-4" /></>
                )}
              </motion.button>

              <p className="text-center text-sm pt-1" style={{ color: "rgba(255,255,255,0.30)" }}>
                已有账号？{" "}
                <Link href="/login">
                  <span className="font-semibold cursor-pointer" style={{ color: "#a78bfa" }}>立即登录</span>
                </Link>
              </p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
