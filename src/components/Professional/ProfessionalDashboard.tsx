// Em src/components/Professional/ProfessionalDashboard.tsx

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Menu } from "lucide-react";
import { useProfileStore } from "../../store/profileStore";
import type { ProfessionalProfile } from "../../types";

// Importações dos componentes
import { AgendaView } from "../ServiceProvider/Agenda/AgendaView";
import { AvailabilityManagement } from "../ServiceProvider/AvailabilityManagement";
import { ReviewsManagement } from "../ServiceProvider/ReviewsManagement";
import { Notifications } from "../Common/Notifications";
import { ProfessionalSideNav } from "./ProfessionalSideNav";
import { ProfessionalProfileManagement } from "./ProfessionalProfileManagement";
import { ProfessionalHome } from "./ProfessionalHome"; // <--- NOVO IMPORT

// 1. Adicionar "home" aos tipos
export type ProfessionalDashboardView =
  | "home" // <--- Adicionado
  | "agenda"
  | "availability"
  | "reviews"
  | "notifications"
  | "profile";

const viewComponents: Record<
  ProfessionalDashboardView,
  React.ComponentType<any>
> = {
  home: ProfessionalHome, // <--- Mapeado
  agenda: AgendaView,
  availability: AvailabilityManagement,
  reviews: ReviewsManagement,
  notifications: Notifications,
  profile: ProfessionalProfileManagement,
};

const ProfessionalDashboard = () => {
  const { userProfile } = useProfileStore();

  // Define "home" como padrão
  const [activeView, setActiveView] =
    useState<ProfessionalDashboardView>("home");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const profile = userProfile as ProfessionalProfile | null;

  const ActiveComponent = viewComponents[activeView];

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <Loader2 className="animate-spin text-amber-500" size={64} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-gray-200 font-sans">
      <ProfessionalSideNav
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
      />

      <main className="bg-gray-900/65 flex-grow p-4 sm:p-6 md:p-8 md:ml-72 transition-all duration-300 flex flex-col">
        {/* Mobile Header */}
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
            {/* Passamos o userProfile para TODOS os componentes filhos */}
            <ActiveComponent userProfile={profile} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ProfessionalDashboard;
