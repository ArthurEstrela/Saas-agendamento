import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../firebase/config'; 
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import type { Review } from '../../types';
import { Star, MessageSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Componentes de UI ---

const StatCard = ({ title, value, icon: Icon, iconColor }) => (
    <div className="bg-black/30 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <p className="text-3xl font-bold text-white mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-full bg-gray-800 ${iconColor}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    </div>
);

const StarRating = ({ rating, size = 5 }) => (
    <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
            <Star key={i} className={`h-${size} w-${size} ${i < rating ? 'text-[#daa520]' : 'text-gray-600'}`} fill="currentColor" />
        ))}
    </div>
);

// --- Componente Principal ---
const ReviewsManagement = () => {
    const { userProfile } = useAuthStore();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [professionalFilter, setProfessionalFilter] = useState('todos');
    const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

    useEffect(() => {
        if (!userProfile?.uid) return;
        setLoading(true);
        const reviewsRef = collection(db, `users/${userProfile.uid}/reviews`);
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviewsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Review));
            setReviews(reviewsData);
            setLoading(false);
        }, (error) => {
            console.error("Erro ao buscar avaliações:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userProfile?.uid]);

    const { averageRating, totalReviews, filteredAndSortedReviews } = useMemo(() => {
        let filtered = reviews;
        
        // Lógica de filtro (descomente e ajuste quando o 'professionalId' estiver no review)
        // if (professionalFilter !== 'todos') {
        //     filtered = reviews.filter(r => r.professionalId === professionalFilter);
        // }

        const total = filtered.length;
        const avg = total > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / total : 0;

        // Cria uma cópia para não mutar o estado original
        let sorted = [...filtered];

        switch (sortBy) {
            case 'oldest':
                sorted.sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
                break;
            case 'highest':
                sorted.sort((a, b) => b.rating - a.rating);
                break;
            case 'lowest':
                sorted.sort((a, b) => a.rating - b.rating);
                break;
            case 'newest':
            default:
                sorted.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                break;
        }

        return {
            averageRating: avg.toFixed(1),
            totalReviews: total,
            filteredAndSortedReviews: sorted,
        };
    }, [reviews, professionalFilter, sortBy]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold text-white">Avaliações de Clientes</h2>
            </div>

            {loading ? (
                 <p className="text-center text-gray-400 py-10">A carregar avaliações...</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <StatCard title="Nota Média Geral" value={averageRating} icon={Star} iconColor="text-[#daa520]" />
                        <StatCard title="Total de Avaliações" value={totalReviews} icon={MessageSquare} iconColor="text-blue-400" />
                    </div>

                    <div className="bg-black/30 backdrop-blur-sm p-4 rounded-xl mb-8 border border-gray-800 flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="text-sm font-semibold text-gray-300 block mb-2">Filtrar por Profissional</label>
                            <select onChange={(e) => setProfessionalFilter(e.target.value)} value={professionalFilter} className="w-full bg-gray-800 border border-gray-700 text-white font-semibold p-2 rounded-lg appearance-none focus:ring-2 focus:ring-[#daa520]">
                                <option value="todos">Todos os Profissionais</option>
                                {userProfile?.professionals?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="text-sm font-semibold text-gray-300 block mb-2">Ordenar por</label>
                            <select onChange={(e) => setSortBy(e.target.value as any)} value={sortBy} className="w-full bg-gray-800 border border-gray-700 text-white font-semibold p-2 rounded-lg appearance-none focus:ring-2 focus:ring-[#daa520]">
                                <option value="newest">Mais Recentes</option>
                                <option value="oldest">Mais Antigas</option>
                                <option value="highest">Maior Nota</option>
                                <option value="lowest">Menor Nota</option>
                            </select>
                        </div>
                    </div>
                    
                    {filteredAndSortedReviews.length > 0 ? (
                        <div className="space-y-6">
                            {filteredAndSortedReviews.map(review => (
                                <div key={review.id} className="bg-gray-800/80 p-6 rounded-xl border border-gray-700 transition-all duration-300 hover:border-[#daa520]/50">
                                    <div className="flex items-start">
                                        <img 
                                            src={review.clientPhotoURL || `https://placehold.co/150x150/111827/daa520?text=${review.clientName.charAt(0)}`} 
                                            alt={`Foto de ${review.clientName}`}
                                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-600 mr-4"
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h4 className="text-lg font-bold text-white">{review.clientName}</h4>
                                                    <p className="text-xs text-gray-400 flex items-center gap-2">
                                                        <Calendar size={14}/>
                                                        {review.createdAt ? format(review.createdAt.toDate(), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'Data indisponível'}
                                                    </p>
                                                </div>
                                                <StarRating rating={review.rating} />
                                            </div>
                                            {review.comment && (
                                                <p className="text-gray-300 mt-3 border-l-4 border-gray-700 pl-4 italic">
                                                    &ldquo;{review.comment}&rdquo;
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-10 bg-black/30 rounded-xl border border-dashed border-gray-700">
                            <Star size={48} className="mx-auto text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold text-white">Nenhuma avaliação encontrada</h3>
                            <p className="text-sm mt-2">Ainda não há avaliações que correspondam aos seus filtros.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ReviewsManagement;
