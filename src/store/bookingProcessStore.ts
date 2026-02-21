import { create } from 'zustand';
import { isAxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import type { 
  Service, 
  ProfessionalProfile, 
  ServiceProviderProfile, 
  ClientProfile,
  CreateAppointmentRequest,
  Appointment
} from '../types';
import { api } from '../lib/api';

// Helper de erro padronizado
const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

interface BookingState {
  // Estado do Processo
  step: number;
  loading: boolean;
  error: string | null;

  // Seleções do Cliente
  provider: ServiceProviderProfile | null;
  professional: ProfessionalProfile | null;
  services: Service[];
  date: Date | null;
  time: string | null;
  couponCode: string | null;

  // Ações de Navegação
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;

  // Ações de Seleção
  setProvider: (provider: ServiceProviderProfile) => void;
  setProfessional: (professional: ProfessionalProfile | null) => void;
  toggleService: (service: Service) => void;
  setDate: (date: Date) => void;
  setTime: (time: string) => void;
  setCouponCode: (code: string) => void;

  // Calculadoras
  getTotalPrice: () => number;
  getTotalDuration: () => number;

  // Ação Final (Comunicação com Java)
  confirmBooking: (client: ClientProfile, notes?: string) => Promise<Appointment>;
}

export const useBookingProcessStore = create<BookingState>((set, get) => ({
  // Estado Inicial
  step: 1,
  loading: false,
  error: null,
  provider: null,
  professional: null,
  services: [],
  date: null,
  time: null,
  couponCode: null,

  // ==========================================================================
  // NAVEGAÇÃO
  // ==========================================================================
  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),
  reset: () => set({
    step: 1,
    loading: false,
    error: null,
    provider: null,
    professional: null,
    services: [],
    date: null,
    time: null,
    couponCode: null,
  }),

  // ==========================================================================
  // SELEÇÕES
  // ==========================================================================
  setProvider: (provider) => set({ provider, professional: null, services: [], date: null, time: null }),
  setProfessional: (professional) => set({ professional, time: null }),
  
  toggleService: (service) => set((state) => {
    const exists = state.services.find((s) => s.id === service.id);
    if (exists) {
      return { services: state.services.filter((s) => s.id !== service.id) };
    }
    return { services: [...state.services, service] };
  }),

  setDate: (date) => set({ date, time: null }),
  setTime: (time) => set({ time }),
  setCouponCode: (code) => set({ couponCode: code }),

  // ==========================================================================
  // CALCULADORAS DE RESUMO
  // ==========================================================================
  getTotalPrice: () => {
    return get().services.reduce((total, service) => total + service.price, 0);
  },
  
  getTotalDuration: () => {
    return get().services.reduce((total, service) => total + service.duration, 0);
  },

  // ==========================================================================
  // AÇÃO FINAL: CONFIRMAR AGENDAMENTO (CHAMADA À API JAVA)
  // ==========================================================================
  confirmBooking: async (client: ClientProfile, notes?: string) => {
    const state = get();
    
    // Validações de segurança antes de chamar a API
    if (!state.provider || !state.professional || state.services.length === 0 || !state.date || !state.time) {
      const errMsg = 'Faltam informações para concluir o agendamento.';
      set({ error: errMsg });
      toast.error(errMsg);
      throw new Error(errMsg);
    }

    set({ loading: true, error: null });

    try {
      // 1. Criar as Strings ISO de Data e Hora combinadas
      // Extrai YYYY-MM-DD da data selecionada
      const dateString = state.date.toISOString().split('T')[0]; 
      
      // Assumindo que state.time é "14:30" (Ajusta o fuso horário para UTC/Local consoante o backend)
      const startDateTime = new Date(`${dateString}T${state.time}:00`);
      
      // Calcula o fim com base na duração total dos serviços escolhidos
      const endDateTime = new Date(startDateTime.getTime() + state.getTotalDuration() * 60000);

      // 2. Mapear os serviços escolhidos para o formato AppointmentItem do Java
      const items = state.services.map(service => ({
        referenceId: service.id,
        type: "SERVICE" as const, // Força a tipagem estrita
        quantity: 1
      }));

      // 3. Montar o DTO exato que o Spring Boot (AppointmentController) espera
      const payload: CreateAppointmentRequest = {
        professionalId: state.professional.id,
        clientId: client.id,
        startTime: startDateTime.toISOString(), // Envia como String ISO 8601
        endTime: endDateTime.toISOString(),
        items: items,
        couponCode: state.couponCode || undefined,
        notes: notes
      };

      // 4. Enviar para o Backend
      const response = await api.post<Appointment>('/appointments', payload);
      
      // Limpa o store após o sucesso
      get().reset();
      toast.success('Agendamento confirmado com sucesso!');
      
      return response.data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error, 'Erro ao confirmar agendamento. O horário pode já não estar disponível.');
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      throw error;
    }
  }
}));