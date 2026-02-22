import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchStore } from "../../store/searchStore";
import { useAuthStore } from "../../store/authStore"; // ✨ NOVO: Substitui o profileStore
import { ClientProfessionalCard } from "./ClientProfessionalCard";
import { Loader2, Search, Frown } from "lucide-react";
import { ProviderFilter } from "./ProviderFilter";
import { Link, useLocation } from "react-router-dom";
import type { PaymentMethod, ServiceProviderProfile } from "../../types";
import { cn } from "../../lib/utils/cn";

// UI Components
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

// --- Função de Distância (Mantida) ---
const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
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

// --- Interfaces (Mantidas) ---
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
  // 🔥 Lemos o utilizador diretamente do authStore
  const { user } = useAuthStore();
  const location = useLocation();
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // 🔥 Conectamos ao NOVO SearchStore refatorado
  const { 
    results: rawResults, 
    loading: isLoading, 
    searchProviders, 
    setFilters: setApiFilters 
  } = useSearchStore();

  const [searchTerm, setSearchTerm] = useState("");

  // Default aumentado para 500 (Sem limite) para evitar esconder perfis
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    distance: 500,
    areaOfWork: "all",
    minRating: 0,
    paymentMethods: [],
  });

  const isDashboard = location.pathname.includes("/dashboard");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        (error) => console.error("Erro GPS", error),
      );
    }
    // Faz a primeira busca limpa na montagem
    searchProviders(0);
  }, [searchProviders]);

  const availableAreas = useMemo(
    () =>
      Array.from(
        new Set(rawResults.map((p) => p.areaOfWork).filter(Boolean)),
      ) as string[],
    [rawResults],
  );

  const filteredAndSortedProviders = useMemo(() => {
    let filtered: EnrichedProvider[] = rawResults.map((p) => ({ ...p }));

    if (appliedFilters.areaOfWork !== "all") {
      filtered = filtered.filter(
        (p) => p.areaOfWork === appliedFilters.areaOfWork,
      );
    }
    if (appliedFilters.paymentMethods.length > 0) {
      filtered = filtered.filter(
        (p) =>
          p.paymentMethods &&
          appliedFilters.paymentMethods.every((pm) =>
            p.paymentMethods!.includes(pm),
          ),
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

    if (appliedFilters.minRating > 0) {
      filtered = filtered.filter(
        (p) => (p.averageRating || 0) >= appliedFilters.minRating,
      );
    }

    // Lógica de distância corrigida
    if (userLocation) {
      filtered = filtered.map((provider) => ({
        ...provider,
        distance:
          provider.businessAddress?.lat && provider.businessAddress?.lng
            ? getDistance(
                userLocation.lat,
                userLocation.lng,
                provider.businessAddress.lat,
                provider.businessAddress.lng,
              )
            : Infinity,
      }));

      if (appliedFilters.distance < 500) {
        filtered = filtered.filter(
          (provider) =>
            (provider.distance || Infinity) <= appliedFilters.distance,
        );
      }
    } else {
      filtered = filtered.map((provider) => ({
        ...provider,
        distance: Infinity,
      }));
    }

    return filtered.sort(
      (a, b) => (a.distance || Infinity) - (b.distance || Infinity),
    );
  }, [rawResults, userLocation, appliedFilters]);

  // 🔥 Quando o utilizador clica em "Buscar"
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Atualiza os filtros da API com o nome do barbeiro/serviço e executa a busca
    setApiFilters({ serviceName: searchTerm });
    searchProviders(0); 
  };

  const handleApplyFilters = useCallback(
    (filters: AppliedFilters) => setAppliedFilters(filters),
    [],
  );

  const renderHeader = () => {
    if (user) {
      const firstName = user.name.split(" ")[0];
      return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Olá, <span className="text-primary">{firstName}</span>!
            </h1>
            <p className="text-gray-400">
              Hora de dar um tapa no visual. Quem vamos agendar hoje?
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Encontre o <span className="text-primary">Melhor</span> Serviço
          </h1>
          <p className="text-gray-400 max-w-xl">
            Explore barbeiros e profissionais próximos a você. Veja fotos,
            avaliações e agende em segundos.
          </p>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-sm text-gray-500 mb-1">É um profissional?</p>
          <Link to="/register-type">
            <Button
              variant="outline"
              size="sm"
              className="border-white/10 text-xs"
            >
              Criar conta Business
            </Button>
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "space-y-8 transition-all duration-300",
        !isDashboard && "container mx-auto px-4 pt-24 pb-12 min-h-screen",
        isDashboard && "h-full w-full",
      )}
    >
      <div className="space-y-8">
        {renderHeader()}

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <form onSubmit={handleSearch} className="flex-grow relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, barbearia ou serviço..."
              className="pl-10 h-12 bg-[#18181b] border-white/10 focus-visible:ring-primary focus-visible:border-primary/50 text-base placeholder:text-gray-600 transition-all shadow-sm"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-black hover:bg-primary/90 h-8 px-4 font-bold"
            >
              Buscar
            </Button>
          </form>

          <div className="shrink-0">
            <ProviderFilter
              onApplyFilters={handleApplyFilters}
              availableAreas={availableAreas}
              initialFilters={appliedFilters}
            />
          </div>
        </div>
      </div>

      <div className="min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-gray-500 text-sm animate-pulse">
              Buscando profissionais...
            </p>
          </div>
        ) : filteredAndSortedProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProviders.map((provider) => (
              <ClientProfessionalCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <Card className="bg-[#18181b] border-dashed border-white/10 mt-8">
            <CardContent className="flex flex-col items-center justify-center h-64 text-gray-500 text-center p-6">
              <div className="bg-white/5 p-4 rounded-full mb-4">
                <Frown size={40} className="opacity-50" />
              </div>
              <h3 className="text-xl font-bold text-gray-300 mb-2">
                Nenhum profissional encontrado
              </h3>
              <p className="text-sm max-w-xs mx-auto text-gray-500">
                Não encontramos resultados para "{searchTerm}". Tente buscar por
                outros termos ou aumente a distância no filtro.
              </p>
              <Button
                variant="link"
                className="text-primary mt-4"
                onClick={() => {
                  setSearchTerm("");
                  setApiFilters({ serviceName: undefined }); // Limpa o filtro na API
                  searchProviders(0); // Refaz a busca
                  setAppliedFilters({ ...appliedFilters, distance: 500 });
                }}
              >
                Limpar filtros e buscar novamente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {!user && !isLoading && filteredAndSortedProviders.length > 0 && (
        <div className="mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-400 text-sm mb-4">Gostou do que viu?</p>
          <Link to="/login">
            <Button
              variant="outline"
              className="border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
            >
              Fazer Login para Agendar
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};