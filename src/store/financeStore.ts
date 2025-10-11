import { create } from "zustand";
import { getFinancialData } from "../firebase/financeService";
import { addExpense as addExpenseService } from "../firebase/expenseService";
import type { FinancialData, Expense } from "../types";
import { toast } from "react-hot-toast"; // Importar o toast

interface FinanceState {
  financialData: FinancialData | null;
  loading: boolean;
  error: string | null;
  fetchFinancialData: (
    providerId: string,
    startDate: Date,
    endDate: Date
  ) => Promise<void>;
  addExpense: (
    providerId: string,
    expense: Omit<Expense, "id">
  ) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  financialData: null,
  loading: true,
  error: null,
  fetchFinancialData: async (providerId, startDate, endDate) => {
    set({ loading: true, error: null });
    try {
      const data = await getFinancialData(providerId, startDate, endDate);
      set({ financialData: data, loading: false });
    } catch (error) {
      console.error("Error fetching financial data:", error);
      const errorMessage = "Falha ao buscar dados financeiros.";
      set({
        error: errorMessage,
        loading: false,
      });
      toast.error(errorMessage); // Toast de erro na busca
    }
  },
  addExpense: async (providerId, expenseData) => {
    // A promise que será observada pelo toast
    const promise = addExpenseService(providerId, expenseData);

    toast.promise(promise, {
      loading: "Adicionando despesa...",
      success: "Despesa adicionada com sucesso!",
      error: "Falha ao adicionar despesa.",
    });

    try {
      await promise;
      // Você pode querer recarregar os dados financeiros aqui
      // para a UI atualizar sem o usuário precisar fazer nada.
      // set.getState().fetchFinancialData(...) 
    } catch (error) {
      console.error("Error adding expense:", error);
      const errorMessage = "Falha ao adicionar despesa.";
      set({ error: errorMessage });
      // O toast.promise já lida com a exibição do erro,
      // então não precisamos de outro toast.error aqui.
    }
  },
}));