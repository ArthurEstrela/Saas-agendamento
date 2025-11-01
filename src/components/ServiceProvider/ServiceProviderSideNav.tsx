import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/stylo-logo.png";
import {
  LayoutDashboard,
  User,
  Scissors,
  Users,
  Clock,
  DollarSign,
  Bell,
  Star,
  LogOut,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore"; // 1. Importamos a store do perfil
import type { ServiceProviderProfile } from "../../types"; // 2. Importamos o tipo correto
import type { ProviderDashboardView } from "../ServiceProviderDashboard"; // Importa o tipo
import { useNotificationStore } from "../../store/notificationsStore"; // Importar a store


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

export const ServiceProviderSideNav = ({
  activeView,
  setActiveView,
  isOpen,
  setIsOpen,
}: SideNavProps) => {
  const { userProfile } = useProfileStore();
  const { logout } = useAuthStore();
  const { unreadCount } = useNotificationStore(); // Pegar a contagem de não lidas

  const providerProfile = userProfile as ServiceProviderProfile;

  const handleNavClick = (view: ProviderDashboardView) => {
    setActiveView(view);
    setIsOpen(false); // Fecha o menu no mobile
  };

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
          <NavItem
            icon={LayoutDashboard}
            text="Agenda"
            view="agenda"
            active={activeView === "agenda"}
            onClick={handleNavClick}
          />
          <NavItem
            icon={Scissors}
            text="Serviços"
            view="services"
            active={activeView === "services"}
            onClick={handleNavClick}
          />
          <NavItem
            icon={Users}
            text="Profissionais"
            view="professionals"
            active={activeView === "professionals"}
            onClick={handleNavClick}
          />
          <NavItem
            icon={Clock}
            text="Disponibilidade"
            view="availability"
            active={activeView === "availability"}
            onClick={handleNavClick}
          />
          <NavItem
            icon={DollarSign}
            text="Financeiro"
            view="financial"
            active={activeView === "financial"}
            onClick={handleNavClick}
          />
          <NavItem
            icon={Star}
            text="Avaliações"
            view="reviews"
            active={activeView === "reviews"}
            onClick={handleNavClick}
          />
          <button
            onClick={() => handleNavClick("notifications")}
            className={`flex items-center justify-between w-full h-12 px-4 text-left transition-all duration-300 ease-in-out group ${
              activeView === "notifications"
                ? "bg-[#daa520] text-black rounded-lg shadow-lg shadow-[#daa520]/20"
                : "text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-md"
            }`}
          >
            <div className="flex items-center">
              <Bell className="h-6 w-6 mr-4 transition-transform duration-300 group-hover:scale-110" />
              <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">
                Notificações
              </span>
            </div>
            {unreadCount > 0 && (
              <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>
        <div className="mt-auto border-t border-gray-800 pt-4">
          <button
            onClick={() => handleNavClick("profile")}
            className={`flex items-center w-full p-2 text-left rounded-lg transition-all duration-300 ease-in-out group
                ${
                  activeView === "profile"
                    ? "bg-gray-700/80"
                    : "hover:bg-gray-800/50"
                }
              `}
          >
            <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 overflow-hidden flex items-center justify-center mr-3">
              {providerProfile?.logoUrl ? (
                <img
                  src={providerProfile.logoUrl}
                  alt={providerProfile.businessName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-gray-400" />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-white text-sm truncate">
                {providerProfile?.businessName}
              </p>
              <p className="text-xs text-gray-400">Ver Perfil</p>
            </div>
          </button>
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
