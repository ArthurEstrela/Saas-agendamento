// src/store/professionalsManagementStore.ts

import { create } from "zustand";
import { useProfileStore } from "./profileStore";
import {
  addProfessionalToProvider,
  removeProfessionalFromProvider,
  updateProfessionalInProvider,
  uploadProfessionalPhoto,
} from "../firebase/professionalsManagementService";
// ****** 1. IMPORTAMOS DailyAvailability ******
import type { Professional, Service, DailyAvailability } from "../types";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";

// Payload para criar/atualizar. Corresponde ao formulário.
type ProfessionalFormData = Pick<Professional, "name"> & {
  services: Service[]; // O formulário já deve passar os objetos de serviço completos
  photoURL?: string; // photoURL existente (para atualização)
  photoFile?: File | null; // Novo arquivo de foto
  availability?: DailyAvailability[]; // <-- 1. ADICIONAMOS A DISPONIBILIDADE AQUI
};

// Interface do Store
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
     * Adiciona um novo profissional
     */
    addProfessional: async (providerId, payload) => {
      set({ isSubmitting: true, error: null });

      const addAndRefetchPromise = async () => {
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
          name: professionalData.name,
          services: professionalData.services,
          photoURL: photoURL,
          // Profissionais novos começam sem disponibilidade (ou com a do payload, se houver)
          availability: professionalData.availability || [],
        };

        await addProfessionalToProvider(providerId, finalProfessional);
        await useProfileStore.getState().fetchUserProfile(providerId);
      };

      try {
        await toast.promise(addAndRefetchPromise(), {
          loading: "Adicionando profissional...",
          success: "Profissional adicionado com sucesso!",
          error: "Falha ao adicionar profissional.",
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
     * Atualiza um profissional existente e força a atualização do profileStore.
     */
    updateProfessional: async (providerId, professionalId, payload) => {
      set({ isSubmitting: true, error: null });

      const updateAndRefetchPromise = async () => {
        const { photoFile, ...professionalData } = payload;
        let photoURL = professionalData.photoURL || ""; // Mantém a URL existente

        if (photoFile) {
          photoURL = await uploadProfessionalPhoto(
            providerId,
            professionalId, 
            photoFile
          );
        }

        // Busca o profissional ATUAL para o caso de o payload
        // NÃO conter a disponibilidade (ex: vindo da tela de "Meus Profissionais")
        const currentProfessional = useProfileStore
          .getState()
          .professionals?.find((p) => p.id === professionalId);

        const finalProfessional: Professional = {
          id: professionalId,
          name: professionalData.name,
          services: professionalData.services,
          photoURL: photoURL,
          
          // ****** 2. AQUI ESTÁ A CORREÇÃO PRINCIPAL ******
          // Se 'professionalData' (vindo do payload) tiver a chave 'availability',
          // use-a. Senão, mantenha a disponibilidade antiga.
          availability:
            professionalData.availability !== undefined
              ? professionalData.availability
              : currentProfessional?.availability || [],
        };

        // 1. Atualiza no Firebase
        await updateProfessionalInProvider(providerId, finalProfessional);
        
        // 2. Atualiza o estado global
        await useProfileStore.getState().fetchUserProfile(providerId);
      };

      try {
        await toast.promise(updateAndRefetchPromise(), {
          loading: "Atualizando dados...", // Mensagem mais genérica
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
     * Remove um profissional
     */
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
      } catch (err)
       {
        console.error("Erro em removeProfessional:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        set({ error: errorMessage });
      } finally {
        set({ isSubmitting: false });
      }
    },
  }));