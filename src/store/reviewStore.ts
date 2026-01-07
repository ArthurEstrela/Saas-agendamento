import { create } from "zustand";
import { toast } from "react-hot-toast";
import { addReview, getReviewsForProvider } from "../firebase/reviewService";
import type { Review } from "../types";

interface ReviewState {
  reviews: Review[];
  isLoading: boolean; // Usado para carregar a lista de reviews
  isSubmitting: boolean; // Usado para o botão de enviar review
  error: string | null;

  fetchReviews: (providerId: string) => Promise<void>;
  submitReview: (
    appointmentId: string,
    // Ajustei o Omit para garantir que não tentem passar campos gerados pelo back-end
    reviewData: Omit<Review, "id" | "createdAt" | "reply">
  ) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set) => ({
  reviews: [],
  isLoading: false,
  isSubmitting: false, // <--- ADICIONADO: Estado inicial
  error: null,

  fetchReviews: async (providerId) => {
    set({ isLoading: true, error: null });

    // Não usamos toast.promise aqui para não "spamar" o usuário toda vez que ele abrir um perfil
    try {
      const reviews = await getReviewsForProvider(providerId);
      set({ reviews, isLoading: false });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao carregar avaliações.";
      console.error(err);
      set({ error: errorMessage, isLoading: false });
      // Toast de erro discreto se falhar o carregamento
      toast.error("Não foi possível carregar as avaliações.");
    }
  },

  submitReview: async (appointmentId, reviewData) => {
    set({ isSubmitting: true, error: null }); // <--- Ativa o loading do botão

    const promise = addReview(appointmentId, reviewData);

    toast.promise(promise, {
      loading: "Enviando sua avaliação...",
      success: "Avaliação enviada com sucesso! Obrigado.",
      error: "Erro ao enviar avaliação. Tente novamente.",
    });

    try {
      await promise;
      // Sucesso: O toast já avisa
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido.";
      set({ error: errorMessage });
    } finally {
      set({ isSubmitting: false }); // <--- Desativa o loading do botão (sempre)
    }
  },
}));
