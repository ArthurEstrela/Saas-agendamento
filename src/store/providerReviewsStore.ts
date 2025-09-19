// src/store/providerReviewsStore.ts
import { create } from 'zustand';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Review, ClientProfile } from '../types';
import { getUserProfile } from '../firebase/userService';

// Criei uma interface estendida para incluir a foto do cliente
export interface EnrichedReview extends Review {
  clientProfilePictureUrl?: string;
}

interface ProviderReviewsState {
  reviews: EnrichedReview[]; // Agora usamos a nova interface
  isLoading: boolean;
  unsubscribe: () => void;
}

interface ProviderReviewsActions {
  fetchReviews: (providerId: string) => void;
  clearReviews: () => void;
}

const initialState = {
  reviews: [],
  isLoading: true,
  unsubscribe: () => {},
};

export const useProviderReviewsStore = create<ProviderReviewsState & ProviderReviewsActions>((set, get) => ({
  ...initialState,

  fetchReviews: (providerId) => {
    get().unsubscribe();
    set({ isLoading: true });

    const q = query(
      collection(db, "reviews"),
      where("serviceProviderId", "==", providerId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Mapeamos cada avaliação para buscar os dados do cliente
      const reviewsPromises = snapshot.docs.map(async (doc): Promise<EnrichedReview> => {
        const reviewData = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        } as Review;

        // Buscando o perfil do cliente para pegar a foto
        const clientProfile = await getUserProfile(reviewData.clientId) as ClientProfile | null;

        return {
          ...reviewData,
          clientProfilePictureUrl: clientProfile?.profilePictureUrl,
        };
      });

      const enrichedReviews = await Promise.all(reviewsPromises);
      set({ reviews: enrichedReviews, isLoading: false });
    }, (error) => {
      console.error("Erro ao buscar avaliações:", error);
      set({ isLoading: false });
    });

    set({ unsubscribe });
  },

  clearReviews: () => {
    get().unsubscribe();
    set(initialState);
  },
}));