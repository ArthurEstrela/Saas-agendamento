import { useState } from "react";
import { ClientSideNav } from "./Client/ClientSideNav";
import { ClientProfileSection } from "./Client/ClientProfileSection";
import { ClientMyAppointmentsSection } from "./Client/ClientMyAppointmentsSection";
import { ClientFavoritesSection } from "./Client/ClientFavoritesSection";
import { ClientSearchSection } from "./Client/ClientSearchSection";
import { motion, AnimatePresence } from "framer-motion";
import { Notifications } from "./Common/Notifications";
import { Menu, X } from "lucide-react"; // Ícones para o menu mobile
import logo from "../assets/stylo-logo.png"; // Logo para o header mobile
import { Link } from "react-router-dom";

// Define os tipos para as seções, facilitando a manutenção
type Section =
  | "search"
  | "appointments"
  | "favorites"
  | "profile"
  | "notifications";

export const ClientDashboard = () => {
  // O estado agora controla qual seção está ativa, começando pela busca
  const [activeSection, setActiveSection] = useState<Section>("search");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Função para renderizar o componente da seção ativa
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

  const handleNavClick = (section: Section) => {
    setActiveSection(section);
    setIsMobileNavOpen(false); // Fecha o menu ao selecionar uma opção
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white font-sans">
      {/* Overlay para fechar o menu mobile */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      {/* Barra de Navegação Lateral (Sidenav) */}
      <aside
        className={`fixed top-0 left-0 w-64 bg-black/80 backdrop-blur-md h-full z-40 p-6 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ClientSideNav
          activeSection={activeSection}
          setActiveSection={handleNavClick}
        />
      </aside>

      {/* Conteúdo Principal Dinâmico */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 md:ml-64 overflow-y-auto">
        {/* Header para Telas Pequenas */}
        <header className="md:hidden flex justify-between items-center mb-6">
          <Link to="/dashboard">
            <img src={logo} alt="Stylo" className="h-8" />
          </Link>
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="p-2"
          >
            {isMobileNavOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection} // A key garante que a animação ocorra na troca
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
