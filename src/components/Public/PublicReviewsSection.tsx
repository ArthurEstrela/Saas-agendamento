import { useEffect, useMemo } from "react";
import { useProviderReviewsStore } from "../../store/providerReviewsStore";
import type { Review } from "../../types"; // ✨ Usando o tipo oficial do backend
import { Star, User } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// UI
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { cn } from "../../lib/utils/cn";

// --- Função Utilitária para Datas Seguras ---
const normalizeDate = (dateValue: unknown): Date => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'object' && dateValue !== null && 'toDate' in dateValue) {
    return (dateValue as { toDate: () => Date }).toDate();
  }
  return new Date(dateValue as string | number);
};

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
            ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.3)]"
            : "text-gray-700"
        )}
      />
    ))}
  </div>
);

// ✨ Alterado para aceitar Review em vez de EnrichedReview
const ReviewCard = ({ review }: { review: Review }) => {
  // Tratamento preventivo caso o DTO mude ou não traga a foto
  const clientAvatarUrl = (review as any).clientProfilePictureUrl || "";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-gray-900/40 border-gray-800 hover:bg-gray-900/60 transition-colors">
        <CardContent className="p-5 flex gap-4">
          <Avatar className="h-10 w-10 border border-gray-700">
            <AvatarImage src={clientAvatarUrl} />
            <AvatarFallback className="bg-gray-800 text-gray-500 font-medium">
              {review.clientName ? review.clientName.substring(0, 2).toUpperCase() : <User size={18} />}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-white text-sm">
                {review.clientName || "Cliente"}
              </span>
              <StarRating rating={review.rating} />
            </div>
            <p className="text-xs text-gray-500 mb-2">
              {format(normalizeDate(review.createdAt), "d 'de' MMM, yyyy", {
                locale: ptBR,
              })}
            </p>
            {review.comment && (
              <p className="text-gray-300 text-sm leading-relaxed mt-1">
                {review.comment}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// ✨ Alterado para Review
const ReviewSummary = ({ reviews }: { reviews: Review[] }) => {
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
          <span className="text-5xl font-extrabold text-white block tracking-tighter">
            {summary.average.toFixed(1)}
          </span>
          <div className="flex justify-center my-2">
            <StarRating rating={summary.average} size={18} />
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
            {summary.total} avaliações
          </span>
        </div>
        <div className="sm:col-span-2 flex flex-col-reverse gap-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.counts[star] || 0;
            const percentage =
              summary.total > 0 ? (count / summary.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 text-xs group">
                <span className="text-gray-500 w-3 font-bold text-right group-hover:text-gray-300 transition-colors">{star}</span>
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-gray-400 w-6 text-left group-hover:text-gray-200 transition-colors">{count}</span>
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
  // ✨ Removido o clearReviews pois não é mais necessário/disponível no store
  const { reviews, loading, error, fetchReviews } =
    useProviderReviewsStore();

  useEffect(() => {
    if (providerId) {
      fetchReviews(providerId);
    }
  }, [providerId, fetchReviews]);

  if (loading)
    return (
      <div className="py-12 flex justify-center text-primary">
         <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error) {
    return (
      <div className="py-8 text-center text-red-400 bg-red-400/10 rounded-xl border border-red-400/20 text-sm">
        {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-16 text-center bg-gray-900/30 rounded-xl border border-dashed border-gray-800">
        <Star className="mx-auto mb-3 text-gray-600 opacity-50" size={40} />
        <p className="text-gray-400 font-medium">
          Este profissional ainda não possui avaliações.
        </p>
        <p className="text-gray-500 text-sm mt-1">Seja o primeiro a avaliar após ser atendido!</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in duration-500 slide-in-from-bottom-4">
      <ReviewSummary reviews={reviews} />
      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};