"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/components/providers";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { uploadsUrl } from "@/lib/utils";
import { AddressInput, type AddressData } from "@/components/ui/address-input";
import type { User } from "@/types";

export default function OnboardingPage() {
  const t = useTranslations();
  const router = useRouter();
  const { user, refetch } = useAuthContext();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    profession: "",
    bio: "",
    city: "",
    country: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    if (user.status === "approved") {
      router.push("/");
      return;
    }
    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      profession: user.profession || "",
      bio: user.bio || "",
      city: user.city || "",
      country: user.country || "",
    });
  }, [user, router]);

  if (!user) return null;

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await api<User>("/users/me/photo", { method: "POST", body: fd });
      await refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error(t("onboarding.nameRequired"));
      return;
    }
    if (!form.profession.trim()) {
      toast.error(t("onboarding.professionRequired"));
      return;
    }
    if (!form.bio.trim()) {
      toast.error(t("onboarding.bioRequired"));
      return;
    }
    if (!form.city.trim()) {
      toast.error(t("onboarding.cityRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await api<User>("/users/me", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      await refetch();
      router.push("/pending-approval");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
      <Card className="w-full max-w-lg border-border/50">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">{t("onboarding.title")}</CardTitle>
          <CardDescription>{t("onboarding.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3">
            <Avatar
              className="h-20 w-20 ring-2 ring-primary/20 cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              <AvatarImage src={uploadsUrl(user.photo_path)} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => fileRef.current?.click()}
              disabled={photoUploading}
            >
              {photoUploading ? t("common.loading") : t("profile.uploadPhoto")}
            </Button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("auth.firstName")} *</Label>
              <Input value={form.first_name} onChange={update("first_name")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("auth.lastName")} *</Label>
              <Input value={form.last_name} onChange={update("last_name")} />
            </div>
          </div>

          {/* Profession */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("profile.profession")} *</Label>
            <Input
              value={form.profession}
              onChange={update("profession")}
              placeholder={t("onboarding.professionPlaceholder")}
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("profile.bio")} *</Label>
            <Textarea
              value={form.bio}
              onChange={update("bio")}
              rows={4}
              placeholder={t("onboarding.bioPlaceholder")}
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("profile.city")} *</Label>
            <AddressInput
              value={[form.city, form.country].filter(Boolean).join(", ")}
              onChange={(data: AddressData) => setForm((prev) => ({ ...prev, city: data.city, country: data.country }))}
              placeholder={t("onboarding.cityPlaceholder")}
            />
          </div>

          <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t("common.loading") : t("onboarding.submit")}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            {t("onboarding.note")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
