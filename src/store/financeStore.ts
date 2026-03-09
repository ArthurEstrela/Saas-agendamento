import { create } from "zustand";
import { isAxiosError } from "axios";
import { toast } from "react-hot-toast";
import type {
  FinancialDashboardData,
  Expense,
  CashRegister,
  PagedResult,
} from "../types";
import { api } from "../lib/api";

const extractErrorMessage = (
  error: unknown,
  defaultMessage: string,
): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

interface FinanceState {
  // Estado de Dados
  dashboardData: FinancialDashboardData | null;
  expenses: Expense[];
  currentCashRegister: CashRegister | null; // Integração com o POS

  // Estado de UI
  loading: boolean;
  error: string | null;

  // Ações do Dashboard
  fetchDashboard: (
    providerId: string, // Mantido na assinatura para não quebrar componentes que já enviam, mas ignorado na URL
    startDate: string,
    endDate: string,
  ) => Promise<void>;

  // Ações de Despesas
  fetchExpenses: (
    providerId: string, // Mantido na assinatura para retrocompatibilidade
    startDate: string,
    endDate: string,
  ) => Promise<void>;

  addExpense: (
    providerId: string,
    data: Omit<Expense, "id" | "providerId">,
  ) => Promise<void>;
  
  deleteExpense: (expenseId: string) => Promise<void>;

  // Ações do Ponto de Venda (Caixa)
  fetchCurrentCashRegister: (providerId: string) => Promise<void>;
  openCashRegister: (
    providerId: string,
    initialBalance: number,
  ) => Promise<void>;
  closeCashRegister: (
    registerId: string,
    finalBalance: number,
  ) => Promise<void>;

  clearError: () => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  dashboardData: null,
  expenses: [],
  currentCashRegister: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  // ==========================================================================
  // 1. DASHBOARD FINANCEIRO (Mágica no Backend)
  // ==========================================================================
  fetchDashboard: async (
    _providerId: string, // Usamos underline para indicar que agora o backend cuida disso via Token
    startDate: string,
    endDate: string,
  ) => {
    set({ loading: true, error: null });
    try {
      // ✨ Consome a URL correta e segura (sem ID exposto)
      const response = await api.get<FinancialDashboardData>(
        `/financial/dashboard`,
        { params: { startDate, endDate } },
      );

      set({ dashboardData: response.data, loading: false });
    } catch (error) {
      set({
        error: extractErrorMessage(
          error,
          "Erro ao carregar os dados financeiros.",
        ),
        loading: false,
      });
    }
  },

  // ==========================================================================
  // 2. GESTÃO DE DESPESAS
  // ==========================================================================
  fetchExpenses: async (
    _providerId: string, // Usamos underline para indicar que agora o backend cuida disso via Token
    startDate: string,
    endDate: string,
  ) => {
    set({ loading: true, error: null });
    try {
      // ✨ CORREÇÃO: Endpoint refatorado para /expenses apenas, sem /provider/{id}
      const response = await api.get<Expense[] | PagedResult<Expense>>(
        `/expenses`,
        { params: { startDate, endDate } },
      );

      // Lê a List<Expense> do Spring Boot ou faz fallback para 'items' se for PagedResult
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data as PagedResult<Expense>).items || [];

      set({ expenses: data, loading: false });
    } catch (error) {
      set({
        error: extractErrorMessage(error, "Erro ao carregar despesas."),
        loading: false,
      });
    }
  },

  addExpense: async (providerId: string, data) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<Expense>("/expenses", {
        providerId, // O Backend pode ignorar e usar o do Token, mas mandamos por padrão da API
        description: data.description,
        amount: data.amount,
        date: data.date || new Date().toISOString().split("T")[0],
        category: data.category,
        type: data.type,
        frequency: data.frequency,
      });

      set((state) => ({
        expenses: [response.data, ...state.expenses],
        loading: false,
      }));
      toast.success("Despesa registrada com sucesso!");
    } catch (error) {
      const errMsg = extractErrorMessage(error, "Erro ao registrar a despesa.");
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
      throw error;
    }
  },

  deleteExpense: async (expenseId: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/expenses/${expenseId}`);

      set((state) => ({
        expenses: state.expenses.filter((exp) => exp.id !== expenseId),
        loading: false,
      }));
      toast.success("Despesa removida.");
    } catch (error) {
      const errMsg = extractErrorMessage(error, "Erro ao remover a despesa.");
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
      throw error;
    }
  },

  // ==========================================================================
  // 3. PONTO DE VENDA (CAIXA DIÁRIO)
  // ==========================================================================
  fetchCurrentCashRegister: async (providerId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<CashRegister>(
        `/cash-registers/provider/${providerId}/current`,
      );
      set({ currentCashRegister: response.data, loading: false });
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        set({ currentCashRegister: null, loading: false });
      } else {
        set({
          error: extractErrorMessage(
            error,
            "Erro ao verificar o estado do caixa.",
          ),
          loading: false,
        });
      }
    }
  },

  openCashRegister: async (providerId: string, initialBalance: number) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post<CashRegister>("/cash-registers/open", {
        providerId,
        initialBalance,
      });

      set({ currentCashRegister: response.data, loading: false });
      toast.success("Caixa aberto com sucesso!");
    } catch (error) {
      const errMsg = extractErrorMessage(error, "Erro ao abrir o caixa.");
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
      throw error;
    }
  },

  closeCashRegister: async (registerId: string, finalBalance: number) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/cash-registers/${registerId}/close`, { finalBalance });

      set({ currentCashRegister: null, loading: false });
      toast.success("Caixa fechado. Resumo gerado!");
    } catch (error) {
      const errMsg = extractErrorMessage(error, "Erro ao fechar o caixa.");
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
      throw error;
    }
  },
}));