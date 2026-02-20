import { createContext, useContext, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface User {
  id: number;
  name: string | null;
  email: string | null;
  role: "buyer" | "factory" | "user" | "admin";
  company?: string | null;
  phone?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
