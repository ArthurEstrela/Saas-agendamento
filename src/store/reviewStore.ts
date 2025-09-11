import { create } from 'zustand';
import { addReviewToAppointment } from '../firebase/reviewService';
import type { Review } from '../types';

interface ReviewState {
  isSubmitting: boolean;
  error: string | null;
  submitReview: (
    appointmentId: string,
    reviewData: Omit<Review, 'id' | 'createdAt'>
  ) => Promise<{ success: boolean }>;
}

export const useReviewStore = create<ReviewState>((set) => ({
  isSubmitting: false,
  error: null,

  submitReview: async (appointmentId, reviewData) => {
    set({ isSubmitting: true, error: null });
    try {
      await addReviewToAppointment(appointmentId, reviewData);
      set({ isSubmitting: false });
      return { success: true };
    } catch (err: unknown) {
      let errorMessage = "Falha ao enviar avaliação.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      set({ isSubmitting: false, error: errorMessage });
      return { success: false };
    }
  },
}));