import { create } from 'zustand';
import type { Review } from '../types';
import { getReviewsByProviderId } from '../firebase/reviewService';

interface ProviderReviewsState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  fetchReviews: (providerId: string) => Promise<void>;
}

export const useProviderReviewsStore = create<ProviderReviewsState>((set) => ({
  reviews: [],
  isLoading: false,
  error: null,

  fetchReviews: async (providerId) => {
    set({ isLoading: true, error: null });
    try {
      const reviews = await getReviewsByProviderId(providerId);
      set({ reviews, isLoading: false });
    } catch (err) {
      let errorMessage = "Erro ao buscar as avaliações.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },
}));