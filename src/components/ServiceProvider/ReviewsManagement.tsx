import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { getReviews } from '../../firebase/reviewService'; // Importa do novo serviço
import { Loader2, Star, MessageSquare, User, Calendar, Inbox } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Componente para a Barra de Progresso das Estrelas ---
const RatingBar = ({ count, total, percentage }) => (
    <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400 w-12">{count} {count > 1 ? 'votos' : 'voto'}</span>
        <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-amber-400 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
        <span className="text-sm font-semibold text-white w-10 text-right">{percentage.toFixed(0)}%</span>
    </div>
);

// --- Componente para o Card de Avaliação Individual ---
const ReviewCard = ({ review }) => (
    <div className="bg-gray-800 p-5 rounded-xl border border-gray-700">
        <div className="flex items-start gap-4">
            <img 
                src={review.clientPhotoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.clientName)}&background=1f2937&color=daa520`} 
                alt={review.clientName}
                className="h-12 w-12 rounded-full object-cover"
            />
            <div className="flex-grow">
                <div className="flex justify-between items-center">
                    <p className="font-bold text-white">{review.clientName}</p>
                    <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={16} className={i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} />
                        ))}
                    </div>
                </div>
                <p className="text-xs text-gray-500">{format(parseISO(review.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                {review.comment && (
                    <p className="mt-3 text-gray-300 bg-black/20 p-3 rounded-md">{review.comment}</p>
                )}
            </div>
        </div>
    </div>
);


// --- Componente Principal ---
const ReviewsManagement = () => {
    const { userProfile } = useAuthStore();

    const { data: reviews, isLoading, error } = useQuery({
        queryKey: ['providerReviews', userProfile?.uid],
        queryFn: () => getReviews(userProfile!.uid),
        enabled: !!userProfile,
    });

    const stats = useMemo(() => {
        if (!reviews || reviews.length === 0) {
            return { average: 0, total: 0, counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
        }
        const total = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const average = sum / total;
        const counts = reviews.reduce((acc, r) => {
            acc[r.rating] = (acc[r.rating] || 0) + 1;
            return acc;
        }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });

        return { average, total, counts };
    }, [reviews]);


    if (isLoading) {
        return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-[#daa520]" size={48}/></div>;
    }

    if (error) {
        return <div className="p-10 text-center text-red-400">Ocorreu um erro ao carregar as avaliações.</div>;
    }

    return (
        <div className="p-4 sm:p-6 space-y-8">
            <h1 className="text-4xl font-bold text-white">Avaliações dos Clientes</h1>

            {/* Seção de Resumo e Estatísticas */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-700 pb-6 md:pb-0 md:pr-6">
                    <p className="text-6xl font-bold text-[#daa520]">{stats.average.toFixed(1)}</p>
                    <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} size={24} className={i < Math.round(stats.average) ? 'text-amber-400 fill-amber-400' : 'text-gray-600'} />
                        ))}
                    </div>
                    <p className="text-gray-400 mt-2">Baseado em {stats.total} {stats.total === 1 ? 'avaliação' : 'avaliações'}</p>
                </div>
                <div className="md:col-span-2 space-y-2">
                    {[5, 4, 3, 2, 1].map(star => (
                        <RatingBar 
                            key={star}
                            count={stats.counts[star]}
                            total={stats.total}
                            percentage={stats.total > 0 ? (stats.counts[star] / stats.total) * 100 : 0}
                        />
                    ))}
                </div>
            </div>

            {/* Lista de Avaliações */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">O que os clientes dizem</h2>
                {reviews && reviews.length > 0 ? (
                    <div className="space-y-5">
                        {reviews.map(review => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-20 bg-black/20 rounded-lg border border-dashed border-gray-700">
                        <Inbox size={48} className="mx-auto mb-4"/>
                        <p className="font-semibold">Nenhuma avaliação recebida ainda</p>
                        <p className="text-sm">As avaliações dos seus clientes aparecerão aqui.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReviewsManagement;
