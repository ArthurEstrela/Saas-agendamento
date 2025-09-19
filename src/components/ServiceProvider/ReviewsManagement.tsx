// src/components/ServiceProvider/ReviewsManagement.tsx
import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useProviderReviewsStore } from '../../store/providerReviewsStore';
import { Star, User, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}
      />
    ))}
  </div>
);

// NOVO COMPONENTE: Resumo das Avaliações
const ReviewSummary = ({ reviews }: { reviews: { rating: number }[] }) => {
  const summary = useMemo(() => {
    if (reviews.length === 0) {
      return {
        total: 0,
        average: 0,
        counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }
    const total = reviews.length;
    const average = reviews.reduce((acc, review) => acc + review.rating, 0) / total;
    const counts = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return { total, average, counts };
  }, [reviews]);

  return (
    <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-6"
    >
        {/* Média Geral */}
        <div className="flex flex-col items-center justify-center text-center">
            <p className="text-gray-400 text-sm">Média Geral</p>
            <p className="text-4xl font-bold text-white my-2">{summary.average.toFixed(1)}</p>
            <StarRating rating={Math.round(summary.average)} />
            <p className="text-gray-500 text-xs mt-2">({summary.total} {summary.total === 1 ? 'avaliação' : 'avaliações'})</p>
        </div>

        {/* Distribuição de Notas */}
        <div className="md:col-span-2 flex flex-col justify-center">
            <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                    const count = summary.counts[star] || 0;
                    const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0;
                    return (
                        <div key={star} className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 font-medium">{star} estrelas</span>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div 
                                    className="bg-amber-400 h-2.5 rounded-full" 
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                            <span className="text-sm text-white font-semibold w-8 text-right">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    </motion.div>
  );
};

const filterOptions = [
  { label: 'Todas', value: 'all' },
  { label: '5 estrelas', value: 5 },
  { label: '4 estrelas', value: 4 },
  { label: '3 estrelas', value: 3 },
  { label: '2 estrelas', value: 2 },
  { label: '1 estrela', value: 1 },
];

export const ReviewsManagement = () => {
  const { user } = useAuthStore();
  const { reviews, isLoading, fetchReviews } = useProviderReviewsStore();
  const [filter, setFilter] = useState<string | number>('all');

  useEffect(() => {
    if (user?.uid) {
      fetchReviews(user.uid);
    }
  }, [user, fetchReviews]);

  const filteredReviews = useMemo(() => {
    if (filter === 'all') {
      return reviews;
    }
    return reviews.filter(review => review.rating === filter);
  }, [reviews, filter]);

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-2">Avaliações dos Clientes</h2>
      <p className="text-gray-400 mb-6">Veja o que seus clientes estão dizendo sobre seus serviços.</p>

      {/* Resumo das Avaliações */}
      {!isLoading && <ReviewSummary reviews={reviews} />}

      {/* Filtros */}
      <div className="mb-6">
          <div className="flex items-center gap-2 text-gray-300 mb-3">
            <Sliders size={16} />
            <h3 className="text-sm font-semibold">Filtrar por nota</h3>
          </div>
          <div className="flex flex-wrap gap-2">
              {filterOptions.map(option => (
                  <button 
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={`px-4 py-2 text-xs font-semibold rounded-full transition-colors duration-200
                          ${filter === option.value 
                              ? 'bg-amber-500 text-black' 
                              : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                          }`
                      }
                  >
                      {option.label}
                  </button>
              ))}
          </div>
      </div>

      {isLoading ? (
        <p className="text-center text-gray-400">Carregando avaliações...</p>
      ) : (
        <div className="flex-grow overflow-y-auto pr-2">
          <AnimatePresence>
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <motion.div
                  key={review.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-4"
                >
                  <div className="flex items-start gap-4">
                    {/* Foto do Cliente */}
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
                            avaliou <span className='font-semibold'>{review.professionalName}</span>
                          </p>
                        </div>
                        <StarRating rating={review.rating} />
                      </div>
                      <p className="text-gray-300 mt-3 text-sm">{review.comment}</p>
                      <p className="text-right text-xs text-gray-500 mt-2">
                        {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-10"
              >
                <p className="text-gray-500">Nenhuma avaliação encontrada com o filtro selecionado.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};