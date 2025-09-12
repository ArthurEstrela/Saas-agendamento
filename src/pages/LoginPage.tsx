import { useAuthStore } from '../store/authStore';
import { LoginForm } from '../components/auth/LoginForm';
import { Link } from 'react-router-dom';
import logo from '../assets/stylo-logo.png';

const LoginPage = () => {
  // Agora pegamos o erro e o estado de submissão diretamente da store!
  const { error: authError } = useAuthStore();

  return (
    <div className="flex justify-center items-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-md bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logo} alt="Stylo" className="h-12 mx-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-white">Bem-vindo de volta!</h1>
          <p className="text-gray-400">Acesse sua conta para gerenciar seus agendamentos.</p>
        </div>

        {/* O erro de autenticação (ex: "senha inválida") é exibido aqui */}
        {authError && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded-lg mb-6 text-center border border-red-500/30">
            {authError}
          </div>
        )}

        {/* O LoginForm não precisa mais da prop `setAuthError` */}
        <LoginForm />

        <div className="mt-6 text-center text-gray-400">
          <p>
            Não tem uma conta?{' '}
            <Link to="/register-type" className="font-semibold text-[#daa520] hover:text-yellow-400">
              Cadastre-se agora!
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
