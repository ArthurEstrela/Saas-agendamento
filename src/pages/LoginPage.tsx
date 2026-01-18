import React, { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { LoginForm } from "../components/auth/LoginForm";
import { Link, useNavigate, useLocation } from "react-router-dom"; // Adicionado useLocation
import { useBookingProcessStore } from "../store/bookingProcessStore";
import logo from "../assets/stylo-logo.png";
import type { UserProfile } from "../types";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook para acessar o estado da navegação
  const { error: authError, clearError } = useAuthStore();
  const { redirectUrlAfterLogin, setRedirectUrlAfterLogin } = useBookingProcessStore();

  // ✨ Limpa qualquer erro residual ao entrar na página
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleLoginSuccess = (user: UserProfile) => {
    // 1. Prioridade: Redirecionamento vindo do state (Fluxo de Agendamento Interrompido)
    // Se o usuário veio de uma página protegida (ex: /book/...), voltamos para lá.
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }

    // 2. Prioridade: Redirecionamento vindo da store (Legado/Outros fluxos)
    if (redirectUrlAfterLogin) {
      const url = redirectUrlAfterLogin;
      setRedirectUrlAfterLogin(null);
      navigate(url);
      return;
    }

    // 3. Padrão: Dashboard baseado no tipo de usuário
    switch (user.role) {
      case "serviceProvider":
        navigate("/dashboard/agenda");
        break;
      case "client":
        // Clientes vão para a busca/explorar para agendar novos serviços
        navigate("/dashboard/explore");
        break;
      default:
        navigate("/dashboard/home");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-x-hidden">
      
      {/* --- BACKGROUND OTIMIZADO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Mobile: Gradiente Estático (Leve e rápido) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121214] via-[#09090b] to-black md:hidden" />
        
        {/* Desktop: Efeitos Visuais Ricos (Aurora) */}
        <div className="hidden md:block">
           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-20" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] opacity-20" />
        </div>
        
        {/* Textura de Ruído (Noise) Leve */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay pointer-events-none" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Card Principal:
            - Mobile: bg-[#18181b] (Sólido para evitar lag com teclado virtual)
            - Desktop: Mantém a transparência e blur elegante
        */}
        <div className="bg-[#18181b] md:bg-gray-900/50 border border-white/5 md:border-gray-700 rounded-2xl shadow-xl md:backdrop-blur-sm p-6 md:p-8">
          
          <div className="text-center mb-8">
            <Link to="/" className="inline-block transition-transform active:scale-95 group">
              <img 
                src={logo} 
                alt="Stylo" 
                className="h-10 md:h-12 mx-auto mb-4 group-hover:brightness-110 transition-all" 
              />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Bem-vindo de volta!</h1>
            <p className="text-sm md:text-base text-gray-400">
              Acesse sua conta para gerenciar seus agendamentos.
            </p>
          </div>

          {/* Mensagem de Erro */}
          {authError && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-center border border-red-500/30 text-sm animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-2">
              <span className="font-bold">Erro:</span> {authError}
            </div>
          )}

          {/* Formulário */}
          <LoginForm onLoginSuccess={handleLoginSuccess} />

          {/* Links do Footer */}
          <div className="mt-8 text-center text-gray-400 text-sm space-y-3">
            <p>
              Não tem uma conta?{" "}
              <Link
                to="/register-type"
                className="font-bold text-primary hover:text-yellow-400 transition-colors p-1"
              >
                Cadastre-se agora!
              </Link>
            </p>
            <p>
              <Link
                to="/forgot-password"
                className="text-xs md:text-sm font-medium text-gray-500 hover:text-primary transition-colors p-1 block"
              >
                Esqueci minha senha
              </Link>
            </p>
          </div>
        </div>
        
        {/* Link de Retorno */}
        <div className="mt-8 text-center">
            <Link to="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                Voltar para a Home
            </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;