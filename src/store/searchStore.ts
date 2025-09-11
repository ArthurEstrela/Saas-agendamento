import { create } from 'zustand';
import type { ServiceProviderProfile } from '../types';
import { searchServiceProviders } from '../firebase/userService';

interface SearchState {
  results: ServiceProviderProfile[];
  isLoading: boolean;
  error: string | null;
  search: (term: string) => Promise<void>;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  results: [],
  isLoading: false,
  error: null,

  search: async (term) => {
    set({ isLoading: true, error: null });
    try {
      const providers = await searchServiceProviders(term);
      set({ results: providers, isLoading: false });
    } catch (err) {
      let errorMessage = "Erro ao realizar a busca.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      set({ error: errorMessage, isLoading: false, results: [] });
    }
  },

  clearSearch: () => {
    set({ results: [], isLoading: false, error: null });
  },
}));