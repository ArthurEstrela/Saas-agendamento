// Em src/components/Professional/ProfessionalSideNav.tsx

import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/stylo-logo.png";
import {
  LayoutDashboard,
  User,
  Clock, // <-- Mantido
  Bell,
  Star,
  LogOut,
  X,
  // --- Ícones removidos: Scissors, Users, DollarSign, CreditCard ---
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore";
// 1. Importar o tipo de perfil e vista corretos
import type { ProfessionalProfile } from "../../types";
import type { ProfessionalDashboardView } from "./ProfessionalDashboard";
import { useNotificationStore } from "../../store/notificationsStore";

// 2. A interface NavItem pode ser mantida como está
interface NavItemProps {
  icon: React.ElementType;
  text: string;
  view: ProfessionalDashboardView; // <-- Tipo atualizado
  active: boolean;
  onClick: (view: ProfessionalDashboardView) => void; // <-- Tipo atualizado
  disabled?: boolean;
}

const NavItem = ({ icon: Icon, text, view, active, onClick, disabled }: NavItemProps) => (
  <button
    onClick={() => onClick(view)}
    disabled={disabled} // <-- Aplicar "disabled"
    className={`flex items-center w-full h-12 px-4 text-left transition-all duration-300 ease-in-out group ${
      active
        ? "bg-[#daa520] text-black rounded-lg shadow-lg shadow-[#daa520]/20"
        : "text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-md"
    } ${
      disabled ? "opacity-50 cursor-not-allowed" : "" // <-- Estilo de desabilitado
    }`}
  >
    <Icon className="h-6 w-6 mr-4 transition-transform duration-300 group-hover:scale-110" />
    <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">
      {text}
    </span>
  </button>
);

// 3. Interface de Props atualizada
interface SideNavProps {
  activeView: ProfessionalDashboardView;
  setActiveView: (view: ProfessionalDashboardView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  // --- REMOVIDO: disableNav ---
}

export const ProfessionalSideNav = ({
  activeView,
  setActiveView,
  isOpen,
  setIsOpen,
}: SideNavProps) => {
  const { userProfile } = useProfileStore();
  const { logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  // 4. Usar o tipo de perfil correto
  const professionalProfile = userProfile as ProfessionalProfile;

  const handleNavClick = (view: ProfessionalDashboardView) => {
    // --- REMOVIDO: Lógica de disableNav ---
    setActiveView(view);
    setIsOpen(false); 
  };

  return (
    <>
      {/* Overlay para mobile */}
      {/* ... (sem alteração) ... */}
      
      {/* Container do SideNav */}
      <aside
        className={`w-72 h-screen bg-black p-4 ...`}
      >
        <div className="flex items-center justify-between mb-10 px-2">
          {/* ... (sem alteração) ... */}
        </div>
        
        <nav className="flex-grow flex flex-col space-y-2">
          {/* 5. LISTA DE ITENS DRASTICAMENTE REDUZIDA */}
          <NavItem
            icon={LayoutDashboard}
            text="Agenda"
            view="agenda"
            active={activeView === "agenda"}
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
            icon={Star}
            text="Avaliações"
            view="reviews"
            active={activeView === "reviews"}
            onClick={handleNavClick}
          />
          
          {/* --- REMOVIDOS: Serviços, Profissionais, Financeiro, Assinatura --- */}
          
          {/* Botão de Notificações (mantido) */}
          <button
            onClick={() => handleNavClick("notifications")}
            className={`flex items-center justify-between w-full ...`}
          >
            <div className="flex items-center">
              <Bell className="h-6 w-6 mr-4 ..." />
              <span className="font-semibold ...">
                Notificações
              </span>
            </div>
            {unreadCount > 0 && (
              <span className="flex items-center ...">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>
        
        <div className="mt-auto border-t border-gray-800 pt-4">
          {/* 6. Lógica do perfil atualizada */}
          <button
            onClick={() => handleNavClick("profile")}
            className={`flex items-center w-full p-2 ...`}
          >
            <div className="w-10 h-10 rounded-full ...">
              {/* 7. Usar 'avatarUrl' ou 'profilePictureUrl' do 'BaseUser' */}
              {professionalProfile?.avatarUrl || professionalProfile?.profilePictureUrl ? (
                <img
                  src={professionalProfile.avatarUrl || professionalProfile.profilePictureUrl}
                  alt={professionalProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-gray-400" />
              )}
            </div>
            <div className="overflow-hidden">
              {/* 8. Usar 'name' em vez de 'businessName' */}
              <p className="font-semibold text-white text-sm truncate">
                {professionalProfile?.name}
              </p>
              <p className="text-xs text-gray-400">Ver Perfil</p>
            </div>
          </button>
          
          {/* Botão de Logout (mantido) */}
          <button
            onClick={logout}
            className="flex items-center w-full h-12 px-4 mt-1 ..."
          >
            <LogOut className="h-6 w-6 mr-4 ..." />
            <span className="font-semibold ...">
              Sair
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};