import { toast } from 'react-hot-toast';

export const useToast = () => {
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  const showError = (message: string) => {
    toast.error(message);
  };

  const showInfo = (message: string) => {
    toast(message);
  };

  // Você pode adicionar outros tipos, como loading, promise, etc.
  // Exemplo com promise:
  const showPromise = <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    toast.promise(promise, messages);
  };


  return { showSuccess, showError, showInfo, showPromise };
};