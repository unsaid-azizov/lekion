"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { uploadsUrl } from "@/lib/utils";
import { useAuthContext } from "@/components/providers";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/review/star-rating";
import { ReviewList } from "@/components/review/review-list";
import { ReviewForm } from "@/components/review/review-form";
import { toast } from "sonner";
import { X, UserPlus, Crown, Pencil } from "lucide-react";
import type { Business, BusinessMember, User as UserType } from "@/types";

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations();
  const { user } = useAuthContext();
  const [business, setBusiness] = useState<Business | null>(null);

  const fetchBusiness = () => {
    api<Business>(`/businesses/${id}`).then(setBusiness);
  };

  useEffect(() => {
    fetchBusiness();
  }, [id]);

  if (!business) return null;

  const isOwner = user?.id === business.owner_id || business.members.some((m) => m.user_id === user?.id && m.role === "owner");
  const isMember = isOwner || business.members.some((m) => m.user_id === user?.id);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{business.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <StarRating rating={business.average_rating} readonly />
                <span className="text-sm text-muted-foreground">
                  ({business.review_count} {t("business.reviews").toLowerCase()})
                </span>
              </div>
            </div>
            {isMember && (
              <Link href={`/businesses/${id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                {t("common.edit")}
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {business.category && <Badge>{business.category.name_ru}</Badge>}
            {business.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {business.description && <p>{business.description}</p>}
          <div className="text-sm space-y-1">
            <p>{business.address}</p>
            {business.phone && <p>Phone: {business.phone}</p>}
            {business.website && (
              <p>Website: <a href={/^https?:\/\//.test(business.website!) ? business.website : `https://${business.website}`} className="underline" target="_blank" rel="noopener">{business.website}</a></p>
            )}
          </div>

          {business.photos.length > 0 && (
            <>
              <Separator />
              <div className="grid grid-cols-3 gap-2">
                {business.photos.map((photo) => (
                  <img key={photo.id} src={uploadsUrl(photo.photo_path)} alt="" className="rounded-lg object-cover aspect-video w-full" />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Members section — visible to owners */}
      {isOwner && (
        <MembersSection businessId={id} members={business.members} onChanged={fetchBusiness} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("business.reviews")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isMember && <ReviewForm businessId={id} onSubmitted={fetchBusiness} />}
          <ReviewList businessId={id} isOwner={isMember} />
        </CardContent>
      </Card>
    </div>
  );
}

function MembersSection({ businessId, members, onChanged }: { businessId: string; members: BusinessMember[]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [searching, setSearching] = useState(false);

  const searchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await api<{ items: UserType[] }>(`/users?q=${encodeURIComponent(q)}&per_page=5`);
      setSearchResults(data.items || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addMember = async (userId: string, role: "owner" | "editor" = "editor") => {
    try {
      await api(`/businesses/${businessId}/members`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId, role }),
      });
      setAdding(false);
      setSearchQuery("");
      setSearchResults([]);
      onChanged();
      toast.success("Участник добавлен");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      await api(`/businesses/${businessId}/members/${memberId}`, { method: "DELETE" });
      onChanged();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Участники</CardTitle>
          {!adding && (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => setAdding(true)}>
              <UserPlus className="size-3.5" />
              Добавить
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {adding && (
          <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
            <Input
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={(e) => searchUsers(e.target.value)}
              className="h-8 text-sm"
            />
            {searchResults.length > 0 && (
              <div className="space-y-1">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-left text-sm hover:bg-accent transition-colors"
                    onClick={() => addMember(u.id)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={uploadsUrl(u.photo_path)} />
                      <AvatarFallback className="text-[10px]">{u.first_name[0]}{u.last_name[0]}</AvatarFallback>
                    </Avatar>
                    <span>{u.first_name} {u.last_name}</span>
                    {u.profession && <span className="text-xs text-muted-foreground ml-auto">{u.profession}</span>}
                  </button>
                ))}
              </div>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setAdding(false); setSearchQuery(""); setSearchResults([]); }}>
              Отмена
            </Button>
          </div>
        )}

        {members.length === 0 && !adding && (
          <p className="text-sm text-muted-foreground">Только вы</p>
        )}

        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 group">
            <Avatar className="h-8 w-8">
              <AvatarImage src={uploadsUrl(m.photo_path)} />
              <AvatarFallback className="text-xs">{m.first_name[0]}{m.last_name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{m.first_name} {m.last_name}</p>
            </div>
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {m.role === "owner" ? <Crown className="size-3" /> : <Pencil className="size-3" />}
              {m.role === "owner" ? "Владелец" : "Редактор"}
            </span>
            <button
              onClick={() => removeMember(m.id)}
              className="text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all p-1 rounded-md hover:bg-muted"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
