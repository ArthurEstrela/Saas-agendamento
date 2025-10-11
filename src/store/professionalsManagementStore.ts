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
import { toast } from "react-hot-toast"; // Importar o toast

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
    professionalId: string // Alterado para receber o ID
  ) => Promise<void>;
}

export const useProfessionalsManagementStore =
  create<ProfessionalsManagementState>((set) => ({
    isSubmitting: false,
    error: null,

    addProfessional: async (providerId, payload) => {
      set({ isSubmitting: true, error: null });

      const addProfessionalPromise = async () => {
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
      };

      toast.promise(addProfessionalPromise(), {
        loading: "Adicionando profissional...",
        success: "Profissional adicionado com sucesso!",
        error: "Falha ao adicionar profissional.",
      });

      try {
        await addProfessionalPromise();
      } catch (err) {
        console.error("Erro em addProfessional:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        set({ error: errorMessage });
      } finally {
        set({ isSubmitting: false });
      }
    },

    updateProfessional: async (providerId, professionalId, payload) => {
      set({ isSubmitting: true, error: null });

      const updateProfessionalPromise = async () => {
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
      };

      toast.promise(updateProfessionalPromise(), {
        loading: "Atualizando profissional...",
        success: "Profissional atualizado com sucesso!",
        error: "Falha ao atualizar profissional.",
      });

      try {
        await updateProfessionalPromise();
      } catch (err) {
         console.error("Erro em updateProfessional:", err);
         const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
         set({ error: errorMessage });
      } finally {
        set({ isSubmitting: false });
      }
    },

    removeProfessional: async (providerId, professionalId) => {
      set({ isSubmitting: true, error: null });
      
      const promise = removeProfessionalFromProvider(providerId, professionalId);

      toast.promise(promise, {
        loading: "Removendo profissional...",
        success: "Profissional removido com sucesso!",
        error: "Falha ao remover o profissional.",
      });

      try {
        await promise;
        await useProfileStore.getState().fetchUserProfile(providerId);
      } catch (err) {
        console.error("Erro em removeProfessional:", err);
        const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
        set({ error: errorMessage });
      } finally {
        set({ isSubmitting: false });
      }
    },
  }));