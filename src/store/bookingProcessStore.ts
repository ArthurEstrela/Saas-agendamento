import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Service, Professional, ServiceProviderProfile, Appointment } from '../types'; // Importe Appointment
import { createAppointment } from '../firebase/bookingService';
import { getProviderProfileBySlug } from '../firebase/userService';

interface BookingState {
  provider: ServiceProviderProfile | null;
  isLoading: boolean;
  service: Service | null;
  professional: Professional | null;
  date: Date | null;
  timeSlot: string | null;
  currentStep: number;
  // --- ESTADOS ADICIONADOS ---
  isBooking: boolean; // Para o spinner do botão de confirmar
  bookingSuccess: boolean;
  bookingError: string | null;
}

interface BookingActions {
  fetchProviderDetails: (slug: string) => Promise<void>;
  selectService: (service: Service) => void;
  selectProfessional: (professional: Professional) => void;
  // Renomeado para consistência com o que o componente espera
  selectDateTime: (date: Date, timeSlot: string) => void; 
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetBooking: () => void;
  // A assinatura agora recebe os dados do agendamento
  confirmBooking: (appointmentData: Omit<Appointment, 'id'>) => Promise<void>;
}

const initialState: BookingState = {
  provider: null,
  isLoading: true,
  service: null,
  professional: null,
  date: null,
  timeSlot: null,
  currentStep: 1,
  // --- VALORES INICIAIS ADICIONADOS ---
  isBooking: false,
  bookingSuccess: false,
  bookingError: null,
};

export const useBookingProcessStore = create(
  persist<BookingState & BookingActions>(
    (set, get) => ({
      ...initialState,

      fetchProviderDetails: async (slug) => {
        const persistedState = get();
        set({ ...persistedState, isLoading: true });
        try {
          const providerProfile = await getProviderProfileBySlug(slug);
          if (providerProfile) {
            set({ provider: providerProfile, isLoading: false });
          } else {
            throw new Error('Prestador de serviço não encontrado.');
          }
        } catch (error) {
          console.error("Erro ao buscar detalhes do prestador:", error);
          set({ isLoading: false, provider: null });
        }
      },
      
      selectService: (service) => set({ service, professional: null, date: null, timeSlot: null }),
      selectProfessional: (professional) => set({ professional, date: null, timeSlot: null }),
      selectDateTime: (date, timeSlot) => set({ date, timeSlot }),

      goToNextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      goToPreviousStep: () => set((state) => ({ currentStep: state.currentStep - 1 })),

      resetBooking: () => {
        const provider = get().provider;
        set({ ...initialState, provider, isLoading: false });
      },

      // --- FUNÇÃO CONFIRMBOOKING CORRIGIDA ---
      confirmBooking: async (appointmentData) => {
        // 1. LIGA O LOADING
        set({ isBooking: true, bookingError: null });
        try {
          await createAppointment(appointmentData);
          // 2. EM CASO DE SUCESSO, ATUALIZA O ESTADO
          set({ isBooking: false, bookingSuccess: true });
          // Não precisa chamar resetBooking aqui, a tela de sucesso fará isso se necessário
        } catch (error) {
          console.error("Erro ao confirmar agendamento:", error);
          // 3. EM CASO DE ERRO, ATUALIZA O ESTADO E DESLIGA O LOADING
          set({ isBooking: false, bookingError: 'Falha ao criar o agendamento. Tente novamente.' });
        }
      },
    }),
    {
      name: 'booking-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        service: state.service,
        professional: state.professional,
        date: state.date,
        timeSlot: state.timeSlot,
        currentStep: state.currentStep,
      }),
    }
  )
);