import { create } from "zustand";
import { isAxiosError } from "axios";
import { toast } from "react-hot-toast";
import type {
  Service,
  ProfessionalProfile,
  ServiceProviderProfile,
  ClientProfile,
  CreateAppointmentRequest,
  Appointment,
} from "../types";
import { api } from "../lib/api";

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

interface BookingState {
  // Estado do Processo
  step: number;
  loading: boolean;
  error: string | null;

  // ✨ Dados PÚBLICOS do estabelecimento a ser agendado
  provider: ServiceProviderProfile | null;
  professionals: ProfessionalProfile[];
  availableServices: Service[]; // Todos os serviços que o provider oferece

  // Seleções do Cliente
  professional: ProfessionalProfile | null;
  services: Service[]; // Serviços selecionados pelo cliente
  date: Date | null;
  time: string | null;
  couponCode: string | null;

  // Ações de API
  fetchProviderData: (providerId: string) => Promise<void>;
  confirmBooking: (
    client: ClientProfile,
    notes?: string,
  ) => Promise<Appointment>;

  // Ações de Navegação e Seleção
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  setProfessional: (professional: ProfessionalProfile | null) => void;
  toggleService: (service: Service) => void;
  setDate: (date: Date) => void;
  setTime: (time: string) => void;
  setCouponCode: (code: string) => void;

  // Calculadoras
  getTotalPrice: () => number;
  getTotalDuration: () => number;
}

export const useBookingProcessStore = create<BookingState>((set, get) => ({
  step: 1,
  loading: false,
  error: null,

  provider: null,
  professionals: [],
  availableServices: [],

  professional: null,
  services: [],
  date: null,
  time: null,
  couponCode: null,

  // ==========================================================================
  // BUSCA DADOS PÚBLICOS DO PRESTADOR PARA O AGENDAMENTO (OPÇÃO A - ALTA PERFORMANCE)
  // ==========================================================================
  fetchProviderData: async (providerId: string) => {
    set({ loading: true, error: null });
    try {
      // Faz apenas UMA requisição que traz tudo de uma vez do Java
      const response = await api.get<{
        provider: ServiceProviderProfile;
        professionals: ProfessionalProfile[];
        services: Service[];
      }>(`/service-providers/public/${providerId}/booking-data`);

      set({
        provider: response.data.provider,
        professionals: response.data.professionals,
        availableServices: response.data.services,
        loading: false,
      });
    } catch (error) {
      set({
        error: extractErrorMessage(
          error,
          "Erro ao carregar dados do estabelecimento.",
        ),
        loading: false,
      });
    }
  },

  // ==========================================================================
  // NAVEGAÇÃO E RESET
  // ==========================================================================
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
  reset: () =>
    set({
      step: 1,
      loading: false,
      error: null,
      provider: null,
      professionals: [],
      availableServices: [],
      professional: null,
      services: [],
      date: null,
      time: null,
      couponCode: null,
    }),

  // ==========================================================================
  // SELEÇÕES
  // ==========================================================================
  setProfessional: (professional) => set({ professional, time: null }),

  toggleService: (service) =>
    set((state) => {
      const exists = state.services.find((s) => s.id === service.id);
      if (exists) {
        return { services: state.services.filter((s) => s.id !== service.id) };
      }
      return { services: [...state.services, service] };
    }),

  setDate: (date) => set({ date, time: null }),
  setTime: (time) => set({ time }),
  setCouponCode: (code) => set({ couponCode: code }),

  // ==========================================================================
  // CALCULADORAS DE RESUMO
  // ==========================================================================
  getTotalPrice: () => {
    return get().services.reduce((total, service) => total + service.price, 0);
  },

  getTotalDuration: () => {
    return get().services.reduce(
      (total, service) => total + service.duration,
      0,
    );
  },

  // ==========================================================================
  // AÇÃO FINAL: CONFIRMAR AGENDAMENTO (CHAMADA À API JAVA)
  // ==========================================================================
  confirmBooking: async (client: ClientProfile, notes?: string) => {
    const state = get();

    if (
      !state.provider ||
      !state.professional ||
      state.services.length === 0 ||
      !state.date ||
      !state.time
    ) {
      const errMsg = "Faltam informações para concluir o agendamento.";
      set({ error: errMsg });
      toast.error(errMsg);
      throw new Error(errMsg);
    }

    set({ loading: true, error: null });

    try {
      const dateString = state.date.toISOString().split("T")[0];
      const startDateTime = new Date(`${dateString}T${state.time}:00`);
      const endDateTime = new Date(
        startDateTime.getTime() + state.getTotalDuration() * 60000,
      );

      const items = state.services.map((service) => ({
        referenceId: service.id,
        name: service.name,
        type: "SERVICE" as const,
        price: service.price,
        quantity: 1,
      }));

      const payload: CreateAppointmentRequest = {
        professionalId: state.professional.id,
        clientId: client.id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        items: items,
        couponCode: state.couponCode || undefined,
        notes: notes,
      };

      const response = await api.post<Appointment>("/appointments", payload);

      // Aqui usamos resetState limpo (limpa só a seleção, não o provedor) para evitar bugs de tela
      set({
        step: 4, // Finalizado
        loading: false,
        professional: null,
        services: [],
        date: null,
        time: null,
      });
      toast.success("Agendamento confirmado com sucesso!");

      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(
        error,
        "Erro ao confirmar agendamento. O horário pode já não estar disponível.",
      );
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },
}));
