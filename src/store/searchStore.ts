import { create } from 'zustand';
import { isAxiosError } from 'axios';
import type { ServiceProviderProfile, ProviderSearchCriteria, PagedResult } from '../types';
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

// Estado Inicial dos Filtros
const initialFilters: ProviderSearchCriteria = {
  city: '',
  state: '',
  serviceName: '',
  minRating: undefined,
  maxPrice: undefined,
  page: 0,
  size: 10, // Traz 10 estabelecimentos por página
};

interface SearchState {
  // Dados
  results: ServiceProviderProfile[];
  loading: boolean;
  error: string | null;
  
  // Metadados de Paginação
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;

  // Filtros Atuais
  filters: ProviderSearchCriteria;

  // Ações
  setFilters: (filters: Partial<ProviderSearchCriteria>) => void;
  clearFilters: () => void;
  searchProviders: (page?: number) => Promise<void>;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  results: [],
  loading: false,
  error: null,
  
  totalElements: 0,
  totalPages: 0,
  currentPage: 0,
  hasNext: false,

  filters: initialFilters,

  // ==========================================================================
  // 1. ATUALIZAR FILTROS (UI)
  // ==========================================================================
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),

  // ==========================================================================
  // 2. LIMPAR TODOS OS FILTROS
  // ==========================================================================
  clearFilters: () => set({ filters: initialFilters }),

  // ==========================================================================
  // 3. EXECUTAR A PESQUISA (CHAMADA À API JAVA)
  // ==========================================================================
  searchProviders: async (pageIndex = 0) => {
    const { filters } = get();
    set({ loading: true, error: null });

    try {
      // Limpa os campos vazios para não enviar "city=" na query string desnecessariamente
      const queryParams: Record<string, any> = {
        page: pageIndex,
        size: filters.size,
      };

      if (filters.city) queryParams.city = filters.city;
      if (filters.state) queryParams.state = filters.state;
      if (filters.serviceName) queryParams.serviceName = filters.serviceName;
      if (filters.minRating) queryParams.minRating = filters.minRating;
      if (filters.maxPrice) queryParams.maxPrice = filters.maxPrice;

      // Endpoint público no Spring Boot (não requer token obrigatório para ver a vitrine)
      const response = await api.get<PagedResult<ServiceProviderProfile>>('/service-providers/search', {
        params: queryParams,
      });

      // Se for a página 0, substituímos a lista. Se for página > 0 (Infinite Scroll), adicionamos ao final.
      set((state) => ({
        results: pageIndex === 0 
          ? response.data.data 
          : [...state.results, ...response.data.data],
        totalElements: response.data.totalElements,
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage,
        hasNext: response.data.hasNext,
        loading: false,
      }));
    } catch (error) {
      set({ 
        error: extractErrorMessage(error, 'Erro ao procurar estabelecimentos. Tente novamente mais tarde.'), 
        loading: false 
      });
    }
  }
}));