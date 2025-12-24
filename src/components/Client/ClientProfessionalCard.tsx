import { Link } from "react-router-dom";
import type { ClientProfile, ServiceProviderProfile } from "../../types";
import { MapPin, Sparkles, Heart, Star } from "lucide-react";
import { useProfileStore } from "../../store/profileStore";
import { useMemo } from "react";

// 1. CORREÇÃO: Estender a interface para incluir a propriedade opcional 'distance'
interface EnrichedProviderProfile extends ServiceProviderProfile {
  distance?: number;
}

interface Props {
  provider: EnrichedProviderProfile; // Usar a interface estendida aqui
}

const StarRating = ({ rating, count }: { rating: number; count: number }) => {
  if (count === 0) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Star size={16} className="text-gray-600" />
        <span className="text-xs text-gray-500">Nenhuma avaliação</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={
              i < Math.round(rating)
                ? "text-amber-400 fill-amber-400"
                : "text-gray-600"
            }
          />
        ))}
      </div>
      <span className="text-xs text-gray-400">
        {rating.toFixed(1)} ({count})
      </span>
    </div>
  );
};

export const ClientProfessionalCard = ({ provider }: Props) => {
  const { reviews } = provider;

  // Calcula a média das avaliações aqui mesmo no componente
  const reviewSummary = useMemo(() => {
    const totalReviews = reviews?.length || 0;
    if (totalReviews === 0) {
      return { average: 0, count: 0 };
    }
    const average =
      reviews!.reduce((acc, review) => acc + review.rating, 0) / totalReviews; // Use o '!' se necessário ou verifique se reviews existe antes
    return { average, count: totalReviews };
  }, [reviews]);

  const { userProfile, toggleFavorite } = useProfileStore();
  const isClientProfile = userProfile?.role === "client";

  // Verifica se o provedor atual está na lista de favoritos do cliente
  const isFavorited = isClientProfile
    ? (userProfile as ClientProfile).favoriteProfessionals?.includes(
        provider.id
      )
    : false;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Impede a navegação ao clicar no coração
    e.stopPropagation(); // Impede que o clique se propague para o Link
    toggleFavorite(provider.id);
  };

  return (
    <div className="relative bg-black/30 rounded-2xl overflow-hidden group border border-transparent transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-500">
      {/* Botão de Favoritar */}
      <button
        onClick={handleFavoriteClick}
        className="absolute top-4 right-4 z-10 p-2 bg-gray-900/50 rounded-full transition-all duration-300 hover:bg-red-500/20"
        aria-label="Adicionar aos favoritos"
      >
        <Heart
          size={20}
          className={`transition-all ${
            isFavorited ? "text-red-500 fill-current" : "text-white"
          }`}
        />
      </button>

      <Link to={`/agendar/${provider.publicProfileSlug}`} className="block">
        {/* Imagem/Logo */}
        <div className="h-40 bg-gray-800 flex items-center justify-center">
          {provider.logoUrl ? (
            <img
              src={provider.logoUrl}
              alt={provider.businessName}
              className="h-full w-full object-cover"
            />
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
          <StarRating
            rating={reviewSummary.average}
            count={reviewSummary.count}
          />
          <div className="flex items-center text-gray-500 mt-4 text-xs">
            <MapPin size={14} className="mr-2 flex-shrink-0" />
            <span>
              {`${provider.businessAddress.city}, ${provider.businessAddress.state}`}
              {/* 2. Agora o TS aceita provider.distance porque estendemos a interface */}
              {provider.distance !== undefined && ` - ${provider.distance.toFixed(1)} km`}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
};