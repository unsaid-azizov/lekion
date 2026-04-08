"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { ReferralInfo } from "@/types";

export default function ReferralsPage() {
  const t = useTranslations("referral");
  const [info, setInfo] = useState<ReferralInfo | null>(null);

  useEffect(() => {
    api<ReferralInfo>("/users/me/referral").then(setInfo);
  }, []);

  if (!info) return null;

  const link = `${window.location.origin}/auth/register/${info.referral_code}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success(t("copied"));
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("myReferrals")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("referralLink")}</p>
            <div className="flex gap-2">
              <Input value={link} readOnly />
              <Button onClick={copy}>{t("copyLink")}</Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("invitesRemaining")}: {info.invites_remaining}/3
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
