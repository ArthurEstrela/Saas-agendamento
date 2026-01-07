import { create } from 'zustand';
import type { ServiceProviderProfile } from '../types';
import { getUserProfile } from '../firebase/userService';

interface ProviderProfileState {
  providerProfile: ServiceProviderProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProviderProfile: (providerId: string) => Promise<void>;
}

export const useProviderProfileStore = create<ProviderProfileState>((set) => ({
  providerProfile: null,
  isLoading: false,
  error: null,

  fetchProviderProfile: async (providerId) => {
    set({ isLoading: true, error: null });
    try {
      const profile = await getUserProfile(providerId);
      if (profile && profile.role === 'serviceProvider') {
        set({ providerProfile: profile as ServiceProviderProfile, isLoading: false });
      } else {
        throw new Error("Prestador de serviço não encontrado.");
      }
    } catch (err) {
      let errorMessage = "Erro ao carregar dados do prestador.";
      if (err instanceof Error) errorMessage = err.message;
      set({ error: errorMessage, isLoading: false });
    }
  },
}));