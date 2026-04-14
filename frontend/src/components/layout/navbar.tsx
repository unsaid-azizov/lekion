"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadsUrl, cn } from "@/lib/utils";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const t = useTranslations();
  const { user, logout } = useAuthContext();

  return (
    <nav className="border-b border-border/50 bg-card/80 backdrop-blur-sm px-4 h-12 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="font-bold tracking-tight text-primary text-base">
        LEKION
      </Link>

      <div className="flex items-center gap-0.5">
        <LocaleSwitcher />
        <ThemeToggle />

        {user ? (
          <>
            {(user.status === "incomplete" || user.status === "rejected") && (
              <Link href="/onboarding">
                <Button size="sm" variant="outline" className="ml-1 h-7 text-xs border-primary/40 text-primary hover:bg-primary/10">
                  {t("onboarding.submit")}
                </Button>
              </Link>
            )}
            {user.status === "pending" && (
              <Link href="/pending-approval">
                <span className="ml-1.5 text-xs text-muted-foreground border border-border rounded-full px-2.5 py-1 cursor-pointer hover:text-foreground transition-colors">
                  {t("pending.title")}
                </span>
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "relative h-8 w-8 rounded-full p-0 ml-0.5")}>
                <Avatar className="h-7 w-7 ring-1 ring-primary/20">
                  <AvatarImage src={uploadsUrl(user.photo_path)} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                    {user.first_name[0]}{user.last_name[0]}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem render={<Link href="/profile" />}>
                  {t("profile.myProfile")}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/businesses/new" />}>
                  {t("business.addBusiness")}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/referrals" />}>
                  {t("referral.myReferrals")}
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem render={<Link href="/admin" />}>
                    {t("admin.dashboard")}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  {t("auth.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Link href="/auth/login">
            <Button size="sm" className="ml-1 h-7 text-xs">
              {t("auth.signIn")}
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
