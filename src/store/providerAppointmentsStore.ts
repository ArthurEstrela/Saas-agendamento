import { create } from 'zustand';
import type { Appointment } from '../types';
import { getAppointmentsByProviderId, updateAppointmentStatus } from '../firebase/bookingService';

interface ProviderAppointmentsState {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  fetchAppointments: (providerId: string) => Promise<void>;
  approveAppointment: (appointmentId: string) => Promise<void>;
  completeAppointment: (appointmentId: string) => Promise<void>;
  rejectAppointment: (appointmentId: string, reason: string) => Promise<void>;
}

export const useProviderAppointmentsStore = create<ProviderAppointmentsState>((set) => ({
  appointments: [],
  isLoading: false,
  error: null,

  fetchAppointments: async (providerId: string) => {
    if (!providerId) return;
    set({ isLoading: true, error: null });
    try {
      const appointments = await getAppointmentsByProviderId(providerId);
      set({ appointments, isLoading: false });
    } catch (err: unknown) {
      let errorMessage = "Erro ao buscar agendamentos do prestador.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      set({ error: errorMessage, isLoading: false });
    }
  },

  // Ação para aprovar um agendamento de 'pending' para 'scheduled'
  approveAppointment: async (appointmentId: string) => {
    try {
      await updateAppointmentStatus(appointmentId, 'scheduled');
      
      set((state) => ({
        appointments: state.appointments.map((app) =>
          app.id === appointmentId ? ({ ...app, status: 'scheduled' } as Appointment) : app
        ),
      }));
    } catch (err: unknown) {
      console.error("Erro ao aprovar agendamento:", err);
      // Adicionar lógica para notificar o usuário do erro, se necessário
    }
  },

  // Ação para finalizar um agendamento de 'scheduled' para 'completed'
  completeAppointment: async (appointmentId: string) => {
    try {
      await updateAppointmentStatus(appointmentId, 'completed');

      set((state) => ({
        appointments: state.appointments.map((app) =>
          app.id === appointmentId ? ({ ...app, status: 'completed' } as Appointment) : app
        ),
      }));
    } catch (err: unknown) {
      console.error("Erro ao completar agendamento:", err);
    }
  },
  
  // Ação para rejeitar um agendamento de 'pending' para 'cancelled'
  rejectAppointment: async (appointmentId: string, reason: string) => {
    try {
      await updateAppointmentStatus(appointmentId, 'cancelled', reason);

      set((state) => ({
        appointments: state.appointments.map((app) =>
          app.id === appointmentId 
            ? ({ ...app, status: 'cancelled', rejectionReason: reason } as Appointment) 
            : app
        ),
      }));
    } catch (err: unknown) {
      console.error("Erro ao rejeitar agendamento:", err);
    }
  },
}));