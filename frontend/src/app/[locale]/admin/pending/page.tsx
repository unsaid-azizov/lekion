"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { uploadsUrl } from "@/lib/utils";
import { PlatformIcon, detectPlatform } from "@/lib/platforms";
import type { User } from "@/types";

export default function PendingUsersPage() {
  const t = useTranslations("admin");
  const [users, setUsers] = useState<User[]>([]);

  const fetchPending = () => {
    api<User[]>("/admin/users/pending").then(setUsers);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approve = async (id: string) => {
    await api(`/admin/users/${id}/approve`, { method: "POST" });
    toast.success("Approved");
    fetchPending();
  };

  const reject = async (id: string) => {
    await api(`/admin/users/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason: null }),
    });
    toast.success("Rejected");
    fetchPending();
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t("pendingUsers")}</h1>
      {users.length === 0 && <p className="text-muted-foreground">No pending users</p>}
      {users.map((user) => (
        <Card key={user.id}>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 ring-1 ring-primary/20">
                  <AvatarImage src={uploadsUrl(user.photo_path)} />
                  <AvatarFallback className="text-sm bg-primary/10 text-primary font-semibold">
                    {user.first_name[0]}{user.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-base">{user.first_name} {user.last_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.city && (
                    <p className="text-xs text-muted-foreground">{user.city}{user.country ? `, ${user.country}` : ""}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" onClick={() => approve(user.id)}>{t("approve")}</Button>
                <Button size="sm" variant="destructive" onClick={() => reject(user.id)}>{t("reject")}</Button>
              </div>
            </div>

            {user.profession && (
              <p className="text-sm font-medium text-primary">{user.profession}</p>
            )}

            {user.bio && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">{user.bio}</p>
            )}

            {user.links && user.links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {user.links.map((link) => {
                  const platform = detectPlatform(link.url);
                  return (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <PlatformIcon platform={platform} size={14} />
                      {link.title}
                    </a>
                  );
                })}
              </div>
            )}

            {user.projects && user.projects.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projects</p>
                {user.projects.map((project) => (
                  <div key={project.id} className="text-sm">
                    <span className="font-medium">{project.title}</span>
                    {project.description && <span className="text-muted-foreground"> — {project.description}</span>}
                    {project.url && (
                      <a href={project.url} target="_blank" rel="noopener noreferrer" className="ml-1 text-primary hover:underline text-xs">
                        {project.url}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Registered: {new Date(user.created_at).toLocaleDateString()}
              {!user.bio && !user.profession && (
                <span className="ml-2 text-destructive font-medium">Profile incomplete</span>
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
