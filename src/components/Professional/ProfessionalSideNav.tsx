import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/stylo-logo.png";
import {
  LayoutDashboard,
  Clock,
  Bell,
  Star,
  LogOut,
  X,
  Home,
  User as UserIcon,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useProfileStore } from "../../store/profileStore";
import type { ProfessionalProfile } from "../../types";
import { useNotificationStore } from "../../store/notificationsStore";
import { motion } from "framer-motion";

// UI Components
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils/cn";

interface SideNavProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const ProfessionalSideNav = ({ isOpen, setIsOpen }: SideNavProps) => {
  const { userProfile } = useProfileStore();
  const { logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const location = useLocation();

  const professionalProfile = userProfile as ProfessionalProfile;

  const navItems = [
    { path: "/dashboard/home", label: "Início", icon: Home },
    {
      path: "/dashboard/my-agenda",
      label: "Minha Agenda",
      icon: LayoutDashboard,
    },
    { path: "/dashboard/my-availability", label: "Horários", icon: Clock },
    { path: "/dashboard/my-reviews", label: "Avaliações", icon: Star },
    { path: "/dashboard/notifications", label: "Notificações", icon: Bell },
  ];

  return (
    <>
      {/* Overlay Mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
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

        <nav className="flex-grow flex flex-col px-4 py-4 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start h-12 px-4 text-base font-medium transition-all duration-200 relative group overflow-hidden mb-1",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  {/* Indicador lateral iluminado */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 w-1 bg-primary rounded-r-full shadow-[0_0_15px_#daa520]"
                      initial={{ height: 0, top: "50%" }}
                      animate={{ height: "24px", top: "calc(50% - 12px)" }}
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

                  {item.path === "/dashboard/notifications" &&
                    unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-auto h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full animate-pulse text-[10px]"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé do Perfil */}
        <div className="p-4 border-t border-white/5 bg-black/20 space-y-2">
          <Link
            to="/dashboard/my-profile"
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center w-full p-2.5 text-left rounded-xl transition-all duration-200 group outline-none",
              location.pathname === "/dashboard/my-profile"
                ? "bg-white/10 border border-white/10"
                : "hover:bg-white/5 border border-transparent"
            )}
          >
            <Avatar
              className={cn(
                "h-10 w-10 border transition-all duration-300",
                location.pathname === "/dashboard/my-profile"
                  ? "border-primary"
                  : "border-gray-700 group-hover:border-gray-500"
              )}
            >
              <AvatarImage
                src={professionalProfile?.profilePictureUrl}
                alt={professionalProfile?.name}
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
                  location.pathname === "/dashboard/my-profile"
                    ? "text-primary"
                    : "text-gray-200 group-hover:text-white"
                )}
              >
                {professionalProfile?.name || "Profissional"}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mt-0.5">
                Ver Perfil
              </p>
            </div>
          </Link>

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
