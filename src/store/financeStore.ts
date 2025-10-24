// src/store/financeStore.ts

import { create } from "zustand";
import { getFinancialData } from "../firebase/financeService";
import type { FinancialData, Expense } from "../types"; // 1. Importei o tipo Expense
import {
  addExpense,
  deleteExpense,
  updateExpense,
} from "../firebase/expenseService"; // 2. Importei as funções de despesa
import { toast } from "react-hot-toast";
import { startOfMonth, endOfMonth } from "date-fns";
import { useProfileStore } from "./profileStore"; // Para pegar o ID do provider

interface FinanceStore {
  financialData: FinancialData | null;
  isLoading: boolean;
  error: string | null;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  fetchFinancialData: (providerId: string, date: Date) => Promise<void>;
  
  // --- 3. ADICIONEI AS NOVAS FUNÇÕES AQUI ---
  addNewExpense: (expenseData: Omit<Expense, "id">) => Promise<void>;
  removeExpense: (expenseId: string) => Promise<void>;
  editExpense: (
    expenseId: string,
    expenseData: Partial<Omit<Expense, "id">>
  ) => Promise<void>;
}

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  financialData: null,
  isLoading: false,
  error: null,
  currentDate: new Date(),

  setCurrentDate: (date) => set({ currentDate: date }),

  fetchFinancialData: async (providerId, date) => {
    set({ isLoading: true, error: null });
    try {
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);
      const data = await getFinancialData(providerId, startDate, endDate);
      set({ financialData: data, isLoading: false });
    } catch (err) {
      console.error("Erro ao buscar dados financeiros:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Falha ao buscar dados.";
      set({ error: errorMsg, isLoading: false });
    }
  },

  // --- 4. IMPLEMENTAÇÃO DAS NOVAS FUNÇÕES ---

  /**
   * Adiciona uma nova despesa e recarrega os dados financeiros.
   */
  addNewExpense: async (expenseData) => {
    const providerId = useProfileStore.getState().userProfile?.id;
    if (!providerId) {
      toast.error("Erro: Usuário não autenticado.");
      return;
    }
    
    // Pega a data atual da store para saber qual mês recarregar
    const currentDate = get().currentDate;

    const promise = async () => {
      // 1. Adiciona no Firebase
      await addExpense(providerId, expenseData);
      // 2. Refaz o fetch dos dados financeiros do mês atual
      await get().fetchFinancialData(providerId, currentDate);
    };

    // Usamos toast.promise para mostrar o loading
    await toast.promise(promise(), {
      loading: "Adicionando despesa...",
      success: "Despesa adicionada com sucesso!",
      error: "Falha ao adicionar despesa.",
    });
  },

  /**
   * Remove uma despesa e recarrega os dados financeiros.
   */
  removeExpense: async (expenseId) => {
    const providerId = useProfileStore.getState().userProfile?.id;
    if (!providerId) {
      toast.error("Erro: Usuário não autenticado.");
      return;
    }
    
    const currentDate = get().currentDate;

    const promise = async () => {
      // 1. Remove do Firebase
      await deleteExpense(providerId, expenseId);
      // 2. Refaz o fetch
      await get().fetchFinancialData(providerId, currentDate);
    };

    await toast.promise(promise(), {
      loading: "Removendo despesa...",
      success: "Despesa removida com sucesso!",
      error: "Falha ao remover despesa.",
    });
  },

  /**
   * Edita uma despesa e recarrega os dados financeiros.
   */
  editExpense: async (expenseId, expenseData) => {
    const providerId = useProfileStore.getState().userProfile?.id;
    if (!providerId) {
      toast.error("Erro: Usuário não autenticado.");
      return;
    }
    
    const currentDate = get().currentDate;

    const promise = async () => {
      // 1. Atualiza no Firebase
      await updateExpense(providerId, expenseId, expenseData);
      // 2. Refaz o fetch
      await get().fetchFinancialData(providerId, currentDate);
    };

    await toast.promise(promise(), {
      loading: "Atualizando despesa...",
      success: "Despesa atualizada com sucesso!",
      error: "Falha ao atualizar despesa.",
    });
  },
}));