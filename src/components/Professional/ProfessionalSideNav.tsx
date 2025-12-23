// src/components/Professional/ProfessionalSideNav.tsx

import {
  LayoutDashboard,
  User,
  Clock,
  Bell,
  Star,
  LogOut,
  X,
  Home,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore";
import type { ProfessionalProfile } from "../../types";
import type { ProfessionalDashboardView } from "./ProfessionalDashboard";
import { useNotificationStore } from "../../store/notificationsStore";

// 1. Definição da interface SideNavProps (que estava faltando)
interface SideNavProps {
  activeView: ProfessionalDashboardView;
  setActiveView: (view: ProfessionalDashboardView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// 2. Definição da interface NavItemProps (para corrigir o 'any')
interface NavItemProps {
  icon: React.ElementType;
  text: string;
  view: ProfessionalDashboardView;
  active: boolean;
  onClick: (view: ProfessionalDashboardView) => void;
}

// 3. Componente NavItem com a tipagem correta
const NavItem = ({ icon: Icon, text, view, active, onClick }: NavItemProps) => (
  <button
    onClick={() => onClick(view)}
    className={`flex items-center w-full h-12 px-4 text-left transition-all duration-300 ease-in-out group ${
      active
        ? "bg-[#daa520] text-black rounded-lg shadow-lg shadow-[#daa520]/20"
        : "text-gray-400 hover:bg-gray-800/50 hover:text-white rounded-md"
    }`}
  >
    <Icon className="h-5 w-5 mr-4 transition-transform duration-300 group-hover:scale-110" />
    <span className="font-semibold text-sm transition-transform duration-300 group-hover:translate-x-1">
      {text}
    </span>
  </button>
);

// 4. Componente Principal
export const ProfessionalSideNav = ({
  activeView,
  setActiveView,
  isOpen,
  setIsOpen,
}: SideNavProps) => {
  const { userProfile } = useProfileStore();
  const { logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const professionalProfile = userProfile as ProfessionalProfile;

  const handleNavClick = (view: ProfessionalDashboardView) => {
    setActiveView(view);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={`fixed md:fixed inset-y-0 left-0 z-50 w-72 bg-black border-r border-gray-800 p-4 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between mb-8 px-2">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-lg flex items-center justify-center font-bold text-black">
              S
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Stylo
            </span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-grow flex flex-col space-y-1">
          <p className="px-4 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 mt-2">
            Principal
          </p>

          <NavItem
            icon={Home}
            text="Início"
            view="home"
            active={activeView === "home"}
            onClick={handleNavClick}
          />
          <NavItem
            icon={LayoutDashboard}
            text="Minha Agenda"
            view="agenda"
            active={activeView === "agenda"}
            onClick={handleNavClick}
          />

          <p className="px-4 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 mt-6">
            Gestão
          </p>

          <NavItem
            icon={Clock}
            text="Horários"
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

          <button
            onClick={() => handleNavClick("notifications")}
            className={`flex items-center w-full h-12 px-4 mt-2 text-left rounded-md transition-colors ${
              activeView === "notifications"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800/50"
            }`}
          >
            <Bell className="h-5 w-5 mr-4" />
            <span className="font-semibold text-sm flex-grow">
              Notificações
            </span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>
        </nav>

        <div className="mt-auto border-t border-gray-800 pt-4">
          <button
            onClick={() => handleNavClick("profile")}
            className={`flex items-center w-full p-2 rounded-xl transition-colors hover:bg-gray-800/50 group ${
              activeView === "profile" ? "bg-gray-800" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-full border border-gray-700 overflow-hidden flex-shrink-0">
              {professionalProfile?.profilePictureUrl ? (
                <img
                  src={professionalProfile.profilePictureUrl}
                  alt={professionalProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <User size={20} className="text-gray-400" />
                </div>
              )}
            </div>
            <div className="ml-3 overflow-hidden text-left">
              <p className="font-semibold text-white text-sm truncate group-hover:text-amber-400 transition-colors">
                {professionalProfile?.name}
              </p>
              <p className="text-xs text-gray-500">Editar Perfil</p>
            </div>
          </button>

          <button
            onClick={logout}
            className="flex items-center w-full h-10 px-2 mt-3 text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-4" />
            <span className="font-semibold text-sm">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
};