"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { BusinessForm } from "@/components/business/business-form";
import { toast } from "sonner";
import type { Business } from "@/types";

export default function NewBusinessPage() {
  const t = useTranslations("business");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const biz = await api<Business>("/businesses", {
        method: "POST",
        body: JSON.stringify(data),
      });
      router.push(`/businesses/${biz.id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t("addBusiness")}</h1>
      <BusinessForm onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
