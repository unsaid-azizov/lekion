"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/api";
import { useAuthContext } from "@/components/providers";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { refetch } = useAuthContext();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    setToken(token);
    refetch().then(() => router.replace("/"));
  }, [params, router, refetch]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <p className="text-muted-foreground">Выполняется вход...</p>
    </div>
  );
}
