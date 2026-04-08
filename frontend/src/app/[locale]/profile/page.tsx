"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/components/providers";
import { api } from "@/lib/api";
import { uploadsUrl } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { AddressInput, type AddressData } from "@/components/ui/address-input";
import type { User, Business, Project, UserLink as UserLinkType } from "@/types";
import { detectPlatform, PlatformIcon, type Platform } from "@/lib/platforms";

export default function ProfilePage() {
  const t = useTranslations();
  const { user, refetch } = useAuthContext();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<User>>({});

  if (!user) return null;

  const startEdit = () => {
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      profession: user.profession || "",
      bio: user.bio || "",
      city: user.city || "",
      country: user.country || "",
      latitude: user.latitude,
      longitude: user.longitude,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    await api("/users/me", { method: "PUT", body: JSON.stringify(form) });
    await refetch();
    setEditing(false);
    toast.success("Сохранено");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api("/users/me/photo", { method: "POST", body: formData });
      await refetch();
    } catch {
      toast.error("Не удалось загрузить фото");
    }
  };

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const extUrl = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Header card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <div className="px-5 sm:px-7 pb-6 -mt-10">
          <div className="flex items-end gap-4 mb-5">
            <label className="cursor-pointer group relative">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl ring-2 ring-primary/30 after:rounded-2xl group-hover:ring-primary/60 transition-all shadow-lg">
                <AvatarImage src={uploadsUrl(user.photo_path)} className="rounded-2xl" />
                <AvatarFallback className="rounded-2xl text-xl sm:text-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold">
                  {user.first_name[0]}{user.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{user.first_name} {user.last_name}</h1>
              {user.city && (
                <span className="text-xs text-primary/80 flex items-center gap-1.5 mt-1.5 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  {user.city}{user.country ? `, ${user.country}` : ""}
                </span>
              )}
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={startEdit} className="shrink-0 text-xs">
                {t("profile.editProfile")}
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-4 border-t border-border pt-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("auth.firstName")}</Label>
                  <Input value={form.first_name} onChange={update("first_name")} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{t("auth.lastName")}</Label>
                  <Input value={form.last_name} onChange={update("last_name")} className="h-9 text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("profile.profession")}</Label>
                <Input value={form.profession} onChange={update("profession")} className="h-9 text-sm" placeholder="SEO, дизайн, маркетинг" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("profile.bio")}</Label>
                <Textarea value={form.bio as string} onChange={update("bio")} className="text-sm min-h-[80px]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("profile.city")}</Label>
                <AddressInput
                  value={[form.city, form.country].filter(Boolean).join(", ")}
                  onChange={(data: AddressData) => setForm((prev) => ({ ...prev, city: data.city, country: data.country, latitude: data.latitude, longitude: data.longitude }))}
                  placeholder="Москва, Дубай, Берлин..."
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={handleSave}>{t("common.save")}</Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>{t("common.cancel")}</Button>
              </div>
            </div>
          ) : (
            <>
              {user.profession && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {user.profession.split(/[,;/]+/).map((t) => t.trim()).filter(Boolean).map((tag) => (
                    <span key={tag} className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/15 font-medium">{tag}</span>
                  ))}
                </div>
              )}
              {user.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{user.bio}</p>
              )}
              {user.links && user.links.length > 0 && (
                <div className="flex flex-wrap gap-2.5 pt-4 border-t border-border">
                  {user.links.map((link) => (
                    <LinkChip key={link.id} link={link} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Links */}
      <LinksSection links={user.links} onChanged={refetch} />

      {/* Projects */}
      <ProjectsSection projects={user.projects} onChanged={refetch} />

      {/* Businesses */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-5 w-0.5 rounded-full bg-primary" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{t("profile.myBusinesses")}</h2>
          </div>
          <Link href="/businesses/new" className={buttonVariants({ variant: "outline", size: "sm" }) + " h-7 text-xs"}>
            + {t("business.addBusiness")}
          </Link>
        </div>
        <BusinessList userId={user.id} />
      </div>
    </div>
  );
}

/* ─── Link Chip (display in header) ─── */

function LinkChip({ link }: { link: UserLinkType }) {
  const extUrl = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`);
  const platform = detectPlatform(link.url);

  return (
    <a
      href={extUrl(link.url)}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
    >
      <PlatformIcon platform={platform} size={12} />
      {link.title}
    </a>
  );
}

/* ─── Link Item (editable list) ─── */

function LinkItem({ link, onChanged }: { link: UserLinkType; onChanged: () => void }) {
  const extUrl = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`);
  const platform = detectPlatform(link.url);

  const handleDelete = async () => {
    await api(`/users/me/links/${link.id}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 hover:border-primary/30 transition-colors">
      <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
        <PlatformIcon platform={platform} size={16} className="text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{link.title}</p>
        <a href={extUrl(link.url)} target="_blank" rel="noopener" className="text-[11px] text-primary/60 hover:text-primary transition-colors truncate block">
          {link.url.replace(/^https?:\/\//, "")}
        </a>
      </div>
      <button onClick={handleDelete} className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md hover:bg-muted shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}

/* ─── Links Section ─── */

function LinksSection({ links, onChanged }: { links: UserLinkType[]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);
    if (!title || title === autoTitle(url)) {
      setTitle(autoTitle(val));
    }
  };

  const handleAdd = async () => {
    if (!url.trim()) return;
    const finalTitle = title.trim() || autoTitle(url) || url;
    await api("/users/me/links", {
      method: "POST",
      body: JSON.stringify({ title: finalTitle, url: url.trim() }),
    });
    setTitle("");
    setUrl("");
    setAdding(false);
    onChanged();
  };

  const platform = detectPlatform(url);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-5 w-0.5 rounded-full bg-primary" />
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Ссылки</h2>
        </div>
        {!adding && (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAdding(true)}>
            + Добавить
          </Button>
        )}
      </div>

      {adding && (
        <div className="border border-border rounded-xl p-4 space-y-3 mb-4 bg-muted/30">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Ссылка</Label>
            <div className="relative">
              {platform !== "other" && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <PlatformIcon platform={platform} size={14} className="text-primary" />
                </div>
              )}
              <Input
                placeholder="https://t.me/username"
                value={url}
                onChange={handleUrlChange}
                className={`h-9 text-sm ${platform !== "other" ? "pl-9" : ""}`}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Название</Label>
            <Input placeholder="Telegram" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleAdd}>Добавить</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setAdding(false); setTitle(""); setUrl(""); }}>Отмена</Button>
          </div>
        </div>
      )}

      {links && links.length > 0 ? (
        <div className="space-y-2">
          {links.map((link) => (
            <LinkItem key={link.id} link={link} onChanged={onChanged} />
          ))}
        </div>
      ) : !adding ? (
        <div className="text-center py-8 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">Добавьте ссылки на соцсети, сайт, портфолио</p>
        </div>
      ) : null}
    </div>
  );
}

function autoTitle(url: string): string {
  const platform = detectPlatform(url);
  const names: Record<Platform, string> = {
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    instagram: "Instagram",
    github: "GitHub",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    twitter: "X (Twitter)",
    facebook: "Facebook",
    tiktok: "TikTok",
    behance: "Behance",
    dribbble: "Dribbble",
    website: "Сайт",
    other: "",
  };
  return names[platform];
}

/* ─── Projects Section ─── */

function ProjectsSection({ projects, onChanged }: { projects: Project[]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");

  const handleAdd = async () => {
    if (!title.trim()) return;
    await api("/users/me/projects", {
      method: "POST",
      body: JSON.stringify({ title, description: description || null, url: url || null }),
    });
    setTitle("");
    setDescription("");
    setUrl("");
    setAdding(false);
    onChanged();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-5 w-0.5 rounded-full bg-primary" />
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Проекты</h2>
        </div>
        {!adding && (
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setAdding(true)}>
            + Добавить
          </Button>
        )}
      </div>

      {adding && (
        <div className="border border-border rounded-xl p-4 space-y-3 mb-4 bg-muted/30">
          <Input placeholder="Название проекта" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-sm" />
          <Input placeholder="Описание (необязательно)" value={description} onChange={(e) => setDescription(e.target.value)} className="h-9 text-sm" />
          <Input placeholder="Ссылка (необязательно)" value={url} onChange={(e) => setUrl(e.target.value)} className="h-9 text-sm" />
          <div className="flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleAdd}>Добавить</Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAdding(false)}>Отмена</Button>
          </div>
        </div>
      )}

      {projects && projects.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onChanged={onChanged} editable />
          ))}
        </div>
      ) : !adding ? (
        <div className="text-center py-8 border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">Добавьте свои проекты, портфолио</p>
        </div>
      ) : null}
    </div>
  );
}

/* ─── Project Card ─── */

function ProjectCard({ project, onChanged, editable }: { project: Project; onChanged?: () => void; editable?: boolean }) {
  const extUrl = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`);

  const handleDelete = async () => {
    await api(`/users/me/projects/${project.id}`, { method: "DELETE" });
    onChanged?.();
  };

  return (
    <div className="group relative rounded-xl border border-border bg-muted/30 p-4 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(201,168,124,0.08)] transition-all duration-300">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm leading-tight">{project.title}</h3>
          {project.description && (
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">{project.description}</p>
          )}
        </div>
      </div>

      {project.url && (
        <a href={extUrl(project.url)} target="_blank" rel="noopener" className="mt-3 flex items-center gap-1.5 text-[11px] text-primary/60 hover:text-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          {project.url.replace(/^https?:\/\//, "")}
        </a>
      )}

      {editable && (
        <button onClick={handleDelete} className="absolute top-3 right-3 text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md hover:bg-muted">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  );
}

/* ─── Business List ─── */

function BusinessList({ userId }: { userId: string }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    api<{ items: Business[] }>(`/businesses?owner_id=${userId}`)
      .then((data) => setBusinesses(data.items || []))
      .catch(() => {})
      .finally(() => setLoaded(true));
    return null;
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-8 border border-dashed border-border rounded-xl">
        <p className="text-sm text-muted-foreground">Пока нет добавленных бизнесов</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {businesses.map((biz) => (
        <Link key={biz.id} href={`/businesses/${biz.id}`} className="group rounded-xl border border-border bg-muted/30 p-4 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(201,168,124,0.08)] transition-all duration-300 block">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm">{biz.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{biz.address}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
