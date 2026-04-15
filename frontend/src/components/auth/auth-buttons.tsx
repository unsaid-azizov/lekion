"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/components/providers";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { toast } from "sonner";

const YANDEX_CLIENT_ID = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID || "";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

function YandexIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#FC3F1D"/>
      <path d="M13.32 17H15V7h-2.14c-2.34 0-3.57 1.18-3.57 2.95 0 1.5.74 2.32 2.06 3.22L9 17h1.78l2.47-4.2-.74-.48c-1.02-.67-1.46-1.22-1.46-2.27 0-.97.65-1.62 1.8-1.62h.47V17z" fill="white"/>
    </svg>
  );
}

const BTN = "w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed";

export function AuthButtons({ referralCode }: { referralCode?: string }) {
  const t = useTranslations("auth");
  const { googleLogin } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const { prompt: googlePrompt } = useGoogleAuth(async (credential) => {
    setLoading(true);
    try {
      await googleLogin(credential, referralCode);
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  });

  const handleYandex = () => {
    const backendUrl = API_URL.replace("/api/v1", "");
    const url = `${backendUrl}/api/v1/auth/yandex${referralCode ? `?referral_code=${referralCode}` : ""}`;
    window.location.href = url;
  };

  return (
    <div className="space-y-3 w-full max-w-xs mx-auto">
      <button onClick={googlePrompt} disabled={loading || !agreed} className={BTN}>
        <GoogleIcon />
        {loading ? t("loading") : t("continueWithGoogle")}
      </button>
      {YANDEX_CLIENT_ID && (
        <button onClick={handleYandex} disabled={loading || !agreed} className={BTN}>
          <YandexIcon />
          Продолжить с Яндекс
        </button>
      )}
      <label className="flex items-start gap-2 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 shrink-0 accent-primary"
        />
        <span className="text-xs text-muted-foreground leading-relaxed">
          Я принимаю{" "}
          <Link href="/terms" className="text-primary underline underline-offset-2 hover:text-primary/80">
            пользовательское соглашение
          </Link>{" "}
          и{" "}
          <Link href="/privacy" className="text-primary underline underline-offset-2 hover:text-primary/80">
            политику конфиденциальности
          </Link>
        </span>
      </label>
    </div>
  );
}
