import { useState, useEffect } from 'react';
import { useProfileStore } from '../../store/profileStore';
import { getProfessionalsByIds } from '../../firebase/userService';
import type { ServiceProviderProfile, ClientProfile } from '../../types';
import { ClientProfessionalCard } from './ClientProfessionalCard';
import { Loader2, HeartCrack } from 'lucide-react';

export const ClientFavoritesSection = () => {
  const { userProfile } = useProfileStore();
  const [favoriteProviders, setFavoriteProviders] = useState<ServiceProviderProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (userProfile && userProfile.role === 'client') {
        const clientProfile = userProfile as ClientProfile;
        const favoriteIds = clientProfile.favoriteProfessionals || [];

        if (favoriteIds.length > 0) {
          try {
            const providers = await getProfessionalsByIds(favoriteIds);
            setFavoriteProviders(providers);
          } catch (error) {
            console.error("Erro ao buscar perfis favoritos:", error);
          }
        } else {
            // Se não há IDs, a lista de favoritos está vazia
            setFavoriteProviders([]);
        }
      }
      setIsLoading(false);
    };

    fetchFavorites();
  }, [userProfile]); // Re-executa quando o perfil do usuário muda (ex: ele remove um favorito)

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">Meus Favoritos</h1>
        <p className="text-lg text-gray-400 mt-2">
          Seus profissionais preferidos, sempre à mão para o próximo agendamento.
        </p>
      </div>

      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-amber-500" size={48} />
          </div>
        ) : favoriteProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteProviders.map((provider) => (
              <ClientProfessionalCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-black/20 rounded-2xl">
            <HeartCrack size={48} className="mb-4" />
            <h3 className="text-xl font-semibold text-gray-300">Nenhum favorito ainda</h3>
            <p>Clique no coração nos cards dos profissionais para adicioná-los aqui.</p>
          </div>
        )}
      </div>
    </div>
  );
};