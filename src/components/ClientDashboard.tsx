import { useState } from "react";
import { ClientSideNav } from "./Client/ClientSideNav";
import { ClientProfileSection } from "./Client/ClientProfileSection";
import { ClientMyAppointmentsSection } from "./Client/ClientMyAppointmentsSection";
import { ClientFavoritesSection } from "./Client/ClientFavoritesSection";
import { ClientSearchSection } from "./Client/ClientSearchSection";
import { motion, AnimatePresence } from "framer-motion";
import { Notifications } from "./Common/Notifications";

// Define os tipos para as seções, facilitando a manutenção
type Section = "search" | "appointments" | "favorites" | "profile" | "notifications";

export const ClientDashboard = () => {
  // O estado agora controla qual seção está ativa, começando pela busca
  const [activeSection, setActiveSection] = useState<Section>("search");

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

  return (
    <div className="flex min-h-screen bg-gray-900 text-white font-sans">
      {/* Barra de Navegação Lateral */}
      <aside className="w-64 bg-black/50 p-6 sticky top-0 h-screen">
        <ClientSideNav
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      </aside>

      {/* Conteúdo Principal Dinâmico */}
      <main className="flex-1 p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
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
