import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Calendar,
  Heart,
  LogOut,
  Bell,
  User as UserIcon,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore";
import { useNotificationStore } from "../../store/notificationsStore";
import logo from "../../assets/stylo-logo.png";
import type { Section } from "../ClientDashboard";

// UI Components
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils/cn";

interface ClientSideNavProps {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
}

export const ClientSideNav = ({
  activeSection,
  setActiveSection,
}: ClientSideNavProps) => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();
  const { userProfile } = useProfileStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    if (user?.uid) fetchNotifications(user.uid);
  }, [user, fetchNotifications]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navItems: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "search", label: "Explorar", icon: Search },
    { id: "appointments", label: "Meus Agendamentos", icon: Calendar },
    { id: "favorites", label: "Favoritos", icon: Heart },
    { id: "notifications", label: "Notificações", icon: Bell },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="p-8 pb-4 flex justify-center md:justify-start">
        <Link to="/dashboard" className="block">
          <img
            src={logo}
            alt="Stylo"
            className="h-10 w-auto hover:scale-105 transition-transform duration-300"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;

          return (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => setActiveSection(item.id)}
              className={cn(
                "w-full justify-start h-12 px-4 text-base font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              )}
            >
              {/* Indicador lateral ativo */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_#daa520]" />
              )}

              <Icon
                size={20}
                className={cn(
                  "mr-3 transition-transform duration-300",
                  isActive
                    ? "text-primary scale-110"
                    : "text-gray-500 group-hover:text-white group-hover:scale-105"
                )}
              />
              <span className={cn(isActive && "font-bold")}>{item.label}</span>

              {item.id === "notifications" && unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-auto h-5 w-auto min-w-[20px] px-1.5 flex items-center justify-center rounded-full animate-pulse text-[10px]"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Footer User Profile */}
      <div className="p-4 border-t border-gray-800 bg-black/20">
        <button
          onClick={() => setActiveSection("profile")}
          className={cn(
            "flex items-center w-full p-2.5 rounded-xl transition-all duration-200 group text-left",
            activeSection === "profile"
              ? "bg-gray-800 border border-gray-700 shadow-inner"
              : "hover:bg-gray-800/50 border border-transparent"
          )}
        >
          <Avatar
            className={cn(
              "h-10 w-10 border transition-all",
              activeSection === "profile"
                ? "border-primary shadow-[0_0_10px_rgba(218,165,32,0.3)]"
                : "border-gray-700 group-hover:border-gray-500"
            )}
          >
            <AvatarImage
              src={userProfile?.profilePictureUrl}
              className="object-cover"
            />
            <AvatarFallback className="bg-gray-700 text-gray-300">
              <UserIcon size={18} />
            </AvatarFallback>
          </Avatar>

          <div className="ml-3 overflow-hidden flex-1">
            <p
              className={cn(
                "text-sm font-semibold truncate transition-colors",
                activeSection === "profile"
                  ? "text-primary"
                  : "text-white group-hover:text-gray-200"
              )}
            >
              {userProfile?.name?.split(" ")[0] || "Usuário"}
            </p>
            <p className="text-xs text-gray-500 truncate">Ver meu perfil</p>
          </div>
        </button>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start mt-2 h-10 px-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-3 text-sm"
        >
          <LogOut size={18} />
          Sair
        </Button>
      </div>
    </div>
  );
};
