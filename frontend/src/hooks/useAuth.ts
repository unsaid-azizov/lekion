"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getToken, setToken } from "@/lib/api";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api<User>("/users/me");
      setUser(data);
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const googleLogin = async (credential: string, referralCode?: string) => {
    const data = await api<{ access_token: string }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential, referral_code: referralCode || null }),
    });
    setToken(data.access_token);
    await fetchUser();
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return { user, loading, googleLogin, logout, refetch: fetchUser };
}
