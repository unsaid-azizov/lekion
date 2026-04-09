"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/components/providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";

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

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { googleLogin, telegramLogin, user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const tgContainerRef = useRef<HTMLDivElement>(null);

  const handleCredential = useCallback(
    async (response: { credential: string }) => {
      setLoading(true);
      try {
        await googleLogin(response.credential);
      } catch (err: any) {
        toast.error(err.message);
        setLoading(false);
      }
    },
    [googleLogin],
  );

  useEffect(() => {
    if (user) {
      if (user.status === "pending" && (!user.bio || !user.profession || !user.city)) {
        router.push("/onboarding");
      } else if (user.status === "pending") {
        router.push("/pending-approval");
      } else {
        router.push("/");
      }
    }
  }, [user, router]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredential,
      });
      setGsiReady(true);
    };
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [handleCredential]);

  // Telegram Login Widget
  useEffect(() => {
    if (!TELEGRAM_BOT_USERNAME || !tgContainerRef.current) return;

    (window as any).onTelegramAuth = async (tgUser: Record<string, unknown>) => {
      setLoading(true);
      try {
        await telegramLogin(tgUser);
      } catch (err: any) {
        toast.error(err.message);
        setLoading(false);
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", TELEGRAM_BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    tgContainerRef.current.appendChild(script);

    const container = tgContainerRef.current;
    return () => {
      if (container) container.innerHTML = "";
      delete (window as any).onTelegramAuth;
    };
  }, [telegramLogin]);

  const handleClick = () => {
    if (!gsiReady) return;
    window.google?.accounts.id.prompt();
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
      <Card className="w-full max-w-sm border-border/50">
        <CardHeader className="text-center pb-2">
          <p className="text-3xl font-bold tracking-tight mb-1">LEKION</p>
          <CardTitle className="text-sm font-normal text-muted-foreground">
            {t("loginSubtitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-8 pt-4 space-y-3">
          <button
            onClick={handleClick}
            disabled={loading || !gsiReady}
            className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            {loading ? t("loading") : t("continueWithGoogle")}
          </button>
          {TELEGRAM_BOT_USERNAME && (
            <div ref={tgContainerRef} className="flex justify-center" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
