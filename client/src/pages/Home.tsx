import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Calendar, Package, Video, Users, Globe } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Calendar,
      title: "在线研讨会",
      description: "举办和参加专业的 B2B 在线研讨会，与行业专家实时互动交流",
    },
    {
      icon: Building2,
      title: "工厂对接",
      description: "浏览全球优质工厂信息，查看认证资质和用户评价",
    },
    {
      icon: Package,
      title: "产品展示",
      description: "发现海量优质产品，支持智能搜索和精准筛选",
    },
    {
      icon: Video,
      title: "视频会议",
      description: "集成 Agora 实时音视频，支持屏幕共享和多人会议",
    },
    {
      icon: Users,
      title: "参会者管理",
      description: "便捷的参会者邀请和管理系统，实时跟踪参会状态",
    },
    {
      icon: Globe,
      title: "全球连接",
      description: "连接全球买家和工厂，打破地域限制，促进商务合作",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl font-bold tracking-tight">
              连接全球买家与工厂的
              <span className="text-primary"> B2B 采购协作平台</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              通过在线研讨会、实时视频会议和智能产品匹配，让采购变得更简单、更高效
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              {isAuthenticated ? (
                <>
                  <Button size="lg" asChild>
                    <Link href="/webinars">
                      <a>浏览研讨会</a>
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/factories">
                      <a>发现工厂</a>
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/register">
                      <a>免费注册</a>
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">
                      <a>立即登录</a>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">平台核心功能</h2>
            <p className="text-lg text-muted-foreground">
              为 B2B 采购提供全方位的协作工具和服务
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">准备好开始了吗？</h2>
            <p className="text-lg opacity-90">
              立即注册 RealSourcing，开启高效的 B2B 采购协作之旅
            </p>
            <div className="pt-4">
              {!isAuthenticated && (
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/register">
                    <a>免费注册账户</a>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-t">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <div className="text-muted-foreground">注册工厂</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">5000+</div>
              <div className="text-muted-foreground">优质产品</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">在线研讨会</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10000+</div>
              <div className="text-muted-foreground">活跃用户</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
