// src/store/bookingProcessStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Service,
  Professional,
  ServiceProviderProfile,
  Appointment,
} from "../types";
import { createAppointment } from "../firebase/bookingService";
import { getUserProfile } from "../firebase/userService";

// Interface para o estado
interface BookingState {
  provider: ServiceProviderProfile | null;
  isLoading: boolean;
  selectedServices: Service[];
  professional: Professional | null;
  date: Date | null;
  timeSlot: string | null;
  currentStep: number;
  isBooking: boolean;
  bookingSuccess: boolean;
  bookingError: string | null;
  redirectUrlAfterLogin: string | null;
}

// Interface para as ações
interface BookingActions {
  fetchProviderDetailsById: (
    providerId: string
  ) => Promise<ServiceProviderProfile | null>; // Alterado para retornar o perfil
  syncStateWithFreshProvider: (freshProvider: ServiceProviderProfile) => void; // <-- NOVA FUNÇÃO
  toggleService: (service: Service) => void;
  selectProfessional: (professional: Professional) => void;
  selectDateTime: (date: Date, timeSlot: string) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetBooking: (keepProvider?: boolean) => void; // Melhoria para manter o provider ao resetar
  setRedirectUrlAfterLogin: (url: string | null) => void;
  confirmBooking: (appointmentData: Omit<Appointment, "id">) => Promise<void>;
}

interface BookingStore extends BookingState, BookingActions {}

const initialState: BookingState = {
  provider: null,
  isLoading: true,
  selectedServices: [],
  professional: null,
  date: null,
  timeSlot: null,
  currentStep: 1,
  isBooking: false,
  bookingSuccess: false,
  bookingError: null,
  redirectUrlAfterLogin: null,
};

export const useBookingProcessStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchProviderDetailsById: async (providerId) => {
        set({ isLoading: true });
        try {
          const providerProfile = await getUserProfile(providerId);
          if (providerProfile && providerProfile.role === "serviceProvider") {
            const freshProvider = providerProfile as ServiceProviderProfile;
            set({
              provider: freshProvider,
              isLoading: false,
            });
            return freshProvider; // Retorna os dados frescos
          } else {
            throw new Error("Prestador não encontrado.");
          }
        } catch (error) {
          console.error("Erro ao buscar detalhes do prestador por ID:", error);
          set({ isLoading: false, provider: null });
          return null;
        }
      },

      // --- NOVA FUNÇÃO DE SINCRONIZAÇÃO ---
      // Recebe os dados mais recentes do provedor e valida as seleções salvas
      syncStateWithFreshProvider: (freshProvider) => {
        const { selectedServices, professional } = get();

        // 1. Valida os serviços selecionados
        const validSelectedServices = selectedServices.filter((selected) =>
          freshProvider.services.some(
            (freshService) => freshService.id === selected.id
          )
        );

        // 2. Valida o profissional selecionado
        const isProfessionalStillAvailable = freshProvider.professionals.some(
          (freshProf) => freshProf.id === professional?.id
        );
        const validProfessional = isProfessionalStillAvailable
          ? professional
          : null;

        // Se alguma seleção foi invalidada, reseta os passos seguintes
        const shouldResetDateTime =
          !isProfessionalStillAvailable ||
          validSelectedServices.length !== selectedServices.length;

        set({
          provider: freshProvider,
          selectedServices: validSelectedServices,
          professional: validProfessional,
          date: shouldResetDateTime ? null : get().date,
          timeSlot: shouldResetDateTime ? null : get().timeSlot,
          // Se o profissional foi removido, volta para a seleção de profissional
          currentStep:
            get().currentStep > 2 && !validProfessional ? 2 : get().currentStep,
          isLoading: false,
        });
      },

      toggleService: (service) => {
        const { selectedServices } = get();
        const isSelected = selectedServices.some((s) => s.id === service.id);
        const newSelectedServices = isSelected
          ? selectedServices.filter((s) => s.id !== service.id)
          : [...selectedServices, service];
        set({ selectedServices: newSelectedServices });
      },
      selectProfessional: (professional) =>
        set({ professional, date: null, timeSlot: null, currentStep: 3 }),
      selectDateTime: (date, timeSlot) => set({ date, timeSlot }),
      goToNextStep: () =>
        set((state) => ({ currentStep: state.currentStep + 1 })),
      goToPreviousStep: () =>
        set((state) => ({ currentStep: state.currentStep - 1 })),

      resetBooking: (keepProvider = false) => {
        const providerToKeep = keepProvider ? get().provider : null;
        set({
          ...initialState,
          provider: providerToKeep,
          isLoading: !keepProvider,
          redirectUrlAfterLogin: null,
        });
      },

      setRedirectUrlAfterLogin: (url) => set({ redirectUrlAfterLogin: url }),

      confirmBooking: async (appointmentData) => {
        set({ isBooking: true, bookingError: null });
        try {
          await createAppointment(appointmentData);
          set({ isBooking: false, bookingSuccess: true });
        } catch (error) {
          console.error("Erro ao confirmar agendamento:", error);
          set({
            isBooking: false,
            bookingError: "Falha ao criar o agendamento. Tente novamente.",
          });
        }
      },
    }),
    {
      name: "booking-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Não salvamos mais o 'provider' e 'isLoading'. Eles serão sempre buscados.
        selectedServices: state.selectedServices,
        professional: state.professional,
        date: state.date,
        timeSlot: state.timeSlot,
        currentStep: state.currentStep,
        redirectUrlAfterLogin: state.redirectUrlAfterLogin,
      }),
    }
  )
);
