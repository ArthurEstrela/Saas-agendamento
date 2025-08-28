// src/components/ServiceProvider/ReviewsManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/authStore';
import { db } from '../../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Review, Professional } from '../../types';
import { Star, MessageSquare, Users, Loader, User as UserIcon } from 'lucide-react';

// --- Componente Principal ---
const ReviewsManagement = () => {
  const { userProfile } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [professionalFilter, setProfessionalFilter] = useState<string>('all');

  const professionals = useMemo(() => userProfile?.professionals || [], [userProfile]);
  const professionalsMap = useMemo(() => {
    const map = new Map<string, string>();
    professionals.forEach(p => map.set(p.id, p.name));
    return map;
  }, [professionals]);

  useEffect(() => {
    if (!userProfile?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const reviewsQuery = query(collection(db, 'reviews'), where('serviceProviderId', '==', userProfile.uid));
    const unsubscribe = onSnapshot(reviewsQuery, (snapshot) => {
      const fetchedReviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
      setReviews(fetchedReviews);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userProfile]);

  const filteredReviews = useMemo(() => {
    if (professionalFilter === 'all') {
      return reviews;
    }
    return reviews.filter(r => r.professionalId === professionalFilter);
  }, [reviews, professionalFilter]);

  const averageRating = useMemo(() => {
    if (filteredReviews.length === 0) return 0;
    const total = filteredReviews.reduce((acc, r) => acc + r.rating, 0);
    return (total / filteredReviews.length);
  }, [filteredReviews]);

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader className="animate-spin text-amber-500" size={40} /></div>;
  }

  return (
    <div className="p-6 bg-gray-900 text-white rounded-lg space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Avaliações dos Clientes</h1>
          <p className="text-gray-400 mt-1">Veja o que seus clientes estão dizendo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard 
          icon={Star} 
          title="Média Geral" 
          value={averageRating.toFixed(1)} 
          suffix={`/ 5.0`}
        />
        <StatCard 
          icon={MessageSquare} 
          title="Total de Avaliações" 
          value={filteredReviews.length.toString()} 
        />
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Todas as Avaliações</h2>
          <div className="relative">
            <select
              value={professionalFilter}
              onChange={(e) => setProfessionalFilter(e.target.value)}
              className="appearance-none bg-gray-700 border border-gray-600 rounded-lg pl-3 pr-8 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Todos Profissionais</option>
              {professionals.map(prof => (
                <option key={prof.id} value={prof.id}>{prof.name}</option>
              ))}
            </select>
            <Users size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        
        <div className="space-y-4">
          {filteredReviews.map(review => (
            <ReviewCard key={review.id} review={review} professionalName={professionalsMap.get(review.professionalId) || 'N/A'} />
          ))}
          {filteredReviews.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <MessageSquare size={48} className="mx-auto" />
              <h3 className="mt-4 text-lg font-semibold">Nenhuma avaliação encontrada</h3>
              <p className="mt-1 text-sm">Ainda não há avaliações para o filtro selecionado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Componentes Auxiliares ---
const StatCard = ({ icon: Icon, title, value, suffix = '' }) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex items-center gap-4">
    <div className="bg-gray-700 p-3 rounded-lg">
      <Icon className="text-amber-400" size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white">
        {value} <span className="text-lg text-gray-400">{suffix}</span>
      </p>
    </div>
  </div>
);

const ReviewCard = ({ review, professionalName }) => {
  const avatarUrl = review.clientPhotoURL 
    ? review.clientPhotoURL 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(review.clientName)}&background=27272a&color=f59e0b&bold=true`;

  return (
    <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-700 flex items-start gap-4">
      <img
        src={avatarUrl}
        alt={`Foto de ${review.clientName}`}
        className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
        onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.clientName)}&background=27272a&color=f59e0b&bold=true` }}
      />
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold text-white">{review.clientName}</p>
            <p className="text-xs text-gray-400">
              Avaliou <span className="font-semibold text-amber-400">{professionalName}</span> pelo serviço de <span className="font-semibold text-amber-400">{review.serviceName}</span>
            </p>
          </div>
          <div className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded-full">
            <Star size={14} className="text-yellow-400" />
            <span className="font-bold text-sm text-white">{review.rating.toFixed(1)}</span>
          </div>
        </div>
        <p className="mt-3 text-gray-300 italic">"{review.comment}"</p>
      </div>
    </div>
  );
};

export default ReviewsManagement;
