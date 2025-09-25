import { useState, useEffect, useMemo } from "react";
import { useSearchStore } from "../../store/searchStore";
import { ClientProfessionalCard } from "./ClientProfessionalCard";
import { Loader2, Search, Frown } from "lucide-react";
import { useProfileStore } from "../../store/profileStore";

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

export const ClientSearchSection = () => {
  const { userProfile } = useProfileStore();
  const [userLocation, setUserLocation] = useState(null);

  const { results, isLoading, search } = useSearchStore();

  const [searchTerm, setSearchTerm] = useState("");

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
            }
        );
        search('');
    }, [search]);

    const providersWithDistance = useMemo(() => {
        if (!userLocation) return results;
        return results
            .map(provider => ({
                ...provider,
                distance: provider.businessAddress.lat ? getDistance(
                    userLocation.lat,
                    userLocation.lng,
                    provider.businessAddress.lat,
                    provider.businessAddress.lng
                ) : Infinity,
            }))
            .sort((a, b) => a.distance - b.distance);
    }, [results, userLocation]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(searchTerm);
  };

  const WelcomeMessage = () => {
    const firstName = userProfile?.name.split(" ")[0];
    return (
      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
        Bem-vindo, <span className="text-amber-400">{firstName}</span>!
      </h1>
    );
  };

  return (
    <div>
      {/* Cabeçalho e Barra de Busca */}
      <div className="mb-10">
        <WelcomeMessage />
        <p className="text-md sm:text-lg text-gray-400">
          Encontre os melhores profissionais para o seu estilo.
        </p>

        <form onSubmit={handleSearch} className="mt-8 max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por barbearias, salões, manicures..."
              className="w-full bg-black/30 text-white placeholder-gray-500 rounded-full py-4 pl-6 pr-16 border-2 border-transparent focus:border-amber-500 focus:ring-0 transition-all duration-300 text-base"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-amber-500 rounded-full hover:bg-amber-600 transition-colors"
            >
              <Search className="text-gray-900" size={20} />
            </button>
          </div>
        </form>
      </div>

      {/* Grid de Resultados */}
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-amber-500" size={48} />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {providersWithDistance.map((provider) => (
              <ClientProfessionalCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-black/20 rounded-2xl">
            <Frown size={48} className="mb-4" />
            <h3 className="text-xl font-semibold text-gray-300">
              Nenhum resultado encontrado
            </h3>
            <p>Tente ajustar os termos da sua busca.</p>
          </div>
        )}
      </div>
    </div>
  );
};