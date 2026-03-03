import { create } from "zustand";
import { isAxiosError } from "axios";
import type {
  ProfessionalProfile,
  DailyAvailability,
  ServiceProviderProfile,
} from "../types";
import { api } from "../lib/api";
import { useAuthStore } from "./authStore";

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

export type ProfessionalPayload = Partial<ProfessionalProfile> & {
  password?: string;
  serviceIds?: string[];
  isOwner?: boolean;
};

// ✨ CORREÇÃO AQUI: Adicionado "available". O Jackson do Java corta o "is" do "isAvailable" no JSON!
export interface BackendAvailabilityDTO {
  dayOfWeek: DailyAvailability["dayOfWeek"];
  isAvailable?: boolean;
  available?: boolean; // <-- Este é o cara que o Java realmente manda
  isOpen?: boolean;
  isWorkingDay?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface ProfessionalApiResponse extends Omit<
  ProfessionalProfile,
  "availability"
> {
  availability?: BackendAvailabilityDTO[] | DailyAvailability[];
  availabilities?: BackendAvailabilityDTO[];
}

const parseBackendAvailabilities = (
  backendAvailabilities:
    | BackendAvailabilityDTO[]
    | DailyAvailability[]
    | undefined
    | null,
): DailyAvailability[] => {
  if (!backendAvailabilities || !Array.isArray(backendAvailabilities)) {
    return [];
  }

  if (backendAvailabilities.length > 0 && "slots" in backendAvailabilities[0]) {
    return backendAvailabilities as DailyAvailability[];
  }

  const grouped: Record<string, DailyAvailability> = {};
  const dtoList = backendAvailabilities as BackendAvailabilityDTO[];

  dtoList.forEach((item) => {
    const day = item.dayOfWeek;

    // ✨ CORREÇÃO AQUI: Agora ele procura o `item.available` primeiro!
    const isAvailable =
      item.available ??
      item.isAvailable ??
      item.isOpen ??
      item.isWorkingDay ??
      false;

    if (!grouped[day]) {
      grouped[day] = {
        dayOfWeek: day,
        isAvailable: isAvailable,
        slots: [],
      };
    }

    if (
      isAvailable &&
      item.startTime &&
      item.endTime &&
      item.startTime !== "00:00"
    ) {
      grouped[day].slots.push({ start: item.startTime, end: item.endTime });
    }
  });

  return Object.values(grouped);
};

const mapToProfessionalProfile = (
  apiData: ProfessionalApiResponse,
): ProfessionalProfile => {
  const { availabilities, availability, ...rest } = apiData;
  return {
    ...rest,
    availability: parseBackendAvailabilities(availabilities || availability),
  } as ProfessionalProfile;
};

interface ProfessionalsManagementState {
  professionals: ProfessionalProfile[];
  loading: boolean;
  error: string | null;

  fetchProfessionals: (providerId: string) => Promise<void>;
  createProfessional: (
    providerId: string,
    data: ProfessionalPayload,
    photoFile?: File,
  ) => Promise<void>;
  updateProfessional: (
    id: string,
    data: ProfessionalPayload,
    photoFile?: File,
  ) => Promise<void>;

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

    fetchProfessionals: async (providerId: string) => {
      set({ loading: true, error: null });
      try {
        const response = await api.get<ProfessionalApiResponse[]>(
          `/professionals/provider/${providerId}`,
        );

        const mappedProfessionals = response.data.map(mapToProfessionalProfile);
        set({ professionals: mappedProfessionals, loading: false });
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

    createProfessional: async (
      providerId: string,
      data: ProfessionalPayload,
      photoFile?: File,
    ) => {
      set({ loading: true, error: null });
      try {
        const serviceIds = data.serviceIds || [];

        const response = await api.post<ProfessionalApiResponse>(
          "/professionals",
          {
            providerId: providerId,
            name: data.name,
            email: data.email,
            bio: data.bio,
            commissionPercentage: data.commissionPercentage,
            serviceIds: serviceIds,
            isOwner: data.isOwner || false,
          },
        );

        const newProfessionalId = response.data.id;

        if (photoFile && newProfessionalId) {
          const formData = new FormData();
          formData.append("file", photoFile);

          const photoResponse = await api.put(
            `/profile-images/professional/${newProfessionalId}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
          );

          response.data.profilePictureUrl = photoResponse.data.url;
        }

        const newProf = mapToProfessionalProfile(response.data);

        set((state) => ({
          professionals: [...state.professionals, newProf],
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

    updateProfessional: async (
      id: string,
      data: ProfessionalPayload,
      photoFile?: File,
    ) => {
      set({ loading: true, error: null });
      try {
        const basicResponse = await api.put<ProfessionalApiResponse>(
          `/professionals/${id}`,
          { name: data.name, bio: data.bio },
        );

        if (data.serviceIds) {
          await api.put(`/professionals/${id}/services`, {
            serviceIds: data.serviceIds,
          });
        }

        if (photoFile) {
          const formData = new FormData();
          formData.append("file", photoFile);

          const photoResponse = await api.put(
            `/profile-images/professional/${id}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
          );
          basicResponse.data.profilePictureUrl = photoResponse.data.url;
        }

        const updatedProfessional = await api.get<ProfessionalApiResponse>(
          `/professionals/${id}/profile`,
        );

        const mappedProf = mapToProfessionalProfile(updatedProfessional.data);

        set((state) => ({
          professionals: state.professionals.map((p) =>
            p.id === id ? mappedProf : p,
          ),
          loading: false,
        }));
      } catch (error) {
        set({ error: "Erro ao atualizar profissional.", loading: false });
        throw error;
      }
    },

    updateAvailability: async (
      id: string,
      availability: DailyAvailability[],
    ) => {
      set({ loading: true, error: null });
      try {
        const formattedAvailabilities = [];

        for (const day of availability) {
          if (day.isAvailable && day.slots && day.slots.length > 0) {
            for (const slot of day.slots) {
              formattedAvailabilities.push({
                dayOfWeek: day.dayOfWeek,
                isWorkingDay: true,
                startTime: slot.start,
                endTime: slot.end,
              });
            }
          } else {
            formattedAvailabilities.push({
              dayOfWeek: day.dayOfWeek,
              isWorkingDay: false,
              startTime: "00:00",
              endTime: "00:00",
            });
          }
        }

        const currentUser = useAuthStore.getState().user;
        const slotInterval =
          (currentUser as ServiceProviderProfile)?.slotInterval || 30;

        const payload = {
          availabilities: formattedAvailabilities,
          slotInterval: slotInterval,
        };

        await api.put(`/professionals/${id}/availability`, payload);

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

    updateServices: async (id: string, serviceIds: string[]) => {
      set({ loading: true, error: null });
      try {
        await api.put(`/professionals/${id}/services`, { serviceIds });
        set({ loading: false });
      } catch (error) {
        set({
          error: extractErrorMessage(error, "Erro ao vincular serviços."),
          loading: false,
        });
        throw error;
      }
    },

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
