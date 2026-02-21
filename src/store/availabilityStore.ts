import { create } from 'zustand';
import { isAxiosError } from 'axios';
import { toast } from 'react-hot-toast';
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

interface AvailabilityState {
  availableSlots: string[];
  loading: boolean;
  error: string | null;

  // Ações
  fetchAvailableSlots: (professionalId: string, date: string, serviceIds?: string[]) => Promise<string[]>;
  blockTime: (professionalId: string, startTime: string, endTime: string, notes?: string) => Promise<void>;
  clearSlots: () => void;
  clearError: () => void;
}

export const useAvailabilityStore = create<AvailabilityState>((set) => ({
  availableSlots: [],
  loading: false,
  error: null,

  // ==========================================================================
  // 1. BUSCAR HORÁRIOS LIVRES DE UM PROFISSIONAL PARA UM DIA ESPECÍFICO
  // ==========================================================================
  fetchAvailableSlots: async (professionalId: string, date: string, serviceIds?: string[]) => {
    set({ loading: true, error: null, availableSlots: [] });
    try {
      // Endpoint que a API Java usa para calcular os slots livres (GetAvailableSlotsUseCase)
      // Passamos a data (YYYY-MM-DD) e opcionalmente os IDs dos serviços para o Java calcular a duração total necessária
      const response = await api.get<string[]>(`/professionals/${professionalId}/available-slots`, {
        params: { 
          date, 
          services: serviceIds?.join(',') // Ex: ?date=2026-02-25&services=id1,id2
        }
      });
      
      set({ availableSlots: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ 
        error: extractErrorMessage(error, 'Erro ao carregar horários disponíveis.'), 
        loading: false 
      });
      return [];
    }
  },

  // ==========================================================================
  // 2. BLOQUEAR HORÁRIO MANUALMENTE (USADO PELO DONO/BARBEIRO)
  // ==========================================================================
  blockTime: async (professionalId: string, startTime: string, endTime: string, notes?: string) => {
    set({ loading: true, error: null });
    try {
      // Chama o endpoint ligado ao BlockProfessionalTimeRequest da sua API Java
      await api.post(`/professionals/${professionalId}/block-time`, {
        startTime, // ISO String
        endTime,   // ISO String
        notes
      });
      
      toast.success('Horário bloqueado com sucesso na agenda.');
      set({ loading: false });
    } catch (error) {
      const errMsg = extractErrorMessage(error, 'Erro ao bloquear o horário.');
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
      throw error;
    }
  },

  // Limpa os slots ao mudar de profissional ou cancelar a seleção
  clearSlots: () => set({ availableSlots: [] }),
  clearError: () => set({ error: null })
}));