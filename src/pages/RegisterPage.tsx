import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import logo from '../assets/stylo-logo.png';
import { ClientRegisterForm } from '../components/auth/ClientRegisterForm';
import { ServiceProviderRegisterForm } from '../components/auth/ServiceProviderRegisterForm';
import { useAuthStore } from '../store/authStore';

const RegisterPage = () => {
  const { userType } = useParams<{ userType: 'client' | 'provider' }>();
  const { clearError } = useAuthStore();

  useEffect(() => {
    clearError();
  }, [clearError]);

  const title = userType === 'client' ? 'Crie sua Conta' : 'Cadastre seu Negócio';
  const subtitle = userType === 'client'
    ? 'Rápido e fácil para você começar a agendar.'
    : 'Complete os dados para gerenciar seus agendamentos.';

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 relative overflow-x-hidden">
      
      {/* --- BACKGROUND OTIMIZADO --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Mobile: Gradiente Estático (Leve) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#121214] via-[#09090b] to-black md:hidden" />
        
        {/* Desktop: Efeitos Visuais Ricos (Aurora) */}
        <div className="hidden md:block">
           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-20" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] opacity-20" />
        </div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Card:
            - Mobile: bg-[#18181b] (Sólido para performance do teclado)
            - Desktop: bg-gray-900/50 + backdrop-blur (Visual Glass)
        */}
        <div className="bg-[#18181b] md:bg-gray-900/50 border border-white/5 md:border-gray-700 rounded-2xl shadow-xl md:backdrop-blur-sm p-6 md:p-8">
          
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <Link to="/" className="inline-block">
              <img 
                src={logo} 
                alt="Stylo" 
                className="h-10 md:h-12 mx-auto mb-4 md:mb-6 transition-transform hover:scale-105" 
              />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">
              {title}
            </h1>
            <p className="text-sm md:text-base text-gray-400 max-w-xs mx-auto md:max-w-none">
              {subtitle}
            </p>
          </div>

          {/* Formulários */}
          <div className="space-y-4">
            {userType === 'client' ? <ClientRegisterForm /> : <ServiceProviderRegisterForm />}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-400">
            <p>
              Já tem uma conta?{' '}
              <Link 
                to="/login" 
                className="font-bold text-primary hover:text-yellow-400 transition-colors touch-manipulation p-2"
              >
                Faça login!
              </Link>
            </p>
          </div>
          
        </div>

        {/* Link de Ajuda / Termos (Opcional, preenche espaço visual) */}
        <div className="mt-8 text-center">
            <Link to="/" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                Voltar para a Home
            </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;