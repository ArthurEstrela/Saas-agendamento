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
  pendingRequests: Appointment[]; // ✨ Lista exclusiva para o Inbox/Solicitações pendentes
  
  loading: boolean;
  loadingPending: boolean; // ✨ Loading separado para não travar a UI da agenda principal
  error: string | null;
  selectedDate: Date;

  // Ações de Estado
  setSelectedDate: (date: Date) => void;
  clearError: () => void;

  // Chamadas à API
  fetchAppointments: (providerId: string, startDate: string, endDate: string) => Promise<void>;
  fetchPendingRequests: (providerId: string) => Promise<void>;
  confirmAppointment: (appointmentId: string) => Promise<void>;
  cancelAppointment: (appointmentId: string, reason?: string) => Promise<void>;
  markNoShow: (appointmentId: string) => Promise<void>;
  completeAppointment: (appointmentId: string, payload: CompleteAppointmentRequest) => Promise<void>;
}

export const useProviderAppointmentsStore = create<ProviderAppointmentsState>((set) => ({
  appointments: [],
  pendingRequests: [],
  loading: false,
  loadingPending: false,
  error: null,
  selectedDate: new Date(),

  setSelectedDate: (date: Date) => set({ selectedDate: date }),
  clearError: () => set({ error: null }),

  // ==========================================================================
  // 1. BUSCAR AGENDAMENTOS DO CALENDÁRIO (FILTRADOS POR DATA)
  // ==========================================================================
  fetchAppointments: async (providerId: string, startDate: string, endDate: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<PagedResult<Appointment> | Appointment[]>(
        `/appointments/provider/${providerId}`, 
        { params: { startDate, endDate } }
      );
      
      // Lê 'items' do PagedResult.java ou faz fallback se for um Array direto
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data as PagedResult<Appointment>).items || [];

      set({ appointments: data, loading: false });
    } catch (error) {
      set({ error: extractErrorMessage(error, 'Erro ao carregar a agenda.'), loading: false });
    }
  },

  // ==========================================================================
  // 1.5. BUSCAR APENAS SOLICITAÇÕES PENDENTES (INBOX GERAL)
  // ==========================================================================
  fetchPendingRequests: async (providerId: string) => {
    set({ loadingPending: true, error: null });
    try {
      // Endpoint dedicado (sem filtro de data) para trazer todas as pendências
      const response = await api.get<PagedResult<Appointment> | Appointment[]>(
        `/appointments/provider/${providerId}/pending`
      );
      
      const data = Array.isArray(response.data) 
        ? response.data 
        : (response.data as PagedResult<Appointment>).items || [];

      set({ pendingRequests: data, loadingPending: false });
    } catch (error) {
      set({ error: extractErrorMessage(error, 'Erro ao carregar solicitações pendentes.'), loadingPending: false });
    }
  },

  // ==========================================================================
  // 2. CONFIRMAR AGENDAMENTO
  // ==========================================================================
  confirmAppointment: async (appointmentId: string) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/appointments/${appointmentId}/confirm`);
      
      set((state) => ({
        // Atualiza o status na agenda principal (se ele já estiver lá)
        appointments: state.appointments.map((apt) => 
          apt.id === appointmentId ? { ...apt, status: 'CONFIRMED' } : apt
        ),
        // Remove instantaneamente da lista de pendentes (Inbox limpa sem recarregar a página)
        pendingRequests: state.pendingRequests.filter((apt) => apt.id !== appointmentId),
        loading: false
      }));
    } catch (error) {
      set({ error: extractErrorMessage(error, 'Erro ao confirmar o agendamento.'), loading: false });
      throw error;
    }
  },

  // ==========================================================================
  // 3. CANCELAR AGENDAMENTO (REJEITAR)
  // ==========================================================================
  cancelAppointment: async (appointmentId: string, reason?: string) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/appointments/${appointmentId}/cancel`, { reason });
      
      set((state) => ({
        appointments: state.appointments.map((apt) => 
          apt.id === appointmentId ? { ...apt, status: 'CANCELLED', rejectionReason: reason } : apt
        ),
        // Remove instantaneamente da aba de solicitações pendentes
        pendingRequests: state.pendingRequests.filter((apt) => apt.id !== appointmentId),
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
      await api.patch(`/appointments/${appointmentId}/complete`, payload);
      
      set((state) => ({
        appointments: state.appointments.map((apt) => 
          apt.id === appointmentId 
            ? { 
                ...apt, 
                status: 'COMPLETED', 
                paymentMethod: payload.paymentMethod as any, 
                // ✨ CORREÇÃO: Utilizando a nova propriedade 'serviceFinalPrice' do DTO.
                // Preenchemos tanto 'finalAmount' quanto 'totalPrice' no Frontend 
                // para garantir compatibilidade com componentes que usem qualquer um dos dois.
                finalAmount: payload.serviceFinalPrice,
                totalPrice: payload.serviceFinalPrice 
              } 
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