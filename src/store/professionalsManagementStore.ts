// src/store/professionalsManagementStore.ts

import { create } from "zustand";
import { useProfileStore } from "./profileStore";
import {
  addProfessionalToProvider,
  removeProfessionalFromProvider,
  updateProfessionalInProvider,
  uploadProfessionalPhoto,
} from "../firebase/professionalsManagementService";
import type { Professional, Service } from "../types"; // Importando tipos necessários
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";

// Payload para criar/atualizar. Corresponde ao formulário.
// Usamos Pick para pegar só o que vem do formulário, e não 'id', 'availability', etc.
type ProfessionalFormData = Pick<Professional, "name"> & {
  services: Service[]; // O formulário já deve passar os objetos de serviço completos
  photoURL?: string; // photoURL existente (para atualização)
  photoFile?: File | null; // Novo arquivo de foto
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
     * Adiciona um novo profissional e, em seguida,
     * força a atualização do profileStore.
     */
    addProfessional: async (providerId, payload) => {
      set({ isSubmitting: true, error: null });

      // Esta é a função que o toast.promise irá executar
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

        // Criamos o objeto Professional completo, conforme o type
        const finalProfessional: Professional = {
          id: newProfessionalId,
          name: professionalData.name,
          services: professionalData.services,
          photoURL: photoURL,
          availability: [], // Profissionais novos começam sem disponibilidade definida
        };

        // 1. Adiciona no Firebase
        await addProfessionalToProvider(providerId, finalProfessional);
        
        // 2. Atualiza o estado global (essa é a parte nova)
        // O toast só mostrará "sucesso" depois que isso terminar.
        await useProfileStore.getState().fetchUserProfile(providerId);
      };

      try {
        // ****** CORREÇÃO DO BUG ******
        // Chamamos toast.promise UMA VEZ, e ele executa a função.
        // Não chamamos a função novamente no try/catch.
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
        // O toast.promise já exibiu o erro, mas podemos registrar no estado
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
          // Se um novo arquivo foi enviado, faz o upload
          photoURL = await uploadProfessionalPhoto(
            providerId,
            professionalId, // ID existente para sobrescrever a foto
            photoFile
          );
        }

        // O 'availability' não vem do formulário, então buscamos do profileStore
        const currentProfessional = useProfileStore
          .getState()
          .professionals?.find((p) => p.id === professionalId);

        const finalProfessional: Professional = {
          id: professionalId,
          name: professionalData.name,
          services: professionalData.services,
          photoURL: photoURL,
          availability: currentProfessional?.availability || [], // Mantém o availability
        };

        // 1. Atualiza no Firebase
        await updateProfessionalInProvider(providerId, finalProfessional);
        
        // 2. Atualiza o estado global
        await useProfileStore.getState().fetchUserProfile(providerId);
      };

      try {
        await toast.promise(updateAndRefetchPromise(), {
          loading: "Atualizando profissional...",
          success: "Profissional atualizado com sucesso!",
          error: "Falha ao atualizar profissional.",
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
     * Remove um profissional e força a atualização do profileStore.
     */
    removeProfessional: async (providerId, professionalId) => {
      set({ isSubmitting: true, error: null });

      const removeAndRefetchPromise = async () => {
        // (Opcional: Adicionar lógica para deletar a foto do Storage aqui)
        
        // 1. Remove do Firebase
        await removeProfessionalFromProvider(providerId, professionalId);
        
        // 2. Atualiza o estado global
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