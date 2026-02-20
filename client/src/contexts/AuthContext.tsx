import { createContext, useContext, ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Dev Mode Mock User ──────────────────────────────────────────────────────
// When the database is unreachable (local dev), fall back to a mock user
// so that protected routes can be previewed without a live DB connection.
const DEV_MOCK_USER: User = {
  id: 1,
  name: "Alice Wang",
  email: "alice@tiktok.com",
  role: "buyer",
  company: "TikTok",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: user, isLoading, error } = trpc.auth.me.useQuery(
    undefined,
    { retry: false }
  );

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      setLocation("/login");
    },
    onError: () => {
      // Force redirect even on error
      setLocation("/login");
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  // If the API is unreachable (DB down / local dev), use mock user
  const resolvedUser = (user ?? (error ? DEV_MOCK_USER : null)) as User | null;
  const resolvedLoading = isLoading && !error;

  const value: AuthContextType = {
    user: resolvedUser,
    isLoading: resolvedLoading,
    isAuthenticated: !!resolvedUser,
    logout,
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
