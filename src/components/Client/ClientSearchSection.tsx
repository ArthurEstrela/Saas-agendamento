// src/components/Client/ClientSearchSection.tsx
import { useState, useEffect, useMemo, useCallback } from "react"; // Adicionei useCallback
import { useSearchStore } from "../../store/searchStore";
import { ClientProfessionalCard } from "./ClientProfessionalCard";
import { Loader2, Search, Frown } from "lucide-react";
import { useProfileStore } from "../../store/profileStore";
import { ProviderFilter } from './ProviderFilter'; // <<<--- 1. Importar o filtro
import type { ServiceProviderProfile } from "../../types"; // Importar o tipo

// ... (função getDistance permanece a mesma) ...
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distância em km
};


// Tipagem para os filtros aplicados
interface AppliedFilters {
  distance: number;
  areaOfWork: string;
  minRating: number;
  paymentMethods: string[]; // Usando string[] para simplificar, pode usar PaymentMethod[] também
}

export const ClientSearchSection = () => {
  const { userProfile } = useProfileStore();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { results: rawResults, isLoading, search } = useSearchStore(); // Renomeado para rawResults

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({ // <<<--- 2. Estado para os filtros
      distance: 50,
      areaOfWork: 'all',
      minRating: 0,
      paymentMethods: [],
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Erro ao obter localização", error);
        // Considerar mostrar um feedback ao usuário aqui
      }
    );
    search(''); // Busca inicial sem termo
  }, [search]);

  // <<<--- 3. Memoizar as áreas de atuação disponíveis
  const availableAreas = useMemo(() => {
      const areas = new Set(rawResults.map(p => p.areaOfWork).filter(Boolean));
      return Array.from(areas) as string[];
  }, [rawResults]);

  // <<<--- 4. Aplicar filtros + cálculo de distância + ordenação
  const filteredAndSortedProviders = useMemo(() => {
    let filtered = rawResults;

    // Aplica filtro de Área de Atuação
    if (appliedFilters.areaOfWork !== 'all') {
      filtered = filtered.filter(p => p.areaOfWork === appliedFilters.areaOfWork);
    }

    // Aplica filtro de Pagamento
    if (appliedFilters.paymentMethods.length > 0) {
      filtered = filtered.filter(p =>
        appliedFilters.paymentMethods.every(pm => p.paymentMethods?.includes(pm as any)) // Cast 'as any' ou importe PaymentMethod
      );
    }

     // Calcula a média das avaliações ANTES de filtrar por ela
     const providersWithAvgRating = filtered.map(provider => {
        const totalReviews = provider.reviews?.length || 0;
        const average = totalReviews > 0
            ? provider.reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
            : 0;
        return { ...provider, averageRating: average };
     });

    // Aplica filtro de Avaliação Mínima
    if (appliedFilters.minRating > 0) {
        filtered = providersWithAvgRating.filter(p => p.averageRating >= appliedFilters.minRating);
    } else {
        filtered = providersWithAvgRating; // Mantém todos se minRating for 0
    }


    // Calcula distância e aplica filtro de distância
    if (userLocation) {
        filtered = filtered
            .map(provider => ({
                ...provider,
                distance: provider.businessAddress.lat ? getDistance(
                    userLocation.lat,
                    userLocation.lng,
                    provider.businessAddress.lat,
                    provider.businessAddress.lng
                ) : Infinity,
            }))
            .filter(provider => provider.distance <= appliedFilters.distance); // Filtra pela distância máxima
    } else {
        // Se não houver localização, adiciona 'distance: Infinity' para manter a estrutura
         filtered = filtered.map(provider => ({ ...provider, distance: Infinity }));
    }


    // Ordena por distância (pode adicionar mais opções de ordenação depois)
    return filtered.sort((a, b) => a.distance - b.distance);

  }, [rawResults, userLocation, appliedFilters]); // Depende dos resultados brutos, localização e filtros


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(searchTerm); // A busca principal ainda usa o termo
  };

   // <<<--- 5. Callback para receber os filtros do componente filho
  const handleApplyFilters = useCallback((filters: AppliedFilters) => {
    setAppliedFilters(filters);
  }, []);

  const WelcomeMessage = () => {
    const firstName = userProfile?.name.split(" ")[0];
    return (
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
        Bem-vindo, <span className="text-amber-400">{firstName || 'Cliente'}</span>!
      </h1>
    );
  };

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-10">
        <WelcomeMessage />
        <p className="text-md sm:text-lg text-gray-400">
          Encontre os melhores profissionais para o seu estilo.
        </p>

        {/* Barra de Busca e Botão de Filtro */}
        <div className="mt-8 max-w-3xl flex items-center gap-4">
          <form onSubmit={handleSearch} className="flex-grow">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, serviço (ex: barbearia)..."
                className="w-full bg-black/30 text-white placeholder-gray-500 rounded-lg py-3 pl-12 pr-16 border-2 border-transparent focus:border-amber-500 focus:ring-0 transition-all duration-300 text-base" // Ajustado padding e borda
              />
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors" // Ajustado padding e borda
              >
                <Search className="text-gray-900" size={20} />
              </button>
            </div>
          </form>
          {/* <<<--- 6. Renderizar o componente de filtro */}
          <ProviderFilter onApplyFilters={handleApplyFilters} availableAreas={availableAreas} initialFilters={appliedFilters}/>
        </div>
      </div>

      {/* Grid de Resultados */}
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-amber-500" size={48} />
          </div>
        ) : filteredAndSortedProviders.length > 0 ? ( // <<<--- 7. Usar a lista filtrada
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProviders.map((provider) => ( // <<<--- 7. Usar a lista filtrada
              <ClientProfessionalCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-black/20 rounded-2xl">
            <Frown size={48} className="mb-4" />
            <h3 className="text-xl font-semibold text-gray-300">
              Nenhum resultado encontrado
            </h3>
            <p>Tente ajustar os termos da busca ou os filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
};