import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/stylo-logo.png';
import {
  LayoutDashboard, User, Scissors, Users, Clock, DollarSign, Bell, Star, LogOut, X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import type { ProviderDashboardView } from '../ServiceProviderDashboard'; // Importa o tipo

interface NavItemProps {
  icon: React.ElementType;
  text: string;
  view: ProviderDashboardView;
  active: boolean;
  onClick: (view: ProviderDashboardView) => void;
}

const NavItem = ({ icon: Icon, text, view, active, onClick }: NavItemProps) => (
  <button
    onClick={() => onClick(view)}
    className={`flex items-center w-full h-12 px-4 text-left transition-all duration-300 ease-in-out group ${
      active
        ? "bg-[#daa520] text-black rounded-lg shadow-lg shadow-[#daa520]/20"
        : "text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-md"
    }`}
  >
    <Icon className="h-6 w-6 mr-4 transition-transform duration-300 group-hover:scale-110" />
    <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">
      {text}
    </span>
  </button>
);

interface SideNavProps {
    activeView: ProviderDashboardView;
    setActiveView: (view: ProviderDashboardView) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

export const ServiceProviderSideNav = ({ activeView, setActiveView, isOpen, setIsOpen }: SideNavProps) => {
  const { logout, userProfile } = useAuthStore();

  const handleNavClick = (view: ProviderDashboardView) => {
      setActiveView(view);
      setIsOpen(false); // Fecha o menu no mobile
  }

  return (
    <>
      {/* Overlay para mobile */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>
      {/* Container do SideNav */}
      <aside
        className={`w-72 h-screen bg-black p-4 flex flex-col border-r border-gray-800 fixed top-0 left-0 z-40
                       transition-transform duration-300 ease-in-out
                       md:translate-x-0
                       ${isOpen ? "translate-x-0" : "-translate-x-full"}
                      `}
      >
        <div className="flex items-center justify-between mb-10 px-2">
          <Link to="/">
            <img className="h-10 w-auto" src={logo} alt="Stylo" />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="flex-grow flex flex-col space-y-2">
            <NavItem icon={LayoutDashboard} text="Agenda" view="agenda" active={activeView === 'agenda'} onClick={handleNavClick} />
            <NavItem icon={Scissors} text="Serviços" view="services" active={activeView === 'services'} onClick={handleNavClick} />
            <NavItem icon={Users} text="Profissionais" view="professionals" active={activeView === 'professionals'} onClick={handleNavClick} />
            <NavItem icon={Clock} text="Disponibilidade" view="availability" active={activeView === 'availability'} onClick={handleNavClick} />
            <NavItem icon={DollarSign} text="Financeiro" view="financial" active={activeView === 'financial'} onClick={handleNavClick} />
            <NavItem icon={Star} text="Avaliações" view="reviews" active={activeView === 'reviews'} onClick={handleNavClick} />
            <NavItem icon={Bell} text="Notificações" view="notifications" active={activeView === 'notifications'} onClick={handleNavClick} />
        </nav>
        <div className="mt-auto border-t border-gray-800 pt-4">
            <NavItem icon={User} text="Meu Perfil" view="profile" active={activeView === 'profile'} onClick={handleNavClick} />
            <button
              onClick={logout}
              className="flex items-center w-full h-12 px-4 mt-1 text-left text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all duration-300 ease-in-out group"
            >
              <LogOut className="h-6 w-6 mr-4 transition-transform duration-300 group-hover:scale-110" />
              <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">
                Sair
              </span>
            </button>
        </div>
      </aside>
    </>
  );
};