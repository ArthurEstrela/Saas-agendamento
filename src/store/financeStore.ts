import { create } from "zustand";
import { toast } from "react-hot-toast";
import { startOfMonth, endOfMonth } from "date-fns";

// Serviços e Tipos
import { getFinancialData } from "../firebase/financeService"; 
// ^ ATENÇÃO: Verifique se essa função 'getFinancialData' também foi atualizada 
// para ler da coleção 'expenses' raiz, senão os totais não baterão.

import {
  addExpense,
  deleteExpense,
  updateExpense,
} from "../firebase/expenseService";

import type { FinancialData, Expense } from "../types";
import { useProfileStore } from "./profileStore";

interface FinanceStore {
  financialData: FinancialData | null;
  isLoading: boolean;
  error: string | null;
  currentDate: Date;
  
  // Actions
  setCurrentDate: (date: Date) => void;
  fetchFinancialData: (providerId: string, date: Date) => Promise<void>;
  
  // CRUD Actions
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
    // Evita chamadas desnecessárias
    if (!providerId) return;

    set({ isLoading: true, error: null });
    try {
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);
      
      // Aqui assume-se que getFinancialData já busca da nova coleção 'expenses'
      const data = await getFinancialData(providerId, startDate, endDate);
      
      set({ financialData: data, isLoading: false });
    } catch (err) {
      console.error("Erro ao buscar dados financeiros:", err);
      const errorMsg = err instanceof Error ? err.message : "Falha ao buscar dados.";
      set({ error: errorMsg, isLoading: false });
      toast.error("Erro ao carregar finanças.");
    }
  },

  addNewExpense: async (expenseData) => {
    const providerId = useProfileStore.getState().userProfile?.id;
    if (!providerId) {
      toast.error("Erro de permissão: Usuário não identificado.");
      return;
    }
    
    const currentDate = get().currentDate;

    await toast.promise(
      (async () => {
        // 1. Adiciona no Firestore
        await addExpense(providerId, expenseData);
        // 2. Recarrega os dados para atualizar a tela (Dashboard/Gráficos)
        await get().fetchFinancialData(providerId, currentDate);
      })(),
      {
        loading: "Salvando despesa...",
        success: "Despesa adicionada!",
        error: "Erro ao adicionar despesa.",
      }
    );
  },

  removeExpense: async (expenseId) => {
    const providerId = useProfileStore.getState().userProfile?.id;
    if (!providerId) {
      toast.error("Erro: Usuário não identificado.");
      return;
    }
    
    const currentDate = get().currentDate;

    await toast.promise(
      (async () => {
        await deleteExpense(providerId, expenseId);
        await get().fetchFinancialData(providerId, currentDate);
      })(),
      {
        loading: "Removendo...",
        success: "Despesa removida!",
        error: "Erro ao remover despesa.",
      }
    );
  },

  editExpense: async (expenseId, expenseData) => {
    const providerId = useProfileStore.getState().userProfile?.id;
    if (!providerId) {
      toast.error("Erro: Usuário não identificado.");
      return;
    }
    
    const currentDate = get().currentDate;

    await toast.promise(
      (async () => {
        await updateExpense(providerId, expenseId, expenseData);
        await get().fetchFinancialData(providerId, currentDate);
      })(),
      {
        loading: "Atualizando...",
        success: "Despesa atualizada!",
        error: "Erro ao atualizar despesa.",
      }
    );
  },
}));