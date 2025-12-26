import { useEffect, useMemo } from "react";
import {
  useProviderReviewsStore,
  type EnrichedReview,
} from "../../store/providerReviewsStore";
import { Star, User } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// UI
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { cn } from "../../lib/utils/cn";

const StarRating = ({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={size}
        className={cn(
          i < Math.round(rating)
            ? "text-amber-400 fill-amber-400"
            : "text-gray-700"
        )}
      />
    ))}
  </div>
);

const ReviewCard = ({ review }: { review: EnrichedReview }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
    <Card className="bg-gray-900/40 border-gray-800">
      <CardContent className="p-5 flex gap-4">
        <Avatar className="h-10 w-10 border border-gray-700">
          <AvatarImage src={review.clientProfilePictureUrl} />
          <AvatarFallback className="bg-gray-800 text-gray-500">
            <User size={18} />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-1">
            <span className="font-bold text-white text-sm">
              {review.clientName}
            </span>
            <StarRating rating={review.rating} />
          </div>
          <p className="text-xs text-gray-500 mb-2">
            {format(new Date(review.createdAt), "d 'de' MMM, yyyy", {
              locale: ptBR,
            })}
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">
            {review.comment}
          </p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const ReviewSummary = ({ reviews }: { reviews: EnrichedReview[] }) => {
  const summary = useMemo(() => {
    if (reviews.length === 0) return null;
    const total = reviews.length;
    const average = reviews.reduce((acc, r) => acc + r.rating, 0) / total;
    const counts = reviews.reduce((acc, r) => {
      acc[r.rating] = (acc[r.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    return { total, average, counts };
  }, [reviews]);

  if (!summary) return null;

  return (
    <Card className="bg-gray-900/40 border-gray-800 mb-6">
      <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
        <div className="text-center sm:border-r border-gray-800 sm:pr-6">
          <span className="text-4xl font-extrabold text-white block">
            {summary.average.toFixed(1)}
          </span>
          <div className="flex justify-center my-2">
            <StarRating rating={summary.average} size={18} />
          </div>
          <span className="text-xs text-gray-500">
            {summary.total} avaliações
          </span>
        </div>
        <div className="sm:col-span-2 flex flex-col-reverse gap-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.counts[star] || 0;
            const percentage =
              summary.total > 0 ? (count / summary.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="text-gray-500 w-3 font-bold">{star}</span>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-gray-400 w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export const PublicReviewsSection = ({
  providerId,
}: {
  providerId: string;
}) => {
  const { reviews, isLoading, fetchReviews, clearReviews } =
    useProviderReviewsStore();

  useEffect(() => {
    if (providerId) fetchReviews(providerId);
    return () => clearReviews();
  }, [providerId, fetchReviews, clearReviews]);

  if (isLoading)
    return (
      <div className="py-10 text-center text-gray-500 text-sm">
        Carregando avaliações...
      </div>
    );

  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center bg-gray-900/30 rounded-xl border border-dashed border-gray-800">
        <Star className="mx-auto mb-2 text-gray-600 opacity-50" size={32} />
        <p className="text-gray-500">
          Este profissional ainda não possui avaliações.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <ReviewSummary reviews={reviews} />
      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};
