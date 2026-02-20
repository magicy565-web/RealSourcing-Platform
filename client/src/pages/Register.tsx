import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Mail, Lock, Eye, EyeOff, User, Check } from "lucide-react";
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

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    company: "",
  });

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
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center px-16 py-12">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-white">RealSourcing</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 leading-tight text-white">
            Join RealSourcing
            <br />
            <span className="text-purple-400">Start Smart Sourcing</span>
          </h1>
          <div className="space-y-5 mb-12">
            {[
              { icon: "🏭", text: "Connect with 500+ verified factories, all rigorously certified" },
              { icon: "🤖", text: "AI-powered matching to find the best suppliers for your needs" },
              { icon: "🎥", text: "1:1 video meetings to inspect products and production lines" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-white/80 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { num: "500+", label: "Verified Factories" },
              { num: "2000+", label: "Global Buyers" },
              { num: "98%", label: "Satisfaction Rate" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-purple-400">{stat.num}</div>
                <div className="text-sm text-white/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧注册表单 */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">RealSourcing</span>
          </div>

          <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-1">Join RealSourcing</h2>
              <p className="text-muted-foreground text-sm">Connect with global factories, start smart sourcing</p>
            </div>

            {/* 角色选择 */}
            <div className="mb-5">
              <Label className="text-sm text-muted-foreground mb-2 block">I am a...</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["buyer", "factory"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "relative flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-semibold transition-all duration-200 capitalize",
                      role === r
                        ? "bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/30"
                        : "border-white/20 text-muted-foreground hover:border-purple-500/50 hover:text-white"
                    )}
                  >
                    {role === r && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-purple-600" />
                      </span>
                    )}
                    {r === "buyer" ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                    {r === "buyer" ? "Buyer" : "Factory"}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Company Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@company.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-background/50 border-white/10 focus:border-purple-500 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-sm">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="company"
                    type="text"
                    placeholder="Your Company Inc."
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="pl-10 bg-background/50 border-white/10 focus:border-purple-500 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 bg-background/50 border-white/10 focus:border-purple-500 h-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 兴趣分类 */}
              <div className="space-y-2">
                <Label className="text-sm">Interested Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {displayedCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150",
                        selectedCategories.includes(cat)
                          ? "bg-purple-600/20 border-purple-500 text-purple-300"
                          : "border-white/15 text-muted-foreground hover:border-purple-500/50 hover:text-white"
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
                      className="px-3 py-1.5 rounded-full text-xs font-medium border border-white/15 text-muted-foreground hover:border-purple-500/50 hover:text-white transition-all"
                    >
                      + More
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
                    agreed ? "bg-purple-600 border-purple-600" : "border-white/30"
                  )}
                >
                  {agreed && <Check className="w-2.5 h-2.5 text-white" />}
                </button>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to{" "}
                  <span className="text-purple-400 cursor-pointer hover:underline">Terms of Service</span>
                  {" & "}
                  <span className="text-purple-400 cursor-pointer hover:underline">Privacy Policy</span>
                </span>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 shadow-lg shadow-purple-600/30 transition-all duration-200 mt-2"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  "Create Account — It's Free"
                )}
              </Button>

              <div className="text-center text-sm pt-1">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link href="/login">
                  <span className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer">
                    Log in
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
