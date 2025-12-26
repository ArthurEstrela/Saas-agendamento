import { Link } from "react-router-dom";
import logo from "../../assets/stylo-logo.png";
import {
  LayoutDashboard,
  Scissors,
  Users,
  Clock,
  DollarSign,
  Bell,
  Star,
  LogOut,
  X,
  CreditCard,
  User as UserIcon,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore";
import type {
  ServiceProviderProfile,
  ProviderDashboardView,
} from "../../types"; // Importação corrigida!
import { useNotificationStore } from "../../store/notificationsStore";

// UI Components
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils/cn";

interface SideNavProps {
  activeView: ProviderDashboardView;
  setActiveView: (view: ProviderDashboardView) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  disableNav: boolean;
}

export const ServiceProviderSideNav = ({
  activeView,
  setActiveView,
  isOpen,
  setIsOpen,
  disableNav,
}: SideNavProps) => {
  const { userProfile } = useProfileStore();
  const { logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  const providerProfile = userProfile as ServiceProviderProfile;

  const handleNavClick = (view: ProviderDashboardView) => {
    if (disableNav && view !== "subscription") return;
    setActiveView(view);
    setIsOpen(false);
  };

  const navItems: {
    id: ProviderDashboardView;
    label: string;
    icon: React.ElementType;
  }[] = [
    { id: "agenda", label: "Agenda", icon: LayoutDashboard },
    { id: "services", label: "Serviços", icon: Scissors },
    { id: "professionals", label: "Profissionais", icon: Users },
    { id: "availability", label: "Disponibilidade", icon: Clock },
    { id: "financial", label: "Financeiro", icon: DollarSign },
    { id: "reviews", label: "Avaliações", icon: Star },
    { id: "subscription", label: "Assinatura", icon: CreditCard },
    { id: "notifications", label: "Notificações", icon: Bell },
  ];

  return (
    <>
      {/* Overlay Mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-black/80 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6 h-20">
          <Link to="/" onClick={() => setIsOpen(false)}>
            <img
              className="h-8 w-auto hover:scale-105 transition-transform"
              src={logo}
              alt="Stylo"
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </Button>
        </div>

        <nav className="flex-grow flex flex-col gap-1 px-3 py-4 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const isDisabled = disableNav && item.id !== "subscription";
            const Icon = item.icon;

            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => handleNavClick(item.id)}
                disabled={isDisabled}
                className={cn(
                  "w-full justify-start h-12 px-4 text-base font-medium transition-all duration-200 relative group",
                  isActive
                    ? "bg-[#daa520] text-black hover:bg-[#b8860b] shadow-md shadow-[#daa520]/20"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    "mr-3 transition-transform duration-300",
                    !isActive && !isDisabled && "group-hover:scale-110",
                    isActive
                      ? "text-black"
                      : "text-gray-500 group-hover:text-white"
                  )}
                />
                <span
                  className={cn(
                    "transition-transform duration-300",
                    !isActive && !isDisabled && "group-hover:translate-x-1"
                  )}
                >
                  {item.label}
                </span>

                {item.id === "notifications" && unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full animate-pulse text-[10px]"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 bg-black/20 space-y-2">
          <button
            onClick={() => handleNavClick("profile")}
            disabled={disableNav}
            className={cn(
              "flex items-center w-full p-2 text-left rounded-xl transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-primary",
              activeView === "profile" ? "bg-gray-800" : "hover:bg-gray-800/50",
              disableNav && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            <Avatar className="h-10 w-10 border border-gray-700 group-hover:border-[#daa520] transition-colors">
              <AvatarImage
                src={providerProfile?.logoUrl}
                alt={providerProfile?.businessName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gray-700 text-gray-400">
                <UserIcon size={18} />
              </AvatarFallback>
            </Avatar>

            <div className="ml-3 overflow-hidden">
              <p
                className={cn(
                  "font-bold text-sm truncate transition-colors",
                  activeView === "profile"
                    ? "text-white"
                    : "text-gray-200 group-hover:text-[#daa520]"
                )}
              >
                {providerProfile?.businessName || "Meu Negócio"}
              </p>
              <p className="text-xs text-gray-500 group-hover:text-gray-400">
                Ver Perfil
              </p>
            </div>
          </button>

          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start h-10 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-3"
          >
            <LogOut size={18} />
            <span className="font-semibold">Sair</span>
          </Button>
        </div>
      </aside>
    </>
  );
};
