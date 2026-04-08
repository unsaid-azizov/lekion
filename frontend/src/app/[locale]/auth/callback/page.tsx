"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers";
import { toast } from "sonner";
import type { User } from "@/types";

function getRedirectPath(user: User): string {
  if (user.status === "approved") return "/";
  if (!user.bio || !user.profession || !user.city) return "/onboarding";
  return "/pending-approval";
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const { googleLogin } = useAuthContext();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get("id_token");

    if (idToken) {
      googleLogin(idToken)
        .then((user) => router.push(getRedirectPath(user)))
        .catch((err: any) => {
          toast.error(err.message);
          router.push("/auth/login");
        });
    } else {
      router.push("/auth/login");
    }
  }, [googleLogin, router]);

  return null;
}
