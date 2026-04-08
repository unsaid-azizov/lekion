"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/components/providers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PendingApprovalPage() {
  const t = useTranslations("pending");
  const { user, refetch } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.status === "approved") {
      router.push("/");
      return;
    }
    if (!user.bio || !user.profession || !user.city) {
      router.push("/onboarding");
      return;
    }
    const interval = setInterval(async () => {
      await refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, refetch, router]);

  if (!user) return null;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">{t("message")}</p>
          <Button variant="outline" className="w-full" onClick={() => router.push("/profile")}>
            {t("viewProfile")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
