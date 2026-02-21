import { create } from 'zustand';
import { isAxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import type { Appointment, PagedResult } from '../types';
import { api } from '../lib/api';

// Helper de erro padronizado para extrair a mensagem exata do Spring Boot
const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

interface UserAppointmentsState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;

  // Ações
  fetchUserAppointments: () => Promise<void>;
  cancelAppointment: (appointmentId: string, reason?: string) => Promise<void>;
  clearError: () => void;
}

export const useUserAppointmentsStore = create<UserAppointmentsState>((set) => ({
  appointments: [],
  loading: false,
  error: null,

  // ==========================================================================
  // 1. BUSCAR O HISTÓRICO E AGENDAMENTOS FUTUROS DO CLIENTE
  // ==========================================================================
  fetchUserAppointments: async () => {
    set({ loading: true, error: null });
    try {
      // O Spring Boot sabe de quem é o histórico através do Token (Bearer) no cabeçalho.
      // Sem necessidade de passar o ID do utilizador na rota (maior segurança).
      const response = await api.get<PagedResult<Appointment> | Appointment[]>('/appointments/client');
      
      // Lida de forma inteligente consoante o backend retorne PagedResult ou uma Lista direta
      const data = Array.isArray(response.data) ? response.data : response.data.data;
      
      set({ appointments: data, loading: false });
    } catch (error) {
      set({ 
        error: extractErrorMessage(error, 'Erro ao carregar os teus agendamentos.'), 
        loading: false 
      });
    }
  },

  // ==========================================================================
  // 2. CANCELAR AGENDAMENTO (CLIENTE)
  // ==========================================================================
  cancelAppointment: async (appointmentId: string, reason?: string) => {
    set({ loading: true, error: null });
    try {
      // Chama o endpoint de cancelamento. A API Java irá validar as regras de tempo (ex: min 24h de antecedência)
      await api.patch(`/appointments/${appointmentId}/cancel`, { reason });
      
      // Se a API permitir (Status 200 OK), atualizamos a UI instantaneamente (Optimistic Update)
      set((state) => ({
        appointments: state.appointments.map((apt) => 
          apt.id === appointmentId 
            ? { ...apt, status: 'CANCELLED', rejectionReason: reason || 'Cancelado pelo cliente' } 
            : apt
        ),
        loading: false
      }));

      toast.success('Agendamento cancelado com sucesso.');
    } catch (error) {
      // Se a API barrar o cancelamento (ex: "Já não pode cancelar com tão pouca antecedência"), mostra o Toast.
      const errorMessage = extractErrorMessage(error, 'Não foi possível cancelar o agendamento.');
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));