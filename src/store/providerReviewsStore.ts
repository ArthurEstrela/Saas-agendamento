import { create } from 'zustand';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  type QuerySnapshot, 
  type DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Review, ClientProfile } from '../types';
import { getUserProfile } from '../firebase/userService';

// Interface estendida para incluir a foto do cliente
export interface EnrichedReview extends Review {
  clientProfilePictureUrl?: string;
}

interface ProviderReviewsState {
  reviews: EnrichedReview[];
  isLoading: boolean;
  unsubscribe: () => void;
}

interface ProviderReviewsActions {
  fetchReviews: (providerId: string) => void;
  fetchProfessionalReviews: (professionalId: string) => void;
  clearReviews: () => void;
}

const initialState = {
  reviews: [],
  isLoading: true,
  unsubscribe: () => {},
};

// Função auxiliar para processar e enriquecer os dados (evita código duplicado)
const processSnapshot = async (snapshot: QuerySnapshot<DocumentData>): Promise<EnrichedReview[]> => {
  const reviewsPromises = snapshot.docs.map(async (doc): Promise<EnrichedReview> => {
    const data = doc.data();
    
    // Garante que a data seja convertida corretamente, prevenindo erros se o campo não existir
    // Verifica se toDate existe antes de chamar, caso contrário usa a data atual como fallback
    const createdAt = data.createdAt && typeof data.createdAt.toDate === 'function' 
      ? data.createdAt.toDate() 
      : new Date();

    const reviewData = {
      id: doc.id,
      ...data,
      createdAt,
    } as Review;

    // Buscando o perfil do cliente para pegar a foto
    // O try/catch evita que uma falha ao buscar um perfil quebre toda a lista
    try {
      const clientProfile = await getUserProfile(reviewData.clientId) as ClientProfile | null;
      return {
        ...reviewData,
        clientProfilePictureUrl: clientProfile?.profilePictureUrl,
      };
    } catch (error) {
      console.warn(`Erro ao buscar perfil do cliente ${reviewData.clientId}`, error);
      return reviewData; // Retorna a review mesmo sem a foto
    }
  });

  return Promise.all(reviewsPromises);
};

export const useProviderReviewsStore = create<ProviderReviewsState & ProviderReviewsActions>((set, get) => ({
  ...initialState,

  // Busca avaliações de todo o estabelecimento (Para o Dono/Admin)
  fetchReviews: (providerId) => {
    get().unsubscribe();
    set({ isLoading: true });

    const q = query(
      collection(db, "reviews"),
      where("serviceProviderId", "==", providerId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const enrichedReviews = await processSnapshot(snapshot);
        set({ reviews: enrichedReviews, isLoading: false });
      } catch (error) {
        console.error("Erro ao processar avaliações do estabelecimento:", error);
        set({ isLoading: false });
      }
    }, (error) => {
      console.error("Erro no listener de avaliações (Provider):", error);
      set({ isLoading: false });
    });

    set({ unsubscribe });
  },

  // Busca avaliações de um profissional específico (Para o Profissional)
  fetchProfessionalReviews: (professionalId) => {
    get().unsubscribe();
    set({ isLoading: true });

    const q = query(
      collection(db, "reviews"),
      where("professionalId", "==", professionalId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const enrichedReviews = await processSnapshot(snapshot);
        set({ reviews: enrichedReviews, isLoading: false });
      } catch (error) {
        console.error("Erro ao processar avaliações do profissional:", error);
        set({ isLoading: false });
      }
    }, (error) => {
      console.error("Erro no listener de avaliações (Professional):", error);
      set({ isLoading: false });
    });

    set({ unsubscribe });
  },

  clearReviews: () => {
    get().unsubscribe();
    set(initialState);
  },
}));