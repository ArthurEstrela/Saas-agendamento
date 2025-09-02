// src/store/reviewStore.ts

import { create } from 'zustand';
import { addReview } from '../firebase/reviewService';
import { useAuthStore } from './authStore'; // Precisaremos para pegar os dados do usuário
import type { Review } from '../types'; // Certifique-se de ter um tipo 'Review' em 'types.ts'

// Este é um tipo base para os dados que o formulário envia.
// O 'Review' completo terá mais dados.
type ReviewFormData = Omit<Review, 'id' | 'createdAt' | 'clientName' | 'clientPhotoURL'>;

interface ReviewState {
  isSubmitting: boolean;
  error: string | null;
  submitReview: (reviewData: ReviewFormData) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set) => ({
  isSubmitting: false,
  error: null,
  submitReview: async (reviewData) => {
    set({ isSubmitting: true, error: null });

    // Buscamos o perfil do usuário logado diretamente do authStore
    const userProfile = useAuthStore.getState().userProfile;
    if (!userProfile) {
      const errorMessage = "Usuário não autenticado para enviar avaliação.";
      console.error(errorMessage);
      set({ isSubmitting: false, error: errorMessage });
      throw new Error(errorMessage);
    }

    try {
      const fullReviewData: Omit<Review, 'id' | 'createdAt'> = {
        ...reviewData,
        clientName: userProfile.displayName || 'Anônimo',
        clientPhotoURL: userProfile.photoURL || '',
      };

      await addReview(
        reviewData.serviceProviderId, 
        fullReviewData, 
        reviewData.appointmentId
      );

      set({ isSubmitting: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro desconhecido.";
      console.error("Erro ao submeter avaliação:", error);
      set({ isSubmitting: false, error: errorMessage });
      throw error;
    }
  },
}));