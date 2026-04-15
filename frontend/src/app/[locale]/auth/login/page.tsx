"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/components/providers";
import { AuthButtons } from "@/components/auth/auth-buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { user } = useAuthContext();

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
      <Card className="w-full max-w-sm border-border/50">
        <CardHeader className="text-center pb-2">
          <p className="text-3xl font-bold tracking-tight mb-1">LEKION</p>
          <CardTitle className="text-sm font-normal text-muted-foreground">
            {t("loginSubtitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6 pt-4">
          <AuthButtons />
        </CardContent>
        <div className="border-t border-border/50 px-6 py-3 flex justify-center gap-4">
          <Link href="/terms" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
            Пользовательское соглашение
          </Link>
          <Link href="/privacy" className="text-[11px] text-muted-foreground hover:text-primary transition-colors">
            Политика конфиденциальности
          </Link>
        </div>
      </Card>
    </div>
  );
}
