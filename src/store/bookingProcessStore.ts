import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Service, Professional } from '../types';
import { createAppointment } from '../firebase/bookingService';
import { useAuthStore } from './authStore';
import { useProfileStore } from './profileStore';

interface BookingState {
  service: Service | null;
  professional: Professional | null;
  date: Date | null;
  timeSlot: string | null;
  currentStep: number;
}

interface BookingActions {
  selectService: (service: Service) => void;
  selectProfessional: (professional: Professional) => void;
  selectDate: (date: Date) => void;
  selectTimeSlot: (timeSlot: string) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetBooking: () => void;
  confirmBooking: () => Promise<{ success: boolean; error?: string }>;
}

const initialState: BookingState = {
  service: null,
  professional: null,
  date: null,
  timeSlot: null,
  currentStep: 1,
};

// --- A MÁGICA ACONTECE AQUI ---
export const useBookingProcessStore = create(
  persist<BookingState & BookingActions>(
    (set, get) => ({
      ...initialState,

      selectService: (service) => set({ service, professional: null, date: null, timeSlot: null, currentStep: 2 }),
      selectProfessional: (professional) => set({ professional, date: null, timeSlot: null, currentStep: 3 }),
      selectDate: (date) => set({ date, timeSlot: null }),
      selectTimeSlot: (timeSlot) => set({ timeSlot }),

      goToNextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      goToPreviousStep: () => set((state) => ({ currentStep: state.currentStep - 1 })),

      resetBooking: () => set(initialState),

      confirmBooking: async () => {
        const { service, professional, date, timeSlot } = get();
        const { user } = useAuthStore.getState();
        const { userProfile } = useProfileStore.getState();

        if (!service || !professional || !date || !timeSlot || !user || !userProfile) {
          return { success: false, error: "Dados incompletos para o agendamento." };
        }
        
        // A lógica de criação do agendamento continua a mesma
        // ... (código para criar startTime, endTime, newAppointment)
        const startTime = new Date(date);
        const [hours, minutes] = timeSlot.split(':').map(Number);
        startTime.setHours(hours, minutes, 0, 0);
        const endTime = new Date(startTime.getTime() + service.duration * 60000);
        const newAppointment = {
            clientId: user.uid,
            clientName: userProfile.name,
            professionalId: professional.id,
            professionalName: professional.name,
            serviceId: service.id,
            serviceName: service.name,
            startTime,
            endTime,
            status: 'pending' as const,
        };

        await createAppointment(newAppointment);
        get().resetBooking();
        return { success: true };
      },
    }),
    {
      name: 'booking-storage', // Nome da chave no localStorage
      storage: createJSONStorage(() => localStorage), // (opcional) especifica o storage
    }
  )
);