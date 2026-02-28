import { create } from "zustand";
import { isAxiosError } from "axios";
import type { ProfessionalProfile, DailyAvailability } from "../types";
import { api } from "../lib/api";

// Helper de erro sênior
const extractErrorMessage = (
  error: unknown,
  defaultMessage: string,
): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

// ✨ Tipo customizado para o Payload de criação/atualização
// Ele pega tudo que é opcional do ProfessionalProfile e adiciona as propriedades do Form
export type ProfessionalPayload = Partial<ProfessionalProfile> & {
  password?: string;
  serviceIds?: string[];
};

interface ProfessionalsManagementState {
  professionals: ProfessionalProfile[];
  loading: boolean;
  error: string | null;

  // Ações Principais
  fetchProfessionals: (providerId: string) => Promise<void>;
  createProfessional: (
    providerId: string,
    data: ProfessionalPayload, // ✨ Tipagem correta ao invés de 'any'
    photoFile?: File,
  ) => Promise<void>;
  updateProfessional: (
    id: string,
    data: ProfessionalPayload, // ✨ Tipagem correta ao invés de 'any'
    photoFile?: File,
  ) => Promise<void>;

  // Ações Específicas (Alinhadas com os Endpoints do Java)
  updateAvailability: (
    id: string,
    availability: DailyAvailability[],
  ) => Promise<void>;
  updateServices: (id: string, serviceIds: string[]) => Promise<void>;
  updateCommission: (id: string, commissionPercentage: number) => Promise<void>;
  deleteProfessional: (id: string) => Promise<void>;

  clearError: () => void;
}

