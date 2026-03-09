import { create } from "zustand";
import { isAxiosError } from "axios";
import type { Review, PagedResult } from "../types";
import { api } from "../lib/api";

const extractErrorMessage = (
  error: unknown,
  defaultMessage: string,
): string => {
  if (isAxiosError(error)) {
    return (
      error.response?.data?.detail ||
      error.response?.data?.message ||
      defaultMessage
    );
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

  fetchReviews: (
    providerId: string,
    page?: number,
    size?: number,
  ) => Promise<void>;
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
      const response = await api.get<PagedResult<Review>>(
        `/reviews/provider/${providerId}`,
        {
          params: { page, size },
        },
      );

      // ✨ CORREÇÃO AQUI: O backend envia 'items' e 'page', não 'data' e 'currentPage'
      const {
        items,
        totalElements,
        totalPages,
        page: responsePage,
      } = response.data;

      // Garante que é um array para não quebrar o .length no React
      const fetchedReviews = items || [];

      set((state) => ({
        reviews:
          page === 0 ? fetchedReviews : [...state.reviews, ...fetchedReviews],
        totalElements: totalElements || 0,
        totalPages: totalPages || 0,
        currentPage: responsePage || 0,
        // Calcula o hasNext (se a página atual for menor que o total de páginas - 1)
        hasNext: responsePage < totalPages - 1,
        loading: false,
      }));
    } catch (error) {
      set({
        error: extractErrorMessage(error, "Erro ao carregar as avaliações."),
        loading: false,
        reviews: [], // Fallback de segurança em caso de erro 404/500
      });
    }
  },

  clearError: () => set({ error: null }),
}));
