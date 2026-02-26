import { toast } from 'react-hot-toast';
import { isAxiosError } from 'axios';

export const useToast = () => {
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showInfo = (message: string) => {
    toast(message);
  };

  // ✨ FUNÇÃO SÊNIOR: Trata Strings simples, Erros do Axios (Spring Boot) e Erros do Firebase
  const showError = (errorOrMessage: unknown, fallbackMessage: string = 'Ocorreu um erro inesperado.') => {
    
    // 1. Se quem chamou passou apenas um texto simples: showError("Deu ruim")
    if (typeof errorOrMessage === 'string') {
      toast.error(errorOrMessage);
      return;
    }

    // 2. Se for um erro da API Java (Axios)
    if (isAxiosError(errorOrMessage)) {
      const data = errorOrMessage.response?.data;
      
      // O Spring Boot ProblemDetail guarda a mensagem no campo "detail"
      if (data?.detail) {
        toast.error(data.detail);
        return;
      }
      
      // Se for um erro de validação de formulário do Java (@Valid -> MethodArgumentNotValidException)
      if (data?.fields && typeof data.fields === 'object') {
        // Pega a primeira mensagem de erro da lista de campos e mostra
        const firstError = Object.values(data.fields)[0] as string;
        toast.error(firstError);
        return;
      }

      // Se por acaso tiver um campo message (padrão antigo do Spring)
      if (data?.message) {
        toast.error(data.message);
        return;
      }
    }

    // 3. Se for um erro do Firebase ou Erro Genérico de Javascript
    if (errorOrMessage instanceof Error) {
      // Tradução de erros comuns do Firebase (opcional, adicione mais se precisar)
      if (errorOrMessage.message.includes('auth/invalid-credential')) {
        toast.error('E-mail ou senha incorretos.');
        return;
      }
      toast.error(fallbackMessage);
      return;
    }

    // Fallback Final
    toast.error(fallbackMessage);
  };

  const showPromise = <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string | ((err: unknown) => string); // Suporte para extrair erro na Promise
    }
  ) => {
    toast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: typeof messages.error === 'function' ? messages.error : () => messages.error as string,
    });
  };

  return { showSuccess, showError, showInfo, showPromise };
};