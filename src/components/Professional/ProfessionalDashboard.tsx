import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Menu } from "lucide-react";
import { useProfileStore } from "../../store/profileStore";
import type { ProfessionalProfile } from "../../types";

// Componentes
import { AgendaView } from "../ServiceProvider/Agenda/AgendaView";
import { AvailabilityManagement } from "../ServiceProvider/AvailabilityManagement";
import { ReviewsManagement } from "../ServiceProvider/ReviewsManagement";
import { Notifications } from "../Common/Notifications";
import { ProfessionalSideNav } from "./ProfessionalSideNav";
import { ProfessionalProfileManagement } from "./ProfessionalProfileManagement";
import { ProfessionalHome } from "./ProfessionalHome";

// UI
import { Button } from "../ui/button";

export type ProfessionalDashboardView =
  | "home"
  | "agenda"
  | "availability"
  | "reviews"
  | "notifications"
  | "profile";

interface DashboardViewProps {
  userProfile: ProfessionalProfile;
}

const viewComponents: Record<
  ProfessionalDashboardView,
  React.ComponentType<DashboardViewProps>
> = {
  home: ProfessionalHome,
  agenda: AgendaView as React.ComponentType<DashboardViewProps>,
  availability:
    AvailabilityManagement as React.ComponentType<DashboardViewProps>,
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
      <div className="flex items-center justify-center h-screen bg-black">
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-gray-200 font-sans selection:bg-primary/30">
      <ProfessionalSideNav
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
      />

      <main className="flex-grow md:ml-72 transition-all duration-300 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center p-4 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-30">
          <span className="text-xl font-bold text-white">Stylo</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(true)}
          >
            <Menu size={24} />
          </Button>
        </div>

        <div className="p-4 sm:p-6 md:p-8 flex-grow flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex-grow flex flex-col"
            >
              <ActiveComponent userProfile={profile} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalDashboard;
