import { create } from 'zustand';
import type { ServiceProviderProfile } from '../types';
import { getProfessionalsByIds } from '../firebase/userService';

interface FavoritesState {
  favorites: ServiceProviderProfile[];
  isLoading: boolean;
  error: string | null;
  fetchFavorites: (professionalIds: string[]) => Promise<void>;
}

export const useFavoritesStore = create<FavoritesState>((set) => ({
  favorites: [],
  isLoading: false,
  error: null,

  fetchFavorites: async (professionalIds) => {
    if (!professionalIds || professionalIds.length === 0) {
      set({ favorites: [], isLoading: false });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const favoriteProfiles = await getProfessionalsByIds(professionalIds);
      set({ favorites: favoriteProfiles, isLoading: false });
    } catch (err) {
      let errorMessage = "Erro ao buscar favoritos.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },
}));