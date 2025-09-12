// src/pages/RegisterTypeSelection.tsx
import { Link } from 'react-router-dom';
import { User, Briefcase } from 'lucide-react';
import logo from '../assets/stylo-logo.png';

const RegisterTypeSelection = () => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-black text-white p-4">
      <div className="text-center mb-12">
        <Link to="/">
          <img src={logo} alt="Stylo" className="h-12 mx-auto mb-4" />
        </Link>
        <h1 className="text-4xl font-bold">Como você usará a Stylo?</h1>
        <p className="text-gray-400 mt-2">Escolha o tipo de perfil que melhor se adapta a você.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Card Cliente */}
        <Link to="/register/client" className="group">
          <div className="bg-gray-900/50 p-8 rounded-2xl border-2 border-gray-700 hover:border-[#daa520] hover:scale-105 transition-all duration-300 text-center">
            <User className="h-16 w-16 mx-auto text-[#daa520] mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Sou Cliente</h2>
            <p className="text-gray-400">Quero encontrar e agendar serviços com os melhores profissionais.</p>
          </div>
        </Link>

        {/* Card Prestador de Serviço */}
        <Link to="/register/provider" className="group">
          <div className="bg-gray-900/50 p-8 rounded-2xl border-2 border-gray-700 hover:border-[#daa520] hover:scale-105 transition-all duration-300 text-center">
            <Briefcase className="h-16 w-16 mx-auto text-[#daa520] mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Sou Profissional</h2>
            <p className="text-gray-400">Quero gerenciar minha agenda, serviços e clientes de forma eficiente.</p>
          </div>
        </Link>
      </div>
        <div className="mt-8 text-center text-gray-400">
          <p>
            Já tem uma conta?{' '}
            <Link to="/login" className="font-semibold text-[#daa520] hover:text-yellow-400">
              Faça login!
            </Link>
          </p>
        </div>
    </div>
  );
};

export default RegisterTypeSelection;