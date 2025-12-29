// src/store/professionalsManagementStore.ts

import { create } from "zustand";
import { useProfileStore } from "./profileStore";
import {
  createProfessionalAccount,
  updateProfessionalPhotoUrls,
  removeProfessionalFromProvider,
  updateProfessionalInProvider,
  uploadProfessionalPhoto,
} from "../firebase/professionalsManagementService";
import type { Professional } from "../types";
import { toast } from "react-hot-toast";

type ProfessionalFormData = Partial<Professional> & {
  email?: string;
  password?: string;
  serviceIds?: string[];
  photoFile?: File | null;
};

// 1. Adicionamos a tipagem aqui
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
  // ✅ Adicionado:
  fetchProfessionals: (providerId: string) => Promise<void>;
}

export const useProfessionalsManagementStore =
  create<ProfessionalsManagementState>((set) => ({
    isSubmitting: false,
    error: null,

    // ✅ Adicionado: Implementação da função
    fetchProfessionals: async (providerId: string) => {
      set({ isSubmitting: true, error: null });
      try {
        // Reutilizamos a lógica do profileStore para buscar os dados atualizados
        await useProfileStore.getState().fetchUserProfile(providerId);
      } catch (err) {
        console.error("Erro ao buscar profissionais:", err);
        set({ error: "Falha ao carregar lista de profissionais." });
      } finally {
        set({ isSubmitting: false });
      }
    },

    addProfessional: async (providerId, payload) => {
      set({ isSubmitting: true, error: null });

      const addAndRefetchPromise = async () => {
        const { photoFile, email, password, name, serviceIds } = payload;

        if (!email || !password || !name || !serviceIds) {
          throw new Error("Dados do formulário incompletos.");
        }
        
        const { uid, professionalId } = await createProfessionalAccount({
          name,
          email,
          password,
          serviceIds,
        });

        if (photoFile) {
          const photoURL = await uploadProfessionalPhoto(
            providerId,
            professionalId,
            photoFile
          );
          
          await updateProfessionalPhotoUrls(
            providerId,
            uid,
            professionalId,
            photoURL
          );
        }

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
          // Mantém a flag isOwner se existir
          isOwner: professionalData.isOwner !== undefined 
            ? professionalData.isOwner 
            : currentProfessional?.isOwner,
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

    removeProfessional: async (providerId, professionalId) => {
      set({ isSubmitting: true, error: null });

      const removeAndRefetchPromise = async () => {
        await removeProfessionalFromProvider(providerId, professionalId);
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