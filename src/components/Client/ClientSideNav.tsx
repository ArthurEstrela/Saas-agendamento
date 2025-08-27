import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Home, Calendar, Star, User, LogOut, X, Bell } from "lucide-react"; // Adicionado Bell
import logo from "../../assets/stylo-logo.png";
import type { UserProfile } from "../../types";
import { useNotificationStore } from "../../store/notificationsStore";

interface ClientSideNavProps {
  activeView: string;
  // Adicionado 'notifications' às opções de view
  setActiveView: (
    view:
      | "search"
      | "myAppointments"
      | "favorites"
      | "profile"
      | "notifications"
  ) => void;
  logout: () => void;
  userProfile: UserProfile | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
  { icon: Home, label: "Procurar", view: "search" },
  { icon: Calendar, label: "Meus Agendamentos", view: "myAppointments" },
  { icon: Star, label: "Favoritos", view: "favorites" },
  { icon: Bell, label: "Notificações", view: "notifications" }, // <-- NOVO ITEM
  { icon: User, label: "Meu Perfil", view: "profile" },
];

const ClientSideNav: React.FC<ClientSideNavProps> = ({
  activeView,
  setActiveView,
  logout,
  userProfile,
  isOpen,
  setIsOpen,
}) => {
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    if (userProfile?.uid) {
      fetchNotifications(userProfile.uid);
    }
  }, [userProfile, fetchNotifications]);

  const NavLink = ({ item }) => (
    <button
      onClick={() => {
        setActiveView(item.view);
        setIsOpen(false); // Fecha o menu ao clicar num item
      }}
      className={`flex items-center w-full px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors duration-200 ${
        activeView === item.view
          ? "bg-[#daa520] text-black shadow-lg"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`}
    >
      <item.icon className="w-6 h-6 mr-4" />
      <span>{item.label}</span>
      {item.view === 'notifications' && unreadCount > 0 && (
        <span className="ml-auto bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">{unreadCount}</span>
      )}
    </button>
  );

  const navContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 flex justify-between items-center md:justify-start">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Stylo" className="h-10 w-auto" />
          <span className="text-2xl font-bold text-white hidden md:block">
            Stylo
          </span>
        </Link>
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-4 mt-4">
        {userProfile ? (
          <div className="flex items-center gap-3">
            <img
              src={
                userProfile.photoURL ||
                `https://ui-avatars.com/api/?name=${userProfile.displayName}&background=daa520&color=000`
              }
              alt="User"
              className="h-12 w-12 rounded-full object-cover border-2 border-[#daa520]"
            />
            <div>
              <p className="font-semibold text-white">
                {userProfile.displayName}
              </p>
              <p className="text-xs text-gray-400">{userProfile.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="text-gray-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Visitante</p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-grow px-4 mt-6 space-y-2">
        {navItems.map((item) => (
          <NavLink key={item.label} item={item} />
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-left text-sm font-medium text-gray-300 rounded-lg hover:bg-red-800/50 hover:text-white transition-colors duration-200"
        >
          <LogOut className="w-6 h-6 mr-4" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* SideNav */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gray-900 border-r border-gray-800 z-40 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {navContent}
      </aside>
    </>
  );
};

export default ClientSideNav;
