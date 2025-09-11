import { create } from 'zustand';
import { useProfileStore } from './profileStore';
import { addProfessionalToProvider, removeProfessionalFromProvider, updateProfessionalInProvider } from '../firebase/professionalsManagementService';
import type { Professional } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ProfessionalsManagementState {
  isSubmitting: boolean;
  error: string | null;
  addProfessional: (providerId: string, professionalData: Omit<Professional, 'id'>) => Promise<void>;
  updateProfessional: (providerId: string, updatedProfessional: Professional) => Promise<void>;
  removeProfessional: (providerId: string, professional: Professional) => Promise<void>;
}

export const useProfessionalsManagementStore = create<ProfessionalsManagementState>((set) => ({
  isSubmitting: false,
  error: null,

  addProfessional: async (providerId, professionalData) => {
    set({ isSubmitting: true, error: null });
    try {
      const newProfessional: Professional = {
        id: uuidv4(),
        ...professionalData,
      };
      await addProfessionalToProvider(providerId, newProfessional);
      await useProfileStore.getState().fetchUserProfile(providerId);
      set({ isSubmitting: false });
    } catch (err: unknown) {
      // --- TRATAMENTO DE ERRO COMPLETO ---
      let errorMessage = "Falha ao adicionar o profissional.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error(errorMessage, err);
      set({ isSubmitting: false, error: errorMessage });
    }
  },

  updateProfessional: async (providerId, updatedProfessional) => {
    set({ isSubmitting: true, error: null });
    try {
      await updateProfessionalInProvider(providerId, updatedProfessional);
      await useProfileStore.getState().fetchUserProfile(providerId);
      set({ isSubmitting: false });
    } catch (err: unknown) {
      // --- TRATAMENTO DE ERRO COMPLETO ---
      let errorMessage = "Falha ao atualizar o profissional.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error(errorMessage, err);
      set({ isSubmitting: false, error: errorMessage });
    }
  },

  removeProfessional: async (providerId, professional) => {
    set({ isSubmitting: true, error: null });
    try {
      await removeProfessionalFromProvider(providerId, professional);
      await useProfileStore.getState().fetchUserProfile(providerId);
      set({ isSubmitting: false });
    } catch (err: unknown) {
      // --- TRATAMENTO DE ERRO COMPLETO ---
      let errorMessage = "Falha ao remover o profissional.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error(errorMessage, err);
      set({ isSubmitting: false, error: errorMessage });
    }
  },
}));