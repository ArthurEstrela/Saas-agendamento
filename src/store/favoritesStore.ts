// src/store/favoritesStore.ts
import { create } from 'zustand';
import type { ServiceProviderProfile } from '../types';
import { getProfessionalsByIds } from '../firebase/userService';
import { toast } from 'react-hot-toast'; // Importe o toast

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

    const promise = getProfessionalsByIds(professionalIds);

    toast.promise(promise, {
      loading: 'Buscando seus favoritos...',
      success: 'Favoritos carregados!',
      error: 'Não foi possível carregar os favoritos.',
    });

    try {
      const favoriteProfiles = await promise;
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