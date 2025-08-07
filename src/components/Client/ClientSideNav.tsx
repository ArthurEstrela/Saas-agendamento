// src/components/Client/ClientSideNav.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { LogIn, Star, Search, Calendar, Heart, User, LogOut } from 'lucide-react';
import logo from '../../assets/stylo-logo.png'; // Ajuste o caminho conforme a localização real do logo

interface ClientSideNavProps {
  activeView: 'search' | 'myAppointments' | 'favorites' | 'profile' | 'booking';
  setActiveView: (view: 'search' | 'myAppointments' | 'favorites' | 'profile' | 'booking') => void;
  logout: () => Promise<void>;
}

const ClientSideNav: React.FC<ClientSideNavProps> = ({ activeView, setActiveView, logout }) => {
  return (
    <nav className="fixed left-0 top-0 h-full w-72 bg-gray-950 p-6 flex flex-col shadow-lg z-20">
      <div className="flex items-center mb-10">
        <Link to="/"><img src={logo} alt="Stylo Logo" className="h-10 w-auto mr-3" /></Link>
        <span className="text-2xl font-extrabold text-[#daa520]">Stylo</span>
      </div>
      <ul className="space-y-3 flex-grow">
        <li>
          <button onClick={() => setActiveView('search')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'search' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
            <Search className="w-5 h-5 mr-3" />
            Pesquisar
          </button>
        </li>
        <li>
          <button onClick={() => setActiveView('myAppointments')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'myAppointments' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
            <Calendar className="w-5 h-5 mr-3" />
            Meus Agendamentos
          </button>
        </li>
        <li>
          <button onClick={() => setActiveView('favorites')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'favorites' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
            <Heart className="w-5 h-5 mr-3" />
            Favoritos
          </button>
        </li>
        <li>
          <button onClick={() => setActiveView('profile')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'profile' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
            <User className="w-5 h-5 mr-3" />
            Meu Perfil
          </button>
        </li>
      </ul>
      <div className="mt-8">
        <button onClick={logout} className="flex items-center w-full p-3 rounded-lg text-lg font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200">
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </button>
      </div>
    </nav>
  );
};

export default ClientSideNav;
