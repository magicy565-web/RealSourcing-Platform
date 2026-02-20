import { ReactNode } from "react";
import { useLocation, Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: "buyer" | "factory" | "user" | "admin";
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  // 显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F0F23] via-[#1A1A2E] to-[#16213E]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录，重定向到登录页
  if (!isAuthenticated) {
    // 保存原始路径，登录后返回
    const returnPath = encodeURIComponent(location);
    return <Redirect to={`/login?returnTo=${returnPath}`} />;
  }

  // 检查角色权限
  if (requiredRole && user?.role !== requiredRole) {
    // 角色不匹配，重定向到对应的 Dashboard
    if (user?.role === "factory") {
      return <Redirect to="/factory-dashboard" />;
    }
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}
