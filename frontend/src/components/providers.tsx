"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, createContext, useContext, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  googleLogin: (credential: string, referralCode?: string) => Promise<User>;
  logout: () => void;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function useAuthContext() {
  return useContext(AuthContext);
}

const AUTH_PATHS = ["/auth/", "/onboarding", "/pending-approval"];

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useContext(AuthContext);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handler = () => {
      toast.error("Вы не авторизованы. Войдите в аккаунт.");
      router.push("/auth/login");
    };
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, [router]);

  useEffect(() => {
    if (loading || !user) return;
    const isAuthPath = AUTH_PATHS.some((p) => pathname.includes(p));
    if (isAuthPath) return;

    if (user.status === "pending") {
      const profileComplete = user.bio && user.profession && user.city && (user.phone || user.telegram);
      if (!profileComplete) {
        router.replace("/onboarding");
      } else {
        router.replace("/pending-approval");
      }
    }
  }, [user, loading, pathname, router]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const auth = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={auth}>
        <RouteGuard>{children}</RouteGuard>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}
