// src/components/Client/ClientSideNav.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Heart, User, LogOut } from 'lucide-react';
import logo from '../../assets/stylo-logo.png'; // Ajuste o caminho conforme a localização real do logo
import type { UserProfile } from '../../types'; // Importa UserProfile

interface ClientSideNavProps {
  activeView: 'search' | 'myAppointments' | 'favorites' | 'profile' | 'booking';
  setActiveView: (view: 'search' | 'myAppointments' | 'favorites' | 'profile' | 'booking') => void;
  logout: () => Promise<void>;
  userProfile: UserProfile | null; // Adicionado userProfile
}

const ClientSideNav: React.FC<ClientSideNavProps> = ({ activeView, setActiveView, logout, userProfile }) => {
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
      </ul>
      <div className="mt-auto">
        <div className="border-t border-gray-800 pt-4">
          {userProfile && (
            <div className="flex items-center px-2 mb-4">
              <img src={userProfile.photoURL || 'https://placehold.co/150x150/111827/4B5563?text=Foto'} alt="Sua foto de perfil" className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-gray-700" />
              <div>
                <p className="text-sm font-semibold text-white truncate">{userProfile.displayName || 'Nome do Cliente'}</p>
                <p className="text-xs text-gray-400">Cliente</p>
              </div>
            </div>
          )}
          {/* Removido o <li> desnecessário e o botão "Meu Perfil" agora é um item de lista próprio */}
          <ul className="space-y-2"> {/* Nova lista para os itens de baixo */}
            <li>
              <button onClick={() => setActiveView('profile')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'profile' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
                <User className="w-5 h-5 mr-3" />
                Meu Perfil
              </button>
            </li>
            <li>
              <button onClick={logout} className="flex items-center w-full p-3 rounded-lg text-lg font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200">
                <LogOut className="w-5 h-5 mr-3" />
                Sair
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default ClientSideNav;
