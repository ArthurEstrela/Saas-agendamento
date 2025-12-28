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
  availability: AvailabilityManagement as React.ComponentType<DashboardViewProps>,
  reviews: ReviewsManagement as React.ComponentType<DashboardViewProps>,
  notifications: Notifications as React.ComponentType<DashboardViewProps>,
  profile: ProfessionalProfileManagement,
};

const ProfessionalDashboard = () => {
  const { userProfile } = useProfileStore();
  const [activeView, setActiveView] = useState<ProfessionalDashboardView>("home");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const profile = userProfile as ProfessionalProfile | null;
  const ActiveComponent = viewComponents[activeView];

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="animate-spin text-primary" size={64} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 relative">
      {/* Background Sutil (Igual ao do Client) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[100px] opacity-30" />
      </div>

      <ProfessionalSideNav
        activeView={activeView}
        setActiveView={setActiveView}
        isOpen={isMobileNavOpen}
        setIsOpen={setIsMobileNavOpen}
      />

      {/* Main ajustado: md:ml-72 empurra o conteúdo logo após a sidebar */}
      <main className="flex-grow md:ml-72 transition-all duration-300 flex flex-col min-h-screen relative z-10">
        {/* Mobile Header */}
        <div className="md:hidden flex justify-between items-center p-4 bg-background/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30">
          <span className="text-xl font-bold text-white">Stylo</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileNavOpen(true)}
          >
            <Menu size={24} />
          </Button>
        </div>

        {/* Área de conteúdo com espaçamento reduzido */}
        <div className="p-4 lg:p-6 flex-grow flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex-grow flex flex-col w-full"
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