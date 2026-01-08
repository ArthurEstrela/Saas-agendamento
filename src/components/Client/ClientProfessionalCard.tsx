import { useMemo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Heart, Star, Scissors } from "lucide-react";
import { useProfileStore } from "../../store/profileStore";
import type { ClientProfile, ServiceProviderProfile } from "../../types";

// UI Components
import { Card, CardContent, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils/cn";

// Interface estendida
interface EnrichedProviderProfile extends ServiceProviderProfile {
  distance?: number;
  categories?: string[];
}

interface Props {
  provider: EnrichedProviderProfile;
}

export const ClientProfessionalCard = ({ provider }: Props) => {
  const { userProfile, toggleFavorite } = useProfileStore();
  const { reviews } = provider;

  // Calcula a média das avaliações
  const reviewSummary = useMemo(() => {
    const totalReviews = reviews?.length || 0;
    if (totalReviews === 0) return { average: 0, count: 0 };
    const average =
      reviews!.reduce((acc, review) => acc + review.rating, 0) / totalReviews;
    return { average, count: totalReviews };
  }, [reviews]);

  // Verifica favorito
  const isClientProfile = userProfile?.role === "client";
  const isFavorited = isClientProfile
    ? (userProfile as ClientProfile).favoriteProfessionals?.includes(
        provider.id
      )
    : false;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(provider.id);
  };

  // Formatação de categoria (pega a primeira ou usa padrão)
  const category = provider.categories?.[0] || provider.areaOfWork || "Geral";
  const initials = provider.businessName.substring(0, 2).toUpperCase();

  return (
    // CORREÇÃO: Link ajustado para o padrão em inglês definido no App.tsx (/schedule)
    <Link
      to={`/schedule/${provider.publicProfileSlug || provider.id}`}
      className="block h-full group"
    >
      <Card className="h-full overflow-hidden border-gray-800 bg-gray-900/40 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] relative">
        {/* --- Botão Favoritar (Absoluto) --- */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 z-20 p-2.5 bg-black/40 backdrop-blur-md rounded-full transition-all duration-300 hover:bg-black/70 group/heart border border-white/10"
          aria-label="Favoritar"
        >
          <Heart
            size={18}
            className={cn(
              "transition-all duration-300",
              isFavorited
                ? "text-red-500 fill-red-500 scale-110"
                : "text-white group-hover/heart:text-red-400"
            )}
          />
        </button>

        {/* --- Área do Banner (Hero) --- */}
        <div className="relative h-40 overflow-hidden">
          {provider.bannerUrl ? (
            <img
              src={provider.bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <Scissors className="text-gray-700 w-12 h-12 opacity-30" />
            </div>
          )}

          {/* Overlay Gradiente */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-90" />

          {/* Badge de Distância (se existir) */}
          {provider.distance !== undefined && (
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm border-none text-xs font-medium text-white gap-1"
            >
              <MapPin size={10} className="text-primary" />{" "}
              {provider.distance.toFixed(1)} km
            </Badge>
          )}
        </div>

        {/* --- Conteúdo --- */}
        <CardContent className="p-5 pt-0 relative">
          {/* Avatar Sobreposto */}
          <div className="-mt-10 mb-3 flex justify-between items-end">
            <Avatar className="h-20 w-20 border-4 border-gray-900 shadow-xl group-hover:border-gray-800 transition-colors">
              <AvatarImage src={provider.logoUrl} alt={provider.businessName} />
              <AvatarFallback className="bg-gray-800 text-lg font-bold text-primary border border-gray-700">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Badge de Nota */}
            <div className="mb-2 flex items-center gap-1 bg-gray-800/80 px-2 py-1 rounded-lg border border-gray-700 shadow-sm">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-bold text-white">
                {reviewSummary.average > 0
                  ? reviewSummary.average.toFixed(1)
                  : "Novo"}
              </span>
              {reviewSummary.count > 0 && (
                <span className="text-xs text-gray-500">
                  ({reviewSummary.count})
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <Badge
                variant="outline"
                className="mb-2 text-[10px] h-5 border-gray-700 text-gray-400 uppercase tracking-wider"
              >
                {category}
              </Badge>
              <h3 className="text-xl font-bold text-white truncate group-hover:text-primary transition-colors">
                {provider.businessName}
              </h3>
            </div>

            <div className="flex items-center text-sm text-gray-400 gap-1.5">
              <MapPin size={14} className="text-gray-500 shrink-0" />
              <span className="truncate">
                {provider.businessAddress?.city
                  ? `${provider.businessAddress.city}, ${provider.businessAddress.state}`
                  : "Localização não informada"}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0">
          <Button
            variant="ghost"
            className="w-full border border-gray-700 bg-gray-800/30 text-gray-300 group-hover:bg-primary group-hover:text-black group-hover:border-primary font-bold transition-all"
          >
            Ver Agenda
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};