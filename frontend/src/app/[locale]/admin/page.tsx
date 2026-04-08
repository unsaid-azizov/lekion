"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Stats {
  users: Record<string, number>;
  businesses: number;
  reviews: number;
}

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api<Stats>("/admin/stats").then(setStats);
  }, []);

  if (!stats) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard")}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(stats.users).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold">{count}</p>
              <p className="text-sm text-muted-foreground capitalize">{status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">{stats.businesses}</p>
            <p className="text-sm text-muted-foreground">Businesses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-3xl font-bold">{stats.reviews}</p>
            <p className="text-sm text-muted-foreground">Reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Link href="/admin/pending" className="underline">{t("pendingUsers")}</Link>
        <Link href="/admin/users" className="underline">{t("allUsers")}</Link>
      </div>
    </div>
  );
}
