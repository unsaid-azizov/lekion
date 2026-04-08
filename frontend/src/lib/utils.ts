import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uploadsUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined;
  const base = process.env.NEXT_PUBLIC_UPLOADS_URL || "/uploads";
  return `${base}/${path}`;
}

export function externalUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `https://${url}`;
}
