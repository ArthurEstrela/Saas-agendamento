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
} from "../../types";
import { useNotificationStore } from "../../store/notificationsStore";
import { motion } from "framer-motion"; // Adicione esta linha

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
      {/* Overlay Mobile - Agora com desfoque suave */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar - Corrigido para 'bg-surface' e bordas mais sutis */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-surface border-r border-white/5 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6 h-20">
          <Link to="/" onClick={() => setIsOpen(false)} className="px-2">
            <img
              className="h-9 w-auto hover:scale-105 transition-transform duration-300"
              src={logo}
              alt="Stylo"
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="md:hidden text-gray-400 hover:text-white hover:bg-white/5"
          >
            <X size={24} />
          </Button>
        </div>

        <nav className="flex-grow flex flex-col gap-1 px-4 py-4 overflow-y-auto custom-scrollbar">
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
                  "w-full justify-start h-12 px-4 text-base font-medium transition-all duration-200 relative group overflow-hidden",
                  isActive
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : "text-gray-400 hover:text-white hover:bg-white/5",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Indicador lateral iluminado (similar ao Client Dashboard) */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 bg-primary rounded-r-full shadow-[0_0_15px_#daa520]"
                    initial={{ height: 0, top: "50%" }}
                    animate={{ height: "24px", top: "calc(50% - 12px)" }} // Força a centralização manual
                    transition={{ duration: 0.2 }}
                  />
                )}

                <Icon
                  size={20}
                  className={cn(
                    "mr-3 transition-all duration-300",
                    isActive
                      ? "text-primary scale-110"
                      : "text-gray-500 group-hover:text-white group-hover:scale-110"
                  )}
                />
                <span
                  className={cn(
                    "transition-transform duration-300",
                    isActive ? "font-bold" : "group-hover:translate-x-1"
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

        {/* Rodapé do Perfil - Cores harmonizadas com o novo Background */}
        <div className="p-4 border-t border-white/5 bg-black/20 space-y-2">
          <button
            onClick={() => handleNavClick("profile")}
            disabled={disableNav}
            className={cn(
              "flex items-center w-full p-2.5 text-left rounded-xl transition-all duration-200 group outline-none",
              activeView === "profile"
                ? "bg-white/10 border border-white/10"
                : "hover:bg-white/5 border border-transparent",
              disableNav && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            <Avatar
              className={cn(
                "h-10 w-10 border transition-all duration-300",
                activeView === "profile"
                  ? "border-primary"
                  : "border-gray-700 group-hover:border-gray-500"
              )}
            >
              <AvatarImage
                src={providerProfile?.logoUrl}
                alt={providerProfile?.businessName}
                className="object-cover"
              />
              <AvatarFallback className="bg-gray-800 text-gray-400">
                <UserIcon size={18} />
              </AvatarFallback>
            </Avatar>

            <div className="ml-3 overflow-hidden flex-1">
              <p
                className={cn(
                  "font-bold text-sm truncate transition-colors",
                  activeView === "profile"
                    ? "text-primary"
                    : "text-gray-200 group-hover:text-white"
                )}
              >
                {providerProfile?.businessName || "Meu Negócio"}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">
                Ver Perfil
              </p>
            </div>
          </button>

          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start h-10 px-4 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 gap-3"
          >
            <LogOut size={18} />
            <span className="font-semibold text-sm">Sair da conta</span>
          </Button>
        </div>
      </aside>
    </>
  );
};
