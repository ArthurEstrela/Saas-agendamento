import { useEffect } from "react";
import { useFavoritesStore } from "../../store/favoritesStore"; // ✨ NOVO: Store dedicado a favoritos
import { ClientProfessionalCard } from "./ClientProfessionalCard";
import { Loader2, Heart, HeartCrack } from "lucide-react";

// UI
import { Card, CardContent } from "../ui/card";

export const ClientFavoritesSection = () => {
  // 🔥 Pegamos a lista já processada diretamente do Store!
  const { favorites, loading: isLoading, fetchFavorites } = useFavoritesStore();

  useEffect(() => {
    // Ao montar o componente, pede ao Java a lista completa de estabelecimentos favoritos
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          Meus Favoritos <Heart className="text-red-500 fill-red-500" />
        </h1>
        <p className="text-gray-400 mt-1">Seus profissionais preferidos.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((provider) => (
            <ClientProfessionalCard key={provider.id} provider={provider} />
          ))}
        </div>
      ) : (
        <Card className="bg-gray-900/30 border-dashed border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <HeartCrack size={48} className="mb-4 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-300">
              Nenhum favorito ainda
            </h3>
            <p className="text-gray-500 mt-2">
              Clique no coração nos cards dos profissionais para salvá-los aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};