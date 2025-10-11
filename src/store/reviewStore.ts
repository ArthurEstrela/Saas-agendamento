// src/store/reviewStore.ts
import { create } from 'zustand';
import { toast } from 'react-hot-toast';
import { addReview, getReviewsForProvider } from '../firebase/reviewService';
import type { Review } from '../types';

interface ReviewState {
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  fetchReviews: (providerId: string) => Promise<void>;
  submitReview: (
    appointmentId: string,
    reviewData: Omit<Review, 'id' | 'createdAt'>
  ) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set) => ({
  reviews: [],
  isLoading: false,
  error: null,

  fetchReviews: async (providerId) => {
    set({ isLoading: true, error: null });
    const promise = getReviewsForProvider(providerId);

    toast.promise(promise, {
      loading: 'Carregando avaliações...',
      // O toast de sucesso é opcional aqui, para não poluir a tela.
      // Pode ser adicionado se fizer sentido no fluxo da sua UI.
      // success: 'Avaliações carregadas!', 
      error: 'Não foi possível carregar as avaliações.',
    });

    try {
      const reviews = await promise;
      set({ reviews, isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      set({ error: errorMessage, isLoading: false });
    }
  },

  submitReview: async (appointmentId, reviewData) => {
    set({ isLoading: true, error: null });
    const promise = addReview(appointmentId, reviewData);

    toast.promise(promise, {
      loading: 'Enviando sua avaliação...',
      success: 'Avaliação enviada com sucesso! Obrigado pelo seu feedback.',
      error: 'Ops! Não foi possível enviar sua avaliação. Tente novamente.',
    });

    try {
      await promise;
      set({ isLoading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      set({ isLoading: false, error: errorMessage });
    }
  },
}));