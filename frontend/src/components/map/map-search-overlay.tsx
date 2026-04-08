"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";

interface Props {
  type: "all" | "people" | "businesses";
  onTypeChange: (type: "all" | "people" | "businesses") => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export function MapSearchOverlay({ type, onTypeChange, search, onSearchChange }: Props) {
  const t = useTranslations();
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(localSearch), 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 w-80">
      <Input
        placeholder={t("map.searchPlaceholder")}
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        className="bg-background shadow-md"
      />
      <Tabs value={type} onValueChange={(v) => onTypeChange(v as typeof type)}>
        <TabsList className="w-full bg-background shadow-md">
          <TabsTrigger value="all" className="flex-1">{t("common.all")}</TabsTrigger>
          <TabsTrigger value="people" className="flex-1">{t("common.people")}</TabsTrigger>
          <TabsTrigger value="businesses" className="flex-1">{t("common.businesses")}</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
