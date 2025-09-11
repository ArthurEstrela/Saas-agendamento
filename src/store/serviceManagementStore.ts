import { create } from 'zustand';
import { useProfileStore } from './profileStore';
import { addServiceToProvider, removeServiceFromProvider, updateServiceInProvider } from '../firebase/serviceManagementService';
import type { Service } from '../types';

interface ServiceManagementState {
  isSubmitting: boolean;
  error: string | null;
   addService: (providerId: string, serviceData: Omit<Service, 'id'>) => Promise<void>;
  updateService: (providerId: string, serviceId: string, updates: Partial<Omit<Service, 'id'>>) => Promise<void>;
  removeService: (providerId: string, service: Service) => Promise<void>;
}

export const useServiceManagementStore = create<ServiceManagementState>((set) => ({
  isSubmitting: false,
  error: null,

  addService: async (providerId, service) => {
    set({ isSubmitting: true, error: null });
    try {
      await addServiceToProvider(providerId, service);
      // Re-busca o perfil para ter a lista de serviços atualizada
      await useProfileStore.getState().fetchUserProfile(providerId);
      set({ isSubmitting: false });
    } catch (err: unknown) {
      let errorMessage = "Falha ao adicionar o serviço.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error(errorMessage, err);
      set({ isSubmitting: false, error: errorMessage });
    }
  },

    updateService: async (providerId, serviceId, updates) => {
    set({ isSubmitting: true, error: null });
    try {
      await updateServiceInProvider(providerId, serviceId, updates);
      await useProfileStore.getState().fetchUserProfile(providerId);
      set({ isSubmitting: false });
    } catch (err: unknown) {
      let errorMessage = "Falha ao atualizar o serviço.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error(errorMessage, err);
      set({ isSubmitting: false, error: errorMessage });
    }
  },

  removeService: async (providerId, service) => {
    set({ isSubmitting: true, error: null });
    try {
      await removeServiceFromProvider(providerId, service);
      await useProfileStore.getState().fetchUserProfile(providerId);
      set({ isSubmitting: false });
    } catch (err: unknown) {
      let errorMessage = "Falha ao remover o serviço.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error(errorMessage, err);
      set({ isSubmitting: false, error: errorMessage });
    }
  },
}));