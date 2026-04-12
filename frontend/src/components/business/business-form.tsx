"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressInput, reverseGeocode, type AddressData } from "@/components/ui/address-input";
import type { Business, Category } from "@/types";

// Fix Leaflet default marker icon (broken by bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface Props {
  initialData?: Business;
  onSubmit: (data: any) => void;
  submitting: boolean;
}

export function BusinessForm({ initialData, onSubmit, submitting }: Props) {
  const t = useTranslations("business");
  const [categories, setCategories] = useState<Category[]>([]);
  const [addressDisplay, setAddressDisplay] = useState(initialData?.address || "");

  const [form, setForm] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category_id: initialData?.category?.id || "",
    tags: initialData?.tags.join(", ") || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    country: initialData?.country || "",
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
    phone: initialData?.phone || "",
    website: initialData?.website || "",
    email: initialData?.email || "",
    telegram: initialData?.telegram || "",
    whatsapp: initialData?.whatsapp || "",
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    api<Category[]>("/categories").then(setCategories).catch(() => {
      toast.error("Не удалось загрузить категории. Войдите в аккаунт и попробуйте снова.");
    });
  }, []);

  const setMarker = useCallback((lat: number, lng: number) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
    }
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const center: L.LatLngExpression = form.latitude && form.longitude
      ? [form.latitude, form.longitude]
      : [42.0, 47.5];
    const zoom = form.latitude ? 14 : 8;

    const map = L.map(mapContainerRef.current, { attributionControl: false }).setView(center, zoom);
    const isDark = document.documentElement.classList.contains("dark");
    L.tileLayer(isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    if (form.latitude && form.longitude) {
      markerRef.current = L.marker(center, { draggable: true }).addTo(map);
    }

    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      setMarker(lat, lng);
      reverseGeocode(lat, lng).then((data) => {
        if (!data) return;
        setForm((prev) => ({
          ...prev,
          address: data.address,
          city: data.city,
          country: data.country,
        }));
        setAddressDisplay(data.display_name || data.address);
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const handleAddressChange = useCallback((data: AddressData) => {
    setForm((prev) => ({
      ...prev,
      address: data.address,
      city: data.city,
      country: data.country,
      latitude: data.latitude ?? prev.latitude,
      longitude: data.longitude ?? prev.longitude,
    }));
    if (data.display_name) setAddressDisplay(data.display_name);
    if (data.latitude && data.longitude) {
      setMarker(data.latitude, data.longitude);
      mapInstanceRef.current?.setView([data.latitude, data.longitude], 16);
    }
  }, [setMarker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error("Добавьте описание бизнеса");
      return;
    }
    if (!form.category_id) {
      toast.error("Выберите категорию");
      return;
    }
    const hasContact = form.phone.trim() || form.telegram.trim() || form.whatsapp.trim() || form.website.trim() || form.email.trim();
    if (!hasContact) {
      toast.error("Укажите хотя бы один способ связи: телефон, Telegram, WhatsApp, сайт или email");
      return;
    }
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({
      ...form,
      tags,
      category_id: form.category_id || null,
    });
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>{t("name")}</Label>
        <Input required value={form.name} onChange={update("name")} placeholder="Hermes Operations" />
      </div>
      <div className="space-y-2">
        <Label>{t("description")} *</Label>
        <Textarea value={form.description} onChange={update("description")} placeholder="Внедрение ИИ в бизнес-процессы, автоматизация, CRM-интеграции" />
      </div>
      <div className="space-y-2">
        <Label>{t("category")} *</Label>
        <Select value={form.category_id} onValueChange={(v) => setForm((prev) => ({ ...prev, category_id: v ?? "" }))}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите категорию">
              {(value: string) => {
                const cat = categories.find((c) => c.id === value);
                return cat ? cat.name_ru : "Выберите категорию";
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name_ru}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("tags")}</Label>
        <Input placeholder="ИИ, автоматизация, CRM, разработка" value={form.tags} onChange={update("tags")} />
      </div>

      <div className="space-y-2">
        <Label>{t("address")}</Label>
        <AddressInput value={addressDisplay} onChange={handleAddressChange} required />
      </div>

      <div className="space-y-2">
        <Label>{t("clickMapToSetLocation")}</Label>
        <div ref={mapContainerRef} className="w-full h-64 rounded-lg border" />
        {form.latitude !== 0 && (
          <p className="text-xs text-muted-foreground">
            {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">* Укажите хотя бы один способ связи</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={form.phone} onChange={update("phone")} placeholder="+7 999 123-45-67" />
        </div>
        <div className="space-y-2">
          <Label>Website</Label>
          <Input value={form.website} onChange={update("website")} placeholder="hermesops.com" />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={form.email} onChange={update("email")} placeholder="info@hermesops.com" />
        </div>
        <div className="space-y-2">
          <Label>Telegram</Label>
          <Input value={form.telegram} onChange={update("telegram")} placeholder="@hermesops" />
        </div>
        <div className="space-y-2">
          <Label>WhatsApp</Label>
          <Input value={form.whatsapp} onChange={update("whatsapp")} placeholder="+7 999 123-45-67" />
        </div>
      </div>

      <Button type="submit" disabled={submitting || form.latitude === 0}>
        {t("addBusiness")}
      </Button>
    </form>
  );
}
