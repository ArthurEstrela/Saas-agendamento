// src/components/Public/PublicReviewsSection.tsx
import { useEffect, useMemo } from 'react';
import { useProviderReviewsStore, type EnrichedReview } from '../../store/providerReviewsStore';
import { Star, User } from 'lucide-react';
import { motion } from 'framer-motion';

// Componente de Estrelas (reutilizável)
const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={size}
        className={i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}
      />
    ))}
  </div>
);

// Card de uma única avaliação
const ReviewCard = ({ review }: { review: EnrichedReview }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="bg-gray-800/50 border border-gray-700 rounded-xl p-4"
  >
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden">
        {review.clientProfilePictureUrl ? (
          <img src={review.clientProfilePictureUrl} alt={review.clientName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User size={24} className="text-gray-500" />
          </div>
        )}
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold text-white">{review.clientName}</p>
            <p className="text-xs text-gray-400">
              {new Date(review.createdAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <StarRating rating={review.rating} />
        </div>
        <p className="text-gray-300 mt-3 text-sm">{review.comment}</p>
      </div>
    </div>
  </motion.div>
);

// Componente de Resumo das Avaliações
const ReviewSummary = ({ reviews }: { reviews: EnrichedReview[] }) => {
    const summary = useMemo(() => {
        if (reviews.length === 0) {
            return { total: 0, average: 0, counts: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 } };
        }
        const total = reviews.length;
        const average = reviews.reduce((acc, r) => acc + r.rating, 0) / total;
        const counts = reviews.reduce((acc, r) => {
            acc[r.rating] = (acc[r.rating] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);
        return { total, average, counts };
    }, [reviews]);

    if (summary.total === 0) return null;

    return (
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl p-6 mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-700 pb-4 md:pb-0 md:pr-6">
                <p className="text-5xl font-bold text-white">{summary.average.toFixed(1)}</p>
                <StarRating rating={summary.average} size={20} />
                <p className="text-gray-400 text-sm mt-2">Baseado em {summary.total} {summary.total === 1 ? 'avaliação' : 'avaliações'}</p>
            </div>
            <div className="md:col-span-2 flex flex-col-reverse justify-center gap-2">
                {[5, 4, 3, 2, 1].map(star => {
                    const count = summary.counts[star] || 0;
                    const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0;
                    return (
                        <div key={star} className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-8">{star} <span className="hidden md:inline">est.</span></span>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                            </div>
                            <span className="text-sm text-white font-semibold w-8 text-right">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export const PublicReviewsSection = ({ providerId }: { providerId: string }) => {
  const { reviews, isLoading, fetchReviews, clearReviews } = useProviderReviewsStore();

  useEffect(() => {
    if (providerId) {
      fetchReviews(providerId);
    }
    return () => {
      clearReviews(); // Limpa as reviews ao desmontar o componente
    };
  }, [providerId, fetchReviews, clearReviews]);

  if (isLoading) {
    return <p className="text-center text-gray-400">Carregando avaliações...</p>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Este profissional ainda não recebeu avaliações.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
        <ReviewSummary reviews={reviews} />
        <div className="space-y-4">
            {reviews.map(review => (
                <ReviewCard key={review.id} review={review} />
            ))}
        </div>
    </div>
  );
};