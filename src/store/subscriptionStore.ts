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

interface SubscriptionState {
  loading: boolean;
  error: string | null;

  // Ações de Comunicação com o Stripe via API Java
  createCheckoutSession: (priceId?: string) => Promise<void>;
  createPortalSession: () => Promise<void>;
  clearError: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  loading: false,
  error: null,

  // ==========================================================================
  // 1. INICIAR ASSINATURA (REDIRECIONAR PARA O STRIPE CHECKOUT)
  // ==========================================================================
  createCheckoutSession: async (priceId?: string) => {
    set({ loading: true, error: null });
    try {
      // Chama o endpoint do Java que gera a sessão de pagamento.
      // Opcional: passar o priceId se tiver vários planos (Mensal/Anual). 
      // Se tiver só um, o backend pode assumir o padrão.
      const response = await api.post<{ url: string }>('/payments/create-checkout-session', { 
        priceId 
      });
      
      // Redireciona o utilizador com segurança para o ecrã de pagamento da Stripe
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("URL de checkout não retornada pelo servidor.");
      }
    } catch (error) {
      const errMsg = extractErrorMessage(error, 'Erro ao iniciar o processo de pagamento.');
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
    }
  },

  // ==========================================================================
  // 2. GERIR ASSINATURA (REDIRECIONAR PARA O STRIPE CUSTOMER PORTAL)
  // ==========================================================================
  createPortalSession: async () => {
    set({ loading: true, error: null });
    try {
      // Endpoint que gera o link para o cliente atualizar o cartão de crédito,
      // baixar faturas (invoices) ou cancelar a assinatura.
      const response = await api.post<{ url: string }>('/payments/create-portal-session');
      
      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("URL do portal não retornada pelo servidor.");
      }
    } catch (error) {
      const errMsg = extractErrorMessage(error, 'Erro ao aceder ao portal de faturação. Verifique se já tem uma subscrição ativa.');
      set({ error: errMsg, loading: false });
      toast.error(errMsg);
    }
  },

  clearError: () => set({ error: null })
}));