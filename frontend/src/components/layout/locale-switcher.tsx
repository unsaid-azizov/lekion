"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { locales } from "@/i18n";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <div className="flex gap-1">
      {locales.map((l) => (
        <Button
          key={l}
          variant={l === locale ? "default" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => switchLocale(l)}
        >
          {l.toUpperCase()}
        </Button>
      ))}
    </div>
  );
}
