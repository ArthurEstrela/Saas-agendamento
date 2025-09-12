import { create } from "zustand";
import { useProfileStore } from "./profileStore";
import {
  addProfessionalToProvider,
  removeProfessionalFromProvider,
  updateProfessionalInProvider,
  uploadProfessionalPhoto,
} from "../firebase/professionalsManagementService";
import type { Professional } from "../types";
import { v4 as uuidv4 } from "uuid";

type ProfessionalPayload = Omit<Professional, "id"> & {
  photoFile?: File | null;
};

interface ProfessionalsManagementState {
  isSubmitting: boolean;
  error: string | null;
  addProfessional: (
    providerId: string,
    payload: ProfessionalPayload
  ) => Promise<void>;
  updateProfessional: (
    providerId: string,
    professionalId: string,
    payload: ProfessionalPayload
  ) => Promise<void>;
  removeProfessional: (
    providerId: string,
    professional: Professional
  ) => Promise<void>;
}

export const useProfessionalsManagementStore =
  create<ProfessionalsManagementState>((set) => ({
    isSubmitting: false,
    error: null,

    addProfessional: async (providerId, payload) => {
      set({ isSubmitting: true, error: null });
      try {
        const { photoFile, ...professionalData } = payload;
        const newProfessionalId = uuidv4();

        let photoURL = "";
        if (photoFile) {
          photoURL = await uploadProfessionalPhoto(
            providerId,
            newProfessionalId,
            photoFile
          );
        }

        const finalProfessional: Professional = {
          id: newProfessionalId,
          ...professionalData,
          photoURL: photoURL,
        };

        await addProfessionalToProvider(providerId, finalProfessional);
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

    updateProfessional: async (providerId, professionalId, payload) => {
      set({ isSubmitting: true, error: null });
      try {
        const { photoFile, ...professionalData } = payload;
        let photoURL = professionalData.photoURL || "";

        if (photoFile) {
          photoURL = await uploadProfessionalPhoto(
            providerId,
            professionalId,
            photoFile
          );
        }

        const finalProfessional: Professional = {
          id: professionalId,
          ...professionalData,
          photoURL: photoURL,
        };

        await updateProfessionalInProvider(providerId, finalProfessional);
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
