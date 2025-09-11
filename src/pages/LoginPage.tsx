import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';

const LoginPage = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [authError, setAuthError] = useState<string | null>(null);

  // Hooks para navegação e localização
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // 1. Determina para onde redirecionar após o login
  // Se o estado 'from' existir (enviado pela página de confirmação), usamos ele.
  // Senão, o padrão é '/dashboard'.
  const from = location.state?.from?.pathname || '/dashboard';

  // 2. Usamos useEffect para redirecionar QUANDO a autenticação mudar
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleTabChange = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setAuthError(null); // Limpa o erro ao trocar de aba
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="flex border-b mb-6">
          <button
            onClick={() => handleTabChange('login')}
            className={`flex-1 py-2 text-center font-semibold transition-colors ${
              activeTab === 'login'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-blue-500'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => handleTabChange('register')}
            className={`flex-1 py-2 text-center font-semibold transition-colors ${
              activeTab === 'register'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-blue-500'
            }`}
          >
            Cadastre-se
          </button>
        </div>

        {authError && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center">
            {authError}
          </div>
        )}

        {activeTab === 'login' ? (
          <LoginForm setAuthError={setAuthError} />
        ) : (
          <RegisterForm setAuthError={setAuthError} />
        )}
      </div>
    </div>
  );
};

export default LoginPage;