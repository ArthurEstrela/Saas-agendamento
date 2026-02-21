import { create } from 'zustand';
import { isAxiosError } from 'axios';
import type { Appointment, CompleteAppointmentRequest, PagedResult } from '../types';
import { api } from '../lib/api';

const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

interface ProviderAppointmentsState {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  selectedDate: Date;

  // Ações de Estado
  setSelectedDate: (date: Date) => void;
  clearError: () => void;

  // Chamadas à API
  fetchAppointments: (providerId: string, startDate: string, endDate: string) => Promise<void>;
  confirmAppointment: (appointmentId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string, reason?: string) => Promise<void>;
  markNoShow: (appointmentId: string) => Promise<void>;
  completeAppointment: (appointmentId: string, payload: CompleteAppointmentRequest) => Promise<void>;
}

export const useProviderAppointmentsStore = create<ProviderAppointmentsState>((set) => ({
  appointments: [],
  loading: false,
  error: null,
  selectedDate: new Date(),

  setSelectedDate: (date: Date) => set({ selectedDate: date }),
  clearError: () => set({ error: null }),

  // ==========================================================================
  // 1. BUSCAR AGENDAMENTOS DO ESTABELECIMENTO/PROFISSIONAL
  // ==========================================================================
  fetchAppointments: async (providerId: string, startDate: string, endDate: string) => {
    set({ loading: true, error: null });
    try {
      // Faz o fetch passando as datas na query string para o Java não trazer dados de há 3 anos atrás
      const response = await api.get<PagedResult<Appointment> | Appointment[]>(
        `/appointments/provider/${providerId}`, 
        { params: { startDate, endDate } }
      );
      
      // Lida de forma inteligente se o backend retornar paginação (PagedResult) ou uma lista direta
      const data = Array.isArray(response.data) ? response.data : response.data.data;

      set({ appointments: data, loading: false });
    } catch (error) {
      set({ error: extractErrorMessage(error, 'Erro ao carregar a agenda.'), loading: false });
    }
  },

  // ==========================================================================
  // 2. CONFIRMAR AGENDAMENTO
  // ==========================================================================
  confirmAppointment: async (appointmentId: string) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/appointments/${appointmentId}/confirm`);
      
      // Atualiza o status localmente para UI reagir instantaneamente
      set((state) => ({
        appointments: state.appointments.map((apt) => 
          apt.id === appointmentId ? { ...apt, status: 'CONFIRMED' } : apt
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: extractErrorMessage(error, 'Erro ao confirmar o agendamento.'), loading: false });
      throw error;
    }
  },

  // ==========================================================================
  // 3. CANCELAR AGENDAMENTO
  // ==========================================================================
  cancelAppointment: async (appointmentId: string, reason?: string) => {
    set({ loading: true, error: null });
    try {
      // Passa o motivo da rejeição no body se o profissional quiser justificar
      await api.patch(`/appointments/${appointmentId}/cancel`, { reason });
      
      set((state) => ({
        appointments: state.appointments.map((apt) => 
          apt.id === appointmentId ? { ...apt, status: 'CANCELLED', rejectionReason: reason } : apt
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: extractErrorMessage(error, 'Erro ao cancelar o agendamento.'), loading: false });
      throw error;
    }
  },

  // ==========================================================================
  // 4. MARCAR FALTA (NO-SHOW)
  // ==========================================================================
  markNoShow: async (appointmentId: string) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/appointments/${appointmentId}/no-show`);
      
      set((state) => ({
        appointments: state.appointments.map((apt) => 
          apt.id === appointmentId ? { ...apt, status: 'NO_SHOW' } : apt
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: extractErrorMessage(error, 'Erro ao marcar falta do cliente.'), loading: false });
      throw error;
    }
  },

  // ==========================================================================
  // 5. FINALIZAR SERVIÇO (CHECKOUT / POS)
  // ==========================================================================
  completeAppointment: async (appointmentId: string, payload: CompleteAppointmentRequest) => {
    set({ loading: true, error: null });
    try {
      // Endpoint que integra o Agendamento com o Módulo Financeiro e de Stock
      await api.post(`/appointments/${appointmentId}/complete`, payload);
      
      set((state) => ({
        appointments: state.appointments.map((apt) => 
          apt.id === appointmentId 
            ? { ...apt, status: 'COMPLETED', paymentMethod: payload.paymentMethod, finalAmount: payload.finalAmount } 
            : apt
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: extractErrorMessage(error, 'Erro ao finalizar o serviço e processar pagamento.'), loading: false });
      throw error;
    }
  }
}));