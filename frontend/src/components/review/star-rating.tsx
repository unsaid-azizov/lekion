"use client";

import { cn } from "@/lib/utils";

interface Props {
  rating: number;
  readonly?: boolean;
  onRate?: (rating: number) => void;
}

export function StarRating({ rating, readonly, onRate }: Props) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(star)}
          className={cn(
            "text-lg",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform",
            star <= Math.round(rating) ? "text-yellow-500" : "text-gray-300",
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}
