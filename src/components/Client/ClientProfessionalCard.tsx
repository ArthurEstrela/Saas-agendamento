import { Link } from 'react-router-dom';
import type { ServiceProviderProfile } from '../../types';
import { MapPin, Sparkles, Heart } from 'lucide-react';
import { useProfileStore } from '../../store/profileStore'; // 1. Importe a profileStore

interface Props {
  provider: ServiceProviderProfile;
}

export const ClientProfessionalCard = ({ provider }: Props) => {
  // 2. Acesse a store para verificar os favoritos e chamar a action
  const { userProfile, toggleFavorite } = useProfileStore();
  const isClientProfile = userProfile?.role === 'client';
  
  // Verifica se o provedor atual está na lista de favoritos do cliente
  const isFavorited = isClientProfile 
    ? (userProfile as any).favoriteProfessionals?.includes(provider.id) 
    : false;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Impede a navegação ao clicar no coração
    e.stopPropagation(); // Impede que o clique se propague para o Link
    toggleFavorite(provider.id);
  };

  return (
    <div className="relative bg-black/30 rounded-2xl overflow-hidden group border border-transparent transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-500">
      {/* 3. Botão de Favoritar */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-4 right-4 z-10 p-2 bg-gray-900/50 rounded-full transition-all duration-300 hover:bg-red-500/20"
        aria-label="Adicionar aos favoritos"
      >
        <Heart 
          size={20}
          className={`transition-all ${isFavorited ? 'text-red-500 fill-current' : 'text-white'}`} 
        />
      </button>
      
      <Link to={`/agendar/${provider.publicProfileSlug}`} className="block">
        {/* Imagem/Logo */}
        <div className="h-40 bg-gray-800 flex items-center justify-center">
          {provider.logoUrl ? (
            <img src={provider.logoUrl} alt={provider.businessName} className="h-full w-full object-cover" />
          ) : (
            <Sparkles className="text-amber-500/50" size={48} />
          )}
        </div>

        {/* Informações */}
        <div className="p-5">
          <h3 className="text-xl font-bold text-white truncate group-hover:text-amber-400 transition-colors">
            {provider.businessName}
          </h3>
          <p className="text-gray-400 mt-1 text-sm">{provider.areaOfWork}</p>
          
          <div className="flex items-center text-gray-500 mt-4 text-xs">
            <MapPin size={14} className="mr-2 flex-shrink-0" />
            <span>{`${provider.businessAddress.city}, ${provider.businessAddress.state}`}</span>
          </div>
        </div>
      </Link>
    </div>
  );
};