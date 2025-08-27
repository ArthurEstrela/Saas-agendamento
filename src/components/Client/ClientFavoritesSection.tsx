// src/components/Client/ClientFavoritesSection.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { UserProfile } from '../../types';
import ClientProfessionalCard from './ClientProfessionalCard';
import { Heart } from 'lucide-react';

interface ClientFavoritesSectionProps {
  user: any; // Firebase User
  userProfile: UserProfile | null;
  handleLoginAction: () => void;
  handleProtectedAction: (action: () => void) => void;
  toggleFavorite: (professionalId: string) => Promise<void>;
  handleSelectProfessionalForBooking: (prof: UserProfile) => void;
  LoginPrompt: React.ComponentType<{ message: string; onAction: () => void }>;
  setActiveView: (view: 'search' | 'myAppointments' | 'favorites' | 'profile' | 'booking') => void;
}

const ClientFavoritesSection: React.FC<ClientFavoritesSectionProps> = ({
  user,
  userProfile,
  handleLoginAction,
  handleProtectedAction,
  toggleFavorite,
  handleSelectProfessionalForBooking,
  LoginPrompt,
  setActiveView,
}) => {
  const [favoriteProfessionals, setFavoriteProfessionals] = useState<UserProfile[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoadingFavorites(true);
      // CORREÇÃO: Usando a propriedade 'favorites'
      if (!userProfile?.favorites || userProfile.favorites.length === 0) {
        setFavoriteProfessionals([]);
        setLoadingFavorites(false);
        return;
      }

      try {
        const q = query(collection(db, 'users'), where(documentId(), 'in', userProfile.favorites));
        const querySnapshot = await getDocs(q);
        const favsData = querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
        setFavoriteProfessionals(favsData);
      } catch (error) {
        console.error("Erro ao buscar favoritos:", error);
      } finally {
        setLoadingFavorites(false);
      }
    };

    if (user) {
      fetchFavorites();
    } else {
      setFavoriteProfessionals([]);
      setLoadingFavorites(false);
    }
  }, [user, userProfile?.favorites]);

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-6">Os Meus Favoritos</h2>
      {loadingFavorites ? (<p className="text-center text-gray-400 py-10">A carregar favoritos...</p>) : favoriteProfessionals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-down">
          {favoriteProfessionals.map(prof => (
            <ClientProfessionalCard
              key={prof.uid}
              prof={prof}
              isFavorite={userProfile?.favorites?.includes(prof.uid) || false}
              handleProtectedAction={handleProtectedAction}
              toggleFavorite={toggleFavorite}
              handleSelectProfessionalForBooking={handleSelectProfessionalForBooking}
            />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-400 py-10 bg-black/30 rounded-xl border border-dashed border-gray-700">
          <Heart size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-white">Sua galeria de favoritos está vazia</h3>
          <p className="text-sm mt-2 mb-6">Comece a explorar e adicione os profissionais que mais gosta clicando no coração.</p>
          <button onClick={() => setActiveView('search')} className="bg-[#daa520] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#c8961e] transition-colors">
            Procurar Profissionais
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientFavoritesSection;