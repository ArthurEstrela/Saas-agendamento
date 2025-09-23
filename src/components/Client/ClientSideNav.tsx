import { useEffect } from "react";
import {
  Search,
  Calendar,
  Heart,
  User,
  LogOut,
  ImageIcon,
  Bell,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore";
import { useNotificationStore } from "../../store/notificationsStore";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/stylo-logo.png";

// 1. Definindo um tipo para as seções, o que remove a necessidade do "as any"
type NavSection =
  | "search"
  | "appointments"
  | "favorites"
  | "profile"
  | "notifications";

interface ClientSideNavProps {
  activeSection: NavSection;
  setActiveSection: (section: NavSection) => void;
}

// 2. Criando um componente reutilizável para cada item da navegação
const NavItem = ({ icon: Icon, label, isActive, count = 0, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 text-base font-medium ${
      isActive
        ? "bg-amber-500/10 text-amber-400"
        : "text-gray-400 hover:bg-gray-800 hover:text-white"
    }`}
  >
    <div className="flex items-center">
      <Icon className="mr-3 flex-shrink-0" size={22} />
      <span>{label}</span>
    </div>
    {/* 3. Lógica do contador com a cor correta (âmbar) e sempre visível */}
    {count > 0 && (
      <span className="flex items-center justify-center w-6 h-6 bg-amber-500 text-black text-xs font-bold rounded-full">
        {count}
      </span>
    )}
  </button>
);

export const ClientSideNav = ({
  activeSection,
  setActiveSection,
}: ClientSideNavProps) => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const { userProfile } = useProfileStore();
  const { unreadCount, fetchNotifications, clearNotifications } =
    useNotificationStore();

  // 4. Adicionando o useEffect para buscar as notificações em tempo real
  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
    }
    return () => {
      clearNotifications(); // Limpa ao desmontar para evitar memory leaks
    };
  }, [user, fetchNotifications, clearNotifications]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { id: "search", label: "Buscar", icon: Search },
    { id: "appointments", label: "Agendamentos", icon: Calendar },
    { id: "favorites", label: "Favoritos", icon: Heart },
    {
      id: "notifications",
      label: "Notificações",
      icon: Bell,
      count: unreadCount,
    },
  ];

  return (
    <div className="flex flex-col justify-between h-full text-white">
      <div>
        <div className="mb-12 px-2">
          <Link to="/dashboard">
            <img src={logo} alt="Stylo" className="h-10" />
          </Link>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeSection === item.id}
              count={item.count}
              onClick={() => setActiveSection(item.id as NavSection)}
            />
          ))}
        </nav>
      </div>

      <div className="border-t border-gray-700/50 pt-4">
        {/* Botão de Perfil */}
        <button
          onClick={() => setActiveSection("profile")}
          className={`w-full flex items-center p-2 rounded-lg transition-all duration-200 text-base font-medium ${
            activeSection === "profile"
              ? "bg-amber-500/10"
              : "hover:bg-gray-800/50"
          }`}
        >
          <div className="relative mr-3">
            {userProfile?.profilePictureUrl ? (
              <img
                src={userProfile.profilePictureUrl}
                alt="Foto do perfil"
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-500"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                <ImageIcon size={20} className="text-gray-400" />
              </div>
            )}
          </div>
          <span
            className={`truncate ${
              activeSection === "profile" ? "text-amber-400" : "text-white"
            }`}
          >
            {userProfile?.name || userProfile?.email}
          </span>
        </button>

        {/* Botão de Sair */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-3 mt-2 rounded-lg transition-all duration-200 text-gray-400 hover:bg-red-500/10 hover:text-red-400 text-base font-medium"
        >
          <LogOut className="mr-3" size={22} />
          Sair
        </button>
      </div>
    </div>
  );
};
