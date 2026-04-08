"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { User } from "@/types";

const STATUSES = ["all", "pending", "approved", "rejected", "banned"];

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [superuserId, setSuperuserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (statusFilter !== "all") params.set("status_filter", statusFilter);
    const data = await api<User[]>(`/admin/users?${params}`);
    setUsers(data);
  };

  useEffect(() => {
    api<{ user_id: string }>("/admin/superuser").then((d) => setSuperuserId(d.user_id));
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [query, statusFilter]);

  const ban = async (id: string) => {
    await api(`/admin/users/${id}/ban`, { method: "POST" });
    toast.success("Заблокирован");
    fetchUsers();
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    await api(`/admin/users/${id}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: newRole }),
    });
    toast.success(newRole === "admin" ? "Назначен админом" : "Снят с админа");
    fetchUsers();
  };

  const approve = async (id: string) => {
    await api(`/admin/users/${id}/approve`, { method: "POST" });
    toast.success("Одобрен");
    fetchUsers();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t("allUsers")}</h1>
      <div className="flex gap-4">
        <Input placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1" />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg divide-y">
        {users.map((user) => {
          const isSuperuser = user.id === superuserId;
          return (
            <div key={user.id} className="flex items-center justify-between p-3">
              <Link href={`/profile/${user.id}`} className="flex-1">
                <p className="font-medium">
                  {user.first_name} {user.last_name}
                  {isSuperuser && <span className="ml-2 text-xs text-primary font-normal">superuser</span>}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </Link>
              <div className="flex items-center gap-2">
                <Badge variant={user.status === "approved" ? "default" : "secondary"}>
                  {user.status}
                </Badge>
                {user.role === "admin" && <Badge variant="outline">admin</Badge>}
                {!isSuperuser && (
                  <>
                    {user.status === "pending" && (
                      <Button size="sm" onClick={() => approve(user.id)}>
                        {t("approve")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant={user.role === "admin" ? "secondary" : "outline"}
                      onClick={() => toggleRole(user.id, user.role)}
                    >
                      {user.role === "admin" ? "Снять админа" : "Сделать админом"}
                    </Button>
                    {user.status !== "banned" && (
                      <Button size="sm" variant="destructive" onClick={() => ban(user.id)}>
                        {t("ban")}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
