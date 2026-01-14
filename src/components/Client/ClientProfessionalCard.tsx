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
    e.preventDefault(); // Evita navegar para o perfil
    e.stopPropagation();
    toggleFavorite(provider.id);
  };

  // Formatação de categoria
  const category = provider.categories?.[0] || provider.areaOfWork || "Geral";
  const initials = provider.businessName.substring(0, 2).toUpperCase();

  return (
    <Link
      to={`/schedule/${provider.publicProfileSlug || provider.id}`}
      className="block h-full group touch-manipulation"
    >
      <Card 
        className={cn(
          "h-full overflow-hidden relative transition-all duration-300",
          // Mobile: Fundo sólido (Performance)
          "bg-[#18181b] border-white/5", 
          // Desktop: Efeito vidro e hover
          "md:bg-gray-900/40 md:backdrop-blur-md md:hover:border-primary/50 md:hover:-translate-y-1 md:hover:shadow-2xl"
        )}
      >
        {/* --- Botão Favoritar (Otimizado) --- */}
        <button
          onClick={handleFavoriteClick}
          className={cn(
            "absolute top-3 right-3 z-20 p-2.5 rounded-full transition-all duration-200 border group/heart touch-manipulation active:scale-90",
            // Mobile: Fundo escuro sólido / Desktop: Blur
            "bg-black/60 border-white/10 md:backdrop-blur-md hover:bg-black/80",
            isFavorited ? "border-red-500/30" : "border-white/10"
          )}
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
        <div className="relative h-36 md:h-40 overflow-hidden bg-gray-900">
          {provider.bannerUrl ? (
            <img
              src={provider.bannerUrl}
              alt="Banner"
              loading="lazy" // Carregamento preguiçoso
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center">
              <Scissors className="text-zinc-700 w-10 h-10 opacity-30" />
            </div>
          )}

          {/* Overlay Gradiente Suave */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#18181b] via-transparent to-black/30 opacity-80 md:opacity-60" />

          {/* Badge de Distância */}
          {provider.distance !== undefined && (
            <Badge
              variant="secondary"
              className="absolute top-3 left-3 bg-black/70 border-none text-[10px] font-medium text-white gap-1 px-2 h-6"
            >
              <MapPin size={10} className="text-primary" />
              {provider.distance.toFixed(1)} km
            </Badge>
          )}
        </div>

        {/* --- Conteúdo --- */}
        <CardContent className="p-4 pt-0 md:p-5 md:pt-0 relative">
          
          {/* Avatar e Nota */}
          <div className="-mt-9 md:-mt-10 mb-3 flex justify-between items-end">
            <Avatar className="h-16 w-16 md:h-20 md:w-20 border-[3px] md:border-4 border-[#18181b] shadow-lg bg-zinc-800 group-hover:border-zinc-800 transition-colors">
              <AvatarImage 
                src={provider.logoUrl} 
                alt={provider.businessName} 
                className="object-cover"
              />
              <AvatarFallback className="bg-zinc-800 text-base md:text-lg font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Badge de Nota Compacto */}
            <div className="mb-1.5 md:mb-2 flex items-center gap-1 bg-zinc-800/90 px-2 py-1 rounded-lg border border-white/5 shadow-sm">
              <Star size={12} className="text-amber-400 fill-amber-400 md:w-3.5 md:h-3.5" />
              <span className="text-xs md:text-sm font-bold text-white">
                {reviewSummary.average > 0
                  ? reviewSummary.average.toFixed(1)
                  : "Novo"}
              </span>
              {reviewSummary.count > 0 && (
                <span className="text-[10px] md:text-xs text-zinc-500">
                  ({reviewSummary.count})
                </span>
              )}
            </div>
          </div>

          {/* Textos */}
          <div className="space-y-1.5 md:space-y-2">
            <div>
              <Badge
                variant="outline"
                className="mb-1.5 text-[10px] h-5 border-white/10 text-zinc-400 uppercase tracking-wider bg-white/5"
              >
                {category}
              </Badge>
              <h3 className="text-lg md:text-xl font-bold text-white truncate leading-tight group-hover:text-primary transition-colors">
                {provider.businessName}
              </h3>
            </div>

            <div className="flex items-center text-xs md:text-sm text-zinc-400 gap-1.5">
              <MapPin size={12} className="text-zinc-600 shrink-0 md:w-3.5 md:h-3.5" />
              <span className="truncate">
                {provider.businessAddress?.city
                  ? `${provider.businessAddress.city}, ${provider.businessAddress.state}`
                  : "Localização não informada"}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 md:p-5 md:pt-0">
          <Button
            variant="outline"
            className="w-full h-9 md:h-10 text-xs md:text-sm border-white/10 bg-white/5 text-zinc-300 group-hover:bg-primary group-hover:text-black group-hover:border-primary font-bold transition-all shadow-none"
          >
            Ver Agenda
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};