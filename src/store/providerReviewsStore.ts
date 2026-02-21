import { create } from 'zustand';
import { isAxiosError } from 'axios';
import type { Review, PagedResult } from '../types';
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

interface ProviderReviewsState {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  
  // Paginação
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;

  fetchReviews: (providerId: string, page?: number, size?: number) => Promise<void>;
  clearError: () => void;
}

export const useProviderReviewsStore = create<ProviderReviewsState>((set) => ({
  reviews: [],
  loading: false,
  error: null,
  
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  hasNext: false,

  // ==========================================================================
  // 1. ESTABELECIMENTO BUSCA AS SUAS AVALIAÇÕES (COM PAGINAÇÃO)
  // ==========================================================================
  fetchReviews: async (providerId: string, page = 0, size = 10) => {
    set({ loading: true, error: null });
    try {
      // Endpoint que lista as avaliações no backend. Assumindo que a sua API suporte paginação aqui
      const response = await api.get<PagedResult<Review>>(`/reviews/provider/${providerId}`, {
        params: { page, size }
      });
      
      const { data, totalElements, totalPages, currentPage, hasNext } = response.data;

      set((state) => ({
        // Se for a primeira página, substitui. Se não, adiciona (Infinite Scroll)
        reviews: page === 0 ? data : [...state.reviews, ...data],
        totalElements,
        totalPages,
        currentPage,
        hasNext,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: extractErrorMessage(error, 'Erro ao carregar as avaliações.'), 
        loading: false 
      });
    }
  },

  clearError: () => set({ error: null })
}));