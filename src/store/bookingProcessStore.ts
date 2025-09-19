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
  pendingProviderId: string | null;
}

// Interface para as ações
interface BookingActions {
  fetchProviderDetailsById: (providerId: string) => Promise<void>;
  toggleService: (service: Service) => void;
  selectProfessional: (professional: Professional) => void;
  selectDateTime: (date: Date, timeSlot: string) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetBooking: () => void;
  setPendingProviderId: (providerId: string | null) => void;
  confirmBooking: (appointmentData: Omit<Appointment, "id">) => Promise<void>;
}

// Une as duas em uma única interface para a store
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
  pendingProviderId: null,
};

export const useBookingProcessStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // --- Suas Funções (Actions) ---
      fetchProviderDetailsById: async (providerId) => {
        set({ isLoading: true });
        try {
          const providerProfile = await getUserProfile(providerId);
          if (providerProfile && providerProfile.role === "serviceProvider") {
            set({
              provider: providerProfile as ServiceProviderProfile,
              isLoading: false,
            });
          } else {
            throw new Error("Prestador não encontrado.");
          }
        } catch (error) {
          console.error("Erro ao buscar detalhes do prestador por ID:", error);
          set({ isLoading: false, provider: null });
        }
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
      resetBooking: () => {
        const provider = get().provider;
        set({ ...initialState, provider, isLoading: false });
      },
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
      setPendingProviderId: (providerId) =>
        set({ pendingProviderId: providerId }),
    }),
    {
      name: "booking-storage",
      storage: createJSONStorage(() => localStorage),

      // AQUI ESTÁ A CORREÇÃO PRINCIPAL
      partialize: (state) => ({
        selectedServices: state.selectedServices,
        professional: state.professional,
        date: state.date,
        timeSlot: state.timeSlot,
        currentStep: state.currentStep,
        pendingProviderId: state.pendingProviderId,
        provider: state.provider,
        isLoading: state.isLoading,
      }),
    }
  )
);
