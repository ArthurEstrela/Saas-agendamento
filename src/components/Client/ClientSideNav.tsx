// src/components/Client/ClientSideNav.tsx
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Calendar, Heart, User, LogOut, X, Bell } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationsStore";
import type { UserProfile } from "../../types";
import logo from "../../assets/stylo-logo.png";

// --- Tipos e Configurações ---
interface ClientSideNavProps {
  activeView: string;
  setActiveView: (
    view: "search" | "appointments" | "favorites" | "profile" | "notifications"
  ) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

// Componente auxiliar para os itens de navegação, com o estilo do painel do prestador
const NavItem = ({
  icon: Icon,
  text,
  active,
  onClick,
  notificationCount = 0,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full h-12 px-4 text-left rounded-md transition-all duration-300 ease-in-out group ${
      active
        ? "bg-amber-500/20 text-amber-400 font-semibold"
        : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
    }`}
  >
    <Icon className="h-6 w-6 mr-4 transition-transform duration-300 group-hover:scale-110" />
    <span className="transition-transform duration-300 group-hover:translate-x-1 flex-grow">
      {text}
    </span>
    {notificationCount > 0 && (
      <span className="bg-red-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
        {notificationCount}
      </span>
    )}
  </button>
);

// --- Componente Principal ---
const ClientSideNav: React.FC<ClientSideNavProps> = ({
  activeView,
  setActiveView,
  isOpen,
  setIsOpen,
}) => {
  const { userProfile, logout } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile?.uid) {
      fetchNotifications(userProfile.uid);
    }
  }, [userProfile, fetchNotifications]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleNavClick = (view) => {
    setActiveView(view);
    setIsOpen(false); // Fecha o menu no mobile ao clicar
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo e Botão de Fechar */}
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

      {/* Navegação */}
      <nav className="flex-grow flex flex-col space-y-2">
        <NavItem
          icon={Search}
          text="Buscar Profissionais"
          active={activeView === "search"}
          onClick={() => handleNavClick("search")}
        />
        <NavItem
          icon={Calendar}
          text="Meus Agendamentos"
          active={activeView === "myAppointments"}
          onClick={() => handleNavClick("myAppointments")}
        />
        <NavItem
          icon={Heart}
          text="Favoritos"
          active={activeView === "favorites"}
          onClick={() => handleNavClick("favorites")}
        />
        <NavItem
          icon={Bell}
          text="Notificações"
          active={activeView === "notifications"}
          onClick={() => handleNavClick("notifications")}
          notificationCount={unreadCount}
        />
      </nav>

      {/* Rodapé - Perfil e Sair */}
      <div className="mt-auto">
        <div className="border-t border-gray-800 pt-4">
          <div className="flex items-center px-2 mb-4">
            <img
              src={
                userProfile?.photoURL ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  userProfile?.displayName || "C"
                )}&background=111827&color=FBBF24`
              }
              alt="Sua foto de perfil"
              className="h-10 w-10 rounded-full object-cover mr-3 border-2 border-gray-700"
            />
            <div>
              <p className="text-sm font-semibold text-white truncate">
                {userProfile?.displayName || "Cliente"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {userProfile?.email}
              </p>
            </div>
          </div>
          <NavItem
            icon={User}
            text="Meu Perfil"
            active={activeView === "profile"}
            onClick={() => handleNavClick("profile")}
          />
          <button
            onClick={handleLogout}
            className="flex items-center w-full h-12 px-4 mt-1 text-left text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-md transition-all duration-300 ease-in-out group"
          >
            <LogOut className="h-6 w-6 mr-4 transition-transform duration-300 group-hover:scale-110" />
            <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">
              Sair
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay para mobile */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Container da SideNav */}
      <aside
        className={`w-72 h-screen bg-black p-4 flex flex-col border-r border-gray-800 fixed top-0 left-0 z-40
                   transition-transform duration-300 ease-in-out
                   md:translate-x-0
                   ${isOpen ? "translate-x-0" : "-translate-x-full"}
                  `}
      >
        {navContent}
      </aside>
    </>
  );
};

export default ClientSideNav;
