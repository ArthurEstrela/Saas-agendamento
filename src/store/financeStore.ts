// src/store/financeStore.ts

import {create} from "zustand";
import { getFinancialData } from "../firebase/financeService";
import { addExpense as addExpenseService } from "../firebase/expenseService";
import type { FinancialData, Expense } from "../types";

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
      set({
        error: "Falha ao buscar dados financeiros.",
        loading: false,
      });
    }
  },
  addExpense: async (providerId, expenseData) => {
    try {
      await addExpenseService(providerId, expenseData);
      // A lógica para recarregar os dados já está no componente,
      // que chama fetchFinancialData novamente após a adição.
    } catch (error) {
      console.error("Error adding expense:", error);
      set({ error: "Falha ao adicionar despesa." });
    }
  },
}));