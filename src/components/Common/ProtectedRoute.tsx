import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { MailWarning, RefreshCw, LogOut } from 'lucide-react';

// Componentes UI
import { Button } from '../ui/button';
import { LoadingSpinner } from './LoadingSpinner';
import { useToast } from '../../hooks/useToast';

export const ProtectedRoute = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  
  // 1. CORREÇÃO: Usamos os métodos que seu hook realmente exporta
  const { showSuccess, showError } = useToast();
  
  const [isResending, setIsResending] = useState(false);

  // Estado de Carregamento
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirecionamento se não logado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Verificação de E-mail
  if (!user.emailVerified) {
    const handleResendEmail = async () => {
      setIsResending(true);
      try {
        if (auth.currentUser) {
          await sendEmailVerification(auth.currentUser);
          // 2. CORREÇÃO: Sintaxe correta do seu useToast
          showSuccess("E-mail enviado! Verifique sua caixa de entrada e spam.");
        }
      } catch (error) { // 3. CORREÇÃO: Removido o ': any'
        console.error("Erro ao reenviar verificação:", error);
        showError("Muitas tentativas. Tente novamente em alguns minutos.");
      } finally {
        setIsResending(false);
      }
    };

    const handleReload = () => {
      window.location.reload();
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-950 text-gray-100 animate-fade-in">
        <div className="max-w-md w-full bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MailWarning className="w-8 h-8 text-yellow-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Verifique seu e-mail
            </h2>
            <p className="text-gray-400">
              Para acessar o painel do Stylo, precisamos confirmar que você é você.
              Enviamos um link para <strong>{user.email}</strong>.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleReload}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-11"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Já confirmei, liberar acesso
            </Button>

            <Button
              onClick={handleResendEmail}
              variant="outline"
              className="w-full border-gray-700 hover:bg-gray-800 text-gray-300 h-11"
              disabled={isResending}
            >
              {isResending ? "Enviando..." : "Reenviar e-mail de confirmação"}
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-800">
            <button
              onClick={() => logout()}
              className="flex items-center justify-center w-full text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tudo certo: renderiza a rota protegida
  return <Outlet />;
};