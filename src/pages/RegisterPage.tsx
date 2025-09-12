// src/pages/RegisterPage.tsx
import { useParams, Link } from 'react-router-dom';
import logo from '../assets/stylo-logo.png';
import { ClientRegisterForm } from '../components/auth/ClientRegisterForm';
import { ServiceProviderRegisterForm } from '../components/auth/ServiceProviderRegisterForm';

const RegisterPage = () => {
  const { userType } = useParams<{ userType: 'client' | 'provider' }>();

  const title = userType === 'client' ? 'Crie sua Conta de Cliente' : 'Cadastre seu Negócio';
  const subtitle = userType === 'client'
    ? 'Rápido e fácil para você começar a agendar.'
    : 'Complete os dados para começar a gerenciar seus agendamentos.';

  return (
    <div className="flex justify-center items-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-lg bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <Link to="/">
            <img src={logo} alt="Stylo" className="h-12 mx-auto mb-4" />
          </Link>
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-gray-400">{subtitle}</p>
        </div>

        {userType === 'client' ? <ClientRegisterForm /> : <ServiceProviderRegisterForm />}

         <div className="mt-6 text-center text-gray-400">
          <p>
            Já tem uma conta?{' '}
            <Link to="/login" className="font-semibold text-[#daa520] hover:text-yellow-400">
              Faça login!
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;