// Em src/store/professionalsManagementStore.ts

import { create } from "zustand";
import { useProfileStore } from "./profileStore";
import {
  // 1. Importamos as NOVAS funções de serviço
  createProfessionalAccount,
  updateProfessionalPhotoUrls,
  // E mantemos as antigas
  removeProfessionalFromProvider,
  updateProfessionalInProvider,
  uploadProfessionalPhoto,
} from "../firebase/professionalsManagementService";
import type { Professional } from "../types";
import { toast } from "react-hot-toast";

// --- 2. ATUALIZAMOS O PAYLOAD ---
type ProfessionalFormData = Partial<Professional> & { // Tornamos mais flexível
  email?: string;
  password?: string;
  serviceIds?: string[]; // Adicionado para a Cloud Function
  photoFile?: File | null;
};

interface ProfessionalsManagementState {
  isSubmitting: boolean;
  error: string | null;
  addProfessional: (
    providerId: string,
    payload: ProfessionalFormData
  ) => Promise<void>;
  updateProfessional: (
    providerId: string,
    professionalId: string,
    payload: ProfessionalFormData
  ) => Promise<void>;
  removeProfessional: (
    providerId: string,
    professionalId: string
  ) => Promise<void>;
}

export const useProfessionalsManagementStore =
  create<ProfessionalsManagementState>((set) => ({
    isSubmitting: false,
    error: null,

    /**
     * --- 3. REESCREVEMOS COMPLETAMENTE O addProfessional ---
     */
    addProfessional: async (providerId, payload) => {
      set({ isSubmitting: true, error: null });

      const addAndRefetchPromise = async () => {
        const { photoFile, email, password, name, serviceIds } = payload;

        if (!email || !password || !name || !serviceIds) {
          throw new Error("Dados do formulário incompletos.");
        }
        
        // 1. Chama a Cloud Function com os dados principais
        const { uid, professionalId } = await createProfessionalAccount({
          name,
          email,
          password,
          serviceIds,
        });

        // 2. Se a função foi bem-sucedida E houver uma foto, faz o upload
        if (photoFile) {
          const photoURL = await uploadProfessionalPhoto(
            providerId,
            professionalId,
            photoFile
          );
          
          // 3. Atualiza os documentos com a URL da foto
          await updateProfessionalPhotoUrls(
            providerId,
            uid,
            professionalId,
            photoURL
          );
        }

        // 4. Atualiza o estado global
        await useProfileStore.getState().fetchUserProfile(providerId);
      };

      try {
        await toast.promise(addAndRefetchPromise(), {
          loading: "Criando conta do profissional...",
          success: "Profissional adicionado com sucesso!",
          error: (err) => err.message || "Falha ao adicionar profissional.",
        });
      } catch (err) {
        console.error("Erro em addProfessional:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        set({ error: errorMessage });
      } finally {
        set({ isSubmitting: false });
      }
    },

    /**
     * updateProfessional (Sua lógica original está correta)
     */
    updateProfessional: async (providerId, professionalId, payload) => {
      set({ isSubmitting: true, error: null });

      const updateAndRefetchPromise = async () => {
        const { photoFile, ...professionalData } = payload;
        let photoURL = professionalData.photoURL || "";

        if (photoFile) {
          photoURL = await uploadProfessionalPhoto(
            providerId,
            professionalId,
            photoFile
          );
        }

        const currentProfessional = useProfileStore
          .getState()
          .professionals?.find((p) => p.id === professionalId);

        const finalProfessional: Professional = {
          id: professionalId,
          name: professionalData.name || currentProfessional?.name || "",
          services: professionalData.services || currentProfessional?.services || [],
          photoURL: photoURL,
          availability:
            professionalData.availability !== undefined
              ? professionalData.availability
              : currentProfessional?.availability || [],
        };

        await updateProfessionalInProvider(providerId, finalProfessional);
        await useProfileStore.getState().fetchUserProfile(providerId);
      };

      try {
        await toast.promise(updateAndRefetchPromise(), {
          loading: "Atualizando dados...",
          success: "Dados atualizados com sucesso!",
          error: "Falha ao atualizar os dados.",
        });
      } catch (err) {
        console.error("Erro em updateProfessional:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        set({ error: errorMessage });
      } finally {
        set({ isSubmitting: false });
      }
    },

    /**
     * removeProfessional (Sua lógica original está correta)
     */
    removeProfessional: async (providerId, professionalId) => {
      set({ isSubmitting: true, error: null });

      const removeAndRefetchPromise = async () => {
        await removeProfessionalFromProvider(providerId, professionalId);
        // TODO: Adicionar Cloud Function para deletar o Auth user
        await useProfileStore.getState().fetchUserProfile(providerId);
      };

      try {
        await toast.promise(removeAndRefetchPromise(), {
          loading: "Removendo profissional...",
          success: "Profissional removido com sucesso!",
          error: "Falha ao remover o profissional.",
        });
      } catch (err) {
        console.error("Erro em removeProfessional:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        set({ error: errorMessage });
      } finally {
        set({ isSubmitting: false });
      }
    },
  }));