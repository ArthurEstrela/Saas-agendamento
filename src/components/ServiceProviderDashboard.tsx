// (Provavelmente em src/pages/DashboardPage.tsx ou src/components/ServiceProviderDashboard.tsx)

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Menu } from "lucide-react"; // 1. Importar Loader2

// 2. Importar o store para verificar o loading
import { useProfileStore } from "../store/profileStore";

import { ServiceProviderSideNav } from "./ServiceProvider/ServiceProviderSideNav";
import { AgendaView } from "./ServiceProvider/Agenda/AgendaView";
import { FinancialManagement } from "./ServiceProvider/FinancialManagement";
import { ProfessionalsManagement } from "./ServiceProvider/ProfessionalsManagement";
import { AvailabilityManagement } from "./ServiceProvider/AvailabilityManagement";
import { ProfileManagement } from "./ServiceProvider/ProfileManagement";
import { ServicesManagement } from "./ServiceProvider/ServicesManagement";
import { ReviewsManagement } from "./ServiceProvider/ReviewsManagement";
import { Notifications } from "./Common/Notifications";
// 3. Remover o import do Modal que não é mais usado aqui
// import { AppointmentDetailsModal } from "./ServiceProvider/Agenda/AppointmentDetailsModal";

export type ProviderDashboardView =
  | "agenda"
  | "profile"
  | "services"
  | "professionals"
  | "availability"
  | "financial"
  | "reviews"
  | "notifications";

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
  // 4. Pegar o perfil do store
  const { userProfile } = useProfileStore();

  const [activeView, setActiveView] = useState<ProviderDashboardView>("agenda");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const ActiveComponent = viewComponents[activeView];

  // 5. Adicionar a verificação de loading (crucial!)
  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader2 className="animate-spin text-amber-500" size={64} />
      </div>
    );
  }

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

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="flex-grow flex flex-col"
          >
            {activeView === "profile" ? (
              <ProfileManagement onBack={() => setActiveView("agenda")} />
            ) : (
              <ActiveComponent />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* 6. Remover o Modal solto. Ele agora vive 100% dentro da AgendaView. */}
      {/* <AppointmentDetailsModal /> */}
    </div>
  );
};

export default ServiceProviderDashboard;