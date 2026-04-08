"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/review/star-rating";
import { uploadsUrl } from "@/lib/utils";
import type { User, Business, Paginated } from "@/types";

export default function SearchPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"people" | "businesses">("people");
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [people, setPeople] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (tab === "people") {
        const data = await api<Paginated<User>>(`/users?q=${query}`);
        setPeople(data.items);
      } else {
        const data = await api<Paginated<Business>>(`/businesses?q=${query}`);
        setBusinesses(data.items);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, tab]);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <Input
        placeholder={t("map.searchPlaceholder")}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-lg"
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="people">{t("common.people")}</TabsTrigger>
          <TabsTrigger value="businesses">{t("common.businesses")}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {tab === "people" &&
          people.map((user) => (
            <Link key={user.id} href={`/profile/${user.id}`}>
              <Card className="hover:bg-muted transition-colors">
                <CardContent className="flex items-center gap-3 py-3">
                  <Avatar>
                    <AvatarImage src={uploadsUrl(user.photo_path)} />
                    <AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.first_name} {user.last_name}</p>
                    {user.profession && <p className="text-sm text-muted-foreground">{user.profession}</p>}
                    {user.city && <p className="text-xs text-muted-foreground">{user.city}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

        {tab === "businesses" &&
          businesses.map((biz) => (
            <Link key={biz.id} href={`/businesses/${biz.id}`}>
              <Card className="hover:bg-muted transition-colors">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{biz.name}</p>
                      <p className="text-sm text-muted-foreground">{biz.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={biz.average_rating} readonly />
                      <span className="text-xs text-muted-foreground">({biz.review_count})</span>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-1">
                    {biz.category && <Badge variant="secondary" className="text-xs">{biz.category.name_ru}</Badge>}
                    {biz.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}