export const useProfessionalsManagementStore =
  create<ProfessionalsManagementState>((set) => ({
    professionals: [],
    loading: false,
    error: null,

    // ==========================================================================
    // 1. BUSCAR TODOS OS PROFISSIONAIS DO ESTABELECIMENTO
    // ==========================================================================
    fetchProfessionals: async (providerId: string) => {
      set({ loading: true, error: null });
      try {
        const response = await api.get<ProfessionalProfile[]>(
          `/professionals/provider/${providerId}`,
        );
        set({ professionals: response.data, loading: false });
      } catch (error) {
        set({
          error: extractErrorMessage(
            error,
            "Erro ao carregar a lista de profissionais.",
          ),
          loading: false,
        });
      }
    },

    // ==========================================================================
    // 2. CRIAR UM NOVO PROFISSIONAL
    // ==========================================================================
    createProfessional: async (
      providerId: string,
      data: ProfessionalPayload, // <-- USE AQUI
      photoFile?: File,
    ) => {
      set({ loading: true, error: null });
      try {
        // 2. EXTRAIA DIRETAMENTE O ARRAY DE IDs DO PAYLOAD
        const serviceIds = data.serviceIds || [];

        const response = await api.post<ProfessionalProfile>("/professionals", {
          providerId: providerId,
          name: data.name,
          email: data.email,
          bio: data.bio,
          commissionPercentage: data.commissionPercentage,
          serviceIds: serviceIds, // Agora vai funcionar!
        });

        const newProfessionalId = response.data.id;

        // Se houver foto, faz o upload
        if (photoFile && newProfessionalId) {
          const formData = new FormData();
          formData.append("file", photoFile);

          const photoResponse = await api.put(
            `/profile-images/professional/${newProfessionalId}`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );

          response.data.profilePictureUrl = photoResponse.data.url;
        }

        set((state) => ({
          professionals: [...state.professionals, response.data],
          loading: false,
        }));
      } catch (error) {
        set({
          error: extractErrorMessage(error, "Erro ao cadastrar profissional."),
          loading: false,
        });
        throw error;
      }
    },

    // ==========================================================================
    // 3. ATUALIZAR DADOS BÁSICOS DO PROFISSIONAL E FOTO
    // ==========================================================================
    updateProfessional: async (
      id: string,
      data: ProfessionalPayload, // <-- USE AQUI
      photoFile?: File,
    ) => {
      set({ loading: true, error: null });
      try {
        // 1. Atualiza Dados Básicos
        const basicResponse = await api.put<ProfessionalProfile>(
          `/professionals/${id}`,
          {
            name: data.name,
            bio: data.bio,
          },
        );

        // 2. VINCULA OS SERVIÇOS CORRETAMENTE
        if (data.serviceIds) {
          // <-- Verifique serviceIds, não services
          await api.put(`/professionals/${id}/services`, {
            serviceIds: data.serviceIds, // Envia direto
          });
        }

        // 3. Atualiza a Foto (se houver)
        if (photoFile) {
          const formData = new FormData();
          formData.append("file", photoFile);

          const photoResponse = await api.put(
            `/profile-images/professional/${id}`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
          basicResponse.data.profilePictureUrl = photoResponse.data.url;
        }

        // 4. Busca o profissional atualizado completo do backend para garantir que o state tenha os serviços reais
        const updatedProfessional = await api.get<ProfessionalProfile>(
          `/professionals/${id}/profile`,
        );

        // 5. Atualiza a tabela na tela
        set((state) => ({
          professionals: state.professionals.map((p) =>
            p.id === id ? updatedProfessional.data : p,
          ),
          loading: false,
        }));
      } catch (error) {
        set({ error: "Erro ao atualizar profissional.", loading: false });
        throw error;
      }
    },

    // ==========================================================================
    // 4. ATUALIZAR HORÁRIOS (AVAILABILITY)
    // ==========================================================================
    updateAvailability: async (
      id: string,
      availability: DailyAvailability[],
    ) => {
      set({ loading: true, error: null });
      try {
        await api.put(`/professionals/${id}/availability`, { availability });

        set((state) => ({
          professionals: state.professionals.map((prof) =>
            prof.id === id ? { ...prof, availability } : prof,
          ),
          loading: false,
        }));
      } catch (error) {
        set({
          error: extractErrorMessage(
            error,
            "Erro ao salvar os horários de trabalho.",
          ),
          loading: false,
        });
        throw error;
      }
    },

    // ==========================================================================
    // 5. VINCULAR SERVIÇOS AO PROFISSIONAL
    // ==========================================================================
    updateServices: async (id: string, serviceIds: string[]) => {
      set({ loading: true, error: null });
      try {
        await api.put(`/professionals/${id}/services`, { serviceIds });

        // Apenas fechamos o loading, pois na listagem geral já teremos as alterações visualmente ou forçaremos um re-fetch
        set({ loading: false });
      } catch (error) {
        set({
          error: extractErrorMessage(error, "Erro ao vincular serviços."),
          loading: false,
        });
        throw error;
      }
    },

    // ==========================================================================
    // 6. ATUALIZAR COMISSÃO
    // ==========================================================================
    updateCommission: async (id: string, commissionPercentage: number) => {
      set({ loading: true, error: null });
      try {
        await api.put(`/professionals/${id}/commission`, {
          commissionPercentage,
        });

        set((state) => ({
          professionals: state.professionals.map((prof) =>
            prof.id === id ? { ...prof, commissionPercentage } : prof,
          ),
          loading: false,
        }));
      } catch (error) {
        set({
          error: extractErrorMessage(error, "Erro ao atualizar a comissão."),
          loading: false,
        });
        throw error;
      }
    },

    // ==========================================================================
    // 7. EXCLUIR PROFISSIONAL
    // ==========================================================================
    deleteProfessional: async (id: string) => {
      set({ loading: true, error: null });
      try {
        await api.delete(`/professionals/${id}`);

        set((state) => ({
          professionals: state.professionals.filter((prof) => prof.id !== id),
          loading: false,
        }));
      } catch (error) {
        set({
          error: extractErrorMessage(
            error,
            "Erro ao excluir profissional. Verifique se ele não possui agendamentos pendentes.",
          ),
          loading: false,
        });
        throw error;
      }
    },

    clearError: () => set({ error: null }),
  }));
