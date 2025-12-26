import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
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
    <div className="flex h-screen bg-[#09090b] text-gray-100 font-sans selection:bg-primary/30 overflow-hidden relative">
      {/* --- BACKGROUND CORRIGIDO (Mais profundidade, menos "preto chapado") --- */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      <div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-[#09090b]/50 to-[#09090b]"
        pointerEvents="none"
      />

      {/* --- MOBILE OVERLAY --- */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* --- SIDEBAR --- */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#0c0c0e] border-r border-white/5 
        transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 md:static flex flex-col shadow-2xl
        ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex items-center justify-between p-6 md:hidden">
          <img src={logo} alt="Stylo" className="h-8" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <X size={24} />
          </Button>
        </div>

        <ClientSideNav
          activeSection={activeSection}
          setActiveSection={handleNavClick}
        />
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header Mobile */}
        <header className="md:hidden flex justify-between items-center p-4 border-b border-gray-800 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-30">
          <Link to="/dashboard">
            <img src={logo} alt="Stylo" className="h-8" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(true)}
            className="text-gray-300"
          >
            <Menu size={24} />
          </Button>
        </header>

        {/* Área de Scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 scroll-smooth">
          {/* CORREÇÃO DO ESPAÇO: Removi 'mx-auto' e aumentei o max-width */}
          <div className="w-full max-w-[1600px] min-h-full pb-20">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
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
