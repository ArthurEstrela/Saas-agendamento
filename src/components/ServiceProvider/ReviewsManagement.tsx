import { useEffect, useState, useMemo } from "react";
import { useAuthStore } from "../../store/authStore";
import { useProviderReviewsStore } from "../../store/providerReviewsStore";
import { Star, User, Sliders, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// UI
import { Card, CardContent } from "../ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils/cn";
import { Loader2 } from "lucide-react";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={14}
        className={cn(
          i < rating ? "text-amber-400 fill-amber-400" : "text-gray-700"
        )}
      />
    ))}
  </div>
);

const ReviewSummary = ({ reviews }: { reviews: { rating: number }[] }) => {
  const summary = useMemo(() => {
    if (reviews.length === 0)
      return { total: 0, average: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    const total = reviews.length;
    const average =
      reviews.reduce((acc, review) => acc + review.rating, 0) / total;
    const counts = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    return { total, average, counts };
  }, [reviews]);

  return (
    <Card className="bg-gray-900/50 border-gray-800 mb-8">
      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Média */}
        <div className="text-center md:border-r border-gray-800 pr-0 md:pr-8">
          <div className="text-5xl font-extrabold text-white mb-2">
            {summary.average.toFixed(1)}
          </div>
          <div className="flex justify-center mb-2">
            <StarRating rating={Math.round(summary.average)} />
          </div>
          <p className="text-sm text-gray-500">{summary.total} avaliações</p>
        </div>

        {/* Barras */}
        <div className="md:col-span-2 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.counts[star] || 0;
            const percentage =
              summary.total > 0 ? (count / summary.total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 w-3">
                  {star}
                </span>
                <Star size={12} className="text-gray-600" />
                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export const ReviewsManagement = () => {
  const { user } = useAuthStore();
  const { reviews, isLoading, fetchReviews } = useProviderReviewsStore();
  const [filter, setFilter] = useState<string | number>("all");

  useEffect(() => {
    if (user?.uid) fetchReviews(user.uid);
  }, [user?.uid, fetchReviews]);

  const filteredReviews = useMemo(() => {
    return filter === "all"
      ? reviews
      : reviews.filter((r) => r.rating === filter);
  }, [reviews, filter]);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-bold text-white">Avaliações</h2>
        <p className="text-gray-400">Feedback dos seus clientes.</p>
      </div>

      {!isLoading && <ReviewSummary reviews={reviews} />}

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Sliders size={16} className="text-gray-500 mr-2" />
        {[
          { l: "Todas", v: "all" },
          { l: "5 ★", v: 5 },
          { l: "4 ★", v: 4 },
          { l: "3 ★", v: 3 },
          { l: "2 ★", v: 2 },
          { l: "1 ★", v: 1 },
        ].map((opt) => (
          <Badge
            key={opt.v}
            variant={filter === opt.v ? "default" : "outline"}
            className="cursor-pointer px-4 py-1.5 h-auto text-sm hover:bg-primary/20 transition-colors"
            onClick={() => setFilter(opt.v)}
          >
            {opt.l}
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <motion.div
                  key={review.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="bg-gray-900/40 border-gray-800 hover:border-gray-700 transition-colors">
                    <CardContent className="p-5 flex gap-4">
                      <Avatar className="h-12 w-12 border border-gray-700">
                        <AvatarImage src={review.clientProfilePictureUrl} />
                        <AvatarFallback>
                          <User className="text-gray-500" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-white text-base">
                              {review.clientName}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Serviço com{" "}
                              <span className="text-primary">
                                {review.professionalName}
                              </span>
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <StarRating rating={review.rating} />
                            <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                              <Calendar size={10} />
                              {format(
                                new Date(review.createdAt),
                                "dd MMM yyyy",
                                { locale: ptBR }
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed bg-black/20 p-3 rounded-lg border border-gray-800/50">
                          "{review.comment}"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                Nenhuma avaliação encontrada com este filtro.
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
