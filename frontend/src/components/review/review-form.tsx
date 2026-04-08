"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { toast } from "sonner";

interface Props {
  businessId: string;
  onSubmitted: () => void;
}

export function ReviewForm({ businessId, onSubmitted }: Props) {
  const t = useTranslations("review");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await api(`/reviews/businesses/${businessId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment: comment || null }),
      });
      setRating(0);
      setComment("");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg">
      <p className="font-medium">{t("writeReview")}</p>
      <div>
        <p className="text-sm mb-1">{t("yourRating")}</p>
        <StarRating rating={rating} onRate={setRating} />
      </div>
      <Textarea
        placeholder={t("comment")}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button type="submit" size="sm" disabled={submitting || rating === 0}>
        {t("writeReview")}
      </Button>
    </form>
  );
}
