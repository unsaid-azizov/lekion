"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { BusinessForm } from "@/components/business/business-form";
import { toast } from "sonner";
import { useAuthContext } from "@/components/providers";
import type { Business } from "@/types";

export default function EditBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("business");
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<Business>(`/businesses/${id}`).then(setBusiness);
  }, [id]);

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      await api(`/businesses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      router.push(`/businesses/${id}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!business) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t("editBusiness")}</h1>
      <BusinessForm initialData={business} onSubmit={handleSubmit} submitting={submitting} />
    </div>
  );
}
