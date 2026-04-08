"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StarRating } from "./star-rating";
import { uploadsUrl } from "@/lib/utils";
import { toast } from "sonner";
import type { Review } from "@/types";

interface Props {
  businessId: string;
  isOwner: boolean;
}

export function ReviewList({ businessId, isOwner }: Props) {
  const t = useTranslations("review");
  const [reviews, setReviews] = useState<Review[]>([]);

  const fetchReviews = () => {
    api<Review[]>(`/reviews/businesses/${businessId}/reviews`).then(setReviews).catch(() => {});
  };

  useEffect(() => {
    fetchReviews();
  }, [businessId]);

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} isOwner={isOwner} onReplySubmitted={fetchReviews} />
      ))}
      {reviews.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("comment")}</p>
      )}
    </div>
  );
}

function ReviewCard({ review, isOwner, onReplySubmitted }: { review: Review; isOwner: boolean; onReplySubmitted: () => void }) {
  const t = useTranslations("review");
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const submitReply = async () => {
    await api(`/reviews/${review.id}/reply`, {
      method: "POST",
      body: JSON.stringify({ text: replyText }),
    });
    setReplying(false);
    setReplyText("");
    onReplySubmitted();
    toast.success("Reply sent");
  };

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={uploadsUrl(review.author.photo_path)} />
          <AvatarFallback>{review.author.first_name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{review.author.first_name} {review.author.last_name}</p>
          <StarRating rating={review.rating} readonly />
        </div>
      </div>
      {review.comment && <p className="text-sm">{review.comment}</p>}

      {review.owner_reply && (
        <div className="ml-6 p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium mb-1">{t("ownerReply")}</p>
          <p className="text-sm">{review.owner_reply}</p>
        </div>
      )}

      {isOwner && !review.owner_reply && (
        <>
          {replying ? (
            <div className="ml-6 space-y-2">
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} />
              <div className="flex gap-2">
                <Button size="sm" onClick={submitReply}>{t("reply")}</Button>
                <Button size="sm" variant="ghost" onClick={() => setReplying(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setReplying(true)}>
              {t("reply")}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
