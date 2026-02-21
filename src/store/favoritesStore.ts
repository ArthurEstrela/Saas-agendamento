import { create } from 'zustand';
import { isAxiosError } from 'axios';
import type { ServiceProviderProfile } from '../types';
import { api } from '../lib/api';

const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

interface FavoritesState {
  favorites: ServiceProviderProfile[]; // Mudámos para receber os dados completos do estabelecimento
  loading: boolean;
  error: string | null;
  
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (providerId: string) => Promise<void>;
  isFavorite: (providerId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  // Diferente do Firestore que só guardava o ID, o backend Java pode mandar a lista completa dos estabelecimentos
  favorites: [],
  loading: false,
  error: null,

  // 1. BUSCAR A LISTA DE FAVORITOS DO CLIENTE LOGADO
  fetchFavorites: async () => {
    set({ loading: true, error: null });
    try {
      // Como o token Bearer tem a identificação do cliente, não precisamos de passar o ID na URL
      const response = await api.get<ServiceProviderProfile[]>('/client/favorites');
      
      set({ favorites: response.data, loading: false });
    } catch (error) {
      set({ 
        error: extractErrorMessage(error, 'Erro ao carregar favoritos.'), 
        loading: false 
      });
    }
  },

  // 2. ADICIONAR / REMOVER FAVORITO (TOGGLE)
  toggleFavorite: async (providerId: string) => {
    const isCurrentlyFavorite = get().isFavorite(providerId);
    
    // Optimistic UI Update: Atualizamos a UI imediatamente para não parecer lento
    if (isCurrentlyFavorite) {
      set((state) => ({ favorites: state.favorites.filter((f) => f.id !== providerId) }));
    } else {
      // Adiciona um "placeholder" temporário até o backend responder
      set((state) => ({ favorites: [...state.favorites, { id: providerId } as ServiceProviderProfile] }));
    }

    try {
      if (isCurrentlyFavorite) {
        await api.delete(`/client/favorites/${providerId}`);
      } else {
        await api.post(`/client/favorites/${providerId}`);
        // Após adicionar, opcionalmente refazemos o fetch para ter os dados completos (logo, nome, etc)
        await get().fetchFavorites(); 
      }
    } catch (error) {
      // Se a API der erro, revertemos o "Optimistic Update" (voltamos ao estado anterior)
      await get().fetchFavorites();
      set({ error: extractErrorMessage(error, 'Erro ao atualizar favorito.') });
    }
  },

  // Função auxiliar para os componentes do React saberem se devem pintar o coração de vermelho
  isFavorite: (providerId: string) => {
    return get().favorites.some((f) => f.id === providerId);
  },
}));