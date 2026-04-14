"use client";

import { useEffect } from "react";
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
        <CardContent className="pb-8 pt-4">
          <AuthButtons />
        </CardContent>
      </Card>
    </div>
  );
}
