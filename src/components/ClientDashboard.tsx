import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import logo from "../assets/stylo-logo.png";

// Componentes
import { ClientSideNav } from "./Client/ClientSideNav";
import { ClientProfileSection } from "./Client/ClientProfileSection";
import { ClientMyAppointmentsSection } from "./Client/ClientMyAppointmentsSection";
import { ClientFavoritesSection } from "./Client/ClientFavoritesSection";
import { ClientSearchSection } from "./Client/ClientSearchSection";
import { Notifications } from "./Common/Notifications";

// UI
import { Button } from "./ui/button";

export type ClientDashboardSection =
  | "search"
  | "appointments"
  | "favorites"
  | "profile"
  | "notifications";

export const ClientDashboard = () => {
  const [activeSection, setActiveSection] =
    useState<ClientDashboardSection>("search");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const renderSection = () => {
    switch (activeSection) {
      case "search":
        return <ClientSearchSection />;
      case "appointments":
        return <ClientMyAppointmentsSection />;
      case "favorites":
        return <ClientFavoritesSection />;
      case "profile":
        return <ClientProfileSection />;
      case "notifications":
        return <Notifications />;
      default:
        return <ClientSearchSection />;
    }
  };

  const handleNavClick = (section: ClientDashboardSection) => {
    setActiveSection(section);
    setIsMobileNavOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative overflow-x-hidden">
      {/* --- BACKGROUND (Efeito Aurora Sutil) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[100px] opacity-40" />
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/5 rounded-full blur-[100px] opacity-30" />
        <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] bg-purple-900/5 rounded-full blur-[120px] opacity-30" />
      </div>

      {/* --- SIDENAV --- */}
      <ClientSideNav
        activeSection={activeSection}
        setActiveSection={handleNavClick}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
      />

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-72 transition-all duration-300 relative z-10">
        {/* Header Mobile */}
        <header className="md:hidden flex justify-between items-center p-4 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <Link to="/dashboard">
            <img src={logo} alt="Stylo" className="h-8" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(true)}
            className="text-gray-300 hover:text-white"
          >
            <Menu size={24} />
          </Button>
        </header>

        {/* CORREÇÃO DE ESPAÇAMENTO:
           1. Reduzi o padding para 'p-4 lg:p-6' (era p-8/10)
           2. Removi 'mx-auto' e 'max-w-7xl' para o conteúdo não centralizar longe da sidebar.
        */}
        <div className="flex-1 p-4 lg:p-6">
          <div className="w-full min-h-full space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};