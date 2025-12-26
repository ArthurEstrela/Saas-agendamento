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
import logo from "../../assets/stylo-logo.png";

// UI
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils/cn";

interface SideNavProps {
  activeView: ProfessionalDashboardView;
  setActiveView: (view: ProfessionalDashboardView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
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
  const professionalProfile = userProfile as ProfessionalProfile;

  const handleNavClick = (view: ProfessionalDashboardView) => {
    setActiveView(view);
    setIsOpen(false);
  };

  const NavItem = ({
    icon: Icon,
    text,
    view,
  }: {
    icon: any;
    text: string;
    view: ProfessionalDashboardView;
  }) => {
    const isActive = activeView === view;
    return (
      <Button
        variant="ghost"
        onClick={() => handleNavClick(view)}
        className={cn(
          "w-full justify-start gap-3 px-4 py-6 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary border-r-2 border-primary rounded-none rounded-r-lg"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        )}
      >
        <Icon
          size={20}
          className={cn(isActive ? "text-primary" : "text-gray-500")}
        />
        {text}
      </Button>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed md:fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-6">
          <img src={logo} alt="Stylo" className="h-8" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400"
          >
            <X size={24} />
          </Button>
        </div>

        <nav className="flex-grow flex flex-col space-y-1 px-2">
          <p className="px-4 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 mt-2">
            Principal
          </p>
          <NavItem icon={Home} text="Início" view="home" />
          <NavItem icon={LayoutDashboard} text="Minha Agenda" view="agenda" />

          <p className="px-4 text-xs font-bold text-gray-600 uppercase tracking-wider mb-2 mt-6">
            Gestão
          </p>
          <NavItem icon={Clock} text="Horários" view="availability" />
          <NavItem icon={Star} text="Avaliações" view="reviews" />

          <Button
            variant="ghost"
            onClick={() => handleNavClick("notifications")}
            className={cn(
              "w-full justify-start gap-3 px-4 py-6 text-sm font-medium mt-1",
              activeView === "notifications"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            )}
          >
            <Bell
              size={20}
              className={
                activeView === "notifications" ? "text-white" : "text-gray-500"
              }
            />
            <span className="flex-grow text-left">Notificações</span>
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="ml-auto px-1.5 py-0.5 h-5 min-w-[20px] justify-center"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        </nav>

        <div className="p-4 border-t border-gray-800 bg-black/20">
          <button
            onClick={() => handleNavClick("profile")}
            className={cn(
              "flex items-center w-full p-2 rounded-xl transition-colors hover:bg-gray-800/50 group text-left",
              activeView === "profile" && "bg-gray-800"
            )}
          >
            <Avatar className="h-10 w-10 border border-gray-700">
              <AvatarImage src={professionalProfile?.profilePictureUrl} />
              <AvatarFallback className="bg-gray-700 text-gray-400">
                <User size={18} />
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 overflow-hidden">
              <p className="font-semibold text-white text-sm truncate group-hover:text-primary transition-colors">
                {professionalProfile?.name}
              </p>
              <p className="text-xs text-gray-500">Editar Perfil</p>
            </div>
          </button>

          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start gap-3 mt-3 text-red-400 hover:text-red-300 hover:bg-red-900/10"
          >
            <LogOut size={20} /> Sair
          </Button>
        </div>
      </aside>
    </>
  );
};
