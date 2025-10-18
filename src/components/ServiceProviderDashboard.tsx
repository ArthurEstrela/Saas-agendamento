import { useState } from "react";
import { ServiceProviderSideNav } from "./ServiceProvider/ServiceProviderSideNav";
import { motion, AnimatePresence } from "framer-motion"; // 1. Importar o Framer Motion

// Importe todas as suas seções
import { AgendaView } from "./ServiceProvider/Agenda/AgendaView";
import { FinancialManagement } from "./ServiceProvider/FinancialManagement";
import { ProfessionalsManagement } from "./ServiceProvider/ProfessionalsManagement";
import { AvailabilityManagement } from "./ServiceProvider/AvailabilityManagement";
import { ProfileManagement } from "./ServiceProvider/ProfileManagement";
import { ServicesManagement } from "./ServiceProvider/ServicesManagement";
import { ReviewsManagement } from "./ServiceProvider/ReviewsManagement";
import { Notifications } from "./Common/Notifications";
import { Menu } from "lucide-react";
import { AppointmentDetailsModal } from "./ServiceProvider/Agenda/AppointmentDetailsModal";

// Tipagem para garantir que apenas seções válidas sejam chamadas
export type ProviderDashboardView =
  | "agenda"
  | "profile"
  | "services"
  | "professionals"
  | "availability"
  | "financial"
  | "reviews"
  | "notifications";

// 2. Criar o Mapeamento de Componentes
// Mapeia a string da view para o componente React correspondente
const viewComponents: Record<ProviderDashboardView, React.ComponentType<any>> = {
  agenda: AgendaView,
  financial: FinancialManagement,
  profile: ProfileManagement,
  professionals: ProfessionalsManagement,
  availability: AvailabilityManagement,
  services: ServicesManagement,
  reviews: ReviewsManagement,
  notifications: Notifications,
};

const ServiceProviderDashboard = () => {
  const [activeView, setActiveView] = useState<ProviderDashboardView>("agenda");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // 3. Obter o componente ativo diretamente do mapa
  const ActiveComponent = viewComponents[activeView];

  return (
    <div className="flex min-h-screen bg-black text-gray-200 font-sans">
      <ServiceProviderSideNav
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
      />
      <main className="bg-gray-900/65 flex-grow p-4 sm:p-6 md:p-8 md:ml-72 transition-all duration-300 flex flex-col">
        {/* Botão de menu para mobile */}
        <div className="md:hidden flex justify-between items-center mb-6">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="text-gray-300 p-2"
          >
            <Menu size={28} />
          </button>
          <span className="text-xl font-bold text-white">Stylo</span>
        </div>

        {/* 4. Remover a função renderContent() e usar AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            // A 'key' é essencial para o AnimatePresence saber que o componente mudou
            key={activeView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            // Garante que o conteúdo animado preencha o espaço
            className="flex-grow flex flex-col"
          >
            {/* 5. Renderizar o componente ativo
              Tratamos casos especiais, como props, aqui.
            */}
            {activeView === "profile" ? (
              <ProfileManagement onBack={() => setActiveView("agenda")} />
            ) : (
              <ActiveComponent />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <AppointmentDetailsModal />
    </div>
  );
};

export default ServiceProviderDashboard;