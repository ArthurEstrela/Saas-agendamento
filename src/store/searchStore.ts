import { create } from "zustand";
import {
  collection,
  getDocs,
  query,
  where,
  QueryConstraint,
} from "firebase/firestore"; 
import { db } from "../firebase/config";
import type { Review, ServiceProviderProfile } from "../types";

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
      const searchTermLower = term.toLowerCase();
      const usersCollection = collection(db, "users");

      // 1. Create a base list of query constraints
      const queryConstraints: QueryConstraint[] = [
        where("role", "==", "serviceProvider"),
      ];

      // 2. If there's a search term, add the "starts with" constraints
      if (term) {
        queryConstraints.push(
          where("businessNameLower", ">=", searchTermLower)
        );
        queryConstraints.push(
          where("businessNameLower", "<=", searchTermLower + "\uf8ff")
        );
        // If you wanted to search areaOfWork as well, you would need a more complex setup,
        // as Firestore's `or` does not support range queries (`>=`, `<=`).
      }

      // 3. Build the final query by spreading the constraints
      const providersQuery = query(usersCollection, ...queryConstraints);

      const querySnapshot = await getDocs(providersQuery);
      let providers = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ServiceProviderProfile[];

      // Fetch reviews for each provider
      if (providers.length > 0) {
        providers = await Promise.all(
          providers.map(async (provider) => {
            const reviewsQuery = query(
              collection(db, "reviews"),
              where("serviceProviderId", "==", provider.id)
            );
            const reviewsSnapshot = await getDocs(reviewsQuery);
            const reviews = reviewsSnapshot.docs.map(
              (doc) => doc.data() as Review
            );
            return { ...provider, reviews };
          })
        );
      }

      // Final client-side filtering (good for refining results)
      if (term) {
        providers = providers.filter(
          (p) =>
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
