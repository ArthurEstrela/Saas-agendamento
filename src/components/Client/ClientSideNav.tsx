// src/components/Client/ClientSideNav.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Heart, User, LogOut, X } from 'lucide-react'; // Adicionado ícone X
import logo from '../../assets/stylo-logo.png';
import type { UserProfile } from '../../types';

interface ClientSideNavProps {
  activeView: 'search' | 'myAppointments' | 'favorites' | 'profile' | 'booking';
  setActiveView: (view: 'search' | 'myAppointments' | 'favorites' | 'profile' | 'booking') => void;
  logout: () => Promise<void>;
  userProfile: UserProfile | null;
  isOpen: boolean;      // NOVO: Recebe o estado de abertura
  setIsOpen: (isOpen: boolean) => void; // NOVO: Recebe a função para fechar
}

const ClientSideNav: React.FC<ClientSideNavProps> = ({ activeView, setActiveView, logout, userProfile, isOpen, setIsOpen }) => {
  
  // Função para lidar com cliques nos itens do menu
  const handleItemClick = (view: 'search' | 'myAppointments' | 'favorites' | 'profile' | 'booking') => {
    setActiveView(view);
    setIsOpen(false); // Fecha o menu após clicar em um item no mobile
  };

  return (
    <>
      {/* Overlay para fechar o menu no mobile */}
      <div 
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      <nav className={`fixed left-0 top-0 h-full w-72 bg-gray-950 p-6 flex flex-col shadow-lg z-40
                       transition-transform duration-300 ease-in-out 
                       md:translate-x-0 
                       ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                      `}>
        <div className="flex items-center justify-between mb-10">
          <Link to="/" onClick={() => setIsOpen(false)}>
            <img src={logo} alt="Stylo Logo" className="h-10 w-auto mr-3" />
          </Link>
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
            aria-label="Fechar menu"
          >
            <X size={24} />
          </button>
        </div>
        <ul className="space-y-3 flex-grow">
          <li>
            <button onClick={() => handleItemClick('search')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'search' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
              <Search className="w-5 h-5 mr-3" />
              Pesquisar
            </button>
          </li>
          <li>
            <button onClick={() => handleItemClick('myAppointments')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'myAppointments' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
              <Calendar className="w-5 h-5 mr-3" />
              Meus Agendamentos
            </button>
          </li>
          <li>
            <button onClick={() => handleItemClick('favorites')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'favorites' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
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
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleItemClick('profile')} className={`flex items-center w-full p-3 rounded-lg text-lg font-medium transition-colors duration-200 ${activeView === 'profile' ? 'bg-[#daa520] text-gray-900' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
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
    </>
  );
};

export default ClientSideNav;