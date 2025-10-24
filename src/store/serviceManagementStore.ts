// src/store/serviceManagementStore.ts

import { create } from "zustand";
import { useProfileStore } from "./profileStore";
import {
  addServiceToProvider,
  removeServiceFromProvider,
  updateServiceInProvider,
} from "../firebase/serviceManagementService";
import type { Service } from "../types";
import { toast } from "react-hot-toast";

// Definindo os tipos de payload com base no types.ts
type ServiceAddData = Omit<Service, "id">;
type ServiceUpdateData = Partial<Omit<Service, "id">>;

interface ServiceManagementState {
  isSubmitting: boolean;
  error: string | null;
  addService: (providerId: string, serviceData: ServiceAddData) => Promise<void>;
  updateService: (
    providerId: string,
    serviceId: string,
    updates: ServiceUpdateData
  ) => Promise<void>;
  removeService: (providerId: string, service: Service) => Promise<void>;
}

export const useServiceManagementStore = create<ServiceManagementState>(
  (set) => ({
    isSubmitting: false,
    error: null,

    /**
     * Adiciona um novo serviço e força a atualização do profileStore.
     */
    addService: async (providerId, service) => {
      set({ isSubmitting: true, error: null });

      // A promise agora inclui o refetch
      const addAndRefetchPromise = async () => {
        // 1. Adiciona no Firebase
        await addServiceToProvider(providerId, service);
        // 2. Atualiza o estado global
        await useProfileStore.getState().fetchUserProfile(providerId);
      };

      try {
        await toast.promise(addAndRefetchPromise(), {
          loading: "Adicionando serviço...",
          success: "Serviço adicionado com sucesso!",
          error: "Falha ao adicionar o serviço.",
        });
      } catch (err: unknown) {
        console.error("Erro em addService:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        set({ error: errorMessage });
      } finally {
        set({ isSubmitting: false });
      }
    },

    /**
     * Atualiza um serviço existente e força a atualização do profileStore.
     */
    updateService: async (providerId, serviceId, updates) => {
      set({ isSubmitting: true, error: null });

      const updateAndRefetchPromise = async () => {
        // 1. Atualiza no Firebase
        await updateServiceInProvider(providerId, serviceId, updates);
        // 2. Atualiza o estado global
        await useProfileStore.getState().fetchUserProfile(providerId);
      };

      try {
        await toast.promise(updateAndRefetchPromise(), {
          loading: "Atualizando serviço...",
          success: "Serviço atualizado com sucesso!",
          error: "Falha ao atualizar o serviço.",
        });
      } catch (err: unknown) {
        console.error("Erro em updateService:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        set({ error: errorMessage });
      } finally {
        set({ isSubmitting: false });
      }
    },

    /**
     * Remove um serviço e força a atualização do profileStore.
     */
    removeService: async (providerId, service) => {
      set({ isSubmitting: true, error: null });

      const removeAndRefetchPromise = async () => {
        // 1. Remove do Firebase
        await removeServiceFromProvider(providerId, service);
        // 2. Atualiza o estado global
        await useProfileStore.getState().fetchUserProfile(providerId);
      };

      try {
        await toast.promise(removeAndRefetchPromise(), {
          loading: "Removendo serviço...",
          success: "Serviço removido com sucesso!",
          error: "Falha ao remover o serviço.",
        });
      } catch (err: unknown) {
        console.error("Erro em removeService:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Erro desconhecido";
        set({ error: errorMessage });
      } finally {
        set({ isSubmitting: false });
      }
    },
  })
);