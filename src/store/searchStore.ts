import { create } from 'zustand';
import { collection, getDocs, query, where, or } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Review, ServiceProviderProfile } from '../types';

interface SearchState {
  results: ServiceProviderProfile[];
  isLoading: boolean;
  search: (term: string) => Promise<void>;
}

export const useSearchStore = create<SearchState>((set) => ({
  results: [],
  isLoading: false,
  search: async (term) => {
    set({ isLoading: true });

    try {
      // 1. A busca inicial de prestadores continua a mesma
      //    Ela filtra por nome do negócio ou área de atuação
      const searchTermLower = term.toLowerCase();
      const providersQuery = query(
        collection(db, "users"),
        where("role", "==", "serviceProvider"),
        // Adicionamos um 'or' para buscar em mais de um campo se houver um termo
        ...(term ? [or(
          where("businessNameLower", ">=", searchTermLower),
          where("businessNameLower", "<=", searchTermLower + '\uf8ff'),
          // Você pode adicionar mais campos na busca, como 'areaOfWork'
          // Lembre-se de criar o campo 'areaOfWorkLower' no seu Firestore
        )] : [])
      );

      const querySnapshot = await getDocs(providersQuery);
      let providers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceProviderProfile[];

      // 2. AQUI ESTÁ A MÁGICA: Buscamos as avaliações para cada prestador
      if (providers.length > 0) {
          providers = await Promise.all(
            providers.map(async (provider) => {
              const reviewsQuery = query(collection(db, "reviews"), where("serviceProviderId", "==", provider.id));
              const reviewsSnapshot = await getDocs(reviewsQuery);
              const reviews = reviewsSnapshot.docs.map(doc => doc.data() as Review);
              
              // Retornamos o objeto do prestador com as avaliações dentro dele
              return { ...provider, reviews };
            })
          );
      }

      // Filtro final no lado do cliente para garantir a relevância (opcional, mas recomendado)
      if (term) {
          providers = providers.filter(p => 
              p.businessName.toLowerCase().includes(searchTermLower) || 
              p.areaOfWork?.toLowerCase().includes(searchTermLower)
          );
      }

      set({ results: providers, isLoading: false });
    } catch (error) {
      console.error("Erro ao buscar prestadores:", error);
      set({ isLoading: false });
    }
  },
}));

// Dica Extra: Para a busca com 'or' funcionar bem, talvez você precise criar um campo 
// 'businessNameLower' nos seus documentos de usuário no Firestore para fazer a busca
// case-insensitive de forma mais eficiente.