"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthContext } from "@/components/providers";
import { toast } from "sonner";

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "";

export function AuthButtons() {
  const { telegramLogin } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const tgContainerRef = useRef<HTMLDivElement>(null);

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

  if (!TELEGRAM_BOT_USERNAME) return null;

  return (
    <div className="w-full max-w-xs mx-auto">
      <div ref={tgContainerRef} className="flex justify-center" />
    </div>
  );
}
