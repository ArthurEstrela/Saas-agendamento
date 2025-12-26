import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchStore } from "../../store/searchStore";
import { ClientProfessionalCard } from "./ClientProfessionalCard";
import { Loader2, Search, Frown } from "lucide-react";
import { useProfileStore } from "../../store/profileStore";
import { ProviderFilter } from "./ProviderFilter";
import type { PaymentMethod, ServiceProviderProfile } from "../../types";

// UI
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

// Função de distância
const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface AppliedFilters {
  distance: number;
  areaOfWork: string;
  minRating: number;
  paymentMethods: PaymentMethod[];
}

interface EnrichedProvider extends ServiceProviderProfile {
  distance?: number;
  averageRating?: number;
}

export const ClientSearchSection = () => {
  const { userProfile } = useProfileStore();
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const { results: rawResults, isLoading, search } = useSearchStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    distance: 50,
    areaOfWork: "all",
    minRating: 0,
    paymentMethods: [],
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => console.error("Erro ao obter localização", error)
    );
    search("");
  }, [search]);

  const availableAreas = useMemo(
    () =>
      Array.from(
        new Set(rawResults.map((p) => p.areaOfWork).filter(Boolean))
      ) as string[],
    [rawResults]
  );

  const filteredAndSortedProviders = useMemo(() => {
    let filtered: EnrichedProvider[] = rawResults.map((p) => ({ ...p }));

    if (appliedFilters.areaOfWork !== "all")
      filtered = filtered.filter(
        (p) => p.areaOfWork === appliedFilters.areaOfWork
      );
    if (appliedFilters.paymentMethods.length > 0) {
      filtered = filtered.filter(
        (p) =>
          p.paymentMethods &&
          appliedFilters.paymentMethods.every((pm) =>
            p.paymentMethods!.includes(pm)
          )
      );
    }

    filtered = filtered.map((provider) => {
      const totalReviews = provider.reviews?.length || 0;
      const average =
        totalReviews > 0
          ? provider.reviews!.reduce((acc, review) => acc + review.rating, 0) /
            totalReviews
          : 0;
      return { ...provider, averageRating: average };
    });

    if (appliedFilters.minRating > 0)
      filtered = filtered.filter(
        (p) => (p.averageRating || 0) >= appliedFilters.minRating
      );

    if (userLocation) {
      filtered = filtered
        .map((provider) => ({
          ...provider,
          distance:
            provider.businessAddress?.lat && provider.businessAddress?.lng
              ? getDistance(
                  userLocation.lat,
                  userLocation.lng,
                  provider.businessAddress.lat,
                  provider.businessAddress.lng
                )
              : Infinity,
        }))
        .filter(
          (provider) =>
            (provider.distance || Infinity) <= appliedFilters.distance
        );
    } else {
      filtered = filtered.map((provider) => ({
        ...provider,
        distance: Infinity,
      }));
    }

    return filtered.sort(
      (a, b) => (a.distance || Infinity) - (b.distance || Infinity)
    );
  }, [rawResults, userLocation, appliedFilters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(searchTerm);
  };
  const handleApplyFilters = useCallback(
    (filters: AppliedFilters) => setAppliedFilters(filters),
    []
  );

  const firstName = userProfile?.name.split(" ")[0] || "Cliente";

  return (
    <div className="space-y-8">
      {/* Header e Busca */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Bem-vindo, <span className="text-primary">{firstName}</span>!
          </h1>
          <p className="text-gray-400">
            Encontre os melhores profissionais para o seu estilo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 max-w-4xl">
          <form onSubmit={handleSearch} className="flex-grow relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, barbearia, serviço..."
              className="pl-10 h-12 bg-gray-900/50 border-gray-700 focus-visible:ring-primary text-base"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-black hover:bg-primary/90 h-8"
            >
              Buscar
            </Button>
          </form>

          <ProviderFilter
            onApplyFilters={handleApplyFilters}
            availableAreas={availableAreas}
            initialFilters={appliedFilters}
          />
        </div>
      </div>

      {/* Resultados */}
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : filteredAndSortedProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProviders.map((provider) => (
              <ClientProfessionalCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <Card className="bg-gray-900/40 border-dashed border-gray-800">
            <CardContent className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Frown size={48} className="mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-gray-300">
                Nenhum resultado encontrado
              </h3>
              <p className="text-sm">
                Tente ajustar os termos da busca ou os filtros.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
