import { create } from "zustand";
import type { Appointment } from "../types";
import {
  getAppointmentsByClientId
} from "../firebase/bookingService";

interface UserAppointmentsState {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  fetchAppointments: (clientId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string) => Promise<void>;
}

export const useUserAppointmentsStore = create<UserAppointmentsState>(
  (set, get) => ({
    appointments: [],
    isLoading: false,
    error: null,

    fetchAppointments: async (clientId: string) => {
      if (!clientId) return;
      set({ isLoading: true, error: null });
      try {
        const appointments = await getAppointmentsByClientId(clientId);
        set({ appointments, isLoading: false });
      } catch (err: unknown) {
        let errorMessage = "Erro ao buscar agendamentos.";
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        set({ error: errorMessage, isLoading: false });
      }
    },

    cancelAppointment: async (appointmentId: string) => {
      try {
        // Atualiza o status no Firebase
        const updatedAppointments = get().appointments.map((app) =>
          app.id === appointmentId
            ? ({ ...app, status: "cancelled" } as Appointment) // Correção aqui!
            : app
        );
        set({ appointments: updatedAppointments });
      } catch (err: unknown) {
        console.error("Erro ao cancelar agendamento:", err);
        // Aqui poderíamos reverter o estado se a chamada falhar, se necessário
        // Por enquanto, apenas logamos o erro para não complicar.
      }
    },
  })
);
