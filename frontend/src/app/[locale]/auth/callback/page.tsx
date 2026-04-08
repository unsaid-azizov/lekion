"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/providers";
import { toast } from "sonner";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { googleLogin } = useAuthContext();

  useEffect(() => {
    // Google redirect returns id_token in the URL hash fragment
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get("id_token");

    if (idToken) {
      googleLogin(idToken)
        .then(() => router.push("/"))
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
