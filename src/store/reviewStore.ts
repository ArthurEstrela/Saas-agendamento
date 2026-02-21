import { create } from 'zustand';
import { isAxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import type { Review } from '../types';
import { api } from '../lib/api';
import { useUserAppointmentsStore } from './userAppointmentsStore';

const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

interface ReviewState {
  loading: boolean;
  error: string | null;
  submitReview: (appointmentId: string, rating: number, comment: string) => Promise<Review>;
  clearError: () => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  loading: false,
  error: null,

  // ==========================================================================
  // 1. CLIENTE ENVIA A AVALIAÇÃO
  // ==========================================================================
  submitReview: async (appointmentId: string, rating: number, comment: string) => {
    set({ loading: true, error: null });
    try {
      // O CreateReviewRequest do seu Java espera estes dados
      const payload = {
        appointmentId,
        rating,
        comment
      };

      const response = await api.post<Review>('/reviews', payload);
      
      // Mágica do Zustand: Após enviar a review, atualizamos o Histórico do Cliente
      // para que o botão "Avaliar" desapareça da tela imediatamente
      const userAptsStore = useUserAppointmentsStore.getState();
      const updatedAppointments = userAptsStore.appointments.map(apt => 
        apt.id === appointmentId ? { ...apt, reviewId: response.data.id, review: response.data } : apt
      );
      useUserAppointmentsStore.setState({ appointments: updatedAppointments });

      toast.success('Avaliação enviada! Obrigado pelo feedback.');
      set({ loading: false });
      
      return response.data;
    } catch (error) {
      const errMsg = extractErrorMessage(error, 'Erro ao enviar a avaliação.');
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));