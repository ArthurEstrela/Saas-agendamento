import { create } from 'zustand';
import { isAxiosError } from 'axios';
import type { Service } from '../types';
import { api } from '../lib/api';

// Helper de erro (Reutilizando a lógica sênior)
const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

interface ServiceManagementState {
  services: Service[];
  loading: boolean;
  error: string | null;
  
  // Ações
  fetchServices: (providerId: string) => Promise<void>;
  createService: (data: Omit<Service, 'id' | 'providerId'>) => Promise<void>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useServiceManagementStore = create<ServiceManagementState>((set) => ({
  services: [],
  loading: false,
  error: null,

  // 1. BUSCAR TODOS OS SERVIÇOS DO ESTABELECIMENTO
  fetchServices: async (providerId: string) => {
    set({ loading: true, error: null });
    try {
      // O Spring Boot devolve uma List<ServiceResponse> no ServiceController
      const response = await api.get<Service[]>(`/services/provider/${providerId}`);
      set({ services: response.data, loading: false });
    } catch (error) {
      set({ 
        error: extractErrorMessage(error, 'Erro ao carregar os serviços.'), 
        loading: false 
      });
    }
  },

  // 2. CRIAR UM NOVO SERVIÇO
  createService: async (data) => {
    set({ loading: true, error: null });
    try {
      // Envia os dados para a API (o provedor é inferido pelo token no backend ou passado no body dependendo da sua API)
      const response = await api.post<Service>('/services', {
        name: data.name,
        description: data.description,
        duration: data.duration,
        price: data.price,
        active: data.active ?? true
      });
      
      // Adiciona o novo serviço à lista atual sem precisar de fazer outro fetch
      set((state) => ({
        services: [...state.services, response.data],
        loading: false
      }));
    } catch (error) {
      set({ 
        error: extractErrorMessage(error, 'Erro ao criar o serviço.'), 
        loading: false 
      });
      throw error;
    }
  },

  // 3. ATUALIZAR UM SERVIÇO
  updateService: async (id: string, data: Partial<Service>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put<Service>(`/services/${id}`, data);
      
      // Atualiza o serviço específico na lista local
      set((state) => ({
        services: state.services.map((srv) => 
          srv.id === id ? response.data : srv
        ),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: extractErrorMessage(error, 'Erro ao atualizar o serviço.'), 
        loading: false 
      });
      throw error;
    }
  },

  // 4. ELIMINAR (OU DESATIVAR) UM SERVIÇO
  deleteService: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/services/${id}`);
      
      // Remove o serviço da lista local
      set((state) => ({
        services: state.services.filter((srv) => srv.id !== id),
        loading: false
      }));
    } catch (error) {
      set({ 
        error: extractErrorMessage(error, 'Erro ao eliminar o serviço.'), 
        loading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));