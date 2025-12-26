import { useState, useEffect } from "react";
import { useProfileStore } from "../../store/profileStore";
import { getProfessionalsByIds } from "../../firebase/userService";
import type {
  ServiceProviderProfile,
  ClientProfile,
  Review,
} from "../../types";
import { ClientProfessionalCard } from "./ClientProfessionalCard";
import { Loader2, Heart, HeartCrack } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";

// UI
import { Card, CardContent } from "../ui/card";

export const ClientFavoritesSection = () => {
  const { userProfile } = useProfileStore();
  const [favoriteProviders, setFavoriteProviders] = useState<
    ServiceProviderProfile[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (userProfile && userProfile.role === "client") {
        const clientProfile = userProfile as ClientProfile;
        const favoriteIds = clientProfile.favoriteProfessionals || [];

        if (favoriteIds.length > 0) {
          try {
            let providers = await getProfessionalsByIds(favoriteIds);
            providers = await Promise.all(
              providers.map(async (provider) => {
                const q = query(
                  collection(db, "reviews"),
                  where("serviceProviderId", "==", provider.id)
                );
                const snap = await getDocs(q);
                return {
                  ...provider,
                  reviews: snap.docs.map((d) => d.data() as Review),
                };
              })
            );
            setFavoriteProviders(providers);
          } catch (error) {
            console.error("Erro ao buscar favoritos:", error);
          }
        } else {
          setFavoriteProviders([]);
        }
      }
      setIsLoading(false);
    };
    fetchFavorites();
  }, [userProfile]);

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
      ) : favoriteProviders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favoriteProviders.map((provider) => (
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
