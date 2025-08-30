import { create } from 'zustand';
import type { UserProfile, Service } from '../types';

/**
 * Interface para o estado do processo de agendamento.
 * Gerencia o estado temporário do formulário de agendamento de múltiplas etapas.
 */
interface BookingProcessState {
  // Dados do agendamento
  serviceProvider: UserProfile | null;
  selectedServices: Service[];
  selectedProfessional: UserProfile | null;
  selectedDate: Date;
  selectedTime: string | null;
  
  // Controle de UI
  currentStep: number;

  // Ações para modificar o estado
  setServiceProvider: (provider: UserProfile | null) => void;
  toggleService: (service: Service) => void;
  setSelectedProfessional: (professional: UserProfile | null) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedTime: (time: string | null) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetBooking: () => void;
}

/**
 * O estado inicial para o formulário de agendamento.
 * Usado tanto na criação do store quanto na função de reset.
 */
const initialState = {
  serviceProvider: null,
  selectedServices: [],
  selectedProfessional: null,
  selectedDate: new Date(),
  selectedTime: null,
  currentStep: 1,
};

/**
 * Zustand store para gerenciar o processo de criação de um novo agendamento.
 */
const useBookingProcessStore = create<BookingProcessState>((set, get) => ({
  ...initialState,

  setServiceProvider: (provider) => set({ serviceProvider: provider }),

  toggleService: (service) => {
    const currentServices = get().selectedServices;
    const isSelected = currentServices.some(s => s.id === service.id);
    if (isSelected) {
      set({ selectedServices: currentServices.filter(s => s.id !== service.id) });
    } else {
      set({ selectedServices: [...currentServices, service] });
    }
  },

  setSelectedProfessional: (professional) => set({ selectedProfessional: professional }),
  
  setSelectedDate: (date) => set({ selectedDate: date, selectedTime: null }), // Reseta a hora ao mudar a data

  setSelectedTime: (time) => set({ selectedTime: time }),

  goToNextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) })),
  
  goToPreviousStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

  resetBooking: () => set(initialState),
}));

export default useBookingProcessStore;
