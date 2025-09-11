import { useEffect } from 'react';
import { useProfileStore } from '../../store/profileStore';
import type { ClientProfile } from '../../types';
import { ClientProfessionalCard } from './ClientProfessionalCard'; // Vamos atualizar este card a seguir
import { useFavoritesStore } from '../../firebase/favoritesStore';

export const ClientFavoritesSection = () => {
  const { userProfile } = useProfileStore();
  const { favorites, isLoading, error, fetchFavorites } = useFavoritesStore();

  const favoriteIds = (userProfile as ClientProfile)?.favoriteProfessionals || [];

  useEffect(() => {
    fetchFavorites(favoriteIds);
  }, [fetchFavorites, favoriteIds.join(',')]); // O .join(',') é um truque para estabilizar a dependência do array

  const renderContent = () => {
    if (isLoading) {
      // Aqui você usaria skeletons de ProfessionalCard
      return <div>Carregando favoritos...</div>;
    }
    if (error) {
      return <div className="text-red-500 text-center">{error}</div>;
    }
    if (favorites.length === 0) {
      return <div className="text-center text-gray-500">Você ainda não tem profissionais favoritos.</div>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((prof) => (
          <ClientProfessionalCard key={prof.id} professional={prof} />
        ))}
      </div>
    );
  };

  return (
    <section>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Meus Favoritos</h1>
      {renderContent()}
    </section>
  );
};