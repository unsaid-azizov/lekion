"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { useAuthContext } from "@/components/providers";
import { uploadsUrl } from "@/lib/utils";
import { AuthButtons } from "@/components/auth/auth-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { detectPlatform, PlatformIcon } from "@/lib/platforms";
import type { User, Business, Project, UserLink as UserLinkType } from "@/types";

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const router = useRouter();
  const { user: authUser, loading: authLoading } = useAuthContext();
  const [user, setUser] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [authRequired, setAuthRequired] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!authUser) {
      setAuthRequired(true);
      return;
    }
    api<User>(`/users/${id}`).then(setUser).catch(() => {});
    api<{ items: Business[] }>(`/businesses?owner_id=${id}`)
      .then((data) => setBusinesses(data.items || []))
      .catch(() => {});
  }, [id, authUser, authLoading]);

  if (authRequired) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <div className="text-center px-4 max-w-sm">
          <h2 className="text-xl font-semibold mb-2">{t("auth.loginRequired")}</h2>
          <p className="text-muted-foreground text-sm mb-6">{t("auth.loginRequiredMessage")}</p>
          <AuthButtons />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const extUrl = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`);

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Header card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <div className="px-5 sm:px-7 pb-6 -mt-10">
          <div className="flex items-end gap-4 mb-5">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-2xl ring-2 ring-primary/30 after:rounded-2xl shadow-lg">
              <AvatarImage src={uploadsUrl(user.photo_path)} className="rounded-2xl" />
              <AvatarFallback className="rounded-2xl text-xl sm:text-2xl bg-gradient-to-br from-primary/30 to-primary/10 text-primary font-bold">
                {user.first_name[0]}{user.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{user.first_name} {user.last_name}</h1>
              {user.city && (
                <span className="text-xs text-primary/80 flex items-center gap-1.5 mt-1.5 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  {user.city}{user.country ? `, ${user.country}` : ""}
                </span>
              )}
            </div>
          </div>

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
              {user.links.map((link) => {
                const platform = detectPlatform(link.url);
                return (
                  <a
                    key={link.id}
                    href={extUrl(link.url)}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                  >
                    <PlatformIcon platform={platform} size={12} />
                    {link.title}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Links */}
      {user.links && user.links.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-5 w-0.5 rounded-full bg-primary" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Ссылки</h2>
          </div>
          <div className="space-y-2">
            {user.links.map((link) => {
              const platform = detectPlatform(link.url);
              return (
                <a
                  key={link.id}
                  href={extUrl(link.url)}
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 hover:border-primary/30 transition-colors"
                >
                  <div className="h-8 w-8 rounded-md bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                    <PlatformIcon platform={platform} size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{link.title}</p>
                    <p className="text-[11px] text-primary/60 truncate">
                      {link.url.replace(/^https?:\/\//, "")}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Projects */}
      {user.projects && user.projects.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-5 w-0.5 rounded-full bg-primary" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Проекты</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {user.projects.map((project) => (
              <div key={project.id} className="group rounded-xl border border-border bg-muted/30 p-4 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(201,168,124,0.08)] transition-all duration-300">
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Businesses */}
      {businesses.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="h-5 w-0.5 rounded-full bg-primary" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Бизнес</h2>
          </div>
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
        </div>
      )}
    </div>
  );
}
