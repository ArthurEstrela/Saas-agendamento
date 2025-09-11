import { create } from 'zustand';
import type { FinancialData, Expense } from '../types';
import { getFinancialData } from '../firebase/financeService';
import { addExpense, deleteExpense } from '../firebase/expenseService';

interface FinanceState {
  financialData: FinancialData | null;
  isLoading: boolean;
  error: string | null;
  fetchFinancialData: (providerId: string) => Promise<void>;
  addNewExpense: (providerId: string, expenseData: Omit<Expense, 'id' | 'date'>) => Promise<void>;
  removeExpense: (providerId: string, expenseId: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  financialData: null,
  isLoading: false,
  error: null,

  fetchFinancialData: async (providerId) => {
    if (!providerId) return;
    set({ isLoading: true, error: null });
    try {
      const data = await getFinancialData(providerId);
      set({ financialData: data, isLoading: false });
    } catch (err: unknown) {
      let errorMessage = "Erro ao buscar dados financeiros.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error(errorMessage, err);
      set({ error: errorMessage, isLoading: false });
    }
  },
  
  addNewExpense: async (providerId, expenseData) => {
    try {
      await addExpense(providerId, expenseData);
      // Atualiza os dados financeiros para refletir a nova despesa
      get().fetchFinancialData(providerId); 
    } catch (err: unknown) {
      let errorMessage = "Erro ao adicionar nova despesa.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error(errorMessage, err);
      // Opcional: definir o erro no estado se a UI precisar reagir
      set({ error: errorMessage });
    }
  },

  removeExpense: async (providerId, expenseId) => {
    try {
      await deleteExpense(providerId, expenseId);
      // Atualiza os dados para refletir a remoção da despesa
      get().fetchFinancialData(providerId);
    } catch (err: unknown) {
      let errorMessage = "Erro ao remover despesa.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      console.error(errorMessage, err);
      set({ error: errorMessage });
    }
  }
}));