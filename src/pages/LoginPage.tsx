import React, { useEffect } from "react"; // Importe useEffect
import { useAuthStore } from "../store/authStore";
import { LoginForm } from "../components/auth/LoginForm";
import { Link, useNavigate } from "react-router-dom";
import { useBookingProcessStore } from "../store/bookingProcessStore";
import logo from "../assets/stylo-logo.png";
import type { UserProfile } from "../types";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  // Pegamos o erro e a função para limpar o erro
  const { error: authError, clearError } = useAuthStore();
  const { redirectUrlAfterLogin, setRedirectUrlAfterLogin } = useBookingProcessStore();

  // ✨ CORREÇÃO: Limpa qualquer erro residual ao entrar na página
  useEffect(() => {
    clearError();
  }, [clearError]);

  const handleLoginSuccess = (user: UserProfile) => {
    // ✨ LÓGICA DE REDIRECIONAMENTO SIMPLIFICADA E ROBUSTA
    if (redirectUrlAfterLogin) {
      const url = redirectUrlAfterLogin;
      setRedirectUrlAfterLogin(null); // Limpamos a intenção
      navigate(url); // E redirecionamos
      return;
    }

    // Se não há intenção de redirecionamento, fluxo padrão.
    switch (user.role) {
      case "serviceProvider":
        navigate("/dashboard/agenda");
        break;
      case "client":
        navigate("/dashboard/explore");
        break;
      default:
        navigate("/dashboard/home");
        break;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logo} alt="Stylo" className="h-12 mx-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Bem-vindo de volta!</h1>
          <p className="text-gray-400">
            Acesse sua conta para gerenciar seus agendamentos.
          </p>
        </div>

        {/* O erro de autenticação (ex: "senha inválida") é exibido aqui */}
        {authError && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-center border border-red-500/30 animate-fade-in">
            {authError}
          </div>
        )}

        <LoginForm onLoginSuccess={handleLoginSuccess} />

        <div className="mt-6 text-center text-gray-400">
          <p>
            Não tem uma conta?{" "}
            <Link
              to="/register-type"
              className="font-semibold text-[#daa520] hover:text-yellow-400 transition-colors"
            >
              Cadastre-se agora!
            </Link>
          </p>
          <p>
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-gray-400 hover:text-[#daa520] transition-colors"
            >
              Esqueci minha senha
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;