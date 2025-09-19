import { useAuthStore } from "../store/authStore";
import { LoginForm } from "../components/auth/LoginForm";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useBookingProcessStore } from "../store/bookingProcessStore";
import logo from "../assets/stylo-logo.png";
import type { UserProfile } from "../types";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 2. Hook para ler informações da URL atual
  const { error: authError } = useAuthStore();
  const { pendingProviderId, setPendingProviderId } = useBookingProcessStore();

  const handleLoginSuccess = (user: UserProfile) => {
    // 3. Lógica de redirecionamento APRIMORADA

    // Primeiro, procuramos na URL por uma instrução de redirect.
    const params = new URLSearchParams(location.search);
    const redirectPath = params.get("redirect");

    if (redirectPath) {
      // Se encontramos, essa é a nossa prioridade máxima.
      navigate(redirectPath);
      setPendingProviderId(null); // Limpamos a store por segurança.
      return; // Encerra a função aqui.
    }

    // Se não tiver na URL, tentamos a store (como já estava).
    if (pendingProviderId) {
      navigate(`/book/${pendingProviderId}`);
      setPendingProviderId(null);
      return;
    }

    // Se não tiver em nenhum dos dois, vai para o dashboard.
    switch (user.role) {
      case "serviceProvider":
      case "client":
        navigate("/dashboard/");
        break;
      default:
        navigate("/dashboard");
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
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-center border border-red-500/30">
            {authError}
          </div>
        )}

        {/* O LoginForm não precisa mais da prop `setAuthError` */}
        <LoginForm onLoginSuccess={handleLoginSuccess} />

        <div className="mt-6 text-center text-gray-400">
          <p>
            Não tem uma conta?{" "}
            <Link
              to="/register-type"
              className="font-semibold text-[#daa520] hover:text-yellow-400"
            >
              Cadastre-se agora!
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
