import { useEffect, useMemo } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { useProviderReviewsStore } from '../../store/providerReviewsStore'; // Importa o novo store
import { Star, Loader2 } from 'lucide-react';

// Componente para renderizar as estrelas da avaliação
const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star
                key={i}
                className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
            />
        ))}
    </div>
);


// -- Componente Principal de Avaliações --
export const ReviewsManagement = () => {
  const { userProfile } = useProfileStore();
  const { reviews, isLoading, error, fetchReviews } = useProviderReviewsStore();

  useEffect(() => {
    if (userProfile?.id) {
      fetchReviews(userProfile.id);
    }
  }, [userProfile, fetchReviews]);
  
  const averageRating = useMemo(() => {
      if (reviews.length === 0) return 0;
      const total = reviews.reduce((acc, review) => acc + review.rating, 0);
      return (total / reviews.length).toFixed(1);
  }, [reviews]);

  if (isLoading) {
    return <div className="flex justify-center items-center p-20"><Loader2 className="animate-spin text-[#daa520]" size={40} /></div>;
  }

  if (error) {
    return <div className="text-center text-red-400 p-10 bg-red-500/10 rounded-lg">{error}</div>;
  }

  return (
    <div className="animate-fade-in-down">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3"><Star /> Avaliações de Clientes</h1>

      {/* Seção de Resumo */}
      <div className="bg-gray-800/70 p-6 rounded-xl border border-gray-700 mb-10 flex items-center justify-center gap-4 text-center">
        <div>
            <p className="text-sm text-gray-400">Nota Média</p>
            <p className="text-4xl font-bold text-yellow-400">{averageRating}</p>
        </div>
        <div className="border-l border-gray-700 h-16 mx-4"></div>
        <div>
            <p className="text-sm text-gray-400">Total de Avaliações</p>
            <p className="text-4xl font-bold text-white">{reviews.length}</p>
        </div>
      </div>

      {/* Lista de Avaliações */}
      <div className="space-y-6">
        {reviews.length > 0 ? reviews.map(review => (
            <div key={review.id} className="bg-gray-800/70 p-5 rounded-xl border border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-white">{review.clientName}</p>
                    <StarRating rating={review.rating} />
                </div>
                <p className="text-gray-400 italic">"{review.comment}"</p>
                <p className="text-xs text-gray-500 mt-3 text-right">
                    {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                </p>
            </div>
        )) : (
            <p className="text-center text-gray-500 py-10">Você ainda não recebeu nenhuma avaliação.</p>
        )}
      </div>
    </div>
  );
};