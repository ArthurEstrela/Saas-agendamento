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
import { ProfessionalHome } from "./ProfessionalHome";

export type ProfessionalDashboardView =
  | "home"
  | "agenda"
  | "availability"
  | "reviews"
  | "notifications"
  | "profile";

// 1. ✅ DEFINIMOS A INTERFACE COMUM DAS PROPS
interface DashboardViewProps {
  userProfile: ProfessionalProfile;
}

// 2. ✅ USAMOS A INTERFACE NO LUGAR DE 'any'
const viewComponents: Record<
  ProfessionalDashboardView,
  React.ComponentType<DashboardViewProps> // Define que todos componentes aceitam essas props
> = {
  home: ProfessionalHome,
  agenda: AgendaView as React.ComponentType<DashboardViewProps>, // Cast se necessário (Agenda aceita UserProfile, que é compatível)
  availability: AvailabilityManagement as React.ComponentType<DashboardViewProps>,
  reviews: ReviewsManagement as React.ComponentType<DashboardViewProps>,
  notifications: Notifications as React.ComponentType<DashboardViewProps>,
  profile: ProfessionalProfileManagement,
};

const ProfessionalDashboard = () => {
  const { userProfile } = useProfileStore();

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
            {/* O TypeScript agora sabe que ActiveComponent espera userProfile */}
            <ActiveComponent userProfile={profile} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ProfessionalDashboard;