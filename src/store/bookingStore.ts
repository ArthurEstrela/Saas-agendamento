import { create } from 'zustand';
import type { Service, Professional, UserProfile  } from '../types';

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

  goToNextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) })),
  goToPreviousStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
  setStep: (step) => set({ currentStep: step }),

  toggleService: (service: Service) => {
    const currentServices = get().selectedServices;
    const isSelected = currentServices.some(s => s.id === service.id);
    
    const newServices = isSelected
      ? currentServices.filter(s => s.id !== service.id)
      : [...currentServices, service];

    // Recalcula o preço e a duração
    const { totalPrice, totalDuration } = newServices.reduce(
      (acc, s) => {
        acc.totalPrice += s.price || 0;
        acc.totalDuration += s.duration || 0;
        return acc;
      },
      { totalPrice: 0, totalDuration: 0 }
    );

    set({ 
      selectedServices: newServices,
      totalPrice,
      totalDuration,
      // Reseta as seleções futuras ao mudar os serviços
      selectedProfessional: null, 
      selectedTime: "" 
    });
  },

  selectProfessional: (professional) => set({ 
    selectedProfessional: professional,
    // Reseta a seleção de tempo ao mudar o profissional
    selectedTime: "" 
  }),

  setDate: (date) => set({ 
    selectedDate: date,
    // Reseta a seleção de tempo ao mudar a data
    selectedTime: "" 
  }),

  setTime: (time) => set({ selectedTime: time }),

  setServiceProvider: (provider) => set({ serviceProvider: provider }),

  resetBooking: () => set(initialState),
}));
