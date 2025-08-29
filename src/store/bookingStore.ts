import { create } from "zustand";
import type { Service, Professional, UserProfile, Booking } from "../types";

// Tipos para o calendário
type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

// Define a estrutura do nosso estado de agendamento
interface BookingState {
  currentStep: number;
  selectedServices: Service[];
  selectedProfessional: Professional | null;
  selectedDate: Value;
  selectedTime: string;
  totalPrice: number;
  totalDuration: number;
  serviceProvider: UserProfile | null;

  // Funções para manipular o estado
  setServiceProvider: (provider: UserProfile) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  setStep: (step: number) => void;
  toggleService: (service: Service) => void;
  selectProfessional: (professional: Professional | null) => void;
  setDate: (date: Value) => void;
  setTime: (time: string) => void;
  resetBooking: () => void;
}

const initialState = {
  currentStep: 1,
  serviceProvider: null,
  selectedServices: [],
  selectedProfessional: null,
  selectedDate: new Date(),
  selectedTime: "",
  totalPrice: 0,
  totalDuration: 0,
};

export const useBookingStore = create<BookingState>((set, get) => ({
  ...initialState,

  setServiceProvider: (provider) => set({ serviceProvider: provider }),

  goToNextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),

  goToPreviousStep: () =>
    set((state) => ({ currentStep: state.currentStep - 1 })),

  setStep: (step) => set({ currentStep: step }),

  toggleService: (service) => {
    const currentServices = get().selectedServices;
    const isAlreadySelected = currentServices.some((s) => s.id === service.id);

    if (isAlreadySelected) {
      set({
        selectedServices: currentServices.filter((s) => s.id !== service.id),
      });
    } else {
      set({ selectedServices: [...currentServices, service] });
    }
  },

  selectProfessional: (professional) =>
    set({
      selectedProfessional: professional,
      // Reseta a seleção de tempo ao mudar o profissional
      selectedTime: "",
    }),

  setProfessional: (professional) =>
    set({ selectedProfessional: professional }),

  setDate: (date) => set({ selectedDate: date, selectedTime: null }),
  setTime: (time) => set({ selectedTime: time }),

  resetBooking: () => set(initialState),
}));
