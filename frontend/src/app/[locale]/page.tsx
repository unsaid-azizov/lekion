"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { MapContainer } from "@/components/map/map-container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/review/star-rating";
import { uploadsUrl } from "@/lib/utils";
import type { User, Business, Paginated, MapPins } from "@/types";

type ViewTab = "people" | "businesses" | "map";

export default function HomePage() {
  const t = useTranslations();
  const [tab, setTab] = useState<ViewTab>("people");
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [total, setTotal] = useState(0);
  const [desktopMapOpen, setDesktopMapOpen] = useState(true);
  const [mapWidth, setMapWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mapWidth");
      return saved ? Number(saved) : 420;
    }
    return 420;
  });
  const [pins, setPins] = useState<MapPins>({ people: [], businesses: [] });
  const dragging = useRef(false);

  const dataTab = tab === "map" ? "people" : tab;

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        if (dataTab === "people") {
          const data = await api<Paginated<User>>(`/users?q=${encodeURIComponent(query)}&per_page=50`);
          setPeople(data.items);
          setTotal(data.total);
        } else {
          const data = await api<Paginated<Business>>(`/businesses?q=${encodeURIComponent(query)}&per_page=50`);
          setBusinesses(data.items);
          setTotal(data.total);
        }
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [dataTab, query]);

  const fetchPins = useCallback(
    async (bounds: { south: number; west: number; north: number; east: number }) => {
      const params = new URLSearchParams({
        type: dataTab,
        south: String(bounds.south),
        west: String(bounds.west),
        north: String(bounds.north),
        east: String(bounds.east),
      });
      if (query) params.set("search", query);
      const data = await api<MapPins>(`/map/pins?${params}`);
      setPins(data);
    },
    [dataTab, query],
  );

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const startX = e.clientX;
    const startWidth = mapWidth;
    let currentWidth = startWidth;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = startX - ev.clientX;
      currentWidth = Math.min(Math.max(startWidth + delta, 250), 800);
      setMapWidth(currentWidth);
    };

    const onUp = () => {
      dragging.current = false;
      localStorage.setItem("mapWidth", String(currentWidth));
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [mapWidth]);

  const isMobileMap = tab === "map";

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      {/* ── Toolbar: search + tabs ── always visible */}
      <div className="shrink-0 border-b border-border/50 bg-background">
        <div className="flex items-center gap-2 px-3 sm:px-5 py-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50"
              xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <Input
              placeholder={t("map.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-9 bg-card border-border text-sm rounded-lg focus-visible:ring-primary/30"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 bg-card rounded-lg p-0.5 border border-border shrink-0">
            <TabBtn active={tab === "people"} onClick={() => setTab("people")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:mr-1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span className="hidden sm:inline">{t("common.people")}</span>
            </TabBtn>
            <TabBtn active={tab === "businesses"} onClick={() => setTab("businesses")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:mr-1.5"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              <span className="hidden sm:inline">{t("common.businesses")}</span>
            </TabBtn>
            {/* Map tab — mobile only */}
            <TabBtn active={tab === "map"} onClick={() => setTab("map")} className="lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            </TabBtn>
          </div>

          {/* Result count — desktop */}
          <span className="text-xs text-muted-foreground hidden md:inline shrink-0">
            <span className="text-primary font-semibold">{total}</span> {dataTab === "people" ? "участн." : "бизн."}
          </span>

          {/* Desktop map toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary hidden lg:flex shrink-0 h-9 w-9 p-0"
            onClick={() => setDesktopMapOpen(!desktopMapOpen)}
            title={desktopMapOpen ? "Скрыть карту" : "Показать карту"}
          >
            {desktopMapOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
            )}
          </Button>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 flex min-h-0">
        {/* Cards — hidden on mobile map */}
        <div className={`flex-1 overflow-y-auto min-w-0 ${isMobileMap ? "hidden lg:block" : ""}`}>
          {((dataTab === "people" && people.length === 0) || (dataTab === "businesses" && businesses.length === 0)) ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                {query ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                ) : dataTab === "people" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary/50"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                )}
              </div>
              <p className="text-foreground font-medium text-sm mb-1">
                {query ? t("common.noResults") : dataTab === "people" ? t("common.noPeople") : t("common.noBusinesses")}
              </p>
              <p className="text-muted-foreground text-xs max-w-xs mb-4">
                {query ? t("common.noResultsHint") : dataTab === "people" ? t("common.noPeopleHint") : t("common.noBusinessesHint")}
              </p>
              {!query && dataTab === "businesses" && (
                <Link href="/businesses/new">
                  <Button size="sm">{t("business.addBusiness")}</Button>
                </Link>
              )}
              {!query && dataTab === "people" && (
                <Link href="/referrals">
                  <Button size="sm" variant="outline">{t("common.invitePeople")}</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 p-2.5 sm:p-3 auto-rows-min">
              {dataTab === "people" && people.map((person) => (
                <PersonCard key={person.id} person={person} />
              ))}
              {dataTab === "businesses" && businesses.map((biz) => (
                <BusinessCard key={biz.id} business={biz} />
              ))}
            </div>
          )}
        </div>

        {/* Mobile map — full width */}
        {isMobileMap && (
          <div className="flex-1 lg:hidden">
            <MapContainer pins={pins} onBoundsChange={fetchPins} />
          </div>
        )}

        {/* Desktop resizable map sidebar */}
        {desktopMapOpen && (
          <div className="hidden lg:flex flex-shrink-0" style={{ width: mapWidth }}>
            <div
              className="w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors flex-shrink-0 relative group"
              onMouseDown={onDragStart}
            >
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-primary/50" />
            </div>
            <div className="flex-1 min-w-0">
              <MapContainer pins={pins} onBoundsChange={fetchPins} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Tab button ─── */

function TabBtn({
  active,
  onClick,
  children,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-2.5 sm:px-3 py-1.5 rounded-md transition-all font-medium flex items-center ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      } ${className}`}
    >
      {children}
    </button>
  );
}

/* ─── Person Card ─── */

function PersonCard({ person }: { person: User }) {
  const link = person.website || person.telegram;

  return (
    <Link href={`/profile/${person.id}`} className="block group">
      <div className="border border-border rounded-lg bg-card hover:border-primary/40 hover:shadow-[0_0_20px_rgba(180,130,60,0.1)] transition-all duration-200 h-full flex flex-col overflow-hidden">
        {/* Header with name + city */}
        <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
          <Avatar className="h-9 w-9 shrink-0 rounded-md ring-1 ring-primary/20 after:rounded-md">
            <AvatarImage src={uploadsUrl(person.photo_path)} className="rounded-md" />
            <AvatarFallback className="rounded-md text-[11px] bg-gradient-to-br from-primary/25 to-primary/10 text-primary font-bold">
              {person.first_name[0]}{person.last_name[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[13px] truncate group-hover:text-primary transition-colors leading-tight">
              {person.first_name} {person.last_name}
            </p>
            {person.city && (
              <span className="text-[10px] text-primary/70 flex items-center gap-0.5 font-medium leading-tight">
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                {person.city}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {person.bio && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed px-3 mb-2">
            {person.bio}
          </p>
        )}

        {/* Tags */}
        {person.profession && (
          <div className="flex flex-wrap gap-1 px-3 mt-auto mb-2">
            {person.profession.split(/[,;/]+/).map((t) => t.trim()).filter(Boolean).slice(0, 5).map((tag) => (
              <span key={tag} className="text-[9px] px-1.5 py-px rounded bg-primary/10 text-primary/75 border border-primary/12">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer link */}
        {link && (
          <div className="border-t border-border/50 px-3 py-1.5 mt-auto">
            <p className="text-[10px] text-primary/45 truncate flex items-center gap-1 group-hover:text-primary/65 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              {(person.website || person.telegram || "").replace(/^https?:\/\//, "")}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

/* ─── Business Card ─── */

function BusinessCard({ business }: { business: Business }) {
  return (
    <Link href={`/businesses/${business.id}`} className="block group">
      <div className="border border-border rounded-lg bg-card hover:border-primary/40 hover:shadow-[0_0_20px_rgba(180,130,60,0.1)] transition-all duration-200 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-3 pt-3 pb-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[13px] truncate group-hover:text-primary transition-colors leading-tight">{business.name}</p>
            {business.city && (
              <span className="text-[10px] text-primary/70 flex items-center gap-0.5 font-medium leading-tight">
                <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                {business.city}
              </span>
            )}
          </div>
          {business.review_count > 0 && (
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <StarRating rating={business.average_rating} readonly />
              <span className="text-[10px] text-muted-foreground">({business.review_count})</span>
            </div>
          )}
        </div>

        {/* Description */}
        {business.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed px-3 mb-2">{business.description}</p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 px-3 mt-auto mb-2">
          {business.category && (
            <span className="text-[9px] px-1.5 py-px rounded bg-primary/15 text-primary font-medium border border-primary/18">
              {business.category.name_ru}
            </span>
          )}
          {business.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="text-[9px] px-1.5 py-px rounded bg-primary/8 text-primary/70 border border-primary/10">
              {tag}
            </span>
          ))}
        </div>

        {/* Footer */}
        {business.website && (
          <div className="border-t border-border/50 px-3 py-1.5 mt-auto">
            <p className="text-[10px] text-primary/45 truncate flex items-center gap-1 group-hover:text-primary/65 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              {business.website.replace(/^https?:\/\//, "")}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
